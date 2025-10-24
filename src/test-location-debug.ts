/**
 * Script de debugging para RLS de LOCATIONS
 * Prueba específica para insertar sedes
 */
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export async function testLocationInsert() {
  console.log('🔍 INICIANDO TEST DE INSERT LOCATION')

  try {
    // Test 1: Verificar sesión
    console.log('\n📋 Test 1: Verificar Sesión')
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !sessionData.session) {
      console.error('❌ No hay sesión activa')
      toast.error('No estás autenticado')
      return { success: false, error: 'No session' }
    }

    const userId = sessionData.session.user.id
    console.log('✅ User ID:', userId)
    console.log('✅ Email:', sessionData.session.user.email)

    // Test 2: Verificar que el usuario tiene al menos un negocio
    console.log('\n📋 Test 2: Verificar Negocios del Usuario')
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, owner_id')
      .eq('owner_id', userId)
      .limit(1)

    if (businessError) {
      console.error('❌ Error al obtener negocios:', businessError)
      toast.error('Error al verificar negocios')
      return { success: false, error: businessError }
    }

    if (!businesses || businesses.length === 0) {
      console.warn('⚠️ No tienes negocios creados')
      toast.warning('Primero debes crear un negocio')
      return { success: false, error: 'No businesses found' }
    }

    const business = businesses[0]
    console.log('✅ Negocio encontrado:', business.name)
    console.log('✅ Business ID:', business.id)
    console.log('✅ Owner ID:', business.owner_id)
    console.log('✅ Match con user ID:', business.owner_id === userId)

    // Test 3: Intentar INSERT de location
    console.log('\n📋 Test 3: Test INSERT en locations')

    const testLocationData = {
      business_id: business.id,
      name: 'TEST Location Debug ' + Date.now(),
      address: 'Calle Test 123',
      city: 'Bogotá',
      state: 'Cundinamarca',
      country: 'Colombia',
      postal_code: '110111',
      phone: '+573001234567',
      email: 'test@example.com',
      description: 'Sede de prueba para debugging RLS',
      is_active: true,
      is_primary: false,
      business_hours: {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '09:00', close: '14:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true },
      },
    }

    console.log('📤 Enviando INSERT con data:', testLocationData)

    const { data: location, error: locationError } = await supabase
      .from('locations')
      .insert(testLocationData)
      .select()
      .single()

    if (locationError) {
      console.error('❌ INSERT ERROR:', locationError)
      console.error('   Code:', locationError.code)
      console.error('   Message:', locationError.message)
      console.error('   Details:', locationError.details)
      console.error('   Hint:', locationError.hint)

      toast.error(`Error al insertar location: ${locationError.message}`)

      return {
        success: false,
        error: locationError,
        context: {
          userId,
          businessId: business.id,
          businessOwnerId: business.owner_id,
          idsMatch: business.owner_id === userId,
        },
      }
    }

    console.log('✅ INSERT SUCCESS:', location)
    toast.success('¡Test exitoso! Location creada correctamente')

    // Limpiar: eliminar la location de prueba
    console.log('\n🧹 Limpiando: Eliminando test location...')
    const { error: deleteError } = await supabase.from('locations').delete().eq('id', location.id)

    if (deleteError) {
      console.warn('⚠️ No se pudo eliminar la test location:', deleteError)
    } else {
      console.log('✅ Test location eliminada')
    }

    console.log('\n✅ TESTS COMPLETADOS EXITOSAMENTE')

    return {
      success: true,
      location,
      context: {
        userId,
        businessId: business.id,
        businessName: business.name,
      },
    }
  } catch (err) {
    console.error('❌ Error durante tests:', err)
    toast.error('Error durante el test de locations')
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

// Función auxiliar para ejecutar desde DevTools
if (typeof window !== 'undefined') {
  ;(window as any).testLocationInsert = testLocationInsert
}
