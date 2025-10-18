# Plan de Implementación: Sistema de Logging y Observabilidad

**Fecha:** 18 de Octubre 2025  
**Objetivo:** Implementar sistema completo de logs con Sentry (free) + Supabase para captura de errores y login tracking

---

## Resumen Ejecutivo

**Problema actual:**
- Errores solo van a `console.log` → se pierden en producción
- No hay tracking de inicios de sesión (IP, device, intentos fallidos)
- Imposible diagnosticar problemas reportados por usuarios
- Sin alertas automáticas para errores críticos

**Solución:**
- **Sentry** (plan gratis): Captura errores con stack traces, alertas email
- **Tabla `error_logs`**: Almacenamiento persistente con contexto completo
- **Tabla `login_logs`**: Auditoría de accesos, detección de actividad sospechosa
- **Utility `logger.ts`**: Interfaz unificada que envía a Sentry + Supabase

---

## Stack de Logging

```
Frontend Error → logger.ts → Sentry (alertas) + error_logs (persistencia)
Login Event → useAuth → log_login_event RPC → login_logs
Edge Function Error → Sentry Deno + error_logs
```

---

## Base de Datos (Supabase)

### Tabla `error_logs`
```sql
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  source TEXT NOT NULL, -- 'frontend-web' | 'edge-function'
  level TEXT NOT NULL, -- 'debug' | 'info' | 'warning' | 'error' | 'fatal'
  message TEXT NOT NULL,
  stack_trace TEXT,
  error_hash TEXT, -- Para agrupar errores iguales
  user_id UUID REFERENCES auth.users(id),
  component TEXT, -- Componente o Edge Function
  context JSONB DEFAULT '{}', -- Data adicional
  environment TEXT, -- 'development' | 'production'
  resolved BOOLEAN DEFAULT FALSE
);

-- Índices
CREATE INDEX idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX idx_error_logs_error_hash ON error_logs(error_hash);
```

### Tabla `login_logs`
```sql
CREATE TABLE login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL, -- 'success' | 'failure'
  method TEXT NOT NULL, -- 'password' | 'google'
  ip_address INET,
  user_agent TEXT,
  device TEXT, -- 'desktop' | 'mobile'
  is_suspicious BOOLEAN DEFAULT FALSE
);

-- Índices
CREATE INDEX idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX idx_login_logs_timestamp ON login_logs(timestamp DESC);
```

### RPC Functions
```sql
-- Función para loggear errores (SECURITY DEFINER)
CREATE FUNCTION log_error_event(
  p_source TEXT,
  p_level TEXT,
  p_message TEXT,
  p_stack_trace TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_component TEXT DEFAULT NULL,
  p_context JSONB DEFAULT '{}'
) RETURNS UUID;

-- Función para loggear logins
CREATE FUNCTION log_login_event(
  p_user_id UUID,
  p_email TEXT,
  p_status TEXT,
  p_method TEXT,
  p_user_agent TEXT
) RETURNS UUID;
```

---

## Frontend

### Configuración Sentry (`src/main.tsx`)
```typescript
import * as Sentry from '@sentry/react'

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.3, // 30% de eventos para no exceder límite
    ignoreErrors: ['ResizeObserver', 'ChunkLoadError'],
  })
}
```

### Logger Utility (`src/lib/logger.ts`)
```typescript
class Logger {
  error(error: Error, options?: { component?: string; context?: any }) {
    // 1. Console (siempre)
    console.error(error)
    
    // 2. Sentry (async)
    Sentry.captureException(error, {
      tags: { component: options?.component },
      contexts: { custom: options?.context }
    })
    
    // 3. Supabase (async)
    supabase.rpc('log_error_event', {
      p_source: 'frontend-web',
      p_level: 'error',
      p_message: error.message,
      p_stack_trace: error.stack,
      p_component: options?.component,
      p_context: options?.context
    }).catch(console.warn)
  }
  
  // Similar: info(), warn(), fatal()
}

export const logger = new Logger()
```

### Uso en Hooks
```typescript
// src/hooks/useSupabaseData.ts
try {
  const result = await supabase.from('appointments').insert(data)
  if (error) throw error
} catch (error) {
  logger.error(error, {
    component: 'useSupabaseData.createAppointment',
    context: { appointmentData: data }
  })
  toast.error('Failed to create appointment')
}
```

### Login Tracking (`src/hooks/useAuthSimple.ts`)
```typescript
const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  
  // Log login attempt
  await supabase.rpc('log_login_event', {
    p_user_id: data?.user?.id,
    p_email: email,
    p_status: error ? 'failure' : 'success',
    p_method: 'password',
    p_user_agent: navigator.userAgent
  })
  
  if (error) throw error
  return data
}
```

---

## Edge Functions

### Wrapper para Sentry (`supabase/functions/_shared/withSentry.ts`)
```typescript
import * as Sentry from '@sentry/deno'

Sentry.init({
  dsn: Deno.env.get('SENTRY_DSN'),
  tracesSampleRate: 0.5
})

export function withSentry(handler: Function, functionName: string) {
  return async (req: Request) => {
    try {
      return await handler(req)
    } catch (error) {
      Sentry.captureException(error, {
        tags: { functionName }
      })
      
      // También loggear a Supabase
      await logToSupabase(functionName, error)
      
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500 }
      )
    }
  }
}
```

### Uso en Edge Functions
```typescript
// supabase/functions/send-notification/index.ts
import { withSentry } from '../_shared/withSentry.ts'

async function handler(req: Request) {
  // ... lógica
}

Deno.serve(withSentry(handler, 'send-notification'))
```

---

## Variables de Entorno

```env
# Frontend
VITE_SENTRY_DSN=https://xxx@o123456.ingest.sentry.io/456789
VITE_SENTRY_SAMPLE_RATE=0.3

# Edge Functions (Supabase secrets)
SENTRY_DSN=https://xxx@o123456.ingest.sentry.io/789012
ENVIRONMENT=production
```

---

## Plan de Ejecución (6 Fases)

### Fase 0: Preparación (1 día)
- [ ] Crear cuenta Sentry (free tier)
- [ ] Obtener DSN para frontend y Edge Functions
- [ ] Documentar env vars necesarias

### Fase 1: Sentry Frontend (2 días)
- [ ] `npm install @sentry/react @sentry/vite-plugin`
- [ ] Configurar `vite.config.ts` con plugin Sentry
- [ ] Inicializar en `main.tsx`
- [ ] Actualizar `ErrorBoundary.tsx` para enviar a Sentry
- [ ] Crear `src/lib/logger.ts`
- [ ] Test: Simular error y verificar en dashboard Sentry

### Fase 2: Tablas Supabase (1 día)
- [ ] Crear migración `20251018000000_create_logging_system.sql`
- [ ] Aplicar con `npx supabase db push` o MCP
- [ ] Crear funciones RPC `log_error_event` y `log_login_event`
- [ ] Configurar RLS policies
- [ ] Test: Llamar RPC manualmente y verificar inserción

### Fase 3: Integración Frontend (2 días)
- [ ] Actualizar `logger.ts` para enviar a Supabase
- [ ] Instrumentar 10 hooks principales:
  - `useSupabaseData` (appointments, services, locations)
  - `useAuth` (login tracking)
  - `useSubscription` (billing errors)
  - `useInAppNotifications`
  - `useJobVacancies`
- [ ] Actualizar `useAuth` para login logging
- [ ] Test: Simular errores y verificar tabla `error_logs`

### Fase 4: Edge Functions (2 días)
- [ ] Agregar `@sentry/deno` a `import_map.json`
- [ ] Crear `_shared/withSentry.ts` wrapper
- [ ] Aplicar a 5 Edge Functions críticas:
  - `stripe-webhook`
  - `send-notification`
  - `process-reminders`
  - `payu-webhook`
  - `mercadopago-webhook`
- [ ] Configurar secrets en Supabase CLI
- [ ] Deploy con `npx supabase functions deploy`

### Fase 5: Dashboard Admin (1 día)
- [ ] Crear `src/components/admin/ErrorLogsViewer.tsx`
- [ ] Crear `src/components/admin/LoginLogsViewer.tsx`
- [ ] Agregar tabs en `AdminDashboard`
- [ ] Filtros: fecha, nivel, componente, usuario
- [ ] Acción: Marcar error como resuelto

### Fase 6: Monitoring & Docs (1 día)
- [ ] Configurar alertas Sentry (email si >10 errors en 5min)
- [ ] Crear `docs/OBSERVABILIDAD_GUIDE.md` con:
  - Cómo revisar errores
  - Cómo interpretar logs
  - Proceso de triage
- [ ] Configurar purga automática (logs >90 días)
- [ ] Training del equipo

---

## Checklist de Éxito

**Después de implementación completa:**
- [ ] Errores frontend aparecen en Sentry dashboard (<5 min)
- [ ] Stack traces completos visibles
- [ ] Login exitoso/fallido se registra en `login_logs`
- [ ] Edge Function error persiste en `error_logs`
- [ ] Admin puede ver últimos 100 errores en dashboard
- [ ] Alertas email funcionan para errores fatales
- [ ] Documentación completa para el equipo

---

## Métricas de Éxito (6 meses)

| Métrica | Antes | Target |
|---------|-------|--------|
| Tiempo detección error crítico | 4-24h | <15min |
| Tiempo diagnóstico | 2-4h | <30min |
| % Errores capturados | 20% | 95% |
| Errores con contexto completo | 0% | 90% |

---

## Limitaciones Conocidas

**Sentry Free Tier:**
- 5,000 events/mes (suficiente para 500 usuarios)
- Retención 90 días
- 1 usuario
- Solución: Sampling 30% + filtros para ruido

**Supabase Free Tier:**
- 500MB DB (logs ~15MB con retención 90 días)
- Solución: Purga automática mensual

---

## Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|-----------|
| Exceder cuota Sentry | Sampling 30%, filtrar errores conocidos |
| Fugas de PII | Sanitizar antes de enviar (remover passwords, tokens) |
| Performance overhead | Logging async, no bloquea UI |
| Complejidad | Wrapper reutilizable, docs claras |

---

## Archivos a Crear/Modificar

**Nuevos:**
- `supabase/migrations/20251018000000_create_logging_system.sql`
- `src/lib/logger.ts`
- `supabase/functions/_shared/withSentry.ts`
- `src/components/admin/ErrorLogsViewer.tsx`
- `src/components/admin/LoginLogsViewer.tsx`
- `docs/OBSERVABILIDAD_GUIDE.md`

**Modificar:**
- `vite.config.ts` (agregar Sentry plugin)
- `src/main.tsx` (inicializar Sentry)
- `src/components/ErrorBoundary.tsx` (integrar con logger)
- `src/hooks/useAuthSimple.ts` (login logging)
- `src/hooks/useSupabaseData.ts` (instrumentar con logger)
- `src/hooks/useSubscription.ts` (billing errors)
- `supabase/functions/*/index.ts` (5 funciones críticas)
- `package.json` (agregar deps Sentry)
- `.env.example` (documentar env vars)

---

**Tiempo total estimado:** 10-12 días dev (2 semanas)  
**Costo:** $0 (Sentry free + Supabase free)  
**ROI:** ~13x (ahorro 12h/semana debugging)
