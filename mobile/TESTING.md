# Guía de Testing - Gestabiz Mobile

## Testing Manual

### 1. Login y Autenticación ✅

**Flujo**:
1. Abrir app móvil
2. Iniciar sesión con credenciales válidas
3. Verificar que se redirige al dashboard correcto según rol

**Verificar**:
- [ ] Sesión persiste al cerrar y abrir la app
- [ ] Token de Supabase se guarda en SecureStore
- [ ] Push notification token se registra automáticamente
- [ ] Usuario puede cambiar de rol desde el header

---

### 2. Navegación por Tabs ✅

**Flujo**:
1. Usuario autenticado ve tabs según rol activo
2. Cambiar entre tabs (Client, Employee, Admin)
3. Verificar que WebView carga contenido correcto

**Verificar por Rol**:

**Client**:
- [ ] Tab "Buscar" → Muestra SearchBar y resultados
- [ ] Tab "Citas" → Calendario de citas
- [ ] Tab "Notificaciones" → Lista de notificaciones
- [ ] Tab "Chat" → Conversaciones
- [ ] Tab "Ajustes" → Configuración

**Employee**:
- [ ] Tab "Empleado" → Dashboard con employments, vacancies, absences
- [ ] Tab "Notificaciones" → Notificaciones filtradas por rol
- [ ] Tab "Chat" → Chat con clientes (si allow_client_messages=true)
- [ ] Tab "Ajustes" → Configuración de empleado

**Admin**:
- [ ] Tab "Panel Admin" → Dashboard completo con estadísticas
- [ ] Tab "Notificaciones" → Todas las notificaciones del negocio
- [ ] Tab "Chat" → Chat con empleados y clientes
- [ ] Tab "Ajustes" → Configuración del negocio

---

### 3. Funcionalidad de Booking ✅

**Flujo**:
1. Client → Tab "Buscar"
2. Buscar negocio/servicio
3. Abrir perfil público
4. Clic "Reservar"
5. Completar wizard (7 pasos)

**Verificar las 5 validaciones críticas**:
- [ ] **Horarios de sede**: Slots fuera de `opens_at`/`closes_at` deshabilitados
- [ ] **Hora de almuerzo**: Slots en `lunch_break_start/end` deshabilitados con tooltip
- [ ] **Citas ocupadas**: Slots con overlap muestran "Ocupado"
- [ ] **Ausencias aprobadas**: Empleado ausente → slots bloqueados
- [ ] **Festivos públicos**: Colombia holidays → slots bloqueados

**Resultado esperado**:
- [ ] Cita se crea correctamente
- [ ] Email de confirmación enviado
- [ ] Notificación in-app recibida
- [ ] Cita aparece en calendario

---

### 4. Chat en Tiempo Real ✅

**Flujo**:
1. Abrir Tab "Chat"
2. Seleccionar conversación
3. Enviar mensaje
4. Verificar que llega en tiempo real

**Verificar**:
- [ ] Mensajes se envían instantáneamente
- [ ] Mensajes se reciben sin recargar
- [ ] Badge de mensajes no leídos se actualiza
- [ ] Al abrir chat, notificaciones de ese chat se suprimen

---

### 5. Notificaciones Push (Dispositivo Físico) ⚠️

**Pre-requisito**: Solo funciona en dispositivos físicos (NO emuladores)

**Flujo**:
1. Iniciar sesión en dispositivo físico
2. Verificar en Supabase que token se guardó en `user_push_tokens`
3. Enviar notificación test desde Supabase o backend
4. Tocar notificación → navegar a pantalla correcta

**Tipos a probar**:
- [ ] `appointment_confirmed` → Navega a /(tabs)/appointments
- [ ] `chat_message` → Navega a chat conversation específica
- [ ] `employee_request` → Navega a /(tabs)/admin
- [ ] `absence_approved` → Navega a /(tabs)/employee

---

### 6. Deep Linking 🔗

**Flujo**:
```bash
# Desde terminal (con app corriendo)
npx uri-scheme open "gestabiz://app/client" --ios
npx uri-scheme open "gestabiz://app/admin" --android
```

**Verificar**:
- [ ] App abre en la ruta correcta
- [ ] Cambio de rol automático si es necesario
- [ ] Estado de la app se mantiene

---

### 7. Cambio de Idioma 🌐

**Flujo**:
1. Tab "Ajustes" → Idioma
2. Cambiar entre Español e Inglés
3. Verificar que toda la UI cambia

**Verificar**:
- [ ] Tabs cambian de nombre
- [ ] Contenido web cambia de idioma
- [ ] Toasts y alertas en idioma correcto
- [ ] Persiste al cerrar y abrir app

---

### 8. Ausencias y Vacaciones 🏖️

**Flujo (Employee)**:
1. Tab "Empleado"
2. Widget "Balance de Vacaciones"
3. Clic "Solicitar Ausencia"
4. Llenar formulario con rangos de fechas
5. Enviar solicitud

**Verificar**:
- [ ] Admins reciben notificación in-app
- [ ] Admins reciben email
- [ ] Modal de ausencia muestra range highlighting en calendarios
- [ ] Balance se actualiza al aprobar

**Flujo (Admin)**:
1. Tab "Panel Admin" → "Ausencias"
2. Ver solicitudes pendientes
3. Aprobar/Rechazar

**Verificar**:
- [ ] Empleado recibe notificación
- [ ] Slots de citas se bloquean automáticamente
- [ ] Si es emergencia → citas canceladas + clientes notificados

---

### 9. Vacantes Laborales 💼

**Flujo (Admin)**:
1. Tab "Panel Admin" → "Reclutamiento"
2. Crear nueva vacante
3. Publicar

**Flujo (Employee)**:
1. Tab "Empleado" → "Vacantes Disponibles"
2. Ver vacantes del marketplace
3. Aplicar con CV

**Verificar**:
- [ ] Admin recibe notificación de aplicación
- [ ] Matching score se calcula automáticamente
- [ ] Admin puede aceptar/rechazar
- [ ] Review obligatoria al contratar/finalizar

---

### 10. Billing y Pagos 💳

**Flujo**:
1. Tab "Panel Admin" → "Facturación"
2. Ver uso actual (citas, empleados, sedes)
3. Cambiar plan (Free → Inicio → Pro)
4. Checkout via WebView o deep link

**Verificar**:
- [ ] Stripe/PayU/MercadoPago checkout funciona
- [ ] Webhook actualiza suscripción en Supabase
- [ ] Límites del plan se aplican correctamente

---

## Testing Automatizado (Futuro)

### Detox E2E Tests

```bash
# iOS
npm run test:e2e:ios

# Android
npm run test:e2e:android
```

**Cobertura planificada**:
- [ ] Login flow
- [ ] Role switching
- [ ] Appointment booking wizard
- [ ] Chat real-time
- [ ] Notifications navigation

---

## Performance Testing

### Métricas a Monitorear

**WebView Loading**:
- [ ] Tiempo de carga inicial < 2s
- [ ] Navegación entre tabs < 500ms
- [ ] Session injection < 100ms

**Memory**:
- [ ] Sin memory leaks en subscriptions
- [ ] WebView cache limitado < 50MB
- [ ] App size < 100MB

**Battery**:
- [ ] Sin drain excesivo por subscriptions
- [ ] Background tasks optimizados

---

## Checklist Pre-Release

- [ ] Todos los flows manuales pasados
- [ ] Push notifications probadas en físico
- [ ] Deep linking funciona en ambas plataformas
- [ ] Sin crashes en 24h de uso continuo
- [ ] Performance aceptable en dispositivos de gama baja
- [ ] Build de producción (EAS) exitoso
- [ ] Screenshots para stores (iOS/Android)
- [ ] Privacy policy y términos actualizados

---

## Errores Comunes y Soluciones

### "WebView blank screen"
**Causa**: Web app no accesible
**Solución**: Verificar que web app esté corriendo en localhost:5173

### "Session not found"
**Causa**: Token no se inyectó correctamente
**Solución**: Logout → Login nuevamente

### "Push notifications not received"
**Causa**: Solo funcionan en físicos
**Solución**: Probar en iPhone/Android físico, no emulador

### "Deep link not working"
**Causa**: Scheme no registrado
**Solución**: Rebuild con `npx expo prebuild --clean`

---

## Próximos Pasos

1. ✅ Testing manual completo
2. ⏳ Detox E2E setup
3. ⏳ Performance profiling
4. ⏳ Beta testing con usuarios reales
5. ⏳ Release a TestFlight/Play Store Beta


