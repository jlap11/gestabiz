# Guía rápida para agentes en este repo (appointsync-pro)

Objetivo: que un agente pueda contribuir de inmediato entendiendo la arquitectura, flujos de desarrollo y convenciones propias del proyecto.

## Panorama general
- Monorepo con 3 superficies: web (React + Vite), móvil (Expo/React Native) y extensión de navegador; backend en Supabase.
- Ejes clave:
  - Cliente Supabase y utilidades: `src/lib/supabase.ts` (modo demo incluido), tipos en `src/types/**`, utilidades en `src/lib/**`.
  - Data hooks y servicios: `src/hooks/useSupabase.ts`, `src/hooks/useSupabaseData.ts` (fetch + mapping + reglas por rol).
  - Estado/UI: `src/contexts/AppStateContext.tsx` (loading/error/toasts), i18n `src/contexts/LanguageContext.tsx` con persistencia local (hook `useKV`), estilos con Tailwind y util `cn` (`src/lib/utils.ts`).
  - Integraciones: Google Calendar (`src/lib/googleCalendar.ts`), permisos (`src/lib/permissions.ts`).

## Construcción y ejecución (local)
- Web (Vite): scripts en `package.json` raíz
  - dev: `npm run dev`; build: `npm run build`; preview: `npm run preview`; lint: `npm run lint`; type-check: `npm run type-check`.
  - Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, opcional `VITE_DEMO_MODE=true` para usar cliente Supabase simulado.
- Móvil (Expo): `src/mobile/` tiene su `package.json`
  - `npm run start|android|ios|web`, builds con EAS `build:*` y `submit:*`.
  - Env: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Extensión: `extension/` y `src/browser-extension/`
  - `npm run build` (copia/zip), `npm run dev` para servidor estático local; carga “unpacked” en Chrome.
- Supabase: ver `SUPABASE_INTEGRATION_GUIDE.md`, `src/docs/deployment-guide.md` y `supabase/functions/README.md` para CLI, Edge Functions y cron.

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
- Supabase: tablas como `appointments`, `services`, `locations`, `businesses`, `profiles`, `user_settings`; realtime en canal de `appointments` filtrado por `user_id`.
- Google Calendar: `src/lib/googleCalendar.ts` maneja OAuth (client-side) con `VITE_GOOGLE_CLIENT_ID`/`VITE_GOOGLE_CLIENT_SECRET` y métodos `getCalendars/getEvents/create/update/delete` y `syncAppointments`. No colocar secretos sensibles en código cliente.
- Notificaciones: Edge Functions descritas en `supabase/functions/README.md` y `src/docs/deployment-guide.md` (p. ej., `send-notifications`, `send-confirmation`) con cron opcional.

## Prácticas específicas al añadir/editar código
- Consultas Supabase: sigue el patrón de `useSupabaseData.fetch*`
  - Construye la query base (`supabase.from('table')...`), filtra por rol/negocio, ordena, y mapea a los tipos de `src/types` (normaliza campos y default values).
- Realtime: para colecciones por usuario, suscribe con filtro `filter: user_id=eq.${userId}` y maneja `INSERT/UPDATE/DELETE` actualizando el estado local.
- UI/estado: para operaciones que muestran feedback, envuelve con `useAsyncOperation().executeAsync(() => ..., 'clave-loading', { successMessage })` en vez de gestionar loading/toasts manualmente.
- Permisos: valida acciones con `userHasPermission(role, permissions, 'write_appointments')` antes de mutaciones.

## Ejemplos rápidos
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

## Archivos clave de referencia
- Tipos y contratos: `src/types/types.ts`
- Cliente Supabase: `src/lib/supabase.ts` (y servicios móviles: `src/mobile/src/lib/supabase.ts`)
- Hooks de datos: `src/hooks/useSupabaseData.ts`, `src/hooks/useSupabase.ts`
- Estado/toasts: `src/contexts/AppStateContext.tsx`
- Permisos: `src/lib/permissions.ts`
- Google Calendar: `src/lib/googleCalendar.ts`
- Docs de despliegue: `src/docs/deployment-guide.md`, `supabase/functions/README.md`

¿Falta algo o hay una convención que deba aclararse mejor (p. ej., estructura exacta de Edge Functions o tests e2e)? Indica los huecos y lo iteramos.
