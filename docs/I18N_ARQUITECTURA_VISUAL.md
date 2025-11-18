# 🎨 Arquitectura Visual: Sistema i18n Modular

## 📊 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    GESTABIZ APP                             │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │           React Components (1,060 archivos)        │    │
│  │                                                     │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │    │
│  │  │ Admin       │  │ Employee    │  │ Client    │ │    │
│  │  │ Dashboard   │  │ Dashboard   │  │ Dashboard │ │    │
│  │  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘ │    │
│  │         │                 │                │       │    │
│  │         └─────────────────┴────────────────┘       │    │
│  │                           │                         │    │
│  │                    useLanguage()                    │    │
│  │                           │                         │    │
│  └───────────────────────────┼─────────────────────────┘    │
│                              │                              │
│  ┌───────────────────────────▼─────────────────────────┐    │
│  │         LanguageContext Provider                    │    │
│  │                                                      │    │
│  │  • language: 'es' | 'en'                           │    │
│  │  • setLanguage()                                    │    │
│  │  • t(key, params)                                   │    │
│  └───────────────────────────┬─────────────────────────┘    │
│                              │                              │
└──────────────────────────────┼──────────────────────────────┘
                               │
            ┌──────────────────▼──────────────────┐
            │    src/locales/index.ts             │
            │                                      │
            │  translations = { en, es }           │
            └──────────────┬──────────────────┬───┘
                           │                  │
         ┌─────────────────▼─────┐   ┌───────▼──────────────┐
         │  src/locales/en/      │   │  src/locales/es/     │
         │                        │   │                      │
         │  ┌──────────────────┐ │   │  ┌─────────────────┐ │
         │  │ index.ts         │ │   │  │ index.ts        │ │
         │  │ ├─ common        │ │   │  │ ├─ common       │ │
         │  │ ├─ auth          │ │   │  │ ├─ auth         │ │
         │  │ ├─ appointments  │ │   │  │ ├─ appointments │ │
         │  │ ├─ dashboard     │ │   │  │ ├─ dashboard    │ │
         │  │ ├─ settings      │ │   │  │ ├─ settings     │ │
         │  │ ├─ billing       │ │   │  │ ├─ billing      │ │
         │  │ └─ ... (18 más)  │ │   │  │ └─ ... (18 más) │ │
         │  └──────────────────┘ │   │  └─────────────────┘ │
         │                        │   │                      │
         │  ┌──────────────────┐ │   │  ┌─────────────────┐ │
         │  │ common.ts        │ │   │  │ common.ts       │ │
         │  │ (700 líneas)     │ │   │  │ (700 líneas)    │ │
         │  └──────────────────┘ │   │  └─────────────────┘ │
         │                        │   │                      │
         │  ┌──────────────────┐ │   │  ┌─────────────────┐ │
         │  │ appointments.ts  │ │   │  │ appointments.ts │ │
         │  │ (400 líneas)     │ │   │  │ (400 líneas)    │ │
         │  └──────────────────┘ │   │  └─────────────────┘ │
         │                        │   │                      │
         │  ... (22 archivos más)│   │  ... (22 archivos)  │
         └────────────────────────┘   └──────────────────────┘
```

## 🗂️ Estructura de Archivos Detallada

### Antes (Actual)
```
src/
└── lib/
    └── translations.ts  ←──── 4,386 líneas (TODO EN 1 ARCHIVO) ❌
        ├── en
        │   ├── common (acciones, estados, mensajes...)
        │   ├── auth (login, registro...)
        │   ├── appointments (wizard, lista...)
        │   ├── dashboard (admin, employee, client...)
        │   ├── settings (profile, business...)
        │   ├── billing (suscripciones, pagos...)
        │   ├── ... (40+ secciones más)
        │   
        └── es (misma estructura, todo mezclado)
```

### Después (Propuesto)
```
src/
├── locales/  ←──── NUEVA CARPETA PRINCIPAL
│   │
│   ├── types.ts  ←──── Tipos TypeScript compartidos
│   │   export type Language = 'es' | 'en'
│   │   export interface Translations { ... }
│   │
│   ├── index.ts  ←──── Exporta configuración completa
│   │   export const translations = { en, es }
│   │
│   ├── en/  ←──── INGLÉS (24 archivos)
│   │   │
│   │   ├── index.ts  ←──── Auto-combina todos los módulos
│   │   │   import { common } from './common'
│   │   │   import { auth } from './auth'
│   │   │   ...
│   │   │   export const en = { common, auth, ... }
│   │   │
│   │   ├── common.ts  ←──── 700 líneas
│   │   │   export const common = {
│   │   │     actions: { save, cancel, delete, ... },
│   │   │     states: { loading, saved, error, ... },
│   │   │     messages: { confirmDelete, saveSuccess, ... }
│   │   │   }
│   │   │
│   │   ├── auth.ts  ←──── 200 líneas
│   │   │   export const auth = {
│   │   │     login: { title, email, password, ... },
│   │   │     register: { ... },
│   │   │     recovery: { ... }
│   │   │   }
│   │   │
│   │   ├── appointments.ts  ←──── 400 líneas
│   │   │   export const appointments = {
│   │   │     wizard: {
│   │   │       title, steps, navigation, validation
│   │   │     },
│   │   │     dateTime: { ... },
│   │   │     list: { ... },
│   │   │     details: { ... }
│   │   │   }
│   │   │
│   │   ├── dashboard.ts  ←──── 350 líneas
│   │   │   export const dashboard = {
│   │   │     admin: { title, stats, quickActions },
│   │   │     employee: { title, schedule, absences },
│   │   │     client: { title, upcomingAppointments }
│   │   │   }
│   │   │
│   │   ├── settings.ts  ←──── 500 líneas
│   │   ├── billing.ts  ←──── 300 líneas
│   │   ├── accounting.ts  ←──── 300 líneas
│   │   ├── jobs.ts  ←──── 350 líneas
│   │   ├── absences.ts  ←──── 250 líneas
│   │   ├── sales.ts  ←──── 200 líneas
│   │   ├── chat.ts  ←──── 250 líneas
│   │   ├── notifications.ts  ←──── 200 líneas
│   │   ├── reviews.ts  ←──── 200 líneas
│   │   ├── business.ts  ←──── 300 líneas
│   │   ├── employees.ts  ←──── 250 líneas
│   │   ├── clients.ts  ←──── 200 líneas
│   │   ├── services.ts  ←──── 200 líneas
│   │   ├── locations.ts  ←──── 200 líneas
│   │   ├── resources.ts  ←──── 200 líneas
│   │   ├── permissions.ts  ←──── 250 líneas
│   │   ├── landing.ts  ←──── 400 líneas
│   │   ├── profile.ts  ←──── 300 líneas
│   │   ├── ui.ts  ←──── 150 líneas
│   │   ├── validation.ts  ←──── 100 líneas
│   │   └── calendar.ts  ←──── 150 líneas
│   │
│   └── es/  ←──── ESPAÑOL (misma estructura exacta)
│       ├── index.ts
│       ├── common.ts
│       ├── auth.ts
│       └── ... (22 archivos más)
│
└── lib/
    ├── translations.OLD.ts  ←──── DEPRECADO (backup)
    └── i18n.ts  ←──── Helpers (sin cambios)
```

## 🎯 Flujo de Uso en Componentes

### Ejemplo: AppointmentWizard

```tsx
// src/components/appointments/AppointmentWizard.tsx

import { useLanguage } from '@/contexts/LanguageContext'

export function AppointmentWizard() {
  const { t } = useLanguage()
  
  return (
    <div>
      {/* Título del wizard */}
      <h1>{t('appointments.wizard.title')}</h1>
      
      {/* Pasos */}
      <ol>
        <li>{t('appointments.wizard.steps.business')}</li>
        <li>{t('appointments.wizard.steps.service')}</li>
        <li>{t('appointments.wizard.steps.location')}</li>
        <li>{t('appointments.wizard.steps.employee')}</li>
        <li>{t('appointments.wizard.steps.dateTime')}</li>
      </ol>
      
      {/* Botones de navegación */}
      <button>{t('appointments.wizard.navigation.previous')}</button>
      <button>{t('appointments.wizard.navigation.next')}</button>
      <button>{t('appointments.wizard.navigation.finish')}</button>
      
      {/* Validación */}
      {error && <p>{t('appointments.wizard.validation.selectService')}</p>}
    </div>
  )
}
```

### Resolución de Claves (Behind the Scenes)

```
Usuario escribe: t('appointments.wizard.title')
                           │
                           ▼
LanguageContext lee: language = 'es'
                           │
                           ▼
Busca en: translations.es.appointments.wizard.title
                           │
                           ▼
Origen: src/locales/es/appointments.ts
        ├─ export const appointments = {
        │    wizard: {
        │      title: 'Nueva Cita'  ←──── Aquí
        │    }
        │  }
                           │
                           ▼
Retorna: 'Nueva Cita'
```

## 📐 Jerarquía de Claves (4 Niveles Máximo)

```
┌────────────────────────────────────────────────────────────┐
│                    Nivel 1: MODULE                         │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              Nivel 2: COMPONENT                      │ │
│  │  ┌────────────────────────────────────────────────┐ │ │
│  │  │          Nivel 3: SECTION                      │ │ │
│  │  │  ┌──────────────────────────────────────────┐ │ │ │
│  │  │  │      Nivel 4: ELEMENT                    │ │ │ │
│  │  │  │                                           │ │ │ │
│  │  │  │  appointments.wizard.steps.service       │ │ │ │
│  │  │  │  │            │       │      │            │ │ │ │
│  │  │  │  │            │       │      └─ service   │ │ │ │
│  │  │  │  │            │       └──────── steps     │ │ │ │
│  │  │  │  │            └────────────── wizard      │ │ │ │
│  │  │  │  └────────────────────────── appointments │ │ │ │
│  │  │  │                                           │ │ │ │
│  │  │  └──────────────────────────────────────────┘ │ │ │
│  │  └────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘

Ejemplos correctos (4 niveles):
✅ appointments.wizard.steps.service
✅ settings.profile.personal.name
✅ billing.subscription.plans.starter
✅ dashboard.admin.stats.revenue

Ejemplos incorrectos (>4 niveles):
❌ appointments.wizard.steps.service.selection.modal.title  (7 niveles)
   └─ Refactorizar a: appointments.wizard.serviceSelection.title
```

## 🔄 Flujo de Migración por Fases

```
┌──────────────────────────────────────────────────────────────┐
│                     FASE 1: Preparación                      │
│  • Crear carpeta src/locales/                               │
│  • Crear subcarpetas en/ y es/                              │
│  • Crear archivos index.ts (vacíos)                         │
│  └─ ✅ Resultado: Estructura lista, app funciona normal      │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                 FASE 2: Migrar Common (Prueba)               │
│  1. Crear src/locales/en/common.ts                          │
│  2. Copiar sección 'common' de translations.ts              │
│  3. Crear src/locales/es/common.ts (traducir)               │
│  4. Actualizar index.ts para importar                       │
│  └─ ✅ Resultado: t('common.*') funciona igual que antes    │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│            FASE 3: Migrar Módulos Principales (5)            │
│  • auth.ts                                                   │
│  • appointments.ts                                           │
│  • dashboard.ts                                              │
│  • settings.ts                                               │
│  • calendar.ts                                               │
│  └─ ✅ Resultado: Componentes críticos funcionan             │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│          FASE 4: Migrar Módulos Secundarios (19)             │
│  • billing, accounting, jobs, absences, sales, ...          │
│  └─ ✅ Resultado: TODOS los componentes funcionan            │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│              FASE 5: Actualizar Imports                      │
│  • Verificar imports en componentes                          │
│  • Cambiar paths si es necesario                            │
│  └─ ✅ Resultado: Type-check pasa sin errores                │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│            FASE 6: Limpieza y Documentación                  │
│  • Renombrar translations.ts → translations.OLD.ts           │
│  • Actualizar .github/copilot-instructions.md               │
│  • Crear guías de contribución                              │
│  └─ ✅ Resultado: Migración COMPLETA ✅                      │
└──────────────────────────────────────────────────────────────┘
```

## 📊 Comparación Visual: Antes vs Después

### ANTES (Monolítico)
```
translations.ts (4,386 líneas)
┃
┣━━ en
┃   ┣━━ common (líneas 1-700)
┃   ┣━━ auth (líneas 701-900)
┃   ┣━━ appointments (líneas 901-1300)
┃   ┣━━ dashboard (líneas 1301-1650)
┃   ┣━━ settings (líneas 1651-2150)
┃   ┣━━ ... (40+ secciones más mezcladas)
┃   └━━ cookieConsent (líneas 4200-4386)
┃
┗━━ es (misma estructura, líneas 4386-8772)

❌ Problemas:
   • Búsqueda lenta (4,386 líneas en 1 archivo)
   • Conflictos de merge frecuentes
   • Difícil de mantener
   • Escalabilidad limitada
```

### DESPUÉS (Modular)
```
locales/
┃
┣━━ types.ts (50 líneas)
┣━━ index.ts (20 líneas)
┃
┣━━ en/
┃   ┣━━ index.ts (50 líneas) ←─ Auto-combina
┃   ┣━━ common.ts (700 líneas)
┃   ┣━━ auth.ts (200 líneas)
┃   ┣━━ appointments.ts (400 líneas)
┃   ┣━━ dashboard.ts (350 líneas)
┃   ┣━━ settings.ts (500 líneas)
┃   └━━ ... (19 archivos más, ~200-400 líneas c/u)
┃
┗━━ es/ (misma estructura exacta)
    ┣━━ index.ts (50 líneas)
    ┣━━ common.ts (700 líneas)
    └━━ ... (23 archivos más)

✅ Beneficios:
   • Búsqueda rápida (24 archivos de ~270 líneas)
   • Conflictos de merge raros (archivos separados)
   • Fácil de mantener (archivos pequeños)
   • Escalabilidad infinita (agregar módulos sin afectar existentes)
   • Type-safety completa (TypeScript valida claves)
```

## 🎨 Mapa de Módulos por Área

```
┌─────────────────────────────────────────────────────────────┐
│                    ÁREAS FUNCIONALES                        │
└─────────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
  ┌──────────┐      ┌──────────┐      ┌──────────┐
  │  COMÚN   │      │  ADMIN   │      │  CLIENT  │
  └──────────┘      └──────────┘      └──────────┘
        │                  │                  │
        │                  │                  │
  common.ts        appointments.ts      appointments.ts
  auth.ts          dashboard.ts         dashboard.ts
  validation.ts    settings.ts          settings.ts
  ui.ts            billing.ts           profile.ts
  calendar.ts      accounting.ts        reviews.ts
                   jobs.ts              chat.ts
                   absences.ts          notifications.ts
                   sales.ts
                   business.ts
                   employees.ts
                   clients.ts
                   services.ts
                   locations.ts
                   resources.ts
                   permissions.ts
                   landing.ts
```

## 🔍 Búsqueda Rápida: Comparación

### Antes (Monolítico)
```
Desarrollador busca traducción de "Save button":

1. Abrir translations.ts (4,386 líneas)
2. Ctrl+F "save"
3. Esperar 2-3 segundos (archivo pesado)
4. Ver 50+ coincidencias
5. Scroll manual para encontrar la correcta
6. Tiempo total: ~30 segundos ❌
```

### Después (Modular)
```
Desarrollador busca traducción de "Save button":

1. Saber que es acción común → Abrir common.ts (700 líneas)
2. Ir directamente a sección 'actions'
3. Ver: save: 'Save'
4. Tiempo total: ~5 segundos ✅

O usando búsqueda global:
1. Ctrl+Shift+F "actions.save" en IDE
2. VS Code muestra: src/locales/en/common.ts:42
3. Tiempo total: ~3 segundos ✅✅
```

---

_Generado: 17 noviembre 2025 | Versión: 1.0.0_  
_Ver plan completo: `docs/PLAN_MIGRACION_I18N_MODULAR.md`_
