import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, TrendingUp } from 'lucide-react'
import { formatCOP } from '@/lib/accounting/colombiaTaxes'
import { PayrollPayment } from '../hooks'

interface PaymentCardProps {
  payment: PayrollPayment
  onMarkAsPaid: (paymentId: string) => void
  onGeneratePDF: (payment: PayrollPayment) => void
}

export function PaymentCard({ payment, onMarkAsPaid, onGeneratePDF }: PaymentCardProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
      paid: { label: 'Pagado', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    )
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-foreground">
                {payment.employee_name}
              </h4>
              {getStatusBadge(payment.status)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date(payment.payment_period_start).toLocaleDateString()} -{' '}
              {new Date(payment.payment_period_end).toLocaleDateString()}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Salario: </span>
                <span className="font-medium">{formatCOP(payment.salary_base)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Comisiones: </span>
                <span className="font-medium">{formatCOP(payment.commissions)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Prestaciones: </span>
                <span className="font-medium">
                  {formatCOP(payment.cesantias + payment.prima + payment.vacaciones + payment.intereses_cesantias)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Neto: </span>
                <span className="font-bold text-foreground">
                  {formatCOP(payment.net_payment)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {payment.status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMarkAsPaid(payment.id!)}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Marcar Pagado
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onGeneratePDF(payment)}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar PDF
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}