import React, { useCallback, useEffect, useState } from 'react'
import { AlertCircle, ArrowRightLeft, Check, MapPin } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LocationTransferModal } from './LocationTransferModal'
import { TransferStatusBadge } from './TransferStatusBadge'
import supabase from '@/lib/supabase'
import { toast } from 'sonner'

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
  is_primary: boolean
  images?: string[]
  business_hours?: Record<string, { open: string; close: string; closed: boolean }>
  is_assigned?: boolean
}

interface LocationSelectorProps {
  readonly businessId: string
  readonly employeeId: string
  readonly currentLocationId?: string | null
  readonly onLocationChanged?: () => void
}

export function LocationSelector({
  businessId,
  employeeId,
  currentLocationId,
  onLocationChanged,
}: LocationSelectorProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [transferTargetLocationId, setTransferTargetLocationId] = useState<string | null>(null)
  const [transferTargetLocationName, setTransferTargetLocationName] = useState<string | null>(null)
  const [transferStatus, setTransferStatus] = useState<{
    status: string | null
    toLocationId: string | null
    toLocationName: string | null
    effectiveDate: string | null
  }>({ status: null, toLocationId: null, toLocationName: null, effectiveDate: null })

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .order('name')

      if (error) throw error

      // Marcar la sede asignada
      const locationsWithAssignment =
        data?.map(loc => ({
          ...loc,
          is_assigned: loc.id === currentLocationId,
        })) || []

      setLocations(locationsWithAssignment)
    } catch {
      toast.error('Error al cargar las sedes')
    } finally {
      setLoading(false)
    }
  }, [businessId, currentLocationId])

  const fetchTransferStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('business_employees')
        .select(
          `
          transfer_status,
          transfer_to_location_id,
          transfer_effective_date,
          locations!business_employees_transfer_to_location_id_fkey (name)
        `
        )
        .eq('employee_id', employeeId)
        .eq('business_id', businessId)
        .single()

      if (!error && data) {
        const locationData = data.locations as unknown as { name: string } | null
        setTransferStatus({
          status: data.transfer_status,
          toLocationId: data.transfer_to_location_id,
          toLocationName: locationData?.name || null,
          effectiveDate: data.transfer_effective_date,
        })
      }
    } catch {
      // Silently fail - transfer status is optional
    }
  }, [businessId, employeeId])

  useEffect(() => {
    fetchLocations()
    fetchTransferStatus()
  }, [fetchLocations, fetchTransferStatus])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (locations.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Este negocio no tiene sedes configuradas. Contacta al administrador.
        </AlertDescription>
      </Alert>
    )
  }

  // Función para formatear horarios
  const formatBusinessHours = (
    hours: Record<string, { open: string; close: string; closed: boolean }> | string
  ): React.ReactNode => {
    if (!hours) return null

    if (typeof hours === 'string') {
      return hours
    }

    // Si es un objeto JSON con días de la semana
    if (typeof hours === 'object') {
      const daysOrder = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ]
      const daysSpanish: Record<string, string> = {
        monday: 'Lunes',
        tuesday: 'Martes',
        wednesday: 'Miércoles',
        thursday: 'Jueves',
        friday: 'Viernes',
        saturday: 'Sábado',
        sunday: 'Domingo',
      }

      return (
        <div className="space-y-1 text-sm">
          {daysOrder.map(day => {
            const dayData = hours[day]
            if (!dayData) return null

            const isClosed = dayData.closed === true
            const openTime = dayData.open
            const closeTime = dayData.close

            return (
              <div key={day} className="flex justify-between items-center">
                <span className="text-muted-foreground w-20">{daysSpanish[day]}</span>
                <span className="text-foreground font-medium">
                  {isClosed ? (
                    <span className="text-muted-foreground italic">Cerrado</span>
                  ) : (
                    `${openTime} - ${closeTime}`
                  )}
                </span>
              </div>
            )
          })}
        </div>
      )
    }

    return null
  }

  return (
    <div className="space-y-4">
      {!currentLocationId && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No tienes una sede de trabajo asignada. Selecciona una sede para comenzar a ofrecer
            servicios.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4">
        {locations.map(location => (
          <Card key={location.id} className={location.is_assigned ? 'border-primary border-2' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{location.name}</CardTitle>
                  {location.is_primary && (
                    <Badge variant="secondary" className="text-xs">
                      Principal
                    </Badge>
                  )}
                  {location.is_assigned && (
                    <Badge variant="default" className="text-xs bg-primary">
                      <Check className="h-3 w-3 mr-1" />
                      Tu Sede
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Dirección */}
              {(location.address || location.city || location.state) && (
                <div className="text-sm space-y-1">
                  <p className="font-medium text-muted-foreground">Dirección</p>
                  <p className="text-foreground">
                    {[location.address, location.city, location.state, location.country]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  {location.postal_code && (
                    <p className="text-muted-foreground">CP: {location.postal_code}</p>
                  )}
                </div>
              )}

              {/* Contacto */}
              {(location.phone || location.email) && (
                <div className="text-sm space-y-1">
                  <p className="font-medium text-muted-foreground">Contacto</p>
                  {location.phone && <p className="text-foreground">📞 {location.phone}</p>}
                  {location.email && <p className="text-foreground">📧 {location.email}</p>}
                </div>
              )}

              {/* Horarios */}
              {location.business_hours && (
                <div className="text-sm space-y-1">
                  <p className="font-medium text-muted-foreground">Horarios</p>
                  <div className="text-foreground text-xs">
                    {formatBusinessHours(location.business_hours)}
                  </div>
                </div>
              )}

              {/* Fotos */}
              {location.images && location.images.length > 0 && (
                <div>
                  <p className="font-medium text-muted-foreground text-sm mb-2">Fotos</p>
                  <div className="grid grid-cols-3 gap-2">
                    {location.images.slice(0, 6).map(imageUrl => (
                      <img
                        key={imageUrl}
                        src={imageUrl}
                        alt={`${location.name}`}
                        className="w-full h-24 object-cover rounded-md"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Botón Seleccionar - Abre modal de traslado */}
              {!location.is_assigned && (
                <div className="pt-3 border-t">
                  <Button
                    onClick={() => {
                      setTransferTargetLocationId(location.id)
                      setTransferTargetLocationName(location.name)
                      setTransferModalOpen(true)
                    }}
                    className="w-full"
                    variant="outline"
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Seleccionar Sede de Trabajo
                  </Button>
                </div>
              )}

              {/* Botón Programar Traslado */}
              {location.is_assigned && (
                <div className="pt-3 border-t flex gap-2">
                  <Button
                    onClick={() => setTransferModalOpen(true)}
                    variant="secondary"
                    className="w-full"
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Programar Traslado
                  </Button>
                </div>
              )}

              {/* Badge de traslado programado */}
              {location.is_assigned && transferStatus.status === 'pending' && (
                <TransferStatusBadge
                  transferStatus={transferStatus.status as 'pending'}
                  effectiveDate={transferStatus.effectiveDate}
                  toLocationName={transferStatus.toLocationName}
                  className="mt-2"
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Traslado */}
      {currentLocationId && (
        <LocationTransferModal
          open={transferModalOpen}
          onOpenChange={setTransferModalOpen}
          businessId={businessId}
          employeeId={employeeId}
          currentLocationId={currentLocationId}
          currentLocationName={
            locations.find(loc => loc.id === currentLocationId)?.name || 'Sede actual'
          }
          targetLocationId={transferTargetLocationId || undefined}
          targetLocationName={transferTargetLocationName || undefined}
          onTransferScheduled={() => {
            setTransferTargetLocationId(null)
            setTransferTargetLocationName(null)
            fetchLocations()
            fetchTransferStatus()
          }}
        />
      )}
    </div>
  )
}
