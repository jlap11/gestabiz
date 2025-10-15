# 🔐 Guía: Configurar Variables de Entorno en Vercel

## 📍 ¿Dónde se Configuran?

Las variables de entorno para Vercel **NO** se colocan en tu código ni en archivos `.env`. Se configuran directamente en el **Dashboard de Vercel**.

---

## 🎯 Opción 1: Durante el Primer Deploy (Recomendado)

### 1. Importar Proyecto
Ve a: **https://vercel.com/new**
- Conecta tu cuenta de GitHub/GitLab
- Busca y selecciona: `appointsync-pro`

### 2. Configurar Variables ANTES de Deploy

Verás una sección que dice:
```
Environment Variables (Optional)
[ ] Add Environment Variables
```

**Click en el checkbox** o en **"Add Environment Variables"**

### 3. Agregar Variables Una por Una

#### Variable 1: VITE_SUPABASE_URL
```
┌─────────────────────────────────────────────────┐
│ Name                                            │
│ VITE_SUPABASE_URL                              │
│                                                 │
│ Value                                           │
│ https://xyzabc123.supabase.co                  │
│                                                 │
│ Environments                                    │
│ [✓] Production                                  │
│ [✓] Preview                                     │
│ [✓] Development                                 │
│                                                 │
│ [Add]                                          │
└─────────────────────────────────────────────────┘
```
**Click "Add"**

#### Variable 2: VITE_SUPABASE_ANON_KEY
```
┌─────────────────────────────────────────────────┐
│ Name                                            │
│ VITE_SUPABASE_ANON_KEY                         │
│                                                 │
│ Value                                           │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3... │
│                                                 │
│ Environments                                    │
│ [✓] Production                                  │
│ [✓] Preview                                     │
│ [✓] Development                                 │
│                                                 │
│ [Add]                                          │
└─────────────────────────────────────────────────┘
```
**Click "Add"**

#### Variable 3: VITE_APP_URL
```
┌─────────────────────────────────────────────────┐
│ Name                                            │
│ VITE_APP_URL                                   │
│                                                 │
│ Value                                           │
│ https://appointsync-pro.vercel.app             │
│                                                 │
│ Environments                                    │
│ [✓] Production                                  │
│                                                 │
│ [Add]                                          │
└─────────────────────────────────────────────────┘
```
**Click "Add"**

> ⚠️ **NOTA**: Esta URL cambiarás después del primer deploy con tu URL real

#### Variable 4: VITE_APP_NAME
```
┌─────────────────────────────────────────────────┐
│ Name                                            │
│ VITE_APP_NAME                                  │
│                                                 │
│ Value                                           │
│ Bookio                                         │
│                                                 │
│ Environments                                    │
│ [✓] Production                                  │
│                                                 │
│ [Add]                                          │
└─────────────────────────────────────────────────┘
```
**Click "Add"**

### 4. Verificar Variables Agregadas

Deberías ver una lista:
```
✅ VITE_SUPABASE_URL        Production, Preview, Development
✅ VITE_SUPABASE_ANON_KEY   Production, Preview, Development
✅ VITE_APP_URL             Production
✅ VITE_APP_NAME            Production
```

### 5. Deploy
Click en **"Deploy"** y espera 2-4 minutos

---

## 🔧 Opción 2: Después del Deploy

Si ya desplegaste y olvidaste las variables:

### Paso 1: Ir a Settings
1. Ve a: **https://vercel.com/dashboard**
2. Click en tu proyecto: **appointsync-pro**
3. Click en pestaña: **Settings** (arriba)

### Paso 2: Abrir Environment Variables
- Sidebar izquierdo → Click en **"Environment Variables"**

### Paso 3: Agregar Nueva Variable
Click en botón: **"Add New"** (arriba a la derecha)

### Paso 4: Llenar Formulario
```
┌─────────────────────────────────────────────────┐
│ Key                                             │
│ VITE_SUPABASE_URL                              │
│                                                 │
│ Value                                           │
│ https://xyzabc123.supabase.co                  │
│                                                 │
│ Environment                                     │
│ [✓] Production                                  │
│ [ ] Preview                                     │
│ [ ] Development                                 │
│                                                 │
│ [Save]                                         │
└─────────────────────────────────────────────────┘
```

### Paso 5: Repetir para Cada Variable

### Paso 6: Redeploy
1. Ve a pestaña: **"Deployments"**
2. Click en el último deployment
3. Click en **"⋯"** (tres puntos arriba)
4. Click en **"Redeploy"**
5. Espera 2 minutos

---

## 📋 Lista Completa de Variables

### ✅ Variables OBLIGATORIAS

| Variable | Valor Ejemplo | Dónde Obtenerla |
|----------|--------------|-----------------|
| `VITE_SUPABASE_URL` | `https://xyzabc.supabase.co` | Supabase Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Supabase Dashboard → Settings → API → anon public key |
| `VITE_APP_URL` | `https://tu-app.vercel.app` | URL de Vercel (obtenida después del deploy) |
| `VITE_APP_NAME` | `Bookio` | Nombre de tu app |

### 🔧 Variables OPCIONALES (si usas estas funcionalidades)

| Variable | Para Qué Sirve | Dónde Obtenerla |
|----------|----------------|-----------------|
| `VITE_GOOGLE_CLIENT_ID` | Sincronización Google Calendar | Google Cloud Console |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Sistema de pagos | Stripe Dashboard |

### ❌ Variables que NO DEBES AGREGAR

| Variable | Por Qué NO |
|----------|-----------|
| `VITE_DEMO_MODE` | Solo para desarrollo local, causa errores en producción |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | NUNCA en frontend, solo Edge Functions |

---

## 🔍 Cómo Obtener las Credenciales de Supabase

### 1. Abrir Dashboard de Supabase
🌐 https://supabase.com/dashboard

### 2. Seleccionar Tu Proyecto
Click en: **"Los Narcos"** (o el nombre de tu proyecto)

### 3. Ir a Settings → API
- Sidebar izquierdo: **⚙️ Settings**
- Click en: **API**

### 4. Copiar Project URL
```
┌─────────────────────────────────────────────────┐
│ Project URL                                     │
│ https://xyzabcdef123.supabase.co               │
│ [Copy] ← Click aquí                            │
└─────────────────────────────────────────────────┘
```
**Copia esto** → Es tu `VITE_SUPABASE_URL`

### 5. Copiar anon public Key
```
┌─────────────────────────────────────────────────┐
│ Project API keys                                │
│                                                 │
│ anon public                                     │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M... │
│ [Show] [Copy] ← Click Copy                     │
└─────────────────────────────────────────────────┘
```
**Copia esto** → Es tu `VITE_SUPABASE_ANON_KEY`

---

## 🖼️ Capturas de Pantalla Simuladas

### En Vercel (Durante Deploy):
```
┌───────────────────────────────────────────────────────────┐
│ Configure Project                                         │
│                                                           │
│ Project Name: appointsync-pro                            │
│ Framework Preset: Vite ✓                                 │
│                                                           │
│ Build and Output Settings                                │
│ Build Command: npm run build ✓                          │
│ Output Directory: dist ✓                                 │
│                                                           │
│ Environment Variables                                     │
│ [✓] Add Environment Variables                            │
│                                                           │
│ │ Name                    Value                    │     │
│ │ VITE_SUPABASE_URL      https://xyz.supabase.co │     │
│ │ VITE_SUPABASE_ANON_KEY eyJhbG...               │     │
│ │ VITE_APP_URL           https://app.vercel.app  │     │
│ │ VITE_APP_NAME          Bookio                  │     │
│                                                           │
│                                      [Deploy] ←────────   │
└───────────────────────────────────────────────────────────┘
```

### En Vercel Settings:
```
┌───────────────────────────────────────────────────────────┐
│ Environment Variables                    [Add New] ←─────│
│                                                           │
│ NAME                     VALUE             ENVIRONMENT    │
│ VITE_SUPABASE_URL       https://xyz...    Production    │
│ VITE_SUPABASE_ANON_KEY  eyJhbG...         Production    │
│ VITE_APP_URL            https://app...    Production    │
│ VITE_APP_NAME           Bookio            Production    │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## ⚠️ Errores Comunes

### Error 1: "Failed to fetch"
**Causa**: Variables mal configuradas
**Solución**:
1. Vercel → Settings → Environment Variables
2. Verifica `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
3. NO deben tener espacios ni saltos de línea
4. Redeploy

### Error 2: "Cannot read properties of undefined"
**Causa**: Faltan variables
**Solución**:
1. Verifica que TODAS las obligatorias estén agregadas
2. Click en "Redeploy"

### Error 3: "CORS Error"
**Causa**: URL de Vercel no está en Supabase
**Solución**: Ver sección "Configurar CORS" abajo

---

## 🔗 Configurar CORS en Supabase (IMPORTANTE)

Después de agregar variables y desplegar, debes configurar CORS:

### 1. Copiar URL de Vercel
Después del deploy, Vercel te da una URL:
```
https://appointsync-pro-abc123.vercel.app
```
**Copia esta URL**

### 2. Ir a Supabase → Authentication
1. Dashboard Supabase
2. Sidebar: **🔐 Authentication**
3. Click: **URL Configuration**

### 3. Agregar Site URL
```
┌─────────────────────────────────────────────────┐
│ Site URL                                        │
│ https://appointsync-pro-abc123.vercel.app      │
│                                                 │
│ [Save]                                         │
└─────────────────────────────────────────────────┘
```

### 4. Agregar Redirect URLs
Click **"Add URL"** y agregar:

**URL 1:**
```
https://appointsync-pro-abc123.vercel.app/**
```

**URL 2:**
```
https://appointsync-pro-abc123.vercel.app/auth/callback
```

### 5. Guardar
Click **"Save"** al final de la página

---

## 🔄 Actualizar VITE_APP_URL (Segundo Deploy)

Después del primer deploy:

### 1. Obtener URL Real
Vercel te dio: `https://appointsync-pro-abc123.vercel.app`

### 2. Actualizar Variable
1. Vercel → Settings → Environment Variables
2. Busca `VITE_APP_URL`
3. Click **"Edit"** (lápiz)
4. Cambia de:
   ```
   https://appointsync-pro.vercel.app
   ```
   A:
   ```
   https://appointsync-pro-abc123.vercel.app
   ```
5. Click **"Save"**

### 3. Redeploy
1. Deployments → Último deploy
2. **"⋯"** → **"Redeploy"**

---

## ✅ Checklist Final

### Antes de Deploy
- [ ] Tienes cuenta en Vercel
- [ ] Tienes credenciales de Supabase a mano
- [ ] Repositorio pushed a GitHub

### Durante Deploy
- [ ] Agregaste `VITE_SUPABASE_URL`
- [ ] Agregaste `VITE_SUPABASE_ANON_KEY`
- [ ] Agregaste `VITE_APP_URL` (temporal)
- [ ] Agregaste `VITE_APP_NAME`
- [ ] Click en "Deploy"

### Después de Deploy
- [ ] Copiaste URL de Vercel
- [ ] Configuraste CORS en Supabase (Site URL)
- [ ] Agregaste Redirect URLs en Supabase
- [ ] Actualizaste `VITE_APP_URL` con URL real
- [ ] Hiciste Redeploy
- [ ] Probaste login en la app

---

## 📞 Soporte

### Documentación Relacionada
- **Guía Rápida**: `VERCEL_QUICK_START.md`
- **Guía Completa**: `DEPLOY_VERCEL.md`
- **Guía Visual**: `GUIA_VISUAL_DEPLOY.md`
- **Config Personalizada**: `CONFIGURACION_VERCEL_PERSONALIZADA.md`

### Enlaces Útiles
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Docs Vercel**: https://vercel.com/docs/concepts/projects/environment-variables

---

## 🎯 Resumen Rápido

**¿Dónde?** → Dashboard de Vercel → Settings → Environment Variables

**¿Cuándo?** → Durante el deploy O después en Settings

**¿Cuántas?** → 4 obligatorias + opcionales según features

**¿Seguras?** → Sí, Vercel las encripta y nunca las expone en código

**¿Costo?** → $0 (incluido en plan gratuito)

---

**Última actualización**: 15 de octubre de 2025
**Versión**: 1.0.0
