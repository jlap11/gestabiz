-- =====================================================
-- MIGRACIÓN: RLS para work_schedules
-- Fecha: 24 de Octubre 2025
-- Descripción: Habilita RLS y crea políticas mínimas para permitir
--              SELECT de horarios por el propio empleado autenticado.
-- =====================================================

-- Asegurar que la tabla existe
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'work_schedules'
  ) THEN
    RAISE EXCEPTION 'La tabla public.work_schedules no existe en el esquema actual';
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas previas si existen
DROP POLICY IF EXISTS sel_work_schedules_self ON public.work_schedules;

-- Política: los empleados pueden leer sus propios horarios
CREATE POLICY sel_work_schedules_self 
  ON public.work_schedules
  FOR SELECT
  USING (
    auth.uid() = employee_id
  );

-- Comentario para documentación
COMMENT ON TABLE public.work_schedules IS 'RLS: Lectura permitida para el propio empleado (auth.uid() == employee_id).';
COMMENT ON POLICY sel_work_schedules_self ON public.work_schedules IS 'Permite SELECT a empleados para sus propios horarios.';
