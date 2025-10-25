import React from 'react'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Building2,
  DollarSign,
  MessageCircle,
  Star,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'

interface Business {
  id: string
  name: string
}

interface Location {
  id: string
  name: string
  business_id: string
}

interface Service {
  id: string
  name: string
  business_id: string
}

interface Category {
  id: string
  name: string
  slug: string
}

interface Employee {
  id: string
  full_name: string
}

interface AppointmentWithRelations {
  id: string
  date: string
  start_time: string
  end_time: string
  status: string
  notes?: string
  price?: number
  business: Business
  location: Location
  service: Service
  category: Category
  employee: Employee
}

interface HistoryAppointmentCardProps {
  readonly appointment: AppointmentWithRelations
  readonly statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }>
  readonly onStartChat: (appointment: AppointmentWithRelations) => void
  readonly onLeaveReview: (appointment: AppointmentWithRelations) => void
}

export const HistoryAppointmentCard = React.memo(function HistoryAppointmentCard({
  appointment,
  statusConfig,
  onStartChat,
  onLeaveReview,
}: HistoryAppointmentCardProps) {
  const { t, language } = useLanguage()
  const locale = language === 'es' ? es : enUS

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return format(date, 'PPP', { locale })
    } catch {
      return dateStr
    }
  }

  const formatTime = (timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(':')
      const date = new Date()
      date.setHours(parseInt(hours), parseInt(minutes))
      return format(date, 'p', { locale })
    } catch {
      return timeStr
    }
  }

  const formatPrice = (price?: number) => {
    if (!price) return t('common.notSpecified')
    return new Intl.NumberFormat(language === 'es' ? 'es-AR' : 'en-US', {
      style: 'currency',
      currency: 'ARS',
    }).format(price)
  }

  const status = statusConfig[appointment.status] || {
    label: appointment.status,
    variant: 'outline' as const,
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Main Info */}
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{appointment.service.name}</h3>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatDate(appointment.date)}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {/* Business */}
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{appointment.business.name}</span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{appointment.location.name}</span>
              </div>

              {/* Time */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                <span>
                  {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                </span>
              </div>

              {/* Professional */}
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{appointment.employee.full_name}</span>
              </div>

              {/* Category */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{appointment.category.name}</span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                <span className="font-medium">{formatPrice(appointment.price)}</span>
              </div>
            </div>

            {/* Notes */}
            {appointment.notes && (
              <div className="mt-3 p-3 bg-muted/50 rounded-md">
                <p className="text-sm text-muted-foreground">
                  <strong>{t('common.notes')}:</strong> {appointment.notes}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStartChat(appointment)}
              className="flex items-center gap-2 min-h-[44px] min-w-[44px]"
              aria-label={t('clientHistory.actions.chat')}
              title={t('clientHistory.actions.chat')}
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline lg:inline">
                {t('clientHistory.actions.chat')}
              </span>
            </Button>

            {appointment.status === 'attended' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onLeaveReview(appointment)}
                className="flex items-center gap-2 min-h-[44px] min-w-[44px]"
                aria-label={t('clientHistory.actions.review')}
                title={t('clientHistory.actions.review')}
              >
                <Star className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline lg:inline">
                  {t('clientHistory.actions.review')}
                </span>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
})