import React, { useState } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CustomDateInput } from '@/components/ui/custom-date-input';
import { PermissionGate } from '@/components/ui/PermissionGate';
import { TimeOffType } from '@/hooks/useEmployeeTimeOff';
import { useLanguage } from '@/contexts/LanguageContext';

interface TimeOffRequestModalProps {
  open: boolean;
  onClose: () => void;
  businessId: string;
  businessName: string;
  defaultType?: TimeOffType;
  onSubmit: (type: TimeOffType, startDate: string, endDate: string, notes: string) => Promise<void>;
}

export function TimeOffRequestModal({
  open,
  onClose,
  businessId,
  businessName,
  defaultType = 'vacation',
  onSubmit
}: Readonly<TimeOffRequestModalProps>) {
  const { t } = useLanguage()
  const [type, setType] = useState<TimeOffType>(defaultType);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calcular días totales
  const calculateDays = (): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(diffDays, 0);
  };

  const totalDays = calculateDays();

  // Labels para tipos
  const typeLabels: Record<TimeOffType, string> = {
    vacation: 'Vacaciones',
    sick_leave: 'Ausencia Médica',
    personal: 'Permiso Personal',
    emergency: 'Emergencia',
    other: 'Otro'
  };

  // Validar formulario
  const validateForm = (): string | null => {
    if (!type) return t('common.validation.selectRequestType');
    if (!startDate) return t('common.validation.selectStartDate');
    if (!endDate) return t('common.validation.selectEndDate');
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end < start) {
      return 'La fecha de fin debe ser posterior a la fecha de inicio';
    }
    
    if (totalDays > 365) {
      return t('common.validation.requestTooLong');
    }
    
    return null;
  };

  const handleSubmit = async () => {
    setError(null);
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      await onSubmit(type, startDate, endDate, notes);
      
      // Reset form
      setType(defaultType);
      setStartDate('');
      setEndDate('');
      setNotes('');
      setError(null);
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.messages.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setType(defaultType);
    setStartDate('');
    setEndDate('');
    setNotes('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Solicitar Tiempo Libre
          </DialogTitle>
          <DialogDescription>
            Envía una solicitud de ausencia para <strong>{businessName}</strong>. 
            Tu gerente revisará y aprobará la solicitud.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Tipo de Solicitud */}
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Solicitud *</Label>
            <Select value={type} onValueChange={(value) => setType(value as TimeOffType)}>
              <SelectTrigger id="type" className="min-h-[44px]">
                <SelectValue placeholder={t('common.validation.selectType')} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(typeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomDateInput
              id="startDate"
              label="Fecha de Inicio *"
              value={startDate}
              onChange={(value) => setStartDate(value)}
              min={new Date().toISOString().split('T')[0]}
            />

            <CustomDateInput
              id="endDate"
              label="Fecha de Fin *"
              value={endDate}
              onChange={(value) => setEndDate(value)}
              min={startDate || new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Preview de Días */}
          {totalDays > 0 && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm font-medium text-foreground">
                Total de días solicitados: <strong>{totalDays} día{totalDays > 1 ? 's' : ''}</strong>
              </p>
              {totalDays > 30 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Esta es una solicitud prolongada. Asegúrate de coordinarlo con tu gerente.
                </p>
              )}
            </div>
          )}

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Notas o Razón <span className="text-muted-foreground">(opcional)</span>
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('common.placeholders.availabilityNotes')}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Info adicional según tipo */}
          {type === 'sick_leave' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Para ausencias médicas prolongadas (más de 3 días), es posible que necesites 
                presentar un certificado médico.
              </AlertDescription>
            </Alert>
          )}

          {type === 'emergency' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Las ausencias de emergencia deben ser justificadas. Tu gerente se pondrá en contacto
                para más detalles.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="w-full sm:w-auto min-h-[44px]"
          >
            {t('common.actions.cancel')}
          </Button>
          <PermissionGate permission="employees.request_time_off" businessId={businessId} mode="disable">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !startDate || !endDate}
              className="w-full sm:w-auto min-h-[44px]"
            >
              {loading ? t('common.actions.send') : t('common.actions.submit')}
            </Button>
          </PermissionGate>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
