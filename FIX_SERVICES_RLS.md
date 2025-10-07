# 🔧 SOLUCIÓN: Servicios No Se Muestran en el Wizard

## 🎯 Problema Identificado

**La tabla `services` tiene políticas RLS que bloquean el acceso público.**

### Diagnóstico:
- ✅ Hay 10 servicios en la base de datos con `is_active = true`
- ✅ Con `SERVICE_ROLE` key se pueden ver todos los servicios
- ❌ Con `ANON` key (usuarios no autenticados) no se puede ver ningún servicio
- ❌ El componente `ServiceSelection` no puede cargar servicios

**Query del componente:**
```typescript
const { data, error } = await supabase
  .from('services')
  .select('*')
  .eq('business_id', businessId);
```

**Política actual problemática:**
```sql
CREATE POLICY sel_services ON public.services
  FOR SELECT USING (
    is_business_owner(services.business_id) OR is_business_member(services.business_id)
  );
```

Esta política **requiere autenticación** y que seas owner/miembro del negocio.

---

## ✅ SOLUCIÓN: Ejecutar SQL en Supabase Dashboard

### Paso 1: Ir al SQL Editor

Abre este link:
```
https://supabase.com/dashboard/project/dkancockzvcqorqbwtyh/sql/new
```

### Paso 2: Copiar y Pegar Este SQL

```sql
-- ============================================================================
-- FIX: Permitir lectura pública de servicios activos
-- ============================================================================

-- 1. Asegurar que RLS está habilitado (mantener seguridad)
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas anteriores conflictivas
DROP POLICY IF EXISTS sel_services ON public.services;
DROP POLICY IF EXISTS all_services_owner ON public.services;
DROP POLICY IF EXISTS "Service access" ON public.services;
DROP POLICY IF EXISTS "public_read_active_services" ON public.services;
DROP POLICY IF EXISTS "Clients can read active services" ON public.services;
DROP POLICY IF EXISTS "Employees can read services" ON public.services;

-- 3. Crear política que permite lectura pública de servicios activos
CREATE POLICY "public_read_active_services" ON public.services
  FOR SELECT
  TO public
  USING (is_active = true);

-- 4. Crear política para que owners puedan ver/gestionar todos sus servicios
CREATE POLICY "owners_manage_services" ON public.services
  FOR ALL
  TO authenticated
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Nota: 
-- - Política 1: Permite a TODOS ver servicios activos (necesario para wizard)
-- - Política 2: Permite a OWNERS gestionar (CRUD) todos sus servicios
-- - Servicios inactivos solo visibles para owners
```

### Paso 3: Ejecutar

1. Click en **"RUN"** o presiona `Ctrl+Enter`
2. Deberías ver: "Success. No rows returned"

---

## 📊 Qué Hace Esta Solución

### Política 1: Lectura Pública
```sql
CREATE POLICY "public_read_active_services" ON public.services
  FOR SELECT
  TO public
  USING (is_active = true);
```

**Permite:**
- ✅ Usuarios **anónimos** pueden ver servicios activos
- ✅ Usuarios **autenticados** pueden ver servicios activos
- ✅ Wizard puede mostrar servicios al crear cita

**Bloquea:**
- ❌ Servicios con `is_active = false` permanecen ocultos

### Política 2: Gestión por Owners
```sql
CREATE POLICY "owners_manage_services" ON public.services
  FOR ALL
  TO authenticated
  USING (business_id IN (...))
```

**Permite a owners:**
- ✅ Ver **TODOS** sus servicios (activos e inactivos)
- ✅ Crear nuevos servicios
- ✅ Actualizar servicios existentes
- ✅ Eliminar servicios

---

## 🔍 Estructura de la Tabla Services

```sql
CREATE TABLE public.services (
    id UUID PRIMARY KEY,
    business_id UUID REFERENCES businesses(id),
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'MXN',
    category TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

**Campos clave:**
- `business_id`: ID del negocio al que pertenece
- `is_active`: Controla visibilidad pública
- `price`: Precio del servicio
- `duration_minutes`: Duración en minutos

---

## 🧪 Verificación

### Método 1: Script de Verificación

```powershell
node diagnose-services.js
```

**Resultado esperado:**
```
✅ Total servicios encontrados: 10
✅ Servicios accesibles con ANON key: 10
   - Masaje Relajante ($800)
   - Facial Hidratante ($650)
   - Manicure Completo ($350)
   ...
```

### Método 2: Probar en la Aplicación

1. **Inicia el servidor:**
   ```powershell
   npm run dev
   ```

2. **Abre:** `http://localhost:5173`

3. **En el wizard:**
   - **Paso 0**: Selecciona un negocio ✅
   - **Paso 1**: **Deberías ver el grid con los servicios** ✅

**Lo que verás:**
- Grid de tarjetas con servicios
- Imagen placeholder según tipo de servicio
- Nombre, descripción, duración y precio
- Badge "HOT" en servicios populares (si aplica)
- Hover effects y animaciones
- Checkmark al seleccionar

---

## 📋 Resumen de Reglas RLS

### Tabla: `services`

| Operación | Usuario Anónimo | Usuario Autenticado | Owner del Negocio |
|-----------|-----------------|---------------------|-------------------|
| **SELECT** activos | ✅ Sí | ✅ Sí | ✅ Sí |
| **SELECT** inactivos | ❌ No | ❌ No | ✅ Sí |
| **INSERT** | ❌ No | ❌ No | ✅ Sí |
| **UPDATE** | ❌ No | ❌ No | ✅ Sí |
| **DELETE** | ❌ No | ❌ No | ✅ Sí |

---

## 🔐 Seguridad Mantenida

✅ **Solo servicios activos** son visibles públicamente  
✅ **Servicios inactivos** permanecen ocultos del público  
✅ **Solo owners** pueden modificar/eliminar servicios  
✅ **Precios y datos sensibles** protegidos según roles  

---

## 🎨 Flujo Completo del Wizard (Después del Fix)

```
Paso 0: Selección de Negocio
   ↓ (Selecciona "Spa Relax María")
   
Paso 1: Selección de Servicio ✨ AQUÍ SE VERÁN LOS SERVICIOS
   ↓ Grid mostrando:
   - Masaje Relajante ($800) ✅
   - Facial Hidratante ($650) ✅
   - Manicure Completo ($350) ✅
   ↓ (Selecciona "Masaje Relajante")
   
Paso 2: Fecha y Hora
   ↓ (Selecciona fecha y slot de tiempo)
   
Paso 3: Confirmación
   ↓ (Revisa y confirma)
   
Paso 4: ¡Éxito! 🎉
```

---

## 🆘 Si los Servicios Aún No Aparecen

### 1. Verifica que ejecutaste el SQL
- Ve al SQL Editor de Supabase
- Ejecuta el SQL proporcionado arriba
- Confirma "Success" en la respuesta

### 2. Verifica que hay servicios activos
```sql
SELECT id, name, business_id, is_active 
FROM services 
WHERE is_active = true;
```

### 3. Verifica la consola del navegador
- Presiona `F12`
- Ve a la pestaña **Console**
- Busca errores relacionados con Supabase o servicios

### 4. Recarga la página
- Presiona `Ctrl+R` o `F5`
- Espera 5-10 segundos para que se apliquen los cambios de RLS

### 5. Verifica el business_id
- Asegúrate de que el negocio seleccionado en Paso 0 tenga servicios asociados
- Ejecuta:
  ```sql
  SELECT COUNT(*) FROM services WHERE business_id = 'tu-business-id' AND is_active = true;
  ```

---

## 🎯 Siguiente Problema Potencial

Después de arreglar `services`, es posible que también necesites arreglar RLS para:

- **`locations`**: Si usas ubicaciones múltiples
- **`appointments`**: Para que clientes vean sus citas
- **`notifications`**: Para envío de recordatorios

¿Necesitas que revise alguna de estas tablas ahora? 🚀

---

## 📝 Archivos Relacionados

- **Componente**: `src/components/appointments/wizard-steps/ServiceSelection.tsx`
- **Schema**: `database/schema.sql` (línea 93-105)
- **Políticas**: `database/rls-policies.sql` (línea 100-105)
- **Tipos**: `src/types/types.ts` (interface Service)

---

**Estado Actual:**
- ✅ Negocios visibles (resuelto anteriormente)
- 🔄 Servicios bloqueados (resolver con este SQL)
- ⏳ Próximo: Fecha/Hora, Confirmación, Appointments

¡Ejecuta el SQL y los servicios aparecerán en el wizard! 🎉
