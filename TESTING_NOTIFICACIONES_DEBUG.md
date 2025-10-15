# Testing de Notificaciones - Guía de Debug

## 🔍 Estado Actual

El sistema ha sido instrumentado con logs de debug para identificar por qué no se muestran las notificaciones.

## 📊 Verificaciones en Base de Datos

### ✅ Realtime habilitado
```sql
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
  AND tablename = 'in_app_notifications';
```
**Resultado**: ✅ HABILITADO

### ✅ Notificaciones existentes
```sql
SELECT id, user_id, type, title, message, status, created_at
FROM in_app_notifications
ORDER BY created_at DESC
LIMIT 10;
```
**Resultado**: ✅ 7 notificaciones encontradas
- 6 para Benito (7d6e5432-8885-4008-a8ea-c17bd130cfa6)
- 1 para Jose Luis (e3ed65d8-dd68-4538-a829-e8ebc28edd55)
- Todas con status='unread'

### ✅ Función get_unread_count existe
```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'get_unread_count';
```
**Resultado**: ✅ EXISTE

## 🔧 Logs Agregados

### Hook useInAppNotifications
```typescript
console.log('[useInAppNotifications] 🔍 Fetching notifications for user:', userId)
console.log('[useInAppNotifications] ✅ Fetched', data?.length || 0, 'notifications')
console.log('[useInAppNotifications] 📊 Unread count:', countData)
console.log('[useInAppNotifications] 📡 Subscribing to channel:', channelName)
console.log('[useInAppNotifications] 📡 Channel status:', status)
console.log('[useInAppNotifications] 📡 Realtime event:', payload.eventType)
console.log('[useInAppNotifications] ➕ New notification:', newNotification.title)
```

### Componente NotificationCenter
```typescript
console.log('[NotificationCenter] Rendering with', allNotifications.length, 'notifications, unread:', unreadCount)
```

## 🧪 Instrucciones de Testing

### Paso 1: Abrir Consola del Navegador
1. Abrir Chrome DevTools (F12)
2. Ir a la pestaña "Console"
3. Filtrar por `[useInAppNotifications]` o `[NotificationCenter]`

### Paso 2: Navegar al Dashboard
1. Abrir: http://localhost:5174
2. Login con cualquier usuario:
   - **Benito**: gokuempanadadios@gmail.com (tiene 6 notificaciones pendientes)
   - **Jose Luis**: jlap.11@hotmail.com (tiene 1 notificación pendiente)

### Paso 3: Verificar Logs en Consola

#### ✅ ESPERADO (si funciona correctamente):
```
[useInAppNotifications] 🔍 Fetching notifications for user: 7d6e5432-8885-4008-a8ea-c17bd130cfa6
[useInAppNotifications] ✅ Fetched 6 notifications
[useInAppNotifications] 📊 Unread count: 6
[useInAppNotifications] 📡 Subscribing to channel: in_app_notifications_7d6e5432-8885-4008-a8ea-c17bd130cfa6
[useInAppNotifications] 📡 Channel status: SUBSCRIBED
[NotificationCenter] Rendering with 6 notifications, unread: 6
```

#### ❌ POSIBLES PROBLEMAS:

**A) No aparece ningún log**
- **Causa**: Hook no se está ejecutando
- **Verificar**: 
  - ¿El componente NotificationBell está en el DOM?
  - ¿Se está pasando el userId correctamente?

**B) Log de fetch pero 0 notificaciones**
```
[useInAppNotifications] ✅ Fetched 0 notifications
```
- **Causa**: Query RLS está bloqueando
- **Verificar**: 
  - ¿El userId corresponde al usuario autenticado?
  - ¿Las políticas RLS están correctas?

**C) Log de fetch OK pero unread count = 0**
```
[useInAppNotifications] ✅ Fetched 6 notifications
[useInAppNotifications] ⚠️ Error fetching unread count: [error]
[useInAppNotifications] 📊 Unread count: 0
```
- **Causa**: Función get_unread_count tiene error
- **Solución**: Ver detalles del error en consola

**D) Channel status = CLOSED**
```
[useInAppNotifications] 📡 Channel status: CLOSED
```
- **Causa**: Realtime no conecta
- **Verificar**: 
  - ¿El proyecto Supabase tiene Realtime habilitado?
  - ¿La URL de Supabase es correcta?

### Paso 4: Click en Campana de Notificaciones
1. Click en el icono de campana (🔔)
2. **ESPERADO**: 
   - Se abre popover
   - Se muestran las notificaciones
   - Log adicional: `[NotificationCenter] Rendering with X notifications`

### Paso 5: Enviar Mensaje de Chat
1. Abrir 2 navegadores
2. Nav 1: Login como Jose Luis
3. Nav 2: Login como Benito
4. Nav 1: Enviar mensaje de chat
5. **ESPERADO en Nav 2**:
   ```
   [useInAppNotifications] 📡 Realtime event: INSERT
   [useInAppNotifications] ➕ New notification: Jose Luis Avila te envió un mensaje
   [NotificationCenter] Rendering with 7 notifications, unread: 7
   ```
   - Badge de campana aumenta (+1)
   - Toast notification aparece
   - Sonido se reproduce 🔊

## 🐛 Diagnóstico por Logs

### Escenario 1: Hook no se ejecuta
**Síntoma**: No aparece ningún log de `[useInAppNotifications]`

**Causa posible**:
- NotificationBell no está renderizado
- userId es undefined/null

**Verificar en Elements (DevTools)**:
```html
<!-- Buscar este elemento -->
<button class="..." aria-label="Notificaciones">
  <svg><!-- Bell icon --></svg>
</button>
```

**Fix**:
- Verificar que UnifiedLayout incluye `<NotificationBell userId={user.id} />`
- Verificar que `user.id` no es null

### Escenario 2: Fetch retorna 0 notificaciones
**Síntoma**: 
```
[useInAppNotifications] ✅ Fetched 0 notifications
```

**Causa posible**:
- RLS bloquea acceso
- userId no coincide con auth.uid()

**Verificar en Supabase Dashboard**:
1. SQL Editor → Ejecutar:
```sql
-- Verificar usuario autenticado
SELECT auth.uid();

-- Verificar notificaciones para ese usuario
SELECT * FROM in_app_notifications 
WHERE user_id = auth.uid();
```

**Fix**:
- Revisar políticas RLS
- Verificar que el usuario está correctamente autenticado

### Escenario 3: Realtime no conecta
**Síntoma**:
```
[useInAppNotifications] 📡 Channel status: CLOSED
```

**Causa posible**:
- Realtime no habilitado en proyecto Supabase
- URL/Key de Supabase incorrecta
- Firewall/Proxy bloqueando WebSocket

**Verificar**:
1. Supabase Dashboard → Settings → API
2. Verificar que Realtime está enabled
3. Verificar URL en `.env`:
```
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

**Fix**:
- Habilitar Realtime en Dashboard
- Verificar variables de entorno
- Probar conexión WebSocket

### Escenario 4: Notificaciones fetched pero no se muestran
**Síntoma**:
```
[useInAppNotifications] ✅ Fetched 6 notifications
[NotificationCenter] Rendering with 0 notifications, unread: 6
```

**Causa posible**:
- Filtro en NotificationCenter está excluyendo todas
- Tab activo no coincide con tipo de notificaciones

**Verificar**:
- Tab actual (default: 'unread')
- Tipo de notificaciones (todas son 'chat_message')
- Filtro en línea ~220 de NotificationCenter.tsx

**Fix**:
- Cambiar tab a 'all'
- Revisar lógica de filtro

## 📋 Checklist de Diagnóstico

- [ ] **Backend**
  - [ ] Realtime habilitado en tabla
  - [ ] Notificaciones existen en DB
  - [ ] Función get_unread_count existe
  - [ ] Políticas RLS correctas

- [ ] **Frontend - Renderizado**
  - [ ] NotificationBell aparece en DOM
  - [ ] userId se pasa correctamente
  - [ ] Hook se ejecuta (ver logs)

- [ ] **Frontend - Fetch**
  - [ ] Log de fetch aparece
  - [ ] Fetch retorna > 0 notificaciones
  - [ ] Unread count > 0

- [ ] **Frontend - Realtime**
  - [ ] Channel status = SUBSCRIBED
  - [ ] Al enviar mensaje, evento INSERT se detecta
  - [ ] Notificación se agrega a lista

- [ ] **Frontend - UI**
  - [ ] Badge muestra contador
  - [ ] Click abre popover
  - [ ] Lista muestra notificaciones
  - [ ] Click en notificación navega correctamente

## 🎯 Próximos Pasos

1. **Ejecutar testing con logs**
2. **Copiar logs de consola**
3. **Identificar en qué punto falla**
4. **Aplicar fix correspondiente**

---

## 📝 Servidor Activo

- **Puerto**: 5174 (5173 estaba ocupado)
- **URL**: http://localhost:5174
- **Logs**: Visibles en consola del navegador

Abre la aplicación, login con Benito, y copia los logs que aparecen en consola.
