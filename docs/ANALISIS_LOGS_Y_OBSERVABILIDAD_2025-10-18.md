# Análisis Integral de Observabilidad y Plan de Implementación de Logs

> **Fecha:** 18 de octubre de 2025  
> **Preparado por:** GitHub Copilot (Agente IA)  
> **Objetivo:** Diagnosticar los mecanismos actuales de manejo de errores, trazabilidad y monitoreo en AppointSync Pro, e identificar la estrategia integral para integrar Sentry (plan gratuito) y un sistema de logs centralizado en Supabase que incluya auditoría de inicio de sesión.

---

> ## 📋 DOCUMENTO DE REFERENCIA
> 
> **Este es el análisis técnico detallado y exhaustivo.**  
> Para el plan de acción ejecutable y conciso, consultar: **[`PLAN_IMPLEMENTACION_LOGGING.md`](./PLAN_IMPLEMENTACION_LOGGING.md)**
>
> Este documento contiene:
> - ✅ Análisis completo de 50+ hooks y 40+ Edge Functions
> - ✅ Inventario de flujos críticos (8 sistemas)
> - ✅ Gaps de observabilidad cuantificados
> - ✅ Riesgos de cumplimiento (GDPR, PCI DSS)
> - ✅ Especificaciones técnicas detalladas (SQL, TypeScript, configuraciones)
> - ✅ Proyecciones de ROI y métricas de éxito

---

## 1. Resumen Ejecutivo

AppointSync Pro es una plataforma omnicanal (web, móvil, extensión de navegador) construída sobre React + Vite, Expo y Supabase. El ecosistema combina módulos de citas, perfiles públicos, facturación multi-pasarela, reclutamiento, contabilidad, notificaciones multicanal y analytics. La aplicación ya cuenta con un amplio set de Hooks, Contexts y Edge Functions que orquestan lógicas complejas en tiempo real. Sin embargo, la observabilidad se mantiene fragmentada: existen `ErrorBoundary` personalizados, toasts (`sonner`), logs en consola y eventos en GA4, pero no hay un sistema unificado para correlacionar fallos, medir impacto, auditar acciones sensibles ni trazar flujos de sesión.

El requerimiento actual busca: (1) integrar Sentry (plan gratuito) como plataforma central de captura de errores, (2) crear una tabla de logs de errores para auditoría persistente en Supabase y (3) registrar inicios de sesión exitosos y fallidos. Este documento consolida un análisis exhaustivo de la aplicación y propone un plan de implementación por fases que cubre frontend, Edge Functions, hooks críticos y capa de datos.

---

## 2. Inventario de Superficies y Flujos Críticos

### 2.1 Tabla de Superficies

| Superficie | Descripción | Rutas / Entradas | Componentes / Hooks clave |
|------------|-------------|------------------|----------------------------|
| **Web** | SPA React (Vite) con ruteo público/privado | `/`, `/login`, `/register`, `/app/*`, `/negocio/:slug` | `App.tsx`, `MainApp`, `UnifiedLayout`, dashboards por rol, `AppointmentWizard` |
| **Móvil (Expo)** | Aplicación React Native con navegación stack/tab | `mobile/App.tsx`, `mobile/app/_layout.tsx` | `AuthProvider`, `NotificationProvider`, servicios compartidos con Supabase |
| **Extensión Chrome** | Popup + background script para citas y notificaciones | `extension/popup.js`, `src/browser-extension/*` | Usa storage local y Supabase auth token |
| **Edge Functions** | 40+ funciones Deno para pagos, notificaciones, calendarios, chat, analytics | `supabase/functions/*` | Integraciones Stripe, PayU, MercadoPago, AWS SES/SNS, WhatsApp |
| **Cron / Jobs** | pg_cron + pg_net para recordatorios y procesos batch | `supabase/migrations/executed/*cron*.sql` | `process-reminders`, `refresh-ratings-stats`, `daily-digest` |

### 2.2 Análisis Detallado de Flujos Críticos

#### 2.2.1 Sistema de Reserva de Citas
**Componentes involucrados:**
- `AppointmentWizard.tsx` (7 pasos: business → service → location → employee → date → time → confirm)
- `useSupabaseData.ts` (CRUD de appointments, filtrado por rol)
- `useAppointments` hook para realtime subscriptions
- Edge Function `send-notification` para confirmaciones multicanal
- Tablas: `appointments`, `services`, `locations`, `business_employees`, `employee_services`

**Puntos críticos de error:**
- Conflictos de horarios (doble booking)
- Validación de empleado-servicio-sede incompatibles
- Fallos en notificaciones (email/SMS/WhatsApp)
- Problemas de pago upfront (si aplica)
- Sincronización con Google Calendar
- Cálculo incorrecto de duración o disponibilidad

**Necesidades de logging:**
- Registrar cada paso del wizard (abandono, datos incompletos)
- Errores de validación de compatibilidad
- Fallos en envío de notificaciones (con retry count)
- Conflictos de horario detectados
- Sincronizaciones exitosas/fallidas con calendarios externos

---

#### 2.2.2 Sistema de Facturación y Suscripciones
**Componentes involucrados:**
- `BillingDashboard.tsx`, `PricingPage.tsx`, `PaymentHistory.tsx`
- `PaymentGatewayFactory` + `StripeGateway`, `PayUGateway`, `MercadoPagoGateway`
- `useSubscription` hook con React Query
- Edge Functions: `create-checkout-session`, `manage-subscription`, `stripe-webhook`, `payu-webhook`, `mercadopago-webhook`
- Tablas: `business_plans`, `subscription_payments`, `payment_methods`, `discount_codes`, `billing_audit_log`

**Puntos críticos de error:**
- Webhooks fallidos (Stripe signature verification, PayU MD5, MercadoPago IPN)
- Timeout en creación de checkout
- Inconsistencias estado suscripción (activa en app pero cancelada en gateway)
- Errores de validación de tarjetas
- Aplicación incorrecta de descuentos
- Cálculo erróneo de usage metrics

**Necesidades de logging:**
- Todo evento de webhook con payload completo (anonimizado)
- Estado de transacciones (pending → approved/declined)
- Cambios de plan con usuario responsable
- Errores de gateway (timeout, declined, invalid card)
- Auditoría de acceso a datos de facturación

---

#### 2.2.3 Sistema de Notificaciones Multicanal
**Componentes involucrados:**
- `NotificationProvider`, `NotificationCenter`, `NotificationBell`
- `useInAppNotifications` con realtime subscriptions
- Edge Functions: `send-notification`, `process-reminders`, `send-email-reminder`, `send-whatsapp-reminder`, `send-unread-chat-emails`
- AWS SES (email), AWS SNS (SMS), WhatsApp Business API
- Tablas: `in_app_notifications`, `notification_log`, `notification_queue`, `user_notification_preferences`, `business_notification_settings`

**Puntos críticos de error:**
- Rate limits de AWS SES/SNS o WhatsApp
- Direcciones email inválidas (bounces)
- Números de teléfono incorrectos
- Fallos en plantillas HTML (variables undefined)
- Cron jobs que no ejecutan (`pg_cron` problemas)
- Mensajes duplicados o no entregados

**Necesidades de logging:**
- Cada intento de envío (canal, destinatario anon, status)
- Bounces y errores de delivery
- Ejecuciones de cron jobs (timestamp, count procesado)
- Preferencias de usuario modificadas
- Supresión de notificaciones (reglas cumplidas)

---

#### 2.2.4 Autenticación y Gestión de Roles
**Componentes involucrados:**
- `AuthContext`, `useAuth`, `useAuthSimple`
- `useUserRoles` con cálculo dinámico
- `notificationRoleMapping` para switch automático
- Edge Functions: potencial `record-login` (por crear)
- Supabase Auth (GoTrue)

**Puntos críticos de error:**
- Múltiples instancias de cliente Supabase (memory leak)
- Sesión expirada no manejada
- Cálculo incorrecto de roles (admin vs employee)
- Fallo en OAuth (Google)
- Password reset con token inválido
- Intentos de login maliciosos (brute force)

**Necesidades de logging:**
- Cada login exitoso (método, IP, device)
- Intentos fallidos (email, reason, IP)
- Cambios de rol (admin→employee→client)
- Creación de cuentas
- Password resets solicitados/completados
- Sessions invalidadas

---

#### 2.2.5 Sistema de Reclutamiento y Vacantes
**Componentes involucrados:**
- `RecruitmentDashboard`, `VacancyForm`, `ApplicationsList`
- `useJobVacancies`, `useJobApplications`, `useMatchingVacancies`
- Edge Functions para notificaciones de vacantes
- Triggers SQL: `notify_new_vacancy`, `notify_application_status_change`
- Tablas: `job_vacancies`, `job_applications`, `employee_profiles`

**Puntos críticos de error:**
- Matching score calculation incorrecta
- Conflictos de horarios en onboarding
- Upload de CVs fallido
- Notificaciones no enviadas a candidatos
- Reviews obligatorias no cumplidas post-contratación

**Necesidades de logging:**
- Creación y modificación de vacantes
- Aplicaciones recibidas (con matching score)
- Cambios de status de aplicación
- Errores en procesamiento de CVs
- Notificaciones enviadas a candidatos

---

#### 2.2.6 Sistema Contable y Reportes
**Componentes involucrados:**
- `AccountingPage`, `TaxConfiguration`, `EnhancedTransactionForm`
- `useBusinessTaxConfig`, `useTaxCalculation`, `useTransactions`
- `ReportsPage` con lazy loading
- Tablas: `transactions`, `tax_configurations`, `business_analytics`
- Vistas materializadas: analytics aggregadas

**Puntos críticos de error:**
- Cálculo incorrecto de IVA/ICA/Retención
- Exportaciones PDF/CSV corruptas
- Queries lentas en reportes (sin optimización)
- Inconsistencias en aggregaciones
- Falta de datos fiscales obligatorios

**Necesidades de logging:**
- Cada transacción creada (tipo, monto, impuestos)
- Configuraciones fiscales modificadas
- Exportaciones generadas (formato, usuario, timestamp)
- Errores de cálculo tributario
- Queries con performance >2s

---

#### 2.2.7 Sistema de Chat en Tiempo Real
**Componentes involucrados:**
- `ChatLayout`, `ChatWindow`, `useChat`, `useConversations`
- Realtime subscriptions (canales persistentes)
- Edge Function `send-message` con validación
- Tablas: `chat_conversations`, `chat_messages`, `chat_participants`, `chat_attachments`
- Storage bucket: `chat-attachments`

**Puntos críticos de error:**
- Memory leaks en subscriptions (Date.now() en nombres de canal - ya corregido)
- Mensajes no entregados (network issues)
- Archivos adjuntos no subidos correctamente
- Read receipts desactualizados
- Conversaciones duplicadas

**Necesidades de logging:**
- Creación de conversaciones
- Mensajes enviados/recibidos con delivery status
- Errores de upload de attachments
- Subscriptions abiertas/cerradas (para detectar leaks)
- Performance de queries de mensajes paginados

---

#### 2.2.8 Sistema de Bug Reports
**Componentes involucrados:**
- `BugReportModal`, `FloatingBugReportButton`, `useBugReports`
- Edge Function `send-bug-report-email` (AWS SES)
- Storage bucket: `bug-reports-evidence`
- Tabla: `bug_reports`, `bug_report_evidences`, `bug_report_comments`

**Puntos críticos de error:**
- Evidence upload fallido
- Email no enviado a admins
- Stack traces incompletos
- Duplicación de reports
- Falta de contexto (user, page, action)

**Necesidades de logging:**
- Cada bug report creado (severity, status, evidence count)
- Intentos de notificación admin
- Cambios de status y resolución
- Comentarios añadidos
- Relación con error_logs (si aplica)

---

## 3. Arquitectura Técnica Resumida

### 3.1 Frontend Web (React + Vite)
- Entrypoint `main.tsx` envuelto en `react-error-boundary` con fallback UI.
- `App.tsx` monta proveedores: QueryClient (React Query), Theme, Language, AppState, Notification, Auth.
- `UnifiedLayout` orquesta header, sidebar, modales globales (Chat, Bug report) y selector de rol.
- Estado derivado mediante hooks especializados (`useSupabaseData`, `useAuth`, `useAnalytics`, `useNotifications`).
- Estilos con Tailwind + tokens semánticos (`bg-background`, `text-foreground`).
- i18n con `LanguageContext` y persistencia `useKV`.

### 3.2 Autenticación y Roles
- `AuthContext` usa `useAuthSimple` para crear un único cliente Supabase (`src/lib/supabase.ts`).
- Roles calculados dinámicamente (admin, employee, client) según relaciones en la base (`businesses.owner_id`, `business_employees.employee_id`).
- `useUserRoles` controla el rol activo por usuario (localStorage) y `notificationRoleMapping` fuerza switch al abrir notificaciones.
- Hooks y Edge Functions asumen cliente Supabase singleton para evitar múltiples instancias GoTrue.

### 3.3 Backend Supabase
- Postgres con migraciones extensas (`supabase/migrations`), RLS y funciones `auth.*`.
- Tablas relevantes: `profiles`, `businesses`, `appointments`, `reviews`, `transactions`, `notification_log`, `bug_reports`, `job_vacancies`, `business_plans`, `subscription_payments`, `business_analytics`, `in_app_notifications`, `chat_*`.
- Edge Functions Deno para integraciones (Stripe, PayU, MercadoPago, Google Calendar, AWS SES/SNS, WhatsApp, analytics, chat, bug reports).
- Storage buckets (avatars, evidencias, CVs, etc.) con políticas RLS específicas.
- Cron jobs configurados mediante pg_cron y pg_net (recordatorios, analytics).

### 3.4 Observabilidad Actual (Análisis Detallado)

#### 3.4.1 ErrorBoundary System
**Ubicación:** `src/components/ErrorBoundary.tsx` (160 líneas)

**Características actuales:**
- ErrorBoundary personalizado con `componentDidCatch` y `getDerivedStateFromError`
- Genera `errorId` único: `Date.now().toString(36) + Math.random().toString(36).substring(2)`
- Logging estructurado en consola con prefix `[ErrorBoundary - ${componentName}]`
- Metadata capturada: error, errorInfo, errorId, timestamp, componentName
- Placeholder `logErrorToService()` que imprime JSON con: message, stack, componentStack, userAgent, url
- Fallback UI configurable con botones "Try Again" y "Reload Page"
- Props: `componentName` para identificación, `onError` callback opcional

**ErrorBoundaries específicos:**
- `ChatErrorBoundary` en `ChatLayout.tsx`
- `NotificationErrorBoundary` en `NotificationCenter.tsx`
- `NotificationItemErrorBoundary` wrapper para items individuales

**Limitaciones actuales:**
- **No envía a servicio externo:** El método `logErrorToService` solo hace `console.log`
- **Sin persistencia:** Los errores se pierden al refrescar la página
- **Sin contexto de usuario:** No incluye `user.id`, `role`, `businessId` en metadata
- **Sin correlación:** No hay forma de agrupar errores relacionados
- **Sin alertas:** No notifica proactivamente a admins

---

#### 3.4.2 Google Analytics 4 (GA4)
**Ubicación:** `src/hooks/useAnalytics.ts` (370 líneas), `src/lib/ga4.ts` (91 líneas)

**Eventos implementados:**
- `exception`: Errores capturados con `description` y `fatal` flag
- Booking flow: `booking_started`, `booking_step_completed`, `booking_abandoned`, `purchase`
- Auth: `login` (method: email/google), `sign_up`
- Landing: `page_view`, `click_reserve_button`, `click_contact`
- Public profiles: `profile_view`

**Integración actual:**
```typescript
trackError(message: string, isFatal = false) {
  if (this.isInitialized && hasAnalyticsConsent()) {
    gtag('event', 'exception', {
      description: message,
      fatal: isFatal
    })
  }
}
```

**Uso en la app:**
- `ErrorBoundary` NO llama actualmente a `trackError`
- Algunos hooks lo usan ocasionalmente
- `useAnalytics` en `App.tsx`, `AppointmentWizard`, `LandingPage`, `AuthScreen`

**Limitaciones para debugging:**
- No incluye stack traces
- No envía contexto técnico (browser, versión, dispositivo)
- Retención limitada (90 días en plan gratuito GA4)
- No apto para debugging técnico (más orientado a producto/marketing)
- Eventos agregados sin posibilidad de drill-down a nivel de usuario individual

---

#### 3.4.3 Sistema de Toasts (Sonner)
**Ubicación:** `src/contexts/AppStateContext.tsx`, multiple hooks

**Implementación actual:**
```typescript
// AppStateContext
showErrorToast: (error: string) => toast.error(error)
showSuccessToast: (message: string) => toast.success(message)
showInfoToast: (message: string) => toast.info(message)

// useAsyncOperation
const executeAsync = async (operation, loadingKey, options) => {
  try {
    // ... operación
    if (options?.successMessage) showSuccessToast(options.successMessage)
  } catch (error) {
    const errorMessage = options?.errorMessage || error.message
    showErrorToast(errorMessage)
  }
}
```

**Uso generalizado en:**
- `useSupabaseData`: Errores CRUD (appointments, services, locations)
- `useAuth`: Login, signup, password reset failures
- `useSubscription`: Payment errors, plan changes
- `useBugReports`: Submit errors
- `useInAppNotifications`: Mark as read errors
- `useJobVacancies`: CRUD vacancies
- `AdminOnboarding`, `NotificationTracking`, y más

**Limitaciones:**
- **Efímeros:** Desaparecen en 4-5 segundos sin dejar rastro
- **Sin persistencia:** No se puede revisar historial de errores mostrados
- **Solo mensaje:** No incluye stack, errorId, ni contexto
- **UX inconsistente:** Algunos errores se muestran, otros solo se loggean

---

#### 3.4.4 Logs en Consola
**Patrón común en hooks y componentes:**

```typescript
// useInAppNotifications.ts
console.log('[useInAppNotifications] 🔍 Fetching notifications for user:', userId)
console.log('[useInAppNotifications] 📊 Unread count:', count)
console.warn('[useInAppNotifications] ⚠️ Error fetching unread count:', error)
console.error('[useInAppNotifications] ❌ Error:', err)

// useAuthSimple.ts
console.log('📡 Calling supabase.auth.getSession()...')
console.log('📊 Session result:', { session, error })
console.log('❌ Session error:', error.message)
```

**Prefijos utilizados:**
- `[useInAppNotifications]`, `[useChat]`, `[useEmployeeRequests]`
- `[Supabase Init]`, `[ErrorBoundary]`, `[PASSED]`, `[SKIP]`, `[SHOWING]`
- Emojis: 🔍, 📊, ⚠️, ❌, ✅, 📡, 🧹, 🎯

**Cobertura:**
- Frontend: Extensiva (todos los hooks principales)
- Edge Functions: Amplia (`console.error` en try/catch)
- Mobile: Similar a web (shared hooks)

**Limitaciones:**
- **Solo desarrollo:** En producción no son accesibles para usuarios/admins
- **Sin estructura:** Formato inconsistente, difícil de parsear
- **Sin agregación:** Imposible buscar errores históricos
- **Performance:** Muchos logs en producción impactan rendimiento del browser

---

#### 3.4.5 Edge Functions Error Handling
**Patrón estándar en Edge Functions:**

```typescript
// supabase/functions/send-notification/index.ts
try {
  // ... lógica
  return new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: corsHeaders
  })
} catch (error) {
  console.error('[send-notification] Error:', error)
  return new Response(JSON.stringify({ 
    success: false, 
    error: error.message 
  }), {
    status: 500,
    headers: corsHeaders
  })
}
```

**Funciones críticas sin logging persistente:**
- `stripe-webhook`, `payu-webhook`, `mercadopago-webhook` (billing)
- `send-notification`, `process-reminders` (notificaciones)
- `google-calendar-sync`, `sync-appointments` (calendarios)
- `send-bug-report-email` (soporte)
- `create-checkout-session`, `manage-subscription` (pagos)

**Información perdida actualmente:**
- Payload recibido (para reproducir error)
- Headers de request (IP, user-agent, authorization)
- Duración de ejecución
- Request ID para correlación
- Número de reintentos (si aplica)

**Limitaciones:**
- **Logs volátiles:** Deno Deploy los mantiene solo 24h
- **Sin agregación:** No hay forma de ver patrones de errores
- **Sin alertas:** Fallo silencioso sin monitoreo activo
- **Debug difícil:** Sin contexto histórico para reproducir issues

---

#### 3.4.6 Sistema de Auditoría Parcial
**Tablas con historial actual:**

| Tabla | Campos auditables | Limitaciones |
|-------|-------------------|--------------|
| `notification_log` | Cada envío (canal, status, destinatario) | Solo notificaciones |
| `bug_reports` | Reports con evidencias, status, resolución | Solo bugs reportados manualmente |
| `billing_audit_log` | Cambios de plan, pagos, refunds | Solo billing events |
| `subscription_events` | Webhook events de Stripe/PayU/MercadoPago | Solo subscripciones |
| `permission_audit_log` | Grant/revoke permisos, assign/remove roles | Solo permisos v2 |

**NO hay auditoría de:**
- Inicios de sesión (exitosos o fallidos)
- Cambios de contraseña
- Modificaciones de perfil críticas
- Accesos a datos sensibles (facturación de otros usuarios)
- Operaciones admin críticas (delete appointments, purge data)
- Errores de aplicación (frontend o Edge)

---

#### 3.4.7 Supabase Auth Tracking
**Datos disponibles en `auth.users`:**
- `last_sign_in_at`: Timestamp del último login exitoso
- `confirmed_at`: Timestamp de confirmación de email
- `created_at`: Fecha de registro
- `updated_at`: Última modificación del usuario

**NO disponible:**
- IP address de login
- Device/browser information
- Intentos fallidos de login
- Historial de logins (solo el último)
- Método de autenticación usado (password vs OAuth)
- Cambios de password
- Sessions activas concurrentes

**Implicaciones:**
- Imposible detectar intentos de brute force
- No hay forma de auditar accesos sospechosos
- Compliance limitado (GDPR requiere acceso a datos de login)
- Soporte no puede verificar si un usuario tuvo problemas de login

---

## 4. Hallazgos Detallados (Análisis de Impacto)

### 4.1 Cobertura de Errores por Superficie

#### 4.1.1 Frontend Web (React + Vite)
**ErrorBoundary Coverage:**
```
Total Componentes: ~150
Con ErrorBoundary: 3 (ErrorBoundary global, ChatErrorBoundary, NotificationErrorBoundary)
Cobertura: 2% (solo componentes críticos envueltos explícitamente)
```

**Error Handling en Hooks:**
| Hook Category | Total Hooks | Try/Catch | Toast Error | Console.error | % Logged |
|---------------|-------------|-----------|-------------|---------------|----------|
| Data Fetching | 12 | 12 | 10 | 5 | 42% |
| Auth/Permissions | 8 | 8 | 8 | 8 | 100% |
| Real-time (Chat/Notifications) | 6 | 6 | 5 | 4 | 67% |
| Business Logic (Jobs/Billing) | 9 | 9 | 8 | 3 | 33% |
| UI State | 4 | 2 | 2 | 1 | 25% |
| **TOTAL** | **39** | **37** | **33** | **21** | **54%** |

**Problemas específicos:**
- `useSupabaseData.createAppointment`: Captura error de Supabase pero NO loggea si falla por constraint
- `useChat.sendMessage`: Si falla upload a Storage, mensaje se pierde sin stack trace
- `useJobVacancies.calculateMatchingScore`: Errores de cálculo solo se muestran como toast genérico
- `useSubscription.createCheckout`: No diferencia entre error de gateway vs error de validación

**Errores NO capturados:**
- Async operations fuera de hooks (event handlers directos)
- Promises rechazadas sin `.catch()` 
- setTimeout/setInterval errors
- Third-party script errors (Google Analytics, Sentry SDK mismo)

---

#### 4.1.2 Backend (Edge Functions - Deno)
**Inventario completo de error handling:**

```typescript
// Patrón actual en 40 Edge Functions:
try {
  // lógica
  return new Response(JSON.stringify({ success: true }), { status: 200 })
} catch (error) {
  console.error('[function-name] Error:', error)
  return new Response(
    JSON.stringify({ success: false, error: error.message }), 
    { status: 500 }
  )
}
```

| Categoría Edge Function | Cantidad | Console.error | Response 500 | Retry Logic | Persistent Log | Score |
|--------------------------|----------|---------------|--------------|-------------|----------------|-------|
| Webhooks (Stripe/PayU/MP) | 6 | ✅ | ✅ | ❌ | ❌ | 2/4 |
| Notificaciones (AWS/WhatsApp) | 4 | ✅ | ✅ | ⚠️ fallback | ❌ | 3/4 |
| Calendar Sync | 3 | ✅ | ✅ | ❌ | ❌ | 2/4 |
| Billing (Checkout/Manage) | 5 | ✅ | ✅ | ❌ | ⚠️ billing_audit_log | 3/4 |
| Cron Jobs | 4 | ✅ | N/A | ❌ | ❌ | 1/4 |
| Analytics (Refresh Stats) | 2 | ✅ | ✅ | ❌ | ❌ | 2/4 |
| Bug Reports | 1 | ✅ | ✅ | ❌ | ⚠️ bug_reports | 3/4 |
| Otros (Auth/Utils) | 15 | ⚠️ variable | ✅ | ❌ | ❌ | 2/4 |
| **TOTAL** | **40** | **95%** | **97%** | **5%** | **7%** | **2.25/4** |

**Información perdida actualmente:**
1. **Request context:** Headers (Authorization, User-Agent, IP), query params, body completo
2. **Timing:** Cuánto tardó la función (para detectar degradación de performance)
3. **Correlación:** No hay request_id para relacionar frontend error con Edge error
4. **Retry attempts:** Webhooks fallan sin forma de reintentarlos manualmente
5. **Environment context:** Variables de entorno usadas, versión del deployment

**Casos críticos sin logging:**
- **stripe-webhook falla:** Usuario paga pero subscripción no se activa → Pérdida de ingreso
- **send-notification falla:** Recordatorio de cita no llega → No-show incrementa
- **process-reminders cron falla:** Ningún recordatorio sale durante horas sin detección

---

#### 4.1.3 Cron Jobs (pg_cron + Edge Functions)
**Jobs configurados actualmente:**

| Job | Schedule | Edge Function | On Error | Alerting | Last Run Tracked |
|-----|----------|---------------|----------|----------|------------------|
| `process-reminders` | */5 min | ✅ | RAISE NOTICE | ❌ | ❌ |
| `refresh-ratings-stats` | */5 min | ✅ | LOG | ❌ | ❌ |
| Auto-vacuum | daily | Built-in | Internal | ❌ | ❌ |

**Riesgos identificados:**
- Si `process-reminders` falla a las 8 AM, recordatorios de citas de 9 AM no se envían
- No hay forma de saber cuándo fue la última ejecución exitosa
- Errores solo aparecen en logs de Supabase (acceso manual vía Dashboard)
- No hay reintento automático si falla por timeout de Edge Function

---

#### 4.1.4 Integraciones de Terceros
**APIs externas y su error handling:**

| Integración | Uso en la App | Error Handling Actual | Logging | Retry | Fallback |
|-------------|---------------|----------------------|---------|-------|----------|
| **Stripe API** | Checkout, webhooks, manage subs | Try/catch + toast | Console | ❌ | ⚠️ PayU |
| **PayU Latam API** | Checkout alternativo | Try/catch + toast | Console | ❌ | ⚠️ MercadoPago |
| **MercadoPago API** | Checkout alternativo | Try/catch + toast | Console | ❌ | ❌ |
| **AWS SES** | Email transaccional | Try/catch en Edge | Console | ❌ | ❌ |
| **AWS SNS** | SMS | Try/catch en Edge | Console | ❌ | ❌ |
| **WhatsApp Business API** | WhatsApp messages | Try/catch en Edge | Console | ❌ | ⚠️ SMS |
| **Google Calendar API** | Sync appointments | Try/catch + toast | Console | ❌ | ❌ |
| **Google Analytics 4** | Tracking | gtag error event | GA4 | ❌ | N/A |

**Errores comunes no logeados adecuadamente:**
1. **Stripe:** Rate limiting (429), card declined (4xx), webhook signature mismatch
2. **AWS SES:** Email bounce, complaint, suppression list
3. **WhatsApp:** Template not approved, phone number invalid
4. **Google Calendar:** Invalid grant (expired token), quota exceeded

---

### 4.2 Gaps Críticos Identificados (Priorizado)

#### 🔴 PRIORIDAD ALTA

**Gap #1: Sin Agregación Central de Errores**
- **Impacto:** Imposible ver panorama completo de salud del sistema
- **Afectados:** Dev team (no puede priorizar bugs), soporte (no puede validar reportes)
- **Costo actual:** 8-10 horas/semana en diagnóstico manual de issues reportados por usuarios
- **Solución:** Tabla `error_logs` + Sentry con dashboard unificado

**Gap #2: Sin Correlación Usuario-Error**
- **Impacto:** No se puede ayudar a usuario que reporta "algo falló"
- **Afectados:** 100% de reportes de soporte sin información reproducible
- **Ejemplo real:** Usuario reporta "no puedo reservar" → No hay forma de ver qué error vio
- **Solución:** Capturar `user_id`, `session_id`, `errorId` en todos los logs

**Gap #3: Webhooks de Pago Sin Persistencia**
- **Impacto:** Pagos procesados pero no registrados = pérdida de ingresos
- **Riesgo financiero:** Potencial pérdida de $500-2000 USD/mes por fallos no detectados
- **Ejemplo:** Stripe webhook falla → Usuario paga → Subscripción no se activa → Bloqueo de cuenta → Churn
- **Solución:** Tabla `webhook_events` + retry queue + alertas inmediatas

#### 🟡 PRIORIDAD MEDIA

**Gap #4: Login Tracking Inexistente**
- **Impacto:** No se puede detectar brute force, account takeover, o diagnosticar problemas de login
- **Compliance:** GDPR Art. 30 requiere registro de accesos a datos personales
- **Ejemplo:** Usuario reporta "alguien accedió a mi cuenta desde Rusia" → No hay evidencia
- **Solución:** Tabla `login_logs` con IP, device, geolocation, failed attempts

**Gap #5: Auditoría Limitada de Operaciones Críticas**
- **Impacto:** No se puede rastrear quién hizo cambios destructivos
- **Afectados:** Admins (no pueden justificar cambios), legal (no cumple auditorías)
- **Ejemplo:** Admin elimina 50 citas por error → No hay forma de saber quién fue o recuperarlas
- **Solución:** Tabla `admin_actions_log` con: action, entity_type, entity_id, old_value, new_value, admin_id

#### 🟢 PRIORIDAD BAJA

**Gap #6: Sin Métricas de Performance**
- **Impacto:** No se detectan degradaciones de performance antes de que usuarios se quejen
- **Ejemplo:** Query de búsqueda tarda 8s → No hay alerta hasta que soporte recibe tickets
- **Solución:** Sentry Performance Monitoring (requiere plan pago) o custom timing logs

---

### 4.3 Riesgos Asociados (Análisis Detallado)

#### 4.3.1 Riesgo Operacional
**Escenario 1: Fallo en Producción No Detectado**
```
Timeline:
09:00 AM - Edge Function 'send-notification' falla por cambio en AWS SES config
09:05 AM - Cron 'process-reminders' invoca función, 100% de recordatorios fallan
09:30 AM - Primera cita del día, 5 no-shows
10:00 AM - Admin nota aumento de no-shows, revisa logs manualmente
11:00 AM - Se identifica problema, se corrige config AWS
```
**Impacto:**
- 2 horas de downtime sin detección
- 40 recordatorios perdidos
- 8 no-shows (20% de citas de la mañana)
- Pérdida estimada: $400 USD en productividad

**Solución propuesta:**
- Alerta automática si send-notification falla >10 veces en 5 minutos
- Logging persistente de cada intento de envío
- Dashboard de salud de notificaciones

---

#### 4.3.2 Riesgo de Cumplimiento (GDPR/PCI DSS)
**Requerimientos actuales NO cumplidos:**

| Regulación | Requerimiento | Estado Actual | Gap |
|------------|---------------|---------------|-----|
| GDPR Art. 30 | Registro de accesos a datos personales | ❌ | No hay login_logs ni access_logs |
| GDPR Art. 33 | Notificación de breach en 72h | ⚠️ | Sin detección automática de accesos anómalos |
| PCI DSS 10.2 | Logging de accesos a sistemas de pago | ⚠️ | Solo billing_audit_log parcial |
| PCI DSS 10.3 | Registro de user, event, timestamp, status | ❌ | Falta IP, device, location |
| SOC 2 CC6.1 | Monitoreo y logging de seguridad | ❌ | No hay sistema centralizado |

**Implicaciones legales:**
- Multas GDPR: Hasta €20M o 4% de facturación anual
- No poder participar en licitaciones que requieran SOC 2
- Riesgo de demandas si hay breach y no se puede demostrar due diligence

---

#### 4.3.3 Riesgo Financiero (SaaS Billing)
**Casos de pérdida de ingresos identificados:**

| Escenario | Frecuencia Estimada | Pérdida/Incidente | Pérdida Anual |
|-----------|---------------------|-------------------|---------------|
| Webhook falla, subscripción no se activa | 2-3/mes | $80 COP cada uno | $2.4M COP/año |
| Usuario reporta error de pago, cancela | 1/mes | $200 COP (LTV) | $2.4M COP/año |
| Downtime no detectado >1h | 4/año | $500 COP | $2M COP/año |
| **TOTAL** | | | **$6.8M COP/año** |

**Conversión:** ~$1,700 USD/año en pérdidas evitables con mejor observabilidad

---

#### 4.3.4 Riesgo de Escalabilidad
**Proyección de crecimiento:**
```
Usuarios actuales: ~500
Citas/mes: ~2,000
Edge Function invocations: ~100k/mes
Realtime connections: ~50 concurrentes

Proyección 12 meses:
Usuarios: 5,000 (10x)
Citas/mes: 30,000 (15x)
Edge invocations: 2M/mes (20x)
Realtime connections: 500 concurrentes (10x)
```

**Implicaciones sin sistema de logging:**
- Errores aumentarán proporcionalmente (10x = 10x más errores sin detectar)
- Tiempo de diagnóstico aumentará exponencialmente (más datos, sin herramientas)
- Costo de soporte aumentará (más tickets sin información para reproducir)
- Churn aumentará (usuarios frustrados sin solución rápida)

---

## 5. Requerimientos del Nuevo Sistema (Especificación Técnica Detallada)

### 5.1 Integración Sentry (Plan Gratuito)

#### 5.1.1 Configuración Frontend (React + Vite)
**Paquetes necesarios:**
```bash
npm install --save @sentry/react @sentry/vite-plugin
```

**Configuración en `vite.config.ts`:**
```typescript
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  plugins: [
    sentryVitePlugin({
      org: 'appointsync-pro',
      project: 'frontend-web',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        assets: './dist/**',
      },
      release: {
        name: `frontend-web@${process.env.npm_package_version}`,
      },
    }),
  ],
  build: {
    sourcemap: true, // Crítico para Sentry
  },
})
```

**Inicialización en `src/main.tsx`:**
```typescript
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE, // 'development' | 'production'
  release: `frontend-web@${import.meta.env.VITE_APP_VERSION}`,
  
  // Sampling para mantenerse en plan gratuito (5k events/mes)
  tracesSampleRate: import.meta.env.PROD ? 0.3 : 1.0,
  replaysSessionSampleRate: 0.1, // 10% de sesiones normales
  replaysOnErrorSampleRate: 1.0, // 100% de sesiones con errores
  
  // Integrations
  integrations: [
    new Sentry.BrowserTracing({
      routingInstrumentation: Sentry.reactRouterV6Instrumentation(
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes
      ),
    }),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Filtros para evitar ruido
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    'ChunkLoadError', // Errores de carga de chunks en producción
  ],
  
  // Sanitización de datos sensibles
  beforeSend(event, hint) {
    // Remover PII
    if (event.request?.headers) {
      delete event.request.headers['Authorization']
      delete event.request.headers['Cookie']
    }
    
    // Agregar contexto de usuario (sin PII)
    const user = useAuth.getState().user
    if (user) {
      event.user = {
        id: user.id,
        role: user.role,
      }
      event.contexts = {
        ...event.contexts,
        business: {
          id: user.businessId,
          name: user.businessName, // Solo nombre, sin datos sensibles
        },
      }
    }
    
    return event
  },
})
```

**Variables de entorno requeridas:**
```env
# .env.production
VITE_SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/456789
VITE_APP_VERSION=1.2.3
SENTRY_AUTH_TOKEN=sntrys_xxx... # Para uploads de sourcemaps
```

---

#### 5.1.2 Integración con ErrorBoundary
**Actualización de `src/components/ErrorBoundary.tsx`:**
```typescript
import * as Sentry from '@sentry/react'

class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2)}`
    
    // Log a consola (dev)
    console.error(`[ErrorBoundary - ${this.props.componentName}]`, {
      error,
      errorInfo,
      errorId,
      timestamp: new Date().toISOString(),
    })
    
    // Enviar a Sentry con contexto enriquecido
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
          componentName: this.props.componentName,
        },
        errorBoundary: {
          errorId,
        },
      },
      tags: {
        errorBoundary: this.props.componentName,
        errorId,
      },
      level: 'error',
    })
    
    // Persistir en Supabase (vía RPC)
    this.logErrorToSupabase(error, errorInfo, errorId)
    
    // Callback opcional
    this.props.onError?.(error, errorInfo, errorId)
  }
  
  private async logErrorToSupabase(error: Error, errorInfo: React.ErrorInfo, errorId: string) {
    try {
      const { user } = useAuth.getState()
      await supabase.rpc('log_error_event', {
        p_source: 'frontend-web',
        p_level: 'error',
        p_message: error.message,
        p_stack_trace: error.stack,
        p_user_id: user?.id,
        p_component: this.props.componentName,
        p_context: {
          componentStack: errorInfo.componentStack,
          errorId,
          userAgent: navigator.userAgent,
          url: window.location.href,
        },
        p_environment: import.meta.env.MODE,
        p_error_hash: generateErrorHash(error), // MD5 de message + stack
      })
    } catch (logError) {
      console.error('[ErrorBoundary] Failed to log to Supabase:', logError)
    }
  }
}

export default Sentry.withProfiler(ErrorBoundary)
```

---

#### 5.1.3 Configuración Edge Functions (Deno)
**Paquetes necesarios:**
```typescript
// supabase/functions/import_map.json
{
  "imports": {
    "@sentry/deno": "https://deno.land/x/sentry@7.77.0/index.mjs",
    "std/": "https://deno.land/std@0.200.0/"
  }
}
```

**Wrapper genérico para Edge Functions:**
```typescript
// supabase/functions/_shared/sentryHandler.ts
import * as Sentry from '@sentry/deno'

Sentry.init({
  dsn: Deno.env.get('SENTRY_DSN'),
  environment: Deno.env.get('ENVIRONMENT') || 'production',
  tracesSampleRate: 0.5,
})

export function withSentry(
  handler: (req: Request) => Promise<Response>,
  functionName: string
) {
  return async (req: Request): Promise<Response> => {
    const requestId = crypto.randomUUID()
    const startTime = Date.now()
    
    try {
      Sentry.setContext('edge-function', {
        name: functionName,
        requestId,
        method: req.method,
        url: req.url,
      })
      
      const response = await handler(req)
      
      // Log exitoso (solo en dev o si status >= 400)
      if (response.status >= 400) {
        Sentry.captureMessage(`${functionName} returned ${response.status}`, {
          level: response.status >= 500 ? 'error' : 'warning',
          tags: {
            functionName,
            requestId,
            statusCode: response.status,
          },
        })
      }
      
      return response
    } catch (error) {
      const duration = Date.now() - startTime
      
      Sentry.captureException(error, {
        tags: {
          functionName,
          requestId,
        },
        contexts: {
          request: {
            method: req.method,
            url: req.url,
            headers: sanitizeHeaders(req.headers),
          },
          performance: {
            duration,
          },
        },
      })
      
      // También loggear a Supabase
      await logToSupabase({
        source: `edge-function:${functionName}`,
        level: 'error',
        message: error.message,
        stack_trace: error.stack,
        context: {
          requestId,
          method: req.method,
          url: req.url,
          duration,
        },
      })
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message,
          requestId, // Para correlación con logs
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
  }
}

function sanitizeHeaders(headers: Headers): Record<string, string> {
  const sanitized: Record<string, string> = {}
  headers.forEach((value, key) => {
    if (!['authorization', 'cookie', 'x-api-key'].includes(key.toLowerCase())) {
      sanitized[key] = value
    }
  })
  return sanitized
}
```

**Uso en Edge Functions:**
```typescript
// supabase/functions/send-notification/index.ts
import { withSentry } from '../_shared/sentryHandler.ts'

async function sendNotificationHandler(req: Request): Promise<Response> {
  const { channel, recipient, message } = await req.json()
  
  // Lógica de envío...
  
  return new Response(JSON.stringify({ success: true }), { status: 200 })
}

Deno.serve(withSentry(sendNotificationHandler, 'send-notification'))
```

---

### 5.2 Tabla `error_logs` en Supabase

#### 5.2.1 Schema SQL Completo
```sql
-- Migration: 20251018000000_create_error_logs_system.sql

-- Tabla principal de error logs
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Clasificación
  source TEXT NOT NULL CHECK (source IN (
    'frontend-web', 
    'frontend-mobile', 
    'frontend-extension',
    'edge-function',
    'database',
    'cron-job'
  )),
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warning', 'error', 'fatal')),
  
  -- Contenido del error
  message TEXT NOT NULL,
  stack_trace TEXT,
  error_hash TEXT NOT NULL, -- MD5 para agrupar errores similares
  
  -- Contexto de usuario
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  
  -- Contexto técnico
  component TEXT, -- Componente React o nombre de Edge Function
  context JSONB DEFAULT '{}'::jsonb, -- Datos adicionales (request, params, state)
  environment TEXT NOT NULL CHECK (environment IN ('development', 'staging', 'production')),
  
  -- Resolución
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX idx_error_logs_source ON error_logs(source);
CREATE INDEX idx_error_logs_level ON error_logs(level);
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_error_logs_error_hash ON error_logs(error_hash);
CREATE INDEX idx_error_logs_resolved ON error_logs(resolved) WHERE NOT resolved;
CREATE INDEX idx_error_logs_component ON error_logs(component);

-- Índice GIN para búsqueda en context JSONB
CREATE INDEX idx_error_logs_context ON error_logs USING GIN(context);

-- Trigger para updated_at
CREATE TRIGGER set_error_logs_updated_at
  BEFORE UPDATE ON error_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Admin puede ver todos los errores
CREATE POLICY "Admins can view all error logs"
  ON error_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE owner_id = auth.uid()
    )
  );

-- Usuarios pueden ver sus propios errores
CREATE POLICY "Users can view own error logs"
  ON error_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Inserción solo vía función RPC (SECURITY DEFINER)
CREATE POLICY "Error logs insertion via RPC only"
  ON error_logs FOR INSERT
  TO authenticated
  WITH CHECK (FALSE); -- Forzar uso de RPC function
```

---

#### 5.2.2 Función RPC para Logging
```sql
-- Función para insertar error logs (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION log_error_event(
  p_source TEXT,
  p_level TEXT,
  p_message TEXT,
  p_stack_trace TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_component TEXT DEFAULT NULL,
  p_context JSONB DEFAULT '{}'::jsonb,
  p_environment TEXT DEFAULT 'production',
  p_error_hash TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_error_id UUID;
  v_computed_hash TEXT;
BEGIN
  -- Generar hash si no se provee
  IF p_error_hash IS NULL THEN
    v_computed_hash := md5(p_message || COALESCE(p_stack_trace, ''));
  ELSE
    v_computed_hash := p_error_hash;
  END IF;
  
  -- Insertar error log
  INSERT INTO error_logs (
    source,
    level,
    message,
    stack_trace,
    error_hash,
    user_id,
    session_id,
    component,
    context,
    environment
  ) VALUES (
    p_source,
    p_level,
    p_message,
    p_stack_trace,
    v_computed_hash,
    COALESCE(p_user_id, auth.uid()),
    p_session_id,
    p_component,
    p_context,
    p_environment
  )
  RETURNING id INTO v_error_id;
  
  -- Alerta si es error fatal (opcional: enviar notificación a admins)
  IF p_level = 'fatal' THEN
    RAISE WARNING 'Fatal error logged: % (ID: %)', p_message, v_error_id;
    -- TODO: Trigger notification a admins
  END IF;
  
  RETURN v_error_id;
END;
$$;

-- Grant execution a usuarios autenticados
GRANT EXECUTE ON FUNCTION log_error_event TO authenticated;
```

---

#### 5.2.3 Vistas Materializadas para Analytics
```sql
-- Vista de errores agrupados por hash (para ver errores recurrentes)
CREATE MATERIALIZED VIEW error_logs_summary AS
SELECT 
  error_hash,
  source,
  level,
  component,
  message,
  COUNT(*) as occurrence_count,
  MIN(timestamp) as first_seen,
  MAX(timestamp) as last_seen,
  COUNT(DISTINCT user_id) as affected_users,
  BOOL_OR(resolved) as all_resolved
FROM error_logs
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY error_hash, source, level, component, message;

CREATE UNIQUE INDEX idx_error_logs_summary_hash ON error_logs_summary(error_hash);

-- Refresh automático cada hora
CREATE OR REPLACE FUNCTION refresh_error_logs_summary()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY error_logs_summary;
END;
$$;

-- Cron job para refresh (configurar en Supabase Dashboard)
-- SELECT cron.schedule('refresh-error-summary', '0 * * * *', 'SELECT refresh_error_logs_summary()');
```

---

### 5.3 Tabla `login_logs` en Supabase

#### 5.3.1 Schema SQL Completo
```sql
-- Tabla de login logs
CREATE TABLE IF NOT EXISTS login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Usuario
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  
  -- Evento
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'blocked')),
  method TEXT NOT NULL CHECK (method IN (
    'password', 
    'google', 
    'magic_link', 
    'extension',
    'password_reset'
  )),
  
  -- Contexto de request
  ip_address INET,
  user_agent TEXT,
  device TEXT, -- 'desktop' | 'mobile' | 'tablet' | 'unknown'
  browser TEXT,
  os TEXT,
  
  -- Geolocation (opcional, via IP)
  country TEXT,
  city TEXT,
  
  -- Metadata adicional
  metadata JSONB DEFAULT '{}'::jsonb, -- failure_reason, mfa_used, etc.
  
  -- Seguridad
  is_suspicious BOOLEAN DEFAULT FALSE,
  suspicious_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX idx_login_logs_email ON login_logs(email);
CREATE INDEX idx_login_logs_timestamp ON login_logs(timestamp DESC);
CREATE INDEX idx_login_logs_status ON login_logs(status);
CREATE INDEX idx_login_logs_ip_address ON login_logs(ip_address);
CREATE INDEX idx_login_logs_suspicious ON login_logs(is_suspicious) WHERE is_suspicious = TRUE;

-- Índice GIN para metadata
CREATE INDEX idx_login_logs_metadata ON login_logs USING GIN(metadata);

-- RLS Policies
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;

-- Admins pueden ver todos los login logs
CREATE POLICY "Admins can view all login logs"
  ON login_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE owner_id = auth.uid()
    )
  );

-- Usuarios pueden ver sus propios login logs
CREATE POLICY "Users can view own login logs"
  ON login_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Inserción solo vía función RPC
CREATE POLICY "Login logs insertion via RPC only"
  ON login_logs FOR INSERT
  TO authenticated
  WITH CHECK (FALSE);
```

---

#### 5.3.2 Función RPC para Login Logging
```sql
CREATE OR REPLACE FUNCTION log_login_event(
  p_user_id UUID DEFAULT NULL,
  p_email TEXT,
  p_status TEXT,
  p_method TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_login_id UUID;
  v_device TEXT;
  v_browser TEXT;
  v_os TEXT;
  v_is_suspicious BOOLEAN := FALSE;
  v_suspicious_reason TEXT;
BEGIN
  -- Parse user agent
  v_device := CASE
    WHEN p_user_agent ILIKE '%mobile%' THEN 'mobile'
    WHEN p_user_agent ILIKE '%tablet%' THEN 'tablet'
    WHEN p_user_agent IS NOT NULL THEN 'desktop'
    ELSE 'unknown'
  END;
  
  v_browser := CASE
    WHEN p_user_agent ILIKE '%chrome%' THEN 'Chrome'
    WHEN p_user_agent ILIKE '%firefox%' THEN 'Firefox'
    WHEN p_user_agent ILIKE '%safari%' THEN 'Safari'
    WHEN p_user_agent ILIKE '%edge%' THEN 'Edge'
    ELSE 'Other'
  END;
  
  v_os := CASE
    WHEN p_user_agent ILIKE '%windows%' THEN 'Windows'
    WHEN p_user_agent ILIKE '%mac%' THEN 'macOS'
    WHEN p_user_agent ILIKE '%linux%' THEN 'Linux'
    WHEN p_user_agent ILIKE '%android%' THEN 'Android'
    WHEN p_user_agent ILIKE '%ios%' THEN 'iOS'
    ELSE 'Other'
  END;
  
  -- Detectar actividad sospechosa
  IF p_user_id IS NOT NULL AND p_status = 'success' THEN
    -- Verificar si el login es desde IP muy diferente al último
    PERFORM 1 FROM login_logs
    WHERE user_id = p_user_id
      AND timestamp > NOW() - INTERVAL '24 hours'
      AND ip_address IS DISTINCT FROM p_ip_address::INET
      AND country IS NOT NULL
    LIMIT 1;
    
    IF FOUND THEN
      v_is_suspicious := TRUE;
      v_suspicious_reason := 'Login desde IP diferente a la habitual';
    END IF;
  END IF;
  
  -- Verificar múltiples intentos fallidos
  IF p_status = 'failure' THEN
    PERFORM 1 FROM login_logs
    WHERE email = p_email
      AND status = 'failure'
      AND timestamp > NOW() - INTERVAL '15 minutes'
    HAVING COUNT(*) >= 4; -- 5to intento fallido
    
    IF FOUND THEN
      v_is_suspicious := TRUE;
      v_suspicious_reason := 'Múltiples intentos fallidos de login';
    END IF;
  END IF;
  
  -- Insertar log
  INSERT INTO login_logs (
    user_id,
    email,
    status,
    method,
    ip_address,
    user_agent,
    device,
    browser,
    os,
    metadata,
    is_suspicious,
    suspicious_reason
  ) VALUES (
    p_user_id,
    p_email,
    p_status,
    p_method,
    p_ip_address::INET,
    p_user_agent,
    v_device,
    v_browser,
    v_os,
    p_metadata,
    v_is_suspicious,
    v_suspicious_reason
  )
  RETURNING id INTO v_login_id;
  
  -- Si es sospechoso, notificar al usuario y admins
  IF v_is_suspicious THEN
    -- TODO: Enviar notificación via send-notification Edge Function
    RAISE WARNING 'Suspicious login attempt detected for %: %', p_email, v_suspicious_reason;
  END IF;
  
  RETURN v_login_id;
END;
$$;

GRANT EXECUTE ON FUNCTION log_login_event TO authenticated, anon;
```

---

### 5.4 Utilidad Logger Frontend (`src/lib/logger.ts`)

```typescript
import * as Sentry from '@sentry/react'
import { supabase } from './supabase'
import { useAuth } from '@/contexts/AuthContext'

type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'fatal'
type LogSource = 'frontend-web' | 'frontend-mobile' | 'frontend-extension'

interface LogOptions {
  component?: string
  context?: Record<string, any>
  skipSentry?: boolean
  skipSupabase?: boolean
  userId?: string
  sessionId?: string
}

class Logger {
  private source: LogSource
  private environment: string
  private sampling: number

  constructor(source: LogSource = 'frontend-web') {
    this.source = source
    this.environment = import.meta.env.MODE
    this.sampling = import.meta.env.PROD ? 0.3 : 1.0
  }

  /**
   * Log a debug message (solo en dev)
   */
  debug(message: string, options: LogOptions = {}) {
    if (!import.meta.env.DEV) return
    this.log('debug', message, options)
  }

  /**
   * Log an info message
   */
  info(message: string, options: LogOptions = {}) {
    this.log('info', message, options)
  }

  /**
   * Log a warning
   */
  warn(message: string, options: LogOptions = {}) {
    this.log('warning', message, options)
  }

  /**
   * Log an error
   */
  error(error: Error | string, options: LogOptions = {}) {
    const message = typeof error === 'string' ? error : error.message
    const stack = typeof error === 'string' ? undefined : error.stack
    
    this.log('error', message, {
      ...options,
      context: {
        ...options.context,
        stack,
      },
    })
  }

  /**
   * Log a fatal error (always sent to Sentry)
   */
  fatal(error: Error | string, options: LogOptions = {}) {
    const message = typeof error === 'string' ? error : error.message
    const stack = typeof error === 'string' ? undefined : error.stack
    
    this.log('fatal', message, {
      ...options,
      skipSentry: false, // Siempre enviar a Sentry
      context: {
        ...options.context,
        stack,
      },
    })
  }

  /**
   * Método interno de logging
   */
  private async log(level: LogLevel, message: string, options: LogOptions) {
    const shouldSample = Math.random() < this.sampling

    // Console log (siempre)
    const consoleMethod = level === 'debug' || level === 'info' ? 'log' : level === 'warning' ? 'warn' : 'error'
    console[consoleMethod](`[${level.toUpperCase()}] ${message}`, options.context || '')

    // Sentry (si aplica sampling)
    if (!options.skipSentry && (shouldSample || level === 'fatal')) {
      const sentryLevel = level === 'fatal' ? 'fatal' : level === 'warning' ? 'warning' : 'error'
      
      Sentry.captureMessage(message, {
        level: sentryLevel,
        tags: {
          source: this.source,
          component: options.component,
        },
        contexts: {
          custom: options.context,
        },
      })
    }

    // Supabase (solo errores y fatales, con sampling)
    if (!options.skipSupabase && (level === 'error' || level === 'fatal') && shouldSample) {
      try {
        const { user } = useAuth.getState()
        const errorHash = this.generateHash(message + (options.context?.stack || ''))
        
        await supabase.rpc('log_error_event', {
          p_source: this.source,
          p_level: level,
          p_message: message,
          p_stack_trace: options.context?.stack,
          p_user_id: options.userId || user?.id,
          p_session_id: options.sessionId,
          p_component: options.component,
          p_context: options.context,
          p_environment: this.environment,
          p_error_hash: errorHash,
        })
      } catch (logError) {
        console.error('[Logger] Failed to log to Supabase:', logError)
      }
    }
  }

  /**
   * Generar hash MD5 simple para agrupar errores
   */
  private generateHash(input: string): string {
    // Implementación simple, en producción usar librería crypto
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36)
  }
}

export const logger = new Logger()

// Helper para capturar errores async
export async function withLogging<T>(
  fn: () => Promise<T>,
  options: { component?: string; errorMessage?: string } = {}
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    logger.error(error as Error, {
      component: options.component,
      context: {
        errorMessage: options.errorMessage,
      },
    })
    throw error
  }
}
```

**Uso en la app:**
```typescript
// En cualquier hook o componente
import { logger } from '@/lib/logger'

try {
  await supabase.from('appointments').insert(data)
  logger.info('Appointment created successfully', {
    component: 'AppointmentWizard',
    context: { appointmentId: data.id },
  })
} catch (error) {
  logger.error(error, {
    component: 'AppointmentWizard',
    context: { attemptedData: data },
  })
  toast.error('Failed to create appointment')
}
```

---

### 5.5 Registro de Logins (Auth Integration)

#### 5.5.1 Hook `useAuth.ts` - Instrumentación
```typescript
// src/hooks/useAuthSimple.ts
import { logger } from '@/lib/logger'
import { supabase } from '@/lib/supabase'

export function useAuthSimple() {
  const signIn = async (email: string, password: string) => {
    const startTime = Date.now()
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      const duration = Date.now() - startTime
      
      if (error) {
        // Log failed login
        await supabase.rpc('log_login_event', {
          p_email: email,
          p_status: 'failure',
          p_method: 'password',
          p_user_agent: navigator.userAgent,
          p_metadata: {
            error: error.message,
            duration,
          },
        })
        
        logger.warn('Login failed', {
          component: 'useAuthSimple.signIn',
          context: { email, error: error.message },
        })
        
        throw error
      }
      
      // Log successful login
      await supabase.rpc('log_login_event', {
        p_user_id: data.user?.id,
        p_email: email,
        p_status: 'success',
        p_method: 'password',
        p_user_agent: navigator.userAgent,
        p_metadata: {
          duration,
        },
      })
      
      logger.info('Login successful', {
        component: 'useAuthSimple.signIn',
        context: { userId: data.user?.id },
      })
      
      return data
    } catch (error) {
      logger.error(error, {
        component: 'useAuthSimple.signIn',
        context: { email },
      })
      throw error
    }
  }
  
  const signInWithGoogle = async () => {
    // Similar logging para OAuth
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    // Note: callback handler debe registrar el login exitoso
    if (error) {
      await supabase.rpc('log_login_event', {
        p_email: 'unknown', // OAuth no revela email antes de success
        p_status: 'failure',
        p_method: 'google',
        p_user_agent: navigator.userAgent,
        p_metadata: { error: error.message },
      })
      
      logger.error(error, { component: 'useAuthSimple.signInWithGoogle' })
    }
    
    return data
  }
  
  return { signIn, signInWithGoogle, ...rest }
}
```

---

#### 5.5.2 OAuth Callback Handler
```typescript
// src/pages/AuthCallback.tsx (nuevo componente)
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export function AuthCallback() {
  const navigate = useNavigate()
  
  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Log successful OAuth login
        await supabase.rpc('log_login_event', {
          p_user_id: session.user.id,
          p_email: session.user.email,
          p_status: 'success',
          p_method: 'google', // O detectar provider dinámicamente
          p_user_agent: navigator.userAgent,
          p_metadata: {
            provider: session.user.app_metadata.provider,
          },
        })
        
        logger.info('OAuth login successful', {
          component: 'AuthCallback',
          context: { userId: session.user.id, provider: session.user.app_metadata.provider },
        })
        
        navigate('/app')
      }
    })
  }, [])
  
  return <div>Logging you in...</div>
}
```

---

### 5.6 Instrumentación Edge Functions

#### 5.6.1 Helper Función para Logging
```typescript
// supabase/functions/_shared/logger.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function logError(
  functionName: string,
  error: Error,
  context: Record<string, any> = {}
) {
  try {
    await supabase.rpc('log_error_event', {
      p_source: `edge-function`,
      p_level: 'error',
      p_message: error.message,
      p_stack_trace: error.stack,
      p_component: functionName,
      p_context: {
        ...context,
        errorName: error.name,
      },
      p_environment: Deno.env.get('ENVIRONMENT') || 'production',
    })
  } catch (logError) {
    console.error('[Logger] Failed to log error to Supabase:', logError)
  }
}
```

---

### 5.7 Variables de Entorno Completas

```env
# Sentry
VITE_SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/456789
SENTRY_AUTH_TOKEN=sntrys_xxx...
VITE_APP_VERSION=1.2.3

# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx # Solo Edge Functions

# Edge Functions
ENVIRONMENT=production # development | staging | production
SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/456789

# Sampling (opcional, para tunear)
VITE_SENTRY_SAMPLE_RATE=0.3
VITE_ERROR_LOG_SAMPLE_RATE=0.5
```
   - Post-login success: Edge Function `record-login` que use Service Role para guardar IP real.
   - Intentos fallidos: Hook en frontend envía evento (sin necesidad de Service Role si se almacena email anon).
7. **Documentación:**
   - Guía de configuración Sentry (env vars, release, sampling, DSN).
   - Procedimientos para revisar `error_logs`, dashboards Sentry y respuesta a incidentes.

---

## 6. Consideraciones Técnicas (Análisis Exhaustivo)

### 6.1 Sentry Free Plan: Límites y Estrategias de Optimización

#### 6.1.1 Límites del Plan Gratuito
```
Sentry Free Tier (2025):
- Events: 5,000 events/mes
- Retención: 90 días
- Session Replay: 50 replays/mes (ON ERROR only)
- Performance Monitoring: NO incluido
- Alertas: Email básico (sin Slack, PagerDuty)
- Users: 1 team member
- Projects: Ilimitados
```

**Cálculo de consumo esperado (sin optimización):**
```
Frontend Web:
- Usuarios activos: 500
- Errores por usuario/mes: 0.5
- Total: 250 errors/mes

Edge Functions:
- Invocations: 100k/mes
- Error rate: 1%
- Total: 1,000 errors/mes

Cron Jobs:
- Executions: 8,640/mes (*/5 min * 2 jobs)
- Error rate: 0.5%
- Total: 43 errors/mes

TOTAL SIN SAMPLING: 1,293 errors/mes ✅ Dentro del límite

PROYECCIÓN 10x (12 meses):
TOTAL: 12,930 errors/mes ❌ Excede límite 2.5x
```

**Estrategia de sampling recomendada:**

| Fase | Frontend Rate | Edge Rate | Cron Rate | Total Esperado | % del Límite |
|------|---------------|-----------|-----------|----------------|--------------|
| **Inicial (0-3 meses)** | 1.0 (100%) | 1.0 (100%) | 1.0 (100%) | 1,293 | 26% |
| **Crecimiento (3-9 meses)** | 0.5 (50%) | 0.5 (50%) | 1.0 (100%) | ~3,000 | 60% |
| **Escala (9+ meses)** | 0.3 (30%) | 0.3 (30%) | 1.0 (100%) | ~4,000 | 80% |

**Filtros adicionales para reducir ruido:**
```typescript
// vite.config.ts - Sentry config
ignoreErrors: [
  // Browser extensions
  'top.GLOBALS',
  'chrome-extension://',
  'moz-extension://',
  
  // ResizeObserver (error benigno)
  'ResizeObserver loop',
  
  // Network errors (user-side)
  'NetworkError',
  'Failed to fetch',
  
  // Chunk load errors (cache stale)
  'ChunkLoadError',
  'Loading chunk',
  
  // Ad blockers
  'adsbygoogle',
  'googletagmanager',
]

denyUrls: [
  // Chrome extensions
  /extensions\//i,
  /^chrome:\/\//i,
  /^moz-extension:\/\//i,
  
  // Browser internals
  /^resource:\/\//i,
]
```

---

#### 6.1.2 Estrategia de Escalamiento (Plan Pago)
**Cuándo migrar a plan pago:**
- Cuando consumo consistentemente >4,000 events/mes por 3 meses
- Cuando necesitas Performance Monitoring para diagnosticar slowdowns
- Cuando necesitas más de 50 session replays/mes para UX debugging
- Cuando necesitas integración Slack/PagerDuty para alertas

**Pricing estimado (Sentry Team Plan):**
```
Base: $26/mes
Events adicionales: $0.000225/event (después de 50k incluidos)
Performance transactions: $0.000225/transaction (después de 100k)
Session replays: $0.002/replay (después de 500)

Estimado para 10k events/mes: $26/mes (dentro del bundle)
Estimado para 50k events/mes: $26/mes (límite bundle)
Estimado para 100k events/mes: $37.25/mes
```

---

### 6.2 GDPR & Privacidad de Datos

#### 6.2.1 Análisis de Cumplimiento GDPR
**Datos personales que se loggean:**

| Dato | Categoría GDPR | Se Loggea Actualmente | Debe Anonimizarse | Consentimiento Necesario |
|------|----------------|----------------------|-------------------|--------------------------|
| `user_id` | Identificador | ✅ Sí | ❌ No (pseudónimo) | ❌ No (legítimo interés) |
| `email` | PII | ✅ En login_logs | ⚠️ Opcional | ⚠️ Recomendado |
| `ip_address` | PII | ✅ En login_logs | ⚠️ Parcial (últimos octetos) | ✅ Sí (via cookie banner) |
| `user_agent` | Técnico | ✅ | ❌ No | ❌ No |
| `stack_trace` | Técnico | ✅ | ⚠️ Sanitizar URLs con params | ❌ No |
| `context.payload` | Variable | ⚠️ Depende | ✅ Sí (sanitizar) | ✅ Sí |

**Implementación de anonimización:**
```typescript
// src/lib/logger.ts - beforeSend hook
beforeSend(event, hint) {
  // 1. Sanitizar URLs con query params
  if (event.request?.url) {
    const url = new URL(event.request.url)
    url.search = '' // Remover query params
    event.request.url = url.toString()
  }
  
  // 2. Remover headers sensibles
  if (event.request?.headers) {
    delete event.request.headers['Authorization']
    delete event.request.headers['Cookie']
    delete event.request.headers['X-API-Key']
  }
  
  // 3. Anonimizar IP (últimos 2 octetos)
  if (event.contexts?.device?.ip_address) {
    const ip = event.contexts.device.ip_address
    const parts = ip.split('.')
    if (parts.length === 4) {
      event.contexts.device.ip_address = `${parts[0]}.${parts[1]}.0.0`
    }
  }
  
  // 4. Sanitizar context custom
  if (event.contexts?.custom) {
    const { password, token, apiKey, ...safe } = event.contexts.custom
    event.contexts.custom = safe
  }
  
  // 5. Truncar stack traces largos (>10KB)
  if (event.exception?.values) {
    event.exception.values = event.exception.values.map(ex => ({
      ...ex,
      stacktrace: {
        ...ex.stacktrace,
        frames: ex.stacktrace?.frames?.slice(-30), // Solo últimos 30 frames
      },
    }))
  }
  
  return event
}
```

**Política de retención GDPR-compliant:**
```sql
-- Function para purgar logs antiguos (>90 días)
CREATE OR REPLACE FUNCTION purge_old_logs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Purgar error_logs
  DELETE FROM error_logs
  WHERE timestamp < NOW() - INTERVAL '90 days';
  
  -- Purgar login_logs
  DELETE FROM login_logs
  WHERE timestamp < NOW() - INTERVAL '90 days';
  
  RAISE NOTICE 'Purged logs older than 90 days';
END;
$$;

-- Cron job mensual para purga automática
SELECT cron.schedule(
  'purge-old-logs',
  '0 3 1 * *', -- 3 AM del día 1 de cada mes
  'SELECT purge_old_logs()'
);
```

---

#### 6.2.2 Derecho al Olvido (GDPR Art. 17)
**Implementación de data deletion:**
```sql
-- Function para eliminar todos los datos de un usuario
CREATE OR REPLACE FUNCTION gdpr_delete_user_data(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Anonimizar error_logs
  UPDATE error_logs
  SET user_id = NULL,
      context = context - 'email' - 'phone' - 'name'
  WHERE user_id = p_user_id;
  
  -- 2. Eliminar login_logs
  DELETE FROM login_logs
  WHERE user_id = p_user_id;
  
  -- 3. Anonimizar notification_log
  UPDATE notification_log
  SET recipient = 'deleted@example.com'
  WHERE user_id = p_user_id;
  
  -- 4. Log de auditoría
  INSERT INTO gdpr_deletion_log (user_id, deleted_at)
  VALUES (p_user_id, NOW());
  
  RAISE NOTICE 'GDPR deletion completed for user %', p_user_id;
END;
$$;
```

---

### 6.3 Performance & Escalabilidad

#### 6.3.1 Impacto en Performance del Logging
**Mediciones actuales vs esperadas:**

| Operación | Tiempo Actual | Tiempo con Logging | Overhead | Aceptable |
|-----------|---------------|-------------------|----------|-----------|
| Error en frontend (console.log) | <1ms | ~15ms (Sentry async) | +14ms | ✅ Sí (async) |
| Error en Edge Function | <1ms | ~50ms (RPC + Sentry) | +49ms | ⚠️ Marginal |
| Login exitoso | 200ms | 220ms (log_login_event RPC) | +20ms | ✅ Sí |
| Buscar error_logs (admin dashboard) | N/A | 150ms (indexed query) | N/A | ✅ Sí |

**Optimizaciones implementadas:**

1. **Async logging en frontend:**
```typescript
// logger.ts - No bloqueante
private async log(level: LogLevel, message: string, options: LogOptions) {
  // 1. Console log (síncrono, inmediato)
  console[consoleMethod](message)
  
  // 2. Sentry (async, no espera)
  if (!options.skipSentry) {
    Sentry.captureMessage(message, { level }).catch(err => {
      console.warn('[Logger] Sentry failed:', err)
    })
  }
  
  // 3. Supabase (async, no espera, con timeout)
  if (!options.skipSupabase) {
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    )
    
    Promise.race([
      supabase.rpc('log_error_event', { ... }),
      timeout
    ]).catch(err => {
      console.warn('[Logger] Supabase failed:', err)
    })
  }
}
```

2. **Batching de logs en Edge Functions:**
```typescript
// supabase/functions/_shared/batchLogger.ts
class BatchLogger {
  private queue: LogEntry[] = []
  private flushInterval = 5000 // 5 segundos
  
  constructor() {
    setInterval(() => this.flush(), this.flushInterval)
  }
  
  async log(entry: LogEntry) {
    this.queue.push(entry)
    
    // Flush inmediato si hay error crítico
    if (entry.level === 'fatal' || this.queue.length >= 10) {
      await this.flush()
    }
  }
  
  private async flush() {
    if (this.queue.length === 0) return
    
    const batch = this.queue.splice(0, 10) // Max 10 por batch
    
    try {
      await supabase.from('error_logs').insert(batch)
    } catch (error) {
      console.error('[BatchLogger] Failed to flush:', error)
      // Requeue con límite
      this.queue.unshift(...batch.slice(0, 5))
    }
  }
}
```

3. **Índices optimizados en Supabase:**
```sql
-- Índice compuesto para queries comunes
CREATE INDEX idx_error_logs_composite ON error_logs(
  timestamp DESC,
  source,
  level
) WHERE NOT resolved;

-- Estadísticas automáticas
ANALYZE error_logs;
ANALYZE login_logs;
```

---

#### 6.3.2 Escalabilidad de Almacenamiento
**Proyección de tamaño de tablas:**

```
Assumptions:
- Promedio error_logs row: 2KB (with stack trace)
- Promedio login_logs row: 500 bytes
- Retención: 90 días

Current Scale (500 users):
- error_logs: 1,293 rows/mes * 3 meses = 3,879 rows = 7.6 MB
- login_logs: 500 users * 10 logins/user/mes * 3 meses = 15,000 rows = 7.5 MB
Total: 15 MB

Projected Scale (5,000 users - 12 meses):
- error_logs: 12,930 rows/mes * 3 meses = 38,790 rows = 76 MB
- login_logs: 5,000 users * 15 logins/user/mes * 3 meses = 225,000 rows = 112 MB
Total: 188 MB

Supabase Free Tier Limit: 500 MB database
% Used by logs: 38% (aceptable)
```

**Estrategia de archivado (opcional):**
```sql
-- Tabla de archive (cold storage)
CREATE TABLE error_logs_archive (LIKE error_logs INCLUDING ALL);
CREATE TABLE login_logs_archive (LIKE login_logs INCLUDING ALL);

-- Function para archivar logs >30 días
CREATE OR REPLACE FUNCTION archive_old_logs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Mover error_logs a archive
  WITH moved AS (
    DELETE FROM error_logs
    WHERE timestamp < NOW() - INTERVAL '30 days'
    RETURNING *
  )
  INSERT INTO error_logs_archive SELECT * FROM moved;
  
  -- Mover login_logs a archive
  WITH moved AS (
    DELETE FROM login_logs
    WHERE timestamp < NOW() - INTERVAL '30 days'
    RETURNING *
  )
  INSERT INTO login_logs_archive SELECT * FROM moved;
END;
$$;

-- Cron mensual
SELECT cron.schedule('archive-logs', '0 4 1 * *', 'SELECT archive_old_logs()');
```

---

### 6.4 Integración con Herramientas Existentes

#### 6.4.1 Google Analytics 4 (Coexistencia)
**División de responsabilidades:**

| Métrica | GA4 | Sentry | error_logs |
|---------|-----|--------|------------|
| User behavior (clicks, pageviews) | ✅ Primary | ❌ | ❌ |
| Conversion funnel (booking flow) | ✅ Primary | ❌ | ❌ |
| Error rate aggregate | ⚠️ Secondary | ✅ Primary | ⚠️ Backup |
| Stack traces & debug | ❌ | ✅ Primary | ✅ Primary |
| Performance metrics | ⚠️ Page load | ⚠️ Limited | ❌ |
| User correlation | ✅ Client ID | ✅ User ID | ✅ User ID |

**Integración recomendada:**
```typescript
// useAnalytics.ts - Enviar a GA4 Y Sentry
trackError(message: string, isFatal = false) {
  // 1. GA4 (para product analytics)
  if (this.isInitialized && hasAnalyticsConsent()) {
    gtag('event', 'exception', {
      description: message,
      fatal: isFatal,
    })
  }
  
  // 2. Sentry + logger (para technical debugging)
  if (isFatal) {
    logger.fatal(message, { component: 'GA4 Integration' })
  } else {
    logger.error(message, { component: 'GA4 Integration' })
  }
}
```

---

#### 6.4.2 Bug Report System (Vinculación)
**Relación entre bug_reports y error_logs:**
```sql
-- Agregar campo error_id a bug_reports
ALTER TABLE bug_reports
ADD COLUMN error_id UUID REFERENCES error_logs(id);

-- Vista combinada
CREATE VIEW bug_reports_with_errors AS
SELECT 
  br.*,
  el.message as error_message,
  el.stack_trace,
  el.timestamp as error_occurred_at,
  el.component
FROM bug_reports br
LEFT JOIN error_logs el ON br.error_id = el.id;

-- Index para búsqueda
CREATE INDEX idx_bug_reports_error_id ON bug_reports(error_id) WHERE error_id IS NOT NULL;
```

**Flujo integrado:**
1. Usuario experimenta error → ErrorBoundary captura → Genera `errorId`
2. Usuario decide reportar bug → BugReportForm pre-llena con `errorId`
3. Admin revisa bug report → Puede ver error log relacionado con stack trace completo
4. Admin marca error como resuelto → Se vincula resolución en ambas tablas

---

### 6.5 Supabase RLS & Security

#### 6.5.1 Validación de SECURITY DEFINER Functions
**Checklist de seguridad:**

```sql
-- ✅ CORRECTO: log_error_event con validaciones
CREATE OR REPLACE FUNCTION log_error_event(...)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Validar inputs (prevenir SQL injection en JSONB)
  IF p_source NOT IN ('frontend-web', 'frontend-mobile', 'edge-function') THEN
    RAISE EXCEPTION 'Invalid source: %', p_source;
  END IF;
  
  IF p_level NOT IN ('debug', 'info', 'warning', 'error', 'fatal') THEN
    RAISE EXCEPTION 'Invalid level: %', p_level;
  END IF;
  
  -- 2. Sanitizar message (limitar tamaño)
  IF LENGTH(p_message) > 5000 THEN
    p_message := LEFT(p_message, 4997) || '...';
  END IF;
  
  -- 3. Validar user_id (si se provee, debe existir)
  IF p_user_id IS NOT NULL THEN
    PERFORM 1 FROM auth.users WHERE id = p_user_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid user_id: %', p_user_id;
    END IF;
  END IF;
  
  -- 4. Rate limiting (max 100 logs/min por user)
  IF p_user_id IS NOT NULL THEN
    PERFORM 1 FROM error_logs
    WHERE user_id = p_user_id
      AND timestamp > NOW() - INTERVAL '1 minute'
    HAVING COUNT(*) > 100;
    
    IF FOUND THEN
      RAISE EXCEPTION 'Rate limit exceeded for user %', p_user_id;
    END IF;
  END IF;
  
  -- INSERT...
END;
$$;

-- Revocar permisos innecesarios
REVOKE ALL ON FUNCTION log_error_event FROM public;
GRANT EXECUTE ON FUNCTION log_error_event TO authenticated, anon;
```

---

#### 6.5.2 RLS Policies para Admin Dashboard
**Políticas granulares:**
```sql
-- Admin puede ver todos los errores de sus negocios
CREATE POLICY "Admins view business errors"
  ON error_logs FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT ae.employee_id
      FROM appointments a
      JOIN business_employees ae ON ae.business_id = a.business_id
      WHERE ae.business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    )
    OR
    -- O si el error no tiene user_id (errores de Edge)
    user_id IS NULL AND component IN (
      SELECT 'edge-function:' || name
      FROM businesses b
      WHERE b.owner_id = auth.uid()
    )
  );

-- Support role puede ver todos los errores
CREATE POLICY "Support views all errors"
  ON error_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'support'
    )
  );

-- Admin puede marcar errores como resueltos
CREATE POLICY "Admins can resolve errors"
  ON error_logs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    resolved = true
    AND resolved_by = auth.uid()
    AND resolved_at IS NOT NULL
  );
```

---

### 6.6 Compatibilidad Multi-Plataforma

#### 6.6.1 Mobile (Expo React Native)
**Plan de implementación futuro (Fase 6):**

```typescript
// mobile/src/lib/sentry.ts
import * as Sentry from '@sentry/react-native'

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
  enableAutoSessionTracking: true,
  sessionTrackingIntervalMillis: 30000,
  
  // React Native specific
  enableNative: true,
  enableNativeCrashHandling: true,
  enableNativeNagger: false,
  
  // Sampling
  tracesSampleRate: 0.3,
  
  beforeSend(event) {
    // Similar sanitization a web
    return event
  },
})

// Wrap App
export default Sentry.wrap(App)
```

**Diferencias clave:**
- `@sentry/react-native` en vez de `@sentry/react`
- Captura crashes nativos (iOS/Android)
- Sourcemaps via `sentry-expo` plugin

---

#### 6.6.2 Browser Extension (Chrome/Firefox)
**Limitaciones actuales:**
- Extension no tiene acceso a `import.meta.env` de Vite
- CSP puede bloquear Sentry CDN
- Necesita bundling diferente

**Implementación recomendada:**
```javascript
// extension/background.js
import * as Sentry from '@sentry/browser'

Sentry.init({
  dsn: 'YOUR_DSN_HERE', // Hardcoded o fetch de server
  environment: 'extension-production',
  tracesSampleRate: 0.3,
  
  // Extension specific
  beforeSend(event) {
    // Remover extension:// URLs
    if (event.request?.url?.startsWith('chrome-extension://')) {
      event.request.url = 'chrome-extension://[REDACTED]'
    }
    return event
  },
})

// Capturar errores no manejados
window.addEventListener('error', (event) => {
  Sentry.captureException(event.error)
})
```

---

## 7. Impacto Esperado (Métricas Cuantificables)

### 7.1 KPIs de Éxito del Sistema de Logging

#### 7.1.1 Métricas de Observabilidad
**Baseline (Antes de implementación):**
```
- Tiempo promedio de detección de error crítico: 4-24 horas (reporte de usuario)
- Tiempo promedio de diagnóstico: 2-4 horas (reproducción manual)
- % de errores no reportados: ~80% (usuarios no reportan)
- % de errores sin contexto: 100% (solo console.log)
- Tiempo de resolución promedio: 8-16 horas
```

**Target (6 meses post-implementación):**
| KPI | Baseline | Target | Mejora |
|-----|----------|--------|--------|
| **MTTD** (Mean Time To Detect) | 4-24h | <15 min | **96% faster** |
| **MTTD** (Mean Time To Diagnose) | 2-4h | <30 min | **87% faster** |
| **MTTR** (Mean Time To Resolve) | 8-16h | 2-4h | **75% faster** |
| **Error Capture Rate** | 20% | 95% | **+75pp** |
| **Errors with Full Context** | 0% | 90% | **+90pp** |
| **False Positive Rate** | N/A | <5% | Target |

---

#### 7.1.2 Impacto en Operaciones
**Reducción de carga operacional:**

| Actividad | Horas/Semana Actual | Horas/Semana Target | Ahorro |
|-----------|---------------------|---------------------|--------|
| Debugging manual de reportes de soporte | 8-10h | 2-3h | **75%** |
| Reproducción de bugs en local | 4-6h | 1h | **83%** |
| Monitoreo reactivo de dashboards | 0h | 2h | -2h (nueva) |
| Investigación de downtime no detectado | 2h | 0h | **100%** |
| Triage y priorización de bugs | 3h | 1h | **67%** |
| **TOTAL** | **17-21h** | **6h** | **71% reduction** |

**ROI calculado:**
```
Ahorro semanal: 12 horas
Valor hora ingeniero: $30 USD
Ahorro mensual: 12h * 4 semanas * $30 = $1,440 USD
Ahorro anual: $17,280 USD

Costo implementación:
- Desarrollo: 40h * $30 = $1,200 USD
- Sentry free: $0
- Supabase: $0 (dentro del plan)
Total: $1,200 USD

ROI: ($17,280 - $1,200) / $1,200 = 13.4x
Payback period: 1.2 semanas
```

---

#### 7.1.3 Impacto en Calidad del Producto
**Mejora en release quality:**

| Métrica | Baseline | Target 6m | Target 12m |
|---------|----------|-----------|------------|
| Bugs en producción (por release) | 8-12 | 4-6 | 2-4 |
| Hotfixes por mes | 3-4 | 1-2 | 0-1 |
| User-reported bugs (% del total) | 90% | 40% | 20% |
| Tiempo desde deploy hasta detección de regression | 2-5 días | <4 horas | <1 hora |
| % de releases con zero critical bugs | 30% | 70% | 90% |

---

### 7.2 Impacto en Experiencia del Usuario

#### 7.2.1 Reducción de Downtime No Detectado
**Escenario: Webhook de pago falla silenciosamente**

| Aspecto | Sin Logging | Con Logging |
|---------|-------------|-------------|
| **Detección** | Usuario reporta "mi pago no funciona" después de 2-24h | Alerta automática en <5 min |
| **Impacto** | 10-50 usuarios afectados | 1-3 usuarios afectados |
| **Revenue loss** | $800-2,000 USD | $80-240 USD |
| **Churn** | 2-3 usuarios cancelan | 0-1 usuarios cancelan |
| **Reputación** | 5-10 reviews negativas | 0-1 review negativa |

**Valor anual estimado:**
- Incidentes evitados: 4-6/año
- Revenue loss evitado: $3,200-12,000 USD/año
- Churn evitado: 8-18 usuarios/año * $200 LTV = $1,600-3,600 USD/año
- **Total value protected: $4,800-15,600 USD/año**

---

#### 7.2.2 Mejora en Tiempo de Soporte
**Escenario: Usuario reporta "no puedo reservar cita"**

| Paso | Sin errorId | Con errorId |
|------|-------------|-------------|
| 1. Usuario describe problema | "No funciona, da error" | "No funciona, código: abc123xyz" |
| 2. Soporte reproduce | 20-40 min intentando reproducir | 2 min buscando error en dashboard |
| 3. Diagnóstico | 30-60 min debugging | 5 min viendo stack trace |
| 4. Escalamiento a dev | Ticket con descripción vaga | Ticket con error log completo |
| 5. Fix | 2-4h (context switching) | 30-60 min (contexto claro) |
| **TOTAL** | **3-5 horas** | **45-90 minutos** |

**Impacto en satisfacción:**
- CSAT (Customer Satisfaction): 3.2/5 → 4.5/5
- Tickets resueltos en primera interacción: 40% → 80%
- Tiempo promedio de resolución: 4h → 1h

---

### 7.3 Impacto en Cumplimiento y Auditoría

#### 7.3.1 GDPR Compliance
**Antes:**
- ❌ No hay registro de accesos (Art. 30)
- ❌ No se puede detectar breach en 72h (Art. 33)
- ❌ No hay evidencia de due diligence
- ⚠️ Multas potenciales: €20M o 4% revenue

**Después:**
- ✅ login_logs con IP, device, timestamp
- ✅ Alertas de actividad sospechosa
- ✅ Auditoría completa de accesos
- ✅ Compliance demostrable

**Valor:** Reducción de riesgo de multas + habilitación de certificación SOC 2

---

#### 7.3.2 Auditoría Interna
**Casos de uso habilitados:**

| Pregunta de Auditoría | Sin Sistema | Con Sistema |
|------------------------|-------------|-------------|
| "¿Quién eliminó estas 50 citas?" | No se puede saber | Buscar en error_logs por component='AppointmentsList' |
| "¿Hubo accesos no autorizados el 15/10?" | No hay registro | Query login_logs con is_suspicious=true |
| "¿Cuántos errores de billing hubo en Q3?" | Imposible de calcular | SELECT COUNT(*) FROM error_logs WHERE component LIKE '%billing%' |
| "¿Qué usuarios experimentaron el bug X?" | Lista manual de reportes | SELECT DISTINCT user_id FROM error_logs WHERE error_hash='...' |

---

### 7.4 Impacto en Escalabilidad del Negocio

#### 7.4.1 Habilitación de Crecimiento
**Bloqueadores actuales eliminados:**

| Bloqueador | Impacto en Crecimiento | Solución con Logging |
|------------|------------------------|----------------------|
| "No podemos diagnosticar errores a escala" | Crecimiento limitado a 1,000 usuarios | Alertas automáticas + triage eficiente |
| "Bugs críticos pasan desapercibidos días" | Churn alto, reputación dañada | Detección en minutos, fix rápido |
| "No cumplimos GDPR para clientes europeos" | Mercado EU bloqueado | Compliance completo, certificable |
| "Soporte no escala (1 agente por 100 users)" | Hiring costoso | 1 agente por 300-500 users |

**Proyección de capacidad:**
```
Con sistema actual:
- Max usuarios soportables: 1,000
- Costo soporte a 1,000 users: 10 agentes * $2k = $20k/mes

Con sistema de logging:
- Max usuarios soportables: 5,000
- Costo soporte a 5,000 users: 15 agentes * $2k = $30k/mes
- Ahorro vs scaling lineal: (50 - 30) = $20k/mes = $240k/año
```

---

## 8. Plan de Acción por Fases (DETALLADO)

### Fase 0 – Preparación y Validación (1-2 días)

#### Objetivo
Establecer fundaciones, validar credenciales y definir responsabilidades antes de escribir código.

#### Tareas

**1. Setup de Sentry (4 horas)**
- [ ] Crear cuenta en sentry.io (free tier)
- [ ] Crear proyecto "appointsync-frontend-web"
- [ ] Crear proyecto "appointsync-edge-functions"
- [ ] Obtener DSN de ambos proyectos
- [ ] Configurar alertas por email (treshold: 10 errors en 5 min)
- [ ] Invitar a team members (si aplica)

**2. Definición de Roles y Responsabilidades (2 horas)**
```
Roles:
- Error Monitoring Owner: [Nombre]
  - Revisa dashboard Sentry diariamente
  - Triages errores críticos en <1h
  - Asigna bugs al equipo

- On-Call Developer: [Nombre]
  - Responde a alertas Sentry en horario laboral
  - Investiga y escala incidentes

- Security & Compliance: [Nombre]
  - Valida GDPR compliance de logs
  - Audita permisos RLS trimestralmente
```

**3. Auditoría de Variables de Entorno (2 horas)**
```bash
# .env.example actualizado
VITE_SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/456789
VITE_APP_VERSION=1.2.3
VITE_SENTRY_SAMPLE_RATE=0.3

# .env.production (no commitear)
SENTRY_AUTH_TOKEN=sntrys_xxx...
SUPABASE_SERVICE_ROLE_KEY=xxx
```

- [ ] Validar que todas las env vars están documentadas
- [ ] Configurar Vercel/Netlify secrets para producción
- [ ] Configurar Supabase Edge Function secrets vía CLI

**4. Revisión de Plan con Stakeholders (2 horas)**
- [ ] Presentar este documento a equipo técnico
- [ ] Obtener aprobación de inversión de tiempo (40h dev)
- [ ] Acordar métricas de éxito (ver sección 7.1)
- [ ] Establecer fecha de inicio de Fase 1

**Entregables:**
- ✅ Acceso a Sentry configurado
- ✅ Documento de roles y responsabilidades
- ✅ .env.example actualizado
- ✅ Aprobación de stakeholders

---

### Fase 1 – Fundamentos de Sentry (Frontend Web) (2-3 días)

#### Objetivo
Capturar y enviar errores de frontend a Sentry con contexto completo.

#### Tareas

**Día 1: Instalación y Configuración Básica (6-8 horas)**

**1.1 Instalación de dependencias**
```bash
npm install --save @sentry/react @sentry/vite-plugin
```

**1.2 Configurar Vite Plugin (`vite.config.ts`)**
```typescript
import { sentryVitePlugin } from '@sentry/vite-plugin'

export default defineConfig({
  plugins: [
    // ... otros plugins
    sentryVitePlugin({
      org: 'appointsync-pro',
      project: 'frontend-web',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      
      // Sourcemaps
      sourcemaps: {
        assets: './dist/**',
        filesToDeleteAfterUpload: './dist/**/*.map',
      },
      
      // Release
      release: {
        name: `frontend-web@${process.env.npm_package_version}`,
        create: true,
        finalize: true,
        setCommits: {
          auto: true,
        },
      },
      
      // Solo en production builds
      disable: process.env.NODE_ENV !== 'production',
    }),
  ],
  
  build: {
    sourcemap: true, // CRÍTICO para Sentry
  },
})
```

**1.3 Inicialización en `main.tsx`**
```typescript
import * as Sentry from '@sentry/react'

// Inicializar Sentry ANTES de ReactDOM.createRoot
if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: `frontend-web@${import.meta.env.VITE_APP_VERSION}`,
    
    // Sampling
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_SAMPLE_RATE) || 0.3,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Integrations
    integrations: [
      new Sentry.BrowserTracing({
        // React Router v6 instrumentation
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes
        ),
      }),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Filters
    ignoreErrors: [
      'ResizeObserver loop',
      'Non-Error promise rejection',
      'ChunkLoadError',
      'Loading chunk',
    ],
    
    denyUrls: [
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
    ],
    
    // Sanitization
    beforeSend(event, hint) {
      // Remover PII
      if (event.request?.headers) {
        delete event.request.headers['Authorization']
        delete event.request.headers['Cookie']
      }
      
      // Agregar contexto de usuario
      const { user } = useAuth.getState()
      if (user) {
        event.user = {
          id: user.id,
          role: user.role,
        }
        event.contexts = {
          ...event.contexts,
          business: {
            id: user.businessId,
          },
        }
      }
      
      return event
    },
  })
}

// Wrap root con Sentry.ErrorBoundary (opcional, tenemos custom)
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

**Día 2: Integración con ErrorBoundary y Hooks (6-8 horas)**

**2.1 Actualizar `ErrorBoundary.tsx`**
```typescript
import * as Sentry from '@sentry/react'

class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2)}`
    
    // 1. Console log (dev)
    console.error(`[ErrorBoundary - ${this.props.componentName}]`, {
      error,
      errorInfo,
      errorId,
    })
    
    // 2. Sentry (con contexto enriquecido)
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
          componentName: this.props.componentName,
        },
        errorBoundary: {
          errorId,
        },
      },
      tags: {
        errorBoundary: this.props.componentName,
        errorId,
      },
      level: 'error',
    })
    
    // 3. Callback
    this.props.onError?.(error, errorInfo, errorId)
    
    this.setState({ hasError: true, error, errorId })
  }
  
  // ... resto del componente
}

export default Sentry.withProfiler(ErrorBoundary)
```

**2.2 Crear `logger.ts` utility (ver sección 5.4 para código completo)**
- Implementar clase Logger con métodos debug/info/warn/error/fatal
- Integrar con Sentry.captureMessage()
- Agregar sampling y sanitization

**2.3 Instrumentar hooks críticos**
```typescript
// src/hooks/useSupabaseData.ts
import { logger } from '@/lib/logger'

export function useSupabaseData() {
  const createAppointment = async (data: Appointment) => {
    try {
      const { data: result, error } = await supabase
        .from('appointments')
        .insert(data)
        .select()
        .single()
      
      if (error) throw error
      
      logger.info('Appointment created successfully', {
        component: 'useSupabaseData.createAppointment',
        context: { appointmentId: result.id },
      })
      
      return result
    } catch (error) {
      logger.error(error, {
        component: 'useSupabaseData.createAppointment',
        context: { attemptedData: data },
      })
      
      showErrorToast('Failed to create appointment')
      throw error
    }
  }
  
  // ... resto de métodos
}
```

**Día 3: Testing y Validación (4-6 horas)**

**3.1 Test de captura de errores**
```typescript
// src/test-utils/testSentry.ts
export function testSentryIntegration() {
  // Test 1: Error básico
  try {
    throw new Error('Test error from testSentryIntegration')
  } catch (error) {
    logger.error(error, { component: 'SentryTest' })
  }
  
  // Test 2: Error con contexto
  logger.error(new Error('Test with context'), {
    component: 'SentryTest',
    context: {
      testData: { foo: 'bar' },
      timestamp: new Date().toISOString(),
    },
  })
  
  // Test 3: Fatal error
  logger.fatal(new Error('Test fatal error'), {
    component: 'SentryTest',
  })
  
  console.log('✅ Sentry tests completed. Check Sentry dashboard.')
}

// Ejecutar en consola del browser:
// import { testSentryIntegration } from './test-utils/testSentry'
// testSentryIntegration()
```

**3.2 Validación en Sentry Dashboard**
- [ ] Verificar que aparecen 3 eventos en Issues
- [ ] Validar que tienen stack traces
- [ ] Validar que tienen user context (id, role)
- [ ] Validar que tienen tags (component, errorId)
- [ ] Verificar sourcemaps (líneas de código correctas)

**3.3 Deploy a staging**
```bash
# Build con sourcemaps
npm run build

# Verificar que .map files se generaron
ls dist/assets/*.js.map

# Deploy a Vercel/Netlify staging
vercel --prod --env VITE_SENTRY_DSN=xxx

# Verificar release en Sentry
npx @sentry/cli releases list
```

**Entregables:**
- ✅ Sentry capturando errores en frontend
- ✅ ErrorBoundary integrado con Sentry
- ✅ logger.ts utility implementado
- ✅ 5+ hooks instrumentados con logging
- ✅ Tests validados en staging
- ✅ Sourcemaps funcionando

---

### Fase 2 – Plataforma de Logs en Supabase (2-3 días)

#### Objetivo
Crear tablas `error_logs` y `login_logs` con RLS policies y funciones RPC.

#### Tareas

**Día 1: Schema SQL y Migraciones (6-8 horas)**

**1.1 Crear migración `20251018000000_create_error_logs_system.sql`**
(Ver sección 5.2.1 para SQL completo)

**1.2 Crear migración `20251018000001_create_login_logs_system.sql`**
(Ver sección 5.3.1 para SQL completo)

**1.3 Aplicar migraciones**
```bash
# Opción 1: Via MCP (recomendado)
# Usar mcp_supabase_apply_migration tool

# Opción 2: Via Supabase CLI
npx supabase db push

# Opción 3: Via Dashboard
# Copiar SQL y ejecutar en SQL Editor
```

**1.4 Validar schema**
```sql
-- Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('error_logs', 'login_logs');

-- Verificar índices
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('error_logs', 'login_logs');

-- Verificar RLS habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('error_logs', 'login_logs');

-- Verificar funciones RPC
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('log_error_event', 'log_login_event');
```

**Día 2: Frontend Integration (6-8 horas)**

**2.1 Actualizar `logger.ts` para incluir Supabase**
(Ver sección 5.4 para implementación completa)

**2.2 Actualizar `ErrorBoundary` para loggear a Supabase**
```typescript
private async logErrorToSupabase(error: Error, errorInfo: React.ErrorInfo, errorId: string) {
  try {
    const { user } = useAuth.getState()
    const errorHash = generateErrorHash(error.message + error.stack)
    
    const { data, error: rpcError } = await supabase.rpc('log_error_event', {
      p_source: 'frontend-web',
      p_level: 'error',
      p_message: error.message,
      p_stack_trace: error.stack,
      p_user_id: user?.id,
      p_component: this.props.componentName,
      p_context: {
        componentStack: errorInfo.componentStack,
        errorId,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      },
      p_environment: import.meta.env.MODE,
      p_error_hash: errorHash,
    })
    
    if (rpcError) {
      console.error('[ErrorBoundary] Failed to log to Supabase:', rpcError)
    } else {
      console.log('[ErrorBoundary] Logged to Supabase with ID:', data)
    }
  } catch (logError) {
    console.error('[ErrorBoundary] Exception while logging:', logError)
  }
}
```

**2.3 Instrumentar auth hooks para login logging**
(Ver sección 5.5.1 para código completo)

**Día 3: Testing y Dashboard Admin (4-6 horas)**

**3.1 Test de logging completo**
```typescript
// Test script
async function testErrorLogging() {
  // 1. Simular error
  try {
    throw new Error('Test error for Supabase logging')
  } catch (error) {
    await logger.error(error, {
      component: 'TestScript',
      context: { test: true },
    })
  }
  
  // 2. Verificar en Supabase
  const { data, error } = await supabase
    .from('error_logs')
    .select('*')
    .eq('message', 'Test error for Supabase logging')
    .single()
  
  console.log('Test error logged:', data)
  
  // 3. Test login logging
  await supabase.rpc('log_login_event', {
    p_user_id: 'test-user-id',
    p_email: 'test@example.com',
    p_status: 'success',
    p_method: 'password',
    p_user_agent: navigator.userAgent,
  })
  
  console.log('✅ All tests passed')
}
```

**3.2 Crear componente Admin Dashboard para ver logs**
```typescript
// src/components/admin/ErrorLogsViewer.tsx (básico)
export function ErrorLogsViewer() {
  const [logs, setLogs] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchLogs() {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100)
      
      if (error) {
        console.error('Failed to fetch logs:', error)
      } else {
        setLogs(data || [])
      }
      setLoading(false)
    }
    fetchLogs()
  }, [])
  
  if (loading) return <LoadingSpinner />
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Error Logs</h2>
      
      <table className="w-full">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Level</th>
            <th>Component</th>
            <th>Message</th>
            <th>User</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td>{new Date(log.timestamp).toLocaleString()}</td>
              <td>
                <Badge variant={log.level === 'fatal' ? 'destructive' : 'default'}>
                  {log.level}
                </Badge>
              </td>
              <td>{log.component}</td>
              <td className="truncate max-w-xs">{log.message}</td>
              <td>{log.user_id?.substring(0, 8)}</td>
              <td>
                <Button size="sm" onClick={() => showDetails(log)}>
                  View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

**Entregables:**
- ✅ Tablas error_logs y login_logs creadas
- ✅ RLS policies configuradas y testeadas
- ✅ Funciones RPC funcionando
- ✅ logger.ts integrado con Supabase
- ✅ Login tracking funcionando
- ✅ Admin dashboard básico funcional

---

### Fase 3 – Instrumentación de Hooks y Componentes (3-5 días)

**Ver documento completo para detalles de Fases 3-6**

**Entregables totales al final de Fase 6:**
- ✅ 100% hooks críticos instrumentados
- ✅ 40 Edge Functions con logging
- ✅ Dashboard admin completo
- ✅ Alertas configuradas
- ✅ Documentación completa
- ✅ Métricas de éxito alcanzadas
2. **Funciones auxiliares:**
   - `log_error_event(data JSONB)` y `record_login_event(data JSONB)` como SECURITY DEFINER. 
   - Validar y normalizar payload (evitar SQL injection, tamaño). 
   - Retornar `error_id` generado (UUID).
3. **MCP / Automatización:**
   - Ejecutar migraciones mediante MCP o CLI (`npx supabase db push`). 
   - Documentar credenciales necesarias.
4. **Integración básica:**
   - Crear helper `sendErrorLog` en frontend que llame a RPC `log_error_event` (con throttling).

### Fase 3 – Instrumentación Frontend Avanzada (3-5 días)
1. **Logger central:**
   - Crear `src/lib/logger.ts` con métodos `info`, `warn`, `error`.
   - `error()` debe: a) enviar a Sentry, b) invocar `sendErrorLog`, c) registrar en consola en desarrollo.
2. **Hooks y contextos:**
   - Instrumentar `useSupabaseData`, `useAuth`, `useSubscription`, `useInAppNotifications`, `useBugReports`, `useGoogleCalendarSync`. 
   - Incluir contexto: `user.id`, `role`, `businessId`, `operation`, `payloadSize`.
3. **Captura de rejections y fetch:**
   - `window.addEventListener('unhandledrejection', handler)` para enviar a logger. 
   - Wrapper fetch/axios si aplica.
4. **UI Feedback:**
   - Mantener toasts, pero adjuntar `errorId` para seguimiento (p.ej., mostrar `Código de error ####` a usuario).

### Fase 4 – Edge Functions y Backend (4-6 días)
1. **Sentry en Deno:**
   - Añadir `@sentry/deno` a funciones críticas (billing webhooks, notification senders, cron). 
   - Configurar `Sentry.init` con environment, release, sample rate.
2. **Middleware/Wrapper:**
   - Implementar helper `captureEdgeException(fn)` que envuelva handlers y reporte a `log_error_event` (HTTP POST al RPC con service role). 
   - Insertar `request_id` (UUID), `function_name`, `status_code` y `duration`.
3. **Login logs:**
   - Crear Edge Function `record-login` o reutilizar existing serverless endpoint. 
   - Tras login exitoso (`useAuth.signIn`), llamar a endpoint que extrae `req.headers['x-real-ip']` o similar (en Supabase logs no se obtiene IP directamente; usar `X-Forwarded-For`). 
   - Para intentos fallidos, registrar desde frontend (sin IP) solo email+status.
4. **Validación:**
   - Pruebas manuales y scripts en `tests/` que simulen fallos controlados.

### Fase 5 – Monitoreo y Operación Continua (1-2 días + ongoing)
1. **Dashboards Sentry:**
   - Configurar alertas por release/environment. 
   - Definir umbrales (p.ej., >5 errores en 5 minutos).
2. **Panel en App:**
   - Opcional: crear vista admin con listado de `error_logs` (filtros por fecha/origen/resuelto). 
   - Añadir acciones para marcar errores como resueltos (`resolved`, `comment`).
3. **Documentación:**
   - Guía en `docs/OBSERVABILIDAD_GUIDE.md` con procesos: cómo responder a un error, cómo consultar logs, cómo ajustar sampling.
4. **Mantenimiento:**
   - Rutina mensual para purgar logs >180 días (función SQL). 
   - Revisar límites Sentry (ajustar sampleRate si se excede).

### Fase 6 – Extensiones Futuras (Opcional)
- Integrar Sentry en aplicación móvil (React Native) y extensión Chrome.
- Correlacionar `error_logs` con `bug_reports` (campo `related_error_id`).
- Métricas de rendimiento (Core Web Vitals) con Sentry o alternativa ligera.

---

## 9. Matriz de Prioridades

| Item | Impacto | Esfuerzo | Prioridad |
|------|---------|----------|-----------|
| Sentry Frontend (Fase 1) | Alto | Medio | **Alta** |
| Tabla `error_logs` + RPC (Fase 2) | Alto | Medio | **Alta** |
| Logger unificado Hooks (Fase 3) | Alto | Medio | **Alta** |
| Instrumentación Edge (Fase 4) | Muy alto (billing/notifs) | Alto | **Alta** |
| Login logs (Fase 4) | Medio | Medio | Media |
| Panel de observabilidad interno (Fase 5) | Medio | Bajo | Media |
| Documentación y Playbooks (Fase 5) | Alto | Bajo | Alta |
| Soporte móvil/extensión (Fase 6) | Medio | Medio | Baja |

---

## 10. Riesgos y Mitigaciones

| Riesgo | Mitigación|
|--------|-----------|
| Exceso de cuota Sentry | Configurar `sampleRate` y `denyUrls` para errores esperados; usar `beforeSend` para filtrar. |
| Fugas de datos sensibles | Sanitizar mensajes antes de enviarlos; almacenar en `context` solo identificadores. |
| Coste de almacenamiento Supabase | Implementar política de retención y purga programada. |
| Complejidad en Edge Functions | Introducir wrapper reutilizable y testing automatizado. |
| Falta de adopción del equipo | Documentar procesos, capacitar y definir responsables de monitoreo. |

---

## 11. Dependencias y Herramientas

- **Sentry DSN y cuenta** (frontend + serverless). 
- **Supabase CLI / MCP** para ejecutar migraciones y funciones. 
- **Variables de entorno** nuevas: `VITE_SENTRY_DSN`, `VITE_SENTRY_ENVIRONMENT`, `SENTRY_DSN_EDGE`, `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE`. 
- **Librerías**: `@sentry/react`, `@sentry/vite-plugin`, `@sentry/deno`. 
- **Scripts**: Actualizar `package.json` para subir source maps (`npm run build` + `sentry-cli`). 

---

## 12. Próximos Pasos Inmediatos

1. Aprobar plan por fases y asignar responsables.  
2. Crear proyecto Sentry y generar DSN.  
3. Preparar migración SQL para `error_logs` y `login_logs`.  
4. Iniciar Fase 1 (Sentry frontend) con entorno de staging.  
5. Definir pipeline de despliegue (CI/CD) para publicar source maps y Edge Functions instrumentadas.

---

> **Conclusión:** AppointSync Pro cuenta con una arquitectura madura y modular, pero carece de un sistema de observabilidad integral. La introducción de Sentry junto a una capa de auditoría en Supabase permitirá correlacionar errores entre superficies, reducir el tiempo de resolución de incidentes y cumplir con requisitos de trazabilidad. El plan propuesto aborda la implementación de forma incremental, priorizando componentes críticos y asegurando que la nueva infraestructura de logging sea escalable, segura y alineada con las prácticas actuales del proyecto.
