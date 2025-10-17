# Testing CV Upload - Troubleshooting (17 Oct 2025)

## Cambios Aplicados

### 1. Política INSERT simplificada
**Antes** (con `storage.foldername()`):
```sql
WITH CHECK (
  bucket_id = 'cvs'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
```

**Ahora** (con LIKE pattern):
```sql
WITH CHECK (
  bucket_id = 'cvs'
  AND auth.uid() IS NOT NULL
  AND name LIKE (auth.uid()::text || '/%')
)
```

✅ Evita posible recursión con `storage.foldername()`
✅ Valida que el path comience con `{user_id}/`

### 2. Política SELECT para business owners eliminada temporalmente
- Removida `cvs_select_business_owners` para aislar el problema
- Por ahora, business owners solo pueden ver sus propios CVs
- **TODO**: Reactivar después de resolver recursión

---

## Testing Steps

### Test 1: Upload CV como usuario regular
1. Navegar a "Buscar Vacantes"
2. Aplicar a una vacante
3. Adjuntar CV (PDF o DOCX, max 5MB)
4. Click "Enviar Aplicación"

**Expected**: ✅ Upload exitoso, aplicación creada

**If Error persists**: El problema es más profundo en Supabase Storage RLS

### Test 2: Verificar path del archivo
En consola del navegador después de upload exitoso:
```javascript
// El path debería ser: {user_id}/{vacancy_id}_{timestamp}.pdf
console.log('CV Path:', application.cv_url);
// Ejemplo: "7d6e5432-8885-4008-a8ea-c17bd130cfa6/7dc83754-17c9-40b2-a2e3-27d27ffc55b6_1760714401697.pdf"
```

### Test 3: Download CV como usuario
```javascript
const { data, error } = await supabase.storage
  .from('cvs')
  .download('7d6e5432-8885-4008-a8ea-c17bd130cfa6/..._..._.pdf');
```

**Expected**: ✅ Descarga exitosa

---

## Si el Error Persiste

### Opción A: Desactivar RLS temporalmente para bucket cvs
```sql
-- ⚠️ SOLO PARA TESTING - NO EN PRODUCCIÓN
UPDATE storage.buckets 
SET public = true 
WHERE id = 'cvs';
```

### Opción B: Crear bucket nuevo con políticas desde cero
```sql
-- Eliminar bucket problemático
DELETE FROM storage.buckets WHERE id = 'cvs';

-- Recrear
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cvs',
  'cvs', 
  false, 
  5242880,
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Aplicar políticas una por una y testear cada una
```

### Opción C: Usar función auxiliar sin RLS
```sql
-- Crear función SECURITY DEFINER que bypass RLS
CREATE OR REPLACE FUNCTION upload_cv(
  p_user_id UUID,
  p_file_path TEXT,
  p_file_data BYTEA
)
RETURNS TEXT
SECURITY DEFINER
AS $$
BEGIN
  -- Upload bypassing RLS
  PERFORM storage.upload(p_file_path, p_file_data, 'cvs');
  RETURN p_file_path;
END;
$$ LANGUAGE plpgsql;
```

---

## Errores Conocidos

### Error actual
```
StorageApiError: insert into "objects" - infinite recursion detected in policy for relation "objects"
```

### Posibles causas
1. ✅ **DESCARTADO**: Políticas duplicadas (ya eliminadas)
2. ✅ **DESCARTADO**: Subquery complejo en business owners policy (ya eliminada)
3. ✅ **DESCARTADO**: `storage.foldername()` causando recursión (reemplazado con LIKE)
4. ⏳ **PENDIENTE**: Conflicto con otras políticas de storage.objects
5. ⏳ **PENDIENTE**: Bug en Supabase Storage RLS engine
6. ⏳ **PENDIENTE**: Función `auth.uid()` evaluándose múltiples veces

---

## Estado Actual

| Componente | Estado |
|------------|--------|
| Bucket cvs | ✅ Creado |
| RLS Policies | ⚠️ INSERT simplificada, testing needed |
| Upload logic | ✅ Code ready |
| Download logic | ✅ Code ready |
| Business owner access | ❌ Temporalmente desactivado |

---

## Next Actions

1. **AHORA**: Recargar página y testear upload
2. **Si funciona**: Reactivar política business owners con approach diferente
3. **Si falla**: Considerar Opción A/B/C arriba

---

**Fecha**: 17 de octubre de 2025  
**Status**: 🔴 Troubleshooting recursión infinita en RLS
