# Análisis Integral del Sistema y Plan de Ejecución

Este documento consolida la descripción del sistema actual, el inventario exhaustivo de tareas pendientes marcadas con //TODO, el análisis de impacto de cada cambio, un plan de ejecución priorizado, una guía de implementación para cada tarea y los criterios de verificación final.

---

## 1. Descripción del Sistema Actual

### Arquitectura General
- SPA en `React + Vite + TypeScript` con estilos en `Tailwind`.
- Backend como BaaS utilizando `Supabase` (PostgreSQL, Auth, RLS, Storage, Edge Functions en Deno).
- Capa de servicios y utilidades en `src/lib` que abstrae pagos, normalizadores, permisos y analíticas.
- Autenticación mediante hooks y contextos: `useAuth`, `useAuthSimple`, `AuthContext`.
- Navegación y vistas por roles: `Admin`, `Employee`, `Client` orquestados por `MainApp.tsx`.
- Internacionalización y analítica presentes en la `LandingPage`.
- Modelo multi-tenant con `businesses` y relaciones (`business_employees`, `services`, `appointments`), gobernado por RLS.

### Componentes Principales
- `src/lib/payments`: interfaz `IPaymentGateway` y proveedores `StripeGateway` y `MercadoPagoGateway` con funciones Edge y RPC.
- `src/components`: dashboards por rol, billing, chat, calendario, administración, cliente.
- `src/hooks`: autenticación, analíticas, catálogos, reviews, formularios, geolocalización, chat.
- `src/database` y `supabase/migrations`: esquema completo, políticas RLS y migraciones funcionales (billing, chat, reviews, transactions, integridad de recursos).

### Flujo de Datos y Procesos Clave
- Autenticación → sesión Supabase → hidratar `profiles` → resolver rol → routing a dashboard.
- Onboarding Admin/Employee → completar datos → persistencia en `profiles/businesses/business_employees` → acceso a dashboard.
- Pagos (suscripción): validación de límites y descuentos → creación de checkout session (Stripe/MercadoPago) → retorno webhooks → actualización de `transactions`/estado → dashboard de suscripción vía RPC.
- Citas: validación de solapamientos (cliente) → CRUD en `appointments` → datos enriquecidos desde `appointment_details` → notificaciones.

### Dependencias Externas e Internas
- Externas: `Supabase` (Auth, DB, Edge Functions), `Stripe`, `MercadoPago`, `Brevo` (emails), `Google Calendar`, opcional `AWS SNS`/`WhatsApp`.
- Internas: módulos `lib/*` (pagos, permisos, normalizadores, analíticas), hooks de auth, vistas por rol, migraciones SQL y funciones Edge.

---

## 2. Inventario de Tareas Pendientes (//TODO)

A continuación, se listan los TODO/FIXME detectados por búsqueda exacta. Se incluye prioridad y estimación de complejidad.

1) `supabase/functions/cancel-appointments-on-emergency-absence/index.ts`
- TODO: Enviar email usando send-notification Edge Function
- Prioridad: crítico
- Complejidad: media

2) `src/components/chat/ConversationList.tsx`
- TODO: Agregar is_pinned
- TODO: Agregar campo is_pinned a conversation_members
- TODO: Implementar is_pinned desde conversation_members
- Prioridad: alto
- Complejidad: media

3) `src/components/user/UserProfile.tsx`
- TODO: Implement expertise tracking
- Prioridad: medio
- Complejidad: media

4) `src/components/employee/MyEmployments.tsx`
- TODO: Agregar campo is_active en business_employees
- Prioridad: alto
- Complejidad: media

5) `src/components/employee/MyEmploymentsEnhanced.tsx`
- TODO: Filtrar por is_active
- Prioridad: medio (dependiente de #4)
- Complejidad: baja

6) `supabase/functions/stripe-webhook/index.ts`
- TODO: Enviar notificación al negocio
- TODO: Enviar notificación al negocio sobre próximo cobro
- Prioridad: crítico
- Complejidad: media

7) `supabase/functions/send-notification/index.ts`
- TODO: Implementar carga de template desde storage
- Prioridad: alto
- Complejidad: media

8) `src/components/chat/ChatLayout.tsx`
- TODO: Implementar typing indicator con broadcast
- TODO: Agregar campo is_pinned a conversation_members
- TODO: Actualizar tipos en ChatWindow
- TODO: Implementar typing indicators
- Prioridad: medio
- Complejidad: media

9) `src/components/client/ClientDashboard.tsx`
- TODO: Open AppointmentWizard with preselected service and business
- Prioridad: medio
- Complejidad: baja

10) `supabase/functions/request-absence/index.ts`
- TODO: Trigger Edge Function cancel-appointments-on-absence
- Prioridad: crítico
- Complejidad: baja

11) `supabase/migrations/20251015000002_billing_rpc_functions.sql`
- TODO: Calcular storage real (simplificado por ahora)
- Prioridad: medio
- Complejidad: media

12) `supabase/functions/approve-reject-absence/index.ts`
- TODO: Enviar email al cliente
- TODO: Enviar email al empleado
- Prioridad: crítico
- Complejidad: media

13) `src/components/employee/EmploymentDetailModal.tsx`
- TODO: Real distribution from reviews table
- Prioridad: medio
- Complejidad: baja

14) `src/components/chat/ChatWindow.tsx`
- TODO: Agregar pin/mute cuando ConversationMember fields estén en ConversationPreview
- Prioridad: medio
- Complejidad: media

15) `supabase/functions/send-message/index.ts`
- TODO/MEJORAS FUTURAS (lista pendiente de concretar)
- Prioridad: bajo
- Complejidad: variable

---

## 3. Análisis de Impacto

### Notificaciones y Emails (ausencias, Stripe)
- Impacto: mejora UX y cumplimiento legal/comercial; alta criticidad.
- Riesgos: entrega de email (rate limits, plantillas faltantes), manejo idempotente.
- Dependencias: `send-notification`, `brevo.ts`, configuración de plantillas en storage.
- Requisitos previos: variables de entorno Brevo, templates en `supabase/storage`, claves de servicio para Edge.

### Chat: is_pinned, typing indicators, tipos
- Impacto: mejora funcionalidad de chat; cambios de esquema y UI.
- Riesgos: migración de DB y sincronización de tipos en frontend, retrocompatibilidad.
- Dependencias: tablas de chat y RLS, componentes `ConversationList`, `ChatLayout`, `ChatWindow`.
- Requisitos previos: migración SQL para `conversation_members.is_pinned`, endpoints/queries para lectura/escritura.

### Empleos: is_active en `business_employees`
- Impacto: filtrado correcto de empleos activos; afecta dashboards y permisos.
- Riesgos: queries actuales que asumen todos activos; vistas.
- Dependencias: migración SQL, hooks y servicios de empleados.
- Requisitos previos: actualización de RLS si aplica.

### Perfil: expertise tracking
- Impacto: mejora datos del profesional (recomendaciones/filtrado).
- Riesgos: diseño de esquema y normalización; UI/UX.
- Dependencias: `profiles` o tabla nueva `employee_expertise`.
- Requisitos previos: decisión de modelo (JSON vs relacional), migración.

### Billing: cálculo real de storage
- Impacto: precisión de costos, vista de billing.
- Riesgos: performance de cálculo, acceso a storage metadatos.
- Dependencias: RPC de billing, Storage API.
- Requisitos previos: definir fórmula y fuentes de datos.

### Cliente: wizard de citas preseleccionadas
- Impacto: conversión/flujo más directo.
- Riesgos: navegación, consistencia de estado.
- Dependencias: `AppointmentWizard` y routing.
- Requisitos previos: confirmar rutas y parámetros.

---

## 4. Plan de Ejecución

### Secuencia Lógica (por prioridad e interdependencias)
1. Notificaciones críticas de ausencias: `cancel-appointments-on-emergency-absence` y `approve-reject-absence` (emails).
2. Webhook de Stripe: notificaciones al negocio y próximos cobros.
3. `send-notification`: carga de templates desde storage (fundación para 1 y 2).
4. Migración `conversation_members.is_pinned` + UI `ConversationList`/`ChatLayout`/`ChatWindow`.
5. `business_employees.is_active` + filtros en `MyEmployments*`.
6. `ClientDashboard` → abrir wizard con preselección.
7. Billing RPC: cálculo real de storage.
8. Expertise tracking: diseño e implementación.
9. Typing indicators: broadcast y UI.

### Recursos Necesarios
- Tiempo (estimado):
  - Críticos: 1–2 días (notificaciones, Stripe webhook, send-notification).
  - Esquema/Chat/Empleos: 1 día.
  - UI Wizard y filtros: 0.5 día.
  - Billing storage y expertise: 1–2 días.
- Herramientas: Supabase CLI, Vite/React dev server, Node scripts, Deno para Edge.
- Conocimientos: SQL (migraciones y RLS), Deno Edge Functions, Stripe API, Brevo API, React/TypeScript.

### Criterios de Validación
- Notificaciones: emails generados, logs sin errores, entrega verificada con Brevo.
- Stripe: eventos procesados idempotentes, notificaciones enviadas, `transactions` actualizadas.
- Chat pinned: campo persistido, UI refleja estado, toggle funcional, RLS correcto.
- Empleos activos: solo activos visibles, queries y dashboards consistentes.
- Wizard preselección: navegación correcta con parámetros y estado.
- Billing storage: valores precisos y reproducibles.
- Expertise: datos persistidos y visibles en perfil/búsquedas.
- Typing: señales en tiempo real visibles y eficientes.

---

## 5. Implementación (Guía por TODO)

A continuación, se detallan pasos e indicadores de finalización por cada TODO. Se adjuntan ejemplos de código/SQL cuando aplica.

1) `cancel-appointments-on-emergency-absence`: enviar email con `send-notification`
- Pasos:
  - Importar cliente hacia Edge Function `send-notification` usando `Deno.fetch` con `SERVICE_ROLE`.
  - Construir payload con plantilla `absence-emergency-cancellation`, variables del appointment.
  - Registrar logs y manejar reintentos/backoff.
- Validación: email en Brevo, logs sin errores, idempotencia al re-ejecutar.

2) Chat `is_pinned` (DB + UI)
- Pasos:
  - Migración: `ALTER TABLE conversation_members ADD COLUMN is_pinned BOOLEAN DEFAULT false;` con RLS actualización.
  - API/queries: incluir `is_pinned` en SELECT y UPDATE.
  - UI: mostrar pin y permitir toggle; ordenar conversaciones con `is_pinned DESC, last_message_at DESC`.
- Validación: estado persiste, ACL respeta RLS, orden correcto.

3) Perfil `expertise` tracking
- Pasos:
  - Modelo: crear tabla `employee_expertise(employee_id, expertise, level)` o JSON en `profiles.expertise`.
  - CRUD en servicio y UI de perfil.
  - Migración y backfill si aplica.
- Validación: datos visibles y filtrables.

4) `business_employees.is_active`
- Pasos:
  - Migración: `ALTER TABLE business_employees ADD COLUMN is_active BOOLEAN DEFAULT true;`.
  - Actualizar servicios/hooks para filtrar por `is_active`.
  - UI: `MyEmployments*` filtra y muestra etiqueta de inactivo.
- Validación: solo activos visibles por defecto, actualización consistente.

5) Stripe webhook: notificaciones al negocio
- Pasos:
  - En `stripe-webhook/index.ts`, ubicar eventos `invoice.payment_failed`, `invoice.upcoming`, `payment_intent.succeeded`.
  - Llamar a `send-notification` con plantillas `billing-payment-failed`, `billing-upcoming`, `billing-payment-succeeded`.
  - Añadir idempotencia mediante registro en `transactions`/`error_logs`.
- Validación: notificaciones enviadas y tasas de reintentos controladas.

6) `send-notification`: cargar templates desde storage
- Pasos:
  - Implementar función para leer desde `supabase.storage` bucket `email-templates` por clave (p.ej., `billing-payment-failed.html`).
  - Cachear lectura (TTL) y fallback si no existe.
- Validación: plantillas personalizadas entregadas correctamente.

7) `ClientDashboard`: abrir wizard con preselección
- Pasos:
  - Definir ruta `AppointmentWizard` (si existe), construir enlace con query `?businessId=...&serviceId=...`.
  - En handler del CTA, navegar usando `useNavigate` con parámetros.
- Validación: wizard abre con preselección y flujo termina en creación de cita.

8) `request-absence`: trigger cancel-appointments-on-absence
- Pasos:
  - Tras aprobar/crear ausencia, invocar Edge Function `cancel-appointments-on-emergency-absence` con payload del rango.
  - Capturar errores y reintentos.
- Validación: citas afectadas canceladas, notificaciones emitidas.

9) Billing RPC: cálculo real de storage
- Pasos:
  - Extender RPC para sumar tamaños por bucket (`logos`, `locations`, `services`), y por negocio si hay path por `business_id`.
  - Añadir índices o caché materializada si es costoso.
- Validación: valores coinciden con `supabase.storage.list()` y metadatos.

10) `approve-reject-absence`: emails al cliente y empleado
- Pasos:
  - Construir payloads y llamar `send-notification` con `absence-approved`/`absence-rejected`.
  - Adjuntar detalles del appointment y razón.
- Validación: emails enviados, estados consistentes.

11) `EmploymentDetailModal`: distribución real desde `reviews`
- Pasos:
  - Query a `reviews` por empleado → calcular histograma de ratings.
  - Reemplazar random por distribución real.
- Validación: UI refleja datos reales.

12) `ChatWindow`: pin/mute
- Pasos:
  - Incorporar `is_pinned` y `is_muted` en `ConversationMember` tipos.
  - Hooks/acciones para toggle + persistencia.
- Validación: mute afecta notificaciones, pin afecta orden.

13) `send-message`: TODO/Mejoras futuras
- Pasos:
  - Crear backlog concreto (delivery receipts, throttling, attachments límites, antispam) y priorizar.
- Validación: backlog aprobado y planificado.

---

## 6. Verificación Final

### Pruebas de Regresión
- Ejecutar `npm run build` y tests relevantes (`vitest`) de módulos afectados.
- Simular flujos: ausencias (crear/aprobar), pagos (webhooks Stripe), chat (pin/mute, typing), empleos (activo/inactivo), wizard de citas.

### Validación de Requisitos
- Confirmar entrega de emails (Brevo), consistencia de datos (DB/RLS), estabilidad de UI.
- Revisar logs (`error_logs`, `login_logs`) y trazas en Edge Functions.

### Actualización de Documentación
- Registrar nuevas migraciones y funciones Edge.
- Actualizar README y documentación técnica (secciones de billing, chat, ausencias).

---

## Apéndice: Clasificación Resumida de TODOs

- Crítico: 1, 6, 8, 10
- Alto: 2, 7
- Medio: 3, 4, 5, 9, 11, 12
- Bajo: 13

---

## Notas
- Este documento sirve de guía operativa; la implementación debe seguir buenas prácticas de idempotencia, RLS y observabilidad.
- Las estimaciones y prioridades pueden ajustarse tras validación de negocio y disponibilidad de recursos.
