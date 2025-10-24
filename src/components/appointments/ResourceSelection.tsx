import { Check, DollarSign, MapPin, Users } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useResourcesForService } from '@/hooks/useBusinessResources'
import type { BusinessResource } from '@/types/types'
import { cn } from '@/lib/utils'

/**
 * Selector de Recursos para AppointmentWizard
 * Alternativa a EmployeeSelection cuando resource_model='physical_resource'
 *
 * Fecha: 21 de Octubre de 2025
 * Parte del sistema de Modelo de Negocio Flexible
 */

interface ResourceSelectionProps {
  businessId: string
  serviceId: string
  locationId?: string
  selectedResourceId?: string
  onSelect: (resourceId: string) => void
}

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  room: 'Habitación',
  table: 'Mesa',
  court: 'Cancha',
  desk: 'Escritorio',
  equipment: 'Equipo',
  vehicle: 'Vehículo',
  space: 'Espacio',
  lane: 'Carril',
  field: 'Campo',
  station: 'Estación',
  parking_spot: 'Parqueadero',
  bed: 'Cama',
  studio: 'Estudio',
  meeting_room: 'Sala de Reuniones',
  other: 'Otro',
}

export function ResourceSelection({
  businessId,
  serviceId,
  locationId,
  selectedResourceId,
  onSelect,
}: Readonly<ResourceSelectionProps>) {
  const { t } = useLanguage()
  const { data: resources, isLoading } = useResourcesForService(businessId, serviceId, locationId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!resources?.length) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No hay recursos disponibles para este servicio.</p>
        {locationId && (
          <p className="text-sm text-muted-foreground mt-2">
            Intenta cambiar la ubicación seleccionada.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">Selecciona el recurso que deseas reservar</div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map(resource => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            isSelected={resource.id === selectedResourceId}
            onSelect={() => onSelect(resource.id)}
          />
        ))}
      </div>
    </div>
  )
}

interface ResourceCardProps {
  resource: BusinessResource
  isSelected: boolean
  onSelect: () => void
}

function ResourceCard({ resource, isSelected, onSelect }: Readonly<ResourceCardProps>) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-primary shadow-md'
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-base mb-1">{resource.name}</h3>
            <Badge variant="outline" className="text-xs">
              {RESOURCE_TYPE_LABELS[resource.resource_type]}
            </Badge>
          </div>
          {isSelected && (
            <div className="flex-shrink-0 ml-2">
              <div className="rounded-full bg-primary p-1">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
          )}
        </div>

        {resource.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{resource.description}</p>
        )}

        <div className="space-y-2">
          {resource.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{resource.location.name}</span>
            </div>
          )}

          {resource.capacity && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Capacidad: {resource.capacity}</span>
            </div>
          )}

          {resource.price_per_hour && (
            <div className="flex items-center gap-2 text-sm font-medium">
              <DollarSign className="h-4 w-4 text-primary" />
              <span>
                {new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: resource.currency || 'COP',
                  minimumFractionDigits: 0,
                }).format(resource.price_per_hour)}{' '}
                /hora
              </span>
            </div>
          )}
        </div>

        {resource.amenities && resource.amenities.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex flex-wrap gap-1">
              {resource.amenities.slice(0, 3).map(amenity => (
                <Badge key={amenity} variant="secondary" className="text-xs">
                  {amenity}
                </Badge>
              ))}
              {resource.amenities.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{resource.amenities.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {!resource.is_active && (
          <div className="mt-3">
            <Badge variant="destructive" className="text-xs">
              No disponible
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
