-- Migration: Agregar salary_base y salary_type a get_business_hierarchy RPC
-- Fecha: 2025-11-15
-- Fase: 2 - Sistema de Nómina
-- Propósito: Incluir campos de salario en respuesta de jerarquía para EmployeeSalaryConfig

-- DROP existing function (cannot change return type)
DROP FUNCTION IF EXISTS get_business_hierarchy(UUID, DATE, DATE, JSONB);

-- CREATE new version with salary fields
CREATE OR REPLACE FUNCTION get_business_hierarchy(
  p_business_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE,
  p_filters JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  employee_id UUID,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  phone TEXT,
  hierarchy_level INTEGER,
  reports_to UUID,
  supervisor_name TEXT,
  role TEXT,
  employee_type TEXT,
  job_title TEXT,
  location_id UUID,
  location_name TEXT,
  is_active BOOLEAN,
  hired_at DATE,
  salary_base NUMERIC,          -- ⭐ NUEVO CAMPO
  salary_type VARCHAR,           -- ⭐ NUEVO CAMPO
  total_appointments INTEGER,
  completed_appointments INTEGER,
  cancelled_appointments INTEGER,
  average_rating NUMERIC,
  total_reviews INTEGER,
  occupancy_rate NUMERIC,
  gross_revenue NUMERIC,
  services_offered JSONB,
  direct_reports_count INTEGER,
  all_reports_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE employee_data AS (
    SELECT 
      br.user_id,
      p.full_name,
      p.email,
      p.avatar_url,
      p.phone,
      br.hierarchy_level,
      br.reports_to,
      supervisor.full_name as supervisor_name,
      br.role,
      be.employee_type,
      be.job_title::TEXT,
      be.location_id,
      l.name::TEXT as location_name,
      br.is_active,
      be.hired_at,
      be.salary_base,                -- ⭐ AGREGADO
      be.salary_type,                -- ⭐ AGREGADO
      
      (SELECT COUNT(*) FROM appointments a
       WHERE a.employee_id = br.user_id AND a.business_id = p_business_id
         AND DATE(a.start_time) BETWEEN p_start_date AND p_end_date) as total_appointments,
      
      (SELECT COUNT(*) FROM appointments a
       WHERE a.employee_id = br.user_id AND a.business_id = p_business_id
         AND a.status = 'completed' AND DATE(a.start_time) BETWEEN p_start_date AND p_end_date) as completed_appointments,
      
      (SELECT COUNT(*) FROM appointments a
       WHERE a.employee_id = br.user_id AND a.business_id = p_business_id
         AND a.status = 'cancelled' AND DATE(a.start_time) BETWEEN p_start_date AND p_end_date) as cancelled_appointments,
      
      COALESCE(
        (SELECT AVG(rating) 
         FROM reviews r 
         WHERE r.employee_id = br.user_id 
           AND r.business_id = p_business_id
           AND r.is_visible = true
           AND r.created_at::DATE BETWEEN p_start_date AND p_end_date
        ), 0
      ) as average_rating,
      
      (SELECT COUNT(*) FROM reviews r
       WHERE r.employee_id = br.user_id AND r.business_id = p_business_id
         AND r.is_visible = true) as total_reviews,
      
      COALESCE(
        (SELECT 
          CASE 
            WHEN COUNT(*) = 0 THEN 0
            ELSE ROUND(
              COUNT(*) FILTER (WHERE a.status = 'completed')::NUMERIC * 100.0 / COUNT(*)::NUMERIC,
              2
            )
          END
         FROM appointments a
         WHERE a.employee_id = br.user_id 
           AND a.business_id = p_business_id
           AND DATE(a.start_time) BETWEEN p_start_date AND p_end_date
        ), 0
      ) as occupancy_rate,
      
      COALESCE(
        (SELECT SUM(price) 
         FROM appointments a
         WHERE a.employee_id = br.user_id 
           AND a.business_id = p_business_id
           AND a.status = 'completed' 
           AND DATE(a.start_time) BETWEEN p_start_date AND p_end_date
           AND a.price IS NOT NULL
        ), 0
      ) as gross_revenue,
      
      (SELECT jsonb_agg(jsonb_build_object(
          'service_id', s.id,
          'service_name', s.name,
          'expertise_level', es.expertise_level,
          'commission_percentage', es.commission_percentage
        ))
       FROM employee_services es
       JOIN services s ON es.service_id = s.id
       WHERE es.employee_id = br.user_id AND es.business_id = p_business_id AND es.is_active = true) as services_offered,
      
      (SELECT COUNT(*) FROM business_roles sub
       WHERE sub.reports_to = br.user_id AND sub.business_id = p_business_id AND sub.is_active = true) as direct_reports_count
      
    FROM business_roles br
    JOIN profiles p ON br.user_id = p.id
    LEFT JOIN business_employees be ON be.employee_id = br.user_id AND be.business_id = br.business_id
    LEFT JOIN locations l ON be.location_id = l.id
    LEFT JOIN profiles supervisor ON br.reports_to = supervisor.id
    WHERE br.business_id = p_business_id AND br.is_active = true
  ),
  all_reports AS (
    SELECT ed.user_id, ed.user_id as report_id, 0 as level 
    FROM employee_data ed
    UNION ALL
    SELECT ar.user_id, br.user_id as report_id, ar.level + 1
    FROM all_reports ar
    JOIN business_roles br ON br.reports_to = ar.report_id
    WHERE br.business_id = p_business_id AND br.is_active = true AND ar.level < 10
  )
  SELECT 
    ed.user_id as employee_id,
    ed.full_name, 
    ed.email, 
    ed.avatar_url, 
    ed.phone,
    ed.hierarchy_level, 
    ed.reports_to, 
    ed.supervisor_name, 
    ed.role::TEXT,
    ed.employee_type::TEXT, 
    ed.job_title::TEXT,
    ed.location_id, 
    ed.location_name::TEXT,
    ed.is_active, 
    ed.hired_at,
    ed.salary_base,                    -- ⭐ AGREGADO
    ed.salary_type::VARCHAR,           -- ⭐ AGREGADO
    ed.total_appointments::INTEGER, 
    ed.completed_appointments::INTEGER,
    ed.cancelled_appointments::INTEGER, 
    ed.average_rating,
    ed.total_reviews::INTEGER, 
    ed.occupancy_rate, 
    ed.gross_revenue,
    ed.services_offered, 
    ed.direct_reports_count::INTEGER,
    COALESCE((SELECT COUNT(DISTINCT report_id) - 1 FROM all_reports ar WHERE ar.user_id = ed.user_id), 0)::INTEGER as all_reports_count
  FROM employee_data ed
  ORDER BY ed.hierarchy_level ASC, ed.full_name ASC;
END;
$$;

-- Comentario de la función
COMMENT ON FUNCTION get_business_hierarchy IS 'Obtiene jerarquía completa de empleados incluyendo datos de nómina (salary_base, salary_type). Actualizado en migración 20251115000007 para Fase 2.';
