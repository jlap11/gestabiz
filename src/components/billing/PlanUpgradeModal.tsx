/**
 * PlanUpgradeModal Component
 * 
 * Modal para actualizar el plan de suscripción (upgrade/downgrade)
 */

import { useState } from 'react'
import { useSubscription } from '@/hooks/useSubscription'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CheckCircle, Loader2 } from 'lucide-react'
import type { PlanType, BillingCycle } from '@/lib/payments/PaymentGateway'

interface PlanUpgradeModalProps {
  businessId: string
  currentPlan: PlanType
  currentCycle: BillingCycle
  onClose: () => void
  onSuccess: () => void
}

const PLANS = {
  inicio: {
    name: 'Inicio',
    monthly: 80000,
    yearly: 800000,
    features: ['1 sede', '5 empleados', '100 citas/mes', '50 clientes', '10 servicios'],
  },
  profesional: {
    name: 'Profesional',
    monthly: 200000,
    yearly: 2000000,
    features: ['3 sedes', '15 empleados', '500 citas/mes', '200 clientes', '30 servicios'],
  },
  empresarial: {
    name: 'Empresarial',
    monthly: 500000,
    yearly: 5000000,
    features: ['10 sedes', '50 empleados', '2000 citas/mes', '1000 clientes', '100 servicios'],
  },
  corporativo: {
    name: 'Corporativo',
    monthly: 0,
    yearly: 0,
    features: ['Sedes ilimitadas', 'Empleados ilimitados', 'Citas ilimitadas', 'Clientes ilimitados', 'Servicios ilimitados'],
  },
}

export function PlanUpgradeModal({
  businessId,
  currentPlan,
  currentCycle,
  onClose,
  onSuccess,
}: PlanUpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(currentPlan)
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>(currentCycle)
  const [discountCode, setDiscountCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { updatePlan, applyDiscount } = useSubscription(businessId)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getPrice = (plan: PlanType, cycle: BillingCycle) => {
    if (plan === 'corporativo') return 'Personalizado'
    const amount = PLANS[plan][cycle]
    return formatCurrency(amount)
  }

  const handleSubmit = async () => {
    if (selectedPlan === currentPlan && selectedCycle === currentCycle) {
      return
    }

    setIsSubmitting(true)
    try {
      // Aplicar código de descuento si existe
      if (discountCode) {
        const amount = PLANS[selectedPlan][selectedCycle]
        await applyDiscount(discountCode, selectedPlan, amount)
      }

      // Actualizar plan
      await updatePlan(selectedPlan, selectedCycle)
      onSuccess()
    } catch (error) {
      console.error('Error updating plan:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isUpgrade = () => {
    const planOrder = ['inicio', 'profesional', 'empresarial', 'corporativo']
    const currentIndex = planOrder.indexOf(currentPlan)
    const selectedIndex = planOrder.indexOf(selectedPlan)
    return selectedIndex > currentIndex
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Actualizar Plan</DialogTitle>
          <DialogDescription>
            {isUpgrade() ? 'Mejora tu plan' : 'Cambia tu plan'} para ajustarlo a tus necesidades
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selector de ciclo de facturación */}
          <div className="space-y-2">
            <Label>Ciclo de Facturación</Label>
            <RadioGroup
              value={selectedCycle}
              onValueChange={(value) => setSelectedCycle(value as BillingCycle)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="cursor-pointer">
                  Mensual
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yearly" id="yearly" />
                <Label htmlFor="yearly" className="cursor-pointer">
                  Anual (ahorra 17%)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Grid de planes */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(PLANS) as PlanType[]).map((planKey) => {
              const plan = PLANS[planKey]
              const isCurrent = planKey === currentPlan && selectedCycle === currentCycle
              const isSelected = planKey === selectedPlan

              return (
                <div
                  key={planKey}
                  className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'
                  } ${isCurrent ? 'bg-muted' : ''}`}
                  onClick={() => setSelectedPlan(planKey)}
                >
                  {isCurrent && (
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs">
                      Actual
                    </div>
                  )}
                  
                  <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                  <div className="text-2xl font-bold mb-4">
                    {getPrice(planKey, selectedCycle)}
                    {planKey !== 'corporativo' && (
                      <span className="text-sm font-normal text-muted-foreground">
                        /{selectedCycle === 'monthly' ? 'mes' : 'año'}
                      </span>
                    )}
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>

          {/* Código de descuento */}
          <div className="space-y-2">
            <Label htmlFor="discount">Código de Descuento (Opcional)</Label>
            <Input
              id="discount"
              placeholder="Ej: LAUNCH2025"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
            />
          </div>

          {/* Información del cambio */}
          {(selectedPlan !== currentPlan || selectedCycle !== currentCycle) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="font-medium mb-1">
                {isUpgrade() ? '🎉 Mejorando plan' : '📉 Cambiando plan'}
              </p>
              <p className="text-muted-foreground">
                {isUpgrade()
                  ? 'Se aplicará un prorateo inmediato. Solo pagarás la diferencia del período actual.'
                  : 'El cambio se aplicará al final del período de facturación actual.'}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={
              isSubmitting || 
              (selectedPlan === currentPlan && selectedCycle === currentCycle)
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Actualizando...
              </>
            ) : (
              'Confirmar Cambio'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
