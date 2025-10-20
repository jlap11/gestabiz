import React, { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CustomDateInput } from '@/components/ui/custom-date-input'
import { TimeInput } from '@/components/ui/time-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

export function AppointmentForm({ isOpen, onClose, onSubmit, user, appointment }: Readonly<AppointmentFormProps>) {
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const supabaseData = useSupabaseData({ user, autoFetch: true });
  
  // Solo usar datos reales de Supabase
  const memoBusinesses = useMemo(() => {
    return supabaseData.businesses || [];
  }, [supabaseData.businesses]);

  const memoServices = useMemo(() => {
    return supabaseData.services || [];
  }, [supabaseData.services]);

  const businesses = memoBusinesses;
  const services = memoServices;


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
    client_name: user.activeRole === 'client' ? (user.name || 'Cliente') : '',
    client_email: '',
    client_phone: '',
    date: '',
    start_time: '',
    end_time: '',
    notes: '',
    status: 'scheduled'
  });

  useEffect(() => {
    if (appointment) {
      const startDate = new Date(appointment.start_time);
      const endDate = new Date(appointment.end_time);
      setFormData({
        business_id: appointment.business_id,
        service_id: appointment.service_id || '',
        location_id: appointment.location_id || '',
        site_name: appointment.site_name || '',
        title: appointment.title || '',
        client_name: appointment.client_name || (user.activeRole === 'client' ? (user.name || 'Cliente') : ''),
        client_email: appointment.client_email || '',
        client_phone: appointment.client_phone || '',
        date: startDate.toISOString().split('T')[0],
        start_time: startDate.toTimeString().slice(0, 5),
        end_time: endDate.toTimeString().slice(0, 5),
        notes: appointment.notes || '',
        status: appointment.status
      });
    } else {
      const defaultBusinessId = businesses && businesses.length > 0 ? businesses[0].id : '';
      setFormData({
        business_id: defaultBusinessId,
        service_id: '',
        location_id: '',
        site_name: '',
        title: '',
        client_name: user.activeRole === 'client' ? (user.name || 'Cliente') : '',
        client_email: '',
        client_phone: '',
        date: '',
        start_time: '',
        end_time: '',
        notes: '',
        status: 'scheduled'
      });
    }
  }, [appointment, businesses, user.activeRole, user.name]);

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
      ...(user.activeRole === 'client' && { client_name: user.name || 'Cliente' })
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.client_name.trim()) {
        toast.error(t('validation.clientNameRequired'))
        return
      }
      if (!formData.date) {
        toast.error(t('validation.dateRequired'))
        return
      }
      if (!formData.start_time) {
        toast.error(t('validation.startTimeRequired'))
        return
      }
      if (!formData.service_id) {
        toast.error(t('validation.serviceRequired'))
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
        title: formData.title.trim() || `${services.find(s => s.id === formData.service_id)?.name || 'Cita'} - ${formData.client_name}`,
        client_name: formData.client_name,
        client_email: formData.client_email,
        client_phone: formData.client_phone
      }

      await onSubmit(appointmentData)
      toast.success(appointment ? t('appointments.updated') : t('appointments.created'))
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {appointment ? t('appointments.edit') : t('appointments.create')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personalización para cliente: solo campos esenciales */}
          {user.activeRole === 'client' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="business">Negocio *</Label>
                <Select value={formData.business_id} onValueChange={(v) => handleInputChange('business_id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.placeholders.selectBusiness')} />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="service">{t('appointments.service')} *</Label>
                <Select value={formData.service_id} onValueChange={(v) => handleInputChange('service_id', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('appointments.selectService')} />
                  </SelectTrigger>
                  <SelectContent>
                    {services.filter(s => !formData.business_id || s.business_id === formData.business_id).map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        <div className="flex justify-between items-center w-full">
                          <span>{s.name}</span>
                          <span className="text-sm text-muted-foreground ml-2">{`${s.duration}min - $${s.price}`}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <CustomDateInput
                  id="date"
                  label={`${t('appointments.date')} *`}
                  value={formData.date}
                  onChange={(value) => handleInputChange('date', value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TimeInput
                  id="startTime"
                  label={`${t('appointments.startTime')} *`}
                  value={formData.start_time}
                  onChange={(e) => handleInputChange('start_time', e.target.value)}
                  required
                />
                <TimeInput
                  id="endTime"
                  label={t('appointments.endTime')}
                  value={formData.end_time}
                  onChange={(e) => handleInputChange('end_time', e.target.value)}
                  disabled
                  className="opacity-60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">{t('appointments.notes')}</Label>
                <Textarea id="notes" placeholder={t('appointments.notesPlaceholder')} value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} rows={3} />
              </div>
            </>
          ) : (
            // ...existing code for admin/employee...
            <>
              <div className="space-y-2">
                <Label htmlFor="site_name">Nombre del sitio/negocio/local</Label>
                <Input id="site_name" value={formData.site_name} onChange={e => handleInputChange('site_name', e.target.value)} placeholder="Ejemplo: Barbería Central, Café Luna..." />
              </div>
              {/* ...resto de campos originales... */}
            </>
          )}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
            {(() => {
              let submitLabel: string
              if (loading) {
                submitLabel = t('common.saving')
              } else if (appointment) {
                submitLabel = t('common.update')
              } else {
                submitLabel = t('common.create')
              }
              return <Button type="submit" disabled={loading}>{submitLabel}</Button>
            })()}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export interface LegacyAppointmentFormProps {
  user: User
  clients: Client[]
  appointment: Appointment | null
  onSave: (appointment: Omit<Appointment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void> | void
  onCancel: () => void
}

export default function LegacyAppointmentForm({ user, clients, appointment, onSave, onCancel }: Readonly<LegacyAppointmentFormProps>) {
  const { t } = useLanguage()
  const [title, setTitle] = useState(appointment?.title || '')
  // Si es cliente final, usar su propio id por defecto y ocultar selección
  const [clientId, setClientId] = useState(
    appointment?.client_id || (user.activeRole === 'client' ? user.id : (clients[0]?.id ?? ''))
  )
  const [date, setDate] = useState<string>(() => appointment ? new Date(appointment.start_time).toISOString().split('T')[0] : '')
  const [startTime, setStartTime] = useState<string>(() => appointment ? new Date(appointment.start_time).toTimeString().slice(0,5) : '')
  const [endTime, setEndTime] = useState<string>(() => appointment ? new Date(appointment.end_time).toTimeString().slice(0,5) : '')
  const [status, setStatus] = useState<Appointment['status']>(appointment?.status || 'scheduled')
  const [description, setDescription] = useState(appointment?.description || '')

  useEffect(() => {
    if (appointment) {
      setTitle(appointment.title || '')
      setClientId(appointment.client_id)
      setDate(new Date(appointment.start_time).toISOString().split('T')[0])
      setStartTime(new Date(appointment.start_time).toTimeString().slice(0,5))
      setEndTime(new Date(appointment.end_time).toTimeString().slice(0,5))
      setStatus(appointment.status)
      setDescription(appointment.description || '')
    }
  }, [appointment])

  const timeOptions = useMemo(() => {
    const times: string[] = []
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        times.push(timeStr)
      }
    }
    return times
  }, [])

  const today = new Date().toISOString().split('T')[0]

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const selectedClient = clients.find(c => c.id === clientId)
    // Para cliente final, forzar clientId = user.id
    const effectiveClientId = user.activeRole === 'client' ? user.id : clientId
    if (!title.trim() || !effectiveClientId || !date || !startTime || !endTime) return

    const startISO = new Date(`${date}T${startTime}:00`).toISOString()
    const endISO = new Date(`${date}T${endTime}:00`).toISOString()

  const payload: Partial<Appointment> = {
      user_id: user.id,
      client_id: effectiveClientId,
      title: title.trim(),
      description: description.trim(),
      start_time: startISO,
      end_time: endISO,
  status: status,
      // legacy helpers for UI rendering
      date,
      startTime,
      endTime,
      client_name: user.activeRole === 'client' ? (user.name || '') : (selectedClient?.name || ''),
      clientName: user.activeRole === 'client' ? (user.name || '') : (selectedClient?.name || '')
  }
  // status está asegurado por el estado local, forzamos tipo requerido para el handler
  onSave(payload as Omit<Appointment, 'id' | 'userId' | 'createdAt' | 'updatedAt'>)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar size={20} />
            {appointment ? t('appointments.edit') : t('appointments.create')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">{t('appointments.title') || 'Title'}</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>

              {user.activeRole !== 'client' && (
                <div className="space-y-2">
                  <Label htmlFor="client">{t('appointments.client') || 'Client'}</Label>
                  <Select value={clientId} onValueChange={setClientId} required>
                    <SelectTrigger>
                      <SelectValue placeholder={t('appointments.selectClient') || 'Select client'} />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.length === 0 ? (
                        <SelectItem value="no-clients" disabled>
                          {t('clients.none') || 'No clients available'}
                        </SelectItem>
                      ) : (
                        clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="date">{t('appointments.date') || 'Date'}</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} min={today} required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="startTime">{t('appointments.startTime') || 'Start time'}</Label>
                  <Select value={startTime} onValueChange={setStartTime} required>
                    <SelectTrigger>
                      <SelectValue placeholder="08:00" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {timeOptions.map((time) => (
                        <SelectItem key={`start-${time}`} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">{t('appointments.endTime') || 'End time'}</Label>
                  <Select value={endTime} onValueChange={setEndTime} required>
                    <SelectTrigger>
                      <SelectValue placeholder="09:00" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {timeOptions.map((time) => (
                        <SelectItem key={`end-${time}`} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {appointment && (
                <div className="space-y-2">
                  <Label htmlFor="status">{t('appointments.status') || 'Status'}</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as Appointment['status'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">{t('status.pending') || 'Scheduled'}</SelectItem>
                      <SelectItem value="confirmed">{t('status.confirmed') || 'Confirmed'}</SelectItem>
                      <SelectItem value="in_progress">{t('status.inProgress') || 'In progress'}</SelectItem>
                      <SelectItem value="completed">{t('status.completed') || 'Completed'}</SelectItem>
                      <SelectItem value="cancelled">{t('status.cancelled') || 'Cancelled'}</SelectItem>
                      <SelectItem value="no_show">{t('status.noShow') || 'No show'}</SelectItem>
                      <SelectItem value="rescheduled">{t('status.rescheduled') || 'Rescheduled'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">{t('appointments.description') || 'Description'}</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onCancel}>{t('common.cancel') || 'Cancel'}</Button>
                <Button type="submit">{appointment ? (t('common.update') || 'Update') : (t('common.create') || 'Create')}</Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
