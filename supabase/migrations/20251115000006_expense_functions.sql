-- ==========================================================
-- SISTEMA COMPLETO DE EGRESOS - PARTE 3: FUNCIONES Y AUTOMATIZACIÓN
-- ==========================================================
-- Fecha: 15/11/2025
-- Descripción: Funciones para generar transacciones automáticas desde egresos recurrentes
-- ==========================================================

-- ========================================
-- FUNCIÓN PARA GENERAR TRANSACCIÓN DESDE EGRESO RECURRENTE
-- ========================================

CREATE OR REPLACE FUNCTION generate_recurring_expense_transaction(p_recurring_expense_id UUID)
RETURNS UUID AS $$
DECLARE
  v_expense recurring_expenses%ROWTYPE;
  v_transaction_id UUID;
BEGIN
  -- Obtener el egreso recurrente
  SELECT * INTO v_expense
  FROM recurring_expenses
  WHERE id = p_recurring_expense_id
    AND is_active = true
    AND next_payment_date <= CURRENT_DATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recurring expense not found or not due for payment';
  END IF;
  
  -- Crear transacción
  INSERT INTO transactions (
    business_id,
    location_id,
    employee_id,
    type,
    category,
    amount,
    currency,
    description,
    transaction_date,
    metadata,
    created_by,
    is_verified
  ) VALUES (
    v_expense.business_id,
    v_expense.location_id,
    v_expense.employee_id,
    'expense',
    v_expense.category,
    v_expense.amount,
    COALESCE(v_expense.currency, 'COP'),
    COALESCE(v_expense.description, v_expense.name, 'Egreso recurrente'),
    CURRENT_DATE,
    jsonb_build_object(
      'recurring_expense_id', v_expense.id,
      'auto_generated', true,
      'payment_period', TO_CHAR(CURRENT_DATE, 'YYYY-MM')
    ),
    v_expense.created_by,
    v_expense.is_automated  -- Auto-verificado si es automatizado
  )
  RETURNING id INTO v_transaction_id;
  
  -- Actualizar egreso recurrente
  UPDATE recurring_expenses
  SET 
    last_payment_date = CURRENT_DATE,
    next_payment_date = CASE COALESCE(v_expense.recurrence_frequency, 'monthly')
      WHEN 'daily' THEN CURRENT_DATE + INTERVAL '1 day'
      WHEN 'weekly' THEN CURRENT_DATE + INTERVAL '1 week'
      WHEN 'biweekly' THEN CURRENT_DATE + INTERVAL '2 weeks'
      WHEN 'monthly' THEN (CURRENT_DATE + INTERVAL '1 month')::date
      WHEN 'quarterly' THEN CURRENT_DATE + INTERVAL '3 months'
      WHEN 'yearly' THEN CURRENT_DATE + INTERVAL '1 year'
      ELSE (CURRENT_DATE + INTERVAL '1 month')::date
    END,
    total_paid = COALESCE(total_paid, 0) + v_expense.amount,
    payments_count = COALESCE(payments_count, 0) + 1,
    updated_at = NOW()
  WHERE id = p_recurring_expense_id;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ========================================
-- FUNCIÓN PARA PROCESAR EGRESOS PENDIENTES (BATCH)
-- ========================================

CREATE OR REPLACE FUNCTION process_due_recurring_expenses()
RETURNS TABLE(
  expense_id UUID,
  transaction_id UUID,
  expense_name TEXT,
  amount NUMERIC,
  status TEXT
) AS $$
DECLARE
  v_expense recurring_expenses%ROWTYPE;
  v_transaction_id UUID;
  v_expense_name TEXT;
BEGIN
  -- Iterar sobre egresos recurrentes que están listos para pago
  FOR v_expense IN
    SELECT *
    FROM recurring_expenses
    WHERE is_active = true
      AND is_automated = true
      AND next_payment_date <= CURRENT_DATE
      AND (end_date IS NULL OR end_date >= CURRENT_DATE)
    ORDER BY next_payment_date
  LOOP
    BEGIN
      -- Obtener nombre del egreso
      v_expense_name := COALESCE(v_expense.name, v_expense.description, 'Egreso recurrente');
      
      -- Generar transacción
      v_transaction_id := generate_recurring_expense_transaction(v_expense.id);
      
      -- Retornar resultado exitoso
      expense_id := v_expense.id;
      transaction_id := v_transaction_id;
      expense_name := v_expense_name;
      amount := v_expense.amount;
      status := 'success';
      RETURN NEXT;
      
    EXCEPTION WHEN OTHERS THEN
      -- Retornar resultado con error
      expense_id := v_expense.id;
      transaction_id := NULL;
      expense_name := v_expense_name;
      amount := v_expense.amount;
      status := 'error: ' || SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ========================================
-- FUNCIÓN PARA OBTENER RESUMEN DE EGRESOS POR CATEGORÍA
-- ========================================

CREATE OR REPLACE FUNCTION get_expense_summary_by_category(
  p_business_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
  category transaction_category,
  total_amount NUMERIC,
  transaction_count BIGINT,
  avg_amount NUMERIC,
  max_amount NUMERIC,
  min_amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.category,
    SUM(t.amount) as total_amount,
    COUNT(*)::BIGINT as transaction_count,
    AVG(t.amount) as avg_amount,
    MAX(t.amount) as max_amount,
    MIN(t.amount) as min_amount
  FROM transactions t
  WHERE t.business_id = p_business_id
    AND t.type = 'expense'
    AND (p_start_date IS NULL OR t.transaction_date >= p_start_date)
    AND (p_end_date IS NULL OR t.transaction_date <= p_end_date)
  GROUP BY t.category
  ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ========================================
-- FUNCIÓN PARA PROYECTAR EGRESOS FUTUROS
-- ========================================

CREATE OR REPLACE FUNCTION project_future_expenses(
  p_business_id UUID,
  p_months INTEGER DEFAULT 3
)
RETURNS TABLE(
  month_year TEXT,
  projected_amount NUMERIC,
  breakdown JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH monthly_recurring AS (
    SELECT 
      TO_CHAR(generate_series(
        CURRENT_DATE,
        CURRENT_DATE + (p_months || ' months')::interval,
        '1 month'::interval
      )::date, 'YYYY-MM') as month,
      SUM(
        CASE 
          WHEN recurrence_frequency = 'monthly' THEN amount
          WHEN recurrence_frequency = 'quarterly' THEN amount / 3
          WHEN recurrence_frequency = 'yearly' THEN amount / 12
          ELSE 0
        END
      ) as monthly_total,
      jsonb_object_agg(
        category::text, 
        SUM(
          CASE 
            WHEN recurrence_frequency = 'monthly' THEN amount
            WHEN recurrence_frequency = 'quarterly' THEN amount / 3
            WHEN recurrence_frequency = 'yearly' THEN amount / 12
            ELSE 0
          END
        )
      ) as breakdown_data
    FROM recurring_expenses
    CROSS JOIN generate_series(
      CURRENT_DATE,
      CURRENT_DATE + (p_months || ' months')::interval,
      '1 month'::interval
    ) AS month_series
    WHERE business_id = p_business_id
      AND is_active = true
      AND (end_date IS NULL OR end_date >= month_series::date)
    GROUP BY TO_CHAR(month_series::date, 'YYYY-MM')
  )
  SELECT 
    month,
    monthly_total,
    breakdown_data
  FROM monthly_recurring
  ORDER BY month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ========================================
-- COMENTARIOS
-- ========================================

COMMENT ON FUNCTION generate_recurring_expense_transaction(UUID) IS 'Genera una transacción a partir de un egreso recurrente';
COMMENT ON FUNCTION process_due_recurring_expenses() IS 'Procesa todos los egresos recurrentes pendientes y genera transacciones automáticamente (para ejecutar via cron)';
COMMENT ON FUNCTION get_expense_summary_by_category(UUID, DATE, DATE) IS 'Obtiene resumen de egresos agrupados por categoría para un rango de fechas';
COMMENT ON FUNCTION project_future_expenses(UUID, INTEGER) IS 'Proyecta egresos futuros basándose en egresos recurrentes configurados';
