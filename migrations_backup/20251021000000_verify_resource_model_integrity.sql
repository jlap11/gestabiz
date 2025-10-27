-- =====================================================
-- MIGRACIÓN: Verificación y Actualización de resource_model
-- Fecha: 21 de Octubre de 2025
-- Descripción: Script para verificar integridad de datos del sistema
--              de modelo de negocio flexible y actualizar negocios existentes
-- =====================================================

-- =====================================================
-- PARTE 1: VERIFICACIÓN DE INTEGRIDAD
-- =====================================================

-- 1. Verificar que todos los negocios tengan resource_model definido
-- Si no tienen, establecer 'professional' como default (retrocompatibilidad)
UPDATE businesses
SET resource_model = 'professional'
WHERE resource_model IS NULL;

-- 2. Verificar que appointments con resource_id tengan employee_id NULL
-- (CHECK constraint debe estar activo, pero validamos por seguridad)
DO $$
DECLARE
  invalid_appointments INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO invalid_appointments
  FROM appointments
  WHERE resource_id IS NOT NULL
    AND employee_id IS NOT NULL;

  IF invalid_appointments > 0 THEN
    RAISE WARNING 'Se encontraron % appointments con employee_id Y resource_id simultáneamente (viola CHECK constraint)', invalid_appointments;
    
    -- Opción: Comentar siguiente línea si prefieres corrección manual
    -- UPDATE appointments SET employee_id = NULL WHERE resource_id IS NOT NULL AND employee_id IS NOT NULL;
  ELSE
    RAISE NOTICE '✓ Todos los appointments cumplen el CHECK constraint (employee_id XOR resource_id)';
  END IF;
END $$;

-- 3. Verificar que todos los resource_id apunten a recursos existentes
DO $$
DECLARE
  orphan_appointments INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO orphan_appointments
  FROM appointments a
  WHERE a.resource_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM business_resources br
      WHERE br.id = a.resource_id
    );

  IF orphan_appointments > 0 THEN
    RAISE WARNING 'Se encontraron % appointments con resource_id que no existe en business_resources', orphan_appointments;
    
    -- Listar IDs de appointments huérfanos (para debugging)
    RAISE NOTICE 'IDs de appointments huérfanos:';
    FOR rec IN 
      SELECT a.id, a.resource_id
      FROM appointments a
      WHERE a.resource_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM business_resources br
          WHERE br.id = a.resource_id
        )
      LIMIT 10
    LOOP
      RAISE NOTICE '  - Appointment: %, Resource ID: %', rec.id, rec.resource_id;
    END LOOP;
  ELSE
    RAISE NOTICE '✓ Todos los appointments con resource_id apuntan a recursos válidos';
  END IF;
END $$;

-- 4. Verificar que todos los recursos tengan location_id válido
DO $$
DECLARE
  orphan_resources INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO orphan_resources
  FROM business_resources br
  WHERE br.location_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM locations l
      WHERE l.id = br.location_id
    );

  IF orphan_resources > 0 THEN
    RAISE WARNING 'Se encontraron % recursos con location_id que no existe en locations', orphan_resources;
  ELSE
    RAISE NOTICE '✓ Todos los recursos tienen location_id válidos';
  END IF;
END $$;

-- =====================================================
-- PARTE 2: ESTADÍSTICAS DEL SISTEMA
-- =====================================================

-- Mostrar estadísticas de uso del sistema
DO $$
DECLARE
  total_businesses INTEGER;
  professional_businesses INTEGER;
  resource_businesses INTEGER;
  hybrid_businesses INTEGER;
  group_class_businesses INTEGER;
  total_resources INTEGER;
  total_appointments_employee INTEGER;
  total_appointments_resource INTEGER;
BEGIN
  -- Contar negocios por tipo
  SELECT COUNT(*) INTO total_businesses FROM businesses;
  SELECT COUNT(*) INTO professional_businesses FROM businesses WHERE resource_model = 'professional';
  SELECT COUNT(*) INTO resource_businesses FROM businesses WHERE resource_model = 'physical_resource';
  SELECT COUNT(*) INTO hybrid_businesses FROM businesses WHERE resource_model = 'hybrid';
  SELECT COUNT(*) INTO group_class_businesses FROM businesses WHERE resource_model = 'group_class';
  
  -- Contar recursos
  SELECT COUNT(*) INTO total_resources FROM business_resources WHERE is_active = true;
  
  -- Contar appointments por tipo
  SELECT COUNT(*) INTO total_appointments_employee FROM appointments WHERE employee_id IS NOT NULL;
  SELECT COUNT(*) INTO total_appointments_resource FROM appointments WHERE resource_id IS NOT NULL;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ESTADÍSTICAS DEL SISTEMA';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total de Negocios: %', total_businesses;
  RAISE NOTICE '  - Profesionales: % (%.1f%%)', professional_businesses, (professional_businesses::float / NULLIF(total_businesses, 0) * 100);
  RAISE NOTICE '  - Recursos Físicos: % (%.1f%%)', resource_businesses, (resource_businesses::float / NULLIF(total_businesses, 0) * 100);
  RAISE NOTICE '  - Híbridos: % (%.1f%%)', hybrid_businesses, (hybrid_businesses::float / NULLIF(total_businesses, 0) * 100);
  RAISE NOTICE '  - Clases Grupales: % (%.1f%%)', group_class_businesses, (group_class_businesses::float / NULLIF(total_businesses, 0) * 100);
  RAISE NOTICE '';
  RAISE NOTICE 'Recursos Físicos Activos: %', total_resources;
  RAISE NOTICE '';
  RAISE NOTICE 'Appointments:';
  RAISE NOTICE '  - Con Empleado: %', total_appointments_employee;
  RAISE NOTICE '  - Con Recurso: %', total_appointments_resource;
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- PARTE 3: ÍNDICES ADICIONALES (Si no existen)
-- =====================================================

-- Índice para búsquedas de appointments por resource_id
CREATE INDEX IF NOT EXISTS idx_appointments_resource_id 
ON appointments(resource_id) 
WHERE resource_id IS NOT NULL;

-- Índice para búsquedas de recursos por business y tipo
CREATE INDEX IF NOT EXISTS idx_business_resources_business_type 
ON business_resources(business_id, resource_type) 
WHERE is_active = true;

-- Índice para búsquedas de recursos por location
CREATE INDEX IF NOT EXISTS idx_business_resources_location 
ON business_resources(location_id) 
WHERE location_id IS NOT NULL AND is_active = true;

-- =====================================================
-- PARTE 4: COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================

COMMENT ON COLUMN businesses.resource_model IS 
'Modelo de negocio: professional (empleados), physical_resource (recursos), hybrid (ambos), group_class (clases grupales)';

COMMENT ON TABLE business_resources IS 
'Recursos físicos del negocio (habitaciones, mesas, canchas, etc.). Alternativa a business_employees para modelos basados en recursos.';

COMMENT ON COLUMN appointments.resource_id IS 
'Recurso físico reservado (XOR con employee_id). Solo uno puede estar presente por CHECK constraint.';

COMMENT ON COLUMN appointments.employee_id IS 
'Empleado asignado (XOR con resource_id). Solo uno puede estar presente por CHECK constraint.';

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
-- Para aplicar: npx supabase db push
-- Para revertir: No reversible (solo actualiza datos, no elimina)
