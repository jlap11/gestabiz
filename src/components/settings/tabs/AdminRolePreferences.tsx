import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Bell,
  Buildings as Building2,
  Calendar,
  FloppyDisk as Save,
} from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Business } from '@/types/types'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { BusinessNotificationSettings } from '../../admin/settings/BusinessNotificationSettings'
import { NotificationTracking } from '../../admin/settings/NotificationTracking'

interface AdminRolePreferencesProps {
  business: Business
}

export default function AdminRolePreferences({ business }: AdminRolePreferencesProps) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    name: business.name,
    description: business.description || '',
    phone: business.phone || '',
    email: business.email || '',
    website: business.website || '',
    address: business.address || '',
    city: business.city || '',
    state: business.state || '',
    tax_id: business.tax_id || '',
    legal_name: business.legal_name || '',
  })
  const [phonePrefix, setPhonePrefix] = useState('+57')
  const [isSaving, setIsSaving] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'notifications' | 'tracking'>('info')

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error(t('settings.businessInfo.errors.nameRequired'))
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          phone: formData.phone?.trim() || null,
          email: formData.email?.trim() || null,
          website: formData.website?.trim() || null,
          address: formData.address?.trim() || null,
          city: formData.city?.trim() || null,
          state: formData.state?.trim() || null,
          tax_id: formData.tax_id?.trim() || null,
          legal_name: formData.legal_name?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', business.id)

      if (error) throw error

      toast.success(t('common.messages.updateSuccess'))
    } catch {
      toast.error(t('common.messages.updateError'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant={activeSubTab === 'info' ? 'default' : 'outline'}
          onClick={() => setActiveSubTab('info')}
          className="flex items-center gap-2"
        >
          <Building2 className="h-4 w-4" />
          {t('settings.businessInfo.tabs.info')}
        </Button>
        <Button
          variant={activeSubTab === 'notifications' ? 'default' : 'outline'}
          onClick={() => setActiveSubTab('notifications')}
          className="flex items-center gap-2"
        >
          <Bell className="h-4 w-4" />
          {t('settings.businessInfo.tabs.notifications')}
        </Button>
        <Button
          variant={activeSubTab === 'tracking' ? 'default' : 'outline'}
          onClick={() => setActiveSubTab('tracking')}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          {t('settings.businessInfo.tabs.tracking')}
        </Button>
      </div>

      {activeSubTab === 'info' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.businessInfo.basicInfo.title')}</CardTitle>
              <CardDescription>{t('settings.businessInfo.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">{t('settings.businessInfo.basicInfo.nameLabel')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  placeholder={t('settings.businessInfo.basicInfo.namePlaceholder')}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">
                  {t('settings.businessInfo.basicInfo.descriptionLabel')}
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => handleChange('description', e.target.value)}
                  placeholder={t('settings.businessInfo.basicInfo.descriptionPlaceholder')}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.businessInfo.contactInfo.title')}</CardTitle>
              <CardDescription>{t('settings.businessInfo.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phone">{t('settings.businessInfo.contactInfo.phoneLabel')}</Label>
                <PhoneInput
                  value={formData.phone}
                  onChange={value => handleChange('phone', value)}
                  prefix={phonePrefix}
                  onPrefixChange={setPhonePrefix}
                  placeholder={t('settings.businessInfo.contactInfo.phonePlaceholder')}
                />
              </div>

              <div>
                <Label htmlFor="email">{t('settings.businessInfo.contactInfo.emailLabel')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                  placeholder={t('settings.businessInfo.contactInfo.emailPlaceholder')}
                />
              </div>

              <div>
                <Label htmlFor="website">
                  {t('settings.businessInfo.contactInfo.websiteLabel')}
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={e => handleChange('website', e.target.value)}
                  placeholder={t('settings.businessInfo.contactInfo.websitePlaceholder')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.businessInfo.addressInfo.title')}</CardTitle>
              <CardDescription>{t('settings.businessInfo.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">
                  {t('settings.businessInfo.addressInfo.addressLabel')}
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={e => handleChange('address', e.target.value)}
                  placeholder={t('settings.businessInfo.addressInfo.addressPlaceholder')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">{t('settings.businessInfo.addressInfo.cityLabel')}</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={e => handleChange('city', e.target.value)}
                    placeholder={t('settings.businessInfo.addressInfo.cityPlaceholder')}
                  />
                </div>

                <div>
                  <Label htmlFor="state">{t('settings.businessInfo.addressInfo.stateLabel')}</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={e => handleChange('state', e.target.value)}
                    placeholder={t('settings.businessInfo.addressInfo.statePlaceholder')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legal Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.businessInfo.legalInfo.title')}</CardTitle>
              <CardDescription>{t('settings.businessInfo.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="legal_name">
                  {t('settings.businessInfo.legalInfo.legalNameLabel')}
                </Label>
                <Input
                  id="legal_name"
                  value={formData.legal_name}
                  onChange={e => handleChange('legal_name', e.target.value)}
                  placeholder={t('settings.businessInfo.legalInfo.legalNamePlaceholder')}
                />
              </div>

              <div>
                <Label htmlFor="tax_id">{t('settings.businessInfo.legalInfo.taxIdLabel')}</Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={e => handleChange('tax_id', e.target.value)}
                  placeholder={t('settings.businessInfo.legalInfo.taxIdPlaceholder')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Configuraciones de Operación */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.businessInfo.operationSettings.title')}</CardTitle>
              <CardDescription>{t('settings.businessInfo.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">
                    {t('settings.businessInfo.operationSettings.allowOnlineBooking.label')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.businessInfo.operationSettings.allowOnlineBooking.description')}
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">
                    {t('settings.businessInfo.operationSettings.autoConfirm.label')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.businessInfo.operationSettings.autoConfirm.description')}
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">
                    {t('settings.businessInfo.operationSettings.autoReminders.label')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.businessInfo.operationSettings.autoReminders.description')}
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">
                    {t('settings.businessInfo.operationSettings.showPrices.label')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.businessInfo.operationSettings.showPrices.description')}
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary/90">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? t('common.actions.saving') : t('common.actions.save')}
            </Button>
          </div>
        </form>
      )}

      {activeSubTab === 'notifications' && (
        <BusinessNotificationSettings businessId={business.id} />
      )}

      {activeSubTab === 'tracking' && <NotificationTracking businessId={business.id} />}
    </>
  )
}