/**
 * MercadoPago Gateway Implementation
 * 
 * Implementación de IPaymentGateway para MercadoPago
 * Soporta pagos con tarjeta de crédito, débito, efectivo (Oxxo, Baloto, etc.)
 * 
 * Documentación oficial: https://www.mercadopago.com.ar/developers
 * 
 * Flujo:
 * 1. createCheckoutSession() → Llama Edge Function mercadopago-create-preference
 * 2. Edge Function genera Preference con items, payer, back_urls
 * 3. Redirige a init_point (Checkout Pro de MercadoPago)
 * 4. Usuario paga en MercadoPago
 * 5. MercadoPago envía notificación IPN a mercadopago-webhook
 * 6. Webhook valida y actualiza subscription en Supabase
 * 
 * Variables requeridas:
 * - VITE_MERCADOPAGO_PUBLIC_KEY (frontend)
 * - MERCADOPAGO_ACCESS_TOKEN (Edge Functions)
 * 
 * @author GitHub Copilot
 * @date 2025-10-17
 */

import { createClient } from '@supabase/supabase-js'
import type {
  IPaymentGateway,
  SubscriptionDashboard,
  CheckoutSessionParams,
  CheckoutSessionResult,
  UpdateSubscriptionParams,
  CancelSubscriptionParams,
  SubscriptionInfo,
  PlanType,
} from './PaymentGateway'
import { PaymentGatewayError } from './PaymentGateway'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export class MercadoPagoGateway implements IPaymentGateway {
  private readonly supabase = createClient(supabaseUrl, supabaseAnonKey)

  async getSubscriptionDashboard(businessId: string): Promise<SubscriptionDashboard> {
    try {
      const { data, error } = await this.supabase.rpc('get_subscription_dashboard', {
        p_business_id: businessId,
      })
      if (error) throw new PaymentGatewayError(error.message, 'fetch_dashboard_error')
      return data as SubscriptionDashboard
    } catch (error) {
      if (error instanceof PaymentGatewayError) throw error
      throw new PaymentGatewayError(
        error instanceof Error ? error.message : 'Unknown error',
        'fetch_dashboard_error',
        500
      )
    }
  }

  async createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult> {
    try {
      const { data, error } = await this.supabase.functions.invoke('mercadopago-create-preference', {
        body: params,
      })
      if (error) throw new PaymentGatewayError(error.message, 'checkout_error')
      return {
        sessionUrl: data.init_point,
        sessionId: data.preference_id,
      }
    } catch (error) {
      if (error instanceof PaymentGatewayError) throw error
      throw new PaymentGatewayError(
        error instanceof Error ? error.message : 'Unknown error',
        'checkout_error',
        500
      )
    }
  }

  async updateSubscription(params: UpdateSubscriptionParams): Promise<SubscriptionInfo> {
    try {
      const { data, error } = await this.supabase.functions.invoke('mercadopago-manage-subscription', {
        body: { action: 'update', ...params },
      })
      if (error) throw new PaymentGatewayError(error.message, 'update_subscription_error')
      return data.subscription as SubscriptionInfo
    } catch (error) {
      if (error instanceof PaymentGatewayError) throw error
      throw new PaymentGatewayError(
        error instanceof Error ? error.message : 'Unknown error',
        'update_subscription_error',
        500
      )
    }
  }

  async cancelSubscription(params: CancelSubscriptionParams): Promise<SubscriptionInfo> {
    try {
      const { data, error } = await this.supabase.functions.invoke('mercadopago-manage-subscription', {
        body: { action: 'cancel', ...params },
      })
      if (error) throw new PaymentGatewayError(error.message, 'cancel_subscription_error')
      return data.subscription as SubscriptionInfo
    } catch (error) {
      if (error instanceof PaymentGatewayError) throw error
      throw new PaymentGatewayError(
        error instanceof Error ? error.message : 'Unknown error',
        'cancel_subscription_error',
        500
      )
    }
  }

  async pauseSubscription(businessId: string): Promise<SubscriptionInfo> {
    try {
      const { data, error } = await this.supabase.functions.invoke('mercadopago-manage-subscription', {
        body: { action: 'pause', businessId },
      })
      if (error) throw new PaymentGatewayError(error.message, 'pause_subscription_error')
      return data.subscription as SubscriptionInfo
    } catch (error) {
      if (error instanceof PaymentGatewayError) throw error
      throw new PaymentGatewayError(
        error instanceof Error ? error.message : 'Unknown error',
        'pause_subscription_error',
        500
      )
    }
  }

  async resumeSubscription(businessId: string): Promise<SubscriptionInfo> {
    try {
      const { data, error } = await this.supabase.functions.invoke('mercadopago-manage-subscription', {
        body: { action: 'resume', businessId },
      })
      if (error) throw new PaymentGatewayError(error.message, 'resume_subscription_error')
      return data.subscription as SubscriptionInfo
    } catch (error) {
      if (error instanceof PaymentGatewayError) throw error
      throw new PaymentGatewayError(
        error instanceof Error ? error.message : 'Unknown error',
        'resume_subscription_error',
        500
      )
    }
  }

  async reactivateSubscription(businessId: string): Promise<SubscriptionInfo> {
    try {
      const { data, error } = await this.supabase.functions.invoke('mercadopago-manage-subscription', {
        body: { action: 'reactivate', businessId },
      })
      if (error) throw new PaymentGatewayError(error.message, 'reactivate_subscription_error')
      return data.subscription as SubscriptionInfo
    } catch (error) {
      if (error instanceof PaymentGatewayError) throw error
      throw new PaymentGatewayError(
        error instanceof Error ? error.message : 'Unknown error',
        'reactivate_subscription_error',
        500
      )
    }
  }

  async validatePlanLimit(businessId: string, resource: string): Promise<{
    allowed: boolean
    current: number
    limit: number
    message?: string
  }> {
    try {
      const { data, error } = await this.supabase.rpc('validate_plan_limits', {
        p_business_id: businessId,
        p_resource_type: resource,
      })
      if (error) throw new PaymentGatewayError(error.message, 'validate_limit_error')
      return data
    } catch (error) {
      if (error instanceof PaymentGatewayError) throw error
      throw new PaymentGatewayError(
        error instanceof Error ? error.message : 'Unknown error',
        'validate_limit_error',
        500
      )
    }
  }

  async applyDiscountCode(
    businessId: string,
    code: string,
    planType: PlanType,
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
      if (error) throw new PaymentGatewayError(error.message, 'apply_discount_error')
      return data
    } catch (error) {
      if (error instanceof PaymentGatewayError) throw error
      throw new PaymentGatewayError(
        error instanceof Error ? error.message : 'Unknown error',
        'apply_discount_error',
        500
      )
    }
  }
}

// Instancia singleton
export const mercadoPagoGateway = new MercadoPagoGateway()
