# 🔐 GUÍA: Audit Trigger de Permisos - Limitation y Workarounds

**Fecha**: 17 de Noviembre de 2025  
**Sistema**: Gestabiz v2.0 - Sistema de Permisos Granulares  
**Audiencia**: Developers y DBAs

---

## 📋 ÍNDICE
1. [Problema](#problema)
2. [Root Cause](#root-cause)
3. [Workarounds](#workarounds)
4. [Ejemplos de Código](#ejemplos-de-código)
5. [Mejores Prácticas](#mejores-prácticas)

---

## ⚠️ PROBLEMA

### Síntoma
Al intentar revocar permisos directamente con SQL (UPDATE en `user_permissions`), se genera el siguiente error:

```sql
ERROR: 23502: null value in column "performed_by" of relation "permission_audit_log" 
violates not-null constraint

CONTEXT: 
SQL statement "INSERT INTO permission_audit_log (business_id, user_id, action, 
permission, old_value, new_value, performed_by, notes)
VALUES (NEW.business_id, NEW.user_id, 'modify', NEW.permission, OLD.is_active::TEXT, 
NEW.is_active::TEXT, auth.uid(), NEW.notes)"
PL/pgSQL function audit_user_permissions_changes() line 8 at SQL statement
```

### Operaciones Afectadas
- ✅ **Permission Assignment**: Funciona con workaround
- ❌ **Permission Revocation**: Falla sin auth context
- ❌ **Bulk Updates**: Falla sin auth context
- ✅ **Operaciones desde UI**: Funcionan correctamente (usan RPC/Edge Functions)

---

## 🔍 ROOT CAUSE

### Trigger Code
```sql
-- Trigger automático en user_permissions
CREATE TRIGGER audit_user_permissions_changes
  AFTER INSERT OR UPDATE OR DELETE ON user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION audit_user_permissions_changes();
```

### Function Code (Fragmento Relevante)
```sql
CREATE OR REPLACE FUNCTION audit_user_permissions_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO permission_audit_log (
    business_id, user_id, action, permission, 
    old_value, new_value, performed_by, notes
  )
  VALUES (
    NEW.business_id, NEW.user_id, 'modify', NEW.permission,
    OLD.is_active::TEXT, NEW.is_active::TEXT,
    auth.uid(),  -- ⚠️ PROBLEMA: Retorna NULL fuera de contexto JWT
    NEW.notes
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Explicación
- `auth.uid()` depende del JWT token de Supabase Auth
- En queries SQL directas (via MCP, psql, o SQL editor) NO hay JWT
- Sin JWT, `auth.uid()` retorna `NULL`
- Columna `performed_by` tiene constraint `NOT NULL`
- INSERT falla → Trigger falla → UPDATE original falla

---

## 🛠️ WORKAROUNDS

### Opción 1: Set Config (Temporal - Para Testing)
**Uso**: Testing, scripts de migración, operaciones de mantenimiento

```sql
-- Paso 1: Establecer auth context manualmente
SELECT set_config('request.jwt.claim.sub', 'user_id_del_admin', true);

-- Paso 2: Ejecutar operación
UPDATE user_permissions 
SET is_active = false, notes = 'Revoked by admin'
WHERE business_id = '1983339a-40f8-43bf-8452-1f23585a433a'
  AND user_id = '5ddc3251-1e22-4b86-9bf8-15452f9ec95b'
  AND permission = 'expenses.create';

-- Paso 3: Verificar audit log
SELECT * FROM permission_audit_log 
WHERE user_id = '5ddc3251-1e22-4b86-9bf8-15452f9ec95b'
ORDER BY created_at DESC LIMIT 5;
```

**Ventajas**:
- ✅ Simple de implementar
- ✅ No requiere cambios de código
- ✅ Útil para testing

**Desventajas**:
- ❌ Temporal (se resetea al final de la transacción)
- ❌ Manual (requiere conocer user_id del admin)
- ❌ No apto para producción

---

### Opción 2: RPC Function (Recomendado para Producción)
**Uso**: Operaciones desde UI, APIs, aplicaciones

```sql
-- Crear RPC function con auth context automático
CREATE OR REPLACE FUNCTION revoke_user_permission(
  p_business_id UUID,
  p_user_id UUID,
  p_permission TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_rows_affected INTEGER;
BEGIN
  -- Update con auth.uid() disponible automáticamente
  UPDATE user_permissions
  SET 
    is_active = false,
    notes = COALESCE(p_notes, 'Revoked via RPC'),
    updated_at = NOW()
  WHERE business_id = p_business_id
    AND user_id = p_user_id
    AND permission = p_permission
    AND is_active = true;
  
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  
  -- Construir respuesta
  SELECT jsonb_build_object(
    'success', v_rows_affected > 0,
    'rows_affected', v_rows_affected,
    'business_id', p_business_id,
    'user_id', p_user_id,
    'permission', p_permission,
    'revoked_at', NOW(),
    'revoked_by', auth.uid()
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Uso desde aplicación**:
```typescript
// src/lib/services/permissions.ts
import { supabase } from '@/lib/supabase';

export async function revokePermission(
  businessId: string,
  userId: string,
  permission: string,
  notes?: string
) {
  const { data, error } = await supabase.rpc('revoke_user_permission', {
    p_business_id: businessId,
    p_user_id: userId,
    p_permission: permission,
    p_notes: notes
  });

  if (error) throw error;
  return data;
}
```

**Ventajas**:
- ✅ Auth context automático (auth.uid() funciona)
- ✅ Seguro (SECURITY DEFINER)
- ✅ Reusable desde cualquier cliente
- ✅ Audit log completo
- ✅ Apto para producción

**Desventajas**:
- ⚠️ Requiere crear función SQL
- ⚠️ Requiere migración

---

### Opción 3: Edge Function (Máxima Seguridad)
**Uso**: Operaciones críticas, validaciones complejas

```typescript
// supabase/functions/manage-permissions/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { businessId, userId, permission, action, notes } = await req.json();
  
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Validaciones adicionales aquí
  if (!['assign', 'revoke'].includes(action)) {
    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Ejecutar operación con service role (bypass RLS)
  const { data, error } = await supabaseClient
    .from('user_permissions')
    .update({
      is_active: action === 'assign',
      notes: notes || `${action}ed via Edge Function`,
      updated_at: new Date().toISOString()
    })
    .eq('business_id', businessId)
    .eq('user_id', userId)
    .eq('permission', permission);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ success: true, data }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

**Ventajas**:
- ✅ Máxima seguridad (service role)
- ✅ Validaciones personalizadas
- ✅ Logging avanzado
- ✅ Rate limiting posible

**Desventajas**:
- ❌ Más complejo
- ❌ Cold start latency
- ❌ Requiere deployment

---

## 💻 EJEMPLOS DE CÓDIGO

### Ejemplo 1: Assignment con set_config
```sql
-- Context: Testing en desarrollo
BEGIN;

-- Set auth context
SELECT set_config('request.jwt.claim.sub', 'e0f501e9-07e4-4b6e-9a8d-f8bb526ae817', true);

-- Assign permission
INSERT INTO user_permissions (
  business_id, user_id, permission, granted_by, is_active
)
VALUES (
  '1983339a-40f8-43bf-8452-1f23585a433a',
  '5ddc3251-1e22-4b86-9bf8-15452f9ec95b',
  'accounting.create',
  'e0f501e9-07e4-4b6e-9a8d-f8bb526ae817',
  true
)
ON CONFLICT (business_id, user_id, permission)
DO UPDATE SET 
  is_active = true, 
  granted_by = EXCLUDED.granted_by, 
  updated_at = NOW();

COMMIT;
```

### Ejemplo 2: Revocation con RPC
```typescript
// src/components/permissions/UserPermissionsManager.tsx
import { revokePermission } from '@/lib/services/permissions';

async function handleRevokePermission(permission: string) {
  try {
    const result = await revokePermission(
      businessId,
      userId,
      permission,
      'Revoked by admin via UI'
    );

    if (result.success) {
      toast.success(`Permission ${permission} revoked successfully`);
      queryClient.invalidateQueries(['user-permissions', businessId, userId]);
    } else {
      toast.error('Permission not found or already revoked');
    }
  } catch (error) {
    console.error('Error revoking permission:', error);
    toast.error('Failed to revoke permission');
  }
}
```

### Ejemplo 3: Bulk Assignment con Transaction
```sql
-- Context: Aplicar template "Recepcionista" a múltiples empleados
BEGIN;

-- Set auth context una sola vez
SELECT set_config('request.jwt.claim.sub', 'admin_user_id', true);

-- Bulk insert desde template
WITH template AS (
  SELECT permissions 
  FROM permission_templates
  WHERE id = 'template_id'
),
permisos AS (
  SELECT jsonb_array_elements_text(permissions) as permission
  FROM template
),
empleados AS (
  SELECT unnest(ARRAY['emp1_id', 'emp2_id', 'emp3_id']) as employee_id
)
INSERT INTO user_permissions (business_id, user_id, permission, granted_by, is_active)
SELECT 
  'business_id',
  e.employee_id,
  p.permission,
  'admin_user_id',
  true
FROM empleados e
CROSS JOIN permisos p
ON CONFLICT (business_id, user_id, permission)
DO UPDATE SET is_active = true, updated_at = NOW();

COMMIT;
```

---

## ✅ MEJORES PRÁCTICAS

### 1. Desarrollo y Testing
- ✅ Usar `set_config()` para scripts de migración
- ✅ Siempre dentro de transacción BEGIN/COMMIT
- ✅ Verificar audit log después de operaciones
- ✅ Documentar user_id usado en set_config

### 2. Producción
- ✅ Usar RPC functions para operaciones desde UI
- ✅ Usar Edge Functions para lógica compleja
- ✅ NUNCA exponer service_role_key al cliente
- ✅ Validar permisos antes de operaciones

### 3. Audit Log
- ✅ Revisar logs periódicamente
- ✅ Alertas para operaciones masivas
- ✅ Retención de logs: mínimo 90 días
- ✅ Backup de audit_log mensual

### 4. Seguridad
- ✅ RPC functions con SECURITY DEFINER
- ✅ Validar businessId en todas las operaciones
- ✅ Rate limiting en Edge Functions
- ✅ Logging de errores y excepciones

---

## 🔗 REFERENCIAS

- **Documentación Supabase Auth**: https://supabase.com/docs/guides/auth
- **PostgreSQL set_config**: https://www.postgresql.org/docs/current/functions-admin.html
- **SECURITY DEFINER**: https://www.postgresql.org/docs/current/sql-createfunction.html
- **Reporte de Testing**: `docs/REPORTE_TESTING_SISTEMA_PERMISOS_17NOV2025.md`
- **Sistema de Permisos**: `docs/FASE_5_RESUMEN_FINAL_SESION_16NOV.md`

---

## 📝 CHANGELOG

### 17 Nov 2025
- ✅ Documento inicial creado
- ✅ Documentadas 3 opciones de workaround
- ✅ Ejemplos de código agregados
- ✅ Mejores prácticas definidas

---

**Mantenido por**: TI-Turing Team  
**Última actualización**: 17 de Noviembre de 2025
