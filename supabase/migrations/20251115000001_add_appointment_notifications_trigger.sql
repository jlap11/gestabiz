-- Migration: Add trigger for in-app notifications on appointment creation
-- Description: Creates notifications for employee, client, and business when a new appointment is created
-- Date: 2025-11-15

-- ============================================================================
-- 1. FUNCIÓN: Crear notificaciones in-app al crear una cita
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_appointment_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_business_name TEXT;
    v_service_name TEXT;
    v_client_name TEXT;
    v_employee_name TEXT;
    v_appointment_time TEXT;
    v_business_owner_id UUID;
BEGIN
    -- Obtener información del negocio
    SELECT name, owner_id 
    INTO v_business_name, v_business_owner_id
    FROM businesses 
    WHERE id = NEW.business_id;

    -- Obtener nombre del servicio (si existe)
    SELECT name 
    INTO v_service_name
    FROM services 
    WHERE id = NEW.service_id;

    -- Obtener nombre del cliente
    SELECT full_name 
    INTO v_client_name
    FROM profiles 
    WHERE id = NEW.client_id;

    -- Obtener nombre del empleado (si existe)
    IF NEW.employee_id IS NOT NULL THEN
        SELECT full_name 
        INTO v_employee_name
        FROM profiles 
        WHERE id = NEW.employee_id;
    END IF;

    -- Formatear la hora de la cita
    v_appointment_time := TO_CHAR(NEW.start_time AT TIME ZONE 'America/Bogota', 'DD/MM/YYYY HH24:MI');

    -- 1. NOTIFICAR AL EMPLEADO (si existe y es diferente del cliente)
    IF NEW.employee_id IS NOT NULL AND NEW.employee_id != NEW.client_id THEN
        INSERT INTO in_app_notifications (
            user_id,
            type,
            title,
            message,
            data,
            business_id,
            priority,
            status,
            action_url
        ) VALUES (
            NEW.employee_id,
            'appointment_new_employee',
            'Nueva Cita Asignada',
            CASE 
                WHEN v_service_name IS NOT NULL THEN
                    'Tienes una nueva cita de ' || v_service_name || ' con ' || COALESCE(v_client_name, 'un cliente') || ' el ' || v_appointment_time
                ELSE
                    'Tienes una nueva cita con ' || COALESCE(v_client_name, 'un cliente') || ' el ' || v_appointment_time
            END,
            jsonb_build_object(
                'appointment_id', NEW.id,
                'client_id', NEW.client_id,
                'client_name', v_client_name,
                'service_id', NEW.service_id,
                'service_name', v_service_name,
                'start_time', NEW.start_time,
                'business_id', NEW.business_id,
                'business_name', v_business_name
            ),
            NEW.business_id,
            2, -- Alta prioridad
            'unread',
            '/app/employee/appointments'
        );
    END IF;

    -- 2. NOTIFICAR AL CLIENTE (si es diferente del empleado)
    IF NEW.client_id != NEW.employee_id OR NEW.employee_id IS NULL THEN
        INSERT INTO in_app_notifications (
            user_id,
            type,
            title,
            message,
            data,
            business_id,
            priority,
            status,
            action_url
        ) VALUES (
            NEW.client_id,
            'appointment_new_client',
            'Cita Confirmada',
            CASE 
                WHEN v_service_name IS NOT NULL AND v_employee_name IS NOT NULL THEN
                    'Tu cita de ' || v_service_name || ' con ' || v_employee_name || ' en ' || v_business_name || ' está programada para el ' || v_appointment_time
                WHEN v_service_name IS NOT NULL THEN
                    'Tu cita de ' || v_service_name || ' en ' || v_business_name || ' está programada para el ' || v_appointment_time
                ELSE
                    'Tu cita en ' || v_business_name || ' está programada para el ' || v_appointment_time
            END,
            jsonb_build_object(
                'appointment_id', NEW.id,
                'employee_id', NEW.employee_id,
                'employee_name', v_employee_name,
                'service_id', NEW.service_id,
                'service_name', v_service_name,
                'start_time', NEW.start_time,
                'business_id', NEW.business_id,
                'business_name', v_business_name
            ),
            NEW.business_id,
            1, -- Prioridad normal
            'unread',
            '/app/client/appointments'
        );
    END IF;

    -- 3. NOTIFICAR AL DUEÑO DEL NEGOCIO (si es diferente del empleado y del cliente)
    IF v_business_owner_id IS NOT NULL 
       AND v_business_owner_id != NEW.employee_id 
       AND v_business_owner_id != NEW.client_id THEN
        INSERT INTO in_app_notifications (
            user_id,
            type,
            title,
            message,
            data,
            business_id,
            priority,
            status,
            action_url
        ) VALUES (
            v_business_owner_id,
            'appointment_new_business',
            'Nueva Cita en ' || v_business_name,
            CASE 
                WHEN v_service_name IS NOT NULL AND v_employee_name IS NOT NULL THEN
                    COALESCE(v_client_name, 'Un cliente') || ' ha reservado ' || v_service_name || ' con ' || v_employee_name || ' para el ' || v_appointment_time
                WHEN v_service_name IS NOT NULL THEN
                    COALESCE(v_client_name, 'Un cliente') || ' ha reservado ' || v_service_name || ' para el ' || v_appointment_time
                ELSE
                    'Nueva cita programada para el ' || v_appointment_time
            END,
            jsonb_build_object(
                'appointment_id', NEW.id,
                'client_id', NEW.client_id,
                'client_name', v_client_name,
                'employee_id', NEW.employee_id,
                'employee_name', v_employee_name,
                'service_id', NEW.service_id,
                'service_name', v_service_name,
                'start_time', NEW.start_time,
                'business_id', NEW.business_id
            ),
            NEW.business_id,
            1, -- Prioridad normal
            'unread',
            '/app/admin/appointments'
        );
    END IF;

    RETURN NEW;
END;
$$;
COMMENT ON FUNCTION notify_appointment_created IS 
'Trigger function que crea notificaciones in-app para empleado, cliente y dueño del negocio cuando se crea una nueva cita';
-- ============================================================================
-- 2. CREAR TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS notify_on_appointment_created ON appointments;
CREATE TRIGGER notify_on_appointment_created
    AFTER INSERT ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION notify_appointment_created();
COMMENT ON TRIGGER notify_on_appointment_created ON appointments IS 
'Envía notificaciones in-app a empleado, cliente y dueño del negocio cuando se crea una cita nueva';
