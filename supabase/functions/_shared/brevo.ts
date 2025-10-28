/**
 * Brevo Email Service (Sendinblue)
 * Utility para envío de emails a través de Brevo SMTP
 * 
 * Configuración:
 * - SMTP Server: smtp-relay.brevo.com
 * - Port: 587
 * - Authentication: SMTP credentials
 */

interface BrevoEmailParams {
  to: string | string[]
  subject: string
  htmlBody: string
  textBody?: string
  fromEmail?: string
  fromName?: string
  replyTo?: string
}

interface BrevoEmailResponse {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Envía un email usando Brevo SMTP
 */
export async function sendBrevoEmail(params: BrevoEmailParams): Promise<BrevoEmailResponse> {
  console.log('🚀 [BREVO] Iniciando sendBrevoEmail')
  console.log('📧 [BREVO] Parámetros recibidos:', {
    to: params.to,
    subject: params.subject,
    fromEmail: params.fromEmail,
    fromName: params.fromName,
    htmlBodyLength: params.htmlBody?.length,
    textBodyLength: params.textBody?.length,
    replyTo: params.replyTo
  })

  const smtpHost = Deno.env.get('BREVO_SMTP_HOST') || 'smtp-relay.brevo.com'
  const smtpPort = parseInt(Deno.env.get('BREVO_SMTP_PORT') || '587')
  const smtpUser = Deno.env.get('BREVO_SMTP_USER') || 'no-reply@gestabiz.com'
  const smtpPass = Deno.env.get('BREVO_SMTP_PASSWORD')
  
  console.log('⚙️ [BREVO] Configuración SMTP:', {
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPassConfigured: !!smtpPass
  })
  
  if (!smtpPass) {
    console.error('❌ [BREVO] BREVO_SMTP_PASSWORD no configurado')
    return { 
      success: false, 
      error: 'BREVO_SMTP_PASSWORD not configured' 
    }
  }

  const fromEmail = params.fromEmail || smtpUser
  const fromName = params.fromName || 'Gestabiz'
  const recipients = Array.isArray(params.to) ? params.to : [params.to]

  console.log('📮 [BREVO] Configuración final:', {
    fromEmail,
    fromName,
    recipients,
    recipientCount: recipients.length
  })

  try {
    // Usamos la API de Brevo en lugar de SMTP directo (más confiable en edge functions)
    const brevoApiKey = Deno.env.get('BREVO_API_KEY')
    
    console.log('🔑 [BREVO] API Key configurada:', !!brevoApiKey)
    
    if (brevoApiKey) {
      console.log('🌐 [BREVO] Usando Brevo API (método preferido)')
      // Usar API si está disponible (preferido)
      return await sendViaBrevoAPI(params, brevoApiKey, fromEmail, fromName)
    } else {
      console.log('📡 [BREVO] Fallback a SMTP')
      // Fallback a SMTP usando fetch (menos confiable pero funciona)
      return await sendViaSMTP(params, smtpHost, smtpPort, smtpUser, smtpPass, fromEmail, fromName)
    }
  } catch (error) {
    console.error('❌ [BREVO] Error enviando email:', error)
    return { 
      success: false, 
      error: error.message || 'Unknown error sending email' 
    }
  }
}

/**
 * Envía email usando Brevo API v3 (método preferido)
 */
async function sendViaBrevoAPI(
  params: BrevoEmailParams,
  apiKey: string,
  fromEmail: string,
  fromName: string
): Promise<BrevoEmailResponse> {
  console.log('🌐 [BREVO-API] Iniciando sendViaBrevoAPI')
  
  const recipients = Array.isArray(params.to) ? params.to : [params.to]
  
  console.log('👥 [BREVO-API] Destinatarios procesados:', recipients)
  
  const payload = {
    sender: {
      name: fromName,
      email: fromEmail
    },
    to: recipients.map(email => ({ email })),
    subject: params.subject,
    htmlContent: params.htmlBody,
    textContent: params.textBody || stripHtml(params.htmlBody),
    ...(params.replyTo && { replyTo: { email: params.replyTo } })
  }

  console.log('📦 [BREVO-API] Payload preparado:', {
    sender: payload.sender,
    to: payload.to,
    subject: payload.subject,
    htmlContentLength: payload.htmlContent.length,
    textContentLength: payload.textContent.length,
    hasReplyTo: !!payload.replyTo
  })

  console.log('🔗 [BREVO-API] Enviando request a Brevo API...')
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': apiKey
    },
    body: JSON.stringify(payload)
  })

  console.log('📡 [BREVO-API] Respuesta recibida:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('❌ [BREVO-API] Error en la respuesta:', {
      status: response.status,
      statusText: response.statusText,
      error: error
    })
    throw new Error(`Brevo API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  console.log('✅ [BREVO-API] Respuesta exitosa:', data)
  
  return {
    success: true,
    messageId: data.messageId
  }
}

/**
 * Fallback: Envía email usando SMTP a través de un proxy HTTP
 * Nota: Deno no soporta SMTP directo, usamos un proxy o API
 */
async function sendViaSMTP(
  params: BrevoEmailParams,
  host: string,
  port: number,
  user: string,
  pass: string,
  fromEmail: string,
  fromName: string
): Promise<BrevoEmailResponse> {
  // En Deno Edge Functions no tenemos acceso directo a SMTP
  // Esta función está aquí como referencia, pero SIEMPRE usa la API
  console.warn('[Brevo] SMTP directo no soportado en Edge Functions, usa BREVO_API_KEY')
  
  return {
    success: false,
    error: 'SMTP directo no soportado. Configura BREVO_API_KEY para usar la API.'
  }
}

/**
 * Helper: Elimina tags HTML básico para crear versión texto
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Helper: Valida formato de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Template moderno de email para Gestabiz (basado en diseño Bookio)
 */
export function createBasicEmailTemplate(
  title: string,
  content: string,
  buttonText?: string,
  buttonUrl?: string,
  additionalContent?: string
): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Gestabiz</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            line-height: 1.6;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        
        .header {
            background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
            padding: 40px 30px;
            text-align: center;
        }
        
        .logo {
            width: 80px;
            height: 80px;
            background: white;
            border-radius: 20px;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            font-weight: bold;
            color: #a855f7;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        
        .logo-text {
            color: white;
            font-size: 32px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        h1 {
            color: #1e293b;
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 16px;
            text-align: center;
        }
        
        .greeting {
            color: #475569;
            font-size: 16px;
            margin-bottom: 24px;
            text-align: center;
        }
        
        .message {
            color: #64748b;
            font-size: 15px;
            margin-bottom: 32px;
            text-align: center;
            line-height: 1.7;
        }
        
        .cta-container {
            text-align: center;
            margin: 40px 0;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
            color: white;
            text-decoration: none;
            padding: 16px 48px;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            box-shadow: 0 4px 20px rgba(168, 85, 247, 0.4);
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 30px rgba(168, 85, 247, 0.5);
        }
        
        .divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
            margin: 32px 0;
        }
        
        .alternative {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            margin: 24px 0;
        }
        
        .alternative-title {
            color: #475569;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 12px;
        }
        
        .alternative-link {
            color: #a855f7;
            font-size: 13px;
            word-break: break-all;
            text-decoration: none;
            display: block;
            padding: 12px;
            background: white;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        
        .security-note {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            border-radius: 8px;
            margin: 24px 0;
        }
        
        .security-note p {
            color: #92400e;
            font-size: 14px;
            margin: 0;
        }
        
        .footer {
            background: #f8fafc;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer-text {
            color: #64748b;
            font-size: 13px;
            margin-bottom: 12px;
        }
        
        .footer-links {
            margin-top: 16px;
        }
        
        .footer-link {
            color: #a855f7;
            text-decoration: none;
            font-size: 13px;
            margin: 0 12px;
        }
        
        .social-icons {
            margin-top: 20px;
        }
        
        .social-icon {
            display: inline-block;
            width: 36px;
            height: 36px;
            background: #e2e8f0;
            border-radius: 50%;
            margin: 0 6px;
            line-height: 36px;
            text-align: center;
            color: #64748b;
            text-decoration: none;
            transition: all 0.2s;
        }
        
        .social-icon:hover {
            background: #a855f7;
            color: white;
        }
        
        /* Responsive */
        @media only screen and (max-width: 600px) {
            body {
                padding: 20px 10px;
            }
            
            .content {
                padding: 30px 20px;
            }
            
            h1 {
                font-size: 24px;
            }
            
            .cta-button {
                padding: 14px 32px;
                font-size: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <div class="logo">📅</div>
            <div class="logo-text">Gestabiz</div>
        </div>
        
        <!-- Content -->
        <div class="content">
            <h1>${title}</h1>
            
            <div class="message">
                ${content}
            </div>
            
            ${buttonText && buttonUrl ? `
            <!-- CTA Button -->
            <div class="cta-container">
                <a href="${buttonUrl}" class="cta-button">
                    ${buttonText}
                </a>
            </div>
            
            <!-- Divider -->
            <div class="divider"></div>
            
            <!-- Alternative Method -->
            <div class="alternative">
                <p class="alternative-title">
                    ¿El botón no funciona? Copia y pega este enlace en tu navegador:
                </p>
                <a href="${buttonUrl}" class="alternative-link">
                    ${buttonUrl}
                </a>
            </div>
            ` : ''}
            
            ${additionalContent ? `
            <div class="message" style="margin-top: 32px;">
                ${additionalContent}
            </div>
            ` : ''}
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p class="footer-text">
                © ${new Date().getFullYear()} Gestabiz. Todos los derechos reservados.
            </p>
            
            <p class="footer-text">
                Gestiona tus citas de forma inteligente
            </p>
            
            <div class="footer-links">
                <a href="https://gestabiz.com" class="footer-link">Sitio Web</a>
                <a href="https://gestabiz.com/support" class="footer-link">Soporte</a>
                <a href="https://gestabiz.com/privacy" class="footer-link">Privacidad</a>
                <a href="https://gestabiz.com/terms" class="footer-link">Términos</a>
            </div>
            
            <div class="social-icons">
                <a href="https://twitter.com/gestabiz" class="social-icon">𝕏</a>
                <a href="https://facebook.com/gestabiz" class="social-icon">f</a>
                <a href="https://instagram.com/gestabiz" class="social-icon">📷</a>
                <a href="https://linkedin.com/company/gestabiz" class="social-icon">in</a>
            </div>
        </div>
    </div>
</body>
</html>
  `.trim()
}
