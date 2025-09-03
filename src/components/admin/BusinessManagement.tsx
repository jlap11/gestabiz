import React, { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Business, Location, Service, User } from '@/types'
import { useKV } from '@/lib/useKV'
import { toast } from 'sonner'
import { 
  Building, 
  MapPin, 
  Plus, 
  Trash,
  Gear as Settings,
  Star
} from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'

interface BusinessManagementProps {
  user: Readonly<User>
}

export default function BusinessManagement({ user }: Readonly<BusinessManagementProps>) {
  const { t } = useLanguage()
  const [business, setBusiness] = useKV<Business | null>(`business-${user.business_id}`, null)
  const [locations, setLocations] = useKV<Location[]>(`locations-${user.business_id}`, [])
  const [services, setServices] = useKV<Service[]>(`services-${user.business_id}`, [])
  
  // const [isEditing, setIsEditing] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [editingService, setEditingService] = useState<Service | null>(null)

  // Default business hours
  const defaultBusinessHours = useMemo(() => ({
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '09:00', close: '14:00', closed: false },
    sunday: { open: '09:00', close: '14:00', closed: true }
  }), [])

  // Default location hours (uses is_open per Location type)
  const defaultLocationHours: Location['business_hours'] = {
    monday: { open: '09:00', close: '18:00', is_open: true },
    tuesday: { open: '09:00', close: '18:00', is_open: true },
    wednesday: { open: '09:00', close: '18:00', is_open: true },
    thursday: { open: '09:00', close: '18:00', is_open: true },
    friday: { open: '09:00', close: '18:00', is_open: true },
    saturday: { open: '09:00', close: '14:00', is_open: true },
    sunday: { open: '09:00', close: '14:00', is_open: false }
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
          currency: 'COP'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      }
      setBusiness(newBusiness)
    }
  }, [business, setBusiness, user, defaultBusinessHours])

  React.useEffect(() => {
    initializeBusiness()
  }, [initializeBusiness])

  const handleBusinessUpdate = (updatedBusiness: Partial<Business>) => {
    if (!business) return
    
    const updated = {
      ...business,
      ...updatedBusiness,
      updated_at: new Date().toISOString()
    }
    setBusiness(updated)
  toast.success(t('business.management.updated'))
  }

  const handleAddLocation = () => {
    const newLocation: Location = {
      id: `location-${Date.now()}`,
      business_id: business?.id || '',
      name: 'Nueva Sede',
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
      updated_at: new Date().toISOString()
    }
    
    setLocations([...locations, newLocation])
    setEditingLocation(newLocation)
  toast.success(t('locations.location_created'))
  }

  const handleUpdateLocation = (updatedLocation: Partial<Location>) => {
    if (!editingLocation) return
    
    const updated = {
      ...editingLocation,
      ...updatedLocation,
      updated_at: new Date().toISOString()
    }
    
    setLocations(locations.map(loc => 
      loc.id === editingLocation.id ? updated : loc
    ))
    setEditingLocation(updated)
  toast.success(t('locations.location_updated'))
  }

  const handleDeleteLocation = (locationId: string) => {
    setLocations(locations.filter(loc => loc.id !== locationId))
    if (editingLocation?.id === locationId) {
      setEditingLocation(null)
    }
  toast.success(t('locations.location_deleted'))
  }

  const handleAddService = () => {
    const newService: Service = {
      id: `service-${Date.now()}`,
      business_id: business?.id || '',
      location_id: undefined,
      name: 'Nuevo Servicio',
      description: '',
      duration: 60,
      price: 0,
      currency: 'COP',
      category: '',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    setServices([...services, newService])
    setEditingService(newService)
  toast.success(t('services.service_created'))
  }

  const handleUpdateService = (updatedService: Partial<Service>) => {
    if (!editingService) return
    
    const updated = {
      ...editingService,
      ...updatedService,
      updated_at: new Date().toISOString()
    }
    
    setServices(services.map(svc => 
      svc.id === editingService.id ? updated : svc
    ))
    setEditingService(updated)
  toast.success(t('services.service_updated'))
  }

  const handleDeleteService = (serviceId: string) => {
    setServices(services.filter(svc => svc.id !== serviceId))
    if (editingService?.id === serviceId) {
      setEditingService(null)
    }
  toast.success(t('services.service_deleted'))
  }

  if (!business) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('business.management.configure_title')}</h3>
          <p className="text-muted-foreground mb-4">
            {t('business.management.configure_description')}
          </p>
          <Button onClick={initializeBusiness}>
            <Plus className="h-4 w-4 mr-2" />
            {t('business.management.create_business')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('business.management.title')}</h1>
          <p className="text-muted-foreground">{t('business.management.subtitle')}</p>
        </div>
      </div>

      <Tabs defaultValue="business" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="business">{t('nav.business')}</TabsTrigger>
          <TabsTrigger value="locations">{t('locations.title')}</TabsTrigger>
          <TabsTrigger value="services">{t('services.title')}</TabsTrigger>
          <TabsTrigger value="settings">{t('settings.title')}</TabsTrigger>
        </TabsList>

        {/* Business Information */}
        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                {t('business.registration.business_name')} & {t('business.registration.description')}
              </CardTitle>
              <CardDescription>
                {t('business.management.info_description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="business-name">{t('business.registration.business_name')}</Label>
                    <Input
                      id="business-name"
                      value={business.name}
                      onChange={(e) => handleBusinessUpdate({ name: e.target.value })}
                      placeholder={t('business.registration.placeholders.business_name')}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="business-description">{t('business.registration.description')}</Label>
                    <Textarea
                      id="business-description"
                      value={business.description || ''}
                      onChange={(e) => handleBusinessUpdate({ description: e.target.value })}
                      placeholder={t('business.registration.placeholders.description')}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="business-website">{t('business.registration.website')}</Label>
                    <Input
                      id="business-website"
                      value={business.website || ''}
                      onChange={(e) => handleBusinessUpdate({ website: e.target.value })}
                      placeholder={t('business.registration.placeholders.website')}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="business-phone">{t('business.registration.phone')}</Label>
                    <Input
                      id="business-phone"
                      value={business.phone || ''}
                      onChange={(e) => handleBusinessUpdate({ phone: e.target.value })}
                      placeholder={t('business.registration.placeholders.phone')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="business-email">{t('business.registration.email')}</Label>
                    <Input
                      id="business-email"
                      type="email"
                      value={business.email || ''}
                      onChange={(e) => handleBusinessUpdate({ email: e.target.value })}
                      placeholder={t('auth.emailPlaceholder')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="business-address">{t('business.registration.address')}</Label>
                    <Input
                      id="business-address"
                      value={business.address}
                      onChange={(e) => handleBusinessUpdate({ address: e.target.value })}
                      placeholder={t('business.registration.placeholders.address')}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="business-city">{t('business.registration.city')}</Label>
                  <Input
                    id="business-city"
                    value={business.city}
                    onChange={(e) => handleBusinessUpdate({ city: e.target.value })}
                    placeholder={t('business.registration.placeholders.city')}
                  />
                </div>
                
                <div>
                  <Label htmlFor="business-state">{t('locations.country') || 'State'}</Label>
                  <Input
                    id="business-state"
                    value={business.state}
                    onChange={(e) => handleBusinessUpdate({ state: e.target.value })}
                    placeholder={t('locations.country') || ''}
                  />
                </div>
                
                <div>
                  <Label htmlFor="business-postal">{t('business.registration.postal_code')}</Label>
                  <Input
                    id="business-postal"
                    value={business.postal_code}
                    onChange={(e) => handleBusinessUpdate({ postal_code: e.target.value })}
                    placeholder={t('business.registration.placeholders.postal_code')}
                  />
                </div>
              </div>

              {/* Business Hours */}
              <div>
                <Label className="text-base font-medium">{t('business.registration.business_hours')}</Label>
                <div className="mt-4 space-y-3">
      {Object.entries(business.business_hours).map(([day, hours]) => (
                    <div key={day} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Switch 
          checked={!hours.closed}
                          onCheckedChange={(checked) => {
                            handleBusinessUpdate({
                              business_hours: {
                                ...business.business_hours,
            [day]: { ...hours, closed: !checked }
                              }
                            })
                          }}
                        />
                        <div className="font-medium capitalize w-20">
                          {t(`business.registration.days.${day}`)}
                        </div>
                      </div>
                      
                      {!hours.closed ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={hours.open}
                            onChange={(e) => {
                              handleBusinessUpdate({
                                business_hours: {
                                  ...business.business_hours,
                                  [day]: { ...hours, open: e.target.value }
                                }
                              })
                            }}
                            className="w-32"
                          />
                          <span className="text-muted-foreground">a</span>
                          <Input
                            type="time"
                            value={hours.close}
                            onChange={(e) => {
                              handleBusinessUpdate({
                                business_hours: {
                                  ...business.business_hours,
                                  [day]: { ...hours, close: e.target.value }
                                }
                              })
                            }}
                            className="w-32"
                          />
                        </div>
                      ) : (
                        <Badge variant="secondary">{t('business.hours.closed')}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Locations */}
        <TabsContent value="locations" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{t('locations.title')}</h2>
              <p className="text-muted-foreground">{t('locations.location_details')}</p>
            </div>
            <Button onClick={handleAddLocation}>
              <Plus className="h-4 w-4 mr-2" />
              {t('locations.new_location')}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Locations List */}
            <Card>
              <CardHeader>
                <CardTitle>{t('locations.title')}</CardTitle>
                <CardDescription>
                  {locations.length} {locations.length === 1 ? t('locations.main_location') : t('locations.title')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {locations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{t('locations.no_locations')}</p>
                      <p className="text-sm">{t('locations.new_location')}</p>
                    </div>
                  ) : (
                    locations.map((location) => (
                      <button 
                        key={location.id} 
                        className={`text-left p-3 border rounded-lg transition-colors ${
                          editingLocation?.id === location.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setEditingLocation(location)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-primary" />
                            <div>
                              <div className="font-medium">{location.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {location.city}, {location.state}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant={location.is_active ? "default" : "secondary"}>
                              {location.is_active ? t('locations.active') : t('common.disabled') || 'Inactive'}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteLocation(location.id)
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Location Editor */}
            {editingLocation && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('locations.edit_location')}</CardTitle>
                  <CardDescription>{t('locations.location_details')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="location-name">{t('locations.name')}</Label>
                    <Input
                      id="location-name"
                      value={editingLocation.name}
                      onChange={(e) => handleUpdateLocation({ name: e.target.value })}
                      placeholder={t('locations.main_location')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="location-address">{t('locations.address')}</Label>
                    <Input
                      id="location-address"
                      value={editingLocation.address}
                      onChange={(e) => handleUpdateLocation({ address: e.target.value })}
                      placeholder={t('business.registration.placeholders.address')}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location-city">{t('locations.city')}</Label>
                      <Input
                        id="location-city"
                        value={editingLocation.city}
                        onChange={(e) => handleUpdateLocation({ city: e.target.value })}
                        placeholder={t('business.registration.placeholders.city')}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="location-state">{t('locations.country')}</Label>
                      <Input
                        id="location-state"
                        value={editingLocation.state}
                        onChange={(e) => handleUpdateLocation({ state: e.target.value })}
                        placeholder={t('locations.country')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location-phone">{t('locations.phone')}</Label>
                      <Input
                        id="location-phone"
                        value={editingLocation.phone || ''}
                        onChange={(e) => handleUpdateLocation({ phone: e.target.value })}
                        placeholder={t('business.registration.placeholders.phone')}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="location-email">{t('locations.email')}</Label>
                      <Input
                        id="location-email"
                        type="email"
                        value={editingLocation.email || ''}
                        onChange={(e) => handleUpdateLocation({ email: e.target.value })}
                        placeholder={t('auth.emailPlaceholder')}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="location-active"
                      checked={editingLocation.is_active}
                      onCheckedChange={(checked) => handleUpdateLocation({ is_active: checked })}
                    />
                    <Label htmlFor="location-active">{t('locations.active')}</Label>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Services */}
        <TabsContent value="services" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{t('services.title')}</h2>
              <p className="text-muted-foreground">{t('services.service_details')}</p>
            </div>
            <Button onClick={handleAddService}>
              <Plus className="h-4 w-4 mr-2" />
              {t('services.new_service')}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Services List */}
            <Card>
              <CardHeader>
                <CardTitle>{t('services.title')}</CardTitle>
                <CardDescription>
                  {services.length} {services.length === 1 ? t('services.new_service') : t('services.title')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {services.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>{t('services.no_services')}</p>
                      <p className="text-sm">{t('services.new_service')}</p>
                    </div>
                  ) : (
                    services.map((service) => (
                      <button 
                        key={service.id} 
                        className={`text-left p-3 border rounded-lg transition-colors ${
                          editingService?.id === service.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setEditingService(service)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Star className="h-5 w-5 text-primary" />
                            <div>
                              <div className="font-medium">{service.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {service.duration} min • ${service.price} {service.currency}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant={service.is_active ? "default" : "secondary"}>
                              {service.is_active ? t('services.active') : t('common.disabled') || 'Inactive'}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteService(service.id)
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Service Editor */}
            {editingService && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('services.edit_service')}</CardTitle>
                  <CardDescription>{t('services.service_details')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="service-name">{t('services.name')}</Label>
                    <Input
                      id="service-name"
                      value={editingService.name}
                      onChange={(e) => handleUpdateService({ name: e.target.value })}
                      placeholder={t('services.service_name') || ''}
                    />
                  </div>

                  <div>
                    <Label htmlFor="service-description">{t('services.description')}</Label>
                    <Textarea
                      id="service-description"
                      value={editingService.description || ''}
                      onChange={(e) => handleUpdateService({ description: e.target.value })}
                      placeholder={t('business.registration.placeholders.service_description')}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="service-duration">{t('services.duration')} ({t('services.minutes')})</Label>
                      <Input
                        id="service-duration"
                        type="number"
                        value={editingService.duration}
                        onChange={(e) => handleUpdateService({ duration: parseInt(e.target.value) || 0 })}
                        min="5"
                        step="5"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="service-price">{t('services.price')}</Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                          $
                        </span>
                        <Input
                          id="service-price"
                          type="number"
                          value={editingService.price}
                          onChange={(e) => handleUpdateService({ price: parseFloat(e.target.value) || 0 })}
                          min="0"
                          step="1000"
                          className="rounded-l-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="service-category">{t('services.category')}</Label>
                    <Input
                      id="service-category"
                      value={editingService.category || ''}
                      onChange={(e) => handleUpdateService({ category: e.target.value })}
                      placeholder={t('business.registration.placeholders.service_category')}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="service-active"
                      checked={editingService.is_active}
                      onCheckedChange={(checked) => handleUpdateService({ is_active: checked })}
                    />
                    <Label htmlFor="service-active">{t('services.active')}</Label>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Business Settings */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t('business.management.settings_title')}
              </CardTitle>
              <CardDescription>
                {t('business.management.settings_description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="default-duration">{t('services.duration')} ({t('services.minutes')})</Label>
                  <Input
                    id="default-duration"
                    type="number"
                    value={business.settings.appointment_buffer}
                    onChange={(e) => handleBusinessUpdate({
                      settings: {
                        ...business.settings,
                        appointment_buffer: parseInt(e.target.value) || 0
                      }
                    })}
                    min="15"
                    step="15"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('appointments.duration')}
                  </p>
                </div>

                <div>
                  <Label htmlFor="booking-advance">{t('reports.period_selection')}</Label>
                  <Input
                    id="booking-advance"
                    type="number"
                    value={business.settings.advance_booking_days}
                    onChange={(e) => handleBusinessUpdate({
                      settings: {
                        ...business.settings,
                        advance_booking_days: parseInt(e.target.value) || 30
                      }
                    })}
                    min="1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('calendar.book_appointment')}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="cancellation-policy">{t('appointments.cancel_appointment')}</Label>
                <Input
                  id="cancellation-policy"
                  type="number"
                  value={business.settings.cancellation_policy}
                  onChange={(e) => handleBusinessUpdate({
                    settings: {
                      ...business.settings,
                      cancellation_policy: parseInt(e.target.value) || 24
                    }
                  })}
                  placeholder={t('appointments.cancel_appointment')}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-confirm"
                  checked={business.settings.auto_confirm}
                  onCheckedChange={(checked) => handleBusinessUpdate({
                    settings: {
                      ...business.settings,
                      auto_confirm: checked
                    }
                  })}
                />
                <Label htmlFor="auto-confirm">{t('appointments.confirmed')}</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}