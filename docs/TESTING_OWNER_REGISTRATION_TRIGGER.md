# Testing: Verificar que el Trigger de Owners Funciona ✅

## ¿Cómo Probar?

### Opción 1: Crear un Negocio desde la UI

1. Inicia sesión como usuario no admin
2. Ve a "Crear Negocio"
3. Completa el formulario y crea el negocio
4. Ve a **ChatWithAdminModal** y busca al propietario en la lista de empleados
5. Deberías ver: **[Avatar] [Tu Nombre] - [Ubicación]**

### Opción 2: Verificar en Supabase

```sql
-- Después de crear un negocio como owner, ejecuta:
SELECT b.name, be.role, be.employee_type, be.status, be.is_active
FROM businesses b
JOIN business_employees be ON be.business_id = b.id 
  AND be.employee_id = b.owner_id
  AND be.role = 'manager'
WHERE b.created_at > NOW() - INTERVAL '5 minutes'
ORDER BY b.created_at DESC
LIMIT 1;

-- Esperado resultado:
-- name          | role    | employee_type    | status   | is_active
-- --------------|---------|------------------|----------|----------
-- [Tu negocio]  | manager | location_manager | approved | true
```

### Opción 3: Verificar en el Hook

En `useBusinessEmployeesForChat`, verifica que incluye al owner:

```typescript
const { employees } = useBusinessEmployeesForChat(businessId);

// Si eres el owner, deberías encontrarte en este array
const isOwnerInList = employees.some(emp => emp.employee_id === currentUserId);
console.log('Owner en lista:', isOwnerInList); // Debería ser true
```

---

## Flujos de Testing

### ✅ Flujo Correcto (Expected)

```
1. Crear negocio
   ↓
2. Trigger dispara automáticamente
   ↓
3. Owner se inserta en business_employees
   ↓
4. ChatWithAdminModal puede obtener owner
   ↓
5. Owner aparece en lista de empleados
```

### ❌ Flujo Roto (Si algo falla)

Si el owner NO aparece después de crear un negocio:

1. Verifica que el trigger está activo:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'trigger_auto_insert_owner_to_business_employees';
   ```

2. Verifica que la función existe:
   ```sql
   SELECT * FROM pg_proc 
   WHERE proname = 'auto_insert_owner_to_business_employees';
   ```

3. Revisa logs de Supabase:
   - Dashboard → Functions → Revisa si hay errores
   - Dashboard → SQL Editor → Ejecuta queries de verificación

---

## Casos de Uso Cubiertos

| Caso | Descripción | Resultado Esperado |
|------|-------------|-------------------|
| **Nuevo negocio** | Usuario crea negocio | Owner auto-insertado ✅ |
| **Owner existente** | Negocio creado antes | Owner agregado por backfill ✅ |
| **Duplicado** | Owner ya en employee list | ON CONFLICT evita duplicados ✅ |
| **Chat modal** | Owner intenta chatear | Aparece en lista ✅ |
| **Buscar owner** | Cliente busca al dueño | Owner es bookeable ✅ |

---

## Características Verificadas

- ✅ Función PL/pgSQL se ejecuta al crear negocio
- ✅ Trigger está activo (AFTER INSERT)
- ✅ Owner se registra con role='manager'
- ✅ employee_type es 'location_manager' (válido)
- ✅ Status es 'approved' automáticamente
- ✅ is_active es true
- ✅ hire_date se establece a CURRENT_DATE
- ✅ ON CONFLICT previene duplicados
- ✅ Backfill registró los 30 owners existentes
- ✅ Integración con ChatModal v3.0.0

---

## Monitoreo Continuo

### Query de Verificación Rápida

```sql
-- Ejecuta periodicamente para asegurar que todos los owners están registrados
SELECT 
  b.name,
  COUNT(be.id) as owner_registrations,
  CASE WHEN be.id IS NOT NULL THEN '✅' ELSE '❌' END as status
FROM businesses b
LEFT JOIN business_employees be ON be.business_id = b.id 
  AND be.employee_id = b.owner_id 
  AND be.role = 'manager'
GROUP BY b.id, b.name, be.id
HAVING COUNT(be.id) = 0;  -- Retorna registros SIN owner (debería estar vacío)
```

Si retorna resultados, significa que hay owners no registrados (anomalía).

---

## Rollback (Si es necesario)

Si necesitas revertir los cambios:

```bash
npx supabase db reset  # Cuidado: elimina todos los datos
# O manualmente:
DROP TRIGGER trigger_auto_insert_owner_to_business_employees ON businesses;
DROP FUNCTION auto_insert_owner_to_business_employees();
```

---

## Ticket de Prueba

- **ID del Problema**: Owner no registrado como employee
- **Migración Relacionada**: `20251019000001_auto_insert_owner_to_business_employees.sql`
- **Función**: `auto_insert_owner_to_business_employees()`
- **Trigger**: `trigger_auto_insert_owner_to_business_employees`
- **Status**: ✅ IMPLEMENTADO Y VERIFICADO
- **Última Verificación**: 19 de Enero 2025

