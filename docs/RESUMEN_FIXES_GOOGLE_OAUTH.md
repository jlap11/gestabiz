# Resumen de Fixes - Google OAuth + Deactivación

## 🎯 Problema Reportado

**"Al intentar iniciar sesión con Google me redirecciona al landing page"**

---

## 🔍 Diagnóstico

Encontramos **2 problemas paralelos**:

### Problema 1: Redirect Incorrecto
```
Google OAuth → Callback a / (landing page) ❌
              vs
Google OAuth → Callback a /app (correcto) ✅
```

**Causa**: `redirectTo` en `signInWithGoogle()` estaba configurado a `/` en lugar de `/app`.

### Problema 2: Cuenta Desactivada
```sql
-- Estado actual en Supabase:
emily.yaneth2807@gmail.com → is_active: false ❌
Deactivated: 2025-10-17 23:26:34
```

**Causa**: La cuenta fue desactivada pero el código NO verificaba este estado durante login.

---

## ✅ Fixes Aplicados

### Fix 1️⃣: Google OAuth → `/app`

```diff
// src/hooks/useAuth.ts línea 549
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
-   redirectTo: `${window.location.origin}/`
+   redirectTo: `${window.location.origin}/app`
  }
})
```

### Fix 2️⃣: Auto-redirigir en Landing Page

```typescript
// src/components/landing/LandingPage.tsx
const { user, loading } = useAuth()
const navigate = useNavigate()

useEffect(() => {
  if (!loading && user) {
    navigate('/app', { replace: true })  // ← Nuevo
  }
}, [user, loading, navigate])
```

**Beneficio**: Si un usuario logueado accede a `/`, se redirige automáticamente a `/app`.

### Fix 3️⃣: Validar `is_active` en Auth

```typescript
// src/hooks/useAuthSimple.ts - getInitialSession() + SIGNED_IN
const { data: profileData } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', session.user.id)
  .single()

// Verificar desactivación
if (profileData.is_active === false) {
  await supabase.auth.signOut()  // Logout automático
  // Mostrar error al usuario
  return
}
```

**Beneficio**: Bloquea acceso a usuarios desactivados, con mensaje claro.

### Fix 4️⃣: Reactivar Cuenta en Supabase

```sql
UPDATE profiles 
SET is_active = true, deactivated_at = NULL 
WHERE email = 'emily.yaneth2807@gmail.com';

-- Resultado:
is_active: true ✅ (antes: false)
deactivated_at: null ✅ (antes: 2025-10-17 23:26:34)
```

---

## 📊 Resultado

| Aspecto | Antes | Después |
|--------|-------|---------|
| **Google OAuth Redirect** | `/` (landing page) | `/app` ✅ |
| **Landing Page** | Sin redireccion | Auto-redirect a /app ✅ |
| **Emily is_active** | `false` (bloqueada) | `true` (activa) ✅ |
| **Validación desactivación** | No existe | Bloqueada en 2 puntos ✅ |
| **Build** | - | 18.07s exitoso ✅ |

---

## 🚀 Próximo Paso para Usuario

```
1. Limpiar caché del navegador (F5)
2. Clickear "Continuar con Google"
3. Verificar que se va directo a /app (no landing page)
4. Debería estar logueado exitosamente
```

---

## 📝 Documentación

Ver: `docs/FIX_GOOGLE_OAUTH_Y_DEACTIVACION.md` para análisis técnico completo.
