import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Clock,
  Image as ImageIcon,
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
import { BusinessHoursPicker, type BusinessHours } from '@/components/ui/BusinessHoursPicker'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { toast } from 'sonner'

interface Location {
  id: string
  business_id: string
  name: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  phone?: string
  email?: string
  description?: string
  business_hours?: BusinessHours
  images?: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

interface LocationsManagerProps {
  businessId: string
}

const initialFormData: Omit<Location, 'id' | 'created_at' | 'updated_at' | 'business_id'> = {
  name: '',
  address: '',
  city: '',
  state: '',
  country: 'México',
  postal_code: '',
  phone: '',
  email: '',
  description: '',
  business_hours: undefined,
  images: [],
  is_active: true,
}

export function LocationsManager({ businessId }: LocationsManagerProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [formData, setFormData] = useState(initialFormData)
  const [isSaving, setIsSaving] = useState(false)

  const fetchLocations = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setLocations(data || [])
    } catch {
      toast.error('Error al cargar las sedes')
    } finally {
      setIsLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  const handleOpenDialog = (location?: Location) => {
    if (location) {
      setEditingLocation(location)
      setFormData({
        name: location.name,
        address: location.address || '',
        city: location.city || '',
        state: location.state || '',
        country: location.country || 'México',
        postal_code: location.postal_code || '',
        phone: location.phone || '',
        email: location.email || '',
        description: location.description || '',
        business_hours: location.business_hours || undefined,
        images: location.images || [],
        is_active: location.is_active,
      })
    } else {
      setEditingLocation(null)
      setFormData(initialFormData)
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingLocation(null)
    setFormData(initialFormData)
  }

  const handleChange = (field: keyof typeof formData, value: string | boolean | BusinessHours | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('El nombre de la sede es requerido')
      return
    }

    setIsSaving(true)
    try {
      const locationData = {
        business_id: businessId,
        name: formData.name.trim(),
        address: formData.address?.trim() || null,
        city: formData.city?.trim() || null,
        state: formData.state?.trim() || null,
        country: formData.country?.trim() || null,
        postal_code: formData.postal_code?.trim() || null,
        phone: formData.phone?.trim() || null,
        email: formData.email?.trim() || null,
        description: formData.description?.trim() || null,
        business_hours: formData.business_hours || null,
        images: formData.images || [],
        is_active: formData.is_active,
        updated_at: new Date().toISOString(),
      }

      if (editingLocation) {
        // Update existing location
        const { error } = await supabase
          .from('locations')
          .update(locationData)
          .eq('id', editingLocation.id)

        if (error) throw error
        toast.success('Sede actualizada exitosamente')
      } else {
        // Create new location
        const { error } = await supabase
          .from('locations')
          .insert(locationData)

        if (error) throw error
        toast.success('Sede creada exitosamente')
      }

      await fetchLocations()
      handleCloseDialog()
    } catch {
      toast.error(editingLocation ? 'Error al actualizar la sede' : 'Error al crear la sede')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (locationId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta sede? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', locationId)

      if (error) throw error
      toast.success('Sede eliminada exitosamente')
      await fetchLocations()
    } catch {
      toast.error('Error al eliminar la sede')
    }
  }

  const handleImagesUploaded = (urls: string[]) => {
    setFormData((prev) => ({
      ...prev,
      images: [...(prev.images || []), ...urls],
    }))
  }

  const handleRemoveImage = (url: string) => {
    setFormData((prev) => ({
      ...prev,
      images: (prev.images || []).filter((img) => img !== url),
    }))
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
          <h2 className="text-2xl font-bold text-white">Sedes</h2>
          <p className="text-gray-400 text-sm">Gestiona las ubicaciones de tu negocio</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-violet-500 hover:bg-violet-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Sede
        </Button>
      </div>

      {/* Locations Grid */}
      {locations.length === 0 ? (
        <Card className="bg-[#252032] border-white/10">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-16 w-16 text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No hay sedes aún</h3>
            <p className="text-gray-400 text-center mb-4">
              Agrega tu primera sede para empezar a recibir citas
            </p>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-violet-500 hover:bg-violet-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Sede
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((location) => (
            <Card key={location.id} className="bg-[#252032] border-white/10 hover:border-white/20 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white text-lg">{location.name}</CardTitle>
                    {!location.is_active && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        Inactiva
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(location)}
                      className="text-gray-400 hover:text-white"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(location.id)}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {location.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">
                      {location.address}
                      {location.city && `, ${location.city}`}
                      {location.state && `, ${location.state}`}
                    </span>
                  </div>
                )}
                {location.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">{location.phone}</span>
                  </div>
                )}
                {location.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">{location.email}</span>
                  </div>
                )}
                {location.business_hours && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">Horarios configurados</span>
                  </div>
                )}
                {location.images && location.images.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <ImageIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">{location.images.length} imagen(es)</span>
                  </div>
                )}
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
              {editingLocation ? 'Editar Sede' : 'Crear Nueva Sede'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingLocation
                ? 'Actualiza la información de la sede'
                : 'Completa la información de la nueva sede'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <Label htmlFor="name">Nombre de la Sede *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ej: Sede Centro"
                required
              />
            </div>

            {/* Address */}
            <div>
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Calle y número"
              />
            </div>

            {/* City, State, Postal Code */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="Ciudad"
                />
              </div>
              <div>
                <Label htmlFor="state">Estado/Provincia</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  placeholder="Estado"
                />
              </div>
              <div>
                <Label htmlFor="postal_code">Código Postal</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleChange('postal_code', e.target.value)}
                  placeholder="00000"
                />
              </div>
            </div>

            {/* Country */}
            <div>
              <Label htmlFor="country">País</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                placeholder="País"
              />
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+52 555 123 4567"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="sede@negocio.com"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Información adicional sobre esta sede"
                rows={3}
              />
            </div>

            {/* Business Hours */}
            <div>
              <Label>Horarios de Atención</Label>
              <BusinessHoursPicker
                value={formData.business_hours}
                onChange={(hours) => handleChange('business_hours', hours)}
              />
            </div>

            {/* Images */}
            <div>
              <Label>Imágenes de la Sede</Label>
              <div className="space-y-4">
                {/* Current Images */}
                {formData.images && formData.images.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {formData.images.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Imagen ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(url)}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload New Images */}
                <ImageUploader
                  bucket="location-images"
                  maxFiles={5}
                  maxSizeMB={5}
                  existingImages={formData.images || []}
                  onUploadComplete={handleImagesUploaded}
                  onUploadError={(error) => toast.error(error)}
                  folderPath={`locations/${businessId}`}
                />
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleChange('is_active', e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Sede activa
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
                {isSaving ? 'Guardando...' : editingLocation ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
