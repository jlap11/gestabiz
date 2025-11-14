import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const seedPath = resolve(__dirname, '../catalogs/Seeds/CiudadSeed.cs');
const migrationPath = resolve(
  __dirname,
  '../supabase/migrations/20251114000007_fix_city_names_encoding.sql',
);

const raw = readFileSync(seedPath, 'utf8');
const regex = /new\s+Ciudad\s*{\s*Id\s*=\s*Guid\.Parse\("([0-9A-F-]+)"\),\s*Nombre\s*=\s*"([^"]+)"/g;
const entries = [];
let match;
while ((match = regex.exec(raw)) !== null) {
  const id = match[1].toLowerCase();
  const name = match[2]
    .replaceAll("'", "''")
    .replaceAll(/\s+/g, ' ')
    .trim();
  entries.push({ id, name });
}
if (!entries.length) {
  console.error('No entries found');
  process.exit(1);
}
const values = entries
  .map(({ id, name }) => `    ('${id}', '${name}')`)
  .join(',\n');
const sql = `WITH city_data(id, name) AS (\nVALUES\n${values}\n)\nUPDATE cities c\nSET name = cd.name\nFROM city_data cd\nWHERE c.id = cd.id;\n`;
const header = `-- =====================================================\n-- MIGRACIÓN: Corregir nombres de ciudades con tildes mal codificadas\n-- Problema: Nombres almacenados con encoding incorrecto (UTF-8 mal interpretado)\n-- Solución: Actualizar nombres usando IDs como referencia\n-- =====================================================\n-- EJECUTAR: npx supabase db push --dns-resolver https\n-- =====================================================\n\n-- Actualizar todos los nombres de ciudades con encoding correcto\n`;
const footer = `\n-- =====================================================\n-- COMENTARIOS\n-- =====================================================\nCOMMENT ON TABLE cities IS 'Tabla de ciudades - Nombres corregidos con encoding UTF-8 apropiado (2025-11-14)';\n\n-- =====================================================\n-- VERIFICACIÓN\n-- =====================================================\n-- Para verificar que los nombres se actualizaron correctamente:\nSELECT id, name FROM cities WHERE name LIKE '%�%' OR name LIKE '%Ã%' OR name LIKE '%Â%';\n-- Si retorna 0 filas, la migración fue exitosa\n`;
const outputPath = resolve(__dirname, './city_updates.sql');
writeFileSync(outputPath, sql, 'utf8');
writeFileSync(migrationPath, header + sql + footer, 'utf8');
console.log(`Wrote ${entries.length} city rows to ${outputPath}`);
console.log(`Updated migration at ${migrationPath}`);
