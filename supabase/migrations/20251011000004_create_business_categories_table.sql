-- ============================================================================
-- EJECUTAR ESTE SCRIPT EN SUPABASE SQL EDITOR
-- ============================================================================
-- Crea tabla de categorías de negocios y establece relación con businesses

-- =====================================================
-- 1. Crear tabla de categorías
-- =====================================================

CREATE TABLE IF NOT EXISTS public.business_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Información de la categoría
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE, -- Para URLs amigables
  description TEXT,
  icon_name VARCHAR(50), -- Nombre del ícono (lucide-react)
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  sort_order INTEGER DEFAULT 0, -- Para ordenar en el frontend
  
  -- Categoría padre (para subcategorías futuras)
  parent_id UUID REFERENCES public.business_categories(id) ON DELETE SET NULL
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_business_categories_slug ON business_categories(slug);
CREATE INDEX IF NOT EXISTS idx_business_categories_parent_id ON business_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_business_categories_is_active ON business_categories(is_active);

-- Comentarios
COMMENT ON TABLE business_categories IS 'Categorías de negocios para clasificación y filtrado';
COMMENT ON COLUMN business_categories.slug IS 'Identificador único amigable para URLs (ej: salud-medicina)';
COMMENT ON COLUMN business_categories.icon_name IS 'Nombre del ícono de lucide-react (ej: Heart, Scissors, Dumbbell)';
COMMENT ON COLUMN business_categories.sort_order IS 'Orden de visualización en listados (menor = primero)';

-- =====================================================
-- 2. Modificar tabla businesses para usar FK
-- =====================================================

-- Agregar columna category_id (permitir NULL temporalmente para migración)
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.business_categories(id) ON DELETE SET NULL;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_businesses_category_id ON businesses(category_id);

-- Comentario
COMMENT ON COLUMN businesses.category_id IS 'Categoría del negocio (FK a business_categories)';

-- =====================================================
-- 3. Insertar categorías iniciales
-- =====================================================

INSERT INTO public.business_categories (name, slug, description, icon_name, sort_order, is_active) VALUES
-- Salud y Medicina
('Salud y Medicina', 'salud-medicina', 'Servicios médicos, clínicas, consultorios y centros de salud', 'Heart', 10, true),
('Odontología', 'odontologia', 'Clínicas dentales, ortodoncistas, endodoncistas', 'Smile', 20, true),
('Fisioterapia y Rehabilitación', 'fisioterapia-rehabilitacion', 'Terapia física, rehabilitación deportiva, masajes terapéuticos', 'Activity', 30, true),
('Psicología y Salud Mental', 'psicologia-salud-mental', 'Psicólogos, terapeutas, consejeros', 'Brain', 40, true),
('Medicina Alternativa', 'medicina-alternativa', 'Acupuntura, homeopatía, medicina natural', 'Leaf', 50, true),
('Nutrición y Dietética', 'nutricion-dietetica', 'Nutricionistas, dietistas, planes alimenticios', 'Apple', 60, true),

-- Belleza y Estética
('Peluquería y Barbería', 'peluqueria-barberia', 'Cortes de cabello, peinados, tratamientos capilares', 'Scissors', 100, true),
('Centro de Estética', 'centro-estetica', 'Tratamientos faciales, corporales, estética avanzada', 'Sparkles', 110, true),
('Spa y Masajes', 'spa-masajes', 'Spa, masajes relajantes, hidromasajes', 'Waves', 120, true),
('Manicure y Pedicure', 'manicure-pedicure', 'Cuidado de uñas, nail art, tratamientos', 'Hand', 130, true),
('Maquillaje Profesional', 'maquillaje-profesional', 'Maquillaje para eventos, novias, profesional', 'Palette', 140, true),
('Depilación', 'depilacion', 'Depilación láser, cera, métodos definitivos', 'Zap', 150, true),

-- Fitness y Deporte
('Gimnasio', 'gimnasio', 'Centros de entrenamiento, musculación, cardio', 'Dumbbell', 200, true),
('Yoga y Pilates', 'yoga-pilates', 'Clases de yoga, pilates, meditación', 'Users', 210, true),
('Entrenamiento Personal', 'entrenamiento-personal', 'Entrenadores personales, coaching deportivo', 'Target', 220, true),
('Artes Marciales', 'artes-marciales', 'Karate, taekwondo, jiu-jitsu, defensa personal', 'Shield', 230, true),
('Danza y Baile', 'danza-baile', 'Escuelas de danza, baile, coreografía', 'Music', 240, true),
('Natación', 'natacion', 'Clases de natación, escuelas acuáticas', 'Droplet', 250, true),

-- Educación
('Clases Particulares', 'clases-particulares', 'Tutorías, refuerzo escolar, preparación exámenes', 'BookOpen', 300, true),
('Idiomas', 'idiomas', 'Enseñanza de inglés, francés, alemán y otros idiomas', 'Languages', 310, true),
('Música', 'musica', 'Clases de instrumentos, canto, teoría musical', 'Music', 320, true),
('Arte y Dibujo', 'arte-dibujo', 'Clases de pintura, dibujo, escultura', 'Palette', 330, true),
('Informática y Programación', 'informatica-programacion', 'Cursos de programación, diseño web, informática', 'Code', 340, true),
('Preparación Universitaria', 'preparacion-universitaria', 'Preparación para exámenes de admisión, SAT, pruebas', 'GraduationCap', 350, true),

-- Servicios Profesionales
('Abogados', 'abogados', 'Servicios legales, asesoría jurídica, representación', 'Scale', 400, true),
('Contadores', 'contadores', 'Servicios contables, declaraciones, asesoría tributaria', 'Calculator', 410, true),
('Arquitectos', 'arquitectos', 'Diseño arquitectónico, planos, proyectos', 'Home', 420, true),
('Ingenieros', 'ingenieros', 'Servicios de ingeniería civil, eléctrica, sistemas', 'Cpu', 430, true),
('Diseño Gráfico', 'diseno-grafico', 'Diseño de logos, branding, material publicitario', 'Palette', 440, true),
('Fotografía', 'fotografia', 'Fotografía profesional, eventos, productos', 'Camera', 450, true),

-- Consultoría y Coaching
('Coaching Personal', 'coaching-personal', 'Coach de vida, desarrollo personal, motivación', 'User', 500, true),
('Consultoría Empresarial', 'consultoria-empresarial', 'Asesoría de negocios, estrategia, gestión', 'Briefcase', 510, true),
('Asesoría Financiera', 'asesoria-financiera', 'Planificación financiera, inversiones, seguros', 'DollarSign', 520, true),
('Marketing Digital', 'marketing-digital', 'Estrategias de marketing, redes sociales, SEO', 'TrendingUp', 530, true),
('Recursos Humanos', 'recursos-humanos', 'Selección de personal, capacitación, nómina', 'Users', 540, true),

-- Mantenimiento y Reparación
('Taller Mecánico', 'taller-mecanico', 'Reparación de vehículos, mantenimiento automotriz', 'Wrench', 600, true),
('Electricista', 'electricista', 'Instalaciones eléctricas, reparaciones, mantenimiento', 'Zap', 610, true),
('Plomería', 'plomeria', 'Instalaciones sanitarias, reparación de tuberías', 'Droplet', 620, true),
('Carpintería', 'carpinteria', 'Muebles a medida, reparaciones, instalaciones', 'Hammer', 630, true),
('Cerrajería', 'cerrajeria', 'Apertura, cambio de cerraduras, llaves', 'Key', 640, true),
('Jardinería', 'jardineria', 'Mantenimiento de jardines, paisajismo, poda', 'Leaf', 650, true),
('Limpieza', 'limpieza', 'Servicios de limpieza residencial y comercial', 'Sparkles', 660, true),

-- Tecnología
('Reparación de Computadoras', 'reparacion-computadoras', 'Reparación de PC, laptops, mantenimiento', 'Laptop', 700, true),
('Reparación de Celulares', 'reparacion-celulares', 'Reparación de smartphones, tablets, accesorios', 'Smartphone', 710, true),
('Soporte Técnico', 'soporte-tecnico', 'Soporte IT, configuración, redes', 'Settings', 720, true),

-- Alimentación
('Restaurante', 'restaurante', 'Reservas de mesas, eventos, catering', 'Utensils', 800, true),
('Chef a Domicilio', 'chef-domicilio', 'Chef privado, eventos, clases de cocina', 'ChefHat', 810, true),
('Repostería', 'reposteria', 'Pasteles, postres, eventos especiales', 'Cake', 820, true),
('Catering', 'catering', 'Servicios de catering para eventos', 'UtensilsCrossed', 830, true),

-- Entretenimiento y Eventos
('Fotografía de Eventos', 'fotografia-eventos', 'Bodas, cumpleaños, eventos corporativos', 'Camera', 900, true),
('Video y Filmación', 'video-filmacion', 'Video profesional, edición, producción', 'Video', 910, true),
('DJ y Sonido', 'dj-sonido', 'Servicios de DJ, sonido profesional para eventos', 'Disc', 920, true),
('Animación Infantil', 'animacion-infantil', 'Fiestas infantiles, shows, recreación', 'PartyPopper', 930, true),
('Organización de Eventos', 'organizacion-eventos', 'Wedding planner, eventos corporativos', 'Calendar', 940, true),

-- Veterinaria y Mascotas
('Veterinaria', 'veterinaria', 'Consultas veterinarias, vacunación, cirugía', 'PawPrint', 1000, true),
('Peluquería Canina', 'peluqueria-canina', 'Grooming, baño, corte de pelo para mascotas', 'Scissors', 1010, true),
('Adiestramiento', 'adiestramiento', 'Entrenamiento de mascotas, obediencia', 'Dog', 1020, true),
('Hospedaje de Mascotas', 'hospedaje-mascotas', 'Hotel para mascotas, guardería', 'Home', 1030, true),

-- Automotriz
('Lavado de Autos', 'lavado-autos', 'Lavado, encerado, detallado automotriz', 'Car', 1100, true),
('Pintura Automotriz', 'pintura-automotriz', 'Pintura de vehículos, restauración', 'Paintbrush', 1110, true),
('Mecánica Especializada', 'mecanica-especializada', 'Frenos, suspensión, transmisión', 'Cog', 1120, true),

-- Otros
('Otros Servicios', 'otros-servicios', 'Servicios que no encajan en otras categorías', 'MoreHorizontal', 9999, true)

ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 4. Migrar datos existentes (si category es enum)
-- =====================================================

-- Si tenías el enum business_category, mapear valores antiguos a nuevos
DO $$
DECLARE
  cat_id UUID;
BEGIN
  -- Salud
  SELECT id INTO cat_id FROM business_categories WHERE slug = 'salud-medicina';
  UPDATE businesses SET category_id = cat_id WHERE category = 'health';
  
  -- Belleza
  SELECT id INTO cat_id FROM business_categories WHERE slug = 'peluqueria-barberia';
  UPDATE businesses SET category_id = cat_id WHERE category = 'beauty';
  
  -- Fitness
  SELECT id INTO cat_id FROM business_categories WHERE slug = 'gimnasio';
  UPDATE businesses SET category_id = cat_id WHERE category = 'fitness';
  
  -- Educación
  SELECT id INTO cat_id FROM business_categories WHERE slug = 'clases-particulares';
  UPDATE businesses SET category_id = cat_id WHERE category = 'education';
  
  -- Consultoría
  SELECT id INTO cat_id FROM business_categories WHERE slug = 'coaching-personal';
  UPDATE businesses SET category_id = cat_id WHERE category = 'consulting';
  
  -- Profesionales
  SELECT id INTO cat_id FROM business_categories WHERE slug = 'abogados';
  UPDATE businesses SET category_id = cat_id WHERE category = 'professional';
  
  -- Mantenimiento
  SELECT id INTO cat_id FROM business_categories WHERE slug = 'taller-mecanico';
  UPDATE businesses SET category_id = cat_id WHERE category = 'maintenance';
  
  -- Comida
  SELECT id INTO cat_id FROM business_categories WHERE slug = 'restaurante';
  UPDATE businesses SET category_id = cat_id WHERE category = 'food';
  
  -- Entretenimiento
  SELECT id INTO cat_id FROM business_categories WHERE slug = 'fotografia-eventos';
  UPDATE businesses SET category_id = cat_id WHERE category = 'entertainment';
  
  -- Otros
  SELECT id INTO cat_id FROM business_categories WHERE slug = 'otros-servicios';
  UPDATE businesses SET category_id = cat_id WHERE category = 'other';
END $$;

-- =====================================================
-- 5. Eliminar columna antigua category (OPCIONAL)
-- =====================================================

-- DESCOMENTAR ESTAS LÍNEAS DESPUÉS DE VERIFICAR QUE LA MIGRACIÓN FUNCIONÓ
-- ALTER TABLE businesses DROP COLUMN IF EXISTS category;
-- DROP TYPE IF EXISTS business_category;

-- Listo!
SELECT 
  'Tabla business_categories creada con ' || COUNT(*) || ' categorías' as status 
FROM business_categories;
