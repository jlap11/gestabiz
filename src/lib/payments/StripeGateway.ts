/**
 * Stripe Payment Gateway Implementation
 * 
 * Implementación del gateway de pagos usando Stripe
 * Conecta con Edge Functions de Supabase
 */

import { createClient } from '@supabase/supabase-js'
import type {
  IPaymentGateway,
  CheckoutSessionParams,
  CheckoutSessionResult,
  UpdateSubscriptionParams,
  CancelSubscriptionParams,
  SubscriptionInfo,
  SubscriptionDashboard,
} from './PaymentGateway'
import { PaymentGatewayError } from './PaymentGateway'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export class StripeGateway implements IPaymentGateway {
  private supabase = createClient(supabaseUrl, supabaseAnonKey)

  /**
   * Crear sesión de Stripe Checkout
   */
  async createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      if (!session) {
        throw new PaymentGatewayError('Not authenticated', 'auth_required', 401)
      }

      const response = await this.supabase.functions.invoke('create-checkout-session', {
        body: params,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (response.error) {
        throw new PaymentGatewayError(
          response.error.message || 'Failed to create checkout session',
          'checkout_failed',
          500
        )
      }

      return response.data as CheckoutSessionResult
    } catch (error) {
      if (error instanceof PaymentGatewayError) throw error
      throw new PaymentGatewayError(
        error instanceof Error ? error.message : 'Unknown error',
        'checkout_error',
        500
      )
    }
  }

  /**
   * Actualizar suscripción
   */
  async updateSubscription(params: UpdateSubscriptionParams): Promise<SubscriptionInfo> {
    return this.manageSubscription({
      businessId: params.businessId,
      action: 'update',
      newPlanType: params.newPlanType,
      newBillingCycle: params.newBillingCycle,
    })
  }

  /**
   * Cancelar suscripción
   */
  async cancelSubscription(params: CancelSubscriptionParams): Promise<SubscriptionInfo> {
    return this.manageSubscription({
      businessId: params.businessId,
      action: 'cancel',
      cancelAtPeriodEnd: params.cancelAtPeriodEnd,
      cancellationReason: params.cancellationReason,
    })
  }

  /**
   * Pausar suscripción
   */
  async pauseSubscription(businessId: string): Promise<SubscriptionInfo> {
    return this.manageSubscription({
      businessId,
      action: 'pause',
    })
  }

  /**
   * Reanudar suscripción
   */
  async resumeSubscription(businessId: string): Promise<SubscriptionInfo> {
    return this.manageSubscription({
      businessId,
      action: 'resume',
    })
  }

  /**
   * Reactivar suscripción
   */
  async reactivateSubscription(businessId: string): Promise<SubscriptionInfo> {
    return this.manageSubscription({
      businessId,
      action: 'reactivate',
    })
  }

  /**
   * Método privado para llamar manage-subscription Edge Function
   */
  private async manageSubscription(body: any): Promise<SubscriptionInfo> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      if (!session) {
        throw new PaymentGatewayError('Not authenticated', 'auth_required', 401)
      }

      const response = await this.supabase.functions.invoke('manage-subscription', {
        body,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (response.error) {
        throw new PaymentGatewayError(
          response.error.message || 'Failed to manage subscription',
          'manage_subscription_failed',
          500
        )
      }

      return response.data.subscription as SubscriptionInfo
    } catch (error) {
      if (error instanceof PaymentGatewayError) throw error
      throw new PaymentGatewayError(
        error instanceof Error ? error.message : 'Unknown error',
        'subscription_error',
        500
      )
    }
  }

  /**
   * Obtener dashboard de facturación
   */
  async getSubscriptionDashboard(businessId: string): Promise<SubscriptionDashboard> {
    try {
      const { data, error } = await this.supabase.rpc('get_subscription_dashboard', {
        p_business_id: businessId,
      })

      if (error) {
        throw new PaymentGatewayError(
          'Failed to fetch subscription dashboard',
          'dashboard_error',
          500
        )
      }

      return data as SubscriptionDashboard
    } catch (error) {
      if (error instanceof PaymentGatewayError) throw error
      throw new PaymentGatewayError(
        error instanceof Error ? error.message : 'Unknown error',
        'dashboard_error',
        500
      )
    }
  }

  /**
   * Validar límites del plan
   */
  async validatePlanLimit(businessId: string, resource: string): Promise<{
    allowed: boolean
    current: number
    limit: number
    message?: string
  }> {
    try {
      const { data, error } = await this.supabase.rpc('validate_plan_limits', {
        p_business_id: businessId,
        p_resource: resource,
      })

      if (error) {
        throw new PaymentGatewayError(
          'Failed to validate plan limits',
          'validation_error',
          500
        )
      }

      return data as {
        allowed: boolean
        current: number
        limit: number
        message?: string
      }
    } catch (error) {
      if (error instanceof PaymentGatewayError) throw error
      throw new PaymentGatewayError(
        error instanceof Error ? error.message : 'Unknown error',
        'validation_error',
        500
      )
    }
  }

  /**
   * Aplicar código de descuento
   */
  async applyDiscountCode(
    businessId: string,
    code: string,
    planType: string,
    amount: number
  ): Promise<{
    isValid: boolean
    discountAmount: number
    finalAmount: number
    message?: string
  }> {
    try {
      const { data, error } = await this.supabase.rpc('apply_discount_code', {
        p_business_id: businessId,
        p_code: code,
        p_plan_type: planType,
        p_amount: amount,
      })

      if (error) {
        throw new PaymentGatewayError(
          'Failed to apply discount code',
          'discount_error',
          500
        )
      }

      return {
        isValid: data.is_valid,
        discountAmount: data.discount_amount,
        finalAmount: data.final_amount,
        message: data.message,
      }
    } catch (error) {
      if (error instanceof PaymentGatewayError) throw error
      throw new PaymentGatewayError(
        error instanceof Error ? error.message : 'Unknown error',
        'discount_error',
        500
      )
    }
  }
}

/**
 * Instancia singleton del gateway
 */
export const paymentGateway = new StripeGateway()
