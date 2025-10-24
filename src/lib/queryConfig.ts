/**
 * Configuración global de React Query para optimizar performance
 *
 * Estrategia:
 * - staleTime largo: Evitar refetches innecesarios (5 minutos)
 * - gcTime grande: Mantener datos en caché (24 horas)
 * - refetchOnWindowFocus: false en datos que no cambian frecuentemente
 * - dedupingInterval: Deduplicar requests idénticas (10 segundos)
 */

export const QUERY_CONFIG = {
  // Queries que cambian raramente (negocio, empleados, servicios)
  STABLE: {
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 60 * 24, // 24 horas
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  },

  // Queries que cambian frecuentemente (citas, ausencias, notificaciones)
  FREQUENT: {
    staleTime: 1000 * 60, // 1 minuto
    gcTime: 1000 * 60 * 10, // 10 minutos
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },

  // Queries en tiempo real (chat, notificaciones)
  REALTIME: {
    staleTime: 0, // Siempre stale
    gcTime: 1000 * 60 * 5, // 5 minutos
    refetchInterval: 1000 * 30, // Refetch cada 30s
  },

  // Query Keys predefinidas para evitar typos
  KEYS: {
    BUSINESS_EMPLOYEES: (businessId: string) => ['business-employees', businessId],
    EMPLOYEE_ABSENCES: (employeeId: string, businessId: string) => [
      'employee-absences',
      employeeId,
      businessId,
    ],
    VACATION_BALANCE: (employeeId: string, businessId: string, year: number) => [
      'vacation-balance',
      employeeId,
      businessId,
      year,
    ],
    PUBLIC_HOLIDAYS: (country: string, year: number) => ['public-holidays', country, year],
    IN_APP_NOTIFICATIONS: (userId: string) => ['in-app-notifications', userId],
    EMPLOYEE_BUSINESSES: (employeeId: string) => ['employee-businesses', employeeId],
    COMPLETED_APPOINTMENTS: (clientId: string) => ['completed-appointments', clientId],
  },
}

export default QUERY_CONFIG
