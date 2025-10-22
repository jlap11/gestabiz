# 🚀 Despliegue Inmediato - Configuración de Brevo

**Estado**: ⚠️ PENDIENTE DE DESPLIEGUE  
**Fecha**: 22 de octubre de 2025  
**Impacto**: Sistema de emails (Edge Functions)

---

## ⚡ Pasos Rápidos (5 minutos)

### 1️⃣ Configurar Secrets en Supabase

**Opción A: Script Automatizado (Recomendado)**
```powershell
# Ejecutar desde raíz del proyecto
.\scripts\configure-brevo.ps1
```

**Opción B: Manual**
```powershell
# API Key (REQUERIDO)
npx supabase secrets set BREVO_API_KEY=xkeysib-YOUR_API_KEY_HERE

# SMTP (opcional pero recomendado)
npx supabase secrets set BREVO_SMTP_HOST=smtp-relay.brevo.com
npx supabase secrets set BREVO_SMTP_PORT=587
npx supabase secrets set BREVO_SMTP_USER=no-reply@gestabiz.com
npx supabase secrets set BREVO_SMTP_PASSWORD=xsmtpsib-YOUR_SMTP_PASSWORD_HERE

# Email de soporte
npx supabase secrets set SUPPORT_EMAIL=soporte@gestabiz.com
```

### 2️⃣ Desplegar Edge Functions

```powershell
# Desplegar send-notification (función principal)
npx supabase functions deploy send-notification

# Desplegar send-bug-report-email
npx supabase functions deploy send-bug-report-email
```

### 3️⃣ Verificar Despliegue

**En Supabase Dashboard**:
1. Ve a **Edge Functions**
2. Verifica que ambas funciones muestren status **"Active"**
3. Revisa logs recientes para confirmar que no hay errores

**Test Manual**:
1. Ve a Edge Functions → **send-notification**
2. Clic en **"Invoke"**
3. Payload de prueba:
```json
{
  "type": "email_verification",
  "recipient_email": "tu-email@example.com",
  "recipient_name": "Test Usuario",
  "data": {
    "verification_code": "123456",
    "verification_link": "https://gestabiz.com/verify/123"
  },
  "force_channels": ["email"]
}
```
4. Clic en **"Run"**
5. Verifica que recibas el email

---

## 📋 Checklist de Verificación

### Pre-Despliegue
- [x] ✅ Código refactorizado (send-notification, send-bug-report-email)
- [x] ✅ Módulo compartido creado (_shared/brevo.ts)
- [x] ✅ Documentación actualizada
- [x] ✅ Script de configuración creado

### Despliegue
- [ ] ⚠️ Secrets configurados en Supabase
- [ ] ⚠️ Edge Functions desplegadas
- [ ] ⚠️ Test manual exitoso
- [ ] ⚠️ Verificación en logs

### Post-Despliegue
- [ ] ⚠️ Monitoreo en Brevo Dashboard (primeras 24h)
- [ ] ⚠️ Eliminar secrets de AWS (opcional)
- [ ] ⚠️ Notificar al equipo del cambio

---

## 🔍 Comandos de Verificación

### Ver Secrets Configurados
```powershell
npx supabase secrets list
```

**Output esperado**:
```
BREVO_API_KEY=xkey***
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=no-reply@gestabiz.com
BREVO_SMTP_PASSWORD=xsmt***
SUPPORT_EMAIL=soporte@gestabiz.com
```

### Ver Edge Functions Desplegadas
```powershell
npx supabase functions list
```

**Output esperado**:
```
send-notification          2025-10-22 15:30:00  Active
send-bug-report-email      2025-10-22 15:31:00  Active
```

### Ver Logs en Tiempo Real
```powershell
npx supabase functions serve send-notification --debug
```

---

## 🚨 Problemas Comunes

### Error: "npx: command not found"
**Solución**: Instala Node.js desde https://nodejs.org/

### Error: "Supabase CLI not installed"
**Solución**:
```powershell
npm install -g supabase
```

### Error: "Not logged in to Supabase"
**Solución**:
```powershell
npx supabase login
```

### Error: "Project ref not set"
**Solución**:
```powershell
npx supabase link --project-ref your-project-ref
```

### Error al desplegar función
**Solución**: Verifica que estés en la raíz del proyecto y que exista la carpeta `supabase/functions/`

---

## 📊 Monitoreo Post-Despliegue

### Brevo Dashboard
1. Ve a https://app.brevo.com/statistics/email
2. Verifica **"Emails sent"** en las últimas 24h
3. Revisa **"Bounce rate"** (debe ser < 5%)
4. Revisa **"Spam complaints"** (debe ser 0%)

### Supabase Logs
1. Ve a Supabase Dashboard → **Edge Functions**
2. Selecciona **send-notification**
3. Ve a tab **"Logs"**
4. Filtra por últimas 24h
5. Busca mensajes con "[Brevo]" o errores

### Alertas a Configurar
- Email bounce rate > 5%
- Spam complaints > 0
- Errores en logs > 10/hora
- Límite diario alcanzado (300 emails)

---

## 📞 Contacto de Emergencia

**Si algo falla**:
1. Revisa logs en Supabase Dashboard
2. Revisa logs en Brevo Dashboard
3. Contacta al equipo: soporte@gestabiz.com
4. GitHub Issues: https://github.com/TI-Turing/appointsync-pro/issues

**Rollback de emergencia**:
```powershell
# Restaurar versión anterior de Edge Functions
git checkout HEAD~1 supabase/functions/send-notification/index.ts
git checkout HEAD~1 supabase/functions/send-bug-report-email/index.ts
npx supabase functions deploy send-notification
npx supabase functions deploy send-bug-report-email
```

---

## ✅ Confirmación Final

Una vez completado el despliegue, actualiza este archivo:

```markdown
## ✅ Despliegue Completado

- **Fecha**: ___________
- **Desplegado por**: ___________
- **Test manual**: ✅ / ❌
- **Logs verificados**: ✅ / ❌
- **Monitoreo activo**: ✅ / ❌

**Notas adicionales**:
_______________________________________
_______________________________________
```

---

*Este documento debe actualizarse después del despliegue exitoso.*
