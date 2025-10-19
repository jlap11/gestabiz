/**
 * useBusinessAdmins Hook
 * 
 * Obtiene la lista de administradores de un negocio con información de sus sedes
 * y calcula distancias si el usuario tiene ubicación habilitada.
 * 
 * @author Gestabiz Team
 * @version 1.0.0
 * @date 2025-10-19
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface BusinessAdmin {
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  location_id: string;
  location_name: string;
  location_address: string;
  location_city: string;
  location_state: string;
  latitude: number | null;
  longitude: number | null;
  distance_km?: number; // Solo si userLocation está disponible
}

interface UseBusinessAdminsOptions {
  businessId: string;
  userLocation?: {
    latitude: number;
    longitude: number;
  } | null;
}

/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine
 * @returns distancia en kilómetros
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useBusinessAdmins({ businessId, userLocation }: UseBusinessAdminsOptions) {
  const [admins, setAdmins] = useState<BusinessAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdmins = useCallback(async () => {
    if (!businessId) return;

    try {
      setLoading(true);
      setError(null);

      // 1. Obtener el owner del negocio
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('owner_id')
        .eq('id', businessId)
        .single();

      if (businessError) throw businessError;

      // 2. Obtener información del owner
      const { data: ownerProfile, error: ownerError } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .eq('id', businessData.owner_id)
        .single();

      if (ownerError) throw ownerError;

      // 3. Obtener todas las sedes del negocio
      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .select('id, name, address, city, state, latitude, longitude')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('name');

      if (locationsError) throw locationsError;

      if (!locations || locations.length === 0) {
        setAdmins([]);
        return;
      }

      // 4. Crear un admin por cada sede (el owner está vinculado a todas las sedes)
      const adminsList: BusinessAdmin[] = locations.map(location => {
        const admin: BusinessAdmin = {
          user_id: ownerProfile.id,
          full_name: ownerProfile.full_name || 'Administrador',
          email: ownerProfile.email,
          avatar_url: ownerProfile.avatar_url,
          location_id: location.id,
          location_name: location.name,
          location_address: location.address,
          location_city: location.city,
          location_state: location.state,
          latitude: location.latitude,
          longitude: location.longitude,
        };

        // Calcular distancia si están disponibles ambas ubicaciones
        if (
          userLocation &&
          location.latitude !== null &&
          location.longitude !== null
        ) {
          admin.distance_km = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            location.latitude,
            location.longitude
          );
        }

        return admin;
      });

      // 5. Ordenar por distancia si está disponible
      if (userLocation) {
        adminsList.sort((a, b) => {
          if (a.distance_km === undefined) return 1;
          if (b.distance_km === undefined) return -1;
          return a.distance_km - b.distance_km;
        });
      }

      setAdmins(adminsList);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error fetching business admins:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar administradores');
    } finally {
      setLoading(false);
    }
  }, [businessId, userLocation]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  return {
    admins,
    loading,
    error,
    refetch: fetchAdmins,
  };
}
