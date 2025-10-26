#!/usr/bin/env node

/**
 * Clean Transactional Data Script
 * 
 * Limpia SOLO data transaccional (generada por usuarios)
 * Preserva negocios, empleados, servicios, ubicaciones y configuraciones
 * 
 * Uso:
 *   npx ts-node scripts/clean-transactional-data.ts [--force]
 *   o
 *   node scripts/clean-transactional-data.mjs [--force]
 * 
 * Opciones:
 *   --force    Ejecuta sin confirmación interactiva
 *   --dry-run  Simula limpieza sin ejecutar
 */

import * as readline from 'readline'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: No están configuradas las variables de entorno:')
  console.error('   - VITE_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const TRANSACTIONAL_TABLES = [
  'messages',
  'conversations',
  'message_attachments',
  'reviews',
  'appointments',
  'notifications',
  'notification_log',
  'user_notification_preferences',
  'transactions',
  'invoices',
  'subscriptions',
  'job_applications',
  'job_vacancy_views',
  'vacancy_responses',
  'mandatory_reviews',
  'sync_conflicts',
  'calendar_sync_logs',
  'bug_reports',
]

const RETAINED_TABLES = [
  'profiles',
  'businesses',
  'business_employees',
  'locations',
  'services',
  'employee_services',
  'business_categories',
  'categories',
  'business_notification_settings',
  'business_employees_schedule',
  'job_vacancies',
  'permissions',
  'user_roles',
  'billing_plans',
]

interface CleanupStats {
  [key: string]: number
}

async function getTableStats(): Promise<CleanupStats> {
  const stats: CleanupStats = {}

  for (const table of TRANSACTIONAL_TABLES) {
    try {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      stats[table] = count || 0
    } catch {
      stats[table] = 0 // tabla no existe
    }
  }

  return stats
}

async function getRetainedStats(): Promise<CleanupStats> {
  const stats: CleanupStats = {}

  for (const table of RETAINED_TABLES) {
    try {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      stats[table] = count || 0
    } catch {
      stats[table] = 0
    }
  }

  return stats
}

async function confirmAction(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 's')
    })
  })
}

async function deleteTableData(table: string): Promise<number> {
  try {
    const { count } = await supabase
      .from(table)
      .delete()
      .neq('id', 'non-existent-uuid') // delete all rows

    return count || 0
  } catch (error) {
    console.error(`  ⚠️  Error limpiando ${table}:`, error instanceof Error ? error.message : error)
    return 0
  }
}

async function cleanTransactionalData(dryRun = false): Promise<void> {
  console.log('\n📊 LIMPIEZA DE DATA TRANSACCIONAL')
  console.log('='.repeat(60))

  // Obtener estadísticas actuales
  console.log('\n📈 Recopilando estadísticas actuales...')
  const beforeStats = await getTableStats()
  const retainedStats = await getRetainedStats()

  const totalRows = Object.values(beforeStats).reduce((a, b) => a + b, 0)
  const totalRetained = Object.values(retainedStats).reduce((a, b) => a + b, 0)

  console.log(`\n✅ Data a LIMPIAR (${TRANSACTIONAL_TABLES.length} tablas):`)
  Object.entries(beforeStats).forEach(([table, count]) => {
    if (count > 0) console.log(`   ${table}: ${count} registros`)
  })
  console.log(`   TOTAL: ${totalRows} registros`)

  console.log(`\n📌 Data a PRESERVAR (${RETAINED_TABLES.length} tablas):`)
  Object.entries(retainedStats).forEach(([table, count]) => {
    if (count > 0) console.log(`   ${table}: ${count} registros`)
  })
  console.log(`   TOTAL: ${totalRetained} registros`)

  if (totalRows === 0) {
    console.log('\n✨ No hay data transaccional que limpiar. Base de datos ya está limpia.')
    return
  }

  console.log('\n⚠️  ADVERTENCIA:')
  console.log('  • Se eliminarán TODAS las citas, notificaciones, chats y transacciones')
  console.log('  • Los negocios, empleados y servicios se MANTIENEN')
  console.log('  • Esta acción NO se puede deshacer sin restaurar un backup')
  console.log('  • Ejecuta esto SOLO en ambiente de desarrollo o testing')

  if (dryRun) {
    console.log('\n🔍 MODO DRY-RUN: No se ejecutarán cambios reales')
    return
  }

  const confirmed = await confirmAction('\n¿Deseas continuar? (escribe "yes" o "s" para confirmar): ')

  if (!confirmed) {
    console.log('\n❌ Operación cancelada.')
    return
  }

  console.log('\n🗑️  Iniciando limpieza...\n')

  const deletedStats: CleanupStats = {}
  let totalDeleted = 0

  for (const table of TRANSACTIONAL_TABLES) {
    if (beforeStats[table] === 0) continue

    process.stdout.write(`  Limpiando ${table.padEnd(30)}... `)

    const deleted = await deleteTableData(table)
    deletedStats[table] = deleted
    totalDeleted += deleted

    console.log(`✓ (${deleted} registros eliminados)`)
  }

  // Estadísticas finales
  console.log('\n' + '='.repeat(60))
  console.log('✅ LIMPIEZA COMPLETADA')
  console.log('='.repeat(60))

  console.log(`\n📊 Resumen:`)
  console.log(`   Total eliminado: ${totalDeleted} registros`)
  console.log(`   Data preservada: ${totalRetained} registros`)

  console.log(`\n📈 Detalle por tabla:`)
  Object.entries(deletedStats)
    .filter(([, count]) => count > 0)
    .forEach(([table, count]) => {
      console.log(`   ${table}: ${count} registros`)
    })

  console.log('\n✨ Database limpia y lista para nuevas operaciones.')
}

// Main
async function main() {
  const args = process.argv.slice(2)
  const isForce = args.includes('--force')
  const isDryRun = args.includes('--dry-run')

  if (isDryRun) {
    console.log('🔍 Ejecutando en modo DRY-RUN (sin cambios reales)')
  }

  try {
    await cleanTransactionalData(isDryRun)
  } catch (error) {
    console.error('\n❌ Error durante limpieza:', error)
    process.exit(1)
  }
}

main()
