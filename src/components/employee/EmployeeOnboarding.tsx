import { useState } from 'react'
import { AlertCircle, Camera, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useEmployeeRequests } from '@/hooks/useEmployeeRequests'
import { QRScannerWeb } from '@/components/ui/QRScannerWeb'
import { useLanguage } from '@/contexts/LanguageContext'
import type { User } from '@/types/types'
import type { BusinessInvitationQRData } from '@/components/ui/QRScannerWeb'

interface EmployeeOnboardingProps {
  user: User
  onRequestCreated?: () => void
}

export function EmployeeOnboarding({ user, onRequestCreated }: Readonly<EmployeeOnboardingProps>) {
  const { t } = useLanguage()
  const [invitationCode, setInvitationCode] = useState('')
  const [message, setMessage] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [requestStatus, setRequestStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const { createRequest, isLoading, requests } = useEmployeeRequests({
    userId: user.id,
    autoFetch: false,
  })

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const approvedRequests = requests.filter(r => r.status === 'approved')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!invitationCode.trim()) {
      setRequestStatus('error')
      return
    }

    const success = await createRequest(
      invitationCode.trim().toUpperCase(),
      message.trim() || undefined
    )

    if (success) {
      setRequestStatus('success')
      setInvitationCode('')
      setMessage('')
      onRequestCreated?.()
    } else {
      setRequestStatus('error')
    }
  }

  const handleCodeChange = (value: string) => {
    const cleaned = value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6)
    setInvitationCode(cleaned)
    setRequestStatus('idle')
  }

  const handleQRScanned = (data: BusinessInvitationQRData) => {
    setInvitationCode(data.invitation_code)
    setShowScanner(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pt-12">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Únete como Empleado</h1>
        <p className="text-muted-foreground">
          Para trabajar en un negocio, necesitas un código de invitación proporcionado por el
          administrador
        </p>
      </div>

      {(pendingRequests.length > 0 || approvedRequests.length > 0) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Solicitudes activas</AlertTitle>
          <AlertDescription>
            {pendingRequests.length > 0 && (
              <p>
                Tienes {pendingRequests.length} solicitud(es) pendiente(s). El administrador
                revisará tu solicitud pronto.
              </p>
            )}
            {approvedRequests.length > 0 && (
              <p className="text-green-600 dark:text-green-400 font-medium">
                Tienes {approvedRequests.length} solicitud(es) aprobada(s). Recarga la página para
                ver tu nuevo rol.
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ingresar código de invitación</CardTitle>
          <CardDescription>
            Solicita el código de 6 caracteres al administrador del negocio o escanea el código QR
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {requestStatus === 'success' && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">¡Solicitud enviada!</AlertTitle>
              <AlertDescription className="text-green-600">
                Tu solicitud ha sido enviada al administrador. Recibirás una notificación cuando sea
                revisada.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="invitation-code" className="text-sm font-medium">
                Código de invitación
              </label>
              <Input
                id="invitation-code"
                type="text"
                value={invitationCode}
                onChange={e => handleCodeChange(e.target.value)}
                placeholder="ABC123"
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest uppercase"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground text-center">
                Ingresa el código de 6 caracteres (letras y números)
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">
                Mensaje al administrador (opcional)
              </label>
              <Input
                id="message"
                type="text"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Ej: Tengo experiencia en..."
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading || invitationCode.length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando solicitud...
                </>
              ) : (
                'Enviar solicitud'
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">O</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            size="lg"
            onClick={() => setShowScanner(true)}
            disabled={isLoading}
          >
            <Camera className="mr-2 h-4 w-4" />
            Escanear código QR
          </Button>

          {showScanner && (
            <Alert>
              <Camera className="h-4 w-4" />
              <AlertTitle>Escanear QR desde móvil</AlertTitle>
              <AlertDescription>
                El escaneo de códigos QR está disponible en la aplicación móvil. Por ahora, ingresa
                el código manualmente.
              </AlertDescription>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => setShowScanner(false)}
              >
                {t('common.actions.close')}
              </Button>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">¿Cómo funciona?</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>El administrador del negocio te proporciona un código de invitación único</li>
              <li>Ingresas el código aquí o escaneas el código QR desde tu móvil</li>
              <li>El administrador recibe tu solicitud por email</li>
              <li>Una vez aprobada, podrás acceder como empleado del negocio</li>
              <li>Configura tu horario, sede y servicios que ofreces</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mis solicitudes</CardTitle>
            <CardDescription>Historial de solicitudes enviadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requests.map(request => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{request.business?.name || 'Negocio desconocido'}</p>
                    <p className="text-sm text-muted-foreground">
                      Código: <span className="font-mono">{request.invitation_code}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString('es', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div>
                    {request.status === 'pending' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Pendiente
                      </span>
                    )}
                    {request.status === 'approved' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Aprobada
                      </span>
                    )}
                    {request.status === 'rejected' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        Rechazada
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <QRScannerWeb
        isOpen={showScanner}
        onScan={handleQRScanned}
        onCancel={() => setShowScanner(false)}
      />
    </div>
  )
}
