import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Plus, Loader2, DollarSign } from 'lucide-react'
import { toast } from 'sonner'

interface BusinessRecurringExpensesProps {
  businessId: string
  businessName: string
}

type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'

// 12 categorías de egresos a nivel de negocio (no empleados ni sedes)
const BUSINESS_EXPENSE_CATEGORIES = [
  { value: 'insurance', label: 'Seguros' },
  { value: 'software', label: 'Software y Licencias' },
  { value: 'professional_fees', label: 'Honorarios Profesionales' },
  { value: 'taxes', label: 'Impuestos y Tasas' },
  { value: 'marketing', label: 'Marketing y Publicidad' },
  { value: 'office_supplies', label: 'Suministros de Oficina' },
  { value: 'equipment', label: 'Equipamiento' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'travel', label: 'Viajes y Transporte' },
  { value: 'training', label: 'Capacitación' },
  { value: 'legal', label: 'Legal y Contabilidad' },
  { value: 'other', label: 'Otros' },
] as const

interface RecurringExpense {
  id: string
  name: string
  description: string | null
  category: string
  amount: number
  recurrence_frequency: RecurrenceFrequency
  recurrence_day: number
  is_active: boolean
}

export function BusinessRecurringExpenses({
  businessId,
  businessName,
}: Readonly<BusinessRecurringExpensesProps>) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expenses, setExpenses] = useState<RecurringExpense[]>([])

  // Estado para nuevo egreso
  const [showNewExpenseForm, setShowNewExpenseForm] = useState(false)
  const [newExpenseName, setNewExpenseName] = useState('')
  const [newExpenseDescription, setNewExpenseDescription] = useState('')
  const [newExpenseCategory, setNewExpenseCategory] = useState<string>('insurance')
  const [newExpenseAmount, setNewExpenseAmount] = useState<number>(0)
  const [newExpenseFrequency, setNewExpenseFrequency] = useState<RecurrenceFrequency>('monthly')
  const [newExpenseDay, setNewExpenseDay] = useState<number>(1)

  useEffect(() => {
    loadExpenses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId])

  const loadExpenses = async () => {
    try {
      setLoading(true)

      // Fetch egresos recurrentes del negocio (location_id=NULL y employee_id=NULL)
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('id, name, description, category, amount, recurrence_frequency, recurrence_day, is_active')
        .eq('business_id', businessId)
        .is('location_id', null)
        .is('employee_id', null)
        .eq('is_active', true)
        .order('category', { ascending: true })

      if (error) throw error

      setExpenses(data || [])
    } catch {
      toast.error('Error al cargar egresos recurrentes del negocio')
    } finally {
      setLoading(false)
    }
  }

  // Calcular próxima fecha de pago
  const calculateNextPaymentDate = (frequency: RecurrenceFrequency, day: number): string => {
    const today = new Date()
    const currentDay = today.getDate()
    const nextDate = new Date(today)

    switch (frequency) {
      case 'daily':
        nextDate.setDate(currentDay + 1)
        break
      case 'weekly':
        nextDate.setDate(currentDay + 7)
        break
      case 'biweekly':
        nextDate.setDate(currentDay + 14)
        break
      case 'monthly':
        // Si el día ya pasó este mes, ir al próximo mes
        if (currentDay >= day) {
          nextDate.setMonth(nextDate.getMonth() + 1)
        }
        nextDate.setDate(day)
        break
      case 'quarterly':
        // Próximo trimestre, mismo día
        if (currentDay >= day) {
          nextDate.setMonth(nextDate.getMonth() + 3)
        }
        nextDate.setDate(day)
        break
      case 'yearly':
        // Próximo año, mismo día
        if (currentDay >= day) {
          nextDate.setFullYear(nextDate.getFullYear() + 1)
        }
        nextDate.setDate(day)
        break
    }

    return nextDate.toISOString().split('T')[0]
  }

  const handleAddExpense = async () => {
    if (!newExpenseName.trim() || newExpenseAmount <= 0) {
      toast.error('Nombre y monto son requeridos')
      return
    }

    try {
      setSaving(true)

      const { error } = await supabase.from('recurring_expenses').insert({
        business_id: businessId,
        location_id: null,
        employee_id: null,
        name: newExpenseName,
        description: newExpenseDescription || null,
        category: newExpenseCategory,
        amount: newExpenseAmount,
        currency: 'COP',
        recurrence_frequency: newExpenseFrequency,
        recurrence_day: newExpenseDay,
        next_payment_date: calculateNextPaymentDate(newExpenseFrequency, newExpenseDay),
        is_automated: false, // Egresos generales no se automatizan por defecto
        is_active: true,
        start_date: new Date().toISOString().split('T')[0],
      })

      if (error) throw error

      toast.success('Egreso recurrente agregado exitosamente')

      // Reset form
      setNewExpenseName('')
      setNewExpenseDescription('')
      setNewExpenseCategory('insurance')
      setNewExpenseAmount(0)
      setNewExpenseFrequency('monthly')
      setNewExpenseDay(1)
      setShowNewExpenseForm(false)

      // Reload
      await loadExpenses()
    } catch {
      toast.error('Error al agregar egreso recurrente')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      setSaving(true)

      // Soft delete
      const { error } = await supabase
        .from('recurring_expenses')
        .update({ is_active: false })
        .eq('id', expenseId)

      if (error) throw error

      toast.success('Egreso recurrente eliminado exitosamente')
      await loadExpenses()
    } catch {
      toast.error('Error al eliminar egreso recurrente')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getCategoryLabel = (category: string): string => {
    const cat = BUSINESS_EXPENSE_CATEGORIES.find((c) => c.value === category)
    return cat ? cat.label : category
  }

  const getFrequencyLabel = (frequency: RecurrenceFrequency): string => {
    const labels: Record<RecurrenceFrequency, string> = {
      daily: 'Diario',
      weekly: 'Semanal',
      biweekly: 'Quincenal',
      monthly: 'Mensual',
      quarterly: 'Trimestral',
      yearly: 'Anual',
    }
    return labels[frequency]
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5" />
          Egresos Recurrentes del Negocio
        </CardTitle>
        <CardDescription>
          Gestiona egresos generales como seguros, software, impuestos, etc.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* LISTA DE EGRESOS EXISTENTES */}
        {expenses.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Egresos Actuales ({expenses.length})</h3>
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{expense.name}</p>
                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                      {getCategoryLabel(expense.category)}
                    </span>
                  </div>
                  {expense.description && (
                    <p className="text-sm text-muted-foreground">{expense.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span>{formatCurrency(expense.amount)}</span>
                    <span>•</span>
                    <span>{getFrequencyLabel(expense.recurrence_frequency)}</span>
                    <span>•</span>
                    <span>Día {expense.recurrence_day}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteExpense(expense.id)}
                  disabled={saving}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* BOTÓN AGREGAR */}
        {!showNewExpenseForm && (
          <Button onClick={() => setShowNewExpenseForm(true)} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Egreso Recurrente
          </Button>
        )}

        {/* FORMULARIO NUEVO EGRESO */}
        {showNewExpenseForm && (
          <div className="space-y-4 p-4 border rounded-lg bg-muted/10">
            <h3 className="text-sm font-medium">Nuevo Egreso Recurrente</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-expense-name">Nombre *</Label>
                <Input
                  id="new-expense-name"
                  value={newExpenseName}
                  onChange={(e) => setNewExpenseName(e.target.value)}
                  placeholder="Ej: Seguro de Responsabilidad Civil"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-expense-category">Categoría *</Label>
                <Select value={newExpenseCategory} onValueChange={setNewExpenseCategory}>
                  <SelectTrigger id="new-expense-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-expense-description">Descripción (opcional)</Label>
              <Input
                id="new-expense-description"
                value={newExpenseDescription}
                onChange={(e) => setNewExpenseDescription(e.target.value)}
                placeholder="Detalles adicionales..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-expense-amount">Monto (COP) *</Label>
                <Input
                  id="new-expense-amount"
                  type="number"
                  min={0}
                  value={newExpenseAmount}
                  onChange={(e) => setNewExpenseAmount(Number(e.target.value))}
                  placeholder="500000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-expense-frequency">Frecuencia *</Label>
                <Select
                  value={newExpenseFrequency}
                  onValueChange={(v) => setNewExpenseFrequency(v as RecurrenceFrequency)}
                >
                  <SelectTrigger id="new-expense-frequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                    <SelectItem value="biweekly">Quincenal</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="daily">Diario</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-expense-day">Día de Pago *</Label>
                <Input
                  id="new-expense-day"
                  type="number"
                  min={1}
                  max={28}
                  value={newExpenseDay}
                  onChange={(e) => setNewExpenseDay(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddExpense} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Agregar Egreso'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewExpenseForm(false)
                  setNewExpenseName('')
                  setNewExpenseDescription('')
                  setNewExpenseAmount(0)
                }}
                disabled={saving}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {expenses.length === 0 && !showNewExpenseForm && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay egresos recurrentes configurados para este negocio
          </p>
        )}
      </CardContent>
    </Card>
  )
}
