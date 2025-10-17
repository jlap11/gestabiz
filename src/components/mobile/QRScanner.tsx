import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native'
import { Camera, CameraType } from 'expo-camera'
import { BarCodeScanner } from 'expo-barcode-scanner'
import type { BarCodeScanningResult } from 'expo-camera'
import { X, Zap } from 'lucide-react-native'

interface QRScannerProps {
  onScan: (data: BusinessInvitationQRData) => void
  onCancel: () => void
  isOpen: boolean
}

interface BusinessInvitationQRData {
  type: 'business_invitation'
  business_id: string
  business_name: string
  invitation_code: string
  generated_at: string
}

export function QRScanner({ onScan, onCancel, isOpen }: QRScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [scanned, setScanned] = useState(false)
  const [flashEnabled, setFlashEnabled] = useState(false)

  useEffect(() => {
    if (isOpen) {
      requestCameraPermission()
    }
  }, [isOpen])

  const requestCameraPermission = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync()
      setHasPermission(status === 'granted')
      
      if (status !== 'granted') {
        Alert.alert(
          'Permiso de Cámara',
          'Necesitamos acceso a tu cámara para escanear códigos QR. Por favor habilita el permiso en la configuración de tu dispositivo.',
          [{ text: 'OK' }]
        )
      }
    } catch (error) {
      console.error('Error requesting camera permission:', error)
      Alert.alert('Error', 'No se pudo solicitar permiso de cámara')
    }
  }

  const handleBarCodeScanned = ({ type, data }: BarCodeScanningResult) => {
    if (scanned) return
    
    setScanned(true)

    try {
      // Parse QR data
      const qrData: BusinessInvitationQRData = JSON.parse(data)

      // Validate QR data structure
      if (
        qrData.type === 'business_invitation' &&
        qrData.business_id &&
        qrData.business_name &&
        qrData.invitation_code
      ) {
        // Valid invitation QR
        Alert.alert(
          'Código Escaneado',
          `¿Deseas unirte a "${qrData.business_name}"?`,
          [
            {
              text: 'Cancelar',
              style: 'cancel',
              onPress: () => {
                setScanned(false)
              },
            },
            {
              text: 'Confirmar',
              onPress: () => {
                onScan(qrData)
              },
            },
          ]
        )
      } else {
        throw new Error('Formato de QR inválido')
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'El código QR escaneado no es válido para Gestabiz. Por favor escanea un código de invitación válido.',
        [
          {
            text: 'OK',
            onPress: () => {
              setScanned(false)
            },
          },
        ]
      )
    }
  }

  const toggleFlash = () => {
    setFlashEnabled(!flashEnabled)
  }

  if (!isOpen) {
    return null
  }

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.messageText}>Solicitando permiso de cámara...</Text>
      </View>
    )
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Permiso Denegado</Text>
          <Text style={styles.errorMessage}>
            No tenemos acceso a tu cámara. Por favor habilita el permiso en la configuración de tu dispositivo.
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        type={CameraType.back}
        flashMode={flashEnabled ? 'torch' : 'off'}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        barCodeScannerSettings={{
          barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Escanear Código QR</Text>
          <TouchableOpacity style={styles.closeIcon} onPress={onCancel}>
            <X color="white" size={24} />
          </TouchableOpacity>
        </View>

        {/* Scanning Frame */}
        <View style={styles.scanArea}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
          <Text style={styles.scanText}>
            Coloca el código QR dentro del marco
          </Text>
        </View>

        {/* Bottom Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.flashButton, flashEnabled && styles.flashButtonActive]}
            onPress={toggleFlash}
          >
            <Zap color={flashEnabled ? '#fbbf24' : 'white'} size={24} />
            <Text style={styles.flashButtonText}>
              {flashEnabled ? 'Flash ON' : 'Flash OFF'}
            </Text>
          </TouchableOpacity>

          {scanned && (
            <TouchableOpacity
              style={styles.rescanButton}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.rescanButtonText}>Escanear de Nuevo</Text>
            </TouchableOpacity>
          )}
        </View>
      </Camera>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  messageText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
    paddingHorizontal: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  errorMessage: {
    fontSize: 16,
    color: '#d1d5db',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  closeButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  closeIcon: {
    padding: 8,
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#6366f1',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  scanText: {
    marginTop: 30,
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    paddingHorizontal: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 10,
    borderRadius: 8,
  },
  controls: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
  },
  flashButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 15,
  },
  flashButtonActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.3)',
  },
  flashButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  rescanButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  rescanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})
