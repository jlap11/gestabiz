import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ServiceStatusBadge } from '@/components/ui/ServiceStatusBadge'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { AccountInactiveModal } from './AccountInactiveModal'
import { User } from '@/types'
import { APP_CONFIG } from '@/constants'
import logoGestabiz from '@/assets/images/logo_gestabiz.png'
import { toast } from 'sonner'
import { useAnalytics } from '@/hooks/useAnalytics'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'

interface AuthScreenProps {
  onLogin?: (user: User) => void
  onLoginSuccess?: () => void
}

export default function AuthScreen({ onLogin, onLoginSuccess }: Readonly<AuthScreenProps>) {
  const { signIn, signUp, signInWithGoogle, user, loading } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const analytics = useAnalytics()

  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isGoogleAuth, setIsGoogleAuth] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [showResetForm, setShowResetForm] = useState(false)
  const [isSignUpMode, setIsSignUpMode] = useState(false)
  const [showInactiveModal, setShowInactiveModal] = useState(false)
  const [inactiveEmail, setInactiveEmail] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  })

  // Extract redirect params from URL
  const redirectUrl = searchParams.get('redirect')
  const serviceId = searchParams.get('serviceId')
  const locationId = searchParams.get('locationId')
  const employeeId = searchParams.get('employeeId')

  // Redirect to app if user is already authenticated (OAuth callback handling)
  useEffect(() => {
    if (!loading && user) {
      console.log('✅ Usuario autenticado detectado, redirigiendo a /app')
      
      // Check if there's a redirect URL from booking flow
      if (redirectUrl) {
        const params = new URLSearchParams()
        if (serviceId) params.set('serviceId', serviceId)
        if (locationId) params.set('locationId', locationId)
        if (employeeId) params.set('employeeId', employeeId)
        
        const queryString = params.toString()
        const targetUrl = queryString ? `${redirectUrl}?${queryString}` : redirectUrl
        
        navigate(targetUrl, { replace: true })
      } else {
        navigate('/app', { replace: true })
      }
    }
  }, [user, loading, navigate, redirectUrl, serviceId, locationId, employeeId])

  // Show toast if user was redirected from booking attempt
  useEffect(() => {
    if (redirectUrl) {
      toast.info(t('auth.continueBooking'), {
        duration: 5000,
      })
    }
  }, [redirectUrl, t])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePostLoginNavigation = (user: User) => {
    // Call original onLogin callback if provided
    onLogin?.(user)

    // Use onLoginSuccess callback if provided, otherwise use navigate
    if (onLoginSuccess) {
      // Small delay to ensure session is fully established
      setTimeout(() => {
        onLoginSuccess()
      }, 500)
    } else if (redirectUrl) {
      // Build query params for preselection if available
      const params = new URLSearchParams()
      if (serviceId) params.set('serviceId', serviceId)
      if (locationId) params.set('locationId', locationId)
      if (employeeId) params.set('employeeId', employeeId)

      const queryString = params.toString()
      const targetUrl = queryString ? `${redirectUrl}?${queryString}` : redirectUrl

      // Small delay to ensure session is fully established
      setTimeout(() => {
        navigate(targetUrl, { replace: true })
      }, 500)
    } else {
      // Default navigation to app
      setTimeout(() => {
        navigate('/app', { replace: true })
      }, 500)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.password) {
      setFormError(t('common.messages.requiredFields'))
      return
    }
    setFormError(null)
    setIsSigningIn(true)
    try {
      const result = await Promise.race([
        signIn({ email: formData.email, password: formData.password }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 12000)),
      ])

      if (result.success && result.user) {
        // Track successful login
        analytics.trackLogin('email')

        // Check if account is inactive
        if (result.user.accountInactive) {
          setInactiveEmail(result.user.email)
          setShowInactiveModal(true)
          return
        }

        handlePostLoginNavigation(result.user)
      } else if (result.error) {
        setFormError(result.error)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t('auth.loginError')
      setFormError(errorMsg)
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.password || !formData.name) {
      setFormError(t('common.messages.requiredFields'))
      return
    }
    setFormError(null)
    setIsSigningIn(true)
    try {
      const result = await Promise.race([
        signUp({
          email: formData.email,
          password: formData.password,
          full_name: formData.name,
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 12000)),
      ])

      if (result.success && !result.needsEmailConfirmation) {
        // Track successful signup
        analytics.trackSignup('email')

        // Registration successful and auto-logged in
        // Note: signUp updates auth state, so we navigate after a small delay
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess()
          } else if (redirectUrl) {
            const params = new URLSearchParams()
            if (serviceId) params.set('serviceId', serviceId)
            if (locationId) params.set('locationId', locationId)
            if (employeeId) params.set('employeeId', employeeId)

            const queryString = params.toString()
            const targetUrl = queryString ? `${redirectUrl}?${queryString}` : redirectUrl
            navigate(targetUrl, { replace: true })
          } else {
            navigate('/app', { replace: true })
          }
        }, 800)
      } else if (result.success && result.needsEmailConfirmation) {
        // Show message that they need to confirm email
        setIsSignUpMode(false)
        toast.info(t('auth.checkEmailVerification'))
      } else if (result.error) {
        setFormError(result.error)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : t('auth.registrationError')
      setFormError(errorMsg)
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleAuth(true)
    setFormError(null)
    
    try {
      console.log('🔐 Iniciando autenticación con Google...')
      
      const result = await signInWithGoogle()
      
      console.log('📊 Resultado de Google Auth:', result)
      
      if (result?.success) {
        console.log('✅ Google Auth exitoso')
        // Track Google auth (could be login or signup)
        analytics.trackLogin('google')
        toast.success(t('auth.googleAuthInitiated') || 'Redirigiendo a Google...')
      } else if (result?.error) {
        console.error('❌ Error en Google Auth:', result.error)
        setFormError(result.error)
        toast.error(result.error)
      }
    } catch (error) {
      console.error('💥 Excepción en Google Auth:', error)
      const errorMsg = error instanceof Error ? error.message : t('auth.googleAuthError') || 'Error al iniciar sesión con Google'
      setFormError(errorMsg)
      toast.error(errorMsg)
    } finally {
      // Keep loading state for a bit longer for OAuth redirect
      setTimeout(() => {
        setIsGoogleAuth(false)
      }, 1000)
    }
  }

  const handleInactiveReactivate = () => {
    // Modal ya reactivó la cuenta
    setShowInactiveModal(false)
    // Esperar un momento y hacer refresh para que useAuthSimple detecte is_active=true
    setTimeout(() => {
      globalThis.location.reload()
    }, 1000)
  }

  const handleInactiveReject = () => {
    setShowInactiveModal(false)
    navigate('/', { replace: true })
  }

  // Show loading spinner during OAuth callback processing
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 sm:p-6">
        <div className="text-center space-y-6 max-w-sm mx-auto" role="status" aria-live="polite">
          <div 
            className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"
            aria-hidden="true"
          ></div>
          <div className="space-y-3">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{APP_CONFIG.NAME}</h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {t('auth.processingAuthentication') || 'Procesando autenticación...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (showResetForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-card rounded-3xl p-6 sm:p-8 shadow-2xl border border-border/50 backdrop-blur-sm">
          <header className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img
                src={logoGestabiz}
                alt={`${APP_CONFIG.NAME} Logo`}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-contain"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">{t('auth.resetPassword')}</h1>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">{t('auth.enterEmailFirst')}</p>
          </header>
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label htmlFor="reset-email" className="sr-only">
                {t('auth.emailPlaceholder')}
              </label>
              <Input
                id="reset-email"
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                className="w-full bg-background/50 border border-border/50 text-foreground placeholder:text-muted-foreground h-12 sm:h-14 rounded-xl px-4 text-base focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all"
                required
                aria-describedby="reset-email-description"
              />
              <p id="reset-email-description" className="sr-only">
                Ingresa tu email para recibir instrucciones de restablecimiento de contraseña
              </p>
            </div>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 focus:bg-primary/90 text-primary-foreground font-semibold h-12 sm:h-14 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] text-base"
            >
              {t('auth.passwordResetSent')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground focus:text-foreground h-12 sm:h-14 rounded-xl transition-all text-base"
              onClick={() => setShowResetForm(false)}
            >
              {t('common.actions.back')}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <main 
      className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden"
      role="main"
      aria-labelledby="auth-page-title"
    >
      {/* Enhanced decorative gradient blurs */}
      <div className="absolute top-0 left-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" aria-hidden="true"></div>
      <div className="absolute bottom-0 right-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" aria-hidden="true"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 sm:w-[32rem] sm:h-[32rem] bg-primary/5 rounded-full blur-3xl" aria-hidden="true"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Title */}
        <header className="text-center mb-8 sm:mb-10">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img
                src={logoGestabiz}
                alt={`${APP_CONFIG.NAME} Logo`}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-contain shadow-lg"
              />
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 to-transparent"></div>
            </div>
          </div>
          <h1 id="auth-page-title" className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3 tracking-tight">{APP_CONFIG.NAME}</h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg mb-6 leading-relaxed max-w-sm mx-auto">
            {isSignUpMode ? t('auth.signUpDescription') : t('auth.signInDescription')}
          </p>

          {/* Service Status Badge */}
          <div className="flex justify-center mb-6">
            <ServiceStatusBadge variant="minimal" />
          </div>
        </header>
        
        {/* Login/SignUp Card */}
        <section 
          className="bg-card/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-border/50 overflow-hidden"
          aria-labelledby="auth-form-title"
        >
          <div className="px-6 sm:px-8 py-8 sm:py-10">
            <h2 id="auth-form-title" className="sr-only">
              {isSignUpMode ? 'Formulario de registro' : 'Formulario de inicio de sesión'}
            </h2>
            
            {/* Error Banner */}
            {formError && (
              <div 
                className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive leading-relaxed">{formError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormError(null)}
                  className="text-destructive/60 hover:text-destructive focus:text-destructive transition-colors text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-destructive/20 rounded-lg p-1 touch-manipulation"
                  aria-label={t('common.actions.close') || 'Cerrar mensaje de error'}
                >
                  ×
                </button>
              </div>
            )}

            <form onSubmit={isSignUpMode ? handleSignUp : handleSignIn} className="space-y-6">
              {/* Name Input (only for Sign Up) */}
              {isSignUpMode && (
                <div className="space-y-2">
                  <label htmlFor="name-input" className="text-sm font-medium text-foreground">
                    {t('auth.namePlaceholder')}
                  </label>
                  <Input
                    id="name-input"
                    type="text"
                    placeholder={t('auth.namePlaceholder')}
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    className="w-full bg-background/50 border border-border/50 text-foreground placeholder:text-muted-foreground h-12 sm:h-14 rounded-xl px-4 text-base focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all"
                    required
                    aria-describedby="name-description"
                  />
                  <p id="name-description" className="sr-only">
                    Ingresa tu nombre completo para crear tu cuenta
                  </p>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email-input" className="text-sm font-medium text-foreground">
                  {t('auth.emailPlaceholder')}
                </label>
                <Input
                  id="email-input"
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  className="w-full bg-background/50 border border-border/50 text-foreground placeholder:text-muted-foreground h-12 sm:h-14 rounded-xl px-4 text-base focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all"
                  required
                  aria-describedby="email-description"
                />
                <p id="email-description" className="sr-only">
                  {isSignUpMode ? 'Ingresa tu dirección de email para crear tu cuenta' : 'Ingresa tu email registrado'}
                </p>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password-input" className="text-sm font-medium text-foreground">
                  {t('auth.passwordPlaceholder')}
                </label>
                <div className="relative">
                  <Input
                    id="password-input"
                    type={showPassword ? "text" : "password"}
                    placeholder={t('auth.passwordPlaceholder')}
                    value={formData.password}
                    onChange={e => handleInputChange('password', e.target.value)}
                    className="w-full bg-background/50 border border-border/50 text-foreground placeholder:text-muted-foreground h-12 sm:h-14 rounded-xl px-4 pr-12 text-base focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all"
                    required
                    aria-describedby="password-description"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground focus:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg p-1 touch-manipulation"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <p id="password-description" className="sr-only">
                  {isSignUpMode ? 'Crea una contraseña segura para tu cuenta' : 'Ingresa tu contraseña'}
                </p>
              </div>

              {/* Remember me & Forgot password (only for Login) */}
              {!isSignUpMode && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={checked => setRememberMe(checked as boolean)}
                      className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary w-5 h-5"
                    />
                    <label htmlFor="remember" className="text-muted-foreground cursor-pointer select-none">
                      {t('auth.rememberMe') || 'Remember me'}
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowResetForm(true)}
                    className="text-primary hover:text-primary/80 focus:text-primary/80 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg px-2 py-1 touch-manipulation text-left sm:text-right"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSigningIn}
                className="w-full bg-primary hover:bg-primary/90 focus:bg-primary/90 text-primary-foreground font-semibold h-12 sm:h-14 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/20 text-base touch-manipulation"
                aria-describedby="submit-button-description"
              >
                {(() => {
                  if (isSigningIn) {
                    return (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                        {isSignUpMode ? t('auth.creatingAccount') : t('auth.signingIn')}
                      </div>
                    )
                  }
                  return isSignUpMode ? t('auth.signUp') : t('auth.signIn')
                })()}
              </Button>
              <p id="submit-button-description" className="sr-only">
                {isSignUpMode ? 'Crear nueva cuenta con los datos ingresados' : 'Iniciar sesión con las credenciales ingresadas'}
              </p>

              {/* Divider */}
              <div className="relative my-6" role="separator" aria-label="O continúa con">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-card text-muted-foreground font-medium">
                    {t('auth.orContinueWith')}
                  </span>
                </div>
              </div>

              {/* Google Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isGoogleAuth}
                className="w-full bg-background/50 border border-border/50 hover:bg-muted/50 focus:bg-muted/50 text-foreground h-12 sm:h-14 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 text-base touch-manipulation"
                aria-describedby="google-button-description"
              >
                {isGoogleAuth ? (
                  <div className="flex items-center justify-center gap-2">
                    <div 
                      className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" 
                      aria-hidden="true"
                    />
                    <span>{t('auth.redirectingToGoogle') || 'Redirigiendo a Google...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>{t('auth.continueWithGoogle')}</span>
                  </div>
                )}
              </Button>
              <p id="google-button-description" className="sr-only">
                {isSignUpMode ? 'Crear cuenta usando tu cuenta de Google' : 'Iniciar sesión usando tu cuenta de Google'}
              </p>
            </form>

            {/* Sign up/Login toggle link */}
            <div className="mt-6 sm:mt-8 text-center text-sm">
              <span className="text-muted-foreground">
                {isSignUpMode ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}
              </span>{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUpMode(!isSignUpMode)
                  setFormData({ email: '', password: '', name: '' })
                  setFormError(null)
                  setShowPassword(false)
                }}
                className="text-primary hover:text-primary/80 focus:text-primary/80 font-semibold transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-lg px-2 py-1 touch-manipulation"
                aria-describedby="toggle-mode-description"
              >
                {isSignUpMode ? t('auth.signInHere') : t('auth.signUpHere')}
              </button>
              <p id="toggle-mode-description" className="sr-only">
                {isSignUpMode ? 'Cambiar a formulario de inicio de sesión' : 'Cambiar a formulario de registro'}
              </p>
            </div>
          </div>
        </section>
        
        {/* Account Inactive Modal */}
        <AccountInactiveModal
          isOpen={showInactiveModal}
          email={inactiveEmail}
          onClose={() => setShowInactiveModal(false)}
          onReactivate={handleInactiveReactivate}
          onReject={handleInactiveReject}
        />
      </div>
    </main>
  )
}