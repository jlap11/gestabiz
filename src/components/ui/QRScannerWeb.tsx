import React, { useEffect, useRef, useState } from 'react'
import { AlertCircle, Camera, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import jsQR from 'jsqr'
import { logger } from '@/lib/logger'

interface QRScannerWebProps {
  onScan: (data: BusinessInvitationQRData) => void
  onCancel: () => void
  isOpen: boolean
}

export interface BusinessInvitationQRData {
  type: 'business_invitation'
  business_id: string
  business_name: string
  invitation_code: string
  generated_at: string
}

export function QRScannerWeb({ onScan, onCancel, isOpen }: Readonly<QRScannerWebProps>) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen, startCamera, stopCamera])

  const startCamera = React.useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })

      streamRef.current = stream
      setHasPermission(true)
      setError(null)

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      setScanning(true)
      requestAnimationFrame(scanQRCode)
    } catch (err) {
      void logger.error('Error accessing camera', err, { component: 'QRScannerWeb' })
      setHasPermission(false)
      setError('No se pudo acceder a la cámara. Por favor verifica los permisos.')
    }
  }, [scanQRCode])

  const stopCamera = React.useCallback(() => {
    setScanning(false)

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const scanQRCode = React.useCallback(() => {
    if (!scanning || !videoRef.current || !canvasRef.current) {
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanQRCode)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    })

    if (code) {
      handleQRCodeDetected(code.data)
    } else {
      animationFrameRef.current = requestAnimationFrame(scanQRCode)
    }
  }, [scanning])

  const handleQRCodeDetected = React.useCallback(
    (data: string) => {
      setScanning(false)

      try {
        const qrData: BusinessInvitationQRData = JSON.parse(data)

        if (
          qrData.type === 'business_invitation' &&
          qrData.business_id &&
          qrData.business_name &&
          qrData.invitation_code
        ) {
          onScan(qrData)
          stopCamera()
        } else {
          throw new Error('Formato de QR inválido')
        }
      } catch {
        setError(
          'El código QR escaneado no es válido. Por favor escanea un código de invitación válido.'
        )
        setTimeout(() => {
          setError(null)
          setScanning(true)
          requestAnimationFrame(scanQRCode)
        }, 3000)
      }
    },
    [onScan, stopCamera, scanQRCode]
  )

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Camera className="h-6 w-6" />
          Escanear Código QR
        </h2>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative overflow-hidden">
        {hasPermission === null && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-foreground text-center px-6">Solicitando permiso de cámara...</p>
          </div>
        )}

        {hasPermission === false && (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="max-w-md text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-4">Permiso Denegado</h3>
              <p className="text-muted-foreground mb-6">
                No tenemos acceso a tu cámara. Por favor habilita el permiso en la configuración de
                tu navegador.
              </p>
              <Button onClick={onCancel} variant="default">
                Cerrar
              </Button>
            </div>
          </div>
        )}

        {hasPermission && (
          <>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
            />

            {/* Scanning Frame Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-64 h-64">
                {/* Corner borders */}
                <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-lg" />

                {/* Scanning line animation */}
                {scanning && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan" />
                )}
              </div>
            </div>

            {/* Hidden canvas for QR processing */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Instructions */}
            <div className="absolute bottom-20 left-0 right-0 flex justify-center">
              <div className="bg-black/60 backdrop-blur-sm px-6 py-3 rounded-lg">
                <p className="text-foreground text-center">Coloca el código QR dentro del marco</p>
              </div>
            </div>
          </>
        )}

        {/* Error Alert */}
        {error && (
          <div className="absolute bottom-20 left-4 right-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0% {
            top: 0;
          }
          100% {
            top: 100%;
          }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  )
}
