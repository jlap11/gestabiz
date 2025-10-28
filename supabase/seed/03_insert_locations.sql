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

-- 1. Spa Relax María - 3 sedes en diferentes zonas de Bogotá
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
    'Sede Centro - Zona Rosa',
    'Carrera 7 # 123-45, Zona Rosa',
    'Bogotá',
    'Bogotá D.C.',
    'Colombia',
    '110111',
    '+57 1 234 5678',
    4.6097,
    -74.0817,
    true
FROM public.businesses b
WHERE b.name = 'Spa Relax María'

UNION ALL

SELECT 
    b.id,
    'Sede Sur - Chapinero',
    'Carrera 11 # 456-78, Chapinero',
    'Bogotá',
    'Bogotá D.C.',
    'Colombia',
    '110221',
    '+57 1 234 5679',
    4.6243,
    -74.0647,
    true
FROM public.businesses b
WHERE b.name = 'Spa Relax María'

UNION ALL

SELECT 
    b.id,
    'Sede Norte - Usaquén',
    'Carrera 15 # 789-12, Usaquén',
    'Bogotá',
    'Bogotá D.C.',
    'Colombia',
    '110111',
    '+57 1 234 5680',
    4.6951,
    -74.0309,
    true
FROM public.businesses b
WHERE b.name = 'Spa Relax María';


-- 2. Barbería Clásica Carlos - 2 sedes en Medellín
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
    'Sede Centro - El Poblado',
    'Calle 10 # 456-78, El Poblado',
    'Medellín',
    'Antioquia',
    'Colombia',
    '050021',
    '+57 4 345 6789',
    true
FROM public.businesses b
WHERE b.name = 'Barbería Clásica Carlos'

UNION ALL

SELECT 
    b.id,
    'Sede Laureles',
    'Carrera 70 # 789-12, Laureles',
    'Medellín',
    'Antioquia',
    'Colombia',
    '050034',
    '+57 4 345 6790',
    true
FROM public.businesses b
WHERE b.name = 'Barbería Clásica Carlos';


-- 3. Consultorio Médico Ana - 2 sedes en Cali
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
    'Avenida 6 # 789-12, Centro',
    'Cali',
    'Valle del Cauca',
    'Colombia',
    '760001',
    '+57 2 456 7890',
    true
FROM public.businesses b
WHERE b.name = 'Consultorio Médico Ana'

UNION ALL

SELECT 
    b.id,
    'Consultorio Granada',
    'Carrera 9 # 321-54, Granada',
    'Cali',
    'Valle del Cauca',
    'Colombia',
    '760020',
    '+57 2 456 7891',
    true
FROM public.businesses b
WHERE b.name = 'Consultorio Médico Ana';


-- 4. Clínica Dental Luis - 3 sedes en Bucaramanga
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
    'Clínica Centro',
    'Carrera 27 # 321-54, Centro',
    'Bucaramanga',
    'Santander',
    'Colombia',
    '680001',
    '+57 7 567 8901',
    true
FROM public.businesses b
WHERE b.name = 'Clínica Dental Luis'

UNION ALL

SELECT 
    b.id,
    'Clínica Cabecera',
    'Carrera 33 # 567-89, Cabecera',
    'Bucaramanga',
    'Santander',
    'Colombia',
    '680003',
    '+57 7 567 8902',
    true
FROM public.businesses b
WHERE b.name = 'Clínica Dental Luis'

UNION ALL

SELECT 
    b.id,
    'Clínica Floridablanca',
    'Calle 6 # 123-45, Centro',
    'Floridablanca',
    'Santander',
    'Colombia',
    '681001',
    '+57 7 567 8903',
    true
FROM public.businesses b
WHERE b.name = 'Clínica Dental Luis';


-- 5. Estética Sofía Beauty - 2 sedes en Barranquilla
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
    'Sede Centro',
    'Calle 72 # 654-87, Centro',
    'Barranquilla',
    'Atlántico',
    'Colombia',
    '080001',
    '+57 5 678 9012',
    true
FROM public.businesses b
WHERE b.name = 'Estética Sofía Beauty'

UNION ALL

SELECT 
    b.id,
    'Sede Norte',
    'Carrera 51B # 987-21, Riomar',
    'Barranquilla',
    'Atlántico',
    'Colombia',
    '080020',
    '+57 5 678 9013',
    true
FROM public.businesses b
WHERE b.name = 'Estética Sofía Beauty';


-- 6. Veterinaria Diego - 2 sedes en Pereira
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
    'Veterinaria Centro',
    'Carrera 30 # 987-21, Centro',
    'Pereira',
    'Risaralda',
    'Colombia',
    '660001',
    '+57 6 789 0123',
    true
FROM public.businesses b
WHERE b.name = 'Veterinaria Diego'

UNION ALL

SELECT 
    b.id,
    'Veterinaria Cuba',
    'Avenida 30 de Agosto # 147-36, Cuba',
    'Pereira',
    'Risaralda',
    'Colombia',
    '660003',
    '+57 6 789 0124',
    true
FROM public.businesses b
WHERE b.name = 'Veterinaria Diego';


-- 7. Gimnasio Valeria Fit - 3 sedes en Bogotá
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
    'Gimnasio Chapinero',
    'Calle 93 # 147-36, Chapinero',
    'Bogotá',
    'Bogotá D.C.',
    'Colombia',
    '110221',
    '+57 1 890 1234',
    true
FROM public.businesses b
WHERE b.name = 'Gimnasio Valeria Fit'

UNION ALL

SELECT 
    b.id,
    'Gimnasio Zona Rosa',
    'Carrera 13 # 258-69, Zona Rosa',
    'Bogotá',
    'Bogotá D.C.',
    'Colombia',
    '110111',
    '+57 1 890 1235',
    true
FROM public.businesses b
WHERE b.name = 'Gimnasio Valeria Fit'

UNION ALL

SELECT 
    b.id,
    'Gimnasio Suba',
    'Calle 116 # 369-14, Suba',
    'Bogotá',
    'Bogotá D.C.',
    'Colombia',
    '111121',
    '+57 1 890 1236',
    true
FROM public.businesses b
WHERE b.name = 'Gimnasio Valeria Fit';


-- 8. Taller Mecánico Ricardo - 2 sedes en Medellín
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
    'Taller Itagüí',
    'Carrera 65 # 258-69, Centro',
    'Itagüí',
    'Antioquia',
    'Colombia',
    '055010',
    '+57 4 901 2345',
    true
FROM public.businesses b
WHERE b.name = 'Taller Mecánico Ricardo'

UNION ALL

SELECT 
    b.id,
    'Taller Bello',
    'Calle 50 # 741-85, Centro',
    'Bello',
    'Antioquia',
    'Colombia',
    '051001',
    '+57 4 901 2346',
    true
FROM public.businesses b
WHERE b.name = 'Taller Mecánico Ricardo';


-- 9. Salón Camila Style - 2 sedes en Cali
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
    'Salón San Fernando',
    'Avenida 5 # 369-14, San Fernando',
    'Cali',
    'Valle del Cauca',
    'Colombia',
    '760045',
    '+57 2 012 3456',
    true
FROM public.businesses b
WHERE b.name = 'Salón Camila Style'

UNION ALL

SELECT 
    b.id,
    'Salón Ciudad Jardín',
    'Carrera 100 # 123-45, Ciudad Jardín',
    'Cali',
    'Valle del Cauca',
    'Colombia',
    '760031',
    '+57 2 012 3457',
    true
FROM public.businesses b
WHERE b.name = 'Salón Camila Style';


-- 10. Estudio Fotográfico Fernando - 2 sedes en Bogotá
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
    'Estudio La Candelaria',
    'Carrera 11 # 741-85, La Candelaria',
    'Bogotá',
    'Bogotá D.C.',
    'Colombia',
    '110311',
    '+57 1 123 4567',
    true
FROM public.businesses b
WHERE b.name = 'Estudio Fotográfico Fernando'

UNION ALL

SELECT 
    b.id,
    'Estudio Zona T',
    'Carrera 14 # 456-78, Zona T',
    'Bogotá',
    'Bogotá D.C.',
    'Colombia',
    '110111',
    '+57 1 123 4568',
    true
FROM public.businesses b
WHERE b.name = 'Estudio Fotográfico Fernando';