# AppointSync Pro - Guía de Despliegue en Vercel

## 📋 Pre-requisitos

1. **Cuenta en Vercel**: Crear cuenta en [vercel.com](https://vercel.com)
2. **Supabase URL y Keys**: Tener acceso a tu proyecto de Supabase
3. **Repositorio Git**: Proyecto subido a GitHub/GitLab/Bitbucket

---

## 🚀 Pasos para Desplegar en Vercel

### 1. Preparar el Repositorio

```bash
# Asegúrate de tener todos los cambios committeados
git add .
git commit -m "Preparar para deploy en Vercel"
git push origin main
```

### 2. Importar Proyecto en Vercel

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Conecta tu repositorio de GitHub/GitLab/Bitbucket
3. Selecciona el repositorio `appointsync-pro`
4. Vercel detectará automáticamente que es un proyecto Vite

### 3. Configurar Variables de Entorno

En el dashboard de Vercel, ve a **Settings → Environment Variables** y agrega:

#### Variables REQUERIDAS (Production):

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
VITE_APP_URL=https://tu-dominio.vercel.app
VITE_APP_NAME=Bookio
```

#### Variables OPCIONALES (si usas estas funcionalidades):

```bash
# Google Calendar
VITE_GOOGLE_CLIENT_ID=tu-google-client-id

# Stripe (Sistema de Pagos)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_tu-stripe-key

# Demo Mode (solo para testing, NO en producción)
# VITE_DEMO_MODE=false
```

> ⚠️ **IMPORTANTE**: NO uses `VITE_DEMO_MODE=true` en producción

### 4. Obtener Credenciales de Supabase

#### A. URL del Proyecto:
1. Ve a tu [Dashboard de Supabase](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings → API**
4. Copia **Project URL** → `VITE_SUPABASE_URL`

#### B. Anon Key:
1. En la misma página **Settings → API**
2. Copia **anon public** key → `VITE_SUPABASE_ANON_KEY`

```bash
# Ejemplo de formato correcto:
VITE_SUPABASE_URL=https://xyzabcdef123.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Configurar CORS en Supabase

1. Ve a **Authentication → URL Configuration** en Supabase
2. Agrega tu dominio de Vercel a **Site URL**:
   ```
   https://tu-dominio.vercel.app
   ```
3. Agrega el mismo URL a **Redirect URLs**:
   ```
   https://tu-dominio.vercel.app/**
   https://tu-dominio.vercel.app/auth/callback
   ```

### 6. Desplegar

1. Click en **Deploy** en Vercel
2. Espera que el build termine (2-4 minutos)
3. Vercel te dará un URL tipo: `https://appointsync-pro.vercel.app`

---

## 🔧 Configuración de Build

Vercel usará automáticamente:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### Configuración de package.json (ya incluida):

```json
{
  "scripts": {
    "build": "tsc -b --noCheck && vite build",
    "preview": "vite preview"
  }
}
```

---

## 🌐 Configuración de Dominio Personalizado (Opcional)

1. Ve a **Settings → Domains** en Vercel
2. Agrega tu dominio personalizado (ej: `bookio.com`)
3. Configura los DNS según las instrucciones de Vercel
4. Actualiza las URLs en Supabase con el nuevo dominio

---

## 🔐 Seguridad en Producción

### 1. Row Level Security (RLS) en Supabase

Verifica que todas tus tablas tengan políticas RLS activas:

```sql
-- Verificar RLS está habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 2. Variables de Entorno

- ✅ `VITE_SUPABASE_ANON_KEY`: Segura para exponer (anon key)
- ❌ `VITE_SUPABASE_SERVICE_ROLE_KEY`: NUNCA en frontend
- ❌ API Keys privadas: Solo en Edge Functions de Supabase

### 3. HTTPS

Vercel proporciona HTTPS automático con certificados SSL gratuitos.

---

## 📊 Monitoreo Post-Deploy

### 1. Verificar Funcionalidad

- [ ] Login/Registro funciona
- [ ] Búsqueda de negocios carga datos
- [ ] Crear citas funciona
- [ ] Imágenes/assets cargan correctamente
- [ ] Google Calendar sync (si aplica)
- [ ] Sistema de pagos (si aplica)

### 2. Logs y Errores

1. **Vercel Logs**: Ve a tu proyecto → **Deployments** → Click en el deploy → **Logs**
2. **Supabase Logs**: Dashboard → **Logs** → Filtrar por errores
3. **Browser Console**: F12 en producción para ver errores de cliente

### 3. Performance

- **Lighthouse**: Ejecuta auditoría en Chrome DevTools
- **Vercel Analytics**: Habilita en **Settings → Analytics**
- **Core Web Vitals**: Monitorea LCP, FID, CLS

---

## 🔄 Deploy Automático

Vercel se conecta a tu repositorio Git:

- **Push a `main`** → Deploy automático a producción
- **Pull Requests** → Preview deploy único por PR
- **Branches** → Preview deploy por rama

---

## 🐛 Troubleshooting

### Error: "Failed to fetch"

**Causa**: Variables de entorno mal configuradas

**Solución**:
1. Verifica `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
2. Asegúrate que NO tengan espacios o saltos de línea
3. Redeploy después de cambiar variables

### Error: "CORS Policy"

**Causa**: Dominio no autorizado en Supabase

**Solución**:
1. Agrega tu URL de Vercel a **Site URL** en Supabase
2. Agrega a **Redirect URLs** con patrón `/**`
3. Espera 1-2 minutos para propagación

### Error: "Cannot read properties of undefined"

**Causa**: Faltan variables de entorno

**Solución**:
1. Verifica que TODAS las variables requeridas estén en Vercel
2. Redeploy el proyecto
3. Limpia caché de Vercel (Settings → Clear Cache)

### Build Falla

**Causa**: Error de TypeScript o ESLint

**Solución**:
```bash
# Localmente verifica:
npm run type-check
npm run lint

# Si hay errores, corrígelos antes de push
```

---

## 📱 Deploy de Móvil (Expo)

El deploy de Vercel solo cubre la **web app**. Para móvil:

1. **Android/iOS**: Usa Expo EAS Build
2. **Ver**: `src/mobile/README.md` para instrucciones

---

## 🔗 URLs Importantes

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Documentación Vercel**: https://vercel.com/docs
- **Documentación Supabase**: https://supabase.com/docs

---

## 📞 Soporte

Si encuentras problemas:

1. **Vercel Support**: https://vercel.com/support
2. **Supabase Discord**: https://discord.supabase.com
3. **Logs de Vercel**: Revisa siempre primero
4. **Supabase Logs**: Busca errores de RLS o queries

---

## ✅ Checklist Final

Antes de hacer deploy a producción:

- [ ] Todas las variables de entorno configuradas
- [ ] CORS configurado en Supabase
- [ ] RLS policies activas y testeadas
- [ ] `VITE_DEMO_MODE` NO está en variables de Vercel
- [ ] Build local funciona: `npm run build && npm run preview`
- [ ] Tests pasan: `npm run test`
- [ ] TypeScript compila: `npm run type-check`
- [ ] Repositorio actualizado en Git
- [ ] Edge Functions de Supabase desplegadas (si usas billing/notificaciones)

---

## 🎉 ¡Listo!

Una vez desplegado, tu app estará disponible en:
```
https://appointsync-pro-tu-usuario.vercel.app
```

O tu dominio personalizado configurado.

---

**Última actualización**: 15 de octubre de 2025
**Versión**: 1.0.0
