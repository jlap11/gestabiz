# Diagnóstico: Error 400 en Endpoint de Autenticación de Supabase

**Error**: `https://dkancockzvcqorqbwtyh.supabase.co/auth/v1/token?grant_type=password 400 (Bad Request)`

**Fecha**: 18 de octubre de 2025

## 🔴 Análisis del Error

### Qué significa:
- **400 Bad Request**: La solicitud que envía el cliente es malformada o contiene datos inválidos
- **Endpoint**: `/auth/v1/token?grant_type=password` - Autenticación por contraseña
- **URL**: Supabase está recibiendo la solicitud pero rechazándola

---

## 🔍 Posibles Causas (En orden de probabilidad)

### 1️⃣ **Credenciales Inválidas** (ALTA PROBABILIDAD)
**Síntomas**:
- El correo no existe en Supabase
- La contraseña es incorrecta
- Combinación email + password no coincide

**Solución**:
```
✅ Verificar que:
  - El email esté registrado en Supabase
  - La contraseña sea correcta (respeta mayúsculas/minúsculas)
  - No hay espacios al inicio/final del email o contraseña
```

**Cómo probar**:
```javascript
// En DevTools Console, ejecutar:
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'tu-email@example.com',
  password: 'tu-contraseña'
});
console.log('Error:', error);
console.log('Data:', data);
```

---

### 2️⃣ **Variables de Entorno Incorrectas** (MEDIA PROBABILIDAD)
**Síntomas**:
- URL de Supabase mal configurada
- API Key de Supabase incorrecta o expirada
- Proyecto de Supabase no existe

**Dónde verificar** (`.env.local`):
```env
VITE_SUPABASE_URL=https://dkancockzvcqorqbwtyh.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-publica
```

**Solución**:
```bash
# Verificar en archivo .env.local
# El VITE_SUPABASE_URL debe coincidir exactamente con tu proyecto
# El VITE_SUPABASE_ANON_KEY debe estar correcto

# Limpiar caché de vite
rm -r dist
npm run dev
```

---

### 3️⃣ **Problema con CORS** (BAJA PROBABILIDAD)
**Síntomas**:
- Error de origen/CORS en la consola
- Solicitud rechazada por política del navegador

**Solución**:
1. Abrir Supabase Dashboard
2. Settings → Authentication → Redirect URLs
3. Agregar tu URL local: `http://localhost:5173`

---

### 4️⃣ **Usuario Bloqueado** (BAJA PROBABILIDAD)
**Síntomas**:
- Demasiados intentos de login fallidos
- Cuenta suspendida

**Solución**:
1. Ir a Supabase Dashboard
2. Auth → Users
3. Verificar que el usuario esté activo
4. Esperar 15 minutos si hay rate limit

---

### 5️⃣ **Sesión Corrupta** (BAJA PROBABILIDAD)
**Síntomas**:
- Token expirado
- localStorage dañado

**Solución**:
```javascript
// En DevTools Console:
localStorage.clear();
sessionStorage.clear();
// Luego refrescar página
window.location.reload();
```

---

## 🛠️ Plan de Diagnóstico

### Paso 1: Verificar Variables de Entorno
```bash
# En la raíz del proyecto, verificar que existe .env.local
# y contiene:
cat .env.local | grep VITE_SUPABASE

# Esperado:
# VITE_SUPABASE_URL=https://dkancockzvcqorqbwtyh.supabase.co
# VITE_SUPABASE_ANON_KEY=ey...
```

### Paso 2: Verificar Cliente de Supabase
```bash
# En src/lib/supabase.ts, líneas 1-30
# Verificar que se crea correctamente:
cat src/lib/supabase.ts | head -40
```

**Debe verse así**:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Paso 3: Test en DevTools Console

```javascript
// 1. Verificar que Supabase esté disponible
console.log('Supabase:', window.supabase);

// 2. Probar conexión
const { data, error } = await supabase.auth.getSession();
console.log('Session error:', error);
console.log('Session:', data);

// 3. Intentar login con credenciales conocidas
const loginResult = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'password123'
});
console.log('Login error:', loginResult.error);
console.log('Login data:', loginResult.data);
```

### Paso 4: Revisar Logs en Supabase

1. Ir a: https://app.supabase.com/
2. Proyecto: `appointsync-pro`
3. Auth → Logs
4. Buscar últimos intentos de login fallidos
5. Ver detalles del error exacto

---

## 📋 Checklist de Verificación

- [ ] `.env.local` existe en la raíz
- [ ] `VITE_SUPABASE_URL` es exacto
- [ ] `VITE_SUPABASE_ANON_KEY` es correcto
- [ ] Email existe en Supabase (Auth → Users)
- [ ] Contraseña es correcta
- [ ] No hay espacios en email/password
- [ ] No hay rate limit (15+ intentos)
- [ ] localStorage está limpio
- [ ] Navegador puede conectar a internet
- [ ] URL local en Redirect URLs de Supabase

---

## 🚀 Soluciones Rápidas (Intenta estas primero)

### Opción 1: Limpiar y Reiniciar
```bash
# 1. Limpiar caché
rm -rf node_modules/.vite
rm -rf dist

# 2. Limpiar localStorage en navegador
# Abrir DevTools → Application → Local Storage → Eliminar todo

# 3. Refrescar página (Ctrl+Shift+R)

# 4. Reiniciar servidor
npm run dev
```

### Opción 2: Crear Nuevo Usuario de Test
```sql
-- En Supabase SQL Editor:
-- 1. Auth → Users
-- 2. Add user
-- 3. Email: test@example.com
-- 4. Password: TestPassword123
-- 5. Intentar login con esas credenciales
```

### Opción 3: Verificar Configuración de Auth en Supabase
```
1. Dashboard → Settings → Authentication
2. Verificar:
   - Provider: Email habilitado ✓
   - Confirm email: OFF (para testing)
   - Auto confirm new users: ON
   - JWT expiration: 3600
   - Redirect URLs: http://localhost:5173
```

---

## 🔗 Recursos Útiles

- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **Supabase Dashboard**: https://app.supabase.com/
- **Error 400 Guide**: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400
- **DevTools Network Tab**: Mostrar detalles de request/response

---

## 📞 Próximos Pasos

Si después de estos pasos el error persiste:

1. **Captura screenshot** de:
   - Network tab del error 400
   - Response body del error
   - Console logs

2. **Verifica que tienes**:
   - Proyecto Supabase activo
   - API keys correctas
   - Email verificado en Supabase

3. **Contacta soporte** con:
   - El error exacto de la consola
   - URL del proyecto Supabase
   - Pasos para reproducir

---

**Última acción recomendada**: Prueba con email/password correctos después de limpiar localStorage.

Si sigue sin funcionar, comparte en DevTools Console el resultado de:
```javascript
await supabase.auth.signInWithPassword({
  email: 'tu-email',
  password: 'tu-pass'
}).then(r => console.log(r))
```
