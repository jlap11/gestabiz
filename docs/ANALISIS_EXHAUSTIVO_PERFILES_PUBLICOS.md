# 🔍 Análisis Exhaustivo de la Aplicación AppointSync Pro
## Para Implementación de Perfiles Públicos

**Fecha**: 17 de Octubre de 2025  
**Autor**: Análisis de Arquitectura  
**Objetivo**: Entender el 100% de la app para implementar perfiles públicos de negocios indexables en Google

---

## 📋 TABLA DE CONTENIDOS

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura General](#2-arquitectura-general)
3. [Sistema de Autenticación y Roles](#3-sistema-de-autenticación-y-roles)
4. [Modelo de Datos](#4-modelo-de-datos)
5. [Componentes Clave](#5-componentes-clave)
6. [Sistema de Rutas y Navegación](#6-sistema-de-rutas-y-navegación)
7. [Funcionalidades Existentes](#7-funcionalidades-existentes)
8. [Reglas de Negocio](#8-reglas-de-negocio)
9. [Flujos de Usuario](#9-flujos-de-usuario)
10. [Análisis para Perfiles Públicos](#10-análisis-para-perfiles-públicos)

---

## 1. RESUMEN EJECUTIVO

### 1.1 ¿Qué es AppointSync Pro (Gestabiz)?

AppointSync Pro es una **plataforma SaaS completa de gestión de negocios** que permite:

- 📅 **Gestión de Citas**: Calendario inteligente, prevención de conflictos
- 👥 **Multi-Roles Dinámicos**: Admin, Employee, Client (1 usuario = múltiples roles)
- 💳 **Sistema de Pagos**: Triple gateway (Stripe/PayU/MercadoPago)
- 🔔 **Notificaciones Multicanal**: Email/SMS/WhatsApp con AWS
- 🔍 **Búsqueda Avanzada**: Full-text search con geolocalización
- ⭐ **Reviews Anónimas**: Sistema de reseñas validadas
- 💼 **Portal de Vacantes**: Reclutamiento y matching inteligente
- 📊 **Sistema Contable**: IVA, ICA, Retención (Colombia)
- 📱 **App Móvil**: Expo React Native (iOS/Android)
- 🧩 **Extensión de Navegador**: Chrome extension

### 1.2 Stack Tecnológico

```plaintext
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│ • React 18.3.1 + TypeScript 5.7.2                               │
│ • Vite (bundler)                                                │
│ • TailwindCSS + shadcn/ui (componentes)                        │
│ • React Query (cache y estado servidor)                        │
│ • Zustand / Context API (estado local)                         │
│ • React Router (NO IMPLEMENTADO - SPA pura con componentes)     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
├─────────────────────────────────────────────────────────────────┤
│ • Supabase (PostgreSQL + Auth + Storage + Realtime)            │
│ • Edge Functions (Deno) para lógica compleja                   │
│ • RLS Policies (seguridad a nivel de fila)                     │
│ • pg_cron para tareas programadas                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      INTEGRACIONES                               │
├─────────────────────────────────────────────────────────────────┤
│ • Stripe / PayU / MercadoPago (pagos)                          │
│ • AWS SES (emails), AWS SNS (SMS)                              │
│ • WhatsApp Business API                                        │
│ • Google Calendar Sync                                         │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Estructura del Proyecto

```plaintext
appointsync-pro/
├── src/
│   ├── components/          # Componentes React
│   │   ├── admin/           # Dashboard admin
│   │   ├── employee/        # Dashboard employee
│   │   ├── client/          # Dashboard client
│   │   ├── business/        # BusinessProfile.tsx ⭐ CLAVE
│   │   ├── user/            # UserProfile.tsx (profesionales)
│   │   ├── auth/            # AuthScreen.tsx (login/register)
│   │   ├── landing/         # LandingPage.tsx (pública)
│   │   ├── layouts/         # UnifiedLayout (common layout)
│   │   └── ui/              # shadcn/ui components
│   ├── hooks/               # Custom hooks
│   │   ├── useAuth.ts       # Autenticación
│   │   ├── useUserRoles.ts  # Sistema de roles dinámicos ⭐ CLAVE
│   │   ├── useSupabaseData.ts # Fetch data con filtros
│   │   └── ...
│   ├── lib/                 # Utilidades
│   │   ├── supabase.ts      # Cliente Supabase
│   │   ├── permissions.ts   # Sistema de permisos
│   │   ├── notificationRoleMapping.ts # Navegación por notificaciones
│   │   └── translations.ts  # i18n (español/inglés)
│   ├── contexts/            # React contexts
│   │   ├── ThemeContext.tsx # Tema claro/oscuro
│   │   ├── LanguageContext.tsx # Idioma
│   │   ├── AppStateContext.tsx # Estado global
│   │   └── NotificationContext.tsx # Notificaciones in-app
│   ├── types/               # TypeScript types
│   │   └── types.ts         # ⭐ FUENTE DE VERDAD tipos
│   ├── App.tsx              # Punto de entrada (NO usa Router) ⭐
│   └── main.tsx             # ReactDOM.render
├── supabase/
│   ├── migrations/          # Migraciones SQL
│   └── functions/           # Edge Functions (Deno)
├── database/
│   └── schema.sql           # Schema inicial
├── docs/                    # Documentación extensa
└── mobile/                  # App Expo (separada)
```

---

## 2. ARQUITECTURA GENERAL

### 2.1 Patrón de Arquitectura

**SPA (Single Page Application) sin React Router**

La aplicación NO usa React Router. En su lugar:

```tsx
// App.tsx - Flujo de renderizado condicional
function AppContent() {
  const { user, session } = useAuthSimple()
  const [showLanding, setShowLanding] = useState(!user && !session)

  // 1. Mostrar landing page si no hay sesión
  if (showLanding && !user && !session) {
    return <LandingPage onNavigateToAuth={() => setShowLanding(false)} />
  }

  // 2. Mostrar AuthScreen si no hay usuario
  if (!user || !session) {
    return <AuthScreen />
  }

  // 3. Usuario autenticado → MainApp con NotificationProvider
  return (
    <NotificationProvider userId={user.id}>
      <MainApp onLogout={handleLogout} />
    </NotificationProvider>
  )
}
```

**MainApp.tsx** - Switch basado en rol activo:

```tsx
// MainApp.tsx
function MainApp({ onLogout }) {
  const { user } = useAuthSimple()
  const { activeRole } = useUserRoles(user)

  if (activeRole === 'admin') {
    return <AdminDashboard ... />
  }
  if (activeRole === 'employee') {
    return <EmployeeDashboard ... />
  }
  return <ClientDashboard ... /> // Default: client
}
```

### 2.2 Estado de la Aplicación

```plaintext
┌──────────────────────────────────────────────────────┐
│               ESTADO GLOBAL (Contexts)                │
├──────────────────────────────────────────────────────┤
│ • ThemeContext: 'light' | 'dark'                     │
│ • LanguageContext: 'es' | 'en'                       │
│ • AppStateContext: loading, error, toasts           │
│ • NotificationContext: in-app notifications          │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│           ESTADO DE AUTENTICACIÓN (useAuth)           │
├──────────────────────────────────────────────────────┤
│ • user: User | null                                  │
│ • session: Session | null                            │
│ • signIn, signUp, signOut, signInWithGoogle          │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│       ESTADO DE ROLES (useUserRoles) ⭐ CLAVE        │
├──────────────────────────────────────────────────────┤
│ • roles: UserRoleAssignment[] (calculados dinámicos) │
│ • activeRole: 'admin' | 'employee' | 'client'        │
│ • activeBusiness: { id, name } | undefined           │
│ • switchRole(role, businessId?): boolean             │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│     ESTADO DE DATOS (React Query + useSupabaseData)  │
├──────────────────────────────────────────────────────┤
│ • Appointments, Businesses, Services, Locations      │
│ • Reviews, Notifications, Vacancies, Applications    │
│ • Cache con staleTime 5 min                          │
└──────────────────────────────────────────────────────┘
```

---

## 3. SISTEMA DE AUTENTICACIÓN Y ROLES

### 3.1 Autenticación (Supabase Auth)

**Hook**: `useAuth()` - `src/hooks/useAuth.ts`

```tsx
const { user, session, signIn, signUp, signOut, signInWithGoogle } = useAuth()

// user: User | null
interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  roles: UserRoleAssignment[]    // ⭐ Múltiples roles
  activeRole: UserRole           // 'admin' | 'employee' | 'client'
  role: UserRole                 // Legacy support
  phone?: string
  created_at: string
  // ... más campos
}
```

**Flujo de Login**:
1. Usuario ingresa email/password → `signIn(email, password)`
2. Supabase Auth valida credenciales
3. Se obtiene `session` y `user` de Supabase
4. Hook `convertToUser()` busca perfil en tabla `profiles`
5. Hook `useUserRoles()` calcula roles disponibles **dinámicamente**
6. Usuario queda autenticado con roles activos

### 3.2 Sistema de Roles Dinámicos ⭐ CRÍTICO

**Hook**: `useUserRoles(user)` - `src/hooks/useUserRoles.ts`

**REGLA FUNDAMENTAL**: Los roles NO se guardan en base de datos. Se calculan en **runtime** basándose en relaciones.

#### Cálculo de Roles

```typescript
// Pseudocódigo del cálculo dinámico
function calculateRoles(userId: string): UserRoleAssignment[] {
  const roles = []

  // 1. ADMIN: Si es owner de algún negocio
  const ownedBusinesses = await supabase
    .from('businesses')
    .select('id, name')
    .eq('owner_id', userId)
  
  ownedBusinesses.forEach(biz => {
    roles.push({
      role: 'admin',
      business_id: biz.id,
      business_name: biz.name
    })
  })

  // 2. EMPLOYEE: Si está en business_employees
  const employments = await supabase
    .from('business_employees')
    .select('business_id, businesses(name)')
    .eq('employee_id', userId)  // ⚠️ NO user_id
  
  employments.forEach(emp => {
    roles.push({
      role: 'employee',
      business_id: emp.business_id,
      business_name: emp.businesses.name
    })
  })

  // 3. CLIENT: Siempre disponible (todos pueden reservar)
  roles.push({
    role: 'client',
    business_id: null
  })

  return roles
}
```

#### Persistencia de Rol Activo

- **localStorage**: `active_role_context`
  ```json
  {
    "role": "admin",
    "businessId": "uuid-123",
    "businessName": "Salón Belleza"
  }
  ```

- Al cambiar de rol: `switchRole('employee', 'uuid-456')`
  - Actualiza `activeRole` en estado
  - Actualiza `activeBusiness` en estado
  - Guarda en localStorage (NO en DB)
  - React re-renderiza automáticamente el componente correcto

#### Escenarios de Roles

```plaintext
Usuario A:
  - ADMIN de Negocio X (owner_id = A)
  - EMPLOYEE de Negocio Y (business_employees.employee_id = A)
  - CLIENT (siempre)
  → Tiene 3 roles activos, puede iterar entre ellos

Usuario B:
  - ADMIN de Negocio Z (owner_id = B)
  - CLIENT (siempre)
  → Tiene 2 roles activos

Usuario C:
  - CLIENT (siempre)
  → Solo 1 rol (puede aplicar a vacantes para convertirse en employee)
```

---

## 4. MODELO DE DATOS

### 4.1 Tablas Principales

#### `profiles` (Usuarios)
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,              -- Referencia a auth.users
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role user_role DEFAULT 'client',  -- Legacy (NO se usa en roles dinámicos)
  settings JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

#### `businesses` (Negocios)
```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES profiles(id),  -- ⭐ Define ADMIN
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  logo_url TEXT,
  banner_url TEXT,
  website TEXT,
  category_id UUID,                      -- Categoría principal
  business_hours JSONB,
  settings JSONB,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

#### `business_employees` (Empleados por negocio)
```sql
CREATE TABLE business_employees (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  employee_id UUID REFERENCES profiles(id),  -- ⚠️ NO user_id
  role TEXT CHECK (role IN ('employee', 'manager')),
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')),
  hired_at TIMESTAMPTZ,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  UNIQUE(business_id, employee_id)
)
```

#### `locations` (Sedes del negocio)
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL,
  postal_code TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  phone TEXT,
  email TEXT,
  hours JSONB,                           -- Horarios específicos de sede
  google_maps_url TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ
)
```

#### `services` (Servicios ofrecidos)
```sql
CREATE TABLE services (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price DECIMAL NOT NULL,
  currency TEXT DEFAULT 'COP',
  category TEXT,
  location_id UUID REFERENCES locations(id),  -- Opcional: servicio en sede específica
  employee_id UUID REFERENCES profiles(id),   -- Opcional: servicio por empleado
  is_active BOOLEAN,
  created_at TIMESTAMPTZ
)
```

#### `reviews` (Reseñas)
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  client_id UUID REFERENCES profiles(id),
  employee_id UUID REFERENCES profiles(id),   -- Opcional: review al profesional
  appointment_id UUID REFERENCES appointments(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_anonymous BOOLEAN DEFAULT TRUE,
  is_visible BOOLEAN DEFAULT TRUE,
  business_response TEXT,
  business_response_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
```

#### `business_categories` (Categorías jerárquicas)
```sql
CREATE TABLE business_categories (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  icon_name TEXT,
  parent_id UUID REFERENCES business_categories(id),  -- NULL si es principal
  description TEXT,
  display_order INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ
)

-- 15 categorías principales + ~60 subcategorías
-- Máximo 3 subcategorías por negocio
```

### 4.2 Relaciones Clave

```plaintext
profiles (usuario)
  ├─ owner_id → businesses (1:N)        [Define ADMIN]
  ├─ employee_id → business_employees (N:M) [Define EMPLOYEE]
  ├─ client_id → appointments (1:N)     [Como cliente]
  └─ employee_id → appointments (1:N)   [Como empleado atendiendo]

businesses (negocio)
  ├─ business_id → locations (1:N)
  ├─ business_id → services (1:N)
  ├─ business_id → business_employees (1:N)
  ├─ business_id → reviews (1:N)
  ├─ business_id → appointments (1:N)
  └─ category_id → business_categories (N:1)

appointments (citas)
  ├─ business_id → businesses (N:1)
  ├─ location_id → locations (N:1)
  ├─ service_id → services (N:1)
  ├─ client_id → profiles (N:1)
  └─ employee_id → profiles (N:1)
```

---

## 5. COMPONENTES CLAVE

### 5.1 BusinessProfile.tsx ⭐ COMPONENTE CLAVE

**Ubicación**: `src/components/business/BusinessProfile.tsx` (699 líneas)

Este es el componente que necesitamos para los perfiles públicos. Actualmente es un **modal**.

#### Estructura del Componente

```tsx
interface BusinessProfileProps {
  businessId: string
  onClose: () => void
  onBookAppointment?: (serviceId?: string, locationId?: string, employeeId?: string) => void
  userLocation?: { latitude: number; longitude: number }
}

export default function BusinessProfile({ businessId, onClose, onBookAppointment, userLocation }: BusinessProfileProps) {
  // Estado
  const [business, setBusiness] = useState<BusinessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('services')
  const [canReview, setCanReview] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)

  // Fetch business data
  useEffect(() => {
    fetchBusinessData()
  }, [businessId])

  // Renderiza 4 tabs:
  return (
    <Card className="modal-overlay">
      {/* Header con banner, logo, nombre, rating */}
      {/* Tabs: Servicios, Ubicaciones, Reseñas, Acerca de */}
      {/* Footer con botón "Agendar Cita" */}
    </Card>
  )
}
```

#### Datos que Muestra

1. **Tab Servicios**: Lista de servicios con precio, duración, empleado asignado
2. **Tab Ubicaciones**: Mapa de sedes con distancia calculada, botón "Ver en Google Maps"
3. **Tab Reseñas**: ReviewList component con ReviewForm si el usuario puede dejar review
4. **Tab Acerca de**: Descripción, categoría, subcategorías, stats (servicios, ubicaciones, rating)

#### Información Mostrada

- **Header**:
  - Banner image (`banner_url`)
  - Logo (`logo_url`)
  - Nombre del negocio
  - Categoría principal
  - Rating promedio + número de reviews
  - Subcategorías (hasta 3)

- **Contacto**:
  - Teléfono, Email, Website (con iconos)

- **Servicios**: 
  - Nombre, descripción, precio (COP), duración, categoría
  - Empleado asignado (avatar + nombre)
  - Botón "Agendar" por servicio

- **Ubicaciones**:
  - Nombre sede, dirección completa
  - Teléfono específico, horarios
  - Distancia desde ubicación del usuario (si tiene geolocalización)
  - Botón "Ver en Google Maps"
  - Botón "Agendar aquí"

- **Reseñas**:
  - ReviewList component (delegado)
  - Formulario si usuario puede dejar review

### 5.2 UserProfile.tsx (Perfiles de Profesionales)

**Ubicación**: `src/components/user/UserProfile.tsx`

Similar a BusinessProfile pero para mostrar perfil de un empleado/profesional individual.

- Tabs: Servicios, Experiencia, Reseñas
- Muestra servicios que ofrece, negocios donde trabaja, bio, stats

### 5.3 LandingPage.tsx (Página Pública)

**Ubicación**: `src/components/landing/LandingPage.tsx`

Ya existe una landing page pública con:
- Hero section
- Features
- Pricing
- Testimonials
- Footer

**Importante**: Ya hay un patrón para contenido público SIN autenticación.

### 5.4 SearchResults.tsx (Búsqueda de Negocios)

**Ubicación**: `src/components/client/SearchResults.tsx`

- Muestra tarjetas de negocios con rating, distancia
- Al hacer clic en un negocio → Abre `BusinessProfile` modal
- Usa RPC functions: `search_businesses()`, `search_services()`, `search_professionals()`

---

## 6. SISTEMA DE RUTAS Y NAVEGACIÓN

### 6.1 Estructura Actual (SIN React Router)

La aplicación NO usa React Router. La navegación se maneja con:

1. **Renderizado condicional** en `App.tsx`:
   - Landing → AuthScreen → MainApp

2. **Switches por rol** en `MainApp.tsx`:
   - Admin → AdminDashboard
   - Employee → EmployeeDashboard
   - Client → ClientDashboard

3. **Navegación dentro de dashboards**:
   - Cada dashboard tiene un estado `activePage`
   - Sidebar con items clickeables que cambian `setActivePage('services')`
   - Render switch basado en `activePage`

Ejemplo en AdminDashboard:
```tsx
const [activePage, setActivePage] = useState('overview')

const renderContent = () => {
  switch (activePage) {
    case 'overview': return <OverviewTab />
    case 'locations': return <LocationsManager />
    case 'services': return <ServicesManager />
    case 'employees': return <EmployeeManagement />
    // ...
  }
}
```

### 6.2 Navegación por Modales

Muchos componentes se abren como **modales overlay**:
- BusinessProfile (modal)
- UserProfile (modal)
- AppointmentWizard (modal)
- ApplicationDetail (modal)

### 6.3 ¿Qué significa esto para Perfiles Públicos?

**PROBLEMA**: No hay sistema de rutas. No se pueden crear URLs como:
```
https://gestabiz.com/negocio/salon-belleza-123
```

**SOLUCIÓN NECESARIA**: Implementar React Router para:
- Rutas públicas: `/negocio/:businessId` o `/negocio/:slug`
- Rutas autenticadas: `/app/*` (todo lo existente)

---

## 7. FUNCIONALIDADES EXISTENTES

### 7.1 Módulos Implementados (100% funcionales)

#### ✅ Autenticación
- Login email/password
- Register
- Google OAuth
- Reset password
- Email verification (Supabase)

#### ✅ Sistema de Roles Dinámicos
- Cálculo automático basado en relaciones
- Switch entre roles sin reload
- Context storage en localStorage

#### ✅ Gestión de Negocios (Admin)
- CRUD de negocios
- Dropdown header para cambiar entre negocios
- Múltiples negocios por admin

#### ✅ Gestión de Sedes (Locations)
- CRUD locations
- Geolocalización (lat/lng)
- Horarios por sede
- Google Maps integration

#### ✅ Gestión de Servicios
- CRUD servicios
- Precio en COP
- Duración en minutos
- Asignación a sede y/o empleado

#### ✅ Gestión de Empleados
- Sistema de solicitudes (EmployeeOnboarding)
- Aprobación/rechazo por admin
- Jerarquía: Owner > Admins > Employees
- Employee puede ofrecer servicios o ser support_staff

#### ✅ Sistema de Citas
- AppointmentWizard (6-8 pasos según contexto)
- Validación de disponibilidad
- Prevención de conflictos
- Sync con Google Calendar

#### ✅ Sistema de Reviews ⭐ CRÍTICO PARA PERFILES PÚBLICOS
- Reviews anónimas
- Validación: solo clientes con citas completadas
- Rating 1-5 estrellas
- Respuestas del negocio
- Toggle visibility
- Agregación automática (average_rating, review_count)

#### ✅ Sistema de Búsqueda Avanzada
- Full-text search con PostgreSQL
- Búsqueda fuzzy con trigram (pg_trgm)
- Geolocalización con cálculo de distancia
- 6 algoritmos de ordenamiento:
  1. Recomendado (balanceado rating + distancia)
  2. Mejor valorados
  3. Más cercanos
  4. Más recientes
  5. Más populares
  6. Precio bajo a alto
- Filtros: categoría, rango de precio, distancia, rating mínimo
- Vistas materializadas: `business_ratings_stats`, `employee_ratings_stats`

#### ✅ Sistema de Notificaciones
- 17 tipos de notificaciones
- Multicanal: Email (AWS SES), SMS (AWS SNS), WhatsApp
- Recordatorios automáticos (24h, 1h, 15min)
- Preferencias por usuario y por negocio
- In-app notifications con navegación automática

#### ✅ Sistema de Vacantes Laborales
- Publicar vacantes por negocio
- Aplicar a vacantes (employee role)
- Matching inteligente (skills, experiencia, salario)
- Detección de conflictos de horario
- Reviews obligatorias al finalizar contrato

#### ✅ Sistema de Facturación (Triple Gateway)
- Stripe, PayU Latam, MercadoPago
- 4 planes: Free, Inicio ($80k), Profesional ($200k), Empresarial ($500k)
- Facturación mensual/anual
- Webhooks para sync automática
- Manejo de límites por plan

#### ✅ Sistema Contable (Colombia)
- Cálculo automático: IVA, ICA, Retención
- Transacciones fiscales
- Reportes P&L, balance
- Export PDF/CSV/Excel

#### ✅ App Móvil (Expo)
- iOS y Android
- React Native
- Stack navigator
- Bottom tabs
- Misma lógica de autenticación

#### ✅ Extensión de Navegador (Chrome)
- Quick access a citas
- Notificaciones desktop

### 7.2 Características de UI/UX

- **Tema claro/oscuro**: ThemeProvider con persistencia localStorage
- **i18n**: Español e Inglés con LanguageContext
- **Responsive**: Mobile-first con TailwindCSS
- **Accesibilidad**: ARIA labels, keyboard navigation
- **Toasts**: Feedback visual con `sonner`
- **Loading states**: Skeletons, spinners
- **Error boundaries**: Manejo robusto de errores

---

## 8. REGLAS DE NEGOCIO

### 8.1 Sistema de Roles

1. **Todos los usuarios tienen ROL CLIENT** (siempre pueden reservar citas)
2. **ADMIN**: Usuario es `owner_id` de un negocio en tabla `businesses`
3. **EMPLOYEE**: Usuario tiene registro en `business_employees` con `employee_id = user.id`
4. **Un usuario puede tener múltiples roles simultáneamente**
5. **Roles NO se guardan en DB**, se calculan en runtime
6. **Rol activo se guarda en localStorage** para persistencia entre sesiones

### 8.2 Reviews

1. **Solo clientes con citas completadas pueden dejar reviews**
2. **1 review por cita** (validación por `appointment_id`)
3. **Reviews son anónimas por defecto** (`is_anonymous = true`)
4. **Negocio puede responder** (`business_response`, `business_response_at`)
5. **Negocio puede ocultar review** (`is_visible = false`)
6. **Rating se agrega automáticamente** en vista materializada

### 8.3 Búsqueda y Descubrimiento

1. **Solo negocios con `is_active = true` aparecen en búsqueda**
2. **Geolocalización es opcional** (si no hay, no se calcula distancia)
3. **Categorías jerárquicas**: 1 principal + hasta 3 subcategorías
4. **Vistas materializadas se refrescan cada 5 minutos** (Edge Function + cron)

### 8.4 Citas

1. **Cliente elige**: Negocio → Sede → Servicio → Empleado (opcional) → Fecha/Hora
2. **Validación de disponibilidad**: No overlap con citas existentes del empleado
3. **Estado inicial**: `pending` → Admin/Employee confirma → `confirmed`
4. **No se pueden crear citas en el pasado** (más de 1 día atrás)
5. **Recordatorios automáticos** según preferencias del negocio

---

## 9. FLUJOS DE USUARIO

### 9.1 Flujo de Registro y Login

```mermaid
graph TD
    A[Usuario visita app] --> B{¿Tiene sesión?}
    B -->|No| C[LandingPage]
    C --> D[Click "Comenzar Gratis"]
    D --> E[AuthScreen]
    E --> F{Login o Register}
    F -->|Register| G[Ingresa email, password, nombre]
    G --> H[Supabase crea usuario en auth.users]
    H --> I[Trigger crea perfil en profiles]
    I --> J[useUserRoles calcula roles disponibles]
    J --> K[Rol inicial: CLIENT]
    K --> L[ClientDashboard]
    
    F -->|Login| M[Ingresa email, password]
    M --> N[Supabase valida credenciales]
    N --> O[Obtiene perfil de profiles]
    O --> J
```

### 9.2 Flujo de Búsqueda y Reserva de Cita (Cliente)

```mermaid
graph TD
    A[ClientDashboard] --> B[Click SearchBar]
    B --> C[Ingresa búsqueda: "salón de belleza"]
    C --> D[Solicita geolocalización opcional]
    D --> E[SearchResults con 6 algoritmos de ordenamiento]
    E --> F[Click en tarjeta de negocio]
    F --> G[Abre BusinessProfile modal]
    G --> H{¿Qué tab?}
    H -->|Servicios| I[Lista de servicios con precios]
    H -->|Ubicaciones| J[Mapa de sedes con distancia]
    H -->|Reseñas| K[ReviewList component]
    H -->|Acerca de| L[Info general, stats]
    I --> M[Click "Agendar" en servicio]
    M --> N[Cierra modal]
    N --> O[Abre AppointmentWizard]
    O --> P[Paso 1: Confirma servicio]
    P --> Q[Paso 2: Selecciona sede]
    Q --> R[Paso 3: Selecciona empleado opcional]
    R --> S[Paso 4: Elige fecha]
    S --> T[Paso 5: Elige horario disponible]
    T --> U[Paso 6: Confirma reserva]
    U --> V[Crea appointment en DB status=pending]
    V --> W[Envía notificación a negocio]
    W --> X[Toast: "Cita solicitada"]
```

### 9.3 Flujo de Admin creando Negocio

```mermaid
graph TD
    A[Usuario registrado] --> B[Switch a rol ADMIN]
    B --> C{¿Tiene negocios?}
    C -->|No| D[AdminOnboarding]
    D --> E[Formulario: Nombre, descripción, categoría, dirección]
    E --> F[Submit]
    F --> G[INSERT INTO businesses owner_id=user.id]
    G --> H[useUserRoles recalcula roles]
    H --> I[Ahora tiene rol ADMIN con business context]
    I --> J[AdminDashboard con dropdown de negocios]
    
    C -->|Sí| K[AdminDashboard]
    K --> L[Dropdown header: "Crear nuevo negocio"]
    L --> D
```

### 9.4 Flujo de Employee solicitando unirse a Negocio

```mermaid
graph TD
    A[Usuario registrado] --> B[Switch a rol EMPLOYEE]
    B --> C{¿Está en business_employees?}
    C -->|No| D[EmployeeOnboarding]
    D --> E[Muestra lista de negocios disponibles]
    E --> F[Busca negocio por nombre/categoría/ciudad]
    F --> G[Click "Solicitar unirme"]
    G --> H[JoinBusiness: Formulario con CV, experiencia, skills]
    H --> I[Submit]
    I --> J[INSERT INTO business_employees status=pending]
    J --> K[Notificación al admin del negocio]
    K --> L[Toast: "Solicitud enviada"]
    L --> M[Espera aprobación]
    
    C -->|Sí status=approved| N[EmployeeDashboard]
```

---

## 10. ANÁLISIS PARA PERFILES PÚBLICOS

### 10.1 Objetivo de la Funcionalidad

Crear **perfiles públicos de negocios** que:

1. **Sean accesibles sin autenticación**
2. **Tengan URL única y amigable**: `/negocio/salon-belleza-medellin`
3. **Estén optimizados para SEO** (indexables en Google)
4. **Muestren información completa** (servicios, ubicaciones, reviews, horarios)
5. **Tengan botón "Reservar Ahora"** que redirija a login
6. **Después del login, regresen al perfil para agendar**

### 10.2 Inspiración: Perfiles de Facebook

Cuando buscas "Salón Belleza Medellín" en Google:
- **Aparece el perfil del negocio** (no requiere login para ver)
- **URL**: `facebook.com/salonbellezamedellin`
- **Muestra**: Fotos, reviews, horarios, ubicación, botón "Mensaje"
- **Open Graph tags** para preview en redes sociales

### 10.3 ¿Qué tenemos ya?

✅ **Componente BusinessProfile completo** (699 líneas)
✅ **Toda la lógica de fetch de datos de negocio**
✅ **Sistema de reviews y ratings**
✅ **Geolocalización y mapas**
✅ **Sistema de autenticación robusto**
✅ **Landing page pública como ejemplo**

### 10.4 ¿Qué falta implementar?

❌ **React Router** para rutas públicas
❌ **Ruta pública** `/negocio/:businessId` o `/negocio/:slug`
❌ **SEO**: Meta tags, Open Graph, JSON-LD
❌ **Slug en tabla businesses** para URLs amigables
❌ **Componente PublicBusinessProfile** (versión de BusinessProfile sin modal)
❌ **Redirect post-login con state** para regresar al perfil
❌ **Sitemap XML** con todos los negocios
❌ **Pre-rendering o SSR** (opcional pero recomendado)

### 10.5 Desafíos Técnicos

#### 1. SPA vs SEO

**Problema**: Las SPA (Single Page Applications) no son ideales para SEO porque:
- Google crawler necesita HTML pre-renderizado
- Meta tags dinámicas no funcionan en crawlers sin JS

**Soluciones**:
- **Opción A**: Pre-rendering con `react-snap` (genera HTML estático en build)
- **Opción B**: SSR (Server-Side Rendering) con Vite SSR o Next.js
- **Opción C**: Dynamic rendering con servicio externo (Prerender.io)
- **Opción D**: Hybrid: Rutas públicas pre-renderizadas, app privada como SPA

#### 2. URL Structure

**Opciones**:
```plaintext
Opción 1: UUID en URL (no amigable SEO)
  /negocio/550e8400-e29b-41d4-a716-446655440000

Opción 2: Slug único (mejor SEO)
  /negocio/salon-belleza-medellin
  /negocio/dr-carlos-ramirez-odontologia

Opción 3: Slug + UUID (único pero largo)
  /negocio/salon-belleza-medellin-550e8400

Opción 4: Username/handle (tipo Facebook)
  /@salonbellezamedellin
  /@drcarlosramirez
```

**Recomendación**: Opción 2 (Slug único) con fallback a UUID si slug ya existe

#### 3. Navegación Post-Login

**Flujo deseado**:
```plaintext
1. Usuario sin login visita: /negocio/salon-belleza
2. Click "Reservar Ahora"
3. Redirect a /login?redirect=/negocio/salon-belleza
4. Usuario hace login
5. Redirect de vuelta a /negocio/salon-belleza
6. Ahora con usuario autenticado, puede abrir AppointmentWizard
```

**Implementación con React Router**:
```tsx
// En PublicBusinessProfile
<Button onClick={() => {
  if (!user) {
    navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`)
  } else {
    setShowAppointmentWizard(true)
  }
}}>
  Reservar Ahora
</Button>

// En AuthScreen (después de login exitoso)
const searchParams = new URLSearchParams(location.search)
const redirect = searchParams.get('redirect') || '/app'
navigate(redirect)
```

#### 4. Datos Necesarios para SEO

Para cada perfil público, necesitamos meta tags:

```html
<!-- Primary Meta Tags -->
<title>Salón Belleza Medellín - Corte, Color, Manicure | Gestabiz</title>
<meta name="title" content="Salón Belleza Medellín - Corte, Color, Manicure" />
<meta name="description" content="Salón de belleza en Medellín. Servicios: Corte de cabello, Color, Manicure, Pedicure. ⭐ 4.8 (127 reseñas). Agenda tu cita ahora." />
<meta name="keywords" content="salón belleza, peluquería Medellín, corte cabello, manicure, pedicure" />

<!-- Open Graph / Facebook -->
<meta property="og:type" content="business.business" />
<meta property="og:url" content="https://gestabiz.com/negocio/salon-belleza-medellin" />
<meta property="og:title" content="Salón Belleza Medellín" />
<meta property="og:description" content="Servicios de belleza profesional. ⭐ 4.8 (127 reseñas)" />
<meta property="og:image" content="https://gestabiz.com/api/og-image/salon-belleza-medellin.png" />

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image" />
<meta property="twitter:url" content="https://gestabiz.com/negocio/salon-belleza-medellin" />
<meta property="twitter:title" content="Salón Belleza Medellín" />
<meta property="twitter:description" content="Servicios de belleza profesional. ⭐ 4.8" />
<meta property="twitter:image" content="https://gestabiz.com/api/og-image/salon-belleza-medellin.png" />

<!-- JSON-LD Schema.org -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BeautySalon",
  "name": "Salón Belleza Medellín",
  "image": "https://gestabiz.com/images/salon-belleza.jpg",
  "description": "Salón de belleza profesional en Medellín",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Calle 10 # 43-20",
    "addressLocality": "Medellín",
    "addressRegion": "Antioquia",
    "postalCode": "050001",
    "addressCountry": "CO"
  },
  "telephone": "+573001234567",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "127"
  },
  "priceRange": "$$",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "09:00",
      "closes": "19:00"
    }
  ]
}
</script>
```

### 10.6 Componentes Existentes que Reutilizaremos

1. **BusinessProfile.tsx** (699 líneas)
   - ✅ Lógica completa de fetch de datos
   - ✅ 4 tabs (Servicios, Ubicaciones, Reseñas, Acerca de)
   - ❌ Actualmente es un modal → Adaptar para página completa

2. **ReviewList.tsx** + **ReviewCard.tsx**
   - ✅ Display de reviews con rating
   - ✅ Respuestas del negocio

3. **SearchBar.tsx** + **SearchResults.tsx**
   - ✅ Búsqueda de negocios funcional
   - ✅ Cards con preview del negocio

4. **LandingPage.tsx**
   - ✅ Ejemplo de página pública
   - ✅ Layout completo con header/footer

### 10.7 Datos del Negocio Disponibles

Desde `BusinessProfile.tsx`, ya obtenemos:

```typescript
interface BusinessData {
  // Básico
  id: string
  name: string
  description: string
  phone: string
  email: string
  website?: string
  logo_url?: string
  banner_url?: string
  
  // Rating agregado
  rating: number          // De vista materializada
  reviewCount: number     // De vista materializada
  
  // Categorización
  category?: { name: string; icon?: string }
  subcategories?: Array<{ name: string }>
  
  // Ubicaciones (sedes)
  locations: Array<{
    id: string
    name: string
    address: string
    city: string
    state: string
    postal_code: string
    country: string
    latitude?: number
    longitude?: number
    phone?: string
    email?: string
    hours?: Record<string, string>
  }>
  
  // Servicios
  services: Array<{
    id: string
    name: string
    description: string
    duration: number
    price: number
    category?: string
    employee?: {
      id: string
      name: string
      avatar_url?: string
    }
  }>
  
  // Reviews
  reviews: Array<{
    id: string
    rating: number
    comment: string
    created_at: string
    business_response?: string
  }>
}
```

**TODO**: Agregar campos para SEO:
- `slug` (unique, indexed)
- `meta_title`
- `meta_description`
- `meta_keywords`
- `og_image_url`

---

## 11. CONCLUSIONES

### 11.1 Estado Actual

✅ **La aplicación es extremadamente robusta**:
- Sistema de roles dinámicos bien implementado
- Autenticación sólida con Supabase
- Componente BusinessProfile completo (699 líneas) listo para reutilizar
- Sistema de reviews y ratings funcional
- Búsqueda avanzada con geolocalización
- Landing page pública como ejemplo de patrón

✅ **Datos necesarios están disponibles**:
- Tabla `businesses` con toda la info
- Tabla `reviews` con ratings agregados
- Tabla `locations` con geolocalización
- Tabla `services` con precios y duraciones

### 11.2 Próximos Pasos (Ver PLAN_ACCION_PERFILES_PUBLICOS.md)

1. **Instalar React Router** (react-router-dom)
2. **Crear estructura de rutas** públicas vs autenticadas
3. **Agregar campo `slug`** a tabla `businesses`
4. **Crear componente `PublicBusinessProfile`** (versión página completa)
5. **Implementar meta tags dinámicas** con react-helmet-async
6. **Implementar redirect post-login** con state
7. **Generar sitemap.xml** con lista de negocios
8. **Pre-rendering** (opcional) con react-snap
9. **Testing** de perfiles públicos

### 11.3 Impacto Estimado

- **Esfuerzo**: Medio (3-5 días de desarrollo)
- **Complejidad**: Media-Baja (95% del código ya existe)
- **ROI**: ALTO (indexación en Google = tráfico orgánico gratuito)
- **Dependencias**: React Router (única dependencia nueva)

---

**FIN DEL ANÁLISIS EXHAUSTIVO**
