# ⚡ Quick Start: Deploy en Vercel

## 🎯 Pasos Rápidos (5 minutos)

### 1. Preparar Repositorio
```bash
git add .
git commit -m "Preparar deploy a Vercel"
git push origin main
```

### 2. Importar en Vercel
1. Ve a **[vercel.com/new](https://vercel.com/new)**
2. Conecta tu repositorio GitHub
3. Selecciona `appointsync-pro`
4. Vercel detecta automáticamente: **Framework: Vite**

### 3. Configurar Variables de Entorno

En **Settings → Environment Variables** agrega:

```bash
# OBLIGATORIAS
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_URL=https://tu-dominio.vercel.app
VITE_APP_NAME=Bookio

# OPCIONALES (solo si usas estas features)
VITE_GOOGLE_CLIENT_ID=tu-google-client-id
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_tu-stripe-key
```

### 4. Obtener Credenciales de Supabase

**A. URL y Anon Key:**
1. [Dashboard Supabase](https://supabase.com/dashboard) → Tu Proyecto
2. **Settings → API**
3. Copia **Project URL** → `VITE_SUPABASE_URL`
4. Copia **anon public** → `VITE_SUPABASE_ANON_KEY`

**B. Configurar CORS:**
1. **Authentication → URL Configuration**
2. **Site URL**: `https://tu-dominio.vercel.app`
3. **Redirect URLs**: 
   ```
   https://tu-dominio.vercel.app/**
   https://tu-dominio.vercel.app/auth/callback
   ```

### 5. Deploy
1. Click **Deploy** en Vercel
2. Espera 2-4 minutos
3. ✅ ¡Listo! Tu app está en: `https://appointsync-pro-xxx.vercel.app`

---

## 🔍 Verificación Post-Deploy

### Checklist Rápido:
- [ ] Login funciona
- [ ] Búsqueda carga datos de Supabase
- [ ] Crear cita funciona
- [ ] Imágenes cargan
- [ ] No hay errores en consola (F12)

### Si algo falla:
```bash
# Ver logs en:
# Vercel → Tu proyecto → Deployments → Click deploy → Logs

# Errores comunes:
# ❌ "Failed to fetch" → Verifica variables de entorno
# ❌ "CORS error" → Agrega URL a Supabase CORS config
# ❌ Build falla → Ejecuta local: npm run build
```

---

## 📚 Guía Completa

Ver **[DEPLOY_VERCEL.md](./DEPLOY_VERCEL.md)** para:
- Troubleshooting detallado
- Configuración de dominio personalizado
- Monitoreo y analytics
- Seguridad en producción
- Edge Functions de Supabase

---

## 🛠️ Scripts Útiles

```bash
# Verificar que todo esté listo para deploy
npm run pre-deploy

# Build local para testing
npm run build
npm run preview

# Ver en http://localhost:4173
```

---

## 🆘 Soporte

- **Docs Vercel**: https://vercel.com/docs
- **Docs Supabase**: https://supabase.com/docs
- **Vercel Support**: https://vercel.com/support

---

**¿Primera vez con Vercel?** Sigue estos pasos exactos y funciona en 5 minutos ⚡
