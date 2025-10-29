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
        // Intentar RPC combinada
        const { data, error } = await supabase.rpc('get_wizard_business_data', {
          p_business_id: businessId,
        });

        if (!error && data) {
          const payload = data as any;
          const rawLocations = (payload.locations as unknown[] | null) || [];
          const rawServices = (payload.services as unknown[] | null) || [];

          const normalizedServices: Service[] = rawServices.map((s: any) => ({
            ...s,
            duration: s?.duration ?? s?.duration_minutes ?? 0,
          }));

          setCache({
            locations: rawLocations as Location[],
            services: normalizedServices,
            loading: false,
            error: null,
          });
          return;
        }

        // Fallback: realizar dos consultas si la RPC no existe o falla
        const [locationsResult, servicesResult] = await Promise.all([
          supabase
            .from('locations')
            .select('*')
            .eq('business_id', businessId)
            .eq('is_active', true)
            .order('name'),
          supabase
            .from('services')
            .select('*')
            .eq('business_id', businessId)
            .eq('is_active', true)
            .order('name'),
        ]);

        if (locationsResult.error) throw new Error(`Locations: ${locationsResult.error.message}`);
        if (servicesResult.error) throw new Error(`Services: ${servicesResult.error.message}`);

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
