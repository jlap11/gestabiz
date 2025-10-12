# Instrucciones para aplicar la migración de Employee Requests

## Fecha: 11 de octubre de 2025

Esta migración agrega el sistema de solicitudes de empleados con códigos de invitación y QR.

## ⚠️ IMPORTANTE: Aplicar manualmente en Supabase SQL Editor

Como no tenemos el password de la base de datos en el entorno local, esta migración debe aplicarse **manualmente** desde el dashboard de Supabase:

### Pasos para aplicar:

1. **Ir al Dashboard de Supabase**
   - URL: https://supabase.com/dashboard/project/dkancockzvcqorqbwtyh/editor
   
2. **Abrir SQL Editor**
   - Clic en "SQL Editor" en el menú lateral

3. **Crear nueva query**
   - Clic en "New query"

4. **Copiar y pegar el contenido**
   - Abrir el archivo: `supabase/migrations/20251011000001_employee_requests_and_business_codes.sql`
   - Copiar TODO el contenido
   - Pegarlo en el editor SQL

5. **Ejecutar la migración**
   - Clic en "Run" o presionar `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
   - Verificar que no haya errores en el panel de resultados

6. **Verificar que se creó correctamente**
   ```sql
   -- Verificar que existe la tabla employee_requests
   SELECT * FROM employee_requests LIMIT 1;
   
   -- Verificar que los campos se agregaron a businesses
   SELECT invitation_code, last_activity_at, first_client_at, is_active 
   FROM businesses LIMIT 1;
   
   -- Verificar que las funciones existen
   SELECT proname FROM pg_proc WHERE proname LIKE '%employee_request%';
   ```

## 📋 Lo que hace esta migración:

### 1. **Nuevos campos en `businesses`:**
   - `invitation_code` (VARCHAR(6), UNIQUE): Código de 6 caracteres para que empleados se unan
   - `last_activity_at` (TIMESTAMPTZ): Última actividad del negocio
   - `first_client_at` (TIMESTAMPTZ): Fecha del primer cliente
   - `is_active` (BOOLEAN): Si el negocio está activo

### 2. **Nueva tabla `employee_requests`:**
   - Almacena solicitudes de usuarios para unirse como empleados
   - Estados: 'pending', 'approved', 'rejected'
   - Relaciones con `businesses` y `profiles`

### 3. **Funciones PostgreSQL:**
   - `generate_invitation_code()`: Genera códigos únicos de 6 caracteres
   - `auto_generate_invitation_code()`: Trigger para generar códigos automáticamente
   - `update_business_activity()`: Actualiza `last_activity_at` cuando hay citas
   - `track_first_client()`: Registra la fecha del primer cliente
   - `approve_employee_request()`: Aprueba solicitud y agrega a `business_employees`
   - `reject_employee_request()`: Rechaza solicitud

### 4. **Triggers:**
   - Auto-generación de códigos de invitación al crear negocios
   - Actualización automática de `last_activity_at` cuando hay appointments
   - Registro automático de `first_client_at` cuando hay primer cliente

### 5. **RLS Policies:**
   - Usuarios pueden crear sus propias solicitudes
   - Usuarios pueden ver sus propias solicitudes
   - Admins pueden ver solicitudes de sus negocios
   - Admins pueden aprobar/rechazar solicitudes

## 🔐 Seguridad:

- Las funciones `approve_employee_request` y `reject_employee_request` usan `SECURITY DEFINER` para ejecutarse con permisos elevados
- Validan que el admin sea dueño del negocio antes de aprobar/rechazar
- Previenen solicitudes duplicadas con UNIQUE constraint

## ✅ Validación post-migración:

Ejecuta estas queries para verificar:

```sql
-- 1. Verificar códigos de invitación generados
SELECT id, name, invitation_code FROM businesses LIMIT 5;

-- 2. Verificar tabla employee_requests vacía
SELECT COUNT(*) FROM employee_requests;

-- 3. Verificar funciones
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%employee%';

-- 4. Verificar triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

## 🚀 Siguientes pasos:

Después de aplicar esta migración:

1. ✅ Tipos TypeScript ya actualizados en `src/types/types.ts`
2. ✅ Hook `useEmployeeRequests` ya creado
3. ⏳ Crear componentes UI (EmployeeOnboarding, AdminOnboarding, etc.)
4. ⏳ Crear Edge Functions para notificaciones
5. ⏳ Implementar cron job para inactividad

## 📝 Notas:

- Los códigos de invitación excluyen caracteres similares (I, O, 0, 1) para evitar confusión
- Todos los negocios existentes recibirán un código de invitación automáticamente
- La migración es idempotente (puede ejecutarse múltiples veces sin problemas)
