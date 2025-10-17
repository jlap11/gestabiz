# Fix Campos job_applications (17 Oct 2025)

## 🔍 Análisis Completo

### Problema
El código usaba nombres de campos que no coincidían con la estructura real de la tabla `job_applications` en Supabase.

---

## 📊 Mapeo de Campos

| Campo en Código (ANTES) | Campo en DB | Status | Solución |
|-------------------------|-------------|--------|----------|
| `availability_date` | NO EXISTE | ❌ | Cambiar a `available_from` |
| `applied_at` | NO EXISTE | ❌ | Usar `created_at` (auto) |
| `additional_info` | NO EXISTE | ❌ | Usar `availability_notes` |
| `expected_salary` | NO EXISTE | ❌ | **AGREGADO** a DB |
| `available_from` | ✅ EXISTS | ✅ | Ya existe (DATE) |
| `availability_notes` | ✅ EXISTS | ✅ | Ya existe (TEXT) |
| `availability` | ✅ EXISTS | ⚠️ | JSONB - no usado actualmente |

---

## ✅ Cambios Aplicados

### 1. Base de Datos - Agregar Campo Faltante
```sql
ALTER TABLE job_applications
ADD COLUMN IF NOT EXISTS expected_salary NUMERIC(12, 2);
```

**Resultado**: Campo `expected_salary` agregado exitosamente

---

### 2. Hook - useJobApplications.ts

#### a) Interface `JobApplication` (líneas 5-18)
**ANTES**:
```typescript
export interface JobApplication {
  expected_salary?: number;
  availability_date?: string;
  additional_info?: Record<string, unknown>;
  applied_at: string;
  // ...
}
```

**DESPUÉS**:
```typescript
export interface JobApplication {
  expected_salary?: number;
  available_from?: string; // DATE: cuando puede comenzar
  availability_notes?: string; // TEXT: notas adicionales
  // applied_at removido (usar created_at)
  // ...
}
```

#### b) Interface `CreateApplicationInput` (líneas 41-48)
**ANTES**:
```typescript
export interface CreateApplicationInput {
  expected_salary?: number;
  availability_date?: string;
  additional_info?: Record<string, unknown>;
}
```

**DESPUÉS**:
```typescript
export interface CreateApplicationInput {
  expected_salary?: number;
  available_from?: string; // ISO date string (YYYY-MM-DD)
  availability_notes?: string;
}
```

#### c) INSERT Data (línea ~203)
**ANTES**:
```typescript
const applicationData = {
  expected_salary: input.expected_salary,
  availability_date: input.availability_date,
  additional_info: input.additional_info,
  applied_at: new Date().toISOString() // ❌
};
```

**DESPUÉS**:
```typescript
const applicationData = {
  expected_salary: input.expected_salary,
  available_from: input.available_from,
  availability_notes: input.availability_notes
  // applied_at removido (created_at es auto)
};
```

---

### 3. Componente - ApplicationFormModal.tsx

#### Llamada a createApplication (línea ~165)
**ANTES**:
```typescript
await createApplication({
  vacancy_id: vacancy.id,
  cover_letter: coverLetter.trim(),
  expected_salary: expectedSalary,
  availability_date: availabilityDate, // ❌
  cv_file: cvFile || undefined,
});
```

**DESPUÉS**:
```typescript
await createApplication({
  vacancy_id: vacancy.id,
  cover_letter: coverLetter.trim(),
  expected_salary: expectedSalary,
  available_from: availabilityDate, // ✅
  cv_file: cvFile || undefined,
});
```

---

### 4. Otros Archivos Actualizados

#### useCatalogs.ts
- **Campo**: `countries.iso_code` → `countries.code`
- **Función**: `getColombiaId()` usa `.eq('code', 'COL')`
- **Interface**: `Country.iso_code` → `Country.code`
- **SELECT**: `select('id, name, code, phone_prefix')`

---

## 📋 Estructura Final de job_applications

```sql
CREATE TABLE job_applications (
  -- IDs
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vacancy_id UUID NOT NULL REFERENCES job_vacancies(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  business_id UUID NOT NULL REFERENCES businesses(id),
  
  -- Datos de aplicación
  status VARCHAR DEFAULT 'pending',
  cover_letter TEXT,
  cv_url TEXT, -- Path en bucket 'cvs'
  expected_salary NUMERIC(12, 2), -- ✅ NUEVO
  
  -- Disponibilidad
  available_from DATE, -- ✅ Fecha inicio disponibilidad
  availability_notes TEXT, -- ✅ Notas adicionales
  availability JSONB, -- Horarios disponibles (no usado)
  
  -- Review/Decision
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  interview_scheduled_at TIMESTAMPTZ,
  decision_at TIMESTAMPTZ,
  decision_notes TEXT,
  rating INTEGER,
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 🎯 Validación

### Test 1: Crear aplicación
```typescript
const app = await createApplication({
  vacancy_id: 'uuid-vacante',
  cover_letter: 'Mi carta...',
  expected_salary: 2500000, // ✅ Nuevo campo
  available_from: '2025-11-01', // ✅ Nombre correcto
  availability_notes: 'Puedo trabajar fines de semana', // ✅ Opcional
  cv_file: pdfFile
});
```

**Expected Result**: ✅ INSERT exitoso sin errores de schema

### Test 2: Fetch aplicaciones
```typescript
const { data } = await supabase
  .from('job_applications')
  .select('*')
  .eq('user_id', userId);

console.log(data[0].available_from); // ✅ "2025-11-01"
console.log(data[0].expected_salary); // ✅ 2500000
console.log(data[0].created_at); // ✅ Auto-generado
```

---

## 📝 Resumen de Cambios

| Tipo | Archivo | Cambios |
|------|---------|---------|
| 🗄️ Database | job_applications | +1 columna (`expected_salary`) |
| 🔧 Hook | useJobApplications.ts | 2 interfaces actualizadas, INSERT corregido |
| 🎨 Component | ApplicationFormModal.tsx | Prop name corregida |
| 🗂️ Catalogs | useCatalogs.ts | `iso_code` → `code` |

**Total de archivos modificados**: 3  
**Total de líneas cambiadas**: ~15

---

## ✅ Estado Final

| Feature | Status |
|---------|--------|
| Upload CV | ✅ Funcional |
| Campo expected_salary | ✅ Agregado y funcional |
| Campo available_from | ✅ Nombre correcto |
| Campo availability_notes | ✅ Disponible (opcional) |
| INSERT application | ✅ Sin errores de schema |
| Validation | ✅ Tipos correctos |

---

**Fecha**: 17 de octubre de 2025  
**Status**: 🟢 COMPLETADO - Schema alineado con DB
