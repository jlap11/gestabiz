/**
 * Component: EmployeeAbsencesTab
 * 
 * Tab de ausencias en EmployeeDashboard para que empleados vean sus solicitudes.
 * Muestra solicitudes pendientes, aprobadas, rechazadas y canceladas.
 */

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEmployeeAbsences, type EmployeeAbsence } from '@/hooks/useEmployeeAbsences';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AbsenceCardProps {
  absence: EmployeeAbsence;
  canCancel?: boolean;
  onCancel?: (absenceId: string) => Promise<boolean>;
}

function AbsenceCard({ absence, canCancel = false, onCancel }: Readonly<AbsenceCardProps>) {
  const [cancelingId, setCancelingId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleCancel = async () => {
    if (onCancel && absence.id) {
      setIsLoading(true);
      try {
        await onCancel(absence.id);
        setCancelingId(null);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const startDate = parseISO(absence.startDate);
  const endDate = parseISO(absence.endDate);
  const daysCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const absenceTypeLabels: Record<string, string> = {
    vacation: 'Vacaciones',
    emergency: 'Emergencia',
    sick_leave: 'Ausencia Médica',
    personal: 'Permiso Personal',
    other: 'Otro',
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pendiente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Aprobada</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Rechazada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-foreground">{absenceTypeLabels[absence.absenceType] || absence.absenceType}</h3>
            {getStatusBadge(absence.status)}
          </div>
          <p className="text-sm text-muted-foreground">
            {format(startDate, 'dd MMMM yyyy', { locale: es })} - {format(endDate, 'dd MMMM yyyy', { locale: es })}
          </p>
          <p className="text-sm font-medium text-foreground mt-1">
            <strong>{daysCount} día{daysCount > 1 ? 's' : ''}</strong>
          </p>
        </div>

        {canCancel && (
          <AlertDialog open={cancelingId === absence.id} onOpenChange={(open) => setCancelingId(open ? absence.id : null)}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCancelingId(absence.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              disabled={isLoading}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancelar Solicitud</AlertDialogTitle>
                <AlertDialogDescription>
                  ¿Está seguro de que desea cancelar esta solicitud de ausencia?
                  Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleCancel}
                >
                  {isLoading ? 'Eliminando...' : 'Eliminar'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {absence.reason && (
        <div className="bg-muted/50 rounded p-2">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Razón:</p>
          <p className="text-sm text-foreground">{absence.reason}</p>
        </div>
      )}

      {absence.employeeNotes && (
        <div className="bg-blue-50 dark:bg-blue-950 rounded p-2">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Tus Notas:</p>
          <p className="text-sm text-blue-900 dark:text-blue-100">{absence.employeeNotes}</p>
        </div>
      )}

      {absence.adminNotes && (
        <div className="bg-amber-50 dark:bg-amber-950 rounded p-2">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">Notas del Administrador:</p>
          <p className="text-sm text-amber-900 dark:text-amber-100">{absence.adminNotes}</p>
        </div>
      )}

      {absence.status === 'approved' && absence.approvedAt && (
        <p className="text-xs text-green-600 dark:text-green-400">
          ✓ Aprobada el {format(parseISO(absence.approvedAt), 'dd/MM/yyyy HH:mm', { locale: es })}
        </p>
      )}
    </div>
  );
}

interface EmployeeAbsencesTabProps {
  businessId: string;
}

export function EmployeeAbsencesTab({ businessId }: Readonly<EmployeeAbsencesTabProps>) {
  const { absences, loading, cancelAbsence } = useEmployeeAbsences(businessId);

  const pendingAbsences = absences.filter(a => a.status === 'pending');
  const approvedAbsences = absences.filter(a => a.status === 'approved');
  const rejectedAbsences = absences.filter(a => a.status === 'rejected');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Mis Solicitudes de Ausencia</h2>
        <p className="text-muted-foreground mt-1">
          Visualiza el estado de tus solicitudes de vacaciones y ausencias
        </p>
      </div>

      {absences.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No tienes solicitudes de ausencia registradas</p>
          <p className="text-sm text-muted-foreground mt-1">
            Ve a tu página de empleado para solicitar una ausencia o vacación
          </p>
        </div>
      ) : (
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Pendientes ({pendingAbsences.length})</span>
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Aprobadas ({approvedAbsences.length})</span>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              <span>Rechazadas ({rejectedAbsences.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4 mt-4">
            {pendingAbsences.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No hay solicitudes pendientes</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pendingAbsences.map((absence) => (
                  <AbsenceCard key={absence.id} absence={absence} canCancel={true} onCancel={cancelAbsence} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4 mt-4">
            {approvedAbsences.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No tienes ausencias aprobadas</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {approvedAbsences.map((absence) => (
                  <AbsenceCard key={absence.id} absence={absence} canCancel={false} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4 mt-4">
            {rejectedAbsences.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No hay solicitudes rechazadas</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {rejectedAbsences.map((absence) => (
                  <AbsenceCard key={absence.id} absence={absence} canCancel={false} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
