# 🎨 Guía de Implementación del Tema Claro

## ✅ Estado Actual

### Completados
- ✅ AdminDashboard.tsx - Refactorizado completamente
- ✅ VacancyList.tsx - Refactorizado completamente  
- ✅ CreateVacancy.tsx - Refactorizado completamente
- ✅ ThemeToggle.tsx - Componente creado y listo

### Pendientes
- ⏸️ VacancyDetail.tsx
- ⏸️ ApplicationList.tsx
- ⏸️ ApplicationDetail.tsx
- ⏸️ Integración del ThemeToggle en el header
- ⏸️ Pruebas visuales del tema claro

## 🔧 Sistema de Temas

El sistema de temas ya está completo y funcional:

- **ThemeProvider**: `src/contexts/ThemeProvider.tsx` - Gestiona el estado del tema
- **CSS Variables**: `src/index.css` - Define colores para light/dark
- **ThemeToggle**: `src/components/ui/theme-toggle.tsx` - Switch entre temas

### Variables CSS Disponibles

```css
/* Tema Claro (por defecto en :root) */
--background: oklch(0.96 0.005 270)  /* Fondo muy claro */
--foreground: oklch(0.12 0.02 270)   /* Texto oscuro */
--card: oklch(0.98 0.003 270)        /* Cards blancos */
--border: oklch(0.85 0.02 270)       /* Bordes claros */
--primary: oklch(0.55 0.28 285)      /* Violeta #6820F7 */
--muted-foreground: oklch(0.50 0.015 270)

/* Tema Oscuro ([data-theme="dark"]) */
--background: oklch(0.10 0.015 270)  /* Fondo muy oscuro */
--foreground: oklch(0.95 0.005 270)  /* Texto claro */
--card: oklch(0.12 0.020 270)        /* Cards oscuros */
--border: oklch(0.22 0.03 270)       /* Bordes oscuros */
```

## 📋 Patrones de Reemplazo

### Colores Hardcodeados → Variables CSS

| Hardcoded | CSS Variable | Uso |
|-----------|--------------|-----|
| `bg-[#1a1a1a]` | `bg-background` | Fondo principal |
| `bg-[#252032]` | `bg-card` | Cards y paneles |
| `border-white/10` | `border-border` | Todos los bordes |
| `border-white/20` | `border-border` | Todos los bordes |
| `text-white` | `text-foreground` | Texto principal |
| `text-gray-400` | `text-muted-foreground` | Texto secundario |
| `text-gray-300` | `text-foreground` | Texto principal |
| `text-gray-500` | `text-muted-foreground` | Texto secundario |
| `text-violet-500` | `text-primary` | Color de marca |
| `text-violet-400` | `text-primary` | Color de marca |
| `bg-violet-500` | `bg-primary` | Botones primarios |
| `bg-violet-600` | `bg-primary/90` | Hover botones |
| `bg-violet-500/10` | `bg-primary/10` | Fondos sutiles |
| `bg-violet-500/20` | `bg-primary/20` | Fondos sutiles |
| `border-violet-500` | `border-primary` | Bordes activos |
| `border-violet-500/50` | `border-primary/50` | Bordes hover |
| `hover:bg-violet-600` | `hover:bg-primary/90` | Estados hover |

## 🔄 Archivos Pendientes

### 1. VacancyDetail.tsx (~480 líneas)

**Ubicación**: `src/components/jobs/VacancyDetail.tsx`

**Reemplazos necesarios**:
```bash
# Buscar con grep
grep -n "bg-\[#[0-9a-fA-F]\{6\}\]\|text-gray-\|text-white\|border-white/\|text-violet-\|bg-violet-" src/components/jobs/VacancyDetail.tsx

# Reemplazar patrones (aplicar manualmente)
# Aproximadamente 40-50 ocurrencias
```

### 2. ApplicationList.tsx (~460 líneas)

**Ubicación**: `src/components/jobs/ApplicationList.tsx`

**Reemplazos necesarios**:
- Mismo conjunto de patrones que VacancyDetail
- Aproximadamente 40-50 ocurrencias

### 3. ApplicationDetail.tsx (~710 líneas)

**Ubicación**: `src/components/jobs/ApplicationDetail.tsx`

**Reemplazos necesarios**:
- El archivo más grande del sistema de jobs
- Aproximadamente 60-80 ocurrencias
- Incluye secciones de admin panel

## 🎯 Integración del ThemeToggle

### Paso 1: Agregar al Header

Hay dos opciones para integrar el toggle:

#### Opción A: En el Header de AdminDashboard

```tsx
// src/components/admin/AdminDashboard.tsx
import { ThemeToggle } from '@/components/ui/theme-toggle'

// Dentro del header, después del logo/nombre del negocio:
<header className="bg-card border-b border-border sticky top-0 z-10">
  <div className="px-6 py-4">
    <div className="flex items-center justify-between">
      {/* Logo y Business Info */}
      <div className="flex items-center gap-4">
        {/* ... contenido existente ... */}
      </div>
      
      {/* ThemeToggle en el lado derecho */}
      <ThemeToggle />
    </div>
  </div>
</header>
```

#### Opción B: En el menú de usuario (recomendado para producción)

```tsx
// src/components/layout/Header.tsx o similar
import { ThemeToggle } from '@/components/ui/theme-toggle'

// Dentro de un dropdown menu de usuario:
<DropdownMenuContent>
  <DropdownMenuItem>
    <ThemeToggle />
  </DropdownMenuItem>
</DropdownMenuContent>
```

### Paso 2: Verificar exportaciones

Asegúrate de que el ThemeToggle esté exportado en el barrel file:

```tsx
// src/components/ui/index.ts
export { ThemeToggle } from './theme-toggle'
```

## 🧪 Testing del Tema Claro

### Checklist de Pruebas

- [ ] Verificar legibilidad de todos los textos en tema claro
- [ ] Confirmar contraste adecuado en todos los componentes
- [ ] Probar transición suave entre temas (sin flash)
- [ ] Verificar persistencia del tema (localStorage)
- [ ] Probar opción "System" (sigue preferencias del sistema)
- [ ] Revisar estados hover/focus en ambos temas
- [ ] Confirmar que todos los iconos son visibles
- [ ] Verificar dropdowns y modales en ambos temas

### Componentes a Probar

1. **AdminDashboard**: ✅ Listo para probar
2. **Jobs**:
   - VacancyList ✅
   - CreateVacancy ✅
   - VacancyDetail ⏸️
   - ApplicationList ⏸️
   - ApplicationDetail ⏸️
3. **Otros componentes** (revisar si tienen colores hardcodeados):
   - OverviewTab
   - LocationsManager
   - ServicesManager
   - BusinessSettings

## 📝 Notas de Implementación

### Colores Especiales

Algunos colores específicos (como status badges) se mantuvieron:
- Verde (success): `text-green-500`, `bg-green-500/10`
- Amarillo (warning): `text-yellow-500`, `bg-yellow-500/10`
- Rojo (error): `text-red-500`, `bg-red-500/10`
- Azul (info): `text-blue-500`, `bg-blue-500/10`

Estos colores son semánticos y funcionan bien en ambos temas.

### Modo Oscuro en Tailwind

Para casos edge donde necesites clases específicas por tema:

```tsx
<div className="text-foreground dark:text-gray-300">
  Contenido con override para dark mode
</div>
```

### Debugging

Si el tema no cambia, verificar:
1. `ThemeProvider` envuelve la aplicación en `main.tsx`
2. `data-theme` attribute se aplica correctamente en `<html>`
3. CSS variables están definidas en `index.css`
4. No hay inline styles que sobreescriban variables

## 🚀 Próximos Pasos

1. ✅ Completar refactorización de 3 archivos pendientes
2. ✅ Integrar ThemeToggle en header
3. ✅ Probar tema claro visualmente
4. ✅ Revisar otros componentes fuera de jobs
5. ✅ Documentar convención en copilot-instructions.md
6. ✅ Actualizar README con info del sistema de temas

## 🎨 Capturas de Pantalla (Pendiente)

Una vez completado, agregar capturas comparando:
- AdminDashboard (light vs dark)
- VacancyList (light vs dark)
- CreateVacancy form (light vs dark)

---

**Última actualización**: 2025-01-10
**Estado**: 60% completo (3 de 5 componentes jobs + header pendiente)
