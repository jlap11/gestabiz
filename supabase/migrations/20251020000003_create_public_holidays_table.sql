-- Create public_holidays table with country_id foreign key
-- This table stores national and regional holidays that should be excluded from absence/vacation requests

CREATE TABLE IF NOT EXISTS public.public_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id UUID NOT NULL REFERENCES public.countries(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  holiday_date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT true, -- true si se repite cada año (ej: Navidad), false si es una fecha específica (ej: Conmemoración de Batalla de Boyacá)
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraint: Una fecha no puede ser festivo más de una vez por país
  CONSTRAINT unique_country_holiday UNIQUE(country_id, holiday_date)
);

-- Índices para performance
CREATE INDEX idx_public_holidays_country_id 
  ON public.public_holidays(country_id);

CREATE INDEX idx_public_holidays_date 
  ON public.public_holidays(holiday_date);

CREATE INDEX idx_public_holidays_country_date 
  ON public.public_holidays(country_id, holiday_date);

-- Row Level Security (RLS)
ALTER TABLE public.public_holidays ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can view public holidays (they affect availability)
CREATE POLICY "Allow public read for all users" ON public.public_holidays
  FOR SELECT USING (true);

-- Policy 2: Only super admins can insert/update/delete holidays
CREATE POLICY "Allow admin manage holidays" ON public.public_holidays
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE role = 'super_admin'
    )
  );

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_public_holidays_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_public_holidays_updated_at
  BEFORE UPDATE ON public.public_holidays
  FOR EACH ROW
  EXECUTE FUNCTION update_public_holidays_timestamp();

-- Grant permissions
GRANT SELECT ON public.public_holidays TO authenticated, anon;
GRANT ALL ON public.public_holidays TO authenticated;
