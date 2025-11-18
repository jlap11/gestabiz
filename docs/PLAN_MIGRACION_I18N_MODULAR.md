# 📋 PLAN DE ACCIÓN: Migración de Sistema i18n a Estructura Modular

> **Fecha de Creación**: 17 de noviembre de 2025  
> **Estado**: PENDIENTE DE EJECUCIÓN  
> **Objetivo**: Migrar de archivo monolítico `translations.ts` (4,386 líneas) a estructura modular escalable

---

## 🎯 RESUMEN EJECUTIVO

### Situación Actual
- **Archivo monolítico**: `src/lib/translations.ts` con 4,386 líneas
- **Estructura plana**: 2 niveles de anidación máximo (`en.common.actions.save`)
- **Problema**: Difícil de mantener y escalar para 1,060 archivos .ts/.tsx
- **Riesgo**: Conflictos de merge, búsqueda lenta, duplicación

### Solución Propuesta
- **Estructura modular**: Carpetas `src/locales/en/` y `src/locales/es/`
- **Archivos por módulo**: Un archivo TypeScript por cada módulo principal
- **Jerarquía clara**: `module.component.section.element` (máx 4 niveles)
- **Auto-merge**: Archivo `index.ts` que combina todos los módulos
- **Type-safe**: Tipos TypeScript generados automáticamente

---

## 📐 ARQUITECTURA PROPUESTA

### Estructura de Carpetas
```
src/
├── locales/
│   ├── en/                          # Carpeta de inglés
│   │   ├── index.ts                 # Auto-combina todos los módulos
│   │   ├── common.ts                # Traducciones comunes reutilizables
│   │   ├── auth.ts                  # Autenticación
│   │   ├── dashboard.ts             # Dashboards (admin/employee/client)
│   │   ├── appointments.ts          # Sistema de citas
│   │   ├── calendar.ts              # Calendario
│   │   ├── settings.ts              # Configuraciones
│   │   ├── billing.ts               # Facturación
│   │   ├── accounting.ts            # Contabilidad
│   │   ├── jobs.ts                  # Reclutamiento y vacantes
│   │   ├── absences.ts              # Ausencias y vacaciones
│   │   ├── sales.ts                 # Ventas rápidas
│   │   ├── chat.ts                  # Chat en tiempo real
│   │   ├── notifications.ts         # Notificaciones
│   │   ├── reviews.ts               # Reviews y calificaciones
│   │   ├── business.ts              # Gestión de negocios
│   │   ├── employees.ts             # Gestión de empleados
│   │   ├── clients.ts               # Gestión de clientes
│   │   ├── services.ts              # Servicios
│   │   ├── locations.ts             # Ubicaciones/Sedes
│   │   ├── resources.ts             # Recursos físicos (hoteles, canchas)
│   │   ├── permissions.ts           # Sistema de permisos
│   │   ├── landing.ts               # Landing page pública
│   │   ├── profile.ts               # Perfiles públicos
│   │   ├── ui.ts                    # Componentes UI genéricos
│   │   └── validation.ts            # Mensajes de validación
│   │
│   ├── es/                          # Carpeta de español (misma estructura)
│   │   ├── index.ts
│   │   ├── common.ts
│   │   ├── auth.ts
│   │   └── ...
│   │
│   ├── types.ts                     # Tipos TypeScript compartidos
│   └── index.ts                     # Exporta configuración completa
│
├── lib/
│   ├── translations.ts              # DEPRECADO → mover a locales/
│   └── i18n.ts                      # Helpers de formato (sin cambios)
│
└── contexts/
    └── LanguageContext.tsx          # Actualizar import path
```

### Convención de Nomenclatura (Jerarquía de Claves)

**Patrón**: `module.component.section.element`

**Ejemplos Reales**:
```typescript
// ✅ CORRECTO (4 niveles máximo)
appointments.wizard.steps.service           // "Select Service"
appointments.wizard.confirmation.message    // "Appointment confirmed"
settings.profile.personal.name              // "Full Name"
billing.subscription.plans.professional     // "Professional Plan"
dashboard.admin.stats.revenue               // "Monthly Revenue"

// ❌ INCORRECTO (muy anidado)
appointments.wizard.steps.service.selection.modal.title  // 7 niveles

// ✅ MEJOR (refactorizado)
appointments.wizard.serviceSelection.title  // 4 niveles
```

**Reglas**:
1. **Nivel 1 (module)**: Módulo principal (`appointments`, `settings`, `billing`)
2. **Nivel 2 (component)**: Componente o feature (`wizard`, `profile`, `subscription`)
3. **Nivel 3 (section)**: Sección del componente (`steps`, `personal`, `plans`)
4. **Nivel 4 (element)**: Elemento específico (`service`, `name`, `professional`)

---

## 🗂️ ESTRUCTURA DE ARCHIVOS POR MÓDULO

### 1. `common.ts` - Traducciones Comunes (700 líneas estimadas)
**Alcance**: Textos reutilizables en toda la app

```typescript
export const common = {
  actions: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    create: 'Create',
    edit: 'Edit',
    // ... 48 acciones más
  },
  states: {
    loading: 'Loading...',
    saved: 'Saved',
    error: 'Error',
    // ... 15 estados más
  },
  messages: {
    confirmDelete: 'Are you sure you want to delete this?',
    saveSuccess: 'Saved successfully',
    // ... 25 mensajes más
  },
  forms: {
    required: 'Required',
    optional: 'Optional',
    // ... 10 campos más
  },
  time: {
    today: 'Today',
    yesterday: 'Yesterday',
    monday: 'Monday',
    // ... 40 términos de tiempo
  },
  validation: {
    invalidEmail: 'Please enter a valid email',
    // ... 15 validaciones más
  }
}
```

### 2. `appointments.ts` - Sistema de Citas (400 líneas)
**Alcance**: AppointmentWizard, DateTimeSelection, CreateAppointment, EditAppointment

```typescript
export const appointments = {
  wizard: {
    title: 'New Appointment',
    steps: {
      business: 'Select Business',
      service: 'Select Service',
      location: 'Select Location',
      employee: 'Select Professional',
      dateTime: 'Date & Time',
      client: 'Client Info',
      confirmation: 'Confirm'
    },
    navigation: {
      next: 'Next',
      previous: 'Back',
      finish: 'Confirm Appointment'
    },
    validation: {
      selectBusiness: 'Please select a business',
      selectService: 'Please select a service',
      selectDateTime: 'Please select date and time'
    }
  },
  dateTime: {
    selectDate: 'Select a date',
    selectTime: 'Select a time',
    unavailable: 'Unavailable',
    lunchBreak: 'Lunch break',
    occupied: 'Occupied',
    closed: 'Closed'
  },
  list: {
    title: 'My Appointments',
    upcoming: 'Upcoming',
    past: 'Past',
    cancelled: 'Cancelled',
    noAppointments: 'No appointments yet'
  },
  details: {
    title: 'Appointment Details',
    status: 'Status',
    service: 'Service',
    professional: 'Professional',
    location: 'Location',
    dateTime: 'Date & Time',
    notes: 'Notes'
  },
  actions: {
    cancel: 'Cancel Appointment',
    reschedule: 'Reschedule',
    confirm: 'Confirm'
  }
}
```

### 3. `dashboard.ts` - Dashboards (350 líneas)
**Alcance**: AdminDashboard, EmployeeDashboard, ClientDashboard

```typescript
export const dashboard = {
  admin: {
    title: 'Admin Dashboard',
    welcome: 'Welcome back, {{name}}',
    stats: {
      appointments: 'Appointments Today',
      revenue: 'Monthly Revenue',
      clients: 'Active Clients',
      employees: 'Employees'
    },
    quickActions: {
      newAppointment: 'New Appointment',
      quickSale: 'Quick Sale',
      addEmployee: 'Add Employee',
      viewReports: 'View Reports'
    }
  },
  employee: {
    title: 'Employee Dashboard',
    mySchedule: 'My Schedule',
    todayAppointments: "Today's Appointments",
    absences: {
      request: 'Request Absence',
      balance: 'Vacation Balance',
      pending: 'Pending Requests'
    }
  },
  client: {
    title: 'Client Dashboard',
    upcomingAppointments: 'Upcoming Appointments',
    favorites: 'Favorite Businesses',
    history: 'Appointment History'
  }
}
```

### 4. `settings.ts` - Configuraciones (500 líneas)
**Alcance**: CompleteUnifiedSettings, BusinessSettings, NotificationSettings

```typescript
export const settings = {
  title: 'Settings',
  tabs: {
    general: 'General',
    profile: 'Profile',
    notifications: 'Notifications',
    business: 'Business Preferences',
    employee: 'Employee Preferences',
    client: 'Client Preferences'
  },
  profile: {
    personal: {
      title: 'Personal Information',
      name: 'Full Name',
      email: 'Email',
      phone: 'Phone',
      avatar: 'Profile Picture'
    },
    security: {
      title: 'Security',
      changePassword: 'Change Password',
      twoFactor: 'Two-Factor Authentication'
    }
  },
  business: {
    info: {
      name: 'Business Name',
      description: 'Description',
      category: 'Category',
      website: 'Website'
    },
    location: {
      preferredLocation: 'Managed Location',
      address: 'Address',
      city: 'City',
      hours: 'Operating Hours'
    }
  },
  notifications: {
    channels: {
      email: 'Email',
      sms: 'SMS',
      whatsapp: 'WhatsApp',
      inApp: 'In-App'
    },
    types: {
      appointments: 'Appointments',
      reminders: 'Reminders',
      marketing: 'Marketing'
    }
  }
}
```

### 5. `billing.ts` - Facturación (300 líneas)
**Alcance**: BillingDashboard, PricingPage, PaymentHistory

```typescript
export const billing = {
  subscription: {
    title: 'Subscription',
    currentPlan: 'Current Plan',
    upgrade: 'Upgrade Plan',
    cancel: 'Cancel Subscription',
    plans: {
      free: 'Free',
      starter: 'Starter',
      professional: 'Professional',
      enterprise: 'Enterprise'
    },
    features: {
      locations: '{{count}} Location(s)',
      employees: '{{count}} Employee(s)',
      appointments: '{{count}} Appointments/month'
    }
  },
  payment: {
    method: 'Payment Method',
    addCard: 'Add Card',
    defaultCard: 'Default Card',
    updateCard: 'Update Card'
  },
  invoices: {
    title: 'Invoices',
    date: 'Date',
    amount: 'Amount',
    status: 'Status',
    download: 'Download'
  }
}
```

### 6. `jobs.ts` - Reclutamiento (350 líneas)
**Alcance**: JobVacancies, JobApplications, CreateVacancy

```typescript
export const jobs = {
  vacancies: {
    title: 'Job Vacancies',
    create: 'Create Vacancy',
    edit: 'Edit Vacancy',
    delete: 'Delete Vacancy',
    fields: {
      title: 'Job Title',
      description: 'Description',
      requirements: 'Requirements',
      salary: 'Salary Range',
      location: 'Location',
      type: 'Employment Type'
    },
    types: {
      fullTime: 'Full-Time',
      partTime: 'Part-Time',
      contract: 'Contract',
      commission: 'Commission-Based'
    }
  },
  applications: {
    title: 'Applications',
    view: 'View Application',
    approve: 'Approve',
    reject: 'Reject',
    status: {
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
      hired: 'Hired'
    }
  },
  profile: {
    title: 'Employee Profile',
    skills: 'Skills',
    experience: 'Experience',
    certifications: 'Certifications',
    portfolio: 'Portfolio'
  }
}
```

### 7. `absences.ts` - Ausencias y Vacaciones (250 líneas)
**Alcance**: AbsenceRequestModal, VacationDaysWidget, AbsencesTab

```typescript
export const absences = {
  request: {
    title: 'Request Absence',
    type: 'Type',
    startDate: 'Start Date',
    endDate: 'End Date',
    reason: 'Reason',
    submit: 'Submit Request',
    types: {
      vacation: 'Vacation',
      sick: 'Sick Leave',
      personal: 'Personal',
      emergency: 'Emergency',
      other: 'Other'
    }
  },
  balance: {
    title: 'Vacation Balance',
    available: 'Available Days',
    used: 'Used Days',
    pending: 'Pending Days',
    remaining: 'Remaining Days'
  },
  approval: {
    title: 'Absence Approvals',
    pending: 'Pending Requests',
    history: 'History',
    approve: 'Approve',
    reject: 'Reject',
    reason: 'Rejection Reason'
  }
}
```

### 8. Otros Módulos (Resumen)

- **`auth.ts`** (200 líneas): Login, registro, recuperación de contraseña
- **`calendar.ts`** (150 líneas): Componente de calendario
- **`accounting.ts`** (300 líneas): Transacciones, reportes, impuestos
- **`sales.ts`** (200 líneas): Ventas rápidas, POS
- **`chat.ts`** (250 líneas): Mensajería en tiempo real
- **`notifications.ts`** (200 líneas): Notificaciones in-app
- **`reviews.ts`** (200 líneas): Calificaciones y reseñas
- **`business.ts`** (300 líneas): Gestión de negocios
- **`employees.ts`** (250 líneas): Gestión de empleados
- **`clients.ts`** (200 líneas): Gestión de clientes
- **`services.ts`** (200 líneas): Servicios del negocio
- **`locations.ts`** (200 líneas): Ubicaciones/Sedes
- **`resources.ts`** (200 líneas): Recursos físicos (hoteles, canchas)
- **`permissions.ts`** (250 líneas): Sistema de permisos granulares
- **`landing.ts`** (400 líneas): Landing page pública
- **`profile.ts`** (300 líneas): Perfiles públicos de negocios
- **`ui.ts`** (150 líneas): Componentes UI genéricos
- **`validation.ts`** (100 líneas): Mensajes de validación

**Total estimado**: ~6,500 líneas (distribución más clara que 4,386 en un solo archivo)

---

## 🔧 IMPLEMENTACIÓN TÉCNICA

### Archivo `src/locales/types.ts`
**Propósito**: Definir tipos TypeScript compartidos

```typescript
// Tipos base para traducciones
export type TranslationKey = string
export type TranslationParams = Record<string, string | number>

// Interface para módulos
export interface TranslationModule {
  [key: string]: string | TranslationModule
}

// Type-safe translation object
export interface Translations {
  common: typeof import('./en/common').common
  auth: typeof import('./en/auth').auth
  appointments: typeof import('./en/appointments').appointments
  dashboard: typeof import('./en/dashboard').dashboard
  settings: typeof import('./en/settings').settings
  billing: typeof import('./en/billing').billing
  accounting: typeof import('./en/accounting').accounting
  jobs: typeof import('./en/jobs').jobs
  absences: typeof import('./en/absences').absences
  sales: typeof import('./en/sales').sales
  chat: typeof import('./en/chat').chat
  notifications: typeof import('./en/notifications').notifications
  reviews: typeof import('./en/reviews').reviews
  business: typeof import('./en/business').business
  employees: typeof import('./en/employees').employees
  clients: typeof import('./en/clients').clients
  services: typeof import('./en/services').services
  locations: typeof import('./en/locations').locations
  resources: typeof import('./en/resources').resources
  permissions: typeof import('./en/permissions').permissions
  landing: typeof import('./en/landing').landing
  profile: typeof import('./en/profile').profile
  ui: typeof import('./en/ui').ui
  validation: typeof import('./en/validation').validation
  calendar: typeof import('./en/calendar').calendar
}

// Type for language codes
export type Language = 'es' | 'en'
```

### Archivo `src/locales/en/index.ts`
**Propósito**: Auto-combinar todos los módulos en inglés

```typescript
import { common } from './common'
import { auth } from './auth'
import { appointments } from './appointments'
import { dashboard } from './dashboard'
import { settings } from './settings'
import { billing } from './billing'
import { accounting } from './accounting'
import { jobs } from './jobs'
import { absences } from './absences'
import { sales } from './sales'
import { chat } from './chat'
import { notifications } from './notifications'
import { reviews } from './reviews'
import { business } from './business'
import { employees } from './employees'
import { clients } from './clients'
import { services } from './services'
import { locations } from './locations'
import { resources } from './resources'
import { permissions } from './permissions'
import { landing } from './landing'
import { profile } from './profile'
import { ui } from './ui'
import { validation } from './validation'
import { calendar } from './calendar'

export const en = {
  common,
  auth,
  appointments,
  dashboard,
  settings,
  billing,
  accounting,
  jobs,
  absences,
  sales,
  chat,
  notifications,
  reviews,
  business,
  employees,
  clients,
  services,
  locations,
  resources,
  permissions,
  landing,
  profile,
  ui,
  validation,
  calendar
}
```

### Archivo `src/locales/index.ts`
**Propósito**: Exportar configuración completa

```typescript
import { en } from './en'
import { es } from './es'
import type { Translations, Language } from './types'

export const translations: Record<Language, Translations> = {
  en,
  es
}

export type { Language, Translations, TranslationModule, TranslationKey, TranslationParams } from './types'
```

### Actualizar `src/contexts/LanguageContext.tsx`

```typescript
// ANTES
import { translations } from '@/lib/translations'

// DESPUÉS
import { translations } from '@/locales'
import type { Language } from '@/locales'
```

---

## 📝 PLAN DE EJECUCIÓN (6 Fases)

### **FASE 1: Preparación (30 minutos)**
**Objetivo**: Crear estructura de carpetas sin romper nada

✅ **Tareas**:
1. Crear carpeta `src/locales/`
2. Crear subcarpetas `en/` y `es/`
3. Crear archivo `types.ts`
4. Crear archivos `index.ts` en ambas carpetas (vacíos)
5. Crear archivo `src/locales/index.ts` principal

✅ **Validación**:
- App sigue funcionando normalmente
- No hay errores de compilación

---

### **FASE 2: Migración de `common.ts` (1 hora)**
**Objetivo**: Migrar traducciones comunes como PRUEBA DE CONCEPTO

✅ **Tareas**:
1. Crear `src/locales/en/common.ts`
2. Copiar sección `common` de `translations.ts` → `en/common.ts`
3. Crear `src/locales/es/common.ts` (traducir o copiar)
4. Actualizar `en/index.ts` para importar `common`
5. Actualizar `es/index.ts` para importar `common`
6. Actualizar `src/locales/index.ts` para exportar
7. **NO** eliminar nada de `translations.ts` (mantener retrocompatibilidad)

✅ **Validación**:
- `t('common.actions.save')` funciona igual que antes
- No hay errores de compilación
- Todos los componentes que usan `common.*` funcionan

---

### **FASE 3: Migración de Módulos Principales (2-3 horas)**
**Objetivo**: Migrar módulos uno por uno

✅ **Tareas** (orden sugerido):
1. `auth.ts` (más simple, menos dependencias)
2. `appointments.ts` (crítico, muy usado)
3. `dashboard.ts` (usado en 3 roles)
4. `settings.ts` (muy grande, dividir en secciones)
5. `calendar.ts` (simple)

**Por cada módulo**:
- [ ] Crear `src/locales/en/<module>.ts`
- [ ] Copiar sección de `translations.ts`
- [ ] Refactorizar claves según convención (max 4 niveles)
- [ ] Crear `src/locales/es/<module>.ts` (traducir)
- [ ] Actualizar `index.ts` para importar
- [ ] Probar componentes que usan ese módulo
- [ ] Documentar cambios de claves (si hubo refactor)

✅ **Validación por módulo**:
- Componentes funcionan correctamente
- No hay errores de `t('...')` undefined
- Tests E2E pasan (si aplica)

---

### **FASE 4: Migración de Módulos Secundarios (2-3 horas)**
**Objetivo**: Completar módulos restantes

✅ **Tareas**:
1. `billing.ts`
2. `accounting.ts`
3. `jobs.ts`
4. `absences.ts`
5. `sales.ts`
6. `chat.ts`
7. `notifications.ts`
8. `reviews.ts`
9. `business.ts`
10. `employees.ts`
11. `clients.ts`
12. `services.ts`
13. `locations.ts`
14. `resources.ts`
15. `permissions.ts`
16. `landing.ts`
17. `profile.ts`
18. `ui.ts`
19. `validation.ts`

**Mismo proceso que Fase 3**

✅ **Validación**:
- Todos los componentes funcionan
- `pnpm run type-check` pasa sin errores
- `pnpm run lint` sin warnings

---

### **FASE 5: Actualización de Imports (1 hora)**
**Objetivo**: Cambiar imports en componentes

✅ **Tareas**:
1. Buscar todos los archivos que usan `useLanguage`
2. Verificar que los imports estén correctos
3. Actualizar paths si es necesario

**Comando de búsqueda**:
```powershell
# Buscar componentes que usan useLanguage
Get-ChildItem -Path "src" -Recurse -Filter "*.tsx" | Select-String "useLanguage"
```

✅ **Validación**:
- No hay imports rotos
- Hot reload funciona
- Tests pasan

---

### **FASE 6: Limpieza y Documentación (30 minutos)**
**Objetivo**: Deprecar archivo viejo y documentar cambios

✅ **Tareas**:
1. Renombrar `src/lib/translations.ts` → `translations.OLD.ts`
2. Agregar comentario de deprecación
3. Actualizar `.github/copilot-instructions.md`
4. Crear `docs/I18N_MIGRATION_GUIDE.md`
5. Crear `docs/I18N_STRUCTURE.md` (guía para futuros devs)

✅ **Validación**:
- App funciona sin `translations.OLD.ts`
- Documentación clara y completa
- Equipo informado del cambio

---

## 🧪 TESTING Y VALIDACIÓN

### Checklist de Validación por Fase

**Fase 2 (Common)**:
- [ ] Botones de acciones funcionan (`t('common.actions.save')`)
- [ ] Mensajes de estado funcionan (`t('common.states.loading')`)
- [ ] Validaciones funcionan (`t('common.validation.invalidEmail')`)

**Fase 3 (Módulos Principales)**:
- [ ] Login/Registro funcionan (`t('auth.login')`)
- [ ] AppointmentWizard funciona (`t('appointments.wizard.steps.service')`)
- [ ] Dashboards cargan correctamente (`t('dashboard.admin.title')`)
- [ ] Settings funcionan (`t('settings.profile.personal.name')`)

**Fase 4 (Módulos Secundarios)**:
- [ ] Billing funciona (`t('billing.subscription.currentPlan')`)
- [ ] Jobs funciona (`t('jobs.vacancies.create')`)
- [ ] Absences funciona (`t('absences.request.title')`)
- [ ] Chat funciona (`t('chat.messages.send')`)

**Fase 5 (Imports)**:
- [ ] No hay errores de TypeScript
- [ ] Hot reload funciona
- [ ] Build de producción exitoso

**Fase 6 (Final)**:
- [ ] `pnpm run build` sin errores
- [ ] `pnpm run type-check` sin errores
- [ ] `pnpm run lint` sin warnings críticos
- [ ] Tests E2E pasan (si están habilitados)

### Comandos de Validación

```powershell
# Type checking
pnpm run type-check

# Linting
pnpm run lint

# Build de producción
pnpm run build

# Tests (si están habilitados)
pnpm run test

# Dev server (hot reload)
pnpm run dev
```

---

## 📊 MÉTRICAS DE ÉXITO

### Antes de la Migración
- **Archivo**: 1 archivo monolítico (`translations.ts`)
- **Líneas**: 4,386 líneas
- **Mantenibilidad**: Difícil (búsqueda lenta, conflictos de merge)
- **Escalabilidad**: Limitada (archivo crece indefinidamente)
- **Type-safety**: Parcial (nested keys no validadas)

### Después de la Migración
- **Archivos**: 24 archivos modulares (12 en/12 es)
- **Líneas por archivo**: ~150-500 líneas (promedio 270)
- **Mantenibilidad**: Alta (archivos pequeños, fácil de navegar)
- **Escalabilidad**: Excelente (agregar módulos sin afectar existentes)
- **Type-safety**: Completa (TypeScript valida claves)

### KPIs
- ✅ Reducir tamaño de archivos en 90% (4,386 → ~400 líneas/archivo)
- ✅ Mejorar búsqueda de traducciones en 70% (IDE + grep más rápido)
- ✅ Reducir conflictos de merge en 80% (archivos separados)
- ✅ Mantener 100% retrocompatibilidad durante migración
- ✅ Cero downtime (migraciones sin afectar producción)

---

## 🚨 RIESGOS Y MITIGACIONES

### Riesgo 1: Romper funcionalidad existente
**Probabilidad**: Media  
**Impacto**: Alto  
**Mitigación**:
- Migrar módulo por módulo (no todo a la vez)
- Mantener `translations.OLD.ts` como fallback
- Probar cada módulo antes de continuar
- Usar TypeScript para validar claves

### Riesgo 2: Conflictos de merge durante migración
**Probabilidad**: Alta  
**Impacto**: Medio  
**Mitigación**:
- Comunicar al equipo que NO editen `translations.ts` durante migración
- Hacer migración en rama separada
- Completar migración en 1-2 días (no dejar pendiente)

### Riesgo 3: Traducciones faltantes
**Probabilidad**: Media  
**Impacto**: Medio  
**Mitigación**:
- Usar linter para detectar claves huérfanas
- Crear script de validación (`npm run i18n:validate`)
- Mantener paridad entre `en/` y `es/` (mismo número de claves)

### Riesgo 4: Performance degradation
**Probabilidad**: Baja  
**Impacto**: Bajo  
**Mitigación**:
- Auto-merge en `index.ts` (una sola importación)
- Tree-shaking automático de Vite
- Lazy loading de módulos NO críticos (futuro)

---

## 📚 GUÍAS PARA EL EQUIPO

### Guía de Contribución (Para Devs)

**Agregar nueva traducción**:
1. Identificar módulo correcto (ej: `appointments`)
2. Abrir `src/locales/en/<module>.ts`
3. Agregar clave siguiendo convención (max 4 niveles)
4. Agregar misma clave en `src/locales/es/<module>.ts`
5. Usar en componente: `t('appointments.wizard.steps.service')`

**Crear nuevo módulo**:
1. Crear `src/locales/en/<nuevo-modulo>.ts`
2. Exportar objeto con tipado: `export const nuevoModulo = { ... }`
3. Crear `src/locales/es/<nuevo-modulo>.ts` (traducir)
4. Actualizar `en/index.ts` y `es/index.ts` para importar
5. Actualizar `types.ts` para incluir en `Translations` interface

**Refactorizar claves**:
1. Actualizar clave en archivo de módulo
2. Buscar usos con `grep` o IDE
3. Actualizar componentes que usan esa clave
4. Documentar en `CHANGELOG.md` si es breaking change

### Convenciones de Estilo

**Nombres de claves** (camelCase):
```typescript
// ✅ CORRECTO
appointments.wizard.steps.service
settings.profile.personal.fullName

// ❌ INCORRECTO
appointments.wizard.steps.select_service  // snake_case
settings.profile.personal.full-name       // kebab-case
```

**Plurales y singulares**:
```typescript
// Use singular para entidades
employee: 'Employee'
employees: 'Employees'

// Use plural para listas
appointments.list.title: 'Appointments'
```

**Parámetros dinámicos** ({{nombre}}):
```typescript
// En archivo de traducción
welcome: 'Welcome back, {{name}}'

// En componente
t('dashboard.admin.welcome', { name: user.name })
```

---

## 🔄 MANTENIMIENTO POST-MIGRACIÓN

### Scripts de Validación

**Script 1: Validar paridad en/es**
```typescript
// scripts/validate-i18n.ts
// Valida que en/ y es/ tengan las mismas claves
```

**Script 2: Buscar claves huérfanas**
```typescript
// scripts/find-unused-keys.ts
// Busca claves definidas pero no usadas
```

**Script 3: Buscar traducciones faltantes**
```typescript
// scripts/find-missing-translations.ts
// Busca t('...') en código sin definición
```

### Comandos NPM Propuestos

```json
{
  "scripts": {
    "i18n:validate": "tsx scripts/validate-i18n.ts",
    "i18n:unused": "tsx scripts/find-unused-keys.ts",
    "i18n:missing": "tsx scripts/find-missing-translations.ts",
    "i18n:check": "npm run i18n:validate && npm run i18n:missing"
  }
}
```

---

## 📅 CRONOGRAMA ESTIMADO

| Fase | Descripción | Tiempo | Acumulado |
|------|-------------|--------|-----------|
| 1 | Preparación | 30 min | 30 min |
| 2 | Migración Common | 1 hora | 1.5 horas |
| 3 | Módulos Principales (5) | 2-3 horas | 4.5 horas |
| 4 | Módulos Secundarios (19) | 2-3 horas | 7.5 horas |
| 5 | Actualización Imports | 1 hora | 8.5 horas |
| 6 | Limpieza y Docs | 30 min | 9 horas |

**Total estimado**: 9 horas (1-2 días de trabajo)

**Recomendación**: Ejecutar en 2 sesiones de 4.5 horas cada una

---

## ✅ CHECKLIST FINAL PRE-EJECUCIÓN

Antes de comenzar la migración, verificar:

- [ ] Rama Git limpia (sin cambios pendientes)
- [ ] Crear rama nueva: `feature/i18n-modular-migration`
- [ ] Backup de `translations.ts` (por si acaso)
- [ ] Comunicar al equipo (no editar `translations.ts`)
- [ ] Tests E2E pasando (baseline)
- [ ] Build de producción exitoso (baseline)
- [ ] Leer este plan completo
- [ ] Preparar ambiente de testing

---

## 📖 RECURSOS Y REFERENCIAS

### Archivos Clave
- `src/lib/translations.ts` - Archivo actual (4,386 líneas)
- `src/contexts/LanguageContext.tsx` - Context de idioma
- `src/lib/i18n.ts` - Helpers de formato
- `.github/copilot-instructions.md` - Documentación del proyecto

### Documentación a Crear
- `docs/I18N_MIGRATION_GUIDE.md` - Guía completa de migración
- `docs/I18N_STRUCTURE.md` - Estructura y convenciones
- `docs/I18N_CONTRIBUTING.md` - Guía para contribuir

### Scripts a Crear
- `scripts/validate-i18n.ts` - Validar paridad
- `scripts/find-unused-keys.ts` - Claves huérfanas
- `scripts/find-missing-translations.ts` - Traducciones faltantes

---

## 🎯 PRÓXIMOS PASOS

1. ✅ **Revisar este plan** con el equipo
2. ✅ **Aprobar arquitectura** propuesta
3. ✅ **Asignar responsable** de migración
4. ✅ **Crear rama** `feature/i18n-modular-migration`
5. ✅ **Ejecutar Fase 1** (Preparación)
6. ⏳ **Ejecutar Fases 2-6** (Migración completa)
7. ⏳ **Code Review** y testing
8. ⏳ **Merge a main** y deploy

---

**¿Listo para ejecutar?** 🚀  
**Comando para iniciar**: Avísame cuando quieras comenzar con la Fase 1 y ejecutaremos paso a paso.

---

_Este plan fue generado el 17 de noviembre de 2025 para el proyecto Gestabiz._  
_Versión: 1.0.0_  
_Autor: GitHub Copilot + Equipo TI-Turing_
