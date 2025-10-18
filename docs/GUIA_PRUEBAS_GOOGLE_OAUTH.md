# Guía de Prueba: Login Google OAuth

**Actualizado**: 18 de octubre de 2025  
**Estado**: LISTO PARA PROBAR ✅

---

## 📋 Antes de Probar

- ✅ Todos los fixes aplicados y compilados
- ✅ Cuenta emily.yaneth2807@gmail.com reactivada en Supabase
- ✅ Build exitoso (18.07s)

---

## 🧪 Pasos para Probar

### 1. Limpiar Estado Local (Recomendado)

Abre DevTools (F12) en la consola y ejecuta:

```javascript
// Eliminar datos locales
localStorage.clear()
sessionStorage.clear()
location.reload()
```

Esto asegura que no hay tokens o sesiones cacheadas.

---

### 2. Probar Google OAuth Login

#### Escenario A: Acceso a Landing Page → Google OAuth

```
1. Accede a http://localhost:5173/
   → Deberías ver la landing page (si NO estás logueado)

2. Clickea botón "Continuar con Google" o "Comenzar Gratis"
   → Se abre ventana de login de Google

3. Ingresa credenciales de Google:
   Email: emily.yaneth2807@gmail.com  (o tu cuenta de prueba)
   Password: (tu contraseña)

4. Autoriza la aplicación
   → Google redirige a Supabase callback
   → Supabase redirige a /app ✅ (ANTES iba a /)

5. Deberías estar en la app logueado
   → Si es correcto, verás el dashboard
   → Si error, check paso 3
```

#### Escenario B: Acceder a Landing Page si Ya Estás Logueado

```
1. Ya estás logueado (de prueba anterior)
   
2. En la URL, accede a http://localhost:5173/
   → Landing page intenta cargar

3. Automáticamente redirige a /app ✅ (NUEVO FIX)
   → No te quedas en landing page
   → Vas directo a dashboard
```

---

### 3. Verificar en Browser Console

Abre DevTools (F12) en la pestaña **Console** y busca logs como:

```javascript
// Logs de éxito:
✅ Session found, user: emily.yaneth2807@gmail.com
📸 Profile data from DB: {..., is_active: true}
👤 Created user object from real profile data, is_active: true

// Si hay problema de desactivación (no debería ocurrir):
🚫 User account is deactivated
Tu cuenta ha sido desactivada...
```

---

### 4. Verificar Request/Response

Si hay error, revisa **Network tab** en DevTools:

```
1. F12 → Network tab
2. Filtra por "fetch" o "xhr"
3. Busca request a:
   - supabase...signInWithOAuth
   - profiles (después de oauth callback)

4. Verifica response:
   - Status 200/201 = OK
   - Status 400/401 = Error de auth
   - Status 500 = Error del servidor
```

---

## ✅ Resultados Esperados

### Login Google Exitoso ✅
```
1. Clickea Google OAuth
2. Completa login en Google
3. Redirige a /app (NO a landing page)
4. Ves dashboard funcional
5. Consola muestra: "is_active: true"
```

### Landing Page + Usuario Logueado ✅
```
1. Estás logueado
2. Accedes a /
3. Automáticamente vai a /app
4. NO ves landing page
```

### Usuario Desactivado ❌ (Si cuenta está desactivada)
```
1. Intenta login
2. Valida en BD: is_active = false
3. Auto-logout + error message:
   "Tu cuenta ha sido desactivada.
    Por favor contacta al administrador."
```

---

## 🐛 Troubleshooting

### Problema: "Aún se redirige a landing page después de Google OAuth"

**Soluciones**:
1. Limpiar caché:
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   location.reload()
   ```

2. Verificar URL de redirect en Supabase Dashboard:
   - Login a https://app.supabase.com
   - Proyecto → Settings → Auth
   - "Redirect URLs" debe incluir: `http://localhost:5173/app`

3. Revisar console para errores:
   - F12 → Console
   - Busca errores en rojo

### Problema: "Error en Google OAuth"

**Soluciones**:
1. Verificar Google Client ID en `.env.local`:
   ```
   VITE_GOOGLE_CLIENT_ID=xxxxx
   ```

2. Verificar que el ID está registrado en Google Cloud Console

3. Revisar CORS en Supabase Dashboard

### Problema: "Consola muestra is_active: false"

**Soluciones**:
1. El usuario está desactivado
2. Para reactivar:
   ```sql
   UPDATE profiles 
   SET is_active = true, deactivated_at = NULL 
   WHERE email = 'email@example.com'
   ```

3. Limpiar localStorage y reintentar

---

## 📊 Matriz de Pruebas

| Caso | Acción | Resultado Esperado | Status |
|------|--------|-------------------|--------|
| **Google OAuth** | Clickear botón "Continuar con Google" | Redirige a /app | ⏳ PROBAR |
| **Landing + Logueado** | Acceder a / cuando estás logueado | Auto-redirect a /app | ⏳ PROBAR |
| **Console Logs** | F12 → Console | Verá "is_active: true" | ⏳ PROBAR |
| **Usuario Desactivado** | Desactivar cuenta + intentar login | Logout automático + error | ⏳ PROBAR |
| **Token Refresh** | Esperar a que token expire | Renueva automáticamente | ⏳ PROBAR |

---

## 📝 Notas

- **Navegador**: Chrome, Firefox, Safari recomendados
- **Limpieza**: Siempre limpiar localStorage entre pruebas
- **DevTools**: Mantén F12 abierto para ver logs
- **Incognito**: Prueba también en modo incógnito (sin cookies)

---

## ✅ Checklist Final

- [ ] Landing page redirige a /app si estoy logueado
- [ ] Google OAuth me redirige a /app (no a /)
- [ ] Console muestra "is_active: true"
- [ ] No hay errores en Network tab
- [ ] Dashboard funciona después del login
- [ ] Token se renueva automáticamente
- [ ] Logout funciona correctamente

---

## 🆘 Si Algo No Funciona

1. **Captura la pantalla** con F12 abierta
2. **Copia los logs** de la consola
3. **URL exacta** donde ocurre el problema
4. **Steps to reproduce** (pasos exactos)
5. **Navegador/SO** que estás usando
6. **Error code** si hay (ej: 400, 401, 500)

---

**Versión**: 1.0 | **Última actualización**: 2025-10-18 | **Estado**: ✅ LISTO
