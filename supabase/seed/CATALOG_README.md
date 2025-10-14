# Catalog Seed Data - README

## 📋 Resumen

Este documento describe los datos de catálogo insertados en la base de datos de AppointSync Pro. Los catálogos fueron migrados desde Azure Functions preservando los GUIDs originales para mantener integridad referencial.

## ✅ Estado Actual (14 de octubre de 2025)

| Tabla | Registros | Estado | Descripción |
|-------|-----------|--------|-------------|
| `countries` | 249 | ✅ Insertado | Países del mundo |
| `regions` | 33 | ✅ Insertado | Departamentos de Colombia |
| `cities` | 1120 | ✅ Insertado | Ciudades de Colombia |
| `genders` | 3 | ✅ Insertado | Masculino, Femenino, Otro |
| `document_types` | 10 | ✅ Insertado | CC, TI, CE, PA, RC, NIT, PEP, DNI, SC, CD |
| `health_insurance` | 28 | ✅ Insertado | EPS colombianas |

**Total: 1,443 registros de catálogo**

## 📂 Archivos de Referencia

### Migración
- **Archivo**: `supabase/migrations/20251014120000_catalog_data_documentation.sql`
- **Propósito**: Documenta los datos de catálogo en el historial de migraciones
- **Contenido**: 
  - Verificación de conteo de registros
  - Comentarios en tablas
  - Queries de ejemplo
  - Resumen de estructura

### Seed Reference
- **Archivo**: `supabase/seed/04_catalog_data_reference.sql`
- **Propósito**: Referencia para restauración y nuevos ambientes
- **Contenido**:
  - Estructura de datos
  - IDs principales (UUIDs)
  - Instrucciones de restauración
  - Queries útiles

## 🔑 IDs Importantes

### País Principal: Colombia
```
ID: 01b4e9d1-a84e-41c9-8768-253209225a21
ISO Code: COL
```

### Departamentos Principales

| Departamento | UUID |
|--------------|------|
| Antioquia | `b2e7a12c-6ac9-4f9e-963e-9b6d3825f962` |
| Cundinamarca | `9a7b77f8-5bff-472d-9b75-d29157068a75` |
| Valle del Cauca | `e53ffaa1-60cd-4f3d-a0c8-fa4e5c5c0962` |
| Santander | `f00f77a9-4042-49b3-8759-01c4bcba8e03` |
| Bogotá D.C. | `3c0f5c81-cf48-47d6-8cc4-2c5de4c0f4f8` |

## 🔄 Origen de los Datos

**Fuente**: Azure Functions - Proyecto de backend anterior  
**Ubicación**: `catalogs/Seeds/`
- `PaisSeed.cs` → countries
- `RegionSeed.cs` → regions
- `CiudadSeed.cs` → cities
- `GeneroSeed.cs` → genders
- `TipoDocumentoSeed.cs` → document_types
- `EpsSeed.cs` → health_insurance

**Método de Extracción**: Scripts Python con regex parsing  
**Preservación**: Todos los UUIDs originales mantenidos

## 📊 Queries Útiles

### Verificar Conteo de Catálogos
```sql
SELECT 
  'countries' as table_name, COUNT(*) as total FROM countries
UNION ALL
SELECT 'regions', COUNT(*) FROM regions
UNION ALL
SELECT 'cities', COUNT(*) FROM cities
UNION ALL
SELECT 'genders', COUNT(*) FROM genders
UNION ALL
SELECT 'document_types', COUNT(*) FROM document_types
UNION ALL
SELECT 'health_insurance', COUNT(*) FROM health_insurance
ORDER BY table_name;
```

### Obtener Ciudades por Departamento
```sql
SELECT c.name as ciudad, r.name as departamento
FROM cities c
JOIN regions r ON c.region_id = r.id
WHERE r.name = 'Antioquia'
ORDER BY c.name;
```

### Contar Ciudades por Departamento
```sql
SELECT r.name as departamento, COUNT(c.id) as total_ciudades
FROM regions r
LEFT JOIN cities c ON r.id = c.region_id
GROUP BY r.name
ORDER BY total_ciudades DESC;
```

### Verificar Integridad Referencial
```sql
-- Regiones sin país (debe ser 0)
SELECT COUNT(*) as regiones_sin_pais
FROM regions r
WHERE NOT EXISTS (SELECT 1 FROM countries c WHERE c.id = r.country_id);

-- Ciudades sin región (debe ser 0)
SELECT COUNT(*) as ciudades_sin_region
FROM cities c
WHERE NOT EXISTS (SELECT 1 FROM regions r WHERE r.id = c.region_id);
```

## 🔧 Instrucciones de Restauración

### Opción 1: Backup de Supabase (Recomendado)
1. Ir a Supabase Dashboard
2. Database > Backups
3. Seleccionar backup más reciente
4. Restaurar

### Opción 2: Export/Import
```bash
# Exportar (desde ambiente existente)
npx supabase db dump \
  --data-only \
  --schema public \
  --table countries,regions,cities,genders,document_types,health_insurance \
  -f catalog_backup.sql

# Importar (en nuevo ambiente)
npx supabase db reset
psql -h your-db-host -U postgres -d postgres -f catalog_backup.sql
```

### Opción 3: Re-extracción desde Azure Functions
1. Clonar repositorio Azure Functions
2. Ejecutar scripts de extracción Python
3. Ejecutar SQL en Supabase SQL Editor

## ⚠️ Notas Importantes

1. **NO modificar UUIDs**: Los IDs son referencias en todo el sistema
2. **Encoding UTF-8**: Los nombres de ciudades incluyen tildes y eñes
3. **Integridad Referencial**: 
   - `regions.country_id` → `countries.id`
   - `cities.region_id` → `regions.id`
   - `document_types.country_id` → `countries.id`
4. **Datos Estáticos**: Estos catálogos no cambian frecuentemente
5. **Migraciones**: La migración documenta pero NO inserta datos (ya existen)

## 📝 Histórico de Cambios

| Fecha | Evento | Descripción |
|-------|--------|-------------|
| 2025-10-14 | Migración Inicial | 1,443 registros insertados manualmente desde Azure Functions |
| 2025-10-14 | Documentación | Creada migración y seed reference |

## 🆘 Soporte

Para problemas con datos de catálogo contactar:
- **DevOps Team** - Backups y restauración
- **Database Administrator** - Integridad de datos
- **Backend Lead** - Lógica de negocio

## 📚 Referencias

- Migración: `supabase/migrations/20251014120000_catalog_data_documentation.sql`
- Seed Reference: `supabase/seed/04_catalog_data_reference.sql`
- Repositorio Azure Functions: [enlace al repo]
- Documentación Supabase: https://supabase.com/docs
