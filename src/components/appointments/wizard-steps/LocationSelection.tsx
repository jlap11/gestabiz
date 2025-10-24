import React, { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Building2, Check, Loader2, Mail, MapPin, Phone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import supabase from '@/lib/supabase'
import { toast } from 'sonner'
import type { Location } from '@/types/types'

interface LocationSelectionProps {
  businessId: string
  selectedLocationId: string | null
  onSelectLocation: (location: Location) => void
  preloadedLocations?: Location[] // Datos pre-cargados para evitar consultas lentas
  isPreselected?: boolean // Nueva prop para indicar si fue preseleccionado
}

export function LocationSelection({
  businessId,
  selectedLocationId,
  onSelectLocation,
  preloadedLocations,
  isPreselected = false,
}: Readonly<LocationSelectionProps>) {
  const { t } = useLanguage()
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(!preloadedLocations)

  useEffect(() => {
    // Si ya tenemos datos pre-cargados, usarlos directamente (MÁS RÁPIDO)
    if (preloadedLocations) {
      setLocations(preloadedLocations)
      setLoading(false)
      return
    }

    // Si no hay datos pre-cargados, hacer la consulta tradicional
    const fetchLocations = async () => {
      if (!businessId) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .eq('business_id', businessId)
          .eq('is_active', true)
          .order('name')

        if (error) {
          toast.error(`Error al cargar sedes: ${error.message}`)
          setLocations([])
          return
        }

        setLocations(data || [])
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error inesperado'
        toast.error(`Error: ${message}`)
        setLocations([])
      } finally {
        setLoading(false)
      }
    }

    fetchLocations()
  }, [businessId, preloadedLocations])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Cargando sedes...</span>
      </div>
    )
  }

  if (locations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-center">
          No hay sedes disponibles para este negocio.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground mb-2">Selecciona una Sede</h3>
        <p className="text-muted-foreground text-sm">Elige la ubicación donde deseas tu cita</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map(location => {
          const isSelected = selectedLocationId === location.id
          const wasPreselected = isPreselected && isSelected

          return (
            <button
              key={location.id}
              onClick={() => onSelectLocation(location)}
              className={cn(
                'relative group rounded-xl p-5 text-left transition-all duration-200 border-2',
                'hover:scale-[1.02] hover:shadow-xl',
                isSelected
                  ? 'bg-primary/20 border-primary shadow-lg shadow-primary/20'
                  : 'bg-muted/50 border-border hover:bg-muted hover:border-border/50',
                wasPreselected && 'ring-2 ring-green-500/50'
              )}
            >
              {/* Badge de preselección */}
              {wasPreselected && (
                <div className="absolute top-3 left-3 z-10">
                  <Badge className="bg-green-500 text-white text-xs shadow-lg">
                    <Check className="w-3 h-3 mr-1" />
                    Preseleccionado
                  </Badge>
                </div>
              )}

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-xs font-bold">✓</span>
                </div>
              )}

              {/* Location Icon */}
              <div
                className={cn(
                  'w-12 h-12 rounded-lg flex items-center justify-center mb-4',
                  selectedLocationId === location.id
                    ? 'bg-primary/30'
                    : 'bg-muted group-hover:bg-muted/80'
                )}
              >
                <MapPin
                  className={cn(
                    'h-6 w-6',
                    selectedLocationId === location.id ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
              </div>

              {/* Location Name */}
              <h4 className="text-lg font-semibold text-foreground mb-3">{location.name}</h4>

              {/* Location Details */}
              <div className="space-y-2 text-sm">
                {location.address && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">
                      {location.address}
                      {location.city && `, ${location.city}`}
                      {location.state && `, ${location.state}`}
                    </span>
                  </div>
                )}

                {location.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span>{location.phone}</span>
                  </div>
                )}

                {location.country && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{location.country}</span>
                  </div>
                )}
              </div>

              {/* Hover Effect Border */}
              <div
                className={cn(
                  'absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none',
                  'bg-gradient-to-br from-purple-500/10 to-transparent'
                )}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
