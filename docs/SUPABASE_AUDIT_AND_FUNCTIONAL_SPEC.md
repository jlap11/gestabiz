# AppointSync Pro — Auditoría de Integración con Supabase y Especificación Funcional

Fecha: 2025-09-01

## Resumen ejecutivo
- Estado actual: Integración estable con Supabase en cliente web (hooks `useSupabase` y `useSupabaseData`), normalización de datos consistente, y suscripción realtime para citas por `employee_id`.
- Demostrador: Soporte de "demo mode" con cliente simulado que permite navegar la app sin credenciales.
- Riesgos mitigados: Valores nulos/JSON en mappings; coerciones seguras; enums/estados normalizados; imports de variantes UI estandarizados.
- Gaps resueltos en esta iteración: Uso de `employee_id` en consultas, wiring de normalizers en `useSupabaseData`, robustez del mock Supabase (select/insert/update/delete, channel/removeChannel) y consistencia de estado de cita.

## Arquitectura de datos y tipado
- Tipos fuente de verdad: `src/types/types.ts` y `src/types/database.ts` (tipos generados para tablas principales: profiles, businesses, locations, services, appointments, etc.).
- Aliases de filas: `src/lib/supabaseTyped.ts` expone Row/Insert/Update por tabla para reforzar mapeos.
- Normalización centralizada: `src/lib/normalizers.ts` cubre Service, Location, Business y `normalizeAppointmentStatus`.

## Cliente Supabase y modos de operación
- Cliente real: `src/lib/supabase.ts` usa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- Demo mode: activado con `VITE_DEMO_MODE=true` o URL demo; provee:
  - auth mock (getUser/getSession/signIn/…)
  - stubs encadenables para `from().select().eq().order()` y DML `insert/update/delete/upsert` con `.select().single()`
  - canales simulados con `channel().on().subscribe()` y `removeChannel()` no-op.

## Hooks principales y flujos
- useSupabase (auth, citas por usuario, settings, stats):
  - Mapeo seguro de Auth+Profile+Settings a `User` (buildDomainUser/normalizeUserSettings).
  - CRUD de citas usa `employee_id` y suscripción realtime con filtro `employee_id=eq.{userId}`.
  - Settings saneados y upsert con normalización.
- useSupabaseData (dashboard multi-entidad):
  - Lecturas con filtros por rol/negocio; mapeos vía normalizers; estatus normalizado.
  - Estadísticas agregadas con coherencia de estados.

## Cohesión con el esquema
- Claves usadas:
  - appointments: `employee_id`, `client_id`, `business_id`, estado compatible mediante `normalizeAppointmentStatus`.
  - services: `duration_minutes` (tipado en `database.ts`) mapeado a `Service.duration` por normalizer.
  - locations/businesses: `business_hours` y metadatos opcionales preservados/por defecto.
- Perfiles: tablas `profiles` soportadas en hooks `useAuth` y `useSupabase`.

## Realtime y seguridad
- Realtime: canal `appointments-changes` con filtro por `employee_id`.
- RLS: definidas en SQL de referencia; la app asume políticas que permiten a usuarios ver/editar sus recursos; operaciones privilegiadas deben ir por Edge Functions.

## Integraciones externas
- Google Calendar: `src/lib/googleCalendar.ts` y `useGoogleCalendarSync.ts`. OAuth en cliente, con advertencia de no exponer secretos; sincronización best-effort.

## Recomendaciones y mejoras propuestas
1) Consolidar un servicio de datos por entidad (services/locations/businesses/clients) que consuma los normalizers y centralice filtros por rol.
2) Añadir pruebas unitarias rápidas a `normalizers` y a `normalizeUserSettings`.
3) Incorporar `Row<'appointments'>` en normalización de citas para reforzar consistencia y evitar formas legacy.
4) Documentar políticas RLS mínimas requeridas y ejemplos en Supabase SQL para cada rol.
5) Añadir migraciones SQL o instrucciones de `supabase start db push` para alinear el esquema de `database.ts` con el real del proyecto.
6) Completar flujo OAuth de Google (intercambio de código por token desde backend) y almacenar tokens en `calendar_sync_settings` vía Edge Function.
7) Monitoreo de realtime: backoff/retry y telemetría mínima en suscripción.
8) Hardening de demo-mode: dataset ficticio para endpoints select que permitan UX más realista.

## Reglas, excepciones y consideraciones
- Null vs undefined: normalizers converten null a undefined para campos opcionales.
- Estados de cita: cualquier valor no reconocido cae en 'scheduled'; 'pending' se normaliza a 'scheduled'.
- Timezones: UI asume valores como America/Mexico_City; evitar inconsistencias al mostrar/almacenar.
- Seguridad: secretos OAuth no deben vivir en el cliente; usar Edge Functions.
- RLS y filtros: empleados ven sus citas; clientes las suyas; admins por negocios que poseen.

## Checklist de despliegue Supabase
- Variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY.
- Políticas RLS acordes a roles de la app.
- Edge Functions para notificaciones y calendar sync habilitadas si se usan.
- Tablas claves: profiles, businesses, locations, services, clients, appointments, user_settings.

## Apéndice: endpoints/consultas clave
- Citas del usuario (empleado): from('appointments').eq('employee_id', userId)
- Servicios activos por negocio: from('services').eq('is_active', true).eq('business_id', ...)
- Ubicaciones activas por negocio: from('locations').eq('is_active', true).eq('business_id', ...)
- Negocios del admin: from('businesses').eq('owner_id', user.id)

