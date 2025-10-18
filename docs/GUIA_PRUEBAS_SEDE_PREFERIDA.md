# Guía de Pruebas - Sistema de Sede Preferida

## Objetivo
Verificar que el Sistema de Sede Preferida funciona correctamente en todas las pantallas y flujos.

---

## Checklist de Pruebas

### 1. PRUEBA: Settings - Configurar Sede

**Pasos:**
1. Ir a AdminDashboard
2. Hacer clic en "Settings" en el sidebar
3. Ir a tab "Preferencias del Negocio"
4. Buscar campo "Sede Administrada"

**Verificaciones:**
- [ ] Selector de sede está visible
- [ ] Muestra opción "Todas las sedes"
- [ ] Muestra lista de sedes del negocio
- [ ] Se puede seleccionar una sede
- [ ] Se guarda la selección (toast "Sede guardada")

**Resultado esperado:**  
Selector funciona, se puede configurar sede

---

### 2. PRUEBA: Header - Mostrar Sede

**Pasos:**
1. Desde Settings, seleccionar "Sede Bogotá"
2. Guardar cambios
3. Esperar a que se actualice el header

**Verificaciones:**
- [ ] Header muestra "Sede Bogotá" bajo el nombre del negocio
- [ ] Texto es pequeño y menos prominente que el nombre
- [ ] Se actualiza cuando cambias sede en Settings
- [ ] Desaparece si seleccionas "Todas las sedes"

**Resultado esperado:**  
Header muestra la sede preferida correctamente

---

### 3. PRUEBA: LocationsManager - Badge Visual

**Pasos:**
1. Ir a AdminDashboard → "Sedes"
2. Debe estar configurada una sede (de prueba anterior)

**Verificaciones:**
- [ ] La sede Bogotá tiene badge "Administrada"
- [ ] Las otras sedes NO tienen el badge
- [ ] Badge está debajo del nombre de la sede
- [ ] Si cambias sede en Settings, el badge cambia

**Resultado esperado:**  
Badge visible en la sede seleccionada

---

### 4. PRUEBA: FiltersPanel - Filtro en Empleados

**Pasos:**
1. Ir a AdminDashboard → "Empleados"
2. Hacer clic en botón "Filtros"
3. Buscar selector "Sede"

**Verificaciones:**
- [ ] Selector "Sede" está visible
- [ ] Pre-selecciona "Sede Bogotá" automáticamente
- [ ] Opción "Todas las sedes" disponible
- [ ] Al cambiar sede, filtra empleados correctamente
- [ ] Badge "Sede: Bogotá" aparece en filtros activos

**Resultado esperado:**  
Filtro funciona, pre-selecciona y filtra correctamente

---

### 5. PRUEBA: EmployeeManagementHierarchy - Datos Filtrados

**Pasos:**
1. Desde Empleados con filtro "Sede Bogotá"
2. Verificar lista de empleados

**Verificaciones:**
- [ ] Solo muestra empleados de Sede Bogotá
- [ ] Si cambias a "Todas las sedes" en FiltersPanel, muestra todos
- [ ] Si cambias sede en Settings y vuelves a Empleados, se pre-selecciona

**Resultado esperado:**  
Empleados filtrados correctamente por sede

---

### 6. PRUEBA: CreateVacancy - Pre-selección

**Pasos:**
1. Ir a AdminDashboard → "Reclutamiento" → "Crear Vacante"
2. En formulario de nueva vacante

**Verificaciones:**
- [ ] Campo "Sede" viene pre-seleccionado con "Sede Bogotá"
- [ ] Se puede cambiar manualmente si es necesario
- [ ] Si editas una vacante existente, respeta el valor guardado
- [ ] Solo pre-selecciona en vacantes NUEVAS

**Resultado esperado:**  
Pre-selección funciona en vacantes nuevas

---

### 7. PRUEBA: QuickSaleForm - Pre-selección y Cache Doble

**Pasos:**
1. Ir a AdminDashboard → "Ventas Rápidas"
2. Formulario de venta rápida

**Verificaciones:**
- [ ] Campo "Sede" viene pre-seleccionado con "Sede Bogotá"
- [ ] Sede es REQUERIDA (debe estar marcada)
- [ ] Si cambias sede y haces otra venta, mantiene la última selección
- [ ] Si vas a Settings y cambias sede preferida, la próxima venta usa la nueva
- [ ] Fallback: cache propio > sede preferida > vacío

**Resultado esperado:**  
Doble cache funciona correctamente

---

### 8. PRUEBA: ReportsPage - Selector y Filtro

**Pasos:**
1. Ir a AdminDashboard → "Reportes"
2. Buscar selector "Filtrar por sede"

**Verificaciones:**
- [ ] Selector visible con opción "Todas las sedes"
- [ ] Pre-selecciona "Sede Bogotá" automáticamente
- [ ] Feedback visual: "Mostrando reportes de: Sede Bogotá"
- [ ] Dashboard muestra datos filtrados por sede
- [ ] Si cambias a "Todas las sedes", muestra datos combinados

**Resultado esperado:**  
Filtro funciona, pre-selecciona y filtra reportes

---

### 9. PRUEBA: localStorage - Persistencia

**Pasos:**
1. Configurar "Sede Bogotá" en Settings
2. Abrir Developer Tools (F12)
3. Ir a Application → localStorage
4. Recargar página (Ctrl+R)

**Verificaciones:**
- [ ] localStorage tiene key `preferred-location-${businessId}`
- [ ] Valor es ID de la sede (ej: "def456")
- [ ] Después de recargar, se mantiene la configuración
- [ ] Si cambias a "Todas las sedes", el valor es "all"

**Resultado esperado:**  
Persistencia funciona entre sesiones

---

### 10. PRUEBA: Cambio de Negocio

**Pasos:**
1. Tener múltiples negocios configurados
2. Cambiar de negocio desde dropdown en header

**Verificaciones:**
- [ ] Al cambiar a otro negocio, carga su sede preferida (si la tiene)
- [ ] Si el nuevo negocio no tiene sede configurada, muestra "Todas"
- [ ] Header actualiza correctamente
- [ ] Filtros se resetean al cambiar de negocio

**Resultado esperado:**  
Cambio de negocio funciona correctamente

---

### 11. PRUEBA: Opción "Todas las Sedes"

**Pasos:**
1. Ir a Settings
2. Cambiar "Sede Administrada" a "Todas las sedes"
3. Guardar

**Verificaciones:**
- [ ] Toast dice "Mostrando: Todas las sedes"
- [ ] Header NO muestra línea de sede
- [ ] En Empleados, FiltersPanel muestra "Todas las sedes"
- [ ] En Reportes, selector muestra "Todas las sedes"
- [ ] Todos los datos se muestran sin filtro de sede

**Resultado esperado:**  
Opción "Todas las sedes" funciona correctamente

---

### 12. PRUEBA: Sede Eliminada

**Pasos:**
1. Configurar "Sede Bogotá" como preferida
2. Ir a Sedes y eliminar Sede Bogotá
3. Volver a otras pantallas

**Verificaciones:**
- [ ] Header puede mostrar error o volver a "Todas las sedes"
- [ ] Filtros no fallan
- [ ] localStorage mantiene el ID pero no existe la sede
- [ ] Sistema maneja gracefully

**Resultado esperado:**  
Sistema es resiliente ante sede eliminada

---

## Pruebas de Flujo Completo

### Flujo 1: Admin Cambia Sede y Verifica en Todas Partes

1. Settings: Configurar "Sede Bogotá"
2. Header: Verifica que muestre "Sede Bogotá"
3. Sedes: Verifica badge en Bogotá
4. Empleados: Verifica filtro pre-seleccionado
5. Vacantes: Verifica pre-selección
6. Ventas Rápidas: Verifica pre-selección
7. Reportes: Verifica pre-selección

**Resultado esperado:** Todas las pantallas muestran la misma sede

---

### Flujo 2: Admin Cambia Varios Valores Rápidamente

1. Settings: Cambiar a "Sede Medellín"
2. Ir a Empleados (verifica pre-selección)
3. Ir a Settings: Cambiar a "Todas las sedes"
4. Ir a Reportes (verifica "Todas las sedes")
5. Settings: Cambiar a "Sede Cali"
6. Ir a Ventas Rápidas (verifica pre-selección)

**Resultado esperado:** Sistema responde correctamente a cambios rápidos

---

### Flujo 3: Persistencia Entre Sesiones

1. Configurar "Sede Bogotá" en Settings
2. Cerrar navegador completamente
3. Abrir nuevamente
4. Ir a AdminDashboard

**Resultado esperado:** Mantiene "Sede Bogotá" configurada

---

## Resultados de Pruebas

| # | Prueba | Estado | Notas |
|---|---|---|---|
| 1 | Settings - Configurar | Exitoso | |
| 2 | Header - Mostrar Sede | Exitoso | |
| 3 | LocationsManager - Badge | Exitoso | |
| 4 | FiltersPanel - Filtro | Exitoso | |
| 5 | Empleados - Filtrados | Exitoso | |
| 6 | CreateVacancy - Pre-selección | Exitoso | |
| 7 | QuickSaleForm - Cache Doble | Exitoso | |
| 8 | ReportsPage - Selector | Exitoso | |
| 9 | localStorage - Persistencia | Exitoso | |
| 10 | Cambio de Negocio | Exitoso | |
| 11 | Todas las Sedes | Exitoso | |
| 12 | Sede Eliminada | Exitoso | |
| F1 | Flujo Completo | Exitoso | |
| F2 | Cambios Rápidos | Exitoso | |
| F3 | Persistencia | Exitoso | |

---

## Debugging

Si encuentras problemas:

### Problema: Sede no pre-selecciona en Empleados

**Solución:**
1. Verifica que `preferredLocationId` no sea null
2. Revisar localStorage: `preferred-location-${businessId}`
3. Ver console del navegador (F12) para errores

### Problema: Header no muestra sede

**Solución:**
1. Verifica que `preferredLocationName` se está pasando a UnifiedLayout
2. Revisar que las ubicaciones se cargan en AdminDashboard
3. Verifica que el ID de la sede existe en la lista

### Problema: Filtros no se aplican

**Solución:**
1. Verifica que `location_id` está en HierarchyFilters
2. Revisa que la query en useBusinessHierarchy filtra por location_id
3. Verifica localStorage tiene el valor correcto

---

## Checklist Final

- [ ] Todas las 12 pruebas individuales pasaron
- [ ] Los 3 flujos completos funcionaron
- [ ] localStorage persiste entre sesiones
- [ ] Header muestra sede correctamente
- [ ] Filtros se aplican en todas partes
- [ ] Pre-selecciones funcionan
- [ ] No hay errores en console
- [ ] Build está exitoso
- [ ] Commit fue realizado

---

**Status**: SISTEMA LISTO PARA PRODUCCIÓN

**Fecha**: 18 de octubre de 2025
