/**
 * PaymentGatewayFactory.ts
 * 
 * Factory pattern para instanciar el gateway de pagos correcto
 * según la configuración en variables de entorno
 * 
 * Soporta:
 * - Stripe (default)
 * - PayU Latam
 * - MercadoPago
 * 
 * Uso:
 * ```typescript
 * import { getPaymentGateway } from '@/lib/payments/PaymentGatewayFactory'
 * 
 * const gateway = getPaymentGateway()
 * const dashboard = await gateway.getSubscriptionDashboard(businessId)
 * ```
 */

import type { IPaymentGateway } from './PaymentGateway'
import { StripeGateway } from './StripeGateway'
import { PayUGateway } from './PayUGateway'
import { MercadoPagoGateway } from './MercadoPagoGateway'
import { supabase } from '@/lib/supabase'

export type PaymentGatewayType = 'stripe' | 'payu' | 'mercadopago'

/**
 * Obtiene el tipo de gateway configurado
 * Lee de variable de entorno VITE_PAYMENT_GATEWAY
 * Default: 'stripe'
 */
export function getConfiguredGatewayType(): PaymentGatewayType {
  const configured = import.meta.env.VITE_PAYMENT_GATEWAY as string | undefined
  
  if (configured === 'payu') {
    return 'payu'
  }
  
  if (configured === 'mercadopago') {
    return 'mercadopago'
  }
  
  // Default a Stripe si no está configurado o es inválido
  return 'stripe'
}

/**
 * Factory function que retorna la instancia del gateway configurado
 * Usa el cliente Supabase singleton para evitar múltiples instancias
 */
export function getPaymentGateway(): IPaymentGateway {
  const gatewayType = getConfiguredGatewayType()
  
  switch (gatewayType) {
    case 'payu':
      return new PayUGateway(supabase)
    case 'mercadopago':
      return new MercadoPagoGateway(supabase)
    case 'stripe':
    default:
      return new StripeGateway(supabase)
  }
}

/**
 * Helper para obtener el nombre del gateway actual
 */
export function getGatewayDisplayName(type?: PaymentGatewayType): string {
  const gatewayType = type || getConfiguredGatewayType()
  
  switch (gatewayType) {
    case 'payu':
      return 'PayU Latam'
    case 'mercadopago':
      return 'MercadoPago'
    case 'stripe':
      return 'Stripe'
    default:
      return 'Unknown'
  }
}

/**
 * Helper para verificar si un gateway específico está configurado
 */
export function isGatewayConfigured(type: PaymentGatewayType): boolean {
  switch (type) {
    case 'stripe':
      return !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
    case 'payu':
      return !!(
        import.meta.env.VITE_PAYU_MERCHANT_ID &&
        import.meta.env.VITE_PAYU_ACCOUNT_ID &&
        import.meta.env.VITE_PAYU_PUBLIC_KEY
      )
    case 'mercadopago':
      return !!import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY
    default:
      return false
  }
}

/**
 * Verifica si el gateway actual está correctamente configurado
 */
export function isCurrentGatewayConfigured(): boolean {
  const currentType = getConfiguredGatewayType()
  return isGatewayConfigured(currentType)
}
