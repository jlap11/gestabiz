import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/contexts/LanguageContext'

interface ContactInfoSectionProps {
  formData: {
    phone: string
    email: string
    website: string
  }
  onInputChange: (field: string, value: string) => void
}

export function ContactInfoSection({ formData, onInputChange }: ContactInfoSectionProps) {
  const { t } = useLanguage()

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <span className="h-5 w-5" aria-hidden="true">📞</span>
        {t('business.registration.contact_info')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">{t('business.registration.phone')}</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={e => onInputChange('phone', e.target.value)}
            placeholder={t('business.registration.placeholders.phone')}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t('business.registration.email')}</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={e => onInputChange('email', e.target.value)}
            placeholder={t('business.registration.placeholders.email')}
            required
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="website">{t('business.registration.website')}</Label>
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={e => onInputChange('website', e.target.value)}
            placeholder={t('business.registration.placeholders.website')}
          />
        </div>
      </div>
    </div>
  )
}