-- ============================================================================
-- EJECUTAR ESTE SCRIPT EN SUPABASE SQL EDITOR
-- ============================================================================
-- Script limpio para crear solo la tabla de categorías
-- (Evita conflictos con migraciones anteriores ya aplicadas)

-- =====================================================
-- 1. Crear tabla de categorías
-- =====================================================

CREATE TABLE IF NOT EXISTS public.business_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Información de la categoría
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon_name VARCHAR(50),
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  
  -- Categoría padre (para subcategorías futuras)
  parent_id UUID REFERENCES public.business_categories(id) ON DELETE SET NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_business_categories_slug ON business_categories(slug);
CREATE INDEX IF NOT EXISTS idx_business_categories_parent_id ON business_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_business_categories_is_active ON business_categories(is_active);

-- Comentarios
COMMENT ON TABLE business_categories IS 'Categorías de negocios para clasificación y filtrado';

-- =====================================================
-- 2. Agregar columna category_id a businesses (categoría principal)
-- =====================================================

ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.business_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_businesses_category_id ON businesses(category_id);

-- =====================================================
-- 2b. Crear tabla de relación business_subcategories (máximo 3)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.business_subcategories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  subcategory_id UUID NOT NULL REFERENCES public.business_categories(id) ON DELETE CASCADE,
  
  UNIQUE(business_id, subcategory_id)
);

CREATE INDEX IF NOT EXISTS idx_business_subcategories_business_id ON business_subcategories(business_id);
CREATE INDEX IF NOT EXISTS idx_business_subcategories_subcategory_id ON business_subcategories(subcategory_id);

COMMENT ON TABLE business_subcategories IS 'Relación N:M entre negocios y subcategorías (máximo 3 por negocio)';

-- Trigger para validar máximo 3 subcategorías por negocio
CREATE OR REPLACE FUNCTION check_max_subcategories()
RETURNS TRIGGER AS $$
DECLARE
  subcategory_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO subcategory_count
  FROM business_subcategories
  WHERE business_id = NEW.business_id;
  
  IF subcategory_count >= 3 THEN
    RAISE EXCEPTION 'Un negocio puede tener máximo 3 subcategorías';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_check_max_subcategories'
  ) THEN
    CREATE TRIGGER trigger_check_max_subcategories
    BEFORE INSERT ON business_subcategories
    FOR EACH ROW
    EXECUTE FUNCTION check_max_subcategories();
  END IF;
END $$;

-- =====================================================
-- 3. Insertar CATEGORÍAS PRINCIPALES (15)
-- =====================================================

INSERT INTO public.business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id) VALUES
('Salud y Bienestar', 'salud-bienestar', 'Servicios médicos, terapias y cuidado de la salud', 'Heart', 10, true, NULL),
('Belleza y Estética', 'belleza-estetica', 'Cuidado personal, estética y belleza', 'Sparkles', 20, true, NULL),
('Deportes y Fitness', 'deportes-fitness', 'Entrenamiento, gimnasios y actividades deportivas', 'Dumbbell', 30, true, NULL),
('Educación y Formación', 'educacion-formacion', 'Clases, tutorías y cursos', 'BookOpen', 40, true, NULL),
('Servicios Profesionales', 'servicios-profesionales', 'Abogados, contadores, consultores', 'Briefcase', 50, true, NULL),
('Hogar y Reparaciones', 'hogar-reparaciones', 'Mantenimiento, electricidad, plomería', 'Home', 60, true, NULL),
('Automotriz', 'automotriz', 'Mecánica, lavado, pintura de vehículos', 'Car', 70, true, NULL),
('Gastronomía', 'gastronomia', 'Restaurantes, catering, chef a domicilio', 'Utensils', 80, true, NULL),
('Eventos y Entretenimiento', 'eventos-entretenimiento', 'Organización de eventos, fotografía, DJ', 'Calendar', 90, true, NULL),
('Mascotas', 'mascotas', 'Veterinaria, peluquería, adiestramiento', 'PawPrint', 100, true, NULL),
('Tecnología', 'tecnologia', 'Reparación, soporte técnico, desarrollo', 'Laptop', 110, true, NULL),
('Arte y Creatividad', 'arte-creatividad', 'Diseño, música, fotografía, arte', 'Palette', 120, true, NULL),
('Limpieza', 'limpieza', 'Servicios de limpieza residencial y comercial', 'Sparkles', 130, true, NULL),
('Construcción', 'construccion', 'Arquitectura, ingeniería, carpintería', 'HardHat', 140, true, NULL),
('Otros Servicios', 'otros-servicios', 'Servicios que no encajan en otras categorías', 'MoreHorizontal', 9999, true, NULL)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 4. Insertar SUBCATEGORÍAS (máximo 6 por categoría)
-- =====================================================

DO $$
DECLARE
  cat_id UUID;
BEGIN
  -- SALUD Y BIENESTAR (6 subcategorías)
  SELECT id INTO cat_id FROM business_categories WHERE slug = 'salud-bienestar';
  INSERT INTO business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id) VALUES
  ('Medicina General', 'medicina-general', 'Consultas médicas generales', 'Stethoscope', 11, true, cat_id),
  ('Odontología', 'odontologia', 'Clínicas dentales, ortodoncistas', 'Smile', 12, true, cat_id),
  ('Fisioterapia', 'fisioterapia', 'Terapia física y rehabilitación', 'Activity', 13, true, cat_id),
  ('Psicología', 'psicologia', 'Salud mental y terapia', 'Brain', 14, true, cat_id),
  ('Nutrición', 'nutricion', 'Nutricionistas y dietistas', 'Apple', 15, true, cat_id),
  ('Medicina Alternativa', 'medicina-alternativa', 'Acupuntura, homeopatía', 'Leaf', 16, true, cat_id)
  ON CONFLICT (slug) DO NOTHING;

  -- BELLEZA Y ESTÉTICA (6 subcategorías)
  SELECT id INTO cat_id FROM business_categories WHERE slug = 'belleza-estetica';
  INSERT INTO business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id) VALUES
  ('Peluquería y Barbería', 'peluqueria-barberia', 'Cortes de cabello y peinados', 'Scissors', 21, true, cat_id),
  ('Spa y Masajes', 'spa-masajes', 'Spa y masajes relajantes', 'Waves', 22, true, cat_id),
  ('Manicure y Pedicure', 'manicure-pedicure', 'Cuidado de uñas', 'Hand', 23, true, cat_id),
  ('Tratamientos Faciales', 'tratamientos-faciales', 'Tratamientos estéticos faciales', 'Sparkles', 24, true, cat_id),
  ('Maquillaje', 'maquillaje', 'Maquillaje profesional', 'Palette', 25, true, cat_id),
  ('Depilación', 'depilacion', 'Depilación láser y cera', 'Zap', 26, true, cat_id)
  ON CONFLICT (slug) DO NOTHING;

  -- DEPORTES Y FITNESS (6 subcategorías)
  SELECT id INTO cat_id FROM business_categories WHERE slug = 'deportes-fitness';
  INSERT INTO business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id) VALUES
  ('Gimnasio', 'gimnasio', 'Centros de entrenamiento', 'Dumbbell', 31, true, cat_id),
  ('Entrenamiento Personal', 'entrenamiento-personal', 'Entrenadores personales', 'Target', 32, true, cat_id),
  ('Yoga y Pilates', 'yoga-pilates', 'Clases de yoga y pilates', 'Users', 33, true, cat_id),
  ('Artes Marciales', 'artes-marciales', 'Karate, taekwondo, jiu-jitsu', 'Shield', 34, true, cat_id),
  ('Natación', 'natacion', 'Clases de natación', 'Droplet', 35, true, cat_id),
  ('Danza', 'danza', 'Escuelas de baile y danza', 'Music', 36, true, cat_id)
  ON CONFLICT (slug) DO NOTHING;

  -- EDUCACIÓN Y FORMACIÓN (6 subcategorías)
  SELECT id INTO cat_id FROM business_categories WHERE slug = 'educacion-formacion';
  INSERT INTO business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id) VALUES
  ('Clases Particulares', 'clases-particulares', 'Tutorías y refuerzo escolar', 'BookOpen', 41, true, cat_id),
  ('Idiomas', 'idiomas', 'Enseñanza de idiomas', 'Languages', 42, true, cat_id),
  ('Música', 'musica', 'Clases de instrumentos', 'Music', 43, true, cat_id),
  ('Informática', 'informatica', 'Cursos de programación', 'Code', 44, true, cat_id),
  ('Arte y Dibujo', 'arte-dibujo', 'Clases de arte', 'Palette', 45, true, cat_id),
  ('Preparación Universitaria', 'preparacion-universitaria', 'Preparación para exámenes', 'GraduationCap', 46, true, cat_id)
  ON CONFLICT (slug) DO NOTHING;

  -- SERVICIOS PROFESIONALES (6 subcategorías)
  SELECT id INTO cat_id FROM business_categories WHERE slug = 'servicios-profesionales';
  INSERT INTO business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id) VALUES
  ('Abogados', 'abogados', 'Servicios legales', 'Scale', 51, true, cat_id),
  ('Contadores', 'contadores', 'Servicios contables', 'Calculator', 52, true, cat_id),
  ('Consultoría', 'consultoria', 'Asesoría empresarial', 'Briefcase', 53, true, cat_id),
  ('Coaching', 'coaching', 'Coach personal y profesional', 'User', 54, true, cat_id),
  ('Marketing Digital', 'marketing-digital', 'Estrategias de marketing', 'TrendingUp', 55, true, cat_id),
  ('Recursos Humanos', 'recursos-humanos', 'Selección de personal', 'Users', 56, true, cat_id)
  ON CONFLICT (slug) DO NOTHING;

  -- HOGAR Y REPARACIONES (6 subcategorías)
  SELECT id INTO cat_id FROM business_categories WHERE slug = 'hogar-reparaciones';
  INSERT INTO business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id) VALUES
  ('Electricista', 'electricista', 'Instalaciones eléctricas', 'Zap', 61, true, cat_id),
  ('Plomería', 'plomeria', 'Instalaciones sanitarias', 'Droplet', 62, true, cat_id),
  ('Carpintería', 'carpinteria', 'Muebles a medida', 'Hammer', 63, true, cat_id),
  ('Jardinería', 'jardineria', 'Mantenimiento de jardines', 'Leaf', 64, true, cat_id),
  ('Cerrajería', 'cerrajeria', 'Apertura de cerraduras', 'Key', 65, true, cat_id),
  ('Pintura', 'pintura', 'Pintura de interiores', 'Paintbrush', 66, true, cat_id)
  ON CONFLICT (slug) DO NOTHING;

  -- AUTOMOTRIZ (4 subcategorías)
  SELECT id INTO cat_id FROM business_categories WHERE slug = 'automotriz';
  INSERT INTO business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id) VALUES
  ('Taller Mecánico', 'taller-mecanico', 'Reparación de vehículos', 'Wrench', 71, true, cat_id),
  ('Lavado de Autos', 'lavado-autos', 'Lavado y detallado', 'Car', 72, true, cat_id),
  ('Pintura Automotriz', 'pintura-automotriz', 'Pintura de vehículos', 'Paintbrush', 73, true, cat_id),
  ('Mecánica Especializada', 'mecanica-especializada', 'Frenos, suspensión', 'Cog', 74, true, cat_id)
  ON CONFLICT (slug) DO NOTHING;

  -- GASTRONOMÍA (4 subcategorías)
  SELECT id INTO cat_id FROM business_categories WHERE slug = 'gastronomia';
  INSERT INTO business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id) VALUES
  ('Restaurante', 'restaurante', 'Reservas de mesas', 'Utensils', 81, true, cat_id),
  ('Catering', 'catering', 'Servicios de catering', 'UtensilsCrossed', 82, true, cat_id),
  ('Chef a Domicilio', 'chef-domicilio', 'Chef privado', 'ChefHat', 83, true, cat_id),
  ('Repostería', 'reposteria', 'Pasteles y postres', 'Cake', 84, true, cat_id)
  ON CONFLICT (slug) DO NOTHING;

  -- EVENTOS Y ENTRETENIMIENTO (5 subcategorías)
  SELECT id INTO cat_id FROM business_categories WHERE slug = 'eventos-entretenimiento';
  INSERT INTO business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id) VALUES
  ('Organización de Eventos', 'organizacion-eventos', 'Wedding planner', 'Calendar', 91, true, cat_id),
  ('Fotografía', 'fotografia', 'Fotografía profesional', 'Camera', 92, true, cat_id),
  ('Video y Filmación', 'video-filmacion', 'Video profesional', 'Video', 93, true, cat_id),
  ('DJ y Sonido', 'dj-sonido', 'Servicios de DJ', 'Disc', 94, true, cat_id),
  ('Animación Infantil', 'animacion-infantil', 'Fiestas infantiles', 'PartyPopper', 95, true, cat_id)
  ON CONFLICT (slug) DO NOTHING;

  -- MASCOTAS (4 subcategorías)
  SELECT id INTO cat_id FROM business_categories WHERE slug = 'mascotas';
  INSERT INTO business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id) VALUES
  ('Veterinaria', 'veterinaria', 'Consultas veterinarias', 'PawPrint', 101, true, cat_id),
  ('Peluquería Canina', 'peluqueria-canina', 'Grooming para mascotas', 'Scissors', 102, true, cat_id),
  ('Adiestramiento', 'adiestramiento', 'Entrenamiento de mascotas', 'Dog', 103, true, cat_id),
  ('Hospedaje', 'hospedaje-mascotas', 'Hotel para mascotas', 'Home', 104, true, cat_id)
  ON CONFLICT (slug) DO NOTHING;

  -- TECNOLOGÍA (4 subcategorías)
  SELECT id INTO cat_id FROM business_categories WHERE slug = 'tecnologia';
  INSERT INTO business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id) VALUES
  ('Reparación de Computadoras', 'reparacion-computadoras', 'Reparación de PC', 'Laptop', 111, true, cat_id),
  ('Reparación de Celulares', 'reparacion-celulares', 'Reparación de smartphones', 'Smartphone', 112, true, cat_id),
  ('Soporte Técnico', 'soporte-tecnico', 'Soporte IT', 'Settings', 113, true, cat_id),
  ('Desarrollo Web', 'desarrollo-web', 'Diseño y desarrollo web', 'Code', 114, true, cat_id)
  ON CONFLICT (slug) DO NOTHING;

  -- ARTE Y CREATIVIDAD (3 subcategorías)
  SELECT id INTO cat_id FROM business_categories WHERE slug = 'arte-creatividad';
  INSERT INTO business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id) VALUES
  ('Diseño Gráfico', 'diseno-grafico', 'Diseño de logos y branding', 'Palette', 121, true, cat_id),
  ('Fotografía Artística', 'fotografia-artistica', 'Fotografía profesional', 'Camera', 122, true, cat_id),
  ('Arte y Pintura', 'arte-pintura', 'Clases de arte', 'Paintbrush', 123, true, cat_id)
  ON CONFLICT (slug) DO NOTHING;

  -- CONSTRUCCIÓN (3 subcategorías)
  SELECT id INTO cat_id FROM business_categories WHERE slug = 'construccion';
  INSERT INTO business_categories (name, slug, description, icon_name, sort_order, is_active, parent_id) VALUES
  ('Arquitectos', 'arquitectos', 'Diseño arquitectónico', 'Home', 141, true, cat_id),
  ('Ingenieros', 'ingenieros', 'Servicios de ingeniería', 'Cpu', 142, true, cat_id),
  ('Construcción General', 'construccion-general', 'Construcción y remodelación', 'HardHat', 143, true, cat_id)
  ON CONFLICT (slug) DO NOTHING;
END $$;

-- =====================================================
-- 5. Migrar datos existentes (si hay)
-- =====================================================

DO $$
DECLARE
  cat_id UUID;
BEGIN
  -- Solo si la columna category existe todavía
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'category'
  ) THEN
    -- Mapeo de categorías antiguas a CATEGORÍAS PRINCIPALES nuevas
    
    -- Salud -> Salud y Bienestar
    SELECT id INTO cat_id FROM business_categories WHERE slug = 'salud-bienestar';
    UPDATE businesses SET category_id = cat_id WHERE category = 'health' AND category_id IS NULL;
    
    -- Belleza -> Belleza y Estética
    SELECT id INTO cat_id FROM business_categories WHERE slug = 'belleza-estetica';
    UPDATE businesses SET category_id = cat_id WHERE category = 'beauty' AND category_id IS NULL;
    
    -- Fitness -> Deportes y Fitness
    SELECT id INTO cat_id FROM business_categories WHERE slug = 'deportes-fitness';
    UPDATE businesses SET category_id = cat_id WHERE category = 'fitness' AND category_id IS NULL;
    
    -- Educación -> Educación y Formación
    SELECT id INTO cat_id FROM business_categories WHERE slug = 'educacion-formacion';
    UPDATE businesses SET category_id = cat_id WHERE category = 'education' AND category_id IS NULL;
    
    -- Consultoría -> Servicios Profesionales
    SELECT id INTO cat_id FROM business_categories WHERE slug = 'servicios-profesionales';
    UPDATE businesses SET category_id = cat_id WHERE category IN ('consulting', 'professional') AND category_id IS NULL;
    
    -- Mantenimiento -> Hogar y Reparaciones
    SELECT id INTO cat_id FROM business_categories WHERE slug = 'hogar-reparaciones';
    UPDATE businesses SET category_id = cat_id WHERE category = 'maintenance' AND category_id IS NULL;
    
    -- Comida -> Gastronomía
    SELECT id INTO cat_id FROM business_categories WHERE slug = 'gastronomia';
    UPDATE businesses SET category_id = cat_id WHERE category = 'food' AND category_id IS NULL;
    
    -- Entretenimiento -> Eventos y Entretenimiento
    SELECT id INTO cat_id FROM business_categories WHERE slug = 'eventos-entretenimiento';
    UPDATE businesses SET category_id = cat_id WHERE category = 'entertainment' AND category_id IS NULL;
    
    -- Otros
    SELECT id INTO cat_id FROM business_categories WHERE slug = 'otros-servicios';
    UPDATE businesses SET category_id = cat_id WHERE category = 'other' AND category_id IS NULL;
  END IF;
END $$;

-- =====================================================
-- 6. Habilitar RLS
-- =====================================================

-- RLS en business_categories
ALTER TABLE business_categories ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'business_categories' 
    AND policyname = 'Allow public read access to active categories'
  ) THEN
    CREATE POLICY "Allow public read access to active categories"
    ON business_categories FOR SELECT
    USING (is_active = true);
  END IF;
END $$;

-- RLS en business_subcategories
ALTER TABLE business_subcategories ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'business_subcategories' 
    AND policyname = 'Allow public read access to business subcategories'
  ) THEN
    CREATE POLICY "Allow public read access to business subcategories"
    ON business_subcategories FOR SELECT
    USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'business_subcategories' 
    AND policyname = 'Allow business owners to manage subcategories'
  ) THEN
    CREATE POLICY "Allow business owners to manage subcategories"
    ON business_subcategories FOR ALL
    USING (
      business_id IN (
        SELECT id FROM businesses WHERE owner_id = auth.uid()
      )
    );
  END IF;
END $$;

-- =====================================================
-- Verificación
-- =====================================================

-- Contar categorías principales
SELECT 
  'Categorías principales: ' || COUNT(*) as status 
FROM business_categories 
WHERE parent_id IS NULL;

-- Contar subcategorías
SELECT 
  'Subcategorías totales: ' || COUNT(*) as status 
FROM business_categories 
WHERE parent_id IS NOT NULL;

-- Mostrar estructura: categorías con sus subcategorías
SELECT 
  c.name as categoria,
  COUNT(s.id) as num_subcategorias
FROM business_categories c
LEFT JOIN business_categories s ON s.parent_id = c.id
WHERE c.parent_id IS NULL
GROUP BY c.name, c.sort_order
ORDER BY c.sort_order;

-- Mostrar algunas categorías principales
SELECT name, slug, icon_name, sort_order 
FROM business_categories 
WHERE parent_id IS NULL
ORDER BY sort_order 
LIMIT 10;
