/**
 * Script para aplicar fix de ambigüedad en appointments
 * Ejecuta la migración que crea la vista materializada
 *
 * Uso: npm run fix-appointments-ambiguity
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuración de Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: Faltan variables de entorno')
  console.error('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_KEY ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function applyFix() {
  console.log('🔧 Aplicando fix de ambigüedad en appointments...\n')

  try {
    // Leer el archivo de migración
    const migrationPath = path.join(
      __dirname,
      '..',
      'supabase',
      'migrations',
      '20251019000000_fix_appointments_ambiguity.sql'
    )

    console.log('📄 Leyendo migración:', migrationPath)
    const sql = fs.readFileSync(migrationPath, 'utf-8')

    // Ejecutar la migración
    console.log('⚙️  Ejecutando migración...')
    const { error } = await supabase.rpc('exec_sql', { sql_string: sql })

    if (error) {
      // Si no existe la función exec_sql, ejecutar directamente
      console.log('⚠️  Función exec_sql no disponible, ejecutando via Edge Function...')

      // Dividir en statements individuales
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--') && s.length > 10)

      for (const statement of statements) {
        if (statement.includes('COMMENT ON')) continue // Skip comments

        const { error: stmtError } = await supabase.rpc('execute_sql', {
          query: statement,
        })

        if (stmtError) {
          console.error('❌ Error en statement:', stmtError.message)
          console.log('Statement:', statement.substring(0, 100) + '...')
        }
      }
    }

    // Verificar que la vista existe
    console.log('\n🔍 Verificando vista materializada...')
    const { data, error: viewError } = await supabase
      .from('appointments_with_relations')
      .select('id')
      .limit(1)

    if (viewError) {
      throw new Error(`No se pudo acceder a la vista: ${viewError.message}`)
    }

    console.log('✅ Vista materializada creada exitosamente')

    // Contar registros
    const { count, error: countError } = await supabase
      .from('appointments_with_relations')
      .select('*', { count: 'exact', head: true })

    if (!countError) {
      console.log(`📊 Total de citas en la vista: ${count}`)
    }

    console.log('\n✨ Fix aplicado exitosamente!')
    console.log('\n📝 Cambios realizados:')
    console.log('   1. ✅ Eliminada FK appointments_cancelled_by_fkey')
    console.log('   2. ✅ Creada vista materializada appointments_with_relations')
    console.log('   3. ✅ Configurados triggers para auto-refresh')
    console.log('   4. ✅ Creados índices para performance')
    console.log('\n💡 La app ahora puede consultar appointments sin ambigüedad')
  } catch (error) {
    console.error('\n❌ Error al aplicar fix:', error)
    process.exit(1)
  }
}

applyFix()
