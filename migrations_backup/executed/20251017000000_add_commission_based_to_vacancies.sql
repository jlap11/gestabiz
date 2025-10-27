-- Agregar columna commission_based a job_vacancies
-- Permite indicar si la posición incluye comisiones además del salario base

ALTER TABLE public.job_vacancies 
ADD COLUMN IF NOT EXISTS commission_based BOOLEAN DEFAULT FALSE;

-- Comentario explicativo
COMMENT ON COLUMN public.job_vacancies.commission_based IS 'Indica si el empleado recibirá comisiones además del salario base';
