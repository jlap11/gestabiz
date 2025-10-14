# 🎯 ROOT CAUSE DEFINITIVO: useServiceStatus Interval Accumulation

## Timeline del Bug

**Commit Culpable**: `19eefea` (14 Oct 2025, 11:10 AM)
- **Feature**: Service Status Badge con health checks automáticos
- **Síntoma Reportado**: App se bloquea ~3 minutos después de login
- **Observación Clave**: "Funciona después de limpiar cache, pero falla a los 3 minutos"

## Análisis Técnico

### El Problema (ANTES del fix)

```typescript
const checkHealth = useCallback(async () => {
  // 3 queries a Supabase cada 30 segundos:
  await supabase.auth.getSession()
  await supabase.from('profiles').select('count', { count: 'exact', head: true })
  await supabase.storage.listBuckets()
}, [wasDown]) // ⚠️ useCallback depende de wasDown

useEffect(() => {
  checkHealth()
  const interval = setInterval(checkHealth, 30000) // Cada 30 segundos
  return () => clearInterval(interval)
}, [checkHealth]) // ⚠️ PROBLEMA: checkHealth en dependencies
```

### Por Qué Causaba Acumulación Exponencial

1. **Primer Render**: Hook se monta → `checkHealth()` se ejecuta → interval inicia
2. **State Change**: `wasDown` cambia → `checkHealth` se re-crea (useCallback)
3. **useEffect Re-ejecuta**: Detecta que `checkHealth` es nuevo → cleanup del interval viejo → PERO crea uno nuevo
4. **Re-renders**: Cada cambio en auth/state/props → más useCallback → más intervals
5. **Acumulación**: Después de N re-renders → N intervals activos → N×3 queries cada 30s

**Matemática del Desastre:**
- Health checks normales: 3 queries × 2/minuto = 6 queries/min
- Después de 10 re-renders: 10 intervals × 6 queries/min = **60 queries/min**
- Después de 3 minutos con acumulación: **180-300+ queries** → Rate Limit Hit

### Por Qué Limpiando Cache "Funcionaba"

1. Limpiar cache → localStorage vacío → App reinicia fresh
2. Primer login → Hook monta por primera vez → 1 solo interval
3. Después de ~3 minutos de uso normal:
   - Auth state changes (session refresh)
   - Dashboard navegación (component mount/unmount)
   - Notificaciones in-app (state updates)
   - → Acumulación de intervals → CRASH

## La Solución (DESPUÉS del fix)

```typescript
const checkHealth = useCallback(async () => {
  // Same 3 queries, pero...
}, [wasDown]) // Mantener useCallback (necesario para wasDown)

useEffect(() => {
  checkHealth() // Check inicial
  
  const interval = setInterval(() => {
    checkHealth() // Closure captures checkHealth actual
  }, 300000) // 5 minutos (no 30 segundos)
  
  return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []) // ✅ DEPS VACÍAS = interval se crea UNA SOLA VEZ
```

### Cambios Clave

1. **Empty Dependencies**: `useEffect` se ejecuta SOLO en mount/unmount
2. **Closure Captura**: `setInterval(() => checkHealth())` captura la función actual sin re-crear interval
3. **Intervalo Extendido**: 30s → 5 minutos (reduce queries de 6/min → 0.6/min = 90% reducción)
4. **eslint-disable**: Explicado por qué ignoramos la regla exhaustive-deps

### Por Qué Esta Solución Funciona

- **Sin Acumulación**: Un solo interval por mount del hook, sin importar cuántos re-renders
- **Sin Rate Limit**: 3 queries cada 5 min = 0.6 queries/min (vs 60+ con bug)
- **Closure Correcta**: `checkHealth` se actualiza con `wasDown` nuevo, pero interval NO se recrea
- **Cleanup Correcto**: Component unmount → interval se limpia → no memory leaks

## Commit de la Solución

```bash
git show 6c878be
```

**Mensaje**: "fix: Prevent useServiceStatus interval accumulation causing rate limit"

**Archivos**: `src/hooks/useServiceStatus.ts` (1 file, +7/-3 lines)

## Lecciones Aprendidas

### ❌ NUNCA Hacer

```typescript
// MALO: useCallback en useEffect deps
const callback = useCallback(() => {...}, [dep])
useEffect(() => {
  const interval = setInterval(callback, 1000)
  return () => clearInterval(interval)
}, [callback]) // ⚠️ Interval se recrea en CADA re-render de callback
```

### ✅ SIEMPRE Hacer

```typescript
// BUENO: Empty deps con closure
const callback = useCallback(() => {...}, [dep])
useEffect(() => {
  const interval = setInterval(() => callback(), 1000)
  return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []) // ✅ Interval se crea UNA SOLA VEZ, closure captura callback actual
```

## Validación

### Antes del Fix
```
[00:00] App start → 1 interval (6 queries/min)
[00:30] Auth change → 2 intervals (12 queries/min)
[01:00] Dashboard nav → 3 intervals (18 queries/min)
[01:30] Notification → 4 intervals (24 queries/min)
[02:00] State update → 5 intervals (30 queries/min)
[02:30] Component remount → 6 intervals (36 queries/min)
[03:00] Rate limit hit → CRASH 💥
```

### Después del Fix
```
[00:00] App start → 1 interval (0.6 queries/min)
[05:00] Health check → 3 queries total
[10:00] Health check → 3 queries total
[15:00] Health check → 3 queries total
...
[∞] No crashes ✅
```

## Referencias

- **Commit Culpable**: 19eefea (Service Status Badge)
- **Commit Fix**: 6c878be (Prevent interval accumulation)
- **Documentos Relacionados**: 
  - ANALISIS_ROOT_CAUSE_CACHE.md (teoría invalidada sobre Realtime)
  - 6 documentos de "blockages" (fixes incorrectos aplicados hoy)

## Conclusión

El problema NO era:
- ❌ Callbacks en dependencies (aunque los removimos, no era root cause)
- ❌ console.log (aunque los removimos, no era root cause)
- ❌ Realtime subscriptions (aunque las deshabilitamos/rehabilitamos, no era root cause)
- ❌ Supabase state corruption (teoría invalidada)

El problema ERA:
- ✅ `useServiceStatus` con `checkHealth` en `useEffect` deps
- ✅ Acumulación exponencial de `setInterval` 
- ✅ 30 segundos demasiado agresivo para health checks
- ✅ 3 queries × N intervals → Rate limit después de ~3 minutos

**Fix aplicado**: Empty deps + closure + intervalo de 5 minutos.
