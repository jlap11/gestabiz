// ============================================================================
// COMPONENT: PayrollManager
// Sistema completo de nómina con prestaciones sociales colombianas
// ============================================================================

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Users } from 'lucide-react'
import { exportPayrollToPDF, formatPayrollForExport } from '@/lib/accounting/exportPayroll'
import { toast } from 'sonner'
import {
  usePayrollEmployees,
  usePayrollConfig,
  usePayrollPayments,
  Employee,
  PayrollPayment,
} from './hooks'
import {
  PayrollStats,
  EmployeeCard,
  PaymentCard,
  PayrollConfigDialog,
  PaymentDialog,
} from './components'

interface Employee {
  id: string
  employee_id: string
  full_name: string
  email: string
  salary_base: number
  salary_type: string
  hired_at: string
  is_active: boolean
}

interface PayrollConfig {
  id?: string
  business_id: string
  employee_id: string
  commission_rate: number
  commission_base: 'appointments' | 'transactions' | 'both'
  calculate_prestaciones: boolean
  cesantias_enabled: boolean
  prima_enabled: boolean
  vacaciones_enabled: boolean
  intereses_cesantias_enabled: boolean
  other_deductions: Array<{ name: string; amount: number }>
  notes?: string
}

interface PayrollPayment {
  id?: string
  business_id: string
  employee_id: string
  employee_name?: string
  payment_period_start: string
  payment_period_end: string
  salary_base: number
  commissions: number
  cesantias: number
  prima: number
  vacaciones: number
  intereses_cesantias: number
  other_earnings: number
  total_earnings: number
  health_deduction: number
  pension_deduction: number
  other_deductions: number
  total_deductions: number
  net_payment: number
  payment_date?: string
  payment_method?: string
  status: 'pending' | 'paid' | 'cancelled'
  notes?: string
}

interface PayrollManagerProps {
  businessId: string
}

// Constantes para prestaciones sociales colombianas
const PRESTACIONES_RATES = {
  CESANTIAS: 0.0833, // 8.33% del salario mensual
  PRIMA: 0.0833, // 8.33% del salario mensual
  VACACIONES: 0.0417, // 4.17% del salario mensual
  INTERESES_CESANTIAS: 0.12, // 12% anual sobre cesantías
}

// Deducciones obligatorias
const DEDUCTIONS_RATES = {
  HEALTH: 0.04, // 4% salud (empleado)
  PENSION: 0.04, // 4% pensión (empleado)
}

// Helper functions
const getPaymentStatusClass = (status: 'pending' | 'paid' | 'cancelled'): string => {
  if (status === 'paid') return 'bg-green-100 text-green-800'
  if (status === 'pending') return 'bg-yellow-100 text-yellow-800'
  return 'bg-gray-100 text-gray-800'
}

const getPaymentStatusLabel = (status: 'pending' | 'paid' | 'cancelled'): string => {
  if (status === 'paid') return 'Pagado'
  if (status === 'pending') return 'Pendiente'
  return 'Cancelado'
}

export function PayrollManager({ businessId }: Readonly<PayrollManagerProps>) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('employees')

  // Custom hooks
  const { employees, loading: employeesLoading } = usePayrollEmployees(businessId)
  const { payrollConfigs, saveConfig, loading: configLoading } = usePayrollConfig(businessId)
  const { payrollPayments, createPayment, markAsPaid, loading: paymentsLoading } = usePayrollPayments(businessId)

  // Config form state
  const [configForm, setConfigForm] = useState<Partial<PayrollConfig>>({
    commission_rate: 0,
    commission_base: 'appointments',
    calculate_prestaciones: true,
    cesantias_enabled: true,
    prima_enabled: true,
    vacaciones_enabled: true,
    intereses_cesantias_enabled: true,
    other_deductions: [],
  })

  // Payment form state
  const [paymentForm, setPaymentForm] = useState<Partial<PayrollPayment>>({
    payment_period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0],
    payment_period_end: new Date().toISOString().split('T')[0],
    commissions: 0,
    other_earnings: 0,
    status: 'pending',
  })

  const loading = employeesLoading || configLoading || paymentsLoading

  // Event handlers
  const handleOpenConfig = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsConfigDialogOpen(true)
  }

  const handleOpenPayment = (employee: Employee) => {
    setSelectedEmployee(employee)
    setIsPaymentDialogOpen(true)
  }

  const handleSaveConfig = async (config: any) => {
    if (!selectedEmployee) return
    await saveConfig(selectedEmployee.employee_id, config)
    setIsConfigDialogOpen(false)
  }

  const handleCreatePayment = async (paymentData: any) => {
    if (!selectedEmployee) return
    await createPayment(selectedEmployee.employee_id, paymentData)
    setIsPaymentDialogOpen(false)
  }

  const handleMarkAsPaid = async (paymentId: string) => {
    await markAsPaid(paymentId)
  }

  const handleGeneratePDF = async (payment: PayrollPayment) => {
    const toastId = toast.loading('Generando comprobante...')
    try {
      const pdfData = formatPayrollForExport(payment)
      await exportPayrollToPDF(
        pdfData,
        `Comprobante_Nomina_${payment.employee_name}_${payment.payment_period_end}.pdf`
      )
      toast.success('Comprobante generado exitosamente', { id: toastId })
    } catch {
      toast.error('Error al generar comprobante', { id: toastId })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <PayrollStats 
        employees={employees}
        payrollPayments={payrollPayments}
      />

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Nómina</CardTitle>
          <CardDescription>
            Administra salarios, comisiones y prestaciones sociales colombianas
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="employees">
                <Users className="h-4 w-4 mr-2" />
                Empleados
              </TabsTrigger>
              <TabsTrigger value="payments">
                <FileText className="h-4 w-4 mr-2" />
                Historial de Pagos
              </TabsTrigger>
            </TabsList>

            {/* Employees Tab */}
            <TabsContent value="employees" className="space-y-4">
              {loading && (
                <div className="text-center py-8 text-muted-foreground">Cargando empleados...</div>
              )}
              {!loading && employees.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No hay empleados activos
                </div>
              )}
              {!loading && employees.length > 0 && (
                <div className="space-y-2">
                  {employees.map(employee => (
                    <EmployeeCard
                      key={employee.employee_id}
                      employee={employee}
                      config={payrollConfigs.get(employee.employee_id)}
                      onConfigurePayroll={() => handleOpenConfig(employee)}
                      onCalculatePayroll={() => handleOpenPayment(employee)}
                              >
                                <Calculator className="h-4 w-4 mr-2" />
                                Calcular Nómina
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-4">
              {payrollPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay pagos de nómina registrados
                </div>
              ) : (
                <div className="space-y-2">
                  {payrollPayments.map(payment => (
                    <Card key={payment.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-foreground">
                                {payment.employee_name}
                              </h4>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${getPaymentStatusClass(payment.status)}`}
                              >
                                {getPaymentStatusLabel(payment.status)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Período:{' '}
                              {new Date(payment.payment_period_start).toLocaleDateString('es-CO')} -{' '}
                              {new Date(payment.payment_period_end).toLocaleDateString('es-CO')}
                            </p>
                            <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Devengado: </span>
                                <span className="font-medium">
                                  {formatCOP(payment.total_earnings)}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Deducciones: </span>
                                <span className="font-medium text-red-600">
                                  -{formatCOP(payment.total_deductions)}
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
                                onClick={() => void handleMarkAsPaid(payment.id!)}
                              >
                                <TrendingUp className="h-4 w-4 mr-2" />
                                Marcar Pagado
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void handleGeneratePDF(payment)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Descargar PDF
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Config Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configuración de Nómina</DialogTitle>
            <DialogDescription>
              {selectedEmployee?.full_name} - Configura comisiones y prestaciones sociales
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Commission Configuration */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="font-medium">Comisiones</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="commission_rate">Tasa de Comisión (%)</Label>
                  <Input
                    id="commission_rate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={configForm.commission_rate}
                    onChange={e =>
                      setConfigForm({
                        ...configForm,
                        commission_rate: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commission_base">Base de Comisión</Label>
                  <Select
                    value={configForm.commission_base}
                    onValueChange={value =>
                      setConfigForm({
                        ...configForm,
                        commission_base: value as PayrollConfig['commission_base'],
                      })
                    }
                  >
                    <SelectTrigger id="commission_base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="appointments">Citas Completadas</SelectItem>
                      <SelectItem value="transactions">Transacciones de Ingreso</SelectItem>
                      <SelectItem value="both">Ambas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Prestaciones Configuration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Prestaciones Sociales</h3>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={configForm.calculate_prestaciones}
                    onCheckedChange={checked =>
                      setConfigForm({ ...configForm, calculate_prestaciones: checked })
                    }
                  />
                  <Label>Calcular Prestaciones</Label>
                </div>
              </div>

              {configForm.calculate_prestaciones && (
                <div className="space-y-3 pl-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Cesantías (8.33%)</Label>
                      <p className="text-xs text-muted-foreground">
                        Ahorro para terminación de contrato
                      </p>
                    </div>
                    <Switch
                      checked={configForm.cesantias_enabled}
                      onCheckedChange={checked =>
                        setConfigForm({ ...configForm, cesantias_enabled: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Prima (8.33%)</Label>
                      <p className="text-xs text-muted-foreground">Prima de servicios semestral</p>
                    </div>
                    <Switch
                      checked={configForm.prima_enabled}
                      onCheckedChange={checked =>
                        setConfigForm({ ...configForm, prima_enabled: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Vacaciones (4.17%)</Label>
                      <p className="text-xs text-muted-foreground">
                        Provisión para vacaciones anuales
                      </p>
                    </div>
                    <Switch
                      checked={configForm.vacaciones_enabled}
                      onCheckedChange={checked =>
                        setConfigForm({ ...configForm, vacaciones_enabled: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Intereses de Cesantías (12% anual)</Label>
                      <p className="text-xs text-muted-foreground">Intereses sobre cesantías</p>
                    </div>
                    <Switch
                      checked={configForm.intereses_cesantias_enabled}
                      onCheckedChange={checked =>
                        setConfigForm({ ...configForm, intereses_cesantias_enabled: checked })
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={configForm.notes || ''}
                onChange={e => setConfigForm({ ...configForm, notes: e.target.value })}
                placeholder="Información adicional sobre la configuración de nómina..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => void handleSaveConfig()}>Guardar Configuración</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Calcular Nómina</DialogTitle>
            <DialogDescription>{selectedEmployee?.full_name} - Período de pago</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Period */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="period_start">Fecha Inicio</Label>
                <Input
                  id="period_start"
                  type="date"
                  value={paymentForm.payment_period_start}
                  onChange={e =>
                    setPaymentForm({ ...paymentForm, payment_period_start: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="period_end">Fecha Fin</Label>
                <Input
                  id="period_end"
                  type="date"
                  value={paymentForm.payment_period_end}
                  onChange={e =>
                    setPaymentForm({ ...paymentForm, payment_period_end: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <h3 className="font-medium">Resumen de Nómina</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Salario Base:</span>
                  <span className="font-medium">{formatCOP(paymentForm.salary_base || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Comisiones:</span>
                  <span className="font-medium">{formatCOP(paymentForm.commissions || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cesantías (8.33%):</span>
                  <span className="font-medium">{formatCOP(paymentForm.cesantias || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prima (8.33%):</span>
                  <span className="font-medium">{formatCOP(paymentForm.prima || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vacaciones (4.17%):</span>
                  <span className="font-medium">{formatCOP(paymentForm.vacaciones || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Intereses Cesantías (1% mensual):</span>
                  <span className="font-medium">
                    {formatCOP(paymentForm.intereses_cesantias || 0)}
                  </span>
                </div>

                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>TOTAL DEVENGADO:</span>
                  <span className="text-green-600">
                    {formatCOP(paymentForm.total_earnings || 0)}
                  </span>
                </div>

                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-red-600">
                    <span className="text-muted-foreground">Salud (4%):</span>
                    <span>-{formatCOP(paymentForm.health_deduction || 0)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span className="text-muted-foreground">Pensión (4%):</span>
                    <span>-{formatCOP(paymentForm.pension_deduction || 0)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span className="text-muted-foreground">Otras Deducciones:</span>
                    <span>-{formatCOP(paymentForm.other_deductions || 0)}</span>
                  </div>
                </div>

                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>TOTAL DEDUCCIONES:</span>
                  <span className="text-red-600">
                    -{formatCOP(paymentForm.total_deductions || 0)}
                  </span>
                </div>

                <div className="border-t-2 pt-3 flex justify-between font-bold text-lg">
                  <span>NETO A PAGAR:</span>
                  <span className="text-foreground">{formatCOP(paymentForm.net_payment || 0)}</span>
                </div>
              </div>
            </div>

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
              <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => void handleCreatePayment()}>Registrar Pago</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
