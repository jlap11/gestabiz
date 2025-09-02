# AppointSync Pro — Especificación Funcional y Técnica Integral

Este documento describe exhaustivamente el alcance funcional, la arquitectura técnica, los modelos de datos, reglas de negocio, flujos, seguridad, rendimiento, pruebas y un backlog priorizado de mejoras para la aplicación AppointSync Pro (web · móvil · extensión) con backend en Supabase.

Audiencia objetivo: producto, ingeniería (frontend/backend), QA, DevOps y soporte.


## 1. Visión general del sistema

- Superficies: Web (React + Vite), Móvil (Expo/React Native – base presente, features a expandir), Extensión de navegador (plantilla lista, features básicas), Backend Supabase (Postgres, Auth, Realtime, Edge Functions/cron).
- Modos de ejecución: real con Supabase y modo demo (cliente mock) sin backend para explorar UI.
- Estándares: TypeScript estricto, ESLint v9, i18n (es/en), Tailwind 4 y componentes Radix/shadcn.
- Patrón de datos: capa de servicios por entidad + normalizadores, hooks consumen servicios.


## 2. Roles, permisos y alcance de cada rol

Roles: admin, employee, client.

- admin
  - Permisos: gestión total del negocio (appointments/clients/employees/business/locations/services/reports/settings/notifications).
  - Alcance: datos de los negocios que posee (owner_id).

- employee
  - Permisos: leer/escribir citas, gestionar clientes (lectura/escritura), ver negocio y servicios, enviar notificaciones.
  - Alcance: citas asignadas (employee_id), negocios vinculados (tabla relacional business_employees con estado approved).

- client
  - Permisos: leer sus propias citas.
  - Alcance: citas con su client_id.

Notas y consideraciones:
- Las verificaciones de UI deben apoyarse en `ROLE_PERMISSIONS`, pero el control de acceso real reside en RLS (ver sección 10).
- Para acciones privilegiadas (p. ej., notificaciones masivas), deben usarse Edge Functions con service_role.


## 3. Entidades y contratos (fuente de verdad en `src/types/types.ts`)

Resumen de entidades clave (campos principales y consideraciones):

- Business
  - owner_id, settings, business_hours, is_active.
  - Reglas: un admin solo ve/gestiona sus businesses; desactivar business debe ocultar sus ubicaciones/servicios y bloquear nuevas citas.

- Location
  - business_id, business_hours por día, is_active.
  - Reglas: si location está inactiva, no se pueden crear citas allí.

- Service
  - duration (min), price, currency, is_active.
  - Reglas: si service inactivo, no se ofrece en la UI; duración establece longitud mínima de cita.

- Appointment
  - user_id (empleado asignado en el dominio; en DB se llama employee_id), client_id, start_time/end_time, status, price, currency.
  - Reglas: no solapamiento por empleado y ubicación (evitar overbooking); transiciones de estado válidas; política de cancelación; recordatorios.

- Client
  - Datos de contacto, idioma, flags (is_recurring, status), métricas de actividad.
  - Reglas: email opcional; normalizar formatos de teléfono; GDPR (opt-out marketing, borrado).

- User y UserSettings
  - Language, timezone, notificaciones (email/whatsapp), business_hours personales, formatos.
  - Reglas: coherencia de zona horaria en operaciones de fecha y recordatorios.

- Notification
  - Tipos (reminders/cancelled/rescheduled), estado de envío, canal (email/push/browser).

Mapeos y normalización:
- Los normalizadores en `src/lib/normalizers.ts` homogeneizan campos y defaults (e.g., `normalizeAppointmentStatus`).
- En la capa de servicios se devuelven objetos ya normalizados cuando aplica.


## 4. Flujos funcionales principales

### 4.1 Autenticación y sesión
- Registro, login con email/password, login con Google (opcional), reset de contraseña.
- Mapeo de usuario: `useAuth` combina auth user + profile + user_settings y construye el dominio `User` con permisos y preferencias.
- Sesión persistente, autoRefresh activado.

Reglas/errores:
- Sitio/redirect URLs deben coincidir con Supabase; errores comunes: “Invalid URL”.
- En modo demo, el mock simula sesión autenticada; no ejecutar acciones destructivas reales.

### 4.2 Onboarding de negocio (admin)
- Crear negocio; configurar servicios y ubicaciones; añadir empleados (solicitud/approval vía tabla relacional).
- Reglas: al crear negocio, `owner_id`=usuario admin; defaults de settings coherentes (buffer, currency, etc.).

### 4.3 Gestión de citas (admin/employee/client)
- Crear, editar, cancelar, completar, reprogramar.
- Filtros por rol:
  - admin: por businesses del owner.
  - employee: por employee_id.
  - client: por client_id.

Reglas de negocio imprescindibles:
- Conflictos/overbooking: prohibir dos citas simultáneas para el mismo empleado; también puede aplicarse a la misma ubicación.
- Ventanas: respetar business_hours y, opcionalmente, `settings.appointment_buffer` entre citas.
- Política de cancelación: si se cancela dentro de X horas (p. ej., 24h) aplicar reglas (marcar como late cancel, cargo, bloqueo de reprogramación, etc.).
- Estados válidos: `scheduled` → `confirmed` → `in_progress` → `completed` | `cancelled` | `no_show` | `rescheduled`.
  - Evitar saltos inválidos (e.g., `scheduled` → `completed` sin pasar por `in_progress` si así lo define el negocio).

### 4.4 Notificaciones y recordatorios
- Edge Functions ejecutadas por cron: enviar recordatorios 24h/1h/15m antes, correos de confirmación/cancelación.
- Preferencias del usuario: respetar settings (email/whatsapp) y tiempos (`reminder_times`).
- Idempotencia: registrar `reminder_sent` por cita y timestamp/tecla de reminder específico para evitar duplicados.

### 4.5 Dashboard y reportes
- `statsService.getDashboardStats`: métricas básicas (totales, estados, revenue, promedios) con filtros por rol/negocio/fecha.
- Extensibles: próximos hoy/semana, ranking de servicios, franjas horarias populares, performance por empleado/ubicación.

### 4.6 Sincronización con Google Calendar (opcional)
- OAuth client-side; obtener `accessToken`; operaciones CRUD sobre eventos.
- Sincronización best-effort e idempotente por `google_calendar_event_id`.
- Consideraciones: zona horaria; manejo de rate limits; errores parciales no detienen el lote; estrategia de reintentos/backoff futura.

### 4.7 Extensión de navegador
- Unpacked y empaquetada; muestra próximas citas y atajos (roadmap para features).
- Reutiliza lógica de servicios a través de la web app (o API si se expone en el futuro).

### 4.8 App móvil (Expo)
- Base creada; pendiente replicar flujos de auth, listado de citas, notificaciones push.
- Reuso de tipos y normalizadores.


## 5. Arquitectura del frontend

- Capa de servicios (`src/lib/services/*`):
  - appointments: list/get/create/update/remove + filtros estándares.
  - services/locations/businesses: list con `businessId(s)` y `activeOnly` cuando aplica.
  - businesses: `listByEmployee(employeeId)` para resolver alcance del empleado.
  - profiles/clients/userSettings: consultas encapsuladas.
  - stats: `getDashboardStats` calcula métricas básicas.

- Normalizadores (`src/lib/normalizers.ts`):
  - Homologación de tipos y defaults (Service, Location, Business, UserSettings, status de Appointment).

- Hooks (`src/hooks`):
  - useAuth: sesión, usuario dominio, permisos.
  - useSupabaseData: orquestación de lecturas (citas, servicios, ubicaciones, negocios) y stats via servicios; CRUD delegados a services.
  - useSupabase (legacy/aux): auth + appointments realtime por employee_id, settings, utilidades.

- Contextos:
  - AppState: loading/error/toasts, operador `useAsyncOperation`.
  - Language: i18n y formatos.
  - Theme: tema y helpers.

- Cliente Supabase (`src/lib/supabase.ts`):
  - Inicialización real o mock (demo-mode); mock permite select/filters/order/limit y stubs DML/realtime.


## 6. Reglas críticas y edge cases (a validar y blindar)

1) Zona horaria
- Todas las fechas deben manipularse con TZ explícita (p. ej., `America/Mexico_City`).
- DST: evitar cálculos locales ambiguos (sumas de minutos vs conversiones locales). Considerar librería temporal (Luxon/Temporal) si se complica.

2) Overbooking y buffers
- Antes de crear/actualizar cita: chequear solapamientos por `employee_id` y, opcionalmente, por `location_id` y `service_id`.
- Respetar `appointment_buffer` (min) entre citas.

3) Políticas de cancelación/reprogramación
- Regla: dentro de X horas → marcar `cancelled` con `cancelled_reason='late'` o requerir aprobación.
- Registrar auditoría mínima (quién canceló, cuándo).

4) Estados y transiciones
- Validar transiciones permitidas; rechazar saltos inválidos.

5) Integridad referencial
- Al desactivar negocio/ubicación/servicio: bloquear nuevas citas relacionadas.
- Manejo de empleados removidos: re-asignar citas futuras o bloquear cambios.

6) Sincronización Google
- Idempotencia por `google_calendar_event_id`.
- Reintentos con backoff; invalidación de token y refresh.

7) Seguridad de datos
- Ver sección 10 (RLS) para garantizar que UI no sea único control.

8) i18n
- Todas las cadenas deben pasar por `useLanguage().t(...)`; llaves en `src/lib/translations.ts`.


## 7. Rendimiento y escalabilidad

Índices recomendados:
- appointments(employee_id, start_time), appointments(business_id, start_time), appointments(client_id, start_time)
- services(business_id, is_active), locations(business_id, is_active)
- business_employees(employee_id, status), business_employees(business_id, status)

Paginación y filtros:
- Para listados grandes (citas, clientes), incorporar `range`/`limit` y cursores; UI con paginación e infinitescroll.

Caching y prefetch:
- Considerar React Query en el futuro para cacheo inteligente/optimista.

Realtime:
- Suscripciones filtradas por `employee_id` minimizan ruido; para admin, considerar suscribirse por `business_id` si necesario.


## 8. Estrategia de pruebas

- Unit tests: normalizadores y servicios (feliz + bordes: campos faltantes, defaults, filtros vacíos).
- Integración: flujos de creación/edición/cancelación de cita con mock de Supabase.
- E2E (Playwright/Cypress): login, crear negocio (admin), crear servicios/ubicaciones, agendar, editar, cancelar, dashboard.
- Contratos: validar que `appointmentsService.create` rechaza payloads inválidos y respeta RLS (en entorno real).


## 9. Despliegue y operaciones

- Web: Vite build, deploy a Vercel/Netlify. Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, Google OAuth opcional.
- Supabase: usar CLI para functions/cron; secrets para service_role y proveedores (Resend, Twilio).
- Observabilidad: logs en Supabase (DB/Edge Functions), Sentry/LogRocket opcional en frontend.


## 10. Seguridad y RLS (Row-Level Security)

Políticas sugeridas (alto nivel; ajustar en SQL):

- appointments
  - SELECT: admin → por businesses del owner; employee → `employee_id = auth.uid()`; client → `client_id = auth.uid()`.
  - INSERT/UPDATE/DELETE: admin del business o employee asignado según rol/política; checar integridad con referencias válidas a business/location/service.

- businesses
  - SELECT: owner_id = auth.uid() o relacionado via business_employees cuando proceda.
  - INSERT/UPDATE/DELETE: solo owner.

- locations/services
  - SELECT: por `business_id` permitido; `is_active = true` para roles no-admin si aplica.

- clients
  - SELECT: por business del usuario; client puede ver solo su perfil/citas.

- business_employees
  - SELECT: registros donde `employee_id = auth.uid()` o que pertenecen a un business del owner.

- user_settings/profiles
  - SELECT/UPSERT: `user_id = auth.uid()`.

Claves y secretos:
- Nunca exponer service_role en cliente; solo en Edge Functions.


## 11. Accesibilidad e i18n

- Accesibilidad: foco visible, contrastes, navegación por teclado, roles ARIA en componentes complejos (menús, diálogos).
- i18n: evitar texto embebido; llaves parametrizables, formatos de fecha/número/moneda por `LanguageContext`.


## 12. Backlog de mejoras (priorizado)

P0 (crítico/seguridad/consistencia)
- RLS completas por tabla con tests de acceso.
- Verificación de solapamientos (overbooking) y `appointment_buffer` en `appointmentsService` (y/o DB function + constraint preventivo).
- Validación de transiciones de estado; registrar auditoría de cambios (quién/cuándo).

P1 (producto y usabilidad)
- Dashboard avanzado: upcoming_today/semana, rankings de servicios y franjas horarias; performance por empleado/ubicación con agregaciones.
- Búsqueda y paginación en listados (citas, clientes) con filtros por estado/fecha/servicio/ubicación.
- Soporte multimoneda configurable por negocio (y conversión opcional para reportes).

P1 (técnico)
- Tipos generados desde Supabase (codegen) para `Row<T>` en lugar de typings manuales; alineación automática con schema.
- Integrar React Query (o TanStack Query): caching, invalidations, reintentos, sincronización en segundo plano.
- Tests: cobertura mínima en normalizadores/servicios; e2e claves.

P2 (sincronización/edge)
- Google Calendar: reintentos con backoff exponencial; manejo de 401/403 y refresh de token; reconciliación (two-way) en roadmap.
- Edge Functions: `send-reminders`, `send-confirmation`, `send-cancellation` con plantillas y logs de entrega.

P2 (mobile/extension)
- Móvil: auth completo, listado de citas, creación básica, push notifications, offline básico con cache.
- Extensión: vista compacta de próximas citas, creación rápida, filtro por negocio/empleado.

P3 (compliance y analítica)
- GDPR/privacidad: export/borrado de datos; consentimiento marketing.
- Analytics: eventos clave (creación/edición/cancelación), funnel, retención.


## 13. Matriz de funcionalidades actuales vs deseadas

- Autenticación: actual completa; deseado MFA opcional.
- Citas: CRUD + estados básicos; deseado validadores de conflicto/buffer y transiciones robustas.
- Negocios/ubicaciones/servicios: CRUD; deseado soft-delete y herencia de settings.
- Dashboard: métricas básicas; deseado avanzado (upcoming/rankings/performance).
- Notificaciones: base via Edge Functions (pendiente implementar end-to-end); deseado idempotencia y plantillas multi-idioma.
- Google Calendar: integración base; deseado reintentos/backoff y reconciliación.
- i18n: base es/en; deseado cobertura total de cadenas.
- Accesibilidad: base; deseado auditoría WCAG.


## 14. Contratos de servicios (resumen)

- appointmentsService
  - list({ businessId, employeeId, clientId, dateRange, status }): Appointment[]
  - get(id): Appointment | null
  - create(payload Omit<Appointment, 'id'|'created_at'|'updated_at'>): Appointment
  - update(id, updates Partial<Appointment>): Appointment
  - remove(id): void

- servicesService / locationsService
  - list({ businessId | businessIds, activeOnly }): entidad[]
  - CRUD estándar

- businessesService
  - list({ ownerId | ids }): Business[]
  - listByEmployee(employeeId): Business[]
  - CRUD estándar

- statsService
  - getDashboardStats({ businessId, ownerId, employeeId, dateRange }): DashboardStats

- profiles/clients/userSettings: get/list/upsert según entidad


## 15. Riesgos y mitigaciones

- Falta de RLS estricta: riesgo de fuga de datos → implementar políticas por tabla y probar.
- Zonas horarias: inconsistencia de citas → fijar TZ, usar utilidades robustas, pruebas de DST.
- Duplicados en recordatorios/sync: falta de idempotencia → claves/locks lógicos por evento.
- Solapamientos de citas: mala experiencia → validadores en servicio y/o constraints.


## 16. Aceptación y criterios de éxito

- El usuario puede autenticarse y ver datos conforme a su rol y alcance.
- Se pueden crear/editar/cancelar citas respetando reglas de conflicto y buffers.
- Dashboard refleja métricas consistentes en intervalos elegidos.
- Notificaciones se envían según preferencias y sin duplicados.
- Modo demo permite navegar la UI sin romper flujos.


## 17. Siguientes pasos sugeridos (plan de ejecución)

1) Seguridad y reglas (P0): RLS por tabla + tests; validadores de conflicto en `appointmentsService` + SQL helper.
2) Dashboard avanzado (P1): métricas de “hoy/semana”, rankings y performance.
3) Paginación/búsqueda (P1): endpoints/servicios con límites y filtros; UI de filtros.
4) Codegen de tipos (P1): integrar supabase-js codegen para typings de tablas.
5) Notificaciones E2E (P2): funciones edge + cron + plantillas.
6) Google Calendar resiliente (P2): reintentos y refresh token robusto.
7) Mobile/Extensión (P2): features mínimas alineadas con web.
8) QA y accesibilidad (P3): pruebas E2E y checklist WCAG.


---

Este documento es vivo. Actualízalo al introducir cambios en schema, servicios o reglas para que siga siendo la única fuente de verdad funcional y técnica.
