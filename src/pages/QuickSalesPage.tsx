/**
 * QuickSalesPage - Página de ventas rápidas para administradores
 * Permite registrar ventas directas sin cita previa y ver historial
 */

import React, { useEffect, useState } from 'react'
import { Calendar, DollarSign, Package, TrendingUp, User } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QuickSaleForm } from '@/components/sales/QuickSaleForm'
import supabase from '@/lib/supabase'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface Transaction {
  id: string
  amount: number
  currency: string
  description: string
  payment_method: string
  transaction_date: string
  created_at: string
  metadata: {
    client_name?: string
    client_phone?: string
    client_document?: string
    client_email?: string
    service_id?: string
    notes?: string
  }
  profiles?: {
    full_name: string
  }
}

interface QuickSalesPageProps {
  businessId: string
}

export function QuickSalesPage({ businessId }: QuickSalesPageProps) {
  const [recentSales, setRecentSales] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    month: 0,
  })

  useEffect(() => {
    fetchRecentSales()
    fetchStats()
  }, [businessId])

  const fetchRecentSales = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(
          `
          id,
          amount,
          currency,
          description,
          payment_method,
          transaction_date,
          created_at,
          metadata,
          profiles!transactions_employee_id_fkey (
            full_name
          )
        `
        )
        .eq('business_id', businessId)
        .eq('type', 'income')
        .eq('category', 'service_sale')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setRecentSales(data || [])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(`Error al cargar ventas: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      // Today
      const { data: todayData } = await supabase
        .from('transactions')
        .select('amount')
        .eq('business_id', businessId)
        .eq('type', 'income')
        .eq('category', 'service_sale')
        .eq('transaction_date', today)

      // Week
      const { data: weekData } = await supabase
        .from('transactions')
        .select('amount')
        .eq('business_id', businessId)
        .eq('type', 'income')
        .eq('category', 'service_sale')
        .gte('transaction_date', weekAgo)

      // Month
      const { data: monthData } = await supabase
        .from('transactions')
        .select('amount')
        .eq('business_id', businessId)
        .eq('type', 'income')
        .eq('category', 'service_sale')
        .gte('transaction_date', monthAgo)

      setStats({
        today: todayData?.reduce((sum, t) => sum + t.amount, 0) || 0,
        week: weekData?.reduce((sum, t) => sum + t.amount, 0) || 0,
        month: monthData?.reduce((sum, t) => sum + t.amount, 0) || 0,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(`Error al cargar estadísticas: ${errorMessage}`)
    }
  }

  const handleSaleSuccess = () => {
    fetchRecentSales()
    fetchStats()
  }

  const formatPaymentMethod = (method: string) => {
    const methods: Record<string, string> = {
      cash: '💵 Efectivo',
      card: '💳 Tarjeta',
      transfer: '🏦 Transferencia',
    }
    return methods[method] || method
  }

  return (
    <div className="space-y-6 p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ventas Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.today.toLocaleString('es-CO')}</div>
            <p className="text-xs text-muted-foreground mt-1">COP</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Últimos 7 Días
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.week.toLocaleString('es-CO')}</div>
            <p className="text-xs text-muted-foreground mt-1">COP</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Últimos 30 Días
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.month.toLocaleString('es-CO')}</div>
            <p className="text-xs text-muted-foreground mt-1">COP</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Sale Form */}
      <QuickSaleForm businessId={businessId} onSuccess={handleSaleSuccess} />

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Ventas Recientes</CardTitle>
          <CardDescription>Últimas 10 ventas registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : recentSales.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay ventas registradas aún</p>
              <p className="text-sm">Registra tu primera venta rápida arriba</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSales.map(sale => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {sale.metadata?.client_name || 'Cliente sin nombre'}
                      </span>
                      {sale.metadata?.client_phone && (
                        <span className="text-sm text-muted-foreground">
                          📱 {sale.metadata.client_phone}
                        </span>
                      )}
                    </div>
                    {(sale.metadata?.client_document || sale.metadata?.client_email) && (
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1">
                        {sale.metadata?.client_document && (
                          <span>🆔 {sale.metadata.client_document}</span>
                        )}
                        {sale.metadata?.client_email && (
                          <span>📧 {sale.metadata.client_email}</span>
                        )}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">{sale.description}</p>
                    {sale.metadata?.notes && (
                      <p className="text-xs text-muted-foreground mt-1">📝 {sale.metadata.notes}</p>
                    )}
                    {sale.profiles?.full_name && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Atendió: {sale.profiles.full_name}
                      </p>
                    )}
                  </div>

                  <div className="text-right space-y-1">
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                      ${sale.amount.toLocaleString('es-CO')}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatPaymentMethod(sale.payment_method)}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {new Date(sale.created_at).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
