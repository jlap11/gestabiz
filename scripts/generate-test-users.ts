/**
 * Script simplificado de generación de datos - versión ejecutable con Node.js
 * Usa Supabase Admin SDK para crear usuarios
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'node:fs'
import * as path from 'node:path'

// Validar variables de entorno
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Error: Variables de entorno faltantes')
  console.error('   Verifica que .env contenga:')
  console.error('   - VITE_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

console.log('✅ Configuración validada')
console.log(`   URL: ${SUPABASE_URL}`)
console.log(`   Service Key: ${SERVICE_KEY.substring(0, 20)}...`)

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// ============================================================================
// DATOS BASE
// ============================================================================

const FIRST_NAMES = [
  'Juan',
  'María',
  'Carlos',
  'Ana',
  'Luis',
  'Laura',
  'Pedro',
  'Sofia',
  'Diego',
  'Valentina',
  'Andrés',
  'Camila',
  'Felipe',
  'Isabella',
  'Santiago',
  'Natalia',
  'Miguel',
  'Carolina',
  'Sebastián',
  'Daniela',
]

const LAST_NAMES = [
  'García',
  'Rodríguez',
  'Martínez',
  'Hernández',
  'López',
  'González',
  'Pérez',
  'Sánchez',
  'Ramírez',
  'Torres',
]

// Utilidades
function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateEmail(firstName: string, lastName: string, index: number): string {
  const cleanFirst = firstName
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
  const cleanLast = lastName
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
  return `${cleanFirst}.${cleanLast}${index}@gestabiz.demo`
}

// ============================================================================
// PASO 1: CREAR USUARIOS
// ============================================================================

async function createTestUsers() {
  console.log('\n📝 PASO 1/2: Creando 20 usuarios de prueba...')

  const users = []
  const password = 'Demo2025!'

  for (let i = 1; i <= 20; i++) {
    const firstName = randomElement(FIRST_NAMES)
    const lastName = randomElement(LAST_NAMES)
    const email = generateEmail(firstName, lastName, i)
    const fullName = `${firstName} ${lastName}`
    const phone = `300${randomInt(1000000, 9999999)}`

    try {
      // Crear usuario con email verificado
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          phone,
        },
      })

      if (authError) {
        console.error(`   ❌ Error creando ${email}:`, authError.message)
        continue
      }

      const userId = authData.user.id

      // Crear perfil
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        email,
        full_name: fullName,
        phone,
        is_active: true,
      })

      if (profileError) {
        console.error(`   ❌ Error creando perfil:`, profileError.message)
        continue
      }

      users.push({ id: userId, email, password, full_name: fullName, phone })

      if (i % 5 === 0) {
        console.log(`   ✓ ${i}/20 usuarios creados`)
      }
    } catch (error: any) {
      console.error(`   ❌ Error en usuario ${i}:`, error.message)
    }
  }

  console.log(`   ✅ Total: ${users.length} usuarios creados`)
  return users
}

// ============================================================================
// PASO 2: GENERAR CSV
// ============================================================================

async function generateCSV(users: any[]) {
  console.log('\n📝 PASO 2/2: Generando archivo CSV...')

  const outputDir = path.join(process.cwd(), 'generated-data')

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const csv = [
    'email,password,full_name,phone,user_id',
    ...users.map(u => `${u.email},${u.password},${u.full_name},${u.phone},${u.id}`),
  ].join('\n')

  const filePath = path.join(outputDir, 'usuarios-demo.csv')
  fs.writeFileSync(filePath, csv, 'utf-8')

  console.log(`   ✅ Archivo generado: ${filePath}`)
  console.log(`\n📋 RESUMEN:`)
  console.log(`   - Total usuarios: ${users.length}`)
  console.log(`   - Contraseña: Demo2025!`)
  console.log(`   - Ejemplo: ${users[0]?.email}`)
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🚀 Iniciando generación de datos de prueba...\n')

  try {
    const users = await createTestUsers()
    await generateCSV(users)

    console.log('\n✅ ¡Completado! Puedes iniciar sesión con cualquier email del CSV')
  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  }
}

await main()
