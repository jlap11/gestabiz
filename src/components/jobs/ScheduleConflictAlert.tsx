import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, Clock } from 'lucide-react';
import { Warning } from '@phosphor-icons/react';
import type { ScheduleConflict } from '@/hooks/useScheduleConflicts';

interface ScheduleConflictAlertProps {
  conflicts: ScheduleConflict[];
  className?: string;
}

export const ScheduleConflictAlert: React.FC<ScheduleConflictAlertProps> = ({
  conflicts,
  className = '',
}) => {
  if (!conflicts || conflicts.length === 0) {
    return null;
  }

  const totalConflictingDays = conflicts.reduce(
    (sum, conflict) => sum + conflict.conflicting_days.length,
    0
  );

  // Traducir días de la semana
  const translateDay = (day: string): string => {
    const translations: Record<string, string> = {
      monday: 'Lunes',
      tuesday: 'Martes',
      wednesday: 'Miércoles',
      thursday: 'Jueves',
      friday: 'Viernes',
      saturday: 'Sábado',
      sunday: 'Domingo',
    };
    return translations[day] || day;
  };

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="font-semibold flex items-center gap-2">
        Conflictos de Horario Detectados
        <Badge variant="destructive" className="ml-auto">
          {totalConflictingDays} {totalConflictingDays === 1 ? 'día' : 'días'}
        </Badge>
      </AlertTitle>
      <AlertDescription className="mt-3 space-y-4">
        <p className="text-sm">
          Se encontraron solapamientos de horario con tus trabajos actuales. Aplicar a esta
          vacante puede resultar en conflictos de programación.
        </p>

        <div className="space-y-3">
          {conflicts.map((conflict, index) => (
            <div
              key={conflict.business_id}
              className="border-l-2 border-red-500 pl-3 py-2 bg-red-50 dark:bg-red-950/20 rounded-r"
            >
              <div className="flex items-center gap-2 mb-2">
                <p className="font-medium text-sm">{conflict.business_name}</p>
                <Badge variant="outline" className="text-xs">
                  {conflict.conflicting_days.length}{' '}
                  {conflict.conflicting_days.length === 1 ? 'conflicto' : 'conflictos'}
                </Badge>
              </div>

              <div className="space-y-2">
                {conflict.overlap_details.map((detail, detailIndex) => (
                  <div
                    key={`${index}-${detailIndex}`}
                    className="text-xs space-y-1 bg-white dark:bg-background/50 p-2 rounded"
                  >
                    <div className="flex items-center gap-2 font-medium">
                      <Calendar className="w-3 h-3" />
                      <span>{translateDay(detail.day)}</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-muted-foreground ml-5">
                      <div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span className="font-medium">Actual:</span>
                        </div>
                        <span>{detail.existing_hours}</span>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span className="font-medium">Nueva:</span>
                        </div>
                        <span>{detail.new_hours}</span>
                      </div>
                      
                      <div className="text-red-600 dark:text-red-400">
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span className="font-medium">Solape:</span>
                        </div>
                        <span>{detail.overlap_hours}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
          <p className="font-medium text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
            <Warning size={16} weight="fill" /> Recomendación
          </p>
          <p className="text-yellow-700 dark:text-yellow-300 mt-1">
            Considera negociar horarios flexibles con el empleador o asegúrate de que puedes
            manejar ambos trabajos antes de aplicar.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};
