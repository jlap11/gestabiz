# 🧪 CHECKLIST DE TESTING VISUAL - TEMA CLARO/OSCURO
**Proyecto:** AppointSync Pro  
**Fecha:** 12 de octubre de 2025  
**Tester:** _____________  

---

## 📋 INSTRUCCIONES

1. **Preparación:**
   - Tener 3 usuarios de prueba: Admin, Employee, Client
   - Abrir DevTools para cambiar viewport
   - Tener screenshot tool listo (opcional)

2. **Convención de Checkboxes:**
   - ✅ = Funciona correctamente en ambos temas
   - ⚠️ = Funciona pero tiene issue menor
   - ❌ = Problema crítico encontrado
   - N/A = No aplica / No disponible

3. **Cómo testear cada item:**
   - Probar funcionalidad en **tema claro**
   - Toggle a **tema oscuro** sin refresh
   - Verificar que NO haya:
     - Texto ilegible (bajo contraste)
     - "Manchas" de color incorrecto
     - Borders invisibles
     - Backgrounds que no cambian

---

## 👨‍💼 ADMIN ROLE TESTING

### 1. Login & Layout
- [ ] Login screen (ambos temas)
- [ ] Admin sidebar navigation legible
- [ ] Header con BusinessSelector dropdown
- [ ] User menu dropdown
- [ ] Toggle tema desde header

### 2. BusinessSelector (Header)
- [ ] Dropdown abre correctamente
- [ ] Cards de negocios con nombre + categoría
- [ ] Hover states funcionan
- [ ] Selected business destacado
- [ ] Botón "Crear nuevo negocio" visible

### 3. ServicesManager
- [ ] Header con título + descripción
- [ ] Botón "Agregar Servicio" (primary color)
- [ ] Grid de servicios legible
- [ ] Cards con imagen + nombre + precio + duración
- [ ] Hover states en cards
- [ ] Botones Edit/Delete visibles
- [ ] Empty state (si no hay servicios)
- [ ] **Dialog de crear/editar:**
  - [ ] Background del modal correcto
  - [ ] Inputs legibles
  - [ ] Labels con contraste adecuado
  - [ ] Checkboxes de sedes/empleados
  - [ ] Image uploader funcional
  - [ ] Botón "Guardar" con primary color

### 4. LocationsManager
- [ ] Header con título + descripción
- [ ] Botón "Agregar Sede" (primary color)
- [ ] Grid de sedes legible
- [ ] Cards con nombre + dirección + teléfono
- [ ] Icons (MapPin, Phone, Mail, Clock) visibles
- [ ] Hover states en cards
- [ ] Botones Edit/Delete visibles
- [ ] Empty state (si no hay sedes)
- [ ] **Dialog de crear/editar:**
  - [ ] Background del modal correcto
  - [ ] Todos los inputs legibles
  - [ ] Image uploader para múltiples imágenes
  - [ ] Preview de imágenes con botón X
  - [ ] Botón "Guardar" con primary color

### 5. BusinessSettings
- [ ] Tabs (General, Horarios, Categorías) legibles
- [ ] **Tab General:**
  - [ ] Inputs de nombre, descripción, etc.
  - [ ] Image uploader de logo
  - [ ] Country/State selectors
- [ ] **Tab Horarios:**
  - [ ] BusinessHoursPicker component
  - [ ] Checkboxes de días de semana
  - [ ] Time pickers (start/end)
  - [ ] Toggle "Cerrado"
- [ ] **Tab Categorías:**
  - [ ] Select de categoría principal
  - [ ] Multi-select de subcategorías
  - [ ] Límite de 3 subcategorías visible

### 6. BusinessNotificationSettings
- [ ] Header con título
- [ ] **Card 1 - Canales:** Checkboxes Email/SMS/WhatsApp
- [ ] **Card 2 - Prioridad:** Radio buttons de prioridad
- [ ] **Card 3 - Tiempos:** Inputs numéricos de horas
- [ ] **Card 4 - Config por Tipo:** Checkboxes de tipos
- [ ] **Card 5 - Horarios:** Time range pickers
- [ ] **Card 6 - Contactos:** Inputs de email/teléfono
- [ ] **Card 7 - Avanzada:** Toggles y configs extra
- [ ] Footer con botones Cancel/Save
- [ ] Botón Save con primary color

### 7. NotificationTracking
- [ ] **Stats Cards (4):**
  - [ ] Total enviadas (background + icon + número)
  - [ ] Exitosas (green icon)
  - [ ] Fallidas (red icon)
  - [ ] Tasa de éxito (porcentaje)
- [ ] **Charts (3):**
  - [ ] Por Canal (bar chart con colores)
  - [ ] Por Estado (pie chart)
  - [ ] Top 5 Tipos (bar chart)
  - [ ] Recharts con colors temáticos
- [ ] **Filters Card:**
  - [ ] Date range picker
  - [ ] Selects de canal/estado/tipo
  - [ ] Botón "Aplicar filtros"
- [ ] **Table:**
  - [ ] Headers legibles
  - [ ] Rows con hover effect
  - [ ] Icons de canal/estado
  - [ ] Botón "Exportar" visible

### 8. Dashboard Components
- [ ] RecommendedBusinesses cards
  - [ ] Imágenes con overlays (categoría + distancia)
  - [ ] Botón fuchsia "Ver negocio" (intencional)
- [ ] TopPerformers list
  - [ ] Medallas (oro/plata/bronce)
  - [ ] Nombres + métricas
- [ ] RevenueChart
  - [ ] Barras de income/expenses/profit
  - [ ] Tooltips hover (bg-card + text-foreground)

---

## 👤 CLIENT ROLE TESTING

### 9. Login & Layout
- [ ] Login screen cliente
- [ ] ClientLayout sidebar
- [ ] Navigation items legibles
- [ ] User profile section

### 10. Appointment Wizard - FLUJO COMPLETO 🔥
**CRÍTICO:** Este es el flujo principal para clientes

#### Step 1: BusinessSelection
- [ ] Modal del wizard abre
- [ ] Título "Selecciona un Negocio"
- [ ] Grid de negocios con imágenes
- [ ] Cards con nombre + categoría + descripción
- [ ] Hover states en cards
- [ ] Checkmark cuando seleccionado
- [ ] Empty state si no hay negocios

#### Step 2: ServiceSelection
- [ ] Título "Selecciona un Servicio"
- [ ] Grid de servicios con imágenes
- [ ] Cards con nombre + precio + duración
- [ ] Hover states en cards
- [ ] Checkmark cuando seleccionado

#### Step 3: LocationSelection
- [ ] Título "Selecciona una Sede"
- [ ] Grid de sedes
- [ ] Cards con MapPin icon + dirección
- [ ] Teléfono y país visibles
- [ ] Hover states en cards
- [ ] Loading state (spinner + text)
- [ ] Empty state si no hay sedes

#### Step 4: EmployeeSelection
- [ ] Título "Selecciona un Profesional"
- [ ] Grid de empleados con avatares
- [ ] Cards con nombre + email + rating
- [ ] Hover states en cards
- [ ] Loading state (spinner primary color)
- [ ] Empty state si no hay empleados

#### Step 5: DateTimeSelection
- [ ] Título "Select Date & Time"
- [ ] Info card de servicio seleccionado
- [ ] **Calendar component:**
  - [ ] Background card/border correcto
  - [ ] Días habilitados/deshabilitados
  - [ ] Día seleccionado con primary color
- [ ] **Time Slots:**
  - [ ] Título "Available on [date]"
  - [ ] Grid de horarios
  - [ ] Slots disponibles (bg-card + border)
  - [ ] Slots no disponibles (opacity-40)
  - [ ] Slot seleccionado (bg-primary + text-primary-foreground)
  - [ ] Badge "HOT" naranja en populares
  - [ ] Hover states funcionan

#### Step 6: ConfirmationStep
- [ ] Título "New Appointment"
- [ ] Card de resumen con:
  - [ ] Icon de Calendar (primary color)
  - [ ] InfoRows con icons (primary) + labels (muted) + values (foreground)
  - [ ] Service, Date/Time, Location, Employee
  - [ ] Separators visibles
- [ ] Textarea de notas opcionales
  - [ ] Placeholder legible
  - [ ] Text color correcto
  - [ ] Border focus en primary
- [ ] Botón "Confirmar cita" (primary)

#### Step 7: SuccessStep
- [ ] Checkmark de éxito
- [ ] Mensaje de confirmación legible
- [ ] Botón "Ver mis citas"

### 11. Dashboard Cliente
- [ ] Upcoming appointments cards
- [ ] Past appointments list
- [ ] RecommendedBusinesses section

---

## 👔 EMPLOYEE ROLE TESTING

### 12. Login & Layout
- [ ] Login screen empleado
- [ ] EmployeeLayout sidebar
- [ ] Navigation items legibles

### 13. Employee Dashboard
- [ ] Today's appointments list
- [ ] Appointment cards legibles
- [ ] Status badges (confirmed/pending/cancelled)

### 14. Appointment Management
- [ ] Ver detalles de cita
- [ ] Botones de acción (Confirmar/Cancelar)
- [ ] Forms de edición

---

## 🎨 EDGE CASES & RESPONSIVE

### 15. Theme Transitions
- [ ] Toggle Light → Dark (suave, sin "flash")
- [ ] Toggle Dark → Light
- [ ] Toggle con modal abierto (modal cambia también)
- [ ] Refresh mantiene tema seleccionado
- [ ] Theme "System" sigue preferencia del OS

### 16. Responsive Testing
- [ ] Mobile (375px): Wizard steps en mobile
- [ ] Tablet (768px): Grids se adaptan
- [ ] Desktop (1920px+): Layout utiliza espacio

### 17. Components Específicos
- [ ] **QRScannerWeb:**
  - [ ] Overlay full-screen
  - [ ] Frame borders (primary color)
  - [ ] Botones legibles
  - [ ] Estados de permiso
- [ ] **ImageUploader:**
  - [ ] Drag area legible
  - [ ] Preview grid con borders
  - [ ] Progress overlay
  - [ ] Botón remove (X)
- [ ] **ReviewCard + ReviewList:**
  - [ ] Estrellas amarillas (intencional)
  - [ ] Estrellas vacías (muted-foreground)
  - [ ] Texto de review legible

### 18. Jobs Module
- [ ] VacancyList cards
- [ ] Badge "closed" (muted bg + muted text)
- [ ] VacancyDetail page
- [ ] ApplicationList
- [ ] Badge "withdrawn" (muted)

---

## 🐛 ISSUES ENCONTRADOS

### Critical Issues (Bloquean uso)
```
Componente: _____________
Descripción: _____________
Screenshot: _____________
```

### Minor Issues (Afectan UX pero no bloquean)
```
Componente: _____________
Descripción: _____________
Screenshot: _____________
```

### Enhancement Opportunities
```
Componente: _____________
Sugerencia: _____________
```

---

## ✅ CRITERIOS DE APROBACIÓN

Para considerar el testing **APROBADO**, se debe cumplir:

1. ✅ **100% de items críticos** (wizard, login, main navigation) sin issues critical
2. ✅ **95%+ de items** funcionan correctamente en ambos temas
3. ✅ **Transiciones de tema** son suaves sin "flash" visible
4. ✅ **No hay texto ilegible** por bajo contraste
5. ✅ **Modals/Dialogs** cambian de tema correctamente

---

## 📊 RESULTADOS FINALES

**Items testeados:** _____ / 150+  
**Items aprobados:** _____ (___%)  
**Critical issues:** _____  
**Minor issues:** _____  

**Estado final:** ⬜ APROBADO / ⬜ RECHAZADO / ⬜ APROBADO CON OBSERVACIONES

**Comentarios del tester:**
```
_________________________________________
_________________________________________
_________________________________________
```

**Firma:** _____________ **Fecha:** _____________

---

## 🚀 PRÓXIMOS PASOS

Si APROBADO:
- [ ] Merge a main branch
- [ ] Deploy a staging
- [ ] Comunicar a equipo de producto

Si RECHAZADO:
- [ ] Crear tickets de los critical issues
- [ ] Asignar para corrección
- [ ] Re-testear cuando estén resueltos
