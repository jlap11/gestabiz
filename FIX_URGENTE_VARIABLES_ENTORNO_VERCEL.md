# 🚨 ERROR EN PRODUCCIÓN - Variables de Entorno Faltantes

## Error Detectado
```
Error: supabaseUrl is required.
at new SupabaseClient
```

## Causa Raíz
Las variables de entorno en `vercel.json` **NO se aplican automáticamente** en Vercel. 
Vercel requiere que las variables se configuren en el Dashboard.

## ✅ SOLUCIÓN URGENTE

### Paso 1: Configurar Variables en Vercel Dashboard

1. Ve a: https://vercel.com/tu-usuario/appointsync-pro/settings/environment-variables

2. Agrega estas 3 variables:

**Variable 1:**
- Key: `VITE_SUPABASE_URL`
- Value: `https://dkancockzvcqorqbwtyh.supabase.co`
- Environment: Production, Preview, Development (marcar los 3)

**Variable 2:**
- Key: `VITE_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrYW5jb2NrenZjcW9ycWJ3dHloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTM5MDQsImV4cCI6MjA3MjM4OTkwNH0.tUZY4n2QLQCM3mLn4MrR-mN4fMhJkkHizy993SKx-o4`
- Environment: Production, Preview, Development (marcar los 3)

**Variable 3:**
- Key: `VITE_DEMO_MODE`
- Value: `false`
- Environment: Production, Preview, Development (marcar los 3)

### Paso 2: Redesplegar

Después de guardar las variables, haz un nuevo deploy:

```bash
git commit --allow-empty -m "Trigger redeploy con env vars"
git push origin main
```

O desde Vercel Dashboard:
- Ve a la pestaña "Deployments"
- Click en los "..." del último deploy
- Click "Redeploy"

---

## ⚠️ Problema Secundario: Profile No Encontrado

Una vez las variables funcionen, también hay que resolver:

```
Profile fetch error (continuing anyway): No rows found
```

Esto significa que el usuario `demo@example.com` no tiene registro en la tabla `profiles`.

### Opción A: Crear perfil manualmente

```sql
-- Ejecutar en Supabase SQL Editor
INSERT INTO profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'demo@example.com'),
  'demo@example.com',
  'Usuario Demo',
  'client',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;
```

### Opción B: Activar trigger automático

Verificar que existe el trigger para crear perfiles automáticamente:

```sql
-- Verificar trigger existe
SELECT * FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- Si no existe, crearlo:
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', 'Usuario Nuevo'), now(), now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 📋 Checklist de Verificación

- [ ] Variables de entorno configuradas en Vercel Dashboard
- [ ] Redespliegue completado
- [ ] App carga sin error "supabaseUrl is required"
- [ ] Perfil del usuario demo existe en tabla profiles
- [ ] Login funciona correctamente
- [ ] Notificaciones se muestran (campana con badge)

---

## 🔍 Cómo Verificar que Funcionó

1. **Abre DevTools** (F12)
2. **Pestaña Console**
3. **Recarga** (Ctrl+R)
4. **Busca estos logs**:
   - ✅ `Session found, user: demo@example.com`
   - ✅ `Session result: Object` (sin error)
   - ✅ `Created user object with avatar: undefined`
   - ❌ NO debe aparecer "supabaseUrl is required"

---

## 📞 Si el Problema Persiste

1. **Verificar que las variables se guardaron**:
   - Vercel Dashboard → Settings → Environment Variables
   - Deben aparecer las 3 variables con el candado 🔒

2. **Verificar logs del build**:
   - Vercel Dashboard → Deployments → Click en el último
   - Pestaña "Build Logs"
   - Buscar: "Building for production"
   - Verificar que las variables aparecen

3. **Limpiar caché de Vercel**:
   ```bash
   # En tu proyecto local
   vercel --prod --force
   ```

---

**Tiempo estimado de solución**: 5-10 minutos
**Prioridad**: 🔥 CRÍTICA - La app no funciona en producción
