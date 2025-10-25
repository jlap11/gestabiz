import React from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

interface Service {
  id: string
  name: string
  description?: string
  duration?: number
  price?: number
  currency?: string
}

interface AppointmentPriceProps {
  service?: Service
  price?: number
}

export function AppointmentPrice({ service, price }: AppointmentPriceProps) {
  const { t } = useLanguage()

  const servicePrice = service?.price ?? price ?? 0

  if (!servicePrice) return null

  return (
    <section role="region" aria-labelledby="price-info" className="pt-4 border-t border-border">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h3 id="price-info" className="text-base sm:text-lg font-medium text-muted-foreground">
            {t('clientDashboard.serviceValueTitle')}
          </h3>
          {service?.duration && (
            <p className="text-xs text-muted-foreground">
              {t('clientDashboard.estimatedDuration', { minutes: service.duration })}
            </p>
          )}
        </div>
        <p className="text-xl sm:text-2xl font-bold text-foreground">
          {t('common.currencySymbol')}
          {servicePrice.toLocaleString('es-CO', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}{' '}
          {t('clientDashboard.currency')}
        </p>
      </div>
    </section>
  )
}