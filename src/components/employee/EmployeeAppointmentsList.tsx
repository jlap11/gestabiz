import React, { useState } from 'react'
import { Clock, MapPin, User, Phone, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface AppointmentWithRelations {
  id: string
  business_id: string
  location_id?: string
  service_id?: string
  client_id: string
  employee_id?: string
  start_time: string
  end_time: string
  status: 'pending' | 'pending_confirmation' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  notes?: string
  price?: number
  currency?: string
  client_name?: string
  client_phone?: string
  client_email?: string
  service_name?: string
  location_name?: string
  location_address?: string
}

interface EmployeeAppointmentsListProps {
  appointments: AppointmentWithRelations[]
  onRefresh?: () => void
}

export function EmployeeAppointmentsList({ appointments, onRefresh }: EmployeeAppointmentsListProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRelations | null>(null)

  // Get status badge variant
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'confirmed':
        return 'default'
      case 'pending_confirmation':
      case 'pending':
        return 'outline'
      case 'completed':
        return 'secondary'
      case 'cancelled':
      case 'no_show':
        return 'destructive'
      case 'in_progress':
        return 'default'
      default:
        return 'secondary'
    }
  }

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      pending_confirmation: 'Por Confirmar',
      confirmed: 'Confirmada',
      in_progress: 'En Proceso',
      completed: 'Completada',
      cancelled: 'Cancelada',
      no_show: 'No Asistio'
    }
    return labels[status] || status
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
      case 'no_show':
        return <XCircle className="h-4 w-4" />
      case 'pending':
      case 'pending_confirmation':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  // Agrupar citas por fecha
  const groupedAppointments = React.useMemo(() => {
    const groups: Record<string, AppointmentWithRelations[]> = {}
    
    appointments.forEach(apt => {
      const date = format(new Date(apt.start_time), 'yyyy-MM-dd')
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(apt)
    })

    // Ordenar fechas (más recientes primero)
    return Object.entries(groups).sort(([dateA], [dateB]) => 
      new Date(dateB).getTime() - new Date(dateA).getTime()
    )
  }, [appointments])

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm', { locale: es })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'Hoy'
    }
    if (format(date, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd')) {
      return 'Mañana'
    }
    return format(date, "EEEE, d 'de' MMMM", { locale: es })
  }

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay citas</h3>
          <p className="text-muted-foreground">
            No tienes citas asignadas en este momento.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {groupedAppointments.map(([date, dateAppointments]) => (
          <div key={date} className="space-y-3">
            {/* Date Header */}
            <div className="flex items-center gap-2 px-2">
              <div className="h-px flex-1 bg-border" />
              <h3 className="text-sm font-semibold text-muted-foreground capitalize">
                {formatDate(date)}
              </h3>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Appointments for this date */}
            <div className="space-y-3">
              {dateAppointments
                .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
                .map(appointment => (
                  <Card
                    key={appointment.id}
                    className={cn(
                      "cursor-pointer hover:shadow-md transition-all hover:border-primary/50",
                      appointment.status === 'cancelled' && "opacity-60"
                    )}
                    onClick={() => setSelectedAppointment(appointment)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Time */}
                        <div className="flex flex-col items-center justify-center min-w-[80px] text-center">
                          <Clock className="h-5 w-5 text-muted-foreground mb-1" />
                          <div className="font-semibold text-sm">
                            {formatTime(appointment.start_time)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatTime(appointment.end_time)}
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="h-auto w-px bg-border" />

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="font-semibold truncate">
                                {appointment.client_name || 'Cliente sin nombre'}
                              </span>
                            </div>
                            <Badge variant={getStatusVariant(appointment.status)} className="flex-shrink-0">
                              <span className="mr-1">{getStatusIcon(appointment.status)}</span>
                              {getStatusLabel(appointment.status)}
                            </Badge>
                          </div>

                          {/* Service */}
                          {appointment.service_name && (
                            <div className="flex items-center gap-2 text-sm">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{appointment.service_name}</span>
                              {appointment.price && (
                                <span className="font-semibold text-primary">
                                  {new Intl.NumberFormat('es-CO', {
                                    style: 'currency',
                                    currency: appointment.currency || 'COP',
                                    minimumFractionDigits: 0
                                  }).format(appointment.price)}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Location */}
                          {appointment.location_name && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span className="truncate">{appointment.location_name}</span>
                            </div>
                          )}

                          {/* Contact */}
                          {appointment.client_phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              <span>{appointment.client_phone}</span>
                            </div>
                          )}

                          {/* Notes preview */}
                          {appointment.notes && (
                            <div className="text-xs text-muted-foreground italic truncate">
                              {appointment.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Appointment Detail Modal */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalles de la Cita</DialogTitle>
            <DialogDescription>
              Información completa de la cita
            </DialogDescription>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Estado:</span>
                <Badge variant={getStatusVariant(selectedAppointment.status)}>
                  {getStatusIcon(selectedAppointment.status)}
                  <span className="ml-1">{getStatusLabel(selectedAppointment.status)}</span>
                </Badge>
              </div>

              {/* Date & Time */}
              <div>
                <span className="text-sm font-medium block mb-1">Fecha y Hora:</span>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(selectedAppointment.start_time), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                </div>
                <div className="text-sm font-semibold">
                  {formatTime(selectedAppointment.start_time)} - {formatTime(selectedAppointment.end_time)}
                </div>
              </div>

              {/* Client */}
              <div>
                <span className="text-sm font-medium block mb-2">Cliente:</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedAppointment.client_name}</span>
                  </div>
                  {selectedAppointment.client_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedAppointment.client_phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Service */}
              {selectedAppointment.service_name && (
                <div>
                  <span className="text-sm font-medium block mb-1">Servicio:</span>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{selectedAppointment.service_name}</span>
                    {selectedAppointment.price && (
                      <span className="font-semibold text-primary">
                        {new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: selectedAppointment.currency || 'COP',
                          minimumFractionDigits: 0
                        }).format(selectedAppointment.price)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Location */}
              {selectedAppointment.location_name && (
                <div>
                  <span className="text-sm font-medium block mb-1">Ubicación:</span>
                  <div className="text-sm text-muted-foreground">
                    <div>{selectedAppointment.location_name}</div>
                    {selectedAppointment.location_address && (
                      <div className="text-xs mt-1">{selectedAppointment.location_address}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedAppointment.notes && (
                <div>
                  <span className="text-sm font-medium block mb-1">Notas:</span>
                  <p className="text-sm text-muted-foreground">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
