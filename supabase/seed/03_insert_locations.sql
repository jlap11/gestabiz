-- ============================================================================
-- SCRIPT: INSERTAR SEDES A NEGOCIOS EXISTENTES
-- ============================================================================
-- Descripción: Crea múltiples sedes para los negocios ya existentes en la BD
-- Fecha: 7 de octubre de 2025
-- Uso: Ejecutar este script en Supabase SQL Editor o con npx supabase db execute
-- ============================================================================

-- IMPORTANTE: Este script usa nombres de negocios. Si los nombres cambiaron,
-- ajusta las condiciones WHERE o usa los IDs directamente.

-- ============================================================================
-- OPCIÓN 1: INSERTAR SEDES USANDO NOMBRES DE NEGOCIOS (Recomendado)
-- ============================================================================

-- 1. Spa Relax María - 3 sedes en diferentes zonas de CDMX
INSERT INTO public.locations (
    business_id,
    name,
    address,
    city,
    state,
    country,
    postal_code,
    phone,
    latitude,
    longitude,
    is_active
)
SELECT 
    b.id,
    'Sede Centro - Reforma',
    'Av. Reforma 123, Col. Cuauhtémoc',
    'Ciudad de México',
    'CDMX',
    'México',
    '06500',
    '+52 55 1234 5678',
    19.4326,
    -99.1332,
    true
FROM public.businesses b
WHERE b.name = 'Spa Relax María'

UNION ALL

SELECT 
    b.id,
    'Sede Sur - Coyoacán',
    'Av. Universidad 456, Col. Copilco',
    'Ciudad de México',
    'CDMX',
    'México',
    '04360',
    '+52 55 1234 5679',
    19.3375,
    -99.1769,
    true
FROM public.businesses b
WHERE b.name = 'Spa Relax María'

UNION ALL

SELECT 
    b.id,
    'Sede Norte - Polanco',
    'Av. Presidente Masaryk 789, Col. Polanco',
    'Ciudad de México',
    'CDMX',
    'México',
    '11560',
    '+52 55 1234 5680',
    19.4343,
    -99.1953,
    true
FROM public.businesses b
WHERE b.name = 'Spa Relax María';


-- 2. Barbería Clásica Carlos - 2 sedes en Guadalajara
INSERT INTO public.locations (
    business_id,
    name,
    address,
    city,
    state,
    country,
    postal_code,
    phone,
    is_active
)
SELECT 
    b.id,
    'Sede Centro - Chapultepec',
    'Calle Juárez 456, Col. Centro',
    'Guadalajara',
    'Jalisco',
    'México',
    '44100',
    '+52 33 2345 6789',
    true
FROM public.businesses b
WHERE b.name = 'Barbería Clásica Carlos'

UNION ALL

SELECT 
    b.id,
    'Sede Zapopan',
    'Av. Patria 789, Col. Jardines',
    'Zapopan',
    'Jalisco',
    'México',
    '45040',
    '+52 33 2345 6790',
    true
FROM public.businesses b
WHERE b.name = 'Barbería Clásica Carlos';


-- 3. Consultorio Médico Ana - 2 sedes en Monterrey
INSERT INTO public.locations (
    business_id,
    name,
    address,
    city,
    state,
    country,
    postal_code,
    phone,
    is_active
)
SELECT 
    b.id,
    'Consultorio Centro',
    'Blvd. Constitución 789, Col. Centro',
    'Monterrey',
    'Nuevo León',
    'México',
    '64000',
    '+52 81 3456 7890',
    true
FROM public.businesses b
WHERE b.name = 'Consultorio Médico Ana'

UNION ALL

SELECT 
    b.id,
    'Consultorio San Pedro',
    'Av. Vasconcelos 321, Col. Del Valle',
    'San Pedro Garza García',
    'Nuevo León',
    'México',
    '66220',
    '+52 81 3456 7891',
    true
FROM public.businesses b
WHERE b.name = 'Consultorio Médico Ana';


-- 4. Clínica Dental Luis - 3 sedes
INSERT INTO public.locations (
    business_id,
    name,
    address,
    city,
    state,
    country,
    postal_code,
    phone,
    is_active
)
SELECT 
    b.id,
    'Clínica Insurgentes',
    'Insurgentes Sur 321, Col. Nápoles',
    'Ciudad de México',
    'CDMX',
    'México',
    '03810',
    '+52 55 4567 8901',
    true
FROM public.businesses b
WHERE b.name = 'Clínica Dental Luis'

UNION ALL

SELECT 
    b.id,
    'Clínica Santa Fe',
    'Av. Santa Fe 567, Col. Santa Fe',
    'Ciudad de México',
    'CDMX',
    'México',
    '01219',
    '+52 55 4567 8902',
    true
FROM public.businesses b
WHERE b.name = 'Clínica Dental Luis'

UNION ALL

SELECT 
    b.id,
    'Clínica Del Valle',
    'Av. División del Norte 890, Col. Del Valle',
    'Ciudad de México',
    'CDMX',
    'México',
    '03100',
    '+52 55 4567 8903',
    true
FROM public.businesses b
WHERE b.name = 'Clínica Dental Luis';


-- 5. Estética Sofía Beauty - 2 sedes
INSERT INTO public.locations (
    business_id,
    name,
    address,
    city,
    state,
    country,
    postal_code,
    phone,
    is_active
)
SELECT 
    b.id,
    'Sede Chapultepec',
    'Av. Chapultepec 654, Col. Americana',
    'Guadalajara',
    'Jalisco',
    'México',
    '44160',
    '+52 33 5678 9012',
    true
FROM public.businesses b
WHERE b.name = 'Estética Sofía Beauty'

UNION ALL

SELECT 
    b.id,
    'Sede Providencia',
    'Av. Providencia 234, Col. Providencia',
    'Guadalajara',
    'Jalisco',
    'México',
    '44630',
    '+52 33 5678 9013',
    true
FROM public.businesses b
WHERE b.name = 'Estética Sofía Beauty';


-- 6. Veterinaria Diego - 2 sedes
INSERT INTO public.locations (
    business_id,
    name,
    address,
    city,
    state,
    country,
    postal_code,
    phone,
    is_active
)
SELECT 
    b.id,
    'Veterinaria Universidad',
    'Av. Universidad 987, Col. Mitras Centro',
    'Monterrey',
    'Nuevo León',
    'México',
    '64460',
    '+52 81 6789 0123',
    true
FROM public.businesses b
WHERE b.name = 'Veterinaria Diego'

UNION ALL

SELECT 
    b.id,
    'Veterinaria Contry',
    'Av. Eugenio Garza Sada 456, Col. Contry',
    'Monterrey',
    'Nuevo León',
    'México',
    '64860',
    '+52 81 6789 0124',
    true
FROM public.businesses b
WHERE b.name = 'Veterinaria Diego';


-- 7. Gimnasio Valeria Fit - 3 sedes
INSERT INTO public.locations (
    business_id,
    name,
    address,
    city,
    state,
    country,
    postal_code,
    phone,
    is_active
)
SELECT 
    b.id,
    'Gimnasio Polanco',
    'Av. Horacio 147, Col. Polanco',
    'Ciudad de México',
    'CDMX',
    'México',
    '11550',
    '+52 55 7890 1234',
    true
FROM public.businesses b
WHERE b.name = 'Gimnasio Valeria Fit'

UNION ALL

SELECT 
    b.id,
    'Gimnasio Roma',
    'Calle Orizaba 567, Col. Roma Norte',
    'Ciudad de México',
    'CDMX',
    'México',
    '06700',
    '+52 55 7890 1235',
    true
FROM public.businesses b
WHERE b.name = 'Gimnasio Valeria Fit'

UNION ALL

SELECT 
    b.id,
    'Gimnasio Condesa',
    'Av. Amsterdam 789, Col. Condesa',
    'Ciudad de México',
    'CDMX',
    'México',
    '06140',
    '+52 55 7890 1236',
    true
FROM public.businesses b
WHERE b.name = 'Gimnasio Valeria Fit';


-- 8. Taller Mecánico Ricardo - 2 sedes
INSERT INTO public.locations (
    business_id,
    name,
    address,
    city,
    state,
    country,
    postal_code,
    phone,
    is_active
)
SELECT 
    b.id,
    'Taller Industrial',
    'Calle Industrial 258, Col. Industrial',
    'Guadalajara',
    'Jalisco',
    'México',
    '44940',
    '+52 33 8901 2345',
    true
FROM public.businesses b
WHERE b.name = 'Taller Mecánico Ricardo'

UNION ALL

SELECT 
    b.id,
    'Taller Tlaquepaque',
    'Av. Revolución 890, Col. Centro',
    'Tlaquepaque',
    'Jalisco',
    'México',
    '45500',
    '+52 33 8901 2346',
    true
FROM public.businesses b
WHERE b.name = 'Taller Mecánico Ricardo';


-- 9. Salón Camila Style - 2 sedes
INSERT INTO public.locations (
    business_id,
    name,
    address,
    city,
    state,
    country,
    postal_code,
    phone,
    is_active
)
SELECT 
    b.id,
    'Salón Centro',
    'Calle Hidalgo 369, Col. Centro',
    'Monterrey',
    'Nuevo León',
    'México',
    '64000',
    '+52 81 9012 3456',
    true
FROM public.businesses b
WHERE b.name = 'Salón Camila Style'

UNION ALL

SELECT 
    b.id,
    'Salón Linda Vista',
    'Av. Lincoln 567, Col. Linda Vista',
    'Monterrey',
    'Nuevo León',
    'México',
    '64750',
    '+52 81 9012 3457',
    true
FROM public.businesses b
WHERE b.name = 'Salón Camila Style';


-- 10. Estudio Fotográfico Fernando - 2 sedes
INSERT INTO public.locations (
    business_id,
    name,
    address,
    city,
    state,
    country,
    postal_code,
    phone,
    is_active
)
SELECT 
    b.id,
    'Estudio Roma Norte',
    'Calle Jalapa 741, Col. Roma Norte',
    'Ciudad de México',
    'CDMX',
    'México',
    '06700',
    '+52 55 0123 4567',
    true
FROM public.businesses b
WHERE b.name = 'Estudio Fotográfico Fernando'

UNION ALL

SELECT 
    b.id,
    'Estudio Coyoacán',
    'Av. México 234, Col. Coyoacán',
    'Ciudad de México',
    'CDMX',
    'México',
    '04100',
    '+52 55 0123 4568',
    true
FROM public.businesses b
WHERE b.name = 'Estudio Fotográfico Fernando';


-- ============================================================================
-- OPCIÓN 2: INSERTAR SEDES USANDO IDs DIRECTOS (Si conoces los IDs)
-- ============================================================================
-- Descomenta y reemplaza 'BUSINESS_ID_AQUI' con el UUID real del negocio

/*
INSERT INTO public.locations (
    business_id,
    name,
    address,
    city,
    state,
    country,
    postal_code,
    phone,
    latitude,
    longitude,
    is_active
) VALUES
(
    'BUSINESS_ID_AQUI',  -- UUID del negocio
    'Sede Principal',
    'Dirección completa aquí',
    'Ciudad',
    'Estado',
    'País',
    'Código Postal',
    '+52 XX XXXX XXXX',
    19.4326,  -- Latitud (opcional)
    -99.1332, -- Longitud (opcional)
    true
),
(
    'BUSINESS_ID_AQUI',  -- Mismo UUID para otra sede del mismo negocio
    'Sede Norte',
    'Otra dirección',
    'Ciudad',
    'Estado',
    'País',
    'CP',
    '+52 XX XXXX XXXX',
    NULL,  -- Sin coordenadas
    NULL,
    true
);
*/


-- ============================================================================
-- VERIFICACIÓN: Consultar sedes creadas por negocio
-- ============================================================================

SELECT 
    b.name AS negocio,
    COUNT(l.id) AS total_sedes,
    STRING_AGG(l.name, ', ' ORDER BY l.name) AS nombres_sedes
FROM public.businesses b
LEFT JOIN public.locations l ON l.business_id = b.id
GROUP BY b.id, b.name
ORDER BY b.name;


-- ============================================================================
-- VERIFICACIÓN DETALLADA: Ver todas las sedes con sus datos
-- ============================================================================

SELECT 
    b.name AS negocio,
    l.name AS sede,
    l.address,
    l.city,
    l.state,
    l.phone,
    l.is_active,
    l.created_at
FROM public.businesses b
INNER JOIN public.locations l ON l.business_id = b.id
ORDER BY b.name, l.name;


-- ============================================================================
-- LIMPIEZA: Eliminar todas las sedes (CUIDADO!)
-- ============================================================================
-- Descomenta solo si necesitas empezar de cero

-- DELETE FROM public.locations;


-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. El script usa UNION ALL para insertar múltiples registros en una sola transacción
-- 2. Las coordenadas (latitude, longitude) son opcionales pero útiles para mapas
-- 3. Cada negocio tiene entre 2 y 3 sedes de ejemplo
-- 4. Los teléfonos son secuenciales (+1 al final) para diferenciarlos
-- 5. Todas las sedes se crean como activas (is_active = true)
-- 6. Si un negocio no existe, esa parte del INSERT no insertará nada (JOIN vacío)
-- 7. Para agregar más sedes, copia el patrón UNION ALL SELECT...

-- ============================================================================
-- RESUMEN DE SEDES CREADAS:
-- ============================================================================
-- Spa Relax María: 3 sedes (Centro, Sur, Norte)
-- Barbería Clásica Carlos: 2 sedes (Centro, Zapopan)
-- Consultorio Médico Ana: 2 sedes (Centro, San Pedro)
-- Clínica Dental Luis: 3 sedes (Insurgentes, Santa Fe, Del Valle)
-- Estética Sofía Beauty: 2 sedes (Chapultepec, Providencia)
-- Veterinaria Diego: 2 sedes (Universidad, Contry)
-- Gimnasio Valeria Fit: 3 sedes (Polanco, Roma, Condesa)
-- Taller Mecánico Ricardo: 2 sedes (Industrial, Tlaquepaque)
-- Salón Camila Style: 2 sedes (Centro, Linda Vista)
-- Estudio Fotográfico Fernando: 2 sedes (Roma Norte, Coyoacán)
-- ============================================================================
-- TOTAL: 23 sedes distribuidas en 10 negocios
-- ============================================================================
