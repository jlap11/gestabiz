import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getFiscalPeriod(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

async function createTransactions() {
  console.log('🚀 Creando transacciones monetarias...\n');

  // 1. INGRESOS: Crear transacciones de ingresos para citas pagadas (completed)
  const { data: paidAppointments } = await supabase
    .from('appointments')
    .select('id, business_id, location_id, employee_id, start_time, price, currency, status')
    .in('status', ['completed'])
    .eq('payment_status', 'paid');

  if (!paidAppointments || paidAppointments.length === 0) {
    console.log('⚠️ No hay citas pagadas para generar ingresos');
    return;
  }

  console.log(`✅ ${paidAppointments.length} citas pagadas encontradas\n`);

  let totalIncome = 0;
  let totalExpenses = 0;

  // Crear transacciones de ingreso para cada cita pagada
  for (const apt of paidAppointments) {
    const price = Number(apt.price);
    const subtotal = price / 1.19; // Precio sin IVA 19%
    const taxAmount = price - subtotal;

    const incomeData = {
      business_id: apt.business_id,
      location_id: apt.location_id,
      type: 'income',
      category: 'appointment_payment',
      amount: price,
      currency: apt.currency || 'COP',
      description: 'Pago de cita de servicio',
      appointment_id: apt.id,
      employee_id: apt.employee_id,
      transaction_date: new Date(apt.start_time).toISOString().split('T')[0],
      payment_method: ['efectivo', 'tarjeta', 'transferencia'][randomInt(0, 2)],
      is_verified: true,
      subtotal: subtotal.toFixed(2),
      tax_type: 'iva_19',
      tax_rate: 0.19,
      tax_amount: taxAmount.toFixed(2),
      total_amount: price,
      metadata: { fiscal_period: getFiscalPeriod(new Date(apt.start_time)) }
    };

    const { error } = await supabase
      .from('transactions')
      .insert(incomeData);

    if (error) {
      console.error(`❌ Error creando ingreso:`, error.message);
      continue;
    }

    totalIncome++;
  }

  console.log(`✅ ${totalIncome} transacciones de ingreso creadas\n`);

  // 2. GASTOS: Crear gastos operacionales mensuales para cada negocio
  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, owner_id');

  if (!businesses) {
    console.log('❌ No se encontraron negocios');
    return;
  }

  console.log(`📊 Generando gastos operacionales para ${businesses.length} negocios...\n`);

  // Categorías de gastos con rangos de montos (COP)
  const expenseCategories = [
    { category: 'rent', min: 800000, max: 3000000, desc: 'Arriendo de local' },
    { category: 'utilities', min: 150000, max: 500000, desc: 'Servicios públicos (luz, agua, gas)' },
    { category: 'supplies', min: 200000, max: 1000000, desc: 'Insumos y materiales' },
    { category: 'marketing', min: 100000, max: 800000, desc: 'Publicidad y marketing' },
    { category: 'maintenance', min: 50000, max: 400000, desc: 'Mantenimiento de equipos' },
    { category: 'insurance', min: 150000, max: 600000, desc: 'Seguros' },
  ];

  // Generar gastos para los últimos 3 meses (julio, agosto, septiembre 2025)
  const months = [
    { month: 7, year: 2025, name: 'julio' },
    { month: 8, year: 2025, name: 'agosto' },
    { month: 9, year: 2025, name: 'septiembre' },
  ];

  for (const business of businesses) {
    for (const { month, year, name } of months) {
      // Cada negocio tiene 3-5 gastos por mes
      const numExpenses = randomInt(3, 5);
      const selectedCategories = expenseCategories
        .sort(() => Math.random() - 0.5)
        .slice(0, numExpenses);

      for (const expCat of selectedCategories) {
        const amount = randomInt(expCat.min, expCat.max);
        const transactionDate = new Date(year, month - 1, randomInt(1, 28));
        
        const expenseData = {
          business_id: business.id,
          location_id: null,
          type: 'expense',
          category: expCat.category,
          amount,
          currency: 'COP',
          description: expCat.desc,
          created_by: business.owner_id,
          transaction_date: transactionDate.toISOString().split('T')[0],
          payment_method: ['efectivo', 'tarjeta', 'transferencia'][randomInt(0, 2)],
          is_verified: true,
          tax_type: 'none',
          metadata: { fiscal_period: getFiscalPeriod(transactionDate) }
        };

        const { error } = await supabase
          .from('transactions')
          .insert(expenseData);

        if (error) {
          console.error(`❌ Error creando gasto:`, error.message);
          continue;
        }

        totalExpenses++;
      }
    }

    if (totalExpenses % 50 === 0) {
      console.log(`💸 ${totalExpenses} gastos creados...`);
    }
  }

  console.log(`\n✅ Total: ${totalExpenses} transacciones de gastos creadas`);

  // Resumen final
  const { data: summary } = await supabase
    .from('transactions')
    .select('type');

  if (summary) {
    const counts = summary.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Resumen de transacciones:');
    console.log(`   Ingresos: ${counts.income || 0}`);
    console.log(`   Gastos: ${counts.expense || 0}`);
    console.log(`   Total: ${(counts.income || 0) + (counts.expense || 0)}`);
  }

  // Verificar montos por tipo
  const { data: amountsByType } = await supabase
    .from('transactions')
    .select('type, amount');

  if (amountsByType) {
    const totals = amountsByType.reduce((acc, t) => {
      if (!acc[t.type]) acc[t.type] = 0;
      acc[t.type] += Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

    console.log('\n💰 Montos totales:');
    for (const [type, amount] of Object.entries(totals)) {
      console.log(`   ${type}: $${amount.toLocaleString('es-CO')} COP`);
    }
  }
}

createTransactions();
