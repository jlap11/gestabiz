import React from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLanguage } from '@/contexts/LanguageContext'

interface EmployeeRequest {
  id: string
  user_id: string
  user_name: string
  user_email: string
  user_avatar?: string
  business_id: string
  requested_at: string
  message?: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by?: string
  reviewed_at?: string
  rejection_reason?: string
}

interface RejectionDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedRequest: EmployeeRequest | null
  rejectionReason: string
  onReasonChange: (reason: string) => void
  onConfirmReject: () => void
}

export function RejectionDialog({
  isOpen,
  onClose,
  selectedRequest,
  rejectionReason,
  onReasonChange,
  onConfirmReject
}: RejectionDialogProps) {
  const { t } = useLanguage()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('employee.rejectRequest')}</DialogTitle>
          <DialogDescription>
            {t('employee.rejectRequestDescription', { name: selectedRequest?.user_name || '' })}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="rejection-reason">
              {t('employee.rejectionReason')}
            </Label>
            <Textarea
              id="rejection-reason"
              placeholder={t('employee.rejectionReasonPlaceholder')}
              value={rejectionReason}
              onChange={(e) => onReasonChange(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={onConfirmReject}
            className="bg-red-600 hover:bg-red-700"
          >
            {t('employee.confirmReject')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}