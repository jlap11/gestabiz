# Mejoras en el Layout del Calendario - DateTimeSelection

## Cambios Implementados

### 1. Componente Padre (DateTimeSelection)

#### Antes:
- Grid responsivo con breakpoint en `md` (768px)
- Calendario y horas lado a lado en pantallas medianas
- No había límite de ancho máximo

#### Ahora:
- **Max-width de 7xl** (`max-w-7xl`) para pantallas grandes - permite más espacio
- **Flexbox con breakpoint en `lg`** (1024px) en lugar de grid
- Layout más inteligente:
  - **Móvil y tablets (< 1024px)**: Columna vertical - calendario arriba, horas abajo
  - **Desktop (≥ 1024px)**: Fila horizontal - calendario izquierda, horas derecha

```tsx
// Contenedor principal
<div className="p-4 sm:p-6 max-w-7xl mx-auto">

// Layout flex responsivo
<div className="flex flex-col lg:flex-row gap-6">
```

### 2. Calendario (Calendar Component)

#### Ajustes de Tamaño:
- **Max-width**: `max-w-md` (448px) para mantenerlo compacto
- **Padding responsivo**: `p-4 sm:p-6` (menos padding en móvil)
- **Flex-shrink-0**: En desktop no se encoge, mantiene su tamaño
- **Días más compactos**:
  - Móvil: `h-9 w-9` (36px)
  - Desktop: `h-10 w-10` (40px)
  - Gaps reducidos: `gap-0.5 sm:gap-1`

```tsx
<div className="w-full max-w-md p-4 sm:p-6">
  <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
    <motion.button className="h-9 w-9 sm:h-10 sm:w-10">
```

### 3. Sección de Time Slots

#### Mejoras:
- **Flex-1**: Ocupa todo el espacio restante en desktop
- **Grid responsivo mejorado**:
  - Móvil: 2 columnas
  - SM (≥640px): 3 columnas
  - LG (≥1024px): 2 columnas (al lado del calendario)
  - XL (≥1280px): 3 columnas (más espacio disponible)
- **Max-height aumentado**: De 400px a 500px
- **Min-width-0**: Previene overflow en flex layout

```tsx
<div className="flex-1 space-y-4 min-w-0">
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[500px]">
```

## Comportamiento por Tamaño de Pantalla

### Móvil (< 640px)
- ✅ Calendario: Full width, compacto
- ✅ Horas: Abajo, 2 columnas

### Tablet (640px - 1023px)
- ✅ Calendario: Full width, más espacioso
- ✅ Horas: Abajo, 3 columnas

### Desktop (1024px - 1279px)
- ✅ Calendario: Izquierda (max 448px)
- ✅ Horas: Derecha, flex-1, 2 columnas

### Desktop Grande (≥ 1280px)
- ✅ Calendario: Izquierda (max 448px)
- ✅ Horas: Derecha, flex-1, 3 columnas
- ✅ Contenedor: Hasta 80rem (1280px) centrado

## Ventajas del Nuevo Layout

1. **Mejor uso del espacio**: En pantallas grandes, el calendario no ocupa todo el 50% del ancho
2. **Más responsive**: 4 breakpoints diferentes para adaptarse mejor
3. **Mejor UX móvil**: Las horas siempre están abajo en pantallas pequeñas
4. **Calendario más compacto**: Mantiene tamaño óptimo sin desperdiciar espacio
5. **Más slots visibles**: En desktop grande se muestran 3 columnas de horarios

## Resultado Visual

```
┌─────────────────────────────────────────────┐
│  Móvil/Tablet (< 1024px)                    │
├─────────────────────────────────────────────┤
│  ┌───────────────────────────────────────┐  │
│  │       CALENDARIO (arriba)             │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │       HORAS (abajo)                   │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  Desktop (≥ 1024px)                                   │
├──────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌───────────────────────────────┐ │
│  │  CALENDARIO  │  │         HORAS                 │ │
│  │  (izquierda) │  │      (derecha, flex-1)        │ │
│  │   max 448px  │  │                               │ │
│  └──────────────┘  └───────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

## Archivos Modificados

1. `src/components/appointments/wizard-steps/DateTimeSelection.tsx`
   - Layout principal con flex responsivo
   - Grid de time slots mejorado
   - Max-width del contenedor (7xl - 1280px)
   - Removido prop businessId (no usado)

2. `src/components/ui/calendar.tsx`
   - Max-width del calendario (md - 448px)
   - Padding responsivo (p-4 sm:p-6)
   - Tamaño de días más compacto (h-9 w-9 sm:h-10 sm:w-10)
   - Gaps reducidos (gap-0.5 sm:gap-1)

3. `src/components/appointments/AppointmentWizard.tsx`
   - **Max-width aumentado de 4xl (896px) a 7xl (1280px)**
   - **Width responsivo: w-[95vw]** para usar casi todo el viewport
   - Modal mucho más ancho para aprovechar espacio en pantallas grandes
   - Removido prop businessId de DateTimeSelection
