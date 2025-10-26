// Script para verificar configuración de Supabase
console.log('🔍 Verificando configuración de Supabase...')

console.log('📊 Variables de entorno:')
console.log('  VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('  VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '***CONFIGURADO***' : 'NO CONFIGURADO')
console.log('  VITE_DEMO_MODE:', import.meta.env.VITE_DEMO_MODE)

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-key'

type GlobalWithProcess = typeof globalThis & { process?: { env?: Record<string, string | undefined> } }
const gwp = globalThis as GlobalWithProcess
const demoFlag = typeof gwp !== 'undefined' && gwp.process?.env?.VITE_DEMO_MODE === 'true'
const isDemoMode = demoFlag || import.meta.env.VITE_DEMO_MODE === 'true' || supabaseUrl.includes('demo.supabase.co')

console.log('🎭 Modo demo detectado:', isDemoMode)
console.log('📡 URL de Supabase:', supabaseUrl)

if (isDemoMode) {
  console.log('⚠️ APLICACIÓN EN MODO DEMO')
  console.log('💡 Para usar Supabase real, configura las variables de entorno:')
  console.log('   VITE_SUPABASE_URL=https://pbmzaqfxudrbmhqjybef.supabase.co')
  console.log('   VITE_SUPABASE_ANON_KEY=tu_clave_anon')
} else {
  console.log('✅ APLICACIÓN CONFIGURADA PARA SUPABASE REAL')
}

export {};
