-- ============================================================================
-- CLEAN TRANSACTIONAL DATA SCRIPT
-- ============================================================================
-- Este script limpia SOLO la data transaccional (generada por usuarios)
-- PRESERVA: negocios, empleados, servicios, ubicaciones, configuraciones
-- LIMPIA: citas, notificaciones, chats, transacciones, reviews, aplicaciones a vacantes
-- 
-- Ejecución: npx supabase db push < clean-transactional-data.sql
-- O: Copiar y ejecutar en Supabase SQL Editor
-- ============================================================================

-- BEGIN TRANSACTION
BEGIN;

-- ============================================================================
-- 1. DELETE CHAT MESSAGES (cascada automática de conversations)
-- ============================================================================
DELETE FROM public.messages WHERE TRUE;

-- ============================================================================
-- 2. DELETE CONVERSATIONS
-- ============================================================================
DELETE FROM public.conversations WHERE TRUE;

-- ============================================================================
-- 3. DELETE CHAT MESSAGE ATTACHMENTS (si existen)
-- ============================================================================
-- NOTA: Esta tabla no existe en el esquema actual (cascada automática desde messages)
-- DELETE FROM public.message_attachments WHERE TRUE;

-- ============================================================================
-- 4. DELETE REVIEWS (mantiene business.reviews para stats)
-- ============================================================================
DELETE FROM public.reviews WHERE TRUE;

-- ============================================================================
-- 5. DELETE APPOINTMENTS (cascada automática de notification_log)
-- ============================================================================
DELETE FROM public.appointments WHERE TRUE;

-- ============================================================================
-- 6. DELETE NOTIFICATIONS
-- ============================================================================
DELETE FROM public.notifications WHERE TRUE;

-- ============================================================================
-- 7. DELETE NOTIFICATION LOG (tracking)
-- ============================================================================
DELETE FROM public.notification_log WHERE TRUE;

-- ============================================================================
-- 8. DELETE USER NOTIFICATION PREFERENCES (reseteará a defaults)
-- ============================================================================
DELETE FROM public.user_notification_preferences WHERE TRUE;

-- ============================================================================
-- 9. DELETE TRANSACTIONS/INVOICES
-- ============================================================================
DELETE FROM public.invoice_items WHERE TRUE;  -- Primero los items (FK a invoices)
DELETE FROM public.invoices WHERE TRUE;
DELETE FROM public.transactions WHERE TRUE;

-- ============================================================================
-- 10. DELETE JOB APPLICATION DATA (pero mantiene vacancies)
-- ============================================================================
DELETE FROM public.job_applications WHERE TRUE;
-- NOTA: Las siguientes tablas no existen en el esquema actual:
-- DELETE FROM public.job_vacancy_views WHERE TRUE;
-- DELETE FROM public.vacancy_responses WHERE TRUE;
-- DELETE FROM public.mandatory_reviews WHERE TRUE;

-- ============================================================================
-- 11. DELETE SYNC CONFLICTS Y CALENDAR SYNC DATA
-- ============================================================================
-- NOTA: Las siguientes tablas no existen en el esquema actual:
-- DELETE FROM public.sync_conflicts WHERE TRUE;
-- DELETE FROM public.calendar_sync_logs WHERE TRUE;

-- ============================================================================
-- 12. DELETE BUG REPORTS
-- ============================================================================
DELETE FROM public.bug_reports WHERE TRUE;
-- NOTA: Las siguientes tablas no existen (probablemente cascada automática):
-- DELETE FROM public.bug_report_evidences WHERE TRUE;
-- DELETE FROM public.bug_report_comments WHERE TRUE;

-- ============================================================================
-- 13. DELETE IN-APP NOTIFICATIONS (notificaciones in-app con JSONB)
-- ============================================================================
DELETE FROM public.in_app_notifications WHERE TRUE;

-- ============================================================================
-- 14. DELETE AUDIT LOGS (logs de auditoría transaccionales)
-- ============================================================================
DELETE FROM public.permission_audit_log WHERE TRUE;
DELETE FROM public.billing_audit_log WHERE TRUE;

-- ============================================================================
-- 15. DELETE ERROR AND LOGIN LOGS (logs del sistema)
-- ============================================================================
DELETE FROM public.error_logs WHERE TRUE;
DELETE FROM public.login_logs WHERE TRUE;

-- ============================================================================
-- 16. DELETE BILLING RELATED TRANSACTIONAL DATA
-- ============================================================================
DELETE FROM public.tax_liabilities WHERE TRUE;
DELETE FROM public.subscription_payments WHERE TRUE;
DELETE FROM public.subscription_events WHERE TRUE;
DELETE FROM public.usage_metrics WHERE TRUE;
DELETE FROM public.discount_code_uses WHERE TRUE;

-- ============================================================================
-- 18. DELETE PAYMENT METHODS (se consideran transaccionales si el usuario los guardó)
-- ============================================================================
-- NOTA: Comentado por defecto. Descomenta si deseas eliminar métodos de pago guardados
-- DELETE FROM public.payment_methods WHERE TRUE;

-- ============================================================================
-- 17. DELETE EMPLOYEE REQUESTS (solicitudes de unión a negocios)
-- ============================================================================
DELETE FROM public.employee_requests WHERE TRUE;

-- ============================================================================
-- 18. RESET SEQUENCES (para que IDs generadas comiencen nuevamente)
-- ============================================================================
-- Nota: Las secuencias en Supabase/PostgreSQL se resetean automáticamente
-- cuando la data se elimina. Si necesitas resetear explícitamente:
-- ALTER SEQUENCE table_id_seq RESTART WITH 1;

-- ============================================================================
-- 19. VERIFICACIÓN FINAL
-- ============================================================================
SELECT 'LIMPIEZA COMPLETADA' as status;
SELECT COUNT(*) as total_appointments FROM public.appointments;
SELECT COUNT(*) as total_notifications FROM public.notifications;
SELECT COUNT(*) as total_messages FROM public.messages;
SELECT COUNT(*) as total_conversations FROM public.conversations;
SELECT COUNT(*) as total_reviews FROM public.reviews;
SELECT COUNT(*) as total_transactions FROM public.transactions;
SELECT COUNT(*) as total_jobs_applications FROM public.job_applications;
SELECT COUNT(*) as total_error_logs FROM public.error_logs;
SELECT COUNT(*) as total_login_logs FROM public.login_logs;
SELECT COUNT(*) as total_in_app_notifications FROM public.in_app_notifications;
SELECT COUNT(*) as total_bug_reports FROM public.bug_reports;
SELECT COUNT(*) as total_invoice_items FROM public.invoice_items;
SELECT COUNT(*) as total_employee_requests FROM public.employee_requests;

-- ============================================================================
-- DATA QUE SE MANTIENE (NO SE LIMPIA)
-- ============================================================================
-- ✓ profiles (usuarios)
-- ✓ businesses (negocios)
-- ✓ business_employees (empleados de negocios)
-- ✓ locations (ubicaciones/sedes)
-- ✓ services (servicios)
-- ✓ employee_services (asignación servicios a empleados)
-- ✓ business_categories (categorías)
-- ✓ categories (categorías sistema)
-- ✓ business_notification_settings (configuración notificaciones)
-- ✓ business_employees_schedule (horarios empleados)
-- ✓ job_vacancies (vacantes - solo se limpian applications)
-- ✓ permissions (permisos)
-- ✓ user_roles (roles)
-- ✓ billing_plans (planes)
-- ✓ discount_codes (códigos de descuento - configuración)
-- ✓ business_tax_config (configuración fiscal)
-- ✓ permission_templates (plantillas de permisos)
-- ✓ employee_profiles (perfiles profesionales - paramétrico)

-- ============================================================================
-- REPORTE DE DATA RETENIDA
-- ============================================================================
SELECT 
    'NEGOCIOS' as data_type,
    COUNT(*) as total
FROM public.businesses
UNION ALL
SELECT 
    'UBICACIONES',
    COUNT(*)
FROM public.locations
UNION ALL
SELECT 
    'SERVICIOS',
    COUNT(*)
FROM public.services
UNION ALL
SELECT 
    'EMPLEADOS',
    COUNT(*)
FROM public.business_employees
UNION ALL
SELECT 
    'USUARIOS',
    COUNT(*)
FROM public.profiles;

-- COMMIT TRANSACTION
COMMIT;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 
-- 1. Este script es IDEMPOTENTE: se puede ejecutar múltiples veces sin error
-- 2. NO elimina usuarios de auth.users (se mantienen vinculados a data)
-- 3. Todas las foreign keys están configuradas para cascada automática
-- 4. Los timestamps (created_at, updated_at) se resetearán al próximo cambio
-- 5. Para eliminar también USUARIOS, ejecutar después:
--    DELETE FROM auth.users WHERE id NOT IN (SELECT owner_id FROM businesses WHERE is_active = TRUE);
-- 6. Ejecutar en un window de mantenimiento (low traffic hours)
-- 7. Hacer BACKUP antes de ejecutar en producción
-- 
-- ============================================================================
