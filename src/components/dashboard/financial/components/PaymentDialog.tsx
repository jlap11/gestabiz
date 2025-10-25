import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatCOP } from '@/lib/accounting/colombiaTaxes'
import { Employee, PayrollConfig, PayrollPayment, usePayrollCalculations } from '../hooks'

interface PaymentDialogProps {
  isOpen: boolean
  onClose: () => void
  employee: Employee | null
  config?: PayrollConfig
  onCreatePayment: (payment: Partial<PayrollPayment>) => Promise<boolean>
}

export function PaymentDialog({ 
  isOpen, 
  onClose, 
  employee, 
  config, 
  onCreatePayment 
}: PaymentDialogProps) {
  const { calculatePayroll } = usePayrollCalculations()
  
  const [paymentForm, setPaymentForm] = useState<Partial<PayrollPayment>>({
    payment_period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
    payment_period_end: new Date().toISOString().split('T')[0],
    commissions: 0,
    other_earnings: 0,
    status: 'pending',
  })

  const [calculatedPayroll, setCalculatedPayroll] = useState<ReturnType<typeof calculatePayroll> | null>(null)

  useEffect(() => {
    if (employee && config) {
      const calculation = calculatePayroll({
        employee,
        config,
        commissions: paymentForm.commissions || 0,
        otherEarnings: paymentForm.other_earnings || 0,
        periodStart: paymentForm.payment_period_start || '',
        periodEnd: paymentForm.payment_period_end || '',
      })
      
      setCalculatedPayroll(calculation)
      setPaymentForm(prev => ({
        ...prev,
        employee_id: employee.employee_id,
        employee_name: employee.full_name,
        ...calculation,
      }))
    }
  }, [employee, config, paymentForm.commissions, paymentForm.other_earnings, paymentForm.payment_period_start, paymentForm.payment_period_end, calculatePayroll])

  const handleCreatePayment = async () => {
    if (!employee || !calculatedPayroll) return

    const success = await onCreatePayment(paymentForm)
    if (success) {
      onClose()
      // Reset form
      setPaymentForm({
        payment_period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          .toISOString()
          .split('T')[0],
        payment_period_end: new Date().toISOString().split('T')[0],
        commissions: 0,
        other_earnings: 0,
        status: 'pending',
      })
    }
  }

  if (!employee || !config) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Calcular Nómina</DialogTitle>
          <DialogDescription>
            {employee.full_name} - Período de pago y cálculos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Period Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period_start">Fecha Inicio Período</Label>
              <Input
                id="period_start"
                type="date"
                value={paymentForm.payment_period_start}
                onChange={e => setPaymentForm({ 
                  ...paymentForm, 
                  payment_period_start: e.target.value 
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="period_end">Fecha Fin Período</Label>
              <Input
                id="period_end"
                type="date"
                value={paymentForm.payment_period_end}
                onChange={e => setPaymentForm({ 
                  ...paymentForm, 
                  payment_period_end: e.target.value 
                })}
              />
            </div>
          </div>

          {/* Variable Earnings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="commissions">Comisiones</Label>
              <Input
                id="commissions"
                type="number"
                min="0"
                step="1000"
                value={paymentForm.commissions || 0}
                onChange={e => setPaymentForm({ 
                  ...paymentForm, 
                  commissions: parseFloat(e.target.value) || 0 
                })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="other_earnings">Otros Ingresos</Label>
              <Input
                id="other_earnings"
                type="number"
                min="0"
                step="1000"
                value={paymentForm.other_earnings || 0}
                onChange={e => setPaymentForm({ 
                  ...paymentForm, 
                  other_earnings: parseFloat(e.target.value) || 0 
                })}
              />
            </div>
          </div>

          {/* Calculation Summary */}
          {calculatedPayroll && (
            <div className="bg-muted/50 p-4 rounded-lg space-y-3">
              <h3 className="font-medium">Resumen de Cálculo</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Salario Base:</span>
                  <span className="font-medium">{formatCOP(calculatedPayroll.salary_base)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Comisiones:</span>
                  <span className="font-medium">{formatCOP(calculatedPayroll.commissions)}</span>
                </div>
                
                {config.calculate_prestaciones && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cesantías (8.33%):</span>
                      <span className="font-medium">{formatCOP(calculatedPayroll.cesantias)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prima (8.33%):</span>
                      <span className="font-medium">{formatCOP(calculatedPayroll.prima)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vacaciones (4.17%):</span>
                      <span className="font-medium">{formatCOP(calculatedPayroll.vacaciones)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Intereses Cesantías (1% mensual):</span>
                      <span className="font-medium">{formatCOP(calculatedPayroll.intereses_cesantias)}</span>
                    </div>
                  </>
                )}

                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>TOTAL DEVENGADO:</span>
                  <span className="text-green-600">{formatCOP(calculatedPayroll.total_earnings)}</span>
                </div>

                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-red-600">
                    <span className="text-muted-foreground">Salud (4%):</span>
                    <span>-{formatCOP(calculatedPayroll.health_deduction)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span className="text-muted-foreground">Pensión (4%):</span>
                    <span>-{formatCOP(calculatedPayroll.pension_deduction)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span className="text-muted-foreground">Otras Deducciones:</span>
                    <span>-{formatCOP(calculatedPayroll.other_deductions)}</span>
                  </div>
                </div>

                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>TOTAL DEDUCCIONES:</span>
                  <span className="text-red-600">-{formatCOP(calculatedPayroll.total_deductions)}</span>
                </div>

                <div className="border-t-2 pt-3 flex justify-between font-bold text-lg">
                  <span>NETO A PAGAR:</span>
                  <span className="text-foreground">{formatCOP(calculatedPayroll.net_payment)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment_method">Método de Pago (opcional)</Label>
            <Input
              id="payment_method"
              value={paymentForm.payment_method || ''}
              onChange={e => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
              placeholder="Ej: Transferencia bancaria"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="payment_notes">Notas (opcional)</Label>
            <Textarea
              id="payment_notes"
              value={paymentForm.notes || ''}
              onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              placeholder="Observaciones sobre este pago..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleCreatePayment}>
              Registrar Pago
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}