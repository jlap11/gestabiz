import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, DollarSign, MapPin, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useBusinessResources, useDeleteResource, useCreateResource, useUpdateResource } from '@/hooks/useBusinessResources'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'
import type { BusinessResource, Business, Location } from '@/types/types'
import { toast } from 'sonner'

/**
 * Gestor de Recursos Físicos
 * CRUD completo para habitaciones, mesas, canchas, etc.
 * 
 * Fecha: 21 de Octubre de 2025
 * Parte del sistema de Modelo de Negocio Flexible
 */

interface ResourcesManagerProps {
  business: Business
}

export function ResourcesManager({ business }: Readonly<ResourcesManagerProps>) {
  const { t } = useLanguage()
  const [selectedType, setSelectedType] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<BusinessResource | null>(null)
  
  // Helper function to get resource type label from translations
  const getResourceTypeLabel = (type: string): string => {
    const key = `businessResources.types.${type}`
    return t(key) || type
  }
  
  // List of all resource types
  const resourceTypes: Array<BusinessResource['resource_type']> = [
    'room', 'table', 'court', 'desk', 'equipment', 'vehicle',
    'space', 'lane', 'field', 'station', 'parking_spot',
    'bed', 'studio', 'meeting_room', 'other'
  ]
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    name: '',
    resource_type: 'room' as BusinessResource['resource_type'],
    location_id: '',
    capacity: 1,
    price_per_hour: 0,
    description: '',
    amenities: '',
    is_active: true,
  })

  const { data: resources, isLoading } = useBusinessResources(business.id)
  const deleteMutation = useDeleteResource()
  const createMutation = useCreateResource()
  const updateMutation = useUpdateResource()
  
  // Estado para ubicaciones del negocio
  const [locations, setLocations] = useState<Location[]>([])

  // Cargar ubicaciones del negocio
  useEffect(() => {
    const fetchLocations = async () => {
      const { data } = await supabase
        .from('locations')
        .select('*')
        .eq('business_id', business.id)
        .eq('is_active', true)
      
      if (data) {
        setLocations(data)
      }
    }
    
    fetchLocations()
  }, [business.id])

  // Filtrar por tipo
  const filteredResources = selectedType === 'all'
    ? resources
    : resources?.filter(r => r.resource_type === selectedType)

  const handleCreate = () => {
    setEditingResource(null)
    setIsModalOpen(true)
  }

  const handleEdit = (resource: BusinessResource) => {
    setEditingResource(resource)
    // Cargar datos en el formulario
    setFormData({
      name: resource.name,
      resource_type: resource.resource_type,
      location_id: resource.location_id || '',
      capacity: resource.capacity || 1,
      price_per_hour: resource.price_per_hour || 0,
      description: resource.description || '',
      amenities: resource.amenities?.join(', ') || '',
      is_active: resource.is_active,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (resourceId: string) => {
    if (!confirm(t('admin.resourcesManager.confirmDisable'))) return

    deleteMutation.mutate(resourceId)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingResource(null)
    // Reset form
    setFormData({
      name: '',
      resource_type: 'room',
      location_id: '',
      capacity: 1,
      price_per_hour: 0,
      description: '',
      amenities: '',
      is_active: true,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validaciones
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    if (!formData.location_id) {
      toast.error('Debe seleccionar una sede')
      return
    }

    // Preparar amenities como array
    const amenitiesArray = formData.amenities
      .split(',')
      .map(a => a.trim())
      .filter(a => a.length > 0)

    const resourceData = {
      business_id: business.id,
      name: formData.name,
      resource_type: formData.resource_type,
      location_id: formData.location_id,
      capacity: formData.capacity,
      price_per_hour: formData.price_per_hour,
      description: formData.description || undefined,
      amenities: amenitiesArray.length > 0 ? amenitiesArray : undefined,
      is_active: formData.is_active,
    }

    if (editingResource) {
      // Editar existente
      updateMutation.mutate(
        { resourceId: editingResource.id, updates: resourceData },
        {
          onSuccess: () => {
            handleCloseModal()
          },
        }
      )
    } else {
      // Crear nuevo
      createMutation.mutate(resourceData, {
        onSuccess: () => {
          handleCloseModal()
        },
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header con acciones */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('businessResources.title')}</h2>
          <p className="text-muted-foreground">
            {t('businessResources.subtitle')}
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('businessResources.addResource')}
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder={t('businessResources.filterByType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('businessResources.allTypes')}</SelectItem>
                  {resourceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {getResourceTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredResources?.length || 0} {t('common.misc.results')}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}
          
          {!isLoading && filteredResources?.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {t('businessResources.noResources')}{' '}
                <button
                  onClick={handleCreate}
                  className="text-primary hover:underline"
                >
                  {t('common.actions.create')}
                </button>
              </p>
            </div>
          )}
          
          {!isLoading && filteredResources && filteredResources.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('businessResources.table.name')}</TableHead>
                  <TableHead>{t('businessResources.table.type')}</TableHead>
                  <TableHead>{t('businessResources.table.location')}</TableHead>
                  <TableHead>{t('businessResources.table.capacity')}</TableHead>
                  <TableHead>{t('businessResources.table.price')}</TableHead>
                  <TableHead>{t('businessResources.table.status')}</TableHead>
                  <TableHead className="text-right">{t('businessResources.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell className="font-medium">
                      {resource.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getResourceTypeLabel(resource.resource_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {resource.location?.name || 'Sin ubicación'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {resource.capacity || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        {resource.price_per_hour
                          ? new Intl.NumberFormat('es-CO', {
                              style: 'currency',
                              currency: resource.currency || 'COP',
                              minimumFractionDigits: 0,
                            }).format(resource.price_per_hour)
                          : 'N/A'}
                      </div>
                    </TableCell>
                      <TableCell>
                      <Badge
                        variant="outline"
                        className={resource.is_active ? 'bg-green-500/10 text-green-700 border-green-500/20' : 'bg-red-500/10 text-red-700 border-red-500/20'}
                      >
                        {resource.is_active ? t('businessResources.status.available') : t('businessResources.status.inactive')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(resource)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(resource.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de creación/edición de recursos */}
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingResource ? t('businessResources.editResource') : t('businessResources.addResource')}
            </DialogTitle>
            <DialogDescription>
              {editingResource
                ? t('businessResources.form.description')
                : t('businessResources.subtitle')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name">
                {t('businessResources.form.name')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('businessResources.form.namePlaceholder')}
                required
              />
            </div>

            {/* Tipo de Recurso */}
            <div className="space-y-2">
              <Label htmlFor="resource_type">
                {t('businessResources.form.type')} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.resource_type}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  resource_type: value as BusinessResource['resource_type'] 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {resourceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {getResourceTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sede */}
            <div className="space-y-2">
              <Label htmlFor="location_id">
                {t('businessResources.form.location')} <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.location_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, location_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('businessResources.form.selectLocation')} />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(location => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name || location.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {locations.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t('locations.no_locations')}
                </p>
              )}
            </div>

            {/* Capacidad y Precio */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">
                  {t('businessResources.form.capacity')} <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      capacity: Number.parseInt(e.target.value, 10) || 1 
                    }))}
                    className="pl-10"
                    placeholder={t('businessResources.form.capacityPlaceholder')}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_per_hour">
                  {t('businessResources.form.pricePerHour')}
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="price_per_hour"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.price_per_hour}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      price_per_hour: Number.parseFloat(e.target.value) || 0 
                    }))}
                    className="pl-10"
                    placeholder={t('businessResources.form.pricePlaceholder')}
                  />
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">{t('businessResources.form.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('businessResources.form.descriptionPlaceholder')}
                rows={3}
              />
            </div>

            {/* Amenidades */}
            <div className="space-y-2">
              <Label htmlFor="amenities">
                {t('businessResources.form.amenities')}
              </Label>
              <Input
                id="amenities"
                value={formData.amenities}
                onChange={(e) => setFormData(prev => ({ ...prev, amenities: e.target.value }))}
                placeholder={t('businessResources.form.amenitiesPlaceholder')}
              />
              <p className="text-xs text-muted-foreground">
                {t('businessResources.form.amenitiesPlaceholder')}
              </p>
            </div>

            {/* Estado */}
            <div className="space-y-2">
              <Label htmlFor="is_active">{t('businessResources.form.status')}</Label>
              <Select
                value={formData.is_active ? 'active' : 'inactive'}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  is_active: value === 'active' 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('businessResources.form.active')}</SelectItem>
                  <SelectItem value="inactive">{t('businessResources.form.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
              >
                {t('common.actions.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <span className="mr-2">⏳</span>
                )}
                {editingResource ? t('common.actions.update') : t('common.actions.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
