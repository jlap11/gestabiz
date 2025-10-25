# ANÁLISIS EXHAUSTIVO DE LA WEB APP (BASE PARA VERSIÓN MÓVIL)

> **Fecha**: Enero 2025  
> **Estado**: Fase BETA completada en web (151k líneas TypeScript, 1,060 archivos)  
> **Objetivo**: Migración a React Native sin modificar código web existente

## 1. PANORAMA GENERAL

### 1.1 Stack Tecnológico Web
- **Frontend**: React 18 + TypeScript 5.7 + Vite 6
- **Backend**: Supabase (PostgreSQL 15+, Edge Functions Deno, Realtime)
- **UI**: Tailwind 4 + Radix UI + Phosphor Icons
- **Estado**: React Query (TanStack) + Context API
- **Navegación**: React Router v7

### 1.2 Stack Tecnológico Móvil Propuesto
- **Framework**: Expo SDK 49 + React Native
- **Navegación**: Expo Router v2 (file-based)
- **UI**: React Native Paper + React Native Vector Icons
- **Estado**: Mismo React Query + Context API
- **Backend**: Mismo Supabase (cliente nativo @supabase/supabase-js)

### 1.3 Objetivo de la Migración
Crear app móvil que:
- ✅ Reutilice 100% de hooks de negocio (`src/hooks/**`)
- ✅ Reutilice 100% de servicios (`src/lib/services/**`)
- ✅ Mantenga arquitectura de roles dinámicos
- ✅ Preserve validaciones y reglas de negocio
- ✅ Implemente UI móvil equivalente (NO WebView de componentes web)
- ❌ NO modifique código web existente

## 2. ARQUITECTURA CRÍTICA

### 2.1 Sistema de Autenticación (⚠️ CRÍTICO)

**Patrón Web**:
```typescript
// src/contexts/AuthContext.tsx (Context Provider)
// └─ useAuthSimple() (Hook de implementación - UNA sola llamada)
// └─ useAuth() (Hook consumidor - USAR EN COMPONENTES)
```

**Flujo**:
1. `useAuthSimple()` llama `supabase.auth.getSession()` al montar
2. Escucha `onAuthStateChange` (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
3. Hydrata perfil desde tabla `profiles` (avatar, timezone, language, notification_preferences)
4. Construye objeto `User` con función `buildUserFromSession()`
5. Provee: `{ user, session, loading, error, signIn, signUp, signOut, resetPassword }`

**Implementación Móvil**:
- Crear `mobile/lib/auth.tsx` con `AuthProvider` equivalente
- Usar `@react-native-async-storage/async-storage` para persistencia
- IMPORTANTE: Usar cliente Supabase singleton de `src/lib/supabase.ts` (importar)
- Mantener estructura de `User` tipo (`src/types/types.ts`)

### 2.2 Sistema de Roles Dinámicos (⚠️ CRÍTICO)

**NO existe tabla `user_roles` en BD**. Los roles se calculan en tiempo real:

```typescript
// useUserRoles(user) calcula:
1. ADMIN → Query: businesses WHERE owner_id = user.id
2. EMPLOYEE → Query: business_employees WHERE employee_id = user.id
3. CLIENT → Siempre disponible (default)
```

**Persistencia**:
- Solo el rol ACTIVO se guarda en `localStorage` (key: `user-active-role`)
- Móvil: usar `SecureStore` o `AsyncStorage`

**Multi-negocio**:
- Un usuario puede ser admin de negocio A, employee de negocio B, client en C
- `switchRole(newRole, businessId?)` cambia contexto sin recargar

**Hook Móvil**:
```typescript
// Reutilizar: src/hooks/useUserRoles.ts (compatible con RN)
const { roles, activeRole, activeBusiness, switchRole } = useUserRoles(user)
```

### 2.3 Cliente Supabase Singleton (⚠️ CRÍTICO)

**UN SOLO cliente** para toda la app:

**Web**: `src/lib/supabase.ts`
```typescript
// Detecta: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
// Demo mode si vacío o 'demo.supabase.co'
export const supabase = createClient(url, key) // Singleton
```

**Móvil**: Importar el mismo archivo con variables Expo:
```typescript
// EXPO_PUBLIC_SUPABASE_URL
// EXPO_PUBLIC_SUPABASE_ANON_KEY
```

**⚠️ NUNCA** crear nuevos clientes con `createClient()` en otros archivos.

### 2.4 React Query (Optimización de Red)

**Configuración Web** (`src/App.tsx`):
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
```

**Claves Centralizadas** (`src/lib/queryConfig.ts`):
- `QUERY_CONFIG.KEYS.IN_APP_NOTIFICATIONS(userId)`
- `QUERY_CONFIG.KEYS.EMPLOYEE_BUSINESSES(employeeId, includeIndependent)`
- `QUERY_CONFIG.STABLE` (5 min TTL) vs `QUERY_CONFIG.VOLATILE` (30 seg)

**Implementación Móvil**:
- Mismo `QueryClient` en `App.tsx` móvil
- Reutilizar claves de `queryConfig.ts`
- Hooks como `useInAppNotifications`, `useAdminBusinesses` funcionan directamente

## 3. SISTEMAS PRINCIPALES (13 COMPLETADOS EN WEB)

### 3.1 Sistema de Citas con Validación en Tiempo Real
**Componente Web**: `AppointmentWizard.tsx` (1,009 líneas)

**Pasos dinámicos** (6-8 según contexto):
1. **Business** (si no preseleccionado)
2. **Location** → Valida horarios apertura/cierre
3. **Service** → Filtra por location
4. **Employee/Resource** → Valida compatibilidad con servicio
5. **Employee Business** (si empleado tiene múltiples negocios)
6. **DateTime** → **VALIDACIONES CRÍTICAS**:
   - ✅ Horario de sede (`locations.opens_at/closes_at`)
   - ✅ Hora de almuerzo (`business_employees.lunch_break_start/end`)
   - ✅ Citas ocupadas (overlap algorithm)
   - ✅ Ausencias aprobadas (`employee_absences`)
   - ✅ Festivos públicos (`public_holidays`)
7. **Confirmation** → Resume datos
8. **Success** → Tracking GA4 + notificación

**Algoritmo Overlap**:
```typescript
slotStart < existingAppointmentEnd && slotEnd > existingAppointmentStart
// Excluye cita en edición si appointmentToEdit.id
```

**Móvil**: Crear wizard con React Native Paper Stepper o navegación modal secuencial.

### 3.2 Sistema de Notificaciones Multicanal
**17 tipos soportados**:
- **Citas** (7): reminder, confirmation, cancellation, rescheduled, new_client, new_employee, new_business
- **Verificaciones** (3): email_verification, phone_verification_sms, phone_verification_whatsapp
- **Empleados** (3): employee_request_new, employee_request_accepted, employee_request_rejected
- **Vacantes** (4): job_vacancy_new, job_application_new, job_application_accepted, job_application_rejected

**Canales**: Email (AWS SES), SMS (AWS SNS), WhatsApp, In-App

**Realtime** (`NotificationContext.tsx`):
```typescript
supabase.channel(`global_notifications_${userId}`)
  .on('postgres_changes', { table: 'in_app_notifications', filter: `user_id=eq.${userId}` })
  // Regla supresión: Si chat activo y notif es chat_message de misma conversación → NO toast
```

**Móvil**: Usar `expo-notifications` + mismo realtime channel.

### 3.3 Sistema de Chat en Tiempo Real
**Fix Memory Leak** (Oct 2025):
- ❌ ANTES: `channel_${conversationId}_${Date.now()}` → canales duplicados infinitos
- ✅ AHORA: `channel_${conversationId}` → nombres estáticos

**Subscriptions**:
- `useChat`: Conversaciones (INSERT/UPDATE en `conversations`, `conversation_members`)
- `useMessages`: Mensajes (INSERT/UPDATE/DELETE en `messages`)

**Móvil**: Usar `react-native-gifted-chat` + mismos hooks.

### 3.4 Sistema de Ausencias y Vacaciones
**APROBACIÓN OBLIGATORIA** (`require_absence_approval = true` forzado en migración):

**Tablas**:
- `employee_absences`: Tipo, fecha inicio/fin, motivo, status
- `absence_approval_requests`: Aprobaciones por admin
- `vacation_balance`: Días disponibles/usados/pendientes

**Validación en Citas**:
```typescript
// DateTimeSelection.tsx verifica ausencias aprobadas
const { data: approvedAbsences } = await supabase
  .from('employee_absences')
  .select('*')
  .eq('employee_id', employeeId)
  .eq('status', 'approved')
  .gte('end_date', selectedDate)
  .lte('start_date', selectedDate)
```

**Edge Functions**:
- `request-absence`: Crea solicitud + notifica admins (v2: 350 líneas)
- `approve-reject-absence`: Admin responde + actualiza balance
- `cancel-appointments-on-emergency-absence`: Cancelación automática

**Móvil**: Formulario modal + calendario con range highlighting.

### 3.5 Sistema de Billing (Triple Gateway)
**Gateways**: Stripe (global), PayU (Colombia), MercadoPago (LATAM)

**Factory Pattern**:
```typescript
// src/lib/payments/PaymentGatewayFactory.ts
const gateway = getPaymentGateway() // Lee VITE_PAYMENT_GATEWAY
gateway.createCheckoutSession({ businessId, planType, billingCycle })
```

**Planes**:
- Gratuito: 0 COP (1 sede, 1 empleado, 3 citas/mes)
- Inicio: $80k/mes (Activo)
- Profesional/Empresarial/Corporativo: Próximamente

**Móvil**: 
- Opción 1: WebView para checkout (recomendado)
- Opción 2: SDKs nativos (Stripe React Native)

### 3.6 Sistema de Búsqueda con RPC Optimizado
**6 algoritmos de ordenamiento**:
1. Relevancia (ts_rank de full-text search)
2. Rating + Review Count
3. Distancia (geolocalización)
4. Precio
5. Fecha creación
6. **Balanceado**: Rating × 0.6 + (1 / distancia_km) × 0.4

**RPC Functions**:
- `search_businesses(query, user_lat, user_lng)` → rank, avg_rating, review_count
- `search_services(query)` → relevancia, business info
- `search_professionals(query)` → stats de employee_ratings_stats

**Móvil**: Mismo `SearchBar` + `SearchResults` con FlatList.

## 4. HOOKS Y SERVICIOS REUTILIZABLES (58 HOOKS)

### 4.1 Hooks Críticos para Móvil (Compatibles 100% con RN)

**Autenticación y Roles**:
```typescript
useAuth()                    // → user, session, signIn, signOut
useUserRoles(user)          // → roles, activeRole, switchRole
usePermissions-v2(user, id) // → permissions, hasPermission
```

**Datos de Negocio**:
```typescript
useAdminBusinesses(userId)                    // React Query TTL 5min
useEmployeeBusinesses(employeeId, include)    // businesses + isEmployeeOfAnyBusiness
useSupabaseData({ user, autoFetch })          // locations, services, appointments
useBusinessProfileData(businessId)            // perfil público completo
```

**Citas y Disponibilidad**:
```typescript
useAssigneeAvailability(id, type)  // → isAvailable, conflicts, validateSlot
usePublicHolidays(countryId, year) // → holidays, isHoliday(date)
useEmployeeAbsences(businessId)    // → absences, vacationBalance, requestAbsence
useWizardDataCache(businessId)     // → precarga datos para wizard
```

**Notificaciones y Chat**:
```typescript
useInAppNotifications({ userId, limit, status }) // → notifications, markAsRead
useChat(userId)                                  // → conversations, messages, sendMessage
useConversations(userId, businessId)             // → conversations, subscribe
useMessages(conversationId, userId)              // → messages, sendMessage, subscribe
```

**Búsqueda y Reviews**:
```typescript
useGeolocation({ requestOnMount, showPrompt }) // → coords, error, requestPermission
useReviews(businessId)                         // → reviews, createReview, respond
useFavorites(userId)                           // → favorites, add, remove
```

**Vacantes y Reclutamiento**:
```typescript
useJobVacancies(businessId)             // → vacancies, create, update, delete
useJobApplications(vacancyId)           // → applications, accept, reject
useMatchingVacancies(employeeId)        // → matches con score de compatibilidad
useMandatoryReviews(userId)             // → shouldShowModal, pendingReviewsCount
```

### 4.2 Servicios Reutilizables (`src/lib/services/**`)

```typescript
// src/lib/services/appointments.ts
export const appointmentService = {
  create(data: AppointmentInsert): Promise<Appointment>,
  update(id: string, data: AppointmentUpdate): Promise<Appointment>,
  delete(id: string): Promise<void>,
  getById(id: string): Promise<Appointment>,
  getByBusiness(businessId: string): Promise<Appointment[]>,
  validateOverlap(data: ValidationData): Promise<boolean>
}

// src/lib/services/resources.ts
export const resourceService = {
  getByBusinessId(businessId: string): Promise<BusinessResource[]>,
  getAvailability(resourceId: string, date: string): Promise<Availability>,
  assignServices(resourceId: string, serviceIds: string[]): Promise<void>,
  getStats(resourceId: string): Promise<ResourceStats>
}

// src/lib/services/stats.ts
export const statsService = {
  getDashboardStats(userId: string, role: UserRole): Promise<DashboardStats>,
  getFinancialReports(businessId: string, period: string): Promise<Report>
}
```

**⚠️ IMPORTANTE**: Estos servicios son 100% compatibles con React Native. Importar directamente.

### 4.3 Utilidades y Helpers

```typescript
// src/lib/utils.ts (Compatible RN)
cn(...)                              // Classnames (aunque no útil en RN)
formatCurrency(amount, currency)     // Formato moneda
formatDate(date, format, timezone)   // Formato fechas con date-fns
calculateDuration(start, end)        // Duración en minutos

// src/lib/validation.ts (Compatible RN)
validateEmail(email)
validatePhone(phone)
validatePassword(password)

// src/lib/translations.ts (Compatible RN)
translations.es.*, translations.en.*
```

## 5. REGLAS DE NEGOCIO CRÍTICAS (⚠️ NO MODIFICAR)

### 5.1 Sistema de Roles (⚠️ CRÍTICO)
```typescript
// ❌ NO existe tabla user_roles en BD
// ✅ Cálculo dinámico en cada sesión:

// ADMIN → businesses.owner_id = user.id
const { data: ownedBusinesses } = await supabase
  .from('businesses')
  .select('id, name')
  .eq('owner_id', user.id)

// EMPLOYEE → business_employees.employee_id = user.id (⚠️ NO user_id)
const { data: employeeBusinesses } = await supabase
  .from('business_employees')
  .select('business_id, businesses(id, name)')
  .eq('employee_id', user.id)  // ⚠️ USAR employee_id

// CLIENT → Siempre disponible (default)
```

**Multi-negocio**: Un usuario puede ser admin de A, employee de B, client de C.

### 5.2 Validaciones de Citas (OBLIGATORIAS)
**Orden de validación en AppointmentWizard** (`DateTimeSelection.tsx` líneas 120-250):

```typescript
// 1. Horario de sede
const location = await getLocation(locationId)
if (slotTime < location.opens_at || slotTime > location.closes_at) {
  disable(slot, tooltip: "Fuera del horario de la sede")
}

// 2. Hora de almuerzo del empleado
const employee = await getEmployee(employeeId)
if (slotTime >= employee.lunch_break_start && 
    slotTime < employee.lunch_break_end) {
  disable(slot, tooltip: "Hora de almuerzo")
}

// 3. Overlaps con citas existentes
const appointments = await getAppointments(employeeId, date)
const hasOverlap = appointments.some(apt => 
  slotStart < apt.end_time && slotEnd > apt.start_time &&
  apt.id !== appointmentToEdit?.id  // Excluir si edición
)
if (hasOverlap) {
  disable(slot, tooltip: "Ocupado")
}

// 4. Ausencias aprobadas
const absences = await getApprovedAbsences(employeeId, date)
if (absences.length > 0) {
  disable(slot, tooltip: "Ausencia programada")
}

// 5. Festivos públicos
const holidays = usePublicHolidays(countryId, year)
if (holidays.isHoliday(date)) {
  disable(slot, tooltip: "Festivo público")
}
```

### 5.3 Sistema de Ausencias (APROBACIÓN OBLIGATORIA)
```typescript
// ✅ FORZADO en migración 20251020110000
businesses.require_absence_approval = true  // NO parametrizable

// Flujo:
1. Empleado solicita → Edge Function request-absence
2. Notifica a TODOS admins/managers (NO solo owner)
3. Admin aprueba/rechaza → Edge Function approve-reject-absence
4. Si aprobada → actualiza vacation_balance (trigger automático)
5. Si emergencia → cancela citas automáticamente
```

**Validación días disponibles**:
```typescript
const balance = vacationDaysAccrued - vacationDaysUsed - vacationDaysPending
if (requestedDays > balance) {
  throw new Error('Días insuficientes disponibles')
}
```

### 5.4 Modelo de Negocio Flexible (⭐ NUEVO)
**Tabla appointments** tiene CHECK constraint:
```sql
CHECK (employee_id IS NOT NULL OR resource_id IS NOT NULL)
```

**Validación disponibilidad recurso**:
```typescript
const { data: isAvailable } = await supabase.rpc('is_resource_available', {
  p_resource_id: resourceId,
  p_start_time: startTime,
  p_end_time: endTime,
  p_exclude_appointment_id: appointmentToEdit?.id || null
})
```

**Hook unificado**:
```typescript
// useAssigneeAvailability maneja AMBOS casos
const { isAvailable, conflicts } = useAssigneeAvailability(
  assigneeId,  // employee_id o resource_id
  assigneeType // 'employee' o 'resource'
)
```

### 5.5 Notificaciones con Mapeo de Roles
**Archivo**: `src/lib/notificationRoleMapping.ts`

**Mapeo automático**:
```typescript
const roleForNotification = {
  'appointment_reminder': 'client',
  'appointment_new_employee': 'employee',
  'employee_request_new': 'admin',
  'job_application_new': 'admin',
  'job_application_accepted': 'employee',
  'absence_request_new': 'admin'
  // ...30+ tipos
}
```

**Navegación inteligente**:
```typescript
// Si notif requiere rol diferente al activo:
const requiredRole = getRoleForNotification(notification.type)
if (requiredRole !== activeRole) {
  await switchRole(requiredRole)
  navigate(getRouteForNotification(notification))
}
```

### 5.6 Sistema de Reviews (Anónimas y Obligatorias)
```typescript
// Reglas:
1. Solo clientes con citas completadas pueden dejar review
2. Una review por cita (no duplicados)
3. Reviews anónimas (no se muestra nombre del reviewer)
4. Negocio puede responder (response field)
5. Review obligatoria después de contratar empleado vía vacante
```

**Validación**:
```typescript
const canReview = await validateReviewEligibility({
  userId,
  businessId,
  serviceId,
  employeeId
})
// Valida: cita completada + sin review previa
```

## 6. BASE DE DATOS Y SUPABASE

### 6.1 Infraestructura
- **PostgreSQL 15+** (SOLO en la nube, no hay local)
- **Extensiones**:
  - `uuid-ossp`: Generación UUIDs
  - `pg_trgm`: Búsqueda fuzzy (índices GIN)
  - `postgis`: Geolocalización
- **RLS**: Políticas de seguridad en TODAS las tablas
- **Edge Functions**: 30+ desplegadas (Deno runtime)
- **Realtime**: Subscriptions a cambios en tablas

### 6.2 Tablas Críticas (40+ total)

**Core del Negocio**:
```sql
businesses (owner_id, resource_model, rating_cache)
locations (opens_at, closes_at, latitude, longitude)
services (price, duration, category, subcategory_id)
business_employees (employee_id, lunch_break_start, lunch_break_end)
business_resources (resource_type, capacity, amenities JSONB)
```

**Citas y Validación**:
```sql
appointments (
  id, business_id, location_id, service_id,
  employee_id OR resource_id,  -- CHECK constraint
  start_time, end_time, status,
  is_location_exception
)
```

**Ausencias y Vacaciones**:
```sql
employee_absences (employee_id, absence_type, start_date, end_date, status)
absence_approval_requests (absence_id, approver_id, status, comments)
vacation_balance (employee_id, days_available, days_used, days_pending)
public_holidays (country_id, name, holiday_date, is_recurring)
```

**Notificaciones**:
```sql
in_app_notifications (user_id, type, data JSONB, status, priority)
business_notification_settings (business_id, channel_priority, reminder_times)
user_notification_preferences (user_id, notification_type, channels)
notification_log (user_id, type, channel, status, sent_at)
```

**Chat**:
```sql
conversations (business_id, type, last_message_at)
messages (conversation_id, sender_id, content, attachments, read_at)
chat_participants (conversation_id, user_id, joined_at, left_at)
```

**Vacantes**:
```sql
job_vacancies (business_id, title, salary_range, commission_based, required_skills)
job_applications (vacancy_id, applicant_id, cv_url, status)
employee_profiles (user_id, skills, experience, certifications)
```

### 6.3 RPC Functions Importantes
```sql
-- Búsqueda optimizada
search_businesses(query TEXT, user_lat FLOAT, user_lng FLOAT)
search_services(query TEXT)
search_professionals(query TEXT)

-- Validación disponibilidad
is_resource_available(p_resource_id UUID, p_start_time TIMESTAMP, p_end_time TIMESTAMP)
is_employee_available(p_employee_id UUID, p_start_time TIMESTAMP, p_end_time TIMESTAMP)

-- Jerarquía
get_business_hierarchy(p_business_id UUID)

-- Stats
get_resource_stats(p_resource_id UUID)
refresh_resource_availability()  -- Materialized view
```

### 6.4 Claves en Queries (⚠️ CRÍTICO)
```typescript
// ❌ INCORRECTO (error común):
const { data } = await supabase
  .from('business_employees')
  .select('*')
  .eq('user_id', auth.uid())  // ❌ NO existe columna user_id

// ✅ CORRECTO:
const { data } = await supabase
  .from('business_employees')
  .select('*')
  .eq('employee_id', auth.uid())  // ✅ USAR employee_id
```

## 7. NAVEGACIÓN MÓVIL CON EXPO ROUTER

### 7.1 Estructura de Archivos Propuesta
```
mobile/app/
├── _layout.tsx              # Root layout con providers
├── (auth)/
│   ├── _layout.tsx          # Auth stack
│   ├── login.tsx
│   ├── register.tsx
│   └── forgot-password.tsx
├── (tabs)/
│   ├── _layout.tsx          # Bottom tabs navegación
│   ├── admin/
│   │   ├── _layout.tsx      # Admin stack
│   │   ├── index.tsx        # Dashboard principal
│   │   ├── appointments.tsx
│   │   ├── absences.tsx
│   │   ├── locations.tsx
│   │   ├── services.tsx
│   │   ├── employees.tsx
│   │   ├── recruitment.tsx
│   │   ├── quick-sales.tsx
│   │   ├── accounting.tsx
│   │   ├── reports.tsx
│   │   └── settings.tsx
│   ├── employee/
│   │   ├── _layout.tsx
│   │   ├── index.tsx        # Mis empleos
│   │   ├── vacancies.tsx
│   │   ├── absences.tsx
│   │   └── appointments.tsx
│   └── client/
│       ├── _layout.tsx
│       ├── index.tsx        # Búsqueda
│       ├── appointments.tsx
│       ├── favorites.tsx
│       ├── history.tsx
│       └── settings.tsx
├── appointment/
│   ├── [id].tsx             # Detalle modal
│   └── wizard.tsx           # Wizard booking
├── business/
│   └── [id].tsx             # Perfil público modal
└── chat/
    └── [conversationId].tsx # Chat screen
```

### 7.2 Lógica de Tabs Dinámicos
```typescript
// app/(tabs)/_layout.tsx
const { activeRole, roles } = useUserRoles(user)

// Mostrar solo tabs del rol activo
const tabs = {
  admin: ['overview', 'appointments', 'employees', 'settings'],
  employee: ['employments', 'vacancies', 'absences', 'appointments'],
  client: ['search', 'appointments', 'favorites', 'history']
}

return (
  <Tabs>
    {tabs[activeRole].map(tab => (
      <Tabs.Screen key={tab} name={tab} />
    ))}
  </Tabs>
)
```

### 7.3 Deep Linking y Notificaciones
```typescript
// Configuración en app.config.js
scheme: 'gestabiz',
intentFilters: [
  {
    action: 'VIEW',
    data: [
      { scheme: 'gestabiz', host: '*' },
      { scheme: 'https', host: 'gestabiz.com' }
    ]
  }
]

// Manejo en app/_layout.tsx
Linking.addEventListener('url', (event) => {
  const url = Linking.parse(event.url)
  // gestabiz://appointment/123
  // gestabiz://notification/456?role=admin
})
```

**Mapeo de roles**: Usar `notificationRoleMapping.ts` para cambiar rol antes de navegar.

## 8) Consideraciones de UI y performance en móvil
- Mantener deduplicación React Query y claves.
- Evitar memory leaks en subscriptions (canales con nombres estáticos, limpiar al unmount).
- Manejo de loading/toasts con patrón `useAsyncOperation` equivalente.
- Imágenes y listas: usar FlatList/SectionList, lazy loading y memoization.

## 9) Integraciones externas
- **Pagos**: Stripe/PayU/MercadoPago vía Edge Functions y PaymentGatewayFactory; en móvil usar WebView o SDKs oficiales según gateway, preservando el flujo y webhooks.
- **Google Calendar**: Edge Functions para sync; autenticación OAuth móvil o handoff web.
- **Email/SMS/WhatsApp**: Orquestadas por Edge Functions (sin claves sensibles en cliente).

## 10) Seguridad
- No exponer service_role; usar cliente anon y Edge Functions.
- Persistencia segura de sesión (Expo SecureStore recomendado) y claves públicas EXPO.

## 8. COMPONENTES NO PORTABLES (Requerir Reescritura RN)

### 8.1 Componentes con Dependencias Web
**Radix UI** (Dialog, Dropdown, Tabs, Select, etc.):
- ❌ NO compatible con React Native
- ✅ Reemplazar con React Native Paper o componentes nativos

**Tailwind CSS**:
- ❌ Classes NO funcionan en RN
- ✅ Usar StyleSheet o styled-components

**Phosphor Icons**:
- ❌ @phosphor-icons/react es web-only
- ✅ Usar react-native-vector-icons (Ionicons/MaterialIcons)

### 8.2 Componentes Complejos que Requieren Adaptación
**AppointmentWizard** (1,009 líneas):
- Lógica: ✅ Reutilizable (hooks, validaciones)
- UI: ❌ Radix Dialog + Tailwind
- Móvil: Crear navegación modal con React Navigation Modal Stack

**AdminDashboard** (313 líneas):
- Lógica: ✅ `useSupabaseData`, `usePreferredLocation`
- UI: ❌ UnifiedLayout (sidebar web)
- Móvil: Stack navigation con drawer o bottom tabs

**SearchResults** (400+ líneas):
- Lógica: ✅ RPC functions, algoritmos de sorting
- UI: ❌ Grid responsive Tailwind
- Móvil: FlatList con renderItem customizado

### 8.3 Componentes 100% Reutilizables
Estos NO requieren cambios:
- ✅ Todos los hooks (`src/hooks/**`)
- ✅ Todos los servicios (`src/lib/services/**`)
- ✅ Utils (`src/lib/utils.ts`, `validation.ts`)
- ✅ Translations (`src/lib/translations.ts`)
- ✅ Types (`src/types/**`)

## 9. ESTRATEGIA DE MIGRACIÓN POR FASES

### Fase 1: Setup Inicial (2-3 días)
- [ ] Crear estructura `mobile/app/` con Expo Router
- [ ] Configurar `mobile/lib/auth.tsx` reutilizando `useAuthSimple`
- [ ] Setup Supabase singleton con variables `EXPO_PUBLIC_*`
- [ ] Configurar React Query con mismas claves

### Fase 2: Navegación y Auth (3-4 días)
- [ ] Implementar `(auth)` stack (login/register)
- [ ] Implementar `(tabs)` con lógica de roles dinámicos
- [ ] Deep linking con Expo Linking
- [ ] Persistencia con SecureStore/AsyncStorage

### Fase 3: Admin Dashboard (5-7 días)
- [ ] OverviewTab móvil (estadísticas, gráficos con Victory Native)
- [ ] AppointmentsCalendar móvil (react-native-calendars)
- [ ] Locations/Services/Employees con FlatList
- [ ] Settings reutilizando CompleteUnifiedSettings lógica

### Fase 4: Employee Dashboard (3-4 días)
- [ ] MyEmployments con navegación a detalles
- [ ] AbsencesTab con calendario de rango
- [ ] VacationDaysWidget con animaciones
- [ ] AvailableVacanciesMarketplace

### Fase 5: Client Dashboard (4-5 días)
- [ ] SearchBar con resultados en FlatList
- [ ] AppointmentWizard móvil (modal stack)
- [ ] ClientCalendar con react-native-calendars
- [ ] FavoritesList y ClientHistory

### Fase 6: Notificaciones y Chat (3-4 días)
- [ ] expo-notifications configurado
- [ ] NotificationProvider móvil con realtime
- [ ] ChatScreen con react-native-gifted-chat
- [ ] Push notifications locales

### Fase 7: Testing y Polish (3-5 días)
- [ ] Testing E2E con Detox (opcional)
- [ ] Performance optimization
- [ ] UI/UX polish
- [ ] App icons y splash screens

**Total estimado**: 23-32 días de desarrollo

## 10. DEPENDENCIAS MÓVILES REQUERIDAS

```json
{
  "dependencies": {
    // Ya instaladas:
    "@supabase/supabase-js": "^2.38.0",
    "expo": "~49.0.15",
    "expo-router": "^2.0.0",
    "react-native": "0.72.6",
    
    // Por instalar:
    "@tanstack/react-query": "^5.0.0",
    "react-native-paper": "^5.11.1",
    "react-native-vector-icons": "^10.0.0",
    "react-native-calendars": "^1.1302.0",
    "react-native-gifted-chat": "^2.4.0",
    "@react-native-async-storage/async-storage": "1.18.2",
    "expo-secure-store": "~12.3.1",
    "expo-notifications": "~0.20.1",
    "expo-linking": "~5.0.2",
    "date-fns": "^3.6.0", // Ya compatible
    "victory-native": "^36.0.0" // Para gráficos
  }
}
```

## 11. GAPS Y RIESGOS

### 11.1 Riesgos Técnicos (ALTO)
- ⚠️ **Radix UI NO portable**: Requiere reescritura completa de UI
- ⚠️ **Tailwind NO soportado**: Migrar a StyleSheet o styled-components
- ⚠️ **OAuth móvil**: Requiere configuración de schemes y redirect URIs específicos
- ⚠️ **Realtime subscriptions**: Verificar performance en móvil (posible lag)

### 11.2 Riesgos de Negocio (MEDIO)
- ⚠️ **Tiempo estimado**: 23-32 días puede extenderse por complejidad UI
- ⚠️ **Consistencia**: Mantener paridad de features web ↔ móvil
- ⚠️ **Testing**: Sin Supabase local, testing depende de instancia remota

### 11.3 Mitigaciones
- ✅ Reutilizar 100% de hooks/servicios (reducir bugs)
- ✅ Usar React Native Paper (componentes pre-hechos)
- ✅ Documentar diferencias en `mobile/DIFER ENCIAS.md`
- ✅ Crear `TODO.txt` para cualquier ajuste web necesario

## 12. ENTREGABLES FINALES

### 12.1 Código
- [ ] `mobile/app/` completo con todas las pantallas
- [ ] `mobile/lib/` con auth, notifications, utils móviles
- [ ] `mobile/components/` con componentes RN reutilizables
- [ ] Tests unitarios con Jest (hooks)

### 12.2 Documentación
- [x] `mobile/ANALISIS_EXHAUSTIVO_APP.md` ✅ (este documento)
- [ ] `mobile/PLAN_DE_ACCION_MV.md` (siguiente)
- [ ] `mobile/TODO.txt` (ajustes a web si necesarios)
- [ ] `mobile/DIFERENCIAS.md` (web vs móvil)

### 12.3 Configuración
- [ ] `app.config.js` con schemes y permisos
- [ ] `.env.mobile` con variables Expo
- [ ] EAS Build config para iOS/Android

---

**Próximo paso**: Generar `PLAN_DE_ACCION_MV.md` con roadmap detallado por tarea.
