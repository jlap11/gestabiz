import { Building2, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { compressImageForLogo } from '@/lib/imageCompression'

interface LogoUploadProps {
  logoFile: File | null
  logoPreview: string | null
  onLogoChange: (file: File | null, preview: string | null) => void
}

export function LogoUpload({ logoFile, logoPreview, onLogoChange }: LogoUploadProps) {
  const handleLogoUpload = async (file: File) => {
    try {
      toast.loading('Comprimiendo imagen...')
      
      const compressedBlob = await compressImageForLogo(file)
      const compressedFile = new File([compressedBlob], file.name, {
        type: 'image/jpeg',
      })
      
      toast.dismiss()
      onLogoChange(compressedFile, URL.createObjectURL(compressedBlob))
      toast.success('Logo comprimido exitosamente')
    } catch (error) {
      toast.dismiss()
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(`Error al comprimir imagen: ${errorMsg}`)
    }
  }

  const clearLogo = () => {
    onLogoChange(null, null)
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Building2 className="h-5 w-5 text-primary" />
          Logo del negocio
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Sube el logo de tu negocio (opcional, se subirá al crear el negocio)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logoPreview ? (
            <div className="space-y-4">
              <div className="relative w-48 h-48 mx-auto">
                <img
                  src={logoPreview}
                  alt="Preview logo"
                  className="w-full h-full object-cover rounded-lg border-2 border-violet-500/20"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-8 w-8"
                  onClick={clearLogo}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={clearLogo}
                className="w-full"
              >
                Cambiar imagen
              </Button>
            </div>
          ) : (
            <button
              type="button"
              className="w-full text-left"
              onClick={() => document.getElementById('logo-input')?.click()}
            >
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-foreground/90 mb-2">
                  Click para seleccionar o arrastra una imagen
                </p>
                <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (máx. 2MB)</p>
              </div>
            </button>
          )}
          
          <input
            id="logo-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) {
                handleLogoUpload(file)
              }
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}