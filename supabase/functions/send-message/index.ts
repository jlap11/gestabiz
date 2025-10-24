// ============================================================================
// EDGE FUNCTION: send-message
// Fecha: 2025-10-13
// Versión: 1.0
// Descripción: Maneja el envío de mensajes en el sistema de chat
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

// Rate limiting simple (en memoria, se reinicia con cada cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

const MAX_MESSAGES_PER_MINUTE = 30
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minuto

// Palabras prohibidas (ejemplo básico)
const BANNED_WORDS = ['spam', 'scam', 'phishing']

interface SendMessageRequest {
  conversation_id: string
  type: 'text' | 'image' | 'file' | 'system'
  body?: string
  metadata?: Record<string, unknown>
  reply_to?: string
}

interface SendMessageResponse {
  success: boolean
  message_id?: string
  error?: string
  rate_limit?: {
    remaining: number
    reset_at: number
  }
}

serve(async req => {
  try {
    // ============================================================================
    // 1. INICIALIZACIÓN
    // ============================================================================

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Obtener usuario autenticado
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ============================================================================
    // 2. VALIDAR REQUEST
    // ============================================================================

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const request: SendMessageRequest = await req.json()

    // Validar campos requeridos
    if (!request.conversation_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'conversation_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!request.type) {
      return new Response(JSON.stringify({ success: false, error: 'type is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Validar que tenga contenido
    if (!request.body && !request.metadata?.file_url && !request.metadata?.image_url) {
      return new Response(
        JSON.stringify({ success: false, error: 'Message must have body or attachment' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ============================================================================
    // 3. RATE LIMITING
    // ============================================================================

    const now = Date.now()
    const userKey = user.id
    const rateLimitData = rateLimitMap.get(userKey)

    if (rateLimitData) {
      if (now < rateLimitData.resetAt) {
        if (rateLimitData.count >= MAX_MESSAGES_PER_MINUTE) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Rate limit exceeded',
              rate_limit: {
                remaining: 0,
                reset_at: rateLimitData.resetAt,
              },
            }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
          )
        }
        rateLimitData.count++
      } else {
        // Reset ventana
        rateLimitData.count = 1
        rateLimitData.resetAt = now + RATE_LIMIT_WINDOW
      }
    } else {
      rateLimitMap.set(userKey, {
        count: 1,
        resetAt: now + RATE_LIMIT_WINDOW,
      })
    }

    const currentRateLimit = rateLimitMap.get(userKey)!
    const remaining = MAX_MESSAGES_PER_MINUTE - currentRateLimit.count

    // ============================================================================
    // 4. VERIFICAR PERMISOS
    // ============================================================================

    // Verificar que el usuario es miembro de la conversación
    const { data: membership, error: membershipError } = await supabaseClient
      .from('conversation_members')
      .select('role, muted')
      .eq('conversation_id', request.conversation_id)
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return new Response(
        JSON.stringify({ success: false, error: 'Not a member of this conversation' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ============================================================================
    // 5. ANTI-SPAM Y VALIDACIONES
    // ============================================================================

    if (request.type === 'text' && request.body) {
      const bodyLower = request.body.toLowerCase()

      // Verificar palabras prohibidas
      for (const word of BANNED_WORDS) {
        if (bodyLower.includes(word)) {
          console.warn(`Spam detected from user ${user.id}: contains "${word}"`)
          return new Response(
            JSON.stringify({ success: false, error: 'Message contains prohibited content' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          )
        }
      }

      // Validar longitud del mensaje
      if (request.body.length > 5000) {
        return new Response(
          JSON.stringify({ success: false, error: 'Message too long (max 5000 characters)' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Detectar spam por repetición excesiva de caracteres
      const repeatedChars = /(.)\1{10,}/
      if (repeatedChars.test(request.body)) {
        console.warn(`Spam detected from user ${user.id}: excessive character repetition`)
        return new Response(
          JSON.stringify({ success: false, error: 'Message contains spam patterns' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    // Validar metadata de archivos
    if (request.type === 'file' && request.metadata?.file_url) {
      const fileSize = request.metadata.file_size as number
      const maxSize = 10 * 1024 * 1024 // 10 MB

      if (fileSize && fileSize > maxSize) {
        return new Response(
          JSON.stringify({ success: false, error: 'File too large (max 10 MB)' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    // Validar reply_to existe
    if (request.reply_to) {
      const { data: replyMessage, error: replyError } = await supabaseClient
        .from('messages')
        .select('id, conversation_id')
        .eq('id', request.reply_to)
        .eq('is_deleted', false)
        .single()

      if (replyError || !replyMessage) {
        return new Response(
          JSON.stringify({ success: false, error: 'Reply-to message not found' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }

      if (replyMessage.conversation_id !== request.conversation_id) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Reply-to message is from different conversation',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    // ============================================================================
    // 6. GUARDAR MENSAJE EN DB
    // ============================================================================

    const { data: newMessage, error: insertError } = await supabaseClient
      .from('messages')
      .insert({
        conversation_id: request.conversation_id,
        sender_id: user.id,
        type: request.type,
        body: request.body || null,
        metadata: request.metadata || {},
        reply_to: request.reply_to || null,
        delivery_status: 'sent', // Estado inicial de entrega
        read_by: [], // Array vacío, se llenará cuando usuarios lean el mensaje
      })
      .select('id, created_at, delivery_status')
      .single()

    if (insertError || !newMessage) {
      console.error('Error inserting message:', insertError)
      return new Response(JSON.stringify({ success: false, error: 'Failed to send message' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // ============================================================================
    // 7. NOTIFICAR A OTROS MIEMBROS
    // ============================================================================

    // Obtener miembros que no son el sender y tienen notificaciones habilitadas
    const { data: membersToNotify, error: membersError } = await supabaseClient
      .from('conversation_members')
      .select('user_id, notifications_enabled, muted')
      .eq('conversation_id', request.conversation_id)
      .neq('user_id', user.id)

    if (!membersError && membersToNotify) {
      const notifyPromises = membersToNotify
        .filter(m => m.notifications_enabled && !m.muted)
        .map(async member => {
          try {
            // Obtener info de la conversación para el título de la notificación
            const { data: conversation } = await supabaseClient
              .from('conversations')
              .select('type, name, business_id')
              .eq('id', request.conversation_id)
              .single()

            // Obtener nombre del sender
            const { data: senderProfile } = await supabaseClient
              .from('profiles')
              .select('full_name')
              .eq('id', user.id)
              .single()

            let notificationTitle = 'Nuevo mensaje'
            if (conversation) {
              if (conversation.type === 'direct') {
                notificationTitle = `Mensaje de ${senderProfile?.full_name || 'Usuario'}`
              } else {
                notificationTitle = `${senderProfile?.full_name || 'Usuario'} en ${conversation.name}`
              }
            }

            // Enviar notificación in-app
            await supabaseClient.functions.invoke('send-notification', {
              body: {
                type: 'system_alert', // Podríamos crear 'chat_message' en el futuro
                recipient_user_id: member.user_id,
                business_id: conversation?.business_id,
                title: notificationTitle,
                body: request.body
                  ? request.body.substring(0, 100) + (request.body.length > 100 ? '...' : '')
                  : request.type === 'image'
                    ? '📷 Imagen'
                    : request.type === 'file'
                      ? '📎 Archivo'
                      : 'Mensaje',
                data: {
                  conversation_id: request.conversation_id,
                  message_id: newMessage.id,
                  sender_id: user.id,
                },
                action_url: `/chat/${request.conversation_id}`,
                force_channels: ['in_app'],
                priority: 0,
              },
            })
          } catch (notifyError) {
            console.error(`Failed to notify user ${member.user_id}:`, notifyError)
            // No bloquear el envío del mensaje si falla la notificación
          }
        })

      // Ejecutar notificaciones en paralelo (sin await para no bloquear)
      Promise.all(notifyPromises).catch(err => console.error('Some notifications failed:', err))
    }

    // ============================================================================
    // 8. ANALYTICS (opcional)
    // ============================================================================

    // Aquí podrías agregar tracking de analytics
    // Por ejemplo: incrementar contador de mensajes enviados, track engagement, etc.

    // ============================================================================
    // 9. RESPUESTA EXITOSA
    // ============================================================================

    const response: SendMessageResponse = {
      success: true,
      message_id: newMessage.id,
      rate_limit: {
        remaining,
        reset_at: currentRateLimit.resetAt,
      },
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': currentRateLimit.resetAt.toString(),
      },
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

/* ============================================================================
 * NOTAS DE USO
 * ============================================================================
 *
 * 1. DESPLIEGUE:
 *    npx supabase functions deploy send-message
 *
 * 2. TESTING LOCAL:
 *    npx supabase functions serve send-message
 *
 * 3. EJEMPLO DE USO:
 *    const { data, error } = await supabase.functions.invoke('send-message', {
 *      body: {
 *        conversation_id: 'uuid',
 *        type: 'text',
 *        body: 'Hola, ¿cómo estás?',
 *        reply_to: 'message-uuid' // opcional
 *      }
 *    })
 *
 * 4. RATE LIMITING:
 *    - 30 mensajes por minuto por usuario
 *    - Headers de respuesta incluyen:
 *      * X-RateLimit-Remaining
 *      * X-RateLimit-Reset
 *
 * 5. VALIDACIONES:
 *    - Usuario debe ser miembro de la conversación
 *    - Mensaje debe tener body o attachment
 *    - Body máximo 5000 caracteres
 *    - Archivos máximo 10 MB
 *    - Anti-spam básico (palabras prohibidas, repetición)
 *
 * 6. NOTIFICACIONES:
 *    - Se envían notificaciones in-app a miembros con:
 *      * notifications_enabled = true
 *      * muted = false
 *    - Las notificaciones no bloquean el envío del mensaje
 *
 * 7. REALTIME:
 *    - El trigger increment_unread_on_message actualiza automáticamente:
 *      * unread_count de otros miembros
 *      * last_message_at y preview de la conversación
 *    - Supabase Realtime propaga los cambios automáticamente
 *
 * 8. TODO/MEJORAS FUTURAS:
 *    - [ ] Agregar tipo 'chat_message' en notification_type_enum
 *    - [ ] Implementar detección de spam más sofisticada (ML?)
 *    - [ ] Agregar analytics detallados (tiempo de respuesta, engagement)
 *    - [ ] Implementar typing indicators (broadcast presence)
 *    - [ ] Agregar soporte para reactions/emojis
 *    - [ ] Implementar encryption end-to-end (opcional)
 *    - [ ] Rate limiting distribuido (Redis)
 *
 * ============================================================================
 */
