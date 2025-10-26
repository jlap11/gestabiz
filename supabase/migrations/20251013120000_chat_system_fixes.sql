-- ============================================================================
-- MIGRACIÓN: Corrección del Sistema de Chat
-- Fecha: 2025-10-13
-- Descripción: Agrega columnas faltantes, ENUMs y corrige triggers
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CREAR ENUM delivery_status_enum
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_status_enum') THEN
    CREATE TYPE delivery_status_enum AS ENUM (
      'sending',
      'sent',
      'delivered',
      'read',
      'failed'
    );
  END IF;
END $$;

-- ============================================================================
-- 2. AGREGAR 'owner' A conversation_role ENUM
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'owner' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'conversation_role')
  ) THEN
    ALTER TYPE conversation_role ADD VALUE 'owner';
  END IF;
END $$;

-- ============================================================================
-- 3. AGREGAR COLUMNAS FALTANTES A messages
-- ============================================================================

-- Agregar delivery_status (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'delivery_status'
  ) THEN
    ALTER TABLE messages 
    ADD COLUMN delivery_status delivery_status_enum DEFAULT 'sent';
  END IF;
END $$;

-- Agregar read_by (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'read_by'
  ) THEN
    ALTER TABLE messages 
    ADD COLUMN read_by JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Crear comentarios para documentación
COMMENT ON COLUMN messages.delivery_status IS 'Estado de entrega del mensaje: sending, sent, delivered, read, failed';
COMMENT ON COLUMN messages.read_by IS 'Array de objetos {user_id: UUID, read_at: TIMESTAMPTZ} indicando quién leyó el mensaje';

-- ============================================================================
-- 4. CORREGIR TRIGGER increment_unread_on_message
-- ============================================================================

-- Primero eliminar la función y trigger existente
DROP TRIGGER IF EXISTS trg_messages_increment_unread ON messages;
DROP FUNCTION IF EXISTS increment_unread_on_message();

-- Crear función corregida
CREATE OR REPLACE FUNCTION increment_unread_on_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar last_read_at del SENDER (marca como leído para quien envía)
  UPDATE conversation_members
  SET last_read_at = NEW.created_at
  WHERE conversation_id = NEW.conversation_id
    AND user_id = NEW.sender_id;
  
  -- Incrementar unread_count de TODOS LOS DEMÁS MIEMBROS
  UPDATE conversation_members
  SET unread_count = unread_count + 1
  WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear trigger
CREATE TRIGGER trg_messages_increment_unread
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_unread_on_message();

COMMENT ON FUNCTION increment_unread_on_message() IS 'Incrementa unread_count de todos los miembros excepto el sender cuando llega un nuevo mensaje';

-- ============================================================================
-- 5. CREAR FUNCIÓN PARA ACTUALIZAR delivery_status
-- ============================================================================

CREATE OR REPLACE FUNCTION update_message_delivery_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Si se marca un mensaje como leído (read_by actualizado)
  IF NEW.read_by IS DISTINCT FROM OLD.read_by THEN
    -- Contar cuántos miembros hay en la conversación (excluyendo sender)
    DECLARE
      total_members INTEGER;
      read_count INTEGER;
    BEGIN
      -- Total de miembros excluyendo sender
      SELECT COUNT(*) INTO total_members
      FROM conversation_members
      WHERE conversation_id = NEW.conversation_id
        AND user_id != NEW.sender_id;
      
      -- Cuántos han leído
      read_count := jsonb_array_length(NEW.read_by);
      
      -- Actualizar estado según lecturas
      IF read_count >= total_members THEN
        NEW.delivery_status := 'read';
      ELSIF read_count > 0 THEN
        NEW.delivery_status := 'delivered';
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger para auto-actualizar delivery_status
CREATE TRIGGER trg_messages_update_delivery_status
  BEFORE UPDATE OF read_by ON messages
  FOR EACH ROW
  WHEN (NEW.read_by IS DISTINCT FROM OLD.read_by)
  EXECUTE FUNCTION update_message_delivery_status();

COMMENT ON FUNCTION update_message_delivery_status() IS 'Actualiza delivery_status basándose en read_by array';

-- ============================================================================
-- 6. CREAR FUNCIÓN PARA MARCAR MENSAJE COMO LEÍDO
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_message_as_read(
  p_message_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_read_by JSONB;
  v_already_read BOOLEAN;
BEGIN
  -- Obtener read_by actual
  SELECT read_by INTO v_read_by
  FROM messages
  WHERE id = p_message_id;
  
  -- Verificar si ya fue leído por este usuario
  SELECT EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(v_read_by) AS elem
    WHERE elem->>'user_id' = p_user_id::text
  ) INTO v_already_read;
  
  -- Si no ha sido leído, agregarlo
  IF NOT v_already_read THEN
    UPDATE messages
    SET read_by = read_by || jsonb_build_object(
      'user_id', p_user_id,
      'read_at', NOW()
    )
    WHERE id = p_message_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mark_message_as_read(UUID, UUID) IS 'Marca un mensaje como leído por un usuario específico';

-- Grant execute a authenticated
GRANT EXECUTE ON FUNCTION mark_message_as_read(UUID, UUID) TO authenticated;

-- ============================================================================
-- 7. ACTUALIZAR FUNCIÓN bulk_mark_read
-- ============================================================================

-- Eliminar versión anterior
DROP FUNCTION IF EXISTS bulk_mark_read(UUID, UUID);

-- Recrear con lógica mejorada
CREATE OR REPLACE FUNCTION bulk_mark_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS TABLE(updated_count INTEGER) AS $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  -- Marcar todos los mensajes como leídos
  WITH updated_messages AS (
    UPDATE messages
    SET read_by = CASE
      -- Si el usuario ya está en read_by, no duplicar
      WHEN EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(read_by) AS elem
        WHERE elem->>'user_id' = p_user_id::text
      ) THEN read_by
      -- Si no está, agregarlo
      ELSE read_by || jsonb_build_object(
        'user_id', p_user_id,
        'read_at', NOW()
      )
    END
    WHERE conversation_id = p_conversation_id
      AND sender_id != p_user_id
      AND is_deleted = FALSE
      -- Solo actualizar si no ha sido leído
      AND NOT EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(read_by) AS elem
        WHERE elem->>'user_id' = p_user_id::text
      )
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER INTO v_updated_count FROM updated_messages;
  
  -- Resetear unread_count del usuario
  UPDATE conversation_members
  SET 
    unread_count = 0,
    last_read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;
  
  RETURN QUERY SELECT v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION bulk_mark_read(UUID, UUID) IS 'Marca todos los mensajes de una conversación como leídos y resetea unread_count';

-- Grant execute a authenticated
GRANT EXECUTE ON FUNCTION bulk_mark_read(UUID, UUID) TO authenticated;

-- ============================================================================
-- 8. ÍNDICE PARA delivery_status
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_messages_delivery_status 
ON messages(conversation_id, delivery_status) 
WHERE is_deleted = FALSE;

COMMENT ON INDEX idx_messages_delivery_status IS 'Índice para queries de mensajes por estado de entrega';

-- ============================================================================
-- 9. ÍNDICE PARA read_by (GIN para búsquedas en JSONB)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_messages_read_by 
ON messages USING gin(read_by);

COMMENT ON INDEX idx_messages_read_by IS 'Índice GIN para búsquedas en read_by array';

-- ============================================================================
-- 10. ACTUALIZAR MENSAJES EXISTENTES
-- ============================================================================

-- Actualizar delivery_status de mensajes existentes a 'sent'
UPDATE messages
SET delivery_status = 'sent'
WHERE delivery_status IS NULL;

-- Inicializar read_by como array vacío si es NULL
UPDATE messages
SET read_by = '[]'::jsonb
WHERE read_by IS NULL;

-- ============================================================================
-- 11. FUNCIÓN HELPER: Get Unread Messages Count
-- ============================================================================

CREATE OR REPLACE FUNCTION get_unread_messages_count(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM messages m
  WHERE m.conversation_id = p_conversation_id
    AND m.sender_id != p_user_id
    AND m.is_deleted = FALSE
    AND NOT EXISTS (
      SELECT 1 
      FROM jsonb_array_elements(m.read_by) AS elem
      WHERE elem->>'user_id' = p_user_id::text
    );
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_unread_messages_count(UUID, UUID) IS 'Retorna el conteo de mensajes no leídos en una conversación para un usuario';

-- Grant execute a authenticated
GRANT EXECUTE ON FUNCTION get_unread_messages_count(UUID, UUID) TO authenticated;

-- ============================================================================
-- 12. VALIDACIONES
-- ============================================================================

-- Constraint: delivery_status no puede ser NULL
ALTER TABLE messages 
ALTER COLUMN delivery_status SET NOT NULL;

-- Constraint: read_by debe ser array válido
ALTER TABLE messages
ADD CONSTRAINT messages_read_by_is_array 
CHECK (jsonb_typeof(read_by) = 'array');

-- ============================================================================
-- VERIFICACIONES POST-MIGRACIÓN
-- ============================================================================

DO $$
DECLARE
  v_enum_count INTEGER;
  v_column_count INTEGER;
  v_trigger_count INTEGER;
BEGIN
  -- Verificar ENUM delivery_status_enum
  SELECT COUNT(*) INTO v_enum_count
  FROM pg_type
  WHERE typname = 'delivery_status_enum';
  
  IF v_enum_count = 0 THEN
    RAISE EXCEPTION 'ENUM delivery_status_enum no fue creado';
  END IF;
  
  -- Verificar columnas agregadas
  SELECT COUNT(*) INTO v_column_count
  FROM information_schema.columns
  WHERE table_name = 'messages'
    AND column_name IN ('delivery_status', 'read_by');
  
  IF v_column_count != 2 THEN
    RAISE EXCEPTION 'Columnas delivery_status y read_by no fueron agregadas correctamente';
  END IF;
  
  -- Verificar triggers
  SELECT COUNT(*) INTO v_trigger_count
  FROM information_schema.triggers
  WHERE trigger_name IN ('trg_messages_increment_unread', 'trg_messages_update_delivery_status');
  
  IF v_trigger_count != 2 THEN
    RAISE EXCEPTION 'Triggers no fueron creados correctamente';
  END IF;
  
  RAISE NOTICE 'Migración completada exitosamente';
  RAISE NOTICE '- ENUM delivery_status_enum: CREADO';
  RAISE NOTICE '- Columnas delivery_status y read_by: AGREGADAS';
  RAISE NOTICE '- Trigger increment_unread_on_message: CORREGIDO';
  RAISE NOTICE '- Trigger update_delivery_status: CREADO';
  RAISE NOTICE '- Funciones auxiliares: CREADAS (3)';
  RAISE NOTICE '- Índices: CREADOS (2)';
END $$;

COMMIT;

-- ============================================================================
-- NOTAS DE DEPLOYMENT
-- ============================================================================

/*
DEPLOYMENT:
  npx supabase db push

ROLLBACK (si es necesario):
  BEGIN;
  DROP TRIGGER IF EXISTS trg_messages_update_delivery_status ON messages;
  DROP TRIGGER IF EXISTS trg_messages_increment_unread ON messages;
  DROP FUNCTION IF EXISTS update_message_delivery_status();
  DROP FUNCTION IF EXISTS mark_message_as_read(UUID, UUID);
  DROP FUNCTION IF EXISTS get_unread_messages_count(UUID, UUID);
  DROP INDEX IF EXISTS idx_messages_delivery_status;
  DROP INDEX IF EXISTS idx_messages_read_by;
  ALTER TABLE messages DROP COLUMN IF EXISTS delivery_status;
  ALTER TABLE messages DROP COLUMN IF EXISTS read_by;
  DROP TYPE IF EXISTS delivery_status_enum;
  COMMIT;

TESTING:
  -- Verificar estructura
  SELECT column_name, data_type, column_default
  FROM information_schema.columns
  WHERE table_name = 'messages'
  AND column_name IN ('delivery_status', 'read_by');
  
  -- Test trigger increment_unread
  INSERT INTO messages (conversation_id, sender_id, type, body)
  VALUES ('<conversation_id>', '<user_id>', 'text', 'Test message');
  
  -- Verificar unread_count incrementado
  SELECT user_id, unread_count
  FROM conversation_members
  WHERE conversation_id = '<conversation_id>';
  
  -- Test mark_message_as_read
  SELECT mark_message_as_read('<message_id>', '<user_id>');
  
  -- Verificar read_by actualizado
  SELECT id, read_by, delivery_status
  FROM messages
  WHERE id = '<message_id>';
*/
