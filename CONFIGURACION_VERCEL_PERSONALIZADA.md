# 🎯 Configuración Específica - AppointSync Pro en Vercel

## 📊 Tu Proyecto Supabase

**Proyecto**: Los Narcos (ID: `a1e62937-e20f-4ee4-93c0-69279eb38d44`)
**Usuario Propietario**: Jose Luis Avila (`e3ed65d8-dd68-4538-a829-e8ebc28edd55`)

---

## 🔑 Credenciales para Vercel

### 1. Obtener VITE_SUPABASE_URL

1. Ve a: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto (Los Narcos)
3. **Settings → API**
4. Busca **Project URL**
5. Formato: `https://[tu-id-proyecto].supabase.co`

### 2. Obtener VITE_SUPABASE_ANON_KEY

1. En la misma página **Settings → API**
2. Busca **Project API keys → anon public**
3. Copia la key completa (empieza con `eyJhbG...`)
4. Esta key es SEGURA para el frontend (protegida por RLS)

### 3. Variables de Entorno Completas para Vercel

```bash
# ===========================================
# CONFIGURACIÓN OBLIGATORIA
# ===========================================

# URL de tu proyecto Supabase
VITE_SUPABASE_URL=https://[TU-ID].supabase.co

# Anon key de Supabase (pública, segura por RLS)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# URL de tu app en Vercel (cámbiala después del primer deploy)
VITE_APP_URL=https://appointsync-pro.vercel.app

# Nombre de tu app
VITE_APP_NAME=Bookio

# ===========================================
# CONFIGURACIÓN OPCIONAL
# ===========================================

# Google Calendar (si usas sincronización de calendarios)
# VITE_GOOGLE_CLIENT_ID=tu-google-client-id
# VITE_GOOGLE_CLIENT_SECRET=tu-google-client-secret

# Stripe (si usas el sistema de pagos)
# VITE_STRIPE_PUBLISHABLE_KEY=pk_live_tu-stripe-key

# ===========================================
# ⚠️ NO INCLUIR EN VERCEL
# ===========================================
# VITE_DEMO_MODE=false  ← NO en producción
# VITE_SUPABASE_SERVICE_ROLE_KEY ← NUNCA en frontend
```

---

## 🔐 Configuración de CORS en Supabase

### Paso 1: Configurar URLs Autorizadas

1. Ve a tu [Dashboard de Supabase](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. **Authentication → URL Configuration**

### Paso 2: Agregar URLs de Vercel

**Site URL:**
```
https://appointsync-pro.vercel.app
```
(Reemplaza con tu dominio real después del primer deploy)

**Redirect URLs** (agrega ambas):
```
https://appointsync-pro.vercel.app/**
https://appointsync-pro.vercel.app/auth/callback
```

### Paso 3: Si usas dominio personalizado

Si agregas un dominio tipo `bookio.com`, también agrega:
```
https://bookio.com/**
https://bookio.com/auth/callback
```

---

## 🗄️ Verificar Base de Datos

### 1. Row Level Security (RLS) ✅

Tu proyecto ya tiene RLS configurado en las siguientes tablas:
- ✅ `businesses`
- ✅ `business_employees`
- ✅ `business_roles`
- ✅ `appointments`
- ✅ `services`
- ✅ `locations`
- ✅ `reviews`
- ✅ `employee_services`

**Verifica que todas tengan políticas activas:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = true;
```

### 2. Edge Functions Desplegadas

Tu proyecto tiene estas Edge Functions activas:
- ✅ `send-notification` (AWS SES/SNS/WhatsApp)
- ✅ `process-reminders` (Cron cada 5 min)
- ✅ `stripe-webhook` (Sistema de pagos)
- ✅ `create-checkout-session` (Stripe Checkout)
- ✅ `manage-subscription` (Gestión suscripciones)
- ✅ `create-setup-intent` (Stripe Elements)
- ✅ `refresh-ratings-stats` (Vistas materializadas)

**Verifica que estén desplegadas:**
```bash
npx supabase functions list
```

### 3. Triggers y Funciones RPC

Tu base de datos tiene:
- ✅ `get_business_hierarchy` (4 parámetros)
- ✅ `search_businesses`, `search_services`, `search_professionals`
- ✅ `auto_insert_owner_to_business_roles` (trigger)
- ✅ `refresh_ratings_stats` (vistas materializadas)

---

## 🚀 Pasos de Deploy

### 1. Preparar Código
```bash
# Asegúrate de que todo está committeado
git status

# Si hay cambios:
git add .
git commit -m "Preparar deploy a Vercel con configuración completa"
git push origin main
```

### 2. Importar en Vercel

1. Ve a **[vercel.com/new](https://vercel.com/new)**
2. Conecta tu cuenta GitHub/GitLab
3. Busca y selecciona `appointsync-pro`
4. Vercel detecta: **Framework: Vite**
5. NO cambies nada en **Build Settings**

### 3. Agregar Variables de Entorno

En **Configure Project → Environment Variables**:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://[tu-id].supabase.co` | Production |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` | Production |
| `VITE_APP_URL` | `https://appointsync-pro.vercel.app` | Production |
| `VITE_APP_NAME` | `Bookio` | Production |

> 💡 **Tip**: Marca "All" en Environment para que aplique a Production, Preview y Development

### 4. Deploy

1. Click **Deploy**
2. Espera 2-4 minutos
3. Vercel te dará una URL: `https://appointsync-pro-[random].vercel.app`

### 5. Actualizar URLs en Supabase

1. Copia el URL de Vercel
2. Ve a Supabase → **Authentication → URL Configuration**
3. Actualiza **Site URL** con tu URL de Vercel
4. Actualiza **Redirect URLs** con:
   ```
   https://appointsync-pro-[tu-id].vercel.app/**
   https://appointsync-pro-[tu-id].vercel.app/auth/callback
   ```

### 6. Actualizar Variable en Vercel (Segunda vez)

1. Ve a tu proyecto en Vercel
2. **Settings → Environment Variables**
3. Edita `VITE_APP_URL` con tu URL real de Vercel
4. Click **Save**
5. Ve a **Deployments** → Click en el último → **Redeploy**

---

## ✅ Checklist de Verificación Post-Deploy

### Funcionalidad Básica
- [ ] Abrir `https://tu-app.vercel.app`
- [ ] Hacer login con: `jlap.11@hotmail.com`
- [ ] Cambiar a rol **Admin**
- [ ] Ver negocio "Los Narcos" en dashboard
- [ ] Cambiar a rol **Employee**
- [ ] Ver empleos y servicios configurados
- [ ] Cambiar a rol **Client**
- [ ] Buscar negocios funciona
- [ ] Ver perfil de negocio carga datos

### Funcionalidad Avanzada
- [ ] Crear una cita de prueba
- [ ] Verificar notificación de cita (si AWS configurado)
- [ ] Sistema de pagos funciona (si Stripe configurado)
- [ ] Google Calendar sync (si configurado)

### Logs y Errores
- [ ] No hay errores 500 en Vercel Logs
- [ ] No hay errores CORS en consola del navegador (F12)
- [ ] No hay errores de Supabase en Dashboard → Logs

---

## 🐛 Troubleshooting Específico

### Error: "Failed to fetch from Supabase"

**Causa**: Variables mal configuradas

**Solución**:
1. Ve a Vercel → Settings → Environment Variables
2. Verifica que `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén correctas
3. NO deben tener espacios ni saltos de línea
4. Redeploy: Deployments → Latest → Redeploy

### Error: "CORS policy: No 'Access-Control-Allow-Origin'"

**Causa**: URL de Vercel no está en Supabase CORS

**Solución**:
1. Supabase → Authentication → URL Configuration
2. Agrega tu URL de Vercel a **Site URL**
3. Agrega a **Redirect URLs** con `/**` al final
4. Espera 1-2 minutos para propagación

### Error: "Cannot read properties of undefined"

**Causa**: Usuario no tiene datos en `business_roles`

**Solución**:
```sql
-- Verificar que tu usuario tenga rol en el negocio
SELECT * FROM business_roles 
WHERE user_id = 'e3ed65d8-dd68-4538-a829-e8ebc28edd55';

-- Si no existe, el trigger debería haberlo insertado automáticamente
-- Verifica que el trigger esté activo:
SELECT * FROM pg_trigger 
WHERE tgname = 'trigger_auto_insert_owner_to_business_roles';
```

### Build Falla en Vercel

**Causa**: Error de TypeScript o ESLint

**Solución**:
```bash
# Localmente, ejecuta:
npm run type-check
npm run lint

# Corrige errores y vuelve a push
git add .
git commit -m "Fix build errors"
git push origin main
```

---

## 📱 Deploy de App Móvil (Separado)

El deploy de Vercel solo cubre la **web app**. Para la app móvil:

1. **Android/iOS**: Usa Expo EAS Build
2. **Instrucciones**: Ver `src/mobile/README.md`
3. **Build command**: `cd src/mobile && eas build --platform all`

---

## 🔄 Actualizaciones Futuras

### Deploy Automático
Cada vez que hagas `git push origin main`, Vercel:
- ✅ Detecta el cambio
- ✅ Ejecuta build automático
- ✅ Despliega a producción
- ✅ Te notifica por email

### Preview Deploys
Cada Pull Request genera un deploy único:
- URL tipo: `https://appointsync-pro-git-feature-xxx.vercel.app`
- Perfecto para testing antes de merge

---

## 📞 Soporte y Recursos

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Docs Vercel**: https://vercel.com/docs
- **Docs Supabase**: https://supabase.com/docs
- **Vercel Support**: https://vercel.com/support

---

## 🎉 Todo Listo

Una vez completados estos pasos, tu app estará:
- ✅ Desplegada en Vercel con HTTPS automático
- ✅ Conectada a tu Supabase en la nube
- ✅ Con autenticación funcionando
- ✅ Con base de datos, RLS y Edge Functions activas
- ✅ Con deploy automático en cada push

**¡Tu app está lista para producción!** 🚀

---

**Fecha de configuración**: 15 de octubre de 2025
**Versión de la app**: 1.0.0
**Usuario configurador**: Jose Luis Avila
