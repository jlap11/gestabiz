/**
 * PayUGateway.ts
 *
 * Implementación de IPaymentGateway para PayU Latam
 * Documentación: https://developers.payulatam.com/
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  CancelSubscriptionParams,
  CheckoutSessionParams,
  CheckoutSessionResult,
  IPaymentGateway,
  PlanType,
  SubscriptionDashboard,
  SubscriptionInfo,
  UpdateSubscriptionParams,
} from './PaymentGateway'
import { PaymentGatewayError } from './PaymentGateway'

export class PayUGateway implements IPaymentGateway {
  constructor(private readonly supabase: SupabaseClient) {}

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
      const { data, error } = await this.supabase.functions.invoke('payu-create-checkout', {
        body: params,
      })
      if (error) throw new PaymentGatewayError(error.message, 'checkout_error')
      return {
        sessionUrl: data.checkoutUrl,
        sessionId: data.referenceCode,
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
      const { data, error } = await this.supabase.functions.invoke('payu-manage-subscription', {
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
      const { data, error } = await this.supabase.functions.invoke('payu-manage-subscription', {
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
      const { data, error } = await this.supabase.functions.invoke('payu-manage-subscription', {
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
      const { data, error } = await this.supabase.functions.invoke('payu-manage-subscription', {
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
      const { data, error } = await this.supabase.functions.invoke('payu-manage-subscription', {
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

  async validatePlanLimit(
    businessId: string,
    resource: string
  ): Promise<{ allowed: boolean; current: number; limit: number; message?: string }> {
    try {
      const { data, error } = await this.supabase.rpc('validate_plan_limits', {
        p_business_id: businessId,
        p_resource: resource,
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
  ): Promise<{ isValid: boolean; discountAmount: number; finalAmount: number; message?: string }> {
    try {
      const { data, error } = await this.supabase.rpc('apply_discount_code', {
        p_code: code,
        p_plan_type: planType,
        p_amount: amount,
      })
      if (error) throw new PaymentGatewayError(error.message, 'discount_error')
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

// Note: No crear instancia singleton aquí
// El gateway debe crearse con el cliente Supabase en PaymentGatewayFactory
