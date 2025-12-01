import { AuthFormData } from './useAuthForm'

export interface AuthValidation {
  isValid: boolean
  errors: Partial<Record<keyof AuthFormData, string>>
}

export function validateAuthForm(
  data: AuthFormData, 
  isSignUpMode: boolean
): AuthValidation {
  const errors: Partial<Record<keyof AuthFormData, string>> = {}

  // Email validation
  if (!data.email) {
    errors.email = 'El email es requerido'
  } else if (!data.email.includes('@')) {
    errors.email = 'Email inválido'
  }

  // Password validation
  if (!data.password) {
    errors.password = 'La contraseña es requerida'
  } else if (data.password.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres'
  }

  // Name validation (only for sign up)
  if (isSignUpMode && !data.name) {
    errors.name = 'El nombre es requerido'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export function getAuthErrorMessage(error: any): string {
  if (typeof error === 'string') return error
  if (error?.message) return error.message
  
  // Common Supabase auth errors
  switch (error?.code) {
    case 'invalid_credentials':
      return 'Email o contraseña incorrectos'
    case 'email_not_confirmed':
      return 'Por favor confirma tu email antes de iniciar sesión'
    case 'user_already_exists':
      return 'Ya existe una cuenta con este email'
    case 'weak_password':
      return 'La contraseña es muy débil. Debe tener al menos 6 caracteres'
    default:
      return 'Error de autenticación. Por favor intenta de nuevo'
  }
}
