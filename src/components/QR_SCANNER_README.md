# QR Scanner Components

## Descripción
Conjunto de componentes para escanear códigos QR de invitación de negocios en AppointSync Pro.

Incluye:
- **QRScannerWeb**: Versión web usando getUserMedia API + jsQR
- **QRScanner (Mobile)**: Versión React Native usando expo-camera (en `src/components/mobile/`)

## Uso en Web

El componente `QRScannerWeb` se integra automáticamente en `EmployeeOnboarding`:

```typescript
import { QRScannerWeb } from '@/components/ui/QRScannerWeb'
import type { BusinessInvitationQRData } from '@/components/ui/QRScannerWeb'

function MyComponent() {
  const [showScanner, setShowScanner] = useState(false)

  const handleQRScanned = (data: BusinessInvitationQRData) => {
    console.log('Scanned:', data)
    // data = {
    //   type: 'business_invitation',
    //   business_id: 'uuid',
    //   business_name: 'Mi Negocio',
    //   invitation_code: 'ABC123',
    //   generated_at: '2025-10-11T...'
    // }
    setShowScanner(false)
  }

  return (
    <>
      <Button onClick={() => setShowScanner(true)}>
        Escanear QR
      </Button>

      <QRScannerWeb
        isOpen={showScanner}
        onScan={handleQRScanned}
        onCancel={() => setShowScanner(false)}
      />
    </>
  )
}
```

## Uso en Móvil (React Native / Expo)

### Dependencias Requeridas

```bash
# En la carpeta mobile/
npm install expo-camera expo-barcode-scanner lucide-react-native
```

### Configuración de Permisos

**app.json / app.config.js:**
```json
{
  "expo": {
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Permitir que $(PRODUCT_NAME) acceda a tu cámara para escanear códigos QR."
        }
      ]
    ]
  }
}
```

**iOS (Info.plist):**
```xml
<key>NSCameraUsageDescription</key>
<string>Necesitamos acceso a tu cámara para escanear códigos QR de invitación</string>
```

**Android (AndroidManifest.xml):**
```xml
<uses-permission android:name="android.permission.CAMERA" />
```

### Código de Uso

```typescript
import { QRScanner } from '@/components/mobile/QRScanner'

function EmployeeOnboardingMobile() {
  const [showScanner, setShowScanner] = useState(false)

  const handleQRScanned = (data) => {
    console.log('Scanned:', data.invitation_code)
    setShowScanner(false)
  }

  return (
    <>
      <TouchableOpacity onPress={() => setShowScanner(true)}>
        <Text>Escanear QR</Text>
      </TouchableOpacity>

      <Modal visible={showScanner} animationType="slide">
        <QRScanner
          isOpen={showScanner}
          onScan={handleQRScanned}
          onCancel={() => setShowScanner(false)}
        />
      </Modal>
    </>
  )
}
```

## Características

### QRScannerWeb (Navegadores)
- ✅ Usa getUserMedia para acceso a cámara
- ✅ Detecta automáticamente cámara trasera en móviles
- ✅ Procesamiento en tiempo real con jsQR
- ✅ UI con marco de escaneo animado
- ✅ Validación de formato de QR
- ✅ Manejo de permisos denegados
- ✅ Responsive y accesible

### QRScanner Mobile (React Native)
- ✅ Usa expo-camera nativa
- ✅ Reconocimiento de QR con BarCodeScanner
- ✅ Control de flash/linterna
- ✅ UI fullscreen nativa
- ✅ Manejo de permisos iOS/Android
- ✅ Confirmación con diálogo antes de procesar
- ✅ Botón de re-escanear

## Formato del QR

Los códigos QR deben contener JSON con esta estructura:

```json
{
  "type": "business_invitation",
  "business_id": "550e8400-e29b-41d4-a716-446655440000",
  "business_name": "Barbería Moderna",
  "invitation_code": "ABC123",
  "generated_at": "2025-10-11T14:30:00.000Z"
}
```

### Validaciones

El scanner valida que el QR contenga:
- ✅ `type` === `'business_invitation'`
- ✅ `business_id` (UUID válido)
- ✅ `business_name` (string no vacío)
- ✅ `invitation_code` (6 caracteres alfanuméricos)

Si el QR no cumple estas condiciones, se muestra un error y el usuario puede reintentar.

## Flujo de Uso

1. Usuario hace clic en "Escanear código QR"
2. Se solicita permiso de cámara (primera vez)
3. Se abre vista fullscreen con cámara activa
4. Usuario coloca QR dentro del marco de escaneo
5. Scanner detecta y valida QR automáticamente
6. Se muestra confirmación con nombre del negocio
7. Usuario confirma o cancela
8. Si confirma, se auto-completa el código de invitación

## Troubleshooting

### Web: "No se pudo acceder a la cámara"

**Posibles causas:**
- Usuario denegó el permiso
- Navegador sin soporte para getUserMedia
- Sitio no está en HTTPS (requerido por navegadores)
- Cámara en uso por otra aplicación

**Soluciones:**
```javascript
// Verificar soporte del navegador
if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  console.error('getUserMedia no soportado en este navegador')
}

// Verificar que el sitio esté en HTTPS
if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
  console.warn('getUserMedia requiere HTTPS')
}
```

### Mobile: "Permiso denegado"

**iOS:**
1. Ve a Configuración > Privacidad > Cámara
2. Habilita el permiso para la app

**Android:**
1. Ve a Configuración > Apps > [Tu App] > Permisos
2. Habilita "Cámara"

### QR no se detecta

**Posibles causas:**
- Iluminación insuficiente
- QR muy pequeño o muy grande
- QR dañado o borroso
- Formato de QR incorrecto

**Soluciones:**
- Activar flash (móvil)
- Acercar/alejar cámara
- Mejorar iluminación
- Regenerar QR desde BusinessInvitationCard

## Testing

### Test Manual - Web

```bash
# 1. Inicia el servidor
npm run dev

# 2. Abre http://localhost:5173 en navegador
# 3. Cambia a rol "Employee" sin negocio
# 4. Click en "Escanear código QR"
# 5. Permite acceso a cámara
# 6. Usa un QR de prueba o genera uno desde admin
```

### Test Manual - Mobile

```bash
# 1. En carpeta mobile/
npm run start

# 2. Escanea QR de Expo Go en tu dispositivo
# 3. Navega a Employee Onboarding
# 4. Click en botón de cámara
# 5. Acepta permisos
# 6. Escanea QR de invitación
```

### Generar QR de Prueba

Puedes generar QRs de prueba en:
- https://www.qr-code-generator.com/
- O usar el componente `BusinessInvitationCard` en admin dashboard

Datos de ejemplo:
```json
{
  "type": "business_invitation",
  "business_id": "test-123",
  "business_name": "Negocio de Prueba",
  "invitation_code": "TEST99",
  "generated_at": "2025-10-11T00:00:00.000Z"
}
```

## Mejoras Futuras

- [ ] Soporte para leer múltiples códigos QR a la vez
- [ ] Historial de QRs escaneados
- [ ] Modo offline (guardar QR para procesar después)
- [ ] Zoom digital en scanner web
- [ ] Selector de cámara (frontal/trasera) en web
- [ ] Feedback háptico en móvil al escanear
- [ ] Análisis de calidad de QR (legibilidad)
- [ ] Exportar QR como imagen para compartir
- [ ] Deep linking desde QR (abrir app automáticamente)

## Dependencias

### Web
- `jsqr` (^1.4.0): Biblioteca de detección de QR en canvas

### Mobile
- `expo-camera` (^15.0.0): Acceso a cámara nativa
- `expo-barcode-scanner` (^13.0.0): Detección de códigos de barras/QR
- `lucide-react-native` (^0.400.0): Iconos para React Native

## Licencia

Mismo que el proyecto principal (AppointSync Pro)
