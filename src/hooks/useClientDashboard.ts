// =====================================================
// Hook: useClientDashboard
// =====================================================
// Propósito: Hook centralizado que reemplaza TODAS las queries individuales
// Beneficio: 10-15 requests → 1 request (90-95% reducción)
// =====================================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { QUERY_CONFIG } from '@/lib/queryConfig';

// =====================================================
// TYPES
// =====================================================

export interface AppointmentWithRelations {
  id: string;
  created_at: string;
  updated_at: string;
  business_id: string;
  location_id: string | null;
  service_id: string | null;
  client_id: string;
  employee_id: string | null;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes: string | null;
  price: number | null;
  currency: string | null;
  business: {
    id: string;
    name: string;
    description: string | null;
    logo_url: string | null;
    banner_url: string | null;
    average_rating: number | null;
    total_reviews: number;
  } | null;
  location: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
    google_maps_url: string | null;
  } | null;
  employee: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  client: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  service: {
    id: string;
    name: string;
    description: string | null;
    duration_minutes: number | null;
    price: number | null;
    currency: string | null;
    image_url: string | null;
    category: string | null;
  } | null;
  review_id: string | null;
  has_review: boolean;
}

export interface BusinessSuggestion {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  average_rating: number | null;
  total_reviews: number;
  city: string;
  state: string | null;
  relevance_score: number;
}

export interface DashboardStats {
  totalAppointments: number;
  completedAppointments: number;
  upcomingAppointments: number;
  cancelledAppointments: number;
}

export interface ClientDashboardData {
  appointments: AppointmentWithRelations[];
  reviewedAppointmentIds: string[];
  pendingReviewsCount: number;
  favorites: string[];
  suggestions: BusinessSuggestion[];
  stats: DashboardStats;
}

const normalizeAppointment = (appointment: Record<string, unknown>): AppointmentWithRelations => {
  const business = (appointment.business ?? appointment.businesses) as AppointmentWithRelations['business'];
  const location = (appointment.location ?? appointment.locations) as AppointmentWithRelations['location'];
  const service = (appointment.service ?? appointment.services) as AppointmentWithRelations['service'];

  return {
    ...(appointment as AppointmentWithRelations),
    business: business ?? null,
    location: location ?? null,
    service: service ?? null,
  };
};

// =====================================================
// HOOK
// =====================================================

/**
 * Hook centralizado para el ClientDashboard
 * Reemplaza:
 * - fetchClientAppointments (manual query)
 * - useCompletedAppointments (React Query)
 * - useMandatoryReviews (query de reviews)
 * - Queries de favorites
 * - Queries de suggestions
 * 
 * @param clientId - UUID del cliente
 * @returns Data consolidada con loading, error, refetch
 */
export function useClientDashboard(clientId: string | null) {
  console.log('[useClientDashboard] 🔍 Hook called with clientId:', clientId, 'Type:', typeof clientId);
  
  return useQuery<ClientDashboardData | null, Error>({
    queryKey: QUERY_CONFIG.KEYS.CLIENT_DASHBOARD(clientId || ''),
    queryFn: async () => {
      console.log('[useClientDashboard] 🚀 queryFn STARTED. clientId:', clientId, 'Type:', typeof clientId);
      if (!clientId) {
        console.log('[useClientDashboard] ⚠️ queryFn returned NULL (no clientId)');
        return null;
      }

      // ✅ Obtener cityName preferida del localStorage para suggestions
      let preferredCityName: string | null = null;
      try {
        const stored = localStorage.getItem('preferred-city');
        if (stored) {
          const data = JSON.parse(stored);
          // ✅ CAMBIO: Pasar cityName (TEXT) en vez de cityId (UUID) para matchear con locations.city
          preferredCityName = data.cityName || null;
          // DEBUG: Ver qué ciudad se está enviando
          console.log('[useClientDashboard] 🔍 Preferred city from localStorage:', { 
            cityId: data.cityId,
            cityName: preferredCityName,
            regionId: data.regionId,
            regionName: data.regionName,
            raw: data 
          });
        } else {
          console.log('[useClientDashboard] ⚠️ No preferred-city in localStorage');
        }
      } catch (e) {
        console.error('[useClientDashboard] ❌ Error reading localStorage:', e);
      }

      // ✅ Opción 1: Usar Edge Function (si está desplegada)
      const { data, error } = await supabase.functions.invoke('get-client-dashboard-data', {
        body: { 
          client_id: clientId,
          preferred_city_name: preferredCityName // ✅ CAMBIO: Pasar cityName (TEXT) para filtrar suggestions
        },
      });

      console.log('[useClientDashboard] 🔍 Edge Function response:', { data, error, hasError: !!error });

      if (error) {
        console.error('[useClientDashboard] ❌ Edge Function error:', error);
        throw new Error(error.message || 'Failed to fetch dashboard data');
      }

      // ✅ Opción 2 (Fallback): Usar RPC directamente si Edge Function no está disponible
      // const { data, error } = await supabase.rpc('get_client_dashboard_data', {
      //   p_client_id: clientId,
      //   p_preferred_city_id: preferredCityId
      // });

      console.log('[useClientDashboard] ✅ Data fetched:', {
        appointmentsCount: data?.appointments?.length || 0,
        suggestionsCount: data?.suggestions?.length || 0,
        favoritesCount: data?.favorites?.length || 0,
        fullData: data
      });

      if (!data) {
        console.warn('[useClientDashboard] ⚠️ Function returned null data');
        return null;
      }

      const normalizedAppointments = Array.isArray(data.appointments)
        ? data.appointments.map((appointment: Record<string, unknown>) => normalizeAppointment(appointment))
        : [];

      return {
        ...data,
        appointments: normalizedAppointments,
      } as ClientDashboardData;
    },
    enabled: !!clientId, // Solo ejecutar si hay clientId
    staleTime: 5 * 60 * 1000, // 5 minutos (300,000 ms)
    gcTime: 10 * 60 * 1000, // 10 minutos en cache
    retry: 2, // Reintentar 2 veces en caso de error
    refetchOnWindowFocus: false, // No refetch al cambiar de tab
  });
}

// =====================================================
// HELPER HOOKS (derivados del hook principal)
// =====================================================

/**
 * Hook derivado: Solo appointments completadas
 * (Usado por ClientHistory)
 */
export function useCompletedAppointmentsFromDashboard(clientId: string | null) {
  const { data, isLoading, error } = useClientDashboard(clientId);

  return {
    appointments: data?.appointments.filter((apt) => apt.status === 'completed') || [],
    loading: isLoading,
    error,
  };
}

/**
 * Hook derivado: Solo appointments futuras
 * (Usado por NextAppointment widget)
 */
export function useUpcomingAppointmentsFromDashboard(clientId: string | null) {
  const { data, isLoading, error } = useClientDashboard(clientId);

  const now = new Date();
  const upcomingAppointments =
    data?.appointments.filter(
      (apt) =>
        ['pending', 'confirmed', 'in_progress'].includes(apt.status) &&
        new Date(apt.start_time) > now
    ) || [];

  return {
    appointments: upcomingAppointments,
    loading: isLoading,
    error,
  };
}

/**
 * Hook derivado: Solo pending reviews info
 * (Usado por useMandatoryReviews)
 */
export function usePendingReviewsInfo(clientId: string | null) {
  const { data, isLoading } = useClientDashboard(clientId);

  return {
    pendingReviewsCount: data?.pendingReviewsCount || 0,
    reviewedAppointmentIds: data?.reviewedAppointmentIds || [],
    completedAppointments:
      data?.appointments.filter((apt) => apt.status === 'completed') || [],
    loading: isLoading,
  };
}
