import React, { useState, useEffect, useMemo } from 'react'
import { Calendar, Clock, MapPin, User, DollarSign, Filter, X, Search, Building2, Briefcase, Tag, Layers } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ClientHistoryProps {
  userId: string
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
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
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

interface Subcategory {
  id: string
  name: string
  slug: string
  category_id: string
}

interface Employee {
  id: string
  full_name: string
}

export function ClientHistory({ userId }: ClientHistoryProps) {
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [businessFilter, setBusinessFilter] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState<string>('all')
  const [serviceFilter, setServiceFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all')
  const [employeeFilter, setEmployeeFilter] = useState<string>('all')
  const [priceRangeFilter, setPriceRangeFilter] = useState<string>('all')
  
  // Data for filters
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])

  // Fetch all appointments
  useEffect(() => {
    fetchAppointments()
    fetchFilterData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          business:businesses!appointments_business_id_fkey (
            id,
            name
          ),
          location:locations!appointments_location_id_fkey (
            id,
            name,
            address
          ),
          service:services!appointments_service_id_fkey (
            id,
            name,
            price,
            currency,
            duration_minutes,
            category_id,
            subcategory_id
          ),
          employee:profiles!appointments_employee_id_fkey (
            id,
            full_name
          )
        `)
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

  const fetchFilterData = async () => {
    try {
      // Fetch businesses
      const { data: businessesData } = await supabase
        .from('businesses')
        .select('id, name')
        .order('name')

      // Fetch locations
      const { data: locationsData } = await supabase
        .from('locations')
        .select('id, name, business_id')
        .order('name')

      // Fetch services
      const { data: servicesData } = await supabase
        .from('services')
        .select('id, name, business_id')
        .order('name')

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('business_categories')
        .select('id, name, slug')
        .order('name')

      // Fetch subcategories
      const { data: subcategoriesData } = await supabase
        .from('business_subcategories')
        .select('id, name, slug, category_id')
        .order('name')

      // Fetch employees (profiles with employee role)
      const { data: employeesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name')

      setBusinesses(businessesData || [])
      setLocations(locationsData || [])
      setServices(servicesData || [])
      setCategories(categoriesData || [])
      setSubcategories(subcategoriesData || [])
      setEmployees(employeesData || [])
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching filter data:', error)
    }
  }

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    // eslint-disable-next-line sonarjs/cognitive-complexity
    return appointments.filter(apt => {
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'attended' && apt.status !== 'completed') return false
        if (statusFilter === 'cancelled' && apt.status !== 'cancelled') return false
        if (statusFilter === 'no_show' && apt.status !== 'no_show') return false
      }

      // Business filter
      if (businessFilter !== 'all' && apt.business_id !== businessFilter) return false

      // Location filter
      if (locationFilter !== 'all' && apt.location_id !== locationFilter) return false

      // Service filter
      if (serviceFilter !== 'all' && apt.service_id !== serviceFilter) return false

      // Category filter
      if (categoryFilter !== 'all' && apt.service?.category_id !== categoryFilter) return false

      // Subcategory filter
      if (subcategoryFilter !== 'all' && apt.service?.subcategory_id !== subcategoryFilter) return false

      // Employee filter
      if (employeeFilter !== 'all' && apt.employee?.id !== employeeFilter) return false

      // Price range filter
      if (priceRangeFilter !== 'all') {
        const price = apt.service?.price || apt.price || 0
        if (priceRangeFilter === '0-500' && price > 500) return false
        if (priceRangeFilter === '501-1000' && (price <= 500 || price > 1000)) return false
        if (priceRangeFilter === '1001-2000' && (price <= 1000 || price > 2000)) return false
        if (priceRangeFilter === '2001+' && price <= 2000) return false
      }

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        const businessName = apt.business?.name?.toLowerCase() || ''
        const serviceName = apt.service?.name?.toLowerCase() || ''
        const employeeName = apt.employee?.full_name?.toLowerCase() || ''
        const locationName = apt.location?.name?.toLowerCase() || ''
        
        return businessName.includes(search) || 
               serviceName.includes(search) || 
               employeeName.includes(search) ||
               locationName.includes(search)
      }

      return true
    })
  }, [
    appointments,
    statusFilter,
    businessFilter,
    locationFilter,
    serviceFilter,
    categoryFilter,
    subcategoryFilter,
    employeeFilter,
    priceRangeFilter,
    searchTerm
  ])

  // Statistics
  const stats = useMemo(() => {
    return {
      total: appointments.length,
      attended: appointments.filter(a => a.status === 'completed').length,
      cancelled: appointments.filter(a => a.status === 'cancelled').length,
      noShow: appointments.filter(a => a.status === 'no_show').length,
      totalSpent: appointments
        .filter(a => a.status === 'completed')
        .reduce((sum, a) => sum + (a.service?.price || a.price || 0), 0)
    }
  }, [appointments])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: 'Asistida', variant: 'default' as const, className: 'bg-green-500 hover:bg-green-600' },
      cancelled: { label: 'Cancelada', variant: 'destructive' as const, className: '' },
      no_show: { label: 'Perdida', variant: 'secondary' as const, className: 'bg-yellow-500 hover:bg-yellow-600' },
      confirmed: { label: 'Confirmada', variant: 'default' as const, className: '' },
      pending: { label: 'Pendiente', variant: 'secondary' as const, className: '' },
      scheduled: { label: 'Agendada', variant: 'default' as const, className: '' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const clearFilters = () => {
    setStatusFilter('all')
    setBusinessFilter('all')
    setLocationFilter('all')
    setServiceFilter('all')
    setCategoryFilter('all')
    setSubcategoryFilter('all')
    setEmployeeFilter('all')
    setPriceRangeFilter('all')
    setSearchTerm('')
  }

  const hasActiveFilters = 
    statusFilter !== 'all' ||
    businessFilter !== 'all' ||
    locationFilter !== 'all' ||
    serviceFilter !== 'all' ||
    categoryFilter !== 'all' ||
    subcategoryFilter !== 'all' ||
    employeeFilter !== 'all' ||
    priceRangeFilter !== 'all' ||
    searchTerm !== ''

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
              ${stats.totalSpent.toLocaleString('es-MX')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="attended">Asistidas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
                <SelectItem value="no_show">Perdidas</SelectItem>
              </SelectContent>
            </Select>

            {/* Business */}
            <Select value={businessFilter} onValueChange={setBusinessFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Negocio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los negocios</SelectItem>
                {businesses.map(business => (
                  <SelectItem key={business.id} value={business.id}>
                    {business.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Location */}
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Sede" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las sedes</SelectItem>
                {locations
                  .filter(loc => businessFilter === 'all' || loc.business_id === businessFilter)
                  .map(location => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* Service */}
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Servicio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los servicios</SelectItem>
                {services
                  .filter(svc => businessFilter === 'all' || svc.business_id === businessFilter)
                  .map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* Category */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Subcategory */}
            <Select value={subcategoryFilter} onValueChange={setSubcategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Subcategoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las subcategorías</SelectItem>
                {subcategories
                  .filter(sub => categoryFilter === 'all' || sub.category_id === categoryFilter)
                  .map(subcategory => (
                    <SelectItem key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* Employee */}
            <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Profesional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los profesionales</SelectItem>
                {employees.map(employee => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Price Range */}
            <Select value={priceRangeFilter} onValueChange={setPriceRangeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Rango de precio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los precios</SelectItem>
                <SelectItem value="0-500">$0 - $500</SelectItem>
                <SelectItem value="501-1000">$501 - $1,000</SelectItem>
                <SelectItem value="1001-2000">$1,001 - $2,000</SelectItem>
                <SelectItem value="2001+">$2,001+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {filteredAppointments.length} de {appointments.length} citas
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
        <div className="grid grid-cols-1 gap-4">
          {filteredAppointments.map(appointment => (
            <Card key={appointment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Left Section */}
                  <div className="flex-1 space-y-3">
                    {/* Status and Business */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {getStatusBadge(appointment.status)}
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
                        <Briefcase className="h-5 w-5 text-muted-foreground flex-shrink-0" />
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
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span>{appointment.location.name}</span>
                      </div>
                    )}

                    {/* Employee */}
                    {appointment.employee?.full_name && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4 flex-shrink-0" />
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
                        {appointment.service?.currency || appointment.currency || 'MXN'}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
