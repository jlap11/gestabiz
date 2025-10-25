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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Trash2 } from 'lucide-react'
import { Employee, PayrollConfig } from '../hooks'

interface PayrollConfigDialogProps {
  isOpen: boolean
  onClose: () => void
  employee: Employee | null
  config?: PayrollConfig
  onSave: (config: Partial<PayrollConfig>) => Promise<boolean>
}

export function PayrollConfigDialog({ 
  isOpen, 
  onClose, 
  employee, 
  config, 
  onSave 
}: PayrollConfigDialogProps) {
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

  useEffect(() => {
    if (config) {
      setConfigForm(config)
    } else {
      setConfigForm({
        commission_rate: 0,
        commission_base: 'appointments',
        calculate_prestaciones: true,
        cesantias_enabled: true,
        prima_enabled: true,
        vacaciones_enabled: true,
        intereses_cesantias_enabled: true,
        other_deductions: [],
      })
    }
  }, [config, isOpen])

  const handleSave = async () => {
    if (!employee) return

    const success = await onSave({
      employee_id: employee.employee_id,
      ...configForm,
    })

    if (success) {
      onClose()
    }
  }

  const addDeduction = () => {
    setConfigForm({
      ...configForm,
      other_deductions: [
        ...(configForm.other_deductions || []),
        { name: '', amount: 0 }
      ]
    })
  }

  const updateDeduction = (index: number, field: 'name' | 'amount', value: string | number) => {
    const deductions = [...(configForm.other_deductions || [])]
    deductions[index] = { ...deductions[index], [field]: value }
    setConfigForm({ ...configForm, other_deductions: deductions })
  }

  const removeDeduction = (index: number) => {
    const deductions = [...(configForm.other_deductions || [])]
    deductions.splice(index, 1)
    setConfigForm({ ...configForm, other_deductions: deductions })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configuración de Nómina</DialogTitle>
          <DialogDescription>
            {employee?.full_name} - Configura comisiones y prestaciones sociales
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Commission Configuration */}
          <div className="space-y-4">
            <h3 className="font-medium">Comisiones</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commission_rate">Porcentaje de Comisión (%)</Label>
                <Input
                  id="commission_rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={configForm.commission_rate || 0}
                  onChange={e => setConfigForm({ 
                    ...configForm, 
                    commission_rate: parseFloat(e.target.value) || 0 
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commission_base">Base de Comisión</Label>
                <Select
                  value={configForm.commission_base}
                  onValueChange={value => setConfigForm({ 
                    ...configForm, 
                    commission_base: value as 'appointments' | 'transactions' | 'both' 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appointments">Citas</SelectItem>
                    <SelectItem value="transactions">Transacciones</SelectItem>
                    <SelectItem value="both">Ambos</SelectItem>
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
                  onCheckedChange={checked => setConfigForm({ 
                    ...configForm, 
                    calculate_prestaciones: checked 
                  })}
                />
                <Label>Calcular Prestaciones</Label>
              </div>
            </div>

            {configForm.calculate_prestaciones && (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={configForm.cesantias_enabled}
                    onCheckedChange={checked => setConfigForm({ 
                      ...configForm, 
                      cesantias_enabled: checked 
                    })}
                  />
                  <Label>Cesantías (8.33%)</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={configForm.prima_enabled}
                    onCheckedChange={checked => setConfigForm({ 
                      ...configForm, 
                      prima_enabled: checked 
                    })}
                  />
                  <Label>Prima (8.33%)</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={configForm.vacaciones_enabled}
                    onCheckedChange={checked => setConfigForm({ 
                      ...configForm, 
                      vacaciones_enabled: checked 
                    })}
                  />
                  <Label>Vacaciones (4.17%)</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={configForm.intereses_cesantias_enabled}
                    onCheckedChange={checked => setConfigForm({ 
                      ...configForm, 
                      intereses_cesantias_enabled: checked 
                    })}
                  />
                  <Label>Intereses Cesantías (1%)</Label>
                </div>
              </div>
            )}
          </div>

          {/* Other Deductions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Otras Deducciones</h3>
              <Button variant="outline" size="sm" onClick={addDeduction}>
                Agregar Deducción
              </Button>
            </div>

            {configForm.other_deductions?.map((deduction, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Label>Concepto</Label>
                  <Input
                    value={deduction.name}
                    onChange={e => updateDeduction(index, 'name', e.target.value)}
                    placeholder="Ej: Préstamo empresa"
                  />
                </div>
                <div className="w-32">
                  <Label>Monto</Label>
                  <Input
                    type="number"
                    min="0"
                    value={deduction.amount}
                    onChange={e => updateDeduction(index, 'amount', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDeduction(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={configForm.notes || ''}
              onChange={e => setConfigForm({ ...configForm, notes: e.target.value })}
              placeholder="Observaciones sobre la configuración..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Guardar Configuración
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}