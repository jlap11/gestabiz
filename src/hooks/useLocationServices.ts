import { useState, useEffect } from 'react';
import supabase from '@/lib/supabase';
import { LocationService } from '@/types/types';
import { toast } from 'sonner';

/**
 * Hook para gestionar servicios por sede (location_services)
 */
export function useLocationServices(locationId?: string) {
  const [services, setServices] = useState<LocationService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch location services
  const fetchLocationServices = async (locId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('location_services')
        .select(`
          *,
          service:services(*),
          location:locations(*)
        `)
        .eq('location_id', locId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setServices(data || []);
    } catch (err) {
      const error = err as Error;
      setError(error);
      toast.error(`Error al cargar servicios de la sede: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Add service to location
  const addServiceToLocation = async (serviceId: string, locId: string) => {
    try {
      const { data, error: insertError } = await supabase
        .from('location_services')
        .insert({
          location_id: locId,
          service_id: serviceId,
          is_active: true,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success('Servicio agregado a la sede exitosamente');
      if (locationId) fetchLocationServices(locationId);
      return data;
    } catch (err) {
      const error = err as Error;
      toast.error(`Error al agregar servicio: ${error.message}`);
      throw error;
    }
  };

  // Remove service from location
  const removeServiceFromLocation = async (locationServiceId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('location_services')
        .delete()
        .eq('id', locationServiceId);

      if (deleteError) throw deleteError;

      toast.success('Servicio removido de la sede');
      if (locationId) fetchLocationServices(locationId);
    } catch (err) {
      const error = err as Error;
      toast.error(`Error al remover servicio: ${error.message}`);
      throw error;
    }
  };

  // Toggle service active status
  const toggleServiceStatus = async (locationServiceId: string, isActive: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('location_services')
        .update({ is_active: isActive })
        .eq('id', locationServiceId);

      if (updateError) throw updateError;

      toast.success(isActive ? 'Servicio activado' : 'Servicio desactivado');
      if (locationId) fetchLocationServices(locationId);
    } catch (err) {
      const error = err as Error;
      toast.error(`Error al actualizar servicio: ${error.message}`);
      throw error;
    }
  };

  useEffect(() => {
    if (locationId) {
      fetchLocationServices(locationId);
    } else {
      setServices([]);
      setLoading(false);
    }
  }, [locationId]);

  return {
    services,
    loading,
    error,
    addServiceToLocation,
    removeServiceFromLocation,
    toggleServiceStatus,
    refetch: () => locationId && fetchLocationServices(locationId),
  };
}
