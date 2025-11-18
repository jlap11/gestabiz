# 🔍 Guía de Diagnóstico - Pantalla en Blanco

> **Problema**: La aplicación muestra pantalla en blanco al ejecutarse  
> **Fecha**: Enero 2025  
> **Archivos verificados**: App.tsx, MainApp.tsx, AuthContext, useAuthSimple ✅

---

## ✅ Verificaciones Completadas

### Código Fuente
- ✅ **App.tsx**: Estructura correcta, ErrorBoundary activo, Suspense configurado
- ✅ **MainApp.tsx**: Return statements presentes, lógica de renderizado correcta
- ✅ **AuthContext.tsx**: Provider configurado correctamente
- ✅ **useAuthSimple.ts**: Hook funcional sin errores de sintaxis
- ✅ **ErrorBoundary.tsx**: Componente activo y funcional

### TypeScript Compilation
- ⚠️ **Errores encontrados**: Solo en archivos de test (\_\_tests\_\_)
- ✅ **Código principal**: Sin errores de compilación
- ✅ **Imports**: Todos los archivos críticos existen

---

## 🎯 Pasos de Diagnóstico

### 1. Verificar Consola del Navegador (CRÍTICO)

**Acción**: Abrir DevTools y revisar la consola

```
1. Abrir la aplicación en el navegador
2. Presionar F12 (o Cmd+Option+I en Mac)
3. Ir a la pestaña "Console"
4. Buscar mensajes en rojo (errores)
```

**Errores Comunes a Buscar**:

- ❌ `Uncaught ReferenceError`: Variable no definida
- ❌ `Uncaught TypeError`: Tipo incorrecto (ej: null.property)
- ❌ `Failed to fetch`: Error de red con Supabase
- ❌ `Module not found`: Import faltante
- ❌ `Maximum update depth exceeded`: Loop infinito en React
- ❌ `Invalid hook call`: Hooks fuera de componente React

### 2. Verificar Network Tab

**Acción**: Revisar requests fallidos

```
1. En DevTools, ir a pestaña "Network"
2. Recargar página (Ctrl+R o Cmd+R)
3. Buscar requests en rojo (failed)
4. Hacer clic en el request fallido
5. Ver detalles en "Preview" o "Response"
```

**Requests Críticos**:

- ✅ `main.tsx`: Bundle principal de la app
- ✅ `index.html`: HTML base
- ⚠️ Supabase API: Verificar que `VITE_SUPABASE_URL` esté configurado
- ⚠️ Auth session: `/auth/v1/session` debe retornar 200 o 401

### 3. Verificar Variables de Entorno

**Acción**: Comprobar que estén configuradas correctamente

```powershell
# En PowerShell (raíz del proyecto):
Get-Content .env | Select-String "VITE_"
```

**Variables Requeridas**:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com (opcional)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX (opcional)
```

**⚠️ IMPORTANTE**:
- Si cambias `.env`, debes **reiniciar el servidor de desarrollo**
- Ejecutar: `npm run dev` (o cerrar y volver a abrir terminal)

### 4. Verificar Proceso de Desarrollo Activo

**Acción**: Confirmar que Vite esté ejecutándose

```powershell
# Verificar procesos Node activos:
Get-Process node -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, StartTime

# Si no hay procesos, iniciar servidor:
npm run dev
```

**Salida Esperada**:
```
VITE v6.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 5. Limpiar Caché y Reconstruir

**Acción**: Eliminar archivos temporales y reconstruir

```powershell
# 1. Detener servidor (Ctrl+C)
# 2. Limpiar caché de Vite
Remove-Item -Path "node_modules/.vite" -Recurse -Force -ErrorAction SilentlyContinue

# 3. Limpiar dist
Remove-Item -Path "dist" -Recurse -Force -ErrorAction SilentlyContinue

# 4. Reinstalar dependencias (opcional, si hay problemas graves)
# Remove-Item -Path "node_modules" -Recurse -Force
# npm install

# 5. Reiniciar servidor
npm run dev
```

### 6. Verificar ErrorBoundary Capturó Algo

**Acción**: El ErrorBoundary debería mostrar un mensaje si hay error

**Síntomas**:
- ✅ **Pantalla completamente blanca**: ErrorBoundary NO se activó (error antes de React render)
- ✅ **Mensaje "Algo salió mal"**: ErrorBoundary SÍ capturó error (ver consola)

**Si ErrorBoundary se activó**:
1. Ver mensaje de error en pantalla
2. Revisar consola para stack trace completo
3. Identificar componente problemático

---

## 🚨 Errores Específicos y Soluciones

### Error: "Supabase Client is not initialized"

**Causa**: Variables de entorno no configuradas

**Solución**:
```powershell
# 1. Verificar .env existe
Test-Path .env

# 2. Si no existe, crear desde template
Copy-Item .env.example .env

# 3. Editar .env con tus credenciales reales
code .env  # (o notepad .env)

# 4. Reiniciar servidor
npm run dev
```

### Error: "Failed to fetch" en Auth

**Causa**: URL de Supabase incorrecta o proyecto pausado

**Solución**:
1. Ir a [Supabase Dashboard](https://supabase.com/dashboard)
2. Verificar que proyecto esté **Active** (no pausado)
3. Copiar URL correcta desde Settings → API
4. Actualizar `VITE_SUPABASE_URL` en `.env`
5. Reiniciar servidor

### Error: "Maximum update depth exceeded"

**Causa**: Loop infinito en useEffect

**Solución**:
1. Buscar en consola el componente problemático
2. Revisar `useEffect` sin array de dependencias
3. Agregar dependencies correctas

**Ejemplo problemático**:
```tsx
// ❌ MAL - causa loop infinito
useEffect(() => {
  setState(newValue)
}) // Sin array de dependencias

// ✅ BIEN
useEffect(() => {
  setState(newValue)
}, [dependency]) // Con dependencias
```

### Error: "Cannot read property 'X' of null"

**Causa**: Componente intenta acceder a propiedad de valor null

**Solución**:
1. Ver stack trace en consola
2. Identificar línea exacta (ej: `MainApp.tsx:123`)
3. Agregar validación:

```tsx
// ❌ MAL
const name = user.name

// ✅ BIEN - con optional chaining
const name = user?.name

// ✅ MEJOR - con fallback
const name = user?.name || 'Usuario'
```

---

## 🔧 Soluciones Rápidas

### Opción 1: Modo Demo (Sin Supabase)

Si el problema es con Supabase, puedes usar modo demo:

```env
# En .env
VITE_DEMO_MODE=true
```

**Reiniciar servidor**: `npm run dev`

### Opción 2: Revisar Última Sesión Git

Si el código funcionaba antes, revisar cambios recientes:

```powershell
# Ver últimos commits
git log --oneline -10

# Ver cambios en App.tsx
git diff HEAD~1 src/App.tsx

# Revertir último commit (CUIDADO)
# git reset --hard HEAD~1
```

### Opción 3: Verificar Encoding de Archivos

El error puede ser caracteres especiales corruptos:

```powershell
# Verificar encoding de MainApp.tsx
Get-Content "src/components/MainApp.tsx" -Encoding UTF8 | Select-String "[^\x00-\x7F]"

# Si encuentra caracteres raros, re-guardar archivo con UTF-8
```

**Nota**: Se detectaron caracteres `ðŸ"` en logs de debug (línea 47-50 de MainApp.tsx). Aunque están en strings, podrían causar problemas en algunos terminales.

---

## 📊 Checklist de Diagnóstico

Marca cada item al completarlo:

- [ ] 1. Revisé consola del navegador (F12) y NO hay errores en rojo
- [ ] 2. Revisé Network tab y NO hay requests fallidos (rojo)
- [ ] 3. Verifiqué que `.env` existe y tiene `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
- [ ] 4. Confirmé que servidor de desarrollo está corriendo (`npm run dev`)
- [ ] 5. Verifiqué que Supabase proyecto está **Active** (no pausado)
- [ ] 6. Limpié caché de Vite (`Remove-Item node_modules/.vite -Recurse -Force`)
- [ ] 7. Reinicié servidor después de cambios en `.env`
- [ ] 8. Probé en modo incógnito (para descartar extensiones del navegador)
- [ ] 9. Probé en otro navegador (Chrome/Firefox/Edge)
- [ ] 10. Revisé que no hay loops infinitos en `useEffect`

---

## 🆘 Si Nada Funciona

### Opción Final: Reset Completo

```powershell
# 1. Detener servidor (Ctrl+C)

# 2. Limpiar TODO
Remove-Item -Path "node_modules" -Recurse -Force
Remove-Item -Path "dist" -Recurse -Force
Remove-Item -Path ".vite" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules/.vite" -Recurse -Force -ErrorAction SilentlyContinue

# 3. Reinstalar dependencias
npm install

# 4. Reconstruir tipos (si usas Supabase)
# npx supabase gen types typescript --project-id <id> > src/types/supabase.ts

# 5. Reiniciar servidor
npm run dev
```

### Compartir Error con Equipo

Si el problema persiste, recopilar información:

```powershell
# Crear reporte de error
$report = @"
=== REPORTE DE ERROR - PANTALLA EN BLANCO ===
Fecha: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

CONSOLA DEL NAVEGADOR:
[Copiar TODOS los errores en rojo de la consola aquí]

NETWORK TAB:
[Listar requests fallidos (rojo) con status code]

VARIABLES DE ENTORNO:
VITE_SUPABASE_URL: $(if (Test-Path .env) { (Get-Content .env | Select-String "VITE_SUPABASE_URL") } else { "Archivo .env no encontrado" })

PROCESO NODE ACTIVO:
$(Get-Process node -ErrorAction SilentlyContinue | Select-Object Id, StartTime | Format-Table -AutoSize | Out-String)

ÚLTIMA ACCIÓN ANTES DEL ERROR:
[Describir qué hiciste justo antes de ver pantalla en blanco]

NAVEGADOR Y VERSIÓN:
[Ej: Chrome 120, Firefox 121, Edge 120]

SISTEMA OPERATIVO:
$($PSVersionTable.OS)
"@

$report | Out-File -FilePath "error-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').txt" -Encoding UTF8
Write-Host "Reporte guardado en: error-report-*.txt" -ForegroundColor Green
```

---

## 📞 Contacto

Si después de seguir TODOS los pasos el problema persiste:

1. Ejecutar script de reporte arriba
2. Abrir issue en GitHub con archivo `error-report-*.txt`
3. Incluir screenshot de consola del navegador
4. Incluir screenshot de Network tab

**Equipo de Desarrollo**: TI-Turing  
**Proyecto**: Gestabiz  
**Documentación**: `/docs/` y `.github/copilot-instructions.md`

---

*Última actualización: Enero 2025*
