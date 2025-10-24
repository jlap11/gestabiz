import React from 'react'
import { Platform } from 'react-native'

interface BusinessInvitationQRData {
  type: 'business_invitation'
  business_id: string
  business_name: string
  invitation_code: string
  generated_at: string
}

interface QRScannerProps {
  onScan: (data: BusinessInvitationQRData) => void
  onCancel: () => void
  isOpen: boolean
}

/**
 * Universal QR Scanner component that works on both web and mobile (React Native)
 * - On mobile: Uses expo-camera for native camera access
 * - On web: Uses getUserMedia API with jsQR for QR detection
 */
export function QRScanner(props: Readonly<QRScannerProps>) {
  // On mobile platforms
  if (Platform.OS !== 'web') {
    return (
      <React.Suspense fallback={null}>
        <QRScannerMobile {...props} />
      </React.Suspense>
    )
  }

  // On web
  if (Platform.OS === 'web') {
    return (
      <React.Suspense fallback={null}>
        <QRScannerWebComponent {...props} />
      </React.Suspense>
    )
  }

  // Fallback (should never happen)
  return null
}

export type { BusinessInvitationQRData }
