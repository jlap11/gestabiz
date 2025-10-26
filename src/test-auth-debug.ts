/**
 * Script de debugging para RLS - Ejecutar desde la app
 * Importar y ejecutar testBusinessInsert() desde un componente
 */
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export async function testAuthDebug() {
  console.log('🔍 INICIANDO TEST DE AUTENTICACIÓN');

  try {
    // Test 1: Verificar sesión actual
    console.log('\n📋 Test 1: Verificar Sesión Actual');
    
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session Error:', sessionError);
      toast.error('Error al obtener sesión');
      return { success: false, error: 'Session error' };
    }

    console.log('✅ Session exists:', !!sessionData.session);
    console.log('✅ User ID:', sessionData.session?.user?.id);
    console.log('✅ Email:', sessionData.session?.user?.email);
    console.log('✅ Access Token (primeros 50 chars):', sessionData.session?.access_token?.substring(0, 50) + '...');
    console.log('✅ Token expires at:', new Date((sessionData.session?.expires_at || 0) * 1000));
    console.log('✅ Is token expired:', Date.now() > ((sessionData.session?.expires_at || 0) * 1000));

    if (!sessionData.session?.user) {
      console.error('❌ No hay sesión activa');
      toast.error('No hay sesión activa');
      return { success: false, error: 'No session' };
    }

    const userId = sessionData.session.user.id;

    // Test 2: Obtener una categoría válida
    console.log('\n📋 Test 2: Obtener Categoría de Prueba');
    
    const { data: category, error: categoryError } = await supabase
      .from('business_categories')
      .select('id, name')
      .limit(1)
      .single();

    if (categoryError || !category) {
      console.error('❌ No se pudo obtener categoría:', categoryError);
      toast.error('No se pudo obtener categoría de prueba');
      return { success: false, error: 'No category' };
    }

    console.log('📦 Categoría de prueba:', category);
    console.log('👤 User ID para owner_id:', userId);

    // Test 3: Intentar INSERT en businesses
    console.log('\n📋 Test 3: Test INSERT en businesses');
    
    const testBusinessData = {
      name: 'TEST Business Debug ' + Date.now(),
      owner_id: userId,
      category_id: category.id,
      is_active: true,
      legal_entity_type: 'individual' as const,
      business_hours: {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '09:00', close: '14:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true },
      },
      settings: {
        currency: 'COP',
        appointment_buffer: 15,
        advance_booking_days: 30,
        cancellation_policy: 24,
        auto_confirm: false,
        require_deposit: false,
        deposit_percentage: 0,
      },
    };

    console.log('📤 Enviando INSERT con data:', testBusinessData);

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert(testBusinessData)
      .select()
      .single();

    if (businessError) {
      console.error('❌ INSERT ERROR:', businessError);
      console.error('   Code:', businessError.code);
      console.error('   Message:', businessError.message);
      console.error('   Details:', businessError.details);
      console.error('   Hint:', businessError.hint);
      
      toast.error(`Error al insertar: ${businessError.message}`);
      
      return {
        success: false,
        error: businessError,
        sessionInfo: {
          userId,
          email: sessionData.session.user.email,
          hasToken: !!sessionData.session.access_token,
        },
      };
    }

    console.log('✅ INSERT SUCCESS:', business);
    toast.success('¡Test exitoso! Business creado correctamente');

    // Limpiar: eliminar el negocio de prueba
    console.log('\n🧹 Limpiando: Eliminando test business...');
    const { error: deleteError } = await supabase
      .from('businesses')
      .delete()
      .eq('id', business.id);

    if (deleteError) {
      console.warn('⚠️ No se pudo eliminar el test business:', deleteError);
    } else {
      console.log('✅ Test business eliminado');
    }

    console.log('\n✅ TESTS COMPLETADOS EXITOSAMENTE');
    
    return {
      success: true,
      business,
      sessionInfo: {
        userId,
        email: sessionData.session.user.email,
        hasToken: !!sessionData.session.access_token,
      },
    };

  } catch (err) {
    console.error('❌ Error durante tests:', err);
    toast.error('Error durante el test de autenticación');
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// Función auxiliar para ejecutar desde DevTools (si window.supabase está disponible)
if (typeof window !== 'undefined') {
  (window as any).testAuthDebug = testAuthDebug;
}
