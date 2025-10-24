import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Mail, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/LanguageContext'

interface EmailVerificationModalProps {
  email: string
  onVerified: () => void
}

export function EmailVerificationModal({
  email,
  onVerified,
}: Readonly<EmailVerificationModalProps>) {
  const { t } = useLanguage()
  const [isResending, setIsResending] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [resentCount, setResentCount] = useState(0)

  const handleResendEmail = async () => {
    setIsResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (error) {
        toast.error(t('emailVerification.resendError') + ' ' + error.message)
      } else {
        setResentCount(prev => prev + 1)
        toast.success(t('emailVerification.resendSuccess'))
      }
    } catch {
      toast.error(t('emailVerification.unexpectedError'))
    } finally {
      setIsResending(false)
    }
  }

  const handleCheckVerification = async () => {
    setIsChecking(true)
    try {
      // Refresh the session to get updated user data
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        toast.error(t('emailVerification.checkError') + ' ' + error.message)
      } else if (user?.email_confirmed_at) {
        toast.success(t('emailVerification.verifySuccess'))
        onVerified()
      } else {
        toast.warning(t('emailVerification.notVerified'))
      }
    } catch {
      toast.error(t('emailVerification.verifyUnexpectedError'))
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop difuminado */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-card rounded-2xl p-8 shadow-2xl border border-border">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-10 h-10 text-primary" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center text-foreground mb-2">
            {t('emailVerification.title')}
          </h2>

          {/* Description */}
          <p className="text-center text-muted-foreground mb-6">
            {t('emailVerification.description')}
          </p>

          {/* Email */}
          <div className="bg-muted rounded-lg p-3 mb-6">
            <p className="text-center font-medium text-foreground break-all">{email}</p>
          </div>

          {/* Instructions */}
          <div className="space-y-3 mb-6 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">1.</span>
              <p>{t('emailVerification.step1')}</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">2.</span>
              <p>{t('emailVerification.step2')}</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">3.</span>
              <p>{t('emailVerification.step3')}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleCheckVerification}
              disabled={isChecking}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 rounded-lg font-semibold"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {t('emailVerification.verifying')}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {t('emailVerification.verified')}
                </>
              )}
            </Button>

            <Button
              onClick={handleResendEmail}
              disabled={isResending || resentCount >= 3}
              variant="outline"
              className="w-full border-border hover:bg-muted h-12 rounded-lg"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {t('emailVerification.resending')}
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {resentCount > 0
                    ? `${t('emailVerification.resend')} (${resentCount}/3)`
                    : t('emailVerification.resend')}
                </>
              )}
            </Button>
          </div>

          {/* Help text */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            {t('emailVerification.helpText')}
          </p>
        </div>
      </div>
    </div>
  )
}
