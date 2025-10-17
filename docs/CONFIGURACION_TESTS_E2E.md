# ⚙️ Configuración de Tests E2E - Sistema de Vacantes

**Fecha**: 17 de octubre de 2025  
**Estado**: ⏸️ PAUSADO - Requiere configuración de Supabase

---

## 🚨 Problema Actual

Los tests E2E del sistema de vacantes están **temporalmente deshabilitados** porque:

1. **Envío de emails**: Supabase envía emails de confirmación a direcciones ficticias, causando rebotes y problemas de deliverability
2. **RLS policies**: Las políticas de seguridad de filas requieren usuarios reales en `auth.users`
3. **Service Role Key**: Se necesita la clave de servicio para bypass RLS, pero no debe estar en el repositorio

---

## ✅ Soluciones Disponibles

### Opción 1: Usar Service Role Key (Recomendado para CI/CD)

1. **Obtener Service Role Key**:
   - Ir a Supabase Dashboard → Settings → API
   - Copiar `service_role` key (⚠️ NUNCA commitear esta clave)

2. **Configurar en `.env.test` (local)**:
   ```env
   VITE_SUPABASE_URL=https://dkancockzvcqorqbwtyh.supabase.co
   VITE_SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
   ```

3. **Configurar en GitHub Secrets** (CI/CD):
   ```
   VITE_SUPABASE_SERVICE_ROLE_KEY
   ```

4. **Modificar tests** para usar service_role:
   ```typescript
   const supabaseKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
                       import.meta.env.VITE_SUPABASE_ANON_KEY
   ```

**✅ Ventajas**:
- Bypass automático de RLS
- No envía emails de confirmación
- Puede crear/eliminar usuarios en auth.users

**❌ Desventajas**:
- Requiere gestión segura de secretos
- Permisos totales (riesgo de seguridad si se expone)

---

### Opción 2: Deshabilitar Confirmación de Email (Temporal)

1. **Supabase Dashboard → Authentication → Settings**:
   - ✅ Enable email signup
   - ❌ Confirm email (deshabilitar SOLO para testing)
   - ⚠️ **Recordar reactivar en producción**

2. **Volver a habilitar `auth.signUp` en tests**:
   ```typescript
   const { data, error } = await supabase.auth.signUp({
     email: `test.${Date.now()}@example.com`,
     password: 'TestPassword123!'
   })
   ```

**✅ Ventajas**:
- Simple y rápido
- No requiere service_role key

**❌ Desventajas**:
- Crea usuarios reales en auth.users (requiere cleanup)
- Puede causar problemas de límites de usuarios
- Configuración manual en dashboard

---

### Opción 3: Mock de Supabase Client (Tests Unitarios)

Para tests que no requieren base de datos real:

```typescript
// tests/setup.ts
import { vi } from 'vitest'

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn(() => Promise.resolve({
        data: { id: 'mock-id', name: 'Mock Business' },
        error: null
      }))
    })),
    rpc: vi.fn(() => Promise.resolve({
      data: [{ match_score: 85 }],
      error: null
    }))
  }))
}))
```

**✅ Ventajas**:
- No requiere Supabase
- Rápido y confiable
- Ideal para tests unitarios

**❌ Desventajas**:
- No valida integración real
- Requiere mantener mocks actualizados

---

### Opción 4: Supabase Local Development (Avanzado)

Usar instancia local de Supabase con Docker:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Iniciar Supabase localmente
npx supabase start

# Aplicar migraciones
npx supabase db push

# Configurar .env.test
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=local-anon-key
```

**✅ Ventajas**:
- Environment aislado para testing
- No afecta producción
- Service role disponible localmente

**❌ Desventajas**:
- Requiere Docker
- Configuración compleja inicial
- Recursos del sistema

---

## 📝 Estado de Tests

### Tests E2E Completos (45 tests)

| Suite | Tests | Status | Bloqueador |
|-------|-------|--------|------------|
| job-vacancy-complete-flow | 9 | ⏸️ Pausado | RLS + Auth |
| matching-score-calculation | 12 | ⏸️ Pausado | RLS + Auth |
| schedule-conflict-detection | 15 | ⏸️ Pausado | RLS + Auth |
| mandatory-review-enforcement | 9 | ⏸️ Pausado | RLS + Auth |

### Cambios Realizados (Anti-spam)

1. ✅ Eliminado `auth.signUp` para evitar envío de emails
2. ✅ Usando UUIDs fijos en lugar de usuarios reales
3. ✅ Documentación de opciones de configuración
4. ⏸️ Tests pausados hasta configuración correcta

---

## 🚀 Próximos Pasos

### Para Desarrolladores Locales:

1. **Elegir opción de configuración** (recomendado: Opción 1)
2. **Configurar `.env.test`** con service_role key
3. **Ejecutar tests**:
   ```bash
   npm run test tests/job-vacancy-complete-flow.test.ts
   ```

### Para CI/CD Pipeline:

1. **Agregar GitHub Secret**: `VITE_SUPABASE_SERVICE_ROLE_KEY`
2. **Modificar workflow** `.github/workflows/test.yml`:
   ```yaml
   env:
     VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
     VITE_SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.VITE_SUPABASE_SERVICE_ROLE_KEY }}
   ```
3. **Habilitar tests** en pipeline

### Para Producción:

1. **Configurar Custom SMTP** (AWS SES, SendGrid, etc.)
2. **Reactivar confirmación de email** en Supabase
3. **Revisar límites de envío** de emails

---

## ⚠️ Advertencias de Seguridad

1. **NUNCA** commitear `service_role` key al repositorio
2. **NUNCA** exponer `service_role` key en código cliente
3. **SIEMPRE** usar secrets management (GitHub Secrets, env vars)
4. **REVISAR** permisos de service_role antes de usar en tests

---

## 📚 Referencias

- **Supabase Auth**: https://supabase.com/docs/guides/auth
- **RLS Policies**: https://supabase.com/docs/guides/auth/row-level-security
- **Service Role**: https://supabase.com/docs/guides/api#the-service_role-key
- **Local Development**: https://supabase.com/docs/guides/cli/local-development
- **Custom SMTP**: https://supabase.com/docs/guides/auth/auth-smtp

---

**Última actualización**: 17 de octubre de 2025  
**Autor**: Sistema de Vacantes  
**Estado**: ⏸️ Tests pausados - Esperando configuración
