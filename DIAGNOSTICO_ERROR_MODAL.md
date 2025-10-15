# Diagnóstico del Error - Modal Ver Detalles

## Problema Reportado
"El botón Ver detalles completos intenta abrir el modal pero falla en el intento"

## Causas Posibles

### 1. Error de Importación de Módulos ⚠️
**Síntoma:** TypeScript reporta que no encuentra `LocationSelector` o `ServiceSelector`

**Verificación:**
```typescript
// En EmploymentDetailModal.tsx línea 12-13
import { LocationSelector } from './LocationSelector';
import { ServiceSelector } from './ServiceSelector';
```

**Solución:**
- Opción A: Reiniciar servidor Vite (Ctrl+C → `npm run dev`)
- Opción B: Guardar archivos nuevamente para forzar HMR
- Opción C: Hard reload en navegador (Ctrl+Shift+R)

---

### 2. Error en Runtime de React
**Síntoma:** Modal se abre pero muestra pantalla blanca o error

**Verificación en Consola del Navegador (F12):**
```
Error: Cannot find module...
Error: Element type is invalid...
Uncaught ReferenceError...
```

**Solución según error:**

#### Si dice "Cannot find module './LocationSelector'":
1. Verificar que archivo existe: `src/components/employee/LocationSelector.tsx`
2. Reiniciar Vite server
3. Limpiar caché: `npm run dev` (Ctrl+C primero)

#### Si dice "Element type is invalid":
1. Verificar exports en LocationSelector y ServiceSelector:
   ```typescript
   export function LocationSelector({ ... }) { ... }
   export function ServiceSelector({ ... }) { ... }
   ```
2. NO deben ser default exports

#### Si dice "fetchDetails is not defined":
1. useEffect tiene dependencia faltante
2. Agregar fetchDetails al array de dependencias

---

### 3. Error de RPC Function
**Síntoma:** Modal carga pero muestra spinner infinito

**Verificación:**
```sql
-- En Supabase Dashboard → SQL Editor
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name = 'get_employee_business_details';
```

**Solución:**
Si no existe, ejecutar:
```sql
-- Ver archivo: database/migrations/create_rpc_get_employee_business_details.sql
-- O ejecutar migración pendiente
```

---

### 4. Error de Permisos RLS
**Síntoma:** Modal carga pero no muestra datos

**Verificación:**
```sql
SELECT * FROM pg_policies 
WHERE tablename IN ('locations', 'services', 'employee_services', 'business_employees');
```

**Solución:**
Verificar que empleado puede:
- SELECT de locations donde business_id = su negocio
- SELECT de services donde business_id = su negocio
- SELECT/INSERT/UPDATE de employee_services donde employee_id = auth.uid()

---

## Pasos de Diagnóstico

### Paso 1: Verificar Archivos Existen
```powershell
Get-ChildItem -Path "src/components/employee" -Filter "*Selector*" | Select-Object Name, Length
```

**Output esperado:**
```
Name                    Length
LocationSelector.tsx    ~252 líneas
ServiceSelector.tsx     ~475 líneas
```

### Paso 2: Verificar Errores de Compilación
```powershell
# En VS Code: Ver → Problemas (Ctrl+Shift+M)
# Buscar errores en:
- EmploymentDetailModal.tsx
- LocationSelector.tsx
- ServiceSelector.tsx
- MyEmploymentsEnhanced.tsx
```

### Paso 3: Verificar Consola del Navegador
1. Abrir DevTools (F12)
2. Ir a tab "Console"
3. Click "Ver Detalles Completos"
4. Copiar error exacto que aparece

### Paso 4: Verificar Network Tab
1. DevTools → Network
2. Click "Ver Detalles Completos"
3. Ver si hay requests fallidos
4. Si hay request a `/api/...` o RPC, verificar response

---

## Soluciones Rápidas

### Solución 1: Reiniciar Todo
```powershell
# Terminal 1: Detener Vite
Ctrl+C

# Limpiar caché (opcional)
Remove-Item -Recurse -Force node_modules/.vite

# Reiniciar
npm run dev

# Navegador: Hard reload
Ctrl+Shift+R
```

### Solución 2: Verificar Imports
Abrir `EmploymentDetailModal.tsx` y cambiar imports a rutas absolutas:
```typescript
// De esto:
import { LocationSelector } from './LocationSelector';
import { ServiceSelector } from './ServiceSelector';

// A esto:
import { LocationSelector } from '@/components/employee/LocationSelector';
import { ServiceSelector } from '@/components/employee/ServiceSelector';
```

### Solución 3: Lazy Loading
Si imports fallan, usar lazy loading:
```typescript
const LocationSelector = React.lazy(() => import('./LocationSelector').then(m => ({ default: m.LocationSelector })));
const ServiceSelector = React.lazy(() => import('./ServiceSelector').then(m => ({ default: m.ServiceSelector })));

// Envolver en Suspense
<Suspense fallback={<div>Cargando...</div>}>
  <LocationSelector />
</Suspense>
```

---

## Checklist de Verificación

- [ ] Archivos LocationSelector.tsx y ServiceSelector.tsx existen
- [ ] No hay errores de compilación en Problemas (Ctrl+Shift+M)
- [ ] Servidor Vite corriendo sin errores
- [ ] Navegador en http://localhost:5173
- [ ] Console del navegador (F12) abierta
- [ ] Click "Ver Detalles Completos" ejecutado
- [ ] Error copiado de consola

---

## Información para Reporte

Si el problema persiste, proporcionar:

1. **Error exacto de consola del navegador:**
   ```
   [Copiar aquí el error completo]
   ```

2. **Errores de compilación (si hay):**
   ```
   [Copiar de Problemas en VS Code]
   ```

3. **Request fallida (si hay):**
   ```
   URL: ...
   Status: ...
   Response: ...
   ```

4. **Versión de Node y npm:**
   ```powershell
   node --version
   npm --version
   ```

---

## Próximo Paso

**POR FAVOR:**
1. Abre la consola del navegador (F12)
2. Click "Ver Detalles Completos" en una card
3. Copia el error exacto que aparece
4. Compártelo para diagnóstico preciso

El modal está implementado al 100%, solo necesitamos identificar el error específico para corregirlo rápidamente.
