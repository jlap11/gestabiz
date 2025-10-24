/**
 * LocationTransferModal
 * 
 * Modal para programar traslado de empleado entre sedes
 * 
 * Features:
 * - Selector de sede destino
 * - DatePicker para fecha efectiva (mínimo +7 días)
 * - Vista previa de citas a mantener/cancelar
 * - Confirmación con checkbox
 */

import React, { useState, useEffect } from 'react';
import { MapPin, AlertTriangle, Check } from 'lucide-react';
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
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { useLocationTransfer } from '@/hooks/useLocationTransfer';

interface Location {
  id: string;
  name: string;
  address?: string;
  city?: string;
}

interface LocationTransferModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly businessId: string;
  readonly employeeId: string;
  readonly currentLocationId: string;
  readonly currentLocationName: string;
  readonly targetLocationId?: string; // Nueva prop: ubicación destino prefijada
  readonly targetLocationName?: string; // Nueva prop: nombre de sede destino
  readonly onTransferScheduled: () => void;
}

export function LocationTransferModal({
  open,
  onOpenChange,
  businessId,
  employeeId,
  currentLocationId,
  currentLocationName,
  targetLocationId,
  targetLocationName,
  onTransferScheduled,
}: LocationTransferModalProps) {
  const { t } = useLanguage();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [daysUntilTransfer, setDaysUntilTransfer] = useState<number>(7); // Días elegibles 1-30
  const [impact, setImpact] = useState<{ toKeep: number; toCancel: number } | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loadingImpact, setLoadingImpact] = useState(false);

  const { scheduleTransfer, getTransferImpact, isLoading } = useLocationTransfer();

  // Si tenemos targetLocationId prefijado, usarlo. Si no, cargar sedes
  useEffect(() => {
    if (targetLocationId && targetLocationName) {
      // Modo traslado desde otra sede: ya sabemos la destino
      setSelectedLocationId(targetLocationId);
    } else {
      // Modo cambio desde sede actual: cargar sedes disponibles
      async function fetchLocations() {
        const { data, error } = await supabase
          .from('locations')
          .select('id, name, address, city')
          .eq('business_id', businessId)
          .eq('is_active', true)
          .neq('id', currentLocationId)
          .order('name');

        if (!error && data) {
          setLocations(data);
        }
      }

      if (open && !targetLocationId) {
        fetchLocations();
      }
    }
  }, [open, businessId, currentLocationId, targetLocationId, targetLocationName]);

  // Calcular impacto cuando cambie los días o sede destino
  useEffect(() => {
    async function calculateImpact() {
      if (!selectedLocationId || daysUntilTransfer <= 0) {
        setImpact(null);
        return;
      }

      setLoadingImpact(true);

      try {
        // Calcular fecha efectiva basada en días elegidos
        const effectiveDate = addDays(new Date(), daysUntilTransfer);

        // Primero obtener business_employee_id
        const { data: employeeData } = await supabase
          .from('business_employees')
          .select('id')
          .eq('employee_id', employeeId)
          .eq('business_id', businessId)
          .single();

        if (employeeData) {
          const impactData = await getTransferImpact(employeeData.id, effectiveDate);
          if (impactData) {
            setImpact({
              toKeep: impactData.appointmentsToKeep,
              toCancel: impactData.appointmentsToCancel,
            });
          }
        }
      } finally {
        setLoadingImpact(false);
      }
    }

    calculateImpact();
  }, [daysUntilTransfer, selectedLocationId, employeeId, businessId, getTransferImpact]);

  const handleSchedule = async () => {
    if (!selectedLocationId || daysUntilTransfer <= 0) {
      return;
    }

    const effectiveDate = addDays(new Date(), daysUntilTransfer);

    const result = await scheduleTransfer(
      businessId,
      employeeId,
      selectedLocationId,
      effectiveDate,
      daysUntilTransfer
    );

    if (result.success) {
      onTransferScheduled();
      onOpenChange(false);
      // Reset form
      setSelectedLocationId('');
      setDaysUntilTransfer(7);
      setConfirmed(false);
      setImpact(null);
    }
  };

  const effectiveDate = daysUntilTransfer > 0 ? addDays(new Date(), daysUntilTransfer) : undefined;

  // Renderizar contenido de impacto
  const renderImpactContent = () => {
    if (loadingImpact) {
      return <p className="text-sm text-muted-foreground">Calculando...</p>;
    }
    
    if (impact) {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm">
              <strong>{impact.toKeep}</strong> citas a cumplir (antes de{' '}
              {format(effectiveDate!, 'dd MMM yyyy', { locale: es })})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="text-sm">
              <strong>{impact.toCancel}</strong> citas se cancelarán (desde{' '}
              {format(effectiveDate!, 'dd MMM yyyy', { locale: es })})
            </span>
          </div>
          {impact.toCancel > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              ⚠️ Los clientes afectados recibirán notificación por correo y en la
              aplicación.
            </p>
          )}
        </div>
      );
    }

    return <p className="text-sm text-muted-foreground">No se pudo calcular el impacto</p>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Programar Traslado de Sede
          </DialogTitle>
          <DialogDescription>
            Programa tu cambio de sede con anticipación. Las citas futuras serán ajustadas
            automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Sede actual */}
          <div className="space-y-2">
            <Label>Sede Actual</Label>
            <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{currentLocationName}</span>
            </div>
          </div>

          {/* Sede destino - Si viene prefijada, mostrar como badge. Si no, selector. */}
          <div className="space-y-2">
            <Label>Sede Destino *</Label>
            {targetLocationId && targetLocationName ? (
              <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                <MapPin className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-900 dark:text-green-100">{targetLocationName}</span>
                <Badge variant="default" className="ml-auto">Preseleccionada</Badge>
              </div>
            ) : (
              <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                <SelectTrigger id="location">
                  <SelectValue placeholder="Selecciona nueva sede..." />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                      {location.city && ` - ${location.city}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Selector de días hasta traslado (1-30) */}
          <div className="space-y-2">
            <Label htmlFor="days">Días hasta el Traslado *</Label>
            <div className="flex items-center gap-4">
              <input
                id="days"
                type="range"
                min="1"
                max="30"
                value={daysUntilTransfer}
                onChange={(e) => setDaysUntilTransfer(Number.parseInt(e.target.value, 10))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <span className="font-bold text-lg min-w-fit px-3 py-1 bg-primary text-primary-foreground rounded-md">
                {daysUntilTransfer} {daysUntilTransfer === 1 ? 'día' : 'días'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Elige entre 1 y 30 días desde hoy
            </p>
            {daysUntilTransfer > 0 && (
              <p className="text-xs font-medium text-foreground">
                Fecha efectiva: <strong>{format(addDays(new Date(), daysUntilTransfer), 'dd MMMM yyyy', { locale: es })}</strong>
              </p>
            )}
          </div>

          {/* Vista previa de impacto */}
          {selectedLocationId && effectiveDate && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2 mt-2">
                  <p className="font-medium">Impacto del Traslado:</p>
                  {renderImpactContent()}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Checkbox de confirmación */}
          {impact && impact.toCancel > 0 && (
            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                id="confirm"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked === true)}
              />
              <label
                htmlFor="confirm"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Entiendo que se cancelarán {impact.toCancel} citas y los clientes serán
                notificados
              </label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {t('common.actions.cancel')}
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={
              !selectedLocationId ||
              !effectiveDate ||
              isLoading ||
              (impact?.toCancel ?? 0) > 0 && !confirmed
            }
          >
            {isLoading ? 'Programando...' : 'Programar Traslado'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
