# 🧪 Guía de Pruebas - Sistema de Notificaciones

## ✅ Lo que ESTÁ IMPLEMENTADO y se puede probar

### 1. UI de Preferencias de Usuario (✅ COMPLETO)

**Ubicación:** Perfil → Tab "Notificaciones"

**Pasos:**
```bash
# 1. Iniciar app
npm run dev

# 2. Login en http://localhost:5173
# 3. Ir a Perfil (icono usuario arriba derecha)
# 4. Click en tab "Notificaciones"
```

**Qué probar:**

✅ **Canales de Notificación:**
- [ ] Toggle Email (con badge verde "Verificado")
- [ ] Toggle SMS (con badge amarillo "No verificado")
- [ ] Toggle WhatsApp (con badge amarillo "No verificado")
- [ ] Al desactivar un canal, debe mostrar alerta

✅ **Preferencias por Tipo:**
- [ ] Expandir "Citas" - ver 4 tipos de notificaciones
- [ ] Cambiar canales para "Recordatorios de cita"
- [ ] Expandir "Solicitudes de Empleo" - ver 3 tipos
- [ ] Expandir "Aplicaciones a Vacantes" - ver 4 tipos
- [ ] Expandir "Sistema" - ver 1 tipo

✅ **No Molestar:**
- [ ] Activar/desactivar toggle "No molestar"
- [ ] Cambiar "Desde las" (hora inicio)
- [ ] Cambiar "Hasta las" (hora fin)

✅ **Resúmenes:**
- [ ] Activar "Resumen diario" → aparece selector de hora
- [ ] Cambiar hora del resumen diario
- [ ] Activar "Resumen semanal" → aparece selector de día
- [ ] Cambiar día de la semana

✅ **Guardar:**
- [ ] Click en "Guardar Preferencias"
- [ ] Ver toast de confirmación
- [ ] Recargar página → ver que se mantienen los cambios

**Verificar en Base de Datos:**
```sql
-- Ver preferencias guardadas
SELECT * FROM user_notification_preferences 
WHERE user_id = auth.uid();
```

---

### 2. Procesador de Recordatorios Automático (✅ FUNCIONAL)

**Estado:** Desplegado y ejecutándose cada 5 minutos

**Probar manualmente:**
```bash
# Invocar Edge Function directamente
npx supabase functions invoke process-reminders

# Debe retornar algo como:
# {
#   "processed": 5,
#   "sent": 3,
#   "failed": 0,
#   "reminders": [...]
# }
```

**Verificar en Base de Datos:**
```sql
-- Ver recordatorios enviados
SELECT 
  nl.created_at,
  nl.notification_type,
  nl.channel,
  nl.status,
  nl.recipient_contact,
  a.start_time
FROM notification_log nl
LEFT JOIN appointments a ON nl.appointment_id = a.id
WHERE nl.notification_type = 'appointment_reminder'
ORDER BY nl.created_at DESC
LIMIT 10;

-- Ver próximas citas que necesitan recordatorios
SELECT 
  a.id,
  a.start_time,
  a.reminder_sent,
  b.name as business_name,
  EXTRACT(EPOCH FROM (a.start_time - NOW())) / 60 as minutes_until
FROM appointments a
JOIN businesses b ON a.business_id = b.id
WHERE a.start_time > NOW()
  AND a.start_time < NOW() + INTERVAL '24 hours'
  AND a.status != 'cancelled'
ORDER BY a.start_time;
```

**Verificar Cron Job:**
```sql
-- Ver si el cron job está activo
SELECT 
  jobname,
  schedule,
  active,
  nodename
FROM cron.job 
WHERE jobname = 'process-appointment-reminders';

-- Ver últimas ejecuciones
SELECT 
  runid,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details 
WHERE jobid = (
  SELECT jobid FROM cron.job 
  WHERE jobname = 'process-appointment-reminders'
)
ORDER BY start_time DESC 
LIMIT 10;
```

---

### 3. Edge Function de Envío (✅ FUNCIONAL)

**Probar envío directo:**
```bash
# Probar envío de email
npx supabase functions invoke send-notification --data '{
  "notification_type": "appointment_confirmation",
  "business_id": "TU_BUSINESS_ID",
  "user_id": "TU_USER_ID",
  "channel": "email",
  "recipient": "test@example.com",
  "subject": "Prueba de Notificación",
  "message": "Este es un mensaje de prueba del sistema de notificaciones"
}'
```

**Variables AWS necesarias** (en Supabase Dashboard → Edge Functions):
```
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_REGION=us-east-1
SES_FROM_EMAIL=noreply@tudominio.com
WHATSAPP_ACCESS_TOKEN=xxxxx (opcional)
WHATSAPP_PHONE_NUMBER_ID=xxxxx (opcional)
```

**Verificar logs:**
```sql
SELECT 
  created_at,
  notification_type,
  channel,
  status,
  recipient_contact,
  error_message
FROM notification_log
ORDER BY created_at DESC
LIMIT 20;
```

---

## ❌ Lo que NO está implementado (y no se puede probar)

### 1. ⏳ UI de Configuración de Negocios
**Archivo:** NO EXISTE `src/components/admin/settings/BusinessNotificationSettings.tsx`

**Lo que falta:**
- Toggle de canales por negocio
- Editor de reminder_times (24h, 1h, etc.)
- Ordenar prioridad de canales
- Configurar horarios de envío
- Guardar en `business_notification_settings`

### 2. ⏳ Panel de Tracking
**Archivo:** NO EXISTE `src/components/admin/NotificationTracking.tsx`

**Lo que falta:**
- Tabla de notification_log con filtros
- Gráficos de tasa de éxito
- Stats: total enviadas, fallidas, por canal
- Exportación CSV

### 3. ⏳ Sistema de Vacantes UI
**Archivos:** NO EXISTEN componentes en `src/components/jobs/`

**Lo que falta:**
- Listar vacantes publicadas
- Crear nueva vacante
- Ver detalle de vacante
- Aplicar a vacante
- Ver aplicaciones recibidas
- Aceptar/rechazar aplicaciones

---

## 📋 Resumen del Estado

| Funcionalidad | Estado | Se puede probar |
|--------------|--------|-----------------|
| AWS SES/SNS Integration | ✅ Completo | ✅ Sí (con keys) |
| UI Preferencias Usuario | ✅ Completo | ✅ Sí |
| Procesador Recordatorios | ✅ Completo | ✅ Sí |
| Migraciones BD | ✅ Ejecutadas | ✅ Sí |
| UI Config Negocios | ❌ No existe | ❌ No |
| Panel Tracking | ❌ No existe | ❌ No |
| UI Vacantes | ❌ No existe | ❌ No |

---

## 🚀 Próximos Pasos

**Para completar el sistema faltaría:**

1. Crear `BusinessNotificationSettings.tsx` (~300 líneas)
2. Crear `NotificationTracking.tsx` (~400 líneas)
3. Crear 5 componentes del sistema de vacantes (~800 líneas)

**Total estimado:** ~1,500 líneas de código adicional

---

## 📞 Soporte

**Documentación completa:**
- `SISTEMA_NOTIFICACIONES_COMPLETO.md` - Arquitectura
- `COMO_PROBAR_NOTIFICACIONES.md` - Testing rápido
- `CHECKLIST_TESTING_NOTIFICACIONES.md` - Checklist visual
- `MIGRACIONES_EJECUTADAS_NOTIFICACIONES.md` - Estado BD

**¿Necesitas implementar las UIs faltantes?** Avísame qué componente quieres que desarrolle primero.
