# Filtrado de Negocios por Ciudad en AppointmentWizard

**Fecha**: 19 de enero de 2025  
**Feature**: Filtrado inteligente de negocios en modal de selección de cita

---

## 🎯 Cambio Realizado

Al crear una nueva cita (AppointmentWizard), el primer paso ("Select a Business") ahora **filtra automáticamente los negocios según la ciudad seleccionada en el header del layout**.

### Antes ❌
- Se mostraban **todos los negocios activos** sin importar la ciudad seleccionada
- Usuario tenía que desplazarse entre muchas opciones
- No había relación entre la ciudad del header y los negocios mostrados

### Después ✅
- Se muestran **solo negocios de la ciudad seleccionada** en el header
- Si no hay ciudad seleccionada, muestra **todos los negocios** (fallback)
- El filtrado se aplica automáticamente cuando cambia la ciudad en el header
- Performance mejorado: menos resultados = query más rápida

---

## 🔧 Implementación Técnica

**Archivo modificado**: `src/components/appointments/wizard-steps/BusinessSelection.tsx`

### Cambios realizados:

1. **Importación del hook de ciudad preferida**:
```typescript
import { usePreferredCity } from '@/hooks/usePreferredCity';
```

2. **Obtención de la ciudad preferida**:
```typescript
const { preferredCityName } = usePreferredCity();
```

3. **Filtrado dinámico en la query**:
```typescript
let query = supabase.from('businesses')...

if (preferredCityName) {
  query = query.eq('city', preferredCityName);
}

const { data, error } = await query.order('name');
```

4. **Actualización automática cuando cambia la ciudad**:
```typescript
const loadBusinesses = useCallback(async () => {
  // ... query con filtro
}, [preferredCityName]); // Dependencia de ciudad

useEffect(() => {
  loadBusinesses();
}, [loadBusinesses]);
```

---

## 🔄 Flujo de Usuario

1. Usuario abre AppointmentWizard (click "Nueva Cita")
2. **Step 1: Select a Business**
3. El componente lee la ciudad del header usando `usePreferredCity()`
4. Si hay ciudad seleccionada → muestra solo negocios de esa ciudad
5. Si no hay ciudad seleccionada → muestra todos los negocios
6. Cuando el usuario cambia ciudad en el header → lista se actualiza automáticamente
7. Usuario elige negocio → continúa a siguiente paso

---

## 📊 Datos Técnicos

**Hook utilizado**: `usePreferredCity()`
- Obtiene: `preferredCityName` (nombre de la ciudad guardada en cache)
- Guardado en: `localStorage` bajo clave específica del usuario
- Disponible en: Cualquier componente dentro de la app

**Query Supabase**:
- Tabla: `businesses`
- Filtros:
  - `is_active = true`
  - `locations.is_active = true` (inner join)
  - `city = preferredCityName` (condicional)
- Orden: `name` (alfabético)

---

## ✅ Validación

**Archivos modificados**: 1  
**Errores TypeScript**: 0 ✅  
**Errores ESLint**: 0 ✅  

**Pruebas sugeridas**:
1. ✅ Abrir AppointmentWizard sin ciudad seleccionada → muestra todos
2. ✅ Seleccionar ciudad en header → lista filtra automáticamente
3. ✅ Cambiar ciudad en header → lista se actualiza en tiempo real
4. ✅ Seleccionar negocio → continúa flujo normal

---

## 🎨 UX Mejorada

- ✅ Menos opciones = decisión más rápida
- ✅ Filtrado automático = mejor experiencia
- ✅ Consistencia: ciudad seleccionada en header = ciudad de negocios mostrados
- ✅ Fallback inteligente: sin ciudad = todos los negocios
- ✅ Performance: queries más pequeñas = respuesta más rápida

---

**Estado**: 🟢 PRODUCCIÓN  
**Impacto**: Mejora de UX significativa
