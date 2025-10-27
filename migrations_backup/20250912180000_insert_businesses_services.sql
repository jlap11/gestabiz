-- =============================================================================
-- MIGRACIÓN: INSERTAR DATOS DE EJEMPLO (SIN PROFILES)
-- Solo negocios y servicios (sin usuarios para evitar constraint issues)
-- =============================================================================

-- Eliminar datos de ejemplo existentes
DELETE FROM public.services WHERE business_id IN (
  SELECT id FROM public.businesses WHERE name LIKE '%example%' OR email LIKE '%example.com'
);

DELETE FROM public.businesses WHERE name LIKE '%example%' OR email LIKE '%example.com';

-- Insertar NEGOCIOS (10 negocios usando IDs generados)
DO $$
DECLARE
    owner_uuid UUID;
    business_uuid UUID;
BEGIN
    -- Verificar si hay algún usuario existente que podamos usar como owner
    SELECT id INTO owner_uuid FROM public.profiles LIMIT 1;
    
    -- Si no hay usuarios, usar un UUID placeholder que no se validará por foreign key
    IF owner_uuid IS NULL THEN
        owner_uuid := '00000000-0000-4000-8000-000000000000';
    END IF;

    -- Insertar negocios
    INSERT INTO public.businesses (id, name, description, owner_id, phone, email, address, city, state, country, is_active, created_at) VALUES 
    
    (uuid_generate_v4(), 'Spa Relax María', 'Centro de relajación y belleza con servicios integrales', owner_uuid, '+52 55 1234 5678', 'info@sparelax.example.com', 'Av. Reforma 123', 'Ciudad de México', 'CDMX', 'México', true, NOW()),
    (uuid_generate_v4(), 'Barbería Clásica Carlos', 'Cortes tradicionales y modernos para caballeros', owner_uuid, '+52 33 2345 6789', 'contacto@barberiacarlos.example.com', 'Calle Juárez 456', 'Guadalajara', 'Jalisco', 'México', true, NOW()),
    (uuid_generate_v4(), 'Consultorio Médico Ana', 'Consulta médica general y especializada', owner_uuid, '+52 81 3456 7890', 'citas@consultorioana.example.com', 'Blvd. Constitución 789', 'Monterrey', 'Nuevo León', 'México', true, NOW()),
    (uuid_generate_v4(), 'Clínica Dental Luis', 'Servicios odontológicos completos', owner_uuid, '+52 55 4567 8901', 'info@clinicaluis.example.com', 'Insurgentes Sur 321', 'Ciudad de México', 'CDMX', 'México', true, NOW()),
    (uuid_generate_v4(), 'Estética Sofía Beauty', 'Tratamientos faciales y corporales', owner_uuid, '+52 33 5678 9012', 'hola@sofiabeauty.example.com', 'Av. Chapultepec 654', 'Guadalajara', 'Jalisco', 'México', true, NOW()),
    (uuid_generate_v4(), 'Veterinaria Diego', 'Cuidado integral para mascotas', owner_uuid, '+52 81 6789 0123', 'citas@vetdiego.example.com', 'Av. Universidad 987', 'Monterrey', 'Nuevo León', 'México', true, NOW()),
    (uuid_generate_v4(), 'Gimnasio Valeria Fit', 'Entrenamiento personalizado y clases grupales', owner_uuid, '+52 55 7890 1234', 'info@valeriafit.example.com', 'Polanco 147', 'Ciudad de México', 'CDMX', 'México', true, NOW()),
    (uuid_generate_v4(), 'Taller Mecánico Ricardo', 'Reparación y mantenimiento automotriz', owner_uuid, '+52 33 8901 2345', 'servicio@tallerricardo.example.com', 'Industrial 258', 'Guadalajara', 'Jalisco', 'México', true, NOW()),
    (uuid_generate_v4(), 'Salón Camila Style', 'Peinados y tratamientos capilares', owner_uuid, '+52 81 9012 3456', 'contacto@camilastyle.example.com', 'Centro 369', 'Monterrey', 'Nuevo León', 'México', true, NOW()),
    (uuid_generate_v4(), 'Estudio Fotográfico Fernando', 'Fotografía profesional y eventos', owner_uuid, '+52 55 0123 4567', 'info@estudiofernando.example.com', 'Roma Norte 741', 'Ciudad de México', 'CDMX', 'México', true, NOW())
    
    ON CONFLICT (id) DO NOTHING;

END $$;

-- Crear servicios para cada negocio
DO $$
DECLARE
    business_record RECORD;
BEGIN
    -- Insertar servicios para cada negocio
    FOR business_record IN SELECT id, name FROM public.businesses WHERE email LIKE '%.example.com' LOOP
        CASE business_record.name
            WHEN 'Spa Relax María' THEN
                INSERT INTO public.services (business_id, name, description, duration_minutes, price, currency, category, is_active) VALUES 
                (business_record.id, 'Masaje Relajante', 'Masaje completo de relajación muscular', 60, 800.00, 'COP', 'Masajes', true),
                (business_record.id, 'Facial Hidratante', 'Tratamiento facial con hidratación profunda', 45, 650.00, 'COP', 'Faciales', true),
                (business_record.id, 'Manicure Completo', 'Cuidado completo de uñas de manos', 30, 350.00, 'COP', 'Uñas', true);

            WHEN 'Barbería Clásica Carlos' THEN
                INSERT INTO public.services (business_id, name, description, duration_minutes, price, currency, category, is_active) VALUES 
                (business_record.id, 'Corte Tradicional', 'Corte de cabello clásico para caballero', 30, 180.00, 'COP', 'Cortes', true),
                (business_record.id, 'Afeitado Navaja', 'Afeitado tradicional con navaja', 20, 150.00, 'COP', 'Afeitado', true),
                (business_record.id, 'Corte + Barba', 'Paquete corte y arreglo de barba', 45, 280.00, 'COP', 'Paquetes', true);

            WHEN 'Consultorio Médico Ana' THEN
                INSERT INTO public.services (business_id, name, description, duration_minutes, price, currency, category, is_active) VALUES 
                (business_record.id, 'Consulta General', 'Consulta médica general', 30, 500.00, 'COP', 'Consultas', true),
                (business_record.id, 'Chequeo Preventivo', 'Examen médico preventivo completo', 60, 800.00, 'COP', 'Prevención', true);

            WHEN 'Clínica Dental Luis' THEN
                INSERT INTO public.services (business_id, name, description, duration_minutes, price, currency, category, is_active) VALUES 
                (business_record.id, 'Limpieza Dental', 'Profilaxis y limpieza dental', 45, 600.00, 'COP', 'Limpieza', true),
                (business_record.id, 'Consulta Odontológica', 'Revisión dental general', 30, 400.00, 'COP', 'Consultas', true),
                (business_record.id, 'Blanqueamiento', 'Blanqueamiento dental profesional', 90, 2500.00, 'COP', 'Estética', true);

            WHEN 'Estética Sofía Beauty' THEN
                INSERT INTO public.services (business_id, name, description, duration_minutes, price, currency, category, is_active) VALUES 
                (business_record.id, 'Facial Anti-edad', 'Tratamiento facial antienvejecimiento', 60, 900.00, 'COP', 'Faciales', true),
                (business_record.id, 'Depilación Láser', 'Sesión de depilación láser', 30, 750.00, 'COP', 'Depilación', true);

            WHEN 'Veterinaria Diego' THEN
                INSERT INTO public.services (business_id, name, description, duration_minutes, price, currency, category, is_active) VALUES 
                (business_record.id, 'Consulta Veterinaria', 'Consulta médica veterinaria', 30, 350.00, 'COP', 'Consultas', true),
                (business_record.id, 'Vacunación', 'Aplicación de vacunas', 15, 200.00, 'COP', 'Prevención', true),
                (business_record.id, 'Baño y Corte', 'Baño completo y corte de pelo', 45, 300.00, 'COP', 'Estética', true);

            WHEN 'Gimnasio Valeria Fit' THEN
                INSERT INTO public.services (business_id, name, description, duration_minutes, price, currency, category, is_active) VALUES 
                (business_record.id, 'Entrenamiento Personal', 'Sesión de entrenamiento personalizado', 60, 450.00, 'COP', 'Entrenamiento', true),
                (business_record.id, 'Clase Grupal Yoga', 'Clase de yoga en grupo', 45, 200.00, 'COP', 'Clases', true);

            WHEN 'Taller Mecánico Ricardo' THEN
                INSERT INTO public.services (business_id, name, description, duration_minutes, price, currency, category, is_active) VALUES 
                (business_record.id, 'Cambio de Aceite', 'Cambio de aceite y filtros', 30, 350.00, 'COP', 'Mantenimiento', true),
                (business_record.id, 'Revisión General', 'Diagnóstico completo del vehículo', 60, 500.00, 'COP', 'Diagnóstico', true);

            WHEN 'Salón Camila Style' THEN
                INSERT INTO public.services (business_id, name, description, duration_minutes, price, currency, category, is_active) VALUES 
                (business_record.id, 'Corte y Peinado', 'Corte y peinado profesional', 45, 400.00, 'COP', 'Cortes', true),
                (business_record.id, 'Tinte Completo', 'Coloración completa del cabello', 120, 800.00, 'COP', 'Coloración', true);

            WHEN 'Estudio Fotográfico Fernando' THEN
                INSERT INTO public.services (business_id, name, description, duration_minutes, price, currency, category, is_active) VALUES 
                (business_record.id, 'Sesión de Retratos', 'Sesión fotográfica de retratos', 60, 1200.00, 'COP', 'Fotografía', true),
                (business_record.id, 'Sesión Familiar', 'Sesión fotográfica familiar', 90, 1800.00, 'COP', 'Fotografía', true);

            ELSE
                NULL; -- No hacer nada para otros nombres
        END CASE;
    END LOOP;
END $$;