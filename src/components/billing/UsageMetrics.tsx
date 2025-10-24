// src/components/billing/UsageMetrics.tsx
// Usage metrics dashboard with charts, alerts, and projections
// Shows resource usage vs plan limits

import React from 'react'
import { AlertTriangle, TrendingUp, MapPin, Users, Briefcase, Calendar } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ResourceUsage {
  resource_type: string
  current_count: number
  limit: number
  percentage: number
}

interface UsageMetricsProps {
  usage: ResourceUsage[]
  planName: string
  billingCycle: 'monthly' | 'yearly'
}

export function UsageMetrics({ usage, planName, billingCycle }: Readonly<UsageMetricsProps>) {
  const { t } = useLanguage()
  // Resource icons mapping
  const getResourceIcon = (resourceType: string) => {
    const icons: Record<string, React.ReactNode> = {
      locations: <MapPin className="h-5 w-5" />,
      employees: <Users className="h-5 w-5" />,
      services: <Briefcase className="h-5 w-5" />,
      appointments: <Calendar className="h-5 w-5" />,
    }
    return icons[resourceType] || <Briefcase className="h-5 w-5" />
  }

  // Resource names in Spanish
  const getResourceName = (resourceType: string) => {
    const names: Record<string, string> = {
      locations: 'Sedes',
      employees: 'Empleados',
      services: 'Servicios',
      appointments: 'Citas',
    }
    return names[resourceType] || resourceType
  }

  // Get status badge
  const getStatusBadge = (percentage: number) => {
    if (percentage >= 90) {
      return <Badge variant="destructive">Crítico</Badge>
    }
    if (percentage >= 80) {
      return <Badge variant="secondary" className="bg-yellow-500 text-yellow-950">Advertencia</Badge>
    }
    return <Badge variant="default">Normal</Badge>
  }

  // Calculate alerts
  const alerts = usage.filter((item) => item.percentage >= 80)
  const hasUnlimited = usage.some((item) => item.limit === -1)

  // Project when limits will be reached (simple linear projection)
  const getProjection = (current: number, limit: number, percentage: number) => {
    if (limit === -1) return null // Unlimited
    if (percentage < 50) return null // Not close enough to project
    
    const remaining = limit - current
    const daysToLimit = Math.ceil((remaining / current) * 30) // Assuming 30 days period
    
    if (daysToLimit <= 0) return 'Límite alcanzado'
    if (daysToLimit <= 7) return `~${daysToLimit} días para límite`
    if (daysToLimit <= 30) return `~${Math.ceil(daysToLimit / 7)} semanas para límite`
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('billing.usageMetrics')}</h2>
          <p className="text-muted-foreground">
            {t('billing.planLabel')} {planName} • {t('billing.cycleLabel')} {billingCycle === 'monthly' ? t('billing.billingMonthly') : t('billing.billingAnnual')}
          </p>
        </div>
        {alerts.length > 0 && (
          <Badge variant="destructive" className="text-lg px-4 py-2">
            {alerts.length} {t('billing.alertCount', { count: alerts.length })}
          </Badge>
        )}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('billing.upcomingLimits')}</AlertTitle>
          <AlertDescription>
            Algunos recursos están cerca del límite de tu plan. Considera actualizar para evitar interrupciones.
          </AlertDescription>
        </Alert>
      )}

      {/* Usage Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {usage.map((item) => {
          const projection = getProjection(item.current_count, item.limit, item.percentage)
          const isUnlimited = item.limit === -1

          return (
            <Card key={item.resource_type}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {getResourceIcon(item.resource_type)}
                    </div>
                    <CardTitle className="text-lg">{getResourceName(item.resource_type)}</CardTitle>
                  </div>
                  {!isUnlimited && getStatusBadge(item.percentage)}
                </div>
                <CardDescription>
                  {isUnlimited ? 'Sin límite' : `${item.current_count} de ${item.limit} usados`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isUnlimited ? (
                  <>
                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="relative">
                        <Progress 
                          value={item.percentage} 
                          className="h-3"
                        />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{item.percentage.toFixed(0)}% usado</span>
                        <span className="font-medium">{item.limit - item.current_count} disponibles</span>
                      </div>
                    </div>

                    {/* Projection */}
                    {projection && (
                      <div className="mt-4 p-3 rounded-lg bg-muted">
                        <div className="flex items-center gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Proyección:</span>
                          <span className="font-medium">{projection}</span>
                        </div>
                      </div>
                    )}

                    {/* Warning Message */}
                    {item.percentage >= 90 && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Has alcanzado el {item.percentage.toFixed(0)}% del límite. 
                          Actualiza tu plan para seguir agregando {getResourceName(item.resource_type).toLowerCase()}.
                        </AlertDescription>
                      </Alert>
                    )}

                    {item.percentage >= 80 && item.percentage < 90 && (
                      <Alert className="mt-4 bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        <AlertDescription className="text-xs text-yellow-800 dark:text-yellow-200">
                          Estás cerca del límite. Considera actualizar tu plan pronto.
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6">
                    <div className="text-4xl font-bold text-primary mb-2">∞</div>
                    <p className="text-sm text-muted-foreground">
                      Recursos ilimitados en tu plan {planName}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Summary Card */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Resumen de Uso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-2xl font-bold">
                {usage.filter((item) => item.percentage >= 80 && item.limit !== -1).length}
              </div>
              <p className="text-sm text-muted-foreground">Recursos en advertencia</p>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {usage.filter((item) => item.limit === -1).length}
              </div>
              <p className="text-sm text-muted-foreground">Recursos ilimitados</p>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {usage.filter((item) => item.percentage < 50 && item.limit !== -1).length}
              </div>
              <p className="text-sm text-muted-foreground">Recursos disponibles</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unlimited Benefits (if applicable) */}
      {hasUnlimited && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">¡Capacidad Ilimitada!</h3>
                <p className="text-sm text-muted-foreground">
                  Tu plan {planName} incluye recursos ilimitados para escalar sin límites.
                  {alerts.length > 0 && ' Algunos recursos aún tienen límites - considera actualizar si necesitas más.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
