import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Briefcase,
  Building2,
  Calendar,
  ChevronDown,
  Clock,
  DollarSign,
  Filter,
  MapPin,
  Search,
  User,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ClientHistoryProps {
  readonly userId: string
}

interface AppointmentWithRelations {
  id: string
  business_id: string
  location_id?: string
  service_id?: string
  user_id: string
  client_id: string
  title: string
  description?: string
  client_name: string
  client_email?: string
  client_phone?: string
  start_time: string
  end_time: string
  status:
    | 'scheduled'
    | 'confirmed'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
    | 'no_show'
    | 'rescheduled'
  notes?: string
  price?: number
  currency?: string
  created_at: string
  updated_at: string
  business?: {
    id: string
    name: string
  }
  location?: {
    id: string
    name: string
    address?: string
  }
  service?: {
    id: string
    name: string
    price?: number
    currency?: string
    duration_minutes?: number
    category_id?: string
    subcategory_id?: string
  }
  employee?: {
    id: string
    full_name: string
  }
}

interface Business {
  id: string
  name: string
}

interface Location {
  id: string
  name: string
  business_id: string
}

interface Service {
  id: string
  name: string
  business_id: string
}

interface Category {
  id: string
  name: string
  slug: string
}

interface Employee {
  id: string
  full_name: string
}

export const ClientHistory = React.memo(function ClientHistory({ userId }: ClientHistoryProps) {
  const { t } = useLanguage()
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Filter states - now arrays to support multiple selections
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [businessFilters, setBusinessFilters] = useState<string[]>([])
  const [locationFilters, setLocationFilters] = useState<string[]>([])
  const [serviceFilters, setServiceFilters] = useState<string[]>([])
  const [categoryFilters, setCategoryFilters] = useState<string[]>([])
  const [employeeFilters, setEmployeeFilters] = useState<string[]>([])
  const [priceRangeFilter, setPriceRangeFilter] = useState<string>('all')

  // Data for filters
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [businessSearch, setBusinessSearch] = useState('')
  const [businessPopoverOpen, setBusinessPopoverOpen] = useState(false)
  const [locationSearch, setLocationSearch] = useState('')
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false)
  const [serviceSearch, setServiceSearch] = useState('')
  const [servicePopoverOpen, setServicePopoverOpen] = useState(false)
  const [categorySearch, setCategorySearch] = useState('')
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false)
  const [employeeSearch, setEmployeeSearch] = useState('')
  const [employeePopoverOpen, setEmployeePopoverOpen] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Fetch all appointments
  useEffect(() => {
    fetchAppointments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      // Fetch appointments with related data
      const { data, error } = await supabase
        .from('appointments')
        .select(
          `
          id,
          start_time,
          end_time,
          status,
          notes,
          business_id,
          service_id,
          employee_id,
          location_id,
          created_at,
          updated_at,
          businesses!inner (
            id,
            name
          ),
          services!inner (
            id,
            name,
            price
          )
        `
        )
        .eq('client_id', userId)
        .order('start_time', { ascending: false })

      if (error) throw error
      setAppointments(data || [])
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  // Extract unique businesses from appointments
  useEffect(() => {
    const uniqueBusinesses = Array.from(
      new Map(
        appointments.filter(apt => apt.business).map(apt => [apt.business?.id, apt.business])
      ).values()
    ) as Business[]

    const sorted = [...uniqueBusinesses].sort((a, b) => a.name.localeCompare(b.name))
    setBusinesses(sorted)
  }, [appointments])

  // Extract unique locations from appointments
  useEffect(() => {
    const uniqueLocations = Array.from(
      new Map(
        appointments
          .filter(apt => apt.location)
          .map(apt => [
            apt.location?.id,
            {
              id: apt.location?.id || '',
              name: apt.location?.name || '',
              business_id: apt.business_id,
            },
          ])
      ).values()
    ) as Location[]

    const sorted = [...uniqueLocations].sort((a, b) => a.name.localeCompare(b.name))
    setLocations(sorted)
  }, [appointments])

  // Extract unique services from appointments
  useEffect(() => {
    const uniqueServices = Array.from(
      new Map(
        appointments
          .filter(apt => apt.service)
          .map(apt => [
            apt.service?.id,
            {
              id: apt.service?.id || '',
              name: apt.service?.name || '',
              business_id: apt.business_id,
            },
          ])
      ).values()
    ) as Service[]

    const sorted = [...uniqueServices].sort((a, b) => a.name.localeCompare(b.name))
    setServices(sorted)
  }, [appointments])

  // Extract unique categories from appointments
  useEffect(() => {
    const uniqueCategories = Array.from(
      new Map(
        appointments
          .filter(apt => apt.service?.category_id)
          .map(apt => [
            apt.service?.category_id,
            { id: apt.service?.category_id || '', name: apt.service?.name || '', slug: '' },
          ])
      ).values()
    ) as Category[]

    const sorted = [...uniqueCategories].sort((a, b) => a.name.localeCompare(b.name))
    setCategories(sorted)
  }, [appointments])

  // Extract unique employees from appointments
  useEffect(() => {
    const uniqueEmployees = Array.from(
      new Map(
        appointments.filter(apt => apt.employee).map(apt => [apt.employee?.id, apt.employee])
      ).values()
    ) as Employee[]

    const sorted = [...uniqueEmployees].sort((a, b) => a.full_name.localeCompare(b.full_name))
    setEmployees(sorted)
  }, [appointments])

  // Filtered appointments
  // Helper functions for filtering
  const matchesStatus = useCallback(
    (apt: AppointmentWithRelations): boolean => {
      if (statusFilters.length === 0) return true
      return statusFilters.some(filter => {
        if (filter === 'attended') return apt.status === 'completed'
        if (filter === 'cancelled') return apt.status === 'cancelled'
        if (filter === 'no_show') return apt.status === 'no_show'
        return false
      })
    },
    [statusFilters]
  )

  const matchesFilters = useCallback(
    (apt: AppointmentWithRelations): boolean => {
      if (businessFilters.length > 0 && !businessFilters.includes(apt.business_id)) return false
      if (locationFilters.length > 0 && !locationFilters.includes(apt.location_id ?? ''))
        return false
      if (serviceFilters.length > 0 && !serviceFilters.includes(apt.service_id ?? '')) return false
      if (categoryFilters.length > 0 && !categoryFilters.includes(apt.service?.category_id ?? ''))
        return false
      if (employeeFilters.length > 0 && !employeeFilters.includes(apt.employee?.id ?? ''))
        return false
      return true
    },
    [businessFilters, locationFilters, serviceFilters, categoryFilters, employeeFilters]
  )

  const matchesPriceRange = useCallback(
    (apt: AppointmentWithRelations): boolean => {
      if (priceRangeFilter === 'all') return true
      const price = apt.service?.price || apt.price || 0
      if (priceRangeFilter === '0-500' && price > 500) return false
      if (priceRangeFilter === '501-1000' && (price <= 500 || price > 1000)) return false
      if (priceRangeFilter === '1001-2000' && (price <= 1000 || price > 2000)) return false
      if (priceRangeFilter === '2001+' && price <= 2000) return false
      return true
    },
    [priceRangeFilter]
  )

  const matchesSearch = useCallback(
    (apt: AppointmentWithRelations): boolean => {
      if (!searchTerm) return true
      const search = searchTerm.toLowerCase()
      return (
        apt.business?.name?.toLowerCase().includes(search) ||
        apt.service?.name?.toLowerCase().includes(search) ||
        apt.employee?.full_name?.toLowerCase().includes(search) ||
        apt.location?.name?.toLowerCase().includes(search) ||
        false
      )
    },
    [searchTerm]
  )

  // Filtering logic
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      return (
        matchesStatus(apt) && matchesFilters(apt) && matchesPriceRange(apt) && matchesSearch(apt)
      )
    })
  }, [appointments, matchesStatus, matchesFilters, matchesPriceRange, matchesSearch])

  // Statistics
  const stats = useMemo(() => {
    return {
      total: filteredAppointments.length,
      attended: filteredAppointments.filter(a => a.status === 'completed').length,
      cancelled: filteredAppointments.filter(a => a.status === 'cancelled').length,
      noShow: filteredAppointments.filter(a => a.status === 'no_show').length,
      totalSpent: filteredAppointments
        .filter(a => a.status === 'completed')
        .reduce((sum, a) => sum + (a.service?.price || a.price || 0), 0),
    }
  }, [filteredAppointments])

  // Filtered businesses by search
  const filteredBusinesses = useMemo(() => {
    if (!businessSearch.trim()) return businesses
    const search = businessSearch.toLowerCase()
    return businesses.filter(b => b.name.toLowerCase().includes(search))
  }, [businesses, businessSearch])

  // Filtered locations - only show locations from selected businesses or all if no business selected
  const filteredLocations = useMemo(() => {
    let available = locations
    // Filter by selected businesses
    if (businessFilters.length > 0) {
      available = locations.filter(loc => businessFilters.includes(loc.business_id))
    }
    // Apply search
    if (!locationSearch.trim()) return available
    const search = locationSearch.toLowerCase()
    return available.filter(loc => loc.name.toLowerCase().includes(search))
  }, [locations, locationSearch, businessFilters])

  // Filtered services - only show services from selected businesses or all if no business selected
  const filteredServices = useMemo(() => {
    let available = services
    // Filter by selected businesses
    if (businessFilters.length > 0) {
      available = services.filter(svc => businessFilters.includes(svc.business_id))
    }
    // Apply search
    if (!serviceSearch.trim()) return available
    const search = serviceSearch.toLowerCase()
    return available.filter(svc => svc.name.toLowerCase().includes(search))
  }, [services, serviceSearch, businessFilters])

  // Filtered categories by search
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories
    const search = categorySearch.toLowerCase()
    return categories.filter(cat => cat.name.toLowerCase().includes(search))
  }, [categories, categorySearch])

  // Filtered employees by search
  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return employees
    const search = employeeSearch.toLowerCase()
    return employees.filter(emp => emp.full_name.toLowerCase().includes(search))
  }, [employees, employeeSearch])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: {
        label: t('clientHistory.status.completed'),
        variant: 'default' as const,
        className: 'bg-green-500 hover:bg-green-600',
      },
      cancelled: { label: t('clientHistory.status.cancelled'), variant: 'destructive' as const, className: '' },
      no_show: {
        label: t('clientHistory.status.no_show'),
        variant: 'secondary' as const,
        className: 'bg-yellow-500 hover:bg-yellow-600',
      },
      confirmed: { label: t('clientHistory.status.confirmed'), variant: 'default' as const, className: '' },
      pending: { label: t('clientHistory.status.pending'), variant: 'secondary' as const, className: '' },
      scheduled: { label: t('clientHistory.status.scheduled'), variant: 'default' as const, className: '' },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const clearFilters = () => {
    setStatusFilters([])
    setBusinessFilters([])
    setLocationFilters([])
    setServiceFilters([])
    setCategoryFilters([])
    setEmployeeFilters([])
    setPriceRangeFilter('all')
    setSearchTerm('')
    setCurrentPage(1)
  }

  const hasActiveFilters =
    statusFilters.length > 0 ||
    businessFilters.length > 0 ||
    locationFilters.length > 0 ||
    serviceFilters.length > 0 ||
    categoryFilters.length > 0 ||
    employeeFilters.length > 0 ||
    priceRangeFilter !== 'all' ||
    searchTerm !== ''

  // Pagination logic
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedAppointments = filteredAppointments.slice(startIndex, startIndex + itemsPerPage)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [
    statusFilters,
    businessFilters,
    locationFilters,
    serviceFilters,
    categoryFilters,
    employeeFilters,
    priceRangeFilter,
    searchTerm,
  ])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{t('clientHistory.stats.total')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('clientHistory.stats.attended')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.attended}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('clientHistory.stats.cancelled')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('clientHistory.stats.noShow')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.noShow}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('clientHistory.stats.totalPaid')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              $
              {stats.totalSpent.toLocaleString('es-CO', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}{' '}
              {t('common.time.currency')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" aria-hidden="true" />
              {t('clientHistory.filters.title')}
            </CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="hover:bg-destructive/10 hover:text-destructive min-h-[44px] min-w-[44px]"
                aria-label={t('common.actions.reset')}
                title={t('common.actions.reset')}
              >
                <X className="h-4 w-4 mr-2" aria-hidden="true" />
                {t('common.actions.reset')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder={t('clientHistory.placeholders.search')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
              aria-label={t('clientHistory.placeholders.search')}
              title={t('clientHistory.placeholders.search')}
            />
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {statusFilters.length === 0 ? t('clientHistory.filters.status') : `${statusFilters.length} ${t('clientHistory.filters.status')}`}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0">
                <div className="p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="status-all"
                      checked={statusFilters.length === 0}
                      onCheckedChange={() => setStatusFilters([])}
                    />
                      <label htmlFor="status-all" className="text-sm cursor-pointer">
                        {t('common.placeholders.allStatuses')}
                      </label>
                  </div>
                  <div className="border-t pt-3 space-y-2">
                    {['attended', 'cancelled', 'no_show'].map(status => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={statusFilters.includes(status)}
                          onCheckedChange={checked => {
                            if (checked) {
                              setStatusFilters([...statusFilters, status])
                            } else {
                              setStatusFilters(statusFilters.filter(s => s !== status))
                            }
                          }}
                        />
                        <label htmlFor={`status-${status}`} className="text-sm cursor-pointer">
                          {status === 'attended' && t('clientHistory.status.completed')}
                          {status === 'cancelled' && t('clientHistory.status.cancelled')}
                          {status === 'no_show' && t('clientHistory.status.no_show')}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Business */}
            <Popover open={businessPopoverOpen} onOpenChange={setBusinessPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
            {businessFilters.length === 0
              ? t('clientHistory.filters.business')
              : `${businessFilters.length} ${t('clientHistory.filters.business')}`}
                  <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2">
                <div className="p-2 pb-0">
                  <Input
                    placeholder={t('clientHistory.placeholders.businessSearch')}
                    value={businessSearch}
                    onChange={e => setBusinessSearch(e.target.value)}
                    className="mb-2"
                    autoFocus
                    aria-label={t('clientHistory.placeholders.businessSearch')}
                    title={t('clientHistory.placeholders.businessSearch')}
                  />
                </div>
                <div className="max-h-60 overflow-y-auto p-2">
                  <div className="flex items-center space-x-2 mb-3">
                    <Checkbox
                      id="business-all"
                      checked={businessFilters.length === 0}
                      onCheckedChange={() => {
                        setBusinessFilters([])
                        setBusinessSearch('')
                      }}
                    />
                    <label htmlFor="business-all" className="text-sm cursor-pointer">
                      {t('clientHistory.filters.allBusinesses')}
                    </label>
                  </div>
                  <div className="border-t pt-2 space-y-2">
                    {filteredBusinesses.map(business => (
                      <div key={business.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`business-${business.id}`}
                          checked={businessFilters.includes(business.id)}
                          onCheckedChange={checked => {
                            if (checked) {
                              setBusinessFilters([...businessFilters, business.id])
                            } else {
                              setBusinessFilters(businessFilters.filter(id => id !== business.id))
                            }
                          }}
                        />
                        <label
                          htmlFor={`business-${business.id}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {business.name}
                        </label>
                      </div>
                    ))}
                    {filteredBusinesses.length === 0 && businessSearch && (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        {t('clientHistory.messages.noBusinesses')}
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Location */}
            <Popover open={locationPopoverOpen} onOpenChange={setLocationPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {locationFilters.length === 0 ? t('clientHistory.filters.location') : `${locationFilters.length} ${t('clientHistory.filters.location')}`}
                  <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2">
                <div className="p-2 pb-0">
                  <Input
                    placeholder={t('clientHistory.placeholders.locationSearch')}
                    value={locationSearch}
                    onChange={e => setLocationSearch(e.target.value)}
                    className="mb-2"
                    autoFocus
                    aria-label={t('clientHistory.placeholders.locationSearch')}
                    title={t('clientHistory.placeholders.locationSearch')}
                  />
                </div>
                <div className="max-h-60 overflow-y-auto p-2">
                  <div className="flex items-center space-x-2 mb-3">
                    <Checkbox
                      id="location-all"
                      checked={locationFilters.length === 0}
                      onCheckedChange={() => {
                        setLocationFilters([])
                        setLocationSearch('')
                      }}
                    />
                    <label htmlFor="location-all" className="text-sm cursor-pointer">
                      {t('clientHistory.filters.allLocations')}
                    </label>
                  </div>
                  <div className="border-t pt-2 space-y-2">
                    {filteredLocations.map(location => (
                      <div key={location.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`location-${location.id}`}
                          checked={locationFilters.includes(location.id)}
                          onCheckedChange={checked => {
                            if (checked) {
                              setLocationFilters([...locationFilters, location.id])
                            } else {
                              setLocationFilters(locationFilters.filter(id => id !== location.id))
                            }
                          }}
                        />
                        <label
                          htmlFor={`location-${location.id}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {location.name}
                        </label>
                      </div>
                    ))}
                    {filteredLocations.length === 0 && locationSearch && (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        {t('clientHistory.messages.noLocations')}
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Service */}
            <Popover open={servicePopoverOpen} onOpenChange={setServicePopoverOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between min-h-[44px]"
                  aria-label={t('clientHistory.filters.service')}
                  title={t('clientHistory.filters.service')}
                >
                  {serviceFilters.length === 0
                    ? t('clientHistory.filters.service')
                    : `${serviceFilters.length} ${t('clientHistory.filters.service')}`}
                  <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="p-2 pb-0">
                  <Input
                    placeholder={t('clientHistory.placeholders.serviceSearch')}
                    value={serviceSearch}
                    onChange={e => setServiceSearch(e.target.value)}
                    className="mb-2 text-base"
                    autoFocus
                    aria-label={t('clientHistory.placeholders.serviceSearch')}
                    title={t('clientHistory.placeholders.serviceSearch')}
                  />
                </div>
                <div className="max-h-60 overflow-y-auto p-2">
                  <div className="flex items-center space-x-2 mb-3">
                    <Checkbox
                      id="service-all"
                      checked={serviceFilters.length === 0}
                      onCheckedChange={checked => {
                        if (checked) {
                          setServiceFilters([])
                        }
                      }}
                    />
                    <label htmlFor="service-all" className="text-sm cursor-pointer font-medium">
                      {t('common.all')}
                    </label>
                  </div>
                  <div className="border-t pt-2 space-y-2">
                    {filteredServices.map(service => (
                      <div key={service.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`service-${service.id}`}
                          checked={serviceFilters.includes(service.id)}
                          onCheckedChange={checked => {
                            if (checked) {
                              setServiceFilters([...serviceFilters, service.id])
                            } else {
                              setServiceFilters(serviceFilters.filter(id => id !== service.id))
                            }
                          }}
                        />
                        <label
                          htmlFor={`service-${service.id}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {service.name}
                        </label>
                      </div>
                    ))}
                    {filteredServices.length === 0 && serviceSearch && (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        {t('clientHistory.messages.noServices')}
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Category */}
            <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between min-h-[44px]"
                  aria-label={t('clientHistory.filters.category')}
                  title={t('clientHistory.filters.category')}
                >
                  {categoryFilters.length === 0
                    ? t('clientHistory.filters.category')
                    : `${categoryFilters.length} ${t('clientHistory.filters.category')}`}
                  <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="p-2 pb-0">
                  <Input
                    placeholder={t('clientHistory.placeholders.categorySearch')}
                    value={categorySearch}
                    onChange={e => setCategorySearch(e.target.value)}
                    className="mb-2 text-base"
                    autoFocus
                    aria-label={t('clientHistory.placeholders.categorySearch')}
                    title={t('clientHistory.placeholders.categorySearch')}
                  />
                </div>
                <div className="max-h-60 overflow-y-auto p-2">
                  <div className="flex items-center space-x-2 mb-3">
                    <Checkbox
                      id="category-all"
                      checked={categoryFilters.length === 0}
                      onCheckedChange={checked => {
                        if (checked) {
                          setCategoryFilters([])
                        }
                      }}
                    />
                    <label htmlFor="category-all" className="text-sm cursor-pointer font-medium">
                      {t('common.all')}
                    </label>
                  </div>
                  <div className="border-t pt-2 space-y-2">
                    {filteredCategories.map(category => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={categoryFilters.includes(category.id)}
                          onCheckedChange={checked => {
                            if (checked) {
                              setCategoryFilters([...categoryFilters, category.id])
                            } else {
                              setCategoryFilters(categoryFilters.filter(id => id !== category.id))
                            }
                          }}
                        />
                        <label
                          htmlFor={`category-${category.id}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {category.name}
                        </label>
                      </div>
                    ))}
                    {filteredCategories.length === 0 && categorySearch && (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        {t('clientHistory.messages.noCategories')}
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Employee */}
            <Popover open={employeePopoverOpen} onOpenChange={setEmployeePopoverOpen}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-between min-h-[44px]"
                  aria-label={t('clientHistory.filters.employee')}
                  title={t('clientHistory.filters.employee')}
                >
                  {employeeFilters.length === 0
                    ? t('clientHistory.filters.employee')
                    : `${employeeFilters.length} ${t('clientHistory.filters.employee')}`}
                  <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="p-2 pb-0">
                  <Input
                    placeholder={t('clientHistory.placeholders.employeeSearch')}
                    value={employeeSearch}
                    onChange={e => setEmployeeSearch(e.target.value)}
                    className="mb-2 text-base"
                    autoFocus
                    aria-label={t('clientHistory.placeholders.employeeSearch')}
                    title={t('clientHistory.placeholders.employeeSearch')}
                  />
                </div>
                <div className="max-h-60 overflow-y-auto p-2">
                  <div className="flex items-center space-x-2 mb-3">
                    <Checkbox
                      id="employee-all"
                      checked={employeeFilters.length === 0}
                      onCheckedChange={checked => {
                        if (checked) {
                          setEmployeeFilters([])
                        }
                      }}
                    />
                    <label htmlFor="employee-all" className="text-sm cursor-pointer font-medium">
                      {t('common.all')}
                    </label>
                  </div>
                  <div className="border-t pt-2 space-y-2">
                    {filteredEmployees.map(employee => (
                      <div key={employee.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`employee-${employee.id}`}
                          checked={employeeFilters.includes(employee.id)}
                          onCheckedChange={checked => {
                            if (checked) {
                              setEmployeeFilters([...employeeFilters, employee.id])
                            } else {
                              setEmployeeFilters(employeeFilters.filter(id => id !== employee.id))
                            }
                          }}
                        />
                        <label
                          htmlFor={`employee-${employee.id}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {employee.full_name}
                        </label>
                      </div>
                    ))}
                    {filteredEmployees.length === 0 && employeeSearch && (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        {t('clientHistory.messages.noEmployees')}
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Price Range */}
            <Select value={priceRangeFilter} onValueChange={setPriceRangeFilter}>
              <SelectTrigger 
                className="min-h-[44px]" 
                aria-label={t('common.placeholders.priceRange')} 
                title={t('common.placeholders.priceRange')}
              >
                <SelectValue placeholder={t('common.placeholders.priceRange')} />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">{t('clientHistory.priceRanges.all')}</SelectItem>
                  <SelectItem value="0-500">{t('clientHistory.priceRanges.0-500')}</SelectItem>
                  <SelectItem value="501-1000">{t('clientHistory.priceRanges.501-1000')}</SelectItem>
                  <SelectItem value="1001-2000">{t('clientHistory.priceRanges.1001-2000')}</SelectItem>
                  <SelectItem value="2001+">{t('clientHistory.priceRanges.2001plus')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
          {t('clientHistory.results.showing', {
            visible: paginatedAppointments.length,
            total: filteredAppointments.length,
            totalAll: appointments.length,
          })}
        </p>
      </div>

      {/* Appointments List */}
      {paginatedAppointments.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto" aria-hidden="true" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                {t('clientHistory.messages.noAppointments')}
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base">
                {t('clientHistory.messages.noAppointmentsDescription')}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Appointments Grid */}
          <div className="space-y-4">
            {paginatedAppointments.map(appointment => (
              <Card 
                key={appointment.id} 
                className="hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
                tabIndex={0}
                role="article"
                aria-label={`${t('clientHistory.appointment.ariaLabel')} ${appointment.service?.name || appointment.title}`}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Left Section - Main Info */}
                    <div className="flex-1 space-y-3">
                      {/* Status Badge */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={getStatusVariant(appointment.status)}
                          className="text-xs sm:text-sm px-2 py-1"
                        >
                          {getStatusLabel(appointment.status)}
                        </Badge>
                        {appointment.business?.name && (
                          <div className="flex items-center gap-2 text-sm font-medium text-primary">
                            <Building2 className="h-4 w-4" aria-hidden="true" />
                            <span className="truncate">{appointment.business.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Service */}
                      {appointment.service?.name && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                          <span className="font-semibold text-foreground text-lg truncate">
                            {appointment.service.name}
                          </span>
                        </div>
                      )}

                      {/* Date and Time */}
                      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                          <span>
                            {format(new Date(appointment.start_time), "d 'de' MMMM, yyyy", {
                              locale: es,
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                          <span>
                            {format(new Date(appointment.start_time), 'HH:mm', { locale: es })} -{' '}
                            {format(new Date(appointment.end_time), 'HH:mm', { locale: es })}
                          </span>
                        </div>
                      </div>

                      {/* Location */}
                      {appointment.location?.name && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                          <span className="truncate">{appointment.location.name}</span>
                        </div>
                      )}

                      {/* Employee */}
                      {appointment.employee?.full_name && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                          <span className="truncate">{appointment.employee.full_name}</span>
                        </div>
                      )}
                    </div>

                    {/* Right Section - Price */}
                    {(appointment.service?.price || appointment.price) && (
                      <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2 lg:text-right">
                        <div className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-foreground">
                          <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
                          <span>
                            {(appointment.service?.price || appointment.price || 0).toLocaleString(
                              'es-MX'
                            )}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {appointment.service?.currency || appointment.currency || 'MXN'}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card border border-border rounded-lg"
              role="navigation"
              aria-label={t('clientHistory.pagination.ariaLabel')}
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="min-h-[44px] w-full sm:w-auto"
                aria-label={t('common.actions.previous')}
                title={t('common.actions.previous')}
              >
                {t('common.actions.previous')}
              </Button>

              <div className="flex items-center gap-2 flex-wrap justify-center">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="min-h-[44px] min-w-[44px]"
                      aria-label={t('clientHistory.pagination.goToPage', { page })}
                      title={t('clientHistory.pagination.goToPage', { page })}
                      aria-current={currentPage === page ? 'page' : undefined}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="min-h-[44px] w-full sm:w-auto"
                aria-label={t('common.actions.next')}
                title={t('common.actions.next')}
              >
                {t('common.actions.next')}
              </Button>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground">
            {t('clientHistory.pagination.pageInfo', { current: currentPage, total: totalPages })}
          </div>
        </>
      )}
    </div>
  )
})

