import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDate(daysAgo: number): Date {
  const now = new Date('2025-10-19'); // Fecha actual según contexto
  const date = new Date(now);
  date.setDate(date.getDate() - randomInt(0, daysAgo));
  return date;
}

function getRandomTimeSlot(): { hour: number; minute: number } {
  // Horarios típicos: 8am-6pm
  const hour = randomInt(8, 17);
  const minute = randomInt(0, 1) * 30; // 0 o 30 minutos
  return { hour, minute };
}

async function createAppointments() {
  console.log('🚀 Creando citas históricas (últimos 90 días)...\n');

  // Obtener clientes (usuarios que NO son empleados ni owners)
  const { data: employees } = await supabase
    .from('business_employees')
    .select('employee_id');

  const { data: businesses } = await supabase
    .from('businesses')
    .select('owner_id');

  const employeeIds = new Set(employees?.map(e => e.employee_id) || []);
  const ownerIds = new Set(businesses?.map(b => b.owner_id) || []);

  const { data: allUsers } = await supabase
    .from('profiles')
    .select('id');

  const clients = allUsers?.filter(
    u => !employeeIds.has(u.id) && !ownerIds.has(u.id)
  ).slice(0, 70); // Tomar 70 clientes

  if (!clients || clients.length === 0) {
    console.error('❌ No hay clientes disponibles');
    return;
  }

  console.log(`✅ ${clients.length} clientes disponibles\n`);

  // Obtener empleados con sus servicios y ubicaciones
  const { data: employeeServices } = await supabase
    .from('employee_services')
    .select(`
      employee_id,
      service_id,
      business_id,
      location_id,
      services(id, name, duration_minutes, price, currency)
    `);

  if (!employeeServices || employeeServices.length === 0) {
    console.error('❌ No hay empleados con servicios');
    return;
  }

  console.log(`✅ ${employeeServices.length} asignaciones empleado-servicio\n`);

  let totalAppointments = 0;
  const targetAppointments = 500; // Objetivo: 500 citas
  const statusDistribution = [
    { status: 'completed', weight: 80 }, // 80%
    { status: 'cancelled', weight: 10 }, // 10%
    { status: 'no_show', weight: 10 },   // 10%
  ];

  // Distribuir citas entre clientes
  const appointmentsPerClient = Math.floor(targetAppointments / clients.length);
  const extraAppointments = targetAppointments % clients.length;

  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    const numAppointments = appointmentsPerClient + (i < extraAppointments ? 1 : 0);

    for (let j = 0; j < numAppointments; j++) {
      // Seleccionar empleado-servicio aleatorio
      const empService = employeeServices[randomInt(0, employeeServices.length - 1)];
      const service = empService.services as any;

      // Fecha aleatoria en los últimos 90 días
      const appointmentDate = getRandomDate(90);
      const { hour, minute } = getRandomTimeSlot();
      
      appointmentDate.setHours(hour, minute, 0, 0);
      const startTime = new Date(appointmentDate);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + (service.duration_minutes || 60));

      // Determinar status basado en distribución
      const rand = randomInt(1, 100);
      let status = 'completed';
      let cumulative = 0;
      for (const { status: s, weight } of statusDistribution) {
        cumulative += weight;
        if (rand <= cumulative) {
          status = s;
          break;
        }
      }

      // Payment status basado en appointment status
      let paymentStatus = 'paid';
      if (status === 'cancelled') {
        paymentStatus = randomInt(1, 100) <= 20 ? 'refunded' : 'pending';
      } else if (status === 'no_show') {
        paymentStatus = 'pending';
      }

      const appointmentData = {
        business_id: empService.business_id,
        location_id: empService.location_id,
        service_id: empService.service_id,
        client_id: client.id,
        employee_id: empService.employee_id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status,
        price: service.price,
        currency: service.currency || 'COP',
        payment_status: paymentStatus,
        reminder_sent: status !== 'no_show',
        is_location_exception: false,
        notes: status === 'completed' ? 'Cita completada satisfactoriamente' : null,
        cancelled_at: status === 'cancelled' ? startTime.toISOString() : null,
        cancel_reason: status === 'cancelled' ? 'Cliente canceló con anticipación' : null,
      };

      const { error } = await supabase
        .from('appointments')
        .insert(appointmentData);

      if (error) {
        console.error(`❌ Error creando cita:`, error.message);
        continue;
      }

      totalAppointments++;

      if (totalAppointments % 50 === 0) {
        console.log(`📅 ${totalAppointments} citas creadas...`);
      }
    }
  }

  console.log(`\n✅ Total: ${totalAppointments} citas creadas`);

  // Verificación por status
  const { data: statusCounts } = await supabase
    .from('appointments')
    .select('status');

  if (statusCounts) {
    const counts = statusCounts.reduce((acc, apt) => {
      acc[apt.status] = (acc[apt.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Distribución por status:');
    Object.entries(counts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} (${((count / totalAppointments) * 100).toFixed(1)}%)`);
    });
  }

  // Verificación por mes
  const { data: monthCounts } = await supabase
    .from('appointments')
    .select('start_time');

  if (monthCounts) {
    const months = monthCounts.reduce((acc, apt) => {
      const month = new Date(apt.start_time).toLocaleDateString('es-CO', { year: 'numeric', month: 'long' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n📊 Distribución por mes:');
    Object.entries(months).forEach(([month, count]) => {
      console.log(`   ${month}: ${count} citas`);
    });
  }
}

createAppointments();
