#!/usr/bin/env node

/**
 * Script de Diagnóstico Completo para Supabase Realtime
 * 
 * Este script busca TODOS los patrones problemáticos en el código
 * que pueden causar loops infinitos o memory leaks.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 INICIANDO AUDITORÍA COMPLETA DE SUPABASE REALTIME\n');

const issues = [];

// 1. Buscar todos los .subscribe()
console.log('1️⃣ Buscando todos los .subscribe()...');
try {
  const result = execSync('git grep -n "\\.subscribe()" -- "src/**/*.ts" "src/**/*.tsx"', { encoding: 'utf8' });
  const lines = result.trim().split('\n');
  console.log(`   ✅ Encontrados ${lines.length} usos de .subscribe()`);
  lines.forEach(line => {
    const [file, lineNum] = line.split(':');
    issues.push({ type: 'subscribe', file, line: lineNum, content: line });
  });
} catch (e) {
  console.log('   ℹ️  No se encontraron .subscribe()');
}

// 2. Buscar console.log en handlers
console.log('\n2️⃣ Buscando console.log en handlers...');
try {
  const result = execSync('git grep -n "console\\.log.*payload\\|console\\.log.*channel\\|console\\.log.*Subscrib" -- "src/**/*.ts"', { encoding: 'utf8' });
  const lines = result.trim().split('\n');
  console.log(`   ⚠️  ENCONTRADOS ${lines.length} console.log problemáticos`);
  lines.forEach(line => {
    console.log(`      ${line}`);
    issues.push({ type: 'console.log', severity: 'HIGH', content: line });
  });
} catch (e) {
  console.log('   ✅ No se encontraron console.log problemáticos');
}

// 3. Buscar callbacks en dependency arrays
console.log('\n3️⃣ Buscando callbacks en dependency arrays...');
try {
  const result = execSync('git grep -n "}, \\[.*fetch.*\\]\\|}, \\[.*subscribe.*\\]" -- "src/**/*.ts" "src/**/*.tsx"', { encoding: 'utf8' });
  const lines = result.trim().split('\n');
  console.log(`   ⚠️  ENCONTRADOS ${lines.length} callbacks en deps`);
  lines.forEach(line => {
    if (!line.includes('eslint-disable-next-line')) {
      console.log(`      ${line}`);
      issues.push({ type: 'callback-in-deps', severity: 'HIGH', content: line });
    }
  });
} catch (e) {
  console.log('   ℹ️  No se encontraron callbacks en deps (o todos tienen eslint-disable)');
}

// 4. Buscar useEffect sin cleanup
console.log('\n4️⃣ Buscando useEffect que crean subscripciones sin cleanup...');
try {
  const files = execSync('find src -name "*.ts" -o -name "*.tsx"', { encoding: 'utf8' }).trim().split('\n');
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const useEffectRegex = /useEffect\(\(\) => \{[\s\S]*?\.subscribe\(\)[\s\S]*?\}, \[.*?\]\)/g;
    const matches = content.match(useEffectRegex);
    
    if (matches) {
      matches.forEach(match => {
        if (!match.includes('return () =>') && !match.includes('removeChannel')) {
          console.log(`   ⚠️  ${file}: useEffect con subscribe sin cleanup`);
          issues.push({ type: 'missing-cleanup', severity: 'CRITICAL', file, content: match.substring(0, 100) });
        }
      });
    }
  });
} catch (e) {
  console.log('   ✅ Todos los useEffect tienen cleanup');
}

// 5. Buscar canales sin nombres únicos
console.log('\n5️⃣ Buscando canales sin nombres únicos (sin timestamp)...');
try {
  const result = execSync('git grep -n "supabase\\.channel(" -- "src/**/*.ts"', { encoding: 'utf8' });
  const lines = result.trim().split('\n');
  
  lines.forEach(line => {
    if (!line.includes('Date.now()') && !line.includes('${') && !line.includes('`')) {
      console.log(`   ⚠️  ${line}`);
      issues.push({ type: 'static-channel-name', severity: 'MEDIUM', content: line });
    }
  });
  
  if (issues.filter(i => i.type === 'static-channel-name').length === 0) {
    console.log('   ✅ Todos los canales tienen nombres dinámicos');
  }
} catch (e) {
  console.log('   ℹ️  No se encontraron canales de Supabase');
}

// 6. Buscar setInterval sin clearInterval
console.log('\n6️⃣ Buscando setInterval sin clearInterval...');
try {
  const files = execSync('git grep -l "setInterval" -- "src/**/*.ts" "src/**/*.tsx"', { encoding: 'utf8' }).trim().split('\n');
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const hasSetInterval = content.includes('setInterval');
    const hasClearInterval = content.includes('clearInterval');
    
    if (hasSetInterval && !hasClearInterval) {
      console.log(`   ⚠️  ${file}: setInterval sin clearInterval`);
      issues.push({ type: 'interval-leak', severity: 'HIGH', file });
    }
  });
  
  if (issues.filter(i => i.type === 'interval-leak').length === 0) {
    console.log('   ✅ Todos los setInterval tienen clearInterval');
  }
} catch (e) {
  console.log('   ℹ️  No se encontraron setInterval');
}

// 7. Verificar que removeChannel esté en cleanup
console.log('\n7️⃣ Verificando que todos los subscribe tengan removeChannel...');
const subscribeFiles = [...new Set(issues.filter(i => i.type === 'subscribe').map(i => i.file))];

subscribeFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const subscribeCount = (content.match(/\.subscribe\(\)/g) || []).length;
  const removeChannelCount = (content.match(/removeChannel/g) || []).length;
  
  if (subscribeCount > removeChannelCount) {
    console.log(`   ⚠️  ${file}: ${subscribeCount} subscribe pero solo ${removeChannelCount} removeChannel`);
    issues.push({ type: 'missing-remove-channel', severity: 'CRITICAL', file, subscribeCount, removeChannelCount });
  }
});

// RESUMEN
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('📊 RESUMEN DE AUDITORÍA');
console.log('═══════════════════════════════════════════════════════════════\n');

const critical = issues.filter(i => i.severity === 'CRITICAL');
const high = issues.filter(i => i.severity === 'HIGH');
const medium = issues.filter(i => i.severity === 'MEDIUM');

console.log(`🔴 CRÍTICOS: ${critical.length}`);
critical.forEach(issue => {
  console.log(`   - ${issue.type}: ${issue.file || issue.content.substring(0, 80)}`);
});

console.log(`\n🟡 ALTOS: ${high.length}`);
high.forEach(issue => {
  console.log(`   - ${issue.type}: ${issue.content.substring(0, 80)}`);
});

console.log(`\n🟢 MEDIOS: ${medium.length}`);

console.log('\n═══════════════════════════════════════════════════════════════');

if (critical.length > 0 || high.length > 0) {
  console.log('❌ AUDITORÍA FALLIDA - Se encontraron problemas críticos');
  process.exit(1);
} else {
  console.log('✅ AUDITORÍA EXITOSA - No se encontraron problemas críticos');
  process.exit(0);
}
