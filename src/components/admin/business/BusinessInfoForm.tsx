import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Building } from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Business } from '@/types'

interface BusinessInfoFormProps {
  business: Business
  onUpdate: (updates: Partial<Business>) => void
}

export function BusinessInfoForm({ business, onUpdate }: BusinessInfoFormProps) {
  const { t } = useLanguage()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Building className="h-5 w-5 flex-shrink-0" />
          <span className="truncate">
            {t('business.registration.business_name')} & {t('business.registration.description')}
          </span>
        </CardTitle>
        <CardDescription className="text-sm">
          {t('business.management.info_description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Grid responsivo para campos principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Información básica */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business-name" className="text-sm font-medium">
                {t('business.registration.business_name')}
              </Label>
              <Input
                id="business-name"
                value={business.name}
                onChange={e => onUpdate({ name: e.target.value })}
                placeholder={t('business.registration.placeholders.business_name')}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-category" className="text-sm font-medium">
                {t('business.registration.category')}
              </Label>
              <Input
                id="business-category"
                value={business.category}
                onChange={e => onUpdate({ category: e.target.value })}
                placeholder={t('business.registration.placeholders.category')}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-description" className="text-sm font-medium">
                {t('business.registration.description')}
              </Label>
              <Textarea
                id="business-description"
                value={business.description}
                onChange={e => onUpdate({ description: e.target.value })}
                placeholder={t('business.registration.placeholders.description')}
                className="w-full min-h-[80px] resize-none"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-website" className="text-sm font-medium">
                {t('business.registration.website')}
              </Label>
              <Input
                id="business-website"
                type="url"
                value={business.website}
                onChange={e => onUpdate({ website: e.target.value })}
                placeholder={t('business.registration.placeholders.website')}
                className="w-full"
              />
            </div>
          </div>

          {/* Información de contacto */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business-phone" className="text-sm font-medium">
                {t('business.registration.phone')}
              </Label>
              <Input
                id="business-phone"
                type="tel"
                value={business.phone}
                onChange={e => onUpdate({ phone: e.target.value })}
                placeholder={t('business.registration.placeholders.phone')}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-email" className="text-sm font-medium">
                {t('business.registration.email')}
              </Label>
              <Input
                id="business-email"
                type="email"
                value={business.email}
                onChange={e => onUpdate({ email: e.target.value })}
                placeholder={t('auth.emailPlaceholder')}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business-address" className="text-sm font-medium">
                {t('business.registration.address')}
              </Label>
              <Input
                id="business-address"
                value={business.address}
                onChange={e => onUpdate({ address: e.target.value })}
                placeholder={t('business.registration.placeholders.address')}
                className="w-full"
              />
            </div>

            {/* Grid responsivo para ciudad, estado y código postal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="business-city" className="text-sm font-medium">
                  {t('business.registration.city')}
                </Label>
                <Input
                  id="business-city"
                  value={business.city}
                  onChange={e => onUpdate({ city: e.target.value })}
                  placeholder={t('business.registration.placeholders.city')}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business-state" className="text-sm font-medium">
                  {t('business.registration.state')}
                </Label>
                <Input
                  id="business-state"
                  value={business.state}
                  onChange={e => onUpdate({ state: e.target.value })}
                  placeholder={t('business.registration.placeholders.state')}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="business-country" className="text-sm font-medium">
                  {t('business.registration.country')}
                </Label>
                <Input
                  id="business-country"
                  value={business.country}
                  onChange={e => onUpdate({ country: e.target.value })}
                  placeholder={t('business.registration.placeholders.country')}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business-postal" className="text-sm font-medium">
                  {t('business.registration.postal_code')}
                </Label>
                <Input
                  id="business-postal"
                  value={business.postal_code}
                  onChange={e => onUpdate({ postal_code: e.target.value })}
                  placeholder={t('business.registration.placeholders.postal_code')}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}