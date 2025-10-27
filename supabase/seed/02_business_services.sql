-- =============================================================================
-- 3. ASIGNAR EMPLEADOS A NEGOCIOS
-- =============================================================================

INSERT INTO public.business_employees (business_id, employee_id, role, status, hired_at, is_active) VALUES
-- Spa Relax María (2 empleados)
('b1111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'employee', 'approved', NOW() - INTERVAL '30 days', true),
('b1111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'employee', 'approved', NOW() - INTERVAL '25 days', true),

-- Barbería Clásica Carlos (1 empleado)
('b2222222-2222-2222-2222-222222222222', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'employee', 'approved', NOW() - INTERVAL '45 days', true),

-- Consultorio Médico Ana (2 empleados)
('b3333333-3333-3333-3333-333333333333', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'manager', 'approved', NOW() - INTERVAL '60 days', true),
('b3333333-3333-3333-3333-333333333333', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'employee', 'approved', NOW() - INTERVAL '20 days', true),

-- Clínica Dental Luis (1 empleado)
('b4444444-4444-4444-4444-444444444444', '10101010-1010-1010-1010-101010101010', 'employee', 'approved', NOW() - INTERVAL '35 days', true),

-- Estética Sofía Beauty (2 empleados)
('b5555555-5555-5555-5555-555555555555', '20202020-2020-2020-2020-202020202020', 'employee', 'approved', NOW() - INTERVAL '40 days', true),
('b5555555-5555-5555-5555-555555555555', '30303030-3030-3030-3030-303030303030', 'employee', 'approved', NOW() - INTERVAL '15 days', true),

-- Veterinaria Diego (1 empleado)
('b6666666-6666-6666-6666-666666666666', '40404040-4040-4040-4040-404040404040', 'employee', 'approved', NOW() - INTERVAL '50 days', true),

-- Gimnasio Valeria Fit (1 empleado) 
('b7777777-7777-7777-7777-777777777777', '50505050-5050-5050-5050-505050505050', 'employee', 'approved', NOW() - INTERVAL '10 days', true)

-- Taller Mecánico Ricardo (sin empleados adicionales por ahora)
-- Salón Camila Style (sin empleados adicionales por ahora)
-- Estudio Fotográfico Fernando (sin empleados adicionales por ahora)
ON CONFLICT (business_id, employee_id) DO NOTHING;

-- =============================================================================
-- 4. CREAR SERVICIOS PARA CADA NEGOCIO
-- =============================================================================

INSERT INTO public.services (id, business_id, name, description, duration_minutes, price, currency, category, is_active) VALUES
-- Servicios para Spa Relax María
('s1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Masaje Relajante', 'Masaje completo de relajación muscular', 60, 800.00, 'COP', 'Masajes', true),
('s1111112-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Facial Hidratante', 'Tratamiento facial con hidratación profunda', 45, 650.00, 'COP', 'Faciales', true),
('s1111113-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Manicure Completo', 'Cuidado completo de uñas de manos', 30, 350.00, 'COP', 'Uñas', true),

-- Servicios para Barbería Clásica Carlos
('s2222221-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Corte Tradicional', 'Corte de cabello clásico para caballero', 30, 180.00, 'COP', 'Cortes', true),
('s2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Afeitado Navaja', 'Afeitado tradicional con navaja', 20, 150.00, 'COP', 'Afeitado', true),
('s2222223-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'Corte + Barba', 'Paquete corte y arreglo de barba', 45, 280.00, 'COP', 'Paquetes', true),

-- Servicios para Consultorio Médico Ana
('s3333331-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'Consulta General', 'Consulta médica general', 30, 500.00, 'COP', 'Consultas', true),
('s3333332-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'Chequeo Preventivo', 'Examen médico preventivo completo', 60, 800.00, 'COP', 'Prevención', true),

-- Servicios para Clínica Dental Luis
('s4444441-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', 'Limpieza Dental', 'Profilaxis y limpieza dental', 45, 600.00, 'COP', 'Limpieza', true),
('s4444442-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', 'Consulta Odontológica', 'Revisión dental general', 30, 400.00, 'COP', 'Consultas', true),
('s4444443-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', 'Blanqueamiento', 'Blanqueamiento dental profesional', 90, 2500.00, 'COP', 'Estética', true),

-- Servicios para Estética Sofía Beauty
('s5555551-5555-5555-5555-555555555555', 'b5555555-5555-5555-5555-555555555555', 'Facial Anti-edad', 'Tratamiento facial antienvejecimiento', 60, 900.00, 'COP', 'Faciales', true),
('s5555552-5555-5555-5555-555555555555', 'b5555555-5555-5555-5555-555555555555', 'Depilación Láser', 'Sesión de depilación láser', 30, 750.00, 'COP', 'Depilación', true),

-- Servicios para Veterinaria Diego
('s6666661-6666-6666-6666-666666666666', 'b6666666-6666-6666-6666-666666666666', 'Consulta Veterinaria', 'Consulta médica veterinaria', 30, 350.00, 'COP', 'Consultas', true),
('s6666662-6666-6666-6666-666666666666', 'b6666666-6666-6666-6666-666666666666', 'Vacunación', 'Aplicación de vacunas', 15, 200.00, 'COP', 'Prevención', true),
('s6666663-6666-6666-6666-666666666666', 'b6666666-6666-6666-6666-666666666666', 'Baño y Corte', 'Baño completo y corte de pelo', 45, 300.00, 'COP', 'Estética', true),

-- Servicios para Gimnasio Valeria Fit
('s7777771-7777-7777-7777-777777777777', 'b7777777-7777-7777-7777-777777777777', 'Entrenamiento Personal', 'Sesión de entrenamiento personalizado', 60, 450.00, 'COP', 'Entrenamiento', true),
('s7777772-7777-7777-7777-777777777777', 'b7777777-7777-7777-7777-777777777777', 'Clase Grupal Yoga', 'Clase de yoga en grupo', 45, 200.00, 'COP', 'Clases', true),

-- Servicios para Taller Mecánico Ricardo
('s8888881-8888-8888-8888-888888888888', 'b8888888-8888-8888-8888-888888888888', 'Cambio de Aceite', 'Cambio de aceite y filtros', 30, 350.00, 'COP', 'Mantenimiento', true),
('s8888882-8888-8888-8888-888888888888', 'b8888888-8888-8888-8888-888888888888', 'Revisión General', 'Diagnóstico completo del vehículo', 60, 500.00, 'COP', 'Diagnóstico', true),

-- Servicios para Salón Camila Style
('s9999991-9999-9999-9999-999999999999', 'b9999999-9999-9999-9999-999999999999', 'Corte y Peinado', 'Corte y peinado profesional', 45, 400.00, 'COP', 'Cortes', true),
('s9999992-9999-9999-9999-999999999999', 'b9999999-9999-9999-9999-999999999999', 'Tinte Completo', 'Coloración completa del cabello', 120, 800.00, 'COP', 'Coloración', true),

-- Servicios para Estudio Fotográfico Fernando
('saaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'baaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sesión de Retratos', 'Sesión fotográfica de retratos', 60, 1200.00, 'COP', 'Fotografía', true),
('saaaaaaab-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'baaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sesión Familiar', 'Sesión fotográfica familiar', 90, 1800.00, 'COP', 'Fotografía', true)
ON CONFLICT (id) DO NOTHING;