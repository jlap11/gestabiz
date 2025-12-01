-- Migration: Add service category to get_client_dashboard_data RPC
-- Date: 2025-11-27
-- Description: Agrega el campo 'category' de services a las citas en el dashboard
-- NOTA: Esta migración es un placeholder temporal para permitir el push sin conflictos
-- La funcionalidad real se implementará vía normalización en TypeScript

-- Por ahora, solo verificamos que la columna category existe en services
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'services' 
      AND column_name = 'category'
  ) THEN
    RAISE NOTICE 'services.category column exists - category filtering ready';
  ELSE
    RAISE NOTICE 'services.category column NOT found - category filtering disabled';
  END IF;
END $$;

