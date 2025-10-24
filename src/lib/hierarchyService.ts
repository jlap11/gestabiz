/**
 * @file hierarchyService.ts
 * @description Servicio para gestión de jerarquía de empleados
 * Proporciona métodos para CRUD de jerarquía, validaciones y operaciones masivas
 */

import { supabase } from './supabase'

// UUID type alias para mejor legibilidad
// =====================================================
// TIPOS
// =====================================================

export interface HierarchyUpdateData {
  userId: string
  businessId: string
  hierarchyLevel?: number
  reportsTo?: string | null
  jobTitle?: string | null
}

export interface BulkHierarchyUpdate {
  updates: HierarchyUpdateData[]
}

export interface HierarchyValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface SupervisorAssignment {
  employeeId: string
  businessId: string
  newSupervisorId: string | null
}

export interface DirectReportNode {
  user_id: string
  full_name: string
  email: string
  hierarchy_level: number
  job_title: string | null
}

export interface ReportingChainNode {
  level: number
  user_id: string
  full_name: string
  hierarchy_level: number
  job_title: string | null
}

// =====================================================
// SERVICIO DE JERARQUÍA
// =====================================================

class HierarchyService {
  /**
   * Actualiza el nivel jerárquico de un empleado
   */
  async updateEmployeeHierarchy(
    data: HierarchyUpdateData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { userId, businessId, hierarchyLevel, reportsTo } = data

      // Validar que no sea el owner (nivel 0 no se puede cambiar)
      const { data: businessData } = await supabase
        .from('businesses')
        .select('owner_id')
        .eq('id', businessId)
        .single()

      if (businessData?.owner_id === userId) {
        return {
          success: false,
          error: 'No se puede modificar la jerarquía del propietario del negocio',
        }
      }

      // Actualizar en business_roles
      const { error: rolesError } = await supabase
        .from('business_roles')
        .update({
          hierarchy_level: hierarchyLevel,
          reports_to: reportsTo,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('business_id', businessId)

      if (rolesError) {
        return { success: false, error: rolesError.message }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }
    }
  }

  /**
   * Asigna un supervisor a un empleado
   */
  async assignSupervisor(
    assignment: SupervisorAssignment
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { employeeId, businessId, newSupervisorId } = assignment

      // Validar que el supervisor pertenezca al negocio (si no es null)
      if (newSupervisorId) {
        const { data: supervisorExists } = await supabase
          .from('business_roles')
          .select('id')
          .eq('user_id', newSupervisorId)
          .eq('business_id', businessId)
          .eq('is_active', true)
          .single()

        if (!supervisorExists) {
          return {
            success: false,
            error: 'El supervisor especificado no pertenece a este negocio',
          }
        }
      }

      // Actualizar reports_to
      const { error } = await supabase
        .from('business_roles')
        .update({
          reports_to: newSupervisorId,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', employeeId)
        .eq('business_id', businessId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }
    }
  }

  /**
   * Actualiza múltiples empleados en batch
   */
  async bulkUpdateHierarchy(bulk: BulkHierarchyUpdate): Promise<{
    success: boolean
    results: Array<{ userId: string; success: boolean; error?: string }>
  }> {
    const results: Array<{ userId: string; success: boolean; error?: string }> = []

    for (const update of bulk.updates) {
      const result = await this.updateEmployeeHierarchy(update)
      results.push({
        userId: update.userId,
        success: result.success,
        error: result.error,
      })
    }

    const allSuccess = results.every(r => r.success)
    return { success: allSuccess, results }
  }

  /**
   * Valida un cambio de jerarquía antes de aplicarlo
   */
  async validateHierarchyChange(data: HierarchyUpdateData): Promise<HierarchyValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      const { userId, businessId, hierarchyLevel, reportsTo } = data

      // 1. Validar que el usuario existe en el negocio
      const roleData = await this.validateUserInBusiness(userId, businessId)
      if (!roleData) {
        return { isValid: false, errors: ['El usuario no pertenece a este negocio'], warnings }
      }

      // 2. Validar que no sea el owner
      const isOwnerValid = await this.validateNotOwner(userId, businessId)
      if (!isOwnerValid) {
        return {
          isValid: false,
          errors: ['No se puede modificar la jerarquía del propietario'],
          warnings,
        }
      }

      // 3. Validar nivel jerárquico válido
      if (hierarchyLevel !== undefined) {
        this.validateHierarchyLevelRange(hierarchyLevel, roleData.hierarchy_level, errors, warnings)
      }

      // 4. Validar que el supervisor existe (si se especifica)
      if (reportsTo) {
        await this.validateSupervisorInBusiness(
          reportsTo,
          businessId,
          hierarchyLevel,
          errors,
          warnings
        )
      }

      // 5. Validar que no se crea un ciclo
      if (reportsTo) {
        await this.validateNoCycle(userId, businessId, reportsTo, errors)
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Error al validar cambio de jerarquía')
      return { isValid: false, errors, warnings }
    }
  }

  /**
   * Valida que el usuario existe en el negocio
   */
  private async validateUserInBusiness(userId: string, businessId: string) {
    const { data: roleData } = await supabase
      .from('business_roles')
      .select('role, hierarchy_level')
      .eq('user_id', userId)
      .eq('business_id', businessId)
      .eq('is_active', true)
      .single()

    return roleData
  }

  /**
   * Valida que el usuario no sea el propietario
   */
  private async validateNotOwner(userId: string, businessId: string): Promise<boolean> {
    const { data: businessData } = await supabase
      .from('businesses')
      .select('owner_id')
      .eq('id', businessId)
      .single()

    return businessData?.owner_id !== userId
  }

  /**
   * Valida el rango del nivel jerárquico
   */
  private validateHierarchyLevelRange(
    hierarchyLevel: number,
    currentLevel: number | null,
    errors: string[],
    warnings: string[]
  ) {
    if (hierarchyLevel < 1 || hierarchyLevel > 4) {
      errors.push('El nivel jerárquico debe estar entre 1 (Admin) y 4 (Staff)')
    }

    if (currentLevel && hierarchyLevel > currentLevel) {
      warnings.push(`Se está reduciendo el nivel de ${currentLevel} a ${hierarchyLevel}`)
    }
  }

  /**
   * Valida que el supervisor existe en el negocio
   */
  private async validateSupervisorInBusiness(
    reportsTo: string,
    businessId: string,
    hierarchyLevel: number | undefined,
    errors: string[],
    warnings: string[]
  ) {
    const { data: supervisorData } = await supabase
      .from('business_roles')
      .select('hierarchy_level')
      .eq('user_id', reportsTo)
      .eq('business_id', businessId)
      .eq('is_active', true)
      .single()

    if (!supervisorData) {
      errors.push('El supervisor especificado no pertenece a este negocio')
      return
    }

    if (hierarchyLevel !== undefined && supervisorData.hierarchy_level >= hierarchyLevel) {
      warnings.push('El supervisor tiene un nivel jerárquico igual o inferior al del empleado')
    }
  }

  /**
   * Valida que no se crea un ciclo en la jerarquía
   */
  private async validateNoCycle(
    userId: string,
    businessId: string,
    reportsTo: string,
    errors: string[]
  ) {
    const { data: cycleCheck } = await supabase.rpc('get_reporting_chain', {
      p_user_id: reportsTo,
      p_business_id: businessId,
    })

    if (cycleCheck && Array.isArray(cycleCheck)) {
      const hasUserInChain = (cycleCheck as ReportingChainNode[]).some(
        node => node.user_id === userId
      )
      if (hasUserInChain) {
        errors.push('Esta asignación crearía un ciclo en la jerarquía')
      }
    }
  }

  /**
   * Actualiza el cargo (job_title) de un empleado
   */
  async updateJobTitle(
    employeeId: string,
    businessId: string,
    jobTitle: string | null
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('business_employees')
        .update({
          job_title: jobTitle,
          updated_at: new Date().toISOString(),
        })
        .eq('employee_id', employeeId)
        .eq('business_id', businessId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }
    }
  }

  /**
   * Obtiene subordinados directos de un empleado
   */
  async getDirectReports(
    userId: string,
    businessId: string
  ): Promise<{ success: boolean; data?: DirectReportNode[]; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('get_direct_reports', {
        p_user_id: userId,
        p_business_id: businessId,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }
    }
  }

  /**
   * Obtiene la cadena completa de supervisores de un empleado
   */
  async getReportingChain(
    userId: string,
    businessId: string
  ): Promise<{ success: boolean; data?: ReportingChainNode[]; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('get_reporting_chain', {
        p_user_id: userId,
        p_business_id: businessId,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data: data || [] }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }
    }
  }

  /**
   * Verifica si un usuario tiene permiso para gestionar jerarquía
   */
  async hasHierarchyPermission(
    businessId: string,
    permissionName: string
  ): Promise<{ success: boolean; hasPermission?: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('user_has_hierarchy_permission', {
        p_business_id: businessId,
        p_permission_name: permissionName,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, hasPermission: data === true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }
    }
  }
}

// Exportar instancia singleton
export const hierarchyService = new HierarchyService()
export default hierarchyService
