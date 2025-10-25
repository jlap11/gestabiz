import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { HistoryStatsCards } from './HistoryStatsCards'
import { HistoryFilters } from './HistoryFilters'
import { HistoryAppointmentCard } from './HistoryAppointmentCard'
import { HistoryPagination } from './HistoryPagination'
import { EmptyHistoryState } from './EmptyHistoryState'

interface ClientHistoryProps {
  readonly onStartChat: (appointment: AppointmentWithRelations) => void
  readonly onLeaveReview: (appointment: AppointmentWithRelations) => void
}

interface AppointmentWithRelations {
  id: string
  date: string
  start_time: string
  end_time: string
  status: string
  notes?: string
  price?: number
  business: Business
  location: Location
  service: Service
  category: Category
  employee: Employee
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

export const ClientHistory = React.memo(function ClientHistory({ 
  onStartChat, 
  onLeaveReview 
}: ClientHistoryProps) {
  const { user } = useAuth()
  const { t } = useLanguage()

  // State
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilters, setStatusFilters] = useState<string[]>([])
  const [businessFilters, setBusinessFilters] = useState<string[]>([])
  const [locationFilters, setLocationFilters] = useState<string[]>([])
  const [serviceFilters, setServiceFilters] = useState<string[]>([])
  const [categoryFilters, setCategoryFilters] = useState<string[]>([])
  const [employeeFilters, setEmployeeFilters] = useState<string[]>([])
  const [priceRangeFilter, setPriceRangeFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Filter search states
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

  // Extract unique values for filters
  const uniqueBusinesses = useMemo(() => {
    const businessMap = new Map<string, Business>()
    appointments.forEach(apt => {
      if (!businessMap.has(apt.business.id)) {
        businessMap.set(apt.business.id, apt.business)
      }
    })
    return Array.from(businessMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [appointments])

  const uniqueLocations = useMemo(() => {
    const locationMap = new Map<string, Location>()
    appointments.forEach(apt => {
      if (!locationMap.has(apt.location.id)) {
        locationMap.set(apt.location.id, apt.location)
      }
    })
    return Array.from(locationMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [appointments])

  const uniqueServices = useMemo(() => {
    const serviceMap = new Map<string, Service>()
    appointments.forEach(apt => {
      if (!serviceMap.has(apt.service.id)) {
        serviceMap.set(apt.service.id, apt.service)
      }
    })
    return Array.from(serviceMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [appointments])

  const uniqueCategories = useMemo(() => {
    const categoryMap = new Map<string, Category>()
    appointments.forEach(apt => {
      if (!categoryMap.has(apt.category.id)) {
        categoryMap.set(apt.category.id, apt.category)
      }
    })
    return Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [appointments])

  const uniqueEmployees = useMemo(() => {
    const employeeMap = new Map<string, Employee>()
    appointments.forEach(apt => {
      if (!employeeMap.has(apt.employee.id)) {
        employeeMap.set(apt.employee.id, apt.employee)
      }
    })
    return Array.from(employeeMap.values()).sort((a, b) => a.full_name.localeCompare(b.full_name))
  }, [appointments])

  // Fetch appointments
  useEffect(() => {
    if (!user?.id) return

    const fetchAppointments = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            id,
            date,
            start_time,
            end_time,
            status,
            notes,
            price,
            businesses!inner (
              id,
              name
            ),
            locations!inner (
              id,
              name,
              business_id
            ),
            services!inner (
              id,
              name,
              business_id
            ),
            categories!inner (
              id,
              name,
              slug
            ),
            employees!inner (
              id,
              full_name
            )
          `)
          .eq('client_id', user.id)
          .in('status', ['attended', 'cancelled', 'no_show'])
          .order('date', { ascending: false })

        if (error) throw error

        const formattedAppointments: AppointmentWithRelations[] = (data || []).map(apt => ({
          id: apt.id,
          date: apt.date,
          start_time: apt.start_time,
          end_time: apt.end_time,
          status: apt.status,
          notes: apt.notes,
          price: apt.price,
          business: apt.businesses,
          location: apt.locations,
          service: apt.services,
          category: apt.categories,
          employee: apt.employees,
        }))

        setAppointments(formattedAppointments)
      } catch (error) {
        await logger.error('Error fetching appointment history', error, {
          component: 'ClientHistory',
          userId: user.id,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()
  }, [user?.id])

  const statusConfig = {
    attended: { label: t('clientHistory.status.completed'), variant: 'default' as const },
    cancelled: { label: t('clientHistory.status.cancelled'), variant: 'destructive' as const },
    no_show: { label: t('clientHistory.status.no_show'), variant: 'secondary' as const },
  }

  // Clear filters function
  const clearFilters = useCallback(() => {
    setSearchTerm('')
    setStatusFilters([])
    setBusinessFilters([])
    setLocationFilters([])
    setServiceFilters([])
    setCategoryFilters([])
    setEmployeeFilters([])
    setPriceRangeFilter('all')
    setCurrentPage(1)
    setBusinessSearch('')
    setLocationSearch('')
    setServiceSearch('')
    setCategorySearch('')
    setEmployeeSearch('')
  }, [])

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      searchTerm.trim() !== '' ||
      statusFilters.length > 0 ||
      businessFilters.length > 0 ||
      locationFilters.length > 0 ||
      serviceFilters.length > 0 ||
      categoryFilters.length > 0 ||
      employeeFilters.length > 0 ||
      priceRangeFilter !== 'all'
    )
  }, [
    searchTerm,
    statusFilters,
    businessFilters,
    locationFilters,
    serviceFilters,
    categoryFilters,
    employeeFilters,
    priceRangeFilter,
  ])

  // Filter appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(appointment => {
      // Status filter
      if (statusFilters.length > 0 && !statusFilters.includes(appointment.status)) {
        return false
      }

      // Business filter
      if (businessFilters.length > 0 && !businessFilters.includes(appointment.business.id)) {
        return false
      }

      // Location filter
      if (locationFilters.length > 0 && !locationFilters.includes(appointment.location.id)) {
        return false
      }

      // Service filter
      if (serviceFilters.length > 0 && !serviceFilters.includes(appointment.service.id)) {
        return false
      }

      // Category filter
      if (categoryFilters.length > 0 && !categoryFilters.includes(appointment.category.id)) {
        return false
      }

      // Employee filter
      if (employeeFilters.length > 0 && !employeeFilters.includes(appointment.employee.id)) {
        return false
      }

      // Price range filter
      if (priceRangeFilter !== 'all' && appointment.price) {
        const price = appointment.price
        switch (priceRangeFilter) {
          case '0-500':
            if (price > 500) return false
            break
          case '501-1000':
            if (price <= 500 || price > 1000) return false
            break
          case '1001-2000':
            if (price <= 1000 || price > 2000) return false
            break
          case '2001+':
            if (price <= 2000) return false
            break
        }
      }

      // Search term filter
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase()
        return (
          appointment.service.name.toLowerCase().includes(searchLower) ||
          appointment.business.name.toLowerCase().includes(searchLower) ||
          appointment.location.name.toLowerCase().includes(searchLower) ||
          appointment.employee.full_name.toLowerCase().includes(searchLower) ||
          appointment.category.name.toLowerCase().includes(searchLower) ||
          (appointment.notes && appointment.notes.toLowerCase().includes(searchLower))
        )
      }

      return true
    })
  }, [
    appointments,
    statusFilters,
    businessFilters,
    locationFilters,
    serviceFilters,
    categoryFilters,
    employeeFilters,
    priceRangeFilter,
    searchTerm,
  ])

  // Pagination
  const itemsPerPage = 10
  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage)
  const paginatedAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredAppointments.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredAppointments, currentPage])

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredAppointments.length
    const attended = filteredAppointments.filter(apt => apt.status === 'attended').length
    const cancelled = filteredAppointments.filter(apt => apt.status === 'cancelled').length
    const noShow = filteredAppointments.filter(apt => apt.status === 'no_show').length
    const totalSpent = filteredAppointments
      .filter(apt => apt.status === 'attended' && apt.price)
      .reduce((sum, apt) => sum + (apt.price || 0), 0)

    return { total, attended, cancelled, noShow, totalSpent }
  }, [filteredAppointments])

  // Filter functions for search
  const filteredBusinesses = useMemo(() => {
    if (!businessSearch.trim()) return uniqueBusinesses
    return uniqueBusinesses.filter(business =>
      business.name.toLowerCase().includes(businessSearch.toLowerCase())
    )
  }, [uniqueBusinesses, businessSearch])

  const filteredLocations = useMemo(() => {
    if (!locationSearch.trim()) return uniqueLocations
    return uniqueLocations.filter(location =>
      location.name.toLowerCase().includes(locationSearch.toLowerCase())
    )
  }, [uniqueLocations, locationSearch])

  const filteredServices = useMemo(() => {
    if (!serviceSearch.trim()) return uniqueServices
    return uniqueServices.filter(service =>
      service.name.toLowerCase().includes(serviceSearch.toLowerCase())
    )
  }, [uniqueServices, serviceSearch])

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return uniqueCategories
    return uniqueCategories.filter(category =>
      category.name.toLowerCase().includes(categorySearch.toLowerCase())
    )
  }, [uniqueCategories, categorySearch])

  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) return uniqueEmployees
    return uniqueEmployees.filter(employee =>
      employee.full_name.toLowerCase().includes(employeeSearch.toLowerCase())
    )
  }, [uniqueEmployees, employeeSearch])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <HistoryStatsCards stats={stats} />

      {/* Filters */}
      <HistoryFilters
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        statusFilters={statusFilters}
        onStatusFiltersChange={setStatusFilters}
        businessFilters={businessFilters}
        onBusinessFiltersChange={setBusinessFilters}
        locationFilters={locationFilters}
        onLocationFiltersChange={setLocationFilters}
        serviceFilters={serviceFilters}
        onServiceFiltersChange={setServiceFilters}
        categoryFilters={categoryFilters}
        onCategoryFiltersChange={setCategoryFilters}
        employeeFilters={employeeFilters}
        onEmployeeFiltersChange={setEmployeeFilters}
        priceRangeFilter={priceRangeFilter}
        onPriceRangeFilterChange={setPriceRangeFilter}
        businesses={uniqueBusinesses}
        locations={uniqueLocations}
        services={uniqueServices}
        categories={uniqueCategories}
        employees={uniqueEmployees}
        businessSearch={businessSearch}
        onBusinessSearchChange={setBusinessSearch}
        businessPopoverOpen={businessPopoverOpen}
        onBusinessPopoverOpenChange={setBusinessPopoverOpen}
        locationSearch={locationSearch}
        onLocationSearchChange={setLocationSearch}
        locationPopoverOpen={locationPopoverOpen}
        onLocationPopoverOpenChange={setLocationPopoverOpen}
        serviceSearch={serviceSearch}
        onServiceSearchChange={setServiceSearch}
        servicePopoverOpen={servicePopoverOpen}
        onServicePopoverOpenChange={setServicePopoverOpen}
        categorySearch={categorySearch}
        onCategorySearchChange={setCategorySearch}
        categoryPopoverOpen={categoryPopoverOpen}
        onCategoryPopoverOpenChange={setCategoryPopoverOpen}
        employeeSearch={employeeSearch}
        onEmployeeSearchChange={setEmployeeSearch}
        employeePopoverOpen={employeePopoverOpen}
        onEmployeePopoverOpenChange={setEmployeePopoverOpen}
        filteredBusinesses={filteredBusinesses}
        filteredLocations={filteredLocations}
        filteredServices={filteredServices}
        filteredCategories={filteredCategories}
        filteredEmployees={filteredEmployees}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      />

      {/* Results count */}
      {filteredAppointments.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {t('clientHistory.messages.resultsCount', { count: filteredAppointments.length })}
        </div>
      )}

      {/* Appointments list or empty state */}
      {filteredAppointments.length === 0 ? (
        <EmptyHistoryState
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />
      ) : (
        <div className="space-y-4">
          {paginatedAppointments.map(appointment => (
            <HistoryAppointmentCard
              key={appointment.id}
              appointment={appointment}
              statusConfig={statusConfig}
              onStartChat={onStartChat}
              onLeaveReview={onLeaveReview}
            />
          ))}

          {/* Pagination */}
          <HistoryPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredAppointments.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      )}
    </div>
  )
})