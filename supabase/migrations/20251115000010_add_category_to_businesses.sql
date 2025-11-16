-- ============================================================================
-- Agregar columna category_id a businesses (si no existe)
-- ============================================================================
-- Esta columna referencia a business_categories (tabla creada previamente)
-- Permite clasificar negocios por categoría principal

DO $$ 
BEGIN
  -- Agregar category_id si no existe
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'businesses' 
    AND column_name = 'category_id'
  ) THEN
    ALTER TABLE public.businesses
    ADD COLUMN category_id UUID REFERENCES public.business_categories(id) ON DELETE SET NULL;
    
    CREATE INDEX idx_businesses_category_id ON public.businesses(category_id);
    
    RAISE NOTICE 'Columna category_id agregada a businesses';
  ELSE
    RAISE NOTICE 'Columna category_id ya existe en businesses';
  END IF;
END $$;

-- Comentario
COMMENT ON COLUMN public.businesses.category_id IS 'Categoría principal del negocio (referencia a business_categories)';
