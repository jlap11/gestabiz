-- =============================================
-- MIGRATION: Business Configuration System
-- DATE: 2025-11-16
-- DESCRIPTION: Agregar campo is_configured y sistema automático de validación
-- =============================================

-- 1. Agregar campo is_configured a businesses
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS is_configured BOOLEAN DEFAULT false NOT NULL;
COMMENT ON COLUMN public.businesses.is_configured IS 
'TRUE si el negocio está completamente configurado y puede brindar servicios públicamente. 
Requiere: ≥1 sede activa, ≥1 servicio en sede, ≥1 empleado o recurso asignado al servicio.';
-- 2. Crear índice para búsquedas públicas
CREATE INDEX IF NOT EXISTS idx_businesses_is_configured 
ON public.businesses(is_configured) 
WHERE is_configured = true;
COMMENT ON INDEX idx_businesses_is_configured IS 
'Optimiza búsquedas de negocios configurados para clientes.';
-- =============================================
-- 3. FUNCIÓN: Validar configuración completa de negocio
-- =============================================
CREATE OR REPLACE FUNCTION public.validate_business_configuration(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_resource_model TEXT;
  v_has_active_locations BOOLEAN;
  v_has_services_in_locations BOOLEAN;
  v_has_assignees BOOLEAN;
BEGIN
  -- Obtener modelo de negocio
  SELECT resource_model INTO v_resource_model
  FROM public.businesses
  WHERE id = p_business_id;

  IF v_resource_model IS NULL THEN
    RETURN false; -- Negocio no existe
  END IF;

  -- VALIDACIÓN 1: Tiene al menos 1 sede activa
  SELECT EXISTS(
    SELECT 1 FROM public.locations
    WHERE business_id = p_business_id
    AND is_active = true
    LIMIT 1
  ) INTO v_has_active_locations;

  IF NOT v_has_active_locations THEN
    RETURN false;
  END IF;

  -- VALIDACIÓN 2: Las sedes activas tienen servicios asociados
  SELECT EXISTS(
    SELECT 1 
    FROM public.locations l
    INNER JOIN public.location_services ls ON ls.location_id = l.id
    WHERE l.business_id = p_business_id
    AND l.is_active = true
    LIMIT 1
  ) INTO v_has_services_in_locations;

  IF NOT v_has_services_in_locations THEN
    RETURN false;
  END IF;

  -- VALIDACIÓN 3: Los servicios tienen empleados o recursos asignados
  -- Depende del resource_model del negocio
  CASE v_resource_model
    WHEN 'professional' THEN
      -- Requiere empleados asignados a servicios
      SELECT EXISTS(
        SELECT 1
        FROM public.locations l
        INNER JOIN public.location_services ls ON ls.location_id = l.id
        INNER JOIN public.employee_services es ON es.service_id = ls.service_id
        INNER JOIN public.business_employees be ON be.employee_id = es.employee_id
        WHERE l.business_id = p_business_id
        AND l.is_active = true
        AND be.is_active = true
        LIMIT 1
      ) INTO v_has_assignees;

    WHEN 'physical_resource' THEN
      -- Requiere recursos físicos asignados a servicios
      SELECT EXISTS(
        SELECT 1
        FROM public.locations l
        INNER JOIN public.location_services ls ON ls.location_id = l.id
        INNER JOIN public.resource_services rs ON rs.service_id = ls.service_id
        INNER JOIN public.business_resources br ON br.id = rs.resource_id
        WHERE l.business_id = p_business_id
        AND l.is_active = true
        AND br.is_active = true
        LIMIT 1
      ) INTO v_has_assignees;

    WHEN 'hybrid' THEN
      -- Requiere al menos 1 empleado O 1 recurso físico
      SELECT (
        EXISTS(
          SELECT 1
          FROM public.locations l
          INNER JOIN public.location_services ls ON ls.location_id = l.id
          INNER JOIN public.employee_services es ON es.service_id = ls.service_id
          INNER JOIN public.business_employees be ON be.employee_id = es.employee_id
          WHERE l.business_id = p_business_id
          AND l.is_active = true
          AND be.is_active = true
          LIMIT 1
        )
        OR
        EXISTS(
          SELECT 1
          FROM public.locations l
          INNER JOIN public.location_services ls ON ls.location_id = l.id
          INNER JOIN public.resource_services rs ON rs.service_id = ls.service_id
          INNER JOIN public.business_resources br ON br.id = rs.resource_id
          WHERE l.business_id = p_business_id
          AND l.is_active = true
          AND br.is_active = true
          LIMIT 1
        )
      ) INTO v_has_assignees;

    WHEN 'group_class' THEN
      -- Clases grupales no requieren empleados/recursos específicos
      -- Solo necesita sedes activas + servicios
      v_has_assignees := true;

    ELSE
      v_has_assignees := false;
  END CASE;

  RETURN v_has_assignees;
END;
$$;
COMMENT ON FUNCTION public.validate_business_configuration(UUID) IS 
'Valida si un negocio está completamente configurado para operar públicamente.
Retorna TRUE si tiene sedes activas, servicios en sedes, y empleados/recursos asignados según su resource_model.';
-- =============================================
-- 4. FUNCIÓN: Actualizar campo is_configured
-- =============================================
CREATE OR REPLACE FUNCTION public.update_business_configuration(p_business_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_configured BOOLEAN;
  v_old_configured BOOLEAN;
  v_owner_id UUID;
BEGIN
  -- Obtener estado anterior y owner
  SELECT is_configured, owner_id INTO v_old_configured, v_owner_id
  FROM public.businesses
  WHERE id = p_business_id;

  -- Calcular nueva configuración
  v_is_configured := public.validate_business_configuration(p_business_id);

  -- Actualizar solo si cambió el estado
  IF v_is_configured != v_old_configured THEN
    UPDATE public.businesses
    SET is_configured = v_is_configured,
        updated_at = NOW()
    WHERE id = p_business_id;

    -- Si cambió de TRUE → FALSE, crear notificación in-app
    IF v_old_configured = true AND v_is_configured = false THEN
      INSERT INTO public.in_app_notifications (
        user_id,
        type,
        title,
        message,
        data,
        read,
        created_at
      ) VALUES (
        v_owner_id,
        'business_unconfigured',
        'Negocio no disponible al público',
        'Tu negocio ya no está visible para clientes porque faltan configuraciones requeridas (sedes activas, servicios o empleados/recursos asignados).',
        jsonb_build_object('business_id', p_business_id),
        false,
        NOW()
      );
    END IF;
  END IF;
END;
$$;
COMMENT ON FUNCTION public.update_business_configuration(UUID) IS 
'Recalcula y actualiza el campo is_configured de un negocio.
Si cambia de TRUE → FALSE, crea notificación in-app para el owner.';
-- =============================================
-- 5. TRIGGERS: Recalcular is_configured automáticamente
-- =============================================

-- TRIGGER 1: Cuando se crea/actualiza/elimina una sede (locations)
CREATE OR REPLACE FUNCTION public.trigger_update_business_config_on_location()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.update_business_configuration(OLD.business_id);
    RETURN OLD;
  ELSE
    PERFORM public.update_business_configuration(NEW.business_id);
    RETURN NEW;
  END IF;
END;
$$;
DROP TRIGGER IF EXISTS trg_update_business_config_on_location ON public.locations;
CREATE TRIGGER trg_update_business_config_on_location
AFTER INSERT OR UPDATE OF is_active OR DELETE
ON public.locations
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_business_config_on_location();
-- TRIGGER 2: Cuando se crea/elimina un servicio en sede (location_services)
CREATE OR REPLACE FUNCTION public.trigger_update_business_config_on_location_service()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_business_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT business_id INTO v_business_id
    FROM public.locations
    WHERE id = OLD.location_id;
  ELSE
    SELECT business_id INTO v_business_id
    FROM public.locations
    WHERE id = NEW.location_id;
  END IF;

  IF v_business_id IS NOT NULL THEN
    PERFORM public.update_business_configuration(v_business_id);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;
DROP TRIGGER IF EXISTS trg_update_business_config_on_location_service ON public.location_services;
CREATE TRIGGER trg_update_business_config_on_location_service
AFTER INSERT OR DELETE
ON public.location_services
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_business_config_on_location_service();
-- TRIGGER 3: Cuando se vincula/desvincula empleado a servicio (employee_services)
CREATE OR REPLACE FUNCTION public.trigger_update_business_config_on_employee_service()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_business_id UUID;
BEGIN
  -- Obtener business_id desde el servicio
  IF TG_OP = 'DELETE' THEN
    SELECT business_id INTO v_business_id
    FROM public.services
    WHERE id = OLD.service_id;
  ELSE
    SELECT business_id INTO v_business_id
    FROM public.services
    WHERE id = NEW.service_id;
  END IF;

  IF v_business_id IS NOT NULL THEN
    PERFORM public.update_business_configuration(v_business_id);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;
DROP TRIGGER IF EXISTS trg_update_business_config_on_employee_service ON public.employee_services;
CREATE TRIGGER trg_update_business_config_on_employee_service
AFTER INSERT OR DELETE
ON public.employee_services
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_business_config_on_employee_service();
-- TRIGGER 4: Cuando se vincula/desvincula recurso a servicio (resource_services)
CREATE OR REPLACE FUNCTION public.trigger_update_business_config_on_resource_service()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_business_id UUID;
BEGIN
  -- Obtener business_id desde el servicio
  IF TG_OP = 'DELETE' THEN
    SELECT business_id INTO v_business_id
    FROM public.services
    WHERE id = OLD.service_id;
  ELSE
    SELECT business_id INTO v_business_id
    FROM public.services
    WHERE id = NEW.service_id;
  END IF;

  IF v_business_id IS NOT NULL THEN
    PERFORM public.update_business_configuration(v_business_id);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;
DROP TRIGGER IF EXISTS trg_update_business_config_on_resource_service ON public.resource_services;
CREATE TRIGGER trg_update_business_config_on_resource_service
AFTER INSERT OR DELETE
ON public.resource_services
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_business_config_on_resource_service();
-- TRIGGER 5: Cuando se activa/desactiva un empleado (business_employees)
CREATE OR REPLACE FUNCTION public.trigger_update_business_config_on_employee_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.is_active != NEW.is_active THEN
    PERFORM public.update_business_configuration(NEW.business_id);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_update_business_config_on_employee_status ON public.business_employees;
CREATE TRIGGER trg_update_business_config_on_employee_status
AFTER UPDATE OF is_active
ON public.business_employees
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_business_config_on_employee_status();
-- TRIGGER 6: Cuando se activa/desactiva un recurso físico (business_resources)
CREATE OR REPLACE FUNCTION public.trigger_update_business_config_on_resource_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.is_active != NEW.is_active THEN
    PERFORM public.update_business_configuration(NEW.business_id);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_update_business_config_on_resource_status ON public.business_resources;
CREATE TRIGGER trg_update_business_config_on_resource_status
AFTER UPDATE OF is_active
ON public.business_resources
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_business_config_on_resource_status();
-- =============================================
-- 6. RECALCULAR is_configured para negocios existentes
-- =============================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.businesses
  LOOP
    PERFORM public.update_business_configuration(r.id);
  END LOOP;
END;
$$;
-- =============================================
-- 7. RLS POLICIES (si aplica)
-- =============================================
-- El campo is_configured es público (lectura para todos)
-- No requiere políticas especiales, ya hereda las de businesses;
