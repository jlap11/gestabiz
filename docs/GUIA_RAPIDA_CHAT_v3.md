# GUÍA RÁPIDA: Chat Modal v3.0.0

## 📋 ¿Qué cambió?

### Antes (v2.2.0)
```
Usuario abre modal "Chatear"
           ↓
Veía: LISTA DE SEDES
- Sede Centro
- Sede Este
- Sede Express
- Sede Mall
```

### Ahora (v3.0.0)
```
Usuario abre modal "Chatear"
           ↓
Veía: LISTA DE EMPLEADOS ← CAMBIO PRINCIPAL
- Juan García - Sede Centro
- María Cortés - Sede Este
- Pedro López - Sede Express
- Rosa López - Sede Mall
```

---

## 🎯 Flujos

### **Si eres OWNER (El dueño del negocio)**
```
Tu flujo NO cambió:
1. Abres tu negocio
2. Click "Chatear"
3. Ves tu card + botón "Chatear" directo
4. Click → Conversación
```

### **Si eres CLIENTE (Buscas servicios)**
```
Tu flujo CAMBIÓ:
1. Buscas un negocio
2. Ves perfil público
3. Click "Chatear"
4. Ves EMPLEADOS del negocio (antes: sedes)
5. Eliges con quién hablar: Juan, María, Pedro, etc.
6. Click "Chatear" → Conversación con ese empleado
```

---

## 💻 Código Affected

**Archivo Modificado**:
```
src/components/business/ChatWithAdminModal.tsx
```

**Cambios**:
- `v2.2.0` → `v3.0.0` (upgrade de versión)
- Imports: Agregado `useBusinessEmployeesForChat`
- Lógica: Cambio de renderizar sedes → empleados
- Handler: Actualizado para chatear con empleado específico

---

## 🧪 Probalo Así

### **Test 1: Como Owner**
```bash
1. npm run dev
2. Login: owner@gestabiz.demo / password
3. Ir a "Belleza y Estética Pro Girardot"
4. Click en "Chatear"
5. Resultado esperado:
   ✅ Ves tu información (Daniela Rodríguez)
   ✅ Ves botón "Chatear"
   ✅ NO ves lista de sedes
   ✅ NO ves lista de empleados
```

### **Test 2: Como Cliente**
```bash
1. npm run dev
2. Login: client@gestabiz.demo / password
3. Buscar "Belleza y Estética Pro Girardot"
4. Click "Chatear" en el modal
5. Resultado esperado:
   ✅ Ves "Empleados disponibles (N)"
   ✅ Ves lista: Juan - Sede A, María - Sede B, etc
   ✅ NO ves lista de sedes
```

---

## 🔗 Relacionados

| Documento | Propósito |
|-----------|-----------|
| `FIX_CHAT_MODAL_EMPLOYEES_v3.md` | 📖 Documentación técnica detallada |
| `TESTING_CHAT_MODAL_v3.md` | 🧪 Casos de testing exhaustivos |
| `RESUMEN_CHAT_MODAL_v3.md` | 📊 Resumen ejecutivo |
| `FEATURE_EMPLOYEE_MESSAGE_PREFERENCES.md` | 💼 Feature original (Allow messages) |

---

## ✨ Ventajas

✅ Chats personalizados (con empleado, no admin)  
✅ Clientes ven empleados reales (con foto + nombre)  
✅ Empleados controlan si reciben mensajes  
✅ Interfaz más clara (empleados vs sedes)  
✅ Sin migraciones DB nuevas  
✅ Retrocompatible  

---

## ⚠️ Notas

- **Owner Flow**: Idéntico a antes
- **Client Flow**: Cambio de sedes → empleados
- **Base de Datos**: Usa columna existente `allow_client_messages`
- **Performance**: Mejor (filtrado en BD)

---

## 🆘 Si algo falla

### "No veo empleados"
```
1. Verificar: Settings → Preferencias Empleado → "Mensajes de Clientes" ON
2. O ejecutar en Supabase:
   UPDATE business_employees 
   SET allow_client_messages = true 
   WHERE business_id = 'xxx';
3. Recarga el navegador
```

### "Sigo viendo sedes"
```
1. Verificar que useBusinessEmployeesForChat está importado
2. Check browser console para errores
3. Reinicia: npm run dev
```

### "No veo lista vacía cuando no hay empleados"
```
✓ Correcto: Muestra "No hay empleados disponibles"
✗ Incorrecto: Muestra lista vacía o error
```

---

## 📞 Soporte Técnico

**Cambio Técnico**: `ChatWithAdminModal.tsx` line 82-92  
**Hook Clave**: `useBusinessEmployeesForChat()`  
**Filter DB**: `allow_client_messages = true`  
**Query Supabase**: `SELECT * FROM business_employees WHERE allow_client_messages = true`

