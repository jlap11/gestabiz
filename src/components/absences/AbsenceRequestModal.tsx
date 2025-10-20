/**
 * Component: AbsenceRequestModal
 * 
 * Modal para que empleados soliciten ausencias/vacaciones.
 * 
 * Features:
 * - Formulario con validación
 * - Selector de tipo de ausencia
 * - DatePicker para rango de fechas
 * - Muestra balance de vacaciones disponibles
 * - Calcula días solicitados automáticamente
 * - Preview de citas afectadas
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useEmployeeAbsences } from '@/hooks/useEmployeeAbsences';
import { supabase } from '@/lib/supabase';

interface AbsenceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
}

type AbsenceType = 'vacation' | 'emergency' | 'sick_leave' | 'personal' | 'other';

const absenceTypeLabels: Record<AbsenceType, string> = {
  vacation: '🌴 Vacaciones',
  emergency: '🚨 Emergencia',
  sick_leave: '🤒 Incapacidad médica',
  personal: '👤 Asunto personal',
  other: '📋 Otro',
};

export function AbsenceRequestModal({ isOpen, onClose, businessId }: Readonly<AbsenceRequestModalProps>) {
  const { requestAbsence, vacationBalance, loading } = useEmployeeAbsences(businessId);

  const [absenceType, setAbsenceType] = useState<AbsenceType>('vacation');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [reason, setReason] = useState('');
  const [employeeNotes, setEmployeeNotes] = useState('');
  const [affectedAppointmentsCount, setAffectedAppointmentsCount] = useState(0);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // Calcular días solicitados
  const daysRequested = startDate && endDate
    ? Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  // Verificar si tiene balance suficiente para vacaciones
  const hasEnoughVacationDays = absenceType === 'vacation'
    ? vacationBalance && daysRequested <= vacationBalance.daysRemaining
    : true;

  // Cargar citas afectadas cuando cambien las fechas
  useEffect(() => {
    if (!startDate || !endDate || !businessId) return;

    const loadAffectedAppointments = async () => {
      setLoadingAppointments(true);
      try {
        const { count, error } = await supabase
          .from('appointments')
          .select('id', { count: 'exact', head: true })
          .eq('business_id', businessId)
          .gte('start_time', format(startDate, 'yyyy-MM-dd'))
          .lte('start_time', format(endDate, 'yyyy-MM-dd'))
          .neq('status', 'cancelled');

        if (!error) {
          setAffectedAppointmentsCount(count || 0);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Error loading appointments:', error);
      } finally {
        setLoadingAppointments(false);
      }
    };

    loadAffectedAppointments();
  }, [startDate, endDate, businessId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate || !reason.trim()) {
      return;
    }

    const success = await requestAbsence({
      absenceType,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      reason: reason.trim(),
      employeeNotes: employeeNotes.trim() || undefined,
    });

    if (success) {
      // Limpiar formulario
      setAbsenceType('vacation');
      setStartDate(undefined);
      setEndDate(undefined);
      setReason('');
      setEmployeeNotes('');
      setAffectedAppointmentsCount(0);
      onClose();
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitar Ausencia o Vacaciones</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Balance de vacaciones */}
          {vacationBalance && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">Balance de Vacaciones {vacationBalance.year}</p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {vacationBalance.daysRemaining} días disponibles de {vacationBalance.totalDaysAvailable}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{vacationBalance.daysRemaining}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">días libres</p>
                </div>
              </div>
              {vacationBalance.daysPending > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  {vacationBalance.daysPending} días pendientes de aprobación
                </p>
              )}
            </div>
          )}

          {/* Tipo de ausencia */}
          <div className="space-y-2">
            <Label htmlFor="absenceType">Tipo de Ausencia *</Label>
            <Select value={absenceType} onValueChange={(value) => setAbsenceType(value as AbsenceType)}>
              <SelectTrigger id="absenceType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(absenceTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha de Inicio *</Label>
              <div className="border rounded-md p-2">
                <Calendar
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) => date < new Date()}
                  className="w-full"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {startDate ? (
                  format(startDate, 'dd/MM/yyyy')
                ) : (
                  <span className="text-muted-foreground">dd/mm/yyyy</span>
                )}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Fecha de Fin *</Label>
              <div className="border rounded-md p-2">
                <Calendar
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) => !startDate || date < startDate}
                  className="w-full"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {endDate ? (
                  format(endDate, 'dd/MM/yyyy')
                ) : (
                  <span className="text-muted-foreground">dd/mm/yyyy</span>
                )}
              </p>
            </div>
          </div>

          {/* Días solicitados */}
          {daysRequested > 0 && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm font-medium">
                Días solicitados: <span className="text-lg font-bold">{daysRequested}</span>
              </p>
              {absenceType === 'vacation' && !hasEnoughVacationDays && (
                <div className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">
                    No tiene suficientes días disponibles ({vacationBalance?.daysRemaining} días restantes)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Citas afectadas */}
          {affectedAppointmentsCount > 0 && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="font-medium text-yellow-900 dark:text-yellow-100">
                    {affectedAppointmentsCount} cita{affectedAppointmentsCount === 1 ? '' : 's'} afectada{affectedAppointmentsCount === 1 ? '' : 's'}
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    {affectedAppointmentsCount === 1
                      ? 'Esta cita será cancelada si se aprueba la ausencia'
                      : 'Estas citas serán canceladas si se aprueba la ausencia'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Razón */}
          <div className="space-y-2">
            <Label htmlFor="reason">Razón de la Ausencia *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describa brevemente la razón de su ausencia..."
              rows={3}
              required
            />
          </div>

          {/* Notas adicionales */}
          <div className="space-y-2">
            <Label htmlFor="employeeNotes">Notas Adicionales (opcional)</Label>
            <Textarea
              id="employeeNotes"
              value={employeeNotes}
              onChange={(e) => setEmployeeNotes(e.target.value)}
              placeholder="Información adicional que desee compartir..."
              rows={2}
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !startDate ||
                !endDate ||
                !reason.trim() ||
                !hasEnoughVacationDays ||
                loadingAppointments
              }
            >
              {loading ? 'Enviando...' : 'Enviar Solicitud'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
