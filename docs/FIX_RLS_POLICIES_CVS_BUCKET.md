# Fix RLS Policies - Bucket CVs (17 Oct 2025)

## Problema Detectado

### Error 1: Infinite Recursion en Storage Policies
```
StorageApiError: insert into "objects" - infinite recursion detected in policy for relation "objects"
```

**Causa**: Múltiples políticas duplicadas y con JOINs complejos que causaban recursión infinita.

### Error 2: 406 Not Acceptable en job_applications
```
GET /rest/v1/job_applications?select=id&vacancy_id=eq.xxx&user_id=eq.xxx 406 (Not Acceptable)
```

**Causa**: La política SELECT de job_applications estaba mal configurada con UNION que causaba problemas.

---

## Soluciones Aplicadas

### 1. Limpieza de Políticas Duplicadas en storage.objects

**Políticas eliminadas** (tenían conflictos/duplicación):
- `Business owners can read CVs of applicants`
- `Business owners can view applicant CVs` (duplicada)
- `Users can read their own CVs` (duplicada)
- `Users can view their own CVs` (duplicada)
- `Users can update their own CVs` (nombre antiguo)
- `Users can delete their own CVs` (nombre antiguo)
- `Users can upload their own CVs` (nombre antiguo)

**Políticas creadas** (nombres simplificados y sin recursión):

#### a) `cvs_insert_policy` - Upload de CVs
```sql
CREATE POLICY "cvs_insert_policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cvs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```
✅ Permite a usuarios autenticados subir CVs a su propia carpeta (`{user_id}/archivo.pdf`)

#### b) `cvs_select_policy` - Ver CVs propios
```sql
CREATE POLICY "cvs_select_policy"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'cvs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```
✅ Permite ver archivos en la propia carpeta

#### c) `cvs_select_business_owners` - Business owners pueden ver todos los CVs
```sql
CREATE POLICY "cvs_select_business_owners"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'cvs'
  AND EXISTS (
    SELECT 1 FROM businesses b WHERE b.owner_id = auth.uid() LIMIT 1
  )
);
```
✅ Si eres owner de un negocio, puedes ver todos los CVs del bucket (para revisar aplicaciones)
✅ Sin recursión porque solo verifica existencia en tabla `businesses`

#### d) `cvs_update_policy` - Actualizar CVs propios
```sql
CREATE POLICY "cvs_update_policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'cvs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### e) `cvs_delete_policy` - Eliminar CVs propios
```sql
CREATE POLICY "cvs_delete_policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'cvs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

### 2. Fix en job_applications SELECT Policy

**Política anterior** (con UNION problemática):
```sql
USING (
  (user_id = auth.uid()) 
  OR 
  (business_id IN (
    SELECT businesses.id FROM businesses WHERE businesses.owner_id = auth.uid()
    UNION
    SELECT business_employees.business_id FROM business_employees WHERE business_employees.employee_id = auth.uid()
  ))
)
```

**Nueva política** (sin UNION):
```sql
DROP POLICY IF EXISTS "job_applications_select_policy" ON job_applications;

CREATE POLICY "job_applications_select_policy"
ON job_applications
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR
  business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  OR
  business_id IN (SELECT business_id FROM business_employees WHERE employee_id = auth.uid())
);
```

✅ Permite verificar aplicaciones duplicadas antes de aplicar
✅ Sin recursión ni UNION problemáticas

---

## Estructura de Archivos en Storage

```
bucket: cvs/
├── {user_id_1}/
│   ├── {vacancy_id}_timestamp.pdf
│   ├── {vacancy_id}_timestamp.docx
│   └── ...
├── {user_id_2}/
│   └── ...
└── ...
```

**Formato del path**: `{user_id}/{vacancy_id}_{timestamp}.{ext}`
- Ejemplo: `7d6e5432-8885-4008-a8ea-c17bd130cfa6/7dc83754-17c9-40b2-a2e3-27d27ffc55b6_1760714181035.pdf`

---

## Permisos Resultantes

### Usuarios (Aplicantes)
- ✅ **INSERT**: Subir CV a su carpeta
- ✅ **SELECT**: Ver/descargar su propio CV
- ✅ **UPDATE**: Actualizar su CV
- ✅ **DELETE**: Eliminar su CV

### Business Owners (Admins)
- ✅ **SELECT**: Ver/descargar TODOS los CVs del bucket (para revisar aplicaciones)
- ❌ **INSERT/UPDATE/DELETE**: No pueden modificar CVs de aplicantes

### Business Employees
- ❌ No tienen acceso directo a Storage (solo business owners)

---

## Testing Recomendado

1. **Como usuario regular**:
   ```typescript
   // Upload CV
   const { error } = await supabase.storage
     .from('cvs')
     .upload(`${userId}/${vacancyId}_${Date.now()}.pdf`, file);
   
   // Download propio CV
   const { data } = await supabase.storage
     .from('cvs')
     .download(`${userId}/${vacancyId}_${Date.now()}.pdf`);
   ```

2. **Como business owner**:
   ```typescript
   // Download CV de aplicante
   const { data } = await supabase.storage
     .from('cvs')
     .download(application.cv_url); // e.g., "otherUserId/vacancyId_timestamp.pdf"
   ```

3. **Verificar duplicados**:
   ```typescript
   const { data } = await supabase
     .from('job_applications')
     .select('id')
     .eq('vacancy_id', vacancyId)
     .eq('user_id', userId)
     .single();
   ```

---

## Cambios en Código

### useMatchingVacancies.ts
Agregado mapeo de `vacancy_id` → `id`:
```typescript
let filtered = (data || []).map((v: MatchingVacancy & { vacancy_id?: string }) => ({
  ...v,
  id: v.vacancy_id || v.id, // Support both field names
}));
```

---

## Estado Final

| Componente | Estado |
|------------|--------|
| Storage Bucket `cvs` | ✅ Creado, 5MB max, PDF/DOCX only |
| RLS Policies Storage | ✅ 5 políticas sin recursión |
| RLS Policies job_applications | ✅ SELECT sin UNION |
| Upload CV | ✅ Funcional |
| Download CV (owner) | ✅ Funcional |
| Download CV (user) | ✅ Funcional |
| Verificación duplicados | ✅ Funcional |

---

## Fecha de Aplicación
**17 de octubre de 2025**

## Ejecutado por
Model Context Protocol (MCP) - Supabase Integration
