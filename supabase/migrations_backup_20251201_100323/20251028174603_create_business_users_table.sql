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
-- Habilitar RLS
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;
-- Políticas RLS para business_users
-- Los usuarios pueden ver sus propias relaciones con negocios
CREATE POLICY "Users can view their own business relationships" ON business_users
    FOR SELECT USING (auth.uid() = user_id);
-- Los administradores y propietarios pueden ver todas las relaciones de su negocio
CREATE POLICY "Business admins can view all business relationships" ON business_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM business_users bu
            WHERE bu.business_id = business_users.business_id
            AND bu.user_id = auth.uid()
            AND bu.role IN ('admin', 'owner')
        )
    );
-- Los administradores y propietarios pueden insertar nuevas relaciones en su negocio
CREATE POLICY "Business admins can insert business relationships" ON business_users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM business_users bu
            WHERE bu.business_id = business_users.business_id
            AND bu.user_id = auth.uid()
            AND bu.role IN ('admin', 'owner')
        )
    );
-- Los administradores y propietarios pueden actualizar relaciones en su negocio
CREATE POLICY "Business admins can update business relationships" ON business_users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM business_users bu
            WHERE bu.business_id = business_users.business_id
            AND bu.user_id = auth.uid()
            AND bu.role IN ('admin', 'owner')
        )
    );
-- Los administradores y propietarios pueden eliminar relaciones en su negocio
CREATE POLICY "Business admins can delete business relationships" ON business_users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM business_users bu
            WHERE bu.business_id = business_users.business_id
            AND bu.user_id = auth.uid()
            AND bu.role IN ('admin', 'owner')
        )
    );
