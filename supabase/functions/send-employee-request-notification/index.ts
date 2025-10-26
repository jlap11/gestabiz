import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmployeeRequestNotification {
  request_id: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { request_id }: EmployeeRequestNotification = await req.json()

    if (!request_id) {
      throw new Error('request_id is required')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get request details with business and user information
    const { data: request, error: requestError } = await supabase
      .from('employee_requests')
      .select(`
        *,
        business:businesses!employee_requests_business_id_fkey (
          id,
          name,
          owner_id,
          email,
          phone
        ),
        user:profiles!employee_requests_user_id_fkey (
          id,
          full_name,
          email,
          phone
        )
      `)
      .eq('id', request_id)
      .single()

    if (requestError || !request) {
      throw new Error(`Failed to fetch request: ${requestError?.message}`)
    }

    // Get business owner details
    const { data: owner, error: ownerError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', request.business.owner_id)
      .single()

    if (ownerError || !owner) {
      throw new Error(`Failed to fetch business owner: ${ownerError?.message}`)
    }

    // Email service configuration (using Resend)
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not configured, skipping email notification')
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Email service not configured',
          request_id 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Build email content
    const emailSubject = `Nueva solicitud de empleado para ${request.business.name}`
    const emailContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva solicitud de empleado</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">📋 Nueva Solicitud de Empleado</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hola <strong>${owner.full_name}</strong>,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Has recibido una nueva solicitud para unirse como empleado a tu negocio <strong>${request.business.name}</strong>.
    </p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
      <h2 style="color: #667eea; margin-top: 0; font-size: 18px;">Detalles del Solicitante</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; width: 120px;">👤 Nombre:</td>
          <td style="padding: 8px 0;">${request.user.full_name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">📧 Email:</td>
          <td style="padding: 8px 0;">${request.user.email}</td>
        </tr>
        ${request.user.phone ? `
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">📱 Teléfono:</td>
          <td style="padding: 8px 0;">${request.user.phone}</td>
        </tr>
        ` : ''}
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">🔑 Código usado:</td>
          <td style="padding: 8px 0;"><code style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${request.invitation_code}</code></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">📅 Fecha:</td>
          <td style="padding: 8px 0;">${new Date(request.created_at).toLocaleString('es-ES', { 
            dateStyle: 'full', 
            timeStyle: 'short' 
          })}</td>
        </tr>
      </table>
      
      ${request.message ? `
      <div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 6px;">
        <p style="margin: 0; font-weight: bold; color: #667eea;">💬 Mensaje del solicitante:</p>
        <p style="margin: 10px 0 0 0; font-style: italic;">"${request.message}"</p>
      </div>
      ` : ''}
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <p style="font-size: 16px; margin-bottom: 15px;">
        <strong>¿Qué deseas hacer?</strong>
      </p>
      
      <a href="${supabaseUrl.replace('/rest/v1', '')}/dashboard" 
         style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 5px;">
        ✅ Ir al Dashboard
      </a>
    </div>
    
    <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #856404;">
        <strong>⚠️ Importante:</strong> Esta solicitud quedará pendiente hasta que la apruebes o rechaces desde el dashboard de administración.
      </p>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="font-size: 14px; color: #666; text-align: center; margin: 0;">
      Este es un mensaje automático de <strong>Gestabiz</strong>.<br>
      Si no esperabas esta notificación, puedes ignorar este email.
    </p>
  </div>
</body>
</html>
    `.trim()

    // Send email using Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Gestabiz <notifications@appointsync.pro>',
        to: owner.email,
        subject: emailSubject,
        html: emailContent,
        reply_to: request.user.email,
      }),
    })

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text()
      throw new Error(`Failed to send email: ${resendResponse.status} - ${errorData}`)
    }

    const resendData = await resendResponse.json()

    // Log notification in database (optional)
    await supabase.from('notifications').insert({
      user_id: owner.id,
      type: 'employee_request',
      title: 'Nueva solicitud de empleado',
      message: `${request.user.full_name} quiere unirse a ${request.business.name}`,
      metadata: {
        request_id: request.id,
        requester_id: request.user.id,
        business_id: request.business.id,
      },
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email notification sent successfully',
        email_id: resendData.id,
        request_id 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error sending employee request notification:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
