# Ejemplos Prácticos - Reglas de Creación de Citas

**Escenarios reales y cómo se comporta el sistema**

---

## 📅 Escenario 1: Cliente intenta reservar para HOJA (Hoy)

**Hora actual**: 10:30 AM

### ✅ Horarios PERMITIDOS
```
11:45 AM ✅ DISPONIBLE
  └─ Diferencia: 75 minutos... NO, espera
  └─ Diferencia: 75 minutos < 90 minutos
  └─ DESHABILITADO ❌

12:00 PM ✅ DISPONIBLE
  └─ Diferencia: 90 minutos == 90 minutos
  └─ PERMITIDO ✅
  └─ Botón activo, cliente puede hacer clic

1:00 PM ✅ DISPONIBLE
  └─ Diferencia: 150 minutos > 90 minutos
  └─ PERMITIDO ✅
  └─ Botón activo

2:00 PM ✅ DISPONIBLE
  └─ Diferencia: 210 minutos > 90 minutos
  └─ PERMITIDO ✅
  └─ Botón activo
```

### ❌ Horarios BLOQUEADOS
```
10:30 AM ❌ DESHABILITADO
  └─ Diferencia: 0 minutos < 90 minutos
  └─ Botón deshabilitado (opacity-40, cursor-not-allowed)

10:45 AM ❌ DESHABILITADO
  └─ Diferencia: 15 minutos < 90 minutos
  └─ Botón deshabilitado

11:00 AM ❌ DESHABILITADO
  └─ Diferencia: 30 minutos < 90 minutos
  └─ Botón deshabilitado

11:30 AM ❌ DESHABILITADO
  └─ Diferencia: 60 minutos < 90 minutos
  └─ Botón deshabilitado

11:45 AM ❌ DESHABILITADO
  └─ Diferencia: 75 minutos < 90 minutos
  └─ Botón deshabilitado
```

### UI Mostrada al Usuario
```
┌─────────────────────────────────────────────────────┐
│ ℹ️ Para citas el mismo día, solo están disponibles │
│    horarios con al menos 90 minutos de anticipación │
└─────────────────────────────────────────────────────┘

9:00 AM  [BUTTON: DISABLED opacity-40]
10:00 AM [BUTTON: DISABLED opacity-40]
11:00 AM [BUTTON: DISABLED opacity-40]
11:30 AM [BUTTON: DISABLED opacity-40]
11:45 AM [BUTTON: DISABLED opacity-40]
12:00 PM [BUTTON: ENABLED ✓]
1:00 PM  [BUTTON: ENABLED ✓]
2:00 PM  [BUTTON: ENABLED ✓]
3:00 PM  [BUTTON: ENABLED ✓]
4:00 PM  [BUTTON: ENABLED ✓]
5:00 PM  [BUTTON: ENABLED ✓]
```

---

## 📅 Escenario 2: Cliente intenta reservar para MAÑANA

**Hora actual**: 10:30 AM  
**Fecha seleccionada**: Mañana (19 de octubre)

### ✅ TODOS los horarios disponibles
```
9:00 AM  [BUTTON: ENABLED ✓]
  └─ No es hoy → Regla de 90 min NO aplica
  
10:00 AM [BUTTON: ENABLED ✓]
  └─ No es hoy → Regla de 90 min NO aplica
  
11:00 AM [BUTTON: ENABLED ✓]
  └─ No es hoy → Regla de 90 min NO aplica
  
... todos los horarios hasta 5:00 PM ✓
```

### UI Mostrada al Usuario
```
┌─────────────────────────────────────────────────────┐
│ Disponible el 19 de Octubre                         │
│                                                     │
│ (NO aparece el aviso de 90 minutos porque no es   │
│  para hoy)                                          │
└─────────────────────────────────────────────────────┘

9:00 AM  [BUTTON: ENABLED ✓]
10:00 AM [BUTTON: ENABLED ✓]
11:00 AM [BUTTON: ENABLED ✓]
12:00 PM [BUTTON: ENABLED ✓]
1:00 PM  [BUTTON: ENABLED ✓]
2:00 PM  [BUTTON: ENABLED ✓]
3:00 PM  [BUTTON: ENABLED ✓]
4:00 PM  [BUTTON: ENABLED ✓]
5:00 PM  [BUTTON: ENABLED ✓]
```

---

## 📅 Escenario 3: Admin crea cita manualmente (AppointmentForm)

**Rol**: Admin  
**Ubicación**: Dashboard → Crear Cita

### Validaciones que se aplican
```
1. Nombre del cliente: REQUERIDO
   └─ Si está vacío → Error: "El nombre del cliente es requerido"

2. Fecha: REQUERIDO
   └─ Si está vacía → Error: "La fecha es requerida"
   └─ No puede ser fecha pasada (picker deshabilitado)

3. Hora de inicio: REQUERIDO
   └─ Si está vacía → Error: "La hora de inicio es requerida"

4. Servicio: REQUERIDO
   └─ Si está vacío → Error: "La selección de servicio es requerida"

5. Hora de fin CALCULADA AUTOMÁTICAMENTE
   └─ Se calcula usando duración del servicio
   └─ Ejemplo: Inicio 2:00 PM + Servicio 60min = Fin 3:00 PM

6. Validación: Hora de fin debe ser después de hora de inicio
   └─ Si startDateTime >= endDateTime
   └─ Error: "Rango de tiempo inválido"

7. Validación: Debe ser fecha futura
   └─ Si startDateTime < new Date()
   └─ Error: "La hora de la cita debe ser en el futuro"
   └─ NOTA: Esta validación ANULA la regla de 90 minutos
            porque el admin es quien crea, no el cliente
```

### Diferencia importante: Admin vs Cliente
```
CLIENTE (via Wizard):
  ├─ Para hoy: Mínimo 90 minutos
  ├─ Para futuros: Sin restricción de tiempo
  └─ UI: Slots deshabilitados visibles

ADMIN (AppointmentForm):
  ├─ Puede crear cita en el futuro (sin límite de minutos)
  ├─ NO ve slots hora a hora
  ├─ Selecciona hora directamente
  └─ Validación: startDateTime < new Date()
                 (solo que sea en el futuro)
```

---

## 🔴 Escenario 4: Errores Comunes

### Error 1: Intenta crear cita con fecha pasada
```
Usuario selecciona: 17 de octubre 2025 (ayer)
Calendario: BLOQUEADO - No permite hacer clic en fechas pasadas

Si logra enviar manualmente:
❌ Error: "La hora de la cita debe ser en el futuro"
```

### Error 2: Hora de fin no es mayor que hora de inicio
```
Usuario selecciona:
  - Inicio: 2:00 PM
  - Fin: 2:00 PM (misma hora)

❌ Error: "Rango de tiempo inválido"

Usuario selecciona:
  - Inicio: 3:00 PM
  - Fin: 2:00 PM (fin antes que inicio)

❌ Error: "Rango de tiempo inválido"
```

### Error 3: Intenta reservar para hoy a menos de 90 minutos
```
Hora actual: 2:15 PM

Usuario intenta reservar: 3:00 PM (45 minutos después)
  - Diferencia: 45 minutos < 90 minutos
  - Botón: DESHABILITADO (opacity-40, not-allowed)
  - No puede hacer clic

Debe esperar hasta: 3:45 PM para que 4:00 PM esté disponible
O directamente seleccionar 4:00 PM ahora
```

---

## ⏰ Cálculo Detallado del Tiempo

### Fórmula del sistema
```
minutesDifference = (slotHour * 60) - (currentHour * 60 + currentMinute)

Ejemplos:
─────────────────────────────────────────────────────

Hora actual: 10:30 AM
Slot: 12:00 PM (mediodía)

  slotHour = 12
  currentHour = 10
  currentMinute = 30

  slotMinutes = 12 * 60 = 720
  nowMinutes = 10 * 60 + 30 = 630
  minutesDifference = 720 - 630 = 90 ✓ DISPONIBLE (>=90)

─────────────────────────────────────────────────────

Hora actual: 10:35 AM
Slot: 12:00 PM

  slotMinutes = 720
  nowMinutes = 10 * 60 + 35 = 635
  minutesDifference = 720 - 635 = 85 ❌ NO DISPONIBLE (<90)

─────────────────────────────────────────────────────

Hora actual: 3:45 PM
Slot: 5:00 PM

  slotHour = 17
  currentHour = 15
  currentMinute = 45

  slotMinutes = 17 * 60 = 1020
  nowMinutes = 15 * 60 + 45 = 945
  minutesDifference = 1020 - 945 = 75 ❌ NO DISPONIBLE (<90)

─────────────────────────────────────────────────────

Hora actual: 3:30 PM
Slot: 5:00 PM

  slotMinutes = 1020
  nowMinutes = 15 * 60 + 30 = 930
  minutesDifference = 1020 - 930 = 90 ✓ DISPONIBLE (>=90)
```

---

## 📊 Tabla Resumen

| Escenario | Regla Aplicada | Resultado | UI |
|-----------|----------------|-----------|-----|
| Cliente hoy - 45 min después | 90 min mínimo | ❌ Bloqueado | Botón disabled |
| Cliente hoy - 90 min después | 90 min mínimo | ✅ Permitido | Botón enabled |
| Cliente hoy - 150 min después | 90 min mínimo | ✅ Permitido | Botón enabled |
| Cliente mañana - cualquier hora | No aplica | ✅ Permitido | Botón enabled |
| Admin - 10 min después | Solo futuro | ❌ Error al guardar | Toast error |
| Admin - mañana 9:00 AM | Solo futuro | ✅ Permitido | Guarda exitosa |
| Cualquiera - fecha pasada | Futuro requerido | ❌ Bloqueado | Calendario disabled |

---

## 🎯 Punto Clave: ¿Por qué 90 minutos?

**Lógica de negocio**:
- **30 minutos**: Muy poco para preparación
- **60 minutos**: Estándar, pero ajustado
- **90 minutos**: Permite suficiente margen para:
  - Cambios de último minuto
  - Preparación del empleado
  - Buffer de seguridad si algo falla
  - Comunicación con el cliente

**Puede cambiar a**:
- 60 minutos: Más rápido, servicios ágiles
- 120 minutos: Más seguro, servicios complejos
- Variable: Según tipo de servicio

---

## 📞 Casos Reales

### Caso 1: Salón de Belleza
```
Cliente llama a las 2:00 PM: "¿Puedo venir ahora?"
Sistema responde:
  - Hora actual: 2:00 PM
  - Próximo slot disponible hoy: 3:30 PM (90 min después)
  - Clientes para mañana: Disponible desde 9:00 AM
  
✓ Esto es correcto: Da tiempo para:
  - Avisar al estilista
  - Preparar estación
  - Terminar cliente anterior
```

### Caso 2: Consultoría Online
```
Cliente: "¿Consulta urgente hoy a las 3:15 PM?"
Sistema responde:
  - Hora actual: 2:00 PM
  - Diferencia: 75 minutos < 90 minutos
  - Slot bloqueado
  
Alternativas:
  - Próximo disponible: 3:30 PM (90 min después)
  - O mañana desde 9:00 AM
  
✓ Correcto para consultoría (prep, docs, etc.)
```

---

**Conclusión**: El sistema está bien diseñado para proteger tanto a clientes como a negocios. La regla de 90 minutos es prudente y escalable.
