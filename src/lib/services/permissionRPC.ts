/**
 * Permission RPC Service
 * 
 * Service for managing user permissions through secure RPC functions.
 * Solves audit trigger limitation by maintaining auth context automatically.
 * 
 * Created: 2025-11-17
 * Purpose: Provide type-safe interface to permission RPC functions
 */

import { supabase } from '../supabase';

/**
 * RPC Response Types
 */
export interface RevokePermissionResponse {
  success: boolean;
  rows_affected?: number;
  business_id?: string;
  user_id?: string;
  permission?: string;
  revoked_at?: string;
  revoked_by?: string;
  notes?: string;
  error?: string;
  message?: string;
}

export interface AssignPermissionResponse {
  success: boolean;
  operation?: 'assigned' | 'updated';
  business_id?: string;
  user_id?: string;
  permission?: string;
  granted_at?: string;
  granted_by?: string;
  notes?: string;
  error?: string;
  message?: string;
}

export interface BulkAssignResponse {
  success: boolean;
  template_name?: string;
  permissions_applied?: number;
  user_id?: string;
  applied_at?: string;
  applied_by?: string;
  error?: string;
  message?: string;
}

/**
 * Permission RPC Service Class
 */
export class PermissionRPCService {
  /**
   * Revoke a permission from a user
   * 
   * @param businessId - Business ID
   * @param userId - User ID to revoke permission from
   * @param permission - Permission to revoke (e.g., 'services.create')
   * @param notes - Optional notes explaining the revocation
   * @returns Promise with revocation result
   * 
   * @example
   * const result = await PermissionRPCService.revokePermission(
   *   businessId,
   *   userId,
   *   'services.create',
   *   'User no longer needs this permission'
   * );
   * 
   * if (result.success) {
   *   console.log('Permission revoked successfully');
   * } else {
   *   console.error('Error:', result.error);
   * }
   */
  static async revokePermission(
    businessId: string,
    userId: string,
    permission: string,
    notes?: string
  ): Promise<RevokePermissionResponse> {
    try {
      const { data, error } = await supabase.rpc('revoke_user_permission', {
        p_business_id: businessId,
        p_user_id: userId,
        p_permission: permission,
        p_notes: notes || null
      });

      if (error) {
        console.error('RPC Error (revoke_user_permission):', error);
        return {
          success: false,
          error: error.message,
          message: 'Failed to revoke permission'
        };
      }

      return data as RevokePermissionResponse;
    } catch (err) {
      console.error('Exception in revokePermission:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        message: 'Exception occurred while revoking permission'
      };
    }
  }

  /**
   * Assign a permission to a user (or re-activate if already exists)
   * 
   * @param businessId - Business ID
   * @param userId - User ID to assign permission to
   * @param permission - Permission to assign (e.g., 'appointments.create')
   * @param notes - Optional notes explaining the assignment
   * @returns Promise with assignment result
   * 
   * @example
   * const result = await PermissionRPCService.assignPermission(
   *   businessId,
   *   userId,
   *   'appointments.create',
   *   'Assigned after role change'
   * );
   * 
   * if (result.success && result.operation === 'assigned') {
   *   console.log('New permission assigned');
   * } else if (result.success && result.operation === 'updated') {
   *   console.log('Permission re-activated');
   * }
   */
  static async assignPermission(
    businessId: string,
    userId: string,
    permission: string,
    notes?: string
  ): Promise<AssignPermissionResponse> {
    try {
      const { data, error } = await supabase.rpc('assign_user_permission', {
        p_business_id: businessId,
        p_user_id: userId,
        p_permission: permission,
        p_notes: notes || null
      });

      if (error) {
        console.error('RPC Error (assign_user_permission):', error);
        return {
          success: false,
          error: error.message,
          message: 'Failed to assign permission'
        };
      }

      return data as AssignPermissionResponse;
    } catch (err) {
      console.error('Exception in assignPermission:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        message: 'Exception occurred while assigning permission'
      };
    }
  }

  /**
   * Apply all permissions from a template to a user
   * 
   * @param businessId - Business ID
   * @param userId - User ID to apply template to
   * @param templateId - Template ID to apply
   * @param notes - Optional notes explaining the bulk assignment
   * @returns Promise with bulk assignment result
   * 
   * @example
   * const result = await PermissionRPCService.applyTemplate(
   *   businessId,
   *   userId,
   *   templateId,
   *   'Applied Vendedor template to new employee'
   * );
   * 
   * if (result.success) {
   *   console.log(`Applied ${result.permissions_applied} permissions from ${result.template_name}`);
   * }
   */
  static async applyTemplate(
    businessId: string,
    userId: string,
    templateId: string,
    notes?: string
  ): Promise<BulkAssignResponse> {
    try {
      const { data, error } = await supabase.rpc('bulk_assign_permissions_from_template', {
        p_business_id: businessId,
        p_user_id: userId,
        p_template_id: templateId,
        p_notes: notes || null
      });

      if (error) {
        console.error('RPC Error (bulk_assign_permissions_from_template):', error);
        return {
          success: false,
          error: error.message,
          message: 'Failed to apply template'
        };
      }

      return data as BulkAssignResponse;
    } catch (err) {
      console.error('Exception in applyTemplate:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        message: 'Exception occurred while applying template'
      };
    }
  }

  /**
   * Bulk revoke multiple permissions from a user
   * 
   * @param businessId - Business ID
   * @param userId - User ID to revoke permissions from
   * @param permissions - Array of permissions to revoke
   * @param notes - Optional notes explaining the bulk revocation
   * @returns Promise with array of results
   * 
   * @example
   * const results = await PermissionRPCService.bulkRevokePermissions(
   *   businessId,
   *   userId,
   *   ['services.create', 'services.edit', 'services.delete'],
   *   'User role changed to read-only'
   * );
   * 
   * const successful = results.filter(r => r.success).length;
   * console.log(`Revoked ${successful}/${results.length} permissions`);
   */
  static async bulkRevokePermissions(
    businessId: string,
    userId: string,
    permissions: string[],
    notes?: string
  ): Promise<RevokePermissionResponse[]> {
    const results: RevokePermissionResponse[] = [];

    for (const permission of permissions) {
      const result = await this.revokePermission(businessId, userId, permission, notes);
      results.push(result);
    }

    return results;
  }

  /**
   * Bulk assign multiple permissions to a user
   * 
   * @param businessId - Business ID
   * @param userId - User ID to assign permissions to
   * @param permissions - Array of permissions to assign
   * @param notes - Optional notes explaining the bulk assignment
   * @returns Promise with array of results
   * 
   * @example
   * const results = await PermissionRPCService.bulkAssignPermissions(
   *   businessId,
   *   userId,
   *   ['appointments.view', 'services.view', 'locations.view'],
   *   'Basic read-only permissions'
   * );
   * 
   * const successful = results.filter(r => r.success).length;
   * console.log(`Assigned ${successful}/${results.length} permissions`);
   */
  static async bulkAssignPermissions(
    businessId: string,
    userId: string,
    permissions: string[],
    notes?: string
  ): Promise<AssignPermissionResponse[]> {
    const results: AssignPermissionResponse[] = [];

    for (const permission of permissions) {
      const result = await this.assignPermission(businessId, userId, permission, notes);
      results.push(result);
    }

    return results;
  }
}

/**
 * Export singleton instance
 */
export const permissionRPC = PermissionRPCService;
