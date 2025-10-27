-- ============================================================================
-- MIGRACIÓN: Sistema de Chat - Base de Datos
-- Fecha: 2025-10-13
-- Descripción: Crear tablas, índices, RLS y funciones para sistema de chat
-- ============================================================================

-- ============================================================================
-- 1. TABLAS
-- ============================================================================

-- 1.1. Tabla: chat_conversations
-- Almacena las conversaciones (direct o group)
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
  title TEXT,  -- NULL para direct, requerido para group
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_message_preview TEXT,  -- Preview del último mensaje (max 100 chars)
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Metadata
  is_archived BOOLEAN DEFAULT FALSE NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE chat_conversations IS 'Conversaciones de chat (1-a-1 o grupo)';
COMMENT ON COLUMN chat_conversations.type IS 'Tipo de conversación: direct (1-a-1) o group';
COMMENT ON COLUMN chat_conversations.title IS 'Título personalizado (solo para grupos)';
COMMENT ON COLUMN chat_conversations.business_id IS 'Negocio relacionado (opcional)';
COMMENT ON COLUMN chat_conversations.last_message_at IS 'Timestamp del último mensaje (para ordenamiento)';
COMMENT ON COLUMN chat_conversations.last_message_preview IS 'Preview del último mensaje (primeros 100 caracteres)';

-- Índices para chat_conversations
CREATE INDEX idx_conversations_type ON chat_conversations(type);
CREATE INDEX idx_conversations_business ON chat_conversations(business_id) WHERE business_id IS NOT NULL;
CREATE INDEX idx_conversations_last_message ON chat_conversations(last_message_at DESC);
CREATE INDEX idx_conversations_archived ON chat_conversations(is_archived) WHERE is_archived = FALSE;

-- 1.2. Tabla: chat_participants
-- Relación muchos-a-muchos entre conversaciones y usuarios
CREATE TABLE IF NOT EXISTS chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  left_at TIMESTAMPTZ,  -- NULL si aún es participante activo
  last_read_at TIMESTAMPTZ,  -- Última vez que leyó mensajes
  last_read_message_id UUID,  -- Último mensaje leído (referencia)
  unread_count INTEGER DEFAULT 0 NOT NULL,
  is_muted BOOLEAN DEFAULT FALSE NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE NOT NULL,
  
  -- Constraints
  UNIQUE(conversation_id, user_id),
  CHECK (left_at IS NULL OR left_at > joined_at)
);

COMMENT ON TABLE chat_participants IS 'Participantes de conversaciones de chat';
COMMENT ON COLUMN chat_participants.left_at IS 'Fecha de salida (NULL = activo)';
COMMENT ON COLUMN chat_participants.last_read_at IS 'Última lectura de mensajes';
COMMENT ON COLUMN chat_participants.last_read_message_id IS 'ID del último mensaje leído';
COMMENT ON COLUMN chat_participants.unread_count IS 'Contador de mensajes no leídos';
COMMENT ON COLUMN chat_participants.is_muted IS 'Silenciar notificaciones';
COMMENT ON COLUMN chat_participants.is_pinned IS 'Fijar conversación al inicio';

-- Índices para chat_participants
CREATE INDEX idx_participants_conversation ON chat_participants(conversation_id);
CREATE INDEX idx_participants_user ON chat_participants(user_id);
CREATE INDEX idx_participants_user_active ON chat_participants(user_id) WHERE left_at IS NULL;
CREATE INDEX idx_participants_unread ON chat_participants(user_id, unread_count) WHERE unread_count > 0;
CREATE INDEX idx_participants_pinned ON chat_participants(user_id, is_pinned) WHERE is_pinned = TRUE;

-- 1.3. Tabla: chat_messages
-- Mensajes dentro de conversaciones
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text' NOT NULL CHECK (type IN ('text', 'image', 'file', 'system')),
  
  -- Archivos adjuntos
  attachments JSONB,  -- Array de {url, name, size, type}
  
  -- Estado de entrega/lectura
  sent_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  delivered_at TIMESTAMPTZ,
  read_by JSONB DEFAULT '[]'::jsonb,  -- Array de {user_id, read_at}
  
  -- Metadata
  reply_to_id UUID REFERENCES chat_messages(id) ON DELETE SET NULL,  -- Responder a mensaje
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,  -- Soft delete
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CHECK (content != '' OR attachments IS NOT NULL)
);

COMMENT ON TABLE chat_messages IS 'Mensajes de chat';
COMMENT ON COLUMN chat_messages.type IS 'Tipo de mensaje: text, image, file, system';
COMMENT ON COLUMN chat_messages.attachments IS 'Array de archivos adjuntos {url, name, size, type}';
COMMENT ON COLUMN chat_messages.read_by IS 'Array de usuarios que leyeron {user_id, read_at}';
COMMENT ON COLUMN chat_messages.reply_to_id IS 'ID del mensaje al que responde';
COMMENT ON COLUMN chat_messages.deleted_at IS 'Soft delete (NULL = visible)';

-- Índices para chat_messages
CREATE INDEX idx_messages_conversation ON chat_messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_messages_deleted ON chat_messages(conversation_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_reply ON chat_messages(reply_to_id) WHERE reply_to_id IS NOT NULL;

-- Añadir foreign key para last_read_message_id (debe crearse después de chat_messages)
ALTER TABLE chat_participants
  ADD CONSTRAINT fk_last_read_message
  FOREIGN KEY (last_read_message_id)
  REFERENCES chat_messages(id)
  ON DELETE SET NULL;

-- 1.4. Tabla: chat_typing_indicators
-- Indicadores de "escribiendo..." en tiempo real
CREATE TABLE IF NOT EXISTS chat_typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '10 seconds') NOT NULL,
  
  -- Constraints
  UNIQUE(conversation_id, user_id)
);

COMMENT ON TABLE chat_typing_indicators IS 'Indicadores de "escribiendo..." (expiran en 10 segundos)';
COMMENT ON COLUMN chat_typing_indicators.expires_at IS 'Timestamp de expiración automática';

-- Índice para limpieza automática
CREATE INDEX idx_typing_expires ON chat_typing_indicators(expires_at);

-- ============================================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_typing_indicators ENABLE ROW LEVEL SECURITY;

-- 2.1. Políticas para chat_conversations
-- SELECT: Usuario es participante activo
CREATE POLICY "users_select_own_conversations"
  ON chat_conversations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT conversation_id FROM chat_participants
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

-- INSERT: Cualquier usuario puede crear conversación
CREATE POLICY "users_insert_conversations"
  ON chat_conversations FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- UPDATE: Solo participantes pueden actualizar
CREATE POLICY "participants_update_conversations"
  ON chat_conversations FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT conversation_id FROM chat_participants
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

-- DELETE: Solo creador puede eliminar
CREATE POLICY "creator_delete_conversations"
  ON chat_conversations FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- 2.2. Políticas para chat_participants
-- SELECT: Usuario ve participantes de sus conversaciones
CREATE POLICY "users_select_conversation_participants"
  ON chat_participants FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id FROM chat_participants
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

-- INSERT: Sistema o usuario puede agregar participantes
CREATE POLICY "users_insert_participants"
  ON chat_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR  -- Puede agregarse a sí mismo
    conversation_id IN (
      SELECT id FROM chat_conversations WHERE created_by = auth.uid()
    )
  );

-- UPDATE: Usuario actualiza su propia participación
CREATE POLICY "users_update_own_participation"
  ON chat_participants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: Usuario puede salir de conversación
CREATE POLICY "users_delete_own_participation"
  ON chat_participants FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 2.3. Políticas para chat_messages
-- SELECT: Usuario ve mensajes de sus conversaciones (no eliminados)
CREATE POLICY "users_select_conversation_messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id FROM chat_participants
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
    AND deleted_at IS NULL
  );

-- INSERT: Usuario puede enviar mensajes a sus conversaciones
CREATE POLICY "users_insert_messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT conversation_id FROM chat_participants
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

-- UPDATE: Solo el remitente puede editar su mensaje
CREATE POLICY "users_update_own_messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- DELETE: Solo el remitente puede eliminar su mensaje (soft delete)
CREATE POLICY "users_delete_own_messages"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (sender_id = auth.uid());

-- 2.4. Políticas para chat_typing_indicators
-- SELECT: Usuario ve typing indicators de sus conversaciones
CREATE POLICY "users_select_typing_indicators"
  ON chat_typing_indicators FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT conversation_id FROM chat_participants
      WHERE user_id = auth.uid() AND left_at IS NULL
    )
  );

-- INSERT/UPDATE/DELETE: Usuario gestiona su propio typing indicator
CREATE POLICY "users_manage_own_typing"
  ON chat_typing_indicators FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 3. FUNCIONES RPC
-- ============================================================================

-- 3.1. Función: get_or_create_direct_conversation
-- Obtiene conversación directa existente o crea una nueva
CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(
  p_user1_id UUID,
  p_user2_id UUID,
  p_business_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- Validar que los usuarios son diferentes
  IF p_user1_id = p_user2_id THEN
    RAISE EXCEPTION 'No se puede crear conversación con uno mismo';
  END IF;
  
  -- Buscar conversación existente (directa entre estos 2 usuarios)
  SELECT c.id INTO v_conversation_id
  FROM chat_conversations c
  WHERE c.type = 'direct'
    AND (p_business_id IS NULL OR c.business_id = p_business_id)
    AND EXISTS (
      SELECT 1 FROM chat_participants p1
      WHERE p1.conversation_id = c.id
        AND p1.user_id = p_user1_id
        AND p1.left_at IS NULL
    )
    AND EXISTS (
      SELECT 1 FROM chat_participants p2
      WHERE p2.conversation_id = c.id
        AND p2.user_id = p_user2_id
        AND p2.left_at IS NULL
    )
    AND (
      SELECT COUNT(*) FROM chat_participants
      WHERE conversation_id = c.id AND left_at IS NULL
    ) = 2  -- Solo 2 participantes (conversación directa)
  LIMIT 1;
  
  -- Si no existe, crear nueva conversación
  IF v_conversation_id IS NULL THEN
    INSERT INTO chat_conversations (type, created_by, business_id)
    VALUES ('direct', p_user1_id, p_business_id)
    RETURNING id INTO v_conversation_id;
    
    -- Agregar ambos participantes
    INSERT INTO chat_participants (conversation_id, user_id)
    VALUES 
      (v_conversation_id, p_user1_id),
      (v_conversation_id, p_user2_id);
  END IF;
  
  RETURN v_conversation_id;
END;
$$;

COMMENT ON FUNCTION get_or_create_direct_conversation IS 'Obtiene conversación directa existente o crea nueva entre 2 usuarios';

-- 3.2. Función: send_message
-- Envía un mensaje y actualiza metadata de conversación
CREATE OR REPLACE FUNCTION send_message(
  p_conversation_id UUID,
  p_sender_id UUID,
  p_content TEXT,
  p_type TEXT DEFAULT 'text',
  p_attachments JSONB DEFAULT NULL,
  p_reply_to_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_message_id UUID;
  v_preview TEXT;
BEGIN
  -- Validar que el remitente es participante activo
  IF NOT EXISTS (
    SELECT 1 FROM chat_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = p_sender_id
      AND left_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Usuario no es participante de la conversación';
  END IF;
  
  -- Validar contenido o attachments
  IF (p_content IS NULL OR TRIM(p_content) = '') AND p_attachments IS NULL THEN
    RAISE EXCEPTION 'Mensaje debe tener contenido o archivos adjuntos';
  END IF;
  
  -- Crear mensaje
  INSERT INTO chat_messages (
    conversation_id,
    sender_id,
    content,
    type,
    attachments,
    reply_to_id
  ) VALUES (
    p_conversation_id,
    p_sender_id,
    COALESCE(p_content, ''),
    p_type,
    p_attachments,
    p_reply_to_id
  )
  RETURNING id INTO v_message_id;
  
  -- Generar preview del mensaje
  IF p_type = 'text' THEN
    v_preview := SUBSTRING(p_content, 1, 100);
    IF LENGTH(p_content) > 100 THEN
      v_preview := v_preview || '...';
    END IF;
  ELSIF p_type = 'image' THEN
    v_preview := '📷 Imagen';
  ELSIF p_type = 'file' THEN
    v_preview := '📎 Archivo';
  ELSE
    v_preview := 'Mensaje del sistema';
  END IF;
  
  -- Actualizar conversación (last_message_at y preview)
  UPDATE chat_conversations
  SET 
    last_message_at = NOW(),
    last_message_preview = v_preview,
    updated_at = NOW()
  WHERE id = p_conversation_id;
  
  -- Incrementar unread_count para otros participantes
  UPDATE chat_participants
  SET unread_count = unread_count + 1
  WHERE conversation_id = p_conversation_id
    AND user_id != p_sender_id
    AND left_at IS NULL;
  
  RETURN v_message_id;
END;
$$;

COMMENT ON FUNCTION send_message IS 'Envía un mensaje en una conversación';

-- 3.3. Función: mark_messages_as_read
-- Marca mensajes como leídos y actualiza contador
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_conversation_id UUID,
  p_user_id UUID,
  p_last_message_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_count INTEGER;
  v_read_entry JSONB;
BEGIN
  -- Validar que el usuario es participante
  IF NOT EXISTS (
    SELECT 1 FROM chat_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = p_user_id
      AND left_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Usuario no es participante de la conversación';
  END IF;
  
  -- Preparar entrada de lectura
  v_read_entry := jsonb_build_object(
    'user_id', p_user_id,
    'read_at', NOW()
  );
  
  -- Actualizar read_by en mensajes (que aún no ha leído)
  WITH updated_messages AS (
    UPDATE chat_messages
    SET read_by = CASE
      WHEN read_by @> jsonb_build_array(jsonb_build_object('user_id', p_user_id))
      THEN read_by  -- Ya leído, no cambiar
      ELSE read_by || v_read_entry  -- Agregar lectura
    END
    WHERE conversation_id = p_conversation_id
      AND sender_id != p_user_id
      AND deleted_at IS NULL
      AND (p_last_message_id IS NULL OR created_at <= (
        SELECT created_at FROM chat_messages WHERE id = p_last_message_id
      ))
      AND NOT (read_by @> jsonb_build_array(jsonb_build_object('user_id', p_user_id)))
    RETURNING id
  )
  SELECT COUNT(*) INTO v_updated_count FROM updated_messages;
  
  -- Actualizar participante (last_read_at, last_read_message_id, unread_count)
  UPDATE chat_participants
  SET 
    last_read_at = NOW(),
    last_read_message_id = COALESCE(p_last_message_id, last_read_message_id),
    unread_count = 0
  WHERE conversation_id = p_conversation_id
    AND user_id = p_user_id;
  
  RETURN v_updated_count;
END;
$$;

COMMENT ON FUNCTION mark_messages_as_read IS 'Marca mensajes como leídos y resetea contador';

-- 3.4. Función: update_typing_indicator
-- Actualiza o elimina el typing indicator de un usuario
CREATE OR REPLACE FUNCTION update_typing_indicator(
  p_conversation_id UUID,
  p_user_id UUID,
  p_is_typing BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validar que el usuario es participante
  IF NOT EXISTS (
    SELECT 1 FROM chat_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = p_user_id
      AND left_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Usuario no es participante de la conversación';
  END IF;
  
  IF p_is_typing THEN
    -- Insertar o actualizar typing indicator
    INSERT INTO chat_typing_indicators (conversation_id, user_id)
    VALUES (p_conversation_id, p_user_id)
    ON CONFLICT (conversation_id, user_id)
    DO UPDATE SET
      started_at = NOW(),
      expires_at = NOW() + INTERVAL '10 seconds';
  ELSE
    -- Eliminar typing indicator
    DELETE FROM chat_typing_indicators
    WHERE conversation_id = p_conversation_id
      AND user_id = p_user_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION update_typing_indicator IS 'Actualiza o elimina indicador de "escribiendo..."';

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

-- 4.1. Trigger: Auto-actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a tablas
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4.2. Trigger: Limpieza de typing indicators expirados
CREATE OR REPLACE FUNCTION cleanup_expired_typing_indicators()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM chat_typing_indicators
  WHERE expires_at < NOW();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_typing_indicators
  AFTER INSERT ON chat_typing_indicators
  EXECUTE FUNCTION cleanup_expired_typing_indicators();

-- 4.3. Trigger: Notificación in-app al recibir mensaje nuevo
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  v_participant RECORD;
  v_sender_name TEXT;
  v_sender_avatar TEXT;
BEGIN
  -- Obtener nombre y avatar del remitente
  SELECT 
    COALESCE(raw_user_meta_data->>'full_name', email) AS full_name,
    raw_user_meta_data->>'avatar_url' AS avatar_url
  INTO v_sender_name, v_sender_avatar
  FROM auth.users
  WHERE id = NEW.sender_id;
  
  -- Crear notificación in-app para cada participante (excepto remitente, no silenciados)
  FOR v_participant IN
    SELECT user_id
    FROM chat_participants
    WHERE conversation_id = NEW.conversation_id
      AND user_id != NEW.sender_id
      AND left_at IS NULL
      AND is_muted = FALSE
  LOOP
    -- Usar función create_in_app_notification (debe existir de Fase 1)
    PERFORM create_in_app_notification(
      p_user_id := v_participant.user_id,
      p_type := 'system_alert',
      p_title := 'Nuevo mensaje de ' || COALESCE(v_sender_name, 'Usuario'),
      p_message := SUBSTRING(NEW.content, 1, 100),
      p_action_url := '/chat/' || NEW.conversation_id,
      p_priority := 1,
      p_business_id := NULL,
      p_appointment_id := NULL,
      p_metadata := jsonb_build_object(
        'conversation_id', NEW.conversation_id,
        'message_id', NEW.id,
        'sender_id', NEW.sender_id,
        'sender_name', v_sender_name,
        'sender_avatar', v_sender_avatar
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  WHEN (NEW.type IN ('text', 'image', 'file'))
  EXECUTE FUNCTION notify_new_message();

-- ============================================================================
-- 5. GRANTS (Permisos para usuario autenticado)
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON chat_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_typing_indicators TO authenticated;

GRANT EXECUTE ON FUNCTION get_or_create_direct_conversation TO authenticated;
GRANT EXECUTE ON FUNCTION send_message TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read TO authenticated;
GRANT EXECUTE ON FUNCTION update_typing_indicator TO authenticated;

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================
