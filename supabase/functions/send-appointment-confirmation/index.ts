// Supabase Edge Function: send-appointment-confirmation
// Deploy with: npx supabase functions deploy send-appointment-confirmation
// Purpose: Generate confirmation token & deadline, then send email with links

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { appointmentId } = await req.json();
    if (!appointmentId || typeof appointmentId !== "string") {
      throw new Error("appointmentId is required");
    }

    // Generar token y deadline sin depender del RPC (evita uuid_generate_v4)
    {
      const hoursEnv = Deno.env.get("APPOINTMENT_CONFIRMATION_DEADLINE_HOURS");
      const confirmationHours = hoursEnv ? Number.parseInt(hoursEnv, 10) : 24;
      const token = (globalThis.crypto && "randomUUID" in globalThis.crypto)
        ? globalThis.crypto.randomUUID()
        : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}-${Math.random().toString(16).slice(2, 6)}-${Math.random().toString(16).slice(2, 6)}-${Math.random().toString(16).slice(2, 12)}`;
      const deadline = new Date(Date.now() + (Number.isFinite(confirmationHours) ? confirmationHours : 24) * 60 * 60 * 1000).toISOString();

      const { error: updErr } = await supabase
        .from("appointments")
        .update({ confirmation_token: token, confirmation_deadline: deadline })
        .eq("id", appointmentId);
      if (updErr) throw new Error(`Failed to set confirmation fields: ${updErr.message}`);
    }

    // Fetch updated appointment with joins for email content
    const { data: appt, error: apptErr } = await supabase
      .from("appointments")
      .select(
        `id, business_id, start_time, end_time, confirmation_token, confirmation_deadline,
         client:profiles!client_id(id, full_name, email, phone, whatsapp),
         service:services(id, name, duration_minutes, price),
         location:locations(id, name, address),
         business:businesses(id, name, email, phone)`
      )
      .eq("id", appointmentId)
      .single();
    if (apptErr || !appt) throw new Error("Appointment not found");

    const token: string | null = appt.confirmation_token ?? null;
    const deadline: string | null = appt.confirmation_deadline ?? null;
    if (!token) throw new Error("Failed to generate confirmation token");

    // Build links
    const appUrl =
      Deno.env.get("PUBLIC_APP_URL") ||
      Deno.env.get("APP_BASE_URL") ||
      "https://gestabiz.app";
    const confirmUrl = `${appUrl}/confirmar-cita/${token}`;
    const cancelUrl = `${appUrl}/cancelar-cita/${token}`;

    // Prepare email
    const toEmail: string | undefined = appt.client?.email ?? undefined;
    const clientName = appt.client?.full_name ?? "Cliente";
    const businessName = appt.business?.name ?? "Gestabiz";
    const serviceName = appt.service?.name ?? "Cita";
    const start = new Date(appt.start_time);
    const localeDate = start.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const localeTime = start.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

    const subject = `Confirma tu cita: ${serviceName} en ${businessName}`;
    const html = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 22px;">Confirmación de Cita</h1>
            </div>
            <div style="background: white; padding: 24px; border: 1px solid #e1e5e9; border-radius: 0 0 10px 10px;">
              <p>Hola ${clientName},</p>
              <p>Tienes una cita programada para <strong>${localeDate}</strong> a las <strong>${localeTime}</strong> con <strong>${businessName}</strong>.</p>
              <p>Servicio: <strong>${serviceName}</strong></p>
              <p>Por favor confirma tu asistencia usando los siguientes enlaces:</p>
              <div style="margin: 20px 0;">
                <a href="${confirmUrl}" style="background: #10b981; color: white; padding: 12px 16px; text-decoration: none; border-radius: 6px; margin-right: 10px; display: inline-block;">Confirmar Cita</a>
                <a href="${cancelUrl}" style="background: #ef4444; color: white; padding: 12px 16px; text-decoration: none; border-radius: 6px; display: inline-block;">Cancelar</a>
              </div>
              ${deadline ? `<p style="color:#6b7280; font-size: 14px;">Puedes confirmar hasta: ${new Date(deadline).toLocaleString('es-ES')}</p>` : ''}
              <p>Si tienes preguntas, responde a este correo.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const resendApiKey = Deno.env.get("RESEND_API_KEY") ?? "";
    if (!resendApiKey) {
      // If provider not configured, return success with info
      return new Response(
        JSON.stringify({ success: true, sent: false, reason: "RESEND_API_KEY not configured", confirmUrl, cancelUrl }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (!toEmail) {
      return new Response(
        JSON.stringify({ success: false, error: "Client email not available" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${businessName} <noreply@gestabiz.app>`,
        to: [toEmail],
        subject,
        html,
      }),
    });
    if (!emailResponse.ok) {
      const errText = await emailResponse.text();
      throw new Error(`Failed to send email: ${errText}`);
    }

    return new Response(JSON.stringify({ success: true, sent: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
