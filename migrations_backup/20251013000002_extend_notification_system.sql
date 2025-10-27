-- ============================================================================
-- EXTENSIÓN: Sistema de Notificaciones - Agregar Soporte In-App
-- Fecha: 2025-10-13
-- Descripción: Extiende sistema existente para incluir notificaciones in-app
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. AGREGAR 'in_app' A ENUM notification_channel
-- ============================================================================

DO $$ 
BEGIN
  -- Solo agregar si no existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'in_app' 
    AND enumtypid = 'notification_channel'::regtype
  ) THEN
    EXECUTE 'ALTER TYPE notification_channel ADD VALUE ''in_app''';
    RAISE NOTICE '✅ Agregado valor ''in_app'' a enum notification_channel';
  ELSE
    RAISE NOTICE 'ℹ️  Valor ''in_app'' ya existe en notification_channel';
  END IF;
END $$;

-- ============================================================================
-- 2. AGREGAR in_app_enabled A user_notification_preferences
-- ============================================================================

ALTER TABLE user_notification_preferences 
ADD COLUMN IF NOT EXISTS in_app_enabled BOOLEAN DEFAULT TRUE NOT NULL;

COMMENT ON COLUMN user_notification_preferences.in_app_enabled IS 
  'Habilita/deshabilita notificaciones in-app para este usuario';

RAISE NOTICE '✅ Columna in_app_enabled agregada a user_notification_preferences';

-- ============================================================================
-- 3. ACTUALIZAR notification_types EN business_notification_settings
-- ============================================================================

-- Función helper para actualizar JSONB
CREATE OR REPLACE FUNCTION add_in_app_to_notification_types()
RETURNS VOID AS $$
DECLARE
  r RECORD;
  current_types JSONB;
  type_key TEXT;
  type_config JSONB;
  updated_channels JSONB;
  updated_count INTEGER := 0;
BEGIN
  FOR r IN SELECT id, notification_types FROM business_notification_settings
  LOOP
    current_types := r.notification_types;
    
    -- Iterar sobre cada tipo de notificación
    FOR type_key IN SELECT jsonb_object_keys(current_types)
    LOOP
      type_config := current_types->type_key;
      
      -- Solo actualizar si tiene campo 'channels' y es array
      IF type_config ? 'channels' AND jsonb_typeof(type_config->'channels') = 'array' THEN
        updated_channels := type_config->'channels';
        
        -- Agregar 'in_app' si no existe
        IF NOT (updated_channels @> '"in_app"'::jsonb) THEN
          updated_channels := updated_channels || '"in_app"'::jsonb;
          
          -- Actualizar el tipo con los nuevos canales
          current_types := jsonb_set(
            current_types,
            ARRAY[type_key, 'channels'],
            updated_channels
          );
        END IF;
      END IF;
    END LOOP;
    
    -- Actualizar el registro si hubo cambios
    IF current_types != r.notification_types THEN
      UPDATE business_notification_settings
      SET notification_types = current_types,
          updated_at = NOW()
      WHERE id = r.id;
      
      updated_count := updated_count + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Agregado canal in_app a % registros de business_notification_settings', updated_count;
END;
$$ LANGUAGE plpgsql;

-- Ejecutar la actualización
SELECT add_in_app_to_notification_types();

-- Limpiar función helper
DROP FUNCTION add_in_app_to_notification_types();

-- ============================================================================
-- 4. ÍNDICE ADICIONAL (Opcional pero recomendado)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_notif_prefs_in_app_enabled 
  ON user_notification_preferences(in_app_enabled) 
  WHERE in_app_enabled = TRUE;

COMMENT ON INDEX idx_user_notif_prefs_in_app_enabled IS 
  'Optimiza queries de usuarios con in_app habilitado';

RAISE NOTICE '✅ Índice idx_user_notif_prefs_in_app_enabled creado';

COMMIT;

-- ============================================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- ============================================================================

DO $$
DECLARE
  enum_exists BOOLEAN;
  column_exists BOOLEAN;
  index_exists BOOLEAN;
BEGIN
  -- Verificar enum
  SELECT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'in_app' 
    AND enumtypid = 'notification_channel'::regtype
  ) INTO enum_exists;
  
  IF enum_exists THEN
    RAISE NOTICE '✅ VERIFICADO: Enum notification_channel incluye in_app';
  ELSE
    RAISE EXCEPTION '❌ ERROR: Enum notification_channel NO incluye in_app';
  END IF;
  
  -- Verificar columna
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_notification_preferences' 
    AND column_name = 'in_app_enabled'
  ) INTO column_exists;
  
  IF column_exists THEN
    RAISE NOTICE '✅ VERIFICADO: Columna in_app_enabled agregada';
  ELSE
    RAISE EXCEPTION '❌ ERROR: Columna in_app_enabled NO existe';
  END IF;
  
  -- Verificar índice
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_user_notif_prefs_in_app_enabled'
  ) INTO index_exists;
  
  IF index_exists THEN
    RAISE NOTICE '✅ VERIFICADO: Índice creado correctamente';
  ELSE
    RAISE WARNING '⚠️  ADVERTENCIA: Índice no encontrado (no crítico)';
  END IF;
  
  RAISE NOTICE '✅✅✅ Migración completada exitosamente ✅✅✅';
END $$;
