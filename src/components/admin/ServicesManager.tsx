import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Briefcase,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Clock,
  MapPin,
  Users,
  X,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { toast } from 'sonner'

interface Service {
  id: string
  business_id: string
  name: string
  description?: string
  duration_minutes: number
  price: number
  currency: string
  category?: string
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Location {
  id: string
  name: string
}

interface Employee {
  id: string
  employee_id: string
  profiles?: {
    full_name?: string
    email?: string
  }
}

interface ServicesManagerProps {
  businessId: string
}

const initialFormData: Omit<Service, 'id' | 'created_at' | 'updated_at' | 'business_id'> = {
  name: '',
  description: '',
  duration_minutes: 60,
  price: 0,
  currency: 'COP',
  category: undefined,
  image_url: undefined,
  is_active: true,
}

export function ServicesManager({ businessId }: Readonly<ServicesManagerProps>) {
  const { t } = useLanguage();
  const [services, setServices] = useState<Service[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formData, setFormData] = useState(initialFormData)
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [priceDisplay, setPriceDisplay] = useState('')
  const [pendingImageFiles, setPendingImageFiles] = useState<File[]>([])

  // Formatear precio con separadores de miles
  const formatPrice = (value: number): string => {
    if (value === 0 || isNaN(value)) return ''
    return value.toLocaleString('es-CO')
  }

  // Limpiar formato y obtener número
  const parseFormattedPrice = (value: string): number => {
    const cleaned = value.replace(/[^\d]/g, '')
  return cleaned === '' ? 0 : Number.parseInt(cleaned)
  }

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

      if (servicesError) throw servicesError

      // Fetch locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('id, name')
        .eq('business_id', businessId)
        .eq('is_active', true)

      if (locationsError) throw locationsError

      // Fetch employees (IMPORTANTE: business_employees usa employee_id NO user_id)
      const { data: employeesData, error: employeesError } = await supabase
        .from('business_employees')
        .select(`
          id,
          employee_id,
          profiles:employee_id (
            full_name,
            email
          )
        `)
        .eq('business_id', businessId)

      if (employeesError) throw employeesError

      // Establecer datos (pueden ser arrays vacíos, no es error)
      setServices(servicesData || [])
      setLocations(locationsData || [])
      setEmployees(employeesData || [])
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error al cargar datos:', error)
      toast.error(t('admin.serviceValidation.loadError'))
      // En caso de error, establecer arrays vacíos para no romper la UI
      setServices([])
      setLocations([])
      setEmployees([])
    } finally {
      setIsLoading(false)
    }
  }, [businessId, t])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const fetchServiceAssignments = async (serviceId: string) => {
    try {
      // Fetch location assignments
      const { data: locationAssignments } = await supabase
        .from('location_services')
        .select('location_id')
        .eq('service_id', serviceId)

      // Fetch employee assignments
      const { data: employeeAssignments } = await supabase
        .from('employee_services')
        .select('employee_id')
        .eq('service_id', serviceId)

      setSelectedLocations(locationAssignments?.map((a) => a.location_id) || [])
      setSelectedEmployees(employeeAssignments?.map((a) => a.employee_id) || [])
    } catch {
      toast.error(t('admin.serviceValidation.assignError'))
    }
  }

  const handleOpenDialog = async (service?: Service) => {
    if (service) {
      setEditingService(service)
      setFormData({
        name: service.name,
        description: service.description || '',
        duration_minutes: service.duration_minutes,
        price: service.price,
        currency: service.currency || 'COP',
        category: service.category,
        image_url: service.image_url,
        is_active: service.is_active,
      })
      setPriceDisplay(formatPrice(service.price))
      setPendingImageFiles([])
      await fetchServiceAssignments(service.id)
    } else {
      setEditingService(null)
      setFormData(initialFormData)
      setPriceDisplay('')
      setPendingImageFiles([])
      setSelectedLocations([])
      setSelectedEmployees([])
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingService(null)
    setFormData(initialFormData)
    setPriceDisplay('')
    setPendingImageFiles([])
    setSelectedLocations([])
    setSelectedEmployees([])
  }

  const handleChange = (field: keyof typeof formData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePriceChange = (value: string) => {
    // Actualizar display con formato
    setPriceDisplay(value)
    // Actualizar formData con valor numérico
    const numericValue = parseFormattedPrice(value)
    setFormData((prev) => ({ ...prev, price: numericValue }))
  }

  const handlePriceBlur = () => {
    // Reformatear al perder el foco
    setPriceDisplay(formatPrice(formData.price))
  }

  const handleToggleLocation = (locationId: string) => {
    setSelectedLocations((prev) =>
      prev.includes(locationId)
        ? prev.filter((id) => id !== locationId)
        : [...prev, locationId]
    )
  }

  const handleToggleEmployee = (employeeId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error(t('admin.serviceValidation.nameRequired'))
      return
    }

    if (formData.price < 0) {
      toast.error(t('admin.serviceValidation.priceRequired'))
      return
    }

    if (formData.duration_minutes <= 0) {
      toast.error(t('admin.serviceValidation.durationRequired'))
      return
    }

    setIsSaving(true)
    try {
      let serviceId: string

      if (editingService) {
        // Update existing service
        const serviceData = {
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          duration_minutes: formData.duration_minutes,
          price: formData.price,
          currency: formData.currency || 'COP',
          category: formData.category || null,
          image_url: formData.image_url || null,
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        }

        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id)

        if (error) throw error
        serviceId = editingService.id
        toast.success(t('admin.serviceValidation.updateSuccess'))
      } else {
        // Create new service (no incluir updated_at en INSERT)
        const newServiceData = {
          business_id: businessId,
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          duration_minutes: formData.duration_minutes,
          price: formData.price,
          currency: formData.currency || 'COP',
          category: formData.category || null,
          is_active: formData.is_active,
        }

        const { data, error } = await supabase
          .from('services')
          .insert(newServiceData)
          .select()
          .single()

        if (error) {
          // eslint-disable-next-line no-console
          console.error('Error creating service:', error)
          throw error
        }
        serviceId = data.id

        // Subir imágenes pendientes con el service_id real
        if (pendingImageFiles.length > 0) {
          toast.info(t('common.messages.uploadingImages'))
          const uploadedUrls: string[] = []

          for (const file of pendingImageFiles) {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
            const filePath = `services/${serviceId}/${fileName}`

            const { error: uploadError } = await supabase.storage
              .from('service-images')
              .upload(filePath, file)

            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage
                .from('service-images')
                .getPublicUrl(filePath)
              uploadedUrls.push(publicUrl)
            }
          }

          // Actualizar servicio con la URL de la imagen
          if (uploadedUrls.length > 0) {
            await supabase
              .from('services')
              .update({ image_url: uploadedUrls[0] })
              .eq('id', serviceId)
          }
        }

        toast.success(t('admin.serviceValidation.createSuccess'))
      }

      // Update location assignments
      await supabase.from('location_services').delete().eq('service_id', serviceId)
      if (selectedLocations.length > 0) {
        const locationAssignments = selectedLocations.map((locId) => ({
          location_id: locId,
          service_id: serviceId,
        }))
        await supabase.from('location_services').insert(locationAssignments)
      }

      // Update employee assignments
      await supabase.from('employee_services').delete().eq('service_id', serviceId)
      if (selectedEmployees.length > 0) {
        const employeeAssignments = selectedEmployees.map((empId) => ({
          employee_id: empId,
          service_id: serviceId,
        }))
        await supabase.from('employee_services').insert(employeeAssignments)
      }

      await fetchData()
      handleCloseDialog()
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error('Error en handleSubmit:', error)
      const err = error as { message?: string }
      const errorMessage = err?.message || undefined
      toast.error(
        editingService
          ? `${t('common.messages.updateError')}${errorMessage ? `: ${errorMessage}` : ''}`
          : `${t('common.messages.createError')}${errorMessage ? `: ${errorMessage}` : ''}`
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageUploaded = (urls: string[]) => {
    if (urls.length > 0) {
      setFormData((prev) => ({ ...prev, image_url: urls[0] }))
    }
  }

  const handleDelete = async (serviceId: string) => {
    if (!confirm(t('admin.actions.confirmDeleteService'))) {
      return
    }

    try {
      // Delete assignments first
      await supabase.from('location_services').delete().eq('service_id', serviceId)
      await supabase.from('employee_services').delete().eq('service_id', serviceId)

      // Delete service
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId)

      if (error) throw error
      toast.success(t('admin.serviceValidation.deleteSuccess'))
      await fetchData()
    } catch {
      toast.error(t('admin.serviceValidation.deleteError'))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">{t('admin.services.title')}</h2>
            <p className="text-muted-foreground text-xs sm:text-sm">{t('admin.services.subtitle')}</p>
          </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-primary hover:bg-primary/90 w-full sm:w-auto min-h-[44px]"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{t('admin.actions.addService')}</span>
          <span className="sm:hidden">{t('admin.actions.newService')}</span>
        </Button>
      </div>

      {/* Services Grid - Responsive */}
      {services.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
            <Briefcase className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">{t('admin.services.noServicesTitle')}</h3>
            <p className="text-muted-foreground text-center mb-4 text-sm sm:text-base">
              {t('admin.services.noServicesDesc')}
            </p>
                    <Button
                      onClick={() => handleOpenDialog()}
                      className="bg-primary hover:bg-primary/90 min-h-[44px] w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t('admin.actions.createFirstService')}
                    </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {services.map((service) => (
            <Card key={service.id} className="bg-card border-border hover:border-border/80 transition-colors">
              <CardHeader className="p-3 sm:p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {service.image_url && (
                      <img
                        src={service.image_url}
                        alt={service.name}
                        className="w-full h-28 sm:h-32 object-cover rounded-lg mb-2 sm:mb-3"
                      />
                    )}
                    <CardTitle className="text-foreground text-base sm:text-lg truncate">{service.name}</CardTitle>
                    {!service.is_active && (
                      <Badge variant="secondary" className="mt-2 text-[10px] sm:text-xs">
                        Inactivo
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1 sm:gap-2 ml-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(service)}
                      className="text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px]"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(service.id)}
                      className="text-muted-foreground hover:text-red-400 min-w-[44px] min-h-[44px]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-6">
                {service.description && (
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                )}
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-400 flex-shrink-0" />
                  <span className="text-foreground font-semibold">
                    $ {service.price.toLocaleString('es-CO')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
                  <span className="text-muted-foreground">{service.duration_minutes} minutos</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog - Mobile Responsive */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="bg-card border-border text-foreground max-w-[95vw] sm:max-w-3xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {editingService ? t('admin.actions.editService') : t('admin.actions.createService')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingService
                ? t('admin.actions.updateServiceInfo')
                : t('admin.actions.completeServiceInfo')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <Label htmlFor="name" className="text-sm sm:text-base">{t('admin.services.nameLabel')}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder={t('admin.services.namePlaceholder')}
                required
                className="min-h-[44px]"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-sm sm:text-base">{t('admin.services.descriptionLabel')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder={t('admin.services.descriptionPlaceholder')}
                rows={3}
                className="min-h-[88px]"
              />
            </div>

            {/* Duration & Price - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="duration_minutes" className="text-sm sm:text-base">{t('admin.services.durationLabel')}</Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  min="1"
                  value={formData.duration_minutes}
                  onChange={(e) => handleChange('duration_minutes', parseInt(e.target.value) || 0)}
                  required
                  className="min-h-[44px]"
                />
              </div>
              <div>
                <Label htmlFor="price" className="text-sm sm:text-base">{t('admin.services.priceLabel')}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm sm:text-base">
                    $
                  </span>
                  <Input
                    id="price"
                    type="text"
                    value={priceDisplay}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    onBlur={handlePriceBlur}
                    placeholder="0"
                    className="pl-8 min-h-[44px]"
                    required
                  />
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  {formData.price > 0 && `$ ${formatPrice(formData.price)}`}
                </p>
              </div>
            </div>

            {/* Image Upload (OPCIONAL) */}
            <div>
              <Label>{t('admin.services.imageLabel')}</Label>
              <p className="text-xs text-muted-foreground mb-2">
                {t('admin.services.imageDesc')}
              </p>
              {formData.image_url ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden mb-2">
                  <img
                    src={formData.image_url}
                    alt="Servicio"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      handleChange('image_url', '')
                      setPendingImageFiles([])
                    }}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : pendingImageFiles.length > 0 ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden mb-2 bg-muted">
                  <img
                    src={URL.createObjectURL(pendingImageFiles[0])}
                    alt="Vista previa"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setPendingImageFiles([])}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : editingService ? (
                <ImageUploader
                  bucket="service-images"
                  maxFiles={1}
                  maxSizeMB={5}
                  onUploadComplete={handleImageUploaded}
                  onUploadError={(error) => toast.error(error)}
                  folderPath={`services/${editingService.id}`}
                />
              ) : (
                <ImageUploader
                  bucket="service-images"
                  maxFiles={1}
                  maxSizeMB={5}
                  delayedUpload={true}
                  onFileSelected={(files) => setPendingImageFiles(Array.isArray(files) ? files : [files])}
                  onUploadError={(error) => toast.error(error)}
                  folderPath="temp"
                />
              )}
            </div>

            {/* Location Assignment */}
            {locations.length > 0 && (
              <div>
                <Label className="mb-2 block">Disponible en las siguientes sedes:</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-border rounded-lg p-3">
                  {locations.map((location) => (
                    <div key={location.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`location-${location.id}`}
                        checked={selectedLocations.includes(location.id)}
                        onCheckedChange={() => handleToggleLocation(location.id)}
                      />
                      <label
                        htmlFor={`location-${location.id}`}
                        className="text-sm text-foreground cursor-pointer flex items-center gap-2"
                      >
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {location.name}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedLocations.length === 0 && (
                  <p className="text-xs text-amber-400 mt-1">
                    Debes seleccionar al menos una sede
                  </p>
                )}
              </div>
            )}

            {/* Employee Assignment */}
            {employees.length > 0 && (
              <div>
                <Label className="mb-2 block">Prestado por:</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-border rounded-lg p-3">
                  {employees.map((employee) => (
                    <div key={employee.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`employee-${employee.id}`}
                        checked={selectedEmployees.includes(employee.id)}
                        onCheckedChange={() => handleToggleEmployee(employee.id)}
                      />
                      <label
                        htmlFor={`employee-${employee.id}`}
                        className="text-sm text-foreground cursor-pointer flex items-center gap-2"
                      >
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {employee.profiles?.full_name || employee.profiles?.email || 'Sin nombre'}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Status */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleChange('is_active', checked as boolean)}
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                {t('admin.services.activeLabel')}
              </Label>
            </div>

            {/* compute submit label to avoid nested ternary in JSX */}
            {/**/}
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="ghost"
                onClick={handleCloseDialog}
                disabled={isSaving}
                className="min-h-[44px] w-full sm:w-auto"
              >
                {t('common.actions.cancel')}
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 min-h-[44px] w-full sm:w-auto"
                disabled={isSaving}
              >
                {(() => {
                  if (isSaving) return t('common.actions.saving')
                  return editingService ? t('common.actions.update') : t('common.actions.create')
                })()}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
