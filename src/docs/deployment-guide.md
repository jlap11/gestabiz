# Bookio - Guía Completa de Despliegue

Esta guía te llevará paso a paso para desplegar tu aplicación completa de gestión de citas con **React Native (móvil)**, **React (web)**, **Browser Extension**, y **Supabase (backend)**.

## 📋 Índice

1. [Configuración de Supabase](#1-configuración-de-supabase)
2. [Configuración de la Aplicación Web](#2-configuración-de-la-aplicación-web)
3. [Configuración de la Aplicación Móvil](#3-configuración-de-la-aplicación-móvil)
4. [Configuración de la Extensión del Navegador](#4-configuración-de-la-extensión-del-navegador)
5. [Configuración de Variables de Entorno](#5-configuración-de-variables-de-entorno)
6. [Configuración de Notificaciones](#6-configuración-de-notificaciones)
7. [Pruebas y Validación](#7-pruebas-y-validación)
8. [Despliegue en Producción](#8-despliegue-en-producción)

---

## 1. Configuración de Supabase

### 1.1 Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Guarda las credenciales:
   - `Project URL`
   - `anon public key`
   - `service_role key`

### 1.2 Configurar Base de Datos

1. Ve al **SQL Editor** en tu dashboard de Supabase
2. Ejecuta el archivo `src/database/schema.sql` completo
3. Verifica que todas las tablas se hayan creado correctamente

### 1.3 Configurar Authentication

1. Ve a **Authentication > Settings**
2. Habilita los proveedores que necesites:
   - Email/Password ✅
   - Google OAuth (opcional)
   - Apple OAuth (opcional)
3. Configura el **Site URL** de tu aplicación web
4. Agrega las **Redirect URLs** necesarias

### 1.4 Configurar Edge Functions

Ejecuta estos comandos en tu terminal:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Inicializar Supabase en tu proyecto
supabase init

# Hacer login a Supabase
supabase login

# Vincular tu proyecto local con el proyecto en Supabase
supabase link --project-ref YOUR_PROJECT_REF

# Desplegar las funciones
supabase functions deploy send-email
supabase functions deploy send-push-notification
supabase functions deploy process-notifications
supabase functions deploy browser-extension-data
```

### 1.5 Configurar Variables de Entorno para Edge Functions

En el dashboard de Supabase, ve a **Edge Functions > Settings** y configura:

```bash
# Para SendGrid (Email)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@your-domain.com

# Para notificaciones push
FCM_SERVER_KEY=your_fcm_server_key
EXPO_ACCESS_TOKEN=your_expo_access_token

# Para APNS (iOS)
APNS_KEY_ID=your_apns_key_id
APNS_TEAM_ID=your_apns_team_id
APNS_BUNDLE_ID=your_ios_bundle_id
```

### 1.6 Configurar Cron Jobs (opcional)

Para procesar notificaciones automáticamente:

```sql
-- Ejecutar en SQL Editor
SELECT cron.schedule(
  'process-notifications',
  '* * * * *', -- Cada minuto
  $$
    SELECT net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/process-notifications',
      headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    );
  $$
);
```

---

## 2. Configuración de la Aplicación Web

### 2.1 Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto web:

```bash
# Supabase
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# App Settings
VITE_APP_NAME=Bookio
VITE_APP_URL=https://your-domain.com

# Analytics (opcional)
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

### 2.2 Personalizar Configuración

Edita `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    redirectTo: `${window.location.origin}/auth/callback`,
    autoRefreshToken: true,
    persistSession: true
  }
})
```

### 2.3 Configurar Build y Deploy

```bash
# Instalar dependencias
npm install

# Build para producción
npm run build

# Preview local
npm run preview
```

### 2.4 Deploy a Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel

# Configurar variables de entorno en Vercel dashboard
# Ir a Project Settings > Environment Variables
```

O usa la integración de GitHub en Vercel para deploy automático.

---

## 3. Configuración de la Aplicación Móvil

### 3.1 Configurar Expo

```bash
# Crear proyecto Expo
npx create-expo-app BookioMobile --template

# Navegar al directorio
cd BookioMobile

# Instalar dependencias necesarias
npx expo install expo-notifications expo-device expo-constants expo-auth-session
npm install @supabase/supabase-js @react-navigation/native @react-navigation/stack
```

### 3.2 Configurar app.json

```json
{
  "expo": {
    "name": "Bookio",
    "slug": "Bookio",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.Bookio"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.yourcompany.Bookio"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff"
        }
      ]
    ]
  }
}
```

### 3.3 Configurar Notificaciones Push

Crea `src/lib/notifications.ts`:

```typescript
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export async function registerForPushNotificationsAsync() {
  let token

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!')
      return
    }
    
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    })).data
  } else {
    alert('Must use physical device for Push Notifications')
  }

  return token
}
```

### 3.4 Build y Deploy

```bash
# Para desarrollo
npx expo start

# Para build de producción
eas build --platform ios
eas build --platform android

# Para publicar en app stores
eas submit --platform ios
eas submit --platform android
```

---

## 4. Configuración de la Extensión del Navegador

### 4.1 Actualizar manifest.json

Edita `src/browser-extension/manifest.json`:

```json
{
  "host_permissions": [
    "https://YOUR_PROJECT_REF.supabase.co/*",
    "https://your-domain.com/*"
  ]
}
```

### 4.2 Configurar URLs

Edita `src/browser-extension/background.js` y `src/browser-extension/popup.js`:

```javascript
const CONFIG = {
  SUPABASE_URL: 'https://YOUR_PROJECT_REF.supabase.co',
  WEB_APP_URL: 'https://your-domain.com',
  // ... resto de configuración
}
```

### 4.3 Crear Iconos

Crea iconos en `src/browser-extension/icons/`:
- `icon-16.png` (16x16)
- `icon-32.png` (32x32)
- `icon-48.png` (48x48)
- `icon-128.png` (128x128)

### 4.4 Build y Publicar

```bash
# Crear package para Chrome Web Store
zip -r Bookio-extension.zip src/browser-extension/

# Subir a Chrome Web Store Developer Dashboard
# https://chrome.google.com/webstore/devconsole
```

---

## 5. Configuración de Variables de Entorno

### 5.1 Variables de Desarrollo (.env.local)

```bash
# Supabase
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# App
VITE_APP_NAME=Bookio
VITE_APP_URL=http://localhost:5173

# Features
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEMO_DATA=true
```

### 5.2 Variables de Producción

En Vercel/Netlify/tu hosting:

```bash
# Supabase
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# App
VITE_APP_NAME=Bookio
VITE_APP_URL=https://your-domain.com

# Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEMO_DATA=false

# Analytics
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

---

## 6. Configuración de Notificaciones

### 6.1 SendGrid (Email)

1. Crea cuenta en [SendGrid](https://sendgrid.com)
2. Verifica tu dominio
3. Crea API Key
4. Agrega a variables de entorno de Supabase

### 6.2 Firebase Cloud Messaging (Android Push)

1. Crea proyecto en [Firebase Console](https://console.firebase.google.com)
2. Agrega app Android
3. Descarga `google-services.json`
4. Copia el Server Key a variables de entorno

### 6.3 Apple Push Notifications (iOS)

1. Crea certificado en Apple Developer
2. Configura App ID con Push Notifications
3. Genera .p8 key file
4. Agrega credenciales a variables de entorno

---

## 7. Pruebas y Validación

### 7.1 Checklist de Funcionalidades

**Aplicación Web:**
- [ ] Registro/Login funciona
- [ ] Crear citas
- [ ] Ver calendario
- [ ] Editar/cancelar citas
- [ ] Recibir notificaciones
- [ ] Dashboard con estadísticas

**Aplicación Móvil:**
- [ ] Autenticación
- [ ] Sincronización con web
- [ ] Notificaciones push
- [ ] Funciona offline básico

**Extensión del Navegador:**
- [ ] Muestra próximas 3 citas
- [ ] Sincroniza con aplicación
- [ ] Abre aplicación web correctamente
- [ ] Notificaciones en navegador

**Backend (Supabase):**
- [ ] Edge Functions funcionan
- [ ] Base de datos configurada
- [ ] RLS policies activas
- [ ] Cron jobs para notificaciones

### 7.2 Tests de Usuario

1. Crea usuario de prueba
2. Agrega varias citas
3. Prueba notificaciones
4. Verifica sincronización entre plataformas

---

## 8. Despliegue en Producción

### 8.1 Pre-deploy Checklist

- [ ] Variables de entorno configuradas
- [ ] Dominio personalizado configurado
- [ ] SSL certificado activo
- [ ] Analytics configurado
- [ ] Error monitoring configurado (Sentry, etc.)
- [ ] Backup de base de datos configurado

### 8.2 Monitoreo Post-deploy

- [ ] Logs de aplicación
- [ ] Métricas de performance
- [ ] Uptime monitoring
- [ ] Error tracking
- [ ] User feedback collection

### 8.3 Mantenimiento

- [ ] Backups automáticos
- [ ] Actualizaciones de dependencias
- [ ] Monitoreo de costos
- [ ] Performance optimization
- [ ] Security updates

---

## 🚀 URLs de Ejemplo Finales

- **Web App**: `https://Bookio.vercel.app`
- **Mobile App**: Apps stores (iOS/Android)
- **Browser Extension**: Chrome Web Store
- **Backend**: `https://your-project.supabase.co`

---

## 📞 Soporte

Si tienes problemas durante el despliegue:

1. Revisa los logs de cada plataforma
2. Verifica las variables de entorno
3. Comprueba las configuraciones de CORS
4. Valida las credenciales de APIs externas

¡Tu aplicación Bookio está lista para producción! 🎉