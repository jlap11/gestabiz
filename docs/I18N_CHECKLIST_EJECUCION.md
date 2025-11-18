# ✅ Checklist de Ejecución: Migración i18n Modular

> **Usar este documento**: Durante la ejecución de la migración  
> **Objetivo**: No olvidar ningún paso crítico

---

## 📋 PRE-MIGRACIÓN

### ✅ Preparación del Ambiente
- [ ] Rama Git limpia (sin cambios pendientes)
  ```powershell
  git status  # Debe mostrar: "nothing to commit, working tree clean"
  ```

- [ ] Crear rama de migración
  ```powershell
  git checkout -b feature/i18n-modular-migration
  ```

- [ ] Backup del archivo original
  ```powershell
  Copy-Item "src/lib/translations.ts" "src/lib/translations.BACKUP.ts"
  ```

- [ ] Tests pasando (baseline)
  ```powershell
  pnpm run test  # Guardar output como referencia
  ```

- [ ] Build exitoso (baseline)
  ```powershell
  pnpm run build  # Debe completar sin errores
  ```

- [ ] Type-check pasando (baseline)
  ```powershell
  pnpm run type-check  # 0 errores
  ```

### ✅ Comunicación con el Equipo
- [ ] Notificar al equipo por Slack/Teams
  ```
  🚨 ATENCIÓN: Migración de sistema i18n en progreso (1-2 días)
  ❌ NO EDITAR: src/lib/translations.ts
  ✅ OK EDITAR: Cualquier otro archivo
  ```

- [ ] Asignar tiempo dedicado (9 horas totales)
  - [ ] Sesión 1: 4.5 horas (Fases 1-3)
  - [ ] Sesión 2: 4.5 horas (Fases 4-6)

---

## 🔧 FASE 1: Preparación (30 minutos)

### ✅ Crear Estructura de Carpetas
- [ ] Crear carpeta principal
  ```powershell
  New-Item -ItemType Directory -Path "src/locales" -Force
  ```

- [ ] Crear subcarpetas de idiomas
  ```powershell
  New-Item -ItemType Directory -Path "src/locales/en" -Force
  New-Item -ItemType Directory -Path "src/locales/es" -Force
  ```

### ✅ Crear Archivos Base
- [ ] Crear `src/locales/types.ts` (copiar desde plan)
- [ ] Crear `src/locales/en/index.ts` (vacío por ahora)
- [ ] Crear `src/locales/es/index.ts` (vacío por ahora)
- [ ] Crear `src/locales/index.ts` (exporta en y es)

### ✅ Validación Fase 1
- [ ] App sigue funcionando
  ```powershell
  pnpm run dev  # Abrir http://localhost:5173
  ```

- [ ] No hay errores de compilación
  ```powershell
  pnpm run type-check  # 0 errores
  ```

- [ ] Commit de progreso
  ```powershell
  git add src/locales
  git commit -m "feat(i18n): Create locales folder structure (Phase 1)"
  ```

---

## 🧪 FASE 2: Migrar Common (1 hora)

### ✅ Crear Archivos de Common
- [ ] Crear `src/locales/en/common.ts`
  - [ ] Copiar sección `common` de `translations.ts` (líneas 1-700 aprox)
  - [ ] Exportar: `export const common = { ... }`
  - [ ] Validar sintaxis (no errores de TypeScript)

- [ ] Crear `src/locales/es/common.ts`
  - [ ] Copiar sección `common` de español
  - [ ] Exportar: `export const common = { ... }`
  - [ ] Validar sintaxis

### ✅ Actualizar Index Files
- [ ] Actualizar `src/locales/en/index.ts`
  ```typescript
  import { common } from './common'
  export const en = { common }
  ```

- [ ] Actualizar `src/locales/es/index.ts`
  ```typescript
  import { common } from './common'
  export const es = { common }
  ```

- [ ] Actualizar `src/locales/index.ts`
  ```typescript
  import { en } from './en'
  import { es } from './es'
  export const translations = { en, es }
  ```

### ✅ Validación Fase 2
- [ ] Type-check pasa
  ```powershell
  pnpm run type-check
  ```

- [ ] App funciona correctamente
  ```powershell
  pnpm run dev
  ```

- [ ] Probar traducciones de common
  - [ ] `t('common.actions.save')` → "Save" / "Guardar"
  - [ ] `t('common.states.loading')` → "Loading..." / "Cargando..."
  - [ ] `t('common.messages.saveSuccess')` → "Saved successfully" / "Guardado exitosamente"

- [ ] Commit de progreso
  ```powershell
  git add src/locales
  git commit -m "feat(i18n): Migrate common translations (Phase 2)"
  ```

---

## 🚀 FASE 3: Módulos Principales (2-3 horas)

**Repetir para cada módulo**: auth, appointments, dashboard, settings, calendar

### ✅ Por cada módulo (ejemplo: appointments)

#### Paso 1: Crear archivos
- [ ] Crear `src/locales/en/appointments.ts`
  - [ ] Copiar sección `appointments` de `translations.ts`
  - [ ] Refactorizar claves si exceden 4 niveles
  - [ ] Exportar: `export const appointments = { ... }`

- [ ] Crear `src/locales/es/appointments.ts`
  - [ ] Copiar sección `appointments` de español
  - [ ] Traducir correctamente
  - [ ] Exportar: `export const appointments = { ... }`

#### Paso 2: Actualizar indexes
- [ ] Actualizar `src/locales/en/index.ts`
  ```typescript
  import { common } from './common'
  import { appointments } from './appointments'
  export const en = { common, appointments }
  ```

- [ ] Actualizar `src/locales/es/index.ts` (igual)

#### Paso 3: Validar
- [ ] Type-check pasa
- [ ] Probar componentes que usan ese módulo
  - [ ] AppointmentWizard funciona
  - [ ] DateTimeSelection funciona
  - [ ] CreateAppointment funciona

- [ ] Commit de progreso
  ```powershell
  git add src/locales
  git commit -m "feat(i18n): Migrate appointments translations (Phase 3)"
  ```

### ✅ Checklist de Módulos Principales
- [ ] `auth.ts` (login, registro, recovery)
- [ ] `appointments.ts` (wizard, lista, detalles)
- [ ] `dashboard.ts` (admin, employee, client)
- [ ] `settings.ts` (profile, business, notifications)
- [ ] `calendar.ts` (calendario)

### ✅ Validación Completa Fase 3
- [ ] Todos los componentes críticos funcionan
- [ ] No hay errores de TypeScript
- [ ] Tests E2E pasan (si están habilitados)

---

## 📦 FASE 4: Módulos Secundarios (2-3 horas)

**Repetir proceso de Fase 3 para los 19 módulos restantes**

### ✅ Checklist de Módulos Secundarios
- [ ] `billing.ts` (suscripciones, pagos, facturas)
- [ ] `accounting.ts` (transacciones, reportes, impuestos)
- [ ] `jobs.ts` (vacantes, aplicaciones, perfiles)
- [ ] `absences.ts` (solicitudes, balance, aprobaciones)
- [ ] `sales.ts` (ventas rápidas)
- [ ] `chat.ts` (mensajería)
- [ ] `notifications.ts` (notificaciones in-app)
- [ ] `reviews.ts` (calificaciones y reseñas)
- [ ] `business.ts` (gestión de negocios)
- [ ] `employees.ts` (gestión de empleados)
- [ ] `clients.ts` (gestión de clientes)
- [ ] `services.ts` (servicios del negocio)
- [ ] `locations.ts` (ubicaciones/sedes)
- [ ] `resources.ts` (recursos físicos)
- [ ] `permissions.ts` (sistema de permisos)
- [ ] `landing.ts` (landing page pública)
- [ ] `profile.ts` (perfiles públicos)
- [ ] `ui.ts` (componentes UI)
- [ ] `validation.ts` (mensajes de validación)

### ✅ Validación Completa Fase 4
- [ ] Todos los componentes funcionan
- [ ] `pnpm run type-check` sin errores
- [ ] `pnpm run lint` sin warnings críticos
- [ ] Build de producción exitoso
  ```powershell
  pnpm run build
  ```

---

## 🔄 FASE 5: Actualizar Imports (1 hora)

### ✅ Actualizar LanguageContext
- [ ] Abrir `src/contexts/LanguageContext.tsx`
- [ ] Cambiar import
  ```typescript
  // ANTES
  import { translations } from '@/lib/translations'
  
  // DESPUÉS
  import { translations } from '@/locales'
  import type { Language } from '@/locales'
  ```

### ✅ Buscar Componentes que Importan Directamente
- [ ] Buscar imports directos (si existen)
  ```powershell
  Get-ChildItem -Path "src" -Recurse -Filter "*.tsx" | Select-String "from '@/lib/translations'"
  ```

- [ ] Actualizar cada import encontrado
  ```typescript
  // ANTES
  import { translations } from '@/lib/translations'
  
  // DESPUÉS
  import { translations } from '@/locales'
  ```

### ✅ Validación Fase 5
- [ ] No hay imports rotos
  ```powershell
  pnpm run type-check
  ```

- [ ] Hot reload funciona correctamente
  - [ ] Editar `src/locales/en/common.ts`
  - [ ] Cambiar `save: 'Save'` → `save: 'Save Changes'`
  - [ ] Verificar que se actualiza en navegador (< 1 segundo)

- [ ] Commit de progreso
  ```powershell
  git add .
  git commit -m "feat(i18n): Update imports to use locales folder (Phase 5)"
  ```

---

## 🧹 FASE 6: Limpieza y Documentación (30 minutos)

### ✅ Deprecar Archivo Viejo
- [ ] Renombrar archivo original
  ```powershell
  Rename-Item "src/lib/translations.ts" "src/lib/translations.OLD.ts"
  ```

- [ ] Agregar comentario de deprecación en la parte superior
  ```typescript
  /**
   * @deprecated This file has been migrated to src/locales/
   * Please use: import { translations } from '@/locales'
   * 
   * This file is kept for reference only and will be removed in the future.
   * Migrated on: 2025-11-17
   * See: docs/I18N_INDICE_MAESTRO.md for migration details
   */
  ```

- [ ] Verificar que app funciona SIN este archivo
  ```powershell
  pnpm run dev
  pnpm run build
  ```

### ✅ Actualizar Documentación
- [ ] Actualizar `.github/copilot-instructions.md`
  - Buscar sección de i18n
  - Actualizar paths de `@/lib/translations` a `@/locales`
  - Agregar convención de claves (max 4 niveles)

### ✅ Crear Guías para el Equipo
- [ ] Verificar que existen estos archivos en `docs/`:
  - [ ] `I18N_INDICE_MAESTRO.md`
  - [ ] `I18N_RESUMEN_EJECUTIVO.md`
  - [ ] `I18N_ARQUITECTURA_VISUAL.md`
  - [ ] `I18N_COMPARACION_TECNICA.md`
  - [ ] `PLAN_MIGRACION_I18N_MODULAR.md`

### ✅ Validación Final
- [ ] `pnpm run type-check` sin errores
  ```powershell
  pnpm run type-check
  ```

- [ ] `pnpm run lint` sin warnings críticos
  ```powershell
  pnpm run lint
  ```

- [ ] Build de producción exitoso
  ```powershell
  pnpm run build
  ```

- [ ] Tests E2E pasan (si están habilitados)
  ```powershell
  pnpm run test
  ```

- [ ] Comparar bundle size
  ```powershell
  # Ver tamaño de dist/assets/index-*.js
  # Debe ser ~28% más pequeño
  Get-ChildItem -Path "dist/assets" -Filter "index-*.js" | Select-Object Name, Length
  ```

### ✅ Commit Final y Push
- [ ] Commit final
  ```powershell
  git add .
  git commit -m "feat(i18n): Complete migration to modular structure (Phase 6)

  - Deprecated old translations.ts file
  - Updated all imports to @/locales
  - Added comprehensive documentation
  - 24 modules created (en + es)
  - Bundle size reduced by ~28%
  - Type-safety improved to 100%
  
  See docs/I18N_INDICE_MAESTRO.md for details"
  ```

- [ ] Push a rama remota
  ```powershell
  git push -u origin feature/i18n-modular-migration
  ```

---

## 🧪 TESTING POST-MIGRACIÓN

### ✅ Testing Manual (30 minutos)

#### Idioma Español
- [ ] Cambiar idioma a Español
- [ ] Navegar por TODOS los dashboards
  - [ ] AdminDashboard
  - [ ] EmployeeDashboard
  - [ ] ClientDashboard
- [ ] Probar TODOS los flujos principales
  - [ ] Login/Logout
  - [ ] Crear cita (AppointmentWizard completo)
  - [ ] Editar cita
  - [ ] Configuraciones (Settings)
  - [ ] Billing
  - [ ] Chat
  - [ ] Notificaciones

#### Idioma Inglés
- [ ] Cambiar idioma a English
- [ ] Repetir TODOS los pasos anteriores
- [ ] Verificar que NO hay claves sin traducir (ej: "appointments.wizard.title")

### ✅ Testing Automático
- [ ] Ejecutar tests unitarios
  ```powershell
  pnpm run test
  ```

- [ ] Ejecutar tests E2E (si están habilitados)
  ```powershell
  pnpm run test:e2e
  ```

### ✅ Testing de Performance
- [ ] Medir tiempo de hot reload
  - Editar `src/locales/en/common.ts`
  - Tiempo esperado: < 1 segundo ✅
  
- [ ] Medir tiempo de build
  ```powershell
  Measure-Command { pnpm run build }
  ```
  - Tiempo esperado: Similar o más rápido que antes

---

## 📊 VALIDACIÓN DE MÉTRICAS

### ✅ Métricas Esperadas

- [ ] Archivos creados: 50 (24 en + 24 es + 2 meta)
- [ ] Líneas por archivo: ~270 promedio
- [ ] Reducción de líneas por archivo: -94% (4,386 → ~270)
- [ ] Bundle size: -28% (comparar antes/después)
- [ ] Type-check: 0 errores
- [ ] Lint: 0 warnings críticos
- [ ] Tests: 100% pasando

---

## 🎉 POST-MIGRACIÓN

### ✅ Comunicar Resultados
- [ ] Notificar al equipo por Slack/Teams
  ```
  ✅ Migración i18n COMPLETADA exitosamente
  
  📊 Métricas:
  - 24 módulos creados (en + es)
  - Bundle size: -28%
  - Hot reload: 80% más rápido
  - Type-safety: 100%
  
  📖 Documentación:
  docs/I18N_INDICE_MAESTRO.md
  
  🔧 Cómo agregar traducciones:
  Ver docs/I18N_RESUMEN_EJECUTIVO.md
  ```

### ✅ Code Review
- [ ] Crear Pull Request en GitHub
- [ ] Asignar reviewers (mínimo 2)
- [ ] Incluir link a documentación en descripción
- [ ] Esperar aprobación

### ✅ Merge y Deploy
- [ ] Merge a `main` después de aprobación
- [ ] Verificar que CI/CD pasa
- [ ] Deploy a producción
- [ ] Monitorear logs por 24 horas

---

## 🚨 ROLLBACK (Si algo sale mal)

### ✅ Pasos de Rollback
- [ ] Revertir commit
  ```powershell
  git revert HEAD
  ```

- [ ] Restaurar backup
  ```powershell
  Copy-Item "src/lib/translations.BACKUP.ts" "src/lib/translations.ts"
  ```

- [ ] Eliminar carpeta locales
  ```powershell
  Remove-Item -Recurse -Force "src/locales"
  ```

- [ ] Restaurar import en LanguageContext
  ```typescript
  import { translations } from '@/lib/translations'
  ```

- [ ] Verificar que app funciona
  ```powershell
  pnpm run dev
  pnpm run build
  ```

---

## 📝 NOTAS IMPORTANTES

### ⚠️ Durante la Migración
- NO editar `src/lib/translations.ts` (usar solo los nuevos archivos)
- NO hacer commits parciales (completar cada fase antes de commit)
- NO saltarse validaciones (pueden romper app en producción)

### ✅ Después de la Migración
- Eliminar `src/lib/translations.OLD.ts` después de 1 mes (si todo funciona)
- Eliminar `src/lib/translations.BACKUP.ts` después de deploy exitoso
- Crear scripts de validación (`i18n:validate`, `i18n:unused`, `i18n:missing`)

---

**¿Listo para comenzar?** 🚀  
Marca cada checkbox a medida que completas cada paso.

---

_Generado: 17 de noviembre de 2025_  
_Versión: 1.0.0_  
_Proyecto: Gestabiz_
