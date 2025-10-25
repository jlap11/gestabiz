/**
 * BillingDashboard Component
 *
 * Dashboard principal de facturación con resumen de suscripción,
 * uso del plan, métodos de pago e historial de pagos
 */

import { Suspense, lazy, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSubscription } from '@/hooks/useSubscription'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import { PlanUpgradeModal } from './PlanUpgradeModal'
import { CancelSubscriptionModal } from './CancelSubscriptionModal'
import { AddPaymentMethodModal } from './AddPaymentMethodModal'
const PricingPageLazy = lazy(() => import('@/pages/PricingPage').then(m => ({ default: m.PricingPage })))
import type { SubscriptionStatus } from '@/lib/payments/PaymentGateway'

interface BillingDashboardProps {
  businessId: string
  onBack?: () => void
}

export function BillingDashboard({ businessId, onBack }: Readonly<BillingDashboardProps>) {
  const { t } = useLanguage()
  const { dashboard, isLoading, error, refresh } = useSubscription(businessId)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false)

  if (isLoading) {
    return (
      <main 
        role="main" 
        aria-labelledby="billing-dashboard-title" 
        className="space-y-4 sm:space-y-6 p-4 sm:p-6 max-w-[95vw] mx-auto"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          {onBack && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="h-9 w-9 sm:h-8 sm:w-8 p-0 touch-manipulation"
              aria-label={t('action.back')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 id="billing-dashboard-title" className="text-xl sm:text-2xl font-bold">
              {t('billing.title')}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {t('billing.description')}
            </p>
          </div>
        </div>

        {/* Loading skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main 
        role="main" 
        aria-labelledby="billing-error-title" 
        className="space-y-4 sm:space-y-6 p-4 sm:p-6 max-w-[95vw] mx-auto"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          {onBack && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="h-9 w-9 sm:h-8 sm:w-8 p-0 touch-manipulation"
              aria-label={t('action.back')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 id="billing-error-title" className="text-xl sm:text-2xl font-bold">
              {t('billing.title')}
            </h1>
          </div>
        </div>

        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              <AlertCircle className="h-8 w-8 text-destructive flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-destructive text-base sm:text-lg">
                  {t('billing.errorTitle')}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  {error.message || t('billing.errorDescription')}
                </p>
                <Button 
                  onClick={refresh} 
                  className="mt-3 min-h-[44px] text-sm sm:text-base touch-manipulation"
                  size="sm"
                >
                  {t('action.retry')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  // Si no hay suscripción, mostrar página de precios
  if (!dashboard?.subscription) {
    return (
      <main 
        role="main" 
        aria-labelledby="no-subscription-title" 
        className="space-y-4 sm:space-y-6 p-4 sm:p-6 max-w-[95vw] mx-auto"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          {onBack && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="h-9 w-9 sm:h-8 sm:w-8 p-0 touch-manipulation"
              aria-label={t('action.back')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 id="no-subscription-title" className="text-xl sm:text-2xl font-bold">
              {t('billing.title')}
            </h1>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-lg sm:text-xl">{t('billing.noSubscription')}</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {t('billing.noSubscriptionDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              <Suspense fallback={<div className="h-32 animate-pulse bg-muted rounded" />}>
                <PricingPageLazy />
              </Suspense>
              <Button
                variant="outline"
                onClick={onBack}
                className="min-h-[44px] text-sm sm:text-base touch-manipulation"
                aria-label="Ver detalles del Plan Inicio"
              >
                Ver Plan Inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  const { subscription, paymentMethods, recentPayments, upcomingInvoice, usageMetrics } = dashboard

  const getStatusBadge = (status: SubscriptionStatus) => {
    const statusConfig = {
      active: { variant: 'default' as const, label: t('billing.status.active') },
      trialing: { variant: 'secondary' as const, label: t('billing.status.trialing') },
      past_due: { variant: 'destructive' as const, label: t('billing.status.pastDue') },
      canceled: { variant: 'outline' as const, label: t('billing.status.canceled') },
      unpaid: { variant: 'destructive' as const, label: t('billing.status.unpaid') },
      incomplete: { variant: 'destructive' as const, label: t('billing.status.incomplete') },
      incomplete_expired: { variant: 'destructive' as const, label: t('billing.status.incompleteExpired') },
      paused: { variant: 'secondary' as const, label: t('billing.status.paused') },
    }

    const config = statusConfig[status] || statusConfig.active
    return (
      <Badge 
        variant={config.variant} 
        className="text-xs sm:text-sm"
        aria-label={`Estado de suscripción: ${config.label}`}
      >
        {config.label}
      </Badge>
    )
  }

  const formatCurrency = (amount: number, currency = 'COP') => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <main 
      role="main" 
      aria-labelledby="billing-dashboard-title" 
      className="space-y-4 sm:space-y-6 p-4 sm:p-6 max-w-[95vw] mx-auto"
    >
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        {onBack && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="h-9 w-9 sm:h-8 sm:w-8 p-0 touch-manipulation"
            aria-label={t('action.back')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="flex-1">
          <h1 id="billing-dashboard-title" className="text-xl sm:text-2xl font-bold">
            {t('billing.title')}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t('billing.description')}
          </p>
        </div>
      </div>

      {/* Subscription Overview - Mobile First */}
      <section role="region" aria-labelledby="subscription-overview-title">
        <h2 id="subscription-overview-title" className="sr-only">Resumen de suscripción</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Plan Actual */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Plan Actual</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Tu suscripción activa
                  </CardDescription>
                </div>
                {getStatusBadge(subscription.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-sm sm:text-base font-medium">
                    Plan {subscription.planType.charAt(0).toUpperCase() + subscription.planType.slice(1)}
                  </span>
                  <span className="text-lg sm:text-xl font-bold">
                    {formatCurrency(subscription.amount)}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{subscription.billingCycle === 'monthly' ? 'mes' : 'año'}
                    </span>
                  </span>
                </div>
                
                {subscription.currentPeriodEnd && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-sm text-muted-foreground">
                    <span>Próximo pago:</span>
                    <span className="font-medium">{formatDate(subscription.currentPeriodEnd)}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => setShowUpgradeModal(true)}
                  className="flex-1 min-h-[44px] text-sm sm:text-base touch-manipulation"
                  size="sm"
                  aria-label="Actualizar plan de suscripción"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {t('billing.upgradePlan')}
                </Button>
                {subscription.status === 'active' && (
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelModal(true)}
                    className="flex-1 min-h-[44px] text-sm sm:text-base touch-manipulation"
                    size="sm"
                    aria-label="Cancelar suscripción"
                  >
                    {t('billing.cancelSubscription')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Próxima Factura */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Próxima Factura</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Detalles del próximo cobro
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingInvoice ? (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-sm sm:text-base text-muted-foreground">Monto:</span>
                    <span className="text-lg sm:text-xl font-bold">
                      {formatCurrency(upcomingInvoice.amount)}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="text-sm sm:text-base text-muted-foreground">Fecha:</span>
                    <span className="font-medium text-sm sm:text-base">
                      {formatDate(upcomingInvoice.date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Se cobrará automáticamente</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm sm:text-base">No hay facturas pendientes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Usage Metrics - Mobile Responsive */}
      {usageMetrics && (
        <section role="region" aria-labelledby="usage-metrics-title">
          <h2 id="usage-metrics-title" className="sr-only">Métricas de uso</h2>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Uso del Plan</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Límites y uso actual de tu plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {Object.entries(usageMetrics).map(([key, metric]) => {
                  const percentage = metric.limit > 0 ? (metric.current / metric.limit) * 100 : 0
                  const isNearLimit = percentage >= 80
                  
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <span className="text-sm font-medium capitalize">
                          {key === 'locations' ? 'Ubicaciones' :
                           key === 'employees' ? 'Empleados' :
                           key === 'appointments' ? 'Citas' :
                           key === 'clients' ? 'Clientes' :
                           key === 'services' ? 'Servicios' : key}
                        </span>
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {metric.current} / {metric.limit}
                        </span>
                      </div>
                      <Progress 
                        value={percentage} 
                        className="h-2"
                        aria-label={`Uso de ${key}: ${metric.current} de ${metric.limit}`}
                      />
                      {isNearLimit && (
                        <div className="flex items-center gap-1 text-xs text-amber-600">
                          <AlertCircle className="h-3 w-3" />
                          <span>Cerca del límite</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Tabs Section - Mobile Optimized */}
      <section role="region" aria-labelledby="billing-details-title">
        <h2 id="billing-details-title" className="sr-only">Detalles de facturación</h2>
        
        <Tabs defaultValue="payments" className="space-y-4">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-0">
            <TabsTrigger 
              value="payments" 
              className="min-h-[44px] text-sm sm:text-base touch-manipulation"
            >
              Historial de Pagos
            </TabsTrigger>
            <TabsTrigger 
              value="methods" 
              className="min-h-[44px] text-sm sm:text-base touch-manipulation"
            >
              Métodos de Pago
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Historial de Pagos</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Últimos pagos realizados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentPayments && recentPayments.length > 0 ? (
                  <div className="space-y-3">
                    {recentPayments.map(payment => (
                      <div
                        key={payment.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-full p-2 bg-muted">
                            {payment.status === 'completed' ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : payment.status === 'failed' ? (
                              <XCircle className="h-4 w-4 text-red-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-yellow-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm sm:text-base">
                              {formatCurrency(payment.amount, payment.currency)}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {formatDate(payment.paidAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <Badge
                            variant={
                              payment.status === 'completed'
                                ? 'default'
                                : payment.status === 'failed'
                                  ? 'destructive'
                                  : 'secondary'
                            }
                            className="text-xs sm:text-sm self-start sm:self-auto"
                          >
                            {payment.status === 'completed'
                              ? 'Completado'
                              : payment.status === 'failed'
                                ? 'Fallido'
                                : payment.status === 'refunded'
                                  ? 'Reembolsado'
                                  : 'Pendiente'}
                          </Badge>
                          {payment.invoiceUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(payment.invoiceUrl, '_blank')}
                              className="min-h-[44px] min-w-[44px] text-xs sm:text-sm touch-manipulation"
                              aria-label="Descargar factura"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">No hay pagos registrados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="methods" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Métodos de Pago</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Gestiona tus métodos de pago
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentMethods && paymentMethods.length > 0 ? (
                  <div className="space-y-3">
                    {paymentMethods.map(method => (
                      <div
                        key={method.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-full p-2 bg-muted">
                            <CreditCard className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm sm:text-base">
                              {method.brand?.toUpperCase()} •••• {method.last4}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Expira {method.expMonth}/{method.expYear}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {method.isActive && (
                            <Badge variant="secondary" className="text-xs sm:text-sm">
                              Principal
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm sm:text-base">No hay métodos de pago configurados</p>
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full min-h-[44px] text-sm sm:text-base touch-manipulation"
                  onClick={() => setShowAddPaymentModal(true)}
                  aria-label="Agregar nuevo método de pago"
                >
                  <CreditCard className="h-4 w-4 mr-2" aria-hidden="true" />
                  {t('billing.addPaymentMethod')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      {/* Modales */}
      {showUpgradeModal && (
        <PlanUpgradeModal
          businessId={businessId}
          currentPlan={subscription.planType}
          currentCycle={subscription.billingCycle}
          onClose={() => setShowUpgradeModal(false)}
          onSuccess={() => {
            setShowUpgradeModal(false)
            refresh()
          }}
        />
      )}

      {showCancelModal && (
        <CancelSubscriptionModal
          businessId={businessId}
          onClose={() => setShowCancelModal(false)}
          onSuccess={() => {
            setShowCancelModal(false)
            refresh()
          }}
        />
      )}

      {showAddPaymentModal && (
        <AddPaymentMethodModal
          businessId={businessId}
          onClose={() => setShowAddPaymentModal(false)}
          onSuccess={() => {
            setShowAddPaymentModal(false)
            refresh()
          }}
        />
      )}
    </main>
  )
}