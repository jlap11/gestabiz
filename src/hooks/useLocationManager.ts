import { useState } from 'react'
import { useKV } from '@/lib/useKV'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'
import type { Location, Service, User } from '@/types'

interface LocationForm {
  name: string
  address: string
  city: string
  state: string
  country: string
  postal_code: string
  phone: string
  email: string
  is_primary: boolean
  business_hours: {
    monday: { open: string; close: string; is_open: boolean }
    tuesday: { open: string; close: string; is_open: boolean }
    wednesday: { open: string; close: string; is_open: boolean }
    thursday: { open: string; close: string; is_open: boolean }
    friday: { open: string; close: string; is_open: boolean }
    saturday: { open: string; close: string; is_open: boolean }
    sunday: { open: string; close: string; is_open: boolean }
  }
}

interface ServiceForm {
  name: string
  description: string
  duration: number
  price: number
  currency: string
  category: string
  location_id: string
}

const defaultLocationForm: LocationForm = {
  name: '',
  address: '',
  city: '',
  state: '',
  country: 'España',
  postal_code: '',
  phone: '',
  email: '',
  is_primary: false,
  business_hours: {
    monday: { open: '09:00', close: '18:00', is_open: true },
    tuesday: { open: '09:00', close: '18:00', is_open: true },
    wednesday: { open: '09:00', close: '18:00', is_open: true },
    thursday: { open: '09:00', close: '18:00', is_open: true },
    friday: { open: '09:00', close: '18:00', is_open: true },
    saturday: { open: '09:00', close: '14:00', is_open: true },
    sunday: { open: '09:00', close: '14:00', is_open: false },
  },
}

const defaultServiceForm: ServiceForm = {
  name: '',
  description: '',
  duration: 60,
  price: 0,
  currency: 'EUR',
  category: '',
  location_id: '',
}

export function useLocationManager(user: User) {
  const { t } = useLanguage()
  const [locations, setLocations] = useKV<Location[]>(`locations-${user.business_id}`, [])
  const [services, setServices] = useKV<Service[]>(`services-${user.business_id}`, [])
  
  // Dialog states
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false)
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [editingService, setEditingService] = useState<Service | null>(null)
  
  // Form states
  const [locationForm, setLocationForm] = useState<LocationForm>(defaultLocationForm)
  const [serviceForm, setServiceForm] = useState<ServiceForm>(defaultServiceForm)

  const resetLocationForm = () => {
    setLocationForm(defaultLocationForm)
    setEditingLocation(null)
  }

  const resetServiceForm = () => {
    setServiceForm(defaultServiceForm)
    setEditingService(null)
  }

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!locationForm.name.trim() || !locationForm.address.trim()) {
      toast.error(t('admin.locationManagement.missingFields'))
      return
    }

    try {
      if (editingLocation) {
        // Update existing location
        const updatedLocations = locations.map(loc => {
          if (loc.id === editingLocation.id) {
            return {
              ...loc,
              ...locationForm,
              updated_at: new Date().toISOString(),
            }
          }
          // Si la ubicación editada se marcó como principal, desmarcar las demás
          if (locationForm.is_primary && loc.is_primary) {
            return { ...loc, is_primary: false }
          }
          return loc
        })
        setLocations(updatedLocations)
        toast.success(t('admin.locationManagement.locationUpdateSuccess'))
      } else {
        // Create new location
        const newLocation: Location = {
          id: crypto.randomUUID(),
          business_id: user.business_id!,
          ...locationForm,
          latitude: undefined,
          longitude: undefined,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        // Si la nueva ubicación se marca como principal, desmarcar las demás
        let finalLocations = [...locations, newLocation]
        if (locationForm.is_primary) {
          finalLocations = finalLocations.map((loc, idx) =>
            idx === finalLocations.length - 1 ? loc : { ...loc, is_primary: false }
          )
        }

        setLocations(finalLocations)
        toast.success(t('admin.locationManagement.locationCreateSuccess'))
      }

      setIsLocationDialogOpen(false)
      resetLocationForm()
    } catch {
      toast.error(t('admin.locationManagement.locationSaveError'))
    }
  }

  const handleServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!serviceForm.name.trim()) {
      toast.error(t('admin.locationManagement.serviceNameRequired'))
      return
    }

    try {
      if (editingService) {
        // Update existing service
        const updatedServices = services.map(srv =>
          srv.id === editingService.id
            ? {
                ...srv,
                ...serviceForm,
                location_id: serviceForm.location_id || undefined,
                updated_at: new Date().toISOString(),
              }
            : srv
        )
        setServices(updatedServices)
        toast.success(t('admin.locationManagement.serviceUpdateSuccess'))
      } else {
        // Create new service
        const newService: Service = {
          id: crypto.randomUUID(),
          business_id: user.business_id!,
          ...serviceForm,
          location_id: serviceForm.location_id || undefined,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setServices([...services, newService])
        toast.success(t('admin.locationManagement.serviceCreateSuccess'))
      }

      setIsServiceDialogOpen(false)
      resetServiceForm()
    } catch {
      toast.error(t('admin.locationManagement.serviceSaveError'))
    }
  }

  const editLocation = (location: Location) => {
    setLocationForm({
      name: location.name,
      address: location.address,
      city: location.city,
      state: location.state,
      country: location.country,
      postal_code: location.postal_code,
      phone: location.phone || '',
      email: location.email || '',
      is_primary: location.is_primary || false,
      business_hours: location.business_hours as unknown as LocationForm['business_hours'],
    })
    setEditingLocation(location)
    setIsLocationDialogOpen(true)
  }

  const editService = (service: Service) => {
    setServiceForm({
      name: service.name,
      description: service.description || '',
      duration: service.duration,
      price: service.price,
      currency: service.currency || 'EUR',
      category: service.category || '',
      location_id: service.location_id || '',
    })
    setEditingService(service)
    setIsServiceDialogOpen(true)
  }

  const deleteLocation = (locationId: string) => {
    if (window.confirm(t('admin.locationManagement.confirmDeleteLocation'))) {
      setLocations(locations.filter(loc => loc.id !== locationId))
      toast.success(t('admin.locationManagement.locationDeleteSuccess'))
    }
  }

  const deleteService = (serviceId: string) => {
    if (window.confirm(t('admin.locationManagement.confirmDeleteService'))) {
      setServices(services.filter(srv => srv.id !== serviceId))
      toast.success(t('admin.locationManagement.serviceDeleteSuccess'))
    }
  }

  const getLocationServices = (locationId: string) => {
    return services.filter(service => service.location_id === locationId)
  }

  const getGeneralServices = () => {
    return services.filter(service => !service.location_id)
  }

  return {
    // Data
    locations,
    services,
    
    // Dialog states
    isLocationDialogOpen,
    setIsLocationDialogOpen,
    isServiceDialogOpen,
    setIsServiceDialogOpen,
    editingLocation,
    editingService,
    
    // Form states
    locationForm,
    setLocationForm,
    serviceForm,
    setServiceForm,
    
    // Actions
    handleLocationSubmit,
    handleServiceSubmit,
    editLocation,
    editService,
    deleteLocation,
    deleteService,
    resetLocationForm,
    resetServiceForm,
    getLocationServices,
    getGeneralServices,
  }
}