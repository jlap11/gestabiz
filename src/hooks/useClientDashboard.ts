// =====================================================
// Hook: useClientDashboard
// =====================================================
// Propósito: Hook centralizado que reemplaza TODAS las queries individuales
// Beneficio: 10-15 requests → 1 request (90-95% reducción)
// =====================================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { QUERY_CONFIG } from '@/lib/queryConfig';
import type { FavoriteBusiness } from '@/hooks/useFavorites';

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
    city: string | null;
    state: string | null;
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
  city?: string | null;
  state?: string | null;
  relevance_score: number;
  isFrequent?: boolean;
  visitsCount?: number;
  lastAppointmentDate?: string;
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
  favorites: FavoriteBusiness[];
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

const buildFrequentBusinesses = (appointments: AppointmentWithRelations[]): BusinessSuggestion[] => {
  const frequencyMap = new Map<
    string,
    {
      business: AppointmentWithRelations['business'];
      visitsCount: number;
      lastAppointmentDate: string;
    }
  >();

  for (const appointment of appointments) {
    if (appointment.status !== 'completed') {
      continue;
    }

    const business = appointment.business;
    if (!business?.id) {
      continue;
    }

    const existing = frequencyMap.get(business.id);
    if (existing) {
      existing.visitsCount += 1;
      if (new Date(appointment.start_time).getTime() > new Date(existing.lastAppointmentDate).getTime()) {
        existing.lastAppointmentDate = appointment.start_time;
      }
    } else {
      frequencyMap.set(business.id, {
        business,
        visitsCount: 1,
        lastAppointmentDate: appointment.start_time,
      });
    }
  }

  return Array.from(frequencyMap.values())
    .sort((a, b) => {
      if (b.visitsCount !== a.visitsCount) {
        return b.visitsCount - a.visitsCount;
      }
      return new Date(b.lastAppointmentDate).getTime() - new Date(a.lastAppointmentDate).getTime();
    })
    .slice(0, 3)
    .map(({ business, visitsCount, lastAppointmentDate }) => ({
      id: business?.id || '',
      name: business?.name || 'Negocio',
      description: business?.description,
      logo_url: business?.logo_url || null,
      banner_url: business?.banner_url || null,
      average_rating: business?.average_rating ?? null,
      total_reviews: business?.total_reviews ?? 0,
      city: business?.city,
      state: business?.state,
      relevance_score: visitsCount,
      isFrequent: true,
      visitsCount,
      lastAppointmentDate,
    }));
};

const mergeSuggestions = (
  frequent: BusinessSuggestion[],
  baseSuggestions: BusinessSuggestion[]
): BusinessSuggestion[] => {
  if (!frequent.length) {
    return baseSuggestions;
  }

  const frequentIds = new Set(frequent.map((business) => business.id));
  const mergedFrequent = frequent.map((business) => {
    const baseMatch = baseSuggestions.find((suggestion) => suggestion.id === business.id);
    if (!baseMatch) {
      return business;
    }

    return {
      ...baseMatch,
      isFrequent: true,
      visitsCount: business.visitsCount,
      lastAppointmentDate: business.lastAppointmentDate,
    };
  });

  const filteredBase = baseSuggestions.filter((suggestion) => !frequentIds.has(suggestion.id));

  return [...mergedFrequent, ...filteredBase];
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
  // ✅ FIX: Leer preferredCityName Y preferredRegionName FUERA del queryFn para incluir en queryKey
  // Esto asegura que React Query invalide el cache cuando cambia la ciudad O la región
  let preferredCityName: string | null = null;
  let preferredRegionName: string | null = null;
  try {
    const stored = localStorage.getItem('preferred-city');
    if (stored) {
      const data = JSON.parse(stored);
      // ✅ CAMBIO: Pasar cityName (TEXT) en vez de cityId (UUID) para matchear con locations.city
      preferredCityName = data.cityName || null;
      // ✅ NUEVO: Leer regionName para filtrar por departamento cuando no hay ciudad específica
      preferredRegionName = data.regionName || null;
    }
  } catch {
    // Silently fail if localStorage read fails
    preferredCityName = null;
    preferredRegionName = null;
  }

  return useQuery<ClientDashboardData | null, Error>({
    queryKey: QUERY_CONFIG.KEYS.CLIENT_DASHBOARD(clientId || '', preferredCityName, preferredRegionName),
    queryFn: async () => {
      if (!clientId) {
        return null;
      }

      const payload = {
        client_id: clientId,
        preferred_city_name: preferredCityName,
        preferred_region_name: preferredRegionName,
      };

      let dashboardData: ClientDashboardData | null = null;
      let lastError: Error | null = null;

      // ⚠️ TEMPORAL: Deshabilitar Edge Function para depuración
      /*
      // ✅ Intentar primero via Edge Function (si está desplegada y operativa)
      try {
        const { data, error } = await supabase.functions.invoke('get-client-dashboard-data', {
          body: payload,
        });

        if (error) {
          throw new Error(error.message || 'Failed to fetch dashboard data from Edge Function');
        }

        dashboardData = (data as ClientDashboardData | null) ?? null;
      } catch (edgeFunctionError) {
        lastError = edgeFunctionError instanceof Error
          ? edgeFunctionError
          : new Error(String(edgeFunctionError));
        console.warn('[useClientDashboard] Edge Function failed, falling back to RPC', lastError);
      }
      */

      console.log('[useClientDashboard] 🔍 Using RPC directly (Edge Function disabled for debugging)');

      // ✅ Fallback: Usar RPC directamente si Edge Function falla o no retorna datos
      if (!dashboardData) {
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_client_dashboard_data', {
          p_client_id: clientId,
          p_preferred_city_name: preferredCityName,
          p_preferred_region_name: preferredRegionName,
        });

        if (rpcError) {
          throw new Error(rpcError.message || lastError?.message || 'Failed to fetch client dashboard data');
        }

        dashboardData = (rpcData as ClientDashboardData | null) ?? null;
      }

      if (!dashboardData) {
        return null;
      }

      const appointmentsRaw = dashboardData.appointments as unknown;
      const normalizedAppointments = Array.isArray(appointmentsRaw)
        ? (appointmentsRaw as Record<string, unknown>[]).map((appointment) => normalizeAppointment(appointment))
        : [];

      const frequentBusinesses = buildFrequentBusinesses(normalizedAppointments);
      const suggestionsRaw = dashboardData.suggestions as unknown;
      const baseSuggestions = Array.isArray(suggestionsRaw)
        ? (suggestionsRaw as BusinessSuggestion[])
        : [];
      const suggestionsWithFrequent = mergeSuggestions(frequentBusinesses, baseSuggestions);

      return {
        ...dashboardData,
        appointments: normalizedAppointments,
        suggestions: suggestionsWithFrequent,
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
