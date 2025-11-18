# 📅 Gestabiz

Sistema integral de gestión de citas y negocios con roles dinámicos, sistema de pagos, notificaciones multicanal y búsqueda avanzada.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/react-18.3.1-61dafb)
![Supabase](https://img.shields.io/badge/supabase-2.48.1-3ecf8e)
![TypeScript](https://img.shields.io/badge/typescript-5.7.2-3178c6)

---

## 🚀 Características Principales

### 👥 Sistema de Roles Dinámicos
- **ADMIN**: Gestión completa del negocio
- **EMPLOYEE**: Gestión de citas, servicios y horarios
- **CLIENT**: Reserva de citas y reviews
- Un usuario puede tener múltiples roles simultáneamente

### 💳 Sistema de Pagos Completo
- Integración con **Stripe**
- 4 planes de suscripción (Free, Basic, Pro, Enterprise)
- Facturación mensual y anual con descuentos
- Stripe Elements para captura PCI-compliant
- Webhooks para sincronización automática

### 📊 Sistema Contable Colombiano
- Cálculo automático de IVA, ICA y Retención en la Fuente
- Reportes fiscales y contables
- Transacciones con clasificación fiscal
- Exports a PDF/CSV/Excel

### 🔔 Notificaciones Multicanal
- **Email**: Brevo (Sendinblue) - 300 emails/día gratis
- **SMS**: AWS SNS (opcional)
- **WhatsApp**: WhatsApp Business API
- Recordatorios automáticos configurables
- 17 tipos de notificaciones

### 🔍 Búsqueda Avanzada
- Full-text search con PostgreSQL
- Búsqueda fuzzy con trigram
- 6 algoritmos de ordenamiento
- Geolocalización y filtros por categoría
- Optimización con vistas materializadas

### ⭐ Sistema de Reviews Anónimas
- Reviews por servicio y profesional
- Validación: solo clientes con citas completadas
- Respuestas del negocio
- Distribución de ratings y estadísticas

### 🌍 Sistema i18n Modular ⭐ NUEVO (Nov 2025)
- **2 idiomas**: Español (default), Inglés
- **69 módulos** de traducción organizados en 16 archivos
- **Type-safe**: Auto-completado con TypeScript
- **Escalable**: Arquitectura modular fácil de mantener
- **~2,200 claves** de traducción
- Ver: `src/locales/README.md` para documentación completa

### 🏢 Gestión de Negocios
- Múltiples sedes por negocio
- Servicios por empleado y sede
- Sistema jerárquico de categorías (15 principales, ~60 subcategorías)
- Horarios configurables por día
- Logo y banner personalizables

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 18.3.1** + **TypeScript 5.7.2**
- **Vite 6.3.5** (build tool)
- **Tailwind CSS 4.1.11** (estilos)
- **Radix UI** (componentes accesibles)
- **React Query** (data fetching)
- **Zustand** (state management)

### Backend
- **Supabase** (PostgreSQL + Auth + Storage + Edge Functions)
- **Row Level Security (RLS)** para seguridad
- **Edge Functions** (Deno) para lógica serverless
- **PostgreSQL 15+** con extensiones:
  - `pg_trgm` (búsqueda fuzzy)
  - `postgis` (geolocalización)
  - `uuid-ossp` (UUIDs)

### Integraciones
- **Stripe** (pagos y suscripciones)
- **Brevo** (emails transaccionales - 300/día gratis)
- **AWS SNS** (SMS - opcional)
- **WhatsApp Business API** (mensajes)
- **Google Calendar API** (sincronización de calendarios)

---

## 📦 Instalación y Configuración

### Pre-requisitos
- Node.js 18+ y npm 9+
- Cuenta en [Supabase](https://supabase.com)
- (Opcional) Cuentas en Stripe, AWS, WhatsApp Business API

### 1. Clonar Repositorio
```bash
git clone https://github.com/TI-Turing/Gestabiz.git
cd Gestabiz
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno

Copia `.env.example` a `.env` y configura:

```bash
# Supabase (REQUERIDO)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key

# App
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=Gestabiz

# Stripe (opcional, para sistema de pagos)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_tu-key

# Google Calendar (opcional)
VITE_GOOGLE_CLIENT_ID=tu-client-id
```

### 4. Configurar Base de Datos

```bash
# Instalar Supabase CLI
npm install -g supabase

# Aplicar migraciones
npx supabase db push

# (Opcional) Cargar datos de ejemplo
npx supabase db seed
```

### 5. Ejecutar en Desarrollo

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

---

## 🚀 Deploy en Producción

### Opción 1: Vercel (Recomendado)

**Guía rápida** (5 minutos):
- Ver **[VERCEL_QUICK_START.md](./VERCEL_QUICK_START.md)**

**Guía completa** (troubleshooting, dominios, etc.):
- Ver **[DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)**

**Tu configuración personalizada**:
- Ver **[CONFIGURACION_VERCEL_PERSONALIZADA.md](./CONFIGURACION_VERCEL_PERSONALIZADA.md)**

### Opción 2: Otros Proveedores

La app es una SPA estándar de Vite, compatible con:
- **Netlify**
- **Cloudflare Pages**
- **AWS Amplify**
- **Firebase Hosting**

Configuración:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18+

---

## 📱 App Móvil (Expo)

La versión móvil está en `src/mobile/`:

```bash
cd src/mobile
npm install
npm start
```

Ver `src/mobile/README.md` para instrucciones de build con EAS.

---

## 🧪 Testing

```bash
# Ejecutar tests unitarios
npm run test

# Tests en modo watch
npm run test:watch

# Coverage
npm run test -- --coverage

# Type checking
npm run type-check

# Linting
npm run lint
```

---

## 📚 Documentación

### Guías de Usuario
- **Sistema de Roles**: `DYNAMIC_ROLES_SYSTEM.md`
- **Sistema de Pagos**: `SISTEMA_PAGOS_RESUMEN_FINAL.md`
- **Sistema de Notificaciones**: `SISTEMA_NOTIFICACIONES_COMPLETO.md`
- **Sistema de Reviews**: `SISTEMA_REVIEWS_COMPLETADO.md`
- **Sistema Contable**: `SISTEMA_CONTABLE_FASE_4_COMPLETADA.md`

### Guías Técnicas
- **Integración Supabase**: `SUPABASE_INTEGRATION_GUIDE.md`
- **Optimización de Búsqueda**: `OPTIMIZACION_BUSQUEDA_COMPLETADO.md`
- **Base de Datos**: `DATABASE_REDESIGN_ANALYSIS.md`
- **Categorías**: `SISTEMA_CATEGORIAS_RESUMEN.md`

### Desarrollo
- **Copilot Instructions**: `.github/copilot-instructions.md`

---

## 🏗️ Estructura del Proyecto

```
Gestabiz/
├── src/
│   ├── components/      # Componentes React
│   │   ├── admin/       # Dashboard admin
│   │   ├── employee/    # Dashboard empleado
│   │   ├── client/      # Dashboard cliente
│   │   ├── billing/     # Sistema de pagos
│   │   ├── accounting/  # Sistema contable
│   │   └── ui/          # Componentes UI reutilizables
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utilidades y servicios
│   ├── contexts/        # Context providers
│   ├── types/           # TypeScript types
│   └── mobile/          # App móvil (Expo)
├── supabase/
│   ├── functions/       # Edge Functions
│   ├── migrations/      # Migraciones SQL
│   └── seed/            # Datos de ejemplo
├── scripts/             # Scripts de automatización
├── docs/                # Documentación adicional
└── tests/               # Tests unitarios e integración
```

---

## 🔐 Seguridad

### Row Level Security (RLS)
Todas las tablas tienen políticas RLS activas:
- Solo admins ven datos de su negocio
- Empleados solo ven sus asignaciones
- Clientes solo ven sus propias citas

### Variables de Entorno
- ✅ `VITE_SUPABASE_ANON_KEY`: Segura para exponer (protegida por RLS)
- ❌ `VITE_SUPABASE_SERVICE_ROLE_KEY`: NUNCA en frontend
- ❌ API keys privadas: Solo en Edge Functions

### HTTPS
- Supabase: HTTPS automático
- Vercel: Certificados SSL gratuitos

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama: `git checkout -b feature/nueva-feature`
3. Commit cambios: `git commit -m 'Agregar nueva feature'`
4. Push a la rama: `git push origin feature/nueva-feature`
5. Abre un Pull Request

### Convenciones de Código
- **TypeScript**: Tipos explícitos siempre
- **React**: Componentes funcionales con hooks
- **Estilos**: Tailwind CSS con utility classes
- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, etc.)

---

## 📝 Changelog

### v1.1.0 (Noviembre 2025) ⭐ NUEVO
- ✅ **Sistema i18n Modular**: Reemplazo de traducciones monolíticas por arquitectura modular
  - 69 módulos de traducción en 16 archivos consolidados
  - Soporte completo para Español e Inglés
  - Type-safe con auto-completado TypeScript
  - ~2,200 claves de traducción migradas
  - Backward compatible (merge strategy)
  - Ver: `src/locales/README.md` para documentación

### v1.0.0 (Octubre 2025)
- ✅ Sistema de roles dinámicos
- ✅ Sistema de pagos con Stripe
- ✅ Sistema contable colombiano
- ✅ Notificaciones multicanal (Email/SMS/WhatsApp)
- ✅ Búsqueda avanzada con optimizaciones
- ✅ Sistema de reviews anónimas
- ✅ Gestión de negocios con múltiples sedes
- ✅ Sistema jerárquico de categorías
- ✅ Sincronización con Google Calendar

---

## 📄 Licencia

MIT License - Ver [LICENSE](./LICENSE) para más detalles.

---

## 👨‍💻 Autor

**Jose Luis Avila**
- Email: jlap.11@hotmail.com
- GitHub: [@jlap11](https://github.com/jlap11)
- Organización: [TI-Turing](https://github.com/TI-Turing)

---

## 🙏 Agradecimientos

- [Supabase](https://supabase.com) por el backend as a service
- [Vercel](https://vercel.com) por el hosting
- [Stripe](https://stripe.com) por el sistema de pagos
- [Shadcn/ui](https://ui.shadcn.com) por los componentes base
- Comunidad open source

---

## 📞 Soporte

- **Issues**: [GitHub Issues](https://github.com/TI-Turing/Gestabiz/issues)
- **Documentación**: Ver carpeta `/docs`
- **Email**: jlap.11@hotmail.com

---

**⭐ Si te gusta el proyecto, dale una estrella en GitHub!**
