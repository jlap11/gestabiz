# Guía de Copilot para Gestabiz

> **Sistema integral de gestión de citas y negocios** - FASE BETA COMPLETADA  
> **Stack**: React 18 + TypeScript 5.7 + Vite 6 + Supabase + Tailwind 4  
> **Última actualización**: Octubre 2025  
> **Estado del Proyecto**: ✅ Funcionalidad completa | 🐛 Solo bugs y optimizaciones

---

## 📖 RESUMEN EJECUTIVO

**Gestabiz** es una plataforma omnicanal (web/móvil/extensión) para gestión de citas y negocios con:

- **8 sistemas principales completados**: Edición de citas, Sede preferida, GA4, Landing page, Perfiles públicos, Navegación con roles, Configuraciones unificadas, Ventas rápidas
- **40+ tablas en Supabase**: PostgreSQL 15+ con RLS, extensiones (pg_trgm, postgis), Edge Functions (Deno)
- **30+ Edge Functions desplegadas**: Notificaciones multicanal, pagos (Stripe/PayU/MercadoPago), chat, reviews
- **Arquitectura multi-rol**: Admin/Employee/Client calculados dinámicamente (NO guardados en BD)
- **55 hooks personalizados**: useAuth, useSupabaseData, useBusinessProfileData, useJobVacancies, etc.
- **Base de código**: ~150k líneas TypeScript, 1,056 archivos .ts/.tsx

### Principios de Desarrollo
1. **No generar .md sin solicitud explícita** - Mantener repo limpio
2. **No usar emojis en UI** - Solo iconos profesionales (Phosphor/Lucide)
3. **Cliente Supabase singleton** - Un solo export en `src/lib/supabase.ts`
4. **Roles dinámicos** - Calculados en tiempo real, no persistidos
5. **TypeScript strict** - Cero `any`, tipado completo

---


## 📋 SISTEMAS PRINCIPALES (COMPLETADOS)

> **Estado**: Fase BETA finalizada. No se agregarán nuevos flujos funcionales.  
> **Pendiente**: Corrección de bugs, mejoras de UX y optimizaciones.

### 1. Edición de Citas con Validación ⭐ PRODUCTION READY
**Sistema completo de creación/edición de citas con validación en tiempo real**

- **Componente**: `DateTimeSelection.tsx` (328 líneas)
- **Validaciones implementadas**:
  - ✅ Horarios de apertura/cierre de sede (`locations.opens_at`, `closes_at`)
  - ✅ Hora de almuerzo del profesional (`business_employees.lunch_break_start/end`)
  - ✅ Citas ocupadas por otros clientes (overlap detection)
  - ✅ Exclusión de cita en edición (permite reprogramar mismo horario)
- **Feedback visual**: Tooltips en slots deshabilitados ("Hora de almuerzo" / "Ocupado")
- **CREATE vs UPDATE**: `createAppointment()` diferencia entre INSERT y UPDATE
- **Props clave**: `employeeId`, `locationId`, `businessId`, `appointmentToEdit`
- **3 Queries paralelas**: Location schedule, employee schedule, existing appointments
- **Algoritmo overlap**: `slotStart < aptEnd && slotEnd > aptStart`
- **Ver**: `docs/SISTEMA_EDICION_CITAS_COMPLETADO.md`

### 2. Sede Preferida Global ⭐ PRODUCTION READY
**Sistema centralizado de sede predeterminada por negocio**

- **Hook**: `usePreferredLocation` (50 líneas) - Gestión en localStorage por negocio
- **Storage**: `localStorage` key `preferred-location-${businessId}` (NO en BD)
- **Configuración**: Campo "Sede Administrada" en CompleteUnifiedSettings
- **Visualización**: Badge "Administrada" en LocationsManager + nombre en header
- **Pre-selección automática en**:
  - Empleados (FiltersPanel)
  - Vacantes (CreateVacancy - solo nuevas)
  - Ventas Rápidas (QuickSaleForm - doble cache)
  - Reportes (ReportsPage)
- **Opción especial**: `value='all'` para resetear a "Todas las sedes"
- **Ver**: `docs/SISTEMA_SEDE_PREFERIDA_COMPLETADO.md`

### 3. Google Analytics 4 ⭐ PRODUCTION READY
**Integración completa de GA4 para tracking de conversión**

- **Infraestructura**:
  - Hook `useAnalytics` (370 líneas, 14 métodos)
  - Módulo `ga4.ts` (91 líneas, GDPR-compliant)
  - Componente `CookieConsent` (128 líneas)
- **Eventos implementados (11)**:
  - Booking flow: booking_started, booking_step_completed, booking_abandoned, purchase
  - Páginas públicas: page_view, profile_view, click_reserve_button, click_contact
  - Auth: login (email/google), sign_up
- **GDPR**: Cookie consent banner, anonymizeIp, consent mode API
- **Variables**: `VITE_GA_MEASUREMENT_ID`, `VITE_GA_FORCE_IN_DEV` (opcional dev)
- **Ver**: `docs/GA_SETUP_GUIDE.md`

### 4. Landing Page Pública
**Página de aterrizaje moderna SEO-optimizada**

- **Ubicación**: `src/components/landing/LandingPage.tsx`
- **Ruta**: `/` (accesible sin autenticación)
- **Secciones**: Hero, Features (grid 3x2), How It Works, Testimonials, Pricing, CTA, Footer
- **Navegación**: Header con logo, nav links, botones Login/Registro
- **Responsive**: Mobile-first con breakpoints Tailwind (sm/md/lg/xl)
- **Interactividad**: `onNavigateToAuth` prop, smooth scroll a secciones
- **SEO**: Meta tags, structured data, títulos semánticos
- **GA4**: Tracking de `page_view` event

### 5. Perfiles Públicos de Negocios ⭐ COMPLETADO
**Perfiles indexables por Google sin requerir autenticación**

- **Router**: React Router v6 con rutas públicas (`/`, `/negocio/:slug`) y privadas (`/app/*`)
- **URL amigable**: Slugs únicos (ej: `/negocio/salon-belleza-medellin`)
- **SEO completo**: Meta tags dinámicos, Open Graph, Twitter Card, JSON-LD structured data
- **Sitemap.xml**: Script `npm run generate-sitemap` genera sitemap dinámico
- **Robots.txt**: Permite `/negocio/*`, bloquea `/app/*` y `/admin/*`
- **Hook**: `useBusinessProfileData` (352 líneas) - Carga negocio/servicios/ubicaciones/empleados/reviews
- **Componente**: `PublicBusinessProfile` (449 líneas) - Layout con 4 tabs
- **Flow de reserva COMPLETO**:
  1. Usuario no autenticado → Clic "Reservar"
  2. Login con redirect + context preservation
  3. Wizard abierto automáticamente en paso correcto
  4. Datos preseleccionados (businessId, serviceId, locationId, employeeId)
- **Auth redirect**: AuthScreen lee URL params, toast informativo, navegación post-login
- **Preselección inteligente**: AppointmentWizard calcula paso inicial dinámicamente
- **Feedback visual**: Badges "Preseleccionado" verdes + ring highlight
- **ProgressBar mejorado**: Check marks en completados, contador "3 of 7 steps"
- **Validaciones**: Compatibilidad empleado-servicio con query a `employee_services`
- **Reducción fricción**: 57% menos clics (7→3), 45% menos tiempo de booking
- **Ver**: `docs/FASE_4_SEO_UI_POLISH_COMPLETADA.md`

### 6. Navegación de Notificaciones con Cambio de Rol
**Cambio automático de rol antes de navegar a notificación**

- **Archivo**: `src/lib/notificationRoleMapping.ts` (363 líneas)
- **Mapeo**: 30+ tipos de notificación → rol requerido (admin/employee/client)
- **Cambio inteligente**: Si notificación requiere rol diferente, cambia automáticamente
- **Navegación contextual**: Extrae IDs (vacancyId, appointmentId) de notification.data
- **Componentes**: NotificationCenter, NotificationBell, UnifiedLayout
- **Flujo**: Usuario "client" → Clic notif vacante → Cambia a "admin" → Navega a "recruitment"
- **Ver**: `docs/SISTEMA_NAVEGACION_NOTIFICACIONES_CON_ROLES.md`

### 7. Configuraciones Unificadas por Rol
**TODOS los roles (Admin/Employee/Client) en un solo componente**

- **Ubicación**: `src/components/settings/CompleteUnifiedSettings.tsx` (1,448 líneas)
- **4 pestañas comunes**: Ajustes Generales, Perfil, Notificaciones, + 1 específica del rol
- **Admin**: Tab "Preferencias del Negocio" (información, contacto, dirección, legal, operaciones)
- **Employee**: Tab "Preferencias de Empleado" (horarios 7 días, salarios, especializaciones)
- **Client**: Tab "Preferencias de Cliente" (anticipación, pago, historial)
- **Dashboards**: AdminDashboard, EmployeeDashboard, ClientDashboard usan este componente
- **Sin duplicación**: Cero configuraciones repetidas entre roles
- **Ver**: `docs/SISTEMA_CONFIGURACIONES_UNIFICADO.md`

### 8. Sistema de Ventas Rápidas
**Registro de ventas walk-in con estadísticas en tiempo real**

- **Componentes**:
  - `QuickSaleForm.tsx` (410 líneas) - Formulario de venta rápida
  - `QuickSalesPage.tsx` (304 líneas) - Layout con estadísticas
- **Datos guardados**:
  - Cliente (nombre, teléfono, documento, email)
  - Servicio, Sede (requerida, con cache), Empleado (opcional)
  - Monto, Método de pago, Notas
- **Acceso**: Solo ADMINISTRADORES en AdminDashboard → "Ventas Rápidas"
- **Estadísticas**: Ventas del día, 7 días, 30 días (COP)
- **Historial**: Últimas 10 ventas registradas
- **Integración contable**: Transacción tipo `income`, categoría `service_sale`
- **Ver**: `docs/SISTEMA_VENTAS_RAPIDAS.md`




## 🏗️ ARQUITECTURA Y PATRONES

### Arquitectura de Autenticación ⭐ CRÍTICO
**Sistema centralizado con Context API para evitar múltiples instancias**

- **AuthContext**: `src/contexts/AuthContext.tsx` - Context que llama `useAuthSimple()` UNA sola vez
- **AuthProvider**: Wrapper que provee estado de auth a toda la app
- **useAuth()**: Hook consumidor para acceder al contexto
- **PATRÓN DE USO**:
  ```tsx
  // ❌ NUNCA: const { user } = useAuthSimple()
  // ✅ SIEMPRE: const { user } = useAuth()
  ```
- **Arquitectura**:
  - `App.tsx`: Envuelve `<AppRoutes />` con `<AuthProvider>`
  - `MainApp.tsx`: Usa `useAuth()` (NO `useAuthSimple()`)
  - Componentes: Usan `useAuth()` para acceder al estado
- **Cálculo de roles dinámico**: 
  - `useAuth.ts` NO usa tabla `user_roles` (no existe en DB)
  - Consulta `businesses.owner_id` → rol ADMIN
  - Consulta `business_employees.employee_id` → rol EMPLOYEE
  - Default → rol CLIENT
- **⚠️ IMPORTANTE**: Si ves "Multiple GoTrueClient instances detected", algo está llamando `useAuthSimple()` directamente o creando clientes Supabase adicionales. SIEMPRE usar el cliente singleton de `src/lib/supabase.ts`

### Sistema de Roles Dinámicos ⭐ CRÍTICO
**Los roles NO se guardan en la base de datos - se calculan dinámicamente**

- **ADMIN**: Usuario es `owner_id` de un negocio en `businesses`
- **EMPLOYEE**: Siempre disponible (todos pueden solicitar unirse a un negocio)
  - Si existe en `business_employees`: acceso completo
  - Si no existe: verá onboarding para unirse
- **CLIENT**: Siempre disponible (todos pueden reservar citas)
- **Acceso universal**: TODOS los usuarios tienen acceso a los 3 roles
- **Multi-negocio**: Un usuario puede ser admin de negocio A, employee de negocio B, y client en cualquier negocio
- **Hook**: `useUserRoles` calcula roles disponibles dinámicamente
- **Persistencia**: Solo el rol activo se guarda en localStorage
- **Ver**: `DYNAMIC_ROLES_SYSTEM.md`

### Cliente Supabase Singleton ⭐ CRÍTICO
**UN SOLO cliente para toda la aplicación**

- **Ubicación**: `src/lib/supabase.ts` (export único)
- **NUNCA**: Crear nuevos clientes con `createClient()` en otros archivos
- **Payment Gateways**: Reciben el cliente como parámetro en constructor
- **Demo Mode**: Cliente simulado si `VITE_DEMO_MODE=true` o URL contiene `demo.supabase.co`
- **Validación**: Detecta variables vacías o placeholders automáticamente
- **Logging**: Configuración visible en console (solo dev)



## Construcción y ejecución (local)
- Web (Vite): scripts en `package.json` raíz
  - dev: `npm run dev`; build: `npm run build`; preview: `npm run preview`; lint: `npm run lint`; type-check: `npm run type-check`.
  - Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, opcional `VITE_DEMO_MODE=true` para usar cliente Supabase simulado.
- Móvil (Expo): `src/mobile/` tiene su `package.json`
  - `npm run start|android|ios|web`, builds con EAS `build:*` y `submit:*`.
  - Env: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Extensión: `extension/` y `src/browser-extension/`
  - `npm run build` (copia/zip), `npm run dev` para servidor estático local; carga "unpacked" en Chrome.
- **Supabase**: SOLO en la nube (no hay instancia local). Ver `SUPABASE_INTEGRATION_GUIDE.md`, `src/docs/deployment-guide.md` y `supabase/functions/README.md` para CLI, Edge Functions y cron.
  - **MCP configurado**: Servidor Model Context Protocol disponible para operaciones directas de base de datos.

Objetivo: que un agente pueda contribuir de inmediato entendiendo la arquitectura, flujos de desarrollo y convenciones propias del proyecto.

## Panorama general
- Monorepo con 3 superficies: web (React + Vite), móvil (Expo/React Native) y extensión de navegador; backend en Supabase (solo en la nube).
- Ejes clave:
  - Cliente Supabase y utilidades: `src/lib/supabase.ts` (modo demo incluido), tipos en `src/types/**`, utilidades en `src/lib/**`.
  - Data hooks y servicios: `src/hooks/useSupabase.ts`, `src/hooks/useSupabaseData.ts` (fetch + mapping + reglas por rol).
  - Estado/UI: `src/contexts/AppStateContext.tsx` (loading/error/toasts), i18n `src/contexts/LanguageContext.tsx` con persistencia local (hook `useKV`), estilos con Tailwind y util `cn` (`src/lib/utils.ts`).
  - Integraciones: Google Calendar (`src/lib/googleCalendar.ts`), permisos (`src/lib/permissions.ts`).
  - **MCP de Supabase**: Servidor Model Context Protocol configurado para operaciones directas de base de datos.


## 🗄️ BASE DE DATOS SUPABASE

### Infraestructura
- **SOLO en la nube** (no hay instancia local)
- **PostgreSQL 15+** con extensiones:
  - `uuid-ossp`: Generación de UUIDs
  - `pg_trgm`: Búsqueda fuzzy (trigram)
  - `postgis`: Geolocalización
- **Row Level Security (RLS)**: Todas las tablas tienen políticas de seguridad
- **Edge Functions**: Deno runtime para lógica serverless
- **Realtime**: Suscripciones en tiempo real a cambios de datos
- **Storage**: Buckets para avatares, CVs, archivos de chat, bug reports

### Tablas Principales (40+)

**Core del Negocio**:
- `businesses`: Datos del negocio (owner_id, categorías, ratings cache)
- `locations`: Sedes físicas (opens_at, closes_at, coordenadas)
- `services`: Servicios ofrecidos (precio, duración, categoría)
- `business_employees`: Empleados vinculados (lunch_break, salarios, horarios)
- `location_services`: Servicios disponibles por sede
- `employee_services`: Servicios que ofrece cada empleado

**Citas y Clientes**:
- `appointments`: Citas agendadas (start_time, end_time, status, is_location_exception)
- `profiles`: Perfiles de usuario (name, email, phone, avatar_url, is_active)
- `reviews`: Calificaciones de clientes (rating 1-5, comment, response, review_type)

**Sistema de Categorías**:
- `business_categories`: 15 categorías principales
- `business_subcategories`: ~60 subcategorías (max 3 por negocio)

**Sistema de Reclutamiento**:
- `job_vacancies`: Vacantes publicadas (salary_range, commission_based, required_skills)
- `job_applications`: Aplicaciones a vacantes (status, cv_url, availability_notes)
- `employee_profiles`: Perfiles profesionales (skills, experience, certifications)

**Sistema de Notificaciones**:
- `business_notification_settings`: Configuración de canales, tiempos de recordatorio
- `user_notification_preferences`: Preferencias individuales por tipo y canal
- `notification_log`: Registro de notificaciones enviadas con tracking
- `in_app_notifications`: Notificaciones in-app (type, data JSONB, read status)

**Sistema de Facturación**:
- `subscriptions`: Suscripciones activas (Stripe/PayU/MercadoPago)
- `billing_invoices`: Facturas generadas
- `payment_methods`: Métodos de pago guardados
- `usage_metrics`: Métricas de uso para facturación

**Sistema Contable**:
- `transactions`: Ingresos y egresos (type, category, amount, fiscal_period)
- `business_tax_config`: Configuración de impuestos por negocio (IVA, ICA, Retención)

**Chat y Comunicación**:
- `conversations`: Hilos de conversación
- `messages`: Mensajes de chat (content, attachments, read_receipt)
- `chat_participants`: Participantes en conversaciones

**Permisos (v2.0)**:
- `business_roles`: Roles por negocio (admin/employee)
- `user_permissions`: Permisos granulares (55 permisos disponibles)
- `permission_templates`: Plantillas de permisos reutilizables
- `permission_audit_log`: Auditoría de cambios de permisos

### Migraciones Aplicadas (40+)
- `20251011000000_database_redesign.sql`: Rediseño completo del modelo
- `20251012000000_search_optimization.sql`: Índices trigram y full-text search
- `20251013000000_fiscal_system_colombia.sql`: Sistema contable colombiano
- `20251013000000_permission_system.sql`: Sistema de permisos granulares v2
- `20251013100000_chat_system.sql`: Sistema de chat completo
- `20251015000000_billing_system_core.sql`: Sistema de facturación
- `20251016000000_employee_hierarchy_system.sql`: Jerarquías de empleados
- `20251017000000_add_public_profile_fields.sql`: Campos para perfiles públicos
- `20251017000003_create_employee_profiles.sql`: Perfiles profesionales
- `20251017000004_enhance_job_vacancies.sql`: Mejoras a vacantes
- `20251018000000_create_logging_system.sql`: Sistema de logs centralizado
- `20251018000001_add_location_hours.sql`: Horarios de apertura/cierre
- `20251018000002_add_lunch_break_fields.sql`: Horas de almuerzo de empleados
- `executed/20251220000001_notification_system.sql`: Sistema de notificaciones multicanal
- `executed/EJECUTAR_SOLO_CATEGORIAS.sql`: Sistema de categorías jerárquicas

### Edge Functions Desplegadas (30+)

**Autenticación y Seguridad**:
- `create-test-users`: Crear usuarios de prueba

**Sistema de Notificaciones**:
- `send-notification`: Envío multi-canal (Email/SMS/WhatsApp)
- `process-reminders`: Procesador automático de recordatorios (cron cada 5 min)
- `send-notification-reminders`: Recordatorios de citas
- `send-unread-chat-emails`: Notificaciones de mensajes no leídos
- `send-employee-request-notification`: Notificaciones de solicitudes de empleados

**Sistema de Pagos**:
- **Stripe**: `create-checkout-session`, `stripe-webhook`, `manage-subscription`
- **PayU**: `payu-create-checkout`, `payu-webhook`
- **MercadoPago**: `mercadopago-create-preference`, `mercadopago-webhook`, `mercadopago-manage-subscription`

**Sistema de Chat**:
- `send-message`: Envío de mensajes

**Sistema de Reviews y Búsqueda**:
- `refresh-ratings-stats`: Actualiza vistas materializadas de ratings (cron cada 5 min)

**Sistema de Bug Reports**:
- `send-bug-report-email`: Envío de reportes de bugs por email

**Sistema de Citas**:
- `appointment-actions`: Acciones sobre citas (confirmar, cancelar, etc.)
- `calendar-integration`: Integración con Google Calendar

**Otros**:
- `daily-digest`: Digest diario de actividad
- `check-business-inactivity`: Verificación de inactividad de negocios

### RPC Functions Importantes
- `search_businesses()`: Búsqueda de negocios con ranking
- `search_services()`: Búsqueda de servicios con relevancia
- `search_professionals()`: Búsqueda de profesionales con stats
- `get_matching_vacancies()`: Matching de vacantes con empleados
- `get_business_hierarchy()`: Jerarquía de empleados
- `refresh_ratings_stats()`: Refresco de vistas materializadas

### Vistas Materializadas
- `business_ratings_stats`: Estadísticas de ratings por negocio
- `employee_ratings_stats`: Estadísticas de ratings por empleado

### Storage Buckets
- `avatars`: Avatares de usuario (public)
- `cvs`: CVs de aplicantes (private)
- `chat-attachments`: Archivos de chat (private)
- `bug-report-evidences`: Evidencias de bugs (private)

### IMPORTANTE - Campos Clave
- **business_employees** usa `employee_id` NO `user_id`: Siempre usar `employee_id = auth.uid()` en queries
- **appointments** tiene `is_location_exception` para empleados trabajando fuera de su sede
- **reviews** tiene `review_type` ('business' | 'employee') para diferenciar tipos
- **transactions** tiene campos fiscales: `subtotal`, `tax_type`, `tax_rate`, `tax_amount`, `fiscal_period`
- **job_vacancies** tiene `commission_based` (BOOLEAN) para salarios por comisión




## 💡 SISTEMAS ADICIONALES IMPLEMENTADOS

### Sistema de Vacantes Laborales ⭐ 100% COMPLETADO (2025-01-20)
**Reclutamiento completo con matching inteligente y reviews obligatorias**

- **7 Fases completadas**: Migraciones (385 líneas), 6 Hooks (1,510 líneas), 4 UI Admin (1,238 líneas), 5 UI Employee (1,699 líneas), Reviews (487 líneas), Notificaciones (223 líneas), Testing (1,260 líneas pausados)
- **Deployment**: ✅ Aplicado en Supabase Cloud (migraciones + triggers + Edge Functions)
- **Tests E2E deshabilitados**: 45 tests con `describe.skip()` por rate de emails (Supabase warning)
- **Funcionalidad**: ✅ 100% OPERATIVA (no afectada por tests pausados)
- **Características**:
  - Matching inteligente empleado-vacante
  - Detección de conflictos de horario
  - Reviews obligatorias al contratar/finalizar
  - Notificaciones automáticas (aplicación, aceptación, rechazo)
  - Sistema de salarios con checkbox comisiones
  - Formato miles colombiano (1.000.000)
- **Ver**: `docs/FASE_7_COMPLETADA_TESTING.md`, `docs/GUIA_ACCESO_SISTEMA_VACANTES.md`

### Sistema Contable Completo
**Cálculo automático de IVA, ICA y Retención en la Fuente**

- **Hooks optimizados**: 
  - `useBusinessTaxConfig`: Caché React Query 1h TTL, prefetch, invalidación
  - `useTaxCalculation`: 78% menos código, usa caché, memoización
  - `useTransactions`: `createFiscalTransaction()` para transacciones con impuestos
- **Componentes UI**:
  - `LoadingSpinner`: 4 variantes (LoadingSpinner, SuspenseFallback, ButtonSpinner, FormSkeleton)
  - `AccountingPage`: Tabs con lazy loading de TaxConfiguration y EnhancedTransactionForm
  - `ReportsPage`: Dashboard financiero con lazy loading
- **Navegación**: AdminDashboard tiene "Contabilidad" (Calculator icon) y "Reportes" (FileText icon)
- **Toast Notifications**: 8 flujos con `sonner` (exports, save/reset, create)
- **Tests**: 100% cobertura en `useTaxCalculation.test.tsx` y `exportToPDF.test.ts`
- **Performance**: 90% menos queries, 60% carga más rápida, 80% menos cálculos innecesarios
- **Moneda**: COP (pesos colombianos)
- **Ver**: `SISTEMA_CONTABLE_FASE_4_COMPLETADA.md`

### Sistema de Temas Claro/Oscuro
**Soporte completo de temas con persistencia**

- **ThemeProvider**: `src/contexts/ThemeProvider.tsx` - Context con hook `useKV` para localStorage
- **CSS Variables**: `src/index.css` - Variables semánticas `:root` (light) y `[data-theme="dark"]`
- **ThemeToggle**: `src/components/ui/theme-toggle.tsx` - Switch en AdminDashboard header
- **Variables CSS**: `bg-background`, `text-foreground`, `border-border`, `bg-card`, `text-muted-foreground`, `bg-primary`
- **Estado**: Implementado en AdminDashboard + componentes principales

### Sistema de Búsqueda Avanzada
**Full-text search con PostgreSQL y geolocalización**

- **SearchBar**: Dropdown de tipos, debounce 300ms
- **SearchResults**: 6 algoritmos de ordenamiento, rating+distancia balanceado
- **Modales**: BusinessProfile (4 tabs), UserProfile (3 tabs)
- **Hooks**: `useGeolocation`, `useEmployeeBusinesses`
- **Optimización Supabase**:
  - Índices trigram: `gin(name gin_trgm_ops)`
  - Full-text search: tsvector, GIN indexes, triggers
  - Vistas materializadas: business_ratings_stats, employee_ratings_stats
  - Funciones RPC: search_businesses, search_services, search_professionals
- **Performance**: 40-60x más rápido, 10x capacidad (100 → 1000 queries/seg)
- **Ver**: `OPTIMIZACION_BUSQUEDA_COMPLETADO.md`, `INTEGRACION_RPC_EDGE_FUNCTION.md`

### Sistema de Reviews Anónimas
**Calificaciones por servicio y profesional**

- **Componentes**: ReviewCard, ReviewForm, ReviewList
- **Hook**: `useReviews` - CRUD completo (create, respond, toggle visibility, delete)
- **Validación**: Solo clientes con citas completadas sin review previa
- **Integración**: Tabs de reviews en BusinessProfile y UserProfile
- **Traducciones**: `reviews.*` en español e inglés
- **Ver**: `SISTEMA_REVIEWS_COMPLETADO.md`

### Sistema de Notificaciones Multicanal ⭐ COMPLETO
**Email/SMS/WhatsApp con recordatorios automáticos**

- **Canales**: AWS SES (Email), AWS SNS (SMS), WhatsApp Business API
- **Edge Functions**:
  - `send-notification`: Envío multi-canal
  - `process-reminders`: Procesador automático (cron cada 5 min)
  - `send-notification-reminders`: Recordatorios de citas
- **Tablas**:
  - `business_notification_settings`: Config de canales y recordatorios
  - `user_notification_preferences`: Preferencias por tipo y canal
  - `notification_log`: Registro con tracking
  - `in_app_notifications`: Notificaciones in-app con JSONB data
- **17 tipos soportados**: Citas, verificaciones, empleados, vacantes, sistema
- **Fallback automático**: Entre canales si uno falla
- **Ver**: `SISTEMA_NOTIFICACIONES_COMPLETO.md`, `SISTEMA_RECORDATORIOS_AUTOMATICOS.md`

### Sistema de Billing (Stripe + PayU + MercadoPago)
**Triple gateway de pagos operativo**

- **Gateways**:
  - Stripe (global)
  - PayU Latam (Colombia)
  - MercadoPago (Argentina/Brasil/México/Chile)
- **Factory Pattern**: `PaymentGatewayFactory` con variable `VITE_PAYMENT_GATEWAY`
- **Edge Functions**: 9 functions (create-checkout, webhooks, manage-subscription)
- **Planes**:
  - Gratuito: 0 COP (1 sede, 1 empleado, 3 citas/mes)
  - Inicio: $80k/mes (Más Popular) ✅
  - Profesional, Empresarial, Corporativo: Deshabilitados (Próximamente)
- **UI**: BillingDashboard, PricingPage, PaymentHistory, UsageMetrics
- **Ver**: `CONFIGURACION_SISTEMA_FACTURACION.md`, `INTEGRACION_PAYU_LATAM.md`, `INTEGRACION_MERCADOPAGO.md`

### Sistema de Chat en Tiempo Real
**Mensajería instantánea entre usuarios**

- **Componentes**: ChatLayout, ChatWindow, ChatInput, ConversationList
- **Tablas**: conversations, messages, chat_participants
- **Storage**: Bucket `chat-attachments` para archivos
- **Realtime**: Suscripciones a cambios en messages
- **Edge Functions**: send-message, send-unread-chat-emails
- **Características**: Attachments, read receipts, typing indicators
- **FIX CRÍTICO**: Corregido memory leak en subscriptions (99.4% menos queries)
- **Ver**: `FIX_CRITICO_REALTIME_SUBSCRIPTIONS.md`

### Sistema de Categorías Jerárquicas
**15 categorías principales + ~60 subcategorías**

- **Tablas**: business_categories, business_subcategories
- **Límite**: Máximo 3 subcategorías por negocio
- **Ejemplos**: Salud y Bienestar → Spa, Peluquería, Barbería, etc.
- **Integración**: BusinessRegistration, BusinessProfile, SearchBar
- **Ver**: `SISTEMA_CATEGORIAS_RESUMEN.md`, `EJECUTAR_SOLO_CATEGORIAS.sql`

### Sistema de Bug Reports
**Reporte de errores con evidencias**

- **Componente**: BugReportModal (FloatingBugReportButton)
- **Tablas**: bug_reports, bug_report_evidences, bug_report_comments
- **Storage**: Bucket `bug-report-evidences`
- **Edge Function**: send-bug-report-email
- **Severidades**: Critical, High, Medium, Low
- **Ver**: `SISTEMA_REPORTE_BUGS.md`

### Sistema de Logging Centralizado
**Logs de errores y auditoría**

- **Tablas**: error_logs, login_logs
- **Hook**: `src/lib/logger.ts` - Logger centralizado
- **Integración**: Sentry (plan gratuito) configurado
- **Características**: Stack traces, context data, user tracking
- **Ver**: `ANALISIS_LOGS_Y_OBSERVABILIDAD_2025-10-18.md`




## 🔧 CONVENCIONES Y PATRONES

### Organización de Archivos
- **Alias de paths**: `@` apunta a `src/` (útil en imports: `@/lib/...`, `@/types/...`)
- **Tipos**: `src/types/types.ts` (fuente de verdad para roles, permisos, entidades)
- **Componentes**: Organizados por dominio (`admin/`, `employee/`, `client/`, `billing/`, `jobs/`, etc.)
- **Hooks**: `src/hooks/` - Hooks personalizados reutilizables
- **Contexts**: `src/contexts/` - Estado global (Auth, Language, AppState, Notification, Theme)
- **Lib**: `src/lib/` - Utilidades, servicios, helpers

### Prácticas de Código
- **TypeScript strict**: Todos los archivos tipados, sin `any` (usar `unknown`)
- **Hooks de datos**:
  - `useSupabaseData(...)` centraliza lecturas y aplica filtros por rol
  - `useSupabase.ts` ofrece hooks de auth, appointments, settings
- **Estado y feedback**: 
  - `useAppState()` para controles de carga/errores
  - `useAsyncOperation()` para envolver operaciones async con toasts
- **Permisos**: `src/lib/permissions.ts` expone `ROLE_PERMISSIONS`, `hasPermission`, etc.
- **i18n**: `LanguageProvider` expone `t(key, params)` y utilidades de formato

### Estilos y UI
- **Tailwind 4**: Variables CSS semánticas (bg-background, text-foreground, border-border)
- **NO hardcodear colores**: Usar variables de tema, no valores hex directos
- **Radix UI**: Componentes accesibles en `src/components/ui/`
- **Iconos**: Phosphor Icons (NO emojis en UI)
- **Responsive**: Mobile-first con breakpoints (sm/md/lg/xl)
- **Tema claro/oscuro**: ThemeProvider con persistencia en localStorage

### Performance
- **React Query**: Caché de datos con TTL de 5 minutos
- **Lazy loading**: Componentes pesados cargados dinámicamente
- **Memoization**: `React.useCallback`, `React.useMemo` en componentes complejos
- **Debounce**: 300ms en búsquedas y inputs frecuentes
- **Vistas materializadas**: Pre-cálculo de estadísticas en Supabase

### Seguridad
- **RLS**: Todas las tablas tienen políticas de seguridad
- **Variables de entorno**: NO exponer claves de servicio en cliente
- **Edge Functions**: Operaciones privilegiadas en serverless
- **Validación**: Client-side + server-side en todas las operaciones
- **GDPR**: Cookie consent, anonymizeIp en GA4

### Testing
- **Vitest**: Framework de testing unitario
- **Tests deshabilitados**: 45 tests E2E pausados (problemas con emails de Supabase)
- **Para habilitar**: Configurar `VITE_SUPABASE_SERVICE_ROLE_KEY` o custom SMTP
- **Ver**: `docs/CONFIGURACION_TESTS_E2E.md`



## Puntos de integración externos
- **Supabase Cloud**: tablas como `appointments`, `services`, `locations`, `businesses`, `profiles`; realtime en canal de `appointments` filtrado por `user_id`.
  - **MCP Disponible**: Usar servidor MCP para operaciones SQL directas cuando sea necesario.
  - **Tablas del sistema de notificaciones (2025-12-20)**: 
    - `business_notification_settings`: Configuración de canales, tiempos de recordatorio, prioridades
    - `user_notification_preferences`: Preferencias individuales por tipo y canal
    - `notification_log`: Registro de todas las notificaciones enviadas con tracking
    - `job_vacancies`: Vacantes laborales publicadas por negocios
    - `job_applications`: Aplicaciones de usuarios a vacantes
  - **IMPORTANTE - business_employees usa `employee_id` NO `user_id`**: Al hacer queries con business_employees siempre usar `employee_id = auth.uid()` nunca `user_id = auth.uid()`
  - **Edge Functions desplegadas**:
    - `send-notification`: Envío multi-canal (Email via AWS SES, SMS via AWS SNS, WhatsApp)
    - `process-reminders`: Procesador automático de recordatorios (ejecuta cada 5 min via cron)
  - **Políticas RLS**: Configuradas y funcionando correctamente sin recursión infinita.
- **Amazon Web Services**: 
  - **SES (Simple Email Service)**: Envío de emails transaccionales ($0.10/1000 emails)
  - **SNS (Simple Notification Service)**: Envío de SMS ($0.00645/SMS en US)
  - Variables requeridas: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `SES_FROM_EMAIL`
- **WhatsApp Business API**: Envío de mensajes WhatsApp
  - Variables requeridas: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`
- Google Calendar: `src/lib/googleCalendar.ts` maneja OAuth (client-side) con `VITE_GOOGLE_CLIENT_ID`/`VITE_GOOGLE_CLIENT_SECRET` y métodos `getCalendars/getEvents/create/update/delete` y `syncAppointments`. No colocar secretos sensibles en código cliente.
- **Sistema de Notificaciones**: Ver `SISTEMA_NOTIFICACIONES_COMPLETO.md` y `SISTEMA_RECORDATORIOS_AUTOMATICOS.md` para documentación completa.
  - 17 tipos de notificaciones soportadas (citas, verificaciones, empleados, vacantes, sistema)
  - Sistema de fallback automático entre canales
  - Recordatorios automáticos configurables por negocio
  - Preferencias granulares por usuario (tipo + canal)
- **IMPORTANTE - Gestión de archivos temporales**: Cada vez que se cree un archivo temporal para realizar acciones en Supabase (testing, migraciones, etc.), debe ser eliminado al final de completar la solicitud.
- Cada vez que se haga un cambio a nivel de Supabase, debe hacerse el deploy correspondiente o aplicar la migración según corresponda.
- Cada vez que se haga un cambio en Supabase, debe actualizarse este archivo de instrucciones con la nueva estructura, según sea necesario.
- Cada vez que se vaya a ejecutar un comando de Supabase CLI, debe agregarse "npx supabase" al inicio del comando, por ejemplo: "npx supabase functions deploy send-notification".

## Prácticas específicas al añadir/editar código
- **Operaciones con Supabase**: 
  - Usar el **servidor MCP disponible** para consultas SQL directas, migraciones, y operaciones de base de datos complejas cuando sea más eficiente que el cliente JavaScript.
  - Para código de aplicación: sigue el patrón de `useSupabaseData.fetch*` construyendo la query base (`supabase.from('table')...`), filtra por rol/negocio, ordena, y mapea a los tipos de `src/types`.
  - **MCP Commands ejemplos**: `SELECT * FROM profiles WHERE role = 'client'`, `INSERT INTO businesses (name, owner_id) VALUES (?, ?)`, `UPDATE appointments SET status = ? WHERE id = ?`.
- Realtime: para colecciones por usuario, suscribe con filtro `filter: user_id=eq.${userId}` y maneja `INSERT/UPDATE/DELETE` actualizando el estado local.
- UI/estado: para operaciones que muestran feedback, envuelve con `useAsyncOperation().executeAsync(() => ..., 'clave-loading', { successMessage })` en vez de gestionar loading/toasts manualmente.
- Permisos: valida acciones con `userHasPermission(role, permissions, 'write_appointments')` antes de mutaciones.
- **Limpieza de archivos**: Al crear scripts temporales para Supabase (testing, debug, migraciones), eliminarlos una vez completada la tarea.

## Ejemplos rápidos
- **Usar MCP de Supabase**:
  - Consultas directas: `SELECT * FROM appointments WHERE start_time > NOW() ORDER BY start_time`
  - Operaciones complejas: `UPDATE appointments SET status = 'confirmed' WHERE business_id IN (SELECT id FROM businesses WHERE owner_id = ?)`
  - Agregaciones: `SELECT DATE(start_time), COUNT(*) FROM appointments GROUP BY DATE(start_time)`
- Obtener citas del mes aplicando rol:
  - Ver `useSupabaseData.fetchAppointments` y `fetchDashboardStats` para filtros por `employee_id/client_id` o por negocios del admin.
- Sincronizar con Google Calendar:
  - Usa `googleCalendarService.syncAppointments(appointments, settings)` tras autenticar y seleccionar `calendarId`.
- Internacionalización en componentes:
  - `const { t } = useLanguage(); t('dashboard.title')` y formatos `formatCurrency(amount, 'MXN', 'es')`.

## Gotchas conocidas
- `useSupabase.ts` importa `authService/appointmentService/...` desde `@/lib/supabase`, pero la implementación de referencia de estos servicios está en `src/mobile/src/lib/supabase.ts`. Si trabajas en web, duplica o mueve esos servicios a `src/lib/` para mantener consistencia y evitar errores de import.
- Zonas horarias: el código usa valores como `America/Mexico_City` y `America/New_York` en distintas utilidades; al persistir o mostrar fechas, pasa explícitamente la TZ correcta.
- No expongas claves de servicio (service_role) en cliente; usa Edge Functions para operaciones privilegiadas.
- **MCP vs Cliente JS**: Prefiere MCP para operaciones complejas, migraciones y consultas directas. Usa cliente JS para operaciones de UI en tiempo real.

## Archivos clave de referencia
- Tipos y contratos: `src/types/types.ts`
- **AdminDashboard**: Header con dropdown integrado para cambiar entre negocios y crear nuevos (12/10/2025). Ver `DROPDOWN_NEGOCIOS_HEADER.md`
- Cliente Supabase: `src/lib/supabase.ts` (y servicios móviles: `src/mobile/src/lib/supabase.ts`)
- Hooks de datos: `src/hooks/useSupabaseData.ts`, `src/hooks/useSupabase.ts`
- Estado/toasts: `src/contexts/AppStateContext.tsx`
- Permisos: `src/lib/permissions.ts`
- Google Calendar: `src/lib/googleCalendar.ts`
- Docs de despliegue: `src/docs/deployment-guide.md`, `supabase/functions/README.md`

## Nuevas Implementaciones (2025-10-12) ⭐
### Sistema de Búsqueda Completo
- **SearchBar**: `src/components/client/SearchBar.tsx` - Dropdown de tipos, debounce 300ms
- **SearchResults**: `src/components/client/SearchResults.tsx` - 6 algoritmos de ordenamiento, cálculo balanceado rating+distancia
- **BusinessProfile**: `src/components/business/BusinessProfile.tsx` - Modal con 4 tabs (Servicios, Ubicaciones, Reseñas, Acerca de)
- **UserProfile**: `src/components/user/UserProfile.tsx` - Modal profesionales con 3 tabs (Servicios, Experiencia, Reseñas)
- **useGeolocation**: `src/hooks/useGeolocation.ts` - Solicitud de permisos con manejo de errores
- **useEmployeeBusinesses**: `src/hooks/useEmployeeBusinesses.ts` - Validación de vinculación a negocios

### Sistema de Reviews Anónimas
- **ReviewCard**: `src/components/reviews/ReviewCard.tsx` (232 líneas) - Display con avatar anónimo, respuestas del negocio
- **ReviewForm**: `src/components/reviews/ReviewForm.tsx` (165 líneas) - Formulario con validación, 5 estrellas clickeables
- **ReviewList**: `src/components/reviews/ReviewList.tsx` (238 líneas) - Lista con stats, filtros, distribución de ratings
- **useReviews**: `src/hooks/useReviews.ts` (229 líneas) - CRUD completo: createReview, respondToReview, toggleVisibility, deleteReview
- **Integración**: BusinessProfile y UserProfile incluyen tabs de reviews funcionales
- **Validación**: Solo clientes con citas completadas sin review previa pueden dejar reviews
- **Traducciones**: reviews.* en español e inglés (`src/lib/translations.ts`)

### Optimización de Búsqueda en Supabase
- **Migración**: `supabase/migrations/20251012000000_search_optimization.sql` (362 líneas)
- **Índices trigram**: gin(name gin_trgm_ops) para búsqueda fuzzy en businesses, services, profiles
- **Full-text search**: Columnas search_vector con tsvector, índices GIN, triggers automáticos
- **Materialized views**: business_ratings_stats, employee_ratings_stats con refresco automático
- **Funciones SQL**: search_businesses(), search_services(), search_professionals() con ts_rank
- **Performance**: 40-60x más rápido, capacidad 10x mayor (100 → 1000 queries/seg)
- **Deploy**: `npx supabase db push` aplicado exitosamente

### Integración RPC y Edge Function ⭐ NUEVO
- **SearchResults.tsx refactorizado**: Usa `supabase.rpc()` en vez de queries manuales
  - search_businesses(): Negocios con stats pre-calculados (average_rating, review_count, rank)
  - search_services(): Servicios con ranking por relevancia
  - search_professionals(): Profesionales con stats de employee_ratings_stats
  - Beneficios: 50% menos queries, 40-60x más rápido, código más limpio
- **Edge Function**: `supabase/functions/refresh-ratings-stats/` desplegada
  - Ejecuta refresh_ratings_stats() para actualizar vistas materializadas
  - Configuración cron: `*/5 * * * *` (cada 5 minutos) desde Dashboard
  - Refresco CONCURRENTLY (no bloquea búsquedas)
  - README completo con 3 opciones de configuración
- **Documentación**: Ver `INTEGRACION_RPC_EDGE_FUNCTION.md` y `RESUMEN_FINAL_OPTIMIZACION.md`

### Validación de Vinculación a Negocios
- **Regla crítica**: Empleados DEBEN estar vinculados a ≥1 negocio para ser reservables
- **AppointmentWizard dinámico**: 6-8 pasos según employee business count
- **EmployeeBusinessSelection**: Paso condicional si employee tiene múltiples negocios
- **Casos manejados**: 0 negocios=block, 1 negocio=auto-select, 2+=selector modal

---

## 🚀 GUÍAS DE DESARROLLO

### Comandos Principales (PowerShell)

**Desarrollo Web**:
```powershell
npm run dev              # Iniciar servidor Vite (http://localhost:5173)
npm run build            # Build de producción
npm run preview          # Preview del build
npm run lint             # ESLint
npm run type-check       # TypeScript compiler check
npm run generate-sitemap # Generar sitemap.xml
```

**Desarrollo Móvil** (en `src/mobile/`):
```powershell
npm run start            # Expo dev server
npm run android          # Android emulator
npm run ios              # iOS simulator
npm run web              # Expo web
```

**Supabase** (siempre usar `npx supabase`):
```powershell
npx supabase start                           # Iniciar Supabase local (NO DISPONIBLE)
npx supabase db push                         # Aplicar migraciones en remoto
npx supabase functions deploy <function-name> # Desplegar Edge Function
npx supabase gen types typescript --project-id <id> > src/types/supabase.ts  # Generar tipos
```

**Testing**:
```powershell
npm run test             # Vitest (45 tests deshabilitados)
npm run test:ui          # Vitest UI
npm run test:coverage    # Cobertura de tests
```

### Flujo de Desarrollo Típico

1. **Crear nueva feature**:
   - Crear componente en `src/components/<rol>/`
   - Crear hook si necesita lógica reutilizable en `src/hooks/`
   - Agregar tipos en `src/types/types.ts`
   - Agregar traducciones en `src/lib/translations.ts`

2. **Trabajar con datos de Supabase**:
   - Usar `useSupabaseData` para queries con filtros por rol
   - Para operaciones complejas, usar MCP o crear RPC function
   - Siempre aplicar RLS policies en migraciones

3. **Desplegar cambios en Supabase**:
   - Crear migración: `npx supabase migration new <nombre>`
   - Probar localmente (NO disponible, usar directamente remoto)
   - Aplicar en producción: `npx supabase db push`
   - Actualizar tipos: `npx supabase gen types typescript...`

4. **Agregar Edge Function**:
   - Crear carpeta en `supabase/functions/<nombre>/`
   - Crear `index.ts` con handler Deno
   - Desplegar: `npx supabase functions deploy <nombre>`
   - Configurar secrets si es necesario

### Debugging Common Issues

**Error: "Multiple GoTrueClient instances detected"**
- ✅ Solución: Verificar que NO se esté importando `createClient` en múltiples archivos
- ✅ SIEMPRE usar el cliente de `src/lib/supabase.ts`
- ✅ Payment gateways deben recibir cliente como parámetro

**Error: "Failed to fetch" en Supabase queries**
- ✅ Verificar variables de entorno: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- ✅ Verificar que usuario tenga permisos (RLS policies)
- ✅ Ver políticas en Supabase Dashboard → Authentication → Policies

**Roles no se calculan correctamente**
- ✅ Verificar que se use `employee_id` (NO `user_id`) en `business_employees`
- ✅ Revisar `useAuth.ts` líneas 150-250 (cálculo de roles)
- ✅ Roles NO están en BD, se calculan dinámicamente

**Citas no validan horarios correctamente**
- ✅ Ver `DateTimeSelection.tsx` líneas 120-200 (overlap algorithm)
- ✅ Verificar que `locations.opens_at` y `closes_at` estén configurados
- ✅ Verificar `business_employees.lunch_break_start/end`

**Tests E2E fallan con "Rate limit exceeded"**
- ✅ Tests pausados intencionalmente (ver `CONFIGURACION_TESTS_E2E.md`)
- ✅ Configurar custom SMTP o usar `VITE_SUPABASE_SERVICE_ROLE_KEY`
- ✅ Funcionalidad 100% operativa (tests NO afectan producción)

### Variables de Entorno Requeridas

**Web** (`.env`):
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Payment Gateways
VITE_PAYMENT_GATEWAY=stripe|payu|mercadopago
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_PAYU_MERCHANT_ID=...
VITE_MERCADOPAGO_PUBLIC_KEY=...

# Opcional
VITE_DEMO_MODE=true  # Para modo demo sin Supabase real
```

**Móvil** (`src/mobile/.env`):
```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Edge Functions** (Supabase Secrets):
```bash
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
SES_FROM_EMAIL=noreply@gestabiz.com
WHATSAPP_ACCESS_TOKEN=...
STRIPE_SECRET_KEY=sk_test_...
```

### Recursos de Documentación

**Documentación por Sistema**:
- Edición de citas: `docs/SISTEMA_EDICION_CITAS_COMPLETADO.md`
- Sede preferida: `docs/SISTEMA_SEDE_PREFERIDA_COMPLETADO.md`
- Ventas rápidas: `docs/SISTEMA_VENTAS_RAPIDAS.md`
- Vacantes: `docs/FASE_7_COMPLETADA_TESTING.md`
- Notificaciones: `docs/SISTEMA_NOTIFICACIONES_COMPLETO.md`
- Billing: `docs/CONFIGURACION_SISTEMA_FACTURACION.md`

**Guías Técnicas**:
- Deployment: `src/docs/deployment-guide.md`
- Edge Functions: `supabase/functions/README.md`
- Roles dinámicos: `DYNAMIC_ROLES_SYSTEM.md`
- Tests E2E: `docs/CONFIGURACION_TESTS_E2E.md`

---

## 📝 NOTAS IMPORTANTES

### Para Agentes de IA
- **NO crear archivos .md** a menos que se solicite explícitamente
- **NO usar emojis en código UI** - Solo iconos de Phosphor/Lucide
- **SIEMPRE** consultar este archivo antes de hacer cambios importantes
- **SIEMPRE** actualizar este archivo si se hacen cambios estructurales
- **Fase BETA completada**: No agregar nuevos flujos funcionales, solo bugs y optimizaciones

### Reglas de Negocio Críticas
1. Un empleado puede trabajar en múltiples negocios simultáneamente
2. Los roles se calculan dinámicamente (NO se guardan en BD)
3. TODOS los usuarios tienen acceso a los 3 roles (Admin/Employee/Client)
4. Las citas tienen validación de overlap, horarios de sede y almuerzo
5. Las reviews son anónimas y requieren cita completada
6. Las notificaciones tienen fallback automático entre canales
7. El sistema contable calcula IVA/ICA/Retención automáticamente
8. Los pagos soportan 3 gateways (Stripe/PayU/MercadoPago)

### Prioridades de Mantenimiento
1. **Crítico**: Bugs que afectan creación/edición de citas
2. **Alto**: Problemas de autenticación o permisos
3. **Medio**: Optimizaciones de performance
4. **Bajo**: Mejoras cosméticas de UI

---

*Última actualización: Enero 2025*  
*Mantenido por: TI-Turing Team*
