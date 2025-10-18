import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { AlertCircle } from 'lucide-react'

interface AccountInactiveModalProps {
  isOpen: boolean
  email: string
  onClose: () => void
  onReactivate: () => void
  onReject: () => void
}

export function AccountInactiveModal({
  isOpen,
  email,
  onClose,
  onReactivate,
  onReject,
}: AccountInactiveModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleReactivate = async () => {
    setIsLoading(true)
    try {
      // Reactivate account in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: true, deactivated_at: null })
        .eq('id', (await supabase.auth.getUser()).data.user?.id)

      if (error) {
        toast.error('Error al reactivar la cuenta')
        return
      }

      toast.success('Cuenta reactivada exitosamente')
      onReactivate()
    } catch {
      toast.error('Error inesperado al reactivar la cuenta')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async () => {
    // Logout
    await supabase.auth.signOut()
    onReject()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-2xl p-8 shadow-2xl max-w-md w-full border border-border">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-destructive/10 rounded-full p-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground text-center mb-2">
          Cuenta Inactiva
        </h2>

        {/* Message */}
        <p className="text-muted-foreground text-center mb-6">
          Tu cuenta ({email}) ha sido desactivada. ¿Deseas reactivarla ahora?
        </p>

        {/* Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleReactivate}
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12 rounded-lg transition-all"
          >
            {isLoading ? 'Reactivando...' : 'Sí, reactivar'}
          </Button>
          
          <Button
            onClick={handleReject}
            disabled={isLoading}
            variant="outline"
            className="w-full bg-background border-border hover:bg-muted text-foreground font-semibold h-12 rounded-lg transition-all"
          >
            No, cerrar sesión
          </Button>
        </div>

        {/* Info text */}
        <p className="text-xs text-muted-foreground text-center mt-4">
          Si reactivas tu cuenta podrás acceder inmediatamente.
        </p>
      </div>
    </div>
  )
}
