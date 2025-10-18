# 🛒 Ventas Rápidas - Guía Visual Rápida

## ¿Qué es?
Sistema para registrar ventas de clientes que llegan **sin cita previa** (walk-in) y pagan en el momento.

---

## 🎯 ¿Dónde está?

```
📱 AdminDashboard (Solo Administradores)
   └─ Sidebar
      └─ 🛒 Ventas Rápidas  ← AQUÍ
```

---

## 📝 Formulario de Registro

### Campos:

| Campo | Requerido | Descripción |
|-------|-----------|-------------|
| **Nombre del Cliente** | ✅ Sí | Ej: "Juan Pérez" |
| **Teléfono** | ❌ No | Ej: "3001234567" |
| **Documento** | ❌ No | ⭐ NUEVO: Ej: "1234567890" |
| **Correo** | ❌ No | ⭐ NUEVO: Ej: "cliente@example.com" |
| **Servicio** | ✅ Sí | Dropdown con servicios activos |
| **Sede** | ✅ Sí | ⭐ ACTUALIZADO: Obligatorio, con cache automático |
| **Empleado** | ❌ No | Quien atendió al cliente |
| **Monto** | ✅ Sí | Auto-completado, editable |
| **Método de Pago** | ✅ Sí | 💵 Efectivo / 💳 Tarjeta / 🏦 Transferencia |
| **Notas** | ❌ No | Información adicional |

---

## 📊 Estadísticas (3 Cards)

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Ventas Hoy   │  │ Últimos 7    │  │ Últimos 30   │
│              │  │ Días         │  │ Días         │
│ $150.000 COP │  │ $890.000 COP │  │ $3.200.000   │
└──────────────┘  └──────────────┘  └──────────────┘
```

Se actualizan **automáticamente** después de registrar cada venta.

---

## 📋 Historial de Ventas

Muestra las **últimas 10 ventas** con:
- 👤 Nombre y teléfono del cliente
- 📦 Servicio prestado
- 💰 Monto pagado (destacado en verde)
- 💳 Método de pago (badge)
- 👨‍💼 Empleado que atendió
- 📅 Fecha y hora

---

## ⚡ Flujo Rápido (30 segundos)

```
1. Clic en "Ventas Rápidas" en sidebar
   ↓
2. Ingresar nombre del cliente
   ↓
3. Seleccionar servicio (precio auto-completa)
   ↓
4. Seleccionar método de pago
   ↓
5. Clic en "Registrar Venta"
   ↓
6. ✅ Toast de confirmación
   ↓
7. Estadísticas actualizadas
   ↓
8. Venta en historial
```

---

## 💡 Ejemplo Real: Spa

**Cliente walk-in**: María López llega sin cita y pide un masaje.

```
Nombre: María López
Teléfono: 3001234567
Documento: 1234567890 ⭐ NUEVO
Correo: maria.lopez@gmail.com ⭐ NUEVO
Servicio: Masaje Relajante - $50.000
Sede: Spa Centro (guardada automáticamente) ⭐
Empleado: Ana Gómez (terapeuta)
Método: Efectivo
Notas: Cliente frecuente
```

**Resultado**:
- ✅ Venta registrada en 20 segundos
- ✅ $50.000 sumados a ventas del día
- ✅ Ana Gómez recibe crédito por la venta
- ✅ Venta visible en Contabilidad y Reportes

---

## 🔗 Integración Automática

La venta se refleja en:

- ✅ **Contabilidad** → Transacción tipo "Ingreso"
- ✅ **Reportes** → Gráficos de ingresos
- ✅ **Dashboard** → Estadísticas del negocio
- ✅ **Empleado** → Si se asignó, cuenta para sus comisiones

---

## 🎨 Características UI

- ✅ Tema claro/oscuro
- ✅ Responsive (móvil/tablet/desktop)
- ✅ Toasts de confirmación/error
- ✅ Loading states
- ✅ Auto-completado de precios
- ✅ Validaciones en tiempo real
- ✅ Botón "Limpiar" para resetear formulario
- ✅ ⭐ Cache inteligente de sede (localStorage)
- ✅ ⭐ Campos opcionales para documento y correo del cliente

---

## 🚫 Errores Comunes

### "No veo Ventas Rápidas en sidebar"
**Solución**: Tu rol debe ser **ADMINISTRADOR**, no Employee o Client.

### "Los servicios no cargan"
**Solución**: Verifica que tu negocio tenga servicios activos (`is_active = true`).

### "La sede no se guarda"
**Solución**: ⭐ NUEVO - El sistema ahora usa localStorage. Verifica que tu navegador permita almacenamiento local.

### "Error al registrar venta"
**Solución**: 
1. Verifica conexión a internet
2. Revisa que business_id sea válido
3. Confirma permisos en tabla `transactions`

---

## 📈 Métricas que Puedes Obtener

Después de usar el sistema por un mes:

- 📊 **Total de ventas walk-in** vs ventas con cita
- 👨‍💼 **Empleado más productivo** en ventas directas
- 📦 **Servicio más solicitado** sin cita previa
- 💳 **Método de pago preferido** de clientes walk-in
- ⏰ **Horarios pico** de ventas en mostrador

---

## 🔮 Próximas Mejoras

En futuras versiones:

- [ ] Imprimir recibo de venta
- [ ] Enviar recibo por email/SMS
- [ ] Buscar cliente por teléfono (historial)
- [ ] Aplicar descuentos y promociones
- [ ] Venta de productos (no solo servicios)
- [ ] Integración con facturación electrónica DIAN

---

## ✅ Estado: LISTO PARA USAR

**Fecha**: 18 de Octubre 2025  
**Build**: ✅ Exitoso (17.59s)  
**Rol requerido**: 🔑 ADMINISTRADOR  
**Ubicación**: 📱 AdminDashboard → 🛒 Ventas Rápidas

---

## 🎉 ¡A vender!

El sistema está **100% funcional**. Solo tienes que:

1. Iniciar sesión como Admin
2. Navegar a "Ventas Rápidas"
3. Registrar tu primera venta walk-in

**Tiempo de registro**: ~30 segundos por venta ⚡
