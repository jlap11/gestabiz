/**
 * Script para generar sitemap.xml dinámicamente con todos los perfiles públicos
 *
 * Ejecutar: npm run generate-sitemap
 *
 * Genera sitemap.xml en public/ con URLs de:
 * - Landing page
 * - Todos los perfiles públicos de negocios (is_public = true)
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { config } from 'dotenv'

// Cargar variables de entorno desde .env.local
config({ path: path.resolve(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''
const SITE_URL = process.env.VITE_SITE_URL || 'https://appointsync.pro'

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY son requeridas')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function generateSitemap() {
  console.log('🚀 Generando sitemap.xml...')

  try {
    // Fetch todos los negocios públicos
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('slug, updated_at')
      .eq('is_public', true)
      .not('slug', 'is', null)
      .order('updated_at', { ascending: false })

    if (error) {
      throw new Error(`Error fetching businesses: ${error.message}`)
    }

    if (!businesses || businesses.length === 0) {
      console.warn('⚠️  No se encontraron negocios públicos')
      return
    }

    console.log(`✅ Encontrados ${businesses.length} negocios públicos`)

    // Generar XML
    const today = new Date().toISOString().split('T')[0]

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

    // Landing Page
    xml += '  <url>\n'
    xml += `    <loc>${SITE_URL}/</loc>\n`
    xml += `    <lastmod>${today}</lastmod>\n`
    xml += '    <changefreq>weekly</changefreq>\n'
    xml += '    <priority>1.0</priority>\n'
    xml += '  </url>\n'

    // Perfiles de negocios
    for (const business of businesses) {
      const lastmod = business.updated_at
        ? new Date(business.updated_at).toISOString().split('T')[0]
        : today

      xml += '  <url>\n'
      xml += `    <loc>${SITE_URL}/negocio/${business.slug}</loc>\n`
      xml += `    <lastmod>${lastmod}</lastmod>\n`
      xml += '    <changefreq>weekly</changefreq>\n'
      xml += '    <priority>0.8</priority>\n'
      xml += '  </url>\n'
    }

    xml += '</urlset>\n'

    // Escribir archivo
    const publicDir = path.join(process.cwd(), 'public')
    const sitemapPath = path.join(publicDir, 'sitemap.xml')

    fs.writeFileSync(sitemapPath, xml, 'utf-8')

    console.log(`✅ Sitemap generado exitosamente: ${sitemapPath}`)
    console.log(`📊 Total URLs: ${businesses.length + 1}`)
    console.log(`🌐 Ver en: ${SITE_URL}/sitemap.xml`)
  } catch (error) {
    console.error('❌ Error generando sitemap:', error)
    process.exit(1)
  }
}

// Execute with top-level await
await generateSitemap()
