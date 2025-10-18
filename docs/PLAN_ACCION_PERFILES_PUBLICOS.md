# 🚀 Plan de Acción para Perfiles Públicos de Negocios

**Fecha**: 17 de Octubre de 2025  
**Objetivo**: Implementar vistas públicas indexables de perfiles de negocio con redirección a flujo de reserva.

---

## 1. Resumen Estratégico

- **Meta**: Permitir acceso público a la ficha completa de un negocio (similar a Facebook/Google Business), optimizada para SEO y con botón de conversión "Reservar ahora".
- **Beneficios**: Tráfico orgánico, reputación pública, embudo directo a reservas, soporte para campañas de marketing.
- **Supuestos**: Negocios cuentan con datos completos (logo, banner, servicios, sedes, horarios) y reviews activas.

---

## 2. Fases y Entregables

| Fase | Objetivo | Entregables | Responsables sugeridos |
|------|----------|-------------|-------------------------|
| **Fase 0 — Preparación** | Alinear requerimientos legales y de SEO | Checklist SEO, decisión de slug, conformidad legal | Producto + Legal + Marketing |
| **Fase 1 — Fundamentos** | Habilitar infraestructura de rutas y SEO | React Router, `slug` en tabla `businesses`, actualización de seed/migración | Frontend + DB |
| **Fase 2 — Vista Pública** | Construir `PublicBusinessProfile` reutilizando componentes | Nueva página responsive, meta tags dinámicas, botonera CTA | Frontend |
| **Fase 3 — Flujo de Autenticación** | Redirecciones inteligentes post-login | Deep-linking login/register, persistencia de destino | Frontend |
| **Fase 4 — Indexación y SEO** | Asegurar discoverability | Sitemap XML, robots.txt, JSON-LD, pruebas Google Search Console | Frontend + DevOps |
| **Fase 5 — QA & Lanzamiento** | Validar experiencia y performance | Suite de pruebas, checklist accesibilidad, métricas Web Vitals | QA + DevOps |

---

## 3. Detalle de Tareas Técnicas

### 3.1 Fase 1 — Fundamentos

1. **Dependencias**
   - Instalar `react-router-dom` (v6) y `react-helmet-async` para meta tags.
   - Actualizar configuraciones de lint/test si es necesario.

2. **Migración DB (Supabase)**
   - Añadir columnas a `businesses`:
     - `slug TEXT UNIQUE NOT NULL`
     - `meta_title TEXT`
     - `meta_description TEXT`
     - `meta_keywords TEXT[]`
     - `og_image_url TEXT`
   - Populación inicial: generar slug `slugify(name + city)` para negocios existentes.
   - Crear índice `CREATE UNIQUE INDEX idx_businesses_slug ON businesses(slug);`

3. **Cliente Supabase**
   - Actualizar tipos (`src/types/types.ts`) con campos nuevos.
   - Asegurar que `useSupabaseData` y queries incluyan `slug`.

4. **Routing**
   - Integrar React Router en `main.tsx`/`App.tsx`:
     - `/` → LandingPage
     - `/login`, `/register` → AuthScreen (opcional unificar)
     - `/negocio/:slug` → `PublicBusinessProfile`
     - `/app/*` → contenido autenticado existente (render condicional actual dentro de ruta protegida).

### 3.2 Fase 2 — Vista Pública

1. **Nuevo layout** `src/pages/PublicBusinessProfile.tsx`:
   - Importar `BusinessProfile` y reutilizar lógica (extraer hooks a `useBusinessProfileData`).
   - Diseñar layout full-page con hero banner, secciones ancladas (Servicios, Sedes, Reseñas, Información).
   - CTA "Reservar ahora" sticky + botón secundario "Contactar" (teléfono/email).

2. **SEO/Meta Tags**
   - Usar `Helmet` para setear `<title>`, `<meta description>`, `<meta property="og:*">`, `<meta name="twitter:*">`.
   - Generar JSON-LD dinámico según categoría (`schema.org/LocalBusiness` variantes: `Dentist`, `BeautySalon`, etc.).

3. **Componentes Compartidos**
   - Extraer sección de reseñas y servicios a componentes para reuso entre modal y página.
   - Asegurar compatibilidad mobile-first.

4. **Fallbacks**
   - Si negocio no existe / is_active=false → Página 404 pública amigable.
   - Loading skeletons antes de cargar datos.

### 3.3 Fase 3 — Flujo de Autenticación

1. **CTA "Reservar ahora"**
   - Si usuario no autenticado: `navigate('/login?redirect=/negocio/${slug}')`.
   - Si autenticado: abrir `AppointmentWizard` con contexto negocio preseleccionado.

2. **AuthScreen**
   - Leer `redirect` de query string; tras login/registro exitoso → `navigate(redirect || '/app')`.
   - Persistir `redirect` en localStorage por seguridad (fallback).

3. **Role Switching**
   - Al volver del login, forzar rol `client` y preseleccionar negocio para agendar.
   - `usePendingNavigation` puede recibir intención (per Business).

### 3.4 Fase 4 — Indexación y SEO

1. **Sitemap**
   - Generar `public/sitemap.xml` en build a partir de lista de negocios activos (`supabase rpc`).
   - Automatizar via script `npm run generate:sitemap`.

2. **robots.txt**
   - Permitir `/negocio/*`, bloquear `/app/*`.

3. **Open Graph Image**
   - Servicio de generación dinámica (`/api/og-image/:slug` con Edge Function) o fallback a banner.

4. **Search Console**
   - Registrar dominio y solicitar indexación de ejemplos.

### 3.5 Fase 5 — QA & Lanzamiento

1. **Testing**
   - Pruebas unitarias para `useBusinessProfileData` (Supabase mock).
   - Pruebas E2E (Playwright/Vitest) para flujo público → login → reserva.

2. **Performance**
   - Lighthouse mínimo 90+ en móviles.
   - Carga diferida para fotos grandes (lazy-loading, `srcset`).

3. **Accesibilidad**
   - Roles ARIA, navegación teclado, contraste.

4. **Monitoreo**
   - Añadir tracking (Google Analytics/Matomo) para medir visitas y conversiones.

---

## 4. Riesgos y Mitigaciones

| Riesgo | Impacto | Probabilidad | Mitigación |
|--------|---------|--------------|------------|
| Renderizado SEO insuficiente | Alto | Medio | Implementar pre-rendering (`react-snap`) o SSR parcial. |
| Slugs duplicados | Alto | Bajo | Validación backend + fallback con sufijo numérico. |
| Lentas consultas en página pública | Medio | Medio | Crear vista materializada `public_business_profiles` con datos agregados. |
| Datos sensibles expuestos públicamente | Alto | Bajo | Revisar campos antes de exponer; permitir opt-out por negocio. |
| Caída en reservas por cambios UX | Medio | Bajo | Probar A/B con usuarios existentes antes del release. |

---

## 5. KPIs Objetivo

- **Visitas orgánicas**: +30% en 60 días.
- **CTR botón "Reservar ahora"**: ≥ 8% en sesiones públicas.
- **Tasa de conversión (login → reserva)**: ≥ 25%.
- **Tiempo de carga (Largest Contentful Paint)**: < 2.5s en móvil.

---

## 6. Checklist de Lanzamiento

- [ ] Migraciones aplicadas en Supabase (`npx supabase db push`).
- [ ] React Router operativo y rutas protegidas verificadas.
- [ ] Página pública responsive probada en dispositivos clave.
- [ ] Meta tags validadas con herramientas (Open Graph Debugger, Twitter Card Validator).
- [ ] JSON-LD validado con `https://search.google.com/test/rich-results`.
- [ ] Sitemap enviado a Google Search Console.
- [ ] Monitoreo (Analytics/Amplitude) configurado.
- [ ] Plan de comunicación con negocios para opt-out si requerido.

---

## 7. Roadmap Futuro (Opcional)

1. **Widgets embebibles**: Código iframe para insertar perfil en webs externas.
2. **URLs personalizadas**: Subdominios `negocio.gestabiz.com` gestionados por CNAME.
3. **Reservas sin login**: Flujo express capturando datos básicos (requiere cambios mayores).
4. **Reseñas públicas con respuesta rápida**: Botón "Responder" directo desde perfil (admin autenticado).
5. **SEO avanzado**: Integración con `hreflang` para multi-idioma y AMP stories.

---

**Nota**: Coordinar con marketing para definir copy, palabras clave y guidelines de marca antes del release público.
