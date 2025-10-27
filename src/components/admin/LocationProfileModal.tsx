import React, { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LocationAddress } from '@/components/ui/LocationAddress'
import { MapPin, Phone, Mail, Image as ImageIcon, Video as VideoIcon, Users, Star, Briefcase, Clock, DollarSign, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLocationEmployees } from '@/hooks/useLocationEmployees'
import { useLocationServices } from '@/hooks/useLocationServices'

import type { BusinessHours } from '@/components/ui/BusinessHoursPicker'

interface Location {
  id: string
  business_id: string
  name: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  phone?: string
  email?: string
  description?: string
  business_hours?: BusinessHours
  images?: string[]
  is_active: boolean
  is_primary?: boolean
  created_at: string
  updated_at: string
}

interface LocationProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  location: Location
  bannerUrl?: string
  primaryVideoUrl?: string
}

interface MediaRow {
  id: string
  location_id: string
  type: 'image' | 'video'
  url: string
  description: string | null
  is_banner: boolean
  is_primary: boolean
  created_at: string
}

export function LocationProfileModal({ open, onOpenChange, location, bannerUrl, primaryVideoUrl }: LocationProfileModalProps) {
  const [otherMedia, setOtherMedia] = useState<MediaRow[]>([])
  const [isLoadingMedia, setIsLoadingMedia] = useState(true)
  const [banner, setBanner] = useState<string | undefined>(bannerUrl)
  const [primaryVideo, setPrimaryVideo] = useState<string | undefined>(primaryVideoUrl)
  
  // Hook para obtener empleados de la sede
  const { employees, loading: loadingEmployees } = useLocationEmployees({
    locationId: location.id,
    businessId: location.business_id,
    enabled: open
  })

  // Hook para obtener servicios de la sede
  const { services: locationServices, loading: loadingServices } = useLocationServices(open ? location.id : undefined)

  useEffect(() => {
    const loadMedia = async () => {
      setIsLoadingMedia(true)
      try {
        const { data, error } = await supabase
          .from('location_media')
          .select('id, location_id, type, url, description, is_banner, is_primary, created_at')
          .eq('location_id', location.id)
        if (error) throw error
        const filtered = (data || []).filter((m) => !(m.is_banner || m.is_primary))
        setOtherMedia(filtered)
      } catch (err) {
        // swallow
      } finally {
        setIsLoadingMedia(false)
      }
    }
    if (open) loadMedia()
  }, [open, location.id])

  const images = useMemo(() => otherMedia.filter(m => m.type === 'image'), [otherMedia])
  const videos = useMemo(() => otherMedia.filter(m => m.type === 'video'), [otherMedia])

  useEffect(() => { setBanner(bannerUrl) }, [bannerUrl])
  useEffect(() => { setPrimaryVideo(primaryVideoUrl) }, [primaryVideoUrl])

  useEffect(() => {
    if (!open) return
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('location_media')
          .select('type, url, is_banner, is_primary')
          .eq('location_id', location.id)
        if (error) return
        const b = (data || []).find(m => m.is_banner && m.type === 'image')?.url
        const v = (data || []).find(m => m.is_primary && m.type === 'video')?.url
        if (b) setBanner(b)
        if (v) setPrimaryVideo(v)
      } catch {}
    })()
  }, [open, location.id])


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Perfil de {location.name}</DialogTitle>
        </DialogHeader>
        
        {/* Close Button - positioned over content */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-50 bg-white/90 hover:bg-white text-gray-800 hover:text-gray-900 rounded-full shadow-md"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </Button>
        
        {/* Hero Banner */}
        <div className="relative h-56 sm:h-72 flex-shrink-0">
          {banner ? (
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${banner})` }} />
          ) : (
            <div className="absolute inset-0 bg-muted" />
          )}
          <div className="absolute inset-0 bg-black/40" />
          {/* Gradiente en la parte inferior para mejorar legibilidad */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="relative z-10 p-4 sm:p-6 flex items-end h-full">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-bold text-white">{location.name}</h3>
                {location.is_primary && (
                  <Badge variant="default" className="bg-yellow-500 text-white">Principal</Badge>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2 text-white/90 text-xs sm:text-sm">
                <MapPin className="h-4 w-4" />
                <LocationAddress
                  address={location.address}
                  cityId={location.city}
                  stateId={location.state}
                  postalCode={location.postal_code}
                  className="text-white/90"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* Tabs for Multimedia/Professionals/Services */}
          <Tabs defaultValue="multimedia" className="w-full">
            <TabsList>
              <TabsTrigger value="multimedia" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" /> Multimedia
              </TabsTrigger>
              <TabsTrigger value="professionals" className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Profesionales ({employees.length})
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> Servicios ({locationServices.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="multimedia" className="mt-4">
              <div className="space-y-6">
                {/* Video principal primero */}
                {primaryVideo && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Video principal</h4>
                    <video src={primaryVideo} className="w-full max-h-96 rounded-lg" controls />
                  </div>
                )}
                
                {/* Otras imágenes */}
                {images.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Otras fotos ({images.length})</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {images.map((img) => (
                        <div key={img.id} className="space-y-1">
                          <img src={img.url} alt="foto" className="w-full h-28 object-cover rounded" />
                          {img.description && (
                            <p className="text-xs text-muted-foreground">{img.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Otros videos */}
                {videos.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground">Otros videos ({videos.length})</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {videos.map((vid) => (
                        <div key={vid.id} className="space-y-1">
                          <video src={vid.url} className="w-full h-40 rounded" controls />
                          {vid.description && (
                            <p className="text-xs text-muted-foreground">{vid.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Mensaje cuando no hay multimedia */}
                {!primaryVideo && images.length === 0 && videos.length === 0 && (
                  <Card>
                    <CardContent className="p-6 text-muted-foreground text-center">
                      No hay multimedia disponible para esta sede
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            <TabsContent value="professionals" className="mt-4">
              {loadingEmployees ? (
                <Card>
                  <CardContent className="p-6 text-muted-foreground">
                    Cargando profesionales...
                  </CardContent>
                </Card>
              ) : employees.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-muted-foreground">
                    No hay profesionales asignados a esta sede
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {employees.map((employee) => (
                    <Card key={employee.employee_id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={employee.avatar_url || undefined} />
                            <AvatarFallback>
                              {employee.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{employee.full_name}</h4>
                                <p className="text-sm text-muted-foreground">{employee.email}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {employee.role === 'manager' && (
                                  <Badge variant="default">Administrador</Badge>
                                )}
                                {employee.offers_services && (
                                  <Badge variant="secondary">Ofrece servicios</Badge>
                                )}
                              </div>
                            </div>
                            {employee.job_title && (
                              <p className="text-sm text-muted-foreground">{employee.job_title}</p>
                            )}
                            {employee.services.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Servicios ({employee.services_count}):</p>
                                <div className="flex flex-wrap gap-2">
                                  {employee.services.map((service) => (
                                    <div key={service.service_id} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                                      <span>{service.service_name}</span>
                                      <div className="flex items-center gap-1">
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        <span>{service.expertise_level}/5</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="services" className="mt-4">
              {loadingServices ? (
                <Card>
                  <CardContent className="p-6 text-muted-foreground">
                    Cargando servicios...
                  </CardContent>
                </Card>
              ) : locationServices.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-muted-foreground">
                    No hay servicios específicos asignados a esta sede
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {locationServices.map((locationService) => (
                    <Card key={locationService.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-lg">{locationService.service?.name}</h4>
                              {locationService.service?.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {locationService.service.description}
                                </p>
                              )}
                            </div>
                            <Badge variant={locationService.is_active ? "default" : "secondary"}>
                              {locationService.is_active ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{locationService.service?.duration_minutes || 0} min</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span>
                                ${locationService.service?.price || 0} {locationService.service?.currency || 'COP'}
                              </span>
                            </div>
                          </div>

                          {locationService.service?.category && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {locationService.service.category}
                              </Badge>
                            </div>
                          )}

                          {locationService.notes && (
                            <div className="mt-2 p-2 bg-muted rounded text-xs">
                              <strong>Notas:</strong> {locationService.notes}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Contact Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {location.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{location.phone}</span>
              </div>
            )}
            {location.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{location.email}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

