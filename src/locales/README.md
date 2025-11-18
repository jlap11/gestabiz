# 🌍 Modular i18n System - Gestabiz

> **Migration Status**: ✅ PHASE 4 COMPLETED (Nov 2025)  
> **Languages**: Spanish (ES - default), English (EN)  
> **Modules**: 69 translation modules across 16 consolidated files

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Usage Guide](#usage-guide)
4. [Module Structure](#module-structure)
5. [Migration History](#migration-history)
6. [Adding New Translations](#adding-new-translations)
7. [Testing](#testing)

---

## Overview

This directory contains the **modular i18n system** for Gestabiz, replacing the legacy monolithic `src/lib/translations.ts` file.

### Key Benefits:
✅ **Modular organization**: Translations grouped by functionality  
✅ **Type-safe**: Full TypeScript support with auto-completion  
✅ **Maintainable**: Easy to find and update translations  
✅ **Scalable**: Add new modules without touching existing ones  
✅ **Backward compatible**: Zero breaking changes via merge strategy  

### Naming Convention:
`module.component.section.element` (maximum 4 nesting levels)

**Examples**:
- `common.actions.save` → "Guardar" (ES) / "Save" (EN)
- `auth.login.submit` → "Iniciar Sesión" (ES)
- `appointments.wizard.step1.title` → "Selecciona un servicio" (ES)

---

## Architecture

```
src/locales/
├── types.ts                    # TypeScript type definitions
├── index.ts                    # Main entry point (exports merged translations)
├── en/                         # English translations
│   ├── index.ts                # Auto-merge all EN modules
│   ├── common.ts               # Common translations (245 keys)
│   ├── auth.ts                 # Authentication (60 keys)
│   ├── appointments.ts         # Appointments (47 keys)
│   ├── dashboard.ts            # Dashboard, Calendar, Settings (35 keys)
│   ├── navigation.ts           # Nav, UI, Validation, Profile (4 modules)
│   ├── business.ts             # Business entities (5 modules)
│   ├── features.ts             # Secondary features (7 modules)
│   ├── admin.ts                # Admin & System (7 modules)
│   ├── components.ts           # UI Components (25 modules)
│   └── landing.ts              # Landing page (2 modules)
└── es/                         # Spanish translations (same structure)
    └── ...
```

### Merge Strategy:

```typescript
// In LanguageContext.tsx
const mergedTranslations = {
  en: { ...oldTranslations.en, ...newTranslations.en },
  es: { ...oldTranslations.es, ...newTranslations.es },
}
```

**How it works**:
1. Old monolithic translations loaded from `src/lib/translations.ts`
2. New modular translations loaded from `src/locales/`
3. Merged together with **new taking precedence**
4. All existing `t()` calls continue working (zero breaking changes)

---

## Usage Guide

### Basic Usage:

```tsx
import { useLanguage } from '@/contexts/LanguageContext'

function MyComponent() {
  const { t, language, setLanguage } = useLanguage()

  return (
    <div>
      {/* Simple translation */}
      <h1>{t('common.actions.save')}</h1>
      
      {/* With parameters */}
      <p>{t('common.messages.success', { action: 'Guardado' })}</p>
      
      {/* Language switcher */}
      <button onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}>
        {t('common.actions.switchLanguage')}
      </button>
    </div>
  )
}
```

### Current Language:
```tsx
const { language } = useLanguage()
console.log(language) // 'es' or 'en'
```

### Change Language:
```tsx
const { setLanguage } = useLanguage()
setLanguage('en') // Switch to English
```

---

## Module Structure

### Phase 2: Common Module (245 keys)
**File**: `common.ts`

```typescript
export const common = {
  actions: {
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    // ... 50 more actions
  },
  states: {
    loading: 'Cargando...',
    success: 'Éxito',
    error: 'Error',
    // ... 30 more states
  },
  messages: {
    success: '{{action}} exitoso',
    error: 'Ocurrió un error',
    // ... 40 more messages
  },
  // 7 more sections...
}
```

**Usage**: `t('common.actions.save')`

---

### Phase 3: Main Modules (142 keys)

#### 1. Auth Module (60 keys)
**File**: `auth.ts`

```typescript
export const auth = {
  login: {
    title: 'Iniciar Sesión',
    email: 'Correo Electrónico',
    password: 'Contraseña',
    submit: 'Entrar',
    // ... more
  },
  register: { /* ... */ },
  forgotPassword: { /* ... */ },
  // ... more sections
}
```

**Usage**: `t('auth.login.title')`

#### 2. Appointments Module (47 keys)
**File**: `appointments.ts`

**Usage**: `t('appointments.title')`, `t('appointments.status.pending')`

#### 3. Dashboard Module (35 keys)
**File**: `dashboard.ts`

Exports: `dashboard`, `calendar`, `settings`

**Usage**: `t('dashboard.title')`, `t('calendar.today')`, `t('settings.title')`

---

### Phase 4: Secondary Modules (1,800+ keys)

#### Navigation Group (4 modules)
**File**: `navigation.ts`

Exports: `nav`, `ui`, `validation`, `profile`

**Usage**: `t('nav.home')`, `t('ui.loading')`, `t('validation.required')`

#### Business Entities (5 modules)
**File**: `business.ts`

Exports: `business`, `clients`, `services`, `locations`, `employees`

**Usage**: `t('business.title')`, `t('clients.add')`, `t('services.list')`

#### Features (7 modules)
**File**: `features.ts`

Exports: `notifications`, `reviews`, `jobs`, `absences`, `sales`, `billing`, `accounting`

**Usage**: `t('notifications.title')`, `t('reviews.write_review')`, `t('billing.invoices')`

#### Admin & System (7 modules)
**File**: `admin.ts`

Exports: `businessResources`, `permissions`, `reports`, `admin`, `search`, `taxConfiguration`, `userProfile`

**Usage**: `t('permissions.assign')`, `t('reports.generate')`, `t('admin.users')`

#### UI Components (25 modules)
**File**: `components.ts`

Exports: `adminDashboard`, `employeeDashboard`, `clientDashboard`, `imageCropper`, `bannerCropper`, `quickSaleForm`, and 19 more...

**Usage**: `t('adminDashboard.title')`, `t('imageCropper.crop')`

#### Landing (2 modules)
**File**: `landing.ts`

Exports: `landing`, `employee`

**Usage**: `t('landing.hero.title')`, `t('employee.profile.title')`

---

## Migration History

### Timeline:

| Phase | Date | Description | Keys Migrated |
|-------|------|-------------|---------------|
| **Phase 1** | Nov 16, 2025 | Infrastructure setup | 0 |
| **Phase 2** | Nov 16, 2025 | Common module | 245 |
| **Phase 3** | Nov 16, 2025 | Main modules (auth, appointments, dashboard) | 142 |
| **Phase 4** | Nov 17, 2025 | All secondary modules (19 consolidated) | ~1,800 |
| **Total** | - | **69 modules across 16 files** | **~2,200** |

### Git History:
```bash
# View migration commits
git log --oneline --grep="Phase"

# Example output:
# db8d7f5 Phase 4 COMPLETED: Migrate all secondary modules
# a1b2c3d Phase 3: Migrate main modules
# e4f5g6h Phase 2: Migrate common module
# h7i8j9k Phase 1: Setup infrastructure
```

---

## Adding New Translations

### 1. Choose Module File:
Determine which file fits best:
- Common actions/states → `common.ts`
- New business entity → `business.ts`
- New feature → `features.ts`
- New UI component → `components.ts`

### 2. Add Translation Key:

**English** (`src/locales/en/yourmodule.ts`):
```typescript
export const yourModule = {
  newSection: {
    newKey: 'New Translation',
  },
}
```

**Spanish** (`src/locales/es/yourmodule.ts`):
```typescript
export const yourModule = {
  newSection: {
    newKey: 'Nueva Traducción',
  },
}
```

### 3. Update Type Definitions:

**`src/locales/types.ts`**:
```typescript
export interface Translations {
  // ... existing modules
  yourModule: typeof import('./en/yourmodule').yourModule
}
```

### 4. Update Index Files:

**`src/locales/en/index.ts`**:
```typescript
import { yourModule } from './yourmodule'

export const en = {
  // ... existing modules
  yourModule,
}
```

**`src/locales/es/index.ts`**:
```typescript
import { yourModule } from './yourmodule'

export const es = {
  // ... existing modules
  yourModule,
}
```

### 5. Use in Components:
```tsx
const { t } = useLanguage()
<div>{t('yourModule.newSection.newKey')}</div>
```

---

## Testing

### Run i18n Tests:

```tsx
// Import test component
import { I18nMigrationTest } from '@/tests/i18n-migration-test'

// Add to any page
<I18nMigrationTest />

// Check browser console for results
```

### Manual Testing Checklist:

- [ ] Common translations working (`t('common.actions.save')`)
- [ ] Auth translations working (`t('auth.login.title')`)
- [ ] Appointments translations working (`t('appointments.title')`)
- [ ] Dashboard translations working (`t('dashboard.title')`)
- [ ] Navigation translations working (`t('nav.home')`)
- [ ] Business translations working (`t('business.title')`)
- [ ] Features translations working (`t('notifications.title')`)
- [ ] Admin translations working (`t('permissions.title')`)
- [ ] Components translations working (`t('adminDashboard.title')`)
- [ ] Landing translations working (`t('landing.hero.title')`)
- [ ] Parameter replacement working (`t('common.messages.success', { action: 'Test' })`)
- [ ] Language switching working (ES ↔ EN)
- [ ] No breaking changes (old keys still work)

### TypeScript Validation:
```bash
# Check for type errors
npm run type-check

# Should show zero errors in src/locales/
```

---

## 🎯 Next Steps (Phase 5-6)

### Phase 5: Final Integration
- [x] Verify merge strategy working
- [x] Test all translation access
- [ ] Validate zero breaking changes
- [ ] Update documentation comments
- [ ] Commit Phase 5

### Phase 6: Deprecation
- [ ] Mark `src/lib/translations.ts` as deprecated
- [ ] Add migration guide to old file
- [ ] Update README.md
- [ ] Create contributing guide
- [ ] Merge feature branch
- [ ] Delete backup file (optional)

---

## 📚 Resources

- **Main Context**: `src/contexts/LanguageContext.tsx`
- **Old System** (deprecated): `src/lib/translations.ts`
- **Test Component**: `src/tests/i18n-migration-test.tsx`
- **Type Definitions**: `src/locales/types.ts`

---

**Questions?** Check the git history or ask the dev team! 🚀
