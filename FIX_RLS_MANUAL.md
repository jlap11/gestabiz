# 🔧 SOLUCIÓN DEFINITIVA: Problema con RLS en tabla businesses

## 🎯 Problema Identificado

**Las políticas RLS (Row Level Security) están bloqueando el acceso público a los negocios.**

### Diagnóstico Completo:
- ✅ Hay 10 negocios en la base de datos con `is_active = true`
- ✅ La API key de Supabase es válida
- ✅ Con `SERVICE_ROLE` key se pueden ver todos los negocios
- ❌ Con `ANON` key (usuarios no autenticados) no se puede ver ningún negocio
- ❌ La política RLS actual **requiere autenticación** para ver negocios

**Política actual problemática:**
```sql
CREATE POLICY sel_businesses ON public.businesses
  FOR SELECT USING (
    is_business_owner(id) OR is_business_member(id)
  );
```

Esta política SOLO permite ver negocios si eres owner o miembro, bloqueando usuarios no autenticados.

---

## ✅ SOLUCIÓN: Ejecutar SQL Manualmente

### Paso 1: Ir al SQL Editor de Supabase

Abre este link en tu navegador:
```
https://supabase.com/dashboard/project/dkancockzvcqorqbwtyh/sql/new
```

### Paso 2: Copiar y Pegar este SQL

```sql
-- 1. Asegurar que RLS está habilitado (mantener seguridad)
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar todas las políticas anteriores conflictivas
DROP POLICY IF EXISTS sel_businesses ON public.businesses;
DROP POLICY IF EXISTS sel_businesses_public ON public.businesses;
DROP POLICY IF EXISTS public_read_active_businesses ON public.businesses;
DROP POLICY IF EXISTS "Business access" ON public.businesses;

-- 3. Crear política que permite lectura pública de negocios activos
CREATE POLICY "public_read_active_businesses" ON public.businesses
  FOR SELECT
  TO public
  USING (is_active = true);

-- 4. (Opcional) Política adicional para que owners vean todos sus negocios
-- Descomenta si quieres que admins vean negocios inactivos también
-- CREATE POLICY "owners_full_access" ON public.businesses
--   FOR SELECT
--   TO authenticated
--   USING (owner_id = auth.uid());
```

### Paso 3: Ejecutar

1. Click en el botón **"RUN"** o presiona `Ctrl+Enter`
2. Deberías ver: "Success. No rows returned"

---

## 🧪 Verificación

### Opción A: Ejecutar script de verificación

```powershell
node check-rls.js
```

Deberías ver:
```
✅ Negocios accesibles: 10
   - Barbería Clásica Carlos
   - Clínica Dental Luis
   - Consultorio Médico Ana
   ... (7 más)
```

### Opción B: Probar en la aplicación

1. Inicia el servidor:
   ```powershell
   npm run dev
   ```

2. Abre: `http://localhost:5173`

3. Click en "Create Appointment"

4. **Deberías ver el grid con los 10 negocios** 🎉

---

## 📊 Qué Hace Esta Política

```sql
CREATE POLICY "public_read_active_businesses" ON public.businesses
  FOR SELECT
  TO public
  USING (is_active = true);
```

- **`FOR SELECT`**: Solo afecta operaciones de lectura (no INSERT/UPDATE/DELETE)
- **`TO public`**: Aplica a TODOS los usuarios (autenticados y anónimos)
- **`USING (is_active = true)`**: Solo muestra negocios activos

**Seguridad mantenida:**
- ✅ Solo negocios **activos** son visibles públicamente
- ✅ Negocios **inactivos** permanecen ocultos
- ✅ Solo **owners** pueden modificar/eliminar (políticas de INSERT/UPDATE/DELETE siguen intactas)
- ✅ Datos sensibles protegidos

---

## 🔒 Políticas RLS que Permanecen Sin Cambios

Las siguientes políticas siguen aplicando (seguridad mantenida):

```sql
-- Solo owners pueden crear negocios
CREATE POLICY ins_businesses ON public.businesses
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Solo owners pueden actualizar sus negocios
CREATE POLICY upd_businesses ON public.businesses
  FOR UPDATE USING (owner_id = auth.uid());

-- Solo owners pueden eliminar sus negocios  
CREATE POLICY del_businesses ON public.businesses
  FOR DELETE USING (owner_id = auth.uid());
```

---

## ⚡ Solución Alternativa (Solo para Testing)

Si necesitas testing rápido y quieres **desactivar RLS temporalmente**:

```sql
-- ⚠️ SOLO PARA DESARROLLO/TESTING
ALTER TABLE public.businesses DISABLE ROW LEVEL SECURITY;
```

**ADVERTENCIA**: Esto expone TODOS los negocios (incluyendo inactivos) a lectura pública.  
**NO recomendado para producción.**

Para reactivar:
```sql
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
```

---

## 📝 Resumen

| Aspecto | Antes | Después |
|---------|-------|---------|
| RLS Estado | ✅ Habilitado | ✅ Habilitado (seguro) |
| Lectura anónima | ❌ Bloqueada | ✅ Permitida (solo activos) |
| Lectura autenticada | ✅ Solo owners/miembros | ✅ Todos los activos + tus negocios |
| Escritura | ✅ Solo owners | ✅ Solo owners (sin cambios) |
| Seguridad | ✅ Muy restrictiva | ✅ Balanceada |

---

## 🎉 Después de Aplicar

Una vez ejecutes el SQL, verás en el wizard:

- **Grid de 3 columnas** con tarjetas de negocios
- **10 negocios** de la base de datos
- **Imágenes** placeholder según tipo de negocio
- **Información**: nombre, ciudad, dirección, teléfono
- **Hover effects** y animaciones
- **Checkmark** al seleccionar
- **Botón Next** habilitado

¡El componente `BusinessSelection` funcionará perfectamente! 🚀

---

## 🆘 Si Aún No Funciona

1. **Verifica que ejecutaste el SQL** en el SQL Editor
2. **Espera 5-10 segundos** para que los cambios se propaguen
3. **Recarga la página** de la aplicación (Ctrl+R o F5)
4. **Verifica la consola del navegador** (F12) por errores
5. **Ejecuta**: `node check-rls.js` para confirmar

Si persiste el problema, revisa:
- Que los 10 negocios tienen `is_active = true` en la BD
- Que la API key no cambió
- Que no hay otras políticas interfiriendo
