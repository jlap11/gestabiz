import React, { useState } from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';

interface ConfirmEndEmploymentDialogProps {
  open: boolean;
  onClose: () => void;
  businessName: string;
  onConfirm: () => Promise<void>;
}

export function ConfirmEndEmploymentDialog({
  open,
  onClose,
  businessName,
  onConfirm
}: Readonly<ConfirmEndEmploymentDialogProps>) {
  const { t } = useLanguage();
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!confirmed) {
      setError('Debes confirmar marcando la casilla');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onConfirm();
      
      // Reset
      setConfirmed(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al finalizar el empleo');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setConfirmed(false);
    setError(null);
    onClose();
  };

  return (
    <AlertDialog open={open} onOpenChange={handleCancel}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            ¿Finalizar Empleo en {businessName}?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p className="text-foreground font-medium">
              Esta acción marcará tu vínculo laboral como finalizado. Ten en cuenta lo siguiente:
            </p>
            
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <span>Ya no podrás ofrecer servicios en este negocio</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <span>Perderás acceso al panel de empleado</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <span>Los clientes no podrán reservar citas contigo</span>
              </li>
              <li className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <span>Tus servicios asignados serán desactivados</span>
              </li>
            </ul>

            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Nota importante:</strong> Solo un administrador del negocio podrá 
                reactivar tu empleo si deseas volver. Esta acción quedará registrada en tu 
                historial laboral.
              </AlertDescription>
            </Alert>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Confirmación con Checkbox */}
          <div className="flex items-start space-x-3 rounded-md border border-destructive/50 p-4 bg-destructive/5">
            <Checkbox
              id="confirm-end"
              checked={confirmed}
              onCheckedChange={(checked) => {
                setConfirmed(checked === true);
                setError(null);
              }}
              className="mt-1"
            />
            <label
              htmlFor="confirm-end"
              className="text-sm font-medium leading-relaxed cursor-pointer select-none"
            >
              Confirmo que entiendo las consecuencias y quiero finalizar mi vínculo laboral 
              con <strong>{businessName}</strong>
            </label>
          </div>

          {/* Info adicional */}
          <div className="text-xs text-muted-foreground space-y-1 px-1">
            <p>• Tu historial de citas completadas permanecerá visible</p>
            <p>• Las reseñas recibidas se mantendrán en el sistema</p>
            <p>• Podrás seguir accediendo como cliente si lo deseas</p>
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="w-full sm:w-auto min-h-[44px]"
          >
            {t('common.actions.cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading || !confirmed}
            className="w-full sm:w-auto min-h-[44px]"
          >
            {loading ? t('common.states.processing') : t('employee.absences.confirmEndEmployment')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
