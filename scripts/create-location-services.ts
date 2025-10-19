import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createLocationServices() {
  console.log('🚀 Vinculando servicios con ubicaciones...\n');

  // Obtener todos los negocios
  const { data: businesses, error: bizError } = await supabase
    .from('businesses')
    .select('id, name');

  if (bizError || !businesses) {
    console.error('❌ Error obteniendo negocios:', bizError?.message);
    return;
  }

  console.log(`✅ ${businesses.length} negocios encontrados\n`);

  let totalAssignments = 0;

  for (const business of businesses) {
    // Obtener ubicaciones del negocio
    const { data: locations } = await supabase
      .from('locations')
      .select('id, name')
      .eq('business_id', business.id);

    if (!locations || locations.length === 0) continue;

    // Obtener servicios del negocio
    const { data: services } = await supabase
      .from('services')
      .select('id, name')
      .eq('business_id', business.id);

    if (!services || services.length === 0) continue;

    console.log(`📍 ${business.name}:`);
    console.log(`   ${locations.length} ubicaciones, ${services.length} servicios`);

    // Vincular TODOS los servicios con TODAS las ubicaciones del negocio
    for (const location of locations) {
      for (const service of services) {
        const { error } = await supabase
          .from('location_services')
          .insert({
            location_id: location.id,
            service_id: service.id,
            is_active: true,
          });

        if (error) {
          console.error(`   ❌ Error vinculando ${service.name} con ${location.name}:`, error.message);
        } else {
          totalAssignments++;
        }
      }
    }

    console.log(`   ✓ ${locations.length * services.length} vinculaciones creadas\n`);
  }

  console.log(`✅ Total: ${totalAssignments} vinculaciones de servicios-ubicaciones creadas`);

  // Verificación
  const { data: verification } = await supabase
    .from('location_services')
    .select('id', { count: 'exact', head: true });

  console.log(`📊 Verificación: ${verification ? 'OK' : 'ERROR'}`);
}

createLocationServices();
