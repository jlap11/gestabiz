import { X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface AppointmentWithRelations {
  id: string;
  business_id: string;
  location_id?: string;
  service_id?: string;
  client_id: string;
  employee_id?: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'pending_confirmation' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  price?: number;
  currency?: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  service_name?: string;
  location_name?: string;
  location_address?: string;
}

interface EmployeeAppointmentModalProps {
  readonly appointment: AppointmentWithRelations;
  readonly onClose: () => void;
}

export function EmployeeAppointmentModal({ 
  appointment, 
  onClose 
}: EmployeeAppointmentModalProps) {
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'completed': return 'default';
      case 'cancelled': return 'destructive';
      case 'no_show': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'pending_confirmation': return 'Pendiente de confirmación';
      case 'confirmed': return 'Confirmada';
      case 'in_progress': return 'En progreso';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      case 'no_show': return 'No asistió';
      default: return status;
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalles de la Cita</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Estado */}
          <div>
            <div className="text-sm font-medium text-muted-foreground">Estado</div>
            <div className="mt-1">
              <Badge variant={getStatusBadgeVariant(appointment.status)}>
                {getStatusLabel(appointment.status)}
              </Badge>
            </div>
          </div>

          {/* Cliente */}
          <div>
            <div className="text-sm font-medium text-muted-foreground">Cliente</div>
            <p className="mt-1 text-sm font-medium text-foreground">
              {appointment.client_name || 'Cliente sin nombre'}
            </p>
            {appointment.client_email && (
              <p className="text-xs text-muted-foreground">{appointment.client_email}</p>
            )}
            {appointment.client_phone && (
              <p className="text-xs text-muted-foreground">{appointment.client_phone}</p>
            )}
          </div>

          {/* Servicio */}
          <div>
            <div className="text-sm font-medium text-muted-foreground">Servicio</div>
            <p className="mt-1 text-sm font-medium text-foreground">
              {appointment.service_name || 'Servicio no especificado'}
            </p>
          </div>

          {/* Fecha y Hora */}
          <div>
            <div className="text-sm font-medium text-muted-foreground">Fecha y Hora</div>
            <p className="mt-1 text-sm font-medium text-foreground">
              {format(new Date(appointment.start_time), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </p>
            <p className="text-sm text-muted-foreground">
              {format(new Date(appointment.start_time), 'HH:mm', { locale: es })} - {format(new Date(appointment.end_time), 'HH:mm', { locale: es })}
            </p>
          </div>

          {/* Ubicación */}
          {appointment.location_name && (
            <div>
              <div className="text-sm font-medium text-muted-foreground">Ubicación</div>
              <p className="mt-1 text-sm font-medium text-foreground">
                {appointment.location_name}
              </p>
              {appointment.location_address && (
                <p className="text-xs text-muted-foreground">{appointment.location_address}</p>
              )}
            </div>
          )}

          {/* Notas */}
          {appointment.notes && (
            <div>
              <div className="text-sm font-medium text-muted-foreground">Notas</div>
              <p className="mt-1 text-sm text-foreground">
                {appointment.notes}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
