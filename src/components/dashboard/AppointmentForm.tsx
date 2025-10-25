import React, { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CustomDateInput } from '@/components/ui/custom-date-input'
import { TimeInput } from '@/components/ui/time-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from 'lucide-react'
import { Appointment, Client, User } from '@/types'
import { useLanguage } from '@/contexts'
import { useSupabaseData } from '@/hooks/useSupabaseData'
import { toast } from 'sonner'

export interface AppointmentFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (appointment: Partial<Appointment>) => Promise<void>
  user: User
  appointment?: Appointment | null
}

export function AppointmentForm({
  isOpen,
  onClose,
  onSubmit,
  user,
  appointment,
}: Readonly<AppointmentFormProps>) {
  const [loading, setLoading] = useState(false)
  const { t } = useLanguage()
  const supabaseData = useSupabaseData({ user, autoFetch: true })

  // Solo usar datos reales de Supabase
  const memoBusinesses = useMemo(() => {
    return supabaseData.businesses || []
  }, [supabaseData.businesses])

  const memoServices = useMemo(() => {
    return supabaseData.services || []
  }, [supabaseData.services])

  const businesses = memoBusinesses
  const services = memoServices

  type FormState = {
    business_id: string
    service_id: string
    location_id: string
    site_name: string
    title: string
    client_name: string
    client_email: string
    client_phone: string
    date: string
    start_time: string
    end_time: string
    notes: string
    status: Appointment['status']
  }

  const [formData, setFormData] = useState<FormState>({
    business_id: '',
    service_id: '',
    location_id: '',
    site_name: '',
    title: '',
  client_name: user.activeRole === 'client' ? user.name || t('appointmentForm.clientDefault') : '',
    client_email: '',
    client_phone: '',
    date: '',
    start_time: '',
    end_time: '',
    notes: '',
    status: 'scheduled',
  })

  useEffect(() => {
    if (appointment) {
      const startDate = new Date(appointment.start_time)
      const endDate = new Date(appointment.end_time)
      setFormData({
        business_id: appointment.business_id,
        service_id: appointment.service_id || '',
        location_id: appointment.location_id || '',
        site_name: appointment.site_name || '',
        title: appointment.title || '',
        client_name:
          appointment.client_name || (user.activeRole === 'client' ? user.name || t('appointmentForm.clientDefault') : ''),
        client_email: appointment.client_email || '',
        client_phone: appointment.client_phone || '',
        date: startDate.toISOString().split('T')[0],
        start_time: startDate.toTimeString().slice(0, 5),
        end_time: endDate.toTimeString().slice(0, 5),
        notes: appointment.notes || '',
        status: appointment.status,
      })
    } else {
      const defaultBusinessId = businesses && businesses.length > 0 ? businesses[0].id : ''
      setFormData({
        business_id: defaultBusinessId,
        service_id: '',
        location_id: '',
        site_name: '',
        title: '',
        client_name: user.activeRole === 'client' ? user.name || t('appointmentForm.clientDefault') : '',
        client_email: '',
        client_phone: '',
        date: '',
        start_time: '',
        end_time: '',
        notes: '',
        status: 'scheduled',
      })
    }
  }, [appointment, businesses, user.activeRole, user.name])

  useEffect(() => {
    if (formData.service_id && formData.start_time) {
      const service = services.find(s => s.id === formData.service_id)
      if (service) {
        const startTime = new Date(`2000-01-01T${formData.start_time}:00`)
        const endTime = new Date(startTime.getTime() + service.duration * 60000)
        setFormData(prev => ({ ...prev, end_time: endTime.toTimeString().slice(0, 5) }))
      }
    }
  }, [formData.service_id, formData.start_time, services])

  const handleInputChange = (field: keyof FormState, value: string) => {
    // Si el usuario es cliente y se edita cualquier campo, aseguramos que client_name siempre tenga valor
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(user.activeRole === 'client' && { client_name: user.name || t('appointmentForm.clientDefault') }),
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.client_name.trim()) {
        toast.error(t('admin.appointmentForm.clientNameRequired'))
        return
      }
      if (!formData.date) {
        toast.error(t('admin.appointmentForm.dateRequired'))
        return
      }
      if (!formData.start_time) {
        toast.error(t('admin.appointmentForm.startTimeRequired'))
        return
      }
      if (!formData.service_id) {
        toast.error(t('admin.appointmentForm.serviceRequired'))
        return
      }

      const startDateTime = new Date(`${formData.date}T${formData.start_time}:00`)
      const endDateTime = new Date(`${formData.date}T${formData.end_time}:00`)
      if (startDateTime >= endDateTime) {
        toast.error(t('validation.invalidTimeRange'))
        return
      }
      if (startDateTime < new Date()) {
        toast.error(t('validation.futureTimeRequired'))
        return
      }

      const appointmentData: Partial<Appointment> = {
        business_id: formData.business_id,
        service_id: formData.service_id,
        location_id: formData.location_id || undefined,
        site_name: formData.site_name,
        client_id: user.id,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: formData.status,
        notes: formData.notes,
        title:
          formData.title.trim() ||
          `${services.find(s => s.id === formData.service_id)?.name || t('appointmentForm.defaultTitle')} - ${formData.client_name}`,
        client_name: formData.client_name,
        client_email: formData.client_email,
        client_phone: formData.client_phone,
      }

      await onSubmit(appointmentData)
      toast.success(
        appointment
          ? t('admin.appointmentForm.updatedSuccess')
          : t('admin.appointmentForm.createdSuccess')
      )
      onClose()
    } catch (error) {
      toast.error(t('common.error'))
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full"
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-form-title"
        aria-describedby="appointment-form-description"
      >
        <DialogHeader>
          <DialogTitle id="appointment-form-title">
            {appointment ? t('appointments.edit') : t('appointments.create')}
          </DialogTitle>
          <div id="appointment-form-description" className="sr-only">
            {appointment 
              ? t('appointmentForm.formDescription.edit')
              : t('appointmentForm.formDescription.create')
            }
          </div>
        </DialogHeader>
          <form 
          onSubmit={handleSubmit} 
          className="space-y-4 sm:space-y-6"
          role="form"
          aria-label={appointment ? t('appointmentForm.aria.editForm') : t('appointmentForm.aria.createForm')}
        >
          {/* Personalización para cliente: solo campos esenciales */}
          {user.activeRole === 'client' ? (
            <section aria-labelledby="client-form-section" className="space-y-4 sm:space-y-6">
              <h3 id="client-form-section" className="sr-only">{t('appointmentForm.clientSectionTitle')}</h3>
              
              <div className="space-y-2">
                <Label htmlFor="business" className="text-sm font-medium">
                  {t('appointmentForm.businessLabel')} *
                </Label>
                <Select
                  value={formData.business_id}
                  onValueChange={v => handleInputChange('business_id', v)}
                  required
                  aria-label={t('appointmentForm.aria.selectBusiness')}
                >
                  <SelectTrigger 
                    id="business"
                    className="min-h-[44px]"
                    aria-describedby="business-help"
                  >
                    <SelectValue placeholder={t('common.placeholders.selectBusiness')} />
                  </SelectTrigger>
                  <SelectContent role="listbox">
                    {businesses.map(b => (
                      <SelectItem key={b.id} value={b.id} role="option">
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div id="business-help" className="sr-only">
                  {t('appointmentForm.help.selectBusiness')}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service" className="text-sm font-medium">
                  {t('appointments.service')} *
                </Label>
                <Select
                  value={formData.service_id}
                  onValueChange={v => handleInputChange('service_id', v)}
                  required
                  aria-label={t('appointmentForm.aria.selectService')}
                >
                  <SelectTrigger 
                    id="service"
                    className="min-h-[44px]"
                    aria-describedby="service-help"
                  >
                    <SelectValue placeholder={t('appointments.selectService')} />
                  </SelectTrigger>
                  <SelectContent role="listbox">
                    {services
                      .filter(s => !formData.business_id || s.business_id === formData.business_id)
                      .map(s => (
                        <SelectItem key={s.id} value={s.id} role="option">
                          <div className="flex justify-between items-center w-full">
                            <span>{s.name}</span>
                            <span 
                              className="text-sm text-muted-foreground ml-2"
                              aria-label={t('appointmentForm.serviceDurationPrice', { duration: s.duration, price: s.price, currency: t('common.currencySymbol') })}
                            >
                              {`${s.duration}min - ${t('common.currencySymbol')}${s.price}`}
                            </span>

                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <div id="service-help" className="sr-only">
                  {t('appointmentForm.help.selectService')}
                </div>
              </div>

              <div className="space-y-2">
                <CustomDateInput
                  id="date"
                  label={`${t('appointments.date')} *`}
                  value={formData.date}
                  onChange={value => handleInputChange('date', value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="min-h-[44px]"
                  aria-describedby="date-help"
                />
                <div id="date-help" className="sr-only">
                  {t('appointmentForm.help.selectDateFuture')}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <TimeInput
                    id="startTime"
                    label={`${t('appointments.startTime')} *`}
                    value={formData.start_time}
                    onChange={e => handleInputChange('start_time', e.target.value)}
                    required
                    className="min-h-[44px]"
                    aria-describedby="start-time-help"
                  />
                  <div id="start-time-help" className="sr-only">
                    {t('appointmentForm.help.startTime')}
                  </div>
                </div>
                <div className="space-y-2">
                  <TimeInput
                    id="endTime"
                    label={t('appointments.endTime')}
                    value={formData.end_time}
                    onChange={e => handleInputChange('end_time', e.target.value)}
                    disabled
                    className="opacity-60 min-h-[44px]"
                    aria-describedby="end-time-help"
                  />
                  <div id="end-time-help" className="sr-only">
                    {t('appointmentForm.help.endTime')}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  {t('appointments.notes')}
                </Label>
                <Textarea
                  id="notes"
                  placeholder={t('appointments.notesPlaceholder')}
                  value={formData.notes}
                  onChange={e => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="min-h-[88px] resize-none"
                  aria-describedby="notes-help"
                />
                <div id="notes-help" className="sr-only">
                  {t('appointmentForm.help.notes')}
                </div>
              </div>
            </section>
          ) : (
            // ...existing code for admin/employee...
            <section aria-labelledby="admin-form-section" className="space-y-4 sm:space-y-6">
              <h3 id="admin-form-section" className="sr-only">{t('appointmentForm.adminInfo')}</h3>
              
              <div className="space-y-2">
                <Label htmlFor="site_name" className="text-sm font-medium">
                  {t('appointmentForm.siteLabel')}
                </Label>
                <Input
                  id="site_name"
                  value={formData.site_name}
                  onChange={e => handleInputChange('site_name', e.target.value)}
                  placeholder={t('appointmentForm.placeholders.siteExample')}
                  className="min-h-[44px]"
                  aria-describedby="site-name-help"
                />
                <div id="site-name-help" className="sr-only">
                  {t('appointmentForm.siteNameHelp')}
                </div>
              </div>
              {/* ...resto de campos originales... */}
            </section>
          )}
          
          <footer className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] order-2 sm:order-1"
              aria-label={t('common.aria.cancelAndClose')}
              title={t('common.cancel')}
            >
              {t('common.cancel')}
            </Button>
            {(() => {
              let submitLabel: string
              let ariaLabel: string
              if (loading) {
                submitLabel = t('common.saving')
                ariaLabel = t('appointmentForm.aria.saving')
              } else if (appointment) {
                submitLabel = t('common.update')
                ariaLabel = t('appointmentForm.aria.update')
              } else {
                submitLabel = t('common.create')
                ariaLabel = t('appointmentForm.aria.create')
              }
              return (
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="min-h-[44px] min-w-[44px] order-1 sm:order-2"
                  aria-label={ariaLabel}
                  title={submitLabel}
                >
                  {submitLabel}
                </Button>
              )
            })()}
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  )


}