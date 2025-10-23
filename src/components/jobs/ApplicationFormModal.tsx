import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useJobApplications } from '@/hooks/useJobApplications';
import { useScheduleConflicts, type ScheduleConflict, type WorkSchedule } from '@/hooks/useScheduleConflicts';
import { ScheduleConflictAlert } from './ScheduleConflictAlert';
import { CustomDateInput } from '@/components/ui/custom-date-input';

// Flexible vacancy type that accepts both JobVacancy and MatchingVacancy
interface VacancyForApplication {
  id: string;
  title: string;
  business_id?: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  work_schedule?: Record<string, { start: string; end: string }>;
}

interface ApplicationFormModalProps {
  vacancy: VacancyForApplication | null;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ApplicationFormModal: React.FC<ApplicationFormModalProps> = ({
  vacancy,
  userId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const { createApplication, loading: submitting } = useJobApplications({ businessId: undefined });
  const { checkConflict, loading: checkingConflicts } = useScheduleConflicts();

  const [coverLetter, setCoverLetter] = useState('');
  const [expectedSalary, setExpectedSalary] = useState<number | undefined>();
  const [availabilityDate, setAvailabilityDate] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [scheduleConflicts, setScheduleConflicts] = useState<ScheduleConflict[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Convertir schedule de la vacante al formato WorkSchedule
  const convertToWorkSchedule = (
    schedule?: Record<string, { start: string; end: string }>
  ): WorkSchedule | null => {
    if (!schedule) return null;
    
    const workSchedule: WorkSchedule = {};
    for (const [day, times] of Object.entries(schedule)) {
      workSchedule[day] = {
        enabled: true,
        start_time: times.start,
        end_time: times.end,
      };
    }
    return workSchedule;
  };

  // Verificar conflictos de horario cuando se abre el modal
  useEffect(() => {
    const checkScheduleConflicts = async () => {
      if (!vacancy?.work_schedule || !isOpen) {
        setScheduleConflicts([]);
        return;
      }

      try {
        const workSchedule = convertToWorkSchedule(vacancy.work_schedule);
        if (!workSchedule) return;

        const result = await checkConflict(workSchedule);
        setScheduleConflicts(result.conflicts);
      } catch (error) {
        // Error already handled by hook
        setScheduleConflicts([]);
      }
    };

    if (isOpen && vacancy) {
      checkScheduleConflicts();
    }
  }, [isOpen, vacancy, checkConflict]);

  // Reset form cuando se cierra
  useEffect(() => {
    if (!isOpen) {
      setCoverLetter('');
      setExpectedSalary(undefined);
      setAvailabilityDate('');
      setCvFile(null);
      setScheduleConflicts([]);
      setValidationError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    setValidationError(null);
    
    if (!vacancy) {
      setValidationError('No se pudo cargar la información de la vacante');
      return;
    }

    if (!vacancy.id) {
      setValidationError('ID de vacante es requerido');
      return;
    }

    if (coverLetter.trim().length < 50) {
      setValidationError('La carta de presentación debe tener al menos 50 caracteres');
      return;
    }

    if (expectedSalary && expectedSalary < 0) {
      setValidationError(t('jobsUI.salaryMustBePositive'));
      return;
    }

    if (vacancy.salary_max && expectedSalary && expectedSalary > vacancy.salary_max) {
      setValidationError(
        `${t('jobsUI.salaryExceedsMaximum')} (${new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0,
        }).format(vacancy.salary_max)})`
      );
      return;
    }

    if (!availabilityDate) {
      setValidationError('Debes indicar tu fecha de disponibilidad');
      return;
    }

    const availDate = new Date(availabilityDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (availDate < today) {
      setValidationError('La fecha de disponibilidad no puede ser en el pasado');
      return;
    }

    try {
      const application = await createApplication({
        vacancy_id: vacancy.id,
        cover_letter: coverLetter.trim(),
        expected_salary: expectedSalary,
        available_from: availabilityDate,
        cv_file: cvFile || undefined,
      });

      if (application) {
        toast.success('Aplicación enviada exitosamente');
        onClose();
        onSuccess?.();
      }
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || 'Error al enviar aplicación');
    }
  };

  if (!vacancy) return null;

  const formatSalary = (amount?: number): string => {
    if (!amount) return '';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aplicar a Vacante</DialogTitle>
          <DialogDescription>
            {vacancy.title} - {vacancy.business_id}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Conflictos de horario */}
          {checkingConflicts ? (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>Verificando conflictos de horario...</AlertDescription>
            </Alert>
          ) : scheduleConflicts.length > 0 ? (
            <ScheduleConflictAlert conflicts={scheduleConflicts} />
          ) : null}

          {/* Validation Error */}
          {validationError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {/* Carta de presentación */}
          <div className="space-y-2">
            <Label htmlFor="cover-letter">
              Carta de Presentación <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="cover-letter"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder={t('common.placeholders.applicationLetter')}
              className="min-h-[150px] resize-y"
              required
            />
            <p className="text-xs text-muted-foreground">
              {coverLetter.length} / 50 caracteres mínimos
            </p>
          </div>

          {/* Salario esperado */}
          <div className="space-y-2">
            <Label htmlFor="expected-salary">{t('jobsUI.expectedSalary')} (Opcional)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                $
              </span>
              <Input
                id="expected-salary"
                type="text"
                inputMode="numeric"
                className="pl-7"
                value={expectedSalary ? expectedSalary.toLocaleString('es-CO') : ''}
                onChange={(e) => {
                  const value = e.target.value.split('').filter(char => /\d/.test(char)).join('');
                  setExpectedSalary(value ? Number(value) : undefined);
                }}
                placeholder="1.000.000"
              />
            </div>
            {vacancy.salary_min && vacancy.salary_max && (
              <p className="text-xs text-muted-foreground">
                Rango de la vacante: {formatSalary(vacancy.salary_min)} -{' '}
                {formatSalary(vacancy.salary_max)}
              </p>
            )}
          </div>

          {/* Fecha de disponibilidad */}
          <div className="space-y-2">
            <Label htmlFor="availability-date">
              Fecha de Disponibilidad <span className="text-red-500">*</span>
            </Label>
            <CustomDateInput
              value={availabilityDate}
              onChange={setAvailabilityDate}
              min={minDate}
              placeholder={t('common.validation.selectDate')}
            />
            <p className="text-xs text-muted-foreground">¿Cuándo podrías comenzar a trabajar?</p>
          </div>

          {/* Carga de CV */}
          <div className="space-y-2">
            <Label htmlFor="cv-file">Hoja de Vida (Recomendado)</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  id="cv-file"
                  type="file"
                  accept=".pdf,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Validate file type
                      const fileExt = file.name.split('.').pop()?.toLowerCase();
                      if (!fileExt || !['pdf', 'docx'].includes(fileExt)) {
                        toast.error('Solo se permiten archivos PDF o DOCX');
                        e.target.value = '';
                        return;
                      }
                      
                      // Validate file size (5MB max)
                      const maxSize = 5 * 1024 * 1024;
                      if (file.size > maxSize) {
                        toast.error('El archivo debe ser menor a 5MB');
                        e.target.value = '';
                        return;
                      }
                      
                      setCvFile(file);
                    }
                  }}
                  className="cursor-pointer"
                />
                {cvFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCvFile(null);
                      const input = document.getElementById('cv-file') as HTMLInputElement;
                      if (input) input.value = '';
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {cvFile && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground flex-1 truncate">{cvFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {(cvFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                Formatos permitidos: PDF, DOCX • Tamaño máximo: 5MB
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {t('common.actions.cancel')}
            </Button>
            <Button type="submit" disabled={submitting || checkingConflicts}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.actions.send') || 'Sending...'}
                </>
              ) : (
                t('jobs.application.submit') || 'Submit Application'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
