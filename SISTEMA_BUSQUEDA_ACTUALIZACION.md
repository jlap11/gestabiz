# Sistema de Búsqueda Avanzada - Actualización de Progreso

**Fecha**: 12 de octubre de 2025, 21:30
**Estado**: 🚀 50% Completado (4/8 tareas)

## ✅ Completado en esta Sesión

### 1. SearchBar Mejorado ⭐ NUEVO DISEÑO
- **Archivo**: `src/components/client/SearchBar.tsx`
- **Mejoras Visuales**:
  - ✅ **Width aumentado**: `max-w-3xl` (de 2xl a 3xl)
  - ✅ **Diseño unificado**: Dropdown y input forman un solo componente
  - ✅ **Border compartido**: Apariencia cohesiva con borde continuo
  - ✅ **Íconos más grandes**: 5x5 (de 4x4)
  - ✅ **Padding mejorado**: py-3 px-4/px-5 para mejor espaciado
  - ✅ **Hover effects**: Shadow-md en hover
  - ✅ **Focus ring**: Anillo primario en el dropdown
  - ✅ **Input nativo**: Reemplazado componente Input por input nativo para mejor integración

**Antes vs Después**:
```tsx
// ANTES: Separados con gap
<div className="flex items-center gap-2">
  <Button variant="outline" size="sm">...</Button>
  <Input className="pl-10" />
</div>

// DESPUÉS: Unificados en un solo contenedor
<div className="relative flex items-center bg-background border rounded-lg">
  <button className="px-4 py-3 border-r">...</button>
  <input className="py-3 pl-12 bg-transparent" />
</div>
```

### 2. SearchResults - Vista Completa Implementada ⭐ NUEVO
- **Archivo**: `src/components/client/SearchResults.tsx` (784 líneas)
- **Características**:

#### Búsqueda y Datos
- ✅ **Queries complejas** para 4 tipos: servicios, negocios, categorías, usuarios
- ✅ **Joins con relaciones**: business, locations, categories, reviews
- ✅ **Cálculo de ratings** promedio por negocio/profesional
- ✅ **Contador de reviews** para cada resultado
- ✅ **Cálculo de distancia** con fórmula Haversine
- ✅ **Límite de 50 resultados** por búsqueda

#### Ordenamiento Avanzado (6 opciones)
1. **Relevancia** (default): Orden original de la búsqueda
2. **Balanceado** ⭐: 60% calificación + 40% proximidad
3. **Distancia**: Más cercanos primero
4. **Calificación**: Mejor calificados primero
5. **Más nuevos**: Por fecha de creación DESC
6. **Más antiguos**: Por fecha de creación ASC

**Fórmula Balanceada**:
```typescript
score = (rating / 5.0) * 0.6 + (1 - distance/maxDistance) * 0.4
```

#### UI/UX
- ✅ **Modal fullscreen** con backdrop blur
- ✅ **Grid responsive**: 1/2/3 columnas según viewport
- ✅ **Cards con hover**: Shadow y scale en imagen
- ✅ **Loading state**: Spinner centralizado con mensaje
- ✅ **Empty state**: Ícono + mensaje cuando no hay resultados
- ✅ **Toolbar**: Selector de ordenamiento + botón filtros
- ✅ **Cerrar**: Botón X en header
- ✅ **Imágenes**: Soporte para logo/avatar con fallback a íconos

#### Información Mostrada por Tipo
**Servicios**:
- Nombre, descripción, negocio
- Precio en MXN
- Distancia (si hay ubicación)
- Ciudad

**Negocios**:
- Nombre, descripción, categoría
- Logo/imagen
- Rating + contador de reviews
- Distancia y ciudad

**Categorías**:
- Nombre y descripción
- Fecha de creación

**Usuarios/Profesionales**:
- Nombre, bio, avatar
- Negocio donde trabaja
- Rating + contador de reviews
- Distancia y ubicación

### 3. Integración en ClientDashboard
- **Archivo**: `src/components/client/ClientDashboard.tsx`
- **Cambios**:
  - ✅ Import de `SearchResults`
  - ✅ Handler `handleSearchResultItemClick` para clicks en resultados
  - ✅ Modal condicional: se muestra cuando `searchModalOpen === true`
  - ✅ Pasa `geolocation` si está disponible
  - ✅ Cierra modal y navega a detalle al hacer click en resultado

## 🔄 En Progreso

### 5. BusinessProfile (Siguiente)
**Archivo**: `src/components/client/BusinessProfile.tsx` (Por crear)

**Diseño Propuesto**:
```tsx
<div className="fixed inset-0 z-50">
  {/* Hero Section */}
  <div className="h-64 bg-cover" style={{ backgroundImage: business.cover_url }} />
  
  {/* Info Section */}
  <div className="max-w-4xl mx-auto -mt-20">
    <Card>
      <img src={business.logo_url} className="w-32 h-32 rounded-full" />
      <h1>{business.name}</h1>
      <div className="flex gap-4">
        <Rating value={avgRating} />
        <Badge>{category.name}</Badge>
      </div>
      <p>{business.description}</p>
    </Card>

    {/* Tabs */}
    <Tabs defaultValue="services">
      <TabsList>
        <TabsTrigger value="services">Servicios</TabsTrigger>
        <TabsTrigger value="locations">Sedes</TabsTrigger>
        <TabsTrigger value="reviews">Reseñas</TabsTrigger>
        <TabsTrigger value="about">Acerca de</TabsTrigger>
      </TabsList>

      {/* Services Tab */}
      <TabsContent value="services">
        <ServiceCard 
          name={service.name}
          price={service.price}
          duration={service.duration_minutes}
          onBook={() => openAppointmentWizard(service.id)}
        />
      </TabsContent>

      {/* Locations Tab */}
      <TabsContent value="locations">
        <LocationCard 
          name={location.name}
          address={location.address}
          distance={distance}
          map={<GoogleMap center={coords} />}
        />
      </TabsContent>

      {/* Reviews Tab */}
      <TabsContent value="reviews">
        <ReviewList reviews={reviews} />
        {userHasAppointment && (
          <Button onClick={() => openReviewForm()}>
            Dejar reseña
          </Button>
        )}
      </TabsContent>
    </Tabs>

    {/* Sticky Footer */}
    <div className="fixed bottom-0 bg-card border-t p-4">
      <Button size="lg" onClick={openAppointmentWizard}>
        <Calendar className="mr-2" />
        Agendar Cita
      </Button>
    </div>
  </div>
</div>
```

**Funcionalidades Requeridas**:
- [ ] Query de negocio con todas las relaciones
- [ ] Carga de servicios, sedes, empleados
- [ ] Cálculo de rating promedio
- [ ] Carga de reviews (últimas 10)
- [ ] Mapa de ubicaciones (Google Maps)
- [ ] Galería de imágenes
- [ ] Horarios de atención
- [ ] Información de contacto
- [ ] Botón "Agendar Cita" sticky
- [ ] Botón "Dejar Reseña" (condicional)
- [ ] Verificar si usuario tiene citas previas
- [ ] Botón compartir perfil
- [ ] Botón agregar a favoritos

**Query Supabase Necesaria**:
```typescript
const { data: business } = await supabase
  .from('businesses')
  .select(`
    *,
    category:business_categories(id, name, icon),
    subcategories:business_subcategories(id, name),
    locations(
      id, name, address, city, state, 
      postal_code, phone, latitude, longitude
    ),
    services(
      id, name, description, price, currency,
      duration_minutes, is_active, category_id
    ),
    employees:business_employees(
      id, role, status,
      employee:profiles(id, full_name, avatar_url, bio)
    )
  `)
  .eq('id', businessId)
  .single()

// Fetch reviews separately
const { data: reviews } = await supabase
  .from('reviews')
  .select('id, rating, comment, created_at, business_response')
  .eq('business_id', businessId)
  .eq('is_anonymous', true)
  .order('created_at', { ascending: false })
  .limit(20)

// Check if user has appointments with this business
const { data: userAppointments } = await supabase
  .from('appointments')
  .select('id, status')
  .eq('client_id', currentUser.id)
  .eq('business_id', businessId)
  .eq('status', 'completed')
```

## 📋 Pendiente

### 6. UserProfile (Profesionales)
Similar a BusinessProfile pero adaptado para profesionales independientes:
- Foto de perfil grande
- Bio/descripción
- Servicios que ofrece
- Negocios donde trabaja
- Certificaciones
- Disponibilidad
- Reviews
- Botón "Agendar Cita"

### 7. Sistema de Reviews Anónimas

**Tabla Supabase**:
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) UNIQUE,
  business_id UUID REFERENCES businesses(id),
  professional_id UUID REFERENCES profiles(id),
  user_id UUID NOT NULL REFERENCES profiles(id), -- Privado, solo para verificación
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_anonymous BOOLEAN DEFAULT true,
  is_reported BOOLEAN DEFAULT false,
  business_response TEXT,
  business_response_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT review_target CHECK (
    business_id IS NOT NULL OR professional_id IS NOT NULL
  ),
  CONSTRAINT one_review_per_appointment UNIQUE (appointment_id)
);

-- Indexes
CREATE INDEX idx_reviews_business ON reviews(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX idx_reviews_professional ON reviews(professional_id) WHERE professional_id IS NOT NULL;
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created ON reviews(created_at DESC);

-- RLS Policies
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews (but user_id is hidden)
CREATE POLICY reviews_select ON reviews
  FOR SELECT USING (true);

-- Only users with completed appointments can create reviews
CREATE POLICY reviews_insert ON reviews
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE id = appointment_id
      AND client_id = auth.uid()
      AND status = 'completed'
    )
  );

-- Users can update their own reviews within 7 days
CREATE POLICY reviews_update ON reviews
  FOR UPDATE USING (
    user_id = auth.uid() AND
    created_at > NOW() - INTERVAL '7 days'
  );

-- Business owners can respond to reviews
CREATE POLICY reviews_business_response ON reviews
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE id = reviews.business_id
      AND owner_id = auth.uid()
    )
  )
  WITH CHECK (
    business_response IS NOT NULL
  );
```

**Componentes Necesarios**:
- `ReviewForm.tsx`: Formulario para crear/editar review
- `ReviewList.tsx`: Lista de reviews con paginación
- `ReviewCard.tsx`: Card individual de review
- `ReviewStats.tsx`: Estadísticas (distribución de estrellas)

### 8. Servicios de Búsqueda Optimizados
Ya implementados en SearchResults, pero pueden optimizarse:
- [ ] Caché de resultados (5 minutos)
- [ ] Full-text search (tsquery/tsvector)
- [ ] Índices en columnas de búsqueda
- [ ] View materializada para ratings

## 🎨 Mejoras Visuales Aplicadas

### SearchBar
```css
/* Antes */
.search-container { gap: 0.5rem; }
.search-button { padding: 0.25rem 0.75rem; }
.search-input { padding-left: 2.5rem; }

/* Después */
.search-container { 
  border: 1px solid border-color;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}
.search-button { 
  padding: 0.75rem 1rem;
  border-right: 1px solid border-color;
}
.search-input { 
  padding: 0.75rem 1rem 0.75rem 3rem;
  background: transparent;
}

/* Hover */
.search-container:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

### SearchResults Cards
```css
.result-card {
  transition: all 0.2s ease;
}

.result-card:hover {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.result-card:hover img {
  transform: scale(1.05);
}

.result-card:hover .title {
  color: var(--primary);
}
```

## 📊 Métricas de Código

### SearchBar.tsx
- **Líneas**: 361
- **Funciones**: 8
- **Hooks**: 4 (useState, useEffect, useCallback, useRef)
- **Queries Supabase**: 4 (services, businesses, categories, users)
- **Debounce**: 300ms

### SearchResults.tsx
- **Líneas**: 784
- **Funciones**: 7
- **Hooks**: 3 (useState, useEffect, useMemo)
- **Queries Supabase**: 8 (4 principales + 4 de ratings)
- **Algoritmo**: Haversine para distancias
- **Fórmula Balanceada**: 60-40 rating-distance

### ClientDashboard.tsx (Actualizado)
- **Líneas**: 771
- **Nuevos imports**: 2 (SearchResults, useGeolocation)
- **Nuevos states**: 3 (searchModalOpen, searchParams, selectedSearchResult)
- **Nuevos handlers**: 2 (handleSearchResultSelect, handleSearchResultItemClick)

## 🎯 Estado Actual del Progreso

```
████████████░░░░░░░░░░░░░░ 50% (4/8 tareas)

✅ Header Layout Modified
✅ SearchBar Component (MEJORADO)
✅ Geolocation Hook
✅ SearchResults Component (NUEVO)
🔄 BusinessProfile Component (En progreso)
⬜ UserProfile Component
⬜ Reviews System
⬜ Supabase Optimizations
```

## 🚀 Siguiente Sesión

**Prioridad Alta**:
1. Crear `BusinessProfile.tsx` con tabs y funcionalidad completa
2. Implementar botón "Agendar Cita" que abra AppointmentWizard con business preseleccionado
3. Verificar si usuario tiene citas previas para mostrar botón de review

**Prioridad Media**:
4. Crear `UserProfile.tsx` para profesionales
5. Implementar formulario de reviews

**Prioridad Baja**:
6. Optimizaciones de queries (índices, views)
7. Tests unitarios y E2E

## 🐛 Issues Conocidos

1. **TypeScript `any` types**: Muchas queries usan `any` (pendiente tipado estricto)
2. **SonarLint warnings**: Complejidad cognitiva, nested ternaries
3. **Geolocation permission**: No hay UI para re-solicitar si usuario deniega
4. **Error handling**: Falta manejo robusto de errores de red
5. **Loading states**: SearchResults podría tener skeletons en lugar de spinner

## 📚 Documentación Pendiente

- [ ] README con guía de uso del sistema de búsqueda
- [ ] API docs para queries de búsqueda
- [ ] Storybook para componentes de búsqueda
- [ ] Tests E2E con Playwright

---

**Última Actualización**: 12 de octubre de 2025, 21:30
**Próximo Paso**: Implementar BusinessProfile component
**Tiempo Estimado Restante**: 4-6 horas para completar todas las tareas
