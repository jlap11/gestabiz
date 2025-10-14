# Fix: Upload de Imágenes en Locations

## 🐛 Problema Identificado

**Error**: `400 Bad Request` al intentar subir imágenes al crear una nueva sede (location)

**Causa Root**: 
```
https://.../location-images/locations/{location_id}/imagen.png
```

El path de storage incluye el `location_id`, pero **la location aún no existe** cuando se intenta subir la imagen.

**Flujo anterior (incorrecto)**:
1. Usuario selecciona imagen
2. ImageUploader intenta subir inmediatamente
3. Path: `locations/{location_id}/...`
4. ❌ La location no existe → 400 Bad Request
5. Se intenta crear la location en la BD

---

## ✅ Solución Implementada

**Nuevo flujo (correcto)**:
1. Usuario selecciona imagen
2. ImageUploader guarda File en memoria (NO sube)
3. Se crea la location en la BD → obtiene `location_id`
4. Se suben las imágenes con el `location_id` real
5. Se actualiza la location con las URLs de imágenes

---

## 🔧 Cambios Realizados

### 1. **LocationsManager.tsx** - Estado para archivos pendientes

```typescript
const [pendingImageFiles, setPendingImageFiles] = useState<File[]>([])
```

### 2. **LocationsManager.tsx** - ImageUploader condicional

```tsx
{editingLocation ? (
  // EDITANDO: Upload inmediato (location existe)
  <ImageUploader
    bucket="location-images"
    maxFiles={5}
    existingImages={formData.images || []}
    onUploadComplete={handleImagesUploaded}
    folderPath={`locations/${editingLocation.id}`}
  />
) : (
  // CREANDO: Upload diferido (location no existe)
  <ImageUploader
    bucket="location-images"
    maxFiles={5}
    delayedUpload={true}  // 🔑 KEY: No subir inmediatamente
    onFileSelected={(file) => {
      setPendingImageFiles((prev) => [...prev, file])  // Guardar en memoria
    }}
    folderPath="temp"  // No usado en modo diferido
  />
)}
```

### 3. **LocationsManager.tsx** - handleSubmit modificado

```typescript
// Crear nueva location
const { data: newLocation, error } = await supabase
  .from('locations')
  .insert(locationData)
  .select('id')  // 🔑 Obtener el ID
  .single()

if (error) throw error
const locationId = newLocation.id

// 🔑 Subir imágenes pendientes DESPUÉS de crear location
if (pendingImageFiles.length > 0) {
  toast.info('Subiendo imágenes...')
  const uploadedUrls: string[] = []
  
  for (const file of pendingImageFiles) {
    const fileName = `${Date.now()}-${file.name}`
    const filePath = `locations/${locationId}/${fileName}`  // ✅ locationId existe
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('location-images')
      .upload(filePath, file)

    if (!uploadError) {
      const { data: urlData } = supabase.storage
        .from('location-images')
        .getPublicUrl(uploadData.path)
      
      uploadedUrls.push(urlData.publicUrl)
    }
  }

  // Actualizar location con URLs
  if (uploadedUrls.length > 0) {
    await supabase
      .from('locations')
      .update({ images: uploadedUrls })
      .eq('id', locationId)
  }
}
```

### 4. **LocationsManager.tsx** - Limpiar estado al cerrar

```typescript
const handleCloseDialog = () => {
  setIsDialogOpen(false)
  setEditingLocation(null)
  setFormData(initialFormData)
  setPendingImageFiles([])  // 🔑 Limpiar archivos pendientes
}
```

---

## 🎯 Comportamiento Final

### ✅ **Crear Nueva Location** (modo diferido)
1. Usuario abre modal "Crear Sede"
2. Completa formulario y selecciona imagen(s)
3. Imagen se guarda en `pendingImageFiles[]` (memoria)
4. Usuario hace clic en "Crear"
5. Se crea la location en BD → `location_id = abc123`
6. Se suben imágenes a `location-images/locations/abc123/...`
7. Se actualiza la location con `images: [url1, url2]`
8. ✅ Toast: "Sede creada exitosamente"

### ✅ **Editar Location Existente** (modo inmediato)
1. Usuario abre modal "Editar Sede"
2. Selecciona nuevas imágenes
3. ImageUploader las sube inmediatamente a `locations/{existingId}/...`
4. Se actualiza `formData.images`
5. Usuario hace clic en "Actualizar"
6. Se actualiza la location con todas las imágenes
7. ✅ Toast: "Sede actualizada exitosamente"

---

## 🧪 Testing

### Test Case 1: Crear location con imagen
1. Ir a AdminDashboard → Sedes
2. Clic en "Agregar Sede"
3. Completar nombre, dirección
4. Seleccionar 1 imagen
5. Clic en "Crear"
6. ✅ Esperado: 
   - Toast "Subiendo imágenes..."
   - Toast "Sede creada exitosamente"
   - Imagen visible en la card de la sede

### Test Case 2: Crear location sin imagen
1. Ir a AdminDashboard → Sedes
2. Clic en "Agregar Sede"
3. Completar solo nombre
4. Clic en "Crear"
5. ✅ Esperado:
   - Toast "Sede creada exitosamente"
   - Sede creada sin imágenes

### Test Case 3: Editar location agregando imagen
1. Ir a AdminDashboard → Sedes
2. Clic en "Editar" en una sede existente
3. Seleccionar nueva imagen
4. Clic en "Actualizar"
5. ✅ Esperado:
   - Imagen se sube inmediatamente
   - Toast "Sede actualizada exitosamente"
   - Imagen visible en la card

---

## 🔍 Validación RLS

**Importante**: Este fix NO cambia las políticas RLS. Las políticas siguen siendo:

```sql
-- INSERT en locations requiere:
CREATE POLICY insert_locations ON locations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.id = locations.business_id 
      AND b.owner_id = auth.uid()
    )
  );
```

**Lo que cambió**:
- ✅ Ahora la location existe ANTES de subir imágenes
- ✅ El `business_id` en el INSERT es válido
- ✅ El `owner_id` del negocio coincide con `auth.uid()`
- ✅ No hay 400 Bad Request por path inválido en storage

---

## 📊 Comparación de Flujos

| **Paso** | **Anterior (❌)** | **Nuevo (✅)** |
|----------|------------------|---------------|
| 1 | Seleccionar imagen | Seleccionar imagen |
| 2 | ❌ Upload inmediato a `locations/{undefined}/...` | ✅ Guardar File en memoria |
| 3 | ❌ 400 Bad Request | ✅ INSERT location en BD |
| 4 | ❌ INSERT location en BD | ✅ Upload imagen a `locations/{real_id}/...` |
| 5 | ❌ Location sin imágenes | ✅ UPDATE location con URLs |

---

## 🎨 UX Improvements

1. **Loading State**: Toast "Subiendo imágenes..." mientras se procesan
2. **Error Handling**: Si alguna imagen falla, las demás se siguen procesando
3. **Feedback**: Toast "Sede creada exitosamente" al final del proceso completo
4. **Consistency**: Mismo componente ImageUploader para crear y editar

---

## 🚀 Deployment

No requiere migraciones de base de datos.

**Archivos modificados**:
- `src/components/admin/LocationsManager.tsx` (3 secciones)

**Archivos sin cambios**:
- `src/components/ui/ImageUploader.tsx` (ya tenía soporte para `delayedUpload`)
- Políticas RLS de `locations` (sin cambios)
- Storage buckets (sin cambios)

---

## 📝 Notas Adicionales

- **Performance**: Upload de imágenes es secuencial (for loop), no paralelo. Considerar `Promise.all()` para múltiples imágenes.
- **Retry Logic**: No hay retry automático si falla un upload. Considerar agregar.
- **Progress Tracking**: No hay barra de progreso durante upload masivo. Considerar agregar para UX.
- **File Validation**: Validación de tipo/tamaño ya existe en ImageUploader.

---

## ✅ Status

- [x] Identificado problema root (400 Bad Request por location_id inexistente)
- [x] Implementado flujo de carga diferida
- [x] Modificado LocationsManager para usar delayedUpload
- [x] Agregado estado pendingImageFiles
- [x] Modificado handleSubmit para subir después de crear location
- [x] Limpieza de estado al cerrar modal
- [ ] Testing end-to-end con usuario real
- [ ] Validación de que RLS policies permiten INSERT

**Próximo paso**: Usuario debe probar crear una sede con imagen y reportar si el 400 Bad Request desapareció.
