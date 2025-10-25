import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'

interface LocationInfoSectionProps {
  formData: {
    address: string
    city: string
    country: string
    postal_code: string
    latitude: string
    longitude: string
  }
  onInputChange: (field: string, value: string) => void
  onLocationDetection: () => void
}

export function LocationInfoSection({ 
  formData, 
  onInputChange, 
  onLocationDetection 
}: LocationInfoSectionProps) {
  const { t } = useLanguage()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span className="h-5 w-5" aria-hidden="true">📍</span>
          {t('business.registration.location')}
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onLocationDetection}
          className="min-h-[44px] min-w-[44px]"
          aria-label={t('business.registration.detect_location')}
          title={t('business.registration.detect_location')}
        >
          {t('business.registration.detect_location')}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">{t('business.registration.address')}</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={e => onInputChange('address', e.target.value)}
            placeholder={t('business.registration.placeholders.address')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">{t('business.registration.city')}</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={e => onInputChange('city', e.target.value)}
            placeholder={t('business.registration.placeholders.city')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">{t('business.registration.country')}</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={e => onInputChange('country', e.target.value)}
            placeholder={t('business.registration.placeholders.country')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postal_code">{t('business.registration.postal_code')}</Label>
          <Input
            id="postal_code"
            value={formData.postal_code}
            onChange={e => onInputChange('postal_code', e.target.value)}
            placeholder={t('business.registration.placeholders.postal_code')}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('business.registration.coordinates')}</Label>
          <div className="flex gap-2">
            <Input
              value={formData.latitude}
              onChange={e => onInputChange('latitude', e.target.value)}
              placeholder={t('business.registration.placeholders.latitude')}
              aria-label="Latitud"
            />
            <Input
              value={formData.longitude}
              onChange={e => onInputChange('longitude', e.target.value)}
              placeholder={t('business.registration.placeholders.longitude')}
              aria-label="Longitud"
            />
          </div>
        </div>
      </div>
    </div>
  )
}