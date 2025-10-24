/**
 * Component: AbsenceApprovalCard
 * 
 * Card para que administradores aprueben/rechacen solicitudes de ausencia.
 * 
 * Features:
 * - Muestra información de la solicitud
 * - Indica citas que serán canceladas
 * - Botones de aprobar/rechazar con confirmación
 * - Campo opcional para notas del admin
 */

import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import type { AbsenceApproval } from '@/hooks/useAbsenceApprovals';

interface AbsenceApprovalCardProps {
  absence: AbsenceApproval;
  onApprove: (absenceId: string, notes?: string) => Promise<void>;
  onReject: (absenceId: string, notes?: string) => Promise<void>;
  loading?: boolean;
}

const absenceTypeLabels: Record<string, string> = {
  vacation: 'Vacaciones',
  emergency: 'Emergencia',
  sick_leave: 'Incapacidad',
  personal: 'Personal',
  other: 'Otro',
};

const absenceTypeColors: Record<string, string> = {
  vacation: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  emergency: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  sick_leave: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  personal: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

export function AbsenceApprovalCard({ absence, onApprove, onReject, loading }: Readonly<AbsenceApprovalCardProps>) {
  const { t } = useLanguage()
  const [showNotes, setShowNotes] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  const handleApprove = async () => {
    setActionType('approve');
    await onApprove(absence.id, adminNotes.trim() || undefined);
    setAdminNotes('');
    setShowNotes(false);
    setActionType(null);
  };

  const handleReject = async () => {
    setActionType('reject');
    await onReject(absence.id, adminNotes.trim() || undefined);
    setAdminNotes('');
    setShowNotes(false);
    setActionType(null);
  };

  const daysCount = differenceInDays(new Date(absence.endDate), new Date(absence.startDate)) + 1;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              {absence.employeeName}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{absence.employeeEmail}</p>
          </div>
          <Badge className={absenceTypeColors[absence.absenceType] || absenceTypeColors.other}>
            {absenceTypeLabels[absence.absenceType] || absence.absenceType}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Fechas */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>
            {format(new Date(absence.startDate), "d 'de' MMMM", { locale: es })} -{' '}
            {format(new Date(absence.endDate), "d 'de' MMMM, yyyy", { locale: es })}
          </span>
          <Badge variant="outline">{daysCount} día{daysCount !== 1 ? 's' : ''}</Badge>
        </div>

        {/* Solicitud */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Solicitado el {format(new Date(absence.createdAt), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
        </div>

        {/* Razón */}
        <div className="space-y-1">
          <Label className="text-sm font-medium">Razón</Label>
          <p className="text-sm bg-muted p-3 rounded-md">{absence.reason}</p>
        </div>

        {/* Notas del empleado */}
        {absence.employeeNotes && (
          <div className="space-y-1">
            <Label className="text-sm font-medium">Notas del Empleado</Label>
            <p className="text-sm bg-muted p-3 rounded-md italic">{absence.employeeNotes}</p>
          </div>
        )}

        {/* Citas afectadas */}
        {absence.affectedAppointmentsCount !== undefined && absence.affectedAppointmentsCount > 0 && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md border border-yellow-200 dark:border-yellow-800">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                {absence.affectedAppointmentsCount} cita{absence.affectedAppointmentsCount !== 1 ? 's' : ''} será{absence.affectedAppointmentsCount !== 1 ? 'n' : ''} cancelada{absence.affectedAppointmentsCount !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Los clientes recibirán notificación por email y en la app
              </p>
            </div>
          </div>
        )}

        {/* Campo de notas del admin */}
        {showNotes && (
          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor={`notes-${absence.id}`}>Notas para el Empleado (opcional)</Label>
            <Textarea
              id={`notes-${absence.id}`}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Comentarios adicionales..."
              rows={2}
            />
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-2 pt-2">
          {!showNotes ? (
            <>
              <Button
                onClick={() => setShowNotes(true)}
                variant="outline"
                className="flex-1"
                disabled={loading}
              >
                Agregar Nota
              </Button>
              <Button
                onClick={handleApprove}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {actionType === 'approve' && loading ? (
                  'Aprobando...'
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprobar
                  </>
                )}
              </Button>
              <Button
                onClick={handleReject}
                variant="destructive"
                className="flex-1"
                disabled={loading}
              >
                {actionType === 'reject' && loading ? (
                  'Rechazando...'
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Rechazar
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => setShowNotes(false)} variant="outline" disabled={loading}>
                Cancelar
              </Button>
              <Button
                onClick={handleApprove}
                className="flex-1 bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {actionType === 'approve' && loading ? (
                  'Aprobando...'
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprobar
                  </>
                )}
              </Button>
              <Button
                onClick={handleReject}
                variant="destructive"
                className="flex-1"
                disabled={loading}
              >
                {actionType === 'reject' && loading ? (
                  'Rechazando...'
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Rechazar
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
