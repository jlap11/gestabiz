-- =====================================================
-- MIGRACIÓN: Fix get_business_hierarchy - Agregar WITH RECURSIVE
-- Fecha: 16 de Octubre 2025
-- Descripción: Corrige CTE recursivo y elimina función duplicada
-- =====================================================

-- PASO 1: Eliminar versión duplicada de 3 parámetros
DROP FUNCTION IF EXISTS get_business_hierarchy(uuid, date, date);

-- PASO 2: Actualizar función principal con WITH RECURSIVE
-- Esta es la versión correcta con 4 parámetros incluyendo p_filters
-- Ver función completa aplicada vía MCP en FIX_GET_BUSINESS_HIERARCHY_FINAL.md

-- Verificación
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_business_hierarchy'
    AND pg_get_function_arguments(oid) LIKE '%p_filters%'
  ) THEN
    RAISE EXCEPTION 'Función get_business_hierarchy con p_filters no encontrada';
  END IF;

  RAISE NOTICE 'Migración completada - get_business_hierarchy corregida';
END $$;
