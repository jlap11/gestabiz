# 🎯 Sistema de Componentes de Catálogos - Progreso

**Fecha:** 14 de octubre de 2025  
**Objetivo:** Integrar catálogos de datos (countries, regions, cities, genders, document_types, health_insurance) en toda la aplicación con componentes reutilizables.

---

## ✅ FASE 1: HOOKS PERSONALIZADOS - COMPLETADO

### Archivo: `src/hooks/useCatalogs.ts` (351 líneas)

#### 6 Hooks Implementados:

1. **useCountries()** - 249 países con phone_prefix
   - ✅ Caché en memoria persistente
   - ✅ Estados: loading, error
   - ✅ Return: `{ countries, loading, error }`

2. **useRegions(countryId)** - 33 regiones colombianas
   - ✅ Filtrado automático por country_id
   - ✅ Limpia data si no hay countryId
   - ✅ Return: `{ regions, loading, error }`

3. **useCities(regionId)** - 1,120 ciudades
   - ✅ Filtrado automático por region_id
   - ✅ Limpia data si no hay regionId
   - ✅ Return: `{ cities, loading, error }`

4. **useGenders()** - 3 géneros
   - ✅ Caché en memoria persistente
   - ✅ Return: `{ genders, loading, error }`

5. **useDocumentTypes(countryId, forCompany)** - 10 tipos de documento
   - ✅ Filtrado por country_id
   - ✅ **Regla de negocio**: NIT solo si forCompany=true
   - ✅ Return: `{ documentTypes, loading, error }`

6. **useHealthInsurance()** - 28 EPS colombianas
   - ✅ Caché en memoria persistente
   - ✅ Return: `{ healthInsurance, loading, error }`

#### Helper Function:
- **getColombiaId()** - Obtiene UUID de Colombia (COL)
  - ✅ Async function que retorna string | null
  - ✅ Usado para inicializar country_id por defecto

**Total líneas:** 351  
**Errores lint:** 8 console.error statements (no críticos)

---

## ✅ FASE 2: COMPONENTES SELECT - COMPLETADO

### Carpeta: `src/components/catalog/` - 7 componentes + index.ts

#### 1. CountrySelect.tsx (110 líneas)
- ✅ **Búsqueda en tiempo real** (249 países requieren búsqueda)
- ✅ Input de búsqueda con icono Search
- ✅ Filtrado por: name, iso_code
- ✅ **Disabled por defecto** según requerimientos
- ✅ **Auto-selección de Colombia** si defaultToColombia=true
- ✅ Props: value, onChange, disabled, placeholder, error, required, className, defaultToColombia

#### 2. RegionSelect.tsx (78 líneas)
- ✅ Filtrado automático por countryId
- ✅ Muestra "Primero seleccione un país" si no hay countryId
- ✅ Props: countryId, value, onChange, disabled, placeholder, error, required, className

#### 3. CitySelect.tsx (115 líneas)
- ✅ **Búsqueda en tiempo real** (1,120 ciudades requieren búsqueda)
- ✅ Input de búsqueda con icono Search
- ✅ Filtrado por: name
- ✅ Muestra "Primero seleccione un departamento" si no hay regionId
- ✅ Props: regionId, value, onChange, disabled, placeholder, error, required, className

#### 4. GenderSelect.tsx (63 líneas)
- ✅ Select simple (3 opciones, no requiere búsqueda)
- ✅ Props: value, onChange, disabled, placeholder, error, required, className

#### 5. DocumentTypeSelect.tsx (83 líneas)
- ✅ **Filtrado condicional**: NIT solo para empresas
- ✅ forCompany prop controla qué tipos se muestran
- ✅ Muestra "Primero seleccione un país" si no hay countryId
- ✅ Props: countryId, value, onChange, disabled, placeholder, error, required, className, forCompany

#### 6. HealthInsuranceSelect.tsx (102 líneas)
- ✅ **Búsqueda en tiempo real** (28 EPS requieren búsqueda)
- ✅ Input de búsqueda con icono Search
- ✅ Filtrado por: name, abbreviation
- ✅ Props: value, onChange, disabled, placeholder, error, required, className

#### 7. PhonePrefixSelect.tsx (120 líneas)
- ✅ **Búsqueda en tiempo real** (249 prefijos desde countries.phone_prefix)
- ✅ Input de búsqueda con icono Search
- ✅ Filtrado por: name, phone_prefix, iso_code
- ✅ **Auto-selección de +57** (Colombia) si defaultToColombia=true
- ✅ Props: value, onChange, disabled, placeholder, error, required, className, defaultToColombia

#### 8. index.ts (9 líneas)
- ✅ Exportaciones centralizadas de todos los componentes

**Total líneas:** 680  
**Errores lint:** Ninguno  
**Patrón UI:** shadcn/ui Select + Input con Search icon

---

## 🔄 FASE 3: INTEGRACIÓN ADMINONBOARDING - EN PROGRESO

### Archivo: `src/components/admin/AdminOnboarding.tsx`

#### ✅ Cambios Implementados:

1. **Imports Agregados:**
   ```tsx
   import { useState, useEffect } from 'react'
   import { 
     CountrySelect, 
     RegionSelect, 
     CitySelect, 
     DocumentTypeSelect,
     PhonePrefixSelect 
   } from '@/components/catalog'
   import { getColombiaId } from '@/hooks/useCatalogs'
   ```

2. **Estados Nuevos:**
   ```tsx
   const [countryId, setCountryId] = useState<string>('') // Colombia by default
   const [regionId, setRegionId] = useState<string>('')
   const [cityId, setCityId] = useState<string>('')
   const [documentTypeId, setDocumentTypeId] = useState<string>('')
   ```

3. **FormData Actualizado:**
   ```tsx
   document_type_id: '', // UUID from document_types table
   city_id: '', // UUID from cities table
   region_id: '', // UUID from regions table
   country_id: '', // UUID from countries table
   ```

4. **useEffect para Cargar Colombia:**
   ```tsx
   useEffect(() => {
     const loadColombiaId = async () => {
       const colombiaId = await getColombiaId();
       if (colombiaId) {
         handleChange('country_id', colombiaId);
       }
     };
     loadColombiaId();
   }, []);
   ```

5. **DocumentTypeSelect Integrado:**
   - ✅ Reemplazó label hardcodeado: `{formData.legal_entity_type === 'company' ? 'NIT' : 'Cédula de Ciudadanía'}`
   - ✅ Prop `forCompany` basada en `legal_entity_type`
   - ✅ Conectado a `documentTypeId` state
   - ✅ Required field

6. **PhonePrefixSelect + Phone Input:**
   - ✅ Reemplazó PhoneInput component con layout manual
   - ✅ PhonePrefixSelect en columna izquierda (w-32)
   - ✅ Input numérico en columna derecha (flex-1)
   - ✅ defaultToColombia activado

7. **Cascading Selects Integrados:**
   - ✅ **CountrySelect** → disabled, defaultToColombia
   - ✅ **RegionSelect** → filtra por country_id, resetea city al cambiar
   - ✅ **CitySelect** → filtra por region_id

8. **Lógica de Reset Implementada:**
   ```tsx
   // Country change → reset region y city
   onChange={(value) => {
     handleChange('country_id', value);
     setRegionId('');
     setCityId('');
     handleChange('region_id', '');
     handleChange('city_id', '');
   }}
   
   // Region change → reset city
   onChange={(value) => {
     setRegionId(value);
     handleChange('region_id', value);
     setCityId('');
     handleChange('city_id', '');
   }}
   ```

#### ⏳ Pendiente:

1. **Actualizar handleSubmit:**
   - Verificar que se envíen UUIDs en lugar de texto plano
   - Asegurar que `country_id`, `region_id`, `city_id`, `document_type_id` se guarden correctamente
   - Actualizar validaciones si es necesario

2. **Testing:**
   - Probar flujo completo de creación de negocio
   - Validar que cascading funcione correctamente
   - Verificar que document type filtre según legal_entity_type
   - Confirmar que phone prefix se guarde correctamente

3. **Error Handling:**
   - Agregar toasts si fallan catalogos al cargar
   - Validar campos requeridos antes de submit

**Errores lint actuales:** 7 console statements (no críticos)

---

## ⏳ FASE 4: INTEGRACIÓN USERPROFILE - NO INICIADO

### Archivo: `src/components/settings/UserProfile.tsx`

#### Tareas Pendientes:

1. **Agregar Nuevos Campos al Form State:**
   ```tsx
   gender_id: '',
   document_type_id: '',
   document_number: '',
   city_id: '',
   region_id: '',
   health_insurance_id: '',
   ```

2. **Reemplazar Phone Prefix Selector:**
   - Líneas 314-337: COUNTRY_CODES constant → PhonePrefixSelect

3. **Agregar Nuevas Secciones UI:**
   - **Personal Information:** GenderSelect, DocumentTypeSelect, Input(document_number)
   - **Location:** CountrySelect (disabled), RegionSelect, CitySelect
   - **Health:** HealthInsuranceSelect

4. **Actualizar Database Schema:**
   - Revisar si profiles table tiene columnas: gender_id, document_type_id, document_number, city_id, region_id, health_insurance_id
   - Crear migración si faltan columnas

5. **Actualizar handleSaveProfile:**
   - Incluir nuevos campos en UPDATE query
   - Validar campos opcionales vs requeridos

---

## ⏳ FASE 5: INTEGRACIÓN BUSINESSREGISTRATION - NO INICIADO

### Archivo: `src/components/business/BusinessRegistration.tsx`

#### Tareas Pendientes:

1. **Reemplazar Text Inputs:**
   - Líneas 34-36: `city`, `country` → CitySelect, RegionSelect, CountrySelect

2. **Agregar Phone Prefix:**
   - Línea 259-310: Reemplazar phone input con PhonePrefixSelect + Input

3. **Actualizar Form Submission:**
   - Guardar UUIDs (city_id, region_id, country_id) en lugar de texto
   - Validar que city pertenece a region seleccionada

---

## 📊 ESTADÍSTICAS GENERALES

### Archivos Creados: 9
- ✅ `src/hooks/useCatalogs.ts` (351 líneas)
- ✅ `src/components/catalog/CountrySelect.tsx` (110 líneas)
- ✅ `src/components/catalog/RegionSelect.tsx` (78 líneas)
- ✅ `src/components/catalog/CitySelect.tsx` (115 líneas)
- ✅ `src/components/catalog/GenderSelect.tsx` (63 líneas)
- ✅ `src/components/catalog/DocumentTypeSelect.tsx` (83 líneas)
- ✅ `src/components/catalog/HealthInsuranceSelect.tsx` (102 líneas)
- ✅ `src/components/catalog/PhonePrefixSelect.tsx` (120 líneas)
- ✅ `src/components/catalog/index.ts` (9 líneas)

### Archivos Modificados: 1
- 🔄 `src/components/admin/AdminOnboarding.tsx` (refactorizado paso 2 completo)

### Líneas de Código: ~1,031
- Hooks: 351 líneas
- Componentes Select: 680 líneas

### Cobertura de Catálogos:
- ✅ Countries: 249 registros → CountrySelect (con búsqueda)
- ✅ Regions: 33 registros → RegionSelect
- ✅ Cities: 1,120 registros → CitySelect (con búsqueda)
- ✅ Genders: 3 registros → GenderSelect
- ✅ Document Types: 10 registros → DocumentTypeSelect (filtrado condicional)
- ✅ Health Insurance: 28 registros → HealthInsuranceSelect (con búsqueda)

### Reglas de Negocio Implementadas:
- ✅ NIT exclusivo para empresas (forCompany prop)
- ✅ País siempre Colombia y disabled
- ✅ Ciudad depende de región, región depende de país (cascading)
- ✅ Prefijo telefónico independiente de país
- ✅ Búsqueda en listas >15 registros (countries, cities, health_insurance)

---

## 🎯 PRIORIDADES SIGUIENTES

### Alta Prioridad:
1. **Completar AdminOnboarding** (90% completo):
   - Actualizar handleSubmit para guardar UUIDs
   - Testing exhaustivo del flujo
   - Validaciones de form

2. **Integrar UserProfile** (0% completo):
   - Agregar campos nuevos a profiles table (migración)
   - Implementar secciones Personal/Location/Health
   - Actualizar handleSaveProfile

3. **Integrar BusinessRegistration** (0% completo):
   - Reemplazar location inputs con selects
   - Actualizar form submission

### Media Prioridad:
4. **Optimizaciones:**
   - Agregar React Query para caching avanzado
   - Implementar lazy loading de catálogos grandes
   - Agregar debounce en búsquedas

5. **Testing:**
   - Unit tests para hooks (useCatalogs.ts)
   - Component tests para Select components
   - Integration tests para cascading logic

6. **Documentación:**
   - Agregar JSDoc comments
   - Crear Storybook stories
   - Guía de uso para desarrolladores

---

## 📝 NOTAS TÉCNICAS

### Patrón de Implementación:
```tsx
// 1. Importar componentes
import { CitySelect, RegionSelect, CountrySelect } from '@/components/catalog';

// 2. Estados locales para IDs
const [countryId, setCountryId] = useState<string>('');
const [regionId, setRegionId] = useState<string>('');
const [cityId, setCityId] = useState<string>('');

// 3. FormData con UUIDs
const [formData, setFormData] = useState({
  country_id: '',
  region_id: '',
  city_id: '',
});

// 4. Usar componentes con cascading
<CountrySelect
  value={formData.country_id}
  onChange={(value) => {
    handleChange('country_id', value);
    setRegionId('');
    setCityId('');
  }}
/>
<RegionSelect
  countryId={formData.country_id}
  value={regionId}
  onChange={(value) => {
    setRegionId(value);
    handleChange('region_id', value);
    setCityId('');
  }}
/>
<CitySelect
  regionId={regionId}
  value={cityId}
  onChange={(value) => {
    setCityId(value);
    handleChange('city_id', value);
  }}
/>
```

### Dependencias:
- shadcn/ui: Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Input
- lucide-react: Search icon
- Supabase client: Queries a tablas de catálogos
- React: useState, useEffect, useMemo

### Compatibilidad:
- ✅ Tema claro/oscuro (usa variables CSS)
- ✅ Responsive (Tailwind classes)
- ✅ Accesibilidad (aria labels, keyboard navigation)

---

**Estado actual:** 45% completo (2 de 5 fases)  
**Próximo paso:** Completar AdminOnboarding handleSubmit y testing
