// ==============================================
// TEST DE AUTENTICACIÓN - Copiar y pegar en DevTools Console
// ==============================================

console.log(
  '%c INICIANDO TEST DE AUTENTICACIÓN',
  'background: #222; color: #00ff00; font-size: 16px; padding: 10px;'
)

// Test 1: Verificar sesión actual
const testAuth = async () => {
  console.log(
    '\n%c Test 1: Verificar Sesión Actual',
    'background: #333; color: #ffff00; font-size: 14px; padding: 5px;'
  )

  const { data: session, error: sessionError } = await supabase.auth.getSession()

  console.log(' Session exists:', !!session.session)
  console.log(' User ID:', session.session?.user?.id)
  console.log(' Email:', session.session?.user?.email)
  console.log(
    ' Access Token (primeros 50 chars):',
    session.session?.access_token?.substring(0, 50) + '...'
  )
  console.log(' Token expires at:', new Date(session.session?.expires_at * 1000))
  console.log(' Is token expired:', Date.now() > session.session?.expires_at * 1000)

  if (sessionError) {
    console.error(' Session Error:', sessionError)
    return null
  }

  return session.session
}

// Test 2: Intentar INSERT en businesses
const testBusinessInsert = async sessionData => {
  console.log(
    '\n%c Test 2: Test INSERT en businesses',
    'background: #333; color: #ffff00; font-size: 14px; padding: 5px;'
  )

  if (!sessionData?.user?.id) {
    console.error(' No hay sesión activa, saltando test de INSERT')
    return
  }

  // Primero, obtener una categoría válida
  const { data: categories } = await supabase
    .from('business_categories')
    .select('id')
    .limit(1)
    .single()

  if (!categories?.id) {
    console.error(' No se pudo obtener categoría de prueba')
    return
  }

  console.log(' Categoría de prueba:', categories.id)
  console.log(' User ID para owner_id:', sessionData.user.id)

  // Intentar INSERT
  const testBusinessData = {
    name: 'TEST Business Debug ' + Date.now(),
    owner_id: sessionData.user.id,
    category_id: categories.id,
    is_active: true,
    legal_entity_type: 'individual',
    business_hours: {
      monday: { open: '09:00', close: '18:00', closed: false },
    },
    settings: {
      currency: 'COP',
      appointment_buffer: 15,
    },
  }

  console.log(' Enviando INSERT con data:', testBusinessData)

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .insert(testBusinessData)
    .select()
    .single()

  if (businessError) {
    console.error(' INSERT ERROR:', businessError)
    console.error('   Code:', businessError.code)
    console.error('   Message:', businessError.message)
    console.error('   Details:', businessError.details)
    console.error('   Hint:', businessError.hint)
    return false
  } else {
    console.log(' INSERT SUCCESS:', business)

    // Limpiar: eliminar el negocio de prueba
    await supabase.from('businesses').delete().eq('id', business.id)
    console.log(' Test business eliminado')
    return true
  }
}

// Test 3: Verificar políticas RLS visibles
const testRLSPolicies = async () => {
  console.log(
    '\n%c Test 3: Verificar Políticas RLS',
    'background: #333; color: #ffff00; font-size: 14px; padding: 5px;'
  )

  const { data: policies, error } = await supabase
    .rpc('get_table_policies', { table_name: 'businesses' })
    .select()

  if (error) {
    console.log(' No se puede ejecutar get_table_policies (esperado si no existe la función)')
  } else {
    console.log(' Políticas RLS:', policies)
  }
}

// Ejecutar todos los tests
const runAllTests = async () => {
  try {
    const sessionData = await testAuth()

    if (sessionData) {
      await testBusinessInsert(sessionData)
    }

    console.log(
      '\n%c TESTS COMPLETADOS',
      'background: #222; color: #00ff00; font-size: 16px; padding: 10px;'
    )
    console.log(
      '%cAhora copia TODOS los resultados y compártelos',
      'color: #ffff00; font-size: 14px;'
    )
  } catch (err) {
    console.error(' Error durante tests:', err)
  }
}

// Iniciar tests
runAllTests()
