import { UserRole, Permission, RolePermissions } from '@/types'

// Define permissions for each role
export const ROLE_PERMISSIONS: RolePermissions = {
  admin: [
    'read_appointments',
    'write_appointments', 
    'delete_appointments',
    'read_clients',
    'write_clients',
    'delete_clients',
    'read_employees',
    'write_employees',
    'delete_employees',
    'read_business',
    'write_business',
    'delete_business',
    'read_reports',
    'write_reports',
    'read_locations',
    'write_locations',
    'delete_locations',
    'read_services',
    'write_services',
    'delete_services',
    'manage_settings',
    'send_notifications'
  ],
  employee: [
    'read_appointments',
    'write_appointments',
    'read_clients',
    'write_clients',
    'read_business',
    'read_services',
    'send_notifications'
  ],
  client: [
    'read_appointments'
  ]
}

// Get permissions for a role
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

// Check if a role has a specific permission
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false
}

// Check if user has permission (considering custom permissions)
export function userHasPermission(
  userRole: UserRole, 
  userPermissions: Permission[], 
  requiredPermission: Permission
): boolean {
  // Check role-based permissions first
  if (hasPermission(userRole, requiredPermission)) {
    return true
  }
  
  // Check custom user permissions
  return userPermissions.includes(requiredPermission)
}

// Get all available permissions
export function getAllPermissions(): Permission[] {
  return [
    'read_appointments',
    'write_appointments', 
    'delete_appointments',
    'read_clients',
    'write_clients',
    'delete_clients',
    'read_employees',
    'write_employees',
    'delete_employees',
    'read_business',
    'write_business',
    'delete_business',
    'read_reports',
    'write_reports',
    'read_locations',
    'write_locations',
    'delete_locations',
    'read_services',
    'write_services',
    'delete_services',
    'manage_settings',
    'send_notifications'
  ]
}

// Permission descriptions for UI
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  'read_appointments': 'Ver citas',
  'write_appointments': 'Crear y editar citas',
  'delete_appointments': 'Eliminar citas',
  'read_clients': 'Ver clientes',
  'write_clients': 'Crear y editar clientes',
  'delete_clients': 'Eliminar clientes',
  'read_employees': 'Ver empleados',
  'write_employees': 'Crear y editar empleados',
  'delete_employees': 'Eliminar empleados',
  'read_business': 'Ver información del negocio',
  'write_business': 'Editar información del negocio',
  'delete_business': 'Eliminar negocio',
  'read_reports': 'Ver reportes',
  'write_reports': 'Crear reportes',
  'read_locations': 'Ver ubicaciones',
  'write_locations': 'Crear y editar ubicaciones',
  'delete_locations': 'Eliminar ubicaciones',
  'read_services': 'Ver servicios',
  'write_services': 'Crear y editar servicios',
  'delete_services': 'Eliminar servicios',
  'manage_settings': 'Gestionar configuración',
  'send_notifications': 'Enviar notificaciones'
}

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: 'Administrador - Acceso completo al sistema',
  employee: 'Empleado - Puede gestionar citas y clientes',
  client: 'Cliente - Solo puede ver sus propias citas'
}