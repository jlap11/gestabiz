# Mejoras al Sistema de Facturación - Plan Gratuito

## Resumen de Cambios (17 de octubre de 2025)

### ✅ Cambios Implementados

#### 1. **Plan Gratuito Agregado** ⭐
- Se agregó un nuevo plan "Gratuito" con características limitadas
- **Características del Plan Gratuito:**
  - 1 sede
  - 1 empleado
  - 1 servicio
  - Hasta 3 citas al mes
  - Calendario básico
  - Notificaciones por email únicamente
  - Sin SMS, WhatsApp, Analytics, API ni Soporte

#### 2. **Mensaje Mejorado Sin Suscripción Activa**
- **Antes:** Mostraba "Sin Suscripción Activa" con botón "Ver Planes"
- **Ahora:** Muestra tarjeta del "Plan Gratuito" con:
  - Icono de checkmark verde
  - Lista de características incluidas
  - Mensaje incentivando actualización al Plan Inicio
  - Botón "Ver Plan Inicio" en lugar de "Ver Planes"

#### 3. **Planes Deshabilitados (Solo Inicio Activo)**
- **Plan Inicio:** ✅ Habilitado y marcado como "Más Popular"
  - Precio: $80,000 COP/mes ($800,000 COP/año)
  - CTA: "Actualizar Ahora"
  - Características mejoradas vs Gratuito
- **Plan Profesional:** 🔒 Deshabilitado
  - Badge "Próximamente"
  - Opacidad 60%
  - CTA: "Próximamente"
  - Click muestra toast: "Este plan estará disponible próximamente"
- **Plan Empresarial:** 🔒 Deshabilitado
  - Badge "Próximamente"
  - Opacidad 60%
  - CTA: "Próximamente"
- **Plan Corporativo:** 🔒 Deshabilitado
  - Badge "Próximamente"
  - Opacidad 60%
  - CTA: "Próximamente"

### 📁 Archivos Modificados

#### 1. `src/components/billing/BillingDashboard.tsx`
**Cambio:** Tarjeta de Plan Gratuito cuando no hay suscripción activa

```tsx
// ANTES (líneas 73-86)
if (!dashboard?.subscription) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sin Suscripción Activa</CardTitle>
        <CardDescription>
          Suscríbete a un plan para acceder a todas las funcionalidades
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => setShowPricingPage(true)}>
          Ver Planes
        </Button>
      </CardContent>
    </Card>
  )
}

// AHORA
if (!dashboard?.subscription) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Plan Gratuito
          </CardTitle>
          <CardDescription>
            Actualmente estás usando el plan gratuito con funcionalidades básicas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Características incluidas:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Registro de negocios básico
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Hasta 3 citas por mes
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                1 empleado
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                1 servicio
              </li>
            </ul>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-4">
              ¿Quieres desbloquear más funcionalidades? Actualiza al Plan Inicio
            </p>
            <Button onClick={() => setShowPricingPage(true)} className="w-full">
              Ver Plan Inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

#### 2. `src/pages/PricingPage.tsx`
**Cambios:**
1. Tipo `PlanType` actualizado: `'gratuito' | 'inicio' | ...`
2. Nuevo plan "Gratuito" agregado al array `plans`
3. Plan "Inicio" marcado como `popular: true` (movido desde Profesional)
4. Planes Profesional, Empresarial y Corporativo con `cta: 'Próximamente'`
5. Lógica de `handleSelectPlan` actualizada para bloquear planes deshabilitados
6. UI actualizada para mostrar badge "Próximamente" y opacidad 60%

```tsx
// Tipo actualizado (línea 18)
type PlanType = 'gratuito' | 'inicio' | 'profesional' | 'empresarial' | 'corporativo'

// Nuevo plan agregado (líneas 44-67)
{
  id: 'gratuito' as PlanType,
  name: 'Gratuito',
  icon: <Sparkles className="h-6 w-6" />,
  description: 'Ideal para probar la plataforma',
  priceMonthly: 0,
  priceYearly: 0,
  cta: 'Plan Actual',
  features: [...]
}

// Plan Inicio ahora es popular (línea 74)
popular: true,

// Lógica actualizada (líneas 217-233)
const handleSelectPlan = async (plan: Plan) => {
  if (!user) {
    toast.error('Debes iniciar sesión para seleccionar un plan')
    return
  }

  // Solo permitir plan Inicio por ahora
  if (plan.id === 'gratuito') {
    toast.info('Ya estás en el plan gratuito')
    return
  }

  if (plan.id !== 'inicio') {
    toast.info('Este plan estará disponible próximamente')
    return
  }

  // Procesar pago solo para plan Inicio...
}

// UI actualizada (líneas 318-340)
const isDisabled = plan.id !== 'inicio' && plan.id !== 'gratuito'
const isPlanGratuito = plan.id === 'gratuito'

<Card className={`... ${isDisabled ? 'opacity-60' : ''}`}>
  {isDisabled && (
    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-muted-foreground">
      Próximamente
    </Badge>
  )}
  ...
  <Button
    disabled={isPlanGratuito || isDisabled || isProcessing}
  >
    {isProcessing ? 'Procesando...' : plan.cta}
  </Button>
</Card>
```

### 🎨 Cambios Visuales

#### Dashboard de Facturación (Sin Suscripción)
```
┌─────────────────────────────────────────┐
│ ✓ Plan Gratuito                         │
│ Actualmente estás usando el plan        │
│ gratuito con funcionalidades básicas    │
├─────────────────────────────────────────┤
│ Características incluidas:              │
│ ✓ Registro de negocios básico           │
│ ✓ Hasta 3 citas por mes                 │
│ ✓ 1 empleado                             │
│ ✓ 1 servicio                             │
├─────────────────────────────────────────┤
│ ¿Quieres desbloquear más funcionalidades?│
│ Actualiza al Plan Inicio                │
│                                          │
│ [     Ver Plan Inicio     ]              │
└─────────────────────────────────────────┘
```

#### Página de Planes
```
┌────────────┬────────────┬────────────┬────────────┐
│  Gratuito  │   Inicio   │ Profesional│ Empresarial│
│            │ MÁS POPULAR│ PRÓXIMAMENTE│PRÓXIMAMENTE│
├────────────┼────────────┼────────────┼────────────┤
│   Gratis   │ $80,000/mes│ $200,000   │  $500,000  │
│            │            │  (opaco)   │  (opaco)   │
├────────────┼────────────┼────────────┼────────────┤
│ Features:  │ Features:  │ Features:  │ Features:  │
│ ✓ 1 sede   │ ✓ 1 sede   │ ✓ 3 sedes  │ ✓ 10 sedes │
│ ✓ 1 empl.  │ ✓ 3 empl.  │ ✓ 10 empl. │ ✓ 50 empl. │
│ ...        │ ...        │ ...        │ ...        │
├────────────┼────────────┼────────────┼────────────┤
│[Plan Actual]│[Actualizar│[Próximamente│[Próximamente│
│ (disabled) │   Ahora]  │] (disabled)│] (disabled)│
└────────────┴────────────┴────────────┴────────────┘
```

### 🎯 Flujos de Usuario

#### Flujo 1: Usuario Nuevo (Sin Suscripción)
1. Usuario admin ingresa a "Facturación"
2. Ve tarjeta "Plan Gratuito" con características limitadas
3. Click en "Ver Plan Inicio"
4. Ve página de planes con solo "Inicio" habilitado
5. Click en "Actualizar Ahora" → Checkout (Stripe/PayU)

#### Flujo 2: Usuario en Plan Gratuito Intenta Otro Plan
1. Usuario ve página de planes
2. Intenta click en "Profesional", "Empresarial" o "Corporativo"
3. Ve toast: "Este plan estará disponible próximamente"
4. Botones están deshabilitados (no hace nada)

#### Flujo 3: Usuario Intenta Re-seleccionar Gratuito
1. Usuario ve página de planes
2. Intenta click en "Plan Actual" (Gratuito)
3. Ve toast: "Ya estás en el plan gratuito"
4. Botón está deshabilitado

### 📊 Comparación de Planes

| Característica               | Gratuito | Inicio  | Profesional | Empresarial |
|------------------------------|----------|---------|-------------|-------------|
| **Precio/mes**               | Gratis   | $80,000 | $200,000    | $500,000    |
| **Estado**                   | ✅ Activo | ✅ Activo | 🔒 Próximo   | 🔒 Próximo   |
| **Sedes**                    | 1        | 1       | 3           | 10          |
| **Empleados**                | 1        | 3       | 10          | 50          |
| **Servicios**                | 1        | 5       | 20          | 100         |
| **Citas/mes**                | 3        | ∞       | ∞           | ∞           |
| **SMS**                      | ❌        | ✅       | ✅           | ✅           |
| **WhatsApp**                 | ❌        | ✅       | ✅           | ✅           |
| **Analytics**                | ❌        | ✅ Básico | ✅ Avanzado  | ✅ Avanzado  |

### 🔧 Testing Sugerido

#### Test 1: Ver Plan Gratuito
1. Ir a Admin Dashboard → Facturación
2. Verificar que se muestra tarjeta "Plan Gratuito"
3. Verificar lista de 4 características con checkmarks verdes
4. Verificar botón "Ver Plan Inicio"

#### Test 2: Página de Planes
1. Click en "Ver Plan Inicio"
2. Verificar 4 planes mostrados (Gratuito, Inicio, Profesional, Empresarial)
3. Verificar "Inicio" tiene badge "Más Popular"
4. Verificar otros 2 tienen badge "Próximamente" y opacidad 60%

#### Test 3: Interacción con Planes
1. Click en botón de plan "Gratuito" → Toast "Ya estás en el plan gratuito"
2. Click en botón de plan "Inicio" → Redirige a checkout
3. Click en botón de plan "Profesional" → Toast "Este plan estará disponible próximamente"
4. Click en botón de plan "Empresarial" → Toast "Este plan estará disponible próximamente"

### 📝 Notas Importantes

1. **Plan Gratuito No Requiere Pago:** El plan gratuito es automático para usuarios sin suscripción activa
2. **Migración de Base de Datos:** NO se requiere migración, el plan gratuito es estado por defecto
3. **Habilitación de Planes Futuros:** Para habilitar Profesional/Empresarial en el futuro:
   - Cambiar `isDisabled` logic en PricingPage.tsx
   - Actualizar RPC functions en Supabase para soportar estos planes
   - Agregar estos planes en Stripe/PayU dashboard

### ✅ Checklist de Completado

- [x] Plan Gratuito agregado al array de planes
- [x] Tipo `PlanType` actualizado con 'gratuito'
- [x] Dashboard muestra tarjeta de Plan Gratuito cuando no hay suscripción
- [x] Plan Inicio marcado como "Más Popular"
- [x] Planes Profesional y Empresarial deshabilitados con badge "Próximamente"
- [x] Opacidad 60% aplicada a planes deshabilitados
- [x] Lógica de `handleSelectPlan` actualizada para bloquear planes deshabilitados
- [x] Toasts informativos agregados para cada caso
- [x] UI muestra "Gratis" en lugar de "$0" para plan gratuito
- [x] Botones deshabilitados correctamente según plan

### 🚀 Próximos Pasos

1. **Testing:** Probar todos los flujos mencionados arriba
2. **Base de Datos:** Considerar agregar columna `current_plan` en tabla `businesses` para rastrear plan gratuito explícitamente
3. **Límites:** Implementar validación de límites del plan gratuito (3 citas/mes) en backend
4. **Onboarding:** Crear flujo de onboarding explicando beneficios del plan Inicio vs Gratuito
5. **Habilitación Futura:** Planear lanzamiento de planes Profesional y Empresarial

---

**Documentado por:** GitHub Copilot  
**Fecha:** 17 de octubre de 2025  
**Archivos Modificados:** 2 (BillingDashboard.tsx, PricingPage.tsx)  
**Líneas Agregadas:** ~120 líneas  
**Líneas Modificadas:** ~60 líneas
