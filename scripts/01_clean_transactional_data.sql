-- ============================================================================
-- SCRIPT DE LIMPIEZA DE DATA TRANSACCIONAL - AppointSync Pro
-- ============================================================================
-- Este script elimina TODA la data transaccional manteniendo:
-- - Categorías de negocios (business_categories)
-- - Códigos de descuento del sistema (discount_codes)
-- - Plantillas de permisos del sistema (permission_templates)
--
-- ADVERTENCIA: Esta operación es IRREVERSIBLE. Asegúrate de tener backups.
-- ============================================================================

-- Deshabilitar triggers temporalmente para mejorar performance
SET session_replication_role = 'replica';

BEGIN;

-- ============================================================================
-- FASE 1: Limpiar tablas dependientes (con FKs hacia otras tablas)
-- ============================================================================

RAISE NOTICE '🧹 Limpiando tablas del sistema de chat...';
DELETE FROM chat_typing_indicators;
DELETE FROM chat_messages;
DELETE FROM chat_participants;
DELETE FROM chat_conversations;

RAISE NOTICE '🧹 Limpiando sistema de mensajería legado...';
DELETE FROM messages;
DELETE FROM conversation_members;
DELETE FROM conversations;

RAISE NOTICE '🧹 Limpiando sistema de notificaciones...';
DELETE FROM in_app_notifications;
DELETE FROM notification_log;
DELETE FROM notifications;

RAISE NOTICE '🧹 Limpiando sistema de billing y suscripciones...';
DELETE FROM billing_audit_log;
DELETE FROM discount_code_uses;
-- NO eliminar discount_codes (son códigos del sistema)
DELETE FROM subscription_events;
DELETE FROM subscription_payments;
DELETE FROM payment_methods;
DELETE FROM usage_metrics;
DELETE FROM business_plans;

RAISE NOTICE '🧹 Limpiando sistema de vacantes y aplicaciones...';
DELETE FROM job_applications;
DELETE FROM job_vacancies;

RAISE NOTICE '🧹 Limpiando sistema de reviews y facturas...';
DELETE FROM reviews;
DELETE FROM invoice_items;
DELETE FROM invoices;

RAISE NOTICE '🧹 Limpiando transacciones y nómina...';
DELETE FROM transactions;
DELETE FROM payroll_payments;
DELETE FROM recurring_expenses;
DELETE FROM tax_liabilities;

RAISE NOTICE '🧹 Limpiando sistema de permisos granulares...';
DELETE FROM permission_audit_log;
DELETE FROM user_permissions;
DELETE FROM business_roles;
-- NO eliminar permission_templates (son plantillas del sistema)

RAISE NOTICE '🧹 Limpiando configuraciones por negocio/usuario...';
DELETE FROM user_notification_preferences;
DELETE FROM business_notification_settings;
DELETE FROM payroll_configuration;
DELETE FROM tax_configurations;

-- ============================================================================
-- FASE 2: Limpiar tablas de relaciones empleado-servicio-ubicación
-- ============================================================================

RAISE NOTICE '🧹 Limpiando relaciones de empleados y servicios...';
DELETE FROM employee_services;
DELETE FROM location_services;
DELETE FROM business_subcategories; -- Relación N:M business-subcategories

-- ============================================================================
-- FASE 3: Limpiar citas (appointments)
-- ============================================================================

RAISE NOTICE '🧹 Limpiando citas...';
DELETE FROM appointments;

-- ============================================================================
-- FASE 4: Limpiar empleados y solicitudes
-- ============================================================================

RAISE NOTICE '🧹 Limpiando empleados y solicitudes...';
DELETE FROM business_employees;
DELETE FROM employee_requests;

-- ============================================================================
-- FASE 5: Limpiar servicios y ubicaciones
-- ============================================================================

RAISE NOTICE '🧹 Limpiando servicios...';
DELETE FROM services;

RAISE NOTICE '🧹 Limpiando ubicaciones/sedes...';
DELETE FROM locations;

-- ============================================================================
-- FASE 6: Limpiar negocios
-- ============================================================================

RAISE NOTICE '🧹 Limpiando negocios...';
DELETE FROM businesses;

-- ============================================================================
-- FASE 7: Limpiar perfiles de usuarios
-- ============================================================================

RAISE NOTICE '🧹 Limpiando perfiles (manteniendo usuarios en auth.users)...';
DELETE FROM profiles;

-- ============================================================================
-- FASE 8: Resetear secuencias y contadores
-- ============================================================================

RAISE NOTICE '🔄 Reseteando secuencias...';
-- La mayoría de las tablas usan UUID, no hay secuencias que resetear

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================

RAISE NOTICE '✅ Limpieza completada. Verificando conteos...';

DO $$
DECLARE
  v_profiles_count INT;
  v_businesses_count INT;
  v_appointments_count INT;
  v_transactions_count INT;
  v_categories_count INT;
  v_discount_codes_count INT;
  v_templates_count INT;
BEGIN
  SELECT COUNT(*) INTO v_profiles_count FROM profiles;
  SELECT COUNT(*) INTO v_businesses_count FROM businesses;
  SELECT COUNT(*) INTO v_appointments_count FROM appointments;
  SELECT COUNT(*) INTO v_transactions_count FROM transactions;
  SELECT COUNT(*) INTO v_categories_count FROM business_categories;
  SELECT COUNT(*) INTO v_discount_codes_count FROM discount_codes;
  SELECT COUNT(*) INTO v_templates_count FROM permission_templates;
  
  RAISE NOTICE '📊 CONTEO FINAL:';
  RAISE NOTICE '  - Profiles: % (esperado: 0)', v_profiles_count;
  RAISE NOTICE '  - Businesses: % (esperado: 0)', v_businesses_count;
  RAISE NOTICE '  - Appointments: % (esperado: 0)', v_appointments_count;
  RAISE NOTICE '  - Transactions: % (esperado: 0)', v_transactions_count;
  RAISE NOTICE '  - Categories: % (NO eliminadas)', v_categories_count;
  RAISE NOTICE '  - Discount Codes: % (NO eliminados)', v_discount_codes_count;
  RAISE NOTICE '  - Permission Templates: % (NO eliminadas)', v_templates_count;
  
  IF v_profiles_count = 0 AND v_businesses_count = 0 AND v_appointments_count = 0 THEN
    RAISE NOTICE '✅ Base de datos limpiada exitosamente!';
  ELSE
    RAISE WARNING '⚠️ Algunos registros no fueron eliminados. Revisar FKs o constraints.';
  END IF;
END $$;

COMMIT;

-- Rehabilitar triggers
SET session_replication_role = 'origin';

RAISE NOTICE '✨ Script de limpieza finalizado. La base de datos está lista para data de prueba.';
