# Testing Manual: Chat Modal v3.0.0

## 🧪 Guía de Testing

### **Escenario 1: Owner abre el modal**

**Setup**:
1. Login como: `owner@gestabiz.demo`
2. Ir a tu negocio: "Belleza y Estética Pro Girardot"
3. Buscar el botón "Chatear" en el modal de perfil público

**Pasos**:
1. Click en "Chatear"
2. Se abre `ChatWithAdminModal`

**Validaciones**:
- ✅ Header dice: "Administrador de Belleza y Estética Pro Girardot"
- ✅ Aparece tu card: [Avatar] + "Nombre" + "email"
- ✅ Aparece mensaje: "Como administrador de... puedes iniciar conversación"
- ✅ **NO aparece lista de sedes**
- ✅ **NO aparece lista de empleados**
- ✅ Aparece botón: "💬 Chatear"
- ✅ Click en botón: Abre conversación, muestra toast "Conversación iniciada"

**Screenshot esperado**:
```
┌─────────────────────────────────────────┐
│ ✕  Iniciar Chat                         │
│    Administrador de Belleza y Estética  │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ [DR] Daniela Rodríguez              ││
│  │      daniela.rodriguez@gestabiz.demo││
│  └─────────────────────────────────────┘│
│                                         │
│  Como administrador de Belleza y       │
│  Estética Pro Girardot, puedes         │
│  iniciar una conversación directamente.│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │   💬 Chatear                        ││
│  └─────────────────────────────────────┘│
│                                         │
└─────────────────────────────────────────┘
```

**Estado**: ✅ LISTO PARA TESTEAR

---

### **Escenario 2: Cliente abre modal con empleados disponibles**

**Setup**:
1. Login como: `client@gestabiz.demo`
2. Buscar negocio: "Belleza y Estética Pro Girardot"
3. Ver perfil público
4. Scroll down al perfil
5. Click en "Chatear"

**Pasos**:
1. Se abre `ChatWithAdminModal`

**Validaciones**:
- ✅ Header dice: "Empleados disponibles de Belleza y Estética..."
- ✅ Se muestra: "Empleados disponibles (N)" donde N es el número
- ✅ Cada empleado muestra:
  - [Avatar]
  - [Nombre del empleado]
  - "-" [Nombre de la sede]
  - Email
  - Botón "💬 Chatear"
- ✅ **NO aparece lista de sedes**
- ✅ Click en "Chatear" de un empleado → Abre chat con ese empleado (no con el owner)

**Screenshot esperado**:
```
┌────────────────────────────────────────────┐
│ ✕  Iniciar Chat                            │
│    Empleados disponibles de Belleza        │
├────────────────────────────────────────────┤
│ Empleados disponibles (3)                  │
│                                            │
│ ┌──────────────────────────────────────────┐│
│ │ [JG]  Juan García - Sede Centro        ││
│ │       juan.garcia@gestabiz.demo         ││
│ │                    [💬 Chatear]         ││
│ └──────────────────────────────────────────┘│
│                                            │
│ ┌──────────────────────────────────────────┐│
│ │ [MC]  María Cortés - Sede Este         ││
│ │       maria.cortes@gestabiz.demo        ││
│ │                    [💬 Chatear]         ││
│ └──────────────────────────────────────────┘│
│                                            │
│ ┌──────────────────────────────────────────┐│
│ │ [PL]  Pedro López - Sede Express       ││
│ │       pedro.lopez@gestabiz.demo         ││
│ │                    [💬 Chatear]         ││
│ └──────────────────────────────────────────┘│
│                                            │
└────────────────────────────────────────────┘
```

**Interacción**:
- Hover en un employee card: Se ve efecto shadow
- Click "Chatear": Button muestra spinner + "Iniciando..."
- Toast: "Chat iniciado con Juan García"
- Modal cierra automáticamente
- Chat window se abre con Juan García

**Estado**: ✅ LISTO PARA TESTEAR

---

### **Escenario 3: Cliente abre modal sin empleados disponibles**

**Setup**:
1. Crear un negocio sin empleados (o todos con `allow_client_messages = false`)
2. Login como cliente
3. Abrir perfil público del negocio
4. Click "Chatear"

**Validaciones**:
- ✅ Se muestra: "No hay empleados disponibles para chatear en este momento"
- ✅ NO aparece lista vacía
- ✅ NO hay errores en console
- ✅ Modal sigue abierto sin crashes

**Screenshot esperado**:
```
┌────────────────────────────────────────────┐
│ ✕  Iniciar Chat                            │
│    Empleados disponibles de [Negocio]      │
├────────────────────────────────────────────┤
│                                            │
│           💬                               │
│                                            │
│  No hay empleados disponibles para         │
│  chatear en este momento.                  │
│                                            │
│                                            │
└────────────────────────────────────────────┘
```

**Estado**: ✅ LISTO PARA TESTEAR

---

### **Escenario 4: Error en carga (error de conexión)**

**Setup**:
1. Desconectar WiFi O
2. Simular error de API en dev tools

**Validaciones**:
- ✅ Se muestra mensaje de error
- ✅ Aparece botón "Reintentar"
- ✅ No hay crashes

**Screenshot esperado**:
```
┌────────────────────────────────────────────┐
│ ✕  Iniciar Chat                            │
├────────────────────────────────────────────┤
│                                            │
│       Error al cargar los datos            │
│                                            │
│       [Reintentar]                         │
│                                            │
│                                            │
└────────────────────────────────────────────┘
```

**Estado**: ✅ LISTO PARA TESTEAR

---

### **Escenario 5: Loading state**

**Setup**:
1. Red lenta (throttle en dev tools a 3G)
2. Abrir modal

**Validaciones**:
- ✅ Se muestra spinner de carga
- ✅ Spinner rota suavemente
- ✅ Botones disabled durante carga
- ✅ Carga se completa en < 3 segundos

**Estado**: ✅ LISTO PARA TESTEAR

---

## 🎯 Checklist de Testing

### **Funcionalidad**
- [ ] Owner ve botón directo "Chatear"
- [ ] Cliente ve lista de empleados
- [ ] Cada empleado muestra: Avatar + Nombre - Sede + Email + Botón
- [ ] No aparecen sedes en listado
- [ ] Click "Chatear" inicia conversación
- [ ] Toast notificaciones funcionan
- [ ] Modal cierra después de iniciar chat
- [ ] Error handling funciona

### **UI/UX**
- [ ] Modal responsive en mobile
- [ ] Avatar fallbacks funcionan (si no hay imagen)
- [ ] Colores de tema se aplican
- [ ] Loading spinner visible
- [ ] Botones tienen estados hover
- [ ] Header legible
- [ ] No hay text overflow

### **Rendimiento**
- [ ] Modal abre rápido (< 1s)
- [ ] Lista de empleados renderiza sin lag
- [ ] Buttons responden al click
- [ ] No hay memory leaks en dev tools

### **Compatibilidad**
- [ ] Chrome latest
- [ ] Firefox latest
- [ ] Safari latest
- [ ] Mobile Safari
- [ ] Mobile Chrome

---

## 🔧 Debugging Tips

### **Si Owner ve lista de empleados**
```
1. Verificar: user?.id === admin.user_id
   Debug: Add console.log in component
   
2. Check useAuth() returns correct user
   
3. Verify admin object has user_id field
```

### **Si Cliente ve lista de sedes (comportamiento anterior)**
```
1. Verificar que useBusinessEmployeesForChat esté importado
2. Verificar que hook retorna employees array
3. Ejecutar query en Supabase directamente:
   SELECT * FROM business_employees 
   WHERE business_id = 'xxx' 
   AND allow_client_messages = true
```

### **Si no ve ningún empleado**
```
1. Verificar migraciones aplicadas:
   - 20251019000000_add_allow_client_messages.sql
   
2. Verificar que empleados tienen allow_client_messages = true:
   SELECT * FROM business_employees 
   WHERE allow_client_messages = false
   
3. Habilitar el flag en BD o Settings UI
```

### **Si botón "Chatear" no funciona**
```
1. Verificar user?.id está definido (login correcto)
2. Verificar createOrGetConversation no tiene errores
3. Check console para stack trace
4. Verificar policies RLS en conversaciones
```

---

## 📊 Métricas de Éxito

| Métrica | Expected | Actual |
|---------|----------|--------|
| Owner ve solo botón | ✅ | ⬜ |
| Cliente ve empleados | ✅ | ⬜ |
| Prompt para iniciar chat | < 1000ms | ⬜ |
| Loading visible | Siempre | ⬜ |
| Error handling | Completo | ⬜ |
| Mobile responsive | Sí | ⬜ |

---

## 📝 Notas para QA

- Este es el flujo completo del chat modal
- La versión anterior mostraba sedes, esta muestra empleados
- Owner nunca ve empleados, siempre ve botón directo
- Cada chat es con un empleado específico, no con el owner
- El hook `useBusinessEmployeesForChat` filtra automáticamente

---

## 🚀 Deployment Checklist

- [ ] Código compilado sin errores: `npm run build`
- [ ] Type-check pasado: `npm run type-check`
- [ ] Lint pasado: `npm run lint`
- [ ] Tests pasados (si aplica)
- [ ] Manual testing completado
- [ ] QA sign-off
- [ ] Documentación actualizada
- [ ] Ready para merge a main

