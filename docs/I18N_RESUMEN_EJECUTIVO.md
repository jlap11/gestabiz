# 📋 Migración i18n: Resumen Ejecutivo

> **Objetivo**: Migrar de 1 archivo monolítico (4,386 líneas) → 24 archivos modulares (~270 líneas/archivo)

## 🎯 Problema Actual

```
src/lib/translations.ts  (4,386 líneas) ❌
├── Difícil de mantener
├── Búsquedas lentas
├── Conflictos de merge frecuentes
└── Escalabilidad limitada
```

## ✅ Solución Propuesta

```
src/locales/
├── en/                    (Inglés)
│   ├── index.ts          (Auto-combina)
│   ├── common.ts         (700 líneas)
│   ├── appointments.ts   (400 líneas)
│   ├── dashboard.ts      (350 líneas)
│   ├── settings.ts       (500 líneas)
│   ├── billing.ts        (300 líneas)
│   └── ... (19 módulos más)
│
├── es/                    (Español - misma estructura)
│   ├── index.ts
│   ├── common.ts
│   └── ...
│
├── types.ts              (TypeScript types)
└── index.ts              (Exporta todo)
```

## 📐 Convención de Claves

**Patrón**: `module.component.section.element` (max 4 niveles)

```typescript
// ✅ Ejemplos correctos
appointments.wizard.steps.service
settings.profile.personal.name
billing.subscription.plans.starter
dashboard.admin.stats.revenue

// ❌ Evitar (muy anidado)
appointments.wizard.steps.service.selection.modal.title  // 7 niveles
```

## 🗂️ Módulos Principales (24 total)

| Módulo | Líneas | Componentes Principales |
|--------|--------|-------------------------|
| `common.ts` | 700 | Acciones, estados, validaciones |
| `appointments.ts` | 400 | AppointmentWizard, DateTimeSelection |
| `dashboard.ts` | 350 | Admin/Employee/ClientDashboard |
| `settings.ts` | 500 | CompleteUnifiedSettings |
| `billing.ts` | 300 | BillingDashboard, PricingPage |
| `jobs.ts` | 350 | JobVacancies, JobApplications |
| `absences.ts` | 250 | AbsenceRequestModal, VacationDaysWidget |
| `accounting.ts` | 300 | Transactions, Reports, Tax |
| `auth.ts` | 200 | Login, Register, Recovery |
| `calendar.ts` | 150 | Calendar component |
| ... | ... | (15 módulos más) |

## 🚀 Plan de Ejecución (6 Fases)

| Fase | Tarea | Tiempo | Validación |
|------|-------|--------|------------|
| **1** | Preparación | 30 min | Estructura creada |
| **2** | Migrar `common.ts` | 1 hora | t('common.*') funciona |
| **3** | Módulos principales (5) | 2-3 h | Componentes críticos OK |
| **4** | Módulos secundarios (19) | 2-3 h | Todos los componentes OK |
| **5** | Actualizar imports | 1 hora | Type-check pasa |
| **6** | Limpieza y docs | 30 min | Build exitoso |

**Total**: ~9 horas (1-2 días de trabajo)

## 🔧 Cambios Técnicos

### Antes
```typescript
// src/lib/translations.ts (4,386 líneas)
export const translations = {
  en: { common: { actions: { save: 'Save' } } },
  es: { common: { actions: { save: 'Guardar' } } }
}
```

### Después
```typescript
// src/locales/en/common.ts
export const common = {
  actions: { save: 'Save' }
}

// src/locales/en/index.ts
import { common } from './common'
export const en = { common, ... }

// src/locales/index.ts
import { en } from './en'
import { es } from './es'
export const translations = { en, es }
```

### Componentes (sin cambios)
```typescript
// Uso en componentes (IGUAL que antes)
import { useLanguage } from '@/contexts/LanguageContext'

const { t } = useLanguage()
t('common.actions.save')  // ✅ Funciona igual
```

## 📊 Métricas de Éxito

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Archivos | 1 | 24 | +2,300% |
| Líneas/archivo | 4,386 | ~270 | -94% |
| Búsqueda | Lenta | Rápida | +70% |
| Conflictos merge | Frecuentes | Raros | -80% |
| Type-safety | Parcial | Completa | 100% |

## 🚨 Riesgos Críticos

1. **Romper funcionalidad** → Migrar módulo por módulo
2. **Conflictos de merge** → Comunicar al equipo (no editar `translations.ts`)
3. **Traducciones faltantes** → Script de validación

## ✅ Checklist Pre-Ejecución

- [ ] Rama Git limpia
- [ ] Crear rama `feature/i18n-modular-migration`
- [ ] Backup de `translations.ts`
- [ ] Comunicar al equipo
- [ ] Tests pasando (baseline)
- [ ] Build exitoso (baseline)

## 📖 Guía Rápida para Devs

### Agregar traducción nueva
```typescript
// 1. Identificar módulo (ej: appointments)
// 2. Editar src/locales/en/appointments.ts
export const appointments = {
  wizard: {
    newField: 'New Field'  // ✅ Agregar aquí
  }
}

// 3. Editar src/locales/es/appointments.ts
export const appointments = {
  wizard: {
    newField: 'Campo Nuevo'  // ✅ Traducir aquí
  }
}

// 4. Usar en componente
t('appointments.wizard.newField')
```

### Crear módulo nuevo
```typescript
// 1. Crear src/locales/en/nuevo-modulo.ts
export const nuevoModulo = { ... }

// 2. Crear src/locales/es/nuevo-modulo.ts
export const nuevoModulo = { ... }

// 3. Actualizar src/locales/en/index.ts
import { nuevoModulo } from './nuevo-modulo'
export const en = { ..., nuevoModulo }

// 4. Actualizar src/locales/es/index.ts (igual)

// 5. Actualizar src/locales/types.ts
export interface Translations {
  nuevoModulo: typeof import('./en/nuevo-modulo').nuevoModulo
}
```

## 🎯 Comandos Útiles

```powershell
# Type checking
pnpm run type-check

# Linting
pnpm run lint

# Build
pnpm run build

# Dev server
pnpm run dev

# Buscar componentes con useLanguage
Get-ChildItem -Path "src" -Recurse -Filter "*.tsx" | Select-String "useLanguage"
```

## 📅 Próximos Pasos

1. ✅ Revisar plan completo (`PLAN_MIGRACION_I18N_MODULAR.md`)
2. ✅ Aprobar arquitectura
3. ✅ Crear rama `feature/i18n-modular-migration`
4. ⏳ Ejecutar Fase 1 (Preparación)
5. ⏳ Ejecutar Fases 2-6 (Migración)
6. ⏳ Code review
7. ⏳ Merge y deploy

---

**¿Listo para ejecutar?** 🚀  
Ver plan completo en: `docs/PLAN_MIGRACION_I18N_MODULAR.md`

---

_Generado: 17 noviembre 2025 | Versión: 1.0.0_
