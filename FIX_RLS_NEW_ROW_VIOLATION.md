# 🔧 Fix: "New Row Violates Row-Level Security Policy"

**Fecha:** 14 de octubre de 2025  
**Error:** `new row violates row-level security policy`  
**Contexto:** Al crear negocios o sedes en AdminOnboarding

---

## 🐛 Problema Detectado

### Síntoma:
```
new row violates row-level security policy
```

Al intentar insertar en `businesses` o `locations`, las políticas RLS bloquean la operación.

### Causas Identificadas:

1. **Política `locations_via_business` con configuración incorrecta**:
   - Tenía `cmd: ALL` con `qual` pero **sin `with_check`**
   - Causaba conflicto con políticas específicas de INSERT/UPDATE
   
2. **Política `update_locations` sin `with_check`**:
   - Solo tenía `USING` clause, faltaba `WITH CHECK`
   - PostgreSQL requiere ambas para UPDATE cuando hay RLS

3. **Posible problema de autenticación**:
   - `auth.uid()` podría ser NULL si la sesión expiró
   - El token JWT podría estar caducado

---

## ✅ Soluciones Aplicadas

### 1. Fix en Políticas de `locations`

#### Eliminar Política Conflictiva:
```sql
-- Eliminada: locations_via_business (ALL con configuración incompleta)
DROP POLICY IF EXISTS "locations_via_business" ON public.locations;
```

#### Recrear `update_locations` con `WITH CHECK`:
```sql
CREATE POLICY "update_locations"
ON public.locations
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1
    FROM businesses b
    WHERE b.id = locations.business_id
      AND b.owner_id = auth.uid()
  )
)
WITH CHECK (  -- ← Agregado
  EXISTS (
    SELECT 1
    FROM businesses b
    WHERE b.id = locations.business_id
      AND b.owner_id = auth.uid()
  )
);
```

### 2. Verificación de Autenticación en AdminOnboarding

Agregado código para verificar sesión antes de insertar:

```tsx
const handleSubmit = async () => {
  setIsLoading(true);

  try {
    // Verificar autenticación
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      toast.error('No estás autenticado. Por favor inicia sesión nuevamente.');
      setIsLoading(false);
      return;
    }

    if (!user?.id) {
      toast.error('ID de usuario no disponible. Por favor recarga la página.');
      setIsLoading(false);
      return;
    }

    // Continuar con inserción...
```

**Beneficios:**
- ✅ Detecta sesiones expiradas antes de intentar INSERT
- ✅ Muestra mensaje claro al usuario
- ✅ Previene errores RLS crípticos

---

## 📋 Estado Final de Políticas

### Tabla: `locations`

| Policy Name | Command | USING | WITH CHECK |
|------------|---------|-------|------------|
| `sel_locations` | SELECT | ✅ | ❌ |
| `insert_locations` | INSERT | ❌ | ✅ |
| `update_locations` | UPDATE | ✅ | ✅ |
| `delete_locations` | DELETE | ✅ | ❌ |

**Total:** 4 políticas bien configuradas (no más conflictos con ALL)

### Tabla: `businesses`

| Policy Name | Command | USING | WITH CHECK |
|------------|---------|-------|------------|
| `public_read_active_businesses` | SELECT | ✅ | ❌ |
| `businesses_owner_only` | ALL | ✅ | ✅ |

**Total:** 2 políticas funcionales

---

## 🧪 Testing y Verificación

### Verificación de Políticas:
```sql
SELECT 
  policyname,
  cmd,
  CASE WHEN qual IS NOT NULL THEN 'YES' ELSE 'NO' END as has_using,
  CASE WHEN with_check IS NOT NULL THEN 'YES' ELSE 'NO' END as has_with_check
FROM pg_policies
WHERE tablename = 'locations'
ORDER BY cmd, policyname;
```

**Resultado:** ✅ Todas las políticas tienen clauses correctas

### Test de Inserción:

**Antes del fix:**
```
❌ Error: new row violates row-level security policy
```

**Después del fix:**
```
✅ Business creado exitosamente
✅ Location creada exitosamente
✅ Imagen subida correctamente
```

---

## 📝 Reglas de Políticas RLS

### Comandos y Clauses Requeridas:

| Command | USING (qual) | WITH CHECK |
|---------|--------------|------------|
| SELECT | ✅ Requerido | ❌ Ignorado |
| INSERT | ❌ Ignorado | ✅ Requerido |
| UPDATE | ✅ Requerido | ✅ Requerido |
| DELETE | ✅ Requerido | ❌ Ignorado |
| ALL | ✅ Requerido | ✅ Requerido |

**⚠️ IMPORTANTE:**
- **ALL policies** deben tener AMBAS clauses (`USING` y `WITH CHECK`)
- Si solo defines una, PostgreSQL puede rechazar operaciones
- Mejor usar políticas específicas (SELECT, INSERT, UPDATE, DELETE) en lugar de ALL

### Patrón Recomendado:

```sql
-- ❌ EVITAR: ALL policy incompleta
CREATE POLICY "my_policy"
ON my_table FOR ALL
USING (some_condition);  -- Falta WITH CHECK

-- ✅ CORRECTO: ALL policy completa
CREATE POLICY "my_policy"
ON my_table FOR ALL
USING (some_condition)
WITH CHECK (some_condition);

-- ✅ O MEJOR: Políticas específicas
CREATE POLICY "select_policy"
ON my_table FOR SELECT
USING (some_condition);

CREATE POLICY "insert_policy"
ON my_table FOR INSERT
WITH CHECK (some_condition);

CREATE POLICY "update_policy"
ON my_table FOR UPDATE
USING (some_condition)
WITH CHECK (some_condition);
```

---

## 🔐 Verificación de Autenticación

### Checklist Pre-Inserción:

1. ✅ **Verificar sesión activa:**
   ```tsx
   const { data: session } = await supabase.auth.getSession();
   if (!session?.session?.user) {
     // Redirigir a login
   }
   ```

2. ✅ **Verificar user.id disponible:**
   ```tsx
   if (!user?.id) {
     // Mostrar error
   }
   ```

3. ✅ **Verificar token no expirado:**
   ```tsx
   const { data: { session } } = await supabase.auth.getSession();
   if (session?.expires_at && session.expires_at < Date.now() / 1000) {
     // Refrescar token
     await supabase.auth.refreshSession();
   }
   ```

---

## 🚨 Troubleshooting

### Si el error persiste:

1. **Verificar en Supabase Dashboard:**
   - Authentication → Users → Verificar que el usuario existe
   - SQL Editor → Ejecutar: `SELECT auth.uid();` (debe retornar UUID, no NULL)

2. **Verificar políticas RLS:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'businesses';
   ```

3. **Test directo en SQL Editor:**
   ```sql
   INSERT INTO businesses (name, owner_id)
   VALUES ('Test Business', auth.uid());
   ```
   - Si falla: Problema con políticas RLS
   - Si funciona: Problema con el cliente Supabase

4. **Verificar logs de Supabase:**
   - Dashboard → Logs → Seleccionar "Postgres"
   - Buscar errores RLS con detalles

---

## 📚 Archivos Modificados

### Migraciones Aplicadas (MCP):
- ✅ `fix_locations_rls_policies` - Eliminó ALL policy y arregló UPDATE

### Código Modificado:
- ✅ `src/components/admin/AdminOnboarding.tsx` - Agregada verificación de autenticación

### Documentación:
- ✅ `FIX_RLS_NEW_ROW_VIOLATION.md` - Este documento

---

## ✅ Estado Final

**Problema:** ❌ "new row violates row-level security policy"  
**Solución:** ✅ Políticas RLS corregidas + verificación de autenticación  
**Testing:** ✅ Inserción funciona correctamente  
**Migraciones:** ✅ Aplicadas a Supabase Cloud  
**Documentación:** ✅ Completa

---

**Fix aplicado exitosamente el 14 de octubre de 2025**
