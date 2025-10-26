/**
 * useEmployeeTransferAvailability
 * 
 * Hook para validar si un empleado está disponible en una fecha/sede
 * considerando traslados programados
 * 
 * Reglas:
 * - Si empleado tiene traslado "pending":
 *   1. Si cita es DESPUÉS de fecha efectiva Y sede es la ANTERIOR → NO PERMITIR
 *   2. Si cita es ANTES de fecha efectiva Y sede es la NUEVA → NO PERMITIR
 *   3. Si cita es ANTES de fecha efectiva Y sede es la ANTERIOR → SÍ PERMITIR
 *   4. Si cita es DESPUÉS de fecha efectiva Y sede es la NUEVA → SÍ PERMITIR
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface TransferValidationResult {
  isAvailable: boolean;
  reason?: string; // Razón si no está disponible
  transferStatus?: 'pending' | 'none';
  effectiveDate?: Date;
  currentLocation?: string;
  transferLocation?: string;
}

export function useEmployeeTransferAvailability() {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Validar disponibilidad del empleado en fecha y sede
   */
  const validateAvailability = useCallback(
    async (
      employeeId: string,
      businessId: string,
      appointmentDate: Date,
      locationId: string
    ): Promise<TransferValidationResult> => {
      try {
        setIsLoading(true);

        // 1. Obtener datos de traslado del empleado
        const { data: employeeData, error: employeeError } = await supabase
          .from('business_employees')
          .select(
            'location_id, transfer_status, transfer_effective_date, transfer_to_location_id'
          )
          .eq('employee_id', employeeId)
          .eq('business_id', businessId)
          .single();

        if (employeeError || !employeeData) {
          // Sin traslado pendiente, está disponible
          return {
            isAvailable: true,
            transferStatus: 'none',
          };
        }

        // 2. Si NO tiene traslado pendiente, está disponible
        if (employeeData.transfer_status !== 'pending') {
          return {
            isAvailable: true,
            transferStatus: 'none',
          };
        }

        // 3. Tiene traslado pendiente, validar reglas
        const effectiveDate = new Date(employeeData.transfer_effective_date);
        const currentLocationId = employeeData.location_id;
        const transferLocationId = employeeData.transfer_to_location_id;

        // Regla 1: Si cita es DESPUÉS de fecha efectiva Y sede es la ANTERIOR
        // → NO PERMITIR (empleado ya no estará aquí)
        if (
          appointmentDate >= effectiveDate &&
          locationId === currentLocationId
        ) {
          return {
            isAvailable: false,
            transferStatus: 'pending',
            reason: `El empleado se trasladará a otra sede el ${effectiveDate.toLocaleDateString('es-CO')}. No puede agendar citas después de esa fecha en esta sede.`,
            effectiveDate,
            currentLocation: currentLocationId,
            transferLocation: transferLocationId,
          };
        }

        // Regla 2: Si cita es ANTES de fecha efectiva Y sede es la NUEVA
        // → NO PERMITIR (empleado aún no está disponible en nueva sede)
        if (
          appointmentDate < effectiveDate &&
          locationId === transferLocationId
        ) {
          return {
            isAvailable: false,
            transferStatus: 'pending',
            reason: `El empleado no estará disponible en esta sede hasta el ${effectiveDate.toLocaleDateString('es-CO')}.`,
            effectiveDate,
            currentLocation: currentLocationId,
            transferLocation: transferLocationId,
          };
        }

        // Regla 3 & 4: Combinaciones válidas
        return {
          isAvailable: true,
          transferStatus: 'pending',
          effectiveDate,
          currentLocation: currentLocationId,
          transferLocation: transferLocationId,
        };
      } catch {
        // En caso de error, permitir (no bloquear por error)
        return {
          isAvailable: true,
          transferStatus: 'none',
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { validateAvailability, isLoading };
}
