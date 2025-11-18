
-- =====================================================
-- FIX: Recursión Infinita en RLS de user_permissions
-- Fecha: 17 de noviembre de 2025
-- Bug: Error 42P17 "infinite recursion detected"
-- =====================================================

-- Desactivar RLS temporalmente
ALTER TABLE public.user_permissions DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas que causan recursión
DROP POLICY IF EXISTS user_permissions_select ON public.user_permissions;
DROP POLICY IF EXISTS user_permissions_insert ON public.user_permissions;
DROP POLICY IF EXISTS user_permissions_update ON public.user_permissions;
DROP POLICY IF EXISTS user_permissions_delete ON public.user_permissions;

-- =====================================================
-- NUEVAS POLÍTICAS SIN RECURSIÓN
-- =====================================================

-- SELECT: Owner, el propio usuario, o admins del negocio
CREATE POLICY user_permissions_select_v2 ON public.user_permissions
  FOR SELECT
  USING (
    -- Owner del negocio (bypass total)
    is_business_owner(auth.uid(), business_id)
    OR
    -- Usuario viendo sus propios permisos
    user_id = auth.uid()
    OR
    -- Admins del negocio (verificar en business_roles directamente)
    EXISTS (
      SELECT 1 FROM business_roles br
      WHERE br.user_id = auth.uid()
        AND br.business_id = user_permissions.business_id
        AND br.role = 'admin'
        AND br.is_active = true
    )
  );

-- INSERT: Solo owners y admins con permiso explícito
CREATE POLICY user_permissions_insert_v2 ON public.user_permissions
  FOR INSERT
  WITH CHECK (
    -- Owner del negocio
    is_business_owner(auth.uid(), business_id)
    OR
    -- Admin con permiso explícito (verificar en business_roles)
    EXISTS (
      SELECT 1 FROM business_roles br
      WHERE br.user_id = auth.uid()
        AND br.business_id = user_permissions.business_id
        AND br.role = 'admin'
        AND br.is_active = true
    )
  );

-- UPDATE: Solo owners y admins
CREATE POLICY user_permissions_update_v2 ON public.user_permissions
  FOR UPDATE
  USING (
    is_business_owner(auth.uid(), business_id)
    OR
    EXISTS (
      SELECT 1 FROM business_roles br
      WHERE br.user_id = auth.uid()
        AND br.business_id = user_permissions.business_id
        AND br.role = 'admin'
        AND br.is_active = true
    )
  )
  WITH CHECK (
    is_business_owner(auth.uid(), business_id)
    OR
    EXISTS (
      SELECT 1 FROM business_roles br
      WHERE br.user_id = auth.uid()
        AND br.business_id = user_permissions.business_id
        AND br.role = 'admin'
        AND br.is_active = true
    )
  );

-- DELETE: Solo owners y admins
CREATE POLICY user_permissions_delete_v2 ON public.user_permissions
  FOR DELETE
  USING (
    is_business_owner(auth.uid(), business_id)
    OR
    EXISTS (
      SELECT 1 FROM business_roles br
      WHERE br.user_id = auth.uid()
        AND br.business_id = user_permissions.business_id
        AND br.role = 'admin'
        AND br.is_active = true
    )
  );

-- Reactivar RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que las políticas se crearon correctamente
DO $$
DECLARE
  v_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE tablename = 'user_permissions';
  
  IF v_policy_count = 4 THEN
    RAISE NOTICE 'SUCCESS: 4 políticas RLS creadas correctamente para user_permissions';
  ELSE
    RAISE WARNING 'Políticas creadas: %. Se esperaban 4.', v_policy_count;
  END IF;
END $$;
;
