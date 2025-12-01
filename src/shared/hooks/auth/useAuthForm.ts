import { useState, useEffect } from 'react'

export interface AuthFormData {
  email: string
  password: string
  name: string
}

export interface AuthFormState {
  formData: AuthFormData
  isSignUpMode: boolean
  rememberMe: boolean
  showPassword: boolean
  formError: string | null
  isLoading: boolean
}

export interface AuthFormActions {
  handleInputChange: (field: keyof AuthFormData, value: string) => void
  toggleMode: () => void
  toggleRememberMe: () => void
  togglePasswordVisibility: () => void
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
  resetForm: () => void
}

interface UseAuthFormOptions {
  initialMode?: 'signin' | 'signup'
  autoFillPasswordInDev?: boolean
}

export function useAuthForm(options: UseAuthFormOptions = {}): AuthFormState & AuthFormActions {
  const { initialMode = 'signin', autoFillPasswordInDev = true } = options

  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    name: ''
  })
  const [isSignUpMode, setIsSignUpMode] = useState(initialMode === 'signup')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // DEV MODE: Auto-fill password when email is entered
  useEffect(() => {
    if (autoFillPasswordInDev && import.meta.env?.DEV && formData.email && !formData.password) {
      const timer = setTimeout(() => {
        setFormData(prev => ({ ...prev, password: 'TestPassword123!' }))
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [formData.email, formData.password, autoFillPasswordInDev])

  const handleInputChange = (field: keyof AuthFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (formError) setFormError(null)
  }

  const toggleMode = () => {
    setIsSignUpMode(prev => !prev)
    setFormError(null)
  }

  const toggleRememberMe = () => {
    setRememberMe(prev => !prev)
  }

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev)
  }

  const resetForm = () => {
    setFormData({ email: '', password: '', name: '' })
    setFormError(null)
    setIsLoading(false)
    setShowPassword(false)
  }

  return {
    // State
    formData,
    isSignUpMode,
    rememberMe,
    showPassword,
    formError,
    isLoading,
    // Actions
    handleInputChange,
    toggleMode,
    toggleRememberMe,
    togglePasswordVisibility,
    setError: setFormError,
    setLoading,
    resetForm
  }
}
