# Guía rápida

## Sistema de Perfiles Públicos de Negocios ⭐ NUEVO (2025-01-20)
Perfiles públicos indexables por Google para negocios, sin requerir autenticación:
- **React Router v6**: Integrado con rutas públicas (`/`, `/negocio/:slug`) y privadas (`/app/*`)
- **URL amigable**: Slugs únicos generados automáticamente (ej: `/negocio/salon-belleza-medellin`)
- **SEO completo**: Meta tags dinámicos (title, description, keywords), Open Graph, Twitter Card, JSON-LD structured data
- **Hook reutilizable**: `useBusinessProfileData` (352 líneas) - carga completa de negocio, servicios, ubicaciones, empleados, reviews
- **Componente público**: `PublicBusinessProfile` (449 líneas) - layout con 4 tabs (Servicios, Ubicaciones, Equipo, Reseñas)
- **Flow de reserva COMPLETO ✅**: Usuario no autenticado → Clic "Reservar" → Login con redirect + context preservation → Vuelve a app → Wizard abierto automáticamente
- **Auth redirect (Fase 2) ✅**: AuthScreen lee URL params, toast informativo, navegación post-login con context, MainApp extrae bookingContext, ClientDashboard abre wizard automáticamente
- **Preservación de contexto**: businessId, serviceId, locationId, employeeId preservados en URL y pasados al wizard (businessId activo, otros preparados)
- **Geolocalización**: Distancia calculada a ubicaciones si usuario permite ubicación
- **Base de datos**: Campos `slug`, `meta_title`, `meta_description`, `meta_keywords`, `og_image_url`, `is_public` añadidos a `businesses`
- **Fase 1 completada**: 100% - Fundamentos (React Router, database, hooks, SEO) - ver `FASE_1_PERFILES_PUBLICOS_COMPLETADA.md`
- **Fase 2 completada**: 100% - Auth Flow (redirect, context, wizard auto-open) - ver `FASE_2_AUTH_FLOW_COMPLETADA.md`
- **Progreso total**: 60% (Fase 1 + Fase 2 operativas)
- **Pendiente**: Preselección completa en wizard (Fase 3), sitemap.xml (Fase 4), analytics (Fase 5)

## Sistema de Navegación de Notificaciones con Cambio Automático de Rol ⭐ NUEVO (2025-10-17)
Las notificaciones ahora cambian automáticamente el rol del usuario antes de navegar:
- **Mapeo automático**: 30+ tipos de notificación mapeados a su rol requerido (admin/employee/client)
- **Cambio de rol inteligente**: Si la notificación requiere rol diferente al actual, cambia automáticamente antes de navegar
- **Navegación contextual**: Extrae IDs (vacancyId, appointmentId, etc.) de notification.data y los pasa al componente destino
- **Archivo principal**: `src/lib/notificationRoleMapping.ts` (363 líneas)
- **Componentes actualizados**: NotificationCenter, NotificationBell, UnifiedLayout
- **Flujo**: Usuario con rol "client" → Clic en notificación de vacante → Cambia a "admin" → Navega a "recruitment"
- Ver `SISTEMA_NAVEGACION_NOTIFICACIONES_CON_ROLES.md` para documentación completa y mapeo de todos los tipos

## Sistema de Configuraciones Unificado ⭐ NUEVO (2025-10-17)
Las configuraciones de TODOS los roles (Admin/Employee/Client) están unificadas en un solo componente `CompleteUnifiedSettings.tsx`:
- **4 pestañas comunes**: Ajustes Generales (tema/idioma), Perfil, Notificaciones, + 1 específica del rol activo
- **Admin**: Tab "Preferencias del Negocio" con información, contacto, dirección, legal, operaciones, notificaciones y historial
- **Employee**: Tab "Preferencias de Empleado" con disponibilidad (horarios 7 días), info profesional, salarios, especializaciones, idiomas, certificaciones, enlaces
- **Client**: Tab "Preferencias de Cliente" con preferencias de reserva, anticipación, pago, historial
- **Ubicación**: `src/components/settings/CompleteUnifiedSettings.tsx` (1,448 líneas)
- **Dashboards actualizados**: AdminDashboard, EmployeeDashboard, ClientDashboard usan este componente para 'settings' y 'profile'
- **Sin duplicación**: Cero configuraciones repetidas entre roles
- Ver `SISTEMA_CONFIGURACIONES_UNIFICADO.md` y `GUIA_PRUEBAS_CONFIGURACIONES.md` para detalles completos

## Sistema de Roles Dinámicos ⭐ IMPORTANTE
Los roles NO se guardan en la base de datos. Se calculan dinámicamente basándose en relaciones:
- **ADMIN**: El usuario es `owner_id` de un negocio en la tabla `businesses`
- **EMPLOYEE**: Siempre disponible (todos pueden solicitar unirse a un negocio). Si existe en `business_employees`, tiene acceso completo; si no, verá onboarding
- **CLIENT**: Siempre disponible (todos pueden reservar citas)

**Todos los usuarios tienen acceso a los 3 roles** para poder iterar entre ellos. Un usuario puede ser admin de negocio A, employee de negocio B, y client para reservar en cualquier negocio. El hook `useUserRoles` calcula los roles disponibles dinámicamente y solo guarda el contexto activo en localStorage. Ver `DYNAMIC_ROLES_SYSTEM.md` para detalles completos.

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
  - **Modelo actualizado (2025-10-11)**: Ver `DATABASE_REDESIGN_ANALYSIS.md` para el nuevo modelo con servicios por sede/empleado, reviews, transacciones y analytics.
  - **Sistema de Categorías (2025-11-10)**: Sistema jerárquico con 15 categorías principales y ~60 subcategorías. Máximo 3 subcategorías por negocio. Ver `SISTEMA_CATEGORIAS_RESUMEN.md` y `EJECUTAR_SOLO_CATEGORIAS.sql`.
  - **Sistema de Notificaciones (2025-12-20)**: Sistema multicanal completo (Email/SMS/WhatsApp) con AWS SES/SNS, recordatorios automáticos, preferencias por usuario y negocio. Ver `BUSINESS_NOTIFICATION_SETTINGS_COMPLETADO.md` y `GUIA_PRUEBAS_SISTEMA_NOTIFICACIONES.md`.
  - **Sistema de Búsqueda (2025-10-12)**: SearchBar con dropdown, geolocalización, SearchResults con 6 algoritmos de ordenamiento, BusinessProfile y UserProfile modales integrados. Ver `VALIDACION_VINCULACION_NEGOCIOS.md` y `USER_PROFILE_COMPLETADO.md`.
  - **Sistema de Reviews (2025-10-12)**: Reviews anónimas con ReviewForm, ReviewList, ReviewCard. Hook useReviews con CRUD completo. RLS policies. Solo clientes con citas completadas. Ver `SISTEMA_REVIEWS_COMPLETADO.md`.
  - **Optimización de Búsqueda (2025-10-12)**: Índices trigram, full-text search con tsvector, materialized views para ratings, funciones SQL optimizadas. Performance 40-60x mejor. Ver `OPTIMIZACION_BUSQUEDA_COMPLETADO.md`.
  - **Sistema de Billing y Suscripciones (2025-10-17)**: Sistema completo de facturación con **Stripe + PayU Latam + MercadoPago**. ✅ **TRIPLE GATEWAY OPERATIVO**
    - **Fase 1 COMPLETADA**: 7 tablas, 4 RPC functions, 6 códigos descuento activos, RLS policies completas.
    - **Fase 2 COMPLETADA**: 4 Edge Functions Stripe + 2 Edge Functions PayU + 3 Edge Functions MercadoPago desplegadas. Frontend: PaymentGateway interface, StripeGateway + PayUGateway + MercadoPagoGateway implementations, PaymentGatewayFactory (switch configurable), useSubscription hook actualizado, BillingDashboard + modales compatibles con los 3 gateways.
    - **Fase 4 COMPLETADA ✨**: UI completa con 3 componentes (PricingPage: 460 líneas, PaymentHistory: 320 líneas, UsageMetrics: 220 líneas). Integrado en AdminDashboard sidebar como "Facturación".
    - **Fix Integración (2025-10-17) ✅**: Corregidos 4 bloqueantes críticos del sistema Stripe.
    - **Integración PayU (2025-10-17) ✅**: PayU Latam implementado como alternativa a Stripe:
      1. ✅ PayUGateway.ts (215 líneas) implementa IPaymentGateway completa
      2. ✅ PaymentGatewayFactory.ts (actualizado) con variable VITE_PAYMENT_GATEWAY para switch
      3. ✅ Edge Functions: payu-create-checkout (genera firma MD5 y URL), payu-webhook (procesa confirmaciones)
      4. ✅ Compatibilidad 100% con UI existente (sin cambios en componentes)
      5. ⏳ Credenciales PayU pendientes de configuración por usuario
    - **Integración MercadoPago (2025-10-17) ✅**: MercadoPago implementado como tercera pasarela:
      1. ✅ MercadoPagoGateway.ts (225 líneas) implementa IPaymentGateway completa
      2. ✅ PaymentGatewayFactory.ts actualizado con opción 'mercadopago'
      3. ✅ Edge Functions: mercadopago-create-preference (genera Preference con items/payer/back_urls), mercadopago-webhook (procesa notificaciones IPN), mercadopago-manage-subscription
      4. ✅ Compatibilidad 100% con UI existente (sin cambios en componentes)
      5. ✅ Ideal para Argentina, Brasil, México, Chile (líder LATAM)
      6. ⏳ Credenciales MercadoPago pendientes de configuración por usuario
      7. **Ver**: `docs/INTEGRACION_MERCADOPAGO.md` para guía completa con tarjetas de prueba
    - **Plan Gratuito y Deshabilitar Planes (2025-10-17) ✅**: Mejoras UX de planes:
      1. ✅ Plan Gratuito agregado (0 COP, 1 sede, 1 empleado, 1 servicio, 3 citas/mes)
      2. ✅ Dashboard sin suscripción muestra tarjeta "Plan Gratuito" con características incluidas
      3. ✅ Solo Plan Inicio habilitado ($80k/mes), marcado como "Más Popular"
      4. ✅ Planes Profesional ($200k), Empresarial ($500k), Corporativo deshabilitados con badge "Próximamente"
      5. ✅ Opacidad 60% y toasts informativos para planes no disponibles
      6. **Ver**: `docs/MEJORAS_PLAN_GRATUITO_Y_DESHABILITAR_PLANES.md` para detalles completos
    - **Cobertura Geográfica**: Stripe (global), PayU (Colombia primero), MercadoPago (Argentina/Brasil/México)
    - **Pendiente (Solo Configuración)**: Configurar gateway elegido (Stripe, PayU o MercadoPago) según `VITE_PAYMENT_GATEWAY`. Ver `docs/CONFIGURACION_SISTEMA_FACTURACION.md` (Stripe), `docs/INTEGRACION_PAYU_LATAM.md` (PayU) y `docs/INTEGRACION_MERCADOPAGO.md` (MercadoPago) para guías completas.
    - Ver `RESUMEN_IMPLEMENTACION_PAYU.md` para detalles de arquitectura multi-gateway.
  - **Integración RPC y Edge Function (2025-10-12)**: SearchResults.tsx refactorizado para usar funciones RPC (search_businesses, search_services, search_professionals). Edge Function refresh-ratings-stats desplegada para refresco automático de vistas materializadas. Ver `INTEGRACION_RPC_EDGE_FUNCTION.md`.
  - **🚨 FIX CRÍTICO Realtime Subscriptions (2025-01-20)**: Corregido memory leak severo que causaba 398k queries/día. Eliminado `Date.now()` de nombres de canal en 5 subscripciones (useChat: 3, useEmployeeRequests: 1, useInAppNotifications: 1). Reducción esperada: 99.4% menos queries. Ver `FIX_CRITICO_REALTIME_SUBSCRIPTIONS.md` para detalles completos y best practices.

## Sistema de Vacantes Laborales ⭐ COMPLETADO 100% (2025-01-20)
Sistema completo de reclutamiento con matching inteligente, detección de conflictos, reviews obligatorias, notificaciones automáticas:
- **Fase 1 ✅**: Migraciones SQL aplicadas vía MCP (385 líneas)
- **Fase 2 ✅**: 6 Hooks completados (1,510 líneas)
- **Fase 3 ✅**: 4 componentes UI Admin (1,238 líneas)
- **Fase 4 ✅**: 5 componentes UI Employee (1,699 líneas)
- **Fase 5 ✅**: Sistema de Reviews Obligatorias (487 líneas)
- **Fase 6 ✅**: Sistema de Notificaciones (223 líneas)
- **Fase 7 ✅**: QA & Testing Suite (1,260 líneas) - ⏸️ TESTS PAUSADOS
- **Deployment**: ✅ Aplicado en Supabase Cloud (migraciones + triggers + Edge Functions)
- **⚠️ IMPORTANTE - Tests E2E Deshabilitados**: 
  - Los 45 tests E2E están temporalmente pausados con `describe.skip()`
  - **Razón**: Supabase envió advertencia por alto rate de emails rebotados
  - Tests estaban creando usuarios ficticios (john.smith.xyz@gmail.com) y Supabase enviaba confirmaciones
  - **Solución aplicada**: Eliminado `auth.signUp` de tests, usando UUIDs fijos
  - **Para habilitar**: Configurar `VITE_SUPABASE_SERVICE_ROLE_KEY` o custom SMTP provider
  - **Ver**: `docs/CONFIGURACION_TESTS_E2E.md` y `docs/RESUMEN_FINAL_VACANTES_CON_TESTS.md`
- **Funcionalidad en Producción**: ✅ 100% OPERATIVA (no afectada por tests)
- **Progreso**: 100% código completado (7,240 líneas escritas) 🎉
- **Mejoras UI Salarios (2025-10-17)**: ✅ Checkbox comisiones, símbolo $, formato miles colombiano (1.000.000)
  - **Migración**: `20251017000000_add_commission_based_to_vacancies.sql` aplicada
  - **Campo nuevo**: `commission_based` (BOOLEAN DEFAULT FALSE)
  - **Ver**: `docs/FIX_SALARIOS_FORMATEO_COMISIONES.md` para detalles completos
- Ver `docs/FASE_7_COMPLETADA_TESTING.md`, `docs/GUIA_ACCESO_SISTEMA_VACANTES.md` y `docs/PROGRESO_IMPLEMENTACION_VACANTES.md` para detalles completos

## Sistema Contable Completo
Sistema contable completo con cálculo automático de IVA, ICA y Retención en la Fuente:
- **Hooks optimizados**: 
  - `useBusinessTaxConfig` (128 líneas): Caché React Query con 1 hora TTL, prefetch e invalidación
  - `useTaxCalculation` (47 líneas): Refactorizado 78% menos código, usa caché, memoización
  - `useTransactions`: Extendido con `createFiscalTransaction()` para transacciones con impuestos
- **Componentes UI**:
  - `LoadingSpinner` (77 líneas): 4 variantes (LoadingSpinner, SuspenseFallback, ButtonSpinner, FormSkeleton)
  - `AccountingPage` (148 líneas): Tabs con lazy loading de TaxConfiguration y EnhancedTransactionForm
  - `ReportsPage` (58 líneas): Dashboard financiero con lazy loading
  - `EnhancedTransactionForm`: Debounce 300ms, feedback visual con spinner, inputs disabled durante cálculo
- **Navegación**: AdminDashboard tiene 2 nuevos items en sidebar: "Contabilidad" (Calculator icon) y "Reportes" (FileText icon)
- **Toast Notifications**: Implementados en 8 flujos con `sonner` (exports PDF/CSV/Excel, save/reset config, create transaction)
- **Tests**: 100% cobertura en `useTaxCalculation.test.tsx` (340 líneas) y `exportToPDF.test.ts` (260 líneas)
- **Performance**: 90% menos queries a Supabase, 60% carga más rápida con caché, previene 80% cálculos innecesarios con debounce
- **Campos fiscales en transactions**: subtotal, tax_type, tax_rate, tax_amount, total_amount, is_tax_deductible, fiscal_period
- **Moneda**: COP (pesos colombianos)
- Ver `SISTEMA_CONTABLE_FASE_4_COMPLETADA.md` para documentación completa

## Sistema de Temas ⭐ NUEVO (2025-01-10)
La aplicación soporta temas claro y oscuro con persistencia:
- **ThemeProvider**: `src/contexts/ThemeProvider.tsx` - Context con hook `useKV` para persistencia en localStorage
- **CSS Variables**: `src/index.css` - Variables semánticas que cambian según tema (`:root` para light, `[data-theme="dark"]` para dark)
- **ThemeToggle**: `src/components/ui/theme-toggle.tsx` - Componente switch integrado en AdminDashboard header
- **IMPORTANTE**: NO usar colores hardcodeados (bg-[#1a1a1a], text-white, border-white/10). Usar variables CSS via Tailwind: `bg-background`, `text-foreground`, `border-border`, `bg-card`, `text-muted-foreground`, `bg-primary`, etc.
- **Estado**: 60% completo (AdminDashboard + 3/5 componentes jobs refactorizados). Ver `TEMA_CLARO_RESUMEN_FINAL.md` para detalles.

## Convenciones y patrones del proyecto
- Alias de paths: `@` apunta a `src/` (útil en imports: `@/lib/...`, `@/types/...`).
- Tipos fuente de verdad: `src/types/types.ts` (roles, permisos, Appointment, Business, etc.). Cuando crees nuevas entidades, añade tipos aquí y usa mapeos consistentes en hooks.
- Permisos/roles: `src/lib/permissions.ts` expone `ROLE_PERMISSIONS`, `hasPermission`, etc. Usa estas utilidades en componentes y servicios para gatear acciones.
- Supabase “demo mode”: `src/lib/supabase.ts` activa un cliente simulado si `VITE_DEMO_MODE=true` o si la URL contiene `demo.supabase.co`. Esto permite flujos UI sin backend real. Tenlo en cuenta en pruebas locales.
- Hooks de datos:
  - `useSupabaseData(...)` centraliza lecturas y aplica filtros por `user.role` (admin/employee/client) y por `businessId`.
  - `useSupabase.ts` ofrece hooks de auth, appointments, settings y dashboard y suscribe en tiempo real vía `subscriptionService`.
- Estado y feedback: usa `useAppState()` para controles de carga/errores y `useAsyncOperation()` para envolver operaciones async con toasts (`sonner`).
- i18n: `LanguageProvider` expone `t(key, params)` y utilidades de formato (`formatDate`, `formatCurrency`). Texto nuevo debe ir en `src/lib/translations.ts`.
- Para cada ajuste se debe tener en cuenta la parte de supabase, debe quedar coherencia entre lo desarrollado con el cliente de supabase.

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

¿Falta algo o hay una convención que deba aclararse mejor (p. ej., estructura exacta de Edge Functions o tests e2e)? Indica los huecos y lo iteramos.
