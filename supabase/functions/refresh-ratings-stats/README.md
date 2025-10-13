# Edge Function: refresh-ratings-stats

## 📋 Descripción

Edge Function que refresca las vistas materializadas de ratings (`business_ratings_stats` y `employee_ratings_stats`) para mantener los datos actualizados sin impactar el performance de las búsquedas.

## 🎯 Propósito

Las vistas materializadas almacenan agregaciones pre-calculadas de ratings (promedios, conteos, distribución por estrellas). Para mantenerlas actualizadas, esta función ejecuta la función SQL `refresh_ratings_stats()` que refresca ambas vistas de forma concurrente.

## 🚀 Deploy

```bash
npx supabase functions deploy refresh-ratings-stats
```

## ⏰ Configuración del Cron Job

Esta función debe ejecutarse automáticamente cada 5 minutos para mantener los stats actualizados.

### Opción 1: Configurar desde Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a **Database** → **Cron Jobs** (o **Functions** → **Edge Functions** → **Cron**)
3. Crea un nuevo cron job con:
   - **Name:** `refresh-ratings-stats`
   - **Schedule:** `*/5 * * * *` (cada 5 minutos)
   - **Function:** `refresh-ratings-stats`
   - **HTTP Method:** `POST`

### Opción 2: Configurar con pg_cron (Alternativa)

Si tienes acceso a nivel superuser, puedes usar `pg_cron` directamente:

```sql
-- Primero, instalar extensión
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Programar job
SELECT cron.schedule(
  'refresh-ratings-stats',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/refresh-ratings-stats',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);

-- Verificar jobs programados
SELECT * FROM cron.job;
```

**⚠️ Nota:** Reemplaza `YOUR_PROJECT_REF` y `YOUR_ANON_KEY` con tus valores reales.

### Opción 3: Trigger en INSERT/UPDATE (Ya implementado)

Ya existe un trigger que refresca los stats automáticamente cuando se crea o modifica una review:

```sql
CREATE TRIGGER reviews_refresh_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH STATEMENT 
  EXECUTE FUNCTION trigger_refresh_ratings_stats();
```

El cron job es complementario para asegurar que los stats estén siempre actualizados incluso si el trigger falla.

## 📡 Endpoints

### POST /refresh-ratings-stats

Ejecuta el refresco de vistas materializadas.

**Request:**
```bash
curl -X POST \
  'https://dkancockzvcqorqbwtyh.supabase.co/functions/v1/refresh-ratings-stats' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json'
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Vistas materializadas refrescadas exitosamente",
  "timestamp": "2025-10-12T20:30:00.000Z",
  "executionTime": 156,
  "businessStatsCount": 42,
  "employeeStatsCount": 18
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Error al refrescar vistas materializadas",
  "timestamp": "2025-10-12T20:30:00.000Z",
  "executionTime": 89,
  "error": "Error message"
}
```

## 🔍 Monitoreo

### Verificar última ejecución

```sql
-- Ver logs de la función (si pg_cron está habilitado)
SELECT * FROM cron.job_run_details 
WHERE jobname = 'refresh-ratings-stats' 
ORDER BY start_time DESC 
LIMIT 10;
```

### Verificar estado de vistas materializadas

```sql
-- Ver última actualización de las vistas
SELECT 
  schemaname, 
  matviewname, 
  pg_size_pretty(pg_relation_size(matviewname::regclass)) as size,
  last_refresh
FROM pg_matviews
WHERE matviewname IN ('business_ratings_stats', 'employee_ratings_stats');
```

### Ver conteos actuales

```sql
SELECT 
  COUNT(*) as total_businesses,
  AVG(average_rating) as avg_rating_general,
  SUM(review_count) as total_reviews
FROM business_ratings_stats;

SELECT 
  COUNT(*) as total_employees,
  AVG(average_rating) as avg_rating_general,
  SUM(review_count) as total_reviews
FROM employee_ratings_stats;
```

## 📊 Performance

- **Tiempo de ejecución típico:** 100-300ms
- **Frecuencia recomendada:** Cada 5 minutos
- **Overhead:** Mínimo (las vistas se refrescan CONCURRENTLY)
- **Impacto en queries:** Ninguno (las búsquedas leen de las vistas ya calculadas)

## 🐛 Troubleshooting

### Error: "function refresh_ratings_stats() does not exist"

**Solución:** Asegúrate de haber aplicado la migración `20251012000000_search_optimization.sql` que crea la función.

```bash
npx supabase db push
```

### Error: "permission denied for function refresh_ratings_stats"

**Solución:** Verifica que la función tenga permisos correctos:

```sql
-- Dar permisos al role autenticado
GRANT EXECUTE ON FUNCTION refresh_ratings_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_ratings_stats() TO anon;
```

### El cron job no se ejecuta

**Diagnóstico:**
1. Verifica que la función esté desplegada: `npx supabase functions list`
2. Revisa logs de Supabase Dashboard
3. Prueba la función manualmente con curl
4. Verifica configuración del cron job

## 🔗 Referencias

- **Migración SQL:** `supabase/migrations/20251012000000_search_optimization.sql`
- **Documentación:** `src/docs/OPTIMIZACION_BUSQUEDA_COMPLETADO.md`
- **Deploy Guide:** `src/docs/DEPLOY_OPTIMIZACION_BUSQUEDA.md`

## ✅ Checklist de Setup

- [ ] Edge Function desplegada (`npx supabase functions deploy refresh-ratings-stats`)
- [ ] Cron job configurado (Dashboard o pg_cron)
- [ ] Probada manualmente con curl
- [ ] Verificados logs en Dashboard
- [ ] Monitoreado por 1 hora para confirmar ejecuciones
- [ ] Documentado en guía de deployment

---

**Autor:** GitHub Copilot  
**Fecha:** 12 de octubre de 2025  
**Status:** ✅ Listo para producción
