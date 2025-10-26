import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useFileUpload } from '@/hooks/useFileUpload'
import { ImageCropper } from '@/components/settings/ImageCropper'
import { BannerCropper } from '@/components/settings/BannerCropper'

interface BusinessBrandingProps {
  businessId: string
}

export function BusinessBranding({ businessId }: Readonly<BusinessBrandingProps>) {
  const { uploadFile, deleteFile } = useFileUpload('business-logos')

  const [loadingInitial, setLoadingInitial] = useState(true)
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [bannerUrl, setBannerUrl] = useState<string>('')

  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)

  // Cropper states
  const [showLogoCropper, setShowLogoCropper] = useState(false)
  const [showBannerCropper, setShowBannerCropper] = useState(false)
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null)
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('logo_url, banner_url')
          .eq('id', businessId)
          .single()
        if (error) throw error
        setLogoUrl(data?.logo_url || '')
        setBannerUrl(data?.banner_url || '')
      } catch (err) {
        // Keep empty if not present
      } finally {
        setLoadingInitial(false)
      }
    }
    load()
  }, [businessId])

  // File inputs handlers
  const onLogoFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida')
      return
    }
    setSelectedLogoFile(file)
    setShowLogoCropper(true)
  }

  const onBannerFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida')
      return
    }
    setSelectedBannerFile(file)
    setShowBannerCropper(true)
  }

  // Upload helpers
  const uploadLogo = async (croppedBlob: Blob) => {
    setIsUploadingLogo(true)
    try {
      // Delete old logo if it was stored in Supabase
      if (logoUrl && logoUrl.includes('supabase')) {
        const oldName = logoUrl.split('/').pop()
        if (oldName) {
          await deleteFile(`${businessId}/${oldName}`)
        }
      }

      const fileName = `logo-${Date.now()}.jpg`
      const croppedFile = new File([croppedBlob], fileName, { type: 'image/jpeg' })
      const path = `${businessId}/${fileName}`

      const result = await uploadFile(croppedFile, path, {
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        maxSizeMB: 2
      })

      if (!result.success || !result.url) {
        throw new Error(result.error || 'No fue posible subir el logo')
      }

      const cleanUrl = result.url
      const { error: updateError } = await supabase
        .from('businesses')
        .update({ logo_url: cleanUrl })
        .eq('id', businessId)

      if (updateError) throw updateError

      const nextUrl = `${cleanUrl}?t=${Date.now()}`
      setLogoUrl(nextUrl)
      toast.success('Logo actualizado correctamente')
    } catch (err) {
      const e = err as Error
      toast.error(e.message || 'Error al actualizar el logo')
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const uploadBanner = async (croppedBlob: Blob) => {
    setIsUploadingBanner(true)
    try {
      // Delete old banner if it was stored in Supabase
      if (bannerUrl && bannerUrl.includes('supabase')) {
        const oldName = bannerUrl.split('/').pop()
        if (oldName) {
          await deleteFile(`${businessId}/${oldName}`)
        }
      }

      const fileName = `banner-${Date.now()}.jpg`
      const croppedFile = new File([croppedBlob], fileName, { type: 'image/jpeg' })
      const path = `${businessId}/${fileName}`

      const result = await uploadFile(croppedFile, path, {
        allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
        // Banner puede ser más grande: permitir hasta 5MB
        maxSizeMB: 5
      })

      if (!result.success || !result.url) {
        throw new Error(result.error || 'No fue posible subir el banner')
      }

      const cleanUrl = result.url
      const { error: updateError } = await supabase
        .from('businesses')
        .update({ banner_url: cleanUrl })
        .eq('id', businessId)

      if (updateError) throw updateError

      const nextUrl = `${cleanUrl}?t=${Date.now()}`
      setBannerUrl(nextUrl)
      toast.success('Banner actualizado correctamente')
    } catch (err) {
      const e = err as Error
      toast.error(e.message || 'Error al actualizar el banner')
    } finally {
      setIsUploadingBanner(false)
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Logo y Banner del Negocio</CardTitle>
          <CardDescription>
            Sube imágenes optimizadas para tu perfil público. El logo se recorta cuadrado y el banner en proporción 16:9.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Banner section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Banner</Label>
            <div className="relative w-full overflow-hidden rounded-lg border border-border bg-muted/30">
              {loadingInitial ? (
                <div className="flex items-center justify-center h-40 text-muted-foreground">
                  Cargando...
                </div>
              ) : bannerUrl ? (
                <img
                  key={bannerUrl}
                  src={bannerUrl}
                  alt="Banner del negocio"
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  Sin banner aún
                </div>
              )}
              <label className={`absolute bottom-3 right-3 inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-md px-3 py-2 shadow-md transition-all border-2 border-background ${isUploadingBanner ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-primary/90 hover:scale-[1.02]'}`}>
                {isUploadingBanner ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span className="text-sm">Cambiar banner</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={onBannerFileSelected}
                />
              </label>
            </div>
          </div>

          {/* Logo section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Logo</Label>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar key={logoUrl} className="h-20 w-20 border-2 border-primary/20">
                  {logoUrl ? (
                    <AvatarImage src={logoUrl} alt="Logo del negocio" />
                  ) : (
                    <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                      {/* Placeholder initials if no logo */}
                      {getInitials('NB')}
                    </AvatarFallback>
                  )}
                </Avatar>
                <label className={`absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-2 shadow-md transition-all border-2 border-background ${isUploadingLogo ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-primary/90 hover:scale-105'}`}>
                  {isUploadingLogo ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={onLogoFileSelected}
                  />
                </label>
              </div>
              <div className="text-sm text-muted-foreground">
                Sube un logo cuadrado. Se recomienda 512x512.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Croppers */}
      <ImageCropper
        isOpen={showLogoCropper}
        onClose={() => {
          setShowLogoCropper(false)
          setSelectedLogoFile(null)
        }}
        imageFile={selectedLogoFile}
        onCropComplete={uploadLogo}
      />

      <BannerCropper
        isOpen={showBannerCropper}
        onClose={() => {
          setShowBannerCropper(false)
          setSelectedBannerFile(null)
        }}
        imageFile={selectedBannerFile}
        onCropComplete={uploadBanner}
      />
    </div>
  )
}
