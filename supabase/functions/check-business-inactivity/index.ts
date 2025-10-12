import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BusinessInactivityStats {
  total_checked: number
  deactivated: number
  warned: number
  deleted: number
  details: {
    deactivated_businesses: Array<{ id: string; name: string; days_inactive: number }>
    warned_businesses: Array<{ id: string; name: string; days_since_creation: number }>
    deleted_businesses: Array<{ id: string; name: string; days_since_creation: number }>
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const stats: BusinessInactivityStats = {
      total_checked: 0,
      deactivated: 0,
      warned: 0,
      deleted: 0,
      details: {
        deactivated_businesses: [],
        warned_businesses: [],
        deleted_businesses: [],
      },
    }

    // Get all active businesses
    const { data: businesses, error: businessesError } = await supabase
      .from('businesses')
      .select(`
        id,
        name,
        owner_id,
        created_at,
        last_activity_at,
        first_client_at,
        is_active,
        email,
        owner:profiles!businesses_owner_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .order('last_activity_at', { ascending: true })

    if (businessesError) {
      throw new Error(`Failed to fetch businesses: ${businessesError.message}`)
    }

    stats.total_checked = businesses?.length || 0

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Resend API key for emails
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    for (const business of businesses || []) {
      const lastActivity = business.last_activity_at ? new Date(business.last_activity_at) : new Date(business.created_at)
      const createdAt = new Date(business.created_at)
      const hasFirstClient = business.first_client_at !== null

      // Rule 1: Deactivate if inactive for 30+ days
      if (business.is_active && lastActivity < thirtyDaysAgo) {
        const daysInactive = Math.floor((now.getTime() - lastActivity.getTime()) / (24 * 60 * 60 * 1000))

        // Deactivate business
        const { error: deactivateError } = await supabase
          .from('businesses')
          .update({ is_active: false })
          .eq('id', business.id)

        if (!deactivateError) {
          stats.deactivated++
          stats.details.deactivated_businesses.push({
            id: business.id,
            name: business.name,
            days_inactive: daysInactive,
          })

          // Send email notification to owner
          if (resendApiKey && business.owner?.email) {
            await sendDeactivationEmail(resendApiKey, business, daysInactive)
          }

          // Create in-app notification
          await supabase.from('notifications').insert({
            user_id: business.owner_id,
            type: 'business_deactivated',
            title: 'Negocio desactivado por inactividad',
            message: `Tu negocio "${business.name}" ha sido desactivado por inactividad de ${daysInactive} días. Puedes reactivarlo en cualquier momento.`,
            metadata: {
              business_id: business.id,
              days_inactive: daysInactive,
            },
          })
        }
      }

      // Rule 2: Delete if 1 year old without any clients (with 7-day warning)
      if (!hasFirstClient && createdAt < oneYearAgo) {
        const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000))
        
        // Check if we already sent a warning (stored in metadata or separate table)
        const { data: existingWarning } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', business.owner_id)
          .eq('type', 'business_deletion_warning')
          .contains('metadata', { business_id: business.id })
          .gte('created_at', new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString()) // Check last 8 days
          .single()

        if (!existingWarning) {
          // Send warning email
          if (resendApiKey && business.owner?.email) {
            await sendDeletionWarningEmail(resendApiKey, business, daysSinceCreation)
          }

          // Create warning notification
          await supabase.from('notifications').insert({
            user_id: business.owner_id,
            type: 'business_deletion_warning',
            title: '⚠️ Tu negocio será eliminado en 7 días',
            message: `Tu negocio "${business.name}" no ha tenido clientes en más de un año. Será eliminado en 7 días si no registra actividad.`,
            metadata: {
              business_id: business.id,
              days_since_creation: daysSinceCreation,
              deletion_date: sevenDaysFromNow.toISOString(),
            },
          })

          stats.warned++
          stats.details.warned_businesses.push({
            id: business.id,
            name: business.name,
            days_since_creation: daysSinceCreation,
          })
        } else {
          // Warning was already sent, check if 7 days have passed
          const warningDate = new Date(existingWarning.created_at)
          const daysSinceWarning = Math.floor((now.getTime() - warningDate.getTime()) / (24 * 60 * 60 * 1000))

          if (daysSinceWarning >= 7) {
            // Delete business and all related data
            // Note: CASCADE deletes should be configured in the database schema
            const { error: deleteError } = await supabase
              .from('businesses')
              .delete()
              .eq('id', business.id)

            if (!deleteError) {
              stats.deleted++
              stats.details.deleted_businesses.push({
                id: business.id,
                name: business.name,
                days_since_creation: daysSinceCreation,
              })

              // Send final deletion confirmation email
              if (resendApiKey && business.owner?.email) {
                await sendDeletionConfirmationEmail(resendApiKey, business)
              }
            }
          }
        }
      }
    }

    // Log execution stats
    console.log('Business inactivity check completed:', stats)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Business inactivity check completed',
        stats,
        timestamp: now.toISOString(),
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error checking business inactivity:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Helper function to send deactivation email
async function sendDeactivationEmail(apiKey: string, business: any, daysInactive: number) {
  const emailContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ Negocio Desactivado</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>${business.owner.full_name}</strong>,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Tu negocio <strong>${business.name}</strong> ha sido desactivado automáticamente debido a <strong>${daysInactive} días de inactividad</strong>.
    </p>
    
    <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #856404;">
        <strong>¿Qué significa esto?</strong><br>
        Tu negocio ya no aparecerá en búsquedas públicas y no se podrán crear nuevas citas hasta que lo reactives.
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/dashboard" 
         style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        ✅ Reactivar Mi Negocio
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666;">
      <strong>¿Por qué pasó esto?</strong><br>
      No detectamos actividad (citas, servicios, cambios) en los últimos 30 días. Para mantener nuestro sistema limpio y eficiente, desactivamos negocios inactivos automáticamente.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="font-size: 14px; color: #666; text-align: center; margin: 0;">
      AppointSync Pro • Sistema automático de gestión
    </p>
  </div>
</body>
</html>
  `.trim()

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'AppointSync Pro <notifications@appointsync.pro>',
      to: business.owner.email,
      subject: `⚠️ ${business.name} ha sido desactivado por inactividad`,
      html: emailContent,
    }),
  })
}

// Helper function to send deletion warning email
async function sendDeletionWarningEmail(apiKey: string, business: any, daysSinceCreation: number) {
  const emailContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0;">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🚨 Advertencia: Eliminación Próxima</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>${business.owner.full_name}</strong>,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Tu negocio <strong>${business.name}</strong> será <strong>eliminado permanentemente en 7 días</strong> si no registra actividad.
    </p>
    
    <div style="background: #fee2e2; border: 2px solid #dc2626; border-radius: 6px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #991b1b; font-weight: bold; font-size: 18px;">
        ⏰ Razón de eliminación:
      </p>
      <p style="margin: 0; color: #7f1d1d;">
        Tu negocio tiene más de un año de creado (<strong>${daysSinceCreation} días</strong>) y <strong>no ha registrado ningún cliente</strong>.
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <p style="font-size: 16px; margin-bottom: 15px;">
        <strong>Para evitar la eliminación:</strong>
      </p>
      <a href="${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/dashboard" 
         style="display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 5px;">
        🛡️ Registrar Actividad Ahora
      </a>
    </div>
    
    <div style="background: white; border-radius: 6px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; font-weight: bold;">¿Qué puedes hacer?</p>
      <ul style="margin: 0; padding-left: 20px;">
        <li>Crea una cita de prueba</li>
        <li>Actualiza tus servicios</li>
        <li>Modifica tu perfil de negocio</li>
        <li>Invita a un empleado</li>
      </ul>
    </div>
    
    <p style="font-size: 14px; color: #666;">
      <strong>⚠️ Importante:</strong> La eliminación es permanente y no se puede revertir. Todos los datos del negocio (servicios, empleados, historial) serán eliminados.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="font-size: 14px; color: #666; text-align: center; margin: 0;">
      AppointSync Pro • Sistema automático de gestión
    </p>
  </div>
</body>
</html>
  `.trim()

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'AppointSync Pro <notifications@appointsync.pro>',
      to: business.owner.email,
      subject: `🚨 ${business.name} será eliminado en 7 días`,
      html: emailContent,
    }),
  })
}

// Helper function to send deletion confirmation email
async function sendDeletionConfirmationEmail(apiKey: string, business: any) {
  const emailContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #374151; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🗑️ Negocio Eliminado</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>${business.owner.full_name}</strong>,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Tu negocio <strong>${business.name}</strong> ha sido eliminado permanentemente del sistema debido a inactividad prolongada.
    </p>
    
    <div style="background: #f3f4f6; border-radius: 6px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0;">
        Todos los datos asociados (servicios, empleados, historial) han sido eliminados de acuerdo con nuestras políticas de retención de datos.
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <p style="font-size: 16px; margin-bottom: 15px;">
        <strong>¿Deseas empezar de nuevo?</strong>
      </p>
      <a href="${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/dashboard" 
         style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
        ✨ Crear Nuevo Negocio
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666; text-align: center;">
      Gracias por haber usado AppointSync Pro
    </p>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="font-size: 14px; color: #666; text-align: center; margin: 0;">
      AppointSync Pro • Sistema automático de gestión
    </p>
  </div>
</body>
</html>
  `.trim()

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'AppointSync Pro <notifications@appointsync.pro>',
      to: business.owner.email,
      subject: `${business.name} ha sido eliminado`,
      html: emailContent,
    }),
  })
}
