# Bookio - Guía de Integración con Supabase

## 📋 Descripción General

Esta documentación describe cómo configurar y desplegar Bookio con Supabase como backend completo. La aplicación incluye autenticación real, base de datos PostgreSQL, notificaciones automáticas y funciones edge.

## 🏗️ Arquitectura de la Aplicación

```
Bookio/
├── Frontend (React + TypeScript + Vite)
├── Backend (Supabase)
│   ├── PostgreSQL Database
│   ├── Authentication (Auth.js)
│   ├── Real-time subscriptions
│   ├── Edge Functions
│   └── Storage
├── Mobile App (React Native/Expo) [Futuro]
└── Browser Extension (React) [Futuro]
```

## 🔧 Configuración de Supabase

### 1. Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Espera a que se inicialice (2-3 minutos)

### 2. Configurar Base de Datos

1. En el dashboard de Supabase, ve a **SQL Editor**
2. Ejecuta el archivo `database/schema.sql` completo
3. Esto creará:
   - Todas las tablas necesarias
   - Políticas de seguridad (RLS)
   - Índices para rendimiento
   - Triggers automáticos
   - Funciones de negocio

### 3. Configurar Autenticación

#### Configuración Básica
1. Ve a **Authentication > Settings**
2. Configura:
   - Site URL: `https://tu-dominio.com` (producción) o `http://localhost:5173` (desarrollo)
   - Redirect URLs: Agrega URLs adicionales si es necesario

#### Configurar Google OAuth (Opcional)
1. Ve a **Authentication > Providers**
2. Habilita Google
3. Configura:
   - Client ID de Google
   - Client Secret de Google
4. En Google Cloud Console:
   - Crea un proyecto OAuth
   - Configura redirect URI: `https://tu-proyecto.supabase.co/auth/v1/callback`

### 4. Configurar Edge Functions

1. Instala Supabase CLI:
```bash
npm install -g supabase
```

2. Inicia sesión:
```bash
supabase login
```

3. Vincula tu proyecto:
```bash
supabase link --project-ref tu-project-ref
```

4. Despliega las functions:
```bash
supabase functions deploy send-reminders
supabase functions deploy appointment-actions
```

### 5. Configurar Variables de Entorno

#### En Supabase Dashboard
Ve a **Project Settings > API** y obtén:
- `Project URL` 
- `anon public key` 
- `service_role key` (solo para edge functions) 

#### En tu aplicación (.env.local)
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=Bookio
```

#### Para Edge Functions (Supabase Secrets)
```bash
supabase secrets set RESEND_API_KEY=tu-resend-api-key
supabase secrets set TWILIO_ACCOUNT_SID=tu-twilio-sid
supabase secrets set TWILIO_AUTH_TOKEN=tu-twilio-token
supabase secrets set TWILIO_WHATSAPP_FROM=whatsapp:+1234567890
```

## 🚀 Despliegue

### Frontend en Vercel

1. **Conectar repositorio a Vercel:**
   - Ve a [vercel.com](https://vercel.com)
   - Importa tu repositorio
   - Configura build settings:
     - Framework: `Vite`
     - Root Directory: `./`
     - Build Command: `npm run build`
     - Output Directory: `dist`

2. **Configurar variables de entorno:**
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   VITE_APP_URL=https://tu-app.vercel.app
   VITE_APP_NAME=Bookio
   ```

3. **Configurar dominios:**
   - En Vercel: Settings > Domains
   - En Supabase: Authentication > Settings > Site URL

### Base de Datos y Backend

La base de datos y backend ya están configurados en Supabase. No requiere despliegue adicional.

## 📧 Configuración de Notificaciones

### Email (Resend)

1. Crea una cuenta en [resend.com](https://resend.com)
2. Obtén tu API key
3. Agrega el secreto en Supabase:
```bash
supabase secrets set RESEND_API_KEY=tu-resend-api-key
```

### WhatsApp (Twilio)

1. Crea una cuenta en [twilio.com](https://twilio.com)
2. Configura WhatsApp Business API
3. Agrega los secretos:
```bash
supabase secrets set TWILIO_ACCOUNT_SID=tu-sid
supabase secrets set TWILIO_AUTH_TOKEN=tu-token
supabase secrets set TWILIO_WHATSAPP_FROM=whatsapp:+1234567890
```

### Programar Recordatorios Automáticos

En Supabase SQL Editor, ejecuta:
```sql
-- Programar función de recordatorios cada 15 minutos
SELECT cron.schedule(
    'send-appointment-reminders',
    '*/15 * * * *',
    'SELECT net.http_post(
        url:=''https://tu-proyecto.supabase.co/functions/v1/send-reminders'',
        headers:=''{"Authorization": "Bearer tu-service-role-key", "Content-Type": "application/json"}'',
        body:=''{}''
    );'
);
```

## 🔐 Seguridad

### Row Level Security (RLS)
- ✅ Todas las tablas tienen RLS habilitado
- ✅ Los usuarios solo pueden ver sus propios datos
- ✅ Los administradores pueden gestionar su negocio
- ✅ Los empleados tienen acceso limitado

### API Keys
- ✅ `anon key` es segura para el frontend
- ✅ `service_role key` solo para edge functions
- ✅ Nunca expongas service_role key en el frontend

## 📱 Funcionalidades Implementadas

### ✅ Autenticación Completa
- [x] Registro con email/contraseña
- [x] Login con email/contraseña
- [x] Login con Google OAuth
- [x] Recuperación de contraseña
- [x] Perfil de usuario

### ✅ Gestión de Citas
- [x] Crear citas
- [x] Editar citas
- [x] Cancelar citas
- [x] Estados: pending, confirmed, completed, cancelled, no_show
- [x] Validación de conflictos

### ✅ Gestión de Usuarios y Roles
- [x] Roles: client, employee, admin
- [x] Permisos por rol
- [x] Gestión de empleados
- [x] Solicitudes de empleados

### ✅ Gestión de Negocios
- [x] Crear y gestionar negocios
- [x] Múltiples ubicaciones
- [x] Servicios por negocio
- [x] Horarios de operación

### ✅ Notificaciones
- [x] Recordatorios automáticos (24h, 1h)
- [x] Notificaciones por email
- [x] Notificaciones por WhatsApp
- [x] Estados de envío

### ✅ Dashboard y Reportes
- [x] Estadísticas básicas
- [x] Vista de citas
- [x] Vista de clientes
- [x] Métricas de negocio

## 🔄 Testing

### Datos de Prueba

El schema incluye datos demo automáticos. Para crear datos adicionales:

```sql
-- Crear usuario admin de prueba
INSERT INTO profiles (id, email, full_name, role) 
VALUES ('your-user-id', 'admin@test.com', 'Admin Test', 'admin');

-- Crear negocio de prueba
INSERT INTO businesses (name, description, owner_id, email, phone)
VALUES ('Test Business', 'Negocio de prueba', 'your-user-id', 'info@test.com', '+1234567890');
```

### Flujos de Prueba

1. **Registro de Usuario:**
   - Crear cuenta nueva
   - Verificar perfil creado
   - Verificar rol = 'client'

2. **Crear Negocio:**
   - Login como admin
   - Crear negocio
   - Agregar servicios y ubicaciones

3. **Gestión de Citas:**
   - Crear cita
   - Confirmar cita
   - Verificar notificaciones

## 🐛 Troubleshooting

### Errores Comunes

1. **"Invalid URL" en autenticación:**
   - Verificar variables de entorno
   - Verificar configuración de Site URL en Supabase

2. **RLS Policy errors:**
   - Verificar que el usuario esté autenticado
   - Revisar políticas en el SQL

3. **Edge Functions no responden:**
   - Verificar que estén desplegadas
   - Revisar logs en Supabase dashboard

4. **Notificaciones no se envían:**
   - Verificar secretos configurados
   - Verificar edge function logs
   - Verificar cron job configurado

### Logs y Monitoring

- **Frontend:** Browser DevTools
- **Database:** Supabase Dashboard > Logs
- **Edge Functions:** Supabase Dashboard > Edge Functions > Logs
- **Authentication:** Supabase Dashboard > Authentication > Logs

## 📈 Próximos Pasos

### Mejoras Pendientes

1. **Mobile App (React Native/Expo):**
   - Configurar Expo project
   - Implementar auth flow
   - Push notifications

2. **Browser Extension:**
   - Crear manifest.json
   - Implementar popup con próximas citas
   - Sync con web app

3. **Funcionalidades Avanzadas:**
   - Integración con Google Calendar
   - Pagos con Stripe
   - Analytics avanzados
   - Multi-idioma completo

4. **Performance:**
   - Optimización de queries
   - Lazy loading
   - Caching

### Escalabilidad

- **Database:** Supabase escala automáticamente
- **Frontend:** Vercel CDN global
- **Edge Functions:** Ejecutan en múltiples regiones

## 💡 Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Guía de Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [React Query Integration](https://supabase.com/docs/guides/with-react)

## 📞 Soporte

Para soporte técnico:
1. Revisar esta documentación
2. Verificar logs en Supabase
3. Consultar documentación oficial de Supabase
4. Abrir issue en el repositorio

---

**Nota:** Esta aplicación está lista para producción con las configuraciones descritas. Asegúrate de configurar todas las variables de entorno y servicios externos antes del despliegue.