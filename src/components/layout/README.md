# AppLayout Component - Layout con Sidebar de Navegación

## 📋 Descripción

Componente de layout principal que proporciona una estructura de aplicación con sidebar izquierdo para navegación y área de contenido principal a la derecha. Diseñado para coincidir con el diseño de referencia de AppointSync Pro.

---

## 🎨 Estructura Visual

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│  ┌──────────┬────────────────────────────────────┐  │
│  │          │                                    │  │
│  │          │                                    │  │
│  │ SIDEBAR  │       CONTENIDO PRINCIPAL         │  │
│  │          │                                    │  │
│  │          │                                    │  │
│  └──────────┴────────────────────────────────────┘  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## 🧩 Componentes

### **AppLayout.tsx**
**Ubicación**: `src/components/layout/AppLayout.tsx`

**Props:**
```typescript
interface AppLayoutProps {
  user: User                           // Usuario autenticado
  children: React.ReactNode            // Contenido a renderizar
  currentView: string                  // Vista actual activa
  onNavigate: (view: string) => void   // Handler de navegación
  onLogout: () => void                 // Handler de logout
}
```

---

## 🎨 Características de Diseño

### **Sidebar (Barra Lateral Izquierda)**

#### **Logo/Brand Section**
- **Fondo**: `#0f0f0f` (negro profundo)
- **Icono**: Calendario violeta `#6820F7` en contenedor de 40x40px
- **Texto**: "AppointSync" en blanco, font-bold, 20px
- **Borde inferior**: `border-white/5`

#### **Menú de Navegación**
- **Items del menú**:
  - 🏠 My Appointments (Dashboard)
  - 📍 Locations
  - 👤 Profile
  - ⚙️ Settings

- **Estado Activo**:
  - Fondo: `bg-[#6820F7]` (violeta)
  - Texto: `text-white`
  - Hover: `bg-[#7830FF]`

- **Estado Inactivo**:
  - Texto: `text-gray-400`
  - Hover: `bg-white/5` + `text-white`

- **Botones**:
  - Altura: `44px` (h-11)
  - Bordes redondeados: `rounded-lg`
  - Gap entre ícono y texto: `12px` (gap-3)
  - Iconos: Lucide React, 20px (h-5 w-5)

#### **Sección de Usuario (Footer)**
- **Borde superior**: `border-white/5`
- **Avatar**:
  - Tamaño: 36x36px (h-9 w-9)
  - Fallback: Iniciales en violeta `#6820F7`
- **Info de usuario**:
  - Nombre: `text-white`, font-medium, 14px
  - Email: `text-gray-400`, 12px
- **Botón de perfil**: Hover `bg-white/5`
- **Botón Log Out**: 
  - Ícono: LogOut de Lucide
  - Hover: `bg-white/5`

### **Área de Contenido Principal**
- **Flex**: `flex-1` (ocupa espacio restante)
- **Overflow**: `overflow-auto` (scroll si es necesario)
- **Renderiza**: `{children}` prop

---

## 🔧 Uso

### **Ejemplo Básico**

```tsx
import AppLayout from '@/components/layout/AppLayout'

function MainApp({ onLogout }) {
  const { user } = useAuthSimple()
  const [currentView, setCurrentView] = useState('dashboard')

  const handleNavigate = (view: string) => {
    setCurrentView(view)
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard user={user} />
      case 'profile':
        return <ProfilePage user={user} />
      case 'settings':
        return <SettingsPage user={user} />
      default:
        return <Dashboard user={user} />
    }
  }

  return (
    <AppLayout
      user={user}
      currentView={currentView}
      onNavigate={handleNavigate}
      onLogout={onLogout}
    >
      {renderView()}
    </AppLayout>
  )
}
```

---

## 🎯 Navegación

### **Items de Menú Configurables**

Los items del menú se definen en el array `menuItems`:

```typescript
const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'My Appointments',
    icon: Home,
  },
  {
    id: 'locations',
    label: 'Locations',
    icon: MapPin,
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: UserCircle,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
  },
]
```

### **Filtrado por Roles (Opcional)**

Puedes agregar restricciones por rol:

```typescript
{
  id: 'employees',
  label: 'Employees',
  icon: Users,
  roles: ['admin']  // Solo visible para admins
}
```

---

## 🎨 Paleta de Colores

```css
/* Sidebar */
--sidebar-bg: #0f0f0f           /* Fondo sidebar */
--sidebar-border: rgba(255, 255, 255, 0.05)

/* Navegación */
--nav-active-bg: #6820F7        /* Violeta - item activo */
--nav-active-hover: #7830FF     /* Violeta más claro */
--nav-inactive-text: #9ca3af    /* Gris 400 */
--nav-hover-bg: rgba(255, 255, 255, 0.05)

/* Contenido */
--content-bg: #1a1a1a           /* Fondo principal */

/* Usuario */
--user-name: #ffffff            /* Blanco */
--user-email: #9ca3af           /* Gris 400 */
--avatar-fallback: #6820F7      /* Violeta */
```

---

## 📱 Responsive Design

### **Desktop (≥1024px)**
- Sidebar visible: 256px (w-64)
- Layout: Flexbox horizontal

### **Tablet/Mobile (<1024px)**
- **Por implementar**: 
  - Sidebar colapsable con hamburger menu
  - Bottom navigation bar
  - Full-width content

---

## ✨ Características Futuras

### **Sidebar Colapsable**
```typescript
const [isCollapsed, setIsCollapsed] = useState(false)

// En collapsed mode:
// - Width: 64px (w-16)
// - Solo iconos visibles
// - Logo como ícono solo
// - Avatar sin texto
```

### **Bottom Navigation (Mobile)**
```typescript
// Vista móvil alternativa
<nav className="fixed bottom-0 left-0 right-0 bg-[#0f0f0f] border-t border-white/5">
  {/* Icons only con labels debajo */}
</nav>
```

### **Breadcrumbs**
```typescript
// Agregar breadcrumbs en el header del contenido
<div className="px-6 py-4 border-b border-white/5">
  <Breadcrumb>
    <BreadcrumbItem>Dashboard</BreadcrumbItem>
    <BreadcrumbItem active>Appointments</BreadcrumbItem>
  </Breadcrumb>
</div>
```

---

## 🔗 Integración con Vistas Existentes

### **Dashboard.tsx**
Ya no necesita renderizar header/navigation propios. El Layout maneja:
- ✅ Navegación lateral
- ✅ Info de usuario
- ✅ Logout button

### **ClientDashboard.tsx**
Mantiene su propio header interno con:
- Welcome message
- Role selector dropdown
- "Book New Appointment" button

### **ProfilePage.tsx**
Puede recibir prop `onClose` para volver:
```typescript
<ProfilePage 
  user={user} 
  onClose={() => onNavigate('dashboard')} 
/>
```

---

## 📊 Estado de Implementación

- ✅ Estructura básica del layout
- ✅ Sidebar con navegación
- ✅ Iconografía Lucide React
- ✅ Estados activo/inactivo
- ✅ Sección de usuario con avatar
- ✅ Botón de logout
- ✅ Área de contenido principal
- ✅ Integración con MainApp.tsx
- ⏳ Sidebar colapsable
- ⏳ Responsive mobile
- ⏳ Animaciones de transición
- ⏳ Breadcrumbs

---

## 🎨 Diseño de Referencia

El layout sigue el diseño mostrado en la imagen de referencia:
- Sidebar oscuro (#0f0f0f) a la izquierda
- Logo "AppointSync" con ícono violeta
- Menú vertical con iconos
- Usuario en la parte inferior
- Contenido principal ocupando el resto

---

## 🚀 Próximos Pasos

1. **Implementar sidebar colapsable**
   - Toggle button en el header
   - Animación de transición
   - Persistencia del estado en localStorage

2. **Responsive mobile**
   - Hamburger menu
   - Bottom navigation
   - Drawer lateral

3. **Animaciones**
   - Transiciones suaves en navegación
   - Fade in/out al cambiar vistas
   - Hover effects mejorados

4. **Accesibilidad**
   - Keyboard shortcuts (Alt+1 para Dashboard, etc.)
   - ARIA labels completos
   - Focus trap en mobile drawer

---

**Archivo creado**: 5 de octubre de 2025  
**Componente**: AppLayout.tsx  
**Versión**: 1.0.0  
**Autor**: GitHub Copilot AI Assistant
