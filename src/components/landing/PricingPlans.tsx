import { Check, Sparkles, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { PRICING_PLANS } from '@/lib/pricingPlans'

interface PricingPlansProps {
  showCTA?: boolean
  onSelectPlan?: (planId: string) => void
  compact?: boolean
}

export function PricingPlans({
  showCTA = false,
  onSelectPlan,
  compact = false,
}: PricingPlansProps) {
  const plans = PRICING_PLANS
  const formatPrice = (price: number | null) => {
    if (price === null) return 'A cotizar'
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className={cn('grid gap-8', compact ? 'md:grid-cols-2 lg:grid-cols-4' : 'lg:grid-cols-4')}>
      {plans.map(plan => (
        <Card
          key={plan.id}
          className={cn(
            'relative flex flex-col bg-white',
            plan.popular && 'border-purple-600 shadow-xl scale-105 z-10',
            !compact && 'hover:shadow-2xl transition-all'
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

          <CardHeader className={cn('space-y-4', compact ? 'pb-4' : 'pb-6')}>
            <div>
              <CardTitle
                className={cn(
                  'flex items-center justify-between text-gray-900',
                  compact ? 'text-xl' : 'text-2xl'
                )}
              >
                {plan.name}
              </CardTitle>
              <CardDescription
                className={cn('mt-2 text-gray-600', compact ? 'text-xs' : 'text-sm')}
              >
                {plan.subtitle}
              </CardDescription>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span
                  className={cn('font-bold text-purple-600', compact ? 'text-3xl' : 'text-4xl')}
                >
                  {formatPrice(plan.price)}
                </span>
                {plan.price && <span className="text-gray-600">/mes</span>}
              </div>
              {plan.priceAnnual && (
                <div className={cn('text-gray-600 mt-2', compact ? 'text-xs' : 'text-sm')}>
                  {formatPrice(plan.priceAnnual)}/año (10% OFF)
                </div>
              )}
            </div>

            {!compact && <p className="text-sm text-gray-600">{plan.description}</p>}
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
                  className={cn('flex items-start gap-3', compact ? 'text-xs' : 'text-sm')}
                >
                  {feature.included ? (
                    <Check
                      className={cn(
                        'flex-shrink-0 text-green-500',
                        compact ? 'h-4 w-4' : 'h-5 w-5'
                      )}
                    />
                  ) : (
                    <X
                      className={cn('flex-shrink-0 text-gray-300', compact ? 'h-4 w-4' : 'h-5 w-5')}
                    />
                  )}
                  <span
                    className={cn(
                      feature.highlight ? 'font-semibold text-gray-900' : 'text-gray-700',
                      !feature.included && 'text-gray-400 line-through'
                    )}
                  >
                    {feature.name}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            {showCTA && (
              <Button
                className={cn(
                  'w-full mt-6',
                  plan.popular && 'bg-purple-600 hover:bg-purple-700 text-white'
                )}
                variant={plan.popular ? 'default' : 'outline'}
                size={compact ? 'default' : 'lg'}
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
