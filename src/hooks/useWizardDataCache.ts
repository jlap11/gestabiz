import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';
import type { Location, Service } from '@/types/types';

interface WizardDataCache {
  locations: Location[];
  services: Service[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook para pre-cargar datos del wizard (sedes y servicios)
 * Los empleados ahora se filtran dinámicamente por servicio y sede en EmployeeSelection
 */
export function useWizardDataCache(businessId: string | null) {
  const [cache, setCache] = useState<WizardDataCache>({
    locations: [],
    services: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!businessId) {
      setCache({
        locations: [],
        services: [],
        loading: false,
        error: null,
      });
      return;
    }

    const loadAllData = async () => {
      setCache(prev => ({ ...prev, loading: true, error: null }));

      try {
        // Ejecutar consultas en paralelo para máxima velocidad
        const [locationsResult, servicesResult] = await Promise.all([
          // Cargar sedes
          supabase
            .from('locations')
            .select('*')
            .eq('business_id', businessId)
            .eq('is_active', true)
            .order('name'),

          // Cargar servicios
          supabase
            .from('services')
            .select('*')
            .eq('business_id', businessId)
            .eq('is_active', true)
            .order('name'),
        ]);

        // Verificar errores
        if (locationsResult.error) throw new Error(`Locations: ${locationsResult.error.message}`);
        if (servicesResult.error) throw new Error(`Services: ${servicesResult.error.message}`);

        // Normalizar duración del servicio para soportar `duration` y `duration_minutes`
        const rawServices = (servicesResult.data as unknown[] | null) || [];
        const normalizedServices: Service[] = rawServices.map((s: any) => ({
          ...s,
          duration: s?.duration ?? s?.duration_minutes ?? 0,
        }));

        setCache({
          locations: (locationsResult.data as Location[]) || [],
          services: normalizedServices,
          loading: false,
          error: null,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al cargar datos';
        setCache({
          locations: [],
          services: [],
          loading: false,
          error: message,
        });
      }
    };

    loadAllData();
  }, [businessId]);

  return cache;
}
