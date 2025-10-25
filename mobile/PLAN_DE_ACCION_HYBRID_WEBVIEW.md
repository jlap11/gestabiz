# PLAN DE ACCIÓN - VERSIÓN MÓVIL HYBRID WEBVIEW ⭐

> **Fecha**: Enero 2025  
> **Enfoque**: Navegación Nativa + Contenido Web (WebView)  
> **Objetivo**: 100% paridad funcional con web  
> **Ventaja**: Un cambio en web → Automáticamente visible en móvil  
> **Estimación**: 5-7 días (vs 23-32 días con enfoque nativo)

---

## 📋 ÍNDICE

1. [Fundamento Técnico](#fundamento-técnico)
2. [Arquitectura Hybrid](#arquitectura-hybrid)
3. [Setup Inicial](#setup-inicial-día-1)
4. [Autenticación Compartida](#autenticación-compartida-día-2)
5. [WebView Dashboards](#webview-dashboards-día-3)
6. [Deep Linking](#deep-linking-día-4)
7. [Push Notifications](#push-notifications-día-5)
8. [Testing y QA](#testing-y-qa-día-6-7)
9. [Checklist de Paridad](#checklist-de-paridad-100)

---

## 🎯 FUNDAMENTO TÉCNICO

### ¿Por qué Hybrid WebView?

**Problema Original:**
```typescript
// ❌ React (Web) y React Native son INCOMPATIBLES a nivel de componentes
// Web usa: <div>, <button>, Tailwind, Radix UI
// React Native usa: <View>, <TouchableOpacity>, StyleSheet
// NO se pueden compartir componentes directamente
```

**Solución Hybrid:**
```typescript
// ✅ Navegación Nativa (mejor UX móvil)
<Tabs>
  <Tab name="Client" icon="search" />
  <Tab name="Notifications" icon="bell" />
</Tabs>

// ✅ Contenido Web (100% reutilización)
<WebView source={{ uri: 'https://gestabiz.com/app/client' }} />
```

### Ventajas vs Desventajas

| Aspecto | Hybrid WebView | Nativo Puro |
|---------|---------------|-------------|
| **Reutilización de código** | 95% | 40% |
| **Tiempo de desarrollo** | 1 semana | 1 mes |
| **Mantenimiento** | 1 cambio → 2 plataformas | 2 cambios separados |
| **Paridad funcional** | 100% garantizada | Manual (errores) |
| **Traducciones** | Automáticas | Duplicar |
| **Validaciones** | Automáticas | Duplicar |
| **Experiencia UX** | 90% nativa | 100% nativa |
| **Performance** | Buena | Excelente |

**Decisión**: Hybrid WebView por **máxima reutilización y mantenibilidad**.

---

## 🏗️ ARQUITECTURA HYBRID

### Estructura de Archivos

```
mobile/
├── app/
│   ├── _layout.tsx                 # Root: Providers (Auth, Query, Paper)
│   ├── (auth)/
│   │   ├── _layout.tsx             # Auth stack
│   │   ├── login.tsx               # Login nativo
│   │   ├── register.tsx            # Registro nativo
│   │   └── forgot-password.tsx     # Recovery nativo
│   ├── (tabs)/
│   │   ├── _layout.tsx             # Tabs nativos dinámicos por rol ⭐
│   │   ├── client.tsx              # WebView → /app/client 🌐
│   │   ├── admin.tsx               # WebView → /app/admin 🌐
│   │   ├── employee.tsx            # WebView → /app/employee 🌐
│   │   ├── appointments.tsx        # WebView → /app/appointments 🌐
│   │   ├── notifications.tsx       # WebView → /app/notifications 🌐
│   │   ├── chat.tsx                # WebView → /app/chat 🌐
│   │   └── settings.tsx            # WebView → /app/settings 🌐
│   └── index.tsx                   # Redirect handler
├── components/
│   ├── WebViewDashboard.tsx        # ⭐ Wrapper reutilizable
│   ├── LoadingScreen.tsx           # Loading nativo
│   └── ErrorBoundary.tsx           # Error handling nativo
├── lib/
│   ├── auth.tsx                    # AuthProvider móvil (sync con web)
│   ├── webview-bridge.ts           # ⭐ Comunicación nativo ↔ web
│   └── deeplink-handler.ts         # Deep linking
├── app.config.js                   # Expo config
└── package.json                    # Dependencias

Leyenda:
⭐ = Componente crítico
🌐 = Contenido web en WebView
```

### Flujo de Datos

```
┌─────────────────────────────────────────────────┐
│           App Móvil (React Native)              │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │     Navegación Nativa (Expo Router)      │  │
│  │  • Tabs dinámicos por rol                │  │
│  │  • Header con cambio de rol              │  │
│  │  • Notificaciones badge                  │  │
│  └──────────────────────────────────────────┘  │
│                      ↕ (WebView Bridge)         │
│  ┌──────────────────────────────────────────┐  │
│  │      Contenido Web (React + Vite)        │  │
│  │  • Dashboards completos                  │  │
│  │  • Validaciones                          │  │
│  │  • Traducciones                          │  │
│  │  • Hooks y lógica                        │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
                    ↕
        ┌──────────────────────┐
        │   Supabase Cloud     │
        │  • Auth              │
        │  • Database          │
        │  • Realtime          │
        │  • Edge Functions    │
        └──────────────────────┘
```

---

## 📦 SETUP INICIAL (Día 1)

### 1.1 Instalar Dependencias

```bash
cd mobile

# React Query (para auth y notificaciones nativas)
npm install @tanstack/react-query@^5.0.0

# WebView
npm install react-native-webview@^13.6.0

# UI Components (solo para navegación)
npm install react-native-paper@^5.11.1

# Storage
npm install expo-secure-store@~12.3.1
npm install @react-native-async-storage/async-storage@1.18.2

# Notifications
npm install expo-notifications@~0.20.1

# Deep Linking
npm install expo-linking@~5.0.2

# Utils
npm install date-fns@^2.30.0
npm install zod@^3.22.4
```

### 1.2 Configurar app.config.js

```javascript
export default {
  expo: {
    name: "Gestabiz",
    slug: "gestabiz-mobile",
    version: "1.0.0",
    scheme: "gestabiz",  // ⭐ Deep linking
    
    // WebView permissions
    ios: {
      bundleIdentifier: "com.gestabiz.mobile",
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,  // Solo para desarrollo local
          NSAllowsLocalNetworking: true
        }
      }
    },
    
    android: {
      package: "com.gestabiz.mobile",
      permissions: [
        "INTERNET",  // ⭐ Requerido para WebView
        "NOTIFICATIONS"
      ]
    },
    
    plugins: [
      "expo-router",
      ["expo-notifications", {
        icon: "./assets/notification-icon.png",
        color: "#3B82F6"
      }]
    ],
    
    extra: {
      // URLs de la web app
      webAppUrl: process.env.EXPO_PUBLIC_WEB_APP_URL || "https://gestabiz.com",
      webAppUrlDev: "http://localhost:5173",
      
      // Supabase (para auth nativa)
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    }
  }
}
```

### 1.3 Variables de Entorno

```bash
# mobile/.env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EXPO_PUBLIC_WEB_APP_URL=https://gestabiz.com
```

---

## 🔐 AUTENTICACIÓN COMPARTIDA (Día 2)

### 2.1 AuthProvider Móvil

```typescript
// mobile/lib/auth.tsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuthSimple } from '../../src/hooks/useAuthSimple'
import * as SecureStore from 'expo-secure-store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // ✅ Reutilizar useAuthSimple del web (singleton)
  const authState = useAuthSimple()
  
  // Persistir sesión en SecureStore
  useEffect(() => {
    if (authState.session) {
      SecureStore.setItemAsync('session', JSON.stringify(authState.session))
    } else {
      SecureStore.deleteItemAsync('session')
    }
  }, [authState.session])
  
  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
}
```

### 2.2 Sincronización de Sesión con WebView

```typescript
// mobile/lib/webview-bridge.ts

export function getInjectedJavaScript(session: any) {
  return `
    (function() {
      // 1. Inyectar sesión de Supabase
      if (window.localStorage) {
        window.localStorage.setItem(
          'sb-${SUPABASE_PROJECT_ID}-auth-token',
          '${JSON.stringify(session)}'
        );
      }
      
      // 2. Establecer comunicación bidireccional
      window.ReactNativeWebView = {
        postMessage: (message) => {
          window.ReactNativeWebView.postMessage(message);
        }
      };
      
      // 3. Escuchar eventos del web para navegar en nativo
      window.addEventListener('message', (event) => {
        if (event.data.type === 'navigate') {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'navigate',
            route: event.data.route
          }));
        }
      });
      
      true;
    })();
  `;
}
```

---

## 🌐 WEBVIEW DASHBOARDS (Día 3)

### 3.1 Componente WebViewDashboard (Reutilizable)

```typescript
// mobile/components/WebViewDashboard.tsx
import React, { useRef, useState } from 'react'
import { WebView } from 'react-native-webview'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { useAuth } from '../lib/auth'
import { getInjectedJavaScript } from '../lib/webview-bridge'
import Constants from 'expo-constants'

interface Props {
  route: string  // Ej: '/app/client', '/app/admin'
  onMessage?: (event: any) => void
}

export default function WebViewDashboard({ route, onMessage }: Props) {
  const { session } = useAuth()
  const webviewRef = useRef<WebView>(null)
  const [loading, setLoading] = useState(true)
  
  const webAppUrl = __DEV__
    ? Constants.expoConfig?.extra?.webAppUrlDev
    : Constants.expoConfig?.extra?.webAppUrl
  
  const fullUrl = `${webAppUrl}${route}`
  
  const handleMessage = (event: any) => {
    const data = JSON.parse(event.nativeEvent.data)
    
    // Manejar navegación desde web
    if (data.type === 'navigate') {
      // TODO: Implementar navegación nativa
      console.log('Navigate to:', data.route)
    }
    
    onMessage?.(data)
  }
  
  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        source={{ uri: fullUrl }}
        injectedJavaScriptBeforeContentLoaded={getInjectedJavaScript(session)}
        onMessage={handleMessage}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        style={styles.webview}
      />
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
})
```

### 3.2 Implementar Dashboards

```typescript
// mobile/app/(tabs)/client.tsx
import WebViewDashboard from '../../components/WebViewDashboard'

export default function ClientDashboard() {
  return <WebViewDashboard route="/app/client" />
}

// mobile/app/(tabs)/admin.tsx
export default function AdminDashboard() {
  return <WebViewDashboard route="/app/admin" />
}

// mobile/app/(tabs)/employee.tsx
export default function EmployeeDashboard() {
  return <WebViewDashboard route="/app/employee" />
}

// mobile/app/(tabs)/appointments.tsx
export default function AppointmentsScreen() {
  return <WebViewDashboard route="/app/appointments" />
}

// mobile/app/(tabs)/notifications.tsx
export default function NotificationsScreen() {
  return <WebViewDashboard route="/app/notifications" />
}

// mobile/app/(tabs)/chat.tsx
export default function ChatScreen() {
  return <WebViewDashboard route="/app/chat" />
}

// mobile/app/(tabs)/settings.tsx
export default function SettingsScreen() {
  return <WebViewDashboard route="/app/settings" />
}
```

### 3.3 Tabs Dinámicos (Sin cambios - Ya implementado)

```typescript
// mobile/app/(tabs)/_layout.tsx
// ✅ Este componente ya está correcto, solo cambiar el contenido de cada tab
export default function TabsLayout() {
  const { activeRole, availableRoles, switchRole } = useUserRoles()
  const { unreadCount } = useInAppNotifications()
  
  // Tabs dinámicos según rol (lógica ya implementada)
  return <Tabs>{/* ... */}</Tabs>
}
```

---

## 🔗 DEEP LINKING (Día 4)

### 4.1 Configurar Linking

```typescript
// mobile/lib/linking.ts
import * as Linking from 'expo-linking'

export const linking = {
  prefixes: [
    'gestabiz://',
    'https://gestabiz.com',
    'https://app.gestabiz.com'
  ],
  
  config: {
    screens: {
      '(auth)': {
        screens: {
          login: 'login',
          register: 'register'
        }
      },
      '(tabs)': {
        screens: {
          client: 'app/client',
          admin: 'app/admin',
          employee: 'app/employee',
          appointments: 'app/appointments',
          notifications: 'app/notifications',
          chat: 'app/chat',
          settings: 'app/settings'
        }
      }
    }
  }
}

// Ejemplos de deep links:
// gestabiz://app/client → ClientDashboard
// gestabiz://app/admin → AdminDashboard
// https://gestabiz.com/app/client → ClientDashboard
```

### 4.2 Integrar en Root Layout

```typescript
// mobile/app/_layout.tsx
import { linking } from '../lib/linking'

export default function RootLayout() {
  return (
    <NavigationContainer linking={linking}>
      <RootLayoutNav />
    </NavigationContainer>
  )
}
```

---

## 🔔 PUSH NOTIFICATIONS (Día 5)

### 5.1 Configurar Expo Notifications

```typescript
// mobile/lib/notifications.ts
import * as Notifications from 'expo-notifications'

// Configurar handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

// Registrar para push notifications
export async function registerForPushNotifications() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  
  if (finalStatus !== 'granted') {
    return null
  }
  
  const token = (await Notifications.getExpoPushTokenAsync()).data
  return token
}

// Guardar token en Supabase
export async function savePushToken(userId: string, token: string) {
  await supabase
    .from('user_push_tokens')
    .upsert({ user_id: userId, token, platform: 'expo' })
}
```

### 5.2 Integrar en AuthProvider

```typescript
// mobile/lib/auth.tsx
export function AuthProvider({ children }) {
  const authState = useAuthSimple()
  
  useEffect(() => {
    if (authState.user) {
      // Registrar push token
      registerForPushNotifications().then((token) => {
        if (token) {
          savePushToken(authState.user.id, token)
        }
      })
    }
  }, [authState.user])
  
  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
}
```

---

## ✅ TESTING Y QA (Día 6-7)

### 6.1 Test de Autenticación

- [ ] Login funciona y sincroniza con WebView
- [ ] Registro funciona y sincroniza con WebView
- [ ] Logout cierra sesión en web y móvil
- [ ] Sesión persiste después de cerrar app

### 6.2 Test de Navegación

- [ ] Tabs dinámicos muestran según rol activo
- [ ] Cambio de rol funciona (menu dropdown)
- [ ] Badge de notificaciones muestra count correcto
- [ ] Navegación entre tabs es fluida

### 6.3 Test de Contenido Web

- [ ] ClientDashboard renderiza correctamente
- [ ] AdminDashboard renderiza correctamente
- [ ] EmployeeDashboard renderiza correctamente
- [ ] Appointments renderiza correctamente
- [ ] Notifications renderiza correctamente
- [ ] Chat renderiza correctamente
- [ ] Settings renderiza correctamente

### 6.4 Test de Funcionalidad Web

- [ ] Booking wizard funciona (AppointmentWizard web)
- [ ] Validaciones funcionan (horarios, almuerzo, overlap, ausencias, festivos)
- [ ] Traducciones funcionan (español/inglés)
- [ ] Favoritos funcionan
- [ ] Reviews funcionan
- [ ] Chat en tiempo real funciona
- [ ] Notificaciones en tiempo real funcionan

### 6.5 Test de Deep Linking

- [ ] `gestabiz://app/client` abre ClientDashboard
- [ ] Notificación push abre pantalla correcta
- [ ] Links desde emails funcionan

### 6.6 Test de Performance

- [ ] WebView carga en <2 segundos
- [ ] Scroll es fluido
- [ ] No hay memory leaks
- [ ] App funciona offline (cache)

---

## 📊 CHECKLIST DE PARIDAD 100%

### ✅ Autenticación
- [ ] Login (email/password, Google OAuth)
- [ ] Registro
- [ ] Forgot password
- [ ] Persistencia de sesión
- [ ] Logout

### ✅ Roles Dinámicos
- [ ] Cálculo dinámico (admin/employee/client)
- [ ] Cambio de rol en header
- [ ] Tabs dinámicos por rol
- [ ] Persistencia de rol activo

### ✅ Client Dashboard
- [ ] Búsqueda de negocios/servicios/profesionales
- [ ] Booking wizard completo (7 pasos + validaciones)
- [ ] Próximas citas
- [ ] Favoritos
- [ ] Negocios cercanos (geolocalización)
- [ ] Historial de citas

### ✅ Admin Dashboard
- [ ] Estadísticas (citas, ingresos, clientes)
- [ ] Calendario de citas
- [ ] Gestión de sedes
- [ ] Gestión de servicios
- [ ] Gestión de empleados
- [ ] Reclutamiento (vacantes)
- [ ] Ausencias (aprobar/rechazar)
- [ ] Billing (pagos y facturación)
- [ ] Reportes financieros
- [ ] Contabilidad (IVA, ICA, Retención)

### ✅ Employee Dashboard
- [ ] Mis citas del día
- [ ] Mis empleos (negocios vinculados)
- [ ] Vacantes disponibles
- [ ] Ausencias y vacaciones (balance)
- [ ] Aplicar a vacantes

### ✅ Notificaciones
- [ ] In-app notifications (17 tipos)
- [ ] Push notifications
- [ ] Realtime updates (Supabase)
- [ ] Marcar como leído
- [ ] Filtros (Todas/Sin leer)
- [ ] Navegación desde notificación

### ✅ Chat
- [ ] Lista de conversaciones
- [ ] Chat en tiempo real
- [ ] Unread count
- [ ] Avatares
- [ ] Attachments (imágenes/archivos)
- [ ] Read receipts

### ✅ Settings
- [ ] Editar perfil
- [ ] Notificaciones preferences
- [ ] Idioma (español/inglés)
- [ ] Tema (claro/oscuro)
- [ ] Ayuda y soporte
- [ ] Términos y condiciones
- [ ] Cerrar sesión

### ✅ Validaciones Críticas
- [ ] Horarios de apertura/cierre de sede
- [ ] Hora de almuerzo del profesional
- [ ] Overlap con otras citas
- [ ] Ausencias aprobadas del empleado
- [ ] Festivos públicos

### ✅ Traducciones
- [ ] Español (completo)
- [ ] Inglés (completo)
- [ ] Cambio dinámico de idioma
- [ ] Persistencia de preferencia

### ✅ Integraciones Externas
- [ ] Google Calendar sync
- [ ] Stripe payments
- [ ] PayU Latam payments
- [ ] MercadoPago payments
- [ ] Google Analytics 4
- [ ] Email notifications (Brevo)
- [ ] SMS notifications (AWS SNS)
- [ ] WhatsApp notifications

---

## 📈 MÉTRICAS DE ÉXITO

| Métrica | Objetivo | Actual |
|---------|----------|--------|
| **Reutilización de código** | >95% | % |
| **Paridad funcional** | 100% | % |
| **Tiempo de carga inicial** | <2s | s |
| **Tiempo de cambio de tab** | <500ms | ms |
| **Tests pasando** | 100% | % |
| **Crash rate** | <0.1% | % |
| **User rating** | >4.5 | - |

---

## 🚀 COMANDOS DE DESARROLLO

```bash
# Desarrollo local
cd mobile
npm run start              # Expo dev server
npm run android           # Android emulator
npm run ios               # iOS simulator

# Web app local (para development)
cd ..
npm run dev               # http://localhost:5173

# Testing
npm run test              # Jest tests
npm run lint              # ESLint

# Build y Deploy
eas build --platform android  # Android build
eas build --platform ios      # iOS build
eas submit --platform android # Submit to Play Store
eas submit --platform ios     # Submit to App Store
```

---

## 🎯 RESUMEN EJECUTIVO

### Arquitectura Final

```
┌─────────────────────────────────────┐
│  Mobile App (React Native + Expo)  │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Navegación Nativa (5%)       │ │
│  │  • Tabs                       │ │
│  │  • Header                     │ │
│  │  • Notificaciones badge       │ │
│  └───────────────────────────────┘ │
│              ↕                      │
│  ┌───────────────────────────────┐ │
│  │  Contenido Web (95%)          │ │
│  │  • Dashboards completos       │ │
│  │  • Validaciones               │ │
│  │  • Traducciones               │ │
│  │  • Todos los componentes web  │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Beneficios

1. ✅ **100% paridad funcional** - Garantizada
2. ✅ **95% reutilización de código** - Un cambio → 2 plataformas
3. ✅ **7 días de desarrollo** - vs 30 días nativo
4. ✅ **Mantenimiento centralizado** - Cero duplicación
5. ✅ **Traducciones automáticas** - Sin duplicar
6. ✅ **Validaciones automáticas** - Sin duplicar
7. ✅ **UX casi nativa** - Tabs + WebView optimizado

---

**Última actualización**: Enero 2025  
**Próximo paso**: Implementar WebViewDashboard component  
**Responsable**: TI-Turing Team

