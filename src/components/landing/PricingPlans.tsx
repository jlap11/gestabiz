import { Check, X, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PricingPlansProps {
  showCTA?: boolean
  onSelectPlan?: (planId: string) => void
  compact?: boolean
}

const plans = [
  {
    id: 'inicio',
    name: 'Inicio',
    subtitle: 'Para Emprendedores',
    price: 29900,
    priceAnnual: 322920,
    description: 'Perfecto para independientes y emprendimientos unipersonales',
    popular: false,
    limits: {
      businesses: 1,
      locations: 1,
      employees: 2,
      appointments: 150,
      clients: 100,
      services: 10
    },
    features: [
      { name: 'Gestión completa de citas y calendario', included: true },
      { name: 'Recordatorios automáticos (Email + WhatsApp)', included: true },
      { name: 'Gestión básica de clientes', included: true },
      { name: 'Catálogo de servicios', included: true },
      { name: 'Dashboard con estadísticas básicas', included: true },
      { name: 'App móvil incluida', included: true },
      { name: 'Soporte por email', included: true },
      { name: 'Sistema contable avanzado', included: false },
      { name: 'Multi-ubicación', included: false },
      { name: 'Portal de empleos', included: false }
    ]
  },
  {
    id: 'profesional',
    name: 'Profesional',
    subtitle: 'Para PyMES',
    price: 79900,
    priceAnnual: 862920,
    description: 'Ideal para negocios pequeños con múltiples empleados',
    popular: true,
    limits: {
      businesses: 1,
      locations: 3,
      employees: 6,
      appointments: 500,
      clients: 500,
      services: 30
    },
    features: [
      { name: 'Todo del Plan Inicio, más:', included: true, highlight: true },
      { name: 'Multi-ubicación (hasta 3 sucursales)', included: true },
      { name: 'Sistema contable básico (P&L, IVA, ICA)', included: true },
      { name: 'Gestión avanzada de clientes', included: true },
      { name: 'Reseñas y calificaciones públicas', included: true },
      { name: 'Sincronización Google Calendar', included: true },
      { name: 'Chat interno entre empleados', included: true },
      { name: 'Exportación de reportes (CSV, Excel)', included: true },
      { name: 'Extensión de navegador', included: true },
      { name: 'Soporte prioritario (Chat + Email)', included: true }
    ]
  },
  {
    id: 'empresarial',
    name: 'Empresarial',
    subtitle: 'Para Empresas Medianas',
    price: 149900,
    priceAnnual: 1619280,
    description: 'Para empresas con múltiples sucursales y equipos grandes',
    popular: false,
    limits: {
      businesses: 1,
      locations: 10,
      employees: 21,
      appointments: 'Ilimitado',
      clients: 'Ilimitado',
      services: 'Ilimitado'
    },
    features: [
      { name: 'Todo del Plan Profesional, más:', included: true, highlight: true },
      { name: 'Sistema contable completo + Facturación DIAN', included: true },
      { name: 'Reportes fiscales avanzados', included: true },
      { name: 'Portal de empleos/reclutamiento', included: true },
      { name: 'Analytics avanzados con IA', included: true },
      { name: 'API Access para integraciones', included: true },
      { name: 'Soporte Premium (Teléfono + WhatsApp)', included: true },
      { name: 'Onboarding personalizado', included: true },
      { name: 'Branding personalizado', included: true },
      { name: 'Capacitación del equipo', included: true }
    ]
  },
  {
    id: 'corporativo',
    name: 'Corporativo',
    subtitle: 'Para Grandes Empresas',
    price: null,
    priceAnnual: null,
    description: 'Solución enterprise con servidor dedicado y soporte 24/7',
    popular: false,
    limits: {
      businesses: 'Ilimitado',
      locations: 'Ilimitado',
      employees: 'Ilimitado',
      appointments: 'Ilimitado',
      clients: 'Ilimitado',
      services: 'Ilimitado'
    },
    features: [
      { name: 'Todo del Plan Empresarial, más:', included: true, highlight: true },
      { name: 'Servidor dedicado o instancia privada', included: true },
      { name: 'SLA garantizado (99.9% uptime)', included: true },
      { name: 'Desarrollo de funcionalidades custom', included: true },
      { name: 'Integraciones a medida', included: true },
      { name: 'Account Manager dedicado', included: true },
      { name: 'Soporte 24/7', included: true },
      { name: 'Capacitación presencial', included: true },
      { name: 'Migración de datos desde otros sistemas', included: true },
      { name: 'Backup diario dedicado', included: true }
    ]
  }
]

export function PricingPlans({ showCTA = false, onSelectPlan, compact = false }: PricingPlansProps) {
  const formatPrice = (price: number | null) => {
    if (price === null) return 'A cotizar'
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  return (
    <div className={cn(
      "grid gap-8",
      compact ? "md:grid-cols-2 lg:grid-cols-4" : "lg:grid-cols-4"
    )}>
      {plans.map((plan) => (
        <Card
          key={plan.id}
          className={cn(
            "relative flex flex-col bg-white",
            plan.popular && "border-purple-600 shadow-xl scale-105 z-10",
            !compact && "hover:shadow-2xl transition-all"
          )}
        >
          {plan.popular && (
            <div className="absolute -top-4 left-0 right-0 flex justify-center">
              <Badge className="bg-purple-600 text-white px-6 py-1 gap-2">
                <Sparkles className="h-4 w-4" />
                Más Popular
              </Badge>
            </div>
          )}

          <CardHeader className={cn("space-y-4", compact ? "pb-4" : "pb-6")}>
            <div>
              <CardTitle className={cn(
                "flex items-center justify-between text-gray-900",
                compact ? "text-xl" : "text-2xl"
              )}>
                {plan.name}
              </CardTitle>
              <CardDescription className={cn(
                "mt-2 text-gray-600",
                compact ? "text-xs" : "text-sm"
              )}>
                {plan.subtitle}
              </CardDescription>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className={cn(
                  "font-bold text-purple-600",
                  compact ? "text-3xl" : "text-4xl"
                )}>
                  {formatPrice(plan.price)}
                </span>
                {plan.price && (
                  <span className="text-gray-600">/mes</span>
                )}
              </div>
              {plan.priceAnnual && (
                <div className={cn(
                  "text-gray-600 mt-2",
                  compact ? "text-xs" : "text-sm"
                )}>
                  {formatPrice(plan.priceAnnual)}/año (10% OFF)
                </div>
              )}
            </div>

            {!compact && (
              <p className="text-sm text-gray-600">
                {plan.description}
              </p>
            )}
          </CardHeader>

          <CardContent className="flex-1 flex flex-col">
            {/* Limits */}
            {!compact && (
              <div className="mb-6 p-4 bg-purple-50 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ubicaciones:</span>
                  <span className="font-semibold text-gray-900">{plan.limits.locations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Empleados:</span>
                  <span className="font-semibold text-gray-900">{plan.limits.employees}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Citas/mes:</span>
                  <span className="font-semibold text-gray-900">{plan.limits.appointments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Clientes:</span>
                  <span className="font-semibold text-gray-900">{plan.limits.clients}</span>
                </div>
              </div>
            )}

            {/* Features */}
            <div className="space-y-3 flex-1">
              {plan.features.map((feature, index) => (
                <div
                  key={`${plan.id}-feature-${index}`}
                  className={cn(
                    "flex items-start gap-3",
                    compact ? "text-xs" : "text-sm"
                  )}
                >
                  {feature.included ? (
                    <Check className={cn(
                      "flex-shrink-0 text-green-500",
                      compact ? "h-4 w-4" : "h-5 w-5"
                    )} />
                  ) : (
                    <X className={cn(
                      "flex-shrink-0 text-gray-300",
                      compact ? "h-4 w-4" : "h-5 w-5"
                    )} />
                  )}
                  <span className={cn(
                    feature.highlight ? "font-semibold text-gray-900" : "text-gray-700",
                    !feature.included && "text-gray-400 line-through"
                  )}>
                    {feature.name}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            {showCTA && (
              <Button
                className={cn(
                  "w-full mt-6",
                  plan.popular && "bg-purple-600 hover:bg-purple-700 text-white"
                )}
                variant={plan.popular ? "default" : "outline"}
                size={compact ? "default" : "lg"}
                onClick={() => onSelectPlan?.(plan.id)}
              >
                {plan.price === null ? 'Contactar Ventas' : 'Comenzar Prueba Gratis'}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
