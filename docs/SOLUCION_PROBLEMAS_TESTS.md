# 🔧 Solución de Problemas - Tests del Sistema de Vacantes

**Fecha**: 17 de octubre de 2025  
**Estado**: ✅ RESUELTO PARCIALMENTE

---

## ❌ Problemas Identificados

### 1. Columnas Faltantes en Base de Datos

**Error Original**:
```
PGRST204: Could not find the 'experience_level' column of 'job_vacancies'
PGRST204: Could not find the 'availability' column of 'job_applications'
```

**Causa**: Las migraciones originales no incluyeron estas columnas necesarias para los tests.

**Solución Aplicada**: ✅
```sql
-- Migración: add_missing_vacancy_columns
ALTER TABLE job_vacancies ADD COLUMN IF NOT EXISTS experience_level TEXT;
ALTER TABLE job_vacancies ADD COLUMN IF NOT EXISTS slots INTEGER DEFAULT 1;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS availability JSONB;
```

**Status**: ✅ RESUELTO - Migración aplicada exitosamente

---

### 2. Validación de Emails en Supabase Auth

**Error Original**:
```
Email address "owner-1760707876259@test.com" is invalid
Email address "owner1760707897404@example.com" is invalid
```

**Causa**: Supabase Auth tiene validación estricta de emails que no permite ciertos formatos.

**Soluciones Intentadas**:
1. ❌ `owner-${Date.now()}@test.com` - Rechazado
2. ❌ `owner${Date.now()}@example.com` - Rechazado
3. ⏳ `test.owner.${timestamp}@example.com` - Probando

**Configuración Requerida en Supabase**:

Para que los tests funcionen, necesitas configurar Supabase:

1. **Deshabilitar confirmación de email en testing**:
   ```
   Supabase Dashboard → Authentication → Settings
   → Email Auth → Confirm email: OFF
   ```

2. **Permitir signups locales**:
   ```
   Supabase Dashboard → Authentication → Settings
   → Enable email signup: ON
   → Minimum password length: 8
   ```

3. **Usar Service Role Key para tests** (alternativa):
   ```typescript
   // En lugar de anon key, usar service_role key
   const supabase = createClient(supabaseUrl, serviceRoleKey)
   ```

**Status**: ⏳ PARCIALMENTE RESUELTO - Requiere configuración manual

---

### 3. UUIDs Vacíos o Undefined

**Error Original**:
```
invalid input syntax for type uuid: ""
invalid input syntax for type uuid: "undefined"
```

**Causa**: Los IDs de usuarios no se estaban guardando correctamente después de `signUp`.

**Solución Aplicada**: ✅
```typescript
// ANTES (incorrecto)
testOwnerId = ownerData.user?.id || ''

// DESPUÉS (correcto)
if (!ownerData.user) throw new Error('Owner user not created')
testOwnerId = ownerData.user.id
```

**Status**: ✅ RESUELTO - Validación agregada

---

## ✅ Migraciones Aplicadas

### Migration: `add_missing_vacancy_columns`

```sql
-- Agregar columnas faltantes
ALTER TABLE job_vacancies
ADD COLUMN IF NOT EXISTS experience_level TEXT
CHECK (experience_level IN ('entry', 'mid', 'senior', 'expert'));

ALTER TABLE job_vacancies
ADD COLUMN IF NOT EXISTS slots INTEGER DEFAULT 1
CHECK (slots > 0);

ALTER TABLE job_applications
ADD COLUMN IF NOT EXISTS availability JSONB;

-- Sincronizar datos existentes
UPDATE job_vacancies
SET experience_level = 
  CASE 
    WHEN experience_required ILIKE '%senior%' THEN 'senior'
    WHEN experience_required ILIKE '%mid%' THEN 'mid'
    WHEN experience_required ILIKE '%entry%' THEN 'entry'
    WHEN experience_required ILIKE '%expert%' THEN 'expert'
    ELSE 'mid'
  END
WHERE experience_level IS NULL;

UPDATE job_vacancies
SET slots = COALESCE(number_of_positions, 1)
WHERE slots IS NULL;

-- Índices
CREATE INDEX IF NOT EXISTS idx_job_vacancies_experience_level 
ON job_vacancies(experience_level) 
WHERE status = 'open';
```

**Resultado**: ✅ Aplicado exitosamente

---

## 🛠️ Configuración Requerida para Tests

### Opción 1: Configurar Supabase Dashboard (Recomendado)

1. **Authentication → Settings**:
   - ✅ Enable email signup: ON
   - ✅ Confirm email: OFF (solo para testing)
   - ✅ Minimum password length: 8

2. **Edge Functions → Secrets**:
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   ```

### Opción 2: Usar Service Role Key (Avanzado)

Crear archivo `.env.test`:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

Modificar tests:
```typescript
const supabaseKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
                    import.meta.env.VITE_SUPABASE_ANON_KEY
```

**⚠️ ADVERTENCIA**: Service role key tiene permisos completos. Solo usar en tests, nunca en producción.

### Opción 3: Test Database Separada (Ideal)

Crear instancia Supabase separada solo para testing:
```env
VITE_SUPABASE_TEST_URL=https://test-proyecto.supabase.co
VITE_SUPABASE_TEST_KEY=test-anon-key
```

---

## 📝 Tests Corregidos

### Cambios Principales

1. **Validación de respuestas**:
   ```typescript
   // ANTES
   testOwnerId = ownerData.user?.id || ''
   
   // DESPUÉS
   if (ownerError) throw new Error(`Creation failed: ${ownerError.message}`)
   if (!ownerData.user) throw new Error('User not created')
   testOwnerId = ownerData.user.id
   ```

2. **Emails con timestamp**:
   ```typescript
   const timestamp = Date.now()
   ownerEmail = `test.owner.${timestamp}@example.com`
   ```

3. **Sign in mejorado**:
   ```typescript
   const { error: signInError } = await supabase.auth.signInWithPassword({
     email: ownerEmail,
     password: 'TestPassword123!',
   })
   if (signInError) console.warn('Sign in warning:', signInError.message)
   ```

---

## 🚀 Próximos Pasos

### Para Hacer Tests Funcionales:

1. **Configurar Supabase Dashboard** (5 min):
   - Deshabilitar confirmación de email
   - Verificar que signups estén habilitados

2. **Verificar variables de entorno** (2 min):
   ```bash
   echo $env:VITE_SUPABASE_URL
   echo $env:VITE_SUPABASE_ANON_KEY
   ```

3. **Ejecutar tests**:
   ```bash
   npm run test tests/job-vacancy-complete-flow.test.ts
   ```

### Para Tests E2E Completos:

1. Crear instancia de test en Supabase
2. Configurar `.env.test`
3. Implementar cleanup automático
4. Agregar a CI/CD pipeline

---

## 📊 Estado Actual de Tests

| Test Suite | Tests | Passing | Failing | Status |
|------------|-------|---------|---------|--------|
| job-vacancy-complete-flow | 9 | 0 | 9 | ⏳ Config requerida |
| matching-score-calculation | 12 | 0 | 0 | ⏳ Pendiente |
| schedule-conflict-detection | 15 | 0 | 0 | ⏳ Pendiente |
| mandatory-review-enforcement | 9 | 0 | 0 | ⏳ Pendiente |

**Total**: 45 tests pendientes de configuración de Supabase

---

## 💡 Alternativa: Mock de Supabase

Si no puedes configurar Supabase para testing, puedes usar mocks:

```typescript
// tests/setup.ts
import { vi } from 'vitest'

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp: vi.fn(({ email }) => ({
        data: { user: { id: `mock-${email}`, email } },
        error: null
      })),
      signInWithPassword: vi.fn(() => ({
        data: { session: {} },
        error: null
      }))
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn(() => ({
        data: { id: 'mock-id' },
        error: null
      }))
    }))
  }))
}))
```

---

## 📚 Referencias

- **Supabase Auth**: https://supabase.com/docs/guides/auth
- **Supabase Testing**: https://supabase.com/docs/guides/testing
- **Vitest Mocking**: https://vitest.dev/guide/mocking.html

---

**Última actualización**: 17 de octubre de 2025  
**Autor**: Sistema de Debugging  
**Siguiente paso**: Configurar Supabase Dashboard para testing
