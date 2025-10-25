import React from 'react'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'

interface AppointmentStatusBadgeProps {
  status: string
  businessName?: string
}

export function AppointmentStatusBadge({ status, businessName }: AppointmentStatusBadgeProps) {
  const { t } = useLanguage()

  const getStatusLabel = (status: string): string => {
    if (status === 'confirmed') return t('clientDashboard.status.confirmed')
    if (status === 'scheduled') return t('clientDashboard.status.scheduled')
    return t('clientDashboard.status.pending')
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
      <Badge
        variant={status === 'confirmed' ? 'default' : 'secondary'}
        className="text-sm sm:text-base px-4 py-1"
        aria-label={t('clientDashboard.aria.appointmentState', { state: getStatusLabel(status) })}
      >
        {getStatusLabel(status)}
      </Badge>
      {businessName && (
        <span className="text-sm font-medium text-primary">
          {businessName}
        </span>
      )}
    </div>
  )
}