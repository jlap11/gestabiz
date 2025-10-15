# 🎯 Guía Visual: Deploy en Vercel Paso a Paso

## 📸 Instrucciones con Screenshots

---

## PASO 1: Preparar Repositorio Local

### 1.1 Verificar Estado
```bash
git status
```
**¿Qué verás?**
- Lista de archivos modificados
- Si dice "nothing to commit" → Salta al Paso 2

### 1.2 Verificar Pre-Deploy
```bash
npm run pre-deploy
```
**Debe mostrar:**
```
✅ TODO LISTO - Puedes desplegar en Vercel
```

### 1.3 Commitear Cambios
```bash
git add .
git commit -m "Preparar deploy a Vercel"
git push origin main
```

**✅ Checkpoint**: Código en GitHub actualizado

---

## PASO 2: Importar Proyecto en Vercel

### 2.1 Abrir Vercel
🌐 Ve a: **https://vercel.com/new**

**Si no tienes cuenta:**
- Click en "Sign Up"
- Conecta con GitHub

### 2.2 Importar Repositorio
**Verás una pantalla como esta:**
```
┌─────────────────────────────────────┐
│ Import Git Repository               │
│                                     │
│ Search: [appointsync-pro      ]    │
│                                     │
│ ✓ TI-Turing/appointsync-pro        │
│   └─ Import                        │
└─────────────────────────────────────┘
```

**Click en "Import"**

### 2.3 Configurar Proyecto
Vercel auto-detectará:
```
Framework Preset: Vite ✓
Build Command: npm run build ✓
Output Directory: dist ✓
Install Command: npm install ✓
```

**❌ NO cambies nada aquí**

**✅ Checkpoint**: Proyecto importado

---

## PASO 3: Configurar Variables de Entorno

### 3.1 Expandir Sección
**Verás:**
```
┌─────────────────────────────────────┐
│ Environment Variables (Optional)    │
│ [ ] Add Environment Variables       │
└─────────────────────────────────────┘
```

**Click en "Add Environment Variables"**

### 3.2 Agregar Variables

**IMPORTANTE: Agregar UNA POR UNA**

#### Variable 1: VITE_SUPABASE_URL
```
┌─────────────────────────────────────┐
│ Name:  VITE_SUPABASE_URL           │
│ Value: https://tu-id.supabase.co   │
│ Environment: [✓] Production        │
│              [ ] Preview           │
│              [ ] Development       │
└─────────────────────────────────────┘
```
**Click "Add"**

#### Variable 2: VITE_SUPABASE_ANON_KEY
```
┌─────────────────────────────────────┐
│ Name:  VITE_SUPABASE_ANON_KEY      │
│ Value: eyJhbGciOiJIUzI1NiIsInR5... │
│ Environment: [✓] Production        │
└─────────────────────────────────────┘
```
**Click "Add"**

#### Variable 3: VITE_APP_URL
```
┌─────────────────────────────────────┐
│ Name:  VITE_APP_URL                │
│ Value: https://appointsync-pro.vercel.app │
│ Environment: [✓] Production        │
└─────────────────────────────────────┘
```
**⚠️ NOTA**: Cambiarás esta después del primer deploy
**Click "Add"**

#### Variable 4: VITE_APP_NAME
```
┌─────────────────────────────────────┐
│ Name:  VITE_APP_NAME               │
│ Value: Bookio                      │
│ Environment: [✓] Production        │
└─────────────────────────────────────┘
```
**Click "Add"**

### 3.3 Verificar Variables
Deberías ver:
```
✓ VITE_SUPABASE_URL
✓ VITE_SUPABASE_ANON_KEY
✓ VITE_APP_URL
✓ VITE_APP_NAME
```

**✅ Checkpoint**: Variables configuradas

---

## PASO 4: Obtener Credenciales de Supabase

### 4.1 Abrir Dashboard
🌐 Ve a: **https://supabase.com/dashboard**

**Verás:**
```
┌─────────────────────────────────────┐
│ Your Projects                       │
│                                     │
│ ┌─────────────────────────┐        │
│ │ Los Narcos              │        │
│ │ Active                  │        │
│ └─────────────────────────┘        │
└─────────────────────────────────────┘
```

**Click en tu proyecto**

### 4.2 Ir a Settings → API
**Sidebar izquierdo:**
```
⚙️ Settings
  → Project Settings
  → API ← CLICK AQUÍ
  → Authentication
  → Database
```

### 4.3 Copiar Credenciales

**Verás una página como:**
```
┌─────────────────────────────────────┐
│ Project URL                         │
│ https://xyzabc123.supabase.co      │
│ [Copy] ← COPIAR ESTO               │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Project API keys                    │
│                                     │
│ anon public                         │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... │
│ [Show] [Copy] ← COPIAR ESTO        │
└─────────────────────────────────────┘
```

**Copia estos 2 valores** y úsalos en las variables de Vercel

**✅ Checkpoint**: Credenciales copiadas

---

## PASO 5: Deploy

### 5.1 Click en Deploy
**En la página de Vercel:**
```
┌─────────────────────────────────────┐
│ [Deploy] ← CLICK AQUÍ              │
└─────────────────────────────────────┘
```

### 5.2 Esperar Build
**Verás progreso en tiempo real:**
```
Building...
[12:34:56] Running "npm run build"
[12:35:12] Building client...
[12:35:45] ✓ Built in 33s
[12:35:46] Success! Your site is live
```

**Tiempo estimado**: 2-4 minutos ⏱️

### 5.3 Copiar URL
**Al terminar verás:**
```
┌─────────────────────────────────────┐
│ 🎉 Congratulations!                 │
│                                     │
│ Your project is live at:            │
│ https://appointsync-pro-abc123.vercel.app │
│ [Copy URL]                          │
└─────────────────────────────────────┘
```

**COPIA ESTA URL** (la usarás en el siguiente paso)

**✅ Checkpoint**: Deploy completado

---

## PASO 6: Configurar CORS en Supabase

### 6.1 Ir a Authentication
**En Supabase Dashboard:**
```
🔐 Authentication ← CLICK AQUÍ
  → URL Configuration ← IR AQUÍ
```

### 6.2 Configurar Site URL
**Verás:**
```
┌─────────────────────────────────────┐
│ Site URL                            │
│ [http://localhost:3000        ]    │
│                                     │
│ The URL of your website.            │
└─────────────────────────────────────┘
```

**Reemplaza con tu URL de Vercel:**
```
https://appointsync-pro-abc123.vercel.app
```

**Click "Save"**

### 6.3 Agregar Redirect URLs
**Más abajo verás:**
```
┌─────────────────────────────────────┐
│ Redirect URLs                       │
│ [Add URL]                          │
└─────────────────────────────────────┘
```

**Agregar 2 URLs:**

1. Primera URL:
```
https://appointsync-pro-abc123.vercel.app/**
```
**Click "Add URL"**

2. Segunda URL:
```
https://appointsync-pro-abc123.vercel.app/auth/callback
```
**Click "Add URL"**

**Deberías ver:**
```
✓ https://appointsync-pro-abc123.vercel.app/**
✓ https://appointsync-pro-abc123.vercel.app/auth/callback
```

**Click "Save"** al final de la página

**✅ Checkpoint**: CORS configurado

---

## PASO 7: Actualizar VITE_APP_URL en Vercel

### 7.1 Ir a Settings
**En tu proyecto de Vercel:**
```
Settings ← CLICK AQUÍ
  → Environment Variables ← IR AQUÍ
```

### 7.2 Editar VITE_APP_URL
**Verás la lista:**
```
┌─────────────────────────────────────┐
│ VITE_SUPABASE_URL          [Edit]  │
│ VITE_SUPABASE_ANON_KEY     [Edit]  │
│ VITE_APP_URL               [Edit] ← CLICK │
│ VITE_APP_NAME              [Edit]  │
└─────────────────────────────────────┘
```

**Click en "Edit" de VITE_APP_URL**

### 7.3 Reemplazar Valor
**Cambiar de:**
```
https://appointsync-pro.vercel.app
```

**A:**
```
https://appointsync-pro-abc123.vercel.app
```
(Tu URL real de Vercel)

**Click "Save"**

### 7.4 Redeploy
**Arriba verás un banner:**
```
┌─────────────────────────────────────┐
│ ⚠️ Changes detected                 │
│ [Redeploy] to apply changes        │
└─────────────────────────────────────┘
```

**Click "Redeploy"**

**Espera 2 minutos** ⏱️

**✅ Checkpoint**: Variable actualizada y redeployado

---

## PASO 8: Verificar Funcionalidad

### 8.1 Abrir App
🌐 Abre tu URL: **https://appointsync-pro-abc123.vercel.app**

### 8.2 Probar Login
```
Email: jlap.11@hotmail.com
Password: [tu password]
```

**Debería:**
- ✅ Cargar la página de login
- ✅ Aceptar credenciales
- ✅ Redirigir a dashboard

### 8.3 Probar Funcionalidades

**Rol ADMIN:**
- [ ] Dashboard de admin carga
- [ ] Ver negocio "Los Narcos"
- [ ] Ver estadísticas

**Rol EMPLOYEE:**
- [ ] Dashboard de empleado carga
- [ ] Ver servicios asignados
- [ ] Ver citas

**Rol CLIENT:**
- [ ] Barra de búsqueda funciona
- [ ] Ver perfil de negocio carga
- [ ] Crear cita funciona

### 8.4 Revisar Consola (F12)
**Abrir DevTools:**
```
Windows: F12 o Ctrl + Shift + I
Mac: Cmd + Option + I
```

**Tab "Console":**
- ❌ No debe haber errores rojos
- ⚠️ Warnings amarillos son OK

**Si ves errores:**
```
Failed to fetch → Verifica variables de entorno
CORS error → Verifica config en Supabase
```

**✅ Checkpoint**: Todo funciona

---

## PASO 9: Monitorear Logs (Opcional)

### 9.1 Ver Logs de Vercel
**En tu proyecto:**
```
Deployments ← CLICK
  → [Latest deployment] ← CLICK
    → Runtime Logs ← VER AQUÍ
```

**Buscar errores:**
```
❌ 500 Internal Server Error
❌ Failed to connect to Supabase
✅ 200 OK (esto es bueno)
```

### 9.2 Ver Logs de Supabase
**En Supabase Dashboard:**
```
Logs & Analytics ← CLICK
  → API ← Logs de queries
  → Auth ← Logs de autenticación
```

**Filtrar errores:**
```
Status: [4xx, 5xx]
```

**✅ Checkpoint**: Logs revisados

---

## 🎉 ¡DEPLOY COMPLETADO!

### Status Final
```
┌─────────────────────────────────────┐
│ ✅ App desplegada en Vercel         │
│ ✅ Conectada a Supabase             │
│ ✅ CORS configurado                 │
│ ✅ Variables de entorno OK          │
│ ✅ Funcionalidad verificada         │
└─────────────────────────────────────┘
```

### Tu App Está Viva en:
🌐 **https://appointsync-pro-abc123.vercel.app**

---

## 📋 Resumen de URLs

### Dashboards
- **Vercel**: https://vercel.com/dashboard
- **Supabase**: https://supabase.com/dashboard
- **Tu App**: https://appointsync-pro-abc123.vercel.app

### Documentación
- **Guía Rápida**: `VERCEL_QUICK_START.md`
- **Guía Completa**: `DEPLOY_VERCEL.md`
- **Troubleshooting**: `CONFIGURACION_VERCEL_PERSONALIZADA.md`

---

## 🔄 Próximos Deploys

### Deploy Automático
Cada vez que hagas:
```bash
git push origin main
```

**Vercel automáticamente:**
1. ✅ Detecta el push
2. ✅ Ejecuta build
3. ✅ Despliega a producción
4. ✅ Te notifica por email

**Tiempo: ~2 minutos** ⚡

---

## 🆘 Si Algo Sale Mal

### Error en Build
```bash
# Verifica localmente:
npm run build
npm run preview
```

### Error de CORS
1. Verifica URLs en Supabase
2. Espera 1-2 minutos
3. Limpia caché del navegador (Ctrl + Shift + R)

### Variables No Funcionan
1. Vercel → Settings → Environment Variables
2. Verifica valores sin espacios
3. Redeploy

### Contacto
📧 jlap.11@hotmail.com

---

**Última actualización**: 15 de octubre de 2025
**Tiempo total**: 5-10 minutos
**Dificultad**: ⭐⭐☆☆☆ (Fácil)
