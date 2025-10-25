import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  CurrencyDollar,
  PencilSimple as Edit, 
  Trash,
  Star,
  MapPin
} from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Location, Service } from '@/types'

interface ServicesListProps {
  services: Service[]
  locations: Location[]
  onEdit: (service: Service) => void
  onDelete: (serviceId: string) => void
  getLocationServices: (locationId: string) => Service[]
  getGeneralServices: () => Service[]
}

export function ServicesList({ 
  services, 
  locations, 
  onEdit, 
  onDelete, 
  getLocationServices, 
  getGeneralServices 
}: ServicesListProps) {
  const { t } = useLanguage()

  if (services.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Star className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            {t('services.no_services')}
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            {t('admin.locationManagement.noServicesDescription')}
          </p>
        </CardContent>
      </Card>
    )
  }

  const generalServices = getGeneralServices()

  return (
    <div className="space-y-6">
      {/* Servicios generales */}
      {generalServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              {t('admin.locationManagement.generalServices')}
            </CardTitle>
            <CardDescription>
              {t('admin.locationManagement.generalServicesDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {generalServices.map(service => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Servicios por ubicación */}
      {locations.map(location => {
        const locationServices = getLocationServices(location.id)
        
        if (locationServices.length === 0) return null

        return (
          <Card key={location.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                {t('admin.locationManagement.servicesAt')} {location.name}
              </CardTitle>
              <CardDescription>
                {t('admin.locationManagement.locationSpecificServices')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {locationServices.map(service => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

interface ServiceCardProps {
  service: Service
  onEdit: (service: Service) => void
  onDelete: (serviceId: string) => void
}

function ServiceCard({ service, onEdit, onDelete }: ServiceCardProps) {
  const { t } = useLanguage()

  return (
    <div className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
      {/* Header con acciones */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h4 className="font-medium truncate">{service.name}</h4>
          {service.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {service.description}
            </p>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0 ml-2">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => onEdit(service)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(service.id)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Información del servicio */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-3 w-3 flex-shrink-0" />
          <span>{service.duration} {t('services.minutes')}</span>
        </div>
        <div className="flex items-center gap-1 font-medium">
          <CurrencyDollar className="h-3 w-3" />
          <span>{service.price.toFixed(2)} {service.currency}</span>
        </div>
      </div>

      {/* Categoría y estado */}
      <div className="flex items-center justify-between">
        {service.category && (
          <Badge variant="outline" className="text-xs">
            {service.category}
          </Badge>
        )}
        <Badge variant={service.is_active ? 'default' : 'secondary'} className="text-xs">
          {service.is_active ? t('services.active') : t('common.disabled')}
        </Badge>
      </div>
    </div>
  )
}