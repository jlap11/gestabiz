-- =====================================================
-- SISTEMA DE REPORTE DE BUGS Y PROBLEMAS
-- Migración: 20251017100000_bug_reports_system.sql
-- Descripción: Sistema completo para reportar problemas
-- con evidencias, notificaciones y seguimiento
-- =====================================================

-- 1. Crear tabla de reportes de bugs
-- =====================================================
CREATE TABLE IF NOT EXISTS bug_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Información del bug
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  steps_to_reproduce TEXT,
  
  -- Clasificación
  severity VARCHAR(50) NOT NULL DEFAULT 'medium',
  category VARCHAR(100),
  affected_page VARCHAR(255),
  
  -- Contexto técnico
  user_agent TEXT,
  browser_version VARCHAR(100),
  device_type VARCHAR(50),
  screen_resolution VARCHAR(50),
  
  -- Estado y seguimiento
  status VARCHAR(50) NOT NULL DEFAULT 'reported',
  priority VARCHAR(50) DEFAULT 'normal',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Resolución
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_status CHECK (status IN ('reported', 'acknowledged', 'in_progress', 'resolved', 'closed', 'wont_fix')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- 2. Crear tabla de evidencias (archivos adjuntos)
-- =====================================================
CREATE TABLE IF NOT EXISTS bug_report_evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bug_report_id UUID NOT NULL REFERENCES bug_reports(id) ON DELETE CASCADE,
  
  -- Información del archivo
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL, -- Path en Storage
  file_type VARCHAR(100),
  file_size BIGINT,
  
  -- Metadata
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Descripción opcional
  description TEXT
);

-- 3. Crear tabla de comentarios/actualizaciones
-- =====================================================
CREATE TABLE IF NOT EXISTS bug_report_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bug_report_id UUID NOT NULL REFERENCES bug_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Contenido
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE, -- Para notas internas del equipo de soporte
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Índices para optimizar búsquedas
-- =====================================================
CREATE INDEX idx_bug_reports_user_id ON bug_reports(user_id);
CREATE INDEX idx_bug_reports_status ON bug_reports(status);
CREATE INDEX idx_bug_reports_severity ON bug_reports(severity);
CREATE INDEX idx_bug_reports_created_at ON bug_reports(created_at DESC);
CREATE INDEX idx_bug_reports_assigned_to ON bug_reports(assigned_to) WHERE assigned_to IS NOT NULL;

CREATE INDEX idx_bug_report_evidences_report_id ON bug_report_evidences(bug_report_id);
CREATE INDEX idx_bug_report_comments_report_id ON bug_report_comments(bug_report_id);
CREATE INDEX idx_bug_report_comments_created_at ON bug_report_comments(created_at DESC);

-- 5. Trigger para actualizar updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_bug_report_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bug_reports_updated_at_trigger
  BEFORE UPDATE ON bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_bug_report_updated_at();

CREATE TRIGGER bug_report_comments_updated_at_trigger
  BEFORE UPDATE ON bug_report_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_bug_report_updated_at();

-- 6. Row Level Security (RLS) Policies
-- =====================================================

-- Habilitar RLS
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_report_evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_report_comments ENABLE ROW LEVEL SECURITY;

-- Políticas para bug_reports
-- Los usuarios pueden ver sus propios reportes
CREATE POLICY bug_reports_select_own
  ON bug_reports FOR SELECT
  USING (auth.uid() = user_id);

-- Los usuarios pueden crear reportes
CREATE POLICY bug_reports_insert_own
  ON bug_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propios reportes (solo si no están resueltos)
CREATE POLICY bug_reports_update_own
  ON bug_reports FOR UPDATE
  USING (auth.uid() = user_id AND status NOT IN ('resolved', 'closed'))
  WITH CHECK (auth.uid() = user_id);

-- Políticas para bug_report_evidences
-- Ver evidencias de sus propios reportes
CREATE POLICY bug_report_evidences_select_own
  ON bug_report_evidences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bug_reports
      WHERE bug_reports.id = bug_report_evidences.bug_report_id
      AND bug_reports.user_id = auth.uid()
    )
  );

-- Subir evidencias a sus propios reportes
CREATE POLICY bug_report_evidences_insert_own
  ON bug_report_evidences FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM bug_reports
      WHERE bug_reports.id = bug_report_evidences.bug_report_id
      AND bug_reports.user_id = auth.uid()
    )
  );

-- Eliminar evidencias de sus propios reportes
CREATE POLICY bug_report_evidences_delete_own
  ON bug_report_evidences FOR DELETE
  USING (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM bug_reports
      WHERE bug_reports.id = bug_report_evidences.bug_report_id
      AND bug_reports.user_id = auth.uid()
    )
  );

-- Políticas para bug_report_comments
-- Ver comentarios de sus propios reportes
CREATE POLICY bug_report_comments_select_own
  ON bug_report_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bug_reports
      WHERE bug_reports.id = bug_report_comments.bug_report_id
      AND bug_reports.user_id = auth.uid()
    )
  );

-- Crear comentarios en sus propios reportes
CREATE POLICY bug_report_comments_insert_own
  ON bug_report_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM bug_reports
      WHERE bug_reports.id = bug_report_comments.bug_report_id
      AND bug_reports.user_id = auth.uid()
    )
  );

-- Actualizar sus propios comentarios
CREATE POLICY bug_report_comments_update_own
  ON bug_report_comments FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 7. Funciones auxiliares
-- =====================================================

-- Función para obtener estadísticas de bugs
CREATE OR REPLACE FUNCTION get_bug_report_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'reported', COUNT(*) FILTER (WHERE status = 'reported'),
    'in_progress', COUNT(*) FILTER (WHERE status = 'in_progress'),
    'resolved', COUNT(*) FILTER (WHERE status = 'resolved'),
    'by_severity', json_build_object(
      'low', COUNT(*) FILTER (WHERE severity = 'low'),
      'medium', COUNT(*) FILTER (WHERE severity = 'medium'),
      'high', COUNT(*) FILTER (WHERE severity = 'high'),
      'critical', COUNT(*) FILTER (WHERE severity = 'critical')
    )
  )
  INTO v_stats
  FROM bug_reports
  WHERE user_id = p_user_id;
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener reportes con evidencias
CREATE OR REPLACE FUNCTION get_bug_reports_with_evidence(
  p_user_id UUID,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  description TEXT,
  steps_to_reproduce TEXT,
  severity VARCHAR,
  status VARCHAR,
  priority VARCHAR,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  evidence_count BIGINT,
  comment_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    br.id,
    br.title,
    br.description,
    br.steps_to_reproduce,
    br.severity,
    br.status,
    br.priority,
    br.created_at,
    br.updated_at,
    (SELECT COUNT(*) FROM bug_report_evidences WHERE bug_report_id = br.id) as evidence_count,
    (SELECT COUNT(*) FROM bug_report_comments WHERE bug_report_id = br.id) as comment_count
  FROM bug_reports br
  WHERE br.user_id = p_user_id
  ORDER BY br.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger para notificación al crear bug report
-- =====================================================
CREATE OR REPLACE FUNCTION notify_new_bug_report()
RETURNS TRIGGER AS $$
BEGIN
  -- Esta función será usada por la Edge Function para enviar email
  -- Guardamos el evento en notification_log si existe
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notification_log') THEN
    INSERT INTO notification_log (
      user_id,
      notification_type,
      channel,
      recipient,
      status,
      metadata
    ) VALUES (
      NEW.user_id,
      'bug_report_created',
      'email',
      'support', -- Será reemplazado por el email de soporte
      'pending',
      json_build_object(
        'bug_report_id', NEW.id,
        'title', NEW.title,
        'severity', NEW.severity
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bug_report_notification_trigger
  AFTER INSERT ON bug_reports
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_bug_report();

-- 9. Comentarios para documentación
-- =====================================================
COMMENT ON TABLE bug_reports IS 'Almacena reportes de bugs y problemas enviados por usuarios';
COMMENT ON TABLE bug_report_evidences IS 'Archivos adjuntos como evidencias de bugs (screenshots, videos, logs)';
COMMENT ON TABLE bug_report_comments IS 'Comentarios y actualizaciones sobre reportes de bugs';

COMMENT ON COLUMN bug_reports.severity IS 'Severidad: low, medium, high, critical';
COMMENT ON COLUMN bug_reports.status IS 'Estado: reported, acknowledged, in_progress, resolved, closed, wont_fix';
COMMENT ON COLUMN bug_reports.priority IS 'Prioridad: low, normal, high, urgent';
COMMENT ON COLUMN bug_reports.user_agent IS 'User agent del navegador para contexto técnico';
COMMENT ON COLUMN bug_report_evidences.file_path IS 'Path del archivo en Supabase Storage bucket bug-reports-evidence';

-- =====================================================
-- FIN DE MIGRACIÓN
-- =====================================================
