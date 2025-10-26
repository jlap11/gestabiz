-- =====================================================
-- CATALOG DATA DOCUMENTATION
-- =====================================================
-- Migración: 20251014120000_catalog_data_documentation.sql
-- Fecha: 14 de octubre de 2025
-- Descripción: Documentación de datos de catálogo insertados manualmente
--
-- IMPORTANTE: Esta migración NO inserta datos, solo documenta.
-- Los datos de catálogo fueron insertados manualmente desde Azure Functions
-- preservando los GUIDs originales para mantener integridad referencial.
--
-- Estado actual de catálogos:
-- - countries: 249 registros (países del mundo)
-- - regions: 33 registros (departamentos de Colombia)
-- - cities: 1120 registros (ciudades de Colombia)
-- - genders: 3 registros (Masculino, Femenino, Otro)
-- - document_types: 10 registros (CC, TI, CE, PA, RC, NIT, PEP, DNI, SC, CD)
-- - health_insurance: 28 registros (EPS colombianas)
--
-- Fuente original: Azure Functions - catalogs/Seeds/
-- =====================================================

-- Verificación de datos de catálogo
DO $$
DECLARE
  v_countries_count INTEGER;
  v_regions_count INTEGER;
  v_cities_count INTEGER;
  v_genders_count INTEGER;
  v_document_types_count INTEGER;
  v_health_insurance_count INTEGER;
BEGIN
  -- Contar registros en cada tabla de catálogo
  SELECT COUNT(*) INTO v_countries_count FROM countries;
  SELECT COUNT(*) INTO v_regions_count FROM regions;
  SELECT COUNT(*) INTO v_cities_count FROM cities;
  SELECT COUNT(*) INTO v_genders_count FROM genders;
  SELECT COUNT(*) INTO v_document_types_count FROM document_types;
  SELECT COUNT(*) INTO v_health_insurance_count FROM health_insurance;

  -- Log de verificación
  RAISE NOTICE 'Verificación de catálogos:';
  RAISE NOTICE '  - countries: % registros', v_countries_count;
  RAISE NOTICE '  - regions: % registros', v_regions_count;
  RAISE NOTICE '  - cities: % registros', v_cities_count;
  RAISE NOTICE '  - genders: % registros', v_genders_count;
  RAISE NOTICE '  - document_types: % registros', v_document_types_count;
  RAISE NOTICE '  - health_insurance: % registros', v_health_insurance_count;

  -- Validar que los datos existen
  IF v_countries_count = 0 OR v_regions_count = 0 OR v_cities_count = 0 THEN
    RAISE WARNING 'ADVERTENCIA: Algunos catálogos están vacíos. Se requiere seed manual.';
  ELSE
    RAISE NOTICE 'OK: Todos los catálogos contienen datos.';
  END IF;
END $$;

-- =====================================================
-- RESUMEN DE DATOS DE CATÁLOGO
-- =====================================================

-- COUNTRIES (249 registros)
-- Países del mundo con sus códigos ISO
-- Campos: id (uuid), name (varchar), iso_code (varchar(3))
-- Ejemplo: Colombia (01b4e9d1-a84e-41c9-8768-253209225a21, 'COL')

-- REGIONS (33 registros)
-- Departamentos de Colombia
-- Campos: id (uuid), name (varchar), country_id (uuid -> countries.id)
-- Ejemplos:
--   - Antioquia (b2e7a12c-6ac9-4f9e-963e-9b6d3825f962)
--   - Cundinamarca (9a7b77f8-5bff-472d-9b75-d29157068a75)
--   - Valle del Cauca (e53ffaa1-60cd-4f3d-a0c8-fa4e5c5c0962)
--   - Santander (f00f77a9-4042-49b3-8759-01c4bcba8e03)
--   - Bogotá D.C. (3c0f5c81-cf48-47d6-8cc4-2c5de4c0f4f8)

-- CITIES (1120 registros)
-- Ciudades de Colombia organizadas por departamento
-- Campos: id (uuid), name (varchar), region_id (uuid -> regions.id)
-- Ejemplos por departamento:
--   Antioquia: Medellín, Envigado, Bello, Itagüí, Sabaneta...
--   Cundinamarca: Bogotá, Soacha, Zipaquirá, Facatativá, Chía...
--   Valle: Cali, Buenaventura, Palmira, Tuluá, Cartago...
--   Santander: Bucaramanga, Floridablanca, Girón, Piedecuesta...

-- GENDERS (3 registros)
-- Géneros para perfiles de usuario
-- Campos: id (uuid), name (varchar), abbreviation (varchar(1))
-- Registros:
--   1. Masculino (M)
--   2. Femenino (F)
--   3. Otro (O)

-- DOCUMENT_TYPES (10 registros)
-- Tipos de documento de identificación colombianos
-- Campos: id (uuid), name (varchar), abbreviation (varchar(10)), country_id (uuid)
-- Registros para Colombia:
--   1. Cédula de Ciudadanía (CC)
--   2. Tarjeta de Identidad (TI)
--   3. Cédula de Extranjería (CE)
--   4. Pasaporte (PA)
--   5. Registro Civil (RC)
--   6. NIT (NIT)
--   7. PEP (PEP)
--   8. DNI (DNI)
--   9. Salvoconducto (SC)
--   10. Carné Diplomático (CD)

-- HEALTH_INSURANCE (28 registros)
-- Entidades Promotoras de Salud (EPS) de Colombia
-- Campos: id (uuid), name (varchar), abbreviation (varchar(50))
-- Ejemplos:
--   - SURA
--   - Nueva EPS
--   - Sanitas
--   - Salud Total
--   - Compensar
--   - Famisanar
--   - Coomeva
--   - Aliansalud
--   - Medimás
--   (y 19 más...)

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Todos los IDs (UUIDs) son los originales de Azure Functions
-- 2. La relación regions -> countries está basada en Colombia (country_id: 01b4e9d1-a84e-41c9-8768-253209225a21)
-- 3. La relación cities -> regions mantiene la estructura departamental de Colombia
-- 4. Los nombres de ciudades pueden contener caracteres UTF-8 (tildes, eñes, etc.)
-- 5. Estos datos son estáticos y no deberían modificarse frecuentemente
-- 6. Para agregar nuevos países/regiones/ciudades, mantener el formato UUID existente

-- =====================================================
-- QUERIES DE EJEMPLO
-- =====================================================

-- Obtener todas las regiones de Colombia:
-- SELECT * FROM regions WHERE country_id = '01b4e9d1-a84e-41c9-8768-253209225a21';

-- Obtener todas las ciudades de Antioquia:
-- SELECT c.* FROM cities c
-- JOIN regions r ON c.region_id = r.id
-- WHERE r.name = 'Antioquia';

-- Obtener ciudades con su departamento:
-- SELECT c.name as ciudad, r.name as departamento
-- FROM cities c
-- JOIN regions r ON c.region_id = r.id
-- ORDER BY r.name, c.name;

-- Contar ciudades por departamento:
-- SELECT r.name as departamento, COUNT(c.id) as total_ciudades
-- FROM regions r
-- LEFT JOIN cities c ON r.id = c.region_id
-- GROUP BY r.name
-- ORDER BY total_ciudades DESC;

-- =====================================================
-- FIN DE DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE countries IS 'Catálogo de países del mundo (249 registros). Datos insertados manualmente desde Azure Functions.';
COMMENT ON TABLE regions IS 'Catálogo de departamentos de Colombia (33 registros). Datos insertados manualmente desde Azure Functions.';
COMMENT ON TABLE cities IS 'Catálogo de ciudades de Colombia (1120 registros). Datos insertados manualmente desde Azure Functions.';
COMMENT ON TABLE genders IS 'Catálogo de géneros (3 registros: Masculino, Femenino, Otro). Datos insertados manualmente.';
COMMENT ON TABLE document_types IS 'Catálogo de tipos de documento colombianos (10 registros). Datos insertados manualmente desde Azure Functions.';
COMMENT ON TABLE health_insurance IS 'Catálogo de EPS colombianas (28 registros). Datos insertados manualmente desde Azure Functions.';
