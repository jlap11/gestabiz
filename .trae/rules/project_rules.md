# Guía para Gestabiz

Esta guía establece reglas y convenciones para entender, mantener y evolucionar el proyecto de forma consistente.

## Arquitectura y Tecnologías
- Frontend: `React + Vite + TypeScript`, Tailwind.
- Backend BaaS: `Supabase` (Auth, DB, Storage, Edge Functions, Realtime).
- Pagos: `Stripe` y/o `MercadoPago` (según configuración actual).
- Pruebas: `Vitest`.

## Estructura de Carpetas Clave
- Código app: `src/` (componentes, hooks, lib, types).
- Esquema DB: `src/database/schema.sql` y `supabase/migrations/*`.
- Políticas RLS: `database/rls-policies.sql` (fuente de verdad).
- Edge Functions: `supabase/functions/*`.
- Documentación: `docs/`.

## Convenciones de Código
- TypeScript estricto y ESLint/Prettier según configuración del repo.
- Nombres descriptivos, evitar abreviaturas confusas.
- Mantener comentarios y TODO en español si ya existen, pero preferir descripciones claras y breves.

## Supabase CLI (SIEMPRE con `npx`)
- Crear migración: `npx supabase migration new <nombre>`.
- Aplicar migraciones: `npx supabase db push` (o `db reset` para limpiar y reaplicar).
- Iniciar entorno local: `npx supabase start` (requiere Docker).
- Lint DB: `npx supabase db lint`.

## Cambios de Base de Datos (Workflow)
1. Diseñar el cambio (columnas/tablas/enums) y revisar impacto en RLS.
2. Crear migración en `supabase/migrations` con SQL idempotente cuando sea posible (`IF NOT EXISTS`).
3. Actualizar `database/rls-policies.sql` si afecta permisos.
4. Ejecutar `npx supabase db lint` y luego `npx supabase db push`.
5. Regenerar tipos si aplica y revisar consultas en `src/hooks`/`src/lib`.

## RLS y Seguridad
- `database/rls-policies.sql` es la referencia central; mantener coherencia.
- Validar que las políticas permiten solo lo necesario (propietarios/miembros, etc.).

## Tipos y Contratos
- Mantener `src/types/supabase.gen.ts` y tipos locales sincronizados con el esquema.
- Al cambiar tablas/columnas, actualizar tipos y revisar componentes/herramientas que los consumen.

## TODO/FIXME y Documentación
- Registrar TODO/FIXME relevantes en `docs/plan-todos.md` con prioridad y estimación.
- Al completar, eliminar el comentario del código y actualizar el documento.
- Cambios de arquitectura/decisiones: anotar en `docs/analisis-sistema.md`.

## Edge Functions y Notificaciones
- Configurar proveedores (e.g., Brevo/SendGrid) vía variables de entorno.
- Implementar reintentos y logging; registrar en `notifications` con `delivery_method`.

## Entornos y Variables
- Usar `.env` (ver `.env.example`). Claves comunes: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, correo y pagos (`BREVO_API_KEY`, `STRIPE_*`).

## Testing
- Unit/integración en `src/lib` y `src/hooks`.
- Mocks para edge functions; validar flujos críticos (auth, notificaciones, pagos, citas).

## Comandos Útiles
- `npx supabase start` / `npx supabase db push` / `npx supabase db reset` / `npx supabase db lint`.
- `npm run dev` para desarrollo frontend.

## Principios
- Cambios mínimos y precisos; evitar complejidad innecesaria.
- Documentar decisiones con impacto.
- Priorizar seguridad (RLS), performance y DX.
