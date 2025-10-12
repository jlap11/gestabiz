import { useState } from 'react'
import { QrCode, Copy, Download, CheckCircle, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { Business } from '@/types/types'
import QRCode from 'qrcode'

interface BusinessInvitationCardProps {
  business: Business
  className?: string
}

export function BusinessInvitationCard({ business, className }: BusinessInvitationCardProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)

  const invitationCode = business.invitation_code || 'N/A'

  // Generate QR code data
  const qrData = JSON.stringify({
    type: 'business_invitation',
    business_id: business.id,
    business_name: business.name,
    invitation_code: invitationCode,
    generated_at: new Date().toISOString(),
  })

  const handleCopyCode = () => {
    navigator.clipboard.writeText(invitationCode)
    toast.success('Código copiado al portapapeles')
  }

  const handleGenerateQR = async () => {
    setIsGeneratingQR(true)
    try {
      const dataUrl = await QRCode.toDataURL(qrData, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
      setQrCodeDataUrl(dataUrl)
      toast.success('Código QR generado')
    } catch (error) {
      console.error('Error generating QR:', error)
      toast.error('Error al generar código QR')
    } finally {
      setIsGeneratingQR(false)
    }
  }

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return

    const link = document.createElement('a')
    link.download = `${business.name.replace(/\s+/g, '-')}-invitacion-QR.png`
    link.href = qrCodeDataUrl
    link.click()
    toast.success('Código QR descargado')
  }

  const handleShare = async () => {
    const shareText = `¡Únete a ${business.name}!\n\nCódigo de invitación: ${invitationCode}\n\nIngresa este código en AppointSync para unirte como empleado.`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invitación a ${business.name}`,
          text: shareText,
        })
        toast.success('Compartido exitosamente')
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error sharing:', error)
          toast.error('Error al compartir')
        }
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText)
      toast.success('Texto de invitación copiado')
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Código de invitación
        </CardTitle>
        <CardDescription>
          Comparte este código con empleados para que puedan unirse a tu negocio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invitation Code Display */}
        <div className="space-y-3">
          <div className="flex items-center justify-center p-6 bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-950/30 dark:to-purple-900/30 rounded-lg border-2 border-dashed border-violet-300 dark:border-violet-700">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Tu código de invitación</p>
              <p className="text-4xl font-bold font-mono tracking-widest text-violet-600 dark:text-violet-400">
                {invitationCode}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyCode} className="w-full">
              <Copy className="h-4 w-4 mr-2" />
              Copiar código
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare} className="w-full">
              <Share2 className="h-4 w-4 mr-2" />
              Compartir
            </Button>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="space-y-3">
          <div className="h-px bg-border" />

          {!qrCodeDataUrl ? (
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleGenerateQR}
              disabled={isGeneratingQR}
            >
              {isGeneratingQR ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  Generar código QR
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              {/* QR Code Image */}
              <div className="flex justify-center p-4 bg-white rounded-lg border">
                <img src={qrCodeDataUrl} alt="Código QR de invitación" className="w-64 h-64" />
              </div>

              {/* QR Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={handleDownloadQR} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar QR
                </Button>
                <Button variant="outline" size="sm" onClick={handleGenerateQR} className="w-full">
                  <QrCode className="h-4 w-4 mr-2" />
                  Regenerar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-lg">
          <p className="font-medium text-foreground">¿Cómo funciona?</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>Comparte el código o QR con tu empleado</li>
            <li>El empleado lo ingresa en la app o escanea el QR</li>
            <li>Recibirás una notificación para aprobar la solicitud</li>
            <li>Una vez aprobado, podrá acceder como empleado</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
