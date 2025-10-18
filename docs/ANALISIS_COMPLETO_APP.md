# Análisis Completo de la Aplicación AppointSync Pro

> **Fecha del análisis:** 17 de octubre de 2025  
> **Revisor:** GitHub Copilot (Agente IA)  
> **Contexto:** Preparación para implementar sistema integral de logs, captura de errores y monitoreo con Sentry + Base de datos de auditoría

---

## 1. Resumen Ejecutivo

AppointSync Pro es una plataforma integral de gestión de citas, negocios y equipos orientada a profesionales de servicios. La solución está construida sobre React + TypeScript (Vite) con una arquitectura modular que integra múltiples superficies (web, mobile, extensión de navegador) y un backend serverless sobre Supabase. El sistema incorpora funcionalidades avanzadas como perfiles públicos indexables, flujos completos de reserva con preselección, gestión de notificaciones multicanal, facturación multi-pasarela (Stripe, PayU, MercadoPago), sistema de vacantes laborales, contabilidad, temas dinámicos, analytics (GA4) y un sistema de reporting de bugs.

El objetivo de este análisis es comprender a profundidad todos los módulos, flujos y tecnologías para diseñar un sistema de logging y captura de errores que cubra toda la superficie, garantizando trazabilidad, diagnósticos rápidos y cumplimiento de auditoría.

### Highlights clave
- **Frontend**: React 18 + TypeScript, arquitectura modular por dominios (landing, admin, client, employee, billing, appointments, jobs, reviews, settings...).
- **Estado/Networking**: React Query, Context API, hooks especializados (`useSupabaseData`, `useAuth`, `useAnalytics`, `useNotifications`, ...).
- **Backend-as-a-Service**: Supabase (Auth, Postgres con RLS, Storage, Edge Functions, Realtime, Cron - pg_cron).
- **Integraciones**: Stripe/PayU/MercadoPago, AWS SES/SNS, WhatsApp Business API, Google Calendar, GA4, MCP para operaciones directas.
- **Seguridad y RLS**: Extenso uso de RLS en casi todas las tablas, con funciones auxiliares `auth.*` para validar roles.
- **Observabilidad actual**: ErrorBoundary avanzado con logging placeholder, GA4 `trackError`, toasts (`sonner`) y múltiples logs en consola. No existe integración con Sentry ni tabla de logs centralizada.

---

## 2. Arquitectura General

### 2.1 Monorepo
- `src/`: Aplicación web principal (React + Vite).
- `mobile/`: App Expo/React Native (supabase shared services).
- `extension/` y `src/browser-extension/`: Extensión de navegador (integración con Supabase y notificaciones).
- `supabase/`: Configuración de migraciones SQL, Edge Functions (Deno), seeds y scripts.
- `docs/`: Documentación extensa por módulo (analytics, billing, notificaciones, roles, etc.).
- `tests/`: Suite de pruebas Vitest (E2E pausadas por límites de Supabase).

### 2.2 Frontend Web
- **Entrypoint**: `src/main.tsx` envuelve `<App />` en `ErrorBoundary` global (`react-error-boundary` + custom fallback) y estilos globales.
- **App Shell**: `src/App.tsx` configura proveedores (Theme, Language, AppState, Notification, Auth), React Router, QueryClient.
- **Layouts**: `src/components/layouts/UnifiedLayout.tsx` orquesta barras, modales globales (chat, bug report), y se adapta según rol activo.
- **Ruteo**: React Router v6 con rutas públicas (`/`, `/negocio/:slug`, `/login`, `/register`) y privadas (`/app`, `/admin`, `/employee`, `/client`).

### 2.3 Estado y Contextos
- `AuthContext`: Centraliza auth con supabase.single client, calcula roles dinámicos.
- `AppStateContext`: Maneja loaders globales, errores, toasts (sonner).
- `NotificationContext`: Gestión de toasts/notificaciones en tiempo real con reglas de supresión.
- `ThemeContext`, `LanguageContext`: Persistencia con `useKV` (localStorage).

### 2.4 Hooks Clave
- `useAuth` / `useAuthSimple`: Gestión auth completa (registro, login, oauth, roles, perfiles).
- `useSupabaseData`: Data layer con React Query-like pattern manual (appointments, services, analytics...).
- `useNotifications`, `useInAppNotifications`, `useGoogleCalendarSync`, `useBugReports`, `useAnalytics`, `useUserRoles`, `usePermissions-v2`, `useSubscription`, `useBusinessProfileData`, `useMandatoryReviews`.

### 2.5 Servicios/Libs
- `src/lib/supabase.ts`: Cliente Supabase singleton + mock demo.
- `src/lib/permissions.ts` y `permissions-v2.ts`: Gestión granular de permisos por rol/plantillas.
- `src/lib/payments/*`: Abstracción de pasarelas (StripeGateway, PayUGateway, MercadoPagoGateway).
- `src/lib/ga4.ts`: Inicialización GA4 y utilidades.
- `src/lib/googleCalendar.ts`: Integración directa con Google Calendar API.
- `src/lib/notificationRoleMapping.ts`: Resolución de rutas/roles según tipo de notificación.

### 2.6 UI
- Tailwind CSS con tema y tokens semánticos (`bg-background`, `text-foreground`).
- Radix UI, ShadCN (Card, Tabs, Dialog, etc.), icons Lucide/Phosphor.
- Componentes modulares por dominio: administración, facturación, citas, empleados, landing, etc.

---

## 3. Backoffice Supabase

### 3.1 Base de Datos
- **Tablas principales** (resaltado):
  - `profiles`, `businesses`, `locations`, `services`, `appointments`, `business_employees`, `reviews`, `transactions`, `tax_configurations`, `business_plans`, `payment_methods`, `subscription_payments`, `discount_codes`, `notification_log`, `notification_queue`, `bug_reports`, `job_vacancies`, `job_applications`, `chat_*` (conversations, messages…), etc.
- **Migraciones**: Organizadas por fecha con descripciones extensas (ej. `20251015000000_billing_system_core.sql`, `20251017100000_bug_reports_system.sql`, `20251011000000_database_redesign.sql`).
- **RLS**: Activo en casi todas las tablas, con políticas detalladas (propietarios, empleados, clientes, service_role). Funciones `auth.is_business_owner`, `auth.is_business_admin`, etc.

### 3.2 Storage
- Buckets configurados: `bug-reports-evidence`, `user-avatars`, `cvs`, `business-logos`, etc. RLS configurado vía scripts.

### 3.3 Edge Functions (Deno)
- Notificaciones: `send-notification`, `process-notifications`, `send-notification-reminders`, `send-email-reminder`, `send-whatsapp-reminder`, `daily-digest`, `send-unread-chat-emails`.
- Billing: `create-checkout-session`, `manage-subscription`, `stripe-webhook`, `payu-create-checkout`, `payu-webhook`, `mercadopago-create-preference`, `mercadopago-webhook`, `mercadopago-manage-subscription`.
- Calendarios y sincronización: `google-calendar-sync`, `sync-appointments`, `calendar-integration`.
- Chat/Browser extension: `browser-extension-data`.
- Otros: `refresh-ratings-stats`, `appointment-actions`.

### 3.4 Cron Jobs
- `process-reminders` via cron (pg_cron) para recordatorios cada X minutos.
- Scripts SQL documentados para cron (ej. `20251220000002_setup_reminder_cron.sql`).

### 3.5 MCP Server
- Permite ejecutar SQL directo (migraciones, consultas, updates) desde el agente.

---

## 4. Superficies de Usuario

### 4.1 Landing Pública (`/`)
- Secciones: Hero, Features, How it Works, Testimonials, Pricing, CTA final, Footer con smooth scroll y GA4 tracking.
- Componentes: `src/components/landing/*` (Header, Hero, Features, Steps, Testimonials, PricingPlans, FAQ, CTA, Footer).
- Integration GA4: `useAnalytics().trackPageView` y eventos CTA.

### 4.2 Perfil Público de Negocio (`/negocio/:slug`)
- Hook `useBusinessProfileData` carga servicios, ubicaciones, equipo, reseñas.
- Layout tabbed (`PublicBusinessProfile.tsx`), SEO (Helmet), JSON-LD.
- CTA reserva abre `AppointmentWizard` con preselecciones, maneja usuarios no autenticados (redirect login con parámetros).

### 4.3 App Autenticada
- **UnifiedLayout** centraliza sidebar, header, floating buttons (Chat, Bug Report), switch de roles.
- **Roles**: admin, employee, client. Rol activo se almacena en localStorage (`useUserRoles`).
- **Dashboards**:
  - `AdminDashboard`: métricas, cards, tabs (Billing, Accounting, Reports, Notifications, Settings...).
  - `EmployeeDashboard`: agenda, solicitudes, vacantes.
  - `ClientDashboard`: calendario, historial, negocios recomendados.

### 4.4 Sistema de Citas
- `AppointmentWizard`: flujo multi-step con preselecciones, badges, validaciones, progress bar.
- `useAppointments` en `useSupabaseData`: CRUD, realtime, notifications.
- `useMandatoryReviews`: fuerza reseñas post-cita.

### 4.5 Notificaciones Multicanal
- Tablas: `notification_log`, `notification_queue`, `in_app_notifications`.
- Canales: in-app, email (SES), SMS (SNS), WhatsApp (API). Edge Functions para envío.
- UI: `NotificationCenter`, `NotificationBell`, `NotificationErrorBoundary`.
- Role switching automático al navegar desde notificaciones (`notificationRoleMapping`).
- Audit: `NotificationTracking` muestra estadísticas.

### 4.6 Billing/Suscripciones
- `PricingPage`, `BillingDashboard`, modals (PlanUpgrade, Cancel, PaymentMethod, UsageMetrics).
- `useSubscription` + `PaymentGatewayFactory` (Stripe, PayU, MercadoPago) config en `.env` (`VITE_PAYMENT_GATEWAY`).
- Edge Functions para crear checkout, webhooks actualizan `business_plans`, `subscription_payments`, `billing_audit_log`.

### 4.7 Sistema de Vacantes Laborales
- Módulos admin/employee, hooks (`useJobVacancies`, `useJobApplications`), UI (admin y employee). Edge functions para notificaciones.
- Documentación: `docs/PROGRESO_IMPLEMENTACION_VACANTES.md`.

### 4.8 Contabilidad y Reportes
- Hooks `useBusinessTaxConfig`, `useTaxCalculation`, `useTransactions`.
- Componentes `AccountingPage`, `ReportsPage`, `EnhancedTransactionForm`.
- Tests: `useTaxCalculation.test.tsx`, `exportToPDF.test.ts`.

### 4.9 Chat en tiempo real
- Tablas `chat_conversations`, `chat_messages`, `chat_participants`.
- Hooks `useChat`, `useConversations`.
- UI `ChatLayout`, `ChatWindow`, `ChatErrorBoundary`.
- Realtime Supabase con canales persistentes (fix leaks).

### 4.10 Sistema de Bug Reports
- Nuevo módulo (Oct 2025): `BugReportModal`, `FloatingBugReportButton`, hook `useBugReports`, bucket evidence, Edge Function `send-bug-report-email` (SES).
- Documentación: `docs/SISTEMA_REPORTE_BUGS.md`.

### 4.11 Analytics (GA4)
- `useAnalytics` hook: page_view, eventos booking, auth, errors.
- `useAnalytics().trackError` registra `exception` event en GA4.
- `ga4.ts` inicializa measurement ID y consent mode.

### 4.12 Temas
- Light/Dark con `ThemeProvider`, variables CSS, `ThemeToggle`.
- Convención: no usar colores hardcodeados.

---

## 5. Autenticación y Roles

### 5.1 Supabase Auth
- `useAuth` hook + `AuthContext` (context central).
- Roles dinámicos calculados en runtime (no tabla user_roles): owner → admin, employee (tabla business_employees), client default.
- `useUserRoles` maneja activeRole y switching (localStorage).
- OAuth, email/pass, password reset, session persistence.
- `useAuthSimple` disponible para debugging.

### 5.2 Roles y Permisos
- `ROLE_PERMISSIONS` (legacy) + `permissions-v2` (granular 55 permisos).
- `usePermissions-v2` hook + tests Vitest.
- `PermissionsManager` UI para asignar roles, gestionar permisos.
- `notificationRoleMapping` define role switching desde notificaciones.

### 5.3 Seguridad
- RLS en tablas sensibles, policies documentadas.
- Edge Functions usan `SUPABASE_SERVICE_ROLE_KEY` y controlan acceso.
- Documentación en `database/rls-policies.sql`, migraciones específicas.

---

## 6. Integraciones Externas

| Integración | Uso | Archivos Clave | Notas |
|-------------|-----|---------------|-------|
| **Supabase** | Auth, Postgres, Storage, Edge Functions, Realtime | `src/lib/supabase.ts`, migraciones, Edge | Cliente singleton, demo mode, MCP disponible |
| **AWS SES/SNS** | Emails, SMS | Edge functions `send-notification`, `send-email-reminder`, `send-bug-report-email` | Env vars `AWS_*`, plantillas HTML |
| **WhatsApp Business API** | Recordatorios | Edge `send-whatsapp-reminder` | env `WHATSAPP_*` |
| **Stripe** | Pasarela principal | Edge `create-checkout-session`, `manage-subscription`, `stripe-webhook`, `StripeGateway` | Multi-plan, webhooks, audit log |
| **PayU Latam** | Pasarela alternativa | Edge `payu-create-checkout`, `payu-webhook`, gateway | Falta configurar credenciales |
| **MercadoPago** | Tercera pasarela | Edge `mercadopago-*`, gateway | Soporte LATAM, docs en `docs/INTEGRACION_MERCADOPAGO.md` |
| **Google Analytics 4** | Analytics | `useAnalytics`, `ga4.ts`, docs GA_SETUP_GUIDE | GDPR, consent banner |
| **Google Calendar** | Sync | `googleCalendar.ts`, Edge `google-calendar-sync` | OAuth client-side + server functions |
| **MCP** | SQL directo | Instrucciones en `.github/copilot-instructions.md` | Usar para migraciones/logs |

---

## 7. Sistemas de Error Handling/Observabilidad actuales

- **ErrorBoundary Global** (`src/components/ErrorBoundary.tsx`): Logging estructurado (console), errorId, fallback UI, placeholder `logErrorToService` (imprime JSON con stack, userAgent, URL). Actualmente no envía a Sentry ni BD.
- **Error Boundaries específicos**: `ChatErrorBoundary`, `NotificationErrorBoundary`, `NotificationItemErrorBoundary`.
- **Toasts**: `sonner` se usa para mostrar errores en múltiples hooks (`useSupabase`, `useAuth`, `useBugReports`, `useSubscription`, `AdminOnboarding`, `NotificationTracking`).
- **Logs en consola**: Abundantes `console.log/info/error` en Edge Functions, hooks y componentes (debug). Muchas funciones reportan errores exactos (ej. `useAuth`, `useBugReports`, Edge send-notification).
- **GA4**: `useAnalytics().trackError` envía `exception` events (no centralizado).
- **Tests**: Vitest con mocks Supabase (no central logging).
- **No existe**: Sentry, tabla `error_logs`, seguimiento de logins (solo supabase `auth.users.last_sign_in_at`).

---

## 8. Identificación de Áreas Críticas para Logging

1. **Edge Functions**: Errores actualmente solo loggeados por `console.error`. Necesitan reporting central para fallas (billing webhooks, notificaciones, paywall). Muchos `try/catch` retornan JSON error pero sin persistencia.
2. **Hooks críticos**: `useSupabaseData`, `useAuth`, `useSubscription`, `useBugReports`, `useJobVacancies`. Manejan errores con toasts pero sin tracking permanente.
3. **Procesos asíncronos**: Cron jobs (`process-reminders`), Edge `send-notification-reminders`, `daily-digest`. Requerirían logging de éxito/falla por ejecución.
4. **Integraciones externas**: Stripe/PayU/MercadoPago webhooks, GA4, Google Calendar, AWS SES/SNS. Necesitan monitoreo de errores de API.
5. **Auth y roles**: Cambios de sesión, sign-in/out, switching de rol. Registrar logins, MFA (si existiera), errores supabase auth.
6. **Realtime**: Suscripciones chat, appointments. Eventuales errores de conexión deben monitorearse.
7. **UI**: ErrorBoundary global debería reportar a Sentry + BD con stack, componentName, user context.
8. **Bug report system**: Podría integrarse con nuevo logging para complementar.

---

## 9. Consideraciones para el Sistema de Logs y Sentry

### 9.1 Alcance deseado (según requerimiento)
- Integrar Sentry (plan gratis) en frontend (React) y Edge Functions (Deno) si posible.
- Crear tabla `error_logs` en Supabase para auditoría/local retention.
- Registrar logins/sesiones en tabla `login_logs` (usuario, IP, device, resultado).
- Mantener compatibilidad con RLS y políticas existentes.
- Proveer plan de acción por fases.

### 9.2 Contexto técnico relevante
- Vite + React (Sentry SDK compatible).
- Edge Functions en Deno: Sentry tiene SDK (hay ejemplo `@sentry/deno`). Necesario considerar tamaño bundle.
- Supabase Postgres: Creación de tablas con RLS para error logs (lectura restringida, escritura via service role o RPC).
- MCP disponible para crear tablas y stored procedures.

### 9.3 Riesgos/Desafíos
- Plan gratis Sentry: límite de eventos mensual, retención 90 días. Aplicar sampling para evitar costos.
- Duplicidad con GA4 `trackError`: decidir estrategia (mantener ambos o consolidar en Sentry con forward de metadata).
- Edge Functions requieren reinicio para habilitar Sentry (cambiar bundlers). Debe considerarse el peso.
- Logging en BD debe evitar exponer datos sensibles (PII). Considerar anonimizar o encriptar.
- Login logs: Supabase `auth.logins` no disponible; se necesita interceptar eventos (auth callbacks no nativos). Alternativa: log en frontend/Edge cuando signIn exitoso y fallido.

---

## 10. Recomendaciones Iniciales (Pre-plan)

1. **Sentry Frontend**: Configurar Sentry Vite Plugin, `Sentry.init` en `main.tsx`, capturar errores de React Query, fetch, etc. Integrar con ErrorBoundary `logErrorToService` para custom data (user, componentName, errorId). Configurar sampling.
2. **Sentry Edge Functions**: Usar `@sentry/deno` en funciones críticas (billing webhooks, notifications). Capturar exceptions y breadcrumbs.
3. **Supabase `error_logs`**:
   - Campos sugeridos: `id`, `timestamp`, `level`, `source` (frontend/edge/hook), `message`, `stack`, `user_id`, `session_id`, `component`, `context` (JSONB), `resolved` flag.
   - RLS: solo service_role puede insertar; lectura restringida a admin/support.
   - Integración: `logErrorToService` y Edge Functions envían a tabla via RPC/Edge (service role).
4. **`login_logs`**:
   - Campos: `id`, `user_id`, `email`, `ip_address`, `user_agent`, `device_info`, `timestamp`, `status` (success/failure), `method` (email/password, google), `metadata`.
   - Registrar desde `useAuth` (frontend) + Edge para IP (posible duplicidad). Alternativa: Edge Function `record-login` que se llama tras signIn (para obtener IP real).
5. **Centralizar Logging Client**: Crear utilidad `logger.ts` con métodos `logInfo`, `logWarn`, `logError` que envían a Sentry + consola (para conservar debugging).
6. **Documentar Flujo**: Guía para interpretar logs, dashboards Sentry, retención, políticas de datos.

---

## 11. Próximos Pasos

- [x] Análisis completo (este documento).
- [ ] Generar plan de acción por fases (documento separado).
- [ ] Implementar plan (Sentry + tablas + hooks + Edge).

---

## 12. Referencias y Documentación Útil

- `.github/copilot-instructions.md`: Guía completa de sistemas existentes.
- `docs/GA_SETUP_GUIDE.md`, `docs/SISTEMA_NOTIFICACIONES_COMPLETO.md`, `docs/CONFIGURACION_SISTEMA_FACTURACION.md`, `docs/SISTEMA_CONTABLE_FASE_4_COMPLETADA.md`, `docs/RESUMEN_IMPLEMENTACION_PAYU.md`, `docs/INTEGRACION_MERCADOPAGO.md`.
- `supabase/functions/*`: Revisar funciones críticas para instrumentar.
- `src/hooks/useAnalytics.ts`: Referencia de tracking actual.
- `src/components/ErrorBoundary.tsx`: Punto central para integrar Sentry y logging BD.
- `useSubscription`, `useAuth`, `useSupabaseData`: Hooks a instrumentar.

---

> **Conclusión:** La aplicación presenta una arquitectura madura, modular y altamente integrada, con múltiples superficies y servicios externos. La implementación de un sistema de logging robusto debe cubrir frontend, Edge Functions y Supabase, alineado con las políticas de seguridad y RLS. El siguiente paso es diseñar un plan de implementación por fases que priorice la instrumentación de componentes críticos y garantice observabilidad completa.
