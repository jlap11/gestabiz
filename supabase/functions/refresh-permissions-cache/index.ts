/**
 * EDGE FUNCTION: Refresh Permissions Cache
 * 
 * Proposito: Refrescar materialized view user_active_permissions cada 5 minutos
 * Trigger: Supabase Cron (cada 5 minutos)
 * Performance: Refresh CONCURRENTLY (no bloquea lecturas)
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Crear cliente Supabase con service_role key (requerido para refresh)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    console.log('🔄 Starting materialized view refresh...');
    const startTime = Date.now();

    // Ejecutar refresh usando RPC function
    const { error } = await supabaseAdmin.rpc('refresh_user_active_permissions');

    if (error) {
      console.error('❌ Error refreshing materialized view:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message,
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Materialized view refreshed successfully in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Permissions cache refreshed successfully',
        duration_ms: duration,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Exception in refresh-permissions-cache:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// CONFIGURACION DE CRON JOB
// Para ejecutar automaticamente cada 5 minutos:
// 
// 1. Desplegar Edge Function:
//    npx supabase functions deploy refresh-permissions-cache
// 
// 2. Configurar Cron en Supabase Dashboard:
//    - Ir a: Database -> Cron Jobs -> Create Job
//    - Schedule: cada 5 minutos
//    - Function: refresh-permissions-cache
// 
// 3. O usar pg_cron directamente:
//    SELECT cron.schedule(...)
// 
// NOTA: La funcion SQL refresh_user_active_permissions() usa REFRESH CONCURRENTLY
// para no bloquear lecturas durante el refresh.

