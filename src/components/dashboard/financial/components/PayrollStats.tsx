import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, FileText, Users } from 'lucide-react'
import { formatCOP } from '@/lib/accounting/colombiaTaxes'
import { PayrollPayment } from '../hooks'

interface PayrollStatsProps {
  employeeCount: number
  payrollPayments: PayrollPayment[]
}

export function PayrollStats({ employeeCount, payrollPayments }: PayrollStatsProps) {
  const totalMonthlyPayroll = useMemo(() => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    return payrollPayments
      .filter(p => {
        const paymentDate = new Date(p.payment_period_end)
        return (
          paymentDate.getMonth() === currentMonth &&
          paymentDate.getFullYear() === currentYear &&
          p.status !== 'cancelled'
        )
      })
      .reduce((sum, p) => sum + p.net_payment, 0)
  }, [payrollPayments])

  const pendingPayments = useMemo(() => {
    return payrollPayments.filter(p => p.status === 'pending').length
  }, [payrollPayments])

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            Empleados Activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-foreground">{employeeCount}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Nómina Mensual Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-foreground">{formatCOP(totalMonthlyPayroll)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Pagos Pendientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-foreground">{pendingPayments}</p>
        </CardContent>
      </Card>
    </div>
  )
}