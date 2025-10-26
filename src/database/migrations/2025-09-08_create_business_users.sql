-- Migración: Crear tabla business_users para relación usuario-negocio con rol por negocio
CREATE TABLE IF NOT EXISTS business_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'client',
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (business_id, user_id)
);
-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_business_users_business_id ON business_users(business_id);
CREATE INDEX IF NOT EXISTS idx_business_users_user_id ON business_users(user_id);
