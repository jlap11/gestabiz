import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useKV } from '@/lib/useKV'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Business, Location, Service, User } from '@/types'

export function useBusinessManager(user: User) {
  const { t } = useLanguage()
  const [business, setBusiness] = useKV<Business | null>(`business-${user.business_id}`, null)
  const [locations, setLocations] = useKV<Location[]>(`locations-${user.business_id}`, [])
  const [services, setServices] = useKV<Service[]>(`services-${user.business_id}`, [])
  
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [editingService, setEditingService] = useState<Service | null>(null)

  // Default business hours
  const defaultBusinessHours = useMemo(
    () => ({
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '14:00', closed: false },
      sunday: { open: '09:00', close: '14:00', closed: true },
    }),
    []
  )

  // Default location hours
  const defaultLocationHours: Location['business_hours'] = {
    monday: { open: '09:00', close: '18:00', is_open: true },
    tuesday: { open: '09:00', close: '18:00', is_open: true },
    wednesday: { open: '09:00', close: '18:00', is_open: true },
    thursday: { open: '09:00', close: '18:00', is_open: true },
    friday: { open: '09:00', close: '18:00', is_open: true },
    saturday: { open: '09:00', close: '14:00', is_open: true },
    sunday: { open: '09:00', close: '14:00', is_open: false },
  }

  // Initialize business if not exists
  const initializeBusiness = useCallback(() => {
    if (!business) {
      const newBusiness: Business = {
        id: user.business_id || `business-${Date.now()}`,
        name: 'Mi Negocio',
        category: 'General',
        description: '',
        logo_url: '',
        website: '',
        phone: '',
        email: user.email,
        address: '',
        city: '',
        state: '',
        country: 'Colombia',
        postal_code: '',
        latitude: undefined,
        longitude: undefined,
        business_hours: defaultBusinessHours,
        timezone: 'America/Bogota',
        owner_id: user.id,
        settings: {
          appointment_buffer: 0,
          advance_booking_days: 30,
          cancellation_policy: 24,
          auto_confirm: true,
          require_deposit: false,
          deposit_percentage: 0,
          currency: 'COP',
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
      }
      setBusiness(newBusiness)
    }
  }, [business, setBusiness, user, defaultBusinessHours])

  // Business operations
  const handleBusinessUpdate = useCallback((updatedBusiness: Partial<Business>) => {
    if (!business) return

    const updated = {
      ...business,
      ...updatedBusiness,
      updated_at: new Date().toISOString(),
    }
    setBusiness(updated)
    toast.success(t('business.management.updated'))
  }, [business, setBusiness, t])

  // Location operations
  const handleAddLocation = useCallback(() => {
    const newLocation: Location = {
      id: `location-${Date.now()}`,
      business_id: business?.id || '',
      name: t('admin.actions.newLocation'),
      address: '',
      city: '',
      state: '',
      country: 'Colombia',
      postal_code: '',
      latitude: undefined,
      longitude: undefined,
      phone: '',
      email: '',
      business_hours: defaultLocationHours,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setLocations([...locations, newLocation])
    setEditingLocation(newLocation)
    toast.success(t('locations.location_created'))
  }, [business?.id, locations, setLocations, defaultLocationHours, t])

  const handleUpdateLocation = useCallback((updatedLocation: Partial<Location>) => {
    if (!editingLocation) return

    const updated = {
      ...editingLocation,
      ...updatedLocation,
      updated_at: new Date().toISOString(),
    }

    setLocations(locations.map(loc => (loc.id === editingLocation.id ? updated : loc)))
    setEditingLocation(updated)
    toast.success(t('locations.location_updated'))
  }, [editingLocation, locations, setLocations, t])

  const handleDeleteLocation = useCallback((locationId: string) => {
    setLocations(locations.filter(loc => loc.id !== locationId))
    if (editingLocation?.id === locationId) {
      setEditingLocation(null)
    }
    toast.success(t('locations.location_deleted'))
  }, [locations, setLocations, editingLocation, t])

  // Service operations
  const handleAddService = useCallback(() => {
    const newService: Service = {
      id: `service-${Date.now()}`,
      business_id: business?.id || '',
      location_id: undefined,
      name: t('admin.actions.newService'),
      description: '',
      duration: 60,
      price: 0,
      currency: 'COP',
      category: '',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setServices([...services, newService])
    setEditingService(newService)
    toast.success(t('services.service_created'))
  }, [business?.id, services, setServices, t])

  const handleUpdateService = useCallback((updatedService: Partial<Service>) => {
    if (!editingService) return

    const updated = {
      ...editingService,
      ...updatedService,
      updated_at: new Date().toISOString(),
    }

    setServices(services.map(svc => (svc.id === editingService.id ? updated : svc)))
    setEditingService(updated)
    toast.success(t('services.service_updated'))
  }, [editingService, services, setServices, t])

  const handleDeleteService = useCallback((serviceId: string) => {
    setServices(services.filter(svc => svc.id !== serviceId))
    if (editingService?.id === serviceId) {
      setEditingService(null)
    }
    toast.success(t('services.service_deleted'))
  }, [services, setServices, editingService, t])

  return {
    // State
    business,
    locations,
    services,
    editingLocation,
    editingService,
    
    // Actions
    initializeBusiness,
    handleBusinessUpdate,
    handleAddLocation,
    handleUpdateLocation,
    handleDeleteLocation,
    setEditingLocation,
    handleAddService,
    handleUpdateService,
    handleDeleteService,
    setEditingService,
    
    // Defaults
    defaultBusinessHours,
    defaultLocationHours,
  }
}