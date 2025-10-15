#!/usr/bin/env node

/**
 * Pre-Deploy Checklist Script
 * Verifica que la aplicación esté lista para desplegar en Vercel
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

let hasErrors = false;

console.log('\n🚀 AppointSync Pro - Pre-Deploy Checklist\n');
console.log('='.repeat(50));

// ============================================
// 1. Verificar archivos de configuración
// ============================================
console.log('\n📁 Verificando archivos de configuración...\n');

const requiredFiles = [
  'package.json',
  'vite.config.ts',
  'tsconfig.json',
  'vercel.json',
  '.vercelignore',
  'index.html'
];

requiredFiles.forEach(file => {
  const exists = existsSync(resolve(process.cwd(), file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) hasErrors = true;
});

// ============================================
// 2. Verificar variables de entorno
// ============================================
console.log('\n🔐 Verificando variables de entorno...\n');

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_APP_URL',
  'VITE_APP_NAME'
];

const optionalEnvVars = [
  'VITE_GOOGLE_CLIENT_ID',
  'VITE_STRIPE_PUBLISHABLE_KEY'
];

console.log('  Variables REQUERIDAS:');
requiredEnvVars.forEach(varName => {
  const exists = process.env[varName];
  console.log(`    ${exists ? '✅' : '⚠️ '} ${varName}`);
  if (!exists) {
    console.log(`       → Debes configurar esta variable en Vercel`);
  }
});

console.log('\n  Variables OPCIONALES:');
optionalEnvVars.forEach(varName => {
  const exists = process.env[varName];
  console.log(`    ${exists ? '✅' : '➖'} ${varName} ${exists ? '' : '(no configurada)'}`);
});

// Verificar que DEMO_MODE no esté activo
if (process.env.VITE_DEMO_MODE === 'true') {
  console.log('\n  ❌ VITE_DEMO_MODE está activo');
  console.log('     → NO uses DEMO_MODE en producción');
  hasErrors = true;
} else {
  console.log('\n  ✅ DEMO_MODE no está activo');
}

// ============================================
// 3. Verificar package.json
// ============================================
console.log('\n📦 Verificando package.json...\n');

try {
  const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
  
  // Verificar scripts requeridos
  const requiredScripts = ['build', 'preview'];
  requiredScripts.forEach(script => {
    const exists = pkg.scripts && pkg.scripts[script];
    console.log(`  ${exists ? '✅' : '❌'} Script "${script}"`);
    if (!exists) hasErrors = true;
  });

  // Verificar dependencias críticas
  const criticalDeps = [
    '@supabase/supabase-js',
    'react',
    'react-dom',
    'vite'
  ];
  
  console.log('\n  Dependencias críticas:');
  criticalDeps.forEach(dep => {
    const existsInDeps = pkg.dependencies && pkg.dependencies[dep];
    const existsInDevDeps = pkg.devDependencies && pkg.devDependencies[dep];
    const exists = existsInDeps || existsInDevDeps;
    console.log(`    ${exists ? '✅' : '❌'} ${dep}`);
    if (!exists) hasErrors = true;
  });

} catch {
  console.log('  ❌ Error leyendo package.json');
  hasErrors = true;
}

// ============================================
// 4. Verificar build localmente
// ============================================
console.log('\n🔨 Verificando build...\n');

if (existsSync(resolve(process.cwd(), 'dist'))) {
  console.log('  ✅ Carpeta dist/ existe (build anterior encontrado)');
  console.log('     → Ejecuta "npm run build" para verificar que compile sin errores');
} else {
  console.log('  ⚠️  Carpeta dist/ no existe');
  console.log('     → Ejecuta "npm run build" antes de desplegar');
}

// ============================================
// 5. Recordatorios importantes
// ============================================
console.log('\n📝 Recordatorios para Vercel:\n');

console.log('  1. Configurar variables de entorno en Vercel Dashboard');
console.log('  2. Agregar dominio de Vercel a CORS en Supabase:');
console.log('     → Settings → Authentication → URL Configuration');
console.log('     → Agregar: https://tu-dominio.vercel.app');
console.log('  3. Verificar que RLS esté activo en todas las tablas');
console.log('  4. Edge Functions desplegadas (si usas billing/notificaciones)');

// ============================================
// 6. Recursos útiles
// ============================================
console.log('\n🔗 Recursos:\n');
console.log('  • Guía completa: DEPLOY_VERCEL.md');
console.log('  • Vercel Dashboard: https://vercel.com/dashboard');
console.log('  • Supabase Dashboard: https://supabase.com/dashboard');

// ============================================
// Resultado final
// ============================================
console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.log('\n❌ HAY ERRORES - Corrige antes de desplegar\n');
  process.exit(1);
} else {
  console.log('\n✅ TODO LISTO - Puedes desplegar en Vercel\n');
  console.log('Siguiente paso:');
  console.log('  1. git add . && git commit -m "Preparar deploy"');
  console.log('  2. git push origin main');
  console.log('  3. Importar proyecto en vercel.com/new\n');
  process.exit(0);
}
