import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Calendar, Clock, MapPin, User, DollarSign, Filter, X, Search, Building2, Briefcase, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { useLanguage } from '@/contexts/LanguageContext'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ClientHistoryProps {
  readonly userId: string
  readonly appointments: AppointmentWithRelations[]
  readonly loading: boolean
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
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
  price?: number
  currency?: string
  created_at: string
  updated_at: string
  business?: {
    id: string
    name: string
    category_id?: string
    category?: {
      id: string
      name: string
      slug: string
      icon_name?: string
    }
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
    category?: string  // DEPRECATED: No longer used, use business.category instead
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

export function ClientHistory({ userId, appointments, loading }: ClientHistoryProps) {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [filtersCollapsed, setFiltersCollapsed] = useState(false)
  
  // Filter states - now arrays to support multiple selections
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [businessFilters, setBusinessFilters] = useState<string[]>([])
  const [locationFilters, setLocationFilters] = useState<string[]>([])
  const [serviceFilters, setServiceFilters] = useState<string[]>([])
  const [categoryFilters, setCategoryFilters] = useState<string[]>([])
  const [employeeFilters, setEmployeeFilters] = useState<string[]>([])
  const [minPrice, setMinPrice] = useState<number | null>(null)
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  
  // Search states for filter popovers
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

  // Appointments received via props from parent dashboard

  // ✅ OPTIMIZACIÓN: Consolidar 5 useEffect → 1 useMemo para extraer todas las entidades únicas
  const filterEntities = useMemo(() => {
    const businessesMap = new Map<string, Business>()
    const locationsMap = new Map<string, Location>()
    const servicesMap = new Map<string, Service>()
    const categoriesMap = new Map<string, Category>()
    const employeesMap = new Map<string, Employee>()

    for (const apt of appointments) {
      // Extract businesses
      if (apt.business) {
        businessesMap.set(apt.business.id, apt.business)
      }

      // Extract locations
      if (apt.location) {
        locationsMap.set(apt.location.id, {
          id: apt.location.id,
          name: apt.location.name,
          business_id: apt.business_id
        })
      }

      // Extract services
      if (apt.service) {
        servicesMap.set(apt.service.id, {
          id: apt.service.id,
          name: apt.service.name,
          business_id: apt.business_id
        })
      }

      // Extract categories from business (not service)
      if (apt.business?.category?.id && apt.business?.category?.name) {
        categoriesMap.set(apt.business.category.id, {
          id: apt.business.category.id,
          name: apt.business.category.name,
          slug: apt.business.category.slug || ''
        })
      }

      // Extract employees (skip if id is null - employee not found in business_employees)
      if (apt.employee?.id) {
        employeesMap.set(apt.employee.id, apt.employee)
      }
    }

    // Sort all entities alphabetically with null safety
    return {
      businesses: Array.from(businessesMap.values()).sort((a, b) => {
        const nameA = a.name || ''
        const nameB = b.name || ''
        return nameA.localeCompare(nameB)
      }),
      locations: Array.from(locationsMap.values()).sort((a, b) => {
        const nameA = a.name || ''
        const nameB = b.name || ''
        return nameA.localeCompare(nameB)
      }),
      services: Array.from(servicesMap.values()).sort((a, b) => {
        const nameA = a.name || ''
        const nameB = b.name || ''
        return nameA.localeCompare(nameB)
      }),
      categories: Array.from(categoriesMap.values()).sort((a, b) => {
        const nameA = a.name || ''
        const nameB = b.name || ''
        return nameA.localeCompare(nameB)
      }),
      employees: Array.from(employeesMap.values()).sort((a, b) => {
        const nameA = a.full_name || ''
        const nameB = b.full_name || ''
        return nameA.localeCompare(nameB)
      })
    }
  }, [appointments])

  // Destructure memoized entities
  const { businesses, locations, services, categories, employees } = filterEntities

  // Filtered appointments
  // Helper functions for filtering
  const matchesStatus = useCallback((apt: AppointmentWithRelations): boolean => {
    if (statusFilters.length === 0) return true
    return statusFilters.some(filter => {
      if (filter === 'attended') return apt.status === 'completed'
      if (filter === 'cancelled') return apt.status === 'cancelled'
      if (filter === 'no_show') return apt.status === 'no_show'
      return false
    })
  }, [statusFilters])

  const matchesFilters = useCallback((apt: AppointmentWithRelations): boolean => {
    if (businessFilters.length > 0 && !businessFilters.includes(apt.business_id)) return false
    if (locationFilters.length > 0 && !locationFilters.includes(apt.location_id ?? '')) return false
    if (serviceFilters.length > 0 && !serviceFilters.includes(apt.service_id ?? '')) return false
    if (categoryFilters.length > 0 && !categoryFilters.includes(apt.business?.category?.id ?? '')) return false
    if (employeeFilters.length > 0 && !employeeFilters.includes(apt.employee?.id ?? '')) return false
    return true
  }, [businessFilters, locationFilters, serviceFilters, categoryFilters, employeeFilters])

  const matchesPriceRange = useCallback((apt: AppointmentWithRelations): boolean => {
    const price = apt.service?.price || apt.price || 0
    if (minPrice !== null && price < minPrice) return false
    if (maxPrice !== null && price > maxPrice) return false
    return true
  }, [minPrice, maxPrice])

  const matchesSearch = useCallback((apt: AppointmentWithRelations): boolean => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      apt.business?.name?.toLowerCase().includes(search) ||
      apt.service?.name?.toLowerCase().includes(search) ||
      apt.employee?.full_name?.toLowerCase().includes(search) ||
      apt.location?.name?.toLowerCase().includes(search) ||
      false
    )
  }, [searchTerm])

  // Filtering logic
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      return (
        matchesStatus(apt) &&
        matchesFilters(apt) &&
        matchesPriceRange(apt) &&
        matchesSearch(apt)
      )
    })
  }, [
    appointments,
    matchesStatus,
    matchesFilters,
    matchesPriceRange,
    matchesSearch
  ])

  // Statistics
  const stats = useMemo(() => {
    return {
      total: filteredAppointments.length,
      attended: filteredAppointments.filter(a => a.status === 'completed').length,
      cancelled: filteredAppointments.filter(a => a.status === 'cancelled').length,
      noShow: filteredAppointments.filter(a => a.status === 'no_show').length,
      totalSpent: filteredAppointments
        .filter(a => a.status === 'completed')
        .reduce((sum, a) => sum + (a.service?.price || a.price || 0), 0)
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

  const getStatusBadgeForAppointment = (appointment: AppointmentWithRelations) => {
    const rawStatus = appointment.status as unknown as string
    const now = new Date()
    const end = new Date(appointment.end_time)

    const isOverduePending = rawStatus === 'pending' && end < now

    const statusConfig = {
      completed: { label: 'Asistida', variant: 'default' as const, className: 'bg-green-500 hover:bg-green-600' },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const, className: '' },
      no_show: { label: 'Perdida', variant: 'secondary' as const, className: 'bg-yellow-500 hover:bg-yellow-600' },
      confirmed: { label: 'Confirmada', variant: 'default' as const, className: '' },
      pending: { label: 'Pendiente', variant: 'secondary' as const, className: '' },
      scheduled: { label: 'Agendada', variant: 'default' as const, className: '' },
      overdue: { label: 'Vencida', variant: 'secondary' as const, className: 'bg-orange-500 hover:bg-orange-600' }
    }

    let key: keyof typeof statusConfig
    if (isOverduePending) {
      key = 'overdue'
    } else if (rawStatus in statusConfig) {
      key = rawStatus as keyof typeof statusConfig
    } else {
      key = 'pending'
    }

    const config = statusConfig[key]
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    )
  }

  // ✅ OPTIMIZACIÓN: useCallback para prevenir recreaciones de funciones en cada render
  const clearFilters = useCallback(() => {
    setStatusFilters([])
    setBusinessFilters([])
    setLocationFilters([])
    setServiceFilters([])
    setCategoryFilters([])
    setEmployeeFilters([])
    setMinPrice(null)
    setMaxPrice(null)
    setSearchTerm('')
    setCurrentPage(1)
  }, [])

  // Reusable toggle filter helpers con useCallback
  const toggleBusinessFilter = useCallback((businessId: string) => {
    setBusinessFilters(prev => 
      prev.includes(businessId) ? prev.filter(id => id !== businessId) : [...prev, businessId]
    )
  }, [])

  const toggleLocationFilter = useCallback((locationId: string) => {
    setLocationFilters(prev => 
      prev.includes(locationId) ? prev.filter(id => id !== locationId) : [...prev, locationId]
    )
  }, [])

  const toggleServiceFilter = useCallback((serviceId: string) => {
    setServiceFilters(prev => 
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    )
  }, [])

  const toggleCategoryFilter = useCallback((categoryId: string) => {
    setCategoryFilters(prev => 
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    )
  }, [])

  const toggleEmployeeFilter = useCallback((employeeId: string) => {
    setEmployeeFilters(prev => 
      prev.includes(employeeId) ? prev.filter(id => id !== employeeId) : [...prev, employeeId]
    )
  }, [])

  const hasActiveFilters = 
    statusFilters.length > 0 ||
    businessFilters.length > 0 ||
    locationFilters.length > 0 ||
    serviceFilters.length > 0 ||
    categoryFilters.length > 0 ||
    employeeFilters.length > 0 ||
    minPrice !== null ||
    maxPrice !== null ||
    searchTerm !== ''

  // Pagination logic
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedAppointments = filteredAppointments.slice(startIndex, startIndex + itemsPerPage)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilters, businessFilters, locationFilters, serviceFilters, categoryFilters, employeeFilters, minPrice, maxPrice, searchTerm])

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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Asistidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.attended}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Canceladas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Perdidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.noShow}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pagado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${stats.totalSpent.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} COP
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setFiltersCollapsed(!filtersCollapsed)}
              className="flex items-center gap-2 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <Filter className="h-5 w-5" />
              <CardTitle>Filtros</CardTitle>
              <ChevronDown className={`h-5 w-5 transition-transform ${filtersCollapsed ? '' : 'rotate-180'}`} />
            </button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4 mr-2" />
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardHeader>
        {!filtersCollapsed && (
          <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por negocio, servicio, empleado o sede..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                >
                  {statusFilters.length === 0 ? 'Estado' : `${statusFilters.length} estado(s)`}
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
                    <label htmlFor="status-all" className="text-sm cursor-pointer">Todos los estados</label>
                  </div>
                  <div className="border-t pt-3 space-y-2">
                    {['attended', 'cancelled', 'no_show'].map(status => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`status-${status}`}
                          checked={statusFilters.includes(status)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setStatusFilters([...statusFilters, status])
                            } else {
                              setStatusFilters(statusFilters.filter(s => s !== status))
                            }
                          }}
                        />
                        <label 
                          htmlFor={`status-${status}`} 
                          className="text-sm cursor-pointer"
                        >
                          {status === 'attended' && 'Asistidas'}
                          {status === 'cancelled' && 'Canceladas'}
                          {status === 'no_show' && 'Perdidas'}
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
                <Button
                  variant="outline"
                  className="w-full justify-between"
                >
                  {businessFilters.length === 0 ? 'Negocio' : `${businessFilters.length} negocio(s)`}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2">
                <div className="p-2 pb-0">
                  <Input
                    placeholder="Buscar negocio..."
                    value={businessSearch}
                    onChange={(e) => setBusinessSearch(e.target.value)}
                    className="mb-2"
                    autoFocus
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
                    <label htmlFor="business-all" className="text-sm cursor-pointer">Todos los negocios</label>
                  </div>
                  <div className="border-t pt-2 space-y-2">
                    {filteredBusinesses.map(business => (
                      <div key={business.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`business-${business.id}`}
                          checked={businessFilters.includes(business.id)}
                          onCheckedChange={() => toggleBusinessFilter(business.id)}
                        />
                        <label htmlFor={`business-${business.id}`} className="text-sm cursor-pointer flex-1">
                          {business.name}
                        </label>
                      </div>
                    ))}
                    {filteredBusinesses.length === 0 && businessSearch && (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        No se encontraron negocios
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Location */}
            <Popover open={locationPopoverOpen} onOpenChange={setLocationPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between"
                >
                  {locationFilters.length === 0 ? 'Sede' : `${locationFilters.length} sede(s)`}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2">
                <div className="p-2 pb-0">
                  <Input
                    placeholder="Buscar sede..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    className="mb-2"
                    autoFocus
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
                    <label htmlFor="location-all" className="text-sm cursor-pointer">Todas las sedes</label>
                  </div>
                  <div className="border-t pt-2 space-y-2">
                    {filteredLocations.map(location => (
                      <div key={location.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`location-${location.id}`}
                          checked={locationFilters.includes(location.id)}
                          onCheckedChange={() => toggleLocationFilter(location.id)}
                        />
                        <label htmlFor={`location-${location.id}`} className="text-sm cursor-pointer flex-1">
                          {location.name}
                        </label>
                      </div>
                    ))}
                    {filteredLocations.length === 0 && locationSearch && (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        No se encontraron sedes
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
                  className="w-full justify-between"
                >
                  {serviceFilters.length === 0 ? 'Servicio' : `${serviceFilters.length} servicio(s)`}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2">
                <div className="p-2 pb-0">
                  <Input
                    placeholder="Buscar servicio..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="mb-2"
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto p-2">
                  <div className="flex items-center space-x-2 mb-3">
                    <Checkbox 
                      id="service-all"
                      checked={serviceFilters.length === 0}
                      onCheckedChange={() => {
                        setServiceFilters([])
                        setServiceSearch('')
                      }}
                    />
                    <label htmlFor="service-all" className="text-sm cursor-pointer">Todos los servicios</label>
                  </div>
                  <div className="border-t pt-2 space-y-2">
                    {filteredServices.map(service => (
                      <div key={service.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`service-${service.id}`}
                          checked={serviceFilters.includes(service.id)}
                          onCheckedChange={() => toggleServiceFilter(service.id)}
                        />
                        <label htmlFor={`service-${service.id}`} className="text-sm cursor-pointer flex-1">
                          {service.name}
                        </label>
                      </div>
                    ))}
                    {filteredServices.length === 0 && serviceSearch && (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        No se encontraron servicios
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
                  className="w-full justify-between"
                >
                  {categoryFilters.length === 0 ? 'Categoría' : `${categoryFilters.length} categoría(s)`}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2">
                <div className="p-2 pb-0">
                  <Input
                    placeholder="Buscar categoría..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="mb-2"
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto p-2">
                  <div className="flex items-center space-x-2 mb-3">
                    <Checkbox 
                      id="category-all"
                      checked={categoryFilters.length === 0}
                      onCheckedChange={() => {
                        setCategoryFilters([])
                        setCategorySearch('')
                      }}
                    />
                    <label htmlFor="category-all" className="text-sm cursor-pointer">Todas las categorías</label>
                  </div>
                  <div className="border-t pt-2 space-y-2">
                    {filteredCategories.map(category => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`category-${category.id}`}
                          checked={categoryFilters.includes(category.id)}
                          onCheckedChange={() => toggleCategoryFilter(category.id)}
                        />
                        <label htmlFor={`category-${category.id}`} className="text-sm cursor-pointer flex-1">
                          {category.name}
                        </label>
                      </div>
                    ))}
                    {filteredCategories.length === 0 && categorySearch && (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        No se encontraron categorías
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
                  className="w-full justify-between"
                >
                  {employeeFilters.length === 0 ? 'Profesional' : `${employeeFilters.length} profesional(es)`}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2">
                <div className="p-2 pb-0">
                  <Input
                    placeholder="Buscar profesional..."
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="mb-2"
                    autoFocus
                  />
                </div>
                <div className="max-h-60 overflow-y-auto p-2">
                  <div className="flex items-center space-x-2 mb-3">
                    <Checkbox 
                      id="employee-all"
                      checked={employeeFilters.length === 0}
                      onCheckedChange={() => {
                        setEmployeeFilters([])
                        setEmployeeSearch('')
                      }}
                    />
                    <label htmlFor="employee-all" className="text-sm cursor-pointer">Todos los profesionales</label>
                  </div>
                  <div className="border-t pt-2 space-y-2">
                    {filteredEmployees.map(employee => (
                      <div key={employee.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`employee-${employee.id}`}
                          checked={employeeFilters.includes(employee.id)}
                          onCheckedChange={() => toggleEmployeeFilter(employee.id)}
                        />
                        <label htmlFor={`employee-${employee.id}`} className="text-sm cursor-pointer flex-1">
                          {employee.full_name}
                        </label>
                      </div>
                    ))}
                    {filteredEmployees.length === 0 && employeeSearch && (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        No se encontraron profesionales
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Price Min */}
            <Input
              id="minPrice"
              type="text"
              min="0"
              placeholder="Precio mínimo"
              value={minPrice !== null ? minPrice.toLocaleString('es-CO') : ''}
              onChange={(e) => {
                const value = e.target.value.replace(/\./g, '')
                setMinPrice(value ? Number(value) : null)
              }}
              className="w-full"
            />

            {/* Price Max */}
            <Input
              id="maxPrice"
              type="text"
              min="0"
              placeholder="Precio máximo"
              value={maxPrice !== null ? maxPrice.toLocaleString('es-CO') : ''}
              onChange={(e) => {
                const value = e.target.value.replace(/\./g, '')
                setMaxPrice(value ? Number(value) : null)
              }}
              className="w-full"
            />
          </div>
        </CardContent>
        )}
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {paginatedAppointments.length} de {filteredAppointments.length} citas ({appointments.length} total)
        </p>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No se encontraron citas
            </h3>
            <p className="text-muted-foreground">
              {hasActiveFilters 
                ? 'Intenta ajustar los filtros para ver más resultados'
                : 'Aún no tienes citas en tu historial'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {paginatedAppointments.map(appointment => (
            <Card key={appointment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Left Section */}
                  <div className="flex-1 space-y-3">
                    {/* Status and Business */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {getStatusBadgeForAppointment(appointment)}
                      {appointment.business?.name && (
                        <div className="flex items-center gap-2 text-sm font-medium text-primary">
                          <Building2 className="h-4 w-4" />
                          {appointment.business.name}
                        </div>
                      )}
                    </div>

                    {/* Service */}
                    {appointment.service?.name && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-muted-foreground shrink-0" />
                        <span className="font-semibold text-foreground text-lg">
                          {appointment.service.name}
                        </span>
                      </div>
                    )}

                    {/* Date and Time */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(appointment.start_time), "d 'de' MMMM, yyyy", { locale: es })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          {format(new Date(appointment.start_time), 'HH:mm', { locale: es })} - {format(new Date(appointment.end_time), 'HH:mm', { locale: es })}
                        </span>
                      </div>
                    </div>

                    {/* Location */}
                    {appointment.location?.name && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span>{appointment.location.name}</span>
                      </div>
                    )}

                    {/* Employee */}
                    {appointment.employee?.full_name && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4 shrink-0" />
                        <span>{appointment.employee.full_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Right Section - Price */}
                  {(appointment.service?.price || appointment.price) && (
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2 text-2xl font-bold text-foreground">
                        <DollarSign className="h-6 w-6" />
                        {(appointment.service?.price || appointment.price || 0).toLocaleString('es-MX')}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {appointment.service?.currency || appointment.currency || 'COP'}
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
            <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </div>
        </>
      )}
    </div>
  )
}
