# 🔍 Debugging RLS Authentication Issues

## 📋 Estado Actual

**Error reportado**: `new row violates row-level security policy`

**Ubicación**: AdminOnboarding.tsx al intentar insertar en tabla `businesses`

**Contexto**: El error persiste después de:
- ✅ Fijar políticas de storage (recursión eliminada)
- ✅ Fijar políticas de chat_participants (recursión eliminada)
- ✅ Fijar políticas de locations (WITH CHECK agregado)
- ✅ Separar políticas de businesses por comando (INSERT/SELECT/UPDATE/DELETE)

---

## 🎯 Políticas RLS Actuales

### Tabla: `businesses`

#### INSERT Policy
```sql
CREATE POLICY businesses_insert_policy ON businesses
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    owner_id = auth.uid()
  );
```

**Requisitos**:
1. Usuario debe estar autenticado (`auth.uid() IS NOT NULL`)
2. El `owner_id` en el INSERT debe coincidir con `auth.uid()`

#### SELECT Policy
```sql
CREATE POLICY businesses_select_policy ON businesses
  FOR SELECT
  USING (
    owner_id = auth.uid() OR
    is_active = true
  );
```

**Permite leer**:
- Tus propios negocios (`owner_id = auth.uid()`)
- Cualquier negocio activo (`is_active = true`)

#### UPDATE/DELETE Policies
- Solo el dueño (`owner_id = auth.uid()`) puede actualizar o eliminar

---

## 🐛 Posibles Causas del Error

### 1. JWT No Se Está Enviando
**Síntoma**: `auth.uid()` retorna `NULL` en el servidor

**Verificación en DevTools**:
```javascript
// En la consola del navegador:
const { data } = await supabase.auth.getSession();
console.log('Session:', data.session);
console.log('User ID:', data.session?.user?.id);
console.log('Access Token:', data.session?.access_token);
```

**Headers HTTP esperados**:
```
Authorization: Bearer <access_token>
```

### 2. Sesión Expirada
**Síntoma**: Token JWT expiró pero no se refrescó

**Verificación**:
```javascript
const { data } = await supabase.auth.getSession();
const expiresAt = data.session?.expires_at;
const now = Math.floor(Date.now() / 1000);
console.log('Token expires at:', new Date(expiresAt * 1000));
console.log('Is expired:', now > expiresAt);
```

### 3. User ID Mismatch
**Síntoma**: El `owner_id` en el INSERT no coincide con `auth.uid()`

**Código de AdminOnboarding**:
```typescript
owner_id: user.id  // ¿De dónde viene user.id?
```

**Verificación**: El `user.id` del prop debe ser el mismo que `auth.uid()`

### 4. RLS Habilitado Sin Políticas para Authenticated Role
**Síntoma**: RLS activo pero no hay política que aplique al rol `authenticated`

**Verificación en Supabase**:
```sql
SELECT tablename, policyname, roles 
FROM pg_policies 
WHERE tablename = 'businesses';
```

Debe haber al menos una política con `roles = {public}` o `{authenticated}`

---

## 🔧 Pasos de Debugging (En Orden)

### Paso 1: Verificar Sesión en el Cliente
**En la consola del navegador (DevTools)**:
```javascript
const { data, error } = await supabase.auth.getSession();
console.log('Session Data:', data);
console.log('Session Error:', error);
console.log('User ID:', data.session?.user?.id);
console.log('User Email:', data.session?.user?.email);
```

**Resultado esperado**:
- `data.session` debe existir
- `data.session.user.id` debe ser un UUID válido
- `data.session.access_token` debe existir

### Paso 2: Verificar Headers en Network Tab
**Abrir DevTools → Network → Filtrar por "rest/v1/businesses"**

Buscar la petición POST del INSERT y verificar:
```
Request Headers:
  Authorization: Bearer eyJ...  (debe existir)
  apikey: <anon_key>
```

Si falta el header `Authorization`, el problema es que el cliente no está enviando el JWT.

### Paso 3: Verificar User ID Match
**En AdminOnboarding.tsx, antes del INSERT**:
```typescript
const { data: sessionData } = await supabase.auth.getSession();
const sessionUserId = sessionData.session?.user?.id;
const propUserId = user.id;

console.log('Session User ID:', sessionUserId);
console.log('Prop User ID:', propUserId);
console.log('Match:', sessionUserId === propUserId);

if (sessionUserId !== propUserId) {
  throw new Error('User ID mismatch - session vs props');
}
```

### Paso 4: Test INSERT Directo en Supabase Dashboard
**SQL Editor en Supabase Dashboard**:
```sql
-- Primero, autentícate con tu usuario en la UI de Supabase
-- Luego ejecuta:
INSERT INTO businesses (
  name,
  owner_id,
  category_id,
  is_active
) VALUES (
  'Test Business',
  auth.uid(),  -- Esto debe retornar tu UUID
  'c47d4e73-7e94-4b8f-8e9a-1234567890ab',  -- UUID de categoría válida
  true
);
```

**Si falla aquí**:
- El problema es de políticas RLS (no del cliente)
- Verificar que `auth.uid()` retorna un UUID válido en el SQL Editor

**Si funciona aquí pero falla en la app**:
- El problema es del cliente (sesión/token no se envía)

### Paso 5: Verificar Refresh Token
**Si el token expiró**:
```javascript
// Forzar refresh del token
const { data, error } = await supabase.auth.refreshSession();
console.log('Refreshed session:', data);
console.log('Refresh error:', error);
```

---

## ✅ Soluciones Comunes

### Solución 1: Refrescar Sesión Antes del INSERT
```typescript
// En AdminOnboarding.tsx, antes del INSERT
const { data: refreshedSession, error: refreshError } = 
  await supabase.auth.refreshSession();

if (refreshError || !refreshedSession?.session) {
  toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
  return;
}

// Ahora hacer el INSERT
const { data: business, error: businessError } = await supabase
  .from('businesses')
  .insert({ owner_id: refreshedSession.session.user.id, ... });
```

### Solución 2: Usar getUser() en Lugar de getSession()
```typescript
// getUser() valida el token con el servidor
const { data: userData, error: userError } = await supabase.auth.getUser();

if (userError || !userData?.user) {
  toast.error('No estás autenticado.');
  return;
}

const { data: business, error: businessError } = await supabase
  .from('businesses')
  .insert({ owner_id: userData.user.id, ... });
```

### Solución 3: Service Role Key (Solo para Debugging)
**⚠️ SOLO PARA TESTING - NUNCA EN PRODUCCIÓN**

```typescript
// Cliente temporal con service_role key (bypass RLS)
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  supabaseUrl,
  'SERVICE_ROLE_KEY',  // ⚠️ PELIGRO - bypasses RLS
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// INSERT sin restricciones RLS
const { data } = await supabaseAdmin
  .from('businesses')
  .insert({ owner_id: 'any-uuid', ... });
```

Si esto funciona pero el INSERT normal falla → problema es de autenticación/JWT

### Solución 4: Temporary Disable RLS (Debugging Only)
```sql
-- ⚠️ PELIGRO - Solo para debugging
ALTER TABLE businesses DISABLE ROW LEVEL SECURITY;

-- Hacer el INSERT desde la app

-- IMPORTANTE: Re-habilitar inmediatamente
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
```

Si funciona con RLS deshabilitado → problema son las políticas

---

## 📊 Checklist de Verificación

- [ ] Usuario está autenticado (`supabase.auth.getSession()` retorna sesión)
- [ ] JWT está presente en headers HTTP (`Authorization: Bearer ...`)
- [ ] Token no está expirado (`expires_at > now`)
- [ ] `user.id` del prop coincide con `auth.uid()` de la sesión
- [ ] Políticas RLS permiten INSERT para rol `authenticated`
- [ ] La política de INSERT tiene `WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid())`
- [ ] El `owner_id` en el INSERT es un UUID válido
- [ ] Test directo en SQL Editor de Supabase funciona

---

## 🎯 Próximo Paso Inmediato

**Ejecutar en la consola del navegador (con la app abierta)**:

```javascript
// 1. Verificar sesión
const { data: session } = await supabase.auth.getSession();
console.log('✅ Session exists:', !!session.session);
console.log('✅ User ID:', session.session?.user?.id);
console.log('✅ Email:', session.session?.user?.email);
console.log('✅ Token exists:', !!session.session?.access_token);
console.log('✅ Token expires:', new Date(session.session?.expires_at * 1000));

// 2. Test INSERT directo
const testInsert = async () => {
  const { data, error } = await supabase
    .from('businesses')
    .insert({
      name: 'Test Business Debug',
      owner_id: session.session.user.id,
      category_id: 'c47d4e73-7e94-4b8f-8e9a-1234567890ab',  // Usar UUID real
      is_active: true
    })
    .select()
    .single();

  console.log('✅ Insert success:', !!data);
  console.log('❌ Insert error:', error);
  return { data, error };
};

await testInsert();
```

**Si el test INSERT funciona** → El problema está en AdminOnboarding.tsx (lógica de validación)

**Si el test INSERT falla** → El problema es de autenticación o políticas RLS

---

## 📝 Notas de Implementación

### Cambios Recientes en AdminOnboarding.tsx (Línea 111-147)

✅ Agregado:
```typescript
// Verificación exhaustiva de autenticación
const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

if (sessionError) {
  console.error('[AdminOnboarding] Session error:', sessionError);
  toast.error('Error al verificar autenticación.');
  return;
}

if (!sessionData?.session?.user) {
  console.error('[AdminOnboarding] No active session found');
  toast.error('No estás autenticado.');
  return;
}

const authenticatedUserId = sessionData.session.user.id;

if (authenticatedUserId !== user.id) {
  console.error('[AdminOnboarding] User ID mismatch');
  toast.error('Error de autenticación.');
  return;
}
```

### Cambios en Políticas RLS

✅ Migración aplicada: `debug_businesses_rls_with_logging`

- Separadas políticas ALL en 4 políticas específicas (INSERT/SELECT/UPDATE/DELETE)
- INSERT policy verifica explícitamente `auth.uid() IS NOT NULL`
- Cada comando tiene su propia política PERMISSIVE

---

## 🚀 Estado de Documentación

Este archivo documenta:
- ✅ Políticas RLS actuales de `businesses`
- ✅ Causas comunes de "new row violates RLS policy"
- ✅ 5 pasos de debugging ordenados
- ✅ 4 soluciones comunes con código
- ✅ Checklist de verificación
- ✅ Test directo en consola del navegador
- ✅ Cambios recientes en el código

**Próxima actualización**: Agregar resultados del test en consola
