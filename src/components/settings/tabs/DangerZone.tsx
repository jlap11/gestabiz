import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Warning as AlertCircle, CircleNotch as Loader2 } from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { User } from '@/types'

interface DangerZoneProps {
  user: User
}

export default function DangerZone({ user }: DangerZoneProps) {
  const { t } = useLanguage()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1)
  const [confirmEmail, setConfirmEmail] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [understandConsequences, setUnderstandConsequences] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleOpenDeleteDialog = () => {
    setDeleteStep(1)
    setConfirmEmail('')
    setConfirmText('')
    setUnderstandConsequences(false)
    setShowDeleteDialog(true)
  }

  const handleCloseDialog = () => {
    if (!isDeleting) {
      setShowDeleteDialog(false)
      setDeleteStep(1)
    }
  }

  const handleProceedToStep2 = () => {
    if (confirmEmail.toLowerCase() === user.email.toLowerCase() && understandConsequences) {
      setDeleteStep(2)
    }
  }

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DESACTIVAR CUENTA') {
      toast.error(t('settings.dangerZone.delete.mustTypeCorrectly'))
      return
    }

    setIsDeleting(true)

    try {
      // Llamar a la función RPC para desactivar la cuenta
      // Esta función automáticamente:
      // - Marca is_active = FALSE en profiles
      // - Registra deactivated_at con timestamp
      // - Cancela todas las citas futuras pendientes
      const { error } = await supabase.rpc('deactivate_user_account', {
        user_id_param: user.id,
      })

      if (error) throw error

      // Cerrar sesión
      await supabase.auth.signOut()

      toast.success(t('settings.dangerZone.delete.successTitle'), {
        description: t('settings.dangerZone.delete.successDescription'),
      })

      // Limpiar localStorage
      localStorage.clear()

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('settings.dangerZone.delete.unknownError')
      toast.error(t('settings.dangerZone.delete.errorTitle'), {
        description: errorMessage,
      })
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            {t('settings.dangerZone.title')}
          </CardTitle>
          <CardDescription>{t('settings.dangerZone.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{t('settings.dangerZone.warning.label')}:</strong>{' '}
              {t('settings.dangerZone.warning.message')}
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <h4 className="text-base font-semibold mb-2">
                {t('settings.dangerZone.deactivate.title')}
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                {t('settings.dangerZone.deactivate.subtitle')}
              </p>

              <div className="bg-muted/30 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium mb-2">
                  {t('settings.dangerZone.deactivate.whatHappens')}
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>{t('settings.dangerZone.deactivate.consequences.markedInactive')}</li>
                  <li>{t('settings.dangerZone.deactivate.consequences.sessionClosed')}</li>
                  <li>{t('settings.dangerZone.deactivate.consequences.futureAppointments')}</li>
                  <li>{t('settings.dangerZone.deactivate.consequences.noLogin')}</li>
                  <li>{t('settings.dangerZone.deactivate.consequences.dataPreserved')}</li>
                </ul>
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                    ✓ {t('settings.dangerZone.deactivate.dataNotDeleted')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.dangerZone.deactivate.contactSupport')}
                  </p>
                </div>
              </div>

              <Button variant="destructive" onClick={handleOpenDeleteDialog} className="w-full">
                <AlertCircle className="h-4 w-4 mr-2" />
                {t('settings.dangerZone.deactivate.button')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmación multi-paso */}
      <Dialog open={showDeleteDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {deleteStep === 1
                ? t('settings.dangerZone.delete.step1Title')
                : t('settings.dangerZone.delete.step2Title')}
            </DialogTitle>
            <DialogDescription>
              {deleteStep === 1
                ? t('settings.dangerZone.delete.step1Description')
                : t('settings.dangerZone.delete.step2Description')}
            </DialogDescription>
          </DialogHeader>

          {deleteStep === 1 && (
            <div className="space-y-4 py-4">
              <Alert className="border-yellow-500 bg-yellow-500/10">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <AlertDescription className="text-sm text-yellow-800 dark:text-white-200">
                  {t('settings.dangerZone.delete.step1Warning')}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="confirm-email">
                  {t('settings.dangerZone.delete.emailPrompt')}: <strong>{user.email}</strong>
                </Label>
                <Input
                  id="confirm-email"
                  type="email"
                  placeholder={t('settings.dangerZone.delete.emailPlaceholder')}
                  value={confirmEmail}
                  onChange={e => setConfirmEmail(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="understand"
                  checked={understandConsequences}
                  onCheckedChange={checked => setUnderstandConsequences(checked as boolean)}
                />
                <label htmlFor="understand" className="text-sm leading-tight cursor-pointer">
                  {t('settings.dangerZone.delete.understandCheckbox')}
                </label>
              </div>
            </div>
          )}

          {deleteStep === 2 && (
            <div className="space-y-4 py-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm font-semibold">
                  ⚠️ {t('settings.dangerZone.delete.finalWarning')}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="confirm-text">
                  {t('settings.dangerZone.delete.typeExactly')}:{' '}
                  <code className="bg-muted px-2 py-1 rounded">DESACTIVAR CUENTA</code>
                </Label>
                <Input
                  id="confirm-text"
                  type="text"
                  placeholder={t('settings.dangerZone.delete.confirmPlaceholder')}
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  className="w-full font-mono"
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-2">
                  {t('settings.dangerZone.delete.confirmDetails')}:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>
                    ⚠️ {t('settings.dangerZone.delete.accountLabel')}: {user.email}
                  </li>
                  <li>
                    ⚠️ {t('settings.dangerZone.delete.profileLabel')}: {user.name}
                  </li>
                  <li>
                    ⚠️ {t('settings.dangerZone.delete.rolesLabel')}: {user.roles?.length || 0}{' '}
                    {t('settings.dangerZone.delete.activeLabel')}
                  </li>
                  <li>
                    ⚠️ {t('settings.dangerZone.delete.appointmentsLabel')}:{' '}
                    {t('settings.dangerZone.delete.cancelledAuto')}
                  </li>
                </ul>
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs font-medium text-green-600 dark:text-green-400">
                    ✓ {t('settings.dangerZone.delete.dataPreservedNote')}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              {t('common.actions.cancel')}
            </Button>
            {deleteStep === 1 ? (
              <Button
                variant="destructive"
                onClick={handleProceedToStep2}
                disabled={
                  confirmEmail.toLowerCase() !== user.email.toLowerCase() || !understandConsequences
                }
                className="w-full sm:w-auto"
              >
                {t('settings.dangerZone.delete.continue')}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={confirmText !== 'DESACTIVAR CUENTA' || isDeleting}
                className="w-full sm:w-auto"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('settings.dangerZone.delete.deactivating')}...
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {t('settings.dangerZone.delete.deactivateNow')}
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}