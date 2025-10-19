// 🧪 Script de Prueba - Zona Horaria Colombia
// Copia y pega este código en la Consola del navegador (F12)

console.log('🧪 === PRUEBA DE ZONA HORARIA COLOMBIA ===\n');

const now = new Date();
const COLOMBIA_UTC_OFFSET = -5;

console.log('📅 Hora Actual:');
console.log('  Sistema (UTC):', now.toISOString());
console.log('  Sistema (local):', now.toString());

// Método 1: toLocaleString
try {
  const colombiaString = now.toLocaleString('en-US', { 
    timeZone: 'America/Bogota', 
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  console.log('\n🌍 Método 1 - toLocaleString:');
  console.log('  Colombia:', colombiaString);
  
  const [datePart, timePart] = colombiaString.split(', ');
  const [month, day, year] = datePart.split('/');
  const [hour, minute, second] = timePart.split(':');
  
  console.log('  Parseado:');
  console.log('    Año:', year);
  console.log('    Mes:', month);
  console.log('    Día:', day);
  console.log('    Hora:', hour);
  console.log('    Minuto:', minute);
  console.log('    Segundo:', second);
  
  const colombiaHour = parseInt(hour, 10);
  const colombiaMinute = parseInt(minute, 10);
  const percentage = ((colombiaHour * 60 + colombiaMinute) / (24 * 60)) * 100;
  
  console.log('  Cálculos:');
  console.log('    Minutos desde medianoche:', colombiaHour * 60 + colombiaMinute);
  console.log('    Porcentaje del día:', percentage.toFixed(2) + '%');
  console.log('    ✅ Método FUNCIONA');
} catch (error) {
  console.error('  ❌ toLocaleString falló:', error);
}

// Método 2: Offset manual
console.log('\n🔧 Método 2 - Offset Manual:');
const utcTime = now.getTime();
const colombiaTime = new Date(utcTime + (COLOMBIA_UTC_OFFSET * 60 * 60 * 1000));

console.log('  Colombia (UTC):', colombiaTime.toISOString());
console.log('  Parseado:');
console.log('    Año:', colombiaTime.getUTCFullYear());
console.log('    Mes:', colombiaTime.getUTCMonth() + 1);
console.log('    Día:', colombiaTime.getUTCDate());
console.log('    Hora:', colombiaTime.getUTCHours());
console.log('    Minuto:', colombiaTime.getUTCMinutes());

const hour2 = colombiaTime.getUTCHours();
const minute2 = colombiaTime.getUTCMinutes();
const percentage2 = ((hour2 * 60 + minute2) / (24 * 60)) * 100;

console.log('  Cálculos:');
console.log('    Minutos desde medianoche:', hour2 * 60 + minute2);
console.log('    Porcentaje del día:', percentage2.toFixed(2) + '%');
console.log('    ✅ Método FUNCIONA');

// Comparación
console.log('\n📊 Comparación de Métodos:');
console.log('  Tu hora actual debería ser:', 
  new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hour12: false })
);
console.log('  Método 1 dio:', hour + ':' + minute);
console.log('  Método 2 dio:', colombiaTime.getUTCHours() + ':' + colombiaTime.getUTCMinutes());

console.log('\n✅ Si ambos métodos coinciden con tu hora local, la conversión funciona correctamente.');
console.log('❌ Si alguno está mal, hay un problema con ese método en tu navegador.');
