-- =====================================================
-- CATALOG SEED DATA - REFERENCE
-- =====================================================
-- Archivo: 04_catalog_data_reference.sql
-- Fecha: 14 de octubre de 2025
-- Propósito: Archivo de referencia para datos de catálogo
--
-- IMPORTANTE: Este archivo NO debe ejecutarse directamente.
-- Los datos ya están insertados en la base de datos.
-- Este archivo sirve como referencia para:
--   1. Restaurar datos en caso de pérdida
--   2. Inicializar nuevos ambientes (dev, staging)
--   3. Documentar la estructura de datos de catálogo
--
-- Estado actual (14/10/2025):
-- ✅ countries: 249 registros
-- ✅ regions: 33 registros
-- ✅ cities: 1120 registros
-- ✅ genders: 3 registros
-- ✅ document_types: 10 registros
-- ✅ health_insurance: 28 registros
-- =====================================================

-- =====================================================
-- TABLA: genders (3 registros)
-- =====================================================
-- Géneros disponibles en el sistema
-- Ya insertados en la base de datos

/*
INSERT INTO genders (id, name, abbreviation) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Masculino', 'M'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Femenino', 'F'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Otro', 'O')
ON CONFLICT (id) DO NOTHING;
*/

-- =====================================================
-- TABLA: countries (249 registros)
-- =====================================================
-- Lista completa de países del mundo
-- Fuente: Azure Functions - catalogs/Seeds/PaisSeed.cs
-- Ya insertados en la base de datos

-- País principal: Colombia
-- ID: 01b4e9d1-a84e-41c9-8768-253209225a21
-- ISO Code: COL

-- NOTA: Los 249 países están insertados en la BD.
-- Para restaurar desde backup, contactar al equipo de DevOps.

-- =====================================================
-- TABLA: document_types (10 registros)
-- =====================================================
-- Tipos de documento de identificación colombianos
-- Fuente: Azure Functions - catalogs/Seeds/TipoDocumentoSeed.cs
-- Ya insertados en la base de datos

/*
INSERT INTO document_types (id, name, abbreviation, country_id) VALUES
  -- Todos referenciando Colombia: 01b4e9d1-a84e-41c9-8768-253209225a21
  ('uuid-1', 'Cédula de Ciudadanía', 'CC', '01b4e9d1-a84e-41c9-8768-253209225a21'),
  ('uuid-2', 'Tarjeta de Identidad', 'TI', '01b4e9d1-a84e-41c9-8768-253209225a21'),
  ('uuid-3', 'Cédula de Extranjería', 'CE', '01b4e9d1-a84e-41c9-8768-253209225a21'),
  ('uuid-4', 'Pasaporte', 'PA', '01b4e9d1-a84e-41c9-8768-253209225a21'),
  ('uuid-5', 'Registro Civil', 'RC', '01b4e9d1-a84e-41c9-8768-253209225a21'),
  ('uuid-6', 'NIT', 'NIT', '01b4e9d1-a84e-41c9-8768-253209225a21'),
  ('uuid-7', 'PEP', 'PEP', '01b4e9d1-a84e-41c9-8768-253209225a21'),
  ('uuid-8', 'DNI', 'DNI', '01b4e9d1-a84e-41c9-8768-253209225a21'),
  ('uuid-9', 'Salvoconducto', 'SC', '01b4e9d1-a84e-41c9-8768-253209225a21'),
  ('uuid-10', 'Carné Diplomático', 'CD', '01b4e9d1-a84e-41c9-8768-253209225a21')
ON CONFLICT (id) DO NOTHING;
*/

-- =====================================================
-- TABLA: health_insurance (28 registros)
-- =====================================================
-- Entidades Promotoras de Salud (EPS) de Colombia
-- Fuente: Azure Functions - catalogs/Seeds/EpsSeed.cs
-- Ya insertados en la base de datos

-- EPS principales:
--   - SURA
--   - Nueva EPS
--   - Sanitas
--   - Salud Total
--   - Compensar
--   - Famisanar
--   - Coomeva
--   - Aliansalud
--   - Medimás
--   - Y 19 más...

-- NOTA: Los 28 registros están insertados en la BD.
-- Para obtener la lista completa: SELECT * FROM health_insurance ORDER BY name;

-- =====================================================
-- TABLA: regions (33 registros)
-- =====================================================
-- Departamentos de Colombia
-- Fuente: Azure Functions - catalogs/Seeds/RegionSeed.cs
-- Ya insertados en la base de datos

-- Departamentos principales:
/*
  - Antioquia (ID: b2e7a12c-6ac9-4f9e-963e-9b6d3825f962)
  - Cundinamarca (ID: 9a7b77f8-5bff-472d-9b75-d29157068a75)
  - Valle del Cauca (ID: e53ffaa1-60cd-4f3d-a0c8-fa4e5c5c0962)
  - Santander (ID: f00f77a9-4042-49b3-8759-01c4bcba8e03)
  - Bogotá D.C. (ID: 3c0f5c81-cf48-47d6-8cc4-2c5de4c0f4f8)
  - Atlántico
  - Bolívar
  - Boyacá
  - Caldas
  - Caquetá
  - Cauca
  - Cesar
  - Chocó
  - Córdoba
  - Guainía
  - Guaviare
  - Huila
  - La Guajira
  - Magdalena
  - Meta
  - Nariño
  - Norte de Santander
  - Putumayo
  - Quindío
  - Risaralda
  - San Andrés y Providencia
  - Sucre
  - Tolima
  - Vaupés
  - Vichada
  - Amazonas
  - Arauca
  - Casanare
*/

-- Todos los departamentos referencian a Colombia (country_id: 01b4e9d1-a84e-41c9-8768-253209225a21)

-- =====================================================
-- TABLA: cities (1120 registros)
-- =====================================================
-- Ciudades de Colombia organizadas por departamento
-- Fuente: Azure Functions - catalogs/Seeds/CiudadSeed.cs
-- Ya insertados en la base de datos

-- Distribución aproximada por departamento:
--   - Antioquia: 125 ciudades
--   - Boyacá: 123 ciudades
--   - Cundinamarca: 116 ciudades
--   - Santander: 87 ciudades
--   - Nariño: 64 ciudades
--   - Tolima: 47 ciudades
--   - Valle del Cauca: 42 ciudades
--   - Cauca: 42 ciudades
--   - Huila: 37 ciudades
--   - Caldas: 27 ciudades
--   - Y más...

-- Ciudades principales:
--   - Medellín (Antioquia)
--   - Bogotá D.C. (Cundinamarca/Bogotá)
--   - Cali (Valle del Cauca)
--   - Barranquilla (Atlántico)
--   - Cartagena (Bolívar)
--   - Bucaramanga (Santander)
--   - Pereira (Risaralda)
--   - Manizales (Caldas)
--   - Ibagué (Tolima)
--   - Pasto (Nariño)

-- Para obtener todas las ciudades de un departamento:
-- SELECT c.* FROM cities c
-- JOIN regions r ON c.region_id = r.id
-- WHERE r.name = 'Antioquia'
-- ORDER BY c.name;

-- =====================================================
-- INSTRUCCIONES DE RESTAURACIÓN
-- =====================================================

-- OPCIÓN 1: Restaurar desde backup de Supabase
-- 1. Ir a Supabase Dashboard > Database > Backups
-- 2. Seleccionar backup más reciente
-- 3. Restaurar

-- OPCIÓN 2: Re-insertar desde archivos originales (Azure Functions)
-- 1. Clonar repositorio Azure Functions original
-- 2. Ubicar carpeta: catalogs/Seeds/
-- 3. Extraer datos con scripts Python (extract_*.py)
-- 4. Ejecutar SQL en Supabase SQL Editor

-- OPCIÓN 3: Exportar desde BD actual y reimportar
-- 1. Exportar: pg_dump o Supabase CLI
--    npx supabase db dump --data-only --schema public -f catalog_backup.sql
-- 2. Filtrar solo tablas de catálogo:
--    - countries
--    - regions
--    - cities
--    - genders
--    - document_types
--    - health_insurance
-- 3. Reimportar en nuevo ambiente

-- =====================================================
-- QUERIES ÚTILES
-- =====================================================

-- Verificar conteo de todos los catálogos:
/*
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
*/

-- Verificar integridad referencial:
/*
-- Todas las regiones deben tener un country_id válido
SELECT COUNT(*) as regiones_sin_pais
FROM regions r
WHERE NOT EXISTS (SELECT 1 FROM countries c WHERE c.id = r.country_id);

-- Todas las ciudades deben tener un region_id válido
SELECT COUNT(*) as ciudades_sin_region
FROM cities c
WHERE NOT EXISTS (SELECT 1 FROM regions r WHERE r.id = c.region_id);

-- Todos los document_types deben tener un country_id válido
SELECT COUNT(*) as documentos_sin_pais
FROM document_types dt
WHERE NOT EXISTS (SELECT 1 FROM countries c WHERE c.id = dt.country_id);
*/

-- Exportar datos a JSON (para backup):
/*
-- Copiar resultado y guardarlo en archivo JSON
SELECT json_agg(row_to_json(t)) 
FROM (
  SELECT * FROM countries ORDER BY name
) t;

-- Repetir para cada tabla de catálogo
*/

-- =====================================================
-- FIN DE REFERENCIA
-- =====================================================

-- CONTACTO:
-- Para soporte con datos de catálogo, contactar:
--   - DevOps Team
--   - Database Administrator
--   - Backend Lead Developer
