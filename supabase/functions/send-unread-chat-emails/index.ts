import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UnreadMessage {
  conversation_id: string
  sender_name: string
  sender_email: string
  message_content: string
  message_sent_at: string
  unread_count: number
}

interface ClientWithUnreadMessages {
  user_id: string
  email: string
  full_name: string
  unread_messages: UnreadMessage[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('[send-unread-chat-emails] 🔍 Buscando mensajes no leídos mayores a 15 minutos...')

    // Query para obtener clientes con mensajes no leídos > 15 minutos
    // 1. Obtener notificaciones de chat_message no leídas > 15 minutos
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()

    const { data: unreadNotifications, error: notifError } = await supabase
      .from('in_app_notifications')
      .select(`
        id,
        user_id,
        type,
        status,
        data,
        created_at
      `)
      .eq('type', 'chat_message')
      .eq('status', 'unread')
      .lt('created_at', fifteenMinutesAgo) // Creado hace más de 15 minutos
      .order('created_at', { ascending: false })

    if (notifError) {
      console.error('[send-unread-chat-emails] ❌ Error fetching notifications:', notifError)
      throw notifError
    }

    if (!unreadNotifications || unreadNotifications.length === 0) {
      console.log('[send-unread-chat-emails] ✅ No hay mensajes no leídos > 15 minutos')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No unread messages found',
          emails_sent: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[send-unread-chat-emails] 📊 Found ${unreadNotifications.length} unread notifications`)

    // 2. Agrupar por user_id
    const groupedByUser = new Map<string, typeof unreadNotifications>()
    
    for (const notif of unreadNotifications) {
      const userId = notif.user_id
      if (!groupedByUser.has(userId)) {
        groupedByUser.set(userId, [])
      }
      groupedByUser.get(userId)!.push(notif)
    }

    console.log(`[send-unread-chat-emails] 👥 Agrupados en ${groupedByUser.size} usuarios`)

    // 3. Para cada usuario, verificar que sea CLIENTE (no admin ni employee)
    const clientsToNotify: ClientWithUnreadMessages[] = []

    for (const [userId, notifications] of groupedByUser.entries()) {
      // Obtener perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, full_name, role')
        .eq('id', userId)
        .single()

      if (profileError || !profile) {
        console.warn(`[send-unread-chat-emails] ⚠️ Usuario ${userId} no encontrado`)
        continue
      }

      // ✅ FILTRO: Solo clientes
      // Verificar si el usuario es cliente (no tiene negocios como owner ni es employee)
      const { data: ownedBusinesses } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', userId)
        .limit(1)

      const { data: employeeLinks } = await supabase
        .from('business_employees')
        .select('id')
        .eq('employee_id', userId)
        .limit(1)

      const isAdmin = ownedBusinesses && ownedBusinesses.length > 0
      const isEmployee = employeeLinks && employeeLinks.length > 0

      if (isAdmin || isEmployee) {
        console.log(`[send-unread-chat-emails] ⏭️ Usuario ${profile.full_name} es admin/employee, omitiendo`)
        continue
      }

      console.log(`[send-unread-chat-emails] ✅ Usuario ${profile.full_name} es CLIENTE`)

      // Verificar preferencias de notificación (si quiere emails de chat)
      const { data: preferences } = await supabase
        .from('user_notification_preferences')
        .select('enabled')
        .eq('user_id', userId)
        .eq('notification_type', 'chat_message')
        .eq('channel', 'email')
        .single()

      // Si tiene preferencia explícita de NO recibir emails de chat, respetar
      if (preferences && !preferences.enabled) {
        console.log(`[send-unread-chat-emails] ⏭️ Usuario ${profile.full_name} deshabilitó emails de chat`)
        continue
      }

      // Procesar notificaciones para extraer info de mensajes
      const unreadMessages: UnreadMessage[] = []
      
      for (const notif of notifications) {
        const data = notif.data as any
        unreadMessages.push({
          conversation_id: data.conversation_id || '',
          sender_name: data.sender_name || 'Usuario desconocido',
          sender_email: data.sender_email || '',
          message_content: notif.data?.message || data.message_preview || 'Nuevo mensaje',
          message_sent_at: notif.created_at,
          unread_count: 1
        })
      }

      // Agrupar por conversación
      const groupedByConversation = new Map<string, UnreadMessage>()
      for (const msg of unreadMessages) {
        const convId = msg.conversation_id
        if (!groupedByConversation.has(convId)) {
          groupedByConversation.set(convId, { ...msg, unread_count: 0 })
        }
        const existing = groupedByConversation.get(convId)!
        existing.unread_count++
        // Mantener el mensaje más reciente
        if (new Date(msg.message_sent_at) > new Date(existing.message_sent_at)) {
          groupedByConversation.set(convId, { ...msg, unread_count: existing.unread_count })
        }
      }

      clientsToNotify.push({
        user_id: userId,
        email: profile.email,
        full_name: profile.full_name || 'Usuario',
        unread_messages: Array.from(groupedByConversation.values())
      })
    }

    if (clientsToNotify.length === 0) {
      console.log('[send-unread-chat-emails] ✅ No hay clientes para notificar')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No clients to notify',
          emails_sent: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[send-unread-chat-emails] 📧 Enviando emails a ${clientsToNotify.length} clientes...`)

    // 4. Enviar emails
    const emailResults = []

    for (const client of clientsToNotify) {
      try {
        const totalUnread = client.unread_messages.reduce((sum, msg) => sum + msg.unread_count, 0)
        
        // Preparar HTML del email
        const emailHtml = generateEmailHtml(client.full_name, client.unread_messages, totalUnread)
        
        // Enviar email usando send-notification edge function
        const { error: sendError } = await supabase.functions.invoke('send-notification', {
          body: {
            type: 'chat_message',
            recipient_user_id: client.user_id,
            recipient_email: client.email,
            recipient_name: client.full_name,
            data: {
              unread_count: totalUnread,
              conversations: client.unread_messages.length,
              preview: client.unread_messages[0].message_content
            },
            force_channels: ['email'],
            skip_preferences: false,
            action_url: `${Deno.env.get('APP_URL') || 'https://appointsync.app'}/chat`,
            priority: 0
          }
        })

        if (sendError) {
          console.error(`[send-unread-chat-emails] ❌ Error enviando email a ${client.email}:`, sendError)
          emailResults.push({
            email: client.email,
            success: false,
            error: sendError.message
          })
        } else {
          console.log(`[send-unread-chat-emails] ✅ Email enviado a ${client.email}`)
          
          // Marcar notificaciones como "email_sent" en data
          const notificationIds = unreadNotifications
            .filter(n => n.user_id === client.user_id)
            .map(n => n.id)
          
          await supabase
            .from('in_app_notifications')
            .update({ 
              data: { 
                ...client.unread_messages[0],
                email_reminder_sent: true, 
                email_sent_at: new Date().toISOString() 
              }
            })
            .in('id', notificationIds)

          emailResults.push({
            email: client.email,
            success: true,
            unread_count: totalUnread
          })
        }

      } catch (err: any) {
        console.error(`[send-unread-chat-emails] ❌ Error procesando cliente ${client.email}:`, err)
        emailResults.push({
          email: client.email,
          success: false,
          error: err.message
        })
      }
    }

    const successCount = emailResults.filter(r => r.success).length

    console.log(`[send-unread-chat-emails] 🎉 Completado: ${successCount}/${clientsToNotify.length} emails enviados`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${successCount} emails`,
        emails_sent: successCount,
        total_clients: clientsToNotify.length,
        results: emailResults
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('[send-unread-chat-emails] ❌ Error general:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/**
 * Genera HTML del email con mensajes no leídos
 */
function generateEmailHtml(
  userName: string, 
  messages: UnreadMessage[], 
  totalUnread: number
): string {
  const appUrl = Deno.env.get('APP_URL') || 'https://appointsync.app'
  
  const messagesHtml = messages.map(msg => `
    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #0066cc;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <strong style="color: #0066cc; font-size: 16px;">${msg.sender_name}</strong>
        <span style="color: #6c757d; font-size: 12px;">${msg.unread_count} mensaje${msg.unread_count > 1 ? 's' : ''} nuevo${msg.unread_count > 1 ? 's' : ''}</span>
      </div>
      <p style="color: #495057; margin: 8px 0; line-height: 1.5;">
        "${msg.message_content.substring(0, 150)}${msg.message_content.length > 150 ? '...' : ''}"
      </p>
      <small style="color: #6c757d;">${new Date(msg.message_sent_at).toLocaleString('es-ES', { 
        day: 'numeric', 
        month: 'short', 
        hour: '2-digit', 
        minute: '2-digit' 
      })}</small>
    </div>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nuevos mensajes sin leer - AppointSync</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0066cc 0%, #004999 100%); color: white; padding: 30px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 600;">💬 Nuevos Mensajes</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Tienes ${totalUnread} mensaje${totalUnread > 1 ? 's' : ''} sin leer</p>
        </div>

        <!-- Body -->
        <div style="padding: 30px 20px;">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
            Hola <strong>${userName}</strong>,
          </p>
          
          <p style="font-size: 14px; color: #6c757d; margin-bottom: 25px;">
            Has recibido mensajes que aún no has leído en las últimas horas. Aquí te mostramos una vista previa:
          </p>

          <!-- Messages -->
          ${messagesHtml}

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/chat" 
               style="display: inline-block; background: #0066cc; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(0,102,204,0.3); transition: background 0.3s ease;">
              Ver Mensajes Completos
            </a>
          </div>

          <p style="font-size: 13px; color: #6c757d; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
            <strong>💡 Consejo:</strong> Responde rápido para mejorar tu comunicación y no perder oportunidades.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
          <p style="font-size: 12px; color: #6c757d; margin: 0 0 10px;">
            Recibes este email porque tienes mensajes sin leer en AppointSync.
          </p>
          <p style="font-size: 12px; color: #6c757d; margin: 0;">
            <a href="${appUrl}/settings/notifications" style="color: #0066cc; text-decoration: none;">Administrar preferencias de notificación</a>
          </p>
          <p style="font-size: 11px; color: #adb5bd; margin: 15px 0 0;">
            © ${new Date().getFullYear()} AppointSync. Todos los derechos reservados.
          </p>
        </div>

      </div>
    </body>
    </html>
  `
}
