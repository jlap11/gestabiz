# Script para configurar Brevo en Supabase Edge Functions
# Uso: .\configure-brevo.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuración de Brevo para Gestabiz" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si npx está disponible
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: npx no está instalado." -ForegroundColor Red
    Write-Host "Instala Node.js desde https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ npx detectado correctamente" -ForegroundColor Green
Write-Host ""

# Configurar Brevo API Key
Write-Host "📧 Configurando Brevo API Key..." -ForegroundColor Yellow
Write-Host "Por favor, ingresa tu Brevo API Key:" -ForegroundColor White
$brevoApiKey = Read-Host
if ([string]::IsNullOrWhiteSpace($brevoApiKey)) {
    Write-Host "❌ Error: API Key no puede estar vacío" -ForegroundColor Red
    exit 1
}
npx supabase secrets set BREVO_API_KEY=$brevoApiKey

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ BREVO_API_KEY configurado" -ForegroundColor Green
} else {
    Write-Host "❌ Error configurando BREVO_API_KEY" -ForegroundColor Red
    exit 1
}

# Configurar SMTP (opcional pero recomendado)
Write-Host ""
Write-Host "📧 Configurando credenciales SMTP..." -ForegroundColor Yellow

npx supabase secrets set BREVO_SMTP_HOST=smtp-relay.brevo.com
npx supabase secrets set BREVO_SMTP_PORT=587
npx supabase secrets set BREVO_SMTP_USER=no-reply@gestabiz.com

Write-Host "Por favor, ingresa tu contraseña SMTP de Brevo:" -ForegroundColor White
$smtpPassword = Read-Host -AsSecureString
$smtpPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($smtpPassword))
if ([string]::IsNullOrWhiteSpace($smtpPasswordPlain)) {
    Write-Host "❌ Error: Contraseña SMTP no puede estar vacía" -ForegroundColor Red
    exit 1
}
npx supabase secrets set BREVO_SMTP_PASSWORD=$smtpPasswordPlain

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Credenciales SMTP configuradas" -ForegroundColor Green
} else {
    Write-Host "❌ Error configurando SMTP" -ForegroundColor Red
    exit 1
}

# Configurar email de soporte
Write-Host ""
Write-Host "📧 Configurando email de soporte..." -ForegroundColor Yellow
npx supabase secrets set SUPPORT_EMAIL=soporte@gestabiz.com

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ SUPPORT_EMAIL configurado" -ForegroundColor Green
} else {
    Write-Host "❌ Error configurando SUPPORT_EMAIL" -ForegroundColor Red
    exit 1
}

# Resumen
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ Configuración completada exitosamente" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Secrets configurados:" -ForegroundColor Yellow
Write-Host "  • BREVO_API_KEY" -ForegroundColor White
Write-Host "  • BREVO_SMTP_HOST" -ForegroundColor White
Write-Host "  • BREVO_SMTP_PORT" -ForegroundColor White
Write-Host "  • BREVO_SMTP_USER" -ForegroundColor White
Write-Host "  • BREVO_SMTP_PASSWORD" -ForegroundColor White
Write-Host "  • SUPPORT_EMAIL" -ForegroundColor White
Write-Host ""

# Preguntar si desplegar Edge Functions
Write-Host "¿Deseas desplegar las Edge Functions ahora? (S/N)" -ForegroundColor Yellow
$deploy = Read-Host

if ($deploy -eq "S" -or $deploy -eq "s") {
    Write-Host ""
    Write-Host "🚀 Desplegando Edge Functions..." -ForegroundColor Yellow
    
    # Desplegar send-notification
    Write-Host ""
    Write-Host "Desplegando send-notification..." -ForegroundColor Cyan
    npx supabase functions deploy send-notification
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ send-notification desplegado" -ForegroundColor Green
    } else {
        Write-Host "❌ Error desplegando send-notification" -ForegroundColor Red
    }
    
    # Desplegar send-bug-report-email
    Write-Host ""
    Write-Host "Desplegando send-bug-report-email..." -ForegroundColor Cyan
    npx supabase functions deploy send-bug-report-email
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ send-bug-report-email desplegado" -ForegroundColor Green
    } else {
        Write-Host "❌ Error desplegando send-bug-report-email" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  ✅ Despliegue completado" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "ℹ️  Recuerda desplegar las Edge Functions manualmente:" -ForegroundColor Yellow
    Write-Host "   npx supabase functions deploy send-notification" -ForegroundColor White
    Write-Host "   npx supabase functions deploy send-bug-report-email" -ForegroundColor White
}

Write-Host ""
Write-Host "📄 Para más información, lee: supabase/functions/_shared/BREVO_SETUP.md" -ForegroundColor Cyan
Write-Host ""
