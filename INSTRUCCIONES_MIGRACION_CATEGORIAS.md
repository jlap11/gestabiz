# Instrucciones para Aplicar Migración de Categorías

## Problema Resuelto
El filtro de categorías en Client History estaba vacío porque:
- ❌ Buscaba categorías en `services.category` (siempre NULL)
- ✅ Ahora busca en `businesses.category` (tiene datos via FK a `business_categories`)

## Cambios Aplicados en el Código

### 1. TypeScript Types Actualizados ✅
- `src/hooks/useClientDashboard.ts`: Agregado `business.category_id` y `business.category` object
- `src/components/client/ClientHistory.tsx`: Agregado `business.category` en interface

### 2. Lógica de Filtrado Actualizada ✅
- Cambió de `apt.service?.category` a `apt.business?.category?.id`
- Extracción de categorías desde `apt.business.category` en lugar de `apt.service.category`

### 3. Migración SQL Creada ✅
**Archivo**: `supabase/migrations/20251201120000_add_business_category_to_rpc.sql`

## Aplicar la Migración (PENDIENTE)

### Opción 1: Supabase CLI (Recomendado si tienes CLI instalado)
```bash
# Instalar Supabase CLI si no lo tienes
npm install -g supabase

# Aplicar migración
npx supabase db push --dns-resolver https --yes
```

### Opción 2: Supabase Dashboard (Manual)
1. Ve a https://supabase.com/dashboard/project/YOUR_PROJECT_ID/editor
2. Abre el SQL Editor
3. Copia y pega el contenido de: `supabase/migrations/20251201120000_add_business_category_to_rpc.sql`
4. Ejecuta el SQL

### Opción 3: Usando la tarea de VS Code
Si tienes configurada la tarea "Supabase Push Migrations":
1. Presiona `Ctrl+Shift+P`
2. Escribe "Tasks: Run Task"
3. Selecciona "Supabase Push Migrations"

## Verificación Post-Migración

Después de aplicar la migración, verifica que funcione:

1. **Recarga la app** en el navegador
2. Ve a **Client History** (`/app/client/history`)
3. **Abre el filtro de Categorías**
4. Deberías ver opciones como:
   - ✅ Gastronomía
   - ✅ Salud y Bienestar
   - ✅ Belleza y Estética
   - etc.

## Qué Hace la Migración

La migración actualiza la función RPC `get_client_dashboard_data` para:

1. **Agregar JOIN** con `business_categories`:
   ```sql
   LEFT JOIN business_categories bc ON b.category_id = bc.id
   ```

2. **Incluir datos de categoría** en el objeto `business`:
   ```sql
   'category_id', b.category_id,
   'category', CASE 
     WHEN bc.id IS NOT NULL THEN jsonb_build_object(
       'id', bc.id,
       'name', bc.name,
       'slug', bc.slug,
       'icon_name', bc.icon_name
     )
     ELSE NULL
   END
   ```

## Rollback (Si algo sale mal)

Si necesitas revertir:

```sql
-- Restaurar función RPC anterior
-- (Ver archivo: supabase/migrations/20251201000000_base_schema_snapshot.sql)
```

## Notas Importantes

- ✅ **No hay cambios en la estructura de tablas** (solo actualización de RPC)
- ✅ **Retrocompatible**: No rompe código existente
- ✅ **Sin pérdida de datos**: Solo agrega campos adicionales
- ⚠️ **Requiere recarga del navegador** después de aplicar

## Contacto
Si tienes problemas aplicando la migración, reporta en el issue tracker.
