# Guía rápida

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
  - **Integración RPC y Edge Function (2025-10-12)**: SearchResults.tsx refactorizado para usar funciones RPC (search_businesses, search_services, search_professionals). Edge Function refresh-ratings-stats desplegada para refresco automático de vistas materializadas. Ver `INTEGRACION_RPC_EDGE_FUNCTION.md`.

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
