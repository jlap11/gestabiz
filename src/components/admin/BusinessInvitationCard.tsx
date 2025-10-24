import { useState } from 'react'
import { CheckCircle, Copy, Download, QrCode, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { Business } from '@/types/types'
import QRCode from 'qrcode'
import { useLanguage } from '@/contexts/LanguageContext'

interface BusinessInvitationCardProps {
  business: Business
  className?: string
}

export function BusinessInvitationCard({ business, className }: BusinessInvitationCardProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  const { t } = useLanguage()

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
    toast.success(t('businessInvitationCard.copied'))
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
      toast.success(t('businessInvitationCard.qrGenerated'))
    } catch (error) {
      console.error('Error generating QR:', error)
      toast.error(t('businessInvitationCard.qrError'))
    } finally {
      setIsGeneratingQR(false)
    }
  }

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return

    const link = document.createElement('a')
    link.download = `${business.name.replaceAll(/\s+/g, '-')}-invitacion-QR.png`
    link.href = qrCodeDataUrl
    link.click()
    toast.success(t('businessInvitationCard.qrDownloaded'))
  }

  const handleShare = async () => {
    const shareText = `¡Únete a ${business.name}!\n\n${t('businessInvitationCard.code')}: ${invitationCode}\n\nIngresa este código en AppointSync para unirte como empleado.`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${t('businessInvitationCard.invitationTo')} ${business.name}`,
          text: shareText,
        })
        toast.success(t('businessInvitationCard.shareSuccess'))
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Error sharing:', error)
          toast.error(t('businessInvitationCard.shareError'))
        }
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText)
      toast.success(t('businessInvitationCard.copyCode'))
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          {t('businessInvitationCard.title')}
        </CardTitle>
        <CardDescription>{t('businessInvitationCard.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invitation Code Display */}
        <div className="space-y-3">
          <div className="flex items-center justify-center p-6 bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-950/30 dark:to-purple-900/30 rounded-lg border-2 border-dashed border-violet-300 dark:border-violet-700">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground font-medium">
                {t('businessInvitationCard.yourCode')}
              </p>
              <p className="text-4xl font-bold font-mono tracking-widest text-violet-600 dark:text-violet-400">
                {invitationCode}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyCode} className="w-full">
              <Copy className="h-4 w-4 mr-2" />
              {t('businessInvitationCard.copyCode')}
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare} className="w-full">
              <Share2 className="h-4 w-4 mr-2" />
              {t('businessInvitationCard.share')}
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
                  {t('businessInvitationCard.generating')}
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  {t('businessInvitationCard.generateQR')}
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
                  {t('businessInvitationCard.downloadQR')}
                </Button>
                <Button variant="outline" size="sm" onClick={handleGenerateQR} className="w-full">
                  <QrCode className="h-4 w-4 mr-2" />
                  {t('businessInvitationCard.regenerate')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-3 rounded-lg">
          <p className="font-medium text-foreground">{t('businessInvitationCard.howItWorks')}</p>
          <ol className="list-decimal list-inside space-y-0.5">
            <li>{t('businessInvitationCard.step1')}</li>
            <li>{t('businessInvitationCard.step2')}</li>
            <li>{t('businessInvitationCard.step3')}</li>
            <li>{t('businessInvitationCard.step4')}</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
