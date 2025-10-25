import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'

interface BusinessService {
  _key: string
  name: string
  category: string
  duration: number
  price: number | string
  description: string
}

interface ServicesSectionProps {
  businessServices: BusinessService[]
  onServiceChange: (index: number, field: string, value: string | number) => void
  onAddService: () => void
  onRemoveService: (index: number) => void
}

export function ServicesSection({ 
  businessServices, 
  onServiceChange, 
  onAddService, 
  onRemoveService 
}: ServicesSectionProps) {
  const { t } = useLanguage()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span className="h-5 w-5" aria-hidden="true">⭐</span>
          {t('business.registration.services')}
        </h3>
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={onAddService}
          className="min-h-[44px] min-w-[44px]"
          aria-label={t('business.registration.add_service')}
          title={t('business.registration.add_service')}
        >
          {t('business.registration.add_service')}
        </Button>
      </div>
      <div className="space-y-4" role="list" aria-label={t('business.registration.services')}>
        {businessServices.map((service, index) => (
          <div key={service._key} className="p-4 border rounded-lg space-y-3" role="listitem">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">
                {t('business.registration.service')} {index + 1}
              </Badge>
              {businessServices.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveService(index)}
                  className="min-h-[44px] min-w-[44px]"
                  aria-label={`${t('business.registration.remove')} ${t('business.registration.service')} ${index + 1}`}
                  title={`${t('business.registration.remove')} ${t('business.registration.service')} ${index + 1}`}
                >
                  {t('business.registration.remove')}
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor={`service-name-${index}`}>{t('business.registration.service_name')}</Label>
                <Input
                  id={`service-name-${index}`}
                  value={service.name}
                  onChange={e => onServiceChange(index, 'name', e.target.value)}
                  placeholder={t('business.registration.placeholders.service_name')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`service-category-${index}`}>{t('business.registration.service_category')}</Label>
                <Input
                  id={`service-category-${index}`}
                  value={service.category}
                  onChange={e => onServiceChange(index, 'category', e.target.value)}
                  placeholder={t('business.registration.placeholders.service_category')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`service-duration-${index}`}>
                  {t('business.registration.duration')} (
                  {t('business.registration.minutes')})
                </Label>
                <Input
                  id={`service-duration-${index}`}
                  type="number"
                  min="15"
                  step="15"
                  value={service.duration}
                  onChange={e =>
                    onServiceChange(index, 'duration', parseInt(e.target.value) || 60)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`service-price-${index}`}>{t('business.registration.price')}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none select-none" aria-hidden="true">
                    $
                  </span>
                  <Input
                    id={`service-price-${index}`}
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9.]*"
                    className="pl-7"
                    value={
                      typeof service.price === 'string' && service.price === ''
                        ? ''
                        : Number(service.price).toLocaleString('es-MX', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })
                    }
                    onChange={e => {
                      // Clean input to allow only digits and dots
                      let raw = e.target.value.replace(/[^\d.]/g, '')
                      // Reemplazar múltiples puntos por uno solo
                      const parts = raw.split('.')
                      if (parts.length > 2) {
                        raw = parts[0] + '.' + parts.slice(1).join('')
                      }
                      if (raw === '') {
                        onServiceChange(index, 'price', '')
                      } else {
                        const num = parseFloat(raw)
                        if (!isNaN(num)) {
                          onServiceChange(index, 'price', num)
                        } else {
                          onServiceChange(index, 'price', '')
                        }
                      }
                    }}
                    placeholder={t('business.registration.placeholders.price') || '0'}
                  />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor={`service-description-${index}`}>{t('business.registration.service_description')}</Label>
                <Textarea
                  id={`service-description-${index}`}
                  value={service.description}
                  onChange={e =>
                    onServiceChange(index, 'description', e.target.value)
                  }
                  placeholder={t(
                    'business.registration.placeholders.service_description'
                  )}
                  rows={2}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}