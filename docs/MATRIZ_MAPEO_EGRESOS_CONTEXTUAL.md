# Matriz de Mapeo de Egresos Contextuales
## Plan de Acción para Integración de Egresos en Gestión de Entidades

**Fecha:** 15 de Noviembre 2025  
**Estado:** Fase de Diseño  
**Objetivo:** Migrar de configuración centralizada a configuración contextual de egresos

---

## 📊 RESUMEN EJECUTIVO

### Arquitectura Actual vs. Deseada

#### ACTUAL ❌
```
ExpenseRegistrationForm (Centralizado)
   └─ Dropdowns para seleccionar: Negocio, Sede, Empleado
   └─ Formulario genérico para todos los egresos
   └─ Usuario busca "Egresos" en sidebar AdminDashboard
```

#### DESEADA ✅
```
LocationsManager → Configurar Egresos de Sede
EmployeeManagement → Configurar Salarios y Nómina
Business Settings → Configurar Egresos Generales del Negocio
ExpensesManagementPage → Solo Visualización y Reportes
```

### Justificación del Cambio
1. **UX Mejorada**: Usuarios configuran egresos donde gestionan las entidades
2. **Contexto Natural**: "Salarios" se configuran en perfiles de empleados, no en formulario genérico
3. **Descubrimiento**: Mejor discoverability al estar integrados en flujos existentes
4. **Workflow**: Crear empleado → Configurar salario → Activar automatización (todo en un lugar)

---

## 🗺️ MATRIZ DE MAPEO: EGRESOS → ENTIDADES → UI

### 1. EGRESOS ESPECÍFICOS DE SEDE (LocationsManager)

| Categoría Egreso | Tabla BD | Campos Clave | UI Location | Automation |
|-----------------|---------|--------------|------------|-----------|
| **Arriendo** | `location_expense_config` | `rent_amount`, `rent_due_day`, `landlord_name`, `landlord_contact`, `lease_start_date`, `lease_end_date` | LocationsManager → "Egresos de la Sede" section | Auto-create `recurring_expense` con `category='rent'`, `location_id=FK`, `recurrence_frequency='monthly'`, `is_automated=true` |
| **Electricidad** | `location_expense_config` | `electricity_avg` | LocationsManager → "Servicios Públicos" subsection | Auto-create `recurring_expense` con `category='electricity'`, `amount=electricity_avg`, `recurrence_frequency='monthly'` |
| **Agua** | `location_expense_config` | `water_avg` | LocationsManager → "Servicios Públicos" subsection | Auto-create `recurring_expense` con `category='water'`, `amount=water_avg`, `recurrence_frequency='monthly'` |
| **Gas** | `location_expense_config` | `gas_avg` | LocationsManager → "Servicios Públicos" subsection | Auto-create `recurring_expense` con `category='gas'`, `amount=gas_avg`, `recurrence_frequency='monthly'` |
| **Internet** | `location_expense_config` | `internet_avg` | LocationsManager → "Servicios Públicos" subsection | Auto-create `recurring_expense` con `category='internet'`, `amount=internet_avg`, `recurrence_frequency='monthly'` |
| **Teléfono** | `location_expense_config` | `phone_avg` | LocationsManager → "Servicios Públicos" subsection | Auto-create `recurring_expense` con `category='phone'`, `amount=phone_avg`, `recurrence_frequency='monthly'` |
| **Seguridad** | `location_expense_config` | `security_amount` | LocationsManager → "Otros Servicios" subsection | Auto-create `recurring_expense` con `category='security'`, `amount=security_amount`, `recurrence_frequency='monthly'` |
| **Aseo** | `location_expense_config` | `cleaning_amount` | LocationsManager → "Otros Servicios" subsection | Auto-create `recurring_expense` con `category='cleaning'`, `amount=cleaning_amount`, `recurrence_frequency='monthly'` o `weekly` |
| **Recolección de Basuras** | `location_expense_config` | `waste_disposal_amount` | LocationsManager → "Otros Servicios" subsection | Auto-create `recurring_expense` con `category='waste_disposal'`, `amount=waste_disposal_amount`, `recurrence_frequency='monthly'` |

**Total Egresos de Sede:** 9 categorías  
**Tabla Principal:** `location_expense_config` (22 columnas) ✅ YA EXISTE  
**Estado UI:** ❌ CERO integración actual  
**Prioridad:** 🔴 CRÍTICA - Mayor valor para usuario

---

### 2. EGRESOS ESPECÍFICOS DE EMPLEADO (EmployeeManagement)

| Categoría Egreso | Tabla BD | Campos Clave | UI Location | Automation |
|-----------------|---------|--------------|------------|-----------|
| **Salario Base** | `business_employees` | `salary_base`, `salary_type` ('monthly', 'biweekly', 'weekly', 'daily', 'hourly') | EmployeeManagement → "Configuración de Nómina" section | Auto-create `recurring_expense` con `category='payroll'`, `employee_id=FK`, `amount=salary_base`, `recurrence_frequency` según `salary_type`, `is_automated=true` |
| **Bonos Recurrentes** | `recurring_expenses` | `category='bonuses'`, `employee_id`, `amount`, `recurrence_frequency` | EmployeeManagement → "Bonos y Beneficios" subsection | Manual creation desde formulario contextual en perfil de empleado |
| **Comisiones Fijas** | `recurring_expenses` | `category='commissions'`, `employee_id`, `amount`, `recurrence_frequency` | EmployeeManagement → "Bonos y Beneficios" subsection | Manual creation desde formulario contextual |

**Total Egresos de Empleado:** 3 categorías  
**Tabla Principal:** `business_employees` (salary_base, salary_type ✅ YA EXISTEN)  
**Tabla Secundaria:** `recurring_expenses` (employee_id FK ✅ YA EXISTE)  
**Estado UI:** ❌ CERO integración actual  
**Prioridad:** 🔴 CRÍTICA - Automatización de nómina esencial

---

### 3. EGRESOS GENERALES DEL NEGOCIO (Business Settings)

| Categoría Egreso | Tabla BD | Campos Clave | UI Location | Automation |
|-----------------|---------|--------------|------------|-----------|
| **Seguro de Responsabilidad Civil** | `recurring_expenses` | `category='liability_insurance'`, `business_id`, `location_id=NULL`, `employee_id=NULL` | Settings → AdminRolePreferences → "Egresos Recurrentes del Negocio" | Manual creation con toggle automation |
| **Seguro Contra Incendio** | `recurring_expenses` | `category='fire_insurance'`, `business_id`, `location_id=NULL`, `employee_id=NULL` | Settings → AdminRolePreferences → "Egresos Recurrentes del Negocio" | Manual creation con toggle automation |
| **Seguro Contra Robo** | `recurring_expenses` | `category='theft_insurance'`, `business_id`, `location_id=NULL`, `employee_id=NULL` | Settings → AdminRolePreferences → "Egresos Recurrentes del Negocio" | Manual creation con toggle automation |
| **Seguro de Salud Empleados** | `recurring_expenses` | `category='health_insurance'`, `business_id`, `location_id=NULL`, `employee_id=NULL` | Settings → AdminRolePreferences → "Egresos Recurrentes del Negocio" | Manual creation con toggle automation |
| **Software y Suscripciones** | `recurring_expenses` | `category='software'`, `business_id`, `location_id=NULL`, `employee_id=NULL` | Settings → AdminRolePreferences → "Egresos Recurrentes del Negocio" | Manual creation con toggle automation |
| **Honorarios Contables** | `recurring_expenses` | `category='accounting_fees'`, `business_id`, `location_id=NULL`, `employee_id=NULL` | Settings → AdminRolePreferences → "Egresos Recurrentes del Negocio" | Manual creation con toggle automation |
| **Honorarios Legales** | `recurring_expenses` | `category='legal_fees'`, `business_id`, `location_id=NULL`, `employee_id=NULL` | Settings → AdminRolePreferences → "Egresos Recurrentes del Negocio" | Manual creation con toggle automation |
| **Consultoría Externa** | `recurring_expenses` | `category='consulting_fees'`, `business_id`, `location_id=NULL`, `employee_id=NULL` | Settings → AdminRolePreferences → "Egresos Recurrentes del Negocio" | Manual creation con toggle automation |
| **Impuesto Predial** | `recurring_expenses` | `category='property_tax'`, `business_id`, `location_id=NULL`, `employee_id=NULL` | Settings → AdminRolePreferences → "Egresos Recurrentes del Negocio" | Manual creation con toggle automation |
| **Impuesto de Renta** | `recurring_expenses` | `category='income_tax'`, `business_id`, `location_id=NULL`, `employee_id=NULL` | Settings → AdminRolePreferences → "Egresos Recurrentes del Negocio" | Manual creation con toggle automation |
| **IVA** | `recurring_expenses` | `category='vat'`, `business_id`, `location_id=NULL`, `employee_id=NULL` | Settings → AdminRolePreferences → "Egresos Recurrentes del Negocio" | Manual creation con toggle automation |
| **Otros Gastos Generales** | `recurring_expenses` | `category='miscellaneous'`, `business_id`, `location_id=NULL`, `employee_id=NULL` | Settings → AdminRolePreferences → "Egresos Recurrentes del Negocio" | Manual creation con toggle automation |

**Total Egresos de Negocio:** 12 categorías  
**Tabla Principal:** `recurring_expenses` (location_id=NULL, employee_id=NULL para identificar que son generales)  
**Estado UI:** ⚠️ ESTRUCTURA EXISTE (AdminRolePreferences) pero no hay sección de egresos  
**Prioridad:** 🟡 MEDIA - Importante pero menos urgente que sede/empleado

---

## 🛠️ PLAN DE IMPLEMENTACIÓN

### FASE 1: LocationsManager - Configuración de Egresos de Sede (Días 1-3)

#### 1.1. Crear Componente `LocationExpenseConfig.tsx` (Nuevo)
```tsx
// src/components/admin/locations/LocationExpenseConfig.tsx
interface LocationExpenseConfigProps {
  locationId: string
  businessId: string
}

export function LocationExpenseConfig({ locationId, businessId }: LocationExpenseConfigProps) {
  // State para cada categoría de egreso
  const [rentAmount, setRentAmount] = useState<number>(0)
  const [rentDueDay, setRentDueDay] = useState<number>(1)
  const [landlordName, setLandlordName] = useState('')
  const [landlordContact, setLandlordContact] = useState('')
  const [leaseStartDate, setLeaseStartDate] = useState('')
  const [leaseEndDate, setLeaseEndDate] = useState('')
  
  // Utilities
  const [electricityAvg, setElectricityAvg] = useState<number>(0)
  const [waterAvg, setWaterAvg] = useState<number>(0)
  const [gasAvg, setGasAvg] = useState<number>(0)
  const [internetAvg, setInternetAvg] = useState<number>(0)
  const [phoneAvg, setPhoneAvg] = useState<number>(0)
  
  // Other services
  const [securityAmount, setSecurityAmount] = useState<number>(0)
  const [cleaningAmount, setCleaningAmount] = useState<number>(0)
  const [wasteDisposalAmount, setWasteDisposalAmount] = useState<number>(0)
  
  // Automation toggles
  const [automateRent, setAutomateRent] = useState(true)
  const [automateUtilities, setAutomateUtilities] = useState(true)
  const [automateOthers, setAutomateOthers] = useState(true)

  // Load existing config from location_expense_config
  useEffect(() => { /* fetch and populate */ }, [locationId])

  // Save handler que:
  // 1. UPSERT en location_expense_config
  // 2. Create/Update recurring_expenses con location_id FK
  // 3. Configurar next_payment_date, recurrence_frequency, is_automated
  const handleSave = async () => { /* implementation */ }

  return (
    <div className="space-y-6">
      {/* Sección: Arriendo */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Arriendo</CardTitle>
          <CardDescription>Configure el arriendo de esta sede</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Inputs para rent_amount, rent_due_day, landlord info, lease dates */}
          <div className="flex items-center justify-between">
            <Label>Generar egreso recurrente automáticamente</Label>
            <Switch checked={automateRent} onCheckedChange={setAutomateRent} />
          </div>
        </CardContent>
      </Card>

      {/* Sección: Servicios Públicos */}
      <Card>
        <CardHeader>
          <CardTitle>Servicios Públicos (Promedio Mensual)</CardTitle>
          <CardDescription>Ingrese el costo promedio mensual de cada servicio</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          {/* Inputs para electricity_avg, water_avg, gas_avg, internet_avg, phone_avg */}
          <div className="col-span-2 flex items-center justify-between">
            <Label>Generar egresos recurrentes automáticamente</Label>
            <Switch checked={automateUtilities} onCheckedChange={setAutomateUtilities} />
          </div>
        </CardContent>
      </Card>

      {/* Sección: Otros Servicios */}
      <Card>
        <CardHeader>
          <CardTitle>Otros Servicios</CardTitle>
          <CardDescription>Seguridad, aseo, recolección de basuras</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Inputs para security_amount, cleaning_amount, waste_disposal_amount */}
          <div className="flex items-center justify-between">
            <Label>Generar egresos recurrentes automáticamente</Label>
            <Switch checked={automateOthers} onCheckedChange={setAutomateOthers} />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        <Save className="h-4 w-4 mr-2" />
        Guardar Configuración de Egresos
      </Button>
    </div>
  )
}
```

#### 1.2. Integrar en `LocationsManager.tsx`
- Agregar nueva pestaña "Egresos" en modal de detalle de sede
- Tab structure: Info, Services, Egresos (NEW), Hours, Media
- Renderizar `<LocationExpenseConfig locationId={location.id} businessId={business.id} />`

#### 1.3. Lógica de Sincronización
Cuando usuario guarda `LocationExpenseConfig`:

```typescript
// Pseudo-código del handleSave

// 1. UPSERT en location_expense_config
const { data: configData, error: configError } = await supabase
  .from('location_expense_config')
  .upsert({
    location_id: locationId,
    business_id: businessId,
    rent_amount: rentAmount,
    rent_due_day: rentDueDay,
    landlord_name: landlordName,
    landlord_contact: landlordContact,
    lease_start_date: leaseStartDate,
    lease_end_date: leaseEndDate,
    electricity_avg: electricityAvg,
    water_avg: waterAvg,
    gas_avg: gasAvg,
    internet_avg: internetAvg,
    phone_avg: phoneAvg,
    security_amount: securityAmount,
    cleaning_amount: cleaningAmount,
    waste_disposal_amount: wasteDisposalAmount,
    is_active: true,
    updated_at: new Date().toISOString()
  })
  .eq('location_id', locationId)
  .select()

// 2. Si automation habilitada, crear/actualizar recurring_expenses

// 2A. Arriendo
if (automateRent && rentAmount > 0) {
  await supabase.from('recurring_expenses').upsert({
    business_id: businessId,
    location_id: locationId,
    name: `Arriendo - ${locationName}`,
    description: `Arriendo mensual de ${locationName}. Propietario: ${landlordName}`,
    category: 'rent',
    amount: rentAmount,
    currency: 'COP',
    recurrence_frequency: 'monthly',
    recurrence_day: rentDueDay,
    next_payment_date: calculateNextDueDate(rentDueDay),
    is_automated: true,
    is_active: true
  }, { onConflict: 'business_id,location_id,category' })
}

// 2B. Utilities (5 egresos: electricity, water, gas, internet, phone)
if (automateUtilities) {
  const utilities = [
    { category: 'electricity', amount: electricityAvg, name: 'Electricidad' },
    { category: 'water', amount: waterAvg, name: 'Agua' },
    { category: 'gas', amount: gasAvg, name: 'Gas' },
    { category: 'internet', amount: internetAvg, name: 'Internet' },
    { category: 'phone', amount: phoneAvg, name: 'Teléfono' }
  ]

  for (const utility of utilities) {
    if (utility.amount > 0) {
      await supabase.from('recurring_expenses').upsert({
        business_id: businessId,
        location_id: locationId,
        name: `${utility.name} - ${locationName}`,
        category: utility.category,
        amount: utility.amount,
        currency: 'COP',
        recurrence_frequency: 'monthly',
        recurrence_day: 5, // Default día 5 para servicios públicos
        next_payment_date: calculateNextDueDate(5),
        is_automated: true,
        is_active: true
      }, { onConflict: 'business_id,location_id,category' })
    }
  }
}

// 2C. Other services (security, cleaning, waste_disposal)
if (automateOthers) {
  const otherServices = [
    { category: 'security', amount: securityAmount, name: 'Seguridad', frequency: 'monthly' },
    { category: 'cleaning', amount: cleaningAmount, name: 'Aseo', frequency: 'monthly' },
    { category: 'waste_disposal', amount: wasteDisposalAmount, name: 'Recolección de Basuras', frequency: 'monthly' }
  ]

  for (const service of otherServices) {
    if (service.amount > 0) {
      await supabase.from('recurring_expenses').upsert({
        business_id: businessId,
        location_id: locationId,
        name: `${service.name} - ${locationName}`,
        category: service.category,
        amount: service.amount,
        currency: 'COP',
        recurrence_frequency: service.frequency,
        recurrence_day: 1,
        next_payment_date: calculateNextDueDate(1),
        is_automated: true,
        is_active: true
      }, { onConflict: 'business_id,location_id,category' })
    }
  }
}
```

#### 1.4. Testing de Fase 1
- [ ] Crear sede nueva → Configurar arriendo → Verificar recurring_expense creado
- [ ] Editar sede existente → Cambiar monto arriendo → Verificar recurring_expense actualizado
- [ ] Deshabilitar automation toggle → Verificar recurring_expense.is_automated = false
- [ ] Ejecutar `process_due_recurring_expenses()` → Verificar transacciones generadas
- [ ] Verificar datos en `location_expense_config` se guardan correctamente

---

### FASE 2: EmployeeManagement - Configuración de Salarios (Días 4-6)

#### 2.1. Crear Componente `EmployeeSalaryConfig.tsx` (Nuevo)
```tsx
// src/components/admin/employees/EmployeeSalaryConfig.tsx
interface EmployeeSalaryConfigProps {
  employeeId: string
  businessId: string
  currentSalaryBase?: number
  currentSalaryType?: 'monthly' | 'biweekly' | 'weekly' | 'daily' | 'hourly'
}

export function EmployeeSalaryConfig({
  employeeId,
  businessId,
  currentSalaryBase,
  currentSalaryType
}: EmployeeSalaryConfigProps) {
  const [salaryBase, setSalaryBase] = useState(currentSalaryBase || 0)
  const [salaryType, setSalaryType] = useState<typeof currentSalaryType>(currentSalaryType || 'monthly')
  const [automatePayroll, setAutomatePayroll] = useState(true)
  const [paymentDay, setPaymentDay] = useState(30) // Día del mes para pago (si es mensual)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      // 1. Update business_employees.salary_base y salary_type
      const { error: employeeError } = await supabase
        .from('business_employees')
        .update({
          salary_base: salaryBase,
          salary_type: salaryType,
          updated_at: new Date().toISOString()
        })
        .eq('employee_id', employeeId)
        .eq('business_id', businessId)

      if (employeeError) throw employeeError

      // 2. Si automation habilitada, crear/actualizar recurring_expense de payroll
      if (automatePayroll && salaryBase > 0) {
        const recurrenceFrequency = salaryType === 'biweekly' ? 'biweekly' : salaryType === 'weekly' ? 'weekly' : 'monthly'
        const recurrenceDay = salaryType === 'monthly' ? paymentDay : 15 // Default día 15 para quincenal/semanal

        await supabase.from('recurring_expenses').upsert({
          business_id: businessId,
          employee_id: employeeId,
          name: `Salario - ${employeeName}`,
          description: `Salario ${salaryType} de ${employeeName}`,
          category: 'payroll',
          amount: salaryBase,
          currency: 'COP',
          recurrence_frequency: recurrenceFrequency,
          recurrence_day: recurrenceDay,
          next_payment_date: calculateNextPaymentDate(recurrenceFrequency, recurrenceDay),
          is_automated: automatePayroll,
          is_active: true
        }, { onConflict: 'business_id,employee_id,category' })
      }

      toast.success('Configuración de salario guardada exitosamente')
    } catch (error) {
      toast.error('Error al guardar configuración de salario')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Configuración de Nómina
        </CardTitle>
        <CardDescription>
          Configure el salario base y frecuencia de pago de este empleado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="salary-base">Salario Base (COP)</Label>
            <Input
              id="salary-base"
              type="number"
              min={0}
              value={salaryBase}
              onChange={(e) => setSalaryBase(Number(e.target.value))}
              placeholder="1.300.000"
            />
            {salaryBase > 0 && (
              <p className="text-xs text-muted-foreground">
                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(salaryBase)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="salary-type">Frecuencia de Pago</Label>
            <Select value={salaryType} onValueChange={(v) => setSalaryType(v as typeof salaryType)}>
              <SelectTrigger id="salary-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensual</SelectItem>
                <SelectItem value="biweekly">Quincenal</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="daily">Diario</SelectItem>
                <SelectItem value="hourly">Por Hora</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {salaryType === 'monthly' && (
          <div className="space-y-2">
            <Label htmlFor="payment-day">Día de Pago del Mes</Label>
            <Select value={paymentDay.toString()} onValueChange={(v) => setPaymentDay(Number(v))}>
              <SelectTrigger id="payment-day">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    Día {day}
                  </SelectItem>
                ))}
                <SelectItem value="30">Último día del mes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <Separator />

        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">Generar egreso recurrente automáticamente</Label>
            <p className="text-sm text-muted-foreground">
              Crea un registro de egreso que se procesará automáticamente cada período de pago
            </p>
          </div>
          <Switch checked={automatePayroll} onCheckedChange={setAutomatePayroll} />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Guardando...' : 'Guardar Configuración de Salario'}
        </Button>
      </CardContent>
    </Card>
  )
}
```

#### 2.2. Integrar en `EmployeeManagementHierarchy.tsx`
- Agregar nueva sección "Configuración de Nómina" en modal de detalle de empleado
- Renderizar `<EmployeeSalaryConfig employeeId={employee.id} businessId={businessId} currentSalaryBase={employee.salary_base} currentSalaryType={employee.salary_type} />`
- Ubicación: Después de sección de información personal/contacto

#### 2.3. Testing de Fase 2
- [ ] Crear empleado nuevo → Configurar salario mensual → Verificar recurring_expense creado
- [ ] Editar empleado existente → Cambiar salario → Verificar recurring_expense actualizado
- [ ] Cambiar frecuencia de pago (monthly → biweekly) → Verificar recurrence_frequency actualizado
- [ ] Deshabilitar automation toggle → Verificar is_automated = false
- [ ] Ejecutar `process_due_recurring_expenses()` → Verificar transacción de nómina generada

---

### FASE 3: Business Settings - Egresos Generales (Días 7-9)

#### 3.1. Extender `AdminRolePreferences` en `CompleteUnifiedSettings.tsx`
Agregar nueva Card DESPUÉS de "Configuraciones de Operación":

```tsx
{/* Egresos Recurrentes del Negocio */}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Wallet className="h-5 w-5" />
      Egresos Recurrentes del Negocio
    </CardTitle>
    <CardDescription>
      Configure los egresos generales de su negocio (seguros, software, honorarios, impuestos)
    </CardDescription>
  </CardHeader>
  <CardContent>
    <BusinessRecurringExpenses businessId={business.id} />
  </CardContent>
</Card>
```

#### 3.2. Crear Componente `BusinessRecurringExpenses.tsx` (Nuevo)
```tsx
// src/components/admin/settings/BusinessRecurringExpenses.tsx
interface BusinessRecurringExpensesProps {
  businessId: string
}

export function BusinessRecurringExpenses({ businessId }: BusinessRecurringExpensesProps) {
  const [expenses, setExpenses] = useState<RecurringExpense[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  
  // Form state para nuevo egreso
  const [newExpenseName, setNewExpenseName] = useState('')
  const [newExpenseCategory, setNewExpenseCategory] = useState<TransactionCategory>('liability_insurance')
  const [newExpenseAmount, setNewExpenseAmount] = useState(0)
  const [newExpenseFrequency, setNewExpenseFrequency] = useState<RecurrenceFrequency>('monthly')
  const [newExpenseDay, setNewExpenseDay] = useState(1)
  const [newExpenseAutomated, setNewExpenseAutomated] = useState(true)

  // Load existing business-level recurring expenses
  useEffect(() => {
    const loadExpenses = async () => {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .eq('business_id', businessId)
        .is('location_id', null) // Business-level: no location_id
        .is('employee_id', null) // Business-level: no employee_id
        .eq('is_active', true)

      if (!error && data) {
        setExpenses(data)
      }
    }
    loadExpenses()
  }, [businessId])

  const handleAddExpense = async () => {
    if (!newExpenseName.trim() || newExpenseAmount <= 0) {
      toast.error('Nombre y monto son requeridos')
      return
    }

    try {
      const { error } = await supabase.from('recurring_expenses').insert({
        business_id: businessId,
        location_id: null, // Business-level
        employee_id: null, // Business-level
        name: newExpenseName.trim(),
        category: newExpenseCategory,
        amount: newExpenseAmount,
        currency: 'COP',
        recurrence_frequency: newExpenseFrequency,
        recurrence_day: newExpenseDay,
        next_payment_date: calculateNextDueDate(newExpenseDay, newExpenseFrequency),
        is_automated: newExpenseAutomated,
        is_active: true
      })

      if (error) throw error

      toast.success('Egreso recurrente agregado exitosamente')
      setShowAddForm(false)
      // Reset form
      setNewExpenseName('')
      setNewExpenseAmount(0)
      // Reload expenses
      // ... (trigger refetch)
    } catch {
      toast.error('Error al agregar egreso recurrente')
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    // Soft delete: set is_active = false
    await supabase
      .from('recurring_expenses')
      .update({ is_active: false })
      .eq('id', expenseId)
  }

  return (
    <div className="space-y-4">
      {/* Lista de egresos existentes */}
      <div className="space-y-2">
        {expenses.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay egresos recurrentes configurados para este negocio
          </p>
        )}
        {expenses.map((expense) => (
          <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <p className="font-medium">{expense.name}</p>
              <p className="text-xs text-muted-foreground">
                {getCategoryLabel(expense.category)} • {formatCurrency(expense.amount)} • {getFrequencyLabel(expense.recurrence_frequency)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={expense.is_automated ? 'default' : 'secondary'}>
                {expense.is_automated ? 'Automático' : 'Manual'}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => handleDeleteExpense(expense.id)}>
                <Trash className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Botón para agregar nuevo */}
      {!showAddForm && (
        <Button variant="outline" onClick={() => setShowAddForm(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Egreso Recurrente
        </Button>
      )}

      {/* Formulario para agregar nuevo */}
      {showAddForm && (
        <Card className="border-dashed">
          <CardContent className="pt-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Nombre del Egreso</Label>
                <Input
                  placeholder="Ej: Seguro de Responsabilidad Civil"
                  value={newExpenseName}
                  onChange={(e) => setNewExpenseName(e.target.value)}
                />
              </div>

              <div>
                <Label>Categoría</Label>
                <Select value={newExpenseCategory} onValueChange={(v) => setNewExpenseCategory(v as TransactionCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="liability_insurance">Seguro de Responsabilidad Civil</SelectItem>
                    <SelectItem value="fire_insurance">Seguro Contra Incendio</SelectItem>
                    <SelectItem value="theft_insurance">Seguro Contra Robo</SelectItem>
                    <SelectItem value="health_insurance">Seguro de Salud Empleados</SelectItem>
                    <SelectItem value="software">Software y Suscripciones</SelectItem>
                    <SelectItem value="accounting_fees">Honorarios Contables</SelectItem>
                    <SelectItem value="legal_fees">Honorarios Legales</SelectItem>
                    <SelectItem value="consulting_fees">Consultoría Externa</SelectItem>
                    <SelectItem value="property_tax">Impuesto Predial</SelectItem>
                    <SelectItem value="income_tax">Impuesto de Renta</SelectItem>
                    <SelectItem value="vat">IVA</SelectItem>
                    <SelectItem value="miscellaneous">Otros Gastos Generales</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Monto (COP)</Label>
                <Input
                  type="number"
                  min={0}
                  value={newExpenseAmount}
                  onChange={(e) => setNewExpenseAmount(Number(e.target.value))}
                  placeholder="500.000"
                />
              </div>

              <div>
                <Label>Frecuencia</Label>
                <Select value={newExpenseFrequency} onValueChange={(v) => setNewExpenseFrequency(v as RecurrenceFrequency)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Día de Pago</Label>
                <Input
                  type="number"
                  min={1}
                  max={28}
                  value={newExpenseDay}
                  onChange={(e) => setNewExpenseDay(Number(e.target.value))}
                />
              </div>

              <div className="col-span-2 flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <Label>Generar automáticamente</Label>
                <Switch checked={newExpenseAutomated} onCheckedChange={setNewExpenseAutomated} />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddExpense} size="sm">Guardar</Button>
              <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

#### 3.3. Testing de Fase 3
- [ ] Agregar seguro de responsabilidad civil → Verificar recurring_expense con location_id=NULL, employee_id=NULL
- [ ] Agregar software mensual → Verificar next_payment_date calculado correctamente
- [ ] Editar monto de egreso existente → Verificar actualización
- [ ] Eliminar egreso → Verificar soft delete (is_active = false)
- [ ] Ejecutar `process_due_recurring_expenses()` → Verificar transacciones generadas

---

### FASE 4: Sincronización Bidireccional (Días 10-12)

#### 4.1. Reglas de Sincronización
1. **Entity Config → recurring_expenses**:
   - Cuando usuario guarda LocationExpenseConfig → UPSERT en recurring_expenses
   - Cuando usuario guarda EmployeeSalaryConfig → UPSERT en recurring_expenses
   - Cuando usuario guarda BusinessRecurringExpense → INSERT en recurring_expenses

2. **recurring_expenses → Entity Config**:
   - Si recurring_expense tiene location_id → Reflejar en location_expense_config
   - Si recurring_expense tiene employee_id → Reflejar en business_employees.salary_base/salary_type
   - Si recurring_expense NO tiene location_id NI employee_id → Es egreso general de negocio

3. **Conflictos**:
   - Last write wins (el último cambio prevalece)
   - Toast warning si cambio fue en UI diferente a donde se originó

#### 4.2. Modificar `ExpensesManagementPage` para Indicar Origen
Agregar badges de origen en lista de egresos:

```tsx
<Badge variant="secondary">
  {expense.location_id && `Configurado en: ${locationName}`}
  {expense.employee_id && `Configurado en: Empleado ${employeeName}`}
  {!expense.location_id && !expense.employee_id && 'Egreso General del Negocio'}
</Badge>
```

Modificar botón "Editar":
```tsx
<Button
  variant="outline"
  size="sm"
  onClick={() => {
    if (expense.location_id) {
      toast.info('Este egreso está configurado en la sede. Navegando...')
      navigate(`/app/admin/locations/${expense.location_id}`)
    } else if (expense.employee_id) {
      toast.info('Este egreso está configurado en el empleado. Navegando...')
      navigate(`/app/admin/employees/${expense.employee_id}`)
    } else {
      navigate(`/app/admin/settings?tab=business-expenses`)
    }
  }}
>
  <Edit className="h-4 w-4 mr-1" />
  Editar en Origen
</Button>
```

#### 4.3. Testing de Sincronización
- [ ] Crear arriendo en LocationsManager → Verificar aparece en ExpensesManagementPage con badge "Sede"
- [ ] Editar salario en EmployeeManagement → Verificar recurring_expense actualizado
- [ ] Cambiar monto de arriendo en ExpensesManagementPage → Verificar location_expense_config actualizado
- [ ] Eliminar sede con egresos configurados → Verificar recurring_expenses se desactivan (CASCADE)
- [ ] Eliminar empleado con salario configurado → Verificar recurring_expense de payroll se desactiva

---

## 🧪 PLAN DE PRUEBAS COMPLETO

### Pruebas Unitarias (Por Fase)
- [ ] LocationExpenseConfig: Validación de campos, cálculo de next_payment_date
- [ ] EmployeeSalaryConfig: Validación de salary_base, conversión de salary_type a recurrence_frequency
- [ ] BusinessRecurringExpenses: CRUD de egresos generales
- [ ] Sincronización: UPSERT conflicts, CASCADE deletes

### Pruebas de Integración
- [ ] Flow completo: Crear sede → Configurar egresos → Ver en ExpensesManagementPage
- [ ] Flow completo: Crear empleado → Configurar salario → Ejecutar automation → Ver transacción
- [ ] Flow completo: Configurar seguro en Settings → Ver en ExpensesManagementPage
- [ ] Edición cruzada: Cambiar arriendo en ExpensesManagementPage → Verificar location_expense_config actualizado

### Pruebas de Automatización
- [ ] `process_due_recurring_expenses()` ejecutado manualmente vía MCP
- [ ] Verificar transacciones generadas con correct_category, correct_amount
- [ ] Verificar next_payment_date incrementado correctamente
- [ ] Verificar payments_count y total_paid actualizados

### Pruebas de Retrocompatibilidad
- [ ] Egresos creados con ExpenseRegistrationForm ANTES de cambio siguen funcionando
- [ ] ExpensesManagementPage muestra TODOS los egresos (nuevos contextuales + viejos centralizados)
- [ ] Automation sigue funcionando para egresos creados antes del cambio

---

## 📈 MÉTRICAS DE ÉXITO

### Indicadores Cuantitativos
- ✅ 100% de egresos de sede configurables desde LocationsManager
- ✅ 100% de salarios configurables desde EmployeeManagement
- ✅ 100% de egresos generales configurables desde Business Settings
- ✅ 0 errores de sincronización entre entity configs y recurring_expenses
- ✅ 0 breaking changes en funcionalidad existente

### Indicadores Cualitativos
- ✅ Usuarios encuentran configuración de arriendo en detalles de sede (no en sidebar "Egresos")
- ✅ Usuarios encuentran configuración de salario en perfil de empleado
- ✅ ExpensesManagementPage actúa como dashboard de visualización (no como formulario de creación)
- ✅ UX más intuitiva: "Configurar donde se gestiona la entidad"

---

## 🚀 CRONOGRAMA

| Fase | Descripción | Días | Prioridad |
|------|------------|------|-----------|
| 1 | LocationsManager - Egresos de Sede | 3 | 🔴 CRÍTICA |
| 2 | EmployeeManagement - Salarios | 3 | 🔴 CRÍTICA |
| 3 | Business Settings - Egresos Generales | 3 | 🟡 MEDIA |
| 4 | Sincronización Bidireccional | 3 | 🔴 CRÍTICA |
| **TOTAL** | **Implementación Completa** | **12 días** | - |

---

## ✅ CHECKLIST DE FINALIZACIÓN

### Código
- [ ] `LocationExpenseConfig.tsx` creado y funcional
- [ ] `LocationsManager.tsx` integrado con tab "Egresos"
- [ ] `EmployeeSalaryConfig.tsx` creado y funcional
- [ ] `EmployeeManagementHierarchy.tsx` integrado con sección "Nómina"
- [ ] `BusinessRecurringExpenses.tsx` creado y funcional
- [ ] `CompleteUnifiedSettings.tsx` extendido con egresos de negocio
- [ ] `ExpensesManagementPage.tsx` modificado con badges de origen y navegación

### Base de Datos
- [ ] `location_expense_config` table poblada con datos de prueba
- [ ] `business_employees.salary_base` y `salary_type` poblados
- [ ] `recurring_expenses` creados automáticamente desde entity configs
- [ ] Foreign keys funcionando correctamente (CASCADE on delete)

### Testing
- [ ] 12 pruebas unitarias pasadas
- [ ] 4 pruebas de integración pasadas
- [ ] 4 pruebas de automatización pasadas
- [ ] 2 pruebas de retrocompatibilidad pasadas

### Documentación
- [ ] Actualizar `copilot-instructions.md` con nueva arquitectura
- [ ] Documentar lógica de sincronización en TECHNICAL_NOTES.md
- [ ] Screenshots de UI agregados a docs/
- [ ] User guide para configuración contextual de egresos

---

## 📝 NOTAS FINALES

### Consideraciones de Diseño
1. **No romper nada existente**: ExpenseRegistrationForm sigue funcionando para egresos ad-hoc
2. **Gradual adoption**: Usuarios pueden seguir usando centralizado si prefieren
3. **Discovery natural**: Nuevos usuarios descubrirán configuración contextual automáticamente
4. **Clear feedback**: Badges y toasts indican claramente dónde está configurado cada egreso

### Mejoras Futuras (Fuera de Scope)
- [ ] Dashboard de proyecciones de cash flow basado en recurring_expenses
- [ ] Alertas cuando egreso automático falla (ej: insuficiente saldo)
- [ ] Comparación de egresos mes a mes por categoría
- [ ] Export de egresos a CSV/Excel
- [ ] Integración con sistemas contables externos (QuickBooks, Siigo)

---

**Fin del Documento**
