import React from 'react'
import { Clock, UserIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

// Extended appointment type with relations
type AppointmentWithRelations = {
  id: string
  start_time: string
  end_time: string
  status: string
  title?: string
  description?: string
  notes?: string
  price?: number
  currency?: string
  business_id: string
  location_id?: string
  service_id?: string
  employee_id?: string
  client_id: string
  business?: {
    id: string
    name: string
    description?: string
  }
  location?: {
    id: string
    name: string
    address?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
    latitude?: number
    longitude?: number
    google_maps_url?: string
  }
  employee?: {
    id: string
    full_name: string
    email?: string
    phone?: string
    avatar_url?: string
  }
  service?: {
    id: string
    name: string
    description?: string
    duration?: number
    price?: number
    currency?: string
  }
}

interface AppointmentListProps {
  appointments: AppointmentWithRelations[]
  onAppointmentClick: (appointment: AppointmentWithRelations) => void
}

export function AppointmentList({ appointments, onAppointmentClick }: AppointmentListProps) {
  const { t } = useLanguage()

  // Get status label
  const getStatusLabel = (status: string): string => {
    if (status === 'confirmed') return t('clientDashboard.status.confirmed')
    if (status === 'scheduled') return t('clientDashboard.status.scheduled')
    return t('clientDashboard.status.pending')
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4" role="list" aria-label={t('clientDashboard.upcomingListLabel')}>
      {appointments.map(appointment => (
        <Card
          key={appointment.id}
          className="cursor-pointer hover:shadow-lg focus-within:shadow-lg transition-shadow"
          onClick={() => onAppointmentClick(appointment)}
          role="listitem"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onAppointmentClick(appointment)
            }
          }}
          aria-label={t('clientDashboard.calendar.openAppointmentAt', {
            title: appointment.service?.name || appointment.title || '',
            time: new Date(appointment.start_time).toLocaleTimeString('es', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          })}
          title={t('clientDashboard.calendar.openAppointmentAt', {
            title: appointment.service?.name || appointment.title || '',
            time: new Date(appointment.start_time).toLocaleTimeString('es', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          })}
        >
          <CardContent className="p-3 sm:p-4">
            <div className="space-y-2 sm:space-y-3">
              {/* Top Row: Business/Sede + Status Badge */}
              <div className="flex items-start justify-between gap-2 pb-2 border-b border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                    {appointment.business?.name}
                    {appointment.business?.name &&
                      appointment.location?.name &&
                      ' • '}
                    <span className="font-normal text-muted-foreground">
                      {appointment.location?.name}
                    </span>
                  </p>
                </div>
                <Badge
                  variant={
                    appointment.status === 'confirmed' ? 'default' : 'secondary'
                  }
                  className="flex-shrink-0 whitespace-nowrap text-xs"
                  role="status"
                  aria-label={t('clientDashboard.aria.appointmentState', { state: getStatusLabel(appointment.status) })}
                >
                  {getStatusLabel(appointment.status)}
                </Badge>
              </div>

              {/* Service Name */}
              <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-2">
                {appointment.service?.name || appointment.title}
              </h3>

              {/* Professional Info: Avatar + Name */}
              {appointment.employee?.full_name && (
                <div className="flex items-center gap-2 sm:gap-3 bg-card/50 p-2 rounded-lg border border-border/50">
                  {appointment.employee?.avatar_url ? (
                    <img
                      src={appointment.employee.avatar_url}
                      alt={t('clientDashboard.photoOf', { name: appointment.employee.full_name })}
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div 
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0"
                      aria-label={t('clientDashboard.avatarOf', { name: appointment.employee.full_name })}
                    >
                      <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 text-primary" aria-hidden="true" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-foreground line-clamp-1">
                      {appointment.employee.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{t('clientDashboard.professionalRole')}</p>
                  </div>
                </div>
              )}

              {/* Date and Time */}
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground pt-1">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" aria-hidden="true" />
                <span className="line-clamp-1">
                  <time dateTime={appointment.start_time}>
                    {new Date(appointment.start_time).toLocaleDateString('es', {
                      day: 'numeric',
                      month: 'short',
                    })}
                    {' • '}
                    {new Date(appointment.start_time).toLocaleTimeString('es', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </span>
              </div>

              {/* Price */}
              {(appointment.service?.price || appointment.price) && (
                <div className="pt-2 border-t border-border">
                  <span 
                    className="text-sm sm:text-base lg:text-lg font-bold text-primary"
                    aria-label={t('clientDashboard.priceAria', {
                      price: (appointment.service?.price ?? appointment.price ?? 0).toLocaleString('es-CO'),
                      currency: t('clientDashboard.currency'),
                    })}
                  >
                    {t('common.currencySymbol')}
                    {(
                      appointment.service?.price ??
                      appointment.price ??
                      0
                    ).toLocaleString('es-CO', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}{' '}
                    {t('clientDashboard.currency')}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}