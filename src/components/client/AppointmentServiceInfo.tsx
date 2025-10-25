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

interface AppointmentServiceInfoProps {
  service?: Service
  title?: string
}

export function AppointmentServiceInfo({ service, title }: AppointmentServiceInfoProps) {
  const { t } = useLanguage()

  const serviceName = service?.name || title
  const serviceDescription = service?.description

  if (!serviceName) return null

  return (
    <section role="region" aria-labelledby="service-info">
      <h3 id="service-info" className="text-lg font-medium mb-3">
        {t('clientDashboard.serviceTitle')}
      </h3>
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium text-foreground mb-2">
          {serviceName}
        </h4>
        {serviceDescription && (
          <p className="text-sm text-muted-foreground">
            {serviceDescription}
          </p>
        )}
      </div>
    </section>
  )
}