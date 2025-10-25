import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ShoppingCart } from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function ClientRolePreferences() {
  const { t } = useLanguage()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t('settings.clientPrefs.bookingPrefs.title')}
          </CardTitle>
          <CardDescription>{t('settings.clientPrefs.bookingPrefs.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">
                  {t('settings.clientPrefs.bookingPrefs.reminders.label')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.clientPrefs.bookingPrefs.reminders.description')}
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">
                  {t('settings.clientPrefs.bookingPrefs.emailConfirmation.label')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.clientPrefs.bookingPrefs.emailConfirmation.description')}
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">
                  {t('settings.clientPrefs.bookingPrefs.promotions.label')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.clientPrefs.bookingPrefs.promotions.description')}
                </p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">
                  {t('settings.clientPrefs.bookingPrefs.savePayment.label')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.clientPrefs.bookingPrefs.savePayment.description')}
                </p>
              </div>
              <Switch />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base font-medium">
              {t('settings.clientPrefs.advanceTime.title')}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t('settings.clientPrefs.advanceTime.description')}
            </p>
            <Select defaultValue="24">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">
                  {t('settings.clientPrefs.advanceTime.options.oneHour')}
                </SelectItem>
                <SelectItem value="2">
                  {t('settings.clientPrefs.advanceTime.options.twoHours')}
                </SelectItem>
                <SelectItem value="4">
                  {t('settings.clientPrefs.advanceTime.options.fourHours')}
                </SelectItem>
                <SelectItem value="24">
                  {t('settings.clientPrefs.advanceTime.options.oneDay')}
                </SelectItem>
                <SelectItem value="48">
                  {t('settings.clientPrefs.advanceTime.options.twoDays')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base font-medium">
              {t('settings.clientPrefs.paymentMethods.title')}
            </Label>
            <Select defaultValue="card">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">
                  {t('settings.clientPrefs.paymentMethods.options.card')}
                </SelectItem>
                <SelectItem value="cash">
                  {t('settings.clientPrefs.paymentMethods.options.cash')}
                </SelectItem>
                <SelectItem value="transfer">
                  {t('settings.clientPrefs.paymentMethods.options.transfer')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base font-medium">
              {t('settings.clientPrefs.serviceHistory.title')}
            </Label>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {t('settings.clientPrefs.serviceHistory.completedServices', { count: '0' })}
              </p>
              <Button variant="outline" className="mt-3 w-full">
                {t('settings.clientPrefs.serviceHistory.viewHistory')}
              </Button>
            </div>
          </div>

          <div className="pt-4">
            <Button className="w-full">{t('settings.clientPrefs.savePreferences')}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}