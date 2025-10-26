-- =============================================================================
-- SEED DATA: 30 USUARIOS, 10 NEGOCIOS, EMPLEADOS Y SERVICIOS
-- =============================================================================

-- =============================================================================
-- 1. INSERTAR 30 USUARIOS EN PROFILES
-- Los UUIDs deben corresponder a usuarios existentes en auth.users 
-- Para demo, usaremos UUIDs fijos que debemos crear manualmente
-- =============================================================================

INSERT INTO public.profiles (id, email, full_name, phone, role, is_active, created_at) VALUES
-- ADMINS (10 usuarios que serán dueños de negocios)
('11111111-1111-1111-1111-111111111111', 'maria.rodriguez@example.com', 'María Rodríguez', '+52 55 1234 5678', 'admin', true, NOW()),
('22222222-2222-2222-2222-222222222222', 'carlos.garcia@example.com', 'Carlos García', '+52 33 2345 6789', 'admin', true, NOW()),
('33333333-3333-3333-3333-333333333333', 'ana.martinez@example.com', 'Ana Martínez', '+52 81 3456 7890', 'admin', true, NOW()),
('44444444-4444-4444-4444-444444444444', 'luis.hernandez@example.com', 'Luis Hernández', '+52 55 4567 8901', 'admin', true, NOW()),
('55555555-5555-5555-5555-555555555555', 'sofia.lopez@example.com', 'Sofía López', '+52 33 5678 9012', 'admin', true, NOW()),
('66666666-6666-6666-6666-666666666666', 'diego.morales@example.com', 'Diego Morales', '+52 81 6789 0123', 'admin', true, NOW()),
('77777777-7777-7777-7777-777777777777', 'valeria.cruz@example.com', 'Valeria Cruz', '+52 55 7890 1234', 'admin', true, NOW()),
('88888888-8888-8888-8888-888888888888', 'ricardo.jimenez@example.com', 'Ricardo Jiménez', '+52 33 8901 2345', 'admin', true, NOW()),
('99999999-9999-9999-9999-999999999999', 'camila.ruiz@example.com', 'Camila Ruiz', '+52 81 9012 3456', 'admin', true, NOW()),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'fernando.castillo@example.com', 'Fernando Castillo', '+52 55 0123 4567', 'admin', true, NOW()),

-- EMPLEADOS (10 usuarios)
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'elena.vargas@example.com', 'Elena Vargas', '+52 33 1111 2222', 'employee', true, NOW()),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'pablo.soto@example.com', 'Pablo Soto', '+52 81 3333 4444', 'employee', true, NOW()),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'natalia.reyes@example.com', 'Natalia Reyes', '+52 55 5555 6666', 'employee', true, NOW()),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'andres.torres@example.com', 'Andrés Torres', '+52 33 7777 8888', 'employee', true, NOW()),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'isabella.mendez@example.com', 'Isabella Méndez', '+52 81 9999 0000', 'employee', true, NOW()),
('10101010-1010-1010-1010-101010101010', 'miguel.romero@example.com', 'Miguel Romero', '+52 55 1212 3434', 'employee', true, NOW()),
('20202020-2020-2020-2020-202020202020', 'adriana.silva@example.com', 'Adriana Silva', '+52 33 5656 7878', 'employee', true, NOW()),
('30303030-3030-3030-3030-303030303030', 'javier.paredes@example.com', 'Javier Paredes', '+52 81 9090 1212', 'employee', true, NOW()),
('40404040-4040-4040-4040-404040404040', 'larissa.gutierrez@example.com', 'Larissa Gutiérrez', '+52 55 3434 5656', 'employee', true, NOW()),
('50505050-5050-5050-5050-505050505050', 'oscar.navarro@example.com', 'Oscar Navarro', '+52 33 7878 9090', 'employee', true, NOW()),

-- CLIENTES (10 usuarios)
('abcdefgh-1234-1234-1234-123456789abc', 'lucia.moreno@example.com', 'Lucía Moreno', '+52 81 2468 1357', 'client', true, NOW()),
('bcdefghi-2345-2345-2345-23456789abcd', 'alberto.vega@example.com', 'Alberto Vega', '+52 55 9876 5432', 'client', true, NOW()),
('cdefghij-3456-3456-3456-3456789abcde', 'patricia.ortega@example.com', 'Patricia Ortega', '+52 33 1357 9246', 'client', true, NOW()),
('defghijk-4567-4567-4567-456789abcdef', 'gabriel.delgado@example.com', 'Gabriel Delgado', '+52 81 8642 9753', 'client', true, NOW()),
('efghijkl-5678-5678-5678-56789abcdefg', 'daniela.campos@example.com', 'Daniela Campos', '+52 55 7531 8642', 'client', true, NOW()),
('fghijklm-6789-6789-6789-6789abcdefgh', 'roberto.aguilar@example.com', 'Roberto Aguilar', '+52 33 9642 7531', 'client', true, NOW()),
('ghijklmn-7890-7890-7890-789abcdefghi', 'monica.herrera@example.com', 'Mónica Herrera', '+52 81 3579 1468', 'client', true, NOW()),
('hijklmno-8901-8901-8901-89abcdefghij', 'sergio.ramos@example.com', 'Sergio Ramos', '+52 55 8024 6913', 'client', true, NOW()),
('ijklmnop-9012-9012-9012-9abcdefghijk', 'teresa.flores@example.com', 'Teresa Flores', '+52 33 4682 5791', 'client', true, NOW()),
('jklmnopq-0123-0123-0123-abcdefghijkl', 'emilio.santos@example.com', 'Emilio Santos', '+52 81 7139 4826', 'client', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. INSERTAR 10 NEGOCIOS
-- =============================================================================

INSERT INTO public.businesses (id, name, description, owner_id, phone, email, address, city, state, country, is_active, created_at) VALUES
('b1111111-1111-1111-1111-111111111111', 'Spa Relax María', 'Centro de relajación y belleza con servicios integrales', '11111111-1111-1111-1111-111111111111', '+52 55 1234 5678', 'info@sparelax.com', 'Av. Reforma 123', 'Ciudad de México', 'CDMX', 'México', true, NOW()),
('b2222222-2222-2222-2222-222222222222', 'Barbería Clásica Carlos', 'Cortes tradicionales y modernos para caballeros', '22222222-2222-2222-2222-222222222222', '+52 33 2345 6789', 'contacto@barberiacarlos.com', 'Calle Juárez 456', 'Guadalajara', 'Jalisco', 'México', true, NOW()),
('b3333333-3333-3333-3333-333333333333', 'Consultorio Médico Ana', 'Consulta médica general y especializada', '33333333-3333-3333-3333-333333333333', '+52 81 3456 7890', 'citas@consultorioana.com', 'Blvd. Constitución 789', 'Monterrey', 'Nuevo León', 'México', true, NOW()),
('b4444444-4444-4444-4444-444444444444', 'Clínica Dental Luis', 'Servicios odontológicos completos', '44444444-4444-4444-4444-444444444444', '+52 55 4567 8901', 'info@clinicaluis.com', 'Insurgentes Sur 321', 'Ciudad de México', 'CDMX', 'México', true, NOW()),
('b5555555-5555-5555-5555-555555555555', 'Estética Sofía Beauty', 'Tratamientos faciales y corporales', '55555555-5555-5555-5555-555555555555', '+52 33 5678 9012', 'hola@sofiabeauty.com', 'Av. Chapultepec 654', 'Guadalajara', 'Jalisco', 'México', true, NOW()),
('b6666666-6666-6666-6666-666666666666', 'Veterinaria Diego', 'Cuidado integral para mascotas', '66666666-6666-6666-6666-666666666666', '+52 81 6789 0123', 'citas@vetdiego.com', 'Av. Universidad 987', 'Monterrey', 'Nuevo León', 'México', true, NOW()),
('b7777777-7777-7777-7777-777777777777', 'Gimnasio Valeria Fit', 'Entrenamiento personalizado y clases grupales', '77777777-7777-7777-7777-777777777777', '+52 55 7890 1234', 'info@valeriafit.com', 'Polanco 147', 'Ciudad de México', 'CDMX', 'México', true, NOW()),
('b8888888-8888-8888-8888-888888888888', 'Taller Mecánico Ricardo', 'Reparación y mantenimiento automotriz', '88888888-8888-8888-8888-888888888888', '+52 33 8901 2345', 'servicio@tallerricardo.com', 'Industrial 258', 'Guadalajara', 'Jalisco', 'México', true, NOW()),
('b9999999-9999-9999-9999-999999999999', 'Salón Camila Style', 'Peinados y tratamientos capilares', '99999999-9999-9999-9999-999999999999', '+52 81 9012 3456', 'contacto@camilastyle.com', 'Centro 369', 'Monterrey', 'Nuevo León', 'México', true, NOW()),
('baaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Estudio Fotográfico Fernando', 'Fotografía profesional y eventos', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '+52 55 0123 4567', 'info@estudiofernando.com', 'Roma Norte 741', 'Ciudad de México', 'CDMX', 'México', true, NOW())
ON CONFLICT (id) DO NOTHING;