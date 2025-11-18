# 📖 Contributing to i18n System

Welcome! This guide will help you add new translations to Gestabiz's modular i18n system.

---

## 🎯 Quick Start (5 minutes)

### 1. Identify the Right Module

**Question**: Where does your translation belong?

| Your translation is about... | Use module... | File location |
|------------------------------|---------------|---------------|
| Common actions (save, cancel, delete) | `common` | `src/locales/*/common.ts` |
| Authentication flows | `auth` | `src/locales/*/auth.ts` |
| Appointments & bookings | `appointments` | `src/locales/*/appointments.ts` |
| Dashboard, calendar, settings | `dashboard` | `src/locales/*/dashboard.ts` |
| Navigation, UI components | `navigation` | `src/locales/*/navigation.ts` |
| Business management | `business` | `src/locales/*/business.ts` |
| Notifications, reviews, jobs | `features` | `src/locales/*/features.ts` |
| Admin tools, permissions | `admin` | `src/locales/*/admin.ts` |
| UI components (forms, badges) | `components` | `src/locales/*/components.ts` |
| Landing page | `landing` | `src/locales/*/landing.ts` |

### 2. Add Your Translation

**English** (`src/locales/en/yourmodule.ts`):
```typescript
export const yourModule = {
  // ... existing keys
  yourNewSection: {
    yourNewKey: 'Your Translation',
  },
}
```

**Spanish** (`src/locales/es/yourmodule.ts`):
```typescript
export const yourModule = {
  // ... existing keys
  yourNewSection: {
    yourNewKey: 'Tu Traducción',
  },
}
```

### 3. Use in Component

```tsx
import { useLanguage } from '@/contexts/LanguageContext'

function MyComponent() {
  const { t } = useLanguage()
  return <div>{t('yourModule.yourNewSection.yourNewKey')}</div>
}
```

### 4. Test & Commit

```bash
# Type-check
npm run type-check

# Test in browser
npm run dev

# Commit
git add src/locales/
git commit -m "feat(i18n): Add translation for YourFeature"
```

✅ Done!

---

## 📚 Detailed Guide

### Naming Conventions

**Pattern**: `module.component.section.element` (max 4 levels)

**✅ Good examples**:
```typescript
'common.actions.save'              // 3 levels
'auth.login.submit'                // 3 levels
'appointments.wizard.step1.title'  // 4 levels
'landing.hero.cta.primary'         // 4 levels
```

**❌ Bad examples**:
```typescript
'save'                                      // Too generic
'common.save'                               // Missing hierarchy
'appointments.wizard.step1.form.input.label' // Too deep (5 levels)
'auth_login_submit'                         // Wrong separator (use dots)
```

### Parameter Replacement

**Add parameters with double curly braces**:

```typescript
// In translation file
export const common = {
  messages: {
    success: '{{action}} successful',
    itemCount: 'You have {{count}} items',
  },
}

// In component
t('common.messages.success', { action: 'Save' })
// Output: "Save successful"

t('common.messages.itemCount', { count: '5' })
// Output: "You have 5 items"
```

### Creating a New Module

**When to create a new module**:
- You have 10+ related translations
- They don't fit in existing modules
- They represent a distinct feature

**Steps**:

#### 1. Create Module Files

**`src/locales/en/yourmodule.ts`**:
```typescript
export const yourModule = {
  title: 'Your Module',
  description: 'Module description',
  sections: {
    section1: {
      title: 'Section 1',
      items: {
        item1: 'Item 1',
        item2: 'Item 2',
      },
    },
  },
}
```

**`src/locales/es/yourmodule.ts`**:
```typescript
export const yourModule = {
  title: 'Tu Módulo',
  description: 'Descripción del módulo',
  sections: {
    section1: {
      title: 'Sección 1',
      items: {
        item1: 'Elemento 1',
        item2: 'Elemento 2',
      },
    },
  },
}
```

#### 2. Update Type Definitions

**`src/locales/types.ts`**:
```typescript
export interface Translations {
  // ... existing modules
  yourModule: typeof import('./en/yourmodule').yourModule
}
```

#### 3. Update Index Files

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

#### 4. Document in README

Add your module to `src/locales/README.md`:

```markdown
### Your Module
**File**: `yourmodule.ts`

Description of what this module contains.

**Usage**: `t('yourModule.section1.title')`
```

---

## ✅ Testing Your Translations

### 1. Type-Check

```bash
npm run type-check
```

Should show **zero errors** in `src/locales/`.

### 2. Visual Test

```bash
npm run dev
```

1. Navigate to component using your translation
2. Switch language (ES ↔ EN)
3. Verify both translations display correctly
4. Test parameter replacement if applicable

### 3. Use Test Component

```tsx
// Temporarily add to any page
import { I18nMigrationTest } from '@/tests/i18n-migration-test'

<I18nMigrationTest />
```

Check browser console for test results.

---

## 🔍 Common Patterns

### Actions
```typescript
actions: {
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
  save: 'Save',
  cancel: 'Cancel',
}
```

### States
```typescript
states: {
  loading: 'Loading...',
  success: 'Success',
  error: 'Error',
  pending: 'Pending',
}
```

### Forms
```typescript
form: {
  labels: {
    name: 'Name',
    email: 'Email',
    password: 'Password',
  },
  placeholders: {
    name: 'Enter your name',
    email: 'your@email.com',
  },
  validation: {
    required: 'This field is required',
    invalid: 'Invalid format',
  },
}
```

### Messages
```typescript
messages: {
  success: '{{action}} successful',
  error: 'An error occurred',
  confirm: 'Are you sure?',
}
```

---

## 🚫 Common Mistakes

### ❌ Mistake 1: Using wrong separator
```typescript
// Wrong
'common_actions_save'

// Correct
'common.actions.save'
```

### ❌ Mistake 2: Nesting too deep
```typescript
// Wrong (5 levels)
'module.component.section.subsection.element'

// Correct (4 levels max)
'module.component.section.element'
```

### ❌ Mistake 3: Inconsistent keys
```typescript
// Wrong - Keys don't match between languages
// EN
export const auth = {
  loginButton: 'Login',
}

// ES
export const auth = {
  botonLogin: 'Iniciar Sesión', // Different key!
}

// Correct - Same keys, different values
// EN
export const auth = {
  loginButton: 'Login',
}

// ES
export const auth = {
  loginButton: 'Iniciar Sesión',
}
```

### ❌ Mistake 4: Forgetting to update both languages
```typescript
// Wrong - Only updated English
// EN: Has new key
// ES: Missing new key

// Correct - Updated both
// EN: Has new key
// ES: Has new key (translated)
```

### ❌ Mistake 5: Not updating types
```typescript
// Wrong - Created module but didn't update types.ts
// Result: TypeScript errors, no auto-complete

// Correct - Always update types.ts when creating module
```

---

## 📋 Pre-Commit Checklist

Before committing your translation changes:

- [ ] Added translation in BOTH English and Spanish
- [ ] Used dot notation (`module.section.key`)
- [ ] Maximum 4 nesting levels
- [ ] Keys match exactly between EN and ES
- [ ] Updated `types.ts` if new module created
- [ ] Updated index files (`en/index.ts`, `es/index.ts`)
- [ ] Ran `npm run type-check` (zero errors)
- [ ] Tested in browser (both languages)
- [ ] Documented in `src/locales/README.md` if new module
- [ ] Conventional commit message (`feat(i18n): ...`)

---

## 🆘 Getting Help

**Questions?**
1. Check `src/locales/README.md` for detailed documentation
2. Look at existing modules for examples
3. Ask on GitHub Discussions
4. Open an issue with `[i18n]` prefix

**Found a bug?**
- Open issue: `[i18n] Description of the bug`

---

## 📜 Translation Style Guide

### Capitalization

**English**:
- Title Case for headings: `"Create New Appointment"`
- Sentence case for descriptions: `"Enter your email address"`

**Spanish**:
- Sentence case for everything: `"Crear nueva cita"`
- Only capitalize first word and proper nouns

### Tone

**Formal (usted)** vs **Informal (tú)**:
- We use **informal (tú)** for client-facing text
- Example: "Ingresa tu email" (not "Ingrese su email")

### Consistency

**Common words should always translate the same**:
- "Save" → "Guardar" (not "Salvar", "Grabar")
- "Delete" → "Eliminar" (not "Borrar")
- "Cancel" → "Cancelar" (consistent)

---

## 🎉 Your First Contribution

**New to contributing?** Start here:

1. Pick a simple task:
   - Add a missing button label
   - Translate a new message
   - Fix a typo

2. Follow this guide step-by-step

3. Open a PR with clear description

4. We'll review and help if needed

**Welcome to the team!** 🚀

---

**See also**:
- `src/locales/README.md` - Complete system documentation
- `src/tests/i18n-migration-test.tsx` - Test component
- `src/contexts/LanguageContext.tsx` - Implementation details
