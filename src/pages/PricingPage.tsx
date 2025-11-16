// src/pages/PricingPage.tsx
// Página de selección de planes de suscripción
// Integra con create-checkout-session Edge Function

import React, { useState } from 'react'
import { Check, X, Sparkles, Building2, Rocket, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useSubscription } from '@/hooks/useSubscription'
import { useAuth } from '@/hooks/useAuth'
import { PRICING_PLANS } from '@/lib/pricingPlans'
import type { Plan } from '@/lib/pricingPlans'
import { toast } from 'sonner'

type BillingCycle = 'monthly' | 'yearly'

interface PricingPageProps {
  businessId?: string
  onClose?: () => void
}

export function PricingPage({ businessId: businessIdProp, onClose }: PricingPageProps = {}) {
  const { user } = useAuth()
  
  // Get businessId from prop first, then fallback to user
  const businessId = businessIdProp || user?.id
  const { createCheckout, applyDiscount, isLoading } = useSubscription(businessId || '')
  
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string
    discount: number
  } | null>(null)
  const [processingPlan, setProcessingPlan] = useState<string | null>(null)

  // Format currency manually (COP)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleBillingCycleToggle = () => {
    setBillingCycle((prev) => (prev === 'monthly' ? 'yearly' : 'monthly'))
    setAppliedDiscount(null) // Reset discount on cycle change
  }

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      toast.error('Ingresa un código de descuento')
      return
    }

    try {
      // Validate discount code against selected plan and billing cycle
      const result = await applyDiscount(discountCode, 'inicio', 80000) // Example values
      
      if (result.isValid) {
        setAppliedDiscount({
          code: discountCode,
          discount: result.discountAmount,
        })
        toast.success(`Código aplicado: ${formatCurrency(result.discountAmount)} de descuento`)
      } else {
        toast.error(result.message || 'Código inválido o expirado')
      }
    } catch {
      toast.error('Error al validar el código')
    }
  }

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

    setProcessingPlan(plan.id)

    try {
      await createCheckout(plan.id, billingCycle, appliedDiscount?.code)
      
      // createCheckout redirects to Stripe/PayU Checkout automatically
    } catch {
      toast.error('Error al crear la sesión de pago')
      setProcessingPlan(null)
    }
  }

  const getPrice = (plan: Plan) => {
    if (plan.price === 0) return null // Custom pricing
    
    const basePrice = billingCycle === 'monthly' ? plan.price : (plan.priceAnnual || 0) / 12
    const discount = appliedDiscount?.discount || 0
    const finalPrice = basePrice - discount

    return {
      base: basePrice,
      final: finalPrice > 0 ? finalPrice : 0,
      hasDiscount: discount > 0,
    }
  }

  const yearlyDiscount = 17 // 17% discount for yearly billing

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-4">
            Planes y Precios
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Elige el plan perfecto para tu negocio. Sin sorpresas, sin costos ocultos.
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className={billingCycle === 'monthly' ? 'font-semibold' : 'text-muted-foreground'}>
            Mensual
          </span>
          <Switch
            checked={billingCycle === 'yearly'}
            onCheckedChange={handleBillingCycleToggle}
            aria-label="Toggle billing cycle"
          />
          <span className={billingCycle === 'yearly' ? 'font-semibold' : 'text-muted-foreground'}>
            Anual
          </span>
          {billingCycle === 'yearly' && (
            <Badge variant="secondary" className="ml-2">
              Ahorra {yearlyDiscount}%
            </Badge>
          )}
        </div>

        {/* Discount Code Input */}
        <div className="max-w-md mx-auto mb-12">
          <Label htmlFor="discount-code" className="mb-2 block text-center">
            ¿Tienes un código de descuento?
          </Label>
          <div className="flex gap-2">
            <Input
              id="discount-code"
              placeholder="CODIGO2025"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
              disabled={isLoading || !!appliedDiscount}
            />
            <Button
              onClick={handleApplyDiscount}
              disabled={isLoading || !!appliedDiscount || !discountCode.trim()}
              variant="outline"
              className="flex items-center gap-1"
            >
              {appliedDiscount ? (
                <>
                  Aplicado <Check size={14} weight="bold" />
                </>
              ) : (
                'Aplicar'
              )}
            </Button>
          </div>
          {appliedDiscount && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-2 text-center">
              Código "{appliedDiscount.code}" aplicado exitosamente
            </p>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {PRICING_PLANS.map((plan) => {
            const price = getPrice(plan)
            const isProcessing = processingPlan === plan.id
            const isDisabled = plan.id !== 'inicio' && plan.id !== 'gratuito'
            const isPlanGratuito = plan.id === 'gratuito'

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${
                  plan.popular
                    ? 'border-primary shadow-lg scale-105'
                    : 'border-border'
                } ${isDisabled ? 'opacity-60' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    Más Popular
                  </Badge>
                )}
                
                {isDisabled && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-muted-foreground">
                    Próximamente
                  </Badge>
                )}

                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {plan.icon}
                    </div>
                    <CardTitle>{plan.name}</CardTitle>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  {/* Price Display */}
                  <div className="mb-6">
                    {price ? (
                      <>
                        <div className="flex items-baseline gap-2">
                          {price.hasDiscount && (
                            <span className="text-2xl font-semibold text-muted-foreground line-through">
                              {formatCurrency(price.base)}
                            </span>
                          )}
                          <span className="text-4xl font-bold text-foreground">
                            {formatCurrency(price.final)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          por mes{billingCycle === 'yearly' && ' (facturado anualmente)'}
                        </p>
                      </>
                    ) : (
                      <div>
                        <span className="text-4xl font-bold text-foreground">Gratis</span>
                        <p className="text-sm text-muted-foreground mt-1">Para siempre</p>
                      </div>
                    )}
                  </div>

                  {/* Features List */}
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature.name} className="flex items-start gap-2">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        )}
                        <span className={feature.included ? 'text-foreground' : 'text-muted-foreground'}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isPlanGratuito || isDisabled || isProcessing || (isLoading && processingPlan !== null)}
                  >
                    {isProcessing ? 'Procesando...' : plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Preguntas Frecuentes</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">¿Puedo cambiar de plan en cualquier momento?</h3>
              <p className="text-muted-foreground">
                Sí, puedes actualizar o cambiar tu plan en cualquier momento. Los upgrades son prorrateados y
                los downgrades toman efecto al final del período actual.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">¿Hay período de prueba gratuito?</h3>
              <p className="text-muted-foreground">
                El plan Inicio incluye 14 días de prueba gratis. Puedes cancelar en cualquier momento sin cargo.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">¿Qué métodos de pago aceptan?</h3>
              <p className="text-muted-foreground">
                Aceptamos todas las tarjetas de crédito y débito principales (Visa, Mastercard, American Express)
                a través de Stripe, nuestro procesador de pagos seguro.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">¿Puedo cancelar mi suscripción?</h3>
              <p className="text-muted-foreground">
                Sí, puedes cancelar tu suscripción en cualquier momento desde tu dashboard. No hay penalidades
                ni costos ocultos.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-card border border-border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">¿Necesitas ayuda para elegir?</h2>
          <p className="text-muted-foreground mb-6">
            Nuestro equipo está listo para ayudarte a encontrar el plan perfecto para tu negocio.
          </p>
          <Button size="lg" variant="outline" asChild>
            <a href="mailto:soporte@appointsync.pro">Contactar Soporte</a>
          </Button>
        </div>
      </div>
    </div>
  )
}
