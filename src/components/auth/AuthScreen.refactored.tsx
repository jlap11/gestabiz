import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ServiceStatusBadge } from '@/components/ui/ServiceStatusBadge'
import { useAuth } from '@/hooks/useAuth'
import { useLanguage } from '@/contexts/LanguageContext'
import { AccountInactiveModal } from './AccountInactiveModal'
import { User } from '@/types'
import { APP_CONFIG } from '@/constants'
import logoGestabiz from '@/assets/images/logo_gestabiz.png'
import { toast } from 'sonner'
import { useAnalytics } from '@/hooks/useAnalytics'
import { AlertCircle } from 'lucide-react'
import { Flask, EnvelopeSimple, Warning, Eye, EyeClosed } from '@phosphor-icons/react'
import logoTiTuring from '@/assets/images/tt/1.png'

// ⭐ SHARED HOOKS - Platform-agnostic business logic
import {
  useAuthForm,
  usePasswordReset,
  useMagicLink,
  useInactiveAccount,
  useAuthRedirect,
  validateAuthForm,
  getAuthErrorMessage
} from '@shared/hooks/auth'

interface AuthScreenProps { 
  onLogin?: (user: User) => void
  onLoginSuccess?: () => void
}

export default function AuthScreen({ onLogin, onLoginSuccess }: Readonly<AuthScreenProps>) {
  // ==================== DEPENDENCIES ====================
  const { signIn, signUp, signInWithGoogle, signInWithMagicLink } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const analytics = useAnalytics()
  
  // ==================== SHARED BUSINESS LOGIC ====================
  // All state and logic is now in reusable hooks
  const authForm = useAuthForm({ 
    initialMode: 'signin',
    autoFillPasswordInDev: true 
  })
  
  const passwordReset = usePasswordReset()
  
  const magicLink = useMagicLink() // TODO: REMOVE BEFORE PRODUCTION
  
  const inactiveAccount = useInactiveAccount()
  
  const authRedirect = useAuthRedirect(
    {
      redirectUrl: searchParams.get('redirect'),
      serviceId: searchParams.get('serviceId'),
      locationId: searchParams.get('locationId'),
      employeeId: searchParams.get('employeeId')
    },
    (message) => toast.info(message, { duration: 5000 })
  )

  // ==================== AUTH HANDLERS ====================
  const handlePostLoginNavigation = (user: User) => {
    onLogin?.(user)

    if (onLoginSuccess) {
      setTimeout(() => onLoginSuccess(), 500)
    } else {
      authRedirect.handlePostLoginRedirect(navigate)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validation = validateAuthForm(authForm.formData, false)
    if (!validation.isValid) {
      authForm.setError(Object.values(validation.errors)[0] || 'Error de validación')
      return
    }
    
    authForm.setLoading(true)
    authForm.setError(null)
    
    try {
      const result = await Promise.race([
        signIn({ 
          email: authForm.formData.email, 
          password: authForm.formData.password 
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 12000))
      ])

      if (result.success && result.user) {
        analytics.trackLogin('email')
        
        if (result.user.accountInactive) {
          inactiveAccount.showInactiveAccountModal(result.user.email)
          return
        }
        
        handlePostLoginNavigation(result.user)
      } else if (result.error) {
        authForm.setError(getAuthErrorMessage(result.error))
      }
    } catch (error) {
      authForm.setError(getAuthErrorMessage(error))
    } finally {
      authForm.setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validation = validateAuthForm(authForm.formData, true)
    if (!validation.isValid) {
      authForm.setError(Object.values(validation.errors)[0] || 'Error de validación')
      return
    }
    
    authForm.setLoading(true)
    authForm.setError(null)
    
    try {
      const result = await Promise.race([
        signUp({ 
          email: authForm.formData.email, 
          password: authForm.formData.password,
          full_name: authForm.formData.name
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 12000))
      ])

      if (result.success && !result.needsEmailConfirmation) {
        analytics.trackSignup('email')
        
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess()
          } else {
            authRedirect.handlePostLoginRedirect(navigate)
          }
        }, 800)
      } else if (result.success && result.needsEmailConfirmation) {
        authForm.toggleMode()
        toast.info(t('auth.checkEmailVerification'))
      } else if (result.error) {
        authForm.setError(getAuthErrorMessage(result.error))
      }
    } catch (error) {
      authForm.setError(getAuthErrorMessage(error))
    } finally {
      authForm.setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    authForm.setLoading(true)
    try {
      const result = await signInWithGoogle()
      if (result?.success) {
        analytics.trackLogin('google')
      }
    } finally {
      authForm.setLoading(false)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await passwordReset.handlePasswordReset(async (email) => {
        const { error } = await import('@/lib/supabase').then(m => 
          m.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/reset-password`,
          })
        )
        if (error) throw error
        
        toast.success('¡Email enviado!', {
          description: `Revisa tu bandeja de entrada en ${email}. El enlace expira en 1 hora.`,
          duration: 6000
        })
      })
    } catch (error: any) {
      toast.error('Error al enviar email', {
        description: error.message || 'Por favor intenta nuevamente',
        duration: 5000
      })
    }
  }

  // TODO: REMOVE handleMagicLink BEFORE PRODUCTION
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    
    authForm.setLoading(true)
    try {
      await magicLink.handleMagicLinkSend(async (email) => {
        const result = await signInWithMagicLink(email)
        if (!result.success && result.error) {
          throw new Error(result.error)
        }
      })
      authForm.setError(null)
    } catch (error) {
      authForm.setError(getAuthErrorMessage(error))
    } finally {
      authForm.setLoading(false)
    }
  }

  const handleInactiveReactivate = () => {
    inactiveAccount.closeInactiveModal()
    setTimeout(() => globalThis.location.reload(), 1000)
  }

  const handleInactiveReject = () => {
    inactiveAccount.closeInactiveModal()
    navigate('/', { replace: true })
  }

  // ==================== RENDER PASSWORD RESET SCREEN ====================
  if (passwordReset.showResetForm) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">{t('auth.resetPassword')}</h2>
            <p className="text-muted-foreground text-sm">{t('auth.enterEmailFirst')}</p>
          </div>
          <form onSubmit={handlePasswordReset} className="space-y-6">
            <div>
              <Input
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                value={passwordReset.resetEmail}
                onChange={(e) => passwordReset.setResetEmail(e.target.value)}
                className="w-full bg-background border-0 text-foreground placeholder:text-muted-foreground h-12 rounded-lg px-4"
                required
                disabled={passwordReset.isResettingPassword}
                autoFocus
              />
            </div>
            <Button 
              type="submit"
              disabled={passwordReset.isResettingPassword || !passwordReset.resetEmail}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12 rounded-lg transition-colors"
            >
              {passwordReset.isResettingPassword ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </Button>
            <Button 
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground"
              onClick={passwordReset.closeResetForm}
              disabled={passwordReset.isResettingPassword}
            >
              {t('common.actions.back')}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  // ==================== RENDER MAIN AUTH SCREEN ====================
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative gradient blurs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src={logoGestabiz} 
              alt="Gestabiz Logo" 
              className="w-20 h-20 rounded-2xl object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {APP_CONFIG.NAME}
          </h1>
          <p className="text-muted-foreground text-sm mb-4">
            {authForm.isSignUpMode 
              ? t('auth.signUpDescription')
              : t('auth.signInDescription')
            }
          </p>
          
          <div className="flex justify-center mb-4">
            <ServiceStatusBadge variant="minimal" />
          </div>
        </div>

        {/* Login/SignUp Card */}
        <div className="bg-card rounded-2xl shadow-2xl backdrop-blur-xl border border-border overflow-hidden">
          <div className="px-8 pt-8 pb-8">
            {/* Error Banner */}
            {authForm.formError && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">
                    {authForm.formError}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => authForm.setError(null)}
                  className="text-destructive/60 hover:text-destructive transition-colors text-lg font-semibold"
                  aria-label={t('common.actions.close')}
                >
                  ×
                </button>
              </div>
            )}

            <form onSubmit={authForm.isSignUpMode ? handleSignUp : handleSignIn} className="space-y-6">
              {/* Name Input (only for Sign Up) */}
              {authForm.isSignUpMode && (
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder={t('auth.namePlaceholder')}
                    value={authForm.formData.name}
                    onChange={(e) => authForm.handleInputChange('name', e.target.value)}
                    className="w-full bg-background border-0 text-foreground placeholder:text-muted-foreground h-12 rounded-lg px-4 focus-visible:ring-2 focus-visible:ring-primary"
                    required
                  />
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder={t('auth.emailPlaceholder')}
                  value={authForm.formData.email}
                  onChange={(e) => authForm.handleInputChange('email', e.target.value)}
                  className="w-full bg-background border-0 text-foreground placeholder:text-muted-foreground h-12 rounded-lg px-4 focus-visible:ring-2 focus-visible:ring-primary"
                  required
                />
              </div>

              {/* Password Input with Toggle */}
              <div className="space-y-2 relative">
                <Input
                  type={authForm.showPassword ? 'text' : 'password'}
                  placeholder={t('auth.passwordPlaceholder')}
                  value={authForm.formData.password}
                  onChange={(e) => authForm.handleInputChange('password', e.target.value)}
                  className="w-full bg-background border-0 text-foreground placeholder:text-muted-foreground h-12 rounded-lg px-4 pr-12 focus-visible:ring-2 focus-visible:ring-primary"
                  required={!import.meta.env.DEV}
                />
                <button
                  type="button"
                  onClick={authForm.togglePasswordVisibility}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {authForm.showPassword ? <EyeClosed size={20} /> : <Eye size={20} />}
                </button>
                {import.meta.env.DEV && !authForm.formData.password && (
                  <p className="text-xs text-yellow-500 flex items-center gap-1">
                    <Warning size={12} />
                    DEV: Contraseña auto-completada
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              {!authForm.isSignUpMode && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="remember-me"
                      checked={authForm.rememberMe}
                      onCheckedChange={authForm.toggleRememberMe}
                    />
                    <label 
                      htmlFor="remember-me" 
                      className="text-sm text-muted-foreground cursor-pointer select-none"
                    >
                      {t('auth.rememberMe')}
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={passwordReset.openResetForm}
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit"
                disabled={authForm.isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12 rounded-lg transition-colors"
              >
                {authForm.isLoading 
                  ? t('common.states.loading')
                  : authForm.isSignUpMode 
                    ? t('auth.signUp') 
                    : t('auth.signIn')
                }
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">
                  O continuar con
                </span>
              </div>
            </div>

            {/* Google Sign In */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={authForm.isLoading}
              className="w-full h-12 rounded-lg border-border hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Google</span>
              </div>
            </Button>

            {/* Magic Link (DEV ONLY) */}
            {import.meta.env.DEV && (
              <>
                <div className="flex items-center gap-2 mt-6 text-yellow-500 text-xs">
                  <Flask size={14} weight="fill" />
                  <span className="font-medium">DEV ONLY - Magic Link</span>
                </div>
                <form onSubmit={handleMagicLink} className="mt-3 space-y-3">
                  <div className="flex items-center gap-1 text-xs text-yellow-500/80">
                    <Warning size={12} />
                    <span>Disponible solo en navegadores DevTools</span>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="Email para Magic Link"
                      value={magicLink.magicLinkEmail}
                      onChange={(e) => magicLink.setMagicLinkEmail(e.target.value)}
                      className="flex-1 bg-background border-0 text-foreground h-10 rounded-lg px-3 text-sm"
                      disabled={authForm.isLoading}
                    />
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={authForm.isLoading || !magicLink.magicLinkEmail}
                      className="h-10 px-4 rounded-lg"
                    >
                      <EnvelopeSimple size={16} weight="fill" />
                    </Button>
                  </div>
                </form>
              </>
            )}

            {/* Toggle Sign Up/Sign In */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={authForm.toggleMode}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {authForm.isSignUpMode 
                  ? t('auth.alreadyHaveAccount')
                  : t('auth.dontHaveAccount')
                }
                {' '}
                <span className="text-primary font-semibold">
                  {authForm.isSignUpMode ? t('auth.signIn') : t('auth.signUp')}
                </span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-accent/50 text-center border-t border-border">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xs text-muted-foreground">Desarrollado por</span>
              <img 
                src={logoTiTuring} 
                alt="TI Turing" 
                className="h-4 object-contain"
              />
            </div>
            <p className="text-xs text-muted-foreground/60">
              v{APP_CONFIG.VERSION}
            </p>
          </div>
        </div>
      </div>

      {/* Inactive Account Modal */}
      <AccountInactiveModal
        isOpen={inactiveAccount.showInactiveModal}
        email={inactiveAccount.inactiveEmail}
        onReactivate={handleInactiveReactivate}
        onReject={handleInactiveReject}
      />
    </div>
  )
}
