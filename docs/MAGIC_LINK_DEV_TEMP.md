# Magic Link para Desarrollo - TEMPORAL ⚠️

> **ADVERTENCIA**: Esta funcionalidad es **SOLO PARA DESARROLLO** y debe ser removida antes de producción.

## 📋 Resumen

Se agregó autenticación vía **Magic Link (OTP por email)** como solución temporal para testing en el navegador DevTools donde Google OAuth está bloqueado.

## 🎯 Problema Resuelto

**Contexto**: Al usar Chrome DevTools MCP para probar la aplicación:
- Google bloquea OAuth en navegadores automatizados/no seguros
- Error: "This browser or app may not be secure"
- No se puede cambiar entre usuarios de prueba

**Solución**: Magic Link (email con enlace de inicio de sesión) que NO requiere OAuth.

## 🔧 Implementación

### Archivos Modificados

1. **`src/hooks/useAuth.ts`**:
   ```typescript
   // Líneas 660-683: Nuevo método signInWithMagicLink
   const signInWithMagicLink = useCallback(async (email: string) => {
     const { error } = await supabase.auth.signInWithOtp({
       email,
       options: { emailRedirectTo: `${globalThis.location.origin}/app` }
     })
     // ... manejo de errores y toast
   }, [])
   ```

2. **`src/components/auth/AuthScreen.tsx`**:
   - Línea 23: Importa `signInWithMagicLink` de useAuth
   - Línea 38: Estado `magicLinkEmail` para input
   - Líneas 201-226: Handler `handleMagicLink`
   - Líneas 460-494: UI con condicional `import.meta.env.DEV`

### UI Agregada

**Solo visible en modo desarrollo** (`npm run dev`):

```tsx
{import.meta.env.DEV && (
  <>
    {/* Divider con emoji 🧪 */}
    <div>DEV ONLY - Magic Link</div>
    
    {/* Input + Botón */}
    <input placeholder="Email para Magic Link (solo DEV)" />
    <button>📧 Enviar Magic Link (DEV)</button>
    
    {/* Warning */}
    <p>⚠️ Esta opción es solo para desarrollo</p>
  </>
)}
```

## 📧 Flujo de Uso

1. **Abrir app en DevTools browser**: `npm run dev` → Abrir en navegador MCP
2. **Ir a pantalla de login**: `/auth`
3. **Scroll al final**: Verás sección "🧪 DEV ONLY - Magic Link"
4. **Ingresar email**: Usuario de prueba (ej: `test@example.com`)
5. **Clic "Enviar Magic Link"**: Toast "Revisa tu email para el enlace de inicio de sesión"
6. **Abrir email**: Link de Supabase con token OTP
7. **Clic en link**: Redirige a `/app` con sesión iniciada

## 🚨 TODOs Antes de Producción

**CRÍTICO**: Remover TODO lo relacionado antes de deploy a producción.

### Archivos con TODOs

1. **`src/hooks/useAuth.ts`**:
   - Línea 660: `// TODO: REMOVE MAGIC LINK BEFORE PRODUCTION`
   - Línea 754: `signInWithMagicLink, // TODO: REMOVE BEFORE PRODUCTION`
   - **Acción**: Eliminar método completo + export

2. **`src/components/auth/AuthScreen.tsx`**:
   - Línea 23: `// TODO: REMOVE signInWithMagicLink BEFORE PRODUCTION`
   - Línea 37: `// TODO: REMOVE magicLinkEmail state BEFORE PRODUCTION`
   - Línea 201: `// TODO: REMOVE handleMagicLink BEFORE PRODUCTION`
   - Línea 460: `{/* TODO: REMOVE Magic Link section BEFORE PRODUCTION */}`
   - **Acción**: Eliminar import, estado, handler y sección UI completa

### Script de Limpieza (Sugerido)

```powershell
# Buscar TODOs relacionados
git grep -n "TODO.*MAGIC LINK\|TODO.*signInWithMagicLink\|TODO.*magicLinkEmail\|TODO.*handleMagicLink"

# Verificar que NO existan en producción
git grep -i "magic.?link" --and --not --all-match -e "\.md$"
```

## ✅ Validación

### En Desarrollo
- ✅ Sección Magic Link visible en `/auth`
- ✅ Input email funcional
- ✅ Botón envía email con OTP
- ✅ Link en email redirige a `/app`
- ✅ Solo visible si `import.meta.env.DEV === true`

### En Producción (futuro)
- ❌ NO debe aparecer sección Magic Link
- ❌ NO debe existir método `signInWithMagicLink` en useAuth
- ❌ NO debe existir estado `magicLinkEmail` en AuthScreen
- ❌ Bundle NO debe contener código de Magic Link

## 📊 Impacto en Bundle

**Tamaño aproximado**: +50 líneas de código (~2KB)

**Optimización**: Webpack elimina automáticamente código dentro de `if (import.meta.env.DEV)` en builds de producción (`npm run build`).

## 🔒 Seguridad

**¿Es seguro Magic Link?**:
- ✅ Sí, es método oficial de Supabase
- ✅ Token OTP expira automáticamente
- ✅ Solo puede usarse una vez
- ✅ Requiere acceso al inbox del email

**¿Por qué removerlo en producción?**:
- Usuarios finales deben usar Google OAuth o email/password
- Magic Link es UX adicional innecesaria en producción
- Mantener UI limpia y profesional

## 📝 Notas Adicionales

- **Compatibilidad**: Requiere email SMTP configurado en Supabase (Brevo/SendGrid)
- **Rate Limit**: Supabase limita OTP a 3 intentos/hora por email
- **Redirect**: Link redirige a `/app` (cambiar si se necesita otra URL)
- **Demo Mode**: No funciona con `VITE_DEMO_MODE=true` (cliente simulado)

## 🎯 Checklist Pre-Deploy

Antes de hacer deploy a producción:

- [ ] Verificar TODOs con `git grep "TODO.*MAGIC"`
- [ ] Eliminar método `signInWithMagicLink` en `useAuth.ts`
- [ ] Eliminar estado `magicLinkEmail` en `AuthScreen.tsx`
- [ ] Eliminar handler `handleMagicLink` en `AuthScreen.tsx`
- [ ] Eliminar sección UI completa (líneas 460-494)
- [ ] Eliminar este archivo de docs (`MAGIC_LINK_DEV_TEMP.md`)
- [ ] Build de producción: `npm run build`
- [ ] Verificar bundle NO contiene "signInWithOtp"

---

**Fecha de implementación**: 2025-11-14  
**Autor**: TI-Turing Team  
**Razón**: Bypass Google OAuth en DevTools browser para testing
