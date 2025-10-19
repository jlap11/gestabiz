import { createClient } from '@supabase/supabase-js';
import * as fs from 'node:fs';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data } = await supabase
  .from('profiles')
  .select('id, email, full_name, phone')
  .order('created_at');

if (!data) {
  console.error('❌ No se pudieron obtener los usuarios');
  process.exit(1);
}

const csv = [
  'email,password,full_name,phone,user_id',
  ...data.map(u => `${u.email},Demo2025!,"${u.full_name}",${u.phone || 'N/A'},${u.id}`)
].join('\n');

fs.writeFileSync('generated-data/2-todos-usuarios-100.csv', csv, 'utf-8');

console.log('✅ CSV generado: generated-data/2-todos-usuarios-100.csv');
console.log(`📊 Total: ${data.length} usuarios`);
