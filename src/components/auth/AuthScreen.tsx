import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ServiceStatusBadge } from '@/components/ui/ServiceStatusBadge'
import { useAuth } from '@/hooks/useAuth'
import { User } from '@/types'
import { APP_CONFIG } from '@/constants'
import logoBookio from '@/assets/images/logo_bookio.png'

interface AuthScreenProps { 
  onLogin?: (user: User) => void 
}

export default function AuthScreen({ onLogin }: Readonly<AuthScreenProps>) {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  
  const [isSigningIn, setIsSigningIn] = useState(false)
  const [isGoogleAuth, setIsGoogleAuth] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [showResetForm, setShowResetForm] = useState(false)
  const [isSignUpMode, setIsSignUpMode] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.password) {
      return
    }
    setIsSigningIn(true)
    try {
      const result = await Promise.race([
        signIn({ email: formData.email, password: formData.password }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 12000))
      ])

      if (result.success && result.user) {
        onLogin?.(result.user)
      }
    } catch {
      // Error/timeout
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.password || !formData.name) {
      return
    }
    setIsSigningIn(true)
    try {
      const result = await Promise.race([
        signUp({ 
          email: formData.email, 
          password: formData.password,
          full_name: formData.name
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 12000))
      ])

      if (result.success && !result.needsEmailConfirmation) {
        // Registration successful and auto-logged in, switch to login mode
        setIsSignUpMode(false)
        setFormData({ email: '', password: '', name: '' })
      } else if (result.success && result.needsEmailConfirmation) {
        // Show message that they need to confirm email
        setIsSignUpMode(false)
      }
    } catch {
      // Error/timeout
    } finally {
      setIsSigningIn(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleAuth(true)
    try {
      await signInWithGoogle()
    } finally {
      setIsGoogleAuth(false)
    }
  }

  if (showResetForm) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Reset Password</h2>
            <p className="text-muted-foreground text-sm">Enter your email to reset your password</p>
          </div>
          <form className="space-y-6">
            <div>
              <Input
                type="email"
                placeholder="Email address"
                className="w-full bg-background border-0 text-foreground placeholder:text-muted-foreground h-12 rounded-lg px-4"
                required
              />
            </div>
            <Button 
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12 rounded-lg transition-colors"
            >
              Send reset link
            </Button>
            <Button 
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground"
              onClick={() => setShowResetForm(false)}
            >
              Back to login
            </Button>
          </form>
        </div>
      </div>
    )
  }

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
              src={logoBookio} 
              alt="Bookio Logo" 
              className="w-20 h-20 rounded-2xl object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {APP_CONFIG.NAME}
          </h1>
          <p className="text-muted-foreground text-sm mb-4">
            {isSignUpMode 
              ? 'Create your account to get started' 
              : 'Welcome back! Please enter your details.'
            }
          </p>
          
          {/* Service Status Badge */}
          <div className="flex justify-center mb-4">
            <ServiceStatusBadge variant="minimal" />
          </div>
        </div>

        {/* Login/SignUp Card */}
        <div className="bg-card rounded-2xl p-8 shadow-2xl backdrop-blur-xl border border-border">
          <form onSubmit={isSignUpMode ? handleSignUp : handleSignIn} className="space-y-6">
            {/* Name Input (only for Sign Up) */}
            {isSignUpMode && (
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full bg-background border-0 text-foreground placeholder:text-muted-foreground h-12 rounded-lg px-4 focus-visible:ring-2 focus-visible:ring-primary"
                  required
                />
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email address"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full bg-background border-0 text-foreground placeholder:text-muted-foreground h-12 rounded-lg px-4 focus-visible:ring-2 focus-visible:ring-primary"
                required
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full bg-background border-0 text-foreground placeholder:text-muted-foreground h-12 rounded-lg px-4 focus-visible:ring-2 focus-visible:ring-primary"
                required
              />
            </div>

            {/* Remember me & Forgot password (only for Login) */}
            {!isSignUpMode && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label htmlFor="remember" className="text-muted-foreground cursor-pointer">
                    Remember me
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetForm(true)}
                  className="text-primary hover:text-primary/80 transition-colors cursor-pointer"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit"
              disabled={isSigningIn}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {(() => {
                if (isSigningIn) {
                  return isSignUpMode ? 'Creating account...' : 'Signing in...'
                }
                return isSignUpMode ? 'Create account' : 'Login'
              })()}
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isGoogleAuth}
              className="w-full bg-background border-border hover:bg-muted text-foreground h-12 rounded-lg transition-colors"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
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
              Continue with Google
            </Button>
          </form>

          {/* Sign up/Login toggle link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">
              {isSignUpMode ? 'Already have an account? ' : "Don't have an account? "}
            </span>
            <button 
              type="button"
              onClick={() => {
                setIsSignUpMode(!isSignUpMode)
                setFormData({ email: '', password: '', name: '' })
              }}
              className="text-primary hover:text-primary/80 font-medium transition-colors cursor-pointer"
            >
              {isSignUpMode ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
