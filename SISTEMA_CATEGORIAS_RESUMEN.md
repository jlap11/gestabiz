# Sistema de Categorías y Subcategorías - AppointSync Pro

## 📋 Resumen

Sistema jerárquico de categorización con:
- **15 categorías principales** organizadas por industria
- **~60 subcategorías** distribuidas (máximo 6 por categoría principal)
- **Máximo 3 subcategorías por negocio** (validado por trigger)

## 🏗️ Estructura de Base de Datos

### Tabla: `business_categories`

```sql
CREATE TABLE business_categories (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE,
  slug VARCHAR(100) UNIQUE,
  description TEXT,
  icon_name VARCHAR(50), -- Lucide icon name
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER,
  parent_id UUID REFERENCES business_categories(id), -- NULL = principal
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

**Jerarquía:**
- `parent_id = NULL` → Categoría principal
- `parent_id = UUID` → Subcategoría

### Tabla: `business_subcategories` (N:M)

```sql
CREATE TABLE business_subcategories (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  subcategory_id UUID REFERENCES business_categories(id),
  created_at TIMESTAMPTZ,
  UNIQUE(business_id, subcategory_id)
);
```

**Trigger de validación:**
```sql
CREATE TRIGGER trigger_check_max_subcategories
BEFORE INSERT ON business_subcategories
-- Valida máximo 3 subcategorías por negocio
```

### Tabla: `businesses` (actualizada)

```sql
ALTER TABLE businesses
ADD COLUMN category_id UUID REFERENCES business_categories(id);
-- Categoría PRINCIPAL del negocio
```

## 📊 Categorías Principales (15)

| Sort | Categoría | Slug | Icon | Subcategorías |
|------|-----------|------|------|---------------|
| 10 | Salud y Bienestar | `salud-bienestar` | Heart | 6 |
| 20 | Belleza y Estética | `belleza-estetica` | Sparkles | 6 |
| 30 | Deportes y Fitness | `deportes-fitness` | Dumbbell | 6 |
| 40 | Educación y Formación | `educacion-formacion` | BookOpen | 6 |
| 50 | Servicios Profesionales | `servicios-profesionales` | Briefcase | 6 |
| 60 | Hogar y Reparaciones | `hogar-reparaciones` | Home | 6 |
| 70 | Automotriz | `automotriz` | Car | 4 |
| 80 | Gastronomía | `gastronomia` | Utensils | 4 |
| 90 | Eventos y Entretenimiento | `eventos-entretenimiento` | Calendar | 5 |
| 100 | Mascotas | `mascotas` | PawPrint | 4 |
| 110 | Tecnología | `tecnologia` | Laptop | 4 |
| 120 | Arte y Creatividad | `arte-creatividad` | Palette | 3 |
| 130 | Limpieza | `limpieza` | Sparkles | 0 (principal pura) |
| 140 | Construcción | `construccion` | HardHat | 3 |
| 9999 | Otros Servicios | `otros-servicios` | MoreHorizontal | 0 |

## 🔍 Ejemplos de Subcategorías

### Salud y Bienestar (6)
- Medicina General (`medicina-general`) - Stethoscope
- Odontología (`odontologia`) - Smile
- Fisioterapia (`fisioterapia`) - Activity
- Psicología (`psicologia`) - Brain
- Nutrición (`nutricion`) - Apple
- Medicina Alternativa (`medicina-alternativa`) - Leaf

### Belleza y Estética (6)
- Peluquería y Barbería (`peluqueria-barberia`) - Scissors
- Spa y Masajes (`spa-masajes`) - Waves
- Manicure y Pedicure (`manicure-pedicure`) - Hand
- Tratamientos Faciales (`tratamientos-faciales`) - Sparkles
- Maquillaje (`maquillaje`) - Palette
- Depilación (`depilacion`) - Zap

### Deportes y Fitness (6)
- Gimnasio (`gimnasio`) - Dumbbell
- Entrenamiento Personal (`entrenamiento-personal`) - Target
- Yoga y Pilates (`yoga-pilates`) - Users
- Artes Marciales (`artes-marciales`) - Shield
- Natación (`natacion`) - Droplet
- Danza (`danza`) - Music

## 💻 Implementación TypeScript

### Interfaces Actualizadas

```typescript
// src/types/types.ts

export interface BusinessCategory {
  id: string
  name: string
  slug: string
  description?: string
  icon_name?: string
  is_active: boolean
  sort_order: number
  parent_id?: string | null // NULL = principal
  created_at: string
  updated_at: string
  
  // Computed (frontend only)
  subcategories?: BusinessCategory[] // Si es principal
  parent?: BusinessCategory // Si es subcategoría
}

export interface BusinessSubcategory {
  id: string
  created_at: string
  business_id: string
  subcategory_id: string
  subcategory?: BusinessCategory // Populated en joins
}

export interface Business {
  // ... campos existentes
  category_id?: string // FK a categoría PRINCIPAL
  
  // Computed (frontend only)
  category?: BusinessCategory // Principal poblada
  subcategories?: BusinessSubcategory[] // Máximo 3
}
```

### Hooks Disponibles

#### 1. `useBusinessCategories()`

```typescript
const { 
  mainCategories,    // Solo principales (parent_id = NULL)
  categories,        // Principales con subcategories[] pobladas
  allCategories,     // Todas en lista plana
  isLoading, 
  error, 
  refetch 
} = useBusinessCategories()
```

**Retorna:**
- `mainCategories`: Categorías principales (15 items)
- `categories`: Principales con `subcategories[]` anidadas
- `allCategories`: Todas las categorías planas (~75 items)

#### 2. `useBusinessSubcategories(businessId)`

```typescript
const { 
  subcategories,      // Subcategorías del negocio
  isLoading, 
  error,
  addSubcategory,     // (subcategoryId) => Promise<boolean>
  removeSubcategory,  // (subcategoryId) => Promise<boolean>
  refetch 
} = useBusinessSubcategories(businessId)
```

**Funcionalidades:**
- Cargar subcategorías del negocio
- Agregar subcategoría (valida máximo 3)
- Eliminar subcategoría
- Auto-refetch después de cambios

#### 3. `useSubcategoriesByParent(parentId)`

```typescript
const { 
  subcategories,  // Subcategorías de una categoría principal
  isLoading, 
  error 
} = useSubcategoriesByParent(categoryId)
```

**Uso:** Mostrar subcategorías disponibles al seleccionar categoría principal.

## 🎨 Componentes UI (Pendientes)

### AdminOnboarding - Paso 1 (Modificar)

```tsx
// 1. Selector de categoría PRINCIPAL
const { mainCategories } = useBusinessCategories()

<Select value={categoryId} onValueChange={setCategoryId}>
  {mainCategories.map(cat => (
    <SelectItem key={cat.id} value={cat.id}>
      <Icon name={cat.icon_name} /> {cat.name}
    </SelectItem>
  ))}
</Select>

// 2. Selector de hasta 3 SUBCATEGORÍAS (multiselect)
const { subcategories: availableSubs } = useSubcategoriesByParent(categoryId)
const [selectedSubs, setSelectedSubs] = useState<string[]>([])

<MultiSelect 
  value={selectedSubs}
  onChange={(ids) => setSelectedSubs(ids.slice(0, 3))}
  max={3}
>
  {availableSubs.map(sub => (
    <option key={sub.id} value={sub.id}>{sub.name}</option>
  ))}
</MultiSelect>
```

### BusinessCard - Mostrar categorías

```tsx
// Mostrar categoría principal + subcategorías
<div className="flex flex-wrap gap-2">
  {business.category && (
    <Badge variant="default">
      <Icon name={business.category.icon_name} />
      {business.category.name}
    </Badge>
  )}
  {business.subcategories?.map(sub => (
    <Badge key={sub.id} variant="secondary">
      {sub.subcategory?.name}
    </Badge>
  ))}
</div>
```

## 📝 Flujo de Creación de Negocio

### Paso 1: Información Básica

```typescript
// 1. Usuario selecciona categoría PRINCIPAL
setCategoryId("uuid-salud-bienestar")

// 2. Se cargan subcategorías de esa categoría
const { subcategories } = useSubcategoriesByParent(categoryId)
// Retorna: ['Medicina General', 'Odontología', 'Fisioterapia', ...]

// 3. Usuario selecciona hasta 3 subcategorías
setSelectedSubcategories([
  "uuid-medicina-general",
  "uuid-odontologia",
  "uuid-fisioterapia"
]) // Máximo 3

// 4. Al crear negocio:
const { data: business } = await supabase
  .from('businesses')
  .insert({ 
    ...formData, 
    category_id: categoryId // Categoría PRINCIPAL
  })
  .select()
  .single()

// 5. Insertar subcategorías seleccionadas
for (const subId of selectedSubcategories) {
  await supabase.from('business_subcategories').insert({
    business_id: business.id,
    subcategory_id: subId
  })
}
```

### Validaciones

- ✅ Categoría principal: **obligatoria** (1 de 15)
- ✅ Subcategorías: **opcionales** (0 a 3 máximo)
- ✅ Trigger valida máximo 3 en base de datos
- ✅ Hook `addSubcategory` valida antes de insertar

## 🔐 Políticas RLS

### `business_categories`

```sql
-- Lectura pública de categorías activas
CREATE POLICY "Allow public read access to active categories"
ON business_categories FOR SELECT
USING (is_active = true);
```

### `business_subcategories`

```sql
-- Lectura pública
CREATE POLICY "Allow public read access to business subcategories"
ON business_subcategories FOR SELECT
USING (true);

-- Solo dueño puede modificar
CREATE POLICY "Allow business owners to manage subcategories"
ON business_subcategories FOR ALL
USING (
  business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
  )
);
```

## 🚀 Migración de Datos Existentes

El script `EJECUTAR_SOLO_CATEGORIAS.sql` incluye:

```sql
-- Mapeo automático de categorías antiguas (ENUM) a nuevas (principales)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'businesses' AND column_name = 'category') 
  THEN
    -- Ejemplo: 'health' -> 'salud-bienestar'
    UPDATE businesses 
    SET category_id = (SELECT id FROM business_categories WHERE slug = 'salud-bienestar')
    WHERE category = 'health' AND category_id IS NULL;
    
    -- ... más mapeos
  END IF;
END $$;
```

**Categorías antiguas soportadas:**
- `health` → Salud y Bienestar
- `beauty` → Belleza y Estética
- `fitness` → Deportes y Fitness
- `education` → Educación y Formación
- `consulting`/`professional` → Servicios Profesionales
- `maintenance` → Hogar y Reparaciones
- `food` → Gastronomía
- `entertainment` → Eventos y Entretenimiento
- `other` → Otros Servicios

## ✅ Verificación Post-Ejecución

```sql
-- 1. Contar categorías principales (debe ser 15)
SELECT COUNT(*) FROM business_categories WHERE parent_id IS NULL;

-- 2. Contar subcategorías (debe ser ~60)
SELECT COUNT(*) FROM business_categories WHERE parent_id IS NOT NULL;

-- 3. Ver estructura completa
SELECT 
  c.name as categoria,
  COUNT(s.id) as num_subcategorias
FROM business_categories c
LEFT JOIN business_categories s ON s.parent_id = c.id
WHERE c.parent_id IS NULL
GROUP BY c.name, c.sort_order
ORDER BY c.sort_order;

-- 4. Verificar que ningún negocio tenga más de 3 subcategorías
SELECT business_id, COUNT(*) as num_subs
FROM business_subcategories
GROUP BY business_id
HAVING COUNT(*) > 3; -- Debe retornar 0 filas
```

## 📚 Próximos Pasos

### Fase 1: Ejecución SQL ✅
- [x] Ejecutar `EJECUTAR_SOLO_CATEGORIAS.sql` en Supabase Dashboard
- [x] Verificar que se crearon 15 principales + ~60 subcategorías

### Fase 2: Actualizar UI (En progreso)
- [ ] AdminOnboarding: Selector de categoría principal
- [ ] AdminOnboarding: Multi-selector de subcategorías (máx 3)
- [ ] BusinessCard: Mostrar badges de categoría + subcategorías
- [ ] Filtros de búsqueda por categoría/subcategoría

### Fase 3: Componentes Adicionales
- [ ] PhoneInput con country codes
- [ ] ImageUploader con delayedUpload
- [ ] BusinessSelector para múltiples negocios
- [ ] AdminDashboard con tabs

### Fase 4: Admin Dashboard Completo
- [ ] LocationsManager
- [ ] ServicesManager
- [ ] BusinessSettings

## 🐛 Troubleshooting

### Error: "policy already exists"
**Solución:** El script usa `IF NOT EXISTS` en bloques `DO $$` para políticas RLS.

### Error: "trigger already exists"
**Solución:** El script usa `IF NOT EXISTS` en bloques `DO $$` para triggers.

### Error: "Un negocio puede tener máximo 3 subcategorías"
**Causa:** Trigger `check_max_subcategories` está funcionando.
**Solución:** Elimina una subcategoría existente antes de agregar otra.

### No se muestran subcategorías en el selector
**Causa:** No se seleccionó categoría principal o `parent_id` no coincide.
**Debug:**
```sql
SELECT * FROM business_categories WHERE parent_id = 'uuid-categoria-principal';
```

## 📄 Archivos Creados/Modificados

### Nuevos Archivos
- ✅ `EJECUTAR_SOLO_CATEGORIAS.sql` - Script de migración idempotente
- ✅ `src/hooks/useBusinessSubcategories.ts` - Hook para gestionar subcategorías
- ✅ `SISTEMA_CATEGORIAS_RESUMEN.md` - Este documento

### Archivos Modificados
- ✅ `src/types/types.ts` - Interfaces actualizadas
- ✅ `src/hooks/useBusinessCategories.ts` - Soporte jerárquico
- ⏳ `src/components/admin/AdminOnboarding.tsx` - Pendiente actualizar UI

## 🎯 Ventajas del Nuevo Sistema

✅ **Escalable:** Agregar nuevas subcategorías sin cambiar código
✅ **Flexible:** Máximo 3 subcategorías por negocio (no rígido)
✅ **Organizado:** Jerarquía clara (15 principales, ~60 subcategorías)
✅ **Validado:** Triggers en DB previenen inconsistencias
✅ **Eficiente:** Queries optimizadas con índices en `parent_id`
✅ **SEO-friendly:** Slugs únicos para URLs amigables
✅ **Internacionalizable:** Nombres y descripciones fáciles de traducir

---

**Última actualización:** 11 de octubre de 2025
**Autor:** AppointSync Pro Team
