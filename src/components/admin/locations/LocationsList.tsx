import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  Phone, 
  EnvelopeSimple as Mail, 
  PencilSimple as Edit, 
  Trash,
  Star
} from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Location } from '@/types'

interface LocationsListProps {
  locations: Location[]
  onEdit: (location: Location) => void
  onDelete: (locationId: string) => void
}

export function LocationsList({ locations, onEdit, onDelete }: LocationsListProps) {
  const { t } = useLanguage()

  if (locations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MapPin className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            {t('locations.no_locations')}
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            {t('admin.locationManagement.noLocationsDescription')}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {locations.map(location => (
        <Card key={location.id} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base truncate">{location.name}</CardTitle>
                  {location.is_primary && (
                    <Badge variant="default" className="text-xs mt-1">
                      <Star className="h-3 w-3 mr-1" />
                      {t('admin.locationManagement.primary')}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(location)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(location.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {/* Dirección */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {t('admin.locationManagement.address')}
              </p>
              <p className="text-sm">{location.address}</p>
              <p className="text-sm text-muted-foreground">
                {location.city}, {location.state} {location.postal_code}
              </p>
              <p className="text-sm text-muted-foreground">{location.country}</p>
            </div>

            {/* Contacto */}
            {(location.phone || location.email) && (
              <div className="space-y-2">
                {location.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{location.phone}</span>
                  </div>
                )}
                {location.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{location.email}</span>
                  </div>
                )}
              </div>
            )}

            {/* Estado */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Badge variant={location.is_active ? 'default' : 'secondary'}>
                {location.is_active ? t('locations.active') : t('common.disabled')}
              </Badge>
              
              <div className="text-xs text-muted-foreground">
                {t('common.created')}: {new Date(location.created_at).toLocaleDateString()}
              </div>
            </div>

            {/* Horarios resumidos */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {t('business.registration.business_hours')}
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                {Object.entries(location.business_hours || {}).map(([day, hours]: [string, any]) => (
                  <div key={day} className="flex justify-between">
                    <span className="capitalize">{t(`business.registration.days.${day}`)}</span>
                    <span>
                      {hours.is_open ? `${hours.open} - ${hours.close}` : t('business.hours.closed')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}