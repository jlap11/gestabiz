-- Seed data: Festivos Colombianos para 2025-2027
-- Estos se cargan automáticamente en public_holidays al crear un negocio

-- Primero obtenemos el ID de Colombia
-- Nota: Reemplaza esto con el ID real de Colombia de tu tabla countries
-- Por ahora usaremos un placeholder que se puede actualizar manualmente

-- FESTIVOS FIJOS COLOMBIANOS (se repiten cada año)
INSERT INTO public.public_holidays (country_id, name, holiday_date, is_recurring, description) VALUES
-- 2025 - Festivos Fijos
((SELECT id FROM countries WHERE code = 'CO'), 'Año Nuevo', '2025-01-01', true, 'Primero de enero'),
((SELECT id FROM countries WHERE code = 'CO'), 'Día de Reyes', '2025-01-06', true, 'Epifanía del Señor'),
((SELECT id FROM countries WHERE code = 'CO'), 'Día del Trabajo', '2025-05-01', true, 'Fiesta del Trabajo'),
((SELECT id FROM countries WHERE code = 'CO'), 'Corpus Christi', '2025-06-02', true, 'Festivo móvil (basado en Pascua)'),
((SELECT id FROM countries WHERE code = 'CO'), 'Sagrado Corazón', '2025-06-09', true, 'Festivo móvil (basado en Pascua)'),
((SELECT id FROM countries WHERE code = 'CO'), 'San Pedro y San Pablo', '2025-07-01', true, 'Festividad de Santos'),
((SELECT id FROM countries WHERE code = 'CO'), 'Batalla de Boyacá', '2025-08-07', true, 'Conmemoración histórica'),
((SELECT id FROM countries WHERE code = 'CO'), 'Asunción de María', '2025-08-18', true, 'Festividad religiosa'),
((SELECT id FROM countries WHERE code = 'CO'), 'Día de la Raza', '2025-10-12', true, 'Descubrimiento de América'),
((SELECT id FROM countries WHERE code = 'CO'), 'Día de Todos los Santos', '2025-11-01', true, 'Festividad religiosa'),
((SELECT id FROM countries WHERE code = 'CO'), 'Independencia de Cartagena', '2025-11-11', true, 'Conmemoración histórica'),
((SELECT id FROM countries WHERE code = 'CO'), 'Inmaculada Concepción', '2025-12-08', true, 'Festividad religiosa'),
((SELECT id FROM countries WHERE code = 'CO'), 'Navidad', '2025-12-25', true, 'Día de Navidad'),

-- FESTIVOS MÓVILES 2025 (basados en Pascua: 20 de abril de 2025)
((SELECT id FROM countries WHERE code = 'CO'), 'Lunes de Carnaval', '2025-03-03', true, 'Carnaval (móvil)'),
((SELECT id FROM countries WHERE code = 'CO'), 'Martes de Carnaval', '2025-03-04', true, 'Carnaval (móvil)'),
((SELECT id FROM countries WHERE code = 'CO'), 'Miércoles de Ceniza', '2025-03-05', true, 'Inicio Cuaresma (móvil)'),
((SELECT id FROM countries WHERE code = 'CO'), 'Viernes Santo', '2025-04-18', true, 'Semana Santa (móvil)'),
((SELECT id FROM countries WHERE code = 'CO'), 'Lunes de Pascua', '2025-05-12', true, 'Lunes siguiente a Pascua (móvil)'),

-- 2026 - Festivos Fijos
((SELECT id FROM countries WHERE code = 'CO'), 'Año Nuevo', '2026-01-01', true, 'Primero de enero'),
((SELECT id FROM countries WHERE code = 'CO'), 'Día de Reyes', '2026-01-06', true, 'Epifanía del Señor'),
((SELECT id FROM countries WHERE code = 'CO'), 'Día del Trabajo', '2026-05-01', true, 'Fiesta del Trabajo'),
((SELECT id FROM countries WHERE code = 'CO'), 'Batalla de Boyacá', '2026-08-07', true, 'Conmemoración histórica'),
((SELECT id FROM countries WHERE code = 'CO'), 'Asunción de María', '2026-08-18', true, 'Festividad religiosa'),
((SELECT id FROM countries WHERE code = 'CO'), 'Día de la Raza', '2026-10-12', true, 'Descubrimiento de América'),
((SELECT id FROM countries WHERE code = 'CO'), 'Día de Todos los Santos', '2026-11-01', true, 'Festividad religiosa'),
((SELECT id FROM countries WHERE code = 'CO'), 'Independencia de Cartagena', '2026-11-11', true, 'Conmemoración histórica'),
((SELECT id FROM countries WHERE code = 'CO'), 'Inmaculada Concepción', '2026-12-08', true, 'Festividad religiosa'),
((SELECT id FROM countries WHERE code = 'CO'), 'Navidad', '2026-12-25', true, 'Día de Navidad'),

-- FESTIVOS MÓVILES 2026 (basados en Pascua: 5 de abril de 2026)
((SELECT id FROM countries WHERE code = 'CO'), 'Lunes de Carnaval', '2026-02-16', true, 'Carnaval (móvil)'),
((SELECT id FROM countries WHERE code = 'CO'), 'Martes de Carnaval', '2026-02-17', true, 'Carnaval (móvil)'),
((SELECT id FROM countries WHERE code = 'CO'), 'Miércoles de Ceniza', '2026-02-18', true, 'Inicio Cuaresma (móvil)'),
((SELECT id FROM countries WHERE code = 'CO'), 'Viernes Santo', '2026-04-03', true, 'Semana Santa (móvil)'),
((SELECT id FROM countries WHERE code = 'CO'), 'Corpus Christi', '2026-05-18', true, 'Festivo móvil (basado en Pascua)'),
((SELECT id FROM countries WHERE code = 'CO'), 'Sagrado Corazón', '2026-05-25', true, 'Festivo móvil (basado en Pascua)'),
((SELECT id FROM countries WHERE code = 'CO'), 'San Pedro y San Pablo', '2026-07-01', true, 'Festividad de Santos'),
((SELECT id FROM countries WHERE code = 'CO'), 'Lunes de Pascua', '2026-04-27', true, 'Lunes siguiente a Pascua (móvil)'),

-- 2027 - Festivos Fijos
((SELECT id FROM countries WHERE code = 'CO'), 'Año Nuevo', '2027-01-01', true, 'Primero de enero'),
((SELECT id FROM countries WHERE code = 'CO'), 'Día de Reyes', '2027-01-06', true, 'Epifanía del Señor'),
((SELECT id FROM countries WHERE code = 'CO'), 'Día del Trabajo', '2027-05-01', true, 'Fiesta del Trabajo'),
((SELECT id FROM countries WHERE code = 'CO'), 'Batalla de Boyacá', '2027-08-07', true, 'Conmemoración histórica'),
((SELECT id FROM countries WHERE code = 'CO'), 'Asunción de María', '2027-08-18', true, 'Festividad religiosa'),
((SELECT id FROM countries WHERE code = 'CO'), 'Día de la Raza', '2027-10-12', true, 'Descubrimiento de América'),
((SELECT id FROM countries WHERE code = 'CO'), 'Día de Todos los Santos', '2027-11-01', true, 'Festividad religiosa'),
((SELECT id FROM countries WHERE code = 'CO'), 'Independencia de Cartagena', '2027-11-11', true, 'Conmemoración histórica'),
((SELECT id FROM countries WHERE code = 'CO'), 'Inmaculada Concepción', '2027-12-08', true, 'Festividad religiosa'),
((SELECT id FROM countries WHERE code = 'CO'), 'Navidad', '2027-12-25', true, 'Día de Navidad'),

-- FESTIVOS MÓVILES 2027 (basados en Pascua: 28 de marzo de 2027)
((SELECT id FROM countries WHERE code = 'CO'), 'Lunes de Carnaval', '2027-02-08', true, 'Carnaval (móvil)'),
((SELECT id FROM countries WHERE code = 'CO'), 'Martes de Carnaval', '2027-02-09', true, 'Carnaval (móvil)'),
((SELECT id FROM countries WHERE code = 'CO'), 'Miércoles de Ceniza', '2027-02-10', true, 'Inicio Cuaresma (móvil)'),
((SELECT id FROM countries WHERE code = 'CO'), 'Viernes Santo', '2027-03-26', true, 'Semana Santa (móvil)'),
((SELECT id FROM countries WHERE code = 'CO'), 'Corpus Christi', '2027-05-10', true, 'Festivo móvil (basado en Pascua)'),
((SELECT id FROM countries WHERE code = 'CO'), 'Sagrado Corazón', '2027-05-17', true, 'Festivo móvil (basado en Pascua)'),
((SELECT id FROM countries WHERE code = 'CO'), 'San Pedro y San Pablo', '2027-07-01', true, 'Festividad de Santos'),
((SELECT id FROM countries WHERE code = 'CO'), 'Lunes de Pascua', '2027-04-19', true, 'Lunes siguiente a Pascua (móvil)');

-- Nota sobre mantenimiento:
-- Para agregar más años o países, ejecutar scripts similares
-- Los festivos móviles (Pascua) cambian cada año y deben actualizarse manualmente
-- o usando un algoritmo como el de Gauss (ver documentación)
