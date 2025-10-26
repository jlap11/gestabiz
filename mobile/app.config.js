export default {
  expo: {
    name: "Gestabiz",
    slug: "gestabiz-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#F8FAFC"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.gestabiz.mobile",
      buildNumber: "1.0.0",
      config: {
        usesNonExemptEncryption: false
      },
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
          NSAllowsLocalNetworking: true
        }
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#F8FAFC"
      },
      package: "com.gestabiz.mobile",
      versionCode: 1,
      permissions: [
        "INTERNET",
        "CAMERA",
        "READ_CALENDAR",
        "WRITE_CALENDAR",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "NOTIFICATIONS",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    plugins: [
      "expo-router",
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#3B82F6",
          sounds: [
            "./assets/notification.wav"
          ]
        }
      ],
      [
        "expo-calendar",
        {
          calendarPermission: "La aplicación necesita acceder a tu calendario para sincronizar citas."
        }
      ],
      [
        "expo-camera",
        {
          cameraPermission: "La aplicación necesita acceder a tu cámara para escanear códigos QR."
        }
      ]
    ],
    extra: {
      // URLs de la web app
      webAppUrl: process.env.EXPO_PUBLIC_WEB_APP_URL || process.env.VITE_APP_URL || "https://gestabiz.com",
      webAppUrlDev: "http://localhost:5173",
      
      // Supabase (sincronizado con variables de web)
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
      
      eas: {
        projectId: "your-project-id-here"
      }
    },
    scheme: "gestabiz",
    runtimeVersion: {
      policy: "sdkVersion"
    },
    updates: {
      fallbackToCacheTimeout: 0,
      url: "https://u.expo.dev/your-project-id-here"
    }
  }
}
