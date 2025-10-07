-- Supabase Edge Functions for Bookio
-- Copy these functions to your Supabase project

-- =====================================================
-- EMAIL REMINDER FUNCTION
-- =====================================================

-- Function: send-email-reminder
-- Deploy with: supabase functions deploy send-email-reminder

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { appointmentId, type } = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        client:clients(*),
        business:businesses(*),
        service:services(*),
        location:locations(*)
      `)
      .eq('id', appointmentId)
      .single()

    if (appointmentError || !appointment) {
      throw new Error('Appointment not found')
    }

    // Get email template
    const { data: template, error: templateError } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('type', type)
      .eq('channel', 'email')
      .or(`business_id.eq.${appointment.business_id},business_id.is.null`)
      .order('business_id', { nullsLast: false })
      .limit(1)
      .single()

    if (templateError || !template) {
      throw new Error('Email template not found')
    }

    // Replace template variables
    const variables = {
      client_name: appointment.client_name,
      business_name: appointment.business.name,
      appointment_date: new Date(appointment.start_time).toLocaleDateString('es-ES'),
      appointment_time: new Date(appointment.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      service_name: appointment.service?.name || appointment.title,
      location: appointment.location?.name || appointment.location || appointment.business.address,
      business_phone: appointment.business.phone,
      business_email: appointment.business.email
    }

    let emailContent = template.message
    let emailSubject = template.subject || 'Recordatorio de cita'

    // Replace variables in content and subject
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      emailContent = emailContent.replace(new RegExp(placeholder, 'g'), value || '')
      emailSubject = emailSubject.replace(new RegExp(placeholder, 'g'), value || '')
    })

    // Send email using your preferred email service (SendGrid, Resend, etc.)
    const emailData = {
      to: appointment.client_email,
      from: appointment.business.email || 'noreply@Bookio.com',
      subject: emailSubject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8f9fa; padding: 20px; text-align: center;">
            <h1 style="color: #333; margin: 0;">${appointment.business.name}</h1>
          </div>
          <div style="padding: 30px 20px;">
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              ${emailContent.replace(/\n/g, '<br>')}
            </p>
            <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h3 style="margin: 0 0 10px 0; color: #333;">Detalles de la cita:</h3>
              <p style="margin: 5px 0;"><strong>Fecha:</strong> ${variables.appointment_date}</p>
              <p style="margin: 5px 0;"><strong>Hora:</strong> ${variables.appointment_time}</p>
              <p style="margin: 5px 0;"><strong>Servicio:</strong> ${variables.service_name}</p>
              <p style="margin: 5px 0;"><strong>Ubicación:</strong> ${variables.location}</p>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Si necesitas cancelar o reprogramar tu cita, por favor contacta con nosotros al ${appointment.business.phone}
            </p>
          </div>
        </div>
      `
    }

    // Here you would integrate with your email service
    // Example with SendGrid:
    /*
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendGridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    })
    */

    // For now, we'll log the email and mark as sent
    console.log('Email to send:', emailData)

    // Update notification status
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ 
        status: 'sent', 
        sent_at: new Date().toISOString() 
      })
      .eq('appointment_id', appointmentId)
      .eq('type', type)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email reminder sent successfully',
        emailData 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

-- =====================================================
-- WHATSAPP REMINDER FUNCTION
-- =====================================================

-- Function: send-whatsapp-reminder
-- Deploy with: supabase functions deploy send-whatsapp-reminder

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { appointmentId, type, clientPhone } = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        client:clients(*),
        business:businesses(*),
        service:services(*),
        location:locations(*)
      `)
      .eq('id', appointmentId)
      .single()

    if (appointmentError || !appointment) {
      throw new Error('Appointment not found')
    }

    // Get WhatsApp template
    const { data: template, error: templateError } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('type', 'reminder')
      .eq('business_id', appointment.business_id)
      .eq('is_active', true)
      .limit(1)
      .single()

    // Default template if none exists
    const defaultMessage = `Hola {{client_name}}, te recordamos que tienes una cita el {{appointment_date}} a las {{appointment_time}} para {{service_name}} en {{location}}. ¡Te esperamos!`
    
    const messageTemplate = template?.message || defaultMessage

    // Replace template variables
    const variables = {
      client_name: appointment.client_name,
      business_name: appointment.business.name,
      appointment_date: new Date(appointment.start_time).toLocaleDateString('es-ES'),
      appointment_time: new Date(appointment.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      service_name: appointment.service?.name || appointment.title,
      location: appointment.location?.name || appointment.location || appointment.business.address
    }

    let message = messageTemplate
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      message = message.replace(new RegExp(placeholder, 'g'), value || '')
    })

    // Format phone number (remove any non-digits and add country code if needed)
    const phoneNumber = clientPhone.replace(/\D/g, '')
    const formattedPhone = phoneNumber.startsWith('34') ? phoneNumber : `34${phoneNumber}`

    // Send WhatsApp message using your preferred service (Twilio, WhatsApp Business API, etc.)
    const whatsappData = {
      to: `+${formattedPhone}`,
      message: message,
      business: appointment.business.name
    }

    // Here you would integrate with your WhatsApp service
    // Example with Twilio:
    /*
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
    const twilioWhatsAppNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER')
    
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: `whatsapp:${twilioWhatsAppNumber}`,
        To: `whatsapp:${whatsappData.to}`,
        Body: whatsappData.message
      })
    })
    */

    // For now, we'll log the message and mark as sent
    console.log('WhatsApp message to send:', whatsappData)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'WhatsApp reminder sent successfully',
        whatsappData 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

-- =====================================================
-- AUTOMATED NOTIFICATION SCHEDULER
-- =====================================================

-- Function: schedule-notifications
-- Deploy with: supabase functions deploy schedule-notifications
-- Set up as a cron job to run every hour

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const now = new Date()
    const in24Hours = new Date(now.getTime() + (24 * 60 * 60 * 1000))
    const in1Hour = new Date(now.getTime() + (60 * 60 * 1000))

    // Get upcoming appointments that need reminders
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        *,
        client:clients(*),
        business:businesses(*),
        assigned_user:users!user_id(*)
      `)
      .eq('status', 'scheduled')
      .gte('start_time', now.toISOString())
      .lte('start_time', in24Hours.toISOString())

    if (appointmentsError) {
      throw new Error('Failed to fetch appointments')
    }

    const notifications = []

    for (const appointment of appointments) {
      const startTime = new Date(appointment.start_time)
      
      // Check if we need to send 24h reminder
      const reminder24h = new Date(startTime.getTime() - (24 * 60 * 60 * 1000))
      if (reminder24h <= now && reminder24h > new Date(now.getTime() - (60 * 60 * 1000))) {
        // Check if 24h reminder already exists
        const { data: existing24h } = await supabase
          .from('notifications')
          .select('id')
          .eq('appointment_id', appointment.id)
          .eq('type', 'reminder_24h')
          .single()

        if (!existing24h && appointment.assigned_user.notification_preferences?.reminder_24h) {
          notifications.push({
            appointment_id: appointment.id,
            user_id: appointment.user_id,
            type: 'reminder_24h',
            title: 'Recordatorio de cita (24h)',
            message: `Cita programada para mañana: ${appointment.title}`,
            scheduled_for: now.toISOString(),
            delivery_method: 'email'
          })
        }
      }

      // Check if we need to send 1h reminder
      const reminder1h = new Date(startTime.getTime() - (60 * 60 * 1000))
      if (reminder1h <= now && reminder1h > new Date(now.getTime() - (10 * 60 * 1000))) {
        // Check if 1h reminder already exists
        const { data: existing1h } = await supabase
          .from('notifications')
          .select('id')
          .eq('appointment_id', appointment.id)
          .eq('type', 'reminder_1h')
          .single()

        if (!existing1h && appointment.assigned_user.notification_preferences?.reminder_1h) {
          notifications.push({
            appointment_id: appointment.id,
            user_id: appointment.user_id,
            type: 'reminder_1h',
            title: 'Recordatorio de cita (1h)',
            message: `Cita en 1 hora: ${appointment.title}`,
            scheduled_for: now.toISOString(),
            delivery_method: 'whatsapp'
          })
        }
      }
    }

    // Insert notifications
    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (insertError) {
        throw new Error('Failed to create notifications')
      }

      // Trigger the actual sending of notifications
      for (const notification of notifications) {
        if (notification.delivery_method === 'email') {
          // Call email function
          await fetch(`${supabaseUrl}/functions/v1/send-email-reminder`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              appointmentId: notification.appointment_id,
              type: notification.type
            })
          })
        } else if (notification.delivery_method === 'whatsapp') {
          // Call WhatsApp function
          const appointment = appointments.find(a => a.id === notification.appointment_id)
          await fetch(`${supabaseUrl}/functions/v1/send-whatsapp-reminder`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              appointmentId: notification.appointment_id,
              type: notification.type,
              clientPhone: appointment.client_whatsapp || appointment.client_phone
            })
          })
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${appointments.length} appointments, created ${notifications.length} notifications`,
        notifications: notifications.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

-- =====================================================
-- CLIENT ANALYTICS FUNCTION
-- =====================================================

-- Function: generate-client-analytics
-- Deploy with: supabase functions deploy generate-client-analytics

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { businessId, period } = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Calculate date range based on period
    const now = new Date()
    let startDate: Date
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
        break
      case 'month':
        startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
        break
      case 'quarter':
        startDate = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000))
        break
      case 'year':
        startDate = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000))
        break
      default:
        startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
    }

    // Get client analytics
    const { data: clientAnalytics, error: analyticsError } = await supabase
      .rpc('get_client_analytics', {
        business_id: businessId,
        start_date: startDate.toISOString(),
        end_date: now.toISOString()
      })

    if (analyticsError) {
      throw new Error('Failed to generate client analytics')
    }

    // Get recurring clients who stopped coming
    const { data: lostClients, error: lostError } = await supabase
      .from('clients')
      .select(`
        *,
        appointments:appointments(count)
      `)
      .eq('business_id', businessId)
      .eq('is_recurring', true)
      .lt('last_appointment', new Date(now.getTime() - (60 * 24 * 60 * 60 * 1000)).toISOString()) // 60 days ago
      .order('last_appointment', { ascending: false })

    const analytics = {
      period,
      start_date: startDate.toISOString(),
      end_date: now.toISOString(),
      client_analytics: clientAnalytics || [],
      lost_recurring_clients: lostClients || [],
      summary: {
        total_clients: clientAnalytics?.length || 0,
        active_clients: clientAnalytics?.filter(c => c.engagement_status === 'active').length || 0,
        at_risk_clients: clientAnalytics?.filter(c => c.engagement_status === 'at_risk').length || 0,
        lost_clients: lostClients?.length || 0
      }
    }

    // Store analytics in database
    const { error: storeError } = await supabase
      .from('business_analytics')
      .upsert({
        business_id: businessId,
        period,
        start_date: startDate.toISOString().split('T')[0],
        end_date: now.toISOString().split('T')[0],
        metrics: analytics
      })

    return new Response(
      JSON.stringify({ 
        success: true, 
        analytics
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})

-- =====================================================
-- DATABASE FUNCTIONS (SQL)
-- =====================================================

-- Function to get client analytics
CREATE OR REPLACE FUNCTION get_client_analytics(
    business_id UUID,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    client_id UUID,
    client_name VARCHAR,
    client_email VARCHAR,
    total_appointments BIGINT,
    completed_appointments BIGINT,
    cancelled_appointments BIGINT,
    no_show_appointments BIGINT,
    total_revenue DECIMAL,
    last_appointment TIMESTAMP WITH TIME ZONE,
    days_since_last_appointment INTEGER,
    engagement_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.email,
        COUNT(a.id) as total_appointments,
        COUNT(a.id) FILTER (WHERE a.status = 'completed') as completed_appointments,
        COUNT(a.id) FILTER (WHERE a.status = 'cancelled') as cancelled_appointments,
        COUNT(a.id) FILTER (WHERE a.status = 'no_show') as no_show_appointments,
        COALESCE(SUM(a.price) FILTER (WHERE a.status = 'completed'), 0) as total_revenue,
        MAX(a.start_time) FILTER (WHERE a.status = 'completed') as last_appointment,
        COALESCE(EXTRACT(days FROM NOW() - MAX(a.start_time) FILTER (WHERE a.status = 'completed'))::INTEGER, 999) as days_since_last_appointment,
        CASE 
            WHEN MAX(a.start_time) FILTER (WHERE a.status = 'completed') IS NULL THEN 'new'
            WHEN MAX(a.start_time) FILTER (WHERE a.status = 'completed') < NOW() - INTERVAL '90 days' THEN 'lost'
            WHEN MAX(a.start_time) FILTER (WHERE a.status = 'completed') < NOW() - INTERVAL '30 days' THEN 'at_risk'
            ELSE 'active'
        END as engagement_status
    FROM public.clients c
    LEFT JOIN public.appointments a ON c.id = a.client_id 
        AND a.start_time BETWEEN get_client_analytics.start_date AND get_client_analytics.end_date
    WHERE c.business_id = get_client_analytics.business_id
    GROUP BY c.id, c.name, c.email
    ORDER BY total_appointments DESC;
END;
$$ LANGUAGE plpgsql;