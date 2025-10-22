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
 * - Valida festivos públicos del país
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
import { usePublicHolidays } from '@/hooks/usePublicHolidays';
import { useBusinessCountry } from '@/hooks/useBusinessCountry';
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
  const { requestAbsence, vacationBalance, loading, validateWorkDays } = useEmployeeAbsences(businessId);
  const { data: businessData } = useBusinessCountry(businessId);
  const { holidays } = usePublicHolidays(businessData?.country);

  const [absenceType, setAbsenceType] = useState<AbsenceType>('vacation');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [reason, setReason] = useState('');
  const [employeeNotes, setEmployeeNotes] = useState('');
  const [affectedAppointmentsCount, setAffectedAppointmentsCount] = useState(0);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [invalidWorkDays, setInvalidWorkDays] = useState<string[]>([]);
  const [holidaysInRange, setHolidaysInRange] = useState<string[]>([]);

  // Calcular días solicitados (restando días no laborales y festivos)
  const daysRequested = startDate && endDate
    ? Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 - invalidWorkDays.length - holidaysInRange.length
    : 0;

  // Verificar si tiene balance suficiente para vacaciones
  const hasEnoughVacationDays = absenceType === 'vacation'
    ? vacationBalance && daysRequested <= vacationBalance.daysRemaining
    : true;

  // Función para determinar si un día debe estar deshabilitado (mostrado con estilo atenuado)
  const isDayDisabled = (date: Date): boolean => {
    const dateStr = format(date, 'yyyy-MM-dd');
    // Deshabilitar si es fin de semana, día no laboral o festivo
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isNonWorkDay = invalidWorkDays.includes(dateStr);
    const isHoliday = holidaysInRange.includes(dateStr);
    return isWeekend || isNonWorkDay || isHoliday;
  };

  // Función para obtener el motivo por el cual un día está deshabilitado
  const getDisabledReason = (date: Date): string | null => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayOfWeek = date.getDay();
    
    if (dayOfWeek === 0) return 'Domingo - Fin de semana';
    if (dayOfWeek === 6) return 'Sábado - Fin de semana';
    if (invalidWorkDays.includes(dateStr)) return 'Día no laboral';
    if (holidaysInRange.includes(dateStr)) {
      const holiday = holidays.find(h => h.holiday_date === dateStr);
      return holiday ? `${holiday.name} - Festivo` : 'Festivo';
    }
    return null;
  };

  // Cargar citas afectadas, validar días de trabajo y detectar festivos cuando cambien las fechas
  useEffect(() => {
    if (!startDate || !endDate || !businessId) return;

    const loadAffectedAppointmentsAndValidate = async () => {
      setLoadingAppointments(true);
      try {
        // Verificar citas afectadas
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

        // Validar días de trabajo
        const validation = await validateWorkDays(
          format(startDate, 'yyyy-MM-dd'),
          format(endDate, 'yyyy-MM-dd')
        );
        setInvalidWorkDays(validation.invalidDays);

        // Detectar festivos en el rango
        const holidaysInDateRange = holidays.filter(
          (holiday) =>
            holiday.holiday_date >= format(startDate, 'yyyy-MM-dd') &&
            holiday.holiday_date <= format(endDate, 'yyyy-MM-dd')
        );
        setHolidaysInRange(holidaysInDateRange.map((h) => h.holiday_date));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Error loading appointments:', error);
      } finally {
        setLoadingAppointments(false);
      }
    };

    loadAffectedAppointmentsAndValidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, businessId]);  // ✅ SOLO primitivas, sin validateWorkDays ni holidays

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate || !reason.trim()) {
      return;
    }

    // Nota: Los días no laborales y festivos se permiten, pero no se cuentan
    // en el balance de vacaciones (ya están restados del conteo)

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
      setInvalidWorkDays([]);
      setHolidaysInRange([]);
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
                    {Math.max(0, vacationBalance.daysRemaining)} días disponibles de {Math.max(0, vacationBalance.totalDaysAvailable)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{Math.max(0, vacationBalance.daysRemaining)}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">días libres</p>
                </div>
              </div>
              {vacationBalance.daysPending > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  {Math.max(0, vacationBalance.daysPending)} días pendientes de aprobación
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
                  disabled={(date) => date < new Date() || isDayDisabled(date)}
                  dateRangeStart={startDate}
                  dateRangeEnd={endDate}
                  className="w-full"
                  title={(date) => getDisabledReason(date) || ''}
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
                  disabled={(date) => !startDate || date < startDate || isDayDisabled(date)}
                  dateRangeStart={startDate}
                  dateRangeEnd={endDate}
                  className="w-full"
                  title={(date) => getDisabledReason(date) || ''}
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
                    No tiene suficientes días disponibles ({Math.max(0, vacationBalance?.daysRemaining ?? 0)} días restantes)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Validación de días no laborales */}
          {invalidWorkDays.length > 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-900 dark:text-red-100">
                    {invalidWorkDays.length} día{invalidWorkDays.length === 1 ? '' : 's'} no laboral{invalidWorkDays.length === 1 ? '' : 'es'}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    Los siguientes días no están en tu horario de trabajo: {invalidWorkDays.map(d => format(new Date(d), 'dd/MM')).join(', ')}
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Por favor, selecciona solamente días en los que trabajas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Validación de festivos públicos */}
          {holidaysInRange.length > 0 && (
            <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-orange-900 dark:text-orange-100">
                    {holidaysInRange.length} festivo{holidaysInRange.length === 1 ? '' : 's'} en el rango
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    Los siguientes días son festivos públicos y no se pueden solicitar como ausencia:{' '}
                    {holidaysInRange
                      .map((date) => {
                        const holiday = holidays.find((h) => h.holiday_date === date);
                        return `${format(new Date(date), 'dd/MM')} (${holiday?.name || 'Festivo'})`;
                      })
                      .join(', ')}
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    Ajusta tus fechas excluyendo estos días.
                  </p>
                </div>
              </div>
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
