# 🎯 INSTRUCCIONES FINALES - Sistema de Emails Mensajes No Leídos

## ✅ ¿Qué se ha implementado?

Se ha creado un sistema completo que **envía emails automáticamente a clientes** cuando tienen mensajes de chat sin leer después de **15 minutos**.

### Características Implementadas

- ✅ **Edge Function desplegada**: `send-unread-chat-emails`
- ✅ **Filtrado por rol**: Solo clientes (no admins ni empleados)
- ✅ **Respeto de preferencias**: Si el usuario desactivó emails de chat, no recibe
- ✅ **Prevención de duplicados**: Tracking con `data.email_reminder_sent`
- ✅ **Email HTML bonito**: Con preview de mensajes y link al chat
- ✅ **Performance optimizado**: Índices SQL para búsquedas rápidas
- ✅ **Monitoreo**: Vista SQL con estadísticas diarias

---

## ⚠️ PENDIENTE: Activar Cron Job (5 minutos)

**Sin esto, el sistema NO funcionará automáticamente.**

### Pasos:

1. **Ir al Dashboard de Supabase**:
   ```
   https://supabase.com/dashboard/project/dkancockzvcqorqbwtyh/functions
   ```

2. **Clic en la función**: `send-unread-chat-emails`

3. **Ir a la pestaña "Settings"**

4. **Activar "Cron Schedule"**:
   - Toggle: **ON**
   - Expression: `*/15 * * * *`
   - Descripción: "Send emails for unread chat messages > 15 minutes"

5. **Guardar**

### ¿Qué hace el cron?

```
*/15 * * * * = Cada 15 minutos, 24/7
```

Ejecuciones:
- 00:00, 00:15, 00:30, 00:45
- 01:00, 01:15, 01:30, 01:45
- ... (continuo)

---

## 🧪 Testing Manual (Recomendado)

### Escenario de Prueba

1. **Crear usuario cliente** (o usar uno existente):
   - Que NO sea owner de ningún negocio
   - Que NO esté en `business_employees`

2. **Enviar mensaje sin leer**:
   - Usuario A envía mensaje a Cliente B
   - Cliente B NO abre el chat (no marca como leído)

3. **Esperar 15 minutos**

4. **Invocar función manualmente** (para testing inmediato):
   ```bash
   npx supabase functions invoke send-unread-chat-emails --no-verify-jwt
   ```

5. **Verificar**:
   - ✅ Email recibido en inbox del Cliente B
   - ✅ Email tiene preview del mensaje
   - ✅ Link "Ver Mensajes Completos" funciona

### Verificar en SQL

```sql
-- Ver si el email fue marcado como enviado
SELECT 
  id,
  user_id,
  title,
  data->>'email_reminder_sent' as reminder_sent,
  data->>'email_sent_at' as sent_at,
  created_at
FROM in_app_notifications
WHERE type = 'chat_message'
  AND data->>'email_reminder_sent' = 'true'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📊 Monitoreo Continuo

### Query de Estadísticas Diarias

```sql
SELECT * FROM v_unread_chat_email_stats
WHERE date >= CURRENT_DATE - 7
ORDER BY date DESC;
```

### Query de Emails de Hoy

```sql
SELECT COUNT(*) as emails_sent_today
FROM in_app_notifications
WHERE type = 'chat_message'
  AND data->>'email_reminder_sent' = 'true'
  AND DATE((data->>'email_sent_at')::TIMESTAMPTZ) = CURRENT_DATE;
```

### Query de Clientes más Notificados

```sql
SELECT 
  p.full_name,
  p.email,
  COUNT(*) as times_notified
FROM in_app_notifications n
JOIN profiles p ON p.id = n.user_id
WHERE n.type = 'chat_message'
  AND n.data->>'email_reminder_sent' = 'true'
  AND n.created_at > NOW() - INTERVAL '30 days'
GROUP BY p.id, p.full_name, p.email
ORDER BY times_notified DESC
LIMIT 10;
```

---

## 🔧 Troubleshooting

### Problema: Cliente no recibe email

**Verificar 1**: ¿Es realmente cliente?
```sql
-- Ver si es admin (owner)
SELECT * FROM businesses WHERE owner_id = 'user-uuid';

-- Ver si es employee
SELECT * FROM business_employees WHERE employee_id = 'user-uuid';
```

**Verificar 2**: ¿Tiene preferencias desactivadas?
```sql
SELECT * FROM user_notification_preferences
WHERE user_id = 'user-uuid'
  AND notification_type = 'chat_message'
  AND channel = 'email';
-- Si enabled = false, NO recibirá emails
```

**Verificar 3**: ¿Ya recibió email por esos mensajes?
```sql
SELECT data->>'email_reminder_sent'
FROM in_app_notifications
WHERE user_id = 'user-uuid'
  AND type = 'chat_message'
  AND status = 'unread';
-- Si = 'true', ya se envió
```

### Problema: Emails duplicados

**Causa**: Cron configurado < 15 minutos

**Solución**: Verificar en Dashboard que sea `*/15 * * * *` exactamente

---

## 📈 Métricas Esperadas

### Producción Normal

| Métrica | Valor Esperado |
|---------|----------------|
| **Ejecuciones/día** | 96 (cada 15 min) |
| **Emails/día** | 10-50 (depende de clientes activos) |
| **Performance** | < 2 segundos por ejecución |
| **Tasa de error** | < 1% |

### Si los números son muy altos

- **> 100 emails/día**: Normal en alto tráfico
- **> 500 emails/día**: Considerar cambiar a 30 minutos
- **> 1000 emails/día**: Implementar digest diario

---

## 🚀 Siguiente Nivel (Opcional)

### Features Adicionales

1. **Digest Diario**:
   - 1 email por día con todos los mensajes
   - En lugar de email cada 15 min

2. **Desuscripción con 1 Clic**:
   - Link en footer del email
   - Actualiza `user_notification_preferences`

3. **Respuesta Directa**:
   - Reply-to tracking
   - Usuario responde email → mensaje va al chat

4. **A/B Testing**:
   - Probar diferentes subject lines
   - Medir tasa de apertura

### Optimizaciones de Performance

```sql
-- Si el volumen crece mucho, agregar particionamiento
CREATE TABLE in_app_notifications_archive
PARTITION OF in_app_notifications
FOR VALUES FROM ('2025-01-01') TO ('2025-12-31');
```

---

## 📞 Soporte y Documentación

### Documentos de Referencia

- **Documentación Técnica**: `supabase/functions/send-unread-chat-emails/README.md`
- **Documentación Ejecutiva**: `SISTEMA_EMAILS_MENSAJES_NO_LEIDOS.md`
- **Migración SQL**: `supabase/migrations/20251016000000_unread_chat_email_optimization.sql`

### Enlaces Útiles

- **Supabase Functions Dashboard**: https://supabase.com/dashboard/project/dkancockzvcqorqbwtyh/functions
- **Supabase Logs**: https://supabase.com/dashboard/project/dkancockzvcqorqbwtyh/logs
- **Documentación Cron**: https://supabase.com/docs/guides/functions/schedule-functions

---

## ✅ Checklist Final

Antes de considerar el sistema "en producción":

- [x] Edge Function desplegada
- [x] Migración SQL aplicada
- [x] Índices creados
- [x] Funciones SQL verificadas
- [x] Vista de monitoreo funcional
- [x] Documentación completa
- [x] Código commiteado y pusheado
- [ ] **Cron job activado en Dashboard** ⚠️ **HACER AHORA**
- [ ] **Testing manual completado** ⚠️ **RECOMENDADO**
- [ ] Monitoreo configurado (opcional)
- [ ] Alertas configuradas (opcional)

---

## 🎉 ¡Listo!

Una vez que actives el cron job, el sistema estará **100% funcional** y enviará emails automáticamente a clientes con mensajes sin leer.

**Recuerda**: Hacer el testing manual para confirmar que todo funciona antes de depender del cron automático.

**Commit**: c5d74b5  
**Branch**: main  
**Estado**: ✅ Implementado, ⚠️ Cron pendiente
