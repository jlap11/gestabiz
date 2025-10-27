import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, CurrencyDollar, Tag, Plus, Pencil, Trash } from '@phosphor-icons/react'
import { Service, User } from '@/types'
import { useLanguage } from '@/contexts'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface ServiceFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (service: Partial<Service>) => Promise<void>
  user: User
  service?: Service | null
  businessId: string
}

export function ServiceForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  user, 
  service,
  businessId 
}: Readonly<ServiceFormProps>) {
  const { t } = useLanguage()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 60,
    price: 0,
    currency: 'COP',
    category: ''
  })
  const [loading, setLoading] = useState(false)

  // Reset form when service changes
  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description || '',
        duration: service.duration,
        price: service.price,
        currency: service.currency || 'COP',
        category: service.category || ''
      })
    } else {
      setFormData({
        name: '',
        description: '',
        duration: 60,
        price: 0,
        currency: 'COP',
        category: ''
      })
    }
  }, [service])

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validation
      if (!formData.name.trim()) {
        toast.error(t('validation.serviceNameRequired'))
        return
      }

      if (formData.duration <= 0) {
        toast.error(t('validation.durationRequired'))
        return
      }

      if (formData.price < 0) {
        toast.error(t('validation.invalidPrice'))
        return
      }

      const serviceData: Partial<Service> = {
        ...formData,
        business_id: businessId,
        is_active: true
      }

      await onSubmit(serviceData)
      toast.success(service ? t('services.updated') : t('services.created'))
      onClose()
    } catch (error) {
      toast.error(t('common.error'))
      throw error
    } finally {
      setLoading(false)
    }
  }

  const commonCategories = [
    'Cabello',
    'Belleza',
    'Spa',
    'Masajes',
    'Cuidado Facial',
    'Manicure/Pedicure',
    'Depilación',
    'Consultoría',
    'Fitness',
    'Salud',
    'Otros'
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {service ? t('services.edit') : t('services.create')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Tag className="h-5 w-5 mr-2" />
                {t('services.basicInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="serviceName">{t('services.name')} *</Label>
                <Input
                  id="serviceName"
                  type="text"
                  placeholder={t('services.namePlaceholder')}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceDescription">{t('services.description')}</Label>
                <Textarea
                  id="serviceDescription"
                  placeholder={t('services.descriptionPlaceholder')}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceCategory">{t('services.category')}</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('services.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {commonCategories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Duration and Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <CurrencyDollar className="h-5 w-5 mr-2" />
                {t('services.pricing')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceDuration">{t('services.duration')} (minutos) *</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="serviceDuration"
                      type="number"
                      placeholder="60"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                      className="pl-10"
                      min="15"
                      step="15"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="servicePrice">{t('services.price')} *</Label>
                  <div className="relative">
                    <CurrencyDollar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="servicePrice"
                      type="number"
                      placeholder="100.00"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      className="pl-10"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serviceCurrency">{t('services.currency')}</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => handleInputChange('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COP">COP - Peso Mexicano</SelectItem>
                    <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Service Preview */}
          {formData.name && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('services.preview')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{formData.name}</h3>
                    <Badge variant="outline">{formData.category || 'Sin categoría'}</Badge>
                  </div>
                  
                  {formData.description && (
                    <p className="text-muted-foreground">{formData.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {formData.duration} minutos
                    </div>
                    <div className="flex items-center font-semibold">
                      <CurrencyDollar className="h-4 w-4 mr-1" />
                      {formData.price.toFixed(2)} {formData.currency}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            {(() => {
              let label: string
              if (loading) label = t('common.saving')
              else if (service) label = t('common.update')
              else label = t('common.create')
              return <Button type="submit" disabled={loading}>{label}</Button>
            })()}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Services Management Component
interface ServicesManagementProps {
  user: User
  businessId: string
}

export function ServicesManagement({ user, businessId }: Readonly<ServicesManagementProps>) {
  const { t } = useLanguage()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)

  // Fetch services
  const fetchServices = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', businessId)
        .order('name')

      if (error) throw error

      setServices(data || [])
    } catch (error) {
      toast.error(t('services.fetchError'))
      throw error
    } finally {
      setLoading(false)
    }
  }, [businessId, t])

  useEffect(() => {
    if (businessId) {
      void fetchServices().catch(() => {})
    }
  }, [businessId, fetchServices])

  const handleCreateService = async (serviceData: Partial<Service>) => {
    const { data, error } = await supabase
      .from('services')
      .insert(serviceData)
      .select()
      .single()

    if (error) throw error

    setServices(prev => [...prev, data])
  }

  const handleUpdateService = async (serviceData: Partial<Service>) => {
    if (!editingService) return

    const { data, error } = await supabase
      .from('services')
      .update(serviceData)
      .eq('id', editingService.id)
      .select()
      .single()

    if (error) throw error

    setServices(prev => prev.map(s => s.id === editingService.id ? data : s))
    setEditingService(null)
  }

  const handleDeleteService = async (serviceId: string) => {
    try {
      // 1) Obtener servicio
      const { data: serviceData } = await supabase
        .from('services')
        .select('id, name, business_id')
        .eq('id', serviceId)
        .single()

      // 2) Buscar citas pendientes/activas del servicio y calcular conteo
      const activeStatuses = ['pending', 'confirmed']
      const { data: apptsToCancel, error: fetchApptsError } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          business_id,
          client_id,
          profiles:client_id ( full_name, email )
        `)
        .eq('service_id', serviceId)
        .in('status', activeStatuses)

      if (fetchApptsError) throw fetchApptsError
      const cancelCount = (apptsToCancel ?? []).length

      const confirmed = confirm(
        cancelCount > 0
          ? `¿Estás seguro de eliminar este servicio? Se cancelarán ${cancelCount} cita(s) y se notificará a los clientes.`
          : t('services.deleteConfirm')
      )
      if (!confirmed) return

      // 3) Cancelar citas en bloque
      if (cancelCount > 0) {
        const { error: cancelError } = await supabase
          .from('appointments')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancel_reason: 'Servicio eliminado' })
          .eq('service_id', serviceId)
          .in('status', activeStatuses)

        if (cancelError) throw cancelError
      }

      // 4) Notificar por correo a clientes afectados (si tienen email)
      for (const appt of (apptsToCancel ?? [])) {
        const recipientEmail = appt?.profiles?.email
        const recipientName = appt?.profiles?.full_name || 'Cliente'
        if (!recipientEmail) continue

        const startDate = new Date(appt.start_time)
        const dateStr = startDate.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
        const timeStr = startDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'appointment_cancellation',
            recipient_user_id: appt.client_id,
            recipient_email: recipientEmail,
            recipient_name: recipientName,
            business_id: appt.business_id,
            appointment_id: appt.id,
            data: {
              name: recipientName,
              date: dateStr,
              time: timeStr,
              service: serviceData?.name || 'Servicio'
            }
          }
        })
      }

      // 5) Desactivar el servicio (soft-delete)
      const { error: deactivateError } = await supabase
        .from('services')
        .update({ is_active: false })
        .eq('id', serviceId)

      if (deactivateError) throw deactivateError

      setServices(prev => prev.filter(s => s.id !== serviceId))
      toast.success(
        cancelCount > 0
          ? 'Servicio eliminado: se cancelaron ' + cancelCount + ' cita(s) y clientes notificados'
          : t('services.deleted')
      )
    } catch (error) {
      toast.error(t('services.deleteError'))
      throw error
    }
  }

  const handleSubmitService = editingService ? handleUpdateService : handleCreateService

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{t('services.management')}</h2>
          <p className="text-muted-foreground">{t('services.managementDescription')}</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('services.create')}
        </Button>
      </div>

      {/* Services Grid */}
      {services.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Tag className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('services.noServices')}</h3>
            <p className="text-muted-foreground text-center mb-4">
              {t('services.noServicesDescription')}
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('services.createFirst')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(service => (
            <Card key={service.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    {service.category && (
                      <Badge variant="outline" className="mt-1">
                        {service.category}
                      </Badge>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingService(service)
                        setShowForm(true)
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { void handleDeleteService(service.id).catch(() => {}) }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {service.description && (
                  <p className="text-muted-foreground text-sm mb-3">
                    {service.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {service.duration} min
                  </div>
                  <div className="flex items-center font-semibold">
                    <CurrencyDollar className="h-4 w-4 mr-1" />
                    {service.price.toFixed(2)} {service.currency}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Service Form */}
      <ServiceForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingService(null)
        }}
        onSubmit={handleSubmitService}
        user={user}
        service={editingService}
        businessId={businessId}
      />
    </div>
  )
}
