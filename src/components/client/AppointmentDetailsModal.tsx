import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useLanguage } from '@/contexts/LanguageContext'
import { AppointmentStatusBadge } from './AppointmentStatusBadge'
import { AppointmentServiceInfo } from './AppointmentServiceInfo'
import { AppointmentDateTime } from './AppointmentDateTime'
import { AppointmentProfessional } from './AppointmentProfessional'
import { AppointmentLocation } from './AppointmentLocation'
import { AppointmentPrice } from './AppointmentPrice'
import { AppointmentActions } from './AppointmentActions'

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

interface AppointmentDetailsModalProps {
  appointment: AppointmentWithRelations | null
  isOpen: boolean
  onClose: () => void
  onStartChat?: (professionalId: string, businessId?: string) => void
  onReschedule?: (appointment: AppointmentWithRelations) => void
  onCancel?: (appointmentId: string) => void
  isStartingChat?: boolean
}

export function AppointmentDetailsModal({
  appointment,
  isOpen,
  onClose,
  onStartChat,
  onReschedule,
  onCancel,
  isStartingChat = false,
}: AppointmentDetailsModalProps) {
  const { t } = useLanguage()

  if (!appointment) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {t('clientDashboard.appointmentDetails')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Business */}
          <AppointmentStatusBadge 
            status={appointment.status}
            businessName={appointment.business?.name}
          />

          {/* Service Information */}
          <AppointmentServiceInfo 
            service={appointment.service}
            title={appointment.title}
          />

          {/* Date and Time */}
          <AppointmentDateTime 
            startTime={appointment.start_time}
            endTime={appointment.end_time}
            duration={appointment.service?.duration}
          />

          {/* Professional/Employee Information */}
          {appointment.employee && (
            <AppointmentProfessional employee={appointment.employee} />
          )}

          {/* Location Information */}
          {appointment.location && (
            <AppointmentLocation location={appointment.location} />
          )}

          {/* Description/Notes */}
          {(appointment.description || appointment.notes) && (
            <section role="region" aria-labelledby="notes-info">
              <h3 id="notes-info" className="text-lg font-medium mb-3">
                {t('clientDashboard.notesTitle')}
              </h3>
              <div className="bg-muted/50 rounded-lg p-4">
                {appointment.description && (
                  <div className="mb-3">
                    <h4 className="font-medium text-foreground mb-1">
                      {t('clientDashboard.descriptionTitle')}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {appointment.description}
                    </p>
                  </div>
                )}
                {appointment.notes && (
                  <div>
                    <h4 className="font-medium text-foreground mb-1">
                      {t('clientDashboard.notesTitle')}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {appointment.notes}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Service Price/Value */}
          <AppointmentPrice 
            service={appointment.service}
            price={appointment.price}
          />

          {/* Action Buttons */}
          <AppointmentActions
            status={appointment.status}
            employeeId={appointment.employee?.id}
            businessId={appointment.business_id}
            appointmentId={appointment.id}
            appointment={appointment}
            onStartChat={onStartChat}
            onReschedule={onReschedule}
            onCancel={onCancel}
            onClose={onClose}
            isStartingChat={isStartingChat}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}