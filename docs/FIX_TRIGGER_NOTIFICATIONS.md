# Fix Trigger notify_business_on_application (17 Oct 2025)

## Problema
El trigger `notify_business_on_application` intentaba insertar en `in_app_notifications` usando columnas que no existen:
- ❌ `metadata` → ✅ Debe ser `data` (JSONB)
- ❌ `is_read` → ✅ Debe ser `status` ('unread', 'read')

## Solución Aplicada

### 1. Eliminadas funciones/triggers antiguos
```sql
DROP TRIGGER IF EXISTS on_job_application_created ON job_applications CASCADE;
DROP FUNCTION IF EXISTS notify_business_on_application();
```

### 2. Creada función NUEVA con campos correctos
```sql
CREATE OR REPLACE FUNCTION notify_business_on_application()
RETURNS TRIGGER AS $$
DECLARE
  v_business_owner_id UUID;
  v_vacancy_title TEXT;
  v_applicant_name TEXT;
BEGIN
  -- Obtener business_owner_id y título de vacante
  SELECT jv.business_id, jv.title INTO v_business_owner_id, v_vacancy_title
  FROM job_vacancies jv
  WHERE jv.id = NEW.vacancy_id;

  SELECT owner_id INTO v_business_owner_id
  FROM businesses
  WHERE id = v_business_owner_id;

  SELECT full_name INTO v_applicant_name
  FROM profiles
  WHERE id = NEW.user_id;

  -- INSERT con campos CORRECTOS
  INSERT INTO in_app_notifications (
    user_id,
    type,
    title,
    message,
    status,      -- ✅ Correcto (NOT NULL)
    priority,    -- ✅ Correcto (NOT NULL)
    data         -- ✅ Correcto (JSONB, no metadata)
  ) VALUES (
    v_business_owner_id,
    'job_application_new',
    'Nueva aplicación recibida',
    COALESCE(v_applicant_name, 'Un candidato') || ' ha aplicado a "' || COALESCE(v_vacancy_title, 'la vacante') || '"',
    'unread',
    1,
    jsonb_build_object(
      'application_id', NEW.id,
      'vacancy_id', NEW.vacancy_id,
      'applicant_id', NEW.user_id,
      'status', NEW.status
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Crear trigger
CREATE TRIGGER on_job_application_created
AFTER INSERT ON job_applications
FOR EACH ROW
EXECUTE FUNCTION notify_business_on_application();
```

## Estructura de in_app_notifications (CORRECTA)

```sql
CREATE TABLE in_app_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type NOTIFICATION_TYPE NOT NULL, -- enum: 'chat_message', 'job_application', ...
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status NOTIFICATION_STATUS NOT NULL DEFAULT 'unread', -- 'unread' | 'read'
  priority INTEGER NOT NULL, -- 1-5, donde 1 es normal
  action_url TEXT, -- URL opcional
  business_id UUID REFERENCES businesses(id),
  data JSONB, -- Datos adicionales en formato JSON
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);
```

## Cambios Realizados

| Componente | Cambio |
|-----------|--------|
| Función SQL | Recreada sin campos inválidos |
| Trigger antiguo | `on_application_created` eliminado para evitar doble ejecución |
| INSERT clause | `metadata` → `data` |
| INSERT clause | `is_read` → `status` |
| INSERT clause | Valor enum `type` → `'job_application_new'` |
| INSERT clause | Agregado `priority` (requerido) |
| COALESCE | Agregado para manejo de NULLs |

## Testing

### ✅ Flujo esperado ahora:
1. Usuario aplica a vacante
2. Se inserta en `job_applications`
3. Trigger `on_job_application_created` se dispara
4. Se inserta notificación en `in_app_notifications` con:
   - `user_id` = business owner
  - `type` = 'job_application_new'
   - `status` = 'unread'
   - `priority` = 1
   - `data` = JSON con aplicación details

5. ✅ Sin errores de schema

## Archivos Actualizados

1. ✅ Base de datos: Trigger y función recreados
2. ⚠️ Migración `20250120000003_job_application_notifications.sql`: Ya tiene campos correctos

---

**Status**: 🟢 COMPLETADO - Trigger corregido
**Fecha**: 17 de octubre de 2025
