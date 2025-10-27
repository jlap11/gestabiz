-- ============================================
-- MIGRATION: Sistema de Logging y Observabilidad
-- Fecha: 2025-10-18
-- Descripción: Crea tablas error_logs y login_logs con RPC functions
-- ============================================

-- ============================================
-- TABLA: error_logs
-- Almacena todos los errores de frontend y Edge Functions
-- ============================================

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Clasificación
  source TEXT NOT NULL CHECK (source IN (
    'frontend-web', 
    'frontend-mobile', 
    'frontend-extension',
    'edge-function',
    'database',
    'cron-job'
  )),
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warning', 'error', 'fatal')),
  
  -- Contenido del error
  message TEXT NOT NULL,
  stack_trace TEXT,
  error_hash TEXT NOT NULL, -- MD5 para agrupar errores similares
  
  -- Contexto de usuario
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  
  -- Contexto técnico
  component TEXT, -- Componente React o nombre de Edge Function
  context JSONB DEFAULT '{}'::jsonb, -- Datos adicionales (request, params, state)
  environment TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
  
  -- Resolución
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_source ON error_logs(source);
CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs(level);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_error_logs_error_hash ON error_logs(error_hash);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved) WHERE NOT resolved;
CREATE INDEX IF NOT EXISTS idx_error_logs_component ON error_logs(component);

-- Índice GIN para búsqueda en context JSONB
CREATE INDEX IF NOT EXISTS idx_error_logs_context ON error_logs USING GIN(context);

-- Comentarios
COMMENT ON TABLE error_logs IS 'Registro centralizado de errores de toda la aplicación';
COMMENT ON COLUMN error_logs.error_hash IS 'Hash MD5 del mensaje + stack para agrupar errores iguales';
COMMENT ON COLUMN error_logs.context IS 'Datos adicionales en formato JSON (payload, user_agent, url, etc.)';

-- ============================================
-- TABLA: login_logs
-- Almacena intentos de login exitosos y fallidos
-- ============================================

CREATE TABLE IF NOT EXISTS login_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Usuario
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  
  -- Evento
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'blocked')),
  method TEXT NOT NULL CHECK (method IN (
    'password', 
    'google', 
    'magic_link', 
    'extension',
    'password_reset'
  )),
  
  -- Contexto de request
  ip_address INET,
  user_agent TEXT,
  device TEXT CHECK (device IN ('desktop', 'mobile', 'tablet', 'unknown')),
  browser TEXT,
  os TEXT,
  
  -- Geolocation (opcional, via IP)
  country TEXT,
  city TEXT,
  
  -- Metadata adicional
  metadata JSONB DEFAULT '{}'::jsonb, -- failure_reason, mfa_used, etc.
  
  -- Seguridad
  is_suspicious BOOLEAN DEFAULT FALSE,
  suspicious_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_email ON login_logs(email);
CREATE INDEX IF NOT EXISTS idx_login_logs_timestamp ON login_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_login_logs_status ON login_logs(status);
CREATE INDEX IF NOT EXISTS idx_login_logs_ip_address ON login_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_logs_suspicious ON login_logs(is_suspicious) WHERE is_suspicious = TRUE;

-- Índice GIN para metadata
CREATE INDEX IF NOT EXISTS idx_login_logs_metadata ON login_logs USING GIN(metadata);

-- Comentarios
COMMENT ON TABLE login_logs IS 'Registro de todos los intentos de inicio de sesión';
COMMENT ON COLUMN login_logs.is_suspicious IS 'Marcado automáticamente si detecta actividad anómala';

-- ============================================
-- FUNCTION: log_error_event
-- RPC function para insertar errores (SECURITY DEFINER)
-- ============================================

CREATE OR REPLACE FUNCTION log_error_event(
  p_source TEXT,
  p_level TEXT,
  p_message TEXT,
  p_stack_trace TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_component TEXT DEFAULT NULL,
  p_context JSONB DEFAULT '{}'::jsonb,
  p_environment TEXT DEFAULT 'production',
  p_error_hash TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_error_id UUID;
  v_computed_hash TEXT;
BEGIN
  -- Validar source
  IF p_source NOT IN ('frontend-web', 'frontend-mobile', 'frontend-extension', 'edge-function', 'database', 'cron-job') THEN
    RAISE EXCEPTION 'Invalid source: %. Must be one of: frontend-web, frontend-mobile, frontend-extension, edge-function, database, cron-job', p_source;
  END IF;
  
  -- Validar level
  IF p_level NOT IN ('debug', 'info', 'warning', 'error', 'fatal') THEN
    RAISE EXCEPTION 'Invalid level: %. Must be one of: debug, info, warning, error, fatal', p_level;
  END IF;
  
  -- Validar environment
  IF p_environment NOT IN ('development', 'staging', 'production') THEN
    RAISE EXCEPTION 'Invalid environment: %. Must be one of: development, staging, production', p_environment;
  END IF;
  
  -- Sanitizar message (limitar tamaño a 5000 chars)
  IF LENGTH(p_message) > 5000 THEN
    p_message := LEFT(p_message, 4997) || '...';
  END IF;
  
  -- Generar hash si no se provee
  IF p_error_hash IS NULL THEN
    v_computed_hash := md5(p_message || COALESCE(p_stack_trace, ''));
  ELSE
    v_computed_hash := p_error_hash;
  END IF;
  
  -- Validar user_id si se provee
  IF p_user_id IS NOT NULL THEN
    PERFORM 1 FROM auth.users WHERE id = p_user_id;
    IF NOT FOUND THEN
      -- No lanzar error, solo usar NULL
      p_user_id := NULL;
    END IF;
  END IF;
  
  -- Rate limiting: max 100 logs por minuto por usuario
  IF p_user_id IS NOT NULL THEN
    PERFORM 1 FROM error_logs
    WHERE user_id = p_user_id
      AND timestamp > NOW() - INTERVAL '1 minute'
    HAVING COUNT(*) > 100;
    
    IF FOUND THEN
      RAISE WARNING 'Rate limit exceeded for user %', p_user_id;
      RETURN NULL; -- No insertar, pero no fallar
    END IF;
  END IF;
  
  -- Insertar error log
  INSERT INTO error_logs (
    source,
    level,
    message,
    stack_trace,
    error_hash,
    user_id,
    session_id,
    component,
    context,
    environment
  ) VALUES (
    p_source,
    p_level,
    p_message,
    p_stack_trace,
    v_computed_hash,
    COALESCE(p_user_id, auth.uid()),
    p_session_id,
    p_component,
    p_context,
    p_environment
  )
  RETURNING id INTO v_error_id;
  
  -- Alerta si es error fatal
  IF p_level = 'fatal' THEN
    RAISE WARNING 'Fatal error logged: % (ID: %)', p_message, v_error_id;
  END IF;
  
  RETURN v_error_id;
END;
$$;

-- Grant execution
GRANT EXECUTE ON FUNCTION log_error_event TO authenticated, anon;

COMMENT ON FUNCTION log_error_event IS 'Inserta un error en error_logs con validaciones y rate limiting';

-- ============================================
-- FUNCTION: log_login_event
-- RPC function para registrar logins (SECURITY DEFINER)
-- ============================================

CREATE OR REPLACE FUNCTION log_login_event(
  p_user_id UUID DEFAULT NULL,
  p_email TEXT,
  p_status TEXT,
  p_method TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_login_id UUID;
  v_device TEXT;
  v_browser TEXT;
  v_os TEXT;
  v_is_suspicious BOOLEAN := FALSE;
  v_suspicious_reason TEXT;
BEGIN
  -- Validar status
  IF p_status NOT IN ('success', 'failure', 'blocked') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be one of: success, failure, blocked', p_status;
  END IF;
  
  -- Validar method
  IF p_method NOT IN ('password', 'google', 'magic_link', 'extension', 'password_reset') THEN
    RAISE EXCEPTION 'Invalid method: %. Must be one of: password, google, magic_link, extension, password_reset', p_method;
  END IF;
  
  -- Parse user agent
  v_device := CASE
    WHEN p_user_agent ILIKE '%mobile%' OR p_user_agent ILIKE '%android%' OR p_user_agent ILIKE '%iphone%' THEN 'mobile'
    WHEN p_user_agent ILIKE '%tablet%' OR p_user_agent ILIKE '%ipad%' THEN 'tablet'
    WHEN p_user_agent IS NOT NULL THEN 'desktop'
    ELSE 'unknown'
  END;
  
  v_browser := CASE
    WHEN p_user_agent ILIKE '%chrome%' AND p_user_agent NOT ILIKE '%edg%' THEN 'Chrome'
    WHEN p_user_agent ILIKE '%firefox%' THEN 'Firefox'
    WHEN p_user_agent ILIKE '%safari%' AND p_user_agent NOT ILIKE '%chrome%' THEN 'Safari'
    WHEN p_user_agent ILIKE '%edg%' THEN 'Edge'
    WHEN p_user_agent ILIKE '%opera%' OR p_user_agent ILIKE '%opr%' THEN 'Opera'
    ELSE 'Other'
  END;
  
  v_os := CASE
    WHEN p_user_agent ILIKE '%windows%' THEN 'Windows'
    WHEN p_user_agent ILIKE '%mac%' THEN 'macOS'
    WHEN p_user_agent ILIKE '%linux%' THEN 'Linux'
    WHEN p_user_agent ILIKE '%android%' THEN 'Android'
    WHEN p_user_agent ILIKE '%ios%' OR p_user_agent ILIKE '%iphone%' OR p_user_agent ILIKE '%ipad%' THEN 'iOS'
    ELSE 'Other'
  END;
  
  -- Detectar actividad sospechosa: múltiples intentos fallidos
  IF p_status = 'failure' THEN
    SELECT COUNT(*) >= 4 INTO v_is_suspicious
    FROM login_logs
    WHERE email = p_email
      AND status = 'failure'
      AND timestamp > NOW() - INTERVAL '15 minutes';
    
    IF v_is_suspicious THEN
      v_suspicious_reason := 'Múltiples intentos fallidos de login (5+ en 15 min)';
    END IF;
  END IF;
  
  -- Detectar login desde IP diferente (solo si es éxito)
  IF p_user_id IS NOT NULL AND p_status = 'success' AND p_ip_address IS NOT NULL THEN
    SELECT COUNT(*) > 0 INTO v_is_suspicious
    FROM login_logs
    WHERE user_id = p_user_id
      AND timestamp > NOW() - INTERVAL '24 hours'
      AND ip_address IS DISTINCT FROM p_ip_address::INET
      AND status = 'success'
    LIMIT 1;
    
    IF v_is_suspicious AND v_suspicious_reason IS NULL THEN
      v_suspicious_reason := 'Login desde IP diferente a la habitual';
    END IF;
  END IF;
  
  -- Insertar log
  INSERT INTO login_logs (
    user_id,
    email,
    status,
    method,
    ip_address,
    user_agent,
    device,
    browser,
    os,
    metadata,
    is_suspicious,
    suspicious_reason
  ) VALUES (
    p_user_id,
    p_email,
    p_status,
    p_method,
    CASE WHEN p_ip_address IS NOT NULL THEN p_ip_address::INET ELSE NULL END,
    p_user_agent,
    v_device,
    v_browser,
    v_os,
    p_metadata,
    v_is_suspicious,
    v_suspicious_reason
  )
  RETURNING id INTO v_login_id;
  
  -- Advertencia si es sospechoso
  IF v_is_suspicious THEN
    RAISE WARNING 'Suspicious login attempt detected for %: %', p_email, v_suspicious_reason;
  END IF;
  
  RETURN v_login_id;
END;
$$;

-- Grant execution
GRANT EXECUTE ON FUNCTION log_login_event TO authenticated, anon;

COMMENT ON FUNCTION log_login_event IS 'Registra intentos de login con detección automática de actividad sospechosa';

-- ============================================
-- RLS POLICIES
-- ============================================

-- Habilitar RLS en ambas tablas
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;

-- error_logs: Admins pueden ver todos los errores
CREATE POLICY "Admins can view all error logs"
  ON error_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE owner_id = auth.uid()
    )
  );

-- error_logs: Usuarios pueden ver sus propios errores
CREATE POLICY "Users can view own error logs"
  ON error_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- error_logs: Inserción solo vía RPC (forzado por SECURITY DEFINER)
CREATE POLICY "Error logs insertion via RPC only"
  ON error_logs FOR INSERT
  TO authenticated
  WITH CHECK (FALSE);

-- error_logs: Admins pueden marcar como resueltos
CREATE POLICY "Admins can update error logs"
  ON error_logs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    resolved = true
    AND resolved_by = auth.uid()
  );

-- login_logs: Admins pueden ver todos los login logs
CREATE POLICY "Admins can view all login logs"
  ON login_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE owner_id = auth.uid()
    )
  );

-- login_logs: Usuarios pueden ver sus propios login logs
CREATE POLICY "Users can view own login logs"
  ON login_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- login_logs: Inserción solo vía RPC
CREATE POLICY "Login logs insertion via RPC only"
  ON login_logs FOR INSERT
  TO authenticated
  WITH CHECK (FALSE);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger para actualizar updated_at en error_logs
CREATE OR REPLACE FUNCTION update_error_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_error_logs_updated_at
  BEFORE UPDATE ON error_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_error_logs_updated_at();

-- ============================================
-- FUNCIÓN DE PURGA AUTOMÁTICA (GDPR Compliance)
-- ============================================

CREATE OR REPLACE FUNCTION purge_old_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_errors INTEGER;
  v_deleted_logins INTEGER;
BEGIN
  -- Purgar error_logs mayores a 90 días
  DELETE FROM error_logs
  WHERE timestamp < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS v_deleted_errors = ROW_COUNT;
  
  -- Purgar login_logs mayores a 90 días
  DELETE FROM login_logs
  WHERE timestamp < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS v_deleted_logins = ROW_COUNT;
  
  RAISE NOTICE 'Purged % error logs and % login logs older than 90 days', v_deleted_errors, v_deleted_logins;
END;
$$;

COMMENT ON FUNCTION purge_old_logs IS 'Elimina logs mayores a 90 días para cumplir con políticas de retención GDPR';

-- ============================================
-- VISTA MATERIALIZADA: Resumen de errores
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS error_logs_summary AS
SELECT 
  error_hash,
  source,
  level,
  component,
  message,
  COUNT(*) as occurrence_count,
  MIN(timestamp) as first_seen,
  MAX(timestamp) as last_seen,
  COUNT(DISTINCT user_id) as affected_users,
  BOOL_OR(resolved) as all_resolved
FROM error_logs
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY error_hash, source, level, component, message;

CREATE UNIQUE INDEX IF NOT EXISTS idx_error_logs_summary_hash ON error_logs_summary(error_hash);

COMMENT ON MATERIALIZED VIEW error_logs_summary IS 'Resumen de errores agrupados por hash para análisis de frecuencia';

-- ============================================
-- FINALIZACIÓN
-- ============================================

-- Refresh inicial de la vista materializada
REFRESH MATERIALIZED VIEW error_logs_summary;

-- Mensaje de éxito
DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de Logging creado exitosamente';
  RAISE NOTICE '📊 Tablas: error_logs, login_logs';
  RAISE NOTICE '⚙️ Funciones RPC: log_error_event, log_login_event';
  RAISE NOTICE '🔒 RLS Policies aplicadas';
  RAISE NOTICE '🗂️ Vista materializada: error_logs_summary';
END $$;
