# Plan de Acción para Ajustar TODO/FIXME

Este documento define un plan táctico y ordenado para resolver los TODO/FIXME identificados en el repositorio. Incluye prioridades, dependencias, estimaciones, criterios de aceptación, riesgos y checklist de despliegue.

## Objetivo
- Resolver los TODO/FIXME prioritarios que impactan UX, confiabilidad y operación.
- Mantener coherencia con el esquema y RLS de Supabase.
- Asegurar pruebas, documentación y telemetry donde tenga sentido.

## Priorización
1. Críticos: Notificaciones/emails, ajustes de pagos, filtros `is_active` en empleos.
2. Alta: Chat (`is_pinned`, typing indicators), Appointment Wizard preselección.
3. Media: Expertise en perfil, cálculo de almacenamiento real (billing).
4. Baja: Actualizaciones de tipos y mejoras menores.

## Fase 0 — Preparación (DB y entorno)
- Migraciones creadas:
  - `is_pinned` en `public.conversation_members` (índice y backfill).
  - `is_active` en `public.business_employees` (índice y backfill).
- Comandos:
  - `npx supabase start`
  - `npx supabase db push` (o `npx supabase db reset`)
  - `npx supabase db lint`
- Criterio de aceptación: migraciones aplicadas sin errores y reflejadas en el esquema.

## Notificaciones y Emails (Crítico)
- Estado: TODO para enviar emails en edge functions: 
  - `supabase/functions/cancel-appointments-on-emergency-absence/index.ts`
  - `supabase/functions/stripe-webhook/index.ts`
  - `supabase/functions/send-notification/index.ts`
  - `supabase/functions/request-absence/index.ts`
  - `supabase/functions/approve-reject-absence/index.ts`
- Cambios:
  - Integrar proveedor de correo (Brevo/SendGrid) vía secreto (`SUPABASE_BREVO_API_KEY`).
  - Plantillas transaccionales: cancelación, confirmación, aprobación/rechazo ausencia, fallback.
  - Manejo de reintentos y registro de estado (`notifications` con `delivery_method=email`).
- Dependencias: credenciales de email, políticas RLS en `notifications`, tipos actuales.
- Estimación: 1.5–2 días.
- Aceptación: correos enviados y registrados; reintentos y manejo de errores.
- Riesgos: límites del proveedor, plantillas no traducidas; mitigación con fallback simple.

## Chat — `is_pinned`, Typing Indicators y Tipos (Alta)
- Estado: TODO en `src/components/chat/ConversationList.tsx`, `ChatWindow.tsx`, `ChatLayout.tsx`.
- Cambios:
  - Persistir `is_pinned` en `public.conversation_members` con update permitido por RLS.
  - UI: toggle pin, orden prioritario con `is_pinned=true`.
  - Typing: canal Realtime + `presence` para indicadores de escritura.
  - Tipos: actualizar `src/types/supabase.gen.ts` o adaptar tipos locales.
- Dependencias: hooks `useChat`/`useMessages`, supabase client y Realtime.
- Estimación: 1–1.5 días.
- Aceptación: fijado/desfijado persiste; indicador typing visible y estable.
- Riesgos: desincronización de presence; mitigación con timeouts y heartbeats.

## Empleos Activos — Filtro `is_active` (Crítico)
- Estado: TODO en `src/components/employee/MyEmploymentsEnhanced.tsx`.
- Cambios:
  - Consultas filtradas por `is_active=true`.
  - UI: switch para mostrar inactivos, acciones para activar/desactivar.
- Dependencias: `public.business_employees` y políticas RLS.
- Estimación: 0.5 día.
- Aceptación: vistas coherentes con estado activo, y cambios persistentes.
- Riesgos: incoherencias por caché; invalidación en hooks y React Query.

## Perfil — Expertise (Media)
- Estado: TODO en `src/components/user/UserProfile.tsx`.
- Cambios:
  - Campo(s) de expertise (enum/array) en UI y persistencia en perfil/empleado.
  - Validación y visualización.
- Dependencias: definir dónde se almacena (perfil vs empleado-servicios).
- Estimación: 0.5–1 día.
- Aceptación: selección y persistencia estable, tipos consistentes.
- Riesgos: desalineación de modelo; decidir contrato y documentarlo.

## Cliente — Appointment Wizard Preselección (Alta)
- Estado: TODO en `src/components/client/ClientDashboard.tsx`.
- Cambios:
  - Propagar `service_id`/`business_id` al abrir wizard.
  - Prellenar pasos y bloqueo si faltan datos.
- Dependencias: rutas y estado compartido del wizard.
- Estimación: 0.5 día.
- Aceptación: apertura con preselección desde dashboard y deeplinks.
- Riesgos: rutas no deterministas; centralizar state.

## Billing — Cálculo de Almacenamiento Real (Media)
- Estado: TODO en `supabase/migrations/20251015000002_billing_rpc_functions.sql`.
- Cambios:
  - Completar función RPC para sumar tamaño de objetos en storage por espacio/empresa.
  - Agregar tests SQL y límites.
- Dependencias: esquema `storage` y permisos.
- Estimación: 0.5–1 día.
- Aceptación: retorna métricas correctas; validado con datos de prueba.
- Riesgos: performance; agregar índices o paginación.

## Pagos — Ajustes y Métodos (Crítico–Media)
- Estado: comentarios sobre métodos de pago, webhooks.
- Cambios:
  - Revisar `supabase/functions/stripe-webhook/index.ts` y flujos de notificación.
  - Documentar soportes actuales y roadmap (Stripe/MercadoPago).
- Dependencias: credenciales, tablas `transactions`.
- Estimación: 0.5–1 día.
- Aceptación: webhooks robustos con idempotencia; estados consistentes.
- Riesgos: reintentos webhooks; usar claves idempotencia y logs.

## Tipos y Contratos (Baja)
- Estado: TODOs de actualización de tipos (chat y globales).
- Cambios: regenerar tipos (`src/types/supabase.gen.ts`), sincronizar tipos locales.
- Estimación: 0.5 día.
- Aceptación: compilación limpia y tipos consistentes.

## RLS y Seguridad (Baja)
- Revisión de impacto por nuevas columnas (`is_pinned`, `is_active`).
- Confirmación: políticas vigentes cubren updates por miembros/owners.

## Documentación y Testing
- Doc: actualizar README y `/docs` con nuevos comportamientos.
- Testing:
  - Unit: hooks y componentes afectados.
  - Integración: edge functions con mocks.
  - E2E: flujos de chat, empleo, wizard.

## Secuencia Recomendada
1. Fase 0: aplicar migraciones y preparar entorno.
2. Notificaciones/emails.
3. Chat (`is_pinned` + typing).
4. Empleos (`is_active`).
5. Wizard preselección.
6. Expertise en perfil.
7. Billing storage.
8. Pagos/webhooks.
9. Tipos, RLS, documentación y pruebas finales.

## Checklist de Despliegue
- `npx supabase db push` aplicado.
- Variables de entorno de email y pagos configuradas.
- Pruebas verdes (unit/integración/E2E donde aplique).
- Documentación actualizada.
- Monitoreo/logs en edge functions habilitado.

## Referencias de Archivos
- Chat: `src/components/chat/*`, `src/hooks/useChat.ts`, `src/hooks/useMessages.ts`.
- Empleados: `src/components/employee/MyEmploymentsEnhanced.tsx`.
- Cliente: `src/components/client/ClientDashboard.tsx`.
- Perfil: `src/components/user/UserProfile.tsx`.
- Billing: `supabase/migrations/20251015000002_billing_rpc_functions.sql`.
- Notificaciones y pagos: `supabase/functions/*`.
- Esquema y políticas: `database/schema.sql`, `database/rls-policies.sql`, `supabase/migrations/*`.
