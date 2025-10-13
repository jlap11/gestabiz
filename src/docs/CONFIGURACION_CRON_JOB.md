# Guía de Configuración del Cron Job - refresh-ratings-stats ⏰

**Fecha:** 12 de octubre de 2025  
**Tarea pendiente:** Configurar cron job para refresco automático de stats  
**Tiempo estimado:** 2 minutos

---

## 📋 Requisitos Previos

- ✅ Migración SQL aplicada (`20251012000000_search_optimization.sql`)
- ✅ Edge Function desplegada (`refresh-ratings-stats`)
- ✅ Acceso al Dashboard de Supabase

---

## 🚀 Pasos de Configuración

### Opción 1: Desde Supabase Dashboard (Recomendado) ⭐

#### Paso 1: Acceder al Dashboard

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona el proyecto: **appointsync-pro** (ID: `dkancockzvcqorqbwtyh`)

#### Paso 2: Navegar a Edge Functions

1. En el menú lateral, ve a **Edge Functions**
2. Deberías ver la función `refresh-ratings-stats` en la lista
3. Haz clic en ella para ver detalles

#### Paso 3: Configurar Webhook/Cron

**Si hay sección "Cron" o "Webhooks":**
1. Busca botón "Add Cron Job" o "Schedule"
2. Configura:
   - **Name:** `refresh-ratings-stats-cron`
   - **Schedule:** `*/5 * * * *` (cada 5 minutos)
   - **Function:** `refresh-ratings-stats`
   - **Method:** `POST`
   - **Headers:** (automático)

**Si NO hay sección de Cron en Edge Functions:**
Continúa con Opción 2 (Database → Extensions)

---

### Opción 2: Con pg_cron SQL (Alternativa)

#### Paso 1: Verificar extensión pg_cron

1. Ve a **Database** → **Extensions** en Dashboard
2. Busca `pg_cron`
3. Si no está habilitada, haz clic en "Enable"

#### Paso 2: Verificar net extension

1. En la misma sección de Extensions
2. Busca `pg_net` o `http` (para hacer requests HTTP)
3. Si no está, busca `supabase_functions` que incluye capacidad de HTTP

#### Paso 3: Ejecutar SQL para programar job

1. Ve a **SQL Editor** en Dashboard
2. Crea una nueva query
3. Pega el siguiente SQL:

```sql
-- Programar cron job para ejecutar Edge Function cada 5 minutos
SELECT cron.schedule(
  'refresh-ratings-stats',
  '*/5 * * * *',
  $$
  SELECT 
    net.http_post(
      url := 'https://dkancockzvcqorqbwtyh.supabase.co/functions/v1/refresh-ratings-stats',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.anon_key', true)
      )
    );
  $$
);
```

4. Ejecuta la query (Run)

#### Paso 4: Verificar que se creó el job

```sql
-- Ver jobs programados
SELECT * FROM cron.job;

-- Deberías ver una fila con jobname = 'refresh-ratings-stats'
```

---

### Opción 3: Usando Extension http (Más simple)

Si `pg_cron` no está disponible pero `http` sí:

```sql
-- Verificar que existe la función
SELECT * FROM pg_available_extensions WHERE name = 'http';

-- Programar con http extension
SELECT cron.schedule(
  'refresh-ratings-stats',
  '*/5 * * * *',
  $$
  SELECT http_post(
    'https://dkancockzvcqorqbwtyh.supabase.co/functions/v1/refresh-ratings-stats',
    '',
    'application/json'
  );
  $$
);
```

---

## ✅ Verificación

### 1. Confirmar que el job existe

```sql
-- Ver detalles del job
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
WHERE jobname = 'refresh-ratings-stats';
```

**Resultado esperado:**
- `schedule`: `*/5 * * * *`
- `active`: `t` (true)

### 2. Ver historial de ejecuciones

```sql
-- Ver últimas 10 ejecuciones
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details 
WHERE jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'refresh-ratings-stats'
)
ORDER BY start_time DESC 
LIMIT 10;
```

**Resultado esperado después de 5-10 minutos:**
- Filas con `status` = `succeeded` o `failed`
- `return_message` con respuesta de la Edge Function

### 3. Verificar que las vistas se actualizan

```sql
-- Ver última actualización de vistas materializadas
SELECT 
  schemaname, 
  matviewname, 
  pg_size_pretty(pg_relation_size(matviewname::regclass)) as size
FROM pg_matviews
WHERE matviewname IN ('business_ratings_stats', 'employee_ratings_stats');
```

### 4. Ver conteos de stats

```sql
-- Ver cuántos negocios y empleados tienen stats
SELECT 
  'businesses' as tipo,
  COUNT(*) as total,
  AVG(average_rating) as avg_rating,
  SUM(review_count) as total_reviews
FROM business_ratings_stats

UNION ALL

SELECT 
  'employees',
  COUNT(*),
  AVG(average_rating),
  SUM(review_count)
FROM employee_ratings_stats;
```

---

## 🐛 Troubleshooting

### Problema 1: No puedo ver sección de Cron en Dashboard

**Solución:**
- Supabase puede no tener UI para cron jobs en todos los planes
- Usa Opción 2 (pg_cron SQL) directamente
- O configura desde SQL Editor

### Problema 2: "extension pg_cron does not exist"

**Solución:**
```sql
-- Intentar habilitar
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Si falla, puede que no esté disponible en tu plan
-- Alternativa: Usar trigger (ya implementado)
```

**Trigger automático ya existe:**
El trigger `reviews_refresh_stats_trigger` ya refresca automáticamente cuando se crea/modifica una review. El cron es solo complementario.

### Problema 3: Job se ejecuta pero falla

**Diagnóstico:**
```sql
-- Ver errores
SELECT 
  return_message,
  status
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'refresh-ratings-stats')
AND status = 'failed'
ORDER BY start_time DESC;
```

**Posibles causas:**
- URL incorrecta de Edge Function
- Anon key no válida
- Edge Function no desplegada

**Solución:**
1. Verificar que la función esté desplegada: `npx supabase functions list`
2. Probar manualmente con curl (ver README de la función)
3. Verificar logs en Dashboard → Edge Functions → refresh-ratings-stats

### Problema 4: No tengo permisos para crear cron jobs

**Solución:**
- Necesitas rol `postgres` o superuser
- Si no tienes acceso, contacta al admin del proyecto
- Alternativa: Confía en el trigger automático (ya funciona)

---

## 📊 Monitoreo Continuo

### Dashboard de Supabase

1. Ve a **Edge Functions** → `refresh-ratings-stats`
2. Revisa:
   - **Invocations:** Debería incrementar cada 5 min
   - **Errors:** Debería estar en 0
   - **Logs:** Ver últimas ejecuciones

### SQL Queries

```sql
-- Ver ejecuciones del día
SELECT 
  DATE_TRUNC('hour', start_time) as hora,
  COUNT(*) as ejecuciones,
  SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END) as exitosas,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as fallidas
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'refresh-ratings-stats')
AND start_time > CURRENT_DATE
GROUP BY DATE_TRUNC('hour', start_time)
ORDER BY hora DESC;
```

**Resultado esperado:**
- ~12 ejecuciones por hora (cada 5 min)
- Exitosas = ~100%
- Fallidas = 0

---

## 🔄 Comandos de Gestión

### Pausar el cron job

```sql
SELECT cron.unschedule('refresh-ratings-stats');
```

### Reactivar el cron job

```sql
-- Volver a programar con mismo comando del Paso 3
SELECT cron.schedule(...);
```

### Cambiar frecuencia

```sql
-- Primero desactivar
SELECT cron.unschedule('refresh-ratings-stats');

-- Luego programar con nueva frecuencia (ej: cada 10 minutos)
SELECT cron.schedule(
  'refresh-ratings-stats',
  '*/10 * * * *',  -- Cada 10 minutos
  $$ ... $$
);
```

### Ejecutar manualmente (testing)

```sql
-- Refrescar vistas directamente
SELECT refresh_ratings_stats();

-- Ver resultado
SELECT 
  'Refrescado' as status,
  NOW() as timestamp;
```

---

## ✅ Checklist Final

- [ ] pg_cron extension habilitada
- [ ] Cron job creado (`SELECT * FROM cron.job`)
- [ ] Job activo (`active = true`)
- [ ] Primera ejecución exitosa (esperar 5 min)
- [ ] Historial de ejecuciones visible
- [ ] Vistas materializadas actualizándose
- [ ] Logs en Dashboard sin errores
- [ ] Monitoreo configurado por 1 hora

---

## 📞 Contacto y Soporte

**Documentación relacionada:**
- `supabase/functions/refresh-ratings-stats/README.md` - README de la función
- `src/docs/INTEGRACION_RPC_EDGE_FUNCTION.md` - Documentación completa
- `src/docs/DEPLOY_OPTIMIZACION_BUSQUEDA.md` - Guía de deploy

**Referencias externas:**
- [Supabase pg_cron docs](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Cron expression generator](https://crontab.guru/)

---

**Autor:** GitHub Copilot  
**Fecha:** 12 de octubre de 2025  
**Tiempo estimado:** 2 minutos  
**Dificultad:** ⭐⭐☆☆☆ (Fácil)

---

**🎯 ¡Última tarea del sprint! Configura el cron y el sistema estará 100% completo!** 🎉
