/**
 * Payment Gateway Interface
 * 
 * Abstracción de proveedores de pago para separar lógica de negocio
 * de implementación específica (Stripe, Wompi, MercadoPago, etc.)
 */

export type PlanType = 'inicio' | 'profesional' | 'empresarial' | 'corporativo'
export type BillingCycle = 'monthly' | 'yearly'
export type SubscriptionStatus = 
  | 'active' 
  | 'trialing' 
  | 'past_due' 
  | 'canceled' 
  | 'suspended' 
  | 'inactive' 
  | 'expired' 
  | 'paused'

export interface CheckoutSessionParams {
  businessId: string
  planType: PlanType
  billingCycle: BillingCycle
  discountCode?: string
  successUrl: string
  cancelUrl: string
}

export interface CheckoutSessionResult {
  sessionId: string
  sessionUrl: string
}

export interface UpdateSubscriptionParams {
  businessId: string
  newPlanType: PlanType
  newBillingCycle: BillingCycle
}

export interface CancelSubscriptionParams {
  businessId: string
  cancelAtPeriodEnd?: boolean
  cancellationReason?: string
}

export interface SubscriptionInfo {
  id: string
  businessId: string
  planType: PlanType
  billingCycle: BillingCycle
  status: SubscriptionStatus
  currentPeriodStart: string
  currentPeriodEnd: string
  trialEndsAt?: string
  canceledAt?: string
  cancellationReason?: string
  pausedAt?: string
  amount: number
  currency: string
}

export interface PaymentMethod {
  id: string
  type: string
  brand?: string
  last4?: string
  expMonth?: number
  expYear?: number
  isActive: boolean
}

export interface PaymentHistory {
  id: string
  amount: number
  currency: string
  status: 'completed' | 'failed' | 'pending' | 'refunded'
  paidAt?: string
  failureReason?: string
  invoiceUrl?: string
}

export interface SubscriptionDashboard {
  subscription: SubscriptionInfo | null
  paymentMethods: PaymentMethod[]
  recentPayments: PaymentHistory[]
  upcomingInvoice?: {
    amount: number
    currency: string
    dueDate: string
  }
  usageMetrics?: {
    locations: { current: number; limit: number }
    employees: { current: number; limit: number }
    appointments: { current: number; limit: number }
    clients: { current: number; limit: number }
    services: { current: number; limit: number }
  }
}

/**
 * Payment Gateway Interface
 * 
 * Define el contrato que debe cumplir cualquier proveedor de pago
 */
export interface IPaymentGateway {
  /**
   * Crear sesión de checkout para nueva suscripción
   */
  createCheckoutSession(params: CheckoutSessionParams): Promise<CheckoutSessionResult>

  /**
   * Actualizar plan de suscripción (upgrade/downgrade)
   */
  updateSubscription(params: UpdateSubscriptionParams): Promise<SubscriptionInfo>

  /**
   * Cancelar suscripción
   */
  cancelSubscription(params: CancelSubscriptionParams): Promise<SubscriptionInfo>

  /**
   * Pausar suscripción
   */
  pauseSubscription(businessId: string): Promise<SubscriptionInfo>

  /**
   * Reanudar suscripción pausada
   */
  resumeSubscription(businessId: string): Promise<SubscriptionInfo>

  /**
   * Reactivar suscripción cancelada (dentro del período de gracia)
   */
  reactivateSubscription(businessId: string): Promise<SubscriptionInfo>

  /**
   * Obtener dashboard completo de facturación
   */
  getSubscriptionDashboard(businessId: string): Promise<SubscriptionDashboard>

  /**
   * Validar si el negocio puede crear un recurso (locations, employees, etc.)
   */
  validatePlanLimit(businessId: string, resource: string): Promise<{
    allowed: boolean
    current: number
    limit: number
    message?: string
  }>

  /**
   * Aplicar código de descuento
   */
  applyDiscountCode(businessId: string, code: string, planType: PlanType, amount: number): Promise<{
    isValid: boolean
    discountAmount: number
    finalAmount: number
    message?: string
  }>
}

/**
 * Payment Gateway Error
 */
export class PaymentGatewayError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'PaymentGatewayError'
  }
}
