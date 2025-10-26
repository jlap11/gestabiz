/**
 * BillingDashboard Component
 * 
 * Dashboard principal de facturación con resumen de suscripción,
 * uso del plan, métodos de pago e historial de pagos
 */

import { useState } from 'react'
import { useSubscription } from '@/hooks/useSubscription'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  ArrowLeft,
} from 'lucide-react'
import { PlanUpgradeModal } from './PlanUpgradeModal'
import { CancelSubscriptionModal } from './CancelSubscriptionModal'
import { AddPaymentMethodModal } from './AddPaymentMethodModal'
import { PricingPage } from '@/pages/PricingPage'
import type { SubscriptionStatus } from '@/lib/payments/PaymentGateway'

interface BillingDashboardProps {
  businessId: string
}

export function BillingDashboard({ businessId }: Readonly<BillingDashboardProps>) {
  const { dashboard, isLoading, refresh } = useSubscription(businessId)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false)
  const [showPricingPage, setShowPricingPage] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Si usuario quiere ver planes, mostrar PricingPage inline
  if (showPricingPage) {
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          onClick={() => setShowPricingPage(false)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al Dashboard
        </Button>
        <PricingPage businessId={businessId} onClose={() => setShowPricingPage(false)} />
      </div>
    )
  }

  if (!dashboard?.subscription) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Plan Gratuito
            </CardTitle>
            <CardDescription>
              Actualmente estás usando el plan gratuito con funcionalidades básicas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Características incluidas:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Registro de negocios básico
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Hasta 3 citas por mes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  1 empleado
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  1 servicio
                </li>
              </ul>
            </div>
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-4">
                ¿Quieres desbloquear más funcionalidades? Actualiza al Plan Inicio
              </p>
              <Button onClick={() => setShowPricingPage(true)} className="w-full">
                Ver Plan Inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { subscription, paymentMethods, recentPayments, upcomingInvoice, usageMetrics } = dashboard

  const getStatusBadge = (status: SubscriptionStatus) => {
    const badges = {
      active: <Badge className="bg-green-500">Activa</Badge>,
      trialing: <Badge className="bg-blue-500">Período de Prueba</Badge>,
      past_due: <Badge className="bg-yellow-500">Pago Vencido</Badge>,
      canceled: <Badge className="bg-red-500">Cancelada</Badge>,
      suspended: <Badge className="bg-orange-500">Suspendida</Badge>,
      inactive: <Badge className="bg-gray-500">Inactiva</Badge>,
      expired: <Badge className="bg-red-700">Expirada</Badge>,
      paused: <Badge className="bg-purple-500">Pausada</Badge>,
    }
    return badges[status] || <Badge>{status}</Badge>
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
    <div className="space-y-6">
      {/* Header con información de suscripción */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan Actual</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{subscription.planType}</div>
            <p className="text-xs text-muted-foreground">
              {subscription.billingCycle === 'monthly' ? 'Mensual' : 'Anual'}
            </p>
            <div className="mt-2">{getStatusBadge(subscription.status)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximo Pago</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(upcomingInvoice?.amount || subscription.amount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDate(upcomingInvoice?.dueDate || subscription.currentPeriodEnd)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Método de Pago</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {paymentMethods.length > 0 ? (
              <>
                <div className="text-2xl font-bold capitalize">
                  {paymentMethods[0].brand} •••• {paymentMethods[0].last4}
                </div>
                <p className="text-xs text-muted-foreground">
                  Expira {paymentMethods[0].expMonth}/{paymentMethods[0].expYear}
                </p>
              </>
            ) : (
              <>
                <div className="text-sm text-muted-foreground">Sin método de pago</div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => setShowAddPaymentModal(true)}
                >
                  Agregar
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {subscription.status === 'trialing' && subscription.trialEndsAt && (
        <Card className="border-blue-500 bg-blue-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-sm">Período de Prueba</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Tu período de prueba termina el {formatDate(subscription.trialEndsAt)}.
              Agrega un método de pago para continuar usando el servicio.
            </p>
          </CardContent>
        </Card>
      )}

      {subscription.status === 'past_due' && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-sm">Pago Vencido</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Tu último pago falló. Por favor actualiza tu método de pago para evitar
              la suspensión del servicio.
            </p>
            <Button 
              size="sm" 
              variant="default" 
              className="mt-2"
              onClick={() => setShowAddPaymentModal(true)}
            >
              Actualizar Método de Pago
            </Button>
          </CardContent>
        </Card>
      )}

      {subscription.canceledAt && subscription.status === 'active' && (
        <Card className="border-orange-500 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-sm">Cancelación Programada</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Tu suscripción se cancelará el {formatDate(subscription.currentPeriodEnd)}.
              Podrás seguir usando el servicio hasta esa fecha.
            </p>
            <Button 
              size="sm" 
              variant="default" 
              className="mt-2"
              onClick={() => {
                // Reactivar suscripción
              }}
            >
              Reactivar Suscripción
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tabs con contenido detallado */}
      <Tabs defaultValue="usage" className="w-full">
        <TabsList>
          <TabsTrigger value="usage">Uso del Plan</TabsTrigger>
          <TabsTrigger value="payments">Historial de Pagos</TabsTrigger>
          <TabsTrigger value="methods">Métodos de Pago</TabsTrigger>
        </TabsList>

        {/* Tab: Uso del Plan */}
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Uso de Recursos</CardTitle>
              <CardDescription>
                Monitorea el uso de tu plan actual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {usageMetrics && Object.entries(usageMetrics).map(([key, value]) => {
                const percentage = (value.current / value.limit) * 100
                const isNearLimit = percentage >= 80

                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize font-medium">
                        {key === 'locations' ? 'Sedes' : 
                         key === 'employees' ? 'Empleados' :
                         key === 'appointments' ? 'Citas' :
                         key === 'clients' ? 'Clientes' :
                         key === 'services' ? 'Servicios' : key}
                      </span>
                      <span className={isNearLimit ? 'text-yellow-600 font-semibold' : ''}>
                        {value.current} / {value.limit}
                      </span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className={isNearLimit ? 'bg-yellow-100' : ''}
                    />
                  </div>
                )
              })}

              <div className="pt-4 space-x-2">
                <Button onClick={() => setShowUpgradeModal(true)}>
                  Actualizar Plan
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowCancelModal(true)}
                >
                  Cancelar Suscripción
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Historial de Pagos */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Pagos</CardTitle>
              <CardDescription>
                Todos tus pagos y transacciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPayments.map((payment) => (
                  <div 
                    key={payment.id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      {payment.status === 'completed' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : payment.status === 'failed' ? (
                        <XCircle className="h-5 w-5 text-red-500" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-500" />
                      )}
                      <div>
                        <p className="font-medium">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {payment.paidAt ? formatDate(payment.paidAt) : 'Pendiente'}
                        </p>
                        {payment.failureReason && (
                          <p className="text-sm text-red-500">
                            {payment.failureReason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        payment.status === 'completed' ? 'default' :
                        payment.status === 'failed' ? 'destructive' :
                        'secondary'
                      }>
                        {payment.status === 'completed' ? 'Completado' :
                         payment.status === 'failed' ? 'Fallido' :
                         payment.status === 'refunded' ? 'Reembolsado' :
                         'Pendiente'}
                      </Badge>
                      {payment.invoiceUrl && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => window.open(payment.invoiceUrl, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {recentPayments.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No hay pagos registrados
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Métodos de Pago */}
        <TabsContent value="methods">
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pago</CardTitle>
              <CardDescription>
                Administra tus tarjetas guardadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentMethods.map((method) => (
                <div 
                  key={method.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium capitalize">
                        {method.brand} •••• {method.last4}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Expira {method.expMonth}/{method.expYear}
                      </p>
                    </div>
                  </div>
                  {method.isActive && (
                    <Badge variant="default">Predeterminada</Badge>
                  )}
                </div>
              ))}

              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowAddPaymentModal(true)}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Agregar Método de Pago
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
    </div>
  )
}
