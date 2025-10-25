import { Building2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { compressImageForBanner } from '@/lib/imageCompression'

interface BannerUploadProps {
  bannerFile: File | null
  bannerPreview: string | null
  onBannerChange: (file: File | null, preview: string | null) => void
  onShowCropper: () => void
}

export function BannerUpload({ 
  bannerFile, 
  bannerPreview, 
  onBannerChange, 
  onShowCropper 
}: BannerUploadProps) {
  const handleBannerUpload = async (file: File) => {
    try {
      toast.loading('Comprimiendo banner...')
      
      const compressedBlob = await compressImageForBanner(file)
      const compressedFile = new File([compressedBlob], file.name, {
        type: 'image/jpeg',
      })
      
      toast.dismiss()
      onBannerChange(compressedFile, null)
      onShowCropper()
      toast.success('Banner comprimido exitosamente')
    } catch (error) {
      toast.dismiss()
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(`Error al comprimir banner: ${errorMsg}`)
    }
  }

  const clearBanner = () => {
    onBannerChange(null, null)
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Building2 className="h-5 w-5 text-primary" />
          Banner del negocio
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Sube un banner panorámico para tu negocio (opcional, se subirá al crear el negocio)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {bannerPreview ? (
            <div className="space-y-4">
              <div className="relative w-full bg-muted rounded-lg border-2 border-violet-500/20 overflow-hidden">
                <div className="aspect-video flex items-center justify-center bg-muted">
                  <img
                    src={bannerPreview}
                    alt="Preview banner"
                    className="w-full h-full object-contain"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8"
                  onClick={clearBanner}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={clearBanner}
                className="w-full"
              >
                Cambiar imagen
              </Button>
            </div>
          ) : (
            <button
              type="button"
              className="w-full text-left"
              onClick={() => document.getElementById('banner-input')?.click()}
            >
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-foreground/90 mb-2">
                  Click para seleccionar o arrastra una imagen
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, WEBP (máx. 2MB) - Aspecto 16:9
                </p>
              </div>
            </button>
          )}

          <input
            id="banner-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) {
                handleBannerUpload(file)
              }
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}