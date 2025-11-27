// =====================================================
// Edge Function: get-client-dashboard-data
// =====================================================
// Propósito: Consolidar TODAS las queries del ClientDashboard en UN SOLO endpoint
// Reduce 10-15 requests → 1 request (90-95% mejora)
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DashboardData {
  appointments: any[];
  reviewedAppointmentIds: string[];
  pendingReviewsCount: number;
  favorites: string[];
  suggestions: any[];
  stats: {
    totalAppointments: number;
    completedAppointments: number;
    upcomingAppointments: number;
    cancelledAppointments: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Crear cliente Supabase con service_role (necesario para queries complejas)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener client_id, preferred_city_name y preferred_region_name del body
    const { client_id, preferred_city_name, preferred_region_name } = await req.json();

    if (!client_id) {
      return new Response(
        JSON.stringify({ error: 'client_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[get-client-dashboard-data] 🔍 Request params:`, {
      client_id,
      preferred_city_name,
      preferred_region_name,
      preferred_city_name_type: typeof preferred_city_name,
      preferred_region_name_type: typeof preferred_region_name
    });

    // =====================================================
    // QUERY UNIFICADA CON CTE (Common Table Expressions)
    // =====================================================
    const { data: dashboardData, error: queryError } = await supabase.rpc(
      'get_client_dashboard_data',
      { 
        p_client_id: client_id,
        p_preferred_city_name: preferred_city_name || null,
        p_preferred_region_name: preferred_region_name || null
      }
    );

    if (queryError) {
      console.error('[get-client-dashboard-data] ❌ RPC Error:', queryError);
      throw queryError;
    }

    // Parsear resultado (RPC retorna JSON)
    const result: DashboardData = dashboardData || {
      appointments: [],
      reviewedAppointmentIds: [],
      pendingReviewsCount: 0,
      favorites: [],
      suggestions: [],
      stats: {
        totalAppointments: 0,
        completedAppointments: 0,
        upcomingAppointments: 0,
        cancelledAppointments: 0,
      },
    };

    console.log(`[get-client-dashboard-data] Success:`, {
      appointmentsCount: result.appointments.length,
      pendingReviews: result.pendingReviewsCount,
      favoritesCount: result.favorites.length,
      suggestionsCount: result.suggestions.length,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[get-client-dashboard-data] Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        details: error.toString(),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
