import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { validateExpenseForm } from '@/utils/expense';
import { EXPENSE_CATEGORIES, FREQUENCY_OPTIONS } from '@/constants/expense';
import type { ExpenseFormProps, ExpenseFormData } from '@/types/expense';

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingExpense,
  isLoading,
}) => {
  const [formData, setFormData] = useState<ExpenseFormData>({
    description: '',
    amount: '',
    category: '',
    frequency: '',
    next_payment_date: '',
    payment_method: '',
    notes: '',
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingExpense) {
      setFormData({
        description: editingExpense.description || '',
        amount: editingExpense.amount.toString(),
        category: editingExpense.category || '',
        frequency: editingExpense.frequency || '',
        next_payment_date: editingExpense.next_payment_date || '',
        payment_method: editingExpense.payment_method || '',
        notes: editingExpense.notes || '',
        is_active: editingExpense.is_active ?? true,
      });
    } else {
      setFormData({
        description: '',
        amount: '',
        category: '',
        frequency: '',
        next_payment_date: '',
        payment_method: '',
        notes: '',
        is_active: true,
      });
    }
    setErrors({});
  }, [editingExpense, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateExpenseForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    setErrors({});
    await onSubmit(formData);
  };

  const handleInputChange = (field: keyof ExpenseFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg sm:text-xl">
            {editingExpense ? 'Editar Gasto Recurrente' : 'Nuevo Gasto Recurrente'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Descripción *
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Ej: Arriendo oficina"
              className={`text-sm ${errors.description ? 'border-red-500' : ''}`}
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Monto y Categoría en fila en pantallas grandes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Monto */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium">
                Monto *
              </Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
                className={`text-sm ${errors.amount ? 'border-red-500' : ''}`}
              />
              {errors.amount && (
                <p className="text-xs text-red-500">{errors.amount}</p>
              )}
            </div>

            {/* Categoría */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">
                Categoría *
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger className={`text-sm ${errors.category ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span className="text-sm">{category.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-xs text-red-500">{errors.category}</p>
              )}
            </div>
          </div>

          {/* Frecuencia y Fecha en fila en pantallas grandes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Frecuencia */}
            <div className="space-y-2">
              <Label htmlFor="frequency" className="text-sm font-medium">
                Frecuencia *
              </Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => handleInputChange('frequency', value)}
              >
                <SelectTrigger className={`text-sm ${errors.frequency ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="text-sm">{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.frequency && (
                <p className="text-xs text-red-500">{errors.frequency}</p>
              )}
            </div>

            {/* Próximo pago */}
            <div className="space-y-2">
              <Label htmlFor="next_payment_date" className="text-sm font-medium">
                Próximo pago *
              </Label>
              <Input
                id="next_payment_date"
                type="date"
                value={formData.next_payment_date}
                onChange={(e) => handleInputChange('next_payment_date', e.target.value)}
                className={`text-sm ${errors.next_payment_date ? 'border-red-500' : ''}`}
              />
              {errors.next_payment_date && (
                <p className="text-xs text-red-500">{errors.next_payment_date}</p>
              )}
            </div>
          </div>

          {/* Método de pago */}
          <div className="space-y-2">
            <Label htmlFor="payment_method" className="text-sm font-medium">
              Método de pago
            </Label>
            <Input
              id="payment_method"
              value={formData.payment_method}
              onChange={(e) => handleInputChange('payment_method', e.target.value)}
              placeholder="Ej: Transferencia bancaria, Tarjeta de crédito"
              className="text-sm"
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notas adicionales
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Información adicional sobre este gasto..."
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          {/* Estado activo */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <Label htmlFor="is_active" className="text-sm font-medium">
              Gasto activo
            </Label>
          </div>
        </form>

        <DialogFooter className="pt-4 border-t">
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto text-sm"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full sm:w-auto text-sm"
            >
              {isLoading ? 'Guardando...' : editingExpense ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};