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
}

export function BillingDashboard({ businessId }: Readonly<BillingDashboardProps>) {
  const { t } = useLanguage()
  const { dashboard, isLoading, refresh } = useSubscription(businessId)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false)
  const [showPricingPage, setShowPricingPage] = useState(false)

  if (isLoading) {
    return (
      <div 
        className="flex items-center justify-center h-96"
        role="status"
        aria-label="Cargando información de facturación"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Si usuario quiere ver planes, mostrar PricingPage inline
  if (showPricingPage) {
    return (
      <main 
        className="space-y-4 max-w-[100vw]"
        role="main"
        aria-labelledby="pricing-page-title"
      >
        <h1 id="pricing-page-title" className="sr-only">Página de Precios</h1>
        <Button 
          variant="ghost" 
          onClick={() => setShowPricingPage(false)} 
          className="mb-4 min-h-[44px] min-w-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Volver al Dashboard de Facturación"
          title="Volver al Dashboard de Facturación"
        >
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Volver al Dashboard
        </Button>
        <Suspense fallback={
          <div 
            className="flex items-center justify-center h-96"
            role="status"
            aria-label="Cargando página de precios"
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        }>
          <PricingPageLazy businessId={businessId} onClose={() => setShowPricingPage(false)} />
        </Suspense>
      </main>
    )
  }


  if (!dashboard?.subscription) {
    return (
      <main 
        className="space-y-6 max-w-[100vw]"
        role="main"
        aria-labelledby="free-plan-title"
      >
        <h1 id="free-plan-title" className="sr-only">Plan Gratuito</h1>
        <Card className="focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
              {t('billing.freePlan')}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">{t('billing.freeplanDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <div className="space-y-2">
              <h4 className="font-medium text-sm sm:text-base">Características incluidas:</h4>
              <ul 
                className="space-y-2 text-sm sm:text-base text-muted-foreground"
                role="list"
                aria-label="Características del plan gratuito"
              >
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  Registro de negocios básico
                </li>
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  Hasta 3 citas por mes
                </li>
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  1 empleado
                </li>
                <li className="flex items-center gap-2" role="listitem">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" aria-hidden="true" />
                  1 servicio
                </li>
              </ul>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                ¿Quieres desbloquear más funcionalidades? Actualiza al Plan Inicio
              </p>
              <Button 
                onClick={() => setShowPricingPage(true)} 
                className="w-full min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
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
    const badges = {
      active: <Badge className="bg-green-500 text-xs sm:text-sm">{t('billing.statusActive')}</Badge>,
      trialing: <Badge className="bg-blue-500 text-xs sm:text-sm">{t('billing.statusTrialing')}</Badge>,
      past_due: <Badge className="bg-yellow-500 text-xs sm:text-sm">{t('billing.overduePayment')}</Badge>,
      canceled: <Badge className="bg-red-500 text-xs sm:text-sm">{t('billing.statusCanceled')}</Badge>,
      suspended: <Badge className="bg-orange-500 text-xs sm:text-sm">{t('billing.statusSuspended')}</Badge>,
      inactive: <Badge className="bg-gray-500 text-xs sm:text-sm">{t('billing.statusInactive')}</Badge>,
      expired: <Badge className="bg-red-700 text-xs sm:text-sm">{t('billing.statusExpired')}</Badge>,
      paused: <Badge className="bg-purple-500 text-xs sm:text-sm">{t('billing.statusPaused')}</Badge>,
    }
    return badges[status] || <Badge className="text-xs sm:text-sm">{status}</Badge>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <main 
      className="space-y-6 max-w-[100vw]"
      role="main"
      aria-labelledby="billing-dashboard-title"
    >
      <h1 id="billing-dashboard-title" className="sr-only">Dashboard de Facturación</h1>
      
      {/* Header con información de suscripción */}
      <section 
        role="region" 
        aria-labelledby="subscription-overview-title"
        className="space-y-4"
      >
        <h2 id="subscription-overview-title" className="sr-only">Resumen de Suscripción</h2>
        <div 
          className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
          aria-label="Información de suscripción"
        >
          <Card 
            className="focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
            role="listitem"
            tabIndex={0}
            aria-labelledby="current-plan-title"
            aria-describedby="current-plan-description"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <CardTitle 
                id="current-plan-title"
                className="text-sm font-medium"
              >
                {t('billing.currentPlan')}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div 
                className="text-xl sm:text-2xl font-bold capitalize"
                aria-label={`Plan actual: ${subscription.planType}`}
              >
                {subscription.planType}
              </div>
              <p 
                id="current-plan-description"
                className="text-xs sm:text-sm text-muted-foreground"
              >
                {subscription.billingCycle === 'monthly'
                  ? t('billing.billingMonthly')
                  : t('billing.billingAnnual')}
              </p>
              <div className="mt-2">{getStatusBadge(subscription.status)}</div>
            </CardContent>
          </Card>

          <Card 
            className="focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
            role="listitem"
            tabIndex={0}
            aria-labelledby="next-payment-title"
            aria-describedby="next-payment-description"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <CardTitle 
                id="next-payment-title"
                className="text-sm font-medium"
              >
                Próximo Pago
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div 
                className="text-xl sm:text-2xl font-bold"
                aria-label={`Monto del próximo pago: ${formatCurrency(upcomingInvoice?.amount || subscription.amount)}`}
              >
                {formatCurrency(upcomingInvoice?.amount || subscription.amount)}
              </div>
              <p 
                id="next-payment-description"
                className="text-xs sm:text-sm text-muted-foreground"
              >
                {formatDate(upcomingInvoice?.dueDate || subscription.currentPeriodEnd)}
              </p>
            </CardContent>
          </Card>

          <Card 
            className="focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 col-span-1 sm:col-span-2 lg:col-span-1"
            role="listitem"
            tabIndex={0}
            aria-labelledby="payment-method-title"
            aria-describedby="payment-method-description"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
              <CardTitle 
                id="payment-method-title"
                className="text-sm font-medium"
              >
                Método de Pago
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {paymentMethods.length > 0 ? (
                <>
                  <div 
                    className="text-lg sm:text-2xl font-bold capitalize"
                    aria-label={`Método de pago: ${paymentMethods[0].brand} terminada en ${paymentMethods[0].last4}`}
                  >
                    {paymentMethods[0].brand} •••• {paymentMethods[0].last4}
                  </div>
                  <p 
                    id="payment-method-description"
                    className="text-xs sm:text-sm text-muted-foreground"
                  >
                    Expira {paymentMethods[0].expMonth}/{paymentMethods[0].expYear}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-sm text-muted-foreground">Sin método de pago</div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    onClick={() => setShowAddPaymentModal(true)}
                    aria-label="Agregar método de pago"
                  >
                    Agregar
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Alertas */}
      {subscription.status === 'trialing' && subscription.trialEndsAt && (
        <Card 
          className="border-blue-500 bg-blue-50 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
          role="alert"
          aria-labelledby="trial-alert-title"
        >
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" aria-hidden="true" />
              <CardTitle id="trial-alert-title" className="text-sm sm:text-base">Período de Prueba</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <p className="text-sm sm:text-base">
              Tu período de prueba termina el {formatDate(subscription.trialEndsAt)}. Agrega un
              método de pago para continuar usando el servicio.
            </p>
          </CardContent>
        </Card>
      )}

      {subscription.status === 'past_due' && (
        <Card 
          className="border-yellow-500 bg-yellow-50 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
          role="alert"
          aria-labelledby="past-due-alert-title"
        >
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" aria-hidden="true" />
              <CardTitle id="past-due-alert-title" className="text-sm sm:text-base">Pago Vencido</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <p className="text-sm sm:text-base">
              Tu último pago falló. Por favor actualiza tu método de pago para evitar la suspensión
              del servicio.
            </p>
            <Button
              size="sm"
              variant="default"
              className="mt-2 min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
              onClick={() => setShowAddPaymentModal(true)}
              aria-label="Actualizar método de pago para resolver el pago vencido"
            >
              Actualizar Método de Pago
            </Button>
          </CardContent>
        </Card>
      )}

      {subscription.canceledAt && subscription.status === 'active' && (
        <Card 
          className="border-orange-500 bg-orange-50 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
          role="alert"
          aria-labelledby="cancellation-alert-title"
        >
          <CardHeader className="p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" aria-hidden="true" />
              <CardTitle id="cancellation-alert-title" className="text-sm sm:text-base">Cancelación Programada</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <p className="text-sm sm:text-base">
              Tu suscripción se cancelará el {formatDate(subscription.currentPeriodEnd)}. Podrás
              seguir usando el servicio hasta esa fecha.
            </p>
            <Button
              size="sm"
              variant="default"
              className="mt-2 min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
              onClick={() => {
                // Reactivar suscripción
              }}
              aria-label="Reactivar suscripción cancelada"
            >
              Reactivar Suscripción
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tabs con contenido detallado */}
      <section 
        role="region" 
        aria-labelledby="billing-details-title"
      >
        <h2 id="billing-details-title" className="sr-only">Detalles de Facturación</h2>
        <Tabs defaultValue="usage" className="w-full">
          <TabsList 
            role="tablist"
            aria-label="Opciones de detalles de facturación"
            className="grid w-full grid-cols-1 sm:grid-cols-3"
          >
            <TabsTrigger 
              value="usage"
              role="tab"
              aria-selected="true"
              aria-controls="usage-panel"
              id="usage-tab"
              className="min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2 text-xs sm:text-sm"
            >
              Uso del Plan
            </TabsTrigger>
            <TabsTrigger 
              value="payments"
              role="tab"
              aria-selected="false"
              aria-controls="payments-panel"
              id="payments-tab"
              className="min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2 text-xs sm:text-sm"
            >
              Historial de Pagos
            </TabsTrigger>
            <TabsTrigger 
              value="methods"
              role="tab"
              aria-selected="false"
              aria-controls="methods-panel"
              id="methods-tab"
              className="min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2 text-xs sm:text-sm"
            >
              Métodos de Pago
            </TabsTrigger>
          </TabsList>

          {/* Tab: Uso del Plan */}
          <TabsContent 
            value="usage" 
            className="space-y-4"
            role="tabpanel"
            aria-labelledby="usage-tab"
            id="usage-panel"
            tabIndex={0}
          >
            <Card className="focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">{t('billing.usageMetrics')}</CardTitle>
                <CardDescription className="text-sm sm:text-base">{t('billing.monitorUsage')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                {usageMetrics &&
                  Object.entries(usageMetrics).map(([key, value]) => {
                    const percentage = (value.current / value.limit) * 100
                    const isNearLimit = percentage >= 80

                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between text-sm sm:text-base">
                          <span className="capitalize font-medium">
                            {key === 'locations'
                              ? 'Sedes'
                              : key === 'employees'
                                ? 'Empleados'
                                : key === 'appointments'
                                  ? 'Citas'
                                  : key === 'clients'
                                    ? 'Clientes'
                                    : key === 'services'
                                      ? 'Servicios'
                                      : key}
                          </span>
                          <span 
                            className={isNearLimit ? 'text-yellow-600 font-semibold' : ''}
                            aria-label={`${value.current} de ${value.limit} ${key} utilizados`}
                          >
                            {value.current} / {value.limit}
                          </span>
                        </div>
                        <Progress 
                          value={percentage} 
                          className={isNearLimit ? 'bg-yellow-100' : ''}
                          aria-label={`Progreso de uso: ${percentage.toFixed(1)}%`}
                        />
                      </div>
                    )
                  })}

                <div className="pt-4 space-y-2 sm:space-y-0 sm:space-x-2 sm:flex">
                  <Button 
                    onClick={() => setShowUpgradeModal(true)}
                    className="w-full sm:w-auto min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-label="Actualizar plan de suscripción"
                  >
                    Actualizar Plan
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCancelModal(true)}
                    className="w-full sm:w-auto min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-label="Cancelar suscripción actual"
                  >
                    Cancelar Suscripción
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Historial de Pagos */}
          <TabsContent 
            value="payments"
            role="tabpanel"
            aria-labelledby="payments-tab"
            id="payments-panel"
            tabIndex={0}
          >
            <Card className="focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Historial de Pagos</CardTitle>
                <CardDescription className="text-sm sm:text-base">Todos tus pagos y transacciones</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div 
                  className="space-y-4"
                  role="list"
                  aria-label="Lista de pagos realizados"
                >
                  {recentPayments.map(payment => (
                    <div
                      key={payment.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg space-y-2 sm:space-y-0 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
                      role="listitem"
                      tabIndex={0}
                      aria-labelledby={`payment-${payment.id}-amount`}
                      aria-describedby={`payment-${payment.id}-details`}
                    >
                      <div className="flex items-center gap-4">
                        {payment.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" aria-hidden="true" />
                        ) : payment.status === 'failed' ? (
                          <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" aria-hidden="true" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-500 flex-shrink-0" aria-hidden="true" />
                        )}
                        <div>
                          <p 
                            id={`payment-${payment.id}-amount`}
                            className="font-medium text-sm sm:text-base"
                            aria-label={`Monto del pago: ${formatCurrency(payment.amount)}`}
                          >
                            {formatCurrency(payment.amount)}
                          </p>
                          <p 
                            id={`payment-${payment.id}-details`}
                            className="text-xs sm:text-sm text-muted-foreground"
                          >
                            {payment.paidAt ? formatDate(payment.paidAt) : 'Pendiente'}
                          </p>
                          {payment.failureReason && (
                            <p className="text-xs sm:text-sm text-red-500">{payment.failureReason}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <Badge
                          variant={
                            payment.status === 'completed'
                              ? 'default'
                              : payment.status === 'failed'
                                ? 'destructive'
                                : 'secondary'
                          }
                          className="text-xs sm:text-sm"
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
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(payment.invoiceUrl, '_blank')}
                            className="min-h-[44px] min-w-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            aria-label="Descargar factura"
                            title="Descargar factura"
                          >
                            <Download className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {recentPayments.length === 0 && (
                    <p 
                      className="text-center text-muted-foreground py-8 text-sm sm:text-base"
                      role="status"
                      aria-label="No hay pagos registrados en el historial"
                    >
                      No hay pagos registrados
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Métodos de Pago */}
          <TabsContent 
            value="methods"
            role="tabpanel"
            aria-labelledby="methods-tab"
            id="methods-panel"
            tabIndex={0}
          >
            <Card className="focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Métodos de Pago</CardTitle>
                <CardDescription className="text-sm sm:text-base">Administra tus tarjetas guardadas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                <div 
                  role="list"
                  aria-label="Lista de métodos de pago guardados"
                >
                  {paymentMethods.map(method => (
                    <div
                      key={method.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg mb-4 space-y-2 sm:space-y-0 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
                      role="listitem"
                      tabIndex={0}
                      aria-labelledby={`method-${method.id}-info`}
                      aria-describedby={`method-${method.id}-expiry`}
                    >
                      <div className="flex items-center gap-4">
                        <CreditCard className="h-5 w-5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                        <div>
                          <p 
                            id={`method-${method.id}-info`}
                            className="font-medium capitalize text-sm sm:text-base"
                            aria-label={`Tarjeta ${method.brand} terminada en ${method.last4}`}
                          >
                            {method.brand} •••• {method.last4}
                          </p>
                          <p 
                            id={`method-${method.id}-expiry`}
                            className="text-xs sm:text-sm text-muted-foreground"
                          >
                            Expira {method.expMonth}/{method.expYear}
                          </p>
                        </div>
                      </div>
                      {method.isActive && (
                        <Badge variant="default" className="text-xs sm:text-sm self-start sm:self-center">
                          Predeterminada
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  className="w-full min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
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