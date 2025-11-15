import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { sendAppointmentCancellationNotification } from '@/lib/mailService'
import {
  MapPin,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Clock,
  Image as ImageIcon,
  Video as VideoIcon,
  Star,
  Play,
  X,
  Save,
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
import { PhoneInput } from '@/components/ui/PhoneInput'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { BusinessHoursPicker, type BusinessHours } from '@/components/ui/BusinessHoursPicker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { usePreferredLocation } from '@/hooks/usePreferredLocation'
import { MediaUploader } from '@/components/ui/MediaUploader'
import { LocationProfileModal } from '@/components/admin/LocationProfileModal'
import { BannerCropper } from '@/components/settings/BannerCropper'
import { RegionSelect, CitySelect } from '@/components/catalog'
import { LocationAddress } from '@/components/ui/LocationAddress'
import { LocationExpenseConfig } from '@/components/admin/locations/LocationExpenseConfig'

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
  country: 'Colombia',
  postal_code: '',
  phone: '',
  email: '',
  description: '',
  business_hours: undefined,
  images: [],
  is_active: true,
  is_primary: false,
}

export function LocationsManager({ businessId }: LocationsManagerProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [formData, setFormData] = useState(initialFormData)
  const [isSaving, setIsSaving] = useState(false)
  const { preferredLocationId } = usePreferredLocation(businessId)
  const [locationBanners, setLocationBanners] = useState<Record<string, string>>({})
  const [locationPrimaryVideos, setLocationPrimaryVideos] = useState<Record<string, string>>({})
  const [profileLocation, setProfileLocation] = useState<Location | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  
  // Estados para banner cropper
  const [isBannerCropperOpen, setIsBannerCropperOpen] = useState(false)
  const [bannerImageToEdit, setBannerImageToEdit] = useState<string | null>(null)
  const [selectedRegionId, setSelectedRegionId] = useState<string>('')
  
  // Estado para tabs
  const [activeTab, setActiveTab] = useState<'info' | 'expenses'>('info')
  
  // Estado para manejar la subida de multimedia
  const [uploadMediaFn, setUploadMediaFn] = useState<(() => Promise<void>) | null>(null)
  
  // Estado para multimedia existente
  const [existingMedia, setExistingMedia] = useState<Array<{
    id: string
    location_id: string
    type: 'image' | 'video'
    url: string
    description: string | null
    is_banner: boolean
    is_primary: boolean
    created_at: string
  }>>([])
  const [isLoadingMedia, setIsLoadingMedia] = useState(false)
  
  // Estado para manejar descripciones temporales
  const [tempDescriptions, setTempDescriptions] = useState<Record<string, string>>({})
  const [savingDescriptions, setSavingDescriptions] = useState<Record<string, boolean>>({})
  
  // Función estable para manejar la configuración de uploadMediaFn
  const handleUploadTrigger = React.useCallback((uploadFn: () => Promise<void>) => {
    setUploadMediaFn(() => uploadFn)
  }, [])

  // Función para cargar multimedia existente
  const loadExistingMedia = React.useCallback(async (locationId: string) => {
    setIsLoadingMedia(true)
    try {
      const { data, error } = await supabase
        .from('location_media')
        .select('*')
        .eq('location_id', locationId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setExistingMedia(data || [])
    } catch (err) {
      console.error('Error loading existing media:', err)
      toast.error('Error al cargar multimedia existente')
      setExistingMedia([])
    } finally {
      setIsLoadingMedia(false)
    }
  }, [])

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
  
  // Nueva función reutilizable para refrescar banners y videos principales
  const refreshMediaFlags = async () => {
    const ids = locations.map((l) => l.id)
    if (ids.length === 0) {
      setLocationBanners({})
      setLocationPrimaryVideos({})
      return
    }
    const { data, error } = await supabase
      .from('location_media')
      .select('location_id, type, url, is_banner, is_primary, description, created_at')
      .in('location_id', ids)
      .order('created_at', { ascending: false })
    if (error) {
      // ignore
      return
    }
    const banners: Record<string, string> = {}
    const primVideos: Record<string, string> = {}
    const rows = Array.isArray(data) ? data : []

    // Agrupar posibles banners por sede y elegir ignorando "Banner de prueba"
    const bannerByLocation = new Map<string, any[]>()
    rows.forEach((m) => {
      const cleanUrl = (m.url || '').trim().replace(/^[`'\"]+|[`'\"]+$/g, '')
      if (m.is_primary && m.type === 'video' && !primVideos[m.location_id]) {
        primVideos[m.location_id] = cleanUrl
      }
      if (m.is_banner && m.type === 'image') {
        const arr = bannerByLocation.get(m.location_id) || []
        arr.push({ ...m, url: cleanUrl })
        bannerByLocation.set(m.location_id, arr)
      }
    })

    bannerByLocation.forEach((arr, locId) => {
      const chosen = arr.find((x) => (x.description || '').trim() !== 'Banner de prueba') || arr[0]
      if (chosen) banners[locId] = chosen.url
    })

    setLocationBanners(banners)
    setLocationPrimaryVideos(primVideos)
  }
  
  useEffect(() => {
    fetchLocations()
  }, [fetchLocations])

  // Actualiza banners y videos al cambiar las sedes
  useEffect(() => {
    refreshMediaFlags()
  }, [locations])
  
  const handleOpenProfile = (location: Location) => {
    setProfileLocation(location)
    setIsProfileOpen(true)
  }
  const handleOpenDialog = (location?: Location) => {
    if (location) {
      setEditingLocation(location)
      setSelectedRegionId(location.state || '')
      setFormData({
        name: location.name,
        address: location.address || '',
        city: location.city || '',
        state: location.state || '',
        country: location.country || 'Colombia',
        postal_code: location.postal_code || '',
        phone: location.phone || '',
        email: location.email || '',
        description: location.description || '',
        business_hours: location.business_hours || undefined,
        images: location.images || [],
        is_active: location.is_active,
        is_primary: location.is_primary || false,
      })
      // Cargar multimedia existente
      loadExistingMedia(location.id)
    } else {
      setEditingLocation(null)
      setSelectedRegionId('')
      setFormData(initialFormData)
      setExistingMedia([])
    }
    // Limpiar descripciones temporales
    setTempDescriptions({})
    setSavingDescriptions({})
    setIsDialogOpen(true)
  }

  const handleCloseDialog = (open?: boolean) => {
    if (open === false || open === undefined) {
      setIsDialogOpen(false)
      setEditingLocation(null)
      setSelectedRegionId('')
      setFormData(initialFormData)
      // Limpiar descripciones temporales
      setTempDescriptions({})
      setSavingDescriptions({})
    }
  }

  const handleChange = (field: keyof typeof formData, value: string | boolean | BusinessHours | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }


  const handleBannerEdit = (imageUrl: string) => {
    setBannerImageToEdit(imageUrl)
    setIsBannerCropperOpen(true)
  }

  const handleBannerSave = async (croppedImageBlob: Blob) => {
    if (!editingLocation) return

    try {
      // Subir la imagen recortada
      const fileName = `banner-${editingLocation.id}-${Date.now()}.jpg`
      const { data, error } = await supabase.storage
        .from('location-images')
        .upload(`banners/${fileName}`, croppedImageBlob, {
          contentType: 'image/jpeg',
          upsert: true
        })

      if (error) throw error

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('location-images')
        .getPublicUrl(`banners/${fileName}`)

      // Actualizar el banner en la base de datos (usar columnas correctas)
      // Primero, desmarcar banners anteriores
      await supabase
        .from('location_media')
        .update({ is_banner: false })
        .eq('location_id', editingLocation.id)
        .eq('type', 'image')
        .eq('is_banner', true)

      // Insertar nuevo banner
      await supabase
        .from('location_media')
        .insert({
          location_id: editingLocation.id,
          type: 'image',
          url: publicUrl,
          is_banner: true
        })

      toast.success('Banner actualizado exitosamente')
      setIsBannerCropperOpen(false)
      setBannerImageToEdit(null)
      
      // Recargar las ubicaciones para mostrar el nuevo banner
      fetchLocations()
    } catch (error) {
      console.error('Error al guardar banner:', error)
      toast.error('Error al guardar el banner')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('El nombre de la sede es requerido')
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
        // Detectar cambio de dirección (reubicación)
        const addressChanged = (
          (editingLocation.address || '') !== (locationData.address || '') ||
          (editingLocation.city || '') !== (locationData.city || '') ||
          (editingLocation.state || '') !== (locationData.state || '') ||
          (editingLocation.country || '') !== (locationData.country || '') ||
          (editingLocation.postal_code || '') !== (locationData.postal_code || '')
        )

        // Actualizar sede
        const { error } = await supabase
          .from('locations')
          .update(locationData)
          .eq('id', editingLocation.id)

        if (error) throw error
        locationId = editingLocation.id

        toast.success('Sede actualizada exitosamente')

        // Si cambió la dirección, notificar a clientes con citas pendientes en esta sede
        if (addressChanged && locationId) {
          try {
            const activeStatuses = ['pending', 'confirmed']
            const { data: apptsToNotify, error: apptErr } = await supabase
              .from('appointments')
              .select(`
                id,
                start_time,
                business_id,
                client_id,
                profiles:client_id ( full_name, email )
              `)
              .eq('location_id', locationId)
              .in('status', activeStatuses)

            if (apptErr) throw apptErr

            let notifiedCount = 0
            for (const appt of (apptsToNotify ?? [])) {
              const recipientEmail = appt?.profiles?.email
              const recipientName = appt?.profiles?.full_name || 'Cliente'
              if (!recipientEmail) continue

              const startDate = new Date(appt.start_time)
              const dateStr = startDate.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
              const timeStr = startDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

              await supabase.functions.invoke('send-notification', {
                body: {
                  type: 'appointment_location_update',
                  recipient_user_id: appt.client_id,
                  recipient_email: recipientEmail,
                  recipient_name: recipientName,
                  business_id: appt.business_id,
                  appointment_id: appt.id,
                  data: {
                    name: recipientName,
                    date: dateStr,
                    time: timeStr,
                    new_address: `${locationData.address || ''}, ${locationData.city || ''}`.trim(),
                  }
                }
              })
              notifiedCount += 1
            }

            if (notifiedCount > 0) {
              toast.info(`Dirección actualizada: se notificó por email a ${notifiedCount} cliente(s) con citas pendientes`)
            }
          } catch (notifyErr) {
            console.error('Error al notificar reubicación:', notifyErr)
            toast.error('La sede fue actualizada, pero hubo un error enviando notificaciones de reubicación')
          }
        }
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
        
        toast.success('Sede creada exitosamente')
      }

      // Subir multimedia si hay archivos pendientes y es una edición
      if (editingLocation && uploadMediaFn) {
        try {
          await uploadMediaFn()
        } catch (mediaError) {
          console.error('Error uploading media:', mediaError)
          toast.error('Sede guardada, pero hubo un error al subir la multimedia')
        }
      }

      await fetchLocations()
      handleCloseDialog()
    } catch (err) {
      console.error('Error saving location:', err)
      toast.error(editingLocation ? 'Error al actualizar la sede' : 'Error al crear la sede')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (locationId: string) => {
    try {
      // Buscar citas activas en esta sede para informar cuántas se cancelarán
      const activeStatuses = ['pending', 'confirmed']
      const { data: apptsToCancel, error: fetchApptsError } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          business_id,
          client_id,
          profiles:client_id ( full_name, email ),
          service:service_id ( name )
        `)
        .eq('location_id', locationId)
        .in('status', activeStatuses)

      if (fetchApptsError) throw fetchApptsError
      const cancelCount = (apptsToCancel ?? []).length

      const confirmed = confirm(
        cancelCount > 0
          ? `¿Estás seguro de eliminar esta sede? Se cancelarán ${cancelCount} cita(s) y se notificará a los clientes. Si es una reubicación, considera editar la dirección y actualizar las imágenes en lugar de eliminar.`
          : '¿Estás seguro de eliminar esta sede? Si es una reubicación, considera editar la dirección y actualizar las imágenes en lugar de eliminar.'
      )
      if (!confirmed) return

      // Cancelar citas afectadas antes de eliminar la sede
      if (cancelCount > 0) {
        const { error: cancelError } = await supabase
          .from('appointments')
          .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancel_reason: 'Sede eliminada' })
          .eq('location_id', locationId)
          .in('status', activeStatuses)
        if (cancelError) throw cancelError

        // Notificar al cliente: forzar in-app + email usando servicio centralizado
        for (const appt of (apptsToCancel ?? [])) {
          const startDate = new Date(appt.start_time)
          const dateStr = startDate.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
          const timeStr = startDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

          await sendAppointmentCancellationNotification({
            appointmentId: appt.id,
            businessId: appt.business_id,
            recipientUserId: appt.client_id,
            recipientEmail: appt?.profiles?.email,
            recipientName: appt?.profiles?.full_name || 'Cliente',
            date: dateStr,
            time: timeStr,
            service: appt?.service?.name || 'Servicio',
          })
        }
      }

      // Eliminar la sede
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', locationId)
      if (error) throw error

      toast.success(
        cancelCount > 0
          ? `Sede eliminada: se cancelaron ${cancelCount} cita(s) y clientes notificados`
          : 'Sede eliminada exitosamente'
      )
      await fetchLocations()
    } catch (err) {
      console.error('Error al eliminar la sede:', err)
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

  // Funciones para manejar multimedia existente
  const handleDeleteExistingMedia = async (mediaId: string) => {
    try {
      const { error } = await supabase
        .from('location_media')
        .delete()
        .eq('id', mediaId)

      if (error) throw error

      setExistingMedia(prev => prev.filter(media => media.id !== mediaId))
      toast.success('Multimedia eliminada exitosamente')
      
      // Recargar ubicaciones para actualizar las tarjetas
      await fetchLocations()
    } catch (err) {
      console.error('Error deleting media:', err)
      toast.error('Error al eliminar multimedia')
    }
  }

  const handleUpdateMediaDescription = async (mediaId: string, description: string) => {
    try {
      const { error } = await supabase
        .from('location_media')
        .update({ description: description.trim() || null })
        .eq('id', mediaId)

      if (error) throw error

      setExistingMedia(prev => prev.map(media => 
        media.id === mediaId ? { ...media, description: description.trim() || null } : media
      ))
      toast.success('Descripción actualizada')
    } catch (err) {
      console.error('Error updating media description:', err)
      toast.error('Error al actualizar descripción')
    }
  }

  const handleToggleBanner = async (mediaId: string, currentIsBanner: boolean) => {
    if (!editingLocation) return

    try {
      if (!currentIsBanner) {
        // Desmarcar otros banners primero
        await supabase
          .from('location_media')
          .update({ is_banner: false })
          .eq('location_id', editingLocation.id)
          .eq('type', 'image')
      }

      // Marcar/desmarcar este como banner
      const { error } = await supabase
        .from('location_media')
        .update({ is_banner: !currentIsBanner })
        .eq('id', mediaId)

      if (error) throw error

      setExistingMedia(prev => prev.map(media => ({
        ...media,
        is_banner: media.id === mediaId ? !currentIsBanner : (media.type === 'image' ? false : media.is_banner)
      })))
      
      toast.success(currentIsBanner ? 'Banner desmarcado' : 'Banner marcado')
      
      // Refrescar banderas para que las tarjetas se actualicen
      await refreshMediaFlags()
    } catch (err) {
      console.error('Error toggling banner:', err)
      toast.error('Error al cambiar banner')
    }
  }

  const handleTogglePrimaryVideo = async (mediaId: string, currentIsPrimary: boolean) => {
    if (!editingLocation) return

    try {
      if (!currentIsPrimary) {
        // Desmarcar otros videos primarios primero
        await supabase
          .from('location_media')
          .update({ is_primary: false })
          .eq('location_id', editingLocation.id)
          .eq('type', 'video')
      }

      // Marcar/desmarcar este como video principal
      const { error } = await supabase
        .from('location_media')
        .update({ is_primary: !currentIsPrimary })
        .eq('id', mediaId)

      if (error) throw error

      setExistingMedia(prev => prev.map(media => ({
        ...media,
        is_primary: media.id === mediaId ? !currentIsPrimary : (media.type === 'video' ? false : media.is_primary)
      })))
      
      toast.success(currentIsPrimary ? 'Video principal desmarcado' : 'Video principal marcado')
      
      // Recargar ubicaciones para actualizar las tarjetas
      await fetchLocations()
    } catch (err) {
      console.error('Error toggling primary video:', err)
      toast.error('Error al cambiar video principal')
    }
  }

  // Funciones para manejar descripciones temporales
  const handleTempDescriptionChange = (mediaId: string, value: string) => {
    setTempDescriptions(prev => ({
      ...prev,
      [mediaId]: value
    }))
  }

  const handleSaveDescription = async (mediaId: string) => {
    const description = tempDescriptions[mediaId]
    if (description === undefined) return

    setSavingDescriptions(prev => ({ ...prev, [mediaId]: true }))
    
    try {
      const { error } = await supabase
        .from('location_media')
        .update({ description: description.trim() || null })
        .eq('id', mediaId)

      if (error) throw error

      setExistingMedia(prev => prev.map(media => 
        media.id === mediaId ? { ...media, description: description.trim() || null } : media
      ))
      
      // Limpiar descripción temporal
      setTempDescriptions(prev => {
        const newTemp = { ...prev }
        delete newTemp[mediaId]
        return newTemp
      })
      
      toast.success('Descripción guardada')
    } catch (err) {
      console.error('Error saving description:', err)
      toast.error('Error al guardar descripción')
    } finally {
      setSavingDescriptions(prev => ({ ...prev, [mediaId]: false }))
    }
  }

  const getDisplayDescription = (media: any) => {
    return tempDescriptions[media.id] !== undefined 
      ? tempDescriptions[media.id] 
      : media.description || ''
  }

  const hasUnsavedChanges = (media: any) => {
    return tempDescriptions[media.id] !== undefined && 
           tempDescriptions[media.id] !== (media.description || '')
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
          <p className="text-muted-foreground text-xs sm:text-sm">Gestiona las ubicaciones de tu negocio</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleOpenDialog()}
            className="bg-primary hover:bg-primary/90 w-full sm:w-auto min-h-[44px]"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Agregar Sede</span>
            <span className="sm:hidden">Nueva Sede</span>
          </Button>
        </div>
      </div>

      {/* Locations Grid - Responsive */}
      {locations.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
            <MapPin className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No hay sedes aún</h3>
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
          {locations.map((location) => (
            <Card
              key={location.id}
              className="relative overflow-hidden cursor-pointer group"
              onClick={() => handleOpenProfile(location)}
            >
              {/* Banner superior (50% de la tarjeta) */}
              {locationBanners[location.id] && (
                <img
                  src={locationBanners[location.id]}
                  alt=""
                  className="absolute left-0 top-0 w-full object-cover"
                  style={{ height: '50%' }}
                  aria-hidden="true"
                  onError={(e) => {
                    const img = e.currentTarget as HTMLImageElement
                    img.style.display = 'none'
                  }}
                />
              )}
              {/* Degradado para legibilidad (en la mitad superior) */}
              {locationBanners[location.id] && (
                <div
                  className="absolute left-0 top-0 w-full bg-gradient-to-t from-black/40 via-black/30 to-transparent"
                  style={{ height: '50%' }}
                />
              )}
              <CardHeader className="p-3 sm:p-6 relative z-10">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className={`text-base sm:text-lg truncate font-semibold ${locationBanners[location.id] ? 'text-white drop-shadow-lg' : 'text-foreground'}`}>{location.name}</CardTitle>
                      {location.is_primary && (
                        <Badge variant="default" className="text-[10px] sm:text-xs">
                          Principal
                        </Badge>
                      )}
                      {preferredLocationId === location.id && (
                        <Badge variant="outline" className="text-[10px] sm:text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700">
                          ⭐ Administrada
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
                      onClick={(e) => { e.stopPropagation(); handleOpenDialog(location) }}
                      className={`min-w-[44px] min-h-[44px] ${locationBanners[location.id] ? 'text-white/80 hover:text-white bg-black/20 hover:bg-black/30' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); handleDelete(location.id) }}
                      className={`min-w-[44px] min-h-[44px] ${locationBanners[location.id] ? 'text-white/80 hover:text-red-300 bg-black/20 hover:bg-red-500/30' : 'text-muted-foreground hover:text-red-400'}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-6 relative z-10">
                {location.address && (
                  <div className="flex items-start gap-2 text-xs sm:text-sm">
                    <MapPin className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0 ${locationBanners[location.id] ? 'text-white/70' : 'text-muted-foreground'}`} />
                    <LocationAddress
                      address={location.address}
                      cityId={location.city}
                      stateId={location.state}
                      postalCode={location.postal_code}
                      className={`line-clamp-2 ${locationBanners[location.id] ? 'text-white/80' : 'text-muted-foreground'}`}
                    />
                  </div>
                )}
                {location.phone && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Phone className={`h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 ${locationBanners[location.id] ? 'text-white/70' : 'text-muted-foreground'}`} />
                    <span className={`truncate ${locationBanners[location.id] ? 'text-white/80' : 'text-muted-foreground'}`}>{location.phone}</span>
                  </div>
                )}
                {location.email && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Mail className={`h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 ${locationBanners[location.id] ? 'text-white/70' : 'text-muted-foreground'}`} />
                    <span className={`truncate ${locationBanners[location.id] ? 'text-white/80' : 'text-muted-foreground'}`}>{location.email}</span>
                  </div>
                )}
                {location.business_hours && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">Horarios configurados</span>
                  </div>
                )}
                {location.images && location.images.length > 0 && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">{location.images.length} imagen(es)</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Perfil de Sede */}
      {profileLocation && (
        <LocationProfileModal
          open={isProfileOpen}
          onOpenChange={setIsProfileOpen}
          location={profileLocation}
          bannerUrl={locationBanners[profileLocation.id]}
          primaryVideoUrl={locationPrimaryVideos[profileLocation.id]}
        />
      )}

      {/* Create/Edit Dialog - Mobile Responsive */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
  <DialogContent className="bg-card border-border text-foreground max-w-[95vw] sm:max-w-3xl lg:max-w-5xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? 'Editar Sede' : 'Crear Nueva Sede'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingLocation
                ? 'Actualiza la información de la sede'
                : 'Completa la información de la nueva sede'}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'info' | 'expenses')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Información</TabsTrigger>
              <TabsTrigger value="expenses" disabled={!editingLocation}>
                Egresos
                {!editingLocation && <span className="ml-2 text-xs">(Guarda primero)</span>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Name */}
            <div>
              <Label htmlFor="name" className="text-sm sm:text-base">Nombre de la Sede *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ej: Sede Centro"
                required
                className="min-h-[44px]"
              />
            </div>

            {/* Address */}
            <div>
              <Label htmlFor="address" className="text-sm sm:text-base">Dirección</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Calle y número"
                className="min-h-[44px]"
              />
            </div>

            {/* Country, Region, City, Postal Code - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="country" className="text-sm sm:text-base">País</Label>
                <Input
                  id="country"
                  value="Colombia"
                  disabled
                  className="min-h-[44px] bg-muted"
                />
              </div>
              <div>
                <Label className="text-sm sm:text-base">Departamento</Label>
                <RegionSelect
                  countryId="01b4e9d1-a84e-41c9-8768-253209225a21"
                  value={selectedRegionId}
                  onChange={(value) => {
                    setSelectedRegionId(value)
                    handleChange('state', value)
                  }}
                  placeholder="Seleccione departamento"
                  className="min-h-[44px]"
                />
              </div>
              <div>
                <Label className="text-sm sm:text-base">Ciudad</Label>
                <CitySelect
                  regionId={selectedRegionId}
                  value={formData.city}
                  onChange={(value) => handleChange('city', value)}
                  placeholder="Seleccione ciudad"
                  className="min-h-[44px]"
                />
              </div>
              <div>
                <Label htmlFor="postal_code" className="text-sm sm:text-base">Código Postal</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code}
                  onChange={(e) => handleChange('postal_code', e.target.value)}
                  placeholder="00000"
                  className="min-h-[44px]"
                />
              </div>
            </div>

            {/* Phone & Email - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="phone" className="text-sm sm:text-base">Teléfono</Label>
                <PhoneInput
                  value={formData.phone || ''}
                  onChange={val => handleChange('phone', val)}
                  prefix={formData.phone?.startsWith('+') ? formData.phone.split(' ')[0] : '+57'}
                  onPrefixChange={prefix => {
                    // Actualiza el valor completo con el nuevo prefijo
                    const number = formData.phone?.replace(/^\+\d+\s*/, '') || '';
                    handleChange('phone', `${prefix} ${number}`)
                  }}
                  placeholder="Número de teléfono"
                  className="min-h-[44px]"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  className="min-h-[44px]"
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="sede@negocio.com"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-sm sm:text-base">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
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
                onChange={(hours) => handleChange('business_hours', hours)}
              />
            </div>

            {/* Multimedia */}
            <div>
              <Label className="text-sm sm:text-base">Multimedia de la Sede</Label>
              <div className="space-y-3 sm:space-y-4">
                {/* Galería de multimedia existente */}
                {editingLocation && (
                  <div className="space-y-4">
                    {isLoadingMedia ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">Cargando multimedia...</p>
                      </div>
                    ) : existingMedia.length > 0 ? (
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium">Multimedia actual</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {existingMedia.map((media) => (
                            <div key={media.id} className="relative group border rounded-lg overflow-hidden">
                              {media.type === 'image' ? (
                                <img
                                  src={media.url}
                                  alt={media.description || 'Imagen'}
                                  className="w-full h-32 object-cover"
                                />
                              ) : (
                                <div className="relative w-full h-32 bg-gray-100 flex items-center justify-center">
                                  <video
                                    src={media.url}
                                    className="w-full h-full object-cover"
                                    muted
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <Play className="h-8 w-8 text-white" />
                                  </div>
                                </div>
                              )}
                              
                              {/* Badges */}
                              <div className="absolute top-2 left-2 flex flex-col gap-1">
                                {media.is_banner && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Star className="h-3 w-3 mr-1" />
                                    Banner
                                  </Badge>
                                )}
                                {media.is_primary && media.type === 'video' && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Play className="h-3 w-3 mr-1" />
                                    Principal
                                  </Badge>
                                )}
                              </div>

                              {/* Overlay con controles */}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteExistingMedia(media.id)}
                                    className="h-7 w-7 p-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                                
                                <div className="space-y-2">
                                  {/* Descripción editable */}
                                  <div className="flex gap-1">
                                    <Input
                                      placeholder="Descripción..."
                                      value={getDisplayDescription(media)}
                                      onChange={(e) => handleTempDescriptionChange(media.id, e.target.value)}
                                      className="text-xs h-7 bg-background/90 border-border flex-1"
                                    />
                                    {hasUnsavedChanges(media) && (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="default"
                                        onClick={() => handleSaveDescription(media.id)}
                                        disabled={savingDescriptions[media.id]}
                                        className="h-7 w-7 p-0"
                                      >
                                        {savingDescriptions[media.id] ? (
                                          <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                                        ) : (
                                          <Save className="h-3 w-3" />
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                  
                                  {/* Botones de acción */}
                                  <div className="flex gap-1">
                                    {media.type === 'image' && (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant={media.is_banner ? "default" : "secondary"}
                                        onClick={() => handleToggleBanner(media.id, media.is_banner)}
                                        className="h-7 px-2 text-xs flex-1"
                                      >
                                        <Star className="h-3 w-3 mr-1" />
                                        {media.is_banner ? 'Quitar Banner' : 'Marcar Banner'}
                                      </Button>
                                    )}
                                    {media.type === 'video' && (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant={media.is_primary ? "default" : "secondary"}
                                        onClick={() => handleTogglePrimaryVideo(media.id, media.is_primary)}
                                        className="h-7 px-2 text-xs flex-1"
                                      >
                                        <Play className="h-3 w-3 mr-1" />
                                        {media.is_primary ? 'Quitar Principal' : 'Marcar Principal'}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 border-2 border-dashed border-gray-200 rounded-lg">
                        <p className="text-sm text-muted-foreground">No hay multimedia subida aún</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Upload multimedia unificado (images + videos) */}
                {editingLocation ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Subir nueva multimedia</h4>
                    <MediaUploader
                      locationId={editingLocation.id}
                      onUploadComplete={() => {
                        // Recargar ubicaciones y multimedia después de subir
                        fetchLocations()
                        loadExistingMedia(editingLocation.id)
                      }}
                      onUploadError={(error) => toast.error(error)}
                      onBannerCropRequest={(imageUrl) => {
                        // Activar recorte automático cuando se marca como banner
                        setBannerImageToEdit(imageUrl)
                        setIsBannerCropperOpen(true)
                      }}
                      onUploadTrigger={handleUploadTrigger}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Podrás subir multimedia después de crear la sede
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Active Status & Primary Location - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-center gap-3 p-3 sm:p-4 rounded-lg border border-border bg-card min-h-[68px]">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleChange('is_active', checked === true)}
                  className="min-w-[44px] min-h-[44px]"
                />
                <div className="flex flex-col">
                  <Label htmlFor="is_active" className="cursor-pointer text-xs sm:text-sm font-medium text-foreground">
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
                  onCheckedChange={(checked) => handleChange('is_primary', checked === true)}
                  className="min-w-[44px] min-h-[44px]"
                />
                <div className="flex flex-col">
                  <Label htmlFor="is_primary" className="cursor-pointer text-xs sm:text-sm font-medium text-foreground">
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
            </TabsContent>

            <TabsContent value="expenses" className="mt-6">
              {editingLocation && (
                <LocationExpenseConfig
                  locationId={editingLocation.id}
                  businessId={businessId}
                  locationName={editingLocation.name}
                />
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Banner Cropper */}
      {bannerImageToEdit && (
        <BannerCropper
          open={isBannerCropperOpen}
          onOpenChange={setIsBannerCropperOpen}
          imageUrl={bannerImageToEdit}
          onSave={handleBannerSave}
        />
      )}
    </div>
  )
}
