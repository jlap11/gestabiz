# Migraciones de Base de Datos - Gestabiz

## 📋 Estado Actual

**Fecha de reorganización**: 1 de diciembre de 2025

### Migración Base Oficial

- **`20251201000000_base_schema_snapshot.sql`** - ✅ ÚNICA MIGRACIÓN OFICIAL
  - Snapshot limpio del esquema de producción actual
  - Incluye todas las funciones y triggers críticos
  - Base para futuras migraciones

## 🗂️ Estructura

```
supabase/
├── migrations/
│   ├── 20251201000000_base_schema_snapshot.sql  ← MIGRACIÓN OFICIAL
│   └── README.md                                ← Este archivo
└── migrations_backup_20251201_100323/           ← Historial (solo referencia)
    ├── 20251026230506_*.sql
    ├── 20251027000000_*.sql
    ├── ... (86 migraciones históricas)
    └── *_placeholder.sql
```

## ✅ Qué Incluye la Migración Base

### Funciones RPC
1. **`get_client_dashboard_data()`**
   - Retorna datos completos del dashboard del cliente
   - Estructura: `{ appointments, reviewedAppointmentIds, pendingReviewsCount, favorites, suggestions, stats }`
   - **FIX APLICADO**: Favoritos SIN filtro de ciudad (siempre se muestran)
   - **FIX APLICADO**: Sugerencias con filtro de ciudad/región
   - **FIX APLICADO**: Campo `category` en services

### Funciones de Ausencias
2. **`calculate_absence_days()`** - Calcula días de ausencia
3. **`is_employee_available_on_date()`** - Verifica disponibilidad de empleado

### Trigger Functions
4. **`auto_insert_owner_to_business_employees()`**
   - Auto-registra al owner como empleado (manager) al crear negocio
   
5. **`sync_business_roles_from_business_employees()`**
   - Mantiene sincronizado `business_roles` ↔ `business_employees`
   - Manager → Admin (hierarchy_level=1)
   - Employee → Employee (hierarchy_level=4)

### Triggers Activos
- `trg_auto_insert_owner_to_business_employees` (ON businesses)
- `trg_sync_business_roles_from_business_employees` (ON business_employees)

## 📦 Backup de Migraciones Antiguas

**Ubicación**: `supabase/migrations_backup_20251201_100323/`

### Contenido del Backup
- **86 migraciones históricas** (octubre-noviembre 2025)
- **83 placeholders** (marcadores de migraciones ya aplicadas)
- **Total**: 169 archivos SQL

**⚠️ IMPORTANTE**: No eliminar este directorio. Contiene el historial completo de cambios.

## 🚀 Cómo Trabajar con Migraciones

### Crear Nueva Migración
```powershell
npx supabase migration new nombre_descriptivo
```

### Aplicar Migraciones
```powershell
# SIEMPRE usar --yes para evitar prompts interactivos
npx supabase db push --dns-resolver https --yes
```

### Ver Estado de Migraciones
```powershell
npx supabase migration list --dns-resolver https
```

### Revertir Migración (solo si es necesario)
```powershell
npx supabase migration repair --status reverted TIMESTAMP --dns-resolver https
```

## 🐛 Problemas Resueltos

Esta reorganización soluciona:

1. ✅ **Conflictos de migración** - Base limpia sin dependencias cruzadas
2. ✅ **Favoritos no aparecían** - Filtro de ciudad removido de favorites query
3. ✅ **Sugerencias vacías** - Implementado sistema de recomendaciones cercanas
4. ✅ **Errores SQL 42P10** - Queries optimizadas (SELECT DISTINCT + ORDER BY)
5. ✅ **Historial preservado** - 86 migraciones respaldadas en backup

## 📝 Notas Importantes

### ¿Qué NO Incluye la Migración Base?
- ❌ Definiciones de tablas (ya existen en producción)
- ❌ Políticas RLS (ya existen en producción)
- ❌ Índices (ya existen en producción)
- ❌ Datos de ejemplo

### ¿Por Qué Solo Funciones y Triggers?
Las funciones y triggers pueden ser **recreadas sin riesgo**. El esquema base (tablas, columnas, constraints) ya está en producción y es estable.

### ¿Qué Pasa con las 86 Migraciones Remotas?
Están **aplicadas en producción** y funcionando correctamente. La migración base es un snapshot del estado final de todas ellas.

## 🔮 Próximos Pasos

Para futuras migraciones, seguir este patrón:

```sql
-- Migration: YYYYMMDDHHMMSS_descripcion.sql
-- Purpose: [Describir qué hace]
-- 
-- Changes:
-- - [Cambio 1]
-- - [Cambio 2]

-- SQL aquí
```

Siempre usar timestamps únicos: `YYYYMMDDHHMMSS`

## 📞 Soporte

Si tienes dudas sobre migraciones:
1. Revisar este README
2. Consultar backup: `migrations_backup_20251201_100323/`
3. Verificar documentación: `.github/copilot-instructions.md`

---

**Última actualización**: 1 de diciembre de 2025  
**Mantenido por**: TI-Turing Team
