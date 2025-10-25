interface EmployeeRequest {
  id: string
  user_id: string
  user_name: string
  user_email: string
  user_avatar?: string
  business_id: string
  requested_at: string
  message?: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by?: string
  reviewed_at?: string
  rejection_reason?: string
}

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  phone?: string
  created_at: string
  status: 'active' | 'inactive'
}

/**
 * Obtiene las iniciales de un nombre para mostrar en el avatar
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Formatea una fecha para mostrar en formato local
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString()
}

/**
 * Filtra solicitudes de empleados por término de búsqueda
 */
export function filterEmployeeRequests(requests: EmployeeRequest[], searchTerm: string): EmployeeRequest[] {
  if (!searchTerm.trim()) return requests
  
  const term = searchTerm.toLowerCase()
  return requests.filter(request =>
    request.user_name.toLowerCase().includes(term) ||
    request.user_email.toLowerCase().includes(term)
  )
}

/**
 * Filtra usuarios por término de búsqueda
 */
export function filterUsers(users: User[], searchTerm: string): User[] {
  if (!searchTerm.trim()) return users
  
  const term = searchTerm.toLowerCase()
  return users.filter(user =>
    user.name.toLowerCase().includes(term) ||
    user.email.toLowerCase().includes(term)
  )
}

/**
 * Valida si una solicitud de empleado es válida
 */
export function validateEmployeeRequest(request: Partial<EmployeeRequest>): boolean {
  return !!(
    request.user_id &&
    request.user_name &&
    request.user_email &&
    request.business_id
  )
}

/**
 * Crea una nueva solicitud de empleado con valores por defecto
 */
export function createEmployeeRequest(
  userId: string,
  userName: string,
  userEmail: string,
  businessId: string,
  message?: string,
  userAvatar?: string
): EmployeeRequest {
  return {
    id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    user_id: userId,
    user_name: userName,
    user_email: userEmail,
    user_avatar: userAvatar,
    business_id: businessId,
    requested_at: new Date().toISOString(),
    message,
    status: 'pending'
  }
}

/**
 * Convierte una solicitud aprobada en un usuario empleado
 */
export function requestToUser(request: EmployeeRequest): User {
  return {
    id: request.user_id,
    name: request.user_name,
    email: request.user_email,
    avatar: request.user_avatar,
    created_at: new Date().toISOString(),
    status: 'active'
  }
}

/**
 * Obtiene estadísticas de solicitudes de empleados
 */
export function getRequestStats(requests: EmployeeRequest[]) {
  const pending = requests.filter(r => r.status === 'pending').length
  const approved = requests.filter(r => r.status === 'approved').length
  const rejected = requests.filter(r => r.status === 'rejected').length
  
  return {
    total: requests.length,
    pending,
    approved,
    rejected
  }
}

/**
 * Obtiene estadísticas de empleados
 */
export function getUserStats(users: User[]) {
  const active = users.filter(u => u.status === 'active').length
  const inactive = users.filter(u => u.status === 'inactive').length
  
  return {
    total: users.length,
    active,
    inactive
  }
}