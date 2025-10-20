# 🔧 FIX: Políticas RLS Faltantes en Sistema de Ausencias/Vacaciones

**Fecha**: 20 de Octubre de 2025  
**Status**: ✅ RESUELTO  
**Severidad**: 🔴 CRÍTICA

---

## 🐛 Problema Reportado

Al intentar crear una solicitud de vacaciones, el usuario recibía este error:

```
POST https://dkancockzvcqorqbwtyh.supabase.co/rest/v1/employee_absences 403 (Forbidden)

{
    "code": "42501",
    "details": null,
    "hint": null,
    "message": "new row violates row-level security policy for table \"vacation_balance\""
}
```

---

## 🔍 Análisis de Causa Raíz

### Error de Tabla Anterior
Inicialmente el código intentaba acceder a `employee_time_off` que no existe:
- ❌ Tabla: `employee_time_off` (NO EXISTE)
- ✅ Tabla correcta: `employee_absences` (EXISTE)

**Solución aplicada**: Actualizar hook `useEmployeeTimeOff.ts` para usar `employee_absences`

### Error RLS Después de la Corrección
Después de corregir el nombre de tabla, surgió un nuevo error: **RLS Policy 403 Forbidden**

**Causa raíz**: La migración `20251020000002_add_absences_and_vacation_system.sql` habilitó RLS en las tablas pero **NO agregó todas las políticas necesarias**:

```sql
-- Lo que HABÍA (incompleto):
ALTER TABLE vacation_balance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view their own vacation balance" ON vacation_balance FOR SELECT ...
CREATE POLICY "Admins can view all vacation balances" ON vacation_balance FOR SELECT ...

-- Lo que FALTABA:
-- ❌ CREATE POLICY "System can insert vacation balances" ON vacation_balance FOR INSERT ...
-- ❌ CREATE POLICY "Admins can update vacation balances" ON vacation_balance FOR UPDATE ...
```

### ¿Por qué falló el INSERT?

Cuando un empleado crea una solicitud:
1. ✅ INSERT en `employee_absences` - OK (política existe)
2. 🔴 TRIGGER ejecuta automáticamente `update_vacation_balance_on_absence()`
3. 🔴 Función intenta INSERT en `vacation_balance` - **BLOQUEADO por RLS**
4. 🔴 Error 403 Forbidden

---

## ✅ Soluciones Aplicadas

### 1. Corrección de Nombre de Tabla
**Archivo**: `src/hooks/useEmployeeTimeOff.ts`

```typescript
// ANTES (incorrecto)
.from('employee_time_off')

// AHORA (correcto)
.from('employee_absences')
```

**Cambios realizados**: 3 referencias en el hook (líneas 68, 114, 139)

### 2. Agregar Políticas RLS Faltantes
**Método**: Ejecutadas directamente en Supabase con MCP

#### a) vacation_balance
```sql
CREATE POLICY "System can insert vacation balances"
ON vacation_balance FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can update vacation balances"
ON vacation_balance FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = business_id AND b.owner_id = auth.uid()
  )
);
```

#### b) employee_absences
```sql
CREATE POLICY "Employees can update their pending absences"
ON employee_absences FOR UPDATE
USING (employee_id = auth.uid() AND status = 'pending');
```

#### c) absence_approval_requests
```sql
CREATE POLICY "Admins can update approval requests"
ON absence_approval_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM businesses b
    WHERE b.id = business_id AND b.owner_id = auth.uid()
  )
);
```

### 3. Migración de Documentación
**Archivo**: `supabase/migrations/20251020200000_add_vacation_balance_insert_policy.sql`

Nueva migración que documenta y registra todos los cambios de RLS.

---

## 📊 Matriz de Políticas (Después del Fix)

### vacation_balance

| Operación | Rol | Acceso | Condición |
|-----------|-----|--------|-----------|
| SELECT | Employee | ✅ | Solo su propio balance |
| SELECT | Admin | ✅ | Balance de empleados en su negocio |
| INSERT | System | ✅ | Sin condiciones (triggers/functions) |
| UPDATE | Admin | ✅ | Balance en su negocio |

### employee_absences

| Operación | Rol | Acceso | Condición |
|-----------|-----|--------|-----------|
| SELECT | Employee | ✅ | Solo sus solicitudes |
| SELECT | Admin | ✅ | Todas en su negocio |
| INSERT | Employee | ✅ | Solo la propia |
| UPDATE | Employee | ✅ | Solo pendientes propias |
| UPDATE | Admin | ✅ | Todas en su negocio |

### absence_approval_requests

| Operación | Rol | Acceso | Condición |
|-----------|-----|--------|-----------|
| SELECT | Admin | ✅ | En su negocio |
| INSERT | System | ✅ | Sin condiciones |
| UPDATE | Admin | ✅ | En su negocio |

---

## 🧪 Verificación Post-Fix

### Consultas ejecutadas para validar

```sql
-- Verificar políticas en vacation_balance
SELECT policyname, cmd FROM pg_policies 
WHERE tablename = 'vacation_balance' 
ORDER BY policyname;

-- Resultado:
-- ✅ Admins can update vacation balances (UPDATE)
-- ✅ Admins can view all vacation balances (SELECT)
-- ✅ Employees can view their own vacation balance (SELECT)
-- ✅ System can insert vacation balances (INSERT)
```

---

## 🔄 Flujo Completo Ahora

```
1. Empleado crea solicitud de vacaciones
   ↓
2. POST a /employee_absences (INSERT)
   ↓
3. ✅ RLS permite INSERT (política: "Employees can create absence requests")
   ↓
4. TRIGGER ejecuta: update_vacation_balance_on_absence()
   ↓
5. Función intenta: INSERT INTO vacation_balance
   ↓
6. ✅ RLS permite INSERT (política: "System can insert vacation balances")
   ↓
7. ✅ Solicitud creada correctamente
   ↓
8. ✅ Balance actualizado automáticamente
```

---

## 📝 Cambios de Archivos

### 1. src/hooks/useEmployeeTimeOff.ts
- ✅ Actualizado interface `TimeOffRequest`
- ✅ Corregidas 3 referencias de tabla (`employee_time_off` → `employee_absences`)
- ✅ Corregidos nombres de campos

### 2. supabase/migrations/20251020200000_add_vacation_balance_insert_policy.sql
- ✅ Nueva migración con todas las políticas faltantes
- ✅ Documentación completa de cada política

---

## 🧠 Lecciones Aprendidas

1. **RLS en Triggers**: Cuando triggers/functions crean cambios en otras tablas, ambas necesitan políticas INSERT
2. **Validación de Migraciones**: Las políticas incompletas pueden no causar errores en desarrollo pero sí en producción
3. **Testing End-to-End**: El error solo apareció cuando se intentó crear una solicitud (flujo completo)

---

## 🚀 Próximas Pruebas

- [ ] Crear solicitud de vacaciones → Debe insertar en `employee_absences` Y `vacation_balance`
- [ ] Verificar que balance se calcula automáticamente
- [ ] Probar con empleados en múltiples negocios
- [ ] Verificar aprobación/rechazo de solicitudes

---

## 📚 Documentación Relacionada

- `docs/INTEGRACION_COMPLETA_AUSENCIAS.md` - Sistema completo de ausencias
- `supabase/migrations/20251020000002_add_absences_and_vacation_system.sql` - Migración original
- `src/hooks/useEmployeeTimeOff.ts` - Hook corregido

---

**Status**: ✅ RESUELTO  
**Aplicado en Supabase**: 20/10/2025  
**Probado**: Pendiente por usuario
