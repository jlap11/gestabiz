-- ============================================================================
-- MIGRACIÓN: Agregar campos para perfiles públicos de negocios
-- Fecha: 2025-10-17
-- Descripción: Añade campos slug, meta tags y SEO a tabla businesses
-- ============================================================================

-- 1. Agregar nuevas columnas a tabla businesses
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS meta_keywords TEXT[],
  ADD COLUMN IF NOT EXISTS og_image_url TEXT,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;

-- 2. Crear función auxiliar para generar slug único
CREATE OR REPLACE FUNCTION generate_unique_slug(business_name TEXT, business_city TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Normalizar y crear slug base
  base_slug := lower(
    regexp_replace(
      unaccent(business_name || '-' || COALESCE(business_city, '')),
      '[^a-z0-9]+',
      '-',
      'g'
    )
  );
  
  -- Remover guiones al inicio y final
  base_slug := trim(both '-' from base_slug);
  
  -- Limitar a 80 caracteres
  base_slug := substring(base_slug from 1 for 80);
  
  final_slug := base_slug;
  
  -- Verificar unicidad y agregar sufijo si es necesario
  WHILE EXISTS (SELECT 1 FROM businesses WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- 3. Generar slugs para negocios existentes
UPDATE businesses
SET slug = generate_unique_slug(name, city)
WHERE slug IS NULL;

-- 4. Hacer slug NOT NULL y UNIQUE después de poblar
ALTER TABLE businesses
  ALTER COLUMN slug SET NOT NULL,
  ADD CONSTRAINT businesses_slug_unique UNIQUE (slug);

-- 5. Crear índice para búsqueda rápida por slug
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);

-- 6. Crear índice para filtrar negocios públicos activos
CREATE INDEX IF NOT EXISTS idx_businesses_public_active 
ON businesses(is_public, is_active) 
WHERE is_public = TRUE AND is_active = TRUE;

-- 7. Crear vista materializada para perfiles públicos (optimización)
CREATE MATERIALIZED VIEW IF NOT EXISTS public_business_profiles AS
SELECT 
  b.id,
  b.slug,
  b.name,
  b.description,
  b.phone,
  b.email,
  b.website,
  b.logo_url,
  b.banner_url,
  b.category_id,
  b.city,
  b.state,
  b.country,
  b.latitude,
  b.longitude,
  b.meta_title,
  b.meta_description,
  b.meta_keywords,
  b.og_image_url,
  b.created_at,
  b.updated_at,
  
  -- Categoría principal
  cat.name as category_name,
  cat.slug as category_slug,
  cat.icon_name as category_icon,
  
  -- Stats agregados de vistas materializadas existentes
  COALESCE(brs.average_rating, 0) as average_rating,
  COALESCE(brs.review_count, 0) as review_count,
  
  -- Contar sedes y servicios activos
  (SELECT COUNT(*) FROM locations l WHERE l.business_id = b.id AND l.is_active = TRUE) as location_count,
  (SELECT COUNT(*) FROM services s WHERE s.business_id = b.id AND s.is_active = TRUE) as service_count,
  
  -- Subcategorías (hasta 3)
  ARRAY(
    SELECT bc2.name 
    FROM business_subcategories bs
    JOIN business_categories bc2 ON bc2.id = bs.subcategory_id
    WHERE bs.business_id = b.id
    LIMIT 3
  ) as subcategories
  
FROM businesses b
LEFT JOIN business_categories cat ON cat.id = b.category_id
LEFT JOIN business_ratings_stats brs ON brs.business_id = b.id
WHERE b.is_public = TRUE 
  AND b.is_active = TRUE;

-- 8. Crear índice en vista materializada
CREATE UNIQUE INDEX IF NOT EXISTS idx_public_business_profiles_id 
ON public_business_profiles(id);

CREATE INDEX IF NOT EXISTS idx_public_business_profiles_slug 
ON public_business_profiles(slug);

-- 9. Función para refrescar vista materializada de perfiles públicos
CREATE OR REPLACE FUNCTION refresh_public_business_profiles()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public_business_profiles;
END;
$$ LANGUAGE plpgsql;

-- 10. Comentarios descriptivos
COMMENT ON COLUMN businesses.slug IS 'URL-friendly unique identifier para perfiles públicos (e.g., salon-belleza-medellin)';
COMMENT ON COLUMN businesses.meta_title IS 'Título SEO personalizado (max 60 caracteres)';
COMMENT ON COLUMN businesses.meta_description IS 'Descripción SEO personalizada (max 160 caracteres)';
COMMENT ON COLUMN businesses.meta_keywords IS 'Keywords para SEO (array de strings)';
COMMENT ON COLUMN businesses.og_image_url IS 'URL de imagen para Open Graph/social sharing';
COMMENT ON COLUMN businesses.is_public IS 'Si FALSE, el negocio no aparece en perfiles públicos';

COMMENT ON MATERIALIZED VIEW public_business_profiles IS 
'Vista optimizada para perfiles públicos con datos agregados. Refrescar cada 10 min.';

COMMENT ON FUNCTION generate_unique_slug(TEXT, TEXT) IS 
'Genera slug único URL-friendly a partir de nombre y ciudad del negocio';

COMMENT ON FUNCTION refresh_public_business_profiles() IS 
'Refresca vista materializada de perfiles públicos (llamar desde Edge Function cron)';

-- 11. Ejecutar refresco inicial
SELECT refresh_public_business_profiles();

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
