/**
 * useSubscription Hook
 * 
 * Hook de React para gestionar suscripciones
 */

import { useState, useEffect, useCallback } from 'react'
import { getPaymentGateway } from '../lib/payments/PaymentGatewayFactory'
import type {
  SubscriptionDashboard,
  CheckoutSessionParams,
  UpdateSubscriptionParams,
  CancelSubscriptionParams,
  PlanType,
  BillingCycle,
} from '../lib/payments/PaymentGateway'
import { useAppState } from '../contexts/AppStateContext'

export function useSubscription(businessId: string | null) {
  const [dashboard, setDashboard] = useState<SubscriptionDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { showToast } = useAppState()
  
  // Obtener gateway configurado (Stripe o PayU)
  const paymentGateway = getPaymentGateway()

  // Cargar dashboard de facturación
  const loadDashboard = useCallback(async () => {
    if (!businessId) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      const data = await paymentGateway.getSubscriptionDashboard(businessId)
      setDashboard(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error loading subscription'
      setError(message)
      showToast(message, 'error')
    } finally {
      setIsLoading(false)
    }
  }, [businessId, showToast])

  // Crear sesión de checkout
  const createCheckout = useCallback(async (
    planType: PlanType,
    billingCycle: BillingCycle,
    discountCode?: string
  ) => {
    if (!businessId) {
      throw new Error('Business ID is required')
    }

    try {
      const params: CheckoutSessionParams = {
        businessId,
        planType,
        billingCycle,
        discountCode,
        successUrl: `${window.location.origin}/dashboard/billing?payment=success`,
        cancelUrl: `${window.location.origin}/pricing?payment=canceled`,
      }

      const result = await paymentGateway.createCheckoutSession(params)
      
      // Redirigir a Stripe Checkout
      window.location.href = result.sessionUrl
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error creating checkout'
      showToast(message, 'error')
      throw err
    }
  }, [businessId, showToast])

  // Actualizar plan
  const updatePlan = useCallback(async (
    newPlanType: PlanType,
    newBillingCycle: BillingCycle
  ) => {
    if (!businessId) {
      throw new Error('Business ID is required')
    }

    try {
      const params: UpdateSubscriptionParams = {
        businessId,
        newPlanType,
        newBillingCycle,
      }

      await paymentGateway.updateSubscription(params)
      showToast('Plan actualizado exitosamente', 'success')
      
      // Recargar dashboard
      await loadDashboard()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error updating plan'
      showToast(message, 'error')
      throw err
    }
  }, [businessId, showToast, loadDashboard])

  // Cancelar suscripción
  const cancelSubscription = useCallback(async (
    cancelAtPeriodEnd = true,
    cancellationReason?: string
  ) => {
    if (!businessId) {
      throw new Error('Business ID is required')
    }

    try {
      const params: CancelSubscriptionParams = {
        businessId,
        cancelAtPeriodEnd,
        cancellationReason,
      }

      await paymentGateway.cancelSubscription(params)
      showToast(
        cancelAtPeriodEnd
          ? 'Suscripción cancelada al final del período'
          : 'Suscripción cancelada inmediatamente',
        'success'
      )
      
      // Recargar dashboard
      await loadDashboard()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error canceling subscription'
      showToast(message, 'error')
      throw err
    }
  }, [businessId, showToast, loadDashboard])

  // Pausar suscripción
  const pauseSubscription = useCallback(async () => {
    if (!businessId) {
      throw new Error('Business ID is required')
    }

    try {
      await paymentGateway.pauseSubscription(businessId)
      showToast('Suscripción pausada exitosamente', 'success')
      await loadDashboard()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error pausing subscription'
      showToast(message, 'error')
      throw err
    }
  }, [businessId, showToast, loadDashboard])

  // Reanudar suscripción
  const resumeSubscription = useCallback(async () => {
    if (!businessId) {
      throw new Error('Business ID is required')
    }

    try {
      await paymentGateway.resumeSubscription(businessId)
      showToast('Suscripción reanudada exitosamente', 'success')
      await loadDashboard()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error resuming subscription'
      showToast(message, 'error')
      throw err
    }
  }, [businessId, showToast, loadDashboard])

  // Reactivar suscripción cancelada
  const reactivateSubscription = useCallback(async () => {
    if (!businessId) {
      throw new Error('Business ID is required')
    }

    try {
      await paymentGateway.reactivateSubscription(businessId)
      showToast('Suscripción reactivada exitosamente', 'success')
      await loadDashboard()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error reactivating subscription'
      showToast(message, 'error')
      throw err
    }
  }, [businessId, showToast, loadDashboard])

  // Validar límite de plan
  const validateLimit = useCallback(async (resource: string) => {
    if (!businessId) {
      throw new Error('Business ID is required')
    }

    try {
      const result = await paymentGateway.validatePlanLimit(businessId, resource)
      
      if (!result.allowed) {
        showToast(
          result.message || `Límite alcanzado: ${result.current}/${result.limit} ${resource}`,
          'warning'
        )
      }
      
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error validating limit'
      showToast(message, 'error')
      throw err
    }
  }, [businessId, showToast])

  // Aplicar código de descuento
  const applyDiscount = useCallback(async (
    code: string,
    planType: PlanType,
    amount: number
  ) => {
    if (!businessId) {
      throw new Error('Business ID is required')
    }

    try {
      const result = await paymentGateway.applyDiscountCode(businessId, code, planType, amount)
      
      if (result.isValid) {
        showToast(
          `Código aplicado: ${code}. Descuento: $${result.discountAmount.toLocaleString()} COP`,
          'success'
        )
      } else {
        showToast(result.message || 'Código de descuento inválido', 'error')
      }
      
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error applying discount'
      showToast(message, 'error')
      throw err
    }
  }, [businessId, showToast])

  // Cargar dashboard al montar
  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  return {
    // Estado
    dashboard,
    isLoading,
    error,
    
    // Acciones
    createCheckout,
    updatePlan,
    cancelSubscription,
    pauseSubscription,
    resumeSubscription,
    reactivateSubscription,
    validateLimit,
    applyDiscount,
    refresh: loadDashboard,
  }
}
