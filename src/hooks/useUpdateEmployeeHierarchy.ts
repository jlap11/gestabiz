/**
 * @file useUpdateEmployeeHierarchy.ts
 * @description Hook personalizado para actualizar el nivel jerárquico de empleados
 * Maneja actualizaciones optimistas, validaciones y notificaciones
 *
 * IMPORTANTE: Este hook actualiza business_roles.hierarchy_level
 * NO afecta a reports_to (relación de supervisión)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { isValidHierarchyLevel } from '@/lib/hierarchyLevelUtils'

// =====================================================
// TIPOS
// =====================================================

interface UpdateHierarchyLevelParams {
  userId: string
  businessId: string
  newLevel: number
  employeeName: string
}

interface UpdateHierarchyLevelResponse {
  success: boolean
  error?: string
}

// =====================================================
// HOOK
// =====================================================

export function useUpdateEmployeeHierarchy() {
  const queryClient = useQueryClient()

  const mutation = useMutation<UpdateHierarchyLevelResponse, Error, UpdateHierarchyLevelParams>({
    mutationFn: async ({ userId, businessId, newLevel }: UpdateHierarchyLevelParams) => {
      // VALIDACIÓN 1: Nivel válido (0-4)
      if (!isValidHierarchyLevel(newLevel)) {
        throw new Error(`Nivel jerárquico inválido: ${newLevel}. Debe estar entre 0 y 4.`)
      }

      // WORKAROUND: Usar Edge Function en lugar de RPC
      // PostgREST está corrupto, así que usamos una función serverless
      const { data } = await supabase.auth.getSession()
      const accessToken = data?.session?.access_token

      if (!accessToken) {
        throw new Error('No autenticado - no se pudo obtener token')
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (!supabaseUrl) {
        throw new Error('VITE_SUPABASE_URL no configurada')
      }

      const payload = {
        uid: userId,
        bid: businessId,
        lvl: newLevel,
      }

      // eslint-disable-next-line no-console
      console.log('Payload enviado update-hierarchy:', payload)

      const response = await fetch(`${supabaseUrl}/functions/v1/update-hierarchy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || result.error || `Error: ${response.status}`)
      }

      return { success: true }
    },

    onMutate: ({ employeeName, userId }) => {
      // Toast de carga
      toast.loading(`Actualizando nivel de ${employeeName}...`, {
        id: `hierarchy-update-${userId}`,
      })
    },

    onSuccess: (_, { employeeName, userId, businessId }) => {
      // Toast de éxito
      toast.success(`Nivel jerárquico de ${employeeName} actualizado correctamente`, {
        id: `hierarchy-update-${userId}`,
      })

      // Invalidar queries para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['businessHierarchy', businessId] })
      // Refrescar inmediatamente
      queryClient.refetchQueries({ queryKey: ['businessHierarchy', businessId] })
    },

    onError: (error, { employeeName, userId }) => {
      // Toast de error
      toast.error(`Error actualizando nivel de ${employeeName}: ${error.message}`, {
        id: `hierarchy-update-${userId}`,
      })
    },
  })

  return {
    updateHierarchyLevel: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  }
}

// =====================================================
// HOOK CON AUTO-INVALIDACIÓN (Para componentes individuales)
// =====================================================

/**
 * Variante simplificada que solo necesita businessId
 * Útil para componentes que solo actualizan empleados de un negocio
 */
export function useUpdateEmployeeHierarchySimple(businessId: string) {
  const { updateHierarchyLevel, isUpdating, error } = useUpdateEmployeeHierarchy()

  const updateLevel = async (userId: string, newLevel: number, employeeName: string) => {
    return updateHierarchyLevel({
      userId,
      businessId,
      newLevel,
      employeeName,
    })
  }

  return {
    updateLevel,
    isUpdating,
    error,
  }
}
