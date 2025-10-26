-- =====================================================
-- SISTEMA DE PERMISOS GRANULAR - Gestabiz
-- Fecha: 13 de Octubre de 2025
-- Autor: AI Assistant
-- =====================================================
-- IMPORTANTE: Solo existe rol 'admin', se diferencia Admin Dueño por user_id === businesses.owner_id
-- =====================================================

-- 1. TABLA: business_roles
-- Almacena roles de usuarios en negocios (admin, employee)
CREATE TABLE IF NOT EXISTS business_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
  employee_type TEXT CHECK (employee_type IN ('service_provider', 'support_staff', NULL)),
  assigned_by UUID REFERENCES profiles(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, user_id, role)
);

COMMENT ON TABLE business_roles IS 'Roles de usuarios en negocios. Admin Dueño se identifica por user_id === businesses.owner_id';
COMMENT ON COLUMN business_roles.role IS 'Solo admin o employee. Admin Dueño se determina comparando user_id con businesses.owner_id';
COMMENT ON COLUMN business_roles.employee_type IS 'Tipo de empleado: service_provider (ofrece servicios) o support_staff (no ofrece servicios)';
COMMENT ON COLUMN business_roles.assigned_by IS 'Usuario que asignó este rol';

-- 2. TABLA: user_permissions
-- Permisos granulares por usuario y negocio
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL,
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, user_id, permission)
);

COMMENT ON TABLE user_permissions IS 'Permisos granulares por usuario y negocio. Admin Dueño bypasea todas las verificaciones';
COMMENT ON COLUMN user_permissions.permission IS 'Nombre del permiso (ej: locations.create, services.edit, employees.delete)';
COMMENT ON COLUMN user_permissions.expires_at IS 'Fecha de expiración del permiso (NULL = permanente)';

-- 3. TABLA: permission_templates
-- Plantillas de permisos reutilizables
CREATE TABLE IF NOT EXISTS permission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system_template BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE permission_templates IS 'Plantillas de permisos reutilizables (ej: "Gerente de Sede", "Recepcionista")';
COMMENT ON COLUMN permission_templates.is_system_template IS 'true = plantilla predefinida del sistema, false = creada por usuario';

-- 4. TABLA: permission_audit_log
-- Auditoría de cambios en permisos y roles
CREATE TABLE IF NOT EXISTS permission_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL CHECK (action IN ('grant', 'revoke', 'modify', 'assign_role', 'remove_role')),
  permission TEXT,
  old_value TEXT,
  new_value TEXT,
  performed_by UUID NOT NULL REFERENCES profiles(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

COMMENT ON TABLE permission_audit_log IS 'Auditoría de cambios en permisos y roles';
COMMENT ON COLUMN permission_audit_log.action IS 'Tipo de acción: grant, revoke, modify, assign_role, remove_role';

-- 5. EXTENDER business_employees
-- Agregar campos para tipos de empleado
ALTER TABLE business_employees 
  ADD COLUMN IF NOT EXISTS employee_type TEXT CHECK (employee_type IN ('service_provider', 'support_staff')) DEFAULT 'service_provider',
  ADD COLUMN IF NOT EXISTS offers_services BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN business_employees.employee_type IS 'Tipo de empleado: service_provider (barbero, masajista) o support_staff (aseo, recepción)';
COMMENT ON COLUMN business_employees.offers_services IS 'Indica si el empleado puede ofrecer servicios (false para staff de soporte)';

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- business_roles
CREATE INDEX IF NOT EXISTS idx_business_roles_business_id ON business_roles(business_id);
CREATE INDEX IF NOT EXISTS idx_business_roles_user_id ON business_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_business_roles_role ON business_roles(role);
CREATE INDEX IF NOT EXISTS idx_business_roles_active ON business_roles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_business_roles_lookup ON business_roles(business_id, user_id, is_active);

-- user_permissions
CREATE INDEX IF NOT EXISTS idx_user_permissions_business_id ON user_permissions(business_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission);
CREATE INDEX IF NOT EXISTS idx_user_permissions_active ON user_permissions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_permissions_lookup ON user_permissions(business_id, user_id, is_active);

-- permission_templates
CREATE INDEX IF NOT EXISTS idx_permission_templates_business_id ON permission_templates(business_id);
CREATE INDEX IF NOT EXISTS idx_permission_templates_role ON permission_templates(role);
CREATE INDEX IF NOT EXISTS idx_permission_templates_system ON permission_templates(is_system_template);

-- permission_audit_log
CREATE INDEX IF NOT EXISTS idx_permission_audit_business_id ON permission_audit_log(business_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_user_id ON permission_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_performed_by ON permission_audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_permission_audit_performed_at ON permission_audit_log(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_permission_audit_action ON permission_audit_log(action);

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Función para verificar si un usuario es Admin Dueño
CREATE OR REPLACE FUNCTION is_business_owner(p_user_id UUID, p_business_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM businesses 
    WHERE id = p_business_id 
    AND owner_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_business_owner IS 'Verifica si el usuario es el dueño del negocio (Admin Dueño)';

-- Función para obtener permisos de un usuario
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id UUID, p_business_id UUID)
RETURNS TABLE(permission TEXT) AS $$
BEGIN
  -- Si es Admin Dueño, retornar array vacío (bypasea verificaciones)
  IF is_business_owner(p_user_id, p_business_id) THEN
    RETURN QUERY SELECT 'owner.all_permissions'::TEXT;
    RETURN;
  END IF;

  -- Retornar permisos activos del usuario
  RETURN QUERY
  SELECT up.permission
  FROM user_permissions up
  WHERE up.user_id = p_user_id
    AND up.business_id = p_business_id
    AND up.is_active = true
    AND (up.expires_at IS NULL OR up.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_permissions IS 'Obtiene permisos activos de un usuario. Admin Dueño bypasea todas las restricciones';

-- =====================================================
-- TRIGGERS PARA AUDIT LOG
-- =====================================================

-- Trigger para auditar cambios en business_roles
CREATE OR REPLACE FUNCTION audit_business_roles_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO permission_audit_log (business_id, user_id, action, new_value, performed_by, notes)
    VALUES (NEW.business_id, NEW.user_id, 'assign_role', NEW.role, NEW.assigned_by, NEW.notes);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.role != NEW.role OR OLD.is_active != NEW.is_active THEN
      INSERT INTO permission_audit_log (business_id, user_id, action, old_value, new_value, performed_by, notes)
      VALUES (NEW.business_id, NEW.user_id, 'modify', OLD.role || '|' || OLD.is_active::TEXT, NEW.role || '|' || NEW.is_active::TEXT, auth.uid(), NEW.notes);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO permission_audit_log (business_id, user_id, action, old_value, performed_by)
    VALUES (OLD.business_id, OLD.user_id, 'remove_role', OLD.role, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_audit_business_roles
AFTER INSERT OR UPDATE OR DELETE ON business_roles
FOR EACH ROW EXECUTE FUNCTION audit_business_roles_changes();

-- Trigger para auditar cambios en user_permissions
CREATE OR REPLACE FUNCTION audit_user_permissions_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO permission_audit_log (business_id, user_id, action, permission, new_value, performed_by, notes)
    VALUES (NEW.business_id, NEW.user_id, 'grant', NEW.permission, 'granted', NEW.granted_by, NEW.notes);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_active != NEW.is_active THEN
      INSERT INTO permission_audit_log (business_id, user_id, action, permission, old_value, new_value, performed_by, notes)
      VALUES (NEW.business_id, NEW.user_id, 'modify', NEW.permission, OLD.is_active::TEXT, NEW.is_active::TEXT, auth.uid(), NEW.notes);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO permission_audit_log (business_id, user_id, action, permission, old_value, performed_by)
    VALUES (OLD.business_id, OLD.user_id, 'revoke', OLD.permission, 'revoked', auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_audit_user_permissions
AFTER INSERT OR UPDATE OR DELETE ON user_permissions
FOR EACH ROW EXECUTE FUNCTION audit_user_permissions_changes();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE business_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_audit_log ENABLE ROW LEVEL SECURITY;

-- ==================== business_roles ====================

-- SELECT: Admin Dueño puede ver todos, Admin Asignado/Employee solo sus propios roles
CREATE POLICY business_roles_select ON business_roles
  FOR SELECT
  USING (
    -- Admin Dueño ve todos los roles de su negocio
    is_business_owner(auth.uid(), business_id)
    OR
    -- Usuario ve sus propios roles
    user_id = auth.uid()
    OR
    -- Admin Asignado con permiso permissions.view puede ver roles
    (
      EXISTS (
        SELECT 1 FROM user_permissions up
        WHERE up.user_id = auth.uid()
          AND up.business_id = business_roles.business_id
          AND up.permission = 'permissions.view'
          AND up.is_active = true
      )
    )
  );

-- INSERT: Solo Admin Dueño o Admin con permiso permissions.assign_*
CREATE POLICY business_roles_insert ON business_roles
  FOR INSERT
  WITH CHECK (
    -- Admin Dueño puede asignar cualquier rol
    is_business_owner(auth.uid(), business_id)
    OR
    -- Admin con permiso puede asignar employee
    (
      role = 'employee' AND
      EXISTS (
        SELECT 1 FROM user_permissions up
        WHERE up.user_id = auth.uid()
          AND up.business_id = business_roles.business_id
          AND up.permission = 'permissions.assign_employee'
          AND up.is_active = true
      )
    )
  );

-- UPDATE: Solo Admin Dueño o Admin con permiso permissions.modify
CREATE POLICY business_roles_update ON business_roles
  FOR UPDATE
  USING (
    -- Admin Dueño puede modificar cualquier rol
    is_business_owner(auth.uid(), business_id)
    OR
    -- Admin con permiso puede modificar
    EXISTS (
      SELECT 1 FROM user_permissions up
      WHERE up.user_id = auth.uid()
        AND up.business_id = business_roles.business_id
        AND up.permission = 'permissions.modify'
        AND up.is_active = true
    )
  );

-- DELETE: Solo Admin Dueño o Admin con permiso permissions.revoke
CREATE POLICY business_roles_delete ON business_roles
  FOR DELETE
  USING (
    -- Admin Dueño puede eliminar cualquier rol (excepto su propio admin)
    (is_business_owner(auth.uid(), business_id) AND NOT (user_id = auth.uid() AND role = 'admin'))
    OR
    -- Admin con permiso puede revocar
    EXISTS (
      SELECT 1 FROM user_permissions up
      WHERE up.user_id = auth.uid()
        AND up.business_id = business_roles.business_id
        AND up.permission = 'permissions.revoke'
        AND up.is_active = true
    )
  );

-- ==================== user_permissions ====================

-- SELECT: Admin Dueño ve todos, Admin/Employee ven los suyos
CREATE POLICY user_permissions_select ON user_permissions
  FOR SELECT
  USING (
    -- Admin Dueño ve todos los permisos
    is_business_owner(auth.uid(), business_id)
    OR
    -- Usuario ve sus propios permisos
    user_id = auth.uid()
    OR
    -- Admin con permiso permissions.view
    EXISTS (
      SELECT 1 FROM user_permissions up
      WHERE up.user_id = auth.uid()
        AND up.business_id = user_permissions.business_id
        AND up.permission = 'permissions.view'
        AND up.is_active = true
    )
  );

-- INSERT: Solo Admin Dueño o Admin con permiso permissions.modify
CREATE POLICY user_permissions_insert ON user_permissions
  FOR INSERT
  WITH CHECK (
    -- Admin Dueño puede otorgar permisos
    is_business_owner(auth.uid(), business_id)
    OR
    -- Admin con permiso puede otorgar permisos a employees
    EXISTS (
      SELECT 1 FROM user_permissions up
      WHERE up.user_id = auth.uid()
        AND up.business_id = user_permissions.business_id
        AND up.permission = 'permissions.modify'
        AND up.is_active = true
    )
  );

-- UPDATE: Solo Admin Dueño o Admin con permiso permissions.modify
CREATE POLICY user_permissions_update ON user_permissions
  FOR UPDATE
  USING (
    is_business_owner(auth.uid(), business_id)
    OR
    EXISTS (
      SELECT 1 FROM user_permissions up
      WHERE up.user_id = auth.uid()
        AND up.business_id = user_permissions.business_id
        AND up.permission = 'permissions.modify'
        AND up.is_active = true
    )
  );

-- DELETE: Solo Admin Dueño o Admin con permiso permissions.revoke
CREATE POLICY user_permissions_delete ON user_permissions
  FOR DELETE
  USING (
    is_business_owner(auth.uid(), business_id)
    OR
    EXISTS (
      SELECT 1 FROM user_permissions up
      WHERE up.user_id = auth.uid()
        AND up.business_id = user_permissions.business_id
        AND up.permission = 'permissions.revoke'
        AND up.is_active = true
    )
  );

-- ==================== permission_templates ====================

-- SELECT: Todos los usuarios del negocio pueden ver templates
CREATE POLICY permission_templates_select ON permission_templates
  FOR SELECT
  USING (
    -- Templates del sistema son públicas
    is_system_template = true
    OR
    -- Admin Dueño ve todas las templates de su negocio
    is_business_owner(auth.uid(), business_id)
    OR
    -- Admin con permiso permissions.view
    EXISTS (
      SELECT 1 FROM user_permissions up
      WHERE up.user_id = auth.uid()
        AND up.business_id = permission_templates.business_id
        AND up.permission = 'permissions.view'
        AND up.is_active = true
    )
  );

-- INSERT: Solo Admin Dueño o Admin con permiso permissions.modify
CREATE POLICY permission_templates_insert ON permission_templates
  FOR INSERT
  WITH CHECK (
    is_business_owner(auth.uid(), business_id)
    OR
    EXISTS (
      SELECT 1 FROM user_permissions up
      WHERE up.user_id = auth.uid()
        AND up.business_id = permission_templates.business_id
        AND up.permission = 'permissions.modify'
        AND up.is_active = true
    )
  );

-- UPDATE: Solo Admin Dueño o Admin con permiso permissions.modify
CREATE POLICY permission_templates_update ON permission_templates
  FOR UPDATE
  USING (
    -- No se pueden modificar templates del sistema
    is_system_template = false
    AND (
      is_business_owner(auth.uid(), business_id)
      OR
      EXISTS (
        SELECT 1 FROM user_permissions up
        WHERE up.user_id = auth.uid()
          AND up.business_id = permission_templates.business_id
          AND up.permission = 'permissions.modify'
          AND up.is_active = true
      )
    )
  );

-- DELETE: Solo Admin Dueño o Admin con permiso permissions.modify
CREATE POLICY permission_templates_delete ON permission_templates
  FOR DELETE
  USING (
    -- No se pueden eliminar templates del sistema
    is_system_template = false
    AND (
      is_business_owner(auth.uid(), business_id)
      OR
      EXISTS (
        SELECT 1 FROM user_permissions up
        WHERE up.user_id = auth.uid()
          AND up.business_id = permission_templates.business_id
          AND up.permission = 'permissions.modify'
          AND up.is_active = true
      )
    )
  );

-- ==================== permission_audit_log ====================

-- SELECT: Admin Dueño y Admin con permiso permissions.view pueden ver audit log
CREATE POLICY permission_audit_log_select ON permission_audit_log
  FOR SELECT
  USING (
    is_business_owner(auth.uid(), business_id)
    OR
    EXISTS (
      SELECT 1 FROM user_permissions up
      WHERE up.user_id = auth.uid()
        AND up.business_id = permission_audit_log.business_id
        AND up.permission = 'permissions.view'
        AND up.is_active = true
    )
  );

-- INSERT: Sistema (triggers)
CREATE POLICY permission_audit_log_insert ON permission_audit_log
  FOR INSERT
  WITH CHECK (true); -- Los triggers tienen SECURITY DEFINER

-- =====================================================
-- MIGRACIÓN DE DATOS EXISTENTES
-- =====================================================

-- Crear business_role 'admin' para todos los owners actuales
INSERT INTO business_roles (business_id, user_id, role, assigned_by, assigned_at, is_active)
SELECT 
  b.id AS business_id,
  b.owner_id AS user_id,
  'admin' AS role,
  b.owner_id AS assigned_by,
  b.created_at AS assigned_at,
  true AS is_active
FROM businesses b
WHERE b.owner_id IS NOT NULL
ON CONFLICT (business_id, user_id, role) DO NOTHING;

-- Crear business_role 'employee' para todos los employees actuales
INSERT INTO business_roles (business_id, user_id, role, employee_type, assigned_by, assigned_at, is_active)
SELECT 
  be.business_id,
  be.employee_id AS user_id,
  'employee' AS role,
  COALESCE(be.employee_type, 'service_provider') AS employee_type,
  (SELECT owner_id FROM businesses WHERE id = be.business_id) AS assigned_by,
  be.created_at AS assigned_at,
  true AS is_active
FROM business_employees be
ON CONFLICT (business_id, user_id, role) DO NOTHING;

-- =====================================================
-- PLANTILLAS DE PERMISOS DEL SISTEMA
-- =====================================================

-- Template: Admin Completo (para Admin Asignado)
INSERT INTO permission_templates (name, description, role, permissions, is_system_template)
VALUES (
  'Admin Completo',
  'Permisos completos de administración (excepto asignar otros admins)',
  'admin',
  '[
    "business.view", "business.edit", "business.settings", "business.categories",
    "locations.view", "locations.create", "locations.edit", "locations.delete", "locations.assign_employees",
    "services.view", "services.create", "services.edit", "services.delete", "services.prices",
    "employees.view", "employees.create", "employees.edit", "employees.assign_services", "employees.set_schedules",
    "appointments.view_all", "appointments.create", "appointments.edit", "appointments.delete", "appointments.assign", "appointments.confirm",
    "clients.view", "clients.create", "clients.edit", "clients.export", "clients.communication",
    "accounting.view", "accounting.expenses.view", "accounting.expenses.create", "accounting.payroll.view",
    "reports.view_financial", "reports.view_operations", "reports.export", "reports.analytics",
    "permissions.view", "permissions.assign_employee", "permissions.modify",
    "notifications.send", "settings.view", "settings.edit_business"
  ]'::jsonb,
  true
);

-- Template: Gerente de Sede
INSERT INTO permission_templates (name, description, role, permissions, is_system_template)
VALUES (
  'Gerente de Sede',
  'Gestión de citas, empleados y clientes en sede específica',
  'admin',
  '[
    "business.view",
    "locations.view", "locations.edit",
    "services.view",
    "employees.view", "employees.edit", "employees.set_schedules",
    "appointments.view_all", "appointments.create", "appointments.edit", "appointments.assign", "appointments.confirm",
    "clients.view", "clients.create", "clients.edit", "clients.communication",
    "reports.view_operations",
    "settings.view"
  ]'::jsonb,
  true
);

-- Template: Contador
INSERT INTO permission_templates (name, description, role, permissions, is_system_template)
VALUES (
  'Contador',
  'Acceso completo a módulo contable y reportes financieros',
  'admin',
  '[
    "business.view",
    "accounting.view", "accounting.tax_config", "accounting.expenses.view", "accounting.expenses.create", "accounting.expenses.pay",
    "accounting.payroll.view", "accounting.payroll.create", "accounting.payroll.config", "accounting.export",
    "reports.view_financial", "reports.export", "reports.analytics",
    "settings.view"
  ]'::jsonb,
  true
);

-- Template: Recepcionista
INSERT INTO permission_templates (name, description, role, permissions, is_system_template)
VALUES (
  'Recepcionista',
  'Gestión de citas y clientes',
  'employee',
  '[
    "business.view",
    "services.view",
    "appointments.view_all", "appointments.create", "appointments.edit", "appointments.confirm",
    "clients.view", "clients.create", "clients.edit",
    "settings.view", "settings.edit_own"
  ]'::jsonb,
  true
);

-- Template: Profesional (Service Provider)
INSERT INTO permission_templates (name, description, role, permissions, is_system_template)
VALUES (
  'Profesional',
  'Employee que ofrece servicios (barbero, masajista, etc.)',
  'employee',
  '[
    "business.view",
    "services.view",
    "appointments.view_own", "appointments.edit",
    "clients.view",
    "settings.view", "settings.edit_own"
  ]'::jsonb,
  true
);

-- Template: Staff de Soporte
INSERT INTO permission_templates (name, description, role, permissions, is_system_template)
VALUES (
  'Staff de Soporte',
  'Empleado que no ofrece servicios (aseo, mantenimiento, etc.)',
  'employee',
  '[
    "business.view",
    "settings.view", "settings.edit_own"
  ]'::jsonb,
  true
);

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================
