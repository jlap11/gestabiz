// =====================================================
// SISTEMA DE PERMISOS v2.0 - Gestabiz
// Fecha: 13 de Octubre de 2025
// =====================================================
// IMPORTANTE: Solo existe rol 'admin', se diferencia Admin Dueño por user_id === businesses.owner_id
// =====================================================

import { BusinessRole, Permission, UserPermission } from '@/types/types'

// =====================================================
// CONSTANTES
// =====================================================

/**
 * Todos los permisos disponibles en el sistema
 */
export const ALL_PERMISSIONS: Permission[] = [
  // Business Management (5)
  'business.view',
  'business.edit',
  'business.delete',
  'business.settings',
  'business.categories',

  // Locations (5)
  'locations.view',
  'locations.create',
  'locations.edit',
  'locations.delete',
  'locations.assign_employees',

  // Services (5)
  'services.view',
  'services.create',
  'services.edit',
  'services.delete',
  'services.prices',

  // Employees (8)
  'employees.view',
  'employees.create',
  'employees.edit',
  'employees.delete',
  'employees.assign_services',
  'employees.view_payroll',
  'employees.manage_payroll',
  'employees.set_schedules',

  // Appointments (7)
  'appointments.view_all',
  'appointments.view_own',
  'appointments.create',
  'appointments.edit',
  'appointments.delete',
  'appointments.assign',
  'appointments.confirm',

  // Clients (7)
  'clients.view',
  'clients.create',
  'clients.edit',
  'clients.delete',
  'clients.export',
  'clients.communication',
  'clients.history',

  // Accounting (9)
  'accounting.view',
  'accounting.tax_config',
  'accounting.expenses.view',
  'accounting.expenses.create',
  'accounting.expenses.pay',
  'accounting.payroll.view',
  'accounting.payroll.create',
  'accounting.payroll.config',
  'accounting.export',

  // Reports (4)
  'reports.view_financial',
  'reports.view_operations',
  'reports.export',
  'reports.analytics',

  // Permissions Management (5)
  'permissions.view',
  'permissions.assign_admin',
  'permissions.assign_employee',
  'permissions.modify',
  'permissions.revoke',

  // Notifications (2)
  'notifications.send',
  'notifications.bulk',

  // Settings (3)
  'settings.view',
  'settings.edit_own',
  'settings.edit_business',
]

/**
 * Descripción de permisos en español
 */
export const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  // Business Management
  'business.view': 'Ver información del negocio',
  'business.edit': 'Editar información básica del negocio',
  'business.delete': 'Eliminar el negocio',
  'business.settings': 'Configurar ajustes avanzados',
  'business.categories': 'Gestionar categorías y subcategorías',

  // Locations
  'locations.view': 'Ver lista de sedes',
  'locations.create': 'Crear nuevas sedes',
  'locations.edit': 'Editar información de sedes',
  'locations.delete': 'Eliminar sedes',
  'locations.assign_employees': 'Asignar empleados a sedes',

  // Services
  'services.view': 'Ver lista de servicios',
  'services.create': 'Crear nuevos servicios',
  'services.edit': 'Editar información de servicios',
  'services.delete': 'Eliminar servicios',
  'services.prices': 'Modificar precios de servicios',

  // Employees
  'employees.view': 'Ver lista de empleados',
  'employees.create': 'Contratar nuevos empleados',
  'employees.edit': 'Editar información de empleados',
  'employees.delete': 'Despedir empleados',
  'employees.assign_services': 'Asignar servicios a empleados',
  'employees.view_payroll': 'Ver nómina de empleados',
  'employees.manage_payroll': 'Gestionar pagos de nómina',
  'employees.set_schedules': 'Configurar horarios de empleados',

  // Appointments
  'appointments.view_all': 'Ver todas las citas del negocio',
  'appointments.view_own': 'Ver solo sus propias citas',
  'appointments.create': 'Crear nuevas citas',
  'appointments.edit': 'Editar citas existentes',
  'appointments.delete': 'Cancelar citas',
  'appointments.assign': 'Asignar empleados a citas',
  'appointments.confirm': 'Confirmar citas',

  // Clients
  'clients.view': 'Ver lista de clientes',
  'clients.create': 'Crear nuevos clientes',
  'clients.edit': 'Editar información de clientes',
  'clients.delete': 'Eliminar clientes',
  'clients.export': 'Exportar datos de clientes',
  'clients.communication': 'Enviar notificaciones a clientes',
  'clients.history': 'Ver historial de citas de clientes',

  // Accounting
  'accounting.view': 'Ver módulo de contabilidad',
  'accounting.tax_config': 'Configurar impuestos (IVA, ICA, Retención)',
  'accounting.expenses.view': 'Ver gastos recurrentes',
  'accounting.expenses.create': 'Crear y editar gastos',
  'accounting.expenses.pay': 'Procesar pagos de gastos',
  'accounting.payroll.view': 'Ver nómina de empleados',
  'accounting.payroll.create': 'Crear pagos de nómina',
  'accounting.payroll.config': 'Configurar comisiones y prestaciones',
  'accounting.export': 'Exportar reportes contables',

  // Reports
  'reports.view_financial': 'Ver reportes financieros',
  'reports.view_operations': 'Ver reportes operacionales',
  'reports.export': 'Exportar reportes',
  'reports.analytics': 'Acceder a analytics avanzado',

  // Permissions Management
  'permissions.view': 'Ver permisos de usuarios',
  'permissions.assign_admin': 'Asignar rol de administrador',
  'permissions.assign_employee': 'Asignar rol de empleado',
  'permissions.modify': 'Modificar permisos de usuarios',
  'permissions.revoke': 'Revocar permisos',

  // Notifications
  'notifications.send': 'Enviar notificaciones individuales',
  'notifications.bulk': 'Enviar notificaciones masivas',

  // Settings
  'settings.view': 'Ver configuración',
  'settings.edit_own': 'Editar perfil propio',
  'settings.edit_business': 'Editar configuración del negocio',
}

/**
 * Categorías de permisos para organización en UI
 */
export const PERMISSION_CATEGORIES = {
  business: {
    label: 'Gestión del Negocio',
    permissions: [
      'business.view',
      'business.edit',
      'business.delete',
      'business.settings',
      'business.categories',
    ] as Permission[],
  },
  locations: {
    label: 'Sedes',
    permissions: [
      'locations.view',
      'locations.create',
      'locations.edit',
      'locations.delete',
      'locations.assign_employees',
    ] as Permission[],
  },
  services: {
    label: 'Servicios',
    permissions: [
      'services.view',
      'services.create',
      'services.edit',
      'services.delete',
      'services.prices',
    ] as Permission[],
  },
  employees: {
    label: 'Empleados',
    permissions: [
      'employees.view',
      'employees.create',
      'employees.edit',
      'employees.delete',
      'employees.assign_services',
      'employees.view_payroll',
      'employees.manage_payroll',
      'employees.set_schedules',
    ] as Permission[],
  },
  appointments: {
    label: 'Citas',
    permissions: [
      'appointments.view_all',
      'appointments.view_own',
      'appointments.create',
      'appointments.edit',
      'appointments.delete',
      'appointments.assign',
      'appointments.confirm',
    ] as Permission[],
  },
  clients: {
    label: 'Clientes',
    permissions: [
      'clients.view',
      'clients.create',
      'clients.edit',
      'clients.delete',
      'clients.export',
      'clients.communication',
      'clients.history',
    ] as Permission[],
  },
  accounting: {
    label: 'Contabilidad',
    permissions: [
      'accounting.view',
      'accounting.tax_config',
      'accounting.expenses.view',
      'accounting.expenses.create',
      'accounting.expenses.pay',
      'accounting.payroll.view',
      'accounting.payroll.create',
      'accounting.payroll.config',
      'accounting.export',
    ] as Permission[],
  },
  reports: {
    label: 'Reportes',
    permissions: [
      'reports.view_financial',
      'reports.view_operations',
      'reports.export',
      'reports.analytics',
    ] as Permission[],
  },
  permissions: {
    label: 'Permisos',
    permissions: [
      'permissions.view',
      'permissions.assign_admin',
      'permissions.assign_employee',
      'permissions.modify',
      'permissions.revoke',
    ] as Permission[],
  },
  notifications: {
    label: 'Notificaciones',
    permissions: ['notifications.send', 'notifications.bulk'] as Permission[],
  },
  settings: {
    label: 'Configuración',
    permissions: ['settings.view', 'settings.edit_own', 'settings.edit_business'] as Permission[],
  },
}

// =====================================================
// FUNCIONES DE VERIFICACIÓN
// =====================================================

/**
 * Verifica si un usuario es el Admin Dueño del negocio
 * @param userId ID del usuario
 * @param ownerId owner_id del negocio (businesses.owner_id)
 * @returns true si el usuario es el dueño
 */
export function isBusinessOwner(userId: string, ownerId: string): boolean {
  return userId === ownerId
}

/**
 * Verifica si un usuario tiene un permiso específico
 * Admin Dueño bypasea todas las verificaciones (acceso total)
 *
 * @param userId ID del usuario
 * @param ownerId owner_id del negocio
 * @param userPermissions Permisos del usuario
 * @param requiredPermission Permiso requerido
 * @returns true si el usuario tiene el permiso
 */
export function hasPermission(
  userId: string,
  ownerId: string,
  userPermissions: UserPermission[],
  requiredPermission: Permission
): boolean {
  // Admin Dueño tiene todos los permisos
  if (isBusinessOwner(userId, ownerId)) {
    return true
  }

  // Verificar si el usuario tiene el permiso específico
  return userPermissions.some(
    p =>
      p.permission === requiredPermission &&
      p.is_active &&
      (!p.expires_at || new Date(p.expires_at) > new Date())
  )
}

/**
 * Verifica si un usuario tiene CUALQUIERA de los permisos especificados
 *
 * @param userId ID del usuario
 * @param ownerId owner_id del negocio
 * @param userPermissions Permisos del usuario
 * @param requiredPermissions Array de permisos (OR lógico)
 * @returns true si el usuario tiene al menos uno de los permisos
 */
export function hasAnyPermission(
  userId: string,
  ownerId: string,
  userPermissions: UserPermission[],
  requiredPermissions: Permission[]
): boolean {
  // Admin Dueño tiene todos los permisos
  if (isBusinessOwner(userId, ownerId)) {
    return true
  }

  // Verificar si tiene al menos uno de los permisos
  return requiredPermissions.some(permission =>
    hasPermission(userId, ownerId, userPermissions, permission)
  )
}

/**
 * Verifica si un usuario tiene TODOS los permisos especificados
 *
 * @param userId ID del usuario
 * @param ownerId owner_id del negocio
 * @param userPermissions Permisos del usuario
 * @param requiredPermissions Array de permisos (AND lógico)
 * @returns true si el usuario tiene todos los permisos
 */
export function hasAllPermissions(
  userId: string,
  ownerId: string,
  userPermissions: UserPermission[],
  requiredPermissions: Permission[]
): boolean {
  // Admin Dueño tiene todos los permisos
  if (isBusinessOwner(userId, ownerId)) {
    return true
  }

  // Verificar si tiene todos los permisos
  return requiredPermissions.every(permission =>
    hasPermission(userId, ownerId, userPermissions, permission)
  )
}

/**
 * Obtiene todos los permisos activos de un usuario
 * Admin Dueño retorna todos los permisos disponibles
 *
 * @param userId ID del usuario
 * @param ownerId owner_id del negocio
 * @param userPermissions Permisos del usuario
 * @returns Array de permisos activos
 */
export function getUserActivePermissions(
  userId: string,
  ownerId: string,
  userPermissions: UserPermission[]
): Permission[] {
  // Admin Dueño tiene todos los permisos
  if (isBusinessOwner(userId, ownerId)) {
    return ALL_PERMISSIONS
  }

  // Filtrar permisos activos y no expirados
  return userPermissions
    .filter(p => p.is_active && (!p.expires_at || new Date(p.expires_at) > new Date()))
    .map(p => p.permission as Permission)
}

/**
 * Verifica si un usuario tiene un rol específico en un negocio
 *
 * @param businessRoles Roles del usuario
 * @param businessId ID del negocio
 * @param role Rol requerido ('admin' o 'employee')
 * @returns true si el usuario tiene el rol
 */
export function hasBusinessRole(
  businessRoles: BusinessRole[],
  businessId: string,
  role: 'admin' | 'employee'
): boolean {
  return businessRoles.some(br => br.business_id === businessId && br.role === role && br.is_active)
}

/**
 * Obtiene el rol de un usuario en un negocio
 *
 * @param businessRoles Roles del usuario
 * @param businessId ID del negocio
 * @returns 'admin', 'employee' o null si no tiene rol
 */
export function getUserBusinessRole(
  businessRoles: BusinessRole[],
  businessId: string
): 'admin' | 'employee' | null {
  const role = businessRoles.find(br => br.business_id === businessId && br.is_active)
  return role ? role.role : null
}

/**
 * Verifica si un empleado puede ofrecer servicios
 *
 * @param businessRoles Roles del usuario
 * @param businessId ID del negocio
 * @returns true si el empleado es service_provider
 */
export function canProvideServices(businessRoles: BusinessRole[], businessId: string): boolean {
  const employeeRole = businessRoles.find(
    br => br.business_id === businessId && br.role === 'employee' && br.is_active
  )

  return employeeRole?.employee_type === 'service_provider'
}

// =====================================================
// MAPEO DE PERMISOS LEGACY (BACKWARD COMPATIBILITY)
// =====================================================

/**
 * Mapea permisos legacy a nuevos permisos granulares
 */
export const LEGACY_PERMISSION_MAP: Record<string, Permission[]> = {
  read_appointments: ['appointments.view_all', 'appointments.view_own'],
  write_appointments: ['appointments.create', 'appointments.edit'],
  delete_appointments: ['appointments.delete'],
  read_clients: ['clients.view'],
  write_clients: ['clients.create', 'clients.edit'],
  delete_clients: ['clients.delete'],
  read_employees: ['employees.view'],
  write_employees: ['employees.create', 'employees.edit'],
  delete_employees: ['employees.delete'],
  read_business: ['business.view'],
  write_business: ['business.edit'],
  delete_business: ['business.delete'],
  read_reports: ['reports.view_financial', 'reports.view_operations'],
  write_reports: ['reports.export'],
  read_locations: ['locations.view'],
  write_locations: ['locations.create', 'locations.edit'],
  delete_locations: ['locations.delete'],
  read_services: ['services.view'],
  write_services: ['services.create', 'services.edit'],
  delete_services: ['services.delete'],
  manage_settings: ['settings.edit_business'],
  send_notifications: ['notifications.send'],
}

/**
 * Convierte permisos legacy a permisos granulares
 *
 * @param legacyPermissions Array de permisos legacy
 * @returns Array de permisos granulares
 */
export function convertLegacyPermissions(legacyPermissions: string[]): Permission[] {
  const newPermissions = new Set<Permission>()

  legacyPermissions.forEach(legacy => {
    const mapped = LEGACY_PERMISSION_MAP[legacy]
    if (mapped) {
      mapped.forEach(p => newPermissions.add(p))
    }
  })

  return Array.from(newPermissions)
}

// =====================================================
// EXPORTS DEFAULT
// =====================================================

export default {
  ALL_PERMISSIONS,
  PERMISSION_DESCRIPTIONS,
  PERMISSION_CATEGORIES,
  isBusinessOwner,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserActivePermissions,
  hasBusinessRole,
  getUserBusinessRole,
  canProvideServices,
  convertLegacyPermissions,
}
