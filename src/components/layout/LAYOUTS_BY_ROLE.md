# Layouts por Rol - AppointSync Pro

## 📋 Descripción

Sistema de layouts diferenciados por rol de usuario (Admin, Employee, Client). Cada rol tiene un sidebar de navegación personalizado con opciones específicas según sus permisos y necesidades.

---

## 🎨 Layouts Implementados

### 1. **AdminLayout.tsx** - Para Administradores

**Ubicación**: `src/components/layout/AdminLayout.tsx`

#### Opciones de Menú
```typescript
🏠 Dashboard          // Vista general del negocio
📅 Appointments       // Gestión completa de citas
👥 Clients           // Gestión de clientes
💼 Employees         // Gestión de empleados (solo admin)
📍 Locations         // Gestión de ubicaciones múltiples
🕐 Services          // Gestión de servicios
📊 Reports           // Analíticas y reportes avanzados
⚙️ Settings          // Configuración del negocio
```

#### Características Específicas
- **Acceso completo**: Todas las funcionalidades del sistema
- **Multi-ubicación**: Gestión de múltiples sucursales
- **Reportes avanzados**: Analíticas financieras y KPIs
- **Gestión de equipo**: CRUD de empleados
- **Badge de rol**: "Admin" en la sección de usuario

#### Color de identificación
- Usuario badge: `text-gray-400` con texto "Admin"

---

### 2. **EmployeeLayout.tsx** - Para Empleados

**Ubicación**: `src/components/layout/EmployeeLayout.tsx`

#### Opciones de Menú
```typescript
🏠 My Schedule       // Agenda personal del día
📅 Appointments      // Citas asignadas al empleado
👥 Clients           // Clientes de su ubicación
✅ Tasks             // Tareas y pendientes
🕐 Availability      // Gestión de disponibilidad horaria
⚙️ Settings          // Preferencias personales
```

#### Características Específicas
- **Acceso limitado**: Solo citas y clientes de su ubicación
- **Enfoque en agenda**: Prioridad en calendario personal
- **Sin reportes financieros**: No tiene acceso a analytics
- **Gestión de tareas**: Lista de pendientes diarios
- **Badge de rol**: "Employee" en la sección de usuario

#### Color de identificación
- Usuario badge: `text-gray-400` con texto "Employee"

---

### 3. **ClientLayout.tsx** - Para Clientes

**Ubicación**: `src/components/layout/ClientLayout.tsx`

#### Opciones de Menú
```typescript
🏠 My Appointments   // Vista de citas propias
📍 Locations         // Ubicaciones disponibles para agendar
👤 Profile           // Perfil personal
⚙️ Settings          // Preferencias y notificaciones
```

#### Características Específicas
- **Vista simplificada**: Solo información relevante para el cliente
- **Solo lectura**: Ver sus propias citas
- **Agendar citas**: Funcionalidad principal
- **Gestión de perfil**: Datos personales y preferencias
- **Badge de rol**: Email del usuario

#### Color de identificación
- Usuario badge: `text-gray-400` con email completo

---

## 🔧 Implementación en MainApp.tsx

### Selección Automática de Layout

```typescript
const getLayoutComponent = () => {
  if (user.role === 'admin') return AdminLayout
  if (user.role === 'employee') return EmployeeLayout
  return ClientLayout
}

const LayoutComponent = getLayoutComponent()

return (
  <LayoutComponent
    user={user}
    currentView={currentView}
    onNavigate={handleNavigate}
    onLogout={handleLogout}
  >
    {renderCurrentView()}
  </LayoutComponent>
)
```

---

## 🎨 Diseño Común de Todos los Layouts

### Estructura Visual
```
┌────────────────────────────────────────────┐
│  Logo AppointSync                          │
├────────────────────────────────────────────┤
│  🏠 Opción 1 (activa = violeta)           │
│  📅 Opción 2                               │
│  👥 Opción 3                               │
│  ...                                        │
│                                             │
│  (espacio flexible)                         │
│                                             │
├────────────────────────────────────────────┤
│  👤 Nombre Usuario                         │
│     Badge de rol                           │
│  🚪 Log Out                                │
└────────────────────────────────────────────┘
```

### Paleta de Colores (Común)
```css
/* Sidebar */
--sidebar-bg: #0f0f0f
--sidebar-border: rgba(255, 255, 255, 0.05)

/* Item Activo */
--nav-active-bg: #6820F7
--nav-active-hover: #7830FF
--nav-active-text: #ffffff

/* Item Inactivo */
--nav-inactive-text: #9ca3af
--nav-hover-bg: rgba(255, 255, 255, 0.05)

/* Usuario */
--user-name: #ffffff
--user-role: #9ca3af
```

### Tipografía (Común)
```css
Logo: Outfit Bold / 20px
Menu items: Outfit Medium / 16px
User name: Outfit Medium / 14px
User role: Outfit Regular / 12px
```

---

## 📊 Comparativa de Funcionalidades

| Funcionalidad | Admin | Employee | Client |
|--------------|-------|----------|--------|
| Dashboard general | ✅ | ✅ | ✅ |
| Ver todas las citas | ✅ | 🔸 Solo su ubicación | ❌ Solo propias |
| Crear citas | ✅ | ✅ | ✅ |
| Gestionar clientes | ✅ | ✅ | ❌ |
| Gestionar empleados | ✅ | ❌ | ❌ |
| Gestionar ubicaciones | ✅ | ❌ | ❌ |
| Gestionar servicios | ✅ | 🔸 Limitado | ❌ |
| Ver reportes | ✅ | ❌ | ❌ |
| Gestionar tareas | ❌ | ✅ | ❌ |
| Ver locaciones | ✅ | ✅ | ✅ |
| Configuración | ✅ Full | ✅ Personal | ✅ Personal |

**Leyenda:**
- ✅ Acceso completo
- 🔸 Acceso limitado
- ❌ Sin acceso

---

## 🚀 Uso de los Layouts

### Admin - Caso de Uso
```typescript
// Usuario admin ve:
- Dashboard con métricas de todos los negocios
- Puede gestionar empleados y ubicaciones
- Acceso a reportes financieros
- Gestión completa de servicios
```

### Employee - Caso de Uso
```typescript
// Usuario employee ve:
- Su agenda del día
- Citas asignadas a él
- Clientes de su ubicación
- Sus tareas pendientes
- Gestión de su disponibilidad horaria
```

### Client - Caso de Uso
```typescript
// Usuario client ve:
- Sus citas próximas y pasadas
- Ubicaciones donde puede agendar
- Su perfil personal
- Preferencias de notificaciones
```

---

## 🎯 Navegación Según Rol

### Admin puede navegar a:
```
dashboard → appointments → clients → employees → 
locations → services → reports → settings → profile
```

### Employee puede navegar a:
```
dashboard (schedule) → appointments → clients → 
tasks → availability → settings → profile
```

### Client puede navegar a:
```
dashboard (appointments) → locations → 
profile → settings
```

---

## 📱 Props Comunes

Todos los layouts comparten la misma interfaz:

```typescript
interface LayoutProps {
  user: User                           // Usuario autenticado
  children: React.ReactNode            // Contenido a renderizar
  currentView: string                  // Vista actual activa
  onNavigate: (view: string) => void   // Handler de navegación
  onLogout: () => void                 // Handler de logout
}
```

---

## ✨ Características Futuras

### Sidebar Colapsable
- [ ] Botón toggle en el header
- [ ] Width: 256px → 64px
- [ ] Solo iconos visibles
- [ ] Tooltip en hover

### Responsive Mobile
- [ ] Hamburger menu
- [ ] Bottom navigation
- [ ] Drawer lateral deslizable

### Personalización
- [ ] Reorganizar items del menú
- [ ] Ocultar/mostrar secciones
- [ ] Temas de color personalizados
- [ ] Atajos de teclado

### Notificaciones
- [ ] Badge de contador en items
- [ ] Alertas importantes
- [ ] Status indicators

---

## 🔗 Archivos Relacionados

```
src/components/layout/
├── AdminLayout.tsx      // Layout para administradores
├── EmployeeLayout.tsx   // Layout para empleados
├── ClientLayout.tsx     // Layout para clientes
└── README.md           // Esta documentación

src/components/
└── MainApp.tsx         // Selector de layout según rol
```

---

## 🎨 Personalizaciones por Rol

### Admin
- Más opciones de menú (8 items)
- Iconos: Home, Calendar, Users, Briefcase, MapPin, Clock, BarChart3, Settings
- Colores: Mismos que base
- Badge: "Admin"

### Employee
- Menú enfocado en tareas (6 items)
- Iconos: Home, Calendar, Users, CheckSquare, Clock, Settings
- Colores: Mismos que base
- Badge: "Employee"
- Primera opción: "My Schedule" (en vez de Dashboard)

### Client
- Menú simplificado (4 items)
- Iconos: Home, MapPin, UserCircle, Settings
- Colores: Mismos que base
- Badge: Email completo
- Primera opción: "My Appointments"

---

## 📊 Estado de Implementación

- ✅ AdminLayout creado
- ✅ EmployeeLayout creado
- ✅ ClientLayout creado
- ✅ Selección automática en MainApp
- ✅ Props compartidas
- ✅ Estructura común
- ⏳ Sidebar colapsable
- ⏳ Responsive mobile
- ⏳ Personalización de menú
- ⏳ Notificaciones con badges

---

**Archivo creado**: 5 de octubre de 2025  
**Versión**: 1.0.0  
**Componentes**: AdminLayout, EmployeeLayout, ClientLayout  
**Autor**: GitHub Copilot AI Assistant
