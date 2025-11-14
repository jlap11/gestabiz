# 🔍 ANÁLISIS PROFUNDO - ClientDashboard Performance Issues

## 📊 Diagnóstico Completo

### Problema Identificado
Al hacer F5 en el ClientDashboard se realizan **MUCHOS requests innecesarios** al backend. En la captura de pantalla veo ~40+ requests simultáneos.

---

## 🔬 Análisis de Queries Actuales

### 1. **PROBLEMA CRÍTICO: Reviews Query Repetido**
**Hook**: `useMandatoryReviews` → `useCompletedAppointments`
**Archivo**: `src/hooks/useMandatoryReviews.ts` líneas 36-56

```typescript
// PROBLEMA: Hace query ADICIONAL a reviews después de traer completed appointments
const { data: reviewedAppointments, error: reviewsError } = await supabase
  .from('reviews')
  .select('appointment_id')
  .in('appointment_id', appointmentIds);
```

**Impacto**: Se ejecuta cada vez que cambia `completedAppointments` o `userId`
**Solución**: Consolidar en un solo endpoint que traiga appointments + reviews en una sola query

---

### 2. **Queries Múltiples en ClientDashboard**
**Archivo**: `src/components/client/ClientDashboard.tsx`

#### Query 1: fetchClientAppointments (línea 434-514)
```typescript
await supabase
  .from('appointments')
  .select(`
    id, created_at, updated_at, business_id, location_id, service_id,
    client_id, employee_id, start_time, end_time, status, notes, price, currency,
    businesses!appointments_business_id_fkey (id, name, description),
    locations!appointments_location_id_fkey (id, name, address, city, ...),
    employee:profiles!appointments_employee_id_fkey (id, full_name, email, ...),
    client:profiles!appointments_client_id_fkey (id, full_name, email, ...),
    services!appointments_service_id_fkey (id, name, description, ...)
  `)
  .eq('client_id', currentUser.id)
  .order('start_time', { ascending: true })
```
**Estado**: ✅ BIEN - Usa JOINs para traer todo en 1 query
**Problema**: Se ejecuta manualmente en useEffect (no usa React Query)

#### Query 2: useCompletedAppointments (vía useMandatoryReviews)
```typescript
await supabase
  .from('appointments')
  .select(`
    id, start_time, end_time, status, notes, business_id, service_id,
    employee_id, location_id, created_at, updated_at,
    businesses!appointments_business_id_fkey (id, name),
    services!appointments_service_id_fkey (id, name, price)
  `)
  .eq('client_id', clientId)
  .eq('status', 'completed')
  .order('start_time', { ascending: false });
```
**Estado**: ✅ USA React Query con cache
**Problema**: **DUPLICA datos con Query 1** - trae appointments dos veces

#### Query 3: Reviews Check (dentro de useMandatoryReviews)
```typescript
await supabase
  .from('reviews')
  .select('appointment_id')
  .in('appointment_id', appointmentIds);
```
**Estado**: ❌ MAL - Query adicional que debería ser LEFT JOIN

---

### 3. **Hooks Adicionales con Queries**
- ✅ `useGeolocation`: Solo navigator.geolocation (NO hay query)
- ✅ `useChat`: Solo crea conversaciones (NO consulta en mount)
- ✅ `usePendingNavigation`: Solo lee localStorage (NO hay query)
- ✅ `usePreferredCity`: Solo lee localStorage (NO hay query)

---

### 4. **Componentes Hijos con Queries**
#### BusinessSuggestions
- Probablemente consulta negocios recomendados
- NO visible en análisis inicial (necesita inspección)

#### FavoritesList
- Consulta favoritos del usuario
- Probablemente usa React Query

#### ClientHistory
- Usa `useCompletedAppointments` (DUPLICADO con useMandatoryReviews)
- Filtra mismos datos localmente

---

## 🎯 PLAN DE ACCIÓN

### **FASE 1: Crear Endpoint Unificado para Dashboard** ⭐ PRIORIDAD ALTA

#### Objetivo
Crear **UN SOLO endpoint** (Edge Function o RPC) que traiga TODA la data necesaria en una sola request.

#### Edge Function: `get-client-dashboard-data`
**Input**: `client_id`
**Output**: JSON con:
```typescript
{
  appointments: AppointmentWithRelations[], // Todas las citas (no solo completed)
  reviewedAppointmentIds: string[], // IDs de citas con review
  pendingReviewsCount: number,
  favorites: Favorite[],
  suggestions: BusinessSuggestion[],
  stats: {
    totalAppointments: number,
    completedAppointments: number,
    upcomingAppointments: number,
    cancelledAppointments: number
  }
}
```

#### Query SQL Optimizada (dentro de Edge Function)
```sql
WITH client_appointments AS (
  SELECT 
    a.*,
    b.name as business_name,
    b.description as business_description,
    l.name as location_name,
    l.address, l.city, l.state, l.postal_code, l.country,
    l.latitude, l.longitude, l.google_maps_url,
    p.full_name as employee_name,
    p.email as employee_email,
    p.phone as employee_phone,
    p.avatar_url as employee_avatar,
    s.name as service_name,
    s.description as service_description,
    s.duration_minutes as service_duration,
    s.price as service_price,
    s.currency as service_currency,
    s.image_url as service_image,
    r.id as review_id -- LEFT JOIN para saber si tiene review
  FROM appointments a
  LEFT JOIN businesses b ON a.business_id = b.id
  LEFT JOIN locations l ON a.location_id = l.id
  LEFT JOIN profiles p ON a.employee_id = p.id
  LEFT JOIN services s ON a.service_id = s.id
  LEFT JOIN reviews r ON a.id = r.appointment_id
  WHERE a.client_id = $1
  ORDER BY a.start_time ASC
),
client_favorites AS (
  SELECT bf.business_id
  FROM business_favorites bf
  WHERE bf.user_id = $1
),
suggested_businesses AS (
  -- Lógica de sugerencias basada en:
  -- 1. Ciudad preferida
  -- 2. Categorías de servicios frecuentes
  -- 3. Ratings altos
  -- Límite: 6 negocios
  SELECT b.id, b.name, b.description, b.average_rating, b.total_reviews
  FROM businesses b
  WHERE b.is_active = true
  LIMIT 6
)
SELECT 
  json_build_object(
    'appointments', (SELECT json_agg(row_to_json(ca)) FROM client_appointments ca),
    'reviewedAppointmentIds', (SELECT array_agg(ca.id) FROM client_appointments ca WHERE ca.review_id IS NOT NULL),
    'pendingReviewsCount', (SELECT COUNT(*) FROM client_appointments ca WHERE ca.status = 'completed' AND ca.review_id IS NULL),
    'favorites', (SELECT json_agg(cf.business_id) FROM client_favorites cf),
    'suggestions', (SELECT json_agg(row_to_json(sb)) FROM suggested_businesses sb),
    'stats', json_build_object(
      'totalAppointments', (SELECT COUNT(*) FROM client_appointments),
      'completedAppointments', (SELECT COUNT(*) FROM client_appointments WHERE status = 'completed'),
      'upcomingAppointments', (SELECT COUNT(*) FROM client_appointments WHERE status IN ('pending', 'confirmed', 'in_progress') AND start_time > NOW()),
      'cancelledAppointments', (SELECT COUNT(*) FROM client_appointments WHERE status = 'cancelled')
    )
  ) as dashboard_data;
```

---

### **FASE 2: Refactorizar Hooks** ⭐ PRIORIDAD ALTA

#### 2.1. Crear `useClientDashboard` (Hook Principal)
**Archivo**: `src/hooks/useClientDashboard.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { QUERY_CONFIG } from '@/lib/queryConfig';

export function useClientDashboard(clientId: string | null) {
  return useQuery({
    queryKey: QUERY_CONFIG.KEYS.CLIENT_DASHBOARD(clientId || ''),
    queryFn: async () => {
      if (!clientId) return null;

      const { data, error } = await supabase.functions.invoke('get-client-dashboard-data', {
        body: { client_id: clientId }
      });

      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
    staleTime: QUERY_CONFIG.STABLE, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos en cache
  });
}
```

#### 2.2. Eliminar `useCompletedAppointments`
- Ya no es necesario (datos vienen de `useClientDashboard`)
- Eliminar archivo: `src/hooks/useCompletedAppointments.ts`

#### 2.3. Refactorizar `useMandatoryReviews`
**Cambio**: Recibir datos como parámetro en lugar de hacer query

```typescript
export function useMandatoryReviews(
  userId: string,
  completedAppointments: any[], // Del hook principal
  reviewedAppointmentIds: string[] // Del hook principal
) {
  // NO hace queries, solo calcula estado local
  const pendingCount = completedAppointments.filter(
    apt => !reviewedAppointmentIds.includes(apt.id)
  ).length;

  // Resto de lógica (remind later, modal state, etc)
}
```

---

### **FASE 3: Refactorizar ClientDashboard** ⭐ PRIORIDAD MEDIA

#### 3.1. Eliminar `fetchClientAppointments`
```typescript
// ❌ ELIMINAR
const fetchClientAppointments = React.useCallback(async () => { ... }, []);

// ✅ REEMPLAZAR CON
const { 
  data: dashboardData,
  isLoading,
  error 
} = useClientDashboard(user.id);

const appointments = dashboardData?.appointments || [];
const reviewedIds = dashboardData?.reviewedAppointmentIds || [];
const pendingReviewsCount = dashboardData?.pendingReviewsCount || 0;
```

#### 3.2. Simplificar useMandatoryReviews
```typescript
// ❌ ELIMINAR
const { 
  shouldShowModal: shouldShowReviewModal, 
  pendingReviewsCount,
  checkPendingReviews,
  ...
} = useMandatoryReviews(user.id)

// ✅ REEMPLAZAR CON
const { 
  shouldShowModal: shouldShowReviewModal,
  ...reviewHandlers
} = useMandatoryReviews(
  user.id,
  dashboardData?.appointments.filter(a => a.status === 'completed') || [],
  dashboardData?.reviewedAppointmentIds || []
);
```

#### 3.3. Pasar datos a componentes hijos
```typescript
{activePage === 'history' && (
  <ClientHistory 
    appointments={dashboardData?.appointments || []}
    reviewedAppointmentIds={dashboardData?.reviewedAppointmentIds || []}
  />
)}

{activePage === 'favorites' && (
  <FavoritesList 
    favoriteBusinessIds={dashboardData?.favorites || []}
  />
)}
```

---

### **FASE 4: Optimizar Componentes Hijos** ⭐ PRIORIDAD BAJA

#### 4.1. ClientHistory
- ❌ Eliminar `useCompletedAppointments`
- ✅ Recibir `appointments` y `reviewedIds` como props
- ✅ Filtrar localmente

#### 4.2. FavoritesList
- ❌ Eliminar query de favoritos si existe
- ✅ Recibir `favoriteBusinessIds` como prop
- ✅ Consultar detalles de negocios bajo demanda (lazy loading)

#### 4.3. BusinessSuggestions
- ❌ Eliminar query de sugerencias si existe
- ✅ Recibir `suggestions` como prop

---

## 📈 IMPACTO ESPERADO

### Antes (Actual)
```
F5 en ClientDashboard:
├── Query 1: appointments (manual fetch) ❌
├── Query 2: completed_appointments (React Query) ❌ DUPLICADO
├── Query 3: reviews (manual) ❌
├── Query 4: favorites (si existe) ❌
├── Query 5: suggestions (si existe) ❌
├── Query 6+: Service images (múltiples) ❌
└── Total: ~10-15 requests 🔴
```

### Después (Optimizado)
```
F5 en ClientDashboard:
├── Query 1: get-client-dashboard-data (Edge Function) ✅ ÚNICO
└── Total: 1 request 🟢
```

**Reducción**: **90-95% menos requests** ⚡

---

## 🛠️ IMPLEMENTACIÓN PASO A PASO

### Paso 1: Crear Edge Function
```bash
npx supabase functions new get-client-dashboard-data
```

### Paso 2: Implementar query SQL optimizada
- Archivo: `supabase/functions/get-client-dashboard-data/index.ts`
- CTE con LEFT JOINs
- Validar RLS policies

### Paso 3: Crear Hook Principal
- Archivo: `src/hooks/useClientDashboard.ts`
- React Query con cache 5 min

### Paso 4: Refactorizar ClientDashboard
- Eliminar `fetchClientAppointments`
- Usar `useClientDashboard`
- Pasar datos a componentes hijos

### Paso 5: Refactorizar Hooks Dependientes
- `useMandatoryReviews`: Recibir datos como params
- Eliminar `useCompletedAppointments`

### Paso 6: Actualizar Componentes Hijos
- ClientHistory
- FavoritesList
- BusinessSuggestions

### Paso 7: Testing
- Verificar que todo funcione
- Confirmar reducción de requests (DevTools Network)
- Validar performance con React DevTools Profiler

---

## ⚠️ CONSIDERACIONES IMPORTANTES

### 1. Cache Invalidation
Cuando se crea/edita/cancela una cita:
```typescript
queryClient.invalidateQueries({ 
  queryKey: QUERY_CONFIG.KEYS.CLIENT_DASHBOARD(user.id) 
});
```

### 2. Realtime Subscriptions (Opcional)
Si quieres updates en tiempo real:
```typescript
useEffect(() => {
  const channel = supabase
    .channel('client-appointments')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'appointments',
      filter: `client_id=eq.${user.id}`
    }, () => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_CONFIG.KEYS.CLIENT_DASHBOARD(user.id) 
      });
    })
    .subscribe();

  return () => { channel.unsubscribe(); };
}, [user.id]);
```

### 3. Error Handling
Edge Function debe manejar errores gracefully:
- Si falla query de sugerencias → continuar sin sugerencias
- Si falla query principal → throw error

### 4. Pagination (Futuro)
Si el cliente tiene 100+ citas:
- Limitar appointments a últimas 50
- Implementar infinite scroll en ClientHistory

---

## 📊 MÉTRICAS DE ÉXITO

- ✅ Requests en F5: **1 request** (vs 10-15 actuales)
- ✅ Tiempo de carga: **<500ms** (vs 2-3 segundos actuales)
- ✅ Re-renders: **50% menos** (sin queries duplicadas)
- ✅ Cache hit rate: **80%+** (navegación entre tabs)

---

**PRÓXIMO PASO**: ¿Procedo con la implementación de la **FASE 1** (Edge Function + Hook Principal)?
