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
import { toast } from 'sonner'

interface Service {
  id: string
  business_id: string
  name: string
  description?: string
  duration: number
  price: number
  category_id?: string
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
  user_id: string
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
  duration: 60,
  price: 0,
  category_id: undefined,
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

      // Fetch employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('business_employees')
        .select(`
          id,
          user_id,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .eq('business_id', businessId)

      if (employeesError) throw employeesError

      setServices(servicesData || [])
      setLocations(locationsData || [])
      setEmployees(employeesData || [])
    } catch {
      toast.error('Error al cargar los datos')
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
        duration: service.duration,
        price: service.price,
        category_id: service.category_id,
        image_url: service.image_url,
        is_active: service.is_active,
      })
      await fetchServiceAssignments(service.id)
    } else {
      setEditingService(null)
      setFormData(initialFormData)
      setSelectedLocations([])
      setSelectedEmployees([])
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingService(null)
    setFormData(initialFormData)
    setSelectedLocations([])
    setSelectedEmployees([])
  }

  const handleChange = (field: keyof typeof formData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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

    if (formData.duration <= 0) {
      toast.error('La duración debe ser mayor a 0')
      return
    }

    setIsSaving(true)
    try {
      const serviceData = {
        business_id: businessId,
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        duration: formData.duration,
        price: formData.price,
        category_id: formData.category_id || null,
        image_url: formData.image_url || null,
        is_active: formData.is_active,
        updated_at: new Date().toISOString(),
      }

      let serviceId: string

      if (editingService) {
        // Update existing service
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id)

        if (error) throw error
        serviceId = editingService.id
        toast.success('Servicio actualizado exitosamente')
      } else {
        // Create new service
        const { data, error } = await supabase
          .from('services')
          .insert(serviceData)
          .select()
          .single()

        if (error) throw error
        serviceId = data.id
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
        const employeeAssignments = selectedEmployees.map((empId) => ({
          employee_id: empId,
          service_id: serviceId,
        }))
        await supabase.from('employee_services').insert(employeeAssignments)
      }

      await fetchData()
      handleCloseDialog()
    } catch {
      toast.error(editingService ? 'Error al actualizar el servicio' : 'Error al crear el servicio')
    } finally {
      setIsSaving(false)
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

  const handleImageUploaded = (urls: string[]) => {
    if (urls.length > 0) {
      setFormData((prev) => ({ ...prev, image_url: urls[0] }))
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
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Servicios</h2>
          <p className="text-gray-400 text-sm">Gestiona los servicios que ofreces</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-violet-500 hover:bg-violet-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Servicio
        </Button>
      </div>

      {/* Services Grid */}
      {services.length === 0 ? (
        <Card className="bg-[#252032] border-white/10">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-16 w-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No hay servicios aún</h3>
            <p className="text-gray-400 text-center mb-4">
              Agrega tu primer servicio para que los clientes puedan reservar citas
            </p>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-violet-500 hover:bg-violet-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Primer Servicio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <Card key={service.id} className="bg-[#252032] border-white/10 hover:border-white/20 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {service.image_url && (
                      <img
                        src={service.image_url}
                        alt={service.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    )}
                    <CardTitle className="text-white text-lg">{service.name}</CardTitle>
                    {!service.is_active && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        Inactivo
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(service)}
                      className="text-gray-400 hover:text-white"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(service.id)}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {service.description && (
                  <p className="text-sm text-gray-300 line-clamp-2">{service.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-green-400" />
                  <span className="text-white font-semibold">
                    ${service.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <span className="text-gray-300">{service.duration} minutos</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="bg-[#252032] border-white/10 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService ? 'Editar Servicio' : 'Crear Nuevo Servicio'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingService
                ? 'Actualiza la información del servicio'
                : 'Completa la información del nuevo servicio'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <Label htmlFor="name">Nombre del Servicio *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ej: Corte de Cabello"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe el servicio"
                rows={3}
              />
            </div>

            {/* Duration & Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration">Duración (minutos) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => handleChange('duration', parseInt(e.target.value) || 0)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="price">Precio *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <Label>Imagen del Servicio</Label>
              {formData.image_url ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden mb-2">
                  <img
                    src={formData.image_url}
                    alt="Servicio"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleChange('image_url', '')}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <ImageUploader
                  bucket="service-images"
                  maxFiles={1}
                  maxSizeMB={5}
                  onUploadComplete={handleImageUploaded}
                  onUploadError={(error) => toast.error(error)}
                  folderPath={`services/${businessId}`}
                />
              )}
            </div>

            {/* Location Assignment */}
            {locations.length > 0 && (
              <div>
                <Label className="mb-2 block">Disponible en las siguientes sedes:</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-white/10 rounded-lg p-3">
                  {locations.map((location) => (
                    <div key={location.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`location-${location.id}`}
                        checked={selectedLocations.includes(location.id)}
                        onCheckedChange={() => handleToggleLocation(location.id)}
                      />
                      <label
                        htmlFor={`location-${location.id}`}
                        className="text-sm text-white cursor-pointer flex items-center gap-2"
                      >
                        <MapPin className="h-3 w-3 text-gray-400" />
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
                <div className="space-y-2 max-h-40 overflow-y-auto border border-white/10 rounded-lg p-3">
                  {employees.map((employee) => (
                    <div key={employee.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`employee-${employee.id}`}
                        checked={selectedEmployees.includes(employee.id)}
                        onCheckedChange={() => handleToggleEmployee(employee.id)}
                      />
                      <label
                        htmlFor={`employee-${employee.id}`}
                        className="text-sm text-white cursor-pointer flex items-center gap-2"
                      >
                        <Users className="h-3 w-3 text-gray-400" />
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
                Servicio activo
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={handleCloseDialog}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-violet-500 hover:bg-violet-600 text-white"
                disabled={isSaving}
              >
                {isSaving ? 'Guardando...' : editingService ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
