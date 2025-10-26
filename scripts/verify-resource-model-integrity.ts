/**
 * Script de Verificación de Integridad del Sistema de Modelo de Negocio Flexible
 * 
 * Ejecutar: npx tsx scripts/verify-resource-model-integrity.ts
 * 
 * Verifica:
 * 1. Todos los negocios tienen resource_model definido
 * 2. CHECK constraint de appointments (employee_id XOR resource_id)
 * 3. Integridad referencial de resource_id
 * 4. Integridad referencial de location_id en recursos
 * 
 * Fecha: 21 de Octubre de 2025
 */

import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_SERVICE_ROLE_KEY no están configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface VerificationResult {
  passed: boolean
  warnings: string[]
  errors: string[]
  info: string[]
}

async function verifyResourceModelIntegrity(): Promise<VerificationResult> {
  const result: VerificationResult = {
    passed: true,
    warnings: [],
    errors: [],
    info: [],
  }

  console.log('🔍 Iniciando verificación de integridad del sistema...\n')

  // ===== 1. Verificar que todos los negocios tengan resource_model =====
  console.log('1️⃣  Verificando resource_model en negocios...')
  const { data: businessesWithoutModel, error: businessError } = await supabase
    .from('businesses')
    .select('id, name')
    .is('resource_model', null)

  if (businessError) {
    result.errors.push(`Error al consultar negocios: ${businessError.message}`)
    result.passed = false
  } else if (businessesWithoutModel && businessesWithoutModel.length > 0) {
    result.warnings.push(`${businessesWithoutModel.length} negocios sin resource_model definido`)
    console.log(`   ⚠️  ${businessesWithoutModel.length} negocios requieren actualización`)
    
    // Actualizar automáticamente a 'professional'
    const { error: updateError } = await supabase
      .from('businesses')
      .update({ resource_model: 'professional' })
      .is('resource_model', null)

    if (updateError) {
      result.errors.push(`Error al actualizar negocios: ${updateError.message}`)
      result.passed = false
    } else {
      result.info.push(`✓ ${businessesWithoutModel.length} negocios actualizados a 'professional'`)
      console.log(`   ✅ Negocios actualizados automáticamente a 'professional'`)
    }
  } else {
    result.info.push('✓ Todos los negocios tienen resource_model definido')
    console.log('   ✅ Todos los negocios tienen resource_model definido')
  }

  // ===== 2. Verificar CHECK constraint (employee_id XOR resource_id) =====
  console.log('\n2️⃣  Verificando CHECK constraint en appointments...')
  const { data: invalidAppointments, error: appointmentError } = await supabase
    .from('appointments')
    .select('id, employee_id, resource_id')
    .not('employee_id', 'is', null)
    .not('resource_id', 'is', null)

  if (appointmentError) {
    result.errors.push(`Error al consultar appointments: ${appointmentError.message}`)
    result.passed = false
  } else if (invalidAppointments && invalidAppointments.length > 0) {
    result.errors.push(`${invalidAppointments.length} appointments violan CHECK constraint (tienen employee_id Y resource_id)`)
    result.passed = false
    console.log(`   ❌ ${invalidAppointments.length} appointments inválidos:`)
    invalidAppointments.slice(0, 5).forEach(apt => {
      console.log(`      - ID: ${apt.id}, Employee: ${apt.employee_id}, Resource: ${apt.resource_id}`)
    })
    if (invalidAppointments.length > 5) {
      console.log(`      ... y ${invalidAppointments.length - 5} más`)
    }
  } else {
    result.info.push('✓ CHECK constraint cumplido en todos los appointments')
    console.log('   ✅ Todos los appointments cumplen CHECK constraint')
  }

  // ===== 3. Verificar integridad referencial de resource_id =====
  console.log('\n3️⃣  Verificando integridad referencial de resource_id...')
  const { data: appointmentsWithResource } = await supabase
    .from('appointments')
    .select('id, resource_id')
    .not('resource_id', 'is', null)

  if (appointmentsWithResource && appointmentsWithResource.length > 0) {
    const resourceIds = appointmentsWithResource.map(a => a.resource_id)
    const { data: existingResources } = await supabase
      .from('business_resources')
      .select('id')
      .in('id', resourceIds)

    const existingResourceIds = new Set(existingResources?.map(r => r.id) || [])
    const orphanAppointments = appointmentsWithResource.filter(
      apt => !existingResourceIds.has(apt.resource_id!)
    )

    if (orphanAppointments.length > 0) {
      result.errors.push(`${orphanAppointments.length} appointments con resource_id inválido`)
      result.passed = false
      console.log(`   ❌ ${orphanAppointments.length} appointments huérfanos:`)
      orphanAppointments.slice(0, 5).forEach(apt => {
        console.log(`      - Appointment ID: ${apt.id}, Resource ID: ${apt.resource_id}`)
      })
    } else {
      result.info.push('✓ Todos los resource_id son válidos')
      console.log('   ✅ Todos los resource_id son válidos')
    }
  } else {
    result.info.push('ℹ️  No hay appointments con resource_id')
    console.log('   ℹ️  No hay appointments con resource_id')
  }

  // ===== 4. Verificar integridad referencial de location_id en recursos =====
  console.log('\n4️⃣  Verificando integridad referencial de location_id en recursos...')
  const { data: resourcesWithLocation } = await supabase
    .from('business_resources')
    .select('id, location_id')
    .not('location_id', 'is', null)

  if (resourcesWithLocation && resourcesWithLocation.length > 0) {
    const locationIds = resourcesWithLocation.map(r => r.location_id)
    const { data: existingLocations } = await supabase
      .from('locations')
      .select('id')
      .in('id', locationIds)

    const existingLocationIds = new Set(existingLocations?.map(l => l.id) || [])
    const orphanResources = resourcesWithLocation.filter(
      res => !existingLocationIds.has(res.location_id!)
    )

    if (orphanResources.length > 0) {
      result.warnings.push(`${orphanResources.length} recursos con location_id inválido`)
      console.log(`   ⚠️  ${orphanResources.length} recursos huérfanos:`)
      orphanResources.slice(0, 5).forEach(res => {
        console.log(`      - Resource ID: ${res.id}, Location ID: ${res.location_id}`)
      })
    } else {
      result.info.push('✓ Todos los location_id en recursos son válidos')
      console.log('   ✅ Todos los location_id son válidos')
    }
  } else {
    result.info.push('ℹ️  No hay recursos con location_id')
    console.log('   ℹ️  No hay recursos con location_id')
  }

  // ===== 5. Estadísticas del sistema =====
  console.log('\n📊 Estadísticas del Sistema:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  const { count: totalBusinesses } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })

  const { count: professionalBusinesses } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .eq('resource_model', 'professional')

  const { count: resourceBusinesses } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .eq('resource_model', 'physical_resource')

  const { count: hybridBusinesses } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .eq('resource_model', 'hybrid')

  const { count: groupClassBusinesses } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true })
    .eq('resource_model', 'group_class')

  const { count: totalResources } = await supabase
    .from('business_resources')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  const { count: appointmentsWithEmployee } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .not('employee_id', 'is', null)

  const { count: appointmentsWithResource } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .not('resource_id', 'is', null)

  console.log(`Negocios Totales: ${totalBusinesses || 0}`)
  console.log(`  ├─ Profesionales: ${professionalBusinesses || 0} (${((professionalBusinesses || 0) / (totalBusinesses || 1) * 100).toFixed(1)}%)`)
  console.log(`  ├─ Recursos Físicos: ${resourceBusinesses || 0} (${((resourceBusinesses || 0) / (totalBusinesses || 1) * 100).toFixed(1)}%)`)
  console.log(`  ├─ Híbridos: ${hybridBusinesses || 0} (${((hybridBusinesses || 0) / (totalBusinesses || 1) * 100).toFixed(1)}%)`)
  console.log(`  └─ Clases Grupales: ${groupClassBusinesses || 0} (${((groupClassBusinesses || 0) / (totalBusinesses || 1) * 100).toFixed(1)}%)`)
  console.log(`\nRecursos Físicos Activos: ${totalResources || 0}`)
  console.log(`\nAppointments:`)
  console.log(`  ├─ Con Empleado: ${appointmentsWithEmployee || 0}`)
  console.log(`  └─ Con Recurso: ${appointmentsWithResource || 0}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  return result
}

// Ejecutar verificación
async function main() {
  try {
    const result = await verifyResourceModelIntegrity()

    console.log('\n' + '='.repeat(50))
    console.log('📋 RESUMEN DE VERIFICACIÓN')
    console.log('='.repeat(50))

    if (result.info.length > 0) {
      console.log('\n✅ Información:')
      result.info.forEach(info => console.log(`   ${info}`))
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️  Advertencias:')
      result.warnings.forEach(warning => console.log(`   ${warning}`))
    }

    if (result.errors.length > 0) {
      console.log('\n❌ Errores:')
      result.errors.forEach(error => console.log(`   ${error}`))
    }

    console.log('\n' + '='.repeat(50))
    if (result.passed) {
      console.log('✅ VERIFICACIÓN COMPLETADA: Sistema íntegro')
    } else {
      console.log('❌ VERIFICACIÓN FALLIDA: Se encontraron errores')
      process.exit(1)
    }
    console.log('='.repeat(50) + '\n')

  } catch (error) {
    console.error('\n❌ Error fatal durante la verificación:', error)
    process.exit(1)
  }
}

main()
