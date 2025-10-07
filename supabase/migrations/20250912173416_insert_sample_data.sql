-- =============================================================================
-- MIGRACIÓN: INSERTAR DATOS DE EJEMPLO CON UUIDs VÁLIDOS
-- 30 usuarios, 10 negocios, empleados y servicios  
-- =============================================================================

DO $$
DECLARE
    -- Variables para almacenar IDs generados
    admin_ids UUID[];
    employee_ids UUID[];
    client_ids UUID[];
    business_ids UUID[];
BEGIN
    -- Generar arrays de UUIDs válidos
    SELECT ARRAY(SELECT uuid_generate_v4() FROM generate_series(1, 10)) INTO admin_ids;
    SELECT ARRAY(SELECT uuid_generate_v4() FROM generate_series(1, 10)) INTO employee_ids;
    SELECT ARRAY(SELECT uuid_generate_v4() FROM generate_series(1, 10)) INTO client_ids;
    SELECT ARRAY(SELECT uuid_generate_v4() FROM generate_series(1, 10)) INTO business_ids;

    -- Insertar ADMINS (10 usuarios que serán dueños de negocios)
    INSERT INTO public.profiles (id, email, full_name, phone, role, is_active, created_at) VALUES
    (admin_ids[1], 'maria.rodriguez@example.com', 'María Rodríguez', '+52 55 1234 5678', 'admin', true, NOW()),
    (admin_ids[2], 'carlos.garcia@example.com', 'Carlos García', '+52 33 2345 6789', 'admin', true, NOW()),
    (admin_ids[3], 'ana.martinez@example.com', 'Ana Martínez', '+52 81 3456 7890', 'admin', true, NOW()),
    (admin_ids[4], 'luis.hernandez@example.com', 'Luis Hernández', '+52 55 4567 8901', 'admin', true, NOW()),
    (admin_ids[5], 'sofia.lopez@example.com', 'Sofía López', '+52 33 5678 9012', 'admin', true, NOW()),
    (admin_ids[6], 'diego.morales@example.com', 'Diego Morales', '+52 81 6789 0123', 'admin', true, NOW()),
    (admin_ids[7], 'valeria.cruz@example.com', 'Valeria Cruz', '+52 55 7890 1234', 'admin', true, NOW()),
    (admin_ids[8], 'ricardo.jimenez@example.com', 'Ricardo Jiménez', '+52 33 8901 2345', 'admin', true, NOW()),
    (admin_ids[9], 'camila.ruiz@example.com', 'Camila Ruiz', '+52 81 9012 3456', 'admin', true, NOW()),
    (admin_ids[10], 'fernando.castillo@example.com', 'Fernando Castillo', '+52 55 0123 4567', 'admin', true, NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Insertar EMPLEADOS (10 usuarios)
    INSERT INTO public.profiles (id, email, full_name, phone, role, is_active, created_at) VALUES
    (employee_ids[1], 'elena.vargas@example.com', 'Elena Vargas', '+52 33 1111 2222', 'employee', true, NOW()),
    (employee_ids[2], 'pablo.soto@example.com', 'Pablo Soto', '+52 81 3333 4444', 'employee', true, NOW()),
    (employee_ids[3], 'natalia.reyes@example.com', 'Natalia Reyes', '+52 55 5555 6666', 'employee', true, NOW()),
    (employee_ids[4], 'andres.torres@example.com', 'Andrés Torres', '+52 33 7777 8888', 'employee', true, NOW()),
    (employee_ids[5], 'isabella.mendez@example.com', 'Isabella Méndez', '+52 81 9999 0000', 'employee', true, NOW()),
    (employee_ids[6], 'miguel.romero@example.com', 'Miguel Romero', '+52 55 1212 3434', 'employee', true, NOW()),
    (employee_ids[7], 'adriana.silva@example.com', 'Adriana Silva', '+52 33 5656 7878', 'employee', true, NOW()),
    (employee_ids[8], 'javier.paredes@example.com', 'Javier Paredes', '+52 81 9090 1212', 'employee', true, NOW()),
    (employee_ids[9], 'larissa.gutierrez@example.com', 'Larissa Gutiérrez', '+52 55 3434 5656', 'employee', true, NOW()),
    (employee_ids[10], 'oscar.navarro@example.com', 'Oscar Navarro', '+52 33 7878 9090', 'employee', true, NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Insertar CLIENTES (10 usuarios)
    INSERT INTO public.profiles (id, email, full_name, phone, role, is_active, created_at) VALUES
    (client_ids[1], 'lucia.moreno@example.com', 'Lucía Moreno', '+52 81 2468 1357', 'client', true, NOW()),
    (client_ids[2], 'alberto.vega@example.com', 'Alberto Vega', '+52 55 9876 5432', 'client', true, NOW()),
    (client_ids[3], 'patricia.ortega@example.com', 'Patricia Ortega', '+52 33 1357 9246', 'client', true, NOW()),
    (client_ids[4], 'gabriel.delgado@example.com', 'Gabriel Delgado', '+52 81 8642 9753', 'client', true, NOW()),
    (client_ids[5], 'daniela.campos@example.com', 'Daniela Campos', '+52 55 7531 8642', 'client', true, NOW()),
    (client_ids[6], 'roberto.aguilar@example.com', 'Roberto Aguilar', '+52 33 9642 7531', 'client', true, NOW()),
    (client_ids[7], 'monica.herrera@example.com', 'Mónica Herrera', '+52 81 3579 1468', 'client', true, NOW()),
    (client_ids[8], 'sergio.ramos@example.com', 'Sergio Ramos', '+52 55 8024 6913', 'client', true, NOW()),
    (client_ids[9], 'teresa.flores@example.com', 'Teresa Flores', '+52 33 4682 5791', 'client', true, NOW()),
    (client_ids[10], 'emilio.santos@example.com', 'Emilio Santos', '+52 81 7139 4826', 'client', true, NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Insertar NEGOCIOS (10 negocios)
    INSERT INTO public.businesses (id, name, description, owner_id, phone, email, address, city, state, country, is_active, created_at) VALUES
    (business_ids[1], 'Spa Relax María', 'Centro de relajación y belleza con servicios integrales', admin_ids[1], '+52 55 1234 5678', 'info@sparelax.com', 'Av. Reforma 123', 'Ciudad de México', 'CDMX', 'México', true, NOW()),
    (business_ids[2], 'Barbería Clásica Carlos', 'Cortes tradicionales y modernos para caballeros', admin_ids[2], '+52 33 2345 6789', 'contacto@barberiacarlos.com', 'Calle Juárez 456', 'Guadalajara', 'Jalisco', 'México', true, NOW()),
    (business_ids[3], 'Consultorio Médico Ana', 'Consulta médica general y especializada', admin_ids[3], '+52 81 3456 7890', 'citas@consultorioana.com', 'Blvd. Constitución 789', 'Monterrey', 'Nuevo León', 'México', true, NOW()),
    (business_ids[4], 'Clínica Dental Luis', 'Servicios odontológicos completos', admin_ids[4], '+52 55 4567 8901', 'info@clinicaluis.com', 'Insurgentes Sur 321', 'Ciudad de México', 'CDMX', 'México', true, NOW()),
    (business_ids[5], 'Estética Sofía Beauty', 'Tratamientos faciales y corporales', admin_ids[5], '+52 33 5678 9012', 'hola@sofiabeauty.com', 'Av. Chapultepec 654', 'Guadalajara', 'Jalisco', 'México', true, NOW()),
    (business_ids[6], 'Veterinaria Diego', 'Cuidado integral para mascotas', admin_ids[6], '+52 81 6789 0123', 'citas@vetdiego.com', 'Av. Universidad 987', 'Monterrey', 'Nuevo León', 'México', true, NOW()),
    (business_ids[7], 'Gimnasio Valeria Fit', 'Entrenamiento personalizado y clases grupales', admin_ids[7], '+52 55 7890 1234', 'info@valeriafit.com', 'Polanco 147', 'Ciudad de México', 'CDMX', 'México', true, NOW()),
    (business_ids[8], 'Taller Mecánico Ricardo', 'Reparación y mantenimiento automotriz', admin_ids[8], '+52 33 8901 2345', 'servicio@tallerricardo.com', 'Industrial 258', 'Guadalajara', 'Jalisco', 'México', true, NOW()),
    (business_ids[9], 'Salón Camila Style', 'Peinados y tratamientos capilares', admin_ids[9], '+52 81 9012 3456', 'contacto@camilastyle.com', 'Centro 369', 'Monterrey', 'Nuevo León', 'México', true, NOW()),
    (business_ids[10], 'Estudio Fotográfico Fernando', 'Fotografía profesional y eventos', admin_ids[10], '+52 55 0123 4567', 'info@estudiofernando.com', 'Roma Norte 741', 'Ciudad de México', 'CDMX', 'México', true, NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Asignar empleados a negocios (distribución variable)
    INSERT INTO public.business_employees (business_id, employee_id, role, status, hired_at, is_active) VALUES
    -- Spa Relax María (2 empleados)
    (business_ids[1], employee_ids[1], 'employee', 'approved', NOW() - INTERVAL '30 days', true),
    (business_ids[1], employee_ids[2], 'employee', 'approved', NOW() - INTERVAL '25 days', true),
    
    -- Barbería Clásica Carlos (1 empleado)
    (business_ids[2], employee_ids[3], 'employee', 'approved', NOW() - INTERVAL '45 days', true),
    
    -- Consultorio Médico Ana (2 empleados)
    (business_ids[3], employee_ids[4], 'manager', 'approved', NOW() - INTERVAL '60 days', true),
    (business_ids[3], employee_ids[5], 'employee', 'approved', NOW() - INTERVAL '20 days', true),
    
    -- Clínica Dental Luis (1 empleado)
    (business_ids[4], employee_ids[6], 'employee', 'approved', NOW() - INTERVAL '35 days', true),
    
    -- Estética Sofía Beauty (2 empleados)
    (business_ids[5], employee_ids[7], 'employee', 'approved', NOW() - INTERVAL '40 days', true),
    (business_ids[5], employee_ids[8], 'employee', 'approved', NOW() - INTERVAL '15 days', true),
    
    -- Veterinaria Diego (1 empleado)
    (business_ids[6], employee_ids[9], 'employee', 'approved', NOW() - INTERVAL '50 days', true),
    
    -- Gimnasio Valeria Fit (1 empleado)
    (business_ids[7], employee_ids[10], 'employee', 'approved', NOW() - INTERVAL '10 days', true)
    
    -- Los otros 3 negocios no tienen empleados adicionales por ahora
    ON CONFLICT (business_id, employee_id) DO NOTHING;

    -- Crear servicios para cada negocio
    INSERT INTO public.services (business_id, name, description, duration_minutes, price, currency, category, is_active) VALUES
    -- Servicios para Spa Relax María
    (business_ids[1], 'Masaje Relajante', 'Masaje completo de relajación muscular', 60, 800.00, 'MXN', 'Masajes', true),
    (business_ids[1], 'Facial Hidratante', 'Tratamiento facial con hidratación profunda', 45, 650.00, 'MXN', 'Faciales', true),
    (business_ids[1], 'Manicure Completo', 'Cuidado completo de uñas de manos', 30, 350.00, 'MXN', 'Uñas', true),
    
    -- Servicios para Barbería Clásica Carlos
    (business_ids[2], 'Corte Tradicional', 'Corte de cabello clásico para caballero', 30, 180.00, 'MXN', 'Cortes', true),
    (business_ids[2], 'Afeitado Navaja', 'Afeitado tradicional con navaja', 20, 150.00, 'MXN', 'Afeitado', true),
    (business_ids[2], 'Corte + Barba', 'Paquete corte y arreglo de barba', 45, 280.00, 'MXN', 'Paquetes', true),
    
    -- Servicios para Consultorio Médico Ana
    (business_ids[3], 'Consulta General', 'Consulta médica general', 30, 500.00, 'MXN', 'Consultas', true),
    (business_ids[3], 'Chequeo Preventivo', 'Examen médico preventivo completo', 60, 800.00, 'MXN', 'Prevención', true),
    
    -- Servicios para Clínica Dental Luis
    (business_ids[4], 'Limpieza Dental', 'Profilaxis y limpieza dental', 45, 600.00, 'MXN', 'Limpieza', true),
    (business_ids[4], 'Consulta Odontológica', 'Revisión dental general', 30, 400.00, 'MXN', 'Consultas', true),
    (business_ids[4], 'Blanqueamiento', 'Blanqueamiento dental profesional', 90, 2500.00, 'MXN', 'Estética', true),
    
    -- Servicios para Estética Sofía Beauty
    (business_ids[5], 'Facial Anti-edad', 'Tratamiento facial antienvejecimiento', 60, 900.00, 'MXN', 'Faciales', true),
    (business_ids[5], 'Depilación Láser', 'Sesión de depilación láser', 30, 750.00, 'MXN', 'Depilación', true),
    
    -- Servicios para Veterinaria Diego
    (business_ids[6], 'Consulta Veterinaria', 'Consulta médica veterinaria', 30, 350.00, 'MXN', 'Consultas', true),
    (business_ids[6], 'Vacunación', 'Aplicación de vacunas', 15, 200.00, 'MXN', 'Prevención', true),
    (business_ids[6], 'Baño y Corte', 'Baño completo y corte de pelo', 45, 300.00, 'MXN', 'Estética', true),
    
    -- Servicios para Gimnasio Valeria Fit
    (business_ids[7], 'Entrenamiento Personal', 'Sesión de entrenamiento personalizado', 60, 450.00, 'MXN', 'Entrenamiento', true),
    (business_ids[7], 'Clase Grupal Yoga', 'Clase de yoga en grupo', 45, 200.00, 'MXN', 'Clases', true),
    
    -- Servicios para Taller Mecánico Ricardo
    (business_ids[8], 'Cambio de Aceite', 'Cambio de aceite y filtros', 30, 350.00, 'MXN', 'Mantenimiento', true),
    (business_ids[8], 'Revisión General', 'Diagnóstico completo del vehículo', 60, 500.00, 'MXN', 'Diagnóstico', true),
    
    -- Servicios para Salón Camila Style
    (business_ids[9], 'Corte y Peinado', 'Corte y peinado profesional', 45, 400.00, 'MXN', 'Cortes', true),
    (business_ids[9], 'Tinte Completo', 'Coloración completa del cabello', 120, 800.00, 'MXN', 'Coloración', true),
    
    -- Servicios para Estudio Fotográfico Fernando
    (business_ids[10], 'Sesión de Retratos', 'Sesión fotográfica de retratos', 60, 1200.00, 'MXN', 'Fotografía', true),
    (business_ids[10], 'Sesión Familiar', 'Sesión fotográfica familiar', 90, 1800.00, 'MXN', 'Fotografía', true);

END $$;