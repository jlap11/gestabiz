/**
 * Script para verificar que la configuración móvil esté correcta
 * 
 * Ejecutar: npx tsx mobile/scripts/check-setup.ts
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface CheckResult {
  name: string
  passed: boolean
  message: string
}

const checks: CheckResult[] = []

async function checkNodeModules() {
  try {
    const { stdout } = await execAsync('test -d mobile/node_modules && echo "exists"')
    checks.push({
      name: 'Node Modules',
      passed: stdout.includes('exists'),
      message: 'Dependencias instaladas ✓'
    })
  } catch {
    checks.push({
      name: 'Node Modules',
      passed: false,
      message: 'Ejecuta: cd mobile && npm install'
    })
  }
}

async function checkEnvVars() {
  const VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL
  const VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
  
  if (VITE_SUPABASE_URL && VITE_SUPABASE_ANON_KEY) {
    checks.push({
      name: 'Variables de Entorno',
      passed: true,
      message: `Supabase configurado: ${VITE_SUPABASE_URL}`
    })
  } else {
    checks.push({
      name: 'Variables de Entorno',
      passed: false,
      message: 'Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY'
    })
  }
}

async function checkWebViewPackage() {
  try {
    const { stdout } = await execAsync('grep -q "react-native-webview" mobile/package.json && echo "exists"')
    checks.push({
      name: 'React Native WebView',
      passed: stdout.includes('exists'),
      message: 'Paquete instalado ✓'
    })
  } catch {
    checks.push({
      name: 'React Native WebView',
      passed: false,
      message: 'Ejecuta: cd mobile && npm install react-native-webview'
    })
  }
}

async function runChecks() {
  console.log('🔍 Verificando configuración de la app móvil...\n')
  
  await checkNodeModules()
  await checkEnvVars()
  await checkWebViewPackage()
  
  console.log('Resultados:\n')
  
  let allPassed = true
  checks.forEach(check => {
    const icon = check.passed ? '✅' : '❌'
    console.log(`${icon} ${check.name}`)
    console.log(`   ${check.message}\n`)
    
    if (!check.passed) allPassed = false
  })
  
  if (allPassed) {
    console.log('✅ Todo configurado correctamente!')
    console.log('Ejecuta: npm run mobile')
    process.exit(0)
  } else {
    console.log('❌ Completa los pasos anteriores antes de ejecutar la app')
    process.exit(1)
  }
}

runChecks()


