# Appointment Wizard Component

Componente wizard de 4 pasos para la creación de citas, diseñado según especificaciones del documento `APPOINTMENT_FORM_REDESIGN_PROMPT.md`.

## 🎨 Diseño

### Paleta de Colores
- **Primary**: `#8b5cf6` (Violeta)
- **Secondary**: `#ff8c00` (Naranja para CTAs y badges)
- **Background**: `#0f172a` (Navy oscuro)
- **Cards**: `#2d2640` (Púrpura oscuro)
- **Success**: `#10b981` (Verde)

### Flujo de Pasos

1. **Service Selection** (Step 1/4)
   - Grid responsive de servicios con imágenes fotográficas
   - Checkmark animado en seleccionado
   - Hover effects con scale y shadow

2. **Date & Time Selection** (Step 2/4)
   - Layout 2 columnas: Calendario mini + Time slots
   - Badge "HOT" naranja para horarios populares
   - Disponibilidad en tiempo real

3. **Confirmation** (Step 3/4)
   - Card de resumen con todos los detalles
   - Textarea para notas opcionales
   - Botón "Confirm & Book" prominente

4. **Success** (Step 4/4)
   - Animación spinner → checkmark verde
   - Quick actions: Add to Calendar + Share
   - Auto-cierre opcional

## 📦 Uso

### Importación

```tsx
import { AppointmentWizard } from '@/components/appointments/AppointmentWizard';
```

### Ejemplo Básico

```tsx
function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const businessId = 'your-business-id';

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Create Appointment
      </Button>

      <AppointmentWizard
        open={isOpen}
        onClose={() => setIsOpen(false)}
        businessId={businessId}
      />
    </>
  );
}
```

### Props

```typescript
interface AppointmentWizardProps {
  open: boolean;           // Controla visibilidad del modal
  onClose: () => void;     // Callback al cerrar
  businessId: string;      // ID del negocio
}
```

## 🔧 Componentes Internos

### ServiceSelection
- Carga servicios desde Supabase
- Grid responsive (2-4 columnas)
- Imágenes placeholder basadas en tipo de servicio
- Estado de selección con checkmark

### DateTimeSelection
- Calendario con `react-day-picker`
- Generación de slots horarios (9AM-5PM)
- Badges "HOT" para horarios populares
- Cálculo automático de hora de fin

### ConfirmationStep
- Card de resumen con iconos
- Campos: Service, Date, Time, Location, Employee, Price
- Textarea de notas opcionales
- Footer informativo

### SuccessStep
- Estado loading con spinner animado
- Transición a checkmark verde
- Descripción detallada de la cita
- 2 quick actions con iconos

### ProgressBar
- Barra horizontal con fill animado
- Indicador "Step X of 4"
- Label del paso actual
- Porcentaje visual

## 🎭 Animaciones

Todas las animaciones están definidas en `wizard-animations.css`:

- **Modal entry**: `fade-in` + `scale-in` (250ms)
- **Step transitions**: `slide-out-left` → `slide-in-right`
- **Card hover**: `scale(1.05)` con shadow
- **Checkmark**: `pop` con cubic-bezier bounce
- **Spinner**: Rotación continua → fade-out
- **Progress bar**: Transición suave de width

## 🎯 Estado y Validaciones

### WizardData
```typescript
interface WizardData {
  serviceId: string | null;
  service: Service | null;
  date: Date | null;
  startTime: string | null;
  endTime: string | null;
  notes: string;
  locationId: string | null;
  location: Location | null;
}
```

### Validaciones por Paso
- **Step 1**: `serviceId !== null`
- **Step 2**: `date !== null && startTime !== null`
- **Step 3**: Siempre válido (notas opcionales)
- **Step 4**: Auto-completado

## 🚀 Integración con Supabase

### Servicios
```typescript
const { data } = await supabase
  .from('services')
  .select('*')
  .eq('business_id', businessId);
```

### Crear Cita (Placeholder)
```typescript
const { data, error } = await supabase
  .from('appointments')
  .insert({
    business_id: businessId,
    service_id: wizardData.serviceId,
    start_time: combineDateAndTime(wizardData.date, wizardData.startTime),
    end_time: combineDateAndTime(wizardData.date, wizardData.endTime),
    notes: wizardData.notes,
    status: 'confirmed'
  });
```

## 📱 Responsive Design

### Breakpoints
- **Mobile** (`<768px`): 
  - Modal full screen
  - Service cards: 1 columna
  - Date/Time: Stacked
  
- **Tablet** (`768px-1023px`):
  - Modal 90vw
  - Service cards: 2 columnas
  - Date/Time: 2 columnas

- **Desktop** (`≥1024px`):
  - Modal max-w-4xl (excepto step 4: max-w-md)
  - Service cards: 3-4 columnas
  - Date/Time: 2 columnas side-by-side

## 🎨 Personalización

### Colores
Editar variables CSS en `wizard-animations.css` o usar Tailwind:

```tsx
// Primary violet
className="bg-[#8b5cf6]"

// Secondary orange
className="bg-[#ff8c00]"

// Success green
className="bg-[#10b981]"
```

### Imágenes de Servicios
Actualizar función `getServiceImage()` en `ServiceSelection.tsx` para usar URLs propias:

```typescript
const getServiceImage = (serviceName: string): string => {
  // Lógica custom para mapear servicios a imágenes
  return 'https://your-cdn.com/images/service.jpg';
};
```

### Time Slots
Modificar lógica de generación en `DateTimeSelection.tsx`:

```typescript
// Cambiar rango de horas
for (let hour = 8; hour <= 20; hour++) { // 8AM - 8PM
  // ...
}

// Cambiar horarios populares
const popularTimes = ['09:00 AM', '01:00 PM', '05:00 PM'];
```

## ♿ Accesibilidad

- Navegación por teclado (`Tab`, `Enter`, `Esc`)
- ARIA labels en Dialog
- Contraste de color WCAG AAA (7:1)
- Focus visible en todos los elementos interactivos
- Touch targets ≥44px en mobile

## 🐛 Troubleshooting

### Los servicios no cargan
- Verificar que `businessId` sea válido
- Revisar políticas RLS en Supabase
- Comprobar estructura de tabla `services`

### Calendario no responde
- Asegurar `date-fns` esté instalado
- Verificar importación de `Calendar` de shadcn/ui

### Animaciones no funcionan
- Importar `wizard-animations.css` en el archivo raíz
- Verificar que Tailwind esté configurado correctamente

## 📚 Dependencias

```json
{
  "dependencies": {
    "react": "^18.x",
    "lucide-react": "latest",
    "date-fns": "^2.x",
    "@radix-ui/react-dialog": "latest",
    "@radix-ui/react-calendar": "latest"
  }
}
```

## 🔄 TODOs / Mejoras Futuras

- [ ] Integrar con API real de disponibilidad
- [ ] Agregar selección de empleado específico
- [ ] Implementar Google Calendar API
- [ ] Añadir soporte para citas recurrentes
- [ ] Validaciones de conflictos en tiempo real
- [ ] Skeleton loaders para mejor UX
- [ ] Tests unitarios con Vitest
- [ ] Tests E2E con Playwright

---

**Versión**: 1.0.0  
**Creado**: 5 de octubre de 2025  
**Última actualización**: 5 de octubre de 2025
