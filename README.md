# AppointmentPro - Sistema Completo de Gestión de Citas

![AppointmentPro Logo](https://via.placeholder.com/200x80/667eea/ffffff?text=AppointmentPro)

**AppointmentPro** es una solución completa de gestión de citas que incluye aplicación web, móvil y extensión de navegador, todo sincronizado en tiempo real con Supabase.

## 🌟 Características Principales

### 📱 **Aplicación Móvil (React Native/Expo)**
- ✅ Autenticación con email, Google y Apple
- ✅ Gestión completa de citas
- ✅ Notificaciones push automáticas
- ✅ Sincronización en tiempo real
- ✅ Modo offline básico
- ✅ UI moderna y responsive

### 💻 **Aplicación Web (React/Vite)**
- ✅ Dashboard completo con estadísticas
- ✅ Calendario interactivo
- ✅ Gestión de clientes
- ✅ Configuración de notificaciones
- ✅ Filtros avanzados
- ✅ Exportación de datos
- ✅ Tema oscuro automático

### 🔌 **Extensión de Navegador (Chrome/Edge)**
- ✅ Vista rápida de próximas 3 citas
- ✅ Acceso directo a la aplicación web
- ✅ Notificaciones del navegador
- ✅ Sincronización automática
- ✅ Badge con contador de citas

### ⚡ **Backend (Supabase)**
- ✅ Base de datos PostgreSQL
- ✅ Autenticación completa
- ✅ Edge Functions para notificaciones
- ✅ Suscripciones en tiempo real
- ✅ Row Level Security (RLS)
- ✅ Cron jobs automáticos

---

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+
- npm o yarn
- Cuenta en Supabase
- Expo CLI (para móvil)

### 1. Configuración del Backend

```bash
# 1. Crear proyecto en Supabase
# Ir a https://supabase.com y crear nuevo proyecto

# 2. Ejecutar schema de base de datos
# Copiar y pegar el contenido de src/database/schema.sql en SQL Editor

# 3. Configurar variables de entorno para Edge Functions
# Ver src/docs/deployment-guide.md para detalles completos
```

### 2. Aplicación Web

```bash
# Clonar e instalar
git clone <repository-url>
cd appointmentpro-web
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# Desarrollar
npm run dev

# Build para producción
npm run build
```

### 3. Aplicación Móvil

```bash
# Crear proyecto Expo
npx create-expo-app AppointmentProMobile --template

# Copiar archivos móviles
cp -r src/mobile/* AppointmentProMobile/

# Instalar dependencias
cd AppointmentProMobile
npm install

# Desarrollar
npx expo start
```

### 4. Extensión del Navegador

```bash
# Los archivos están en src/browser-extension/
# Actualizar URLs en manifest.json y background.js

# Cargar en Chrome:
# 1. Ir a chrome://extensions/
# 2. Activar "Developer mode"
# 3. Clic en "Load unpacked"
# 4. Seleccionar carpeta src/browser-extension/
```

---

## 📁 Estructura del Proyecto

```
src/
├── 📱 mobile/                    # App React Native/Expo
│   ├── App.js
│   ├── screens/
│   ├── components/
│   └── lib/
├── 💻 components/                # App Web (React)
│   ├── auth/
│   ├── dashboard/
│   └── ui/
├── 🔌 browser-extension/         # Extensión del navegador
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   └── background.js
├── ⚡ supabase/                  # Backend
│   ├── functions/               # Edge Functions
│   └── config.toml
├── 🗄️ database/                  # Esquemas de BD
│   └── schema.sql
├── 📚 docs/                      # Documentación
│   └── deployment-guide.md
└── 🛠️ lib/                       # Utilidades compartidas
    ├── supabase.ts
    ├── utils.ts
    └── types.ts
```

---

## 🎯 Funcionalidades Detalladas

### Gestión de Citas
- **Crear**: Formulario completo con cliente, fecha, hora, ubicación
- **Editar**: Modificación de todos los campos
- **Cancelar**: Con razón y notificación automática
- **Estados**: Programada, Completada, Cancelada, No Show

### Sistema de Notificaciones
- **Email**: Recordatorios 24h y 1h antes
- **Push**: Notificaciones móviles
- **Browser**: Alertas en extensión
- **Configurable**: Horarios y tipos personalizables

### Sincronización
- **Tiempo Real**: Cambios instantáneos entre dispositivos
- **Offline**: Funcionalidad básica sin conexión
- **Resolución de Conflictos**: Automática con timestamp

### Estadísticas y Reportes
- **Dashboard**: Métricas clave visuales
- **Filtros**: Por fecha, cliente, estado
- **Exportación**: CSV, PDF (futura función)
- **Tendencias**: Gráficos de uso

---

## 🔧 Configuración Avanzada

### Variables de Entorno

#### Aplicación Web (.env.local)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_NAME=AppointmentPro
VITE_APP_URL=https://your-domain.com
```

#### Supabase Edge Functions
```bash
SENDGRID_API_KEY=your-sendgrid-key
FROM_EMAIL=noreply@your-domain.com
FCM_SERVER_KEY=your-fcm-key
EXPO_ACCESS_TOKEN=your-expo-token
```

### Personalización

#### Colores y Tema
Edita `src/index.css`:
```css
:root {
  --primary: oklch(0.60 0.25 320);     /* Azul principal */
  --accent: oklch(0.70 0.22 180);      /* Naranja de acento */
  --background: oklch(0.96 0.005 270); /* Fondo claro */
  /* ... más variables */
}
```

#### Configuración de Empresa
Modifica `src/lib/config.ts`:
```typescript
export const APP_CONFIG = {
  name: 'Tu Empresa',
  logo: '/logo.png',
  timezone: 'America/Mexico_City',
  businessHours: {
    start: '09:00',
    end: '18:00',
    days: [1, 2, 3, 4, 5] // Lun-Vie
  }
}
```

---

## 📊 Casos de Uso

### Para Consultores
- Gestionar citas con clientes
- Recordatorios automáticos
- Seguimiento de historial

### Para Servicios de Salud
- Citas médicas
- Recordatorios de consultas
- Gestión de pacientes

### Para Servicios Personales
- Peluquerías, spas
- Clases particulares
- Servicios a domicilio

### Para Pequeños Negocios
- Reuniones comerciales
- Demostraciones de producto
- Servicios de consultoría

---

## 🛠️ Desarrollo

### Comandos Útiles

```bash
# Desarrollo web
npm run dev              # Servidor de desarrollo
npm run build            # Build de producción
npm run preview          # Preview del build

# Supabase
supabase start           # Iniciar localmente
supabase functions serve # Servidor de funciones
supabase db reset        # Reiniciar BD local

# Móvil
npx expo start          # Desarrollo
eas build               # Build para stores
eas submit              # Subir a stores

# Extensión
# Reload en chrome://extensions/ después de cambios
```

### Testing

```bash
# Tests unitarios
npm run test

# Tests e2e (configurar Playwright)
npm run test:e2e

# Linting
npm run lint
```

---

## 🚀 Despliegue

### Aplicación Web
- **Recomendado**: Vercel o Netlify
- **Alternativas**: Railway, Render, Azure

### Aplicación Móvil
- **iOS**: App Store vía EAS
- **Android**: Google Play vía EAS

### Extensión
- **Chrome**: Chrome Web Store
- **Edge**: Microsoft Edge Add-ons

### Backend
- **Supabase**: Ya incluido
- **Funciones**: Deploy automático con CLI

---

## 📈 Roadmap

### v1.1 (Próximo)
- [ ] Integración con Google Calendar
- [ ] Exportación PDF de reportes
- [ ] Plantillas de citas
- [ ] API pública

### v1.2 (Futuro)
- [ ] Pagos integrados (Stripe)
- [ ] Videollamadas (Zoom/Meet)
- [ ] Chat en tiempo real
- [ ] App para Apple Watch

### v2.0 (Visión)
- [ ] IA para programación automática
- [ ] Análisis predictivo
- [ ] Integración CRM
- [ ] Multi-tenancy

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver `LICENSE` para más detalles.

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Haz fork del proyecto
2. Crea una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 💬 Soporte

- 📧 **Email**: support@appointmentpro.com
- 💬 **Discord**: [Únete a la comunidad](https://discord.gg/appointmentpro)
- 📖 **Docs**: [Documentación completa](https://docs.appointmentpro.com)
- 🐛 **Issues**: [GitHub Issues](https://github.com/user/appointmentpro/issues)

---

## 🙏 Agradecimientos

- [Supabase](https://supabase.com) - Backend-as-a-Service
- [React](https://reactjs.org) - UI Library
- [Expo](https://expo.dev) - React Native Platform
- [Tailwind CSS](https://tailwindcss.com) - CSS Framework
- [shadcn/ui](https://ui.shadcn.com) - UI Components

---

⭐ **¡Dale una estrella si te gusta el proyecto!** ⭐

---

<div align="center">
  <img src="https://via.placeholder.com/600x100/667eea/ffffff?text=AppointmentPro+-+Gestión+de+Citas+Profesional" alt="AppointmentPro Footer">
</div>