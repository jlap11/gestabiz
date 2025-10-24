import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Cookie, X } from 'lucide-react'
import { grantAnalyticsConsent, revokeAnalyticsConsent } from '@/hooks/useAnalytics'
import { initializeGA4, updateGA4Consent } from '@/lib/ga4'
import { useLanguage } from '@/contexts/LanguageContext'

/**
 * CookieConsent Banner Component
 *
 * Banner GDPR-compliant para solicitar consentimiento de cookies analíticas.
 * Se muestra solo si el usuario no ha tomado una decisión previa.
 *
 * Features:
 * - Persistencia en localStorage ('ga_consent')
 * - Inicializa GA4 automáticamente al aceptar
 * - Actualiza consent mode de GA4
 * - Botones: Aceptar / Rechazar / Cerrar (X)
 * - Responsive design
 * - Traducciones español/inglés
 */
export function CookieConsent() {
  const [show, setShow] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    // Mostrar banner solo si no hay decisión previa
    const hasDecision = localStorage.getItem('ga_consent') !== null
    setShow(!hasDecision)
  }, [])

  const handleAccept = () => {
    // Otorgar consentimiento
    grantAnalyticsConsent()

    // Inicializar GA4
    initializeGA4()

    // Actualizar consent mode
    updateGA4Consent(true)

    // Ocultar banner
    setShow(false)
  }

  const handleReject = () => {
    // Revocar consentimiento
    revokeAnalyticsConsent()

    // Actualizar consent mode (denied)
    updateGA4Consent(false)

    // Ocultar banner
    setShow(false)
  }

  const handleClose = () => {
    // Cerrar sin decidir (se mostrará nuevamente en próxima visita)
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border shadow-2xl z-50 animate-in slide-in-from-bottom duration-300"
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Icon + Text */}
          <div className="flex items-start gap-3 flex-1">
            <Cookie className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div className="space-y-1">
              <h3 id="cookie-consent-title" className="text-base font-semibold text-foreground">
                {t('cookieConsent.title')}
              </h3>
              <p
                id="cookie-consent-description"
                className="text-sm text-muted-foreground leading-relaxed"
              >
                {t('cookieConsent.description')}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0 ml-9 md:ml-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReject}
              className="text-muted-foreground hover:text-foreground"
            >
              {t('cookieConsent.reject')}
            </Button>
            <Button size="sm" onClick={handleAccept} className="bg-primary hover:bg-primary/90">
              {t('cookieConsent.accept')}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground"
              aria-label={t('cookieConsent.close')}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
