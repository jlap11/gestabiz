import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DollarSign, Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format, addMonths, addWeeks, addDays } from 'date-fns'

interface EmployeeSalaryConfigProps {
  employeeId: string
  businessId: string
  employeeName: string
  currentSalaryBase?: number | null
  currentSalaryType?: string | null
}

type SalaryType = 'monthly' | 'biweekly' | 'weekly' | 'daily' | 'hourly'

export function EmployeeSalaryConfig({
  employeeId,
  businessId,
  employeeName,
  currentSalaryBase,
  currentSalaryType,
}: Readonly<EmployeeSalaryConfigProps>) {
  const [saving, setSaving] = useState(false)

  const [salaryBase, setSalaryBase] = useState<number>(currentSalaryBase || 0)
  const [salaryType, setSalaryType] = useState<SalaryType>((currentSalaryType as SalaryType) || 'monthly')
  const [automatePayroll, setAutomatePayroll] = useState(true)
  const [paymentDay, setPaymentDay] = useState(30) // Día del mes para pago mensual

  useEffect(() => {
    if (currentSalaryBase !== undefined && currentSalaryBase !== null) {
      setSalaryBase(currentSalaryBase)
    }
    if (currentSalaryType) {
      setSalaryType(currentSalaryType as SalaryType)
    }
  }, [currentSalaryBase, currentSalaryType])

  const calculateNextPaymentDate = (
    frequency: SalaryType,
    day: number
  ): string => {
    const today = new Date()
    const currentDay = today.getDate()

    if (frequency === 'monthly') {
      // Si el día de pago ya pasó este mes, usar el próximo mes
      if (currentDay > day) {
        return format(
          addMonths(new Date(today.getFullYear(), today.getMonth(), day), 1),
          'yyyy-MM-dd'
        )
      } else {
        return format(
          new Date(today.getFullYear(), today.getMonth(), day),
          'yyyy-MM-dd'
        )
      }
    } else if (frequency === 'biweekly') {
      // Cada 15 días
      return format(addWeeks(today, 2), 'yyyy-MM-dd')
    } else if (frequency === 'weekly') {
      // Cada 7 días
      return format(addWeeks(today, 1), 'yyyy-MM-dd')
    } else if (frequency === 'daily') {
      // Cada día
      return format(addDays(today, 1), 'yyyy-MM-dd')
    }

    // Default: próximo mes
    return format(addMonths(today, 1), 'yyyy-MM-dd')
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // 1. Update business_employees.salary_base y salary_type
      const { error: employeeError } = await supabase
        .from('business_employees')
        .update({
          salary_base: salaryBase > 0 ? salaryBase : null,
          salary_type: salaryType,
          updated_at: new Date().toISOString(),
        })
        .eq('employee_id', employeeId)
        .eq('business_id', businessId)

      if (employeeError) throw employeeError

      // 2. Si automation habilitada y salaryBase > 0, crear/actualizar recurring_expense
      if (salaryBase > 0) {
        // Map salary_type to recurrence_frequency
        const frequencyMap: Record<SalaryType, string> = {
          monthly: 'monthly',
          biweekly: 'biweekly',
          weekly: 'weekly',
          daily: 'daily',
          hourly: 'monthly', // Por hora factura mensual por defecto
        }
        const recurrenceFrequency = frequencyMap[salaryType]
        const recurrenceDay = salaryType === 'monthly' ? paymentDay : 15 // Default día 15 para no mensuales

        await supabase.from('recurring_expenses').upsert(
          {
            business_id: businessId,
            employee_id: employeeId,
            location_id: null, // Employee expenses don't have location
            name: `Salario - ${employeeName}`,
            description: `Salario ${getSalaryTypeLabel(salaryType)} de ${employeeName}`,
            category: 'payroll',
            amount: salaryBase,
            currency: 'COP',
            recurrence_frequency: recurrenceFrequency,
            recurrence_day: recurrenceDay,
            next_payment_date: calculateNextPaymentDate(salaryType, recurrenceDay),
            is_automated: automatePayroll,
            is_active: true,
            start_date: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'business_id,employee_id,category',
            ignoreDuplicates: false,
          }
        )
      } else {
        // Si salaryBase es 0, desactivar egreso recurrente existente
        await supabase
          .from('recurring_expenses')
          .update({ is_active: false })
          .eq('business_id', businessId)
          .eq('employee_id', employeeId)
          .eq('category', 'payroll')
      }

      toast.success('Configuración de salario guardada exitosamente')
    } catch {
      toast.error('Error al guardar configuración de salario')
    } finally {
      setSaving(false)
    }
  }

  const getSalaryTypeLabel = (type: SalaryType): string => {
    const labels: Record<SalaryType, string> = {
      monthly: 'mensual',
      biweekly: 'quincenal',
      weekly: 'semanal',
      daily: 'diario',
      hourly: 'por hora',
    }
    return labels[type]
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5" />
          Configuración de Nómina
        </CardTitle>
        <CardDescription>
          Configure el salario base y frecuencia de pago de este empleado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="salary-base">Salario Base (COP)</Label>
            <Input
              id="salary-base"
              type="number"
              min={0}
              value={salaryBase}
              onChange={(e) => setSalaryBase(Number(e.target.value))}
              placeholder="1.300.000"
            />
            {salaryBase > 0 && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(salaryBase)} {getSalaryTypeLabel(salaryType)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="salary-type">Frecuencia de Pago</Label>
            <Select
              value={salaryType}
              onValueChange={(v) => setSalaryType(v as SalaryType)}
            >
              <SelectTrigger id="salary-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensual</SelectItem>
                <SelectItem value="biweekly">Quincenal</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="daily">Diario</SelectItem>
                <SelectItem value="hourly">Por Hora</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {salaryType === 'monthly' && (
          <div className="space-y-2">
            <Label htmlFor="payment-day">Día de Pago del Mes</Label>
            <Select
              value={paymentDay.toString()}
              onValueChange={(v) => setPaymentDay(Number(v))}
            >
              <SelectTrigger id="payment-day">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    Día {day}
                  </SelectItem>
                ))}
                <SelectItem value="30">Último día del mes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-base font-medium">
              Generar egreso recurrente automáticamente
            </Label>
            <p className="text-sm text-muted-foreground">
              Crea un registro de egreso que se procesará automáticamente cada período de
              pago
            </p>
          </div>
          <Switch checked={automatePayroll} onCheckedChange={setAutomatePayroll} />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Configuración de Salario
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
