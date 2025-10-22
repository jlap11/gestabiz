-- ============================================================================
-- MIGRACIÓN: Remover SECURITY DEFINER de views analíticas
-- Fecha: 21 de octubre, 2025
-- Descripción: Recrear views con SECURITY INVOKER (default) para que respeten
--              las políticas RLS del usuario consultante en lugar del creador
-- ============================================================================

-- 1. appointment_details
DROP VIEW IF EXISTS public.appointment_details CASCADE;
CREATE VIEW public.appointment_details 
-- SECURITY INVOKER es el default (sin especificar)
AS
SELECT 
    a.*,
    s.name as service_name,
    s.duration_minutes,
    s.price as service_price,
    c.full_name as client_name,
    c.email as client_email,
    c.phone as client_phone,
    e.full_name as employee_name,
    l.name as location_name,
    l.address as location_address,
    b.name as business_name
FROM public.appointments a
LEFT JOIN public.services s ON a.service_id = s.id
LEFT JOIN public.profiles c ON a.client_id = c.id
LEFT JOIN public.profiles e ON a.employee_id = e.id
LEFT JOIN public.locations l ON a.location_id = l.id
LEFT JOIN public.businesses b ON a.business_id = b.id;

-- 2. employee_performance
DROP VIEW IF EXISTS public.employee_performance CASCADE;
CREATE VIEW public.employee_performance AS
SELECT 
    e.id as employee_id,
    e.full_name as employee_name,
    e.email,
    e.avatar_url,
    be.business_id,
    b.name as business_name,
    be.location_id,
    l.name as location_name,
    be.role as position,
    COUNT(DISTINCT es.service_id) as services_offered,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('confirmed', 'completed')) as total_appointments,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed') as completed_appointments,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'cancelled') as cancelled_appointments,
    ROUND(
        COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed')::numeric / 
        NULLIF(COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('confirmed', 'completed'))::numeric, 0) * 100, 
        2
    ) as completion_rate,
    COALESCE(ROUND(AVG(r.rating)::numeric, 2), 0) as average_rating,
    COUNT(DISTINCT r.id) as total_reviews,
    COALESCE(SUM(a.price) FILTER (WHERE a.status = 'completed'), 0) as total_revenue,
    COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'expense' AND t.category IN ('salary', 'commission')), 0) as total_paid
FROM profiles e
JOIN business_employees be ON e.id = be.employee_id AND be.status = 'approved' AND be.is_active = TRUE
JOIN businesses b ON be.business_id = b.id
LEFT JOIN locations l ON be.location_id = l.id
LEFT JOIN employee_services es ON e.id = es.employee_id AND es.business_id = be.business_id AND es.is_active = TRUE
LEFT JOIN appointments a ON e.id = a.employee_id AND a.business_id = be.business_id
LEFT JOIN reviews r ON e.id = r.employee_id
LEFT JOIN transactions t ON t.business_id = be.business_id AND t.employee_id = e.id
GROUP BY 
    e.id, e.full_name, e.email, e.avatar_url,
    be.business_id, b.name, be.location_id, l.name, be.role;

-- 3. business_stats
DROP VIEW IF EXISTS public.business_stats CASCADE;
CREATE VIEW public.business_stats AS
SELECT 
    b.id as business_id,
    b.name as business_name,
    COUNT(DISTINCT a.id) as total_appointments,
    COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_appointments,
    COUNT(DISTINCT CASE WHEN a.status = 'cancelled' THEN a.id END) as cancelled_appointments,
    COUNT(DISTINCT a.client_id) as total_clients,
    COALESCE(SUM(CASE WHEN a.status = 'completed' THEN a.price END), 0) as total_revenue,
    COUNT(DISTINCT be.employee_id) as total_employees
FROM public.businesses b
LEFT JOIN public.appointments a ON b.id = a.business_id
LEFT JOIN public.business_employees be ON b.id = be.business_id AND be.status = 'approved'
GROUP BY b.id, b.name;

-- 4. location_services_availability
DROP VIEW IF EXISTS public.location_services_availability CASCADE;
CREATE VIEW public.location_services_availability AS
SELECT 
    ls.location_id,
    l.name as location_name,
    l.business_id,
    b.name as business_name,
    ls.service_id,
    s.name as service_name,
    s.duration_minutes,
    s.price,
    ls.is_active,
    COUNT(DISTINCT es.employee_id) as available_employees
FROM location_services ls
JOIN locations l ON ls.location_id = l.id
JOIN businesses b ON l.business_id = b.id
JOIN services s ON ls.service_id = s.id
LEFT JOIN employee_services es ON s.id = es.service_id AND es.is_active = TRUE
WHERE ls.is_active = TRUE
GROUP BY 
    ls.location_id, l.name, l.business_id, b.name,
    ls.service_id, s.name, s.duration_minutes, s.price, ls.is_active;

-- 5. tax_report_by_period
DROP VIEW IF EXISTS public.tax_report_by_period CASCADE;
CREATE VIEW public.tax_report_by_period AS
SELECT 
    t.business_id,
    b.name as business_name,
    t.fiscal_period,
    t.tax_type,
    COUNT(*) as transaction_count,
    SUM(t.amount) as total_amount,
    SUM(t.subtotal) as total_subtotal,
    SUM(t.tax_amount) as total_tax,
    AVG(t.tax_rate) as avg_tax_rate
FROM transactions t
JOIN businesses b ON t.business_id = b.id
WHERE t.fiscal_period IS NOT NULL
GROUP BY t.business_id, b.name, t.fiscal_period, t.tax_type;

-- 6. financial_summary
DROP VIEW IF EXISTS public.financial_summary CASCADE;
CREATE VIEW public.financial_summary AS
SELECT 
    t.business_id,
    b.name as business_name,
    DATE_TRUNC('month', t.transaction_date) as month,
    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END) as total_income,
    SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END) as total_expenses,
    SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END) as net_profit,
    COUNT(DISTINCT CASE WHEN t.type = 'income' THEN t.id END) as income_count,
    COUNT(DISTINCT CASE WHEN t.type = 'expense' THEN t.id END) as expense_count
FROM transactions t
JOIN businesses b ON t.business_id = b.id
GROUP BY t.business_id, b.name, DATE_TRUNC('month', t.transaction_date);

-- 7. fiscal_obligations_status
DROP VIEW IF EXISTS public.fiscal_obligations_status CASCADE;
CREATE VIEW public.fiscal_obligations_status AS
SELECT 
    t.business_id,
    b.name as business_name,
    t.fiscal_period,
    COUNT(DISTINCT t.tax_type) as different_tax_types,
    SUM(t.tax_amount) as total_tax_liability,
    MAX(t.transaction_date) as last_transaction_date,
    COUNT(*) as total_transactions
FROM transactions t
JOIN businesses b ON t.business_id = b.id
WHERE t.tax_amount > 0
GROUP BY t.business_id, b.name, t.fiscal_period;

-- 8. v_unread_chat_email_stats
DROP VIEW IF EXISTS public.v_unread_chat_email_stats CASCADE;
CREATE VIEW public.v_unread_chat_email_stats AS
SELECT 
    cp.user_id,
    u.email,
    u.full_name,
    COUNT(DISTINCT m.id) as unread_message_count,
    COUNT(DISTINCT m.conversation_id) as conversations_with_unread,
    MIN(m.created_at) as oldest_unread_message,
    MAX(m.created_at) as newest_unread_message
FROM chat_participants cp
JOIN profiles u ON cp.user_id = u.id
LEFT JOIN messages m ON m.conversation_id = cp.conversation_id 
    AND m.sender_id != cp.user_id 
    AND (m.read_by IS NULL OR NOT (m.read_by ? cp.user_id::text))
GROUP BY cp.user_id, u.email, u.full_name
HAVING COUNT(DISTINCT m.id) > 0;

-- Comentarios
COMMENT ON VIEW public.appointment_details IS 
'View sin SECURITY DEFINER - respeta RLS del usuario consultante';

COMMENT ON VIEW public.employee_performance IS 
'View sin SECURITY DEFINER - respeta RLS del usuario consultante';

COMMENT ON VIEW public.business_stats IS 
'View sin SECURITY DEFINER - respeta RLS del usuario consultante';

COMMENT ON VIEW public.location_services_availability IS 
'View sin SECURITY DEFINER - respeta RLS del usuario consultante';

COMMENT ON VIEW public.tax_report_by_period IS 
'View sin SECURITY DEFINER - respeta RLS del usuario consultante';

COMMENT ON VIEW public.financial_summary IS 
'View sin SECURITY DEFINER - respeta RLS del usuario consultante';

COMMENT ON VIEW public.fiscal_obligations_status IS 
'View sin SECURITY DEFINER - respeta RLS del usuario consultante';

COMMENT ON VIEW public.v_unread_chat_email_stats IS 
'View sin SECURITY DEFINER - respeta RLS del usuario consultante';
