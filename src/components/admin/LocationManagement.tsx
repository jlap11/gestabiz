import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Business, Location, Service, User } from '@/types'
import { useKV } from '@/lib/useKV'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'
import {
  Building,
  Clock,
  PencilSimple as Edit,
  EnvelopeSimple as Mail,
  MapPin,
  Phone,
  Plus,
  Star,
  Trash,
} from '@phosphor-icons/react'

interface LocationManagementProps {
  user: User
}

export default function LocationManagement(props: Readonly<LocationManagementProps>) {
  const { user } = props
  const { t } = useLanguage()
  useKV<Business | null>(`business-${user.business_id}`, null)
  const [locations, setLocations] = useKV<Location[]>(`locations-${user.business_id}`, [])
  const [services, setServices] = useKV<Service[]>(`services-${user.business_id}`, [])

  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false)
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [editingService, setEditingService] = useState<Service | null>(null)

  // Location form state
  const [locationForm, setLocationForm] = useState({
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
  })

  // Service form state
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    duration: 60,
    price: 0,
    currency: 'EUR',
    category: '',
    location_id: '',
  })

  const resetLocationForm = () => {
    setLocationForm({
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
    })
    setEditingLocation(null)
  }

  const resetServiceForm = () => {
    setServiceForm({
      name: '',
      description: '',
      duration: 60,
      price: 0,
      currency: 'EUR',
      category: '',
      location_id: '',
    })
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
      business_hours: location.business_hours as unknown as typeof locationForm.business_hours,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('locations.title')}</h1>
          <p className="text-muted-foreground">{t('admin.locationManagement.subtitle')}</p>
        </div>

        <div className="flex gap-2">
          <Dialog open={isLocationDialogOpen} onOpenChange={setIsLocationDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetLocationForm}>
                <Plus className="h-4 w-4 mr-2" />
                {t('locations.new')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingLocation ? t('locations.edit') : t('locations.new')}
                </DialogTitle>
                <DialogDescription>
                  {editingLocation
                    ? t('admin.locationManagement.editDescription')
                    : t('admin.actions.addNewLocation')}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleLocationSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="location-name">{t('admin.locationManagement.nameLabel')}</Label>
                    <Input
                      id="location-name"
                      value={locationForm.name}
                      onChange={e => setLocationForm({ ...locationForm, name: e.target.value })}
                      placeholder={t('admin.locationManagement.namePlaceholder')}
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="location-address">
                      {t('admin.locationManagement.addressLabel')}
                    </Label>
                    <Input
                      id="location-address"
                      value={locationForm.address}
                      onChange={e => setLocationForm({ ...locationForm, address: e.target.value })}
                      placeholder={t('admin.locationManagement.addressPlaceholder')}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="location-city">{t('admin.locationManagement.cityLabel')}</Label>
                    <Input
                      id="location-city"
                      value={locationForm.city}
                      onChange={e => setLocationForm({ ...locationForm, city: e.target.value })}
                      placeholder={t('common.placeholders.city')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="location-state">
                      {t('admin.locationManagement.stateLabel')}
                    </Label>
                    <Input
                      id="location-state"
                      value={locationForm.state}
                      onChange={e => setLocationForm({ ...locationForm, state: e.target.value })}
                      placeholder={t('common.placeholders.state')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="location-country">
                      {t('admin.locationManagement.countryLabel')}
                    </Label>
                    <Input
                      id="location-country"
                      value={locationForm.country}
                      onChange={e => setLocationForm({ ...locationForm, country: e.target.value })}
                      placeholder={t('admin.locationManagement.countryPlaceholder')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="location-postal">
                      {t('admin.locationManagement.postalLabel')}
                    </Label>
                    <Input
                      id="location-postal"
                      value={locationForm.postal_code}
                      onChange={e =>
                        setLocationForm({ ...locationForm, postal_code: e.target.value })
                      }
                      placeholder={t('admin.locationManagement.postalPlaceholder')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="location-phone">
                      {t('admin.locationManagement.phoneLabel')}
                    </Label>
                    <Input
                      id="location-phone"
                      value={locationForm.phone}
                      onChange={e => setLocationForm({ ...locationForm, phone: e.target.value })}
                      placeholder={t('admin.locationManagement.phonePlaceholder')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="location-email">
                      {t('admin.locationManagement.emailLabel')}
                    </Label>
                    <Input
                      id="location-email"
                      type="email"
                      value={locationForm.email}
                      onChange={e => setLocationForm({ ...locationForm, email: e.target.value })}
                      placeholder={t('common.placeholders.email')}
                    />
                  </div>

                  <div className="col-span-2 flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                    <div className="flex items-center gap-3">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <div>
                        <Label
                          htmlFor="is-primary"
                          className="text-base font-medium cursor-pointer"
                        >
                          {t('admin.locationManagement.primaryLabel')}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {t('admin.locationManagement.primaryDescription')}
                        </p>
                      </div>
                    </div>
                    <Switch
                      id="is-primary"
                      checked={locationForm.is_primary}
                      onCheckedChange={checked =>
                        setLocationForm({ ...locationForm, is_primary: checked })
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-medium">Horarios de Atención</Label>
                  <div className="mt-3 space-y-3">
                    {Object.entries(locationForm.business_hours).map(([day, hours]) => (
                      <div key={day} className="flex items-center gap-4">
                        <div className="w-20">
                          <Label className="text-sm capitalize">{t(`day.${day}`)}</Label>
                        </div>
                        <Switch
                          checked={hours.is_open}
                          onCheckedChange={checked =>
                            setLocationForm({
                              ...locationForm,
                              business_hours: {
                                ...locationForm.business_hours,
                                [day]: { ...hours, is_open: checked },
                              },
                            })
                          }
                        />
                        {hours.is_open && (
                          <>
                            <Input
                              type="time"
                              value={hours.open}
                              onChange={e =>
                                setLocationForm({
                                  ...locationForm,
                                  business_hours: {
                                    ...locationForm.business_hours,
                                    [day]: { ...hours, open: e.target.value },
                                  },
                                })
                              }
                              className="w-24"
                            />
                            <span className="text-muted-foreground">a</span>
                            <Input
                              type="time"
                              value={hours.close}
                              onChange={e =>
                                setLocationForm({
                                  ...locationForm,
                                  business_hours: {
                                    ...locationForm.business_hours,
                                    [day]: { ...hours, close: e.target.value },
                                  },
                                })
                              }
                              className="w-24"
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsLocationDialogOpen(false)}
                  >
                    {t('action.cancel')}
                  </Button>
                  <Button type="submit">
                    {editingLocation ? t('action.update') : t('action.create')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={resetServiceForm}>
                <Plus className="h-4 w-4 mr-2" />
                {t('services.new')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingService ? t('services.edit') : t('services.new')}</DialogTitle>
                <DialogDescription>
                  {editingService
                    ? t('admin.locationManagement.editServiceDescription')
                    : t('admin.actions.addNewService')}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleServiceSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="service-name">{t('services.name')} *</Label>
                  <Input
                    id="service-name"
                    value={serviceForm.name}
                    onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                    placeholder={t('admin.locationManagement.serviceNamePlaceholder')}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="service-description">{t('services.description')}</Label>
                  <Textarea
                    id="service-description"
                    value={serviceForm.description}
                    onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
                    placeholder="Descripción del servicio"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="service-duration">{t('services.duration')}</Label>
                    <Input
                      id="service-duration"
                      type="number"
                      value={serviceForm.duration}
                      onChange={e =>
                        setServiceForm({ ...serviceForm, duration: parseInt(e.target.value) || 60 })
                      }
                      min="15"
                      step="15"
                    />
                  </div>

                  <div>
                    <Label htmlFor="service-price">{t('services.price')} (€)</Label>
                    <Input
                      id="service-price"
                      type="number"
                      step="0.01"
                      value={serviceForm.price}
                      onChange={e =>
                        setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) || 0 })
                      }
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="service-category">{t('services.category')}</Label>
                  <Input
                    id="service-category"
                    value={serviceForm.category}
                    onChange={e => setServiceForm({ ...serviceForm, category: e.target.value })}
                    placeholder="Ej: Preventiva, Estética, Cirugía"
                  />
                </div>

                <div>
                  <Label htmlFor="service-location">Ubicación Específica (Opcional)</Label>
                  <Select
                    value={serviceForm.location_id}
                    onValueChange={value => setServiceForm({ ...serviceForm, location_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.placeholders.allLocations')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t('common.placeholders.allLocations')}</SelectItem>
                      {locations.map(location => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsServiceDialogOpen(false)}
                  >
                    {t('action.cancel')}
                  </Button>
                  <Button type="submit">
                    {editingService ? t('action.update') : t('action.create')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {locations.map(location => (
          <Card key={location.id} className="relative">
            {location.is_primary && (
              <div className="absolute -top-2 -right-2">
                <Badge
                  variant="default"
                  className="bg-yellow-500 hover:bg-yellow-600 flex items-center gap-1"
                >
                  <Star className="h-3 w-3 fill-current" />
                  Principal
                </Badge>
              </div>
            )}
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    {location.name}
                  </CardTitle>
                  <CardDescription>
                    {location.address}, {location.city}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => editLocation(location)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteLocation(location.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Contact Info */}
              <div className="flex flex-col gap-2 text-sm">
                {location.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {location.phone}
                  </div>
                )}
                {location.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {location.email}
                  </div>
                )}
              </div>

              {/* Business Hours */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Horarios</span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {Object.entries(location.business_hours).map(([day, hours]) => {
                    const isOpen = 'is_open' in hours ? hours.is_open : !hours.closed
                    return (
                      <div key={day} className="flex justify-between">
                        <span className="capitalize">{t(`day.${day}`)}</span>
                        <span className={isOpen ? '' : 'text-muted-foreground'}>
                          {isOpen ? `${hours.open} - ${hours.close}` : 'Cerrado'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Services for this location */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Servicios Específicos</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {getLocationServices(location.id).length > 0 ? (
                    getLocationServices(location.id).map(service => (
                      <Badge key={service.id} variant="secondary" className="text-xs">
                        {service.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Todos los servicios generales disponibles
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Services Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t('services.title')}</h2>
        </div>

        {/* General Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              Servicios Generales
            </CardTitle>
            <CardDescription>Servicios disponibles en todas las ubicaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getGeneralServices().map(service => (
                <div key={service.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{service.name}</h4>
                      {service.description && (
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => editService(service)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteService(service.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {service.duration}min
                    </div>
                    <div className="font-medium">€{service.price.toFixed(2)}</div>
                  </div>

                  {service.category && (
                    <Badge variant="outline" className="text-xs">
                      {service.category}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Location-specific Services */}
        {locations.map(location => {
          const locationServices = getLocationServices(location.id)
          if (locationServices.length === 0) return null

          return (
            <Card key={location.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Servicios de {location.name}
                </CardTitle>
                <CardDescription>Servicios específicos de esta ubicación</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {locationServices.map(service => (
                    <div key={service.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{service.name}</h4>
                          {service.description && (
                            <p className="text-sm text-muted-foreground">{service.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => editService(service)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteService(service.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {service.duration}min
                        </div>
                        <div className="font-medium">€{service.price.toFixed(2)}</div>
                      </div>

                      {service.category && (
                        <Badge variant="outline" className="text-xs">
                          {service.category}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
