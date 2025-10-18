// =============================================================================
// SCRIPT DE DIAGNÓSTICO - ERROR 400 LOGIN
// =============================================================================
// Copiar TODO el código de abajo y pegar en DevTools Console (F12 → Console)
// Luego presionar Enter

console.clear();
console.log('%c🔍 INICIANDO DIAGNÓSTICO DE ERROR 400 LOGIN', 'background: #222; color: #0f0; font-size: 16px; padding: 10px;');

const results = {};

// ============================================================================
// TEST 1: Verificar configuración de Supabase
// ============================================================================
console.log('\n%c📋 TEST 1: Configuración de Supabase', 'background: #333; color: #ff0; font-size: 12px; padding: 5px;');

try {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('✓ VITE_SUPABASE_URL:', url ? '✅ Configurado' : '❌ FALTA');
  console.log('  └─ Valor:', url?.substring(0, 50) + '...');
  
  console.log('✓ VITE_SUPABASE_ANON_KEY:', key ? '✅ Configurado' : '❌ FALTA');
  console.log('  └─ Largo:', key?.length || 0, 'caracteres');
  
  results.hasConfig = !!url && !!key;
} catch (e) {
  console.error('❌ Error:', e.message);
  results.hasConfig = false;
}

// ============================================================================
// TEST 2: Verificar cliente de Supabase
// ============================================================================
console.log('\n%c📋 TEST 2: Cliente de Supabase', 'background: #333; color: #ff0; font-size: 12px; padding: 5px;');

try {
  // Buscar cliente en diferentes lugares
  let client = window.supabase;
  
  if (!client) {
    console.log('❌ window.supabase no encontrado');
    console.log('ℹ️  Intentando acceder vía módulos...');
    results.clientFound = false;
  } else {
    console.log('✅ Cliente de Supabase encontrado');
    console.log('  └─ Métodos disponibles:', [
      'auth.getSession',
      'auth.signInWithPassword',
      'auth.signUp',
      'from',
      'rpc'
    ].map(m => `  · ${m}`).join('\n'));
    results.clientFound = true;
  }
} catch (e) {
  console.error('❌ Error:', e.message);
  results.clientFound = false;
}

// ============================================================================
// TEST 3: Verificar sesión actual
// ============================================================================
console.log('\n%c📋 TEST 3: Sesión Actual', 'background: #333; color: #ff0; font-size: 12px; padding: 5px;');

try {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.log('❌ Error obteniendo sesión:', sessionError.message);
    results.sessionCheck = 'error';
  } else if (sessionData.session) {
    console.log('✅ Sesión activa encontrada');
    console.log('  └─ Usuario:', sessionData.session.user.email);
    console.log('  └─ Token expira en:', new Date(sessionData.session.expires_at * 1000));
    results.sessionCheck = 'active';
  } else {
    console.log('ℹ️  No hay sesión activa (es normal si no has iniciado sesión)');
    results.sessionCheck = 'none';
  }
} catch (e) {
  console.error('❌ Error:', e.message);
  results.sessionCheck = 'error';
}

// ============================================================================
// TEST 4: Verificar localStorage
// ============================================================================
console.log('\n%c📋 TEST 4: Almacenamiento Local', 'background: #333; color: #ff0; font-size: 12px; padding: 5px;');

try {
  const supabaseKey = Object.keys(localStorage).find(k => k.includes('supabase'));
  
  if (supabaseKey) {
    console.log('✅ Datos de Supabase en localStorage:', supabaseKey);
    const data = JSON.parse(localStorage.getItem(supabaseKey) || '{}');
    console.log('  └─ Session:', !!data.session ? '✅ Existe' : '❌ NO existe');
    console.log('  └─ Access Token:', !!data.session?.access_token ? '✅ Existe' : '❌ NO existe');
    results.localStorageOk = true;
  } else {
    console.log('ℹ️  No hay datos de Supabase en localStorage (es normal si no has iniciado sesión)');
    results.localStorageOk = true;
  }
} catch (e) {
  console.error('❌ Error:', e.message);
  results.localStorageOk = false;
}

// ============================================================================
// TEST 5: Simular intento de login
// ============================================================================
console.log('\n%c📋 TEST 5: Intento de Login (SIMULAR)', 'background: #333; color: #ff0; font-size: 12px; padding: 5px;');
console.log('ℹ️  INSTRUCCIÓN: Para probar login, ejecuta en la consola:');
console.log(`
  ┌─────────────────────────────────────────────────────┐
  │ await supabase.auth.signInWithPassword({            │
  │   email: 'tu-email@example.com',                    │
  │   password: 'tu-contraseña'                         │
  │ }).then(r => {                                       │
  │   console.log('Error:', r.error);                   │
  │   console.log('Data:', r.data);                     │
  │ })                                                   │
  └─────────────────────────────────────────────────────┘
`);

// ============================================================================
// TEST 6: Revisar Network en Chrome DevTools
// ============================================================================
console.log('\n%c📋 TEST 6: Verificar Request en Network', 'background: #333; color: #ff0; font-size: 12px; padding: 5px;');
console.log(`
  1. Abre la pestaña "Network" en DevTools
  2. Intenta iniciar sesión
  3. Busca la solicitud a "token" (POST)
  4. Haz clic en ella
  5. Revisa:
     ✓ Request Headers → Content-Type: application/json
     ✓ Request Body → { "email": "...", "password": "..." }
     ✓ Response Status → 400 Bad Request
     ✓ Response Body → Ver detalles del error
`);

// ============================================================================
// RESUMEN FINAL
// ============================================================================
console.log('\n%c📊 RESUMEN DE DIAGNÓSTICO', 'background: #222; color: #0f0; font-size: 14px; padding: 10px;');

const status = {
  'Config de Supabase': results.hasConfig ? '✅' : '❌',
  'Cliente de Supabase': results.clientFound ? '✅' : '❌',
  'Sesión': results.sessionCheck === 'error' ? '❌' : '✅',
  'localStorage': results.localStorageOk ? '✅' : '❌'
};

Object.entries(status).forEach(([key, value]) => {
  console.log(`${value} ${key}`);
});

console.log('\n%c💡 PRÓXIMOS PASOS', 'background: #333; color: #fff; font-size: 12px; padding: 5px;');

if (!results.hasConfig) {
  console.log('❌ PROBLEMA: Falta configurar variables de entorno');
  console.log('   SOLUCIÓN:');
  console.log('   1. Crear archivo .env.local en la raíz del proyecto');
  console.log('   2. Agregar:');
  console.log('      VITE_SUPABASE_URL=https://dkancockzvcqorqbwtyh.supabase.co');
  console.log('      VITE_SUPABASE_ANON_KEY=tu-clave-publica');
  console.log('   3. Guardar y refrescar página');
} else if (!results.clientFound) {
  console.log('❌ PROBLEMA: Cliente de Supabase no encontrado');
  console.log('   SOLUCIÓN:');
  console.log('   1. Reiniciar servidor: npm run dev');
  console.log('   2. Refrescar página (Ctrl+Shift+R)');
} else if (results.sessionCheck === 'error') {
  console.log('❌ PROBLEMA: Error obteniendo sesión');
  console.log('   SOLUCIÓN:');
  console.log('   1. Limpiar localStorage: localStorage.clear()');
  console.log('   2. Refrescar página');
} else {
  console.log('✅ CONFIGURACIÓN BÁSICA OK');
  console.log('   Ahora prueba iniciar sesión:');
  console.log('   - Si el error 400 persiste, revisa el response en Network tab');
  console.log('   - Verifica que email/password sean correctos');
  console.log('   - Comprueba que el usuario existe en Supabase Auth → Users');
}

console.log('\n%c═══════════════════════════════════════════════════════', 'color: #0f0; font-size: 10px;');

// ============================================================================
// EXPORTAR RESULTADOS PARA DEPURACIÓN
// ============================================================================
window.diagnosticResults = results;
console.log('\n📌 Resultados guardados en: window.diagnosticResults');
console.log(results);
