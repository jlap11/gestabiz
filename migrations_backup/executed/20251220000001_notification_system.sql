-- ============================================================================
-- Sistema de Notificaciones Multicanal
-- ============================================================================
-- Tabla para configurar preferencias de notificaciones por negocio

-- Crear tipo enum para canales de notificación
DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'whatsapp');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Crear tipo enum para tipos de notificación
DO $$ BEGIN
  CREATE TYPE notification_type_enum AS ENUM (
    -- Notificaciones de citas
    'appointment_reminder',
    'appointment_confirmation',
    'appointment_cancellation',
    'appointment_rescheduled',
    'appointment_new_client',      -- Al cliente cuando agenda
    'appointment_new_employee',    -- Al empleado cuando le asignan
    'appointment_new_business',    -- Al negocio cuando hay nueva cita
    
    -- Verificación de contactos
    'email_verification',
    'phone_verification_sms',
    'phone_verification_whatsapp',
    
    -- Solicitudes de empleo
    'employee_request_new',        -- Al admin cuando recibe solicitud
    'employee_request_accepted',   -- Al usuario cuando aceptan
    'employee_request_rejected',   -- Al usuario cuando rechazan
    
    -- Vacantes laborales
    'job_vacancy_new',            -- Nueva vacante publicada
    'job_application_new',        -- Al admin: nueva aplicación
    'job_application_accepted',   -- Al aplicante: aceptado
    'job_application_rejected',   -- Al aplicante: rechazado
    'job_application_interview',  -- Invitación a entrevista
    
    -- Sistema general
    'daily_digest',
    'weekly_summary',
    'account_activity',
    'security_alert'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabla de configuración de notificaciones por negocio
CREATE TABLE IF NOT EXISTS public.business_notification_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Relación con negocio
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  
  -- Canales habilitados (pueden habilitar múltiples)
  email_enabled BOOLEAN DEFAULT TRUE NOT NULL,
  sms_enabled BOOLEAN DEFAULT FALSE NOT NULL,
  whatsapp_enabled BOOLEAN DEFAULT FALSE NOT NULL,
  
  -- Prioridad de canales (orden de intento)
  channel_priority notification_channel[] DEFAULT ARRAY['whatsapp', 'email', 'sms']::notification_channel[],
  
  -- Configuración de recordatorios (en minutos antes del appointment)
  reminder_times INTEGER[] DEFAULT ARRAY[1440, 60]::INTEGER[], -- 24h y 1h antes
  
  -- Configuración por tipo de notificación
  notification_types JSONB DEFAULT '{
    "appointment_reminder": {"enabled": true, "channels": ["email", "whatsapp"]},
    "appointment_confirmation": {"enabled": true, "channels": ["email", "whatsapp"]},
    "appointment_cancellation": {"enabled": true, "channels": ["email", "sms", "whatsapp"]},
    "appointment_rescheduled": {"enabled": true, "channels": ["email", "whatsapp"]},
    "employee_request": {"enabled": true, "channels": ["email"]},
    "daily_digest": {"enabled": false, "channels": ["email"]}
  }'::JSONB,
  
  -- Credenciales/configuración de servicios (encriptado en producción)
  email_from_name VARCHAR(255),
  email_from_address VARCHAR(255),
  twilio_phone_number VARCHAR(50),
  whatsapp_phone_number VARCHAR(50),
  
  -- Horarios de envío (no enviar notificaciones fuera de estos horarios)
  send_notifications_from TIME DEFAULT '08:00:00',
  send_notifications_until TIME DEFAULT '22:00:00',
  timezone VARCHAR(50) DEFAULT 'America/Bogota',
  
  -- Configuración adicional
  use_fallback BOOLEAN DEFAULT TRUE NOT NULL, -- Si falla un canal, intenta el siguiente
  max_retry_attempts INTEGER DEFAULT 3,
  
  UNIQUE(business_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_business_notification_settings_business_id 
  ON business_notification_settings(business_id);

-- Comentarios
COMMENT ON TABLE business_notification_settings IS 
  'Configuración de notificaciones multicanal por negocio (Email, SMS, WhatsApp)';
COMMENT ON COLUMN business_notification_settings.channel_priority IS 
  'Orden de prioridad para intentar envío de notificaciones';
COMMENT ON COLUMN business_notification_settings.reminder_times IS 
  'Tiempos en minutos antes del appointment para enviar recordatorios';
COMMENT ON COLUMN business_notification_settings.use_fallback IS 
  'Si falla el canal principal, intentar con el siguiente en la lista de prioridad';

-- =====================================================
-- Tabla de preferencias de notificaciones por usuario
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Relación con usuario
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Canales habilitados (el usuario puede habilitar múltiples)
  email_enabled BOOLEAN DEFAULT TRUE NOT NULL,
  sms_enabled BOOLEAN DEFAULT FALSE NOT NULL,
  whatsapp_enabled BOOLEAN DEFAULT FALSE NOT NULL,
  
  -- Contactos verificados
  email_verified BOOLEAN DEFAULT FALSE NOT NULL,
  phone_verified BOOLEAN DEFAULT FALSE NOT NULL,
  whatsapp_verified BOOLEAN DEFAULT FALSE NOT NULL,
  
  -- Preferencias por tipo de notificación
  notification_preferences JSONB DEFAULT '{
    "appointment_reminder": {"email": true, "sms": false, "whatsapp": true},
    "appointment_confirmation": {"email": true, "sms": false, "whatsapp": true},
    "appointment_cancellation": {"email": true, "sms": true, "whatsapp": true},
    "appointment_new_employee": {"email": true, "sms": false, "whatsapp": true},
    "employee_request_accepted": {"email": true, "sms": false, "whatsapp": true},
    "employee_request_rejected": {"email": true, "sms": false, "whatsapp": false},
    "job_application_accepted": {"email": true, "sms": true, "whatsapp": true},
    "job_application_rejected": {"email": true, "sms": false, "whatsapp": false},
    "job_application_interview": {"email": true, "sms": true, "whatsapp": true},
    "security_alert": {"email": true, "sms": true, "whatsapp": true}
  }'::JSONB,
  
  -- Configuración de horarios (no molestar)
  do_not_disturb_enabled BOOLEAN DEFAULT FALSE,
  do_not_disturb_start TIME DEFAULT '22:00:00',
  do_not_disturb_end TIME DEFAULT '08:00:00',
  
  -- Frecuencia de resúmenes
  daily_digest_enabled BOOLEAN DEFAULT FALSE,
  daily_digest_time TIME DEFAULT '18:00:00',
  weekly_summary_enabled BOOLEAN DEFAULT FALSE,
  weekly_summary_day INTEGER DEFAULT 1, -- 1=Lunes
  
  UNIQUE(user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id 
  ON user_notification_preferences(user_id);

-- Comentarios
COMMENT ON TABLE user_notification_preferences IS 
  'Preferencias de notificaciones personalizadas por usuario';
COMMENT ON COLUMN user_notification_preferences.notification_preferences IS 
  'Configuración detallada de qué canales usar para cada tipo de notificación';

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_user_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
  DROP TRIGGER IF EXISTS trigger_update_user_notification_preferences_updated_at 
    ON user_notification_preferences;
  
  CREATE TRIGGER trigger_update_user_notification_preferences_updated_at
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_notification_preferences_updated_at();
END $$;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_business_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
  DROP TRIGGER IF EXISTS trigger_update_business_notification_settings_updated_at 
    ON business_notification_settings;
  
  CREATE TRIGGER trigger_update_business_notification_settings_updated_at
  BEFORE UPDATE ON business_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_business_notification_settings_updated_at();
END $$;

-- ============================================================================
-- Tabla mejorada de log de notificaciones
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notification_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Relaciones
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Tipo y canal
  notification_type notification_type_enum NOT NULL,
  channel notification_channel NOT NULL,
  
  -- Destinatario
  recipient_name VARCHAR(255),
  recipient_contact VARCHAR(255) NOT NULL, -- email, phone, whatsapp number
  
  -- Contenido
  subject VARCHAR(500),
  message TEXT NOT NULL,
  
  -- Estado de entrega
  status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- pending, sent, failed, delivered, read
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Tracking
  external_id VARCHAR(255), -- ID del servicio externo (Twilio, Resend, WhatsApp)
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notification_log_business_id ON notification_log(business_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_appointment_id ON notification_log(appointment_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_status ON notification_log(status);
CREATE INDEX IF NOT EXISTS idx_notification_log_created_at ON notification_log(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_log_channel ON notification_log(channel);

-- Comentarios
COMMENT ON TABLE notification_log IS 
  'Registro de todas las notificaciones enviadas con tracking de entrega';

-- ============================================================================
-- Sistema de Vacantes Laborales
-- ============================================================================

-- Tabla de vacantes
CREATE TABLE IF NOT EXISTS public.job_vacancies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Relación con negocio
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  
  -- Información de la vacante
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  responsibilities TEXT,
  benefits TEXT,
  
  -- Detalles del puesto
  position_type VARCHAR(50) DEFAULT 'full_time', -- full_time, part_time, freelance, temporary
  experience_required VARCHAR(50), -- entry_level, mid_level, senior
  salary_min DECIMAL(10,2),
  salary_max DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'COP',
  
  -- Ubicación
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  remote_allowed BOOLEAN DEFAULT FALSE,
  
  -- Servicios requeridos (qué servicios debe poder ofrecer el empleado)
  required_services UUID[] DEFAULT ARRAY[]::UUID[], -- IDs de servicios
  preferred_services UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Estado
  status VARCHAR(50) DEFAULT 'open', -- open, paused, closed, filled
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  filled_at TIMESTAMPTZ,
  
  -- Estadísticas
  views_count INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Tabla de aplicaciones a vacantes
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Relaciones
  vacancy_id UUID NOT NULL REFERENCES public.job_vacancies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  
  -- Estado de la aplicación
  status VARCHAR(50) DEFAULT 'pending', -- pending, reviewing, interview, accepted, rejected, withdrawn
  
  -- Mensaje de presentación
  cover_letter TEXT,
  
  -- Disponibilidad
  available_from DATE,
  availability_notes TEXT,
  
  -- Seguimiento
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  interview_scheduled_at TIMESTAMPTZ,
  decision_at TIMESTAMPTZ,
  decision_notes TEXT,
  
  -- Puntuación del admin (1-5)
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  admin_notes TEXT,
  
  UNIQUE(vacancy_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_job_vacancies_business_id ON job_vacancies(business_id);
CREATE INDEX IF NOT EXISTS idx_job_vacancies_status ON job_vacancies(status);
CREATE INDEX IF NOT EXISTS idx_job_vacancies_published_at ON job_vacancies(published_at);

CREATE INDEX IF NOT EXISTS idx_job_applications_vacancy_id ON job_applications(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_business_id ON job_applications(business_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);

-- Comentarios
COMMENT ON TABLE job_vacancies IS 
  'Vacantes laborales publicadas por los negocios';
COMMENT ON TABLE job_applications IS 
  'Aplicaciones de usuarios a vacantes laborales';

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_job_vacancies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_job_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
  DROP TRIGGER IF EXISTS trigger_update_job_vacancies_updated_at ON job_vacancies;
  CREATE TRIGGER trigger_update_job_vacancies_updated_at
  BEFORE UPDATE ON job_vacancies
  FOR EACH ROW
  EXECUTE FUNCTION update_job_vacancies_updated_at();
  
  DROP TRIGGER IF EXISTS trigger_update_job_applications_updated_at ON job_applications;
  CREATE TRIGGER trigger_update_job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_job_applications_updated_at();
END $$;

-- Trigger para incrementar applications_count
CREATE OR REPLACE FUNCTION increment_vacancy_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE job_vacancies 
  SET applications_count = applications_count + 1
  WHERE id = NEW.vacancy_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
  DROP TRIGGER IF EXISTS trigger_increment_vacancy_applications ON job_applications;
  CREATE TRIGGER trigger_increment_vacancy_applications
  AFTER INSERT ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION increment_vacancy_applications_count();
END $$;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE business_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Policies para business_notification_settings
CREATE POLICY "business_notification_settings_select_policy"
  ON business_notification_settings FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
      UNION
      SELECT business_id FROM business_employees WHERE employee_id = auth.uid()
    )
  );

CREATE POLICY "business_notification_settings_insert_policy"
  ON business_notification_settings FOR INSERT
  WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "business_notification_settings_update_policy"
  ON business_notification_settings FOR UPDATE
  USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- Policies para notification_log
CREATE POLICY "notification_log_select_policy"
  ON notification_log FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
      UNION
      SELECT business_id FROM business_employees WHERE employee_id = auth.uid()
    )
  );

-- Service role puede hacer todo
CREATE POLICY "notification_log_service_policy"
  ON notification_log FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Policies para user_notification_preferences
CREATE POLICY "user_notification_preferences_select_own"
  ON user_notification_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_notification_preferences_insert_own"
  ON user_notification_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_notification_preferences_update_own"
  ON user_notification_preferences FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "user_notification_preferences_delete_own"
  ON user_notification_preferences FOR DELETE
  USING (user_id = auth.uid());

-- Policies para job_vacancies
CREATE POLICY "job_vacancies_select_all"
  ON job_vacancies FOR SELECT
  USING (status = 'open' OR business_id IN (
    SELECT id FROM businesses WHERE owner_id = auth.uid()
    UNION
    SELECT business_id FROM business_employees WHERE employee_id = auth.uid()
  ));

CREATE POLICY "job_vacancies_insert_business_owner"
  ON job_vacancies FOR INSERT
  WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "job_vacancies_update_business_owner"
  ON job_vacancies FOR UPDATE
  USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "job_vacancies_delete_business_owner"
  ON job_vacancies FOR DELETE
  USING (
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

-- Policies para job_applications
CREATE POLICY "job_applications_select_policy"
  ON job_applications FOR SELECT
  USING (
    user_id = auth.uid() OR
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
      UNION
      SELECT business_id FROM business_employees WHERE employee_id = auth.uid()
    )
  );

CREATE POLICY "job_applications_insert_own"
  ON job_applications FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "job_applications_update_own"
  ON job_applications FOR UPDATE
  USING (
    user_id = auth.uid() OR
    business_id IN (SELECT id FROM businesses WHERE owner_id = auth.uid())
  );

CREATE POLICY "job_applications_delete_own"
  ON job_applications FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- Función auxiliar para crear preferencias default al crear usuario
-- ============================================================================

CREATE OR REPLACE FUNCTION create_default_user_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear preferencias automáticamente cuando se crea un profile
DO $$ 
BEGIN
  DROP TRIGGER IF EXISTS trigger_create_user_notification_preferences ON profiles;
  CREATE TRIGGER trigger_create_user_notification_preferences
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_notification_preferences();
END $$;

-- ============================================================================
-- Función auxiliar para crear configuración default al crear negocio
-- ============================================================================

CREATE OR REPLACE FUNCTION create_default_business_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.business_notification_settings (business_id)
  VALUES (NEW.id)
  ON CONFLICT (business_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear configuración automáticamente
DO $$ 
BEGIN
  DROP TRIGGER IF EXISTS trigger_create_business_notification_settings ON businesses;
  CREATE TRIGGER trigger_create_business_notification_settings
  AFTER INSERT ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION create_default_business_notification_settings();
END $$;
