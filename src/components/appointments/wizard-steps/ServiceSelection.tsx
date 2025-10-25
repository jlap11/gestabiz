import React, { useCallback, useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Service } from '@/types/types'
import supabase from '@/lib/supabase'

interface ServiceSelectionProps {
  readonly businessId: string
  readonly selectedServiceId: string | null
  readonly onSelectService: (service: Service) => void
  readonly preloadedServices?: Service[] // Datos pre-cargados
  readonly isPreselected?: boolean // Nueva prop para indicar si fue preseleccionado desde perfil público
}

export function ServiceSelection({
  businessId,
  selectedServiceId,
  onSelectService,
  preloadedServices,
  isPreselected = false,
}: Readonly<ServiceSelectionProps>) {
  const { t } = useLanguage()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(!preloadedServices)

  const loadServices = useCallback(async () => {
    // Si ya tenemos datos pre-cargados, usarlos (MÁS RÁPIDO)
    if (preloadedServices) {
      setServices(preloadedServices)
      setLoading(false)
      return
    }

    // Si no, hacer la consulta tradicional
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)

      if (error) throw error
      setServices((data as Service[]) || [])
    } catch {
      setServices([])
    } finally {
      setLoading(false)
    }
  }, [businessId, preloadedServices])

  useEffect(() => {
    loadServices()
  }, [loadServices])

  // Imágenes placeholder por tipo de servicio
  const getServiceImage = (serviceName: string): string => {
    const name = serviceName.toLowerCase()
    if (name.includes('hair') || name.includes('corte') || name.includes('cabello')) {
      return 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=400&fit=crop'
    }
    if (name.includes('manicure') || name.includes('nail') || name.includes('uña')) {
      return 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=400&fit=crop'
    }
    if (name.includes('massage') || name.includes('masaje')) {
      return 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=400&fit=crop'
    }
    if (name.includes('facial') || name.includes('cara')) {
      return 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=400&fit=crop'
    }
    if (name.includes('color') || name.includes('tinte')) {
      return 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=400&h=400&fit=crop'
    }
    if (name.includes('style') || name.includes('peinado')) {
      return 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&h=400&fit=crop'
    }
    // Default
    return 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop'
  }

  if (loading) {
    return (
      <section 
        role="status" 
        aria-live="polite" 
        aria-label="Cargando servicios disponibles"
        className="p-8 flex items-center justify-center"
      >
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#8b5cf6] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#94a3b8]">Loading services...</p>
          <span className="sr-only">Cargando lista de servicios disponibles</span>
        </div>
      </section>
    )
  }

  return (
    <section 
      role="region" 
      aria-labelledby="service-selection-title"
      className="p-6 max-w-[95vw] mx-auto"
    >
      <h3 
        id="service-selection-title"
        className="text-xl font-semibold text-foreground mb-6"
      >
        Select a Service
      </h3>

      <div 
        role="list"
        aria-label="Lista de servicios disponibles"
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      >
        {services.map(service => {
          const isSelected = selectedServiceId === service.id
          const wasPreselected = isPreselected && isSelected

          return (
            <Card
              key={service.id}
              role="listitem"
              onClick={() => onSelectService(service)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectService(service)
                }
              }}
              tabIndex={0}
              aria-label={`Servicio: ${service.name}, duración: ${service.duration} minutos${isSelected ? ', seleccionado' : ''}${wasPreselected ? ', preseleccionado' : ''}`}
              aria-pressed={isSelected}
              className={cn(
                'relative bg-card border-2 rounded-xl overflow-hidden',
                'cursor-pointer transition-all duration-200',
                'hover:border-primary hover:scale-105 hover:shadow-lg hover:shadow-primary/20',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                'min-h-[44px] min-w-[44px]',
                isSelected ? 'border-primary bg-primary/10' : 'border-border',
                wasPreselected && 'ring-2 ring-green-500/50'
              )}
            >
              {/* Badge de preselección */}
              {wasPreselected && (
                <div className="absolute top-2 left-2 z-10">
                  <Badge className="bg-green-500 text-white text-xs shadow-lg">
                    <Check className="w-3 h-3 mr-1" aria-hidden="true" />
                    Preseleccionado
                  </Badge>
                </div>
              )}

              {/* Imagen fotográfica real del servicio */}
              <div className="aspect-square w-full relative">
                <img
                  src={getServiceImage(service.name)}
                  alt={`Imagen del servicio ${service.name}`}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />

                {/* Checkmark cuando está seleccionado */}
                {isSelected && (
                  <div
                    className={cn(
                      'absolute top-3 right-3 w-8 h-8 bg-primary rounded-full',
                      'flex items-center justify-center',
                      'animate-in zoom-in duration-200'
                    )}
                    aria-hidden="true"
                  >
                    <Check className="w-5 h-5 text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* Label debajo de la imagen */}
              <div className="p-3 text-center bg-muted/50">
                <h4 className="text-sm sm:text-base font-semibold text-foreground truncate">
                  {service.name}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {service.duration} min
                </p>
              </div>
            </Card>
          )
        })}
      </div>

      {services.length === 0 && (
        <section 
          role="region" 
          aria-labelledby="no-services-title"
          className="text-center py-12"
        >
          <h4 id="no-services-title" className="sr-only">
            No hay servicios disponibles
          </h4>
          <p className="text-[#94a3b8]">No services available</p>
        </section>
      )}
    </section>
  )
}