import Constants from 'expo-constants'

/**
 * Configuración de variables de entorno para Mobile
 * 
 * IMPORTANTE: Este archivo sincroniza automáticamente las variables de la web
 * Las variables deben estar configuradas en el sistema o en Vercel/hosting
 * 
 * Web usa:     VITE_SUPABASE_URL
 * Mobile usa:  EXPO_PUBLIC_SUPABASE_URL
 * 
 * Ambas se mapean automáticamente desde las mismas variables del sistema
 */

// Función helper para obtener variable con fallback
function getEnvVar(key: string, fallback?: string): string {
  const value = Constants.expoConfig?.extra?.[key] || process.env[key]
  
  if (!value && !fallback) {
    console.warn(`⚠️ Variable de entorno ${key} no configurada`)
  }
  
  return value || fallback || ''
}

// Configuración de Supabase (sincronizada con web)
export const SUPABASE_URL = getEnvVar(
  'supabaseUrl',
  process.env.VITE_SUPABASE_URL
)

export const SUPABASE_ANON_KEY = getEnvVar(
  'supabaseAnonKey',
  process.env.VITE_SUPABASE_ANON_KEY
)

// URLs de la web app
export const WEB_APP_URL = getEnvVar(
  'webAppUrl',
  'https://gestabiz.com'
)

export const WEB_APP_URL_DEV = getEnvVar(
  'webAppUrlDev',
  'http://localhost:5173'
)

// Modo desarrollo
export const IS_DEV = __DEV__

// URL efectiva según entorno
export const EFFECTIVE_WEB_URL = IS_DEV ? WEB_APP_URL_DEV : WEB_APP_URL

// Validación al importar
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variables de Supabase no configuradas')
  console.log('Web usa: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY')
  console.log('Mobile usa: EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY')
  console.log('Ambas deben estar en las variables del sistema o en app.config.js')
} else {
  console.log('✅ Variables de entorno configuradas correctamente')
  console.log('📍 Supabase URL:', SUPABASE_URL)
  console.log('🌐 Web URL:', EFFECTIVE_WEB_URL)
}

export default {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  WEB_APP_URL,
  WEB_APP_URL_DEV,
  IS_DEV,
  EFFECTIVE_WEB_URL,
}

