/**
 * CancelSubscriptionModal Component
 * 
 * Modal para cancelar una suscripción
 */

import { useState } from 'react'
import { useSubscription } from '@/hooks/useSubscription'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AlertCircle, Loader2 } from 'lucide-react'

interface CancelSubscriptionModalProps {
  businessId: string
  onClose: () => void
  onSuccess: () => void
}

export function CancelSubscriptionModal({
  businessId,
  onClose,
  onSuccess,
}: CancelSubscriptionModalProps) {
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(true)
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { cancelSubscription } = useSubscription(businessId)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await cancelSubscription(cancelAtPeriodEnd, reason || undefined)
      onSuccess()
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar Suscripción</DialogTitle>
          <DialogDescription>
            Lamentamos que te vayas. Por favor cuéntanos por qué cancelas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipo de cancelación */}
          <div className="space-y-2">
            <Label>¿Cuándo quieres cancelar?</Label>
            <RadioGroup
              value={cancelAtPeriodEnd ? 'end' : 'now'}
              onValueChange={(value) => setCancelAtPeriodEnd(value === 'end')}
            >
              <div className="flex items-start space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="end" id="end" />
                <div className="flex-1">
                  <Label htmlFor="end" className="cursor-pointer font-medium">
                    Al final del período actual
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Podrás seguir usando el servicio hasta que termine tu período de
                    facturación actual. No se te cobrará nuevamente.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="now" id="now" />
                <div className="flex-1">
                  <Label htmlFor="now" className="cursor-pointer font-medium">
                    Inmediatamente
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tu acceso será revocado de inmediato. Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Razón de cancelación */}
          <div className="space-y-2">
            <Label htmlFor="reason">Razón de cancelación (Opcional)</Label>
            <Textarea
              id="reason"
              placeholder="Ayúdanos a mejorar contándonos por qué cancelas..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>

          {/* Advertencia */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-900">Ten en cuenta:</p>
              <ul className="list-disc list-inside mt-1 text-yellow-800 space-y-1">
                <li>Perderás acceso a todas las funcionalidades del plan</li>
                <li>Tus datos se conservarán por 30 días</li>
                <li>Podrás reactivar tu cuenta en cualquier momento</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            No cancelar
          </Button>
          <Button 
            variant="destructive"
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelando...
              </>
            ) : (
              'Confirmar Cancelación'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
