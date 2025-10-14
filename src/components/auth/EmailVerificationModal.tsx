import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Mail, RefreshCw, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface EmailVerificationModalProps {
  email: string
  onVerified: () => void
}

export function EmailVerificationModal({ email, onVerified }: Readonly<EmailVerificationModalProps>) {
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
        toast.error('Error al reenviar el correo: ' + error.message)
      } else {
        setResentCount(prev => prev + 1)
        toast.success('Correo de verificación reenviado')
      }
    } catch {
      toast.error('Error inesperado al reenviar el correo')
    } finally {
      setIsResending(false)
    }
  }

  const handleCheckVerification = async () => {
    setIsChecking(true)
    try {
      // Refresh the session to get updated user data
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        toast.error('Error al verificar: ' + error.message)
      } else if (user?.email_confirmed_at) {
        toast.success('¡Email verificado exitosamente!')
        onVerified()
      } else {
        toast.warning('El email aún no ha sido verificado. Por favor revisa tu bandeja de entrada.')
      }
    } catch {
      toast.error('Error al verificar el estado del email')
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
            Verifica tu correo electrónico
          </h2>

          {/* Description */}
          <p className="text-center text-muted-foreground mb-6">
            Hemos enviado un correo de verificación a:
          </p>

          {/* Email */}
          <div className="bg-muted rounded-lg p-3 mb-6">
            <p className="text-center font-medium text-foreground break-all">
              {email}
            </p>
          </div>

          {/* Instructions */}
          <div className="space-y-3 mb-6 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">1.</span>
              <p>Revisa tu bandeja de entrada (y spam)</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">2.</span>
              <p>Haz clic en el enlace de verificación</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">3.</span>
              <p>Regresa aquí y haz clic en "Ya verifiqué mi email"</p>
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
                  Verificando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Ya verifiqué mi email
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
                  Reenviando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {resentCount > 0 ? `Reenviar correo (${resentCount}/3)` : 'Reenviar correo'}
                </>
              )}
            </Button>
          </div>

          {/* Help text */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            ¿No recibiste el correo? Verifica tu carpeta de spam o reenvía el correo.
          </p>
        </div>
      </div>
    </div>
  )
}
