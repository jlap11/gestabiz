-- ============================================================================
-- SCRIPT DE INSERCIÓN DE DATA FICTICIA - AppointSync Pro
-- ============================================================================
-- Este script genera data transaccional realista para pruebas exhaustivas:
-- - 50 usuarios (15 admins, 20 empleados, 15 clientes puros)
-- - 15 negocios (uno por admin) con categorías variadas
-- - 45 sedes (3 por negocio promedio)
-- - 150 servicios (10 por negocio promedio)
-- - 60 empleados vinculados (4 por negocio promedio)
-- - 500+ citas (pasadas, presentes, futuras) con todos los estados
-- - 200+ reviews verificadas
-- - 300+ transacciones (ingresos y egresos)
-- - 50+ notificaciones
-- - 20+ vacantes y aplicaciones
-- - Conversaciones de chat
-- - Configuraciones de billing y permisos
--
-- DURACIÓN ESTIMADA: 30-45 segundos
-- ============================================================================

-- Deshabilitar triggers temporalmente para mejor performance
SET session_replication_role = 'replica';

BEGIN;

-- ============================================================================
-- VARIABLES Y FUNCIONES AUXILIARES
-- ============================================================================

-- Función para generar nombres aleatorios
CREATE OR REPLACE FUNCTION random_name(type TEXT) RETURNS TEXT AS $$
DECLARE
  first_names TEXT[] := ARRAY['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Carmen', 'Pedro', 'Laura', 'José', 'Elena', 'Miguel', 'Sofia', 'Diego', 'Valentina', 'Andrés', 'Isabella', 'Felipe', 'Camila', 'Ricardo', 'Daniela', 'Sebastián', 'Natalia', 'Fernando', 'Gabriela', 'Javier', 'Paula', 'Alejandro', 'Marcela', 'Roberto', 'Carolina'];
  last_names TEXT[] := ARRAY['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez', 'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Ramos', 'Gil', 'Ramírez', 'Serrano', 'Blanco', 'Suárez'];
  business_names TEXT[] := ARRAY['Salón Belleza Total', 'Clínica Dental Sonrisa', 'Spa Zen Relax', 'Barbería El Caballero', 'Centro Médico Vida', 'Estética Glamour', 'Gimnasio FitZone', 'Peluquería Estilo', 'Consultorio Jurídico', 'Academia Inglés Fluido', 'Taller Mecánico Express', 'Estudio Fotografía', 'Centro Yoga Balance', 'Salón Nails Art', 'Clínica Fisioterapia'];
BEGIN
  IF type = 'person' THEN
    RETURN first_names[1 + floor(random() * 30)::int] || ' ' || last_names[1 + floor(random() * 30)::int];
  ELSIF type = 'business' THEN
    RETURN business_names[1 + floor(random() * 15)::int];
  END IF;
  RETURN 'Nombre Desconocido';
END;
$$ LANGUAGE plpgsql;

-- Función para generar email único
CREATE OR REPLACE FUNCTION generate_email(base_name TEXT, idx INT) RETURNS TEXT AS $$
BEGIN
  RETURN lower(replace(base_name, ' ', '.')) || idx || '@appointsync.test';
END;
$$ LANGUAGE plpgsql;

-- Función para obtener categoría aleatoria
CREATE OR REPLACE FUNCTION random_category_id() RETURNS UUID AS $$
DECLARE
  cat_id UUID;
BEGIN
  SELECT id INTO cat_id FROM business_categories WHERE parent_id IS NULL ORDER BY RANDOM() LIMIT 1;
  RETURN cat_id;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener subcategorías de una categoría
CREATE OR REPLACE FUNCTION get_subcategories(parent_id UUID, limit_count INT) RETURNS UUID[] AS $$
DECLARE
  subcat_ids UUID[];
BEGIN
  SELECT ARRAY_AGG(id) INTO subcat_ids 
  FROM (
    SELECT id FROM business_categories 
    WHERE business_categories.parent_id = get_subcategories.parent_id 
    ORDER BY RANDOM() 
    LIMIT limit_count
  ) sub;
  RETURN COALESCE(subcat_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE '🚀 Iniciando generación de data ficticia...';

-- ============================================================================
-- FASE 1: CREAR USUARIOS (PROFILES)
-- ============================================================================

RAISE NOTICE '👥 Creando 50 usuarios...';

-- Crear usuarios administradores (15)
INSERT INTO profiles (id, email, full_name, phone, role, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  generate_email(random_name('person'), i),
  random_name('person'),
  '+57300' || (1000000 + floor(random() * 9000000)::int)::text,
  'admin',
  true,
  NOW() - (random() * interval '180 days'),
  NOW()
FROM generate_series(1, 15) AS i;

-- Crear usuarios empleados (20)
INSERT INTO profiles (id, email, full_name, phone, role, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  generate_email(random_name('person'), i + 15),
  random_name('person'),
  '+57300' || (1000000 + floor(random() * 9000000)::int)::text,
  'employee',
  true,
  NOW() - (random() * interval '150 days'),
  NOW()
FROM generate_series(1, 20) AS i;

-- Crear usuarios clientes (15)
INSERT INTO profiles (id, email, full_name, phone, role, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  generate_email(random_name('person'), i + 35),
  random_name('person'),
  '+57300' || (1000000 + floor(random() * 9000000)::int)::text,
  'client',
  true,
  NOW() - (random() * interval '120 days'),
  NOW()
FROM generate_series(1, 15) AS i;

RAISE NOTICE '✅ 50 usuarios creados';

-- ============================================================================
-- FASE 2: CREAR NEGOCIOS (15 negocios, 1 por cada admin)
-- ============================================================================

RAISE NOTICE '🏢 Creando 15 negocios...';

WITH admin_users AS (
  SELECT id, full_name, email, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM profiles WHERE role = 'admin'
),
cities AS (
  SELECT unnest(ARRAY['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Cúcuta', 'Manizales', 'Ibagué']) as city
)
INSERT INTO businesses (
  id, name, description, owner_id, phone, email, address, city, state, country, 
  postal_code, category_id, legal_entity_type, tax_id, legal_name, 
  invitation_code, is_active, created_at, updated_at, last_activity_at,
  business_hours, settings
)
SELECT 
  gen_random_uuid(),
  random_name('business') || ' ' || rn,
  'Negocio dedicado a ofrecer servicios de alta calidad con profesionales experimentados',
  a.id,
  '+57300' || (2000000 + floor(random() * 8000000)::int)::text,
  'contacto.' || lower(replace(random_name('business'), ' ', '')) || rn || '@business.test',
  'Calle ' || (1 + floor(random() * 200)::int) || ' #' || (1 + floor(random() * 99)::int) || '-' || (1 + floor(random() * 99)::int),
  (SELECT city FROM cities ORDER BY RANDOM() LIMIT 1),
  'Colombia',
  'CO',
  (110000 + floor(random() * 10000)::int)::text,
  random_category_id(),
  CASE WHEN random() < 0.7 THEN 'company'::legal_entity_type ELSE 'individual'::legal_entity_type END,
  (900000000 + floor(random() * 99999999)::bigint)::text,
  random_name('business') || ' ' || rn || CASE WHEN random() < 0.7 THEN ' SAS' ELSE '' END,
  upper(substr(md5(random()::text), 1, 6)),
  true,
  NOW() - (random() * interval '180 days'),
  NOW(),
  NOW() - (random() * interval '7 days'),
  '{
    "monday": {"open": "08:00", "close": "18:00", "closed": false},
    "tuesday": {"open": "08:00", "close": "18:00", "closed": false},
    "wednesday": {"open": "08:00", "close": "18:00", "closed": false},
    "thursday": {"open": "08:00", "close": "18:00", "closed": false},
    "friday": {"open": "08:00", "close": "18:00", "closed": false},
    "saturday": {"open": "09:00", "close": "14:00", "closed": false},
    "sunday": {"open": "09:00", "close": "14:00", "closed": true}
  }'::jsonb,
  '{
    "appointment_buffer": 15,
    "advance_booking_days": 30,
    "cancellation_policy": 24,
    "auto_confirm": true,
    "require_deposit": false,
    "deposit_percentage": 0,
    "currency": "COP"
  }'::jsonb
FROM admin_users a;

RAISE NOTICE '✅ 15 negocios creados';

-- Asignar subcategorías a negocios (máximo 3 por negocio)
INSERT INTO business_subcategories (business_id, subcategory_id)
SELECT 
  b.id,
  unnest(get_subcategories(b.category_id, 1 + floor(random() * 3)::int))
FROM businesses b;

RAISE NOTICE '✅ Subcategorías asignadas';

-- ============================================================================
-- FASE 3: CREAR UBICACIONES/SEDES (45 sedes, 3 por negocio en promedio)
-- ============================================================================

RAISE NOTICE '📍 Creando 45 ubicaciones...';

WITH business_locations AS (
  SELECT 
    b.id as business_id,
    b.name as business_name,
    b.city,
    generate_series(1, 1 + floor(random() * 4)::int) as location_num
  FROM businesses b
)
INSERT INTO locations (
  id, business_id, name, address, city, state, country, postal_code,
  phone, is_active, created_at, updated_at,
  business_hours, description
)
SELECT 
  gen_random_uuid(),
  bl.business_id,
  bl.business_name || ' - Sede ' || CASE bl.location_num 
    WHEN 1 THEN 'Principal'
    WHEN 2 THEN 'Norte'
    WHEN 3 THEN 'Sur'
    ELSE 'Centro' END,
  'Carrera ' || (1 + floor(random() * 100)::int) || ' #' || (1 + floor(random() * 99)::int) || '-' || (10 + floor(random() * 89)::int),
  bl.city,
  'Colombia',
  'CO',
  (110000 + floor(random() * 10000)::int)::text,
  '+57300' || (3000000 + floor(random() * 7000000)::int)::text,
  true,
  NOW() - (random() * interval '150 days'),
  NOW(),
  '{
    "monday": {"open": "08:00", "close": "18:00", "closed": false},
    "tuesday": {"open": "08:00", "close": "18:00", "closed": false},
    "wednesday": {"open": "08:00", "close": "18:00", "closed": false},
    "thursday": {"open": "08:00", "close": "18:00", "closed": false},
    "friday": {"open": "08:00", "close": "19:00", "closed": false},
    "saturday": {"open": "09:00", "close": "15:00", "closed": false},
    "sunday": {"open": "09:00", "close": "14:00", "closed": true}
  }'::jsonb,
  'Sede con instalaciones modernas y amplias para atención de clientes'
FROM business_locations bl
LIMIT 45;

RAISE NOTICE '✅ 45 ubicaciones creadas';

-- ============================================================================
-- FASE 4: CREAR SERVICIOS (150 servicios, ~10 por negocio)
-- ============================================================================

RAISE NOTICE '⚙️ Creando 150 servicios...';

WITH service_templates AS (
  SELECT unnest(ARRAY[
    'Corte de Cabello', 'Tinte y Color', 'Manicure', 'Pedicure', 'Facial Limpieza',
    'Masaje Relajante', 'Depilación', 'Maquillaje', 'Tratamiento Capilar', 'Uñas Acrílicas',
    'Consulta General', 'Limpieza Dental', 'Ortodoncia', 'Blanqueamiento', 'Extracción',
    'Terapia Física', 'Entrenamiento Personal', 'Clase Grupal', 'Asesoría Nutricional', 'Consulta Legal'
  ]) as service_name,
  unnest(ARRAY[
    30, 90, 45, 60, 60,
    60, 30, 90, 45, 90,
    30, 45, 60, 60, 45,
    45, 60, 60, 30, 60
  ]) as duration,
  unnest(ARRAY[
    35000, 80000, 30000, 35000, 55000,
    70000, 25000, 60000, 50000, 65000,
    45000, 50000, 1200000, 150000, 80000,
    55000, 60000, 40000, 50000, 80000
  ]) as base_price
),
business_services AS (
  SELECT 
    b.id as business_id,
    generate_series(1, 8 + floor(random() * 5)::int) as service_num
  FROM businesses b
)
INSERT INTO services (
  id, business_id, name, description, duration_minutes, price, currency,
  category, is_active, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  bs.business_id,
  st.service_name,
  'Servicio profesional de ' || lower(st.service_name) || ' con atención personalizada',
  st.duration,
  st.base_price * (0.8 + random() * 0.4), -- Variación de precio ±20%
  'COP',
  CASE 
    WHEN st.service_name LIKE '%Cabello%' OR st.service_name LIKE '%Corte%' THEN 'Cabello'
    WHEN st.service_name LIKE '%Uñas%' OR st.service_name LIKE '%Manicure%' THEN 'Uñas'
    WHEN st.service_name LIKE '%Dental%' OR st.service_name LIKE '%Ortodoncia%' THEN 'Dental'
    WHEN st.service_name LIKE '%Masaje%' OR st.service_name LIKE '%Terapia%' THEN 'Bienestar'
    ELSE 'General'
  END,
  random() > 0.1, -- 90% activos
  NOW() - (random() * interval '120 days'),
  NOW()
FROM business_services bs
CROSS JOIN LATERAL (
  SELECT * FROM service_templates ORDER BY RANDOM() LIMIT 1
) st
LIMIT 150;

RAISE NOTICE '✅ 150 servicios creados';

-- ============================================================================
-- FASE 5: VINCULAR EMPLEADOS A NEGOCIOS (60 vínculos)
-- ============================================================================

RAISE NOTICE '👔 Creando 60 vínculos empleado-negocio...';

WITH employee_assignments AS (
  SELECT 
    e.id as employee_id,
    b.id as business_id,
    l.id as location_id,
    ROW_NUMBER() OVER (PARTITION BY e.id ORDER BY random()) as assignment_num
  FROM profiles e
  CROSS JOIN LATERAL (
    SELECT * FROM businesses ORDER BY RANDOM() LIMIT 1 + floor(random() * 2)::int
  ) b
  CROSS JOIN LATERAL (
    SELECT * FROM locations WHERE business_id = b.id ORDER BY RANDOM() LIMIT 1
  ) l
  WHERE e.role = 'employee'
)
INSERT INTO business_employees (
  id, business_id, employee_id, location_id, status, role,
  hired_at, is_active, employee_type, offers_services,
  salary_base, salary_type, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  ea.business_id,
  ea.employee_id,
  ea.location_id,
  CASE WHEN random() < 0.9 THEN 'approved'::employee_status ELSE 'pending'::employee_status END,
  CASE WHEN random() < 0.15 THEN 'manager' ELSE 'employee' END,
  NOW() - (random() * interval '100 days'),
  true,
  CASE WHEN random() < 0.85 THEN 'service_provider' ELSE 'support_staff' END,
  random() < 0.85,
  (1300000 + floor(random() * 2700000)) * 1.0, -- Entre 1.3M y 4M COP
  'monthly',
  NOW() - (random() * interval '100 days'),
  NOW()
FROM employee_assignments ea
WHERE ea.assignment_num <= 3 -- Máximo 3 negocios por empleado
LIMIT 60;

RAISE NOTICE '✅ 60 vínculos empleado-negocio creados';

-- Asignar servicios a empleados
INSERT INTO employee_services (business_id, employee_id, location_id, service_id, expertise_level, is_active)
SELECT 
  be.business_id,
  be.employee_id,
  be.location_id,
  s.id,
  3 + floor(random() * 3)::int, -- Nivel de experiencia 3-5
  true
FROM business_employees be
CROSS JOIN LATERAL (
  SELECT * FROM services 
  WHERE business_id = be.business_id 
  ORDER BY RANDOM() 
  LIMIT 3 + floor(random() * 5)::int
) s
WHERE be.offers_services = true AND be.status = 'approved';

RAISE NOTICE '✅ Servicios asignados a empleados';

-- ============================================================================
-- FASE 6: CREAR CITAS (500+ citas con estados variados)
-- ============================================================================

RAISE NOTICE '📅 Creando 500+ citas...';

WITH appointment_data AS (
  SELECT 
    b.id as business_id,
    l.id as location_id,
    s.id as service_id,
    s.duration_minutes,
    s.price,
    be.employee_id,
    c.id as client_id
  FROM businesses b
  INNER JOIN locations l ON l.business_id = b.id
  INNER JOIN services s ON s.business_id = b.id AND s.is_active = true
  INNER JOIN business_employees be ON be.business_id = b.id AND be.status = 'approved' AND be.offers_services = true
  CROSS JOIN LATERAL (
    SELECT id FROM profiles WHERE role = 'client' OR role = 'employee' OR role = 'admin' ORDER BY RANDOM() LIMIT 1
  ) c
  ORDER BY RANDOM()
  LIMIT 500
),
time_slots AS (
  SELECT 
    ad.*,
    -- Generar citas pasadas (60%), presentes (10%), futuras (30%)
    CASE 
      WHEN random() < 0.6 THEN -- Pasadas
        (NOW() - (random() * interval '90 days'))::timestamp
      WHEN random() < 0.7 THEN -- Esta semana
        (NOW() + (random() * interval '7 days'))::timestamp
      ELSE -- Futuras
        (NOW() + (random() * interval '60 days'))::timestamp
    END as start_time,
    CASE 
      WHEN random() < 0.6 THEN -- Pasadas: mayoría completadas
        CASE 
          WHEN random() < 0.75 THEN 'completed'::appointment_status
          WHEN random() < 0.85 THEN 'cancelled'::appointment_status
          ELSE 'no_show'::appointment_status
        END
      WHEN random() < 0.7 THEN -- Esta semana: confirmed o pending
        CASE WHEN random() < 0.7 THEN 'confirmed'::appointment_status ELSE 'pending'::appointment_status END
      ELSE -- Futuras: confirmed o pending
        CASE WHEN random() < 0.6 THEN 'confirmed'::appointment_status ELSE 'pending'::appointment_status END
    END as status
  FROM appointment_data ad
)
INSERT INTO appointments (
  id, business_id, location_id, service_id, client_id, employee_id,
  start_time, end_time, status, price, currency, payment_status,
  notes, client_notes, reminder_sent,
  created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  ts.business_id,
  ts.location_id,
  ts.service_id,
  ts.client_id,
  ts.employee_id,
  ts.start_time,
  ts.start_time + (ts.duration_minutes || ' minutes')::interval,
  ts.status,
  ts.price,
  'COP',
  CASE 
    WHEN ts.status = 'completed' THEN 'paid'::payment_status
    WHEN ts.status = 'cancelled' THEN CASE WHEN random() < 0.5 THEN 'refunded'::payment_status ELSE 'pending'::payment_status END
    ELSE 'pending'::payment_status
  END,
  CASE WHEN random() < 0.3 THEN 'Cliente regular, atención especial' ELSE NULL END,
  CASE WHEN random() < 0.2 THEN 'Primera vez, requiere orientación' ELSE NULL END,
  ts.start_time < NOW() - interval '1 day',
  ts.start_time - interval '5 days',
  NOW()
FROM time_slots ts;

RAISE NOTICE '✅ 500+ citas creadas';

-- ============================================================================
-- FASE 7: CREAR REVIEWS (200+ reviews verificadas)
-- ============================================================================

RAISE NOTICE '⭐ Creando 200+ reviews...';

WITH completed_appointments AS (
  SELECT 
    a.id as appointment_id,
    a.business_id,
    a.client_id,
    a.employee_id,
    a.created_at
  FROM appointments a
  WHERE a.status = 'completed'
  ORDER BY RANDOM()
  LIMIT 250
)
INSERT INTO reviews (
  id, business_id, appointment_id, client_id, employee_id,
  rating, comment, is_visible, is_verified,
  created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  ca.business_id,
  ca.appointment_id,
  ca.client_id,
  ca.employee_id,
  3 + floor(random() * 3)::int, -- Rating 3-5 (mayoría positivos)
  CASE floor(random() * 5)::int
    WHEN 0 THEN 'Excelente servicio, muy profesionales'
    WHEN 1 THEN 'Muy buena atención, lo recomiendo'
    WHEN 2 THEN 'Cumplieron con lo prometido, volveré'
    WHEN 3 THEN 'Buen servicio aunque mejorable en tiempos'
    ELSE 'Servicio aceptable, precios justos'
  END,
  random() > 0.05, -- 95% visibles
  true,
  ca.created_at + interval '1 day' + (random() * interval '7 days'),
  NOW()
FROM completed_appointments ca;

RAISE NOTICE '✅ 200+ reviews creadas';

-- ============================================================================
-- FASE 8: CREAR TRANSACCIONES (300+ transacciones)
-- ============================================================================

RAISE NOTICE '💰 Creando 300+ transacciones...';

-- Transacciones de citas completadas (ingresos)
INSERT INTO transactions (
  id, business_id, location_id, type, category, amount, currency,
  description, appointment_id, employee_id, transaction_date,
  payment_method, is_verified, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  a.business_id,
  a.location_id,
  'income'::transaction_type,
  'appointment_payment'::transaction_category,
  a.price,
  'COP',
  'Pago de cita - Servicio completado',
  a.id,
  a.employee_id,
  a.start_time::date,
  CASE floor(random() * 4)::int
    WHEN 0 THEN 'cash'
    WHEN 1 THEN 'card'
    WHEN 2 THEN 'transfer'
    ELSE 'nequi'
  END,
  true,
  a.start_time + interval '1 hour',
  NOW()
FROM appointments a
WHERE a.status = 'completed' AND a.payment_status = 'paid'
LIMIT 200;

-- Transacciones de gastos operacionales
WITH expense_categories AS (
  SELECT unnest(ARRAY['rent', 'utilities', 'supplies', 'marketing', 'equipment']) as category
)
INSERT INTO transactions (
  id, business_id, type, category, amount, currency,
  description, transaction_date, payment_method, is_verified,
  created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  b.id,
  'expense'::transaction_type,
  ec.category::transaction_category,
  (50000 + floor(random() * 450000)) * 1.0,
  'COP',
  'Gasto operacional - ' || ec.category,
  (NOW() - (random() * interval '60 days'))::date,
  'transfer',
  true,
  NOW() - (random() * interval '60 days'),
  NOW()
FROM businesses b
CROSS JOIN expense_categories ec
CROSS JOIN generate_series(1, 2) -- 2 gastos de cada categoría por negocio
LIMIT 150;

RAISE NOTICE '✅ 300+ transacciones creadas';

-- ============================================================================
-- FASE 9: CREAR NOTIFICACIONES (50+ notificaciones)
-- ============================================================================

RAISE NOTICE '🔔 Creando 50+ notificaciones...';

INSERT INTO notifications (
  id, user_id, type, title, message, appointment_id, read,
  created_at
)
SELECT 
  gen_random_uuid(),
  a.client_id,
  CASE floor(random() * 3)::int
    WHEN 0 THEN 'appointment_reminder'::notification_type
    WHEN 1 THEN 'appointment_confirmed'::notification_type
    ELSE 'appointment_cancelled'::notification_type
  END,
  CASE floor(random() * 3)::int
    WHEN 0 THEN 'Recordatorio de cita'
    WHEN 1 THEN 'Cita confirmada'
    ELSE 'Cita cancelada'
  END,
  'Tienes una cita programada. Revisa los detalles.',
  a.id,
  random() > 0.4, -- 60% leídas
  a.start_time - interval '1 day'
FROM appointments a
WHERE a.start_time > NOW() - interval '30 days'
ORDER BY RANDOM()
LIMIT 60;

RAISE NOTICE '✅ 50+ notificaciones creadas';

-- ============================================================================
-- FASE 10: CREAR VACANTES Y APLICACIONES (20+ vacantes, 40+ aplicaciones)
-- ============================================================================

RAISE NOTICE '💼 Creando vacantes y aplicaciones...';

-- Crear vacantes
INSERT INTO job_vacancies (
  id, business_id, location_id, title, description,
  requirements, responsibilities, benefits,
  position_type, experience_required, salary_min, salary_max, currency,
  status, published_at, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  b.id,
  l.id,
  CASE floor(random() * 5)::int
    WHEN 0 THEN 'Estilista Profesional'
    WHEN 1 THEN 'Recepcionista'
    WHEN 2 THEN 'Terapeuta'
    WHEN 3 THEN 'Barbero Experto'
    ELSE 'Asistente General'
  END,
  'Buscamos profesional con experiencia para unirse a nuestro equipo',
  'Experiencia mínima de 2 años en el área',
  'Atención al cliente, manejo de agenda, servicios profesionales',
  'Salario competitivo, prestaciones de ley, ambiente laboral agradable',
  'full_time',
  '2+ años',
  1300000,
  2500000,
  'COP',
  CASE WHEN random() < 0.7 THEN 'open' ELSE 'closed' END,
  NOW() - (random() * interval '30 days'),
  NOW() - (random() * interval '30 days'),
  NOW()
FROM businesses b
CROSS JOIN LATERAL (
  SELECT * FROM locations WHERE business_id = b.id ORDER BY RANDOM() LIMIT 1
) l
LIMIT 25;

-- Crear aplicaciones
INSERT INTO job_applications (
  id, vacancy_id, user_id, business_id, status,
  cover_letter, available_from,
  created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  jv.id,
  p.id,
  jv.business_id,
  CASE floor(random() * 5)::int
    WHEN 0 THEN 'pending'
    WHEN 1 THEN 'reviewed'
    WHEN 2 THEN 'accepted'
    WHEN 3 THEN 'rejected'
    ELSE 'interview_scheduled'
  END,
  'Estoy muy interesado en esta posición. Cuento con la experiencia requerida.',
  CURRENT_DATE + (floor(random() * 30)::int || ' days')::interval,
  NOW() - (random() * interval '20 days'),
  NOW()
FROM job_vacancies jv
CROSS JOIN LATERAL (
  SELECT * FROM profiles WHERE role = 'client' OR role = 'employee' ORDER BY RANDOM() LIMIT 2
) p
LIMIT 50;

RAISE NOTICE '✅ 25 vacantes y 50 aplicaciones creadas';

-- ============================================================================
-- FASE 11: CREAR CONVERSACIONES Y MENSAJES DE CHAT (30 conversaciones)
-- ============================================================================

RAISE NOTICE '💬 Creando conversaciones de chat...';

-- Crear conversaciones entre clientes y negocios
INSERT INTO conversations (
  id, business_id, type, name, created_by, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  b.id,
  'direct'::conversation_type,
  'Chat con ' || p.full_name,
  p.id,
  NOW() - (random() * interval '30 days'),
  NOW()
FROM businesses b
CROSS JOIN LATERAL (
  SELECT * FROM profiles WHERE role = 'client' ORDER BY RANDOM() LIMIT 2
) p
LIMIT 30;

-- Agregar participantes a conversaciones
INSERT INTO conversation_members (conversation_id, user_id, role)
SELECT 
  c.id,
  c.created_by,
  'member'::conversation_role
FROM conversations c;

-- Agregar admin del negocio a cada conversación
INSERT INTO conversation_members (conversation_id, user_id, role)
SELECT 
  c.id,
  b.owner_id,
  'admin'::conversation_role
FROM conversations c
INNER JOIN businesses b ON b.id = c.business_id;

-- Crear mensajes
INSERT INTO messages (
  id, conversation_id, sender_id, type, body, created_at
)
SELECT 
  gen_random_uuid(),
  c.id,
  CASE WHEN random() < 0.5 THEN c.created_by ELSE b.owner_id END,
  'text'::message_type,
  CASE floor(random() * 5)::int
    WHEN 0 THEN 'Hola, quisiera agendar una cita'
    WHEN 1 THEN 'Claro, ¿qué servicio te interesa?'
    WHEN 2 THEN 'Tengo disponibilidad para mañana'
    WHEN 3 THEN 'Perfecto, te confirmo la cita'
    ELSE 'Muchas gracias por tu atención'
  END,
  NOW() - (random() * interval '15 days')
FROM conversations c
INNER JOIN businesses b ON b.id = c.business_id
CROSS JOIN generate_series(1, 3); -- 3 mensajes por conversación

RAISE NOTICE '✅ 30 conversaciones y 90+ mensajes creados';

-- ============================================================================
-- FASE 12: CONFIGURACIONES ADICIONALES
-- ============================================================================

RAISE NOTICE '⚙️ Creando configuraciones...';

-- Configuraciones de notificaciones por negocio
INSERT INTO business_notification_settings (business_id, email_enabled, sms_enabled, whatsapp_enabled)
SELECT id, true, false, true FROM businesses;

-- Configuraciones fiscales
INSERT INTO tax_configurations (business_id, is_iva_responsible, is_ica_responsible)
SELECT id, true, random() > 0.5 FROM businesses;

-- Planes de negocio
INSERT INTO business_plans (business_id, plan_type, status, start_date)
SELECT 
  id,
  CASE floor(random() * 4)::int
    WHEN 0 THEN 'inicio'
    WHEN 1 THEN 'profesional'
    WHEN 2 THEN 'empresarial'
    ELSE 'corporativo'
  END,
  'active',
  NOW() - (random() * interval '90 days')
FROM businesses;

-- Roles y permisos
INSERT INTO business_roles (business_id, user_id, role)
SELECT b.id, b.owner_id, 'admin'
FROM businesses b;

RAISE NOTICE '✅ Configuraciones creadas';

-- ============================================================================
-- LIMPIEZA Y VERIFICACIÓN FINAL
-- ============================================================================

-- Actualizar stats de negocios
UPDATE businesses b SET
  total_appointments = (SELECT COUNT(*) FROM appointments WHERE business_id = b.id AND status = 'completed'),
  total_reviews = (SELECT COUNT(*) FROM reviews WHERE business_id = b.id AND is_visible = true),
  average_rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE business_id = b.id AND is_visible = true), 0),
  total_revenue = COALESCE((SELECT SUM(amount) FROM transactions WHERE business_id = b.id AND type = 'income'), 0),
  first_client_at = (SELECT MIN(start_time) FROM appointments WHERE business_id = b.id)
WHERE EXISTS (SELECT 1 FROM appointments WHERE business_id = b.id);

-- Actualizar contadores de vacantes
UPDATE job_vacancies jv SET
  applications_count = (SELECT COUNT(*) FROM job_applications WHERE vacancy_id = jv.id)
WHERE EXISTS (SELECT 1 FROM job_applications WHERE vacancy_id = jv.id);

-- Drop funciones auxiliares
DROP FUNCTION IF EXISTS random_name(TEXT);
DROP FUNCTION IF EXISTS generate_email(TEXT, INT);
DROP FUNCTION IF EXISTS random_category_id();
DROP FUNCTION IF EXISTS get_subcategories(UUID, INT);

-- Verificación final
DO $$
DECLARE
  v_profiles INT;
  v_businesses INT;
  v_locations INT;
  v_services INT;
  v_employees INT;
  v_appointments INT;
  v_reviews INT;
  v_transactions INT;
  v_notifications INT;
  v_vacancies INT;
  v_applications INT;
  v_conversations INT;
  v_messages INT;
BEGIN
  SELECT COUNT(*) INTO v_profiles FROM profiles;
  SELECT COUNT(*) INTO v_businesses FROM businesses;
  SELECT COUNT(*) INTO v_locations FROM locations;
  SELECT COUNT(*) INTO v_services FROM services;
  SELECT COUNT(*) INTO v_employees FROM business_employees;
  SELECT COUNT(*) INTO v_appointments FROM appointments;
  SELECT COUNT(*) INTO v_reviews FROM reviews;
  SELECT COUNT(*) INTO v_transactions FROM transactions;
  SELECT COUNT(*) INTO v_notifications FROM notifications;
  SELECT COUNT(*) INTO v_vacancies FROM job_vacancies;
  SELECT COUNT(*) INTO v_applications FROM job_applications;
  SELECT COUNT(*) INTO v_conversations FROM conversations;
  SELECT COUNT(*) INTO v_messages FROM messages;
  
  RAISE NOTICE '📊 ============== RESUMEN FINAL ==============';
  RAISE NOTICE '👥 Usuarios (profiles): %', v_profiles;
  RAISE NOTICE '🏢 Negocios: %', v_businesses;
  RAISE NOTICE '📍 Ubicaciones: %', v_locations;
  RAISE NOTICE '⚙️ Servicios: %', v_services;
  RAISE NOTICE '👔 Empleados vinculados: %', v_employees;
  RAISE NOTICE '📅 Citas: %', v_appointments;
  RAISE NOTICE '⭐ Reviews: %', v_reviews;
  RAISE NOTICE '💰 Transacciones: %', v_transactions;
  RAISE NOTICE '🔔 Notificaciones: %', v_notifications;
  RAISE NOTICE '💼 Vacantes: %', v_vacancies;
  RAISE NOTICE '📄 Aplicaciones: %', v_applications;
  RAISE NOTICE '💬 Conversaciones: %', v_conversations;
  RAISE NOTICE '📨 Mensajes: %', v_messages;
  RAISE NOTICE '✅ ============== DATA GENERADA EXITOSAMENTE ==============';
END $$;

COMMIT;

-- Rehabilitar triggers
SET session_replication_role = 'origin';

RAISE NOTICE '✨ Script completado. La base de datos tiene data realista para pruebas exhaustivas.';
