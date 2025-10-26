-- =====================================================
-- SISTEMA DE FAVORITOS DE NEGOCIOS
-- Migración: 20250120000000_business_favorites_system.sql
-- Descripción: Sistema para que usuarios marquen negocios
-- como favoritos y accedan rápidamente desde sidebar
-- =====================================================

-- 1. Crear tabla de favoritos
-- =====================================================
CREATE TABLE IF NOT EXISTS business_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraint: Un usuario no puede marcar el mismo negocio como favorito dos veces
  CONSTRAINT unique_user_business_favorite UNIQUE (user_id, business_id)
);

-- 2. Índices para optimizar búsquedas
-- =====================================================
CREATE INDEX idx_business_favorites_user_id ON business_favorites(user_id);
CREATE INDEX idx_business_favorites_business_id ON business_favorites(business_id);
CREATE INDEX idx_business_favorites_created_at ON business_favorites(created_at DESC);

-- Índice compuesto para verificar rápidamente si un negocio es favorito
CREATE INDEX idx_business_favorites_user_business ON business_favorites(user_id, business_id);

-- 3. RLS (Row Level Security) Policies
-- =====================================================
ALTER TABLE business_favorites ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propios favoritos
CREATE POLICY "Users can view their own favorites"
  ON business_favorites
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar sus propios favoritos
CREATE POLICY "Users can insert their own favorites"
  ON business_favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar sus propios favoritos
CREATE POLICY "Users can delete their own favorites"
  ON business_favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Función RPC para toggle de favoritos
-- =====================================================
CREATE OR REPLACE FUNCTION toggle_business_favorite(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_exists BOOLEAN;
BEGIN
  -- Verificar si ya existe
  SELECT EXISTS(
    SELECT 1 FROM business_favorites
    WHERE user_id = v_user_id AND business_id = p_business_id
  ) INTO v_exists;

  IF v_exists THEN
    -- Si existe, eliminar (desmarcar favorito)
    DELETE FROM business_favorites
    WHERE user_id = v_user_id AND business_id = p_business_id;
    RETURN FALSE; -- Retorna FALSE = ya no es favorito
  ELSE
    -- Si no existe, insertar (marcar favorito)
    INSERT INTO business_favorites (user_id, business_id)
    VALUES (v_user_id, p_business_id);
    RETURN TRUE; -- Retorna TRUE = ahora es favorito
  END IF;
END;
$$;

-- 5. Función RPC para verificar si es favorito
-- =====================================================
CREATE OR REPLACE FUNCTION is_business_favorite(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM business_favorites
    WHERE user_id = v_user_id AND business_id = p_business_id
  );
END;
$$;

-- 6. Función RPC para obtener favoritos con info del negocio
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_favorite_businesses()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  logo_url TEXT,
  address TEXT,
  city TEXT,
  phone TEXT,
  average_rating DECIMAL(3,2),
  review_count BIGINT,
  is_active BOOLEAN,
  favorited_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.description,
    b.logo_url,
    b.address,
    b.city,
    b.phone,
    COALESCE(brs.average_rating, 0)::DECIMAL(3,2) AS average_rating,
    COALESCE(brs.review_count, 0)::BIGINT AS review_count,
    b.is_active,
    bf.created_at AS favorited_at
  FROM business_favorites bf
  INNER JOIN businesses b ON bf.business_id = b.id
  LEFT JOIN business_ratings_stats brs ON b.id = brs.business_id
  WHERE bf.user_id = v_user_id
  ORDER BY bf.created_at DESC;
END;
$$;

-- 7. Comentarios para documentación
-- =====================================================
COMMENT ON TABLE business_favorites IS 'Almacena los negocios marcados como favoritos por cada usuario';
COMMENT ON COLUMN business_favorites.user_id IS 'ID del usuario que marcó el favorito';
COMMENT ON COLUMN business_favorites.business_id IS 'ID del negocio marcado como favorito';
COMMENT ON COLUMN business_favorites.created_at IS 'Fecha cuando se marcó como favorito';

COMMENT ON FUNCTION toggle_business_favorite IS 'Toggle favorito: agrega si no existe, elimina si existe. Retorna TRUE si se agregó, FALSE si se eliminó';
COMMENT ON FUNCTION is_business_favorite IS 'Verifica si un negocio es favorito del usuario actual';
COMMENT ON FUNCTION get_user_favorite_businesses IS 'Obtiene todos los negocios favoritos del usuario con información completa';
