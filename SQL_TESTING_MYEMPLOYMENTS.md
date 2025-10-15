# SQL Commands - Testing MyEmployments Enhancements

**Propósito:** Comandos SQL para testing y verificación del sistema

---

## 🔍 Verificación de Tablas

### 1. Verificar tabla employee_time_off
```sql
-- Ver estructura
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'employee_time_off'
ORDER BY ordinal_position;

-- Ver datos de ejemplo
SELECT * FROM employee_time_off LIMIT 5;

-- Contar solicitudes por status
SELECT status, COUNT(*) 
FROM employee_time_off 
GROUP BY status;
```

### 2. Verificar columna termination_date
```sql
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'business_employees' 
  AND column_name = 'termination_date';
```

### 3. Verificar RPC function
```sql
-- Ver si existe
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'get_employee_business_details';

-- Probar con datos reales
SELECT * FROM get_employee_business_details(
  'e3ed65d8-dd68-4538-a829-e8ebc28edd55', -- Jose Luis Avila
  'a1e62937-e20f-4ee4-93c0-69279eb38d44'  -- Los Narcos
);
```

---

## 🧪 Testing con Datos del Usuario Actual

### Usuario de Prueba:
- **employee_id:** `e3ed65d8-dd68-4538-a829-e8ebc28edd55`
- **Nombre:** Jose Luis Avila
- **Business:** Los Narcos (`a1e62937-e20f-4ee4-93c0-69279eb38d44`)
- **Sede:** Centro (`46dc170f-7997-4b9b-9251-c7c8ff1468da`)

### 1. Asignar sede al empleado (si no tiene)
```sql
UPDATE business_employees
SET 
  location_id = '46dc170f-7997-4b9b-9251-c7c8ff1468da',
  updated_at = NOW()
WHERE 
  employee_id = 'e3ed65d8-dd68-4538-a829-e8ebc28edd55'
  AND business_id = 'a1e62937-e20f-4ee4-93c0-69279eb38d44';

-- Verificar
SELECT 
  be.*,
  l.name as location_name
FROM business_employees be
LEFT JOIN locations l ON be.location_id = l.id
WHERE be.employee_id = 'e3ed65d8-dd68-4538-a829-e8ebc28edd55';
```

### 2. Ver estado actual del empleado
```sql
SELECT 
  be.employee_id,
  b.name as business_name,
  be.role,
  be.employee_type,
  be.job_title,
  be.is_active,
  be.location_id,
  l.name as location_name,
  be.salary_base,
  be.salary_type,
  be.hire_date,
  be.termination_date
FROM business_employees be
JOIN businesses b ON be.business_id = b.id
LEFT JOIN locations l ON be.location_id = l.id
WHERE be.employee_id = 'e3ed65d8-dd68-4538-a829-e8ebc28edd55';
```

### 3. Ver calificaciones del empleado
```sql
SELECT 
  r.business_id,
  b.name as business_name,
  r.rating,
  r.comment,
  r.created_at,
  p.full_name as client_name
FROM reviews r
JOIN businesses b ON r.business_id = b.id
JOIN profiles p ON r.client_id = p.id
WHERE r.employee_id = 'e3ed65d8-dd68-4538-a829-e8ebc28edd55'
  AND r.is_visible = true
ORDER BY r.created_at DESC;

-- Calcular promedio
SELECT 
  business_id,
  AVG(rating) as avg_rating,
  COUNT(*) as total_reviews
FROM reviews
WHERE employee_id = 'e3ed65d8-dd68-4538-a829-e8ebc28edd55'
  AND is_visible = true
GROUP BY business_id;
```

### 4. Ver servicios del empleado
```sql
SELECT 
  es.*,
  s.name as service_name,
  s.duration_minutes,
  s.price,
  l.name as location_name
FROM employee_services es
JOIN services s ON es.service_id = s.id
LEFT JOIN locations l ON es.location_id = l.id
WHERE es.employee_id = 'e3ed65d8-dd68-4538-a829-e8ebc28edd55'
  AND es.is_active = true;
```

---

## 🏖️ Testing: Solicitudes de Ausencia

### 1. Crear solicitud de vacaciones (simulación manual)
```sql
INSERT INTO employee_time_off (
  employee_id,
  business_id,
  location_id,
  type,
  start_date,
  end_date,
  employee_notes,
  status
)
VALUES (
  'e3ed65d8-dd68-4538-a829-e8ebc28edd55',
  'a1e62937-e20f-4ee4-93c0-69279eb38d44',
  '46dc170f-7997-4b9b-9251-c7c8ff1468da',
  'vacation',
  '2025-02-01',
  '2025-02-07',
  'Vacaciones familiares',
  'pending'
);

-- Verificar inserción
SELECT * FROM employee_time_off 
WHERE employee_id = 'e3ed65d8-dd68-4538-a829-e8ebc28edd55'
ORDER BY created_at DESC
LIMIT 1;
```

### 2. Ver todas las solicitudes del empleado
```sql
SELECT 
  eto.*,
  b.name as business_name,
  l.name as location_name,
  CASE 
    WHEN eto.status = 'pending' THEN '⏳ Pendiente'
    WHEN eto.status = 'approved' THEN '✅ Aprobado'
    WHEN eto.status = 'rejected' THEN '❌ Rechazado'
    WHEN eto.status = 'cancelled' THEN '🚫 Cancelado'
  END as status_display
FROM employee_time_off eto
JOIN businesses b ON eto.business_id = b.id
LEFT JOIN locations l ON eto.location_id = l.id
WHERE eto.employee_id = 'e3ed65d8-dd68-4538-a829-e8ebc28edd55'
ORDER BY eto.requested_at DESC;
```

### 3. Aprobar solicitud (como manager)
```sql
UPDATE employee_time_off
SET 
  status = 'approved',
  reviewed_at = NOW(),
  reviewed_by = 'e3ed65d8-dd68-4538-a829-e8ebc28edd55', -- Manager ID
  manager_notes = 'Aprobado - disfruta tus vacaciones'
WHERE id = 'TIME_OFF_REQUEST_ID'
  AND status = 'pending';
```

### 4. Cancelar solicitud (como empleado)
```sql
UPDATE employee_time_off
SET 
  status = 'cancelled',
  cancelled_at = NOW()
WHERE id = 'TIME_OFF_REQUEST_ID'
  AND employee_id = 'e3ed65d8-dd68-4538-a829-e8ebc28edd55'
  AND status = 'pending';
```

---

## ❌ Testing: Finalizar Empleo

### 1. Marcar empleo como finalizado
```sql
UPDATE business_employees
SET 
  is_active = false,
  termination_date = NOW(),
  updated_at = NOW()
WHERE 
  employee_id = 'e3ed65d8-dd68-4538-a829-e8ebc28edd55'
  AND business_id = 'a1e62937-e20f-4ee4-93c0-69279eb38d44';

-- Desactivar servicios
UPDATE employee_services
SET is_active = false
WHERE 
  employee_id = 'e3ed65d8-dd68-4538-a829-e8ebc28edd55'
  AND business_id = 'a1e62937-e20f-4ee4-93c0-69279eb38d44';

-- Verificar
SELECT 
  be.is_active,
  be.termination_date,
  COUNT(es.id) as total_services,
  COUNT(CASE WHEN es.is_active THEN 1 END) as active_services
FROM business_employees be
LEFT JOIN employee_services es ON es.employee_id = be.employee_id 
  AND es.business_id = be.business_id
WHERE 
  be.employee_id = 'e3ed65d8-dd68-4538-a829-e8ebc28edd55'
  AND be.business_id = 'a1e62937-e20f-4ee4-93c0-69279eb38d44'
GROUP BY be.is_active, be.termination_date;
```

### 2. Reactivar empleo (solo admin)
```sql
UPDATE business_employees
SET 
  is_active = true,
  termination_date = NULL,
  updated_at = NOW()
WHERE 
  employee_id = 'e3ed65d8-dd68-4538-a829-e8ebc28edd55'
  AND business_id = 'a1e62937-e20f-4ee4-93c0-69279eb38d44';

-- Reactivar servicios (opcional)
UPDATE employee_services
SET is_active = true
WHERE 
  employee_id = 'e3ed65d8-dd68-4538-a829-e8ebc28edd55'
  AND business_id = 'a1e62937-e20f-4ee4-93c0-69279eb38d44';
```

---

## 🔒 Testing: RLS Policies

### 1. Verificar policies de employee_time_off
```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'employee_time_off';
```

### 2. Probar como empleado (simulación)
```sql
-- Set role (en producción esto se hace automáticamente con auth.uid())
SET LOCAL "request.jwt.claim.sub" = 'e3ed65d8-dd68-4538-a829-e8ebc28edd55';

-- Ver solo mis solicitudes
SELECT * FROM employee_time_off;

-- Intentar ver solicitudes de otro empleado (debería fallar)
SELECT * FROM employee_time_off 
WHERE employee_id != 'e3ed65d8-dd68-4538-a829-e8ebc28edd55';
```

---

## 📊 Queries de Análisis

### 1. Resumen de ausencias por tipo
```sql
SELECT 
  type,
  COUNT(*) as total_requests,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  SUM(total_days) as total_days_requested
FROM employee_time_off
WHERE business_id = 'a1e62937-e20f-4ee4-93c0-69279eb38d44'
GROUP BY type
ORDER BY total_requests DESC;
```

### 2. Empleados sin sede asignada
```sql
SELECT 
  be.employee_id,
  p.full_name,
  b.name as business_name,
  be.role,
  be.employee_type
FROM business_employees be
JOIN profiles p ON be.employee_id = p.id
JOIN businesses b ON be.business_id = b.id
WHERE 
  be.location_id IS NULL
  AND be.is_active = true;
```

### 3. Empleados con mejor calificación
```sql
SELECT 
  be.employee_id,
  p.full_name,
  b.name as business_name,
  AVG(r.rating) as avg_rating,
  COUNT(r.id) as total_reviews
FROM business_employees be
JOIN profiles p ON be.employee_id = p.id
JOIN businesses b ON be.business_id = b.id
LEFT JOIN reviews r ON r.employee_id = be.employee_id 
  AND r.business_id = be.business_id
  AND r.is_visible = true
WHERE be.is_active = true
GROUP BY be.employee_id, p.full_name, b.name
HAVING COUNT(r.id) >= 3
ORDER BY avg_rating DESC
LIMIT 10;
```

### 4. Empleos finalizados en el último mes
```sql
SELECT 
  be.employee_id,
  p.full_name,
  b.name as business_name,
  be.termination_date,
  be.hire_date,
  AGE(be.termination_date, be.hire_date) as time_employed
FROM business_employees be
JOIN profiles p ON be.employee_id = p.id
JOIN businesses b ON be.business_id = b.id
WHERE 
  be.is_active = false
  AND be.termination_date >= NOW() - INTERVAL '30 days'
ORDER BY be.termination_date DESC;
```

---

## 🧹 Limpieza (Testing)

### Eliminar datos de prueba
```sql
-- Eliminar solicitudes de prueba
DELETE FROM employee_time_off 
WHERE employee_id = 'e3ed65d8-dd68-4538-a829-e8ebc28edd55'
  AND employee_notes = 'TEST' 
  OR employee_notes LIKE '%prueba%';

-- Resetear estado de empleo
UPDATE business_employees
SET 
  is_active = true,
  termination_date = NULL
WHERE employee_id = 'e3ed65d8-dd68-4538-a829-e8ebc28edd55';
```

---

## ✅ Checklist de Verificación

Antes de dar por completado, verificar:

- [ ] Tabla employee_time_off existe y tiene datos
- [ ] Columna termination_date existe en business_employees
- [ ] RPC function get_employee_business_details ejecuta sin errores
- [ ] 5 RLS policies activas en employee_time_off
- [ ] Empleado tiene location_id asignado (para quitar badge)
- [ ] Empleado tiene al menos 1 review (para mostrar rating)
- [ ] Empleado tiene servicios en employee_services
- [ ] Pueden crearse solicitudes de ausencia
- [ ] Pueden cancelarse solicitudes pendientes
- [ ] Pueden finalizarse empleos (is_active=false)

---

**💡 Tip:** Ejecuta estos queries en orden para un testing completo del sistema.
