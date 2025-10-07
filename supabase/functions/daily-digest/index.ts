import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all users who have daily digest enabled
    const { data: users, error: usersError } = await supabaseClient
      .from('notification_settings')
      .select(`
        user_id,
        users (email, name, timezone)
      `)
      .eq('daily_digest', true)

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }

    const results = []

    for (const userSettings of users || []) {
      try {
        const user = userSettings.users
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        // Get today's appointments
        const { data: todayAppointments } = await supabaseClient
          .from('appointments')
          .select(`
            *,
            clients (name, email, phone)
          `)
          .eq('user_id', userSettings.user_id)
          .gte('start_datetime', today.toISOString().split('T')[0])
          .lt('start_datetime', tomorrow.toISOString().split('T')[0])
          .in('status', ['scheduled', 'confirmed'])
          .order('start_datetime')

        // Get tomorrow's appointments
        const dayAfterTomorrow = new Date(tomorrow)
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

        const { data: tomorrowAppointments } = await supabaseClient
          .from('appointments')
          .select(`
            *,
            clients (name, email, phone)
          `)
          .eq('user_id', userSettings.user_id)
          .gte('start_datetime', tomorrow.toISOString().split('T')[0])
          .lt('start_datetime', dayAfterTomorrow.toISOString().split('T')[0])
          .in('status', ['scheduled', 'confirmed'])
          .order('start_datetime')

        // Generate digest email
        const digestHtml = generateDailyDigest(
          user.name,
          todayAppointments || [],
          tomorrowAppointments || []
        )

        // Send email
        const emailSent = await sendDigestEmail({
          to: user.email,
          subject: `📅 Resumen Diario - ${today.toLocaleDateString('es-ES')}`,
          html: digestHtml
        })

        results.push({
          userId: userSettings.user_id,
          email: user.email,
          status: emailSent ? 'sent' : 'failed',
          todayCount: todayAppointments?.length || 0,
          tomorrowCount: tomorrowAppointments?.length || 0
        })

      } catch (error) {
        console.error(`Error processing digest for user ${userSettings.user_id}:`, error)
        results.push({
          userId: userSettings.user_id,
          status: 'failed',
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Error in daily-digest function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

function generateDailyDigest(userName: string, todayAppointments: any[], tomorrowAppointments: any[]): string {
  const today = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowFormatted = tomorrow.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #F8FAFC;">
      <div style="background-color: #3B82F6; color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">📅 Resumen Diario</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">Hola ${userName}, aquí está tu resumen de citas</p>
      </div>

      <div style="padding: 30px;">
        <!-- Today's Appointments -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #1E293B; margin-bottom: 15px; font-size: 20px;">
            🕐 Hoy - ${today}
          </h2>
          
          ${todayAppointments.length === 0 ? `
            <div style="background-color: #F1F5F9; padding: 20px; border-radius: 8px; text-align: center; color: #64748B;">
              <p style="margin: 0;">No tienes citas programadas para hoy</p>
              <p style="margin: 10px 0 0 0; font-size: 14px;">¡Disfruta tu día libre! 🌟</p>
            </div>
          ` : `
            <div style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              ${todayAppointments.map((apt, index) => {
                const time = new Date(apt.start_datetime).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit'
                })
                return `
                  <div style="padding: 15px; ${index < todayAppointments.length - 1 ? 'border-bottom: 1px solid #E2E8F0;' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                      <div style="flex: 1;">
                        <h4 style="margin: 0; color: #1E293B; font-size: 16px;">${apt.title}</h4>
                        <p style="margin: 5px 0; color: #64748B; font-size: 14px;">
                          👤 ${apt.clients.name}
                          ${apt.location ? `<br>📍 ${apt.location}` : ''}
                        </p>
                      </div>
                      <div style="background-color: #3B82F6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;">
                        ${time}
                      </div>
                    </div>
                  </div>
                `
              }).join('')}
            </div>
          `}
        </div>

        <!-- Tomorrow's Appointments -->
        <div style="margin-bottom: 30px;">
          <h2 style="color: #1E293B; margin-bottom: 15px; font-size: 20px;">
            🌅 Mañana - ${tomorrowFormatted}
          </h2>
          
          ${tomorrowAppointments.length === 0 ? `
            <div style="background-color: #F1F5F9; padding: 20px; border-radius: 8px; text-align: center; color: #64748B;">
              <p style="margin: 0;">No tienes citas programadas para mañana</p>
            </div>
          ` : `
            <div style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              ${tomorrowAppointments.map((apt, index) => {
                const time = new Date(apt.start_datetime).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit'
                })
                return `
                  <div style="padding: 15px; ${index < tomorrowAppointments.length - 1 ? 'border-bottom: 1px solid #E2E8F0;' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                      <div style="flex: 1;">
                        <h4 style="margin: 0; color: #1E293B; font-size: 16px;">${apt.title}</h4>
                        <p style="margin: 5px 0; color: #64748B; font-size: 14px;">
                          👤 ${apt.clients.name}
                          ${apt.location ? `<br>📍 ${apt.location}` : ''}
                        </p>
                      </div>
                      <div style="background-color: #10B981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;">
                        ${time}
                      </div>
                    </div>
                  </div>
                `
              }).join('')}
            </div>
          `}
        </div>

        <!-- Summary Stats -->
        <div style="background-color: #FEF3C7; border: 1px solid #F59E0B; border-radius: 8px; padding: 20px; text-align: center;">
          <h3 style="margin: 0 0 10px 0; color: #92400E;">📊 Resumen</h3>
          <p style="margin: 0; color: #92400E; font-size: 14px;">
            Hoy: <strong>${todayAppointments.length} citas</strong> | 
            Mañana: <strong>${tomorrowAppointments.length} citas</strong>
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #E2E8F0; padding: 20px; text-align: center; color: #64748B; font-size: 12px;">
        <p style="margin: 0;">Este es un resumen automático de Bookio</p>
        <p style="margin: 5px 0 0 0;">
          <a href="#" style="color: #3B82F6; text-decoration: none;">Abrir aplicación</a> | 
          <a href="#" style="color: #3B82F6; text-decoration: none;">Configurar notificaciones</a>
        </p>
      </div>
    </div>
  `
}

async function sendDigestEmail(emailData: { to: string; subject: string; html: string }): Promise<boolean> {
  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return false
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Bookio <digest@Bookio.com>',
        to: [emailData.to],
        subject: emailData.subject,
        html: emailData.html,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Digest email sending failed:', errorText)
      return false
    }

    const result = await response.json()
    console.log('Digest email sent successfully:', result.id)
    return true

  } catch (error) {
    console.error('Error sending digest email:', error)
    return false
  }
}