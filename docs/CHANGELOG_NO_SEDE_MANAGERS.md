# ✅ FIX: No Mostrar Sede para Managers - RESUMEN

## 🎯 Cambio Rápido

**Problema**: Managers mostraban "- Sede Sur" en el chat modal  
**Solución**: No mostrar ubicación para managers (role='manager')

---

## 📝 Código

```typescript
// Detectar si es manager
const isManager = emp.role === 'manager';

// Si es manager: sin ubicación
// Si no es manager: con ubicación
location_name: isManager ? null : (locationsData?.name || null),
```

---

## 📊 Antes vs Después

### ❌ ANTES
```
[Manager] Carlos Torres - Sede Sur
[Employee] Daniela Rodríguez - Sede Sur
```

### ✅ DESPUÉS
```
[Manager] Carlos Torres
[Employee] Daniela Rodríguez - Sede Sur
```

---

## ✅ Validación

- ✅ TypeScript: Sin errores
- ✅ Solo 1 archivo modificado
- ✅ Lógica simple y clara
- ✅ Backward compatible

---

## 📝 Archivos

- `src/hooks/useBusinessEmployeesForChat.ts` ✅

---

## 🎉 Estado

**Managers ahora no muestran ubicación** ✨

