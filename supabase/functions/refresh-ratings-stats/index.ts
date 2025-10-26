import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RefreshStatsResponse {
  success: boolean
  message: string
  timestamp: string
  executionTime?: number
  error?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    // Crear cliente de Supabase con service role para acceso completo
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('🔄 Iniciando refresco de vistas materializadas de ratings...')

    // Ejecutar función SQL que refresca ambas vistas materializadas
    const { error } = await supabase.rpc('refresh_ratings_stats')

    if (error) {
      console.error('❌ Error al refrescar stats:', error)
      throw error
    }

    const executionTime = Date.now() - startTime
    console.log(`✅ Stats refrescadas exitosamente en ${executionTime}ms`)

    // Obtener conteos de las vistas para confirmar
    const { count: businessCount } = await supabase
      .from('business_ratings_stats')
      .select('*', { count: 'exact', head: true })

    const { count: employeeCount } = await supabase
      .from('employee_ratings_stats')
      .select('*', { count: 'exact', head: true })

    const response: RefreshStatsResponse = {
      success: true,
      message: 'Vistas materializadas refrescadas exitosamente',
      timestamp: new Date().toISOString(),
      executionTime,
      businessStatsCount: businessCount || 0,
      employeeStatsCount: employeeCount || 0
    }

    console.log('📊 Resultado:', response)

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    const executionTime = Date.now() - startTime
    console.error('❌ Error en Edge Function:', error)

    const errorResponse: RefreshStatsResponse = {
      success: false,
      message: 'Error al refrescar vistas materializadas',
      timestamp: new Date().toISOString(),
      executionTime,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }

    return new Response(
      JSON.stringify(errorResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
