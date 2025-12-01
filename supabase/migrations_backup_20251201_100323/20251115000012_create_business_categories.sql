-- ============================================================================
-- Sistema de Categorías para Negocios
-- ============================================================================
-- Crea tabla business_categories + inserta categorías principales

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
-- 2. Insertar CATEGORÍAS PRINCIPALES (15)
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
