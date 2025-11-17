# Guía Rápida de Testing - Sistema de Permisos

## 🎯 OBJETIVO

Validar que los 25 módulos protegidos con PermissionGate funcionan correctamente.

**Tiempo Estimado**: 2-3 horas  
**Método**: Testing manual con Chrome  
**Cobertura**: 79 tipos de permisos, 65 escenarios  

---

## ⚡ PREPARACIÓN (5 MINUTOS)

### 1. Verificar Servidor
```powershell
# Verificar si está corriendo
Get-Process -Name "node" | Where-Object { $_.CommandLine -like "*vite*" }

# Si no está corriendo, iniciar:
npm run dev
```

**Servidor debería estar en**: http://localhost:5175 (o 5173)

### 2. Abrir Chrome
```
1. Abrir Chrome en modo normal (no incognito)
2. Navegar a http://localhost:5175
3. Abrir DevTools (F12)
4. Mantener console abierta para ver errores
```

### 3. Preparar Captura de Pantalla
```
1. Usar Windows Snipping Tool (Win + Shift + S)
2. O usar herramienta de captura de Chrome
3. Guardar screenshots en carpeta: docs/testing-evidence/
```

---

## 🔑 CREDENCIALES DE PRUEBA

**Usuario Admin**:
```
Email: admin@gestabiz.com
ID: 11111111-1111-1111-1111-111111111111
Password: [tu password de prueba]
```

**Usuario Demo** (limitado):
```
Email: demo@gestabiz.com
ID: 22222222-2222-2222-2222-222222222222
Password: [tu password de prueba]
```

---

## 📝 CHECKLIST RÁPIDO (MÍNIMO)

### ✅ TIER 1: Tests Críticos (30 min)

**Estos tests DEBEN pasar para considerar Fase 5 exitosa**

#### 1. ServicesManager (5 min)
```
□ Login como admin@gestabiz.com
□ Ir a Dashboard → Servicios
□ Verificar botón "Agregar Servicio" VISIBLE
□ Click → Crear servicio de prueba
□ Verificar botón "Editar" VISIBLE
□ Click → Editar servicio
□ Verificar botón "Eliminar" VISIBLE
□ Click → Eliminar servicio
📸 Screenshot de pantalla de servicios con botones visibles
```

#### 2. BusinessRecurringExpenses ⭐ NUEVO (5 min)
```
□ Ir a Dashboard → Configuración → Gastos Recurrentes
□ Verificar botón "Agregar Egreso Recurrente" VISIBLE
□ Click → Crear gasto (categoría: seguros, software, etc.)
□ Verificar icono Trash2 VISIBLE junto a cada gasto
□ Click icono → Eliminar gasto
📸 Screenshot de gastos con botón crear y trash icon
```

#### 3. EmployeeSalaryConfig ⭐ NUEVO (5 min)
```
□ Ir a Dashboard → Empleados
□ Seleccionar un empleado
□ Click en tab "Salario" o sección de configuración salarial
□ Verificar botón "Guardar Configuración de Salario" VISIBLE
□ Modificar salario base (ej: 1000000 → 1500000)
□ Click "Guardar" → Verificar guardado exitoso
📸 Screenshot de formulario de salario con botón guardar
```

#### 4. AppointmentWizard (5 min)
```
□ Cambiar a rol "Cliente" (si existe selector)
□ O navegar a perfil público de negocio → Click "Reservar"
□ Completar wizard paso por paso
□ Llegar a último paso
□ Verificar botón "Confirmar y Reservar" VISIBLE
□ Click → Crear cita
📸 Screenshot de último paso con botón confirmar
```

#### 5. BusinessProfile Favoritos (5 min)
```
□ Navegar a perfil público de negocio
□ Verificar icono corazón VISIBLE (Heart de Phosphor Icons)
□ Click corazón → Verificar se llena (agregar a favoritos)
□ Click nuevamente → Verificar se vacía (quitar)
📸 Screenshot de perfil con icono corazón visible
```

#### 6. AbsencesTab (5 min)
```
□ Volver a rol "Admin"
□ Ir a Dashboard → Ausencias
□ Verificar tab "Pendientes" con solicitudes
□ Verificar botones "Aprobar" y "Rechazar" VISIBLES
□ Click "Aprobar" → Verificar aprobación exitosa
📸 Screenshot de solicitudes con botones aprobar/rechazar
```

---

### ✅ TIER 2: Tests Importantes (60 min)

**Estos tests validan funcionalidad completa**

#### 7. EmployeesManager (10 min)
```
□ Ir a Dashboard → Empleados
□ Tab "Solicitudes Pendientes"
□ Verificar botones "Aprobar" y "Rechazar"
□ Click "Aprobar" → Verificar empleado agregado
□ Ver lista de empleados activos
□ Verificar botón "Editar" en cada empleado
□ Click "Editar" → Modificar datos → Guardar
📸 3 screenshots (solicitudes, editar, lista activos)
```

#### 8. LocationsManager (10 min)
```
□ Ir a Dashboard → Ubicaciones / Sedes
□ Verificar botón "Nueva Ubicación" VISIBLE
□ Click → Crear sede de prueba
□ Verificar botón "Editar" VISIBLE
□ Click → Editar sede → Guardar
□ Verificar botón "Eliminar" VISIBLE
📸 2 screenshots (crear, editar)
```

#### 9. ResourcesManager (10 min)
```
□ Ir a Dashboard → Recursos
□ Verificar botón "Agregar Recurso" VISIBLE
□ Click → Crear recurso (tipo: room, table, court, etc.)
□ Verificar botón "Editar" VISIBLE
□ Verificar botón "Eliminar" VISIBLE
□ Editar y eliminar recurso
📸 2 screenshots (lista, formulario)
```

#### 10. RecruitmentDashboard (10 min)
```
□ Ir a Dashboard → Reclutamiento
□ Verificar botón "Nueva Vacante" VISIBLE
□ Click → Crear vacante de prueba
□ Verificar botón "Editar" en vacante
□ Verificar botón "Eliminar"
□ Ver aplicaciones (si existen)
□ Verificar botones gestión aplicaciones
📸 2 screenshots (vacantes, aplicaciones)
```

#### 11. BillingDashboard (10 min)
```
□ Ir a Dashboard → Facturación
□ Verificar botón "Actualizar Plan" VISIBLE
□ Verificar botón "Cancelar Suscripción" VISIBLE
□ Click "Actualizar Plan" → Ver opciones
📸 1 screenshot (dashboard billing)
```

#### 12. ReviewCard (10 min)
```
□ Ir a Perfil de Negocio → Tab Reseñas
□ Verificar botón "Ocultar/Mostrar" VISIBLE
□ Verificar botón "Eliminar" VISIBLE
□ Verificar botón "Responder" VISIBLE
□ Click "Responder" → Completar → Guardar
📸 1 screenshot (review con botones)
```

---

### ✅ TIER 3: Tests Opcionales (30 min)

**Estos tests completan cobertura al 100%**

#### 13-17. Módulos Restantes
```
□ PermissionTemplates (permissions.manage)
□ UserPermissionsManager (permissions.assign)
□ BusinessNotificationSettings (notifications.manage)
□ CompleteUnifiedSettings Admin tab (settings.edit_business)
□ ExpensesManagementPage (accounting.create)
```

**Validación Básica por Módulo**:
1. Navegar al módulo
2. Verificar botones principales visibles
3. Intentar acción principal (crear/editar)
4. Screenshot de evidencia

---

## 🎯 CRITERIOS DE ÉXITO MÍNIMO

**Para considerar Fase 5 como EXITOSA**, al menos:

✅ **Tier 1 (6 tests) al 100%** (CRÍTICOS)  
✅ **Tier 2 (6 tests) al 80%** (4/6 mínimo)  
✅ **Sin errores de consola críticos**  
✅ **PermissionGate funciona en mode hide/disable**  
✅ **Botones se ocultan/deshabilitan correctamente**  

---

## 📊 PLANTILLA DE REPORTE

Copiar esto a `RESULTADOS_PRUEBAS_PERMISOS_FASE_5.md` al finalizar:

```markdown
## RESULTADOS DE TESTING MANUAL

**Fecha**: [FECHA]
**Duración**: [HH:MM]
**Navegador**: Chrome [VERSION]

### Tier 1: Tests Críticos
- [x] ServicesManager ✅ PASS
- [x] BusinessRecurringExpenses ✅ PASS
- [x] EmployeeSalaryConfig ✅ PASS
- [x] AppointmentWizard ✅ PASS
- [x] BusinessProfile Favoritos ✅ PASS
- [x] AbsencesTab ✅ PASS

**Tier 1 Score**: 6/6 (100%) ✅

### Tier 2: Tests Importantes
- [ ] EmployeesManager
- [ ] LocationsManager
- [ ] ResourcesManager
- [ ] RecruitmentDashboard
- [ ] BillingDashboard
- [ ] ReviewCard

**Tier 2 Score**: X/6 (XX%)

### Bugs Encontrados
1. [Descripción del bug]
   - Módulo: [nombre]
   - Severidad: Alta/Media/Baja
   - Screenshot: [link]

### Observaciones
- [Notas generales]

### Conclusión
**Status Final**: ✅ EXITOSO | ⚠️ PARCIAL | ❌ FALLIDO
**Cobertura**: XX% de módulos probados
**Recomendación**: [Continuar con deploy / Fix bugs primero]
```

---

## 🚨 TROUBLESHOOTING

### Problema: Botón no aparece
```
1. Verificar en DevTools console si hay error
2. Verificar que businessId existe (console.log)
3. Verificar en Supabase que permiso existe
4. Verificar user_permissions table para ese user + business
```

### Problema: Botón visible pero deshabilitado
```
1. Verificar mode en código (debe ser 'disable' no 'hide')
2. Verificar que permiso existe pero user no lo tiene
3. Esto es comportamiento esperado si no tiene permiso
```

### Problema: Error en consola
```
1. Copiar stack trace completo
2. Verificar si es error de PermissionGate
3. Documentar en sección "Bugs Encontrados"
4. Continuar con siguiente test
```

---

## ⏱️ TIMELINE SUGERIDO

**Total Tiempo**: 2 horas

| Tiempo | Actividad |
|--------|-----------|
| 0:00 - 0:05 | Preparación (servidor, Chrome) |
| 0:05 - 0:10 | Login y verificación inicial |
| 0:10 - 0:40 | Tier 1: Tests Críticos (6 tests) |
| 0:40 - 1:40 | Tier 2: Tests Importantes (6 tests) |
| 1:40 - 2:00 | Documentar resultados y crear reporte |

**Si tienes más tiempo**: Continuar con Tier 3 (30 min adicionales)

---

## 📸 ORGANIZACIÓN DE EVIDENCIA

Crear carpeta:
```
docs/testing-evidence/
  tier1/
    01-services-manager.png
    02-recurring-expenses.png
    03-salary-config.png
    04-appointment-wizard.png
    05-business-profile-favoritos.png
    06-absences-tab.png
  tier2/
    07-employees-manager.png
    08-locations-manager.png
    ...
  bugs/
    bug-01-[descripcion].png
    bug-02-[descripcion].png
```

---

## ✅ CHECKLIST PRE-TEST

Antes de empezar, verificar:

□ Servidor corriendo en localhost:5175  
□ Chrome abierto con DevTools  
□ Credenciales de admin@gestabiz.com disponibles  
□ Carpeta docs/testing-evidence/ creada  
□ RESULTADOS_PRUEBAS_PERMISOS_FASE_5.md abierto para ir marcando  
□ Tiempo bloqueado (2 horas sin interrupciones)  

---

## 🎉 AL FINALIZAR

1. **Completar reporte** en RESULTADOS_PRUEBAS_PERMISOS_FASE_5.md
2. **Calcular score**: Tier 1 (100%) + Tier 2 (XX%)
3. **Documentar bugs** encontrados (si existen)
4. **Actualizar** FASE_5_RESUMEN_EJECUTIVO_FINAL.md con resultados
5. **Commit** de toda la evidencia y reportes
6. **Celebrar** 🎉 - Fase 5 COMPLETADA!

---

**¡Éxito con el testing!** 💪

Si tienes dudas durante el testing, consultar:
- `PLAN_PRUEBAS_PERMISOS_FASE_5.md` (plan completo)
- `FASE_5_RESUMEN_EJECUTIVO_FINAL.md` (contexto general)
- `copilot-instructions.md` Sistema #14 (documentación técnica)

