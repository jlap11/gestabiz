-- ============================================================================
-- Agregar nuevas categorías para negocios con recursos físicos
-- ============================================================================
-- Hotelería, Gastronomía, Deportes, Fitness, Co-working, Entretenimiento

-- =====================================================
-- 1. Insertar categorías principales
-- =====================================================

INSERT INTO public.business_categories (name, slug, description, icon_name, sort_order, is_active) 
VALUES
-- Nuevas categorías de recursos físicos
('Hotelería', 'hoteleria', 'Hoteles, hostales y alojamientos con reserva de habitaciones', 'Hotel', 1100, true),
('Gastronomía', 'gastronomia', 'Restaurantes, bares y cafeterías con reserva de mesas', 'Utensils', 1110, true),
('Deportes', 'deportes', 'Centros deportivos con alquiler de canchas e instalaciones', 'Trophy', 1120, true),
('Fitness y Equipos', 'fitness-equipos', 'Gimnasios y centros de entrenamiento con reserva de equipos y espacios', 'Dumbbell', 1130, true),
('Co-working', 'coworking', 'Espacios de trabajo compartido con reserva de escritorios y salas', 'Briefcase', 1140, true),
('Entretenimiento', 'entretenimiento', 'Centros de entretenimiento con reserva de espacios (bowling, estudios, etc)', 'PartyPopper', 1150, true)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 2. Obtener IDs de las categorías principales
-- =====================================================

-- Hotelería - Subcategorías
INSERT INTO public.business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id)
SELECT 'Habitaciones', 'hoteleria-habitaciones', 'Reserva de habitaciones de hotel', 'Hotel', 1101, true, id
FROM business_categories WHERE slug = 'hoteleria'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id)
SELECT 'Hostales', 'hoteleria-hostales', 'Reserva de camas en hostales', 'Home', 1102, true, id
FROM business_categories WHERE slug = 'hoteleria'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id)
SELECT 'Resorts', 'hoteleria-resorts', 'Resorts y complejos vacacionales', 'UmbrellaBench', 1103, true, id
FROM business_categories WHERE slug = 'hoteleria'
ON CONFLICT (slug) DO NOTHING;

-- Gastronomía - Subcategorías
INSERT INTO public.business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id)
SELECT 'Restaurantes', 'gastronomia-restaurantes', 'Restaurantes con reserva de mesas', 'Utensils', 1111, true, id
FROM business_categories WHERE slug = 'gastronomia'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id)
SELECT 'Cafeterías', 'gastronomia-cafeterias', 'Cafés y cafeterías', 'Coffee', 1112, true, id
FROM business_categories WHERE slug = 'gastronomia'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id)
SELECT 'Bares y Discotecas', 'gastronomia-bares', 'Bares, pubs y discotecas', 'Wine', 1113, true, id
FROM business_categories WHERE slug = 'gastronomia'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id)
SELECT 'Salones de Eventos', 'gastronomia-eventos', 'Salones de evento y reception', 'Cake', 1114, true, id
FROM business_categories WHERE slug = 'gastronomia'
ON CONFLICT (slug) DO NOTHING;

-- Deportes - Subcategorías
INSERT INTO public.business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id)
SELECT 'Canchas de Tenis', 'deportes-tenis', 'Canchas de tenis para alquiler', 'Trophy', 1121, true, id
FROM business_categories WHERE slug = 'deportes'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id)
SELECT 'Canchas de Fútbol', 'deportes-futbol', 'Canchas de fútbol y futsal', 'Ball', 1122, true, id
FROM business_categories WHERE slug = 'deportes'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id)
SELECT 'Canchas de Pádel', 'deportes-padel', 'Canchas de pádel y squash', 'Trophy', 1123, true, id
FROM business_categories WHERE slug = 'deportes'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id)
SELECT 'Instalaciones Deportivas', 'deportes-instalaciones', 'Centros deportivos multidisciplinarios', 'Building', 1124, true, id
FROM business_categories WHERE slug = 'deportes'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id)
SELECT 'Piscinas', 'deportes-piscinas', 'Piscinas y complejos acuáticos', 'Droplet', 1125, true, id
FROM business_categories WHERE slug = 'deportes'
ON CONFLICT (slug) DO NOTHING;

-- Fitness y Equipos - Subcategorías
INSERT INTO public.business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id)
SELECT 'Gimnasios', 'fitness-gimnasios', 'Gimnasios con reserva de máquinas y espacios', 'Dumbbell', 1131, true, id
FROM business_categories WHERE slug = 'fitness-equipos'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id)
SELECT 'Centros de Yoga', 'fitness-yoga', 'Centros de yoga y pilates', 'Users', 1132, true, id
FROM business_categories WHERE slug = 'fitness-equipos'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id)
SELECT 'Entrenamiento Personal', 'fitness-entrenamiento', 'Servicios de entrenamiento personal', 'Target', 1133, true, id
FROM business_categories WHERE slug = 'fitness-equipos'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id)
SELECT 'Piscina y Acuática', 'fitness-acuatica', 'Clases acuáticas y piscinas terapéuticas', 'Waves', 1134, true, id
FROM business_categories WHERE slug = 'fitness-equipos'
ON CONFLICT (slug) DO NOTHING;

-- Co-working - Subcategorías
INSERT INTO public.business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id)
SELECT 'Escritorios', 'coworking-escritorios', 'Escritorios individuales en co-working', 'Briefcase', 1141, true, id
FROM business_categories WHERE slug = 'coworking'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id)
SELECT 'Salas de Reuniones', 'coworking-salas', 'Salas de conferencia y reuniones', 'Users', 1142, true, id
FROM business_categories WHERE slug = 'coworking'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id)
SELECT 'Oficinas Privadas', 'coworking-oficinas', 'Oficinas privadas y suites ejecutivas', 'Building', 1143, true, id
FROM business_categories WHERE slug = 'coworking'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id)
SELECT 'Event Spaces', 'coworking-eventos', 'Espacios para eventos y conferencias', 'Presentation', 1144, true, id
FROM business_categories WHERE slug = 'coworking'
ON CONFLICT (slug) DO NOTHING;

-- Entretenimiento - Subcategorías
INSERT INTO public.business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id)
SELECT 'Bowling', 'entretenimiento-bowling', 'Centros de bowling con alquiler de carriles', 'Circle', 1151, true, id
FROM business_categories WHERE slug = 'entretenimiento'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id)
SELECT 'Estudios de Grabación', 'entretenimiento-estudios', 'Estudios de música, fotografía y video', 'Music', 1152, true, id
FROM business_categories WHERE slug = 'entretenimiento'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id)
SELECT 'Cines', 'entretenimiento-cines', 'Cines y salas de cine', 'Film', 1153, true, id
FROM business_categories WHERE slug = 'entretenimiento'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id)
SELECT 'Parques de Diversión', 'entretenimiento-parques', 'Parques temáticos y de diversión', 'Zap', 1154, true, id
FROM business_categories WHERE slug = 'entretenimiento'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id)
SELECT 'Espacios Multiusos', 'entretenimiento-multiusos', 'Espacios para eventos, conciertos, etc', 'Zap', 1155, true, id
FROM business_categories WHERE slug = 'entretenimiento'
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 3. Verificar cantidad de categorías agregadas
-- =====================================================

SELECT 
  COUNT(*) as total_categorias,
  SUM(CASE WHEN parent_id IS NULL THEN 1 ELSE 0 END) as principales,
  SUM(CASE WHEN parent_id IS NOT NULL THEN 1 ELSE 0 END) as subcategorias
FROM business_categories 
WHERE slug IN (
  'hoteleria', 'gastronomia', 'deportes', 'fitness-equipos', 'coworking', 'entretenimiento',
  'hoteleria-habitaciones', 'hoteleria-hostales', 'hoteleria-resorts',
  'gastronomia-restaurantes', 'gastronomia-cafeterias', 'gastronomia-bares', 'gastronomia-eventos',
  'deportes-tenis', 'deportes-futbol', 'deportes-padel', 'deportes-instalaciones', 'deportes-piscinas',
  'fitness-gimnasios', 'fitness-yoga', 'fitness-entrenamiento', 'fitness-acuatica',
  'coworking-escritorios', 'coworking-salas', 'coworking-oficinas', 'coworking-eventos',
  'entretenimiento-bowling', 'entretenimiento-estudios', 'entretenimiento-cines', 'entretenimiento-parques', 'entretenimiento-multiusos'
);
