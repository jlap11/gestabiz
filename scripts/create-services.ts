/**
 * Script para crear servicios coherentes por categoría de negocio
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Servicios por categoría
const SERVICES_BY_CATEGORY: Record<string, string[]> = {
  'beauty': [
    'Corte de cabello',
    'Tinte profesional',
    'Manicure',
    'Pedicure',
    'Maquillaje profesional',
    'Depilación láser',
    'Tratamiento facial',
    'Mascarilla hidratante'
  ],
  'health': [
    'Consulta general',
    'Terapia física',
    'Masaje terapéutico',
    'Consulta nutricional',
    'Evaluación médica',
    'Acupuntura',
    'Rehabilitación'
  ],
  'fitness': [
    'Clase de yoga',
    'Entrenamiento personalizado',
    'Clase de spinning',
    'CrossFit',
    'Pilates',
    'Zumba',
    'Evaluación física'
  ],
  'education': [
    'Clase de inglés',
    'Clase de matemáticas',
    'Tutoría personalizada',
    'Clase de programación',
    'Curso de Excel',
    'Clase de idiomas'
  ],
  'professional': [
    'Consulta legal',
    'Asesoría contable',
    'Diseño arquitectónico',
    'Auditoría',
    'Consultoría empresarial',
    'Revisión de documentos'
  ],
  'consulting': [
    'Consultoría estratégica',
    'Análisis financiero',
    'Plan de negocios',
    'Asesoría de marketing',
    'Coaching empresarial'
  ],
  'food': [
    'Menú ejecutivo',
    'Catering eventos',
    'Chef a domicilio',
    'Desayuno empresarial',
    'Buffet',
    'Menú vegetariano'
  ],
  'maintenance': [
    'Reparación general',
    'Mantenimiento preventivo',
    'Instalación',
    'Diagnóstico técnico',
    'Servicio express'
  ]
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function createServices() {
  console.log('🚀 Creando servicios por negocio...\n');

  const { data: businesses, error: bizError } = await supabase
    .from('businesses')
    .select('id, name, category')
    .order('created_at');

  if (bizError || !businesses) {
    console.error('❌ Error:', bizError);
    return;
  }

  console.log(`✅ ${businesses.length} negocios encontrados\n`);

  let totalServices = 0;

  for (const business of businesses) {
    const serviceList = SERVICES_BY_CATEGORY[business.category] || [];
    
    if (serviceList.length === 0) {
      console.log(`⚠️  ${business.name}: Sin servicios definidos para categoría ${business.category}`);
      continue;
    }

    const numServices = Math.min(randomInt(5, 8), serviceList.length);
    const selectedServices = serviceList
      .sort(() => Math.random() - 0.5)
      .slice(0, numServices);

    console.log(`📦 ${business.name}: ${selectedServices.length} servicios`);

    for (const serviceName of selectedServices) {
      const duration = randomInt(3, 12) * 15; // 45-180 min
      const price = randomInt(30, 200) * 1000; // 30k-200k COP
      const description = `${serviceName} profesional de alta calidad`;

      try {
        const { error } = await supabase
          .from('services')
          .insert({
            business_id: business.id,
            name: serviceName,
            description,
            duration_minutes: duration,
            price,
            currency: 'COP',
            category: business.category,
            is_active: true,
            is_taxable: true,
          });

        if (error) {
          console.error(`   ❌ Error:`, error.message);
          continue;
        }

        totalServices++;
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(`   ❌ Error:`, error.message);
        }
      }
    }
  }

  console.log(`\n✅ Total: ${totalServices} servicios creados`);
  
  const { count } = await supabase
    .from('services')
    .select('*', { count: 'exact', head: true });
  
  console.log(`📊 Verificación: ${count} servicios en la base de datos`);
}

await createServices();
