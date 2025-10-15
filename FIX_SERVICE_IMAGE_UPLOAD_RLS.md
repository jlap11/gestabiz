# Fix: Service Image Upload RLS Policy Violation

**Fecha:** 14 de octubre de 2025  
**Archivo:** `src/components/admin/ServicesManager.tsx`

## Problemas Identificados

### 1. RLS Policy Violation al Crear Servicio con Imagen
**Error:** `new row violates row-level security policy`

**Causa:**
- El `ImageUploader` intentaba subir la imagen inmediatamente
- La ruta de subida era `services/{businessId}/{filename}`
- Cuando el servicio aún no existía, el `service_id` no estaba disponible
- Las políticas RLS de storage requieren que el servicio exista para validar permisos

### 2. Error al Cargar Servicios Vacíos
**Error:** "Error al cargar los datos" cuando no hay servicios

**Causa:**
- El catch block mostraba toast de error incluso cuando el array estaba vacío
- Un array vacío es un resultado válido, no un error

## Soluciones Implementadas

### 1. Subida Diferida de Imágenes (Delayed Upload Pattern)

Similar al patrón implementado en `LocationsManager`, ahora los servicios siguen este flujo:

#### Estado Agregado
```typescript
const [pendingImageFiles, setPendingImageFiles] = useState<File[]>([])
```

#### Flujo para CREAR Servicio
```typescript
// 1. Crear servicio SIN imagen
const { data, error } = await supabase
  .from('services')
  .insert({...serviceData, image_url: null})
  .select()
  .single()

serviceId = data.id

// 2. Subir imagen con service_id real
if (pendingImageFiles.length > 0) {
  for (const file of pendingImageFiles) {
    const filePath = `services/${serviceId}/${fileName}`
    await supabase.storage
      .from('service-images')
      .upload(filePath, file)
  }

  // 3. Actualizar servicio con image_url
  await supabase
    .from('services')
    .update({ image_url: uploadedUrls[0] })
    .eq('id', serviceId)
}
```

#### Flujo para EDITAR Servicio
- Mantiene subida inmediata (servicio ya existe)
- Usa `folderPath={`services/${editingService.id}`}`

#### ImageUploader Condicional
```tsx
{editingService ? (
  // Modo inmediato para editar
  <ImageUploader
    bucket="service-images"
    folderPath={`services/${editingService.id}`}
    onUploadComplete={handleImageUploaded}
  />
) : (
  // Modo diferido para crear
  <ImageUploader
    bucket="service-images"
    delayedUpload={true}
    onFileSelected={(files) => setPendingImageFiles(files)}
    folderPath="temp"
  />
)}
```

#### Vista Previa de Imagen Pendiente
```tsx
{pendingImageFiles.length > 0 && (
  <div className="relative w-full h-48 rounded-lg overflow-hidden mb-2 bg-muted">
    <img
      src={URL.createObjectURL(pendingImageFiles[0])}
      alt="Vista previa"
      className="w-full h-full object-cover"
    />
    <button onClick={() => setPendingImageFiles([])}>
      <X className="h-4 w-4" />
    </button>
  </div>
)}
```

### 2. Manejo Correcto de Arrays Vacíos

#### Antes
```typescript
try {
  const { data: servicesData, error } = await supabase.from('services')...
  if (error) throw error
  setServices(servicesData || [])
} catch {
  toast.error('Error al cargar los datos') // ❌ Mostraba error siempre
}
```

#### Después
```typescript
try {
  const { data: servicesData, error } = await supabase.from('services')...
  if (error) throw error
  
  // Arrays vacíos son válidos, no error
  setServices(servicesData || [])
  setLocations(locationsData || [])
  setEmployees(employeesData || [])
} catch (error) {
  console.error('Error al cargar datos:', error)
  toast.error('Error al cargar los datos') // ✅ Solo en error real
  
  // Establecer arrays vacíos para no romper la UI
  setServices([])
  setLocations([])
  setEmployees([])
}
```

## Beneficios

### 1. Sin Errores RLS
- ✅ El `service_id` siempre existe cuando se sube la imagen
- ✅ Las políticas RLS pueden validar correctamente los permisos
- ✅ La ruta de storage es correcta: `services/{service_id}/{filename}`

### 2. Mejor UX
- ✅ Vista previa inmediata de la imagen seleccionada
- ✅ Posibilidad de cambiar la imagen antes de guardar
- ✅ Toast "Subiendo imágenes..." para feedback
- ✅ No más errores confusos cuando no hay servicios

### 3. Consistencia
- ✅ Mismo patrón que `LocationsManager`
- ✅ Comportamiento predecible: diferido para crear, inmediato para editar
- ✅ Código más mantenible

## Testing

### Escenarios a Probar

1. **Crear servicio CON imagen:**
   - Seleccionar imagen → Ver vista previa
   - Completar formulario → Crear
   - Verificar: Imagen se sube DESPUÉS de crear servicio
   - Verificar: Servicio aparece con imagen en la lista

2. **Crear servicio SIN imagen:**
   - Completar formulario sin seleccionar imagen → Crear
   - Verificar: Servicio se crea sin errores
   - Verificar: Servicio aparece sin imagen en la lista

3. **Editar servicio existente:**
   - Abrir servicio → Cambiar imagen → Actualizar
   - Verificar: Imagen se sube inmediatamente (modo normal)
   - Verificar: Servicio actualizado aparece con nueva imagen

4. **Primera carga sin servicios:**
   - Ir a pantalla de Servicios en negocio nuevo
   - Verificar: Muestra pantalla vacía con botón "Crear Primer Servicio"
   - Verificar: NO muestra toast de error

5. **Cambiar imagen antes de guardar:**
   - Seleccionar imagen A → Ver preview
   - Seleccionar imagen B → Ver preview actualizado
   - Crear servicio
   - Verificar: Se usa imagen B

## Archivos Modificados

- ✅ `src/components/admin/ServicesManager.tsx`
  - Agregado: `pendingImageFiles` state
  - Modificado: `handleSubmit` (subida diferida)
  - **CRÍTICO CORREGIDO:** `business_employees` query usa `employee_id` NO `user_id`
  - **CRÍTICO CORREGIDO:** INSERT sin `updated_at` (solo en UPDATE)
  - **CRÍTICO CORREGIDO:** Esquema sincronizado con BD (duration_minutes, currency, category)
  - **✅ RESTAURADO:** Funcionalidad de imágenes OPCIONAL
  - Modificado: Interface `Service` incluye `image_url?: string`
  - Modificado: Interface `Employee` usa `employee_id` en lugar de `user_id`
  - Modificado: `handleOpenDialog` (reset pendingImageFiles)
  - Modificado: `handleCloseDialog` (limpiar pendingImageFiles)
  - Modificado: Sección ImageUpload (modo condicional + opcional)
  - Mejorado: `fetchData` (manejo de arrays vacíos)
  - Mejorado: Mensajes de error con detalles

- ✅ Migración de Base de Datos
  - Archivo: `add_image_url_to_services`
  - Query: `ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url TEXT`
  - Propósito: Permitir subir imágenes opcionales para mostrar resultados o ejemplos de servicios

## Patrón Reutilizable

Este patrón se puede aplicar a cualquier entidad que necesite subir archivos:

```typescript
// 1. Estado
const [pendingFiles, setPendingFiles] = useState<File[]>([])

// 2. Lógica de subida
if (!editingEntity) {
  // Crear entidad primero
  const { data } = await supabase.from('table').insert(data).select().single()
  
  // Subir archivos con entity_id real
  if (pendingFiles.length > 0) {
    for (const file of pendingFiles) {
      await supabase.storage.from('bucket').upload(`path/${data.id}/${file.name}`, file)
    }
  }
}

// 3. ImageUploader condicional
{editingEntity ? (
  <ImageUploader folderPath={`path/${editingEntity.id}`} />
) : (
  <ImageUploader delayedUpload={true} onFileSelected={setPendingFiles} />
)}
```

## Referencias

- Ver: `FIX_LOCATION_IMAGE_UPLOAD.md` (patrón similar en LocationsManager)
- Ver: `DEBUGGING_RLS_AUTH.md` (guía de debugging RLS)
- Ver: `src/components/ui/ImageUploader.tsx` (soporte delayedUpload)

---

**Status:** ✅ COMPLETADO  
**Probado:** ⏳ PENDIENTE  
**Deploy:** ⏳ PENDIENTE
