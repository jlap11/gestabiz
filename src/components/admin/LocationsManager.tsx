import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Edit, Image as ImageIcon, Mail, MapPin, Phone, Plus, Trash2, X } from 'lucide-react'
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
import { PhoneInput } from '@/components/ui/PhoneInput'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { type BusinessHours, BusinessHoursPicker } from '@/components/ui/BusinessHoursPicker'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { toast } from 'sonner'
import { usePreferredLocation } from '@/hooks/usePreferredLocation'

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
  is_primary?: boolean
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
  is_primary: false,
}

export function LocationsManager({ businessId }: Readonly<LocationsManagerProps>) {
  const { t } = useLanguage()
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [formData, setFormData] = useState(initialFormData)
  const [isSaving, setIsSaving] = useState(false)
  const [pendingImageFiles, setPendingImageFiles] = useState<File[]>([])
  const { preferredLocationId } = usePreferredLocation(businessId)

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
      toast.error(t('admin.locationActions.loadSeatError'))
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
    setPendingImageFiles([]) // Clear pending image files
  }

  const handleChange = (
    field: keyof typeof formData,
    value: string | boolean | BusinessHours | string[]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error(t('admin.locationActions.seatNameRequired'))
      return
    }

    setIsSaving(true)
    try {
      // Si se marca como principal, desmarcar otras sedes principales
      if (formData.is_primary) {
        await supabase
          .from('locations')
          .update({ is_primary: false })
          .eq('business_id', businessId)
          .neq('id', editingLocation?.id || '')
      }

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
        is_primary: formData.is_primary || false,
        updated_at: new Date().toISOString(),
      }

      let locationId: string | undefined

      if (editingLocation) {
        // Update existing location
        const { error } = await supabase
          .from('locations')
          .update(locationData)
          .eq('id', editingLocation.id)

        if (error) throw error
        locationId = editingLocation.id
        toast.success(t('admin.locationActions.updated'))
      } else {
        // Create new location and get its ID
        const { data: newLocation, error } = await supabase
          .from('locations')
          .insert(locationData)
          .select('id')
          .single()

        if (error) throw error
        if (!newLocation) throw new Error('No se pudo crear la sede')

        locationId = newLocation.id

        // Upload pending images if any
        if (pendingImageFiles.length > 0) {
          toast.info('Subiendo imágenes...')
          const uploadedUrls: string[] = []

          for (const file of pendingImageFiles) {
            try {
              const fileName = `${Date.now()}-${file.name}`
              const filePath = `locations/${locationId}/${fileName}`

              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('location-images')
                .upload(filePath, file, {
                  cacheControl: '3600',
                  upsert: false,
                })

              if (uploadError) {
                console.error('Error uploading image:', uploadError)
                continue
              }

              const { data: urlData } = supabase.storage
                .from('location-images')
                .getPublicUrl(uploadData.path)

              uploadedUrls.push(urlData.publicUrl)
            } catch (err) {
              console.error('Error processing image:', err)
            }
          }

          // Update location with uploaded image URLs
          if (uploadedUrls.length > 0) {
            await supabase.from('locations').update({ images: uploadedUrls }).eq('id', locationId)
          }
        }

        toast.success(t('admin.locationActions.created'))
      }

      await fetchLocations()
      handleCloseDialog()
      setPendingImageFiles([]) // Clear pending files
    } catch (err) {
      console.error('Error saving location:', err)
      toast.error(
        editingLocation
          ? t('admin.locationActions.updateError')
          : t('admin.locationActions.createError')
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (locationId: string) => {
    if (!confirm(t('admin.locationManagement.confirmDeleteLocation'))) {
      return
    }

    try {
      const { error } = await supabase.from('locations').delete().eq('id', locationId)

      if (error) throw error
      toast.success(t('admin.locationActions.deleted'))
      await fetchLocations()
    } catch {
      toast.error(t('admin.locationActions.deleteError'))
    }
  }

  const handleImagesUploaded = (urls: string[]) => {
    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), ...urls],
    }))
  }

  const handleRemoveImage = (url: string) => {
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).filter(img => img !== url),
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
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">Sedes</h2>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Gestiona las ubicaciones de tu negocio
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-primary hover:bg-primary/90 w-full sm:w-auto min-h-[44px]"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{t('admin.actions.addLocation')}</span>
          <span className="sm:hidden">{t('admin.actions.newLocation')}</span>
        </Button>
      </div>

      {/* Locations Grid - Responsive */}
      {locations.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
            <MapPin className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
              No hay sedes aún
            </h3>
            <p className="text-muted-foreground text-center mb-4 text-sm sm:text-base">
              Agrega tu primera sede para empezar a recibir citas
            </p>
            <Button
              onClick={() => handleOpenDialog()}
              className="bg-primary hover:bg-primary/90 min-h-[44px] w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Sede
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {locations.map(location => (
            <Card
              key={location.id}
              className="bg-card border-border hover:border-border/80 transition-colors"
            >
              <CardHeader className="p-3 sm:p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-foreground text-base sm:text-lg truncate">
                        {location.name}
                      </CardTitle>
                      {location.is_primary && (
                        <Badge variant="default" className="text-[10px] sm:text-xs">
                          Principal
                        </Badge>
                      )}
                      {preferredLocationId === location.id && (
                        <Badge
                          variant="outline"
                          className="text-[10px] sm:text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700"
                        >
                          toast.info(t('common.messages.uploadingImages'))
                        </Badge>
                      )}
                    </div>
                    {!location.is_active && (
                      <Badge variant="secondary" className="mt-2 text-[10px] sm:text-xs">
                        Inactiva
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(location)}
                      className="text-muted-foreground hover:text-foreground min-w-[44px] min-h-[44px]"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(location.id)}
                      className="text-muted-foreground hover:text-red-400 min-w-[44px] min-h-[44px]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-6">
                {location.address && (
                  <div className="flex items-start gap-2 text-xs sm:text-sm">
                    <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground line-clamp-2">
                      {location.address}
                      {location.city && `, ${location.city}`}
                      {location.state && `, ${location.state}`}
                    </span>
                  </div>
                )}
                {location.phone && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground truncate">{location.phone}</span>
                  </div>
                )}
                {location.email && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground truncate">{location.email}</span>
                  </div>
                )}
                {location.business_hours && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="font-medium">
                      {editingLocation
                        ? t('admin.actions.editLocation')
                        : t('admin.actions.createLocation')}
                    </span>
                    <span className="text-muted-foreground">Horarios configurados</span>
                    <span className="text-sm text-muted-foreground block mt-1">
                      {editingLocation
                        ? t('admin.locationManagement.editDescription')
                        : t('admin.actions.completeLocationInfo')}
                    </span>
                  </div>
                )}
                {location.images && location.images.length > 0 && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">
                      {location.images.length} imagen(es)
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog - Mobile Responsive */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="bg-card border-border text-foreground max-w-[95vw] sm:max-w-3xl lg:max-w-5xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {editingLocation
                ? t('admin.actions.editLocation')
                : t('admin.actions.createLocation')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingLocation
                ? 'Actualiza la información de la sede'
                : t('admin.actions.completeLocationInfo')}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Name */}
            <div>
              <Label htmlFor="name" className="text-sm sm:text-base">
                Nombre de la Sede *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => handleChange('name', e.target.value)}
                placeholder="Ej: Sede Centro"
                required
                className="min-h-[44px]"
              />
            </div>

            {/* Address */}
            <div>
              <Label htmlFor="address" className="text-sm sm:text-base">
                Dirección
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={e => handleChange('address', e.target.value)}
                placeholder="Calle y número"
                className="min-h-[44px]"
              />
            </div>

            {/* City, State, Postal Code - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="city" className="text-sm sm:text-base">
                  Ciudad
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={e => handleChange('city', e.target.value)}
                  placeholder="Ciudad"
                  className="min-h-[44px]"
                />
              </div>
              <div>
                <Label htmlFor="state" className="text-sm sm:text-base">
                  Estado/Provincia
                </Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={e => handleChange('state', e.target.value)}
                  placeholder="Estado"
                  className="min-h-[44px]"
                />
              </div>
              <div>
                <Label htmlFor="postal_code" className="text-sm sm:text-base">
                  Código Postal
                </Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={e => handleChange('postal_code', e.target.value)}
                  placeholder="00000"
                  className="min-h-[44px]"
                />
              </div>
            </div>

            {/* Country */}
            <div>
              <Label htmlFor="country" className="text-sm sm:text-base">
                País
              </Label>
              <Input
                id="country"
                value="Colombia"
                readOnly
                placeholder="País"
                autoComplete="country"
                className="min-h-[44px]"
              />
            </div>

            {/* Phone & Email - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="phone" className="text-sm sm:text-base">
                  Teléfono
                </Label>
                <PhoneInput
                  value={formData.phone || ''}
                  onChange={val => handleChange('phone', val)}
                  prefix={formData.phone?.startsWith('+') ? formData.phone.split(' ')[0] : '+57'}
                  onPrefixChange={prefix => {
                    // Actualiza el valor completo con el nuevo prefijo
                    const number = formData.phone?.replace(/^\+\d+\s*/, '') || ''
                    handleChange('phone', `${prefix} ${number}`)
                  }}
                  placeholder="Número de teléfono"
                  className="min-h-[44px]"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm sm:text-base">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  className="min-h-[44px]"
                  onChange={e => handleChange('email', e.target.value)}
                  placeholder="sede@negocio.com"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-sm sm:text-base">
                Descripción
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => handleChange('description', e.target.value)}
                placeholder="Información adicional sobre esta sede"
                rows={3}
                className="min-h-[88px]"
              />
            </div>

            {/* Business Hours */}
            <div>
              <Label className="text-sm sm:text-base">Horarios de Atención</Label>
              <BusinessHoursPicker
                value={formData.business_hours}
                onChange={hours => handleChange('business_hours', hours)}
              />
            </div>

            {/* Images */}
            <div>
              <Label className="text-sm sm:text-base">Imágenes de la Sede</Label>
              <div className="space-y-3 sm:space-y-4">
                {/* Current Images */}
                {formData.images && formData.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-primary-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload New Images */}
                {editingLocation ? (
                  // Editing: Upload immediately (location exists)
                  <ImageUploader
                    bucket="location-images"
                    maxFiles={5}
                    maxSizeMB={5}
                    existingImages={formData.images || []}
                    onUploadComplete={handleImagesUploaded}
                    onUploadError={error => toast.error(error)}
                    folderPath={`locations/${editingLocation.id}`}
                  />
                ) : (
                  // Creating: Delayed upload (location doesn't exist yet)
                  <ImageUploader
                    bucket="location-images"
                    maxFiles={5}
                    maxSizeMB={5}
                    delayedUpload={true}
                    onFileSelected={file => {
                      setPendingImageFiles(prev => [...prev, file])
                    }}
                    onUploadError={error => toast.error(error)}
                    folderPath="temp" // Not used in delayed mode
                  />
                )}
              </div>
            </div>

            {/* Active Status & Primary Location - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-center gap-3 p-3 sm:p-4 rounded-lg border border-border bg-card min-h-[68px]">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={checked => handleChange('is_active', checked === true)}
                  className="min-w-[44px] min-h-[44px]"
                />
                <div className="flex flex-col">
                  <Label
                    htmlFor="is_active"
                    className="cursor-pointer text-xs sm:text-sm font-medium text-foreground"
                  >
                    Sede activa
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    La sede estará visible y disponible para citas
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 sm:p-4 rounded-lg border border-border bg-card min-h-[68px]">
                <Checkbox
                  id="is_primary"
                  checked={formData.is_primary || false}
                  onCheckedChange={checked => handleChange('is_primary', checked === true)}
                  className="min-w-[44px] min-h-[44px]"
                />
                <div className="flex flex-col">
                  <Label
                    htmlFor="is_primary"
                    className="cursor-pointer text-xs sm:text-sm font-medium text-foreground"
                  >
                    Sede principal
                  </Label>
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    Solo puede haber una sede principal por negocio
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCloseDialog}
                className="min-h-[44px] w-full sm:w-auto"
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 min-h-[44px] w-full sm:w-auto"
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
