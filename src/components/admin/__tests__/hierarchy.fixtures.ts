/**
 * @file hierarchy.fixtures.ts
 * @description Mock data para tests de jerarquía
 * Datos que coinciden con el tipo EmployeeHierarchy y RPC get_business_hierarchy
 */

import type { EmployeeHierarchy } from '@/types'

/**
 * Empleado raíz (Owner/Admin sin supervisor)
 */
export const mockOwner: EmployeeHierarchy = {
  user_id: '00000000-0000-0000-0000-000000000001',
  full_name: 'Alice Manager',
  email: 'alice@example.com',
  phone: '+1-555-0001',
  avatar_url: 'https://example.com/alice.jpg',
  role: 'admin',
  employee_type: 'location_manager',
  hierarchy_level: 0,
  job_title: 'Propietario',
  reports_to: null,
  supervisor_name: null,
  location_id: '00000000-0000-0000-0000-100000000001',
  location_name: 'Sede Principal',
  is_active: true,
  hired_at: '2024-01-01',
  total_appointments: 45,
  completed_appointments: 42,
  cancelled_appointments: 3,
  average_rating: 4.8,
  total_reviews: 15,
  occupancy_rate: 85.5,
  gross_revenue: 5000000,
  services_offered: [
    {
      service_id: '00000000-0000-0000-0000-200000000001',
      service_name: 'Corte de cabello',
      expertise_level: 'expert',
      commission_percentage: 0,
    },
  ],
  direct_reports_count: 2,
  all_reports_count: 3,
}

/**
 * Empleado de nivel 1 (reporte directo del owner)
 */
export const mockManager: EmployeeHierarchy = {
  user_id: '00000000-0000-0000-0000-000000000002',
  full_name: 'Bob Department Lead',
  email: 'bob@example.com',
  phone: '+1-555-0002',
  avatar_url: 'https://example.com/bob.jpg',
  role: 'employee',
  employee_type: 'manager',
  hierarchy_level: 1,
  job_title: 'Gerente de Departamento',
  reports_to: '00000000-0000-0000-0000-000000000001',
  supervisor_name: 'Alice Manager',
  location_id: '00000000-0000-0000-0000-100000000001',
  location_name: 'Sede Principal',
  is_active: true,
  hired_at: '2024-02-01',
  total_appointments: 30,
  completed_appointments: 28,
  cancelled_appointments: 2,
  average_rating: 4.6,
  total_reviews: 12,
  occupancy_rate: 78,
  gross_revenue: 3000000,
  services_offered: [
    {
      service_id: '00000000-0000-0000-0000-200000000001',
      service_name: 'Corte de cabello',
      expertise_level: 'advanced',
      commission_percentage: 10,
    },
    {
      service_id: '00000000-0000-0000-0000-200000000002',
      service_name: 'Tintura',
      expertise_level: 'expert',
      commission_percentage: 15,
    },
  ],
  direct_reports_count: 1,
  all_reports_count: 1,
}

/**
 * Empleado de nivel 2 (reporte del manager)
 */
export const mockEmployee: EmployeeHierarchy = {
  user_id: '00000000-0000-0000-0000-000000000003',
  full_name: 'Carol Specialist',
  email: 'carol@example.com',
  phone: '+1-555-0003',
  avatar_url: 'https://example.com/carol.jpg',
  role: 'employee',
  employee_type: 'specialist',
  hierarchy_level: 2,
  job_title: 'Especialista en Colorimetría',
  reports_to: '00000000-0000-0000-0000-000000000002',
  supervisor_name: 'Bob Department Lead',
  location_id: '00000000-0000-0000-0000-100000000001',
  location_name: 'Sede Principal',
  is_active: true,
  hired_at: '2024-03-01',
  total_appointments: 25,
  completed_appointments: 25,
  cancelled_appointments: 0,
  average_rating: 4.9,
  total_reviews: 20,
  occupancy_rate: 95,
  gross_revenue: 2500000,
  services_offered: [
    {
      service_id: '00000000-0000-0000-0000-200000000002',
      service_name: 'Tintura',
      expertise_level: 'expert',
      commission_percentage: 20,
    },
  ],
  direct_reports_count: 0,
  all_reports_count: 0,
}

/**
 * Empleado sin citas ni reviews (datos nulos)
 */
export const mockInactiveEmployee: EmployeeHierarchy = {
  user_id: '00000000-0000-0000-0000-000000000004',
  full_name: 'David Onboarding',
  email: 'david@example.com',
  phone: null,
  avatar_url: null,
  role: 'employee',
  employee_type: 'staff',
  hierarchy_level: 1,
  job_title: null,
  reports_to: '00000000-0000-0000-0000-000000000001',
  supervisor_name: 'Alice Manager',
  location_id: null,
  location_name: null,
  is_active: false,
  hired_at: null,
  total_appointments: 0,
  completed_appointments: 0,
  cancelled_appointments: 0,
  average_rating: null,
  total_reviews: 0,
  occupancy_rate: null,
  gross_revenue: null,
  services_offered: null,
  direct_reports_count: 0,
  all_reports_count: 0,
}

/**
 * Conjunto completo de empleados con jerarquía
 */
export const mockEmployeeHierarchy: EmployeeHierarchy[] = [
  mockOwner,
  mockManager,
  mockEmployee,
  mockInactiveEmployee,
]

/**
 * Helper: Crear empleado con datos personalizados
 */
export function createMockEmployee(overrides: Partial<EmployeeHierarchy>): EmployeeHierarchy {
  return {
    ...mockEmployee,
    ...overrides,
  }
}
