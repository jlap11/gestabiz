-- Migration: Add payment amount fields to appointments
-- Created: 2025-11-14
-- Description: Agrega campos de montos brutos, netos y comisión para mejorar la contabilidad de pagos

-- Agregar campos de montos a appointments
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS gross_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS net_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS other_deductions DECIMAL(12,2) DEFAULT 0;

-- Crear índice para consultas por estado de pago
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON appointments(payment_status) WHERE payment_status = 'paid';

-- Comentarios explicativos
COMMENT ON COLUMN appointments.gross_amount IS 'Monto bruto del servicio antes de deducciones';
COMMENT ON COLUMN appointments.commission_amount IS 'Comisión del empleado calculada según commission_percentage del servicio';
COMMENT ON COLUMN appointments.net_amount IS 'Monto neto que recibe el negocio (gross_amount - commission_amount - other_deductions)';
COMMENT ON COLUMN appointments.other_deductions IS 'Otras deducciones adicionales (impuestos adicionales, descuentos, etc.)';

-- Migrar datos existentes: calcular montos para citas ya pagadas
-- Solo para citas completadas con payment_status = 'paid'
UPDATE appointments a
SET 
  gross_amount = COALESCE(a.price, s.price),
  commission_amount = CASE 
    WHEN s.commission_percentage IS NOT NULL THEN 
      ROUND(COALESCE(a.price, s.price) * (s.commission_percentage / 100), 2)
    ELSE 0
  END,
  net_amount = CASE 
    WHEN s.commission_percentage IS NOT NULL THEN 
      ROUND(COALESCE(a.price, s.price) * (1 - s.commission_percentage / 100), 2)
    ELSE COALESCE(a.price, s.price)
  END,
  other_deductions = 0
FROM services s
WHERE a.service_id = s.id
  AND a.payment_status = 'paid'
  AND a.gross_amount IS NULL;

-- Función helper para calcular montos automáticamente (opcional, para triggers futuros)
CREATE OR REPLACE FUNCTION calculate_appointment_amounts()
RETURNS TRIGGER AS $$
DECLARE
  service_price DECIMAL(12,2);
  commission_pct DECIMAL(5,2);
BEGIN
  -- Solo calcular si el pago se marca como 'paid' y no tiene montos calculados
  IF NEW.payment_status = 'paid' AND NEW.gross_amount IS NULL THEN
    -- Obtener precio y comisión del servicio
    SELECT 
      COALESCE(NEW.price, s.price),
      COALESCE(s.commission_percentage, 0)
    INTO service_price, commission_pct
    FROM services s
    WHERE s.id = NEW.service_id;

    -- Calcular montos
    NEW.gross_amount := service_price;
    NEW.commission_amount := ROUND(service_price * (commission_pct / 100), 2);
    NEW.other_deductions := COALESCE(NEW.other_deductions, 0);
    NEW.net_amount := service_price - NEW.commission_amount - NEW.other_deductions;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular montos automáticamente al marcar como pagado
CREATE TRIGGER trigger_calculate_appointment_amounts
BEFORE INSERT OR UPDATE ON appointments
FOR EACH ROW
WHEN (NEW.payment_status = 'paid')
EXECUTE FUNCTION calculate_appointment_amounts();

-- Comentario en la función
COMMENT ON FUNCTION calculate_appointment_amounts() IS 
'Calcula automáticamente gross_amount, commission_amount y net_amount cuando una cita se marca como pagada';
