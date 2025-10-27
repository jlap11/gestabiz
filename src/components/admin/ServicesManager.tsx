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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
    avatar_url?: string
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

export function ServicesManager({ businessId }: ServicesManagerProps) {
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
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [profileService, setProfileService] = useState<Service | null>(null)
  const [profileEmployees, setProfileEmployees] = useState<string[]>([])
  const [profileLocations, setProfileLocations] = useState<string[]>([])

  // Formatear precio con separadores de miles
  const formatPrice = (value: number): string => {
    if (value === 0 || isNaN(value)) return ''
    return value.toLocaleString('es-CO')
  }

  // Limpiar formato y obtener número
  const parseFormattedPrice = (value: string): number => {
    const cleaned = value.replace(/[^\d]/g, '')
    return cleaned === '' ? 0 : parseInt(cleaned)
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
            email,
            avatar_url
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
      toast.error('Error al cargar los datos')
      // En caso de error, establecer arrays vacíos para no romper la UI
      setServices([])
      setLocations([])
      setEmployees([])
    } finally {
      setIsLoading(false)
    }
  }, [businessId])

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
      toast.error('Error al cargar asignaciones')
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
      toast.error('El nombre del servicio es requerido')
      return
    }

    if (formData.price < 0) {
      toast.error('El precio debe ser mayor o igual a 0')
      return
    }

    if (formData.duration_minutes <= 0) {
      toast.error('La duración debe ser mayor a 0')
      return
    }

    setIsSaving(true)
    try {
      let serviceId: string

      if (editingService) {
        // Update existing service
        // Subida diferida: si hay archivo pendiente, subir primero y calcular nueva URL
        let nextImageUrl: string | null | undefined = formData.image_url || null
        if (pendingImageFiles.length > 0) {
          const file = pendingImageFiles[0]

          // Eliminar imagen anterior si existía y era de Supabase
          const prevUrl = formData.image_url || editingService.image_url
          if (prevUrl && prevUrl.includes('supabase')) {
            const cleanPrev = prevUrl.split('?')[0]
            const oldName = cleanPrev.split('/').pop()
            if (oldName) {
              const oldPath = `${editingService.id}/${oldName}`
              await supabase.storage
                .from('service-images')
                .remove([oldPath])
                .catch(() => {})
            }
          }

          // Subir nueva imagen al bucket con prefijo del servicio
          const fileExt = file.name.split('.').pop()
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
          const filePath = `${editingService.id}/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('service-images')
            .upload(filePath, file)

          if (uploadError) throw uploadError

          const {
            data: { publicUrl },
          } = supabase.storage.from('service-images').getPublicUrl(filePath)

          nextImageUrl = publicUrl
        }

        const serviceData = {
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          duration_minutes: formData.duration_minutes,
          price: formData.price,
          currency: formData.currency || 'COP',
          category: formData.category || null,
          image_url: nextImageUrl || null,
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        }

        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id)

        if (error) throw error
        serviceId = editingService.id
        setPendingImageFiles([])
        toast.success('Servicio actualizado exitosamente')
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
          toast.info('Subiendo imágenes...')
          const uploadedUrls: string[] = []

          for (const file of pendingImageFiles) {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
            const filePath = `${serviceId}/${fileName}`

            const { error: uploadError } = await supabase.storage
              .from('service-images')
              .upload(filePath, file)

            if (!uploadError) {
              const {
                data: { publicUrl },
              } = supabase.storage.from('service-images').getPublicUrl(filePath)
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

        toast.success('Servicio creado exitosamente')
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
        // Crear asignaciones por cada sede seleccionada
        const employeeAssignments = (selectedLocations.length > 0
          ? selectedLocations
          : [null]
        ).flatMap((locId) =>
          selectedEmployees.map((empId) => ({
            employee_id: empId,
            service_id: serviceId,
            business_id: businessId,
            ...(locId ? { location_id: locId } : {}),
            is_active: true,
          }))
        )
        await supabase.from('employee_services').insert(employeeAssignments)
      }

      await fetchData()
      handleCloseDialog()
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error('Error en handleSubmit:', error)
      const errorMessage = error?.message || 'Error desconocido'
      toast.error(
        editingService 
          ? `Error al actualizar el servicio: ${errorMessage}` 
          : `Error al crear el servicio: ${errorMessage}`
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleImageUploaded = async (urls: string[]) => {
    if (urls.length > 0) {
      if (editingService) {
        const prevUrl = formData.image_url || editingService.image_url
        if (prevUrl && prevUrl.includes("supabase")) {
          const cleanPrev = prevUrl.split("?")[0]
          const oldName = cleanPrev.split("/").pop()
          if (oldName) {
            const oldPath = `${editingService.id}/${oldName}`
            await supabase.storage.from("service-images").remove([oldPath]).catch(() => {})
          }
        }
      }
      setFormData((prev) => ({ ...prev, image_url: urls[0] }))
    }
  }

  const handleDelete = async (serviceId: string) => {
    if (!confirm('¿Estás seguro de eliminar este servicio? Esta acción no se puede deshacer.')) {
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
      toast.success('Servicio eliminado exitosamente')
      await fetchData()
    } catch {
      toast.error('Error al eliminar el servicio')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
      </div>
    )
  }

  const openProfile = async (service: Service) => {
    setProfileService(service)
    try {
      const { data: locAssign } = await supabase
        .from('location_services')
        .select('location_id')
        .eq('service_id', service.id)
      const { data: empAssign } = await supabase
        .from('employee_services')
        .select('employee_id')
        .eq('service_id', service.id)
      setProfileLocations((locAssign || []).map((a: any) => a.location_id))
      setProfileEmployees((empAssign || []).map((a: any) => a.employee_id))

      // Console log para verificar vinculación real en DB
      if ((empAssign || []).length > 0) {
        const employeeIds = (empAssign || []).map((a: any) => a.employee_id)
        const { data: memberships, error: membershipsError } = await supabase
          .from('business_employees')
          .select('employee_id, business_id, location_id, status, is_active')
          .eq('business_id', service.business_id)
          .in('employee_id', employeeIds)
        // eslint-disable-next-line no-console
        console.log('[Perfil Sede] Verificación vinculación en DB', {
          serviceId: service.id,
          businessId: service.business_id,
          locationsAsignadasAlServicio: (locAssign || []).map((a: any) => a.location_id),
          empleadosAsignadosAlServicio: employeeIds,
          membershipsError,
          memberships
        })
      }
    } catch {
      toast.error('Error al cargar asignaciones')
      setProfileLocations([])
      setProfileEmployees([])
    }
    setIsProfileOpen(true)
  }

  const closeProfile = () => {
    setIsProfileOpen(false)
    setProfileService(null)
    setProfileLocations([])
    setProfileEmployees([])
  }

  return (
    <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">Servicios</h2>
          <p className="text-muted-foreground text-xs sm:text-sm">Gestiona los servicios que ofreces</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-primary hover:bg-primary/90 w-full sm:w-auto min-h-[44px]"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Agregar Servicio</span>
          <span className="sm:hidden">Nuevo Servicio</span>
        </Button>
      </div>

      {/* Services Grid - Responsive */}
      {services.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
            <Briefcase className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No hay servicios aún</h3>
            <p className="text-muted-foreground text-center mb-4 text-sm sm:text-base">
              Agrega tu primer servicio para que los clientes puedan reservar citas
            </p>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-primary hover:bg-primary/90 min-h-[44px] w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Primer Servicio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {services.map((service) => (
            <Card
              key={service.id}
              className="group relative overflow-hidden border-border hover:border-border/80 transition-colors cursor-pointer"
              onClick={() => openProfile(service)}
            >
              <div
                className="relative h-40 sm:h-48 w-full"
                style={{
                  backgroundImage: service.image_url ? `url(${service.image_url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {!service.image_url && <div className="absolute inset-0 bg-muted" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />

                <div className="absolute top-2 right-2 z-20 flex gap-1 sm:gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-white/80 hover:bg-white text-gray-800 hover:text-gray-900 rounded-full shadow"
                    onClick={(e) => { e.stopPropagation(); handleOpenDialog(service) }}
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="bg-white/80 hover:bg-white text-red-600 hover:text-red-700 rounded-full shadow"
                    onClick={(e) => { e.stopPropagation(); handleDelete(service.id) }}
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 z-10 p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <h3 className="text-white font-semibold text-base sm:text-lg truncate">{service.name}</h3>
                      {service.description && (
                        <p className="text-white/80 text-xs sm:text-sm line-clamp-2">{service.description}</p>
                      )}
                    </div>
                    {!service.is_active && (
                      <Badge variant="secondary" className="bg-white/90 text-gray-800 text-[10px] sm:text-xs">Inactivo</Badge>
                    )}
                  </div>
                </div>
              </div>

              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-foreground">
                    <DollarSign className="h-4 w-4 text-green-400" />
                    <span className="font-semibold">$ {service.price.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <span>{service.duration_minutes} minutos</span>
                  </div>
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
              {editingService ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingService
                ? 'Actualiza la información del servicio'
                : 'Completa la información del nuevo servicio'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <Label htmlFor="name" className="text-sm sm:text-base">Nombre del Servicio *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ej: Corte de Cabello"
                required
                className="min-h-[44px]"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-sm sm:text-base">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe el servicio"
                rows={3}
                className="min-h-[88px]"
              />
            </div>

            {/* Duration & Price - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="duration_minutes" className="text-sm sm:text-base">Duración (minutos) *</Label>
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
                <Label htmlFor="price" className="text-sm sm:text-base">Precio *</Label>
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
              <Label>Imagen del Servicio (Opcional)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Puedes subir una imagen para mostrar resultados o ejemplos del servicio
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
                  delayedUpload={true}
                  onFileSelected={(file) => setPendingImageFiles([file])}
                  onUploadError={(error) => toast.error(error)}
                  folderPath={`${editingService.id}`}
                />
              ) : (
                <ImageUploader
                  bucket="service-images"
                  maxFiles={1}
                  maxSizeMB={5}
                  delayedUpload={true}
                  onFileSelected={(file) => setPendingImageFiles([file])}
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

            {/* Employee Assignment - Read Only */}
            {employees.length > 0 && (
              <div>
                <Label className="mb-2 block">Prestado por:</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-border rounded-lg p-3 bg-muted/30">
                  {employees.filter(employee => selectedEmployees.includes(employee.employee_id)).length > 0 ? (
                    employees
                      .filter(employee => selectedEmployees.includes(employee.employee_id))
                      .map((employee) => (
                        <div key={employee.id} className="flex items-center gap-2 text-sm text-foreground">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={employee.profiles?.avatar_url || undefined} alt={employee.profiles?.full_name || 'Usuario'} />
                            <AvatarFallback className="text-xs">
                              {(employee.profiles?.full_name || employee.profiles?.email || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {employee.profiles?.full_name || employee.profiles?.email || 'Sin nombre'}
                        </div>
                      ))
                  ) : (
                    <div className="text-sm text-muted-foreground italic">
                      No hay empleados asignados a este servicio
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Los empleados se gestionan desde la sección de empleados
                </p>
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
                Servicio activo
              </Label>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCloseDialog}
                disabled={isSaving}
                className="min-h-[44px] w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 min-h-[44px] w-full sm:w-auto"
                disabled={isSaving}
              >
                {isSaving ? 'Guardando...' : editingService ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Perfil de Servicio */}
      <Dialog open={isProfileOpen} onOpenChange={(open) => open ? setIsProfileOpen(true) : closeProfile()}>
        <DialogContent hideClose className="max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Perfil de {profileService?.name || 'Servicio'}</DialogTitle>
          </DialogHeader>

          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 bg-white/90 hover:bg-white text-gray-800 hover:text-gray-900 rounded-full shadow-md"
            onClick={() => closeProfile()}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="relative h-56 sm:h-72 flex-shrink-0">
            {profileService?.image_url ? (
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${profileService.image_url})` }} />
            ) : (
              <div className="absolute inset-0 bg-muted" />
            )}
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="relative z-10 p-4 sm:p-6 flex items-end h-full">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">{profileService?.name}</h3>
                <div className="mt-2 flex items-center gap-3 text-white/90 text-xs sm:text-sm">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span>$ {profileService ? profileService.price.toLocaleString('es-CO') : ''}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{profileService?.duration_minutes} minutos</span>
                  </div>
                  {profileService?.category && (
                    <Badge variant="default" className="bg-white/80 text-gray-800">{profileService.category}</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Detalle</TabsTrigger>
                <TabsTrigger value="employees">Empleados ({profileEmployees.length})</TabsTrigger>
                <TabsTrigger value="locations">Sedes ({profileLocations.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                {profileService?.description ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profileService.description}</p>
                ) : (
                  <Card><CardContent className="p-6 text-muted-foreground text-center">Sin descripción</CardContent></Card>
                )}
              </TabsContent>

              <TabsContent value="employees" className="mt-4">
                {(() => {
                  const assigned = employees.filter((e) => profileEmployees.includes(e.employee_id))
                  return assigned.length === 0 ? (
                    <Card><CardContent className="p-6 text-muted-foreground text-center">No hay empleados asignados</CardContent></Card>
                  ) : (
                    <div className="space-y-2">
                      {assigned.map((e) => (
                        <Card key={e.id}><CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={e.profiles?.avatar_url || undefined} alt={e.profiles?.full_name || 'Usuario'} />
                              <AvatarFallback className="text-xs">
                                {(e.profiles?.full_name || e.profiles?.email || 'U').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="text-sm">
                              <div className="font-medium">{e.profiles?.full_name || e.profiles?.email || 'Sin nombre'}</div>
                            </div>
                          </div>
                        </CardContent></Card>
                      ))}
                    </div>
                  )
                })()}
              </TabsContent>

              <TabsContent value="locations" className="mt-4">
                {(() => {
                  const assigned = locations.filter((l) => profileLocations.includes(l.id))
                  return assigned.length === 0 ? (
                    <Card><CardContent className="p-6 text-muted-foreground text-center">No hay sedes asignadas</CardContent></Card>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {assigned.map((l) => (
                        <Card key={l.id}><CardContent className="p-4">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{l.name}</span>
                          </div>
                        </CardContent></Card>
                      ))}
                    </div>
                  )
                })()}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}