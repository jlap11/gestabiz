import { useState, useEffect } from 'react'

interface AuthFormData {
  email: string
  password: string
  name: string
}

interface UseAuthFormOptions {
  isSignUpMode: boolean
  onSubmit: (data: AuthFormData) => Promise<void>
  isDev?: boolean
}

export function useAuthForm({ isSignUpMode, onSubmit, isDev = false }: UseAuthFormOptions) {
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    name: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // DEV MODE: Auto-fill password when email is entered
  useEffect(() => {
    if (isDev && formData.email && !formData.password) {
      const timer = setTimeout(() => {
        setFormData(prev => ({ ...prev, password: 'TestPassword123!' }))
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [formData.email, formData.password, isDev])

  const handleInputChange = (field: keyof AuthFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (error) setError(null)
  }

  const validateForm = (): string | null => {
    if (!formData.email) {
      return 'Email es requerido'
    }
    if (!formData.email.includes('@')) {
      return 'Email inválido'
    }
    if (!formData.password) {
      return 'Contraseña es requerida'
    }
    if (formData.password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres'
    }
    if (isSignUpMode && !formData.name) {
      return 'Nombre es requerido'
    }
    return null
  }

  const handleSubmit = async () => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev)
  }

  const resetForm = () => {
    setFormData({ email: '', password: '', name: '' })
    setError(null)
    setIsLoading(false)
    setShowPassword(false)
  }

  return {
    formData,
    isLoading,
    error,
    rememberMe,
    showPassword,
    handleInputChange,
    handleSubmit,
    togglePasswordVisibility,
    setRememberMe,
    resetForm
  }
}
