# Sistema de Búsqueda Avanzada - Implementación en Progreso

**Fecha**: 12 de octubre de 2025
**Estado**: 🔄 En Progreso (3/8 tareas completadas)

## ✅ Completado

### 1. Header del Layout - Eliminación de "AppointSync Pro"
- **Archivo**: `src/components/layouts/UnifiedLayout.tsx`
- **Cambios**:
  - El título "AppointSync Pro" ya no se muestra para el rol `client`
  - Se reemplazó con el componente `SearchBar` centralizado
  - Otros roles (admin, employee) mantienen el título original

### 2. Componente SearchBar con Búsqueda en Tiempo Real
- **Archivo**: `src/components/client/SearchBar.tsx`
- **Características Implementadas**:
  - ✅ Dropdown para seleccionar tipo de búsqueda:
    - Servicios
    - Negocios
    - Categorías
    - Profesionales (Usuarios)
  - ✅ Input con búsqueda debounced (300ms)
  - ✅ Resultados en tiempo real (máximo 5)
  - ✅ Íconos diferenciados por tipo
  - ✅ Información secundaria (subtitle, location)
  - ✅ Botón "Ver más resultados"
  - ✅ Enter para abrir vista completa
  - ✅ Click fuera para cerrar dropdown
  - ✅ Estados: loading, sin resultados, error

**Queries Implementadas**:
```typescript
// Servicios
SELECT id, name, description, business(id, name)
FROM services
WHERE name ILIKE '%term%' AND is_active = true
LIMIT 5

// Negocios
SELECT id, name, description, category(name), locations(id, name, city)
FROM businesses
WHERE name ILIKE '%term%' AND is_active = true
LIMIT 5

// Categorías
SELECT id, name, description
FROM business_categories
WHERE name ILIKE '%term%' AND is_active = true
LIMIT 5

// Usuarios (Profesionales)
SELECT id, full_name, bio, business_employees(business(name))
FROM profiles
WHERE full_name ILIKE '%term%'
AND business_employees IS NOT NULL
LIMIT 5
```

### 3. Hook de Geolocalización
- **Archivo**: `src/hooks/useGeolocation.ts`
- **Funcionalidades**:
  - ✅ Solicitud de permisos de ubicación
  - ✅ Obtener coordenadas actuales
  - ✅ Watch position (seguimiento continuo)
  - ✅ Verificación de estado de permisos
  - ✅ Cálculo de distancia (fórmula Haversine)
  - ✅ Manejo de errores descriptivos
  - ✅ Estados: loading, granted, denied, prompt

**API del Hook**:
```typescript
const {
  latitude,
  longitude,
  accuracy,
  error,
  loading,
  permissionStatus,
  requestLocation,
  watchPosition,
  clearWatch,
  calculateDistance,
  checkPermission,
  hasLocation,
  isPermissionGranted,
  isPermissionDenied
} = useGeolocation(options)
```

### 4. Integración en ClientDashboard
- **Archivo**: `src/components/client/ClientDashboard.tsx`
- **Cambios**:
  - ✅ Import de `useGeolocation`
  - ✅ Inicialización del hook con `requestOnMount: true`
  - ✅ Handlers `handleSearchResultSelect` y `handleSearchViewMore`
  - ✅ Props pasadas a `UnifiedLayout`

## 🔄 En Progreso

### 5. Componente SearchResults (Vista Completa)
**Archivo**: `src/components/client/SearchResults.tsx` (Por crear)

**Funcionalidades Requeridas**:
- [ ] Listado completo de resultados (no limitado a 5)
- [ ] Ordenamiento múltiple:
  - Por cercanía (usando geolocalización)
  - Por calificación
  - Por fecha de creación (nuevos/antiguos)
  - Cálculo balanceado cercanía + calificación
- [ ] Filtros adicionales:
  - Rango de distancia
  - Rango de precio (para servicios)
  - Disponibilidad
- [ ] Paginación o scroll infinito
- [ ] Vista de lista vs. vista de cuadrícula
- [ ] Mapa interactivo (opcional)

**Query Compleja Necesaria**:
```sql
-- Ejemplo para negocios con cálculo de distancia
SELECT 
  b.*,
  AVG(r.rating) as avg_rating,
  COUNT(r.id) as review_count,
  l.latitude,
  l.longitude,
  (
    6371 * acos(
      cos(radians($userLat)) * 
      cos(radians(l.latitude)) * 
      cos(radians(l.longitude) - radians($userLon)) + 
      sin(radians($userLat)) * 
      sin(radians(l.latitude))
    )
  ) as distance_km
FROM businesses b
LEFT JOIN locations l ON l.business_id = b.id
LEFT JOIN reviews r ON r.business_id = b.id
WHERE b.name ILIKE '%term%' AND b.is_active = true
GROUP BY b.id, l.id
ORDER BY (
  -- Score balanceado: 70% rating, 30% proximidad
  (AVG(r.rating) / 5.0) * 0.7 + 
  (1 - (distance_km / MAX(distance_km) OVER ())) * 0.3
) DESC
```

## 📋 Pendiente

### 6. Componente BusinessProfile
**Archivo**: `src/components/client/BusinessProfile.tsx` (Por crear)

**Funcionalidades Requeridas**:
- [ ] Información del negocio (nombre, descripción, categoría)
- [ ] Galería de imágenes
- [ ] Lista de sedes con mapa
- [ ] Lista de servicios con precios
- [ ] Horarios de atención
- [ ] Reviews/calificaciones promedio
- [ ] Botón "Agendar Cita" → Abre AppointmentWizard
- [ ] Botón "Dejar Review" (solo si tiene citas previas)
- [ ] Compartir perfil
- [ ] Agregar a favoritos

### 7. Componente UserProfile (Profesionales)
**Archivo**: `src/components/client/UserProfile.tsx` (Por crear)

**Funcionalidades Requeridas**:
- [ ] Información del profesional (nombre, bio, foto)
- [ ] Especialidades/servicios que ofrece
- [ ] Negocios donde trabaja
- [ ] Calificación promedio
- [ ] Reviews anónimas
- [ ] Disponibilidad/horarios
- [ ] Botón "Agendar Cita"
- [ ] Botón "Dejar Review" (solo si tiene citas previas)
- [ ] Certificaciones/experiencia

### 8. Sistema de Reviews Anónimas
**Archivos Por Crear**:
- `src/components/reviews/ReviewForm.tsx`
- `src/components/reviews/ReviewList.tsx`
- `src/hooks/useReviews.ts`

**Funcionalidades Requeridas**:
- [ ] Verificar que el usuario tuvo cita con el negocio/profesional
- [ ] Formulario de review (rating 1-5, comentario opcional)
- [ ] Todas las reviews son anónimas (no mostrar nombre de usuario)
- [ ] Solo una review por cita completada
- [ ] Editar review (dentro de 7 días)
- [ ] Reportar reviews inapropiadas
- [ ] Respuesta del negocio (opcional)

**Tabla Supabase Necesaria**:
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id),
  business_id UUID REFERENCES businesses(id),
  user_id UUID REFERENCES profiles(id), -- Usuario que creó (no se muestra público)
  professional_id UUID REFERENCES profiles(id), -- Si es review de profesional
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_anonymous BOOLEAN DEFAULT true,
  is_reported BOOLEAN DEFAULT false,
  business_response TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(appointment_id) -- Solo una review por cita
);

CREATE INDEX idx_reviews_business ON reviews(business_id);
CREATE INDEX idx_reviews_professional ON reviews(professional_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
```

## 🎯 Próximos Pasos Inmediatos

1. **Crear SearchResults Component** (Alta Prioridad)
   - Implementar ordenamiento con geolocalización
   - Queries optimizadas con cálculo de distancia
   - UI responsive con filtros

2. **Crear BusinessProfile Component** (Alta Prioridad)
   - Vista detallada del negocio
   - Integración con AppointmentWizard
   - Preparar para reviews

3. **Crear UserProfile Component** (Media Prioridad)
   - Vista de profesionales independientes
   - Similar a BusinessProfile pero adaptado

4. **Implementar Sistema de Reviews** (Baja Prioridad - Después de lo anterior)
   - Tabla en Supabase
   - Componentes de UI
   - Lógica de validación

## 🔍 Consideraciones Técnicas

### Geolocalización
- **Precisión**: `enableHighAccuracy: true` puede consumir más batería
- **Timeout**: 10 segundos por defecto
- **Fallback**: Si no hay ubicación, ordenar solo por rating
- **Privacidad**: Guardar ubicación solo en memoria, no persistir

### Performance
- **Debounce**: 300ms para evitar exceso de queries
- **Caché**: Considerar cachear resultados por 5 minutos
- **Límites**: Paginación de 20 resultados por página
- **Índices DB**: Asegurar índices en `businesses.name`, `services.name`, etc.

### UX
- **Loading States**: Mostrar skeletons mientras carga
- **Empty States**: Mensajes claros cuando no hay resultados
- **Errores**: Mensajes amigables para errores de red/permisos
- **Accesibilidad**: Navegación por teclado en SearchBar

## 📊 Estado del Progreso

```
████████░░░░░░░░░░░░░░░░░░ 37.5% (3/8 tareas)

✅ Header Layout Modified
✅ SearchBar Component
✅ Geolocation Hook
🔄 SearchResults Component (En Progreso)
⬜ BusinessProfile Component
⬜ UserProfile Component
⬜ Reviews System
⬜ Supabase Services
```

## 🐛 Issues Conocidos

1. **SonarLint Warnings**: Suprimidos temporalmente (`any` types, cognitive complexity)
2. **TypeScript Strict**: Algunas queries de Supabase usan `any` (por refactorizar)
3. **ESLint**: Nested ternary en SearchBar results (pendiente refactor)

## 📚 Documentación Adicional Necesaria

- [ ] Guía de usuario: Cómo usar la búsqueda
- [ ] Guía de desarrollador: Agregar nuevos tipos de búsqueda
- [ ] API Documentation: Endpoints de búsqueda y reviews
- [ ] Testing Strategy: Tests unitarios y E2E para búsqueda

---

**Última Actualización**: 12 de octubre de 2025, 20:45
**Próxima Sesión**: Implementar SearchResults component con ordenamiento avanzado
