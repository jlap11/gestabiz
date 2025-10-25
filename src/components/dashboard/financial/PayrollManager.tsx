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
  PayrollConfig,
} from './hooks'
import {
  PayrollStats,
  EmployeeCard,
  PaymentCard,
  PayrollConfigDialog,
  PaymentDialog,
} from './components'

interface PayrollManagerProps {
  businessId: string
}

export function PayrollManager({ businessId }: Readonly<PayrollManagerProps>) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)

  // Custom hooks
  const { employees, loading: employeesLoading } = usePayrollEmployees(businessId)
  const { payrollConfigs, saveConfig, loading: configLoading } = usePayrollConfig(businessId)
  const { payrollPayments, createPayment, markAsPaid, loading: paymentsLoading } = usePayrollPayments(businessId)

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
                    />
                  ))}
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
                    <PaymentCard
                      key={payment.id}
                      payment={payment}
                      onMarkAsPaid={() => markAsPaid(payment.id!)}
                      onGeneratePDF={() => handleGeneratePDF(payment)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Config Dialog */}
      <PayrollConfigDialog
        isOpen={isConfigDialogOpen}
        onClose={() => setIsConfigDialogOpen(false)}
        employee={selectedEmployee}
        businessId={businessId}
        onConfigSaved={() => setIsConfigDialogOpen(false)}
      />

      {/* Payment Dialog */}
      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        onClose={() => setIsPaymentDialogOpen(false)}
        employee={selectedEmployee}
        businessId={businessId}
        onPaymentCreated={() => setIsPaymentDialogOpen(false)}
      />
    </div>
  )
}
