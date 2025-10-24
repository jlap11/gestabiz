/**
 * CancelSubscriptionModal Component
 * 
 * Modal para cancelar una suscripción
 */

import { useState } from 'react'
import { useSubscription } from '@/hooks/useSubscription'
import { useLanguage } from '@/contexts/LanguageContext'
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
}: Readonly<CancelSubscriptionModalProps>) {
  const { t } = useLanguage()
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
          <DialogTitle>{t('billing.cancelSubscriptionTitle')}</DialogTitle>
          <DialogDescription>
            {t('billing.cancelSubscriptionDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipo de cancelación */}
          <div className="space-y-2">
            <Label>{t('billing.cancelWhenQuestion')}</Label>
            <RadioGroup
              value={cancelAtPeriodEnd ? 'end' : 'now'}
              onValueChange={(value) => setCancelAtPeriodEnd(value === 'end')}
            >
              <div className="flex items-start space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="end" id="end" />
                <div className="flex-1">
                  <Label htmlFor="end" className="cursor-pointer font-medium">
                    {t('billing.cancelAtPeriodEnd')}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('billing.cancelAtPeriodEndDescription')}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="now" id="now" />
                <div className="flex-1">
                  <Label htmlFor="now" className="cursor-pointer font-medium">
                    {t('billing.cancelImmediately')}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('billing.cancelImmediatelyDescription')}
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Razón de cancelación */}
          <div className="space-y-2">
            <Label htmlFor="reason">{t('billing.cancellationReason')}</Label>
            <Textarea
              id="reason"
              placeholder={t('billing.cancellationReasonPlaceholder')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>

          {/* Advertencia */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-900">{t('billing.cancelWarningTitle')}</p>
              <ul className="list-disc list-inside mt-1 text-yellow-800 space-y-1">
                <li>{t('billing.cancelWarning1')}</li>
                <li>{t('billing.cancelWarning2')}</li>
                <li>{t('billing.cancelWarning3')}</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t('common.actions.cancel')}
          </Button>
          <Button 
            variant="destructive"
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('billing.cancelingSubscription')}
              </>
            ) : (
              t('billing.confirmCancellation')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
