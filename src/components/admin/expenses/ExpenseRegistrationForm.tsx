import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Calendar, DollarSign, Receipt, Repeat, Save, X } from 'lucide-react';
import type { TransactionCategory, RecurrenceFrequency, RecurringExpense } from '@/types/types';

interface ExpenseRegistrationFormProps {
  businessId: string;
  locations: Array<{ id: string; name: string }>;
  onSuccess?: () => void;
  onCancel?: () => void;
  editingExpense?: RecurringExpense | null;
}

const EXPENSE_CATEGORIES: Array<{ value: TransactionCategory; label: string; group: string }> = [
  // Payroll
  { value: 'salary', label: 'Salario Base', group: 'Nómina' },
  { value: 'payroll', label: 'Nómina General', group: 'Nómina' },
  { value: 'bonuses', label: 'Bonificaciones', group: 'Nómina' },
  { value: 'commission', label: 'Comisiones', group: 'Nómina' },
  // Rent & Utilities
  { value: 'rent', label: 'Arriendo', group: 'Arriendo y Servicios' },
  { value: 'electricity', label: 'Electricidad', group: 'Arriendo y Servicios' },
  { value: 'water', label: 'Agua', group: 'Arriendo y Servicios' },
  { value: 'gas', label: 'Gas', group: 'Arriendo y Servicios' },
  { value: 'internet', label: 'Internet', group: 'Arriendo y Servicios' },
  { value: 'phone', label: 'Teléfono', group: 'Arriendo y Servicios' },
  { value: 'utilities', label: 'Servicios Públicos (General)', group: 'Arriendo y Servicios' },
  // Maintenance & Supplies
  { value: 'cleaning', label: 'Limpieza', group: 'Mantenimiento y Suministros' },
  { value: 'repairs', label: 'Reparaciones', group: 'Mantenimiento y Suministros' },
  { value: 'furniture', label: 'Mobiliario', group: 'Mantenimiento y Suministros' },
  { value: 'tools', label: 'Herramientas', group: 'Mantenimiento y Suministros' },
  { value: 'software', label: 'Software', group: 'Mantenimiento y Suministros' },
  { value: 'supplies', label: 'Suministros', group: 'Mantenimiento y Suministros' },
  { value: 'maintenance', label: 'Mantenimiento General', group: 'Mantenimiento y Suministros' },
  // Marketing
  { value: 'advertising', label: 'Publicidad', group: 'Marketing' },
  { value: 'social_media', label: 'Redes Sociales', group: 'Marketing' },
  { value: 'marketing', label: 'Marketing General', group: 'Marketing' },
  // Taxes
  { value: 'property_tax', label: 'Impuesto Predial', group: 'Impuestos' },
  { value: 'income_tax', label: 'Impuesto de Renta', group: 'Impuestos' },
  { value: 'vat', label: 'IVA', group: 'Impuestos' },
  { value: 'withholding', label: 'Retención en la Fuente', group: 'Impuestos' },
  { value: 'tax', label: 'Impuestos Generales', group: 'Impuestos' },
  // Insurance
  { value: 'liability_insurance', label: 'Seguro de Responsabilidad Civil', group: 'Seguros' },
  { value: 'fire_insurance', label: 'Seguro de Incendio', group: 'Seguros' },
  { value: 'theft_insurance', label: 'Seguro de Robo', group: 'Seguros' },
  { value: 'health_insurance', label: 'Seguro de Salud', group: 'Seguros' },
  { value: 'insurance', label: 'Seguros Generales', group: 'Seguros' },
  // Training
  { value: 'certifications', label: 'Certificaciones', group: 'Capacitación' },
  { value: 'courses', label: 'Cursos', group: 'Capacitación' },
  { value: 'training', label: 'Capacitación General', group: 'Capacitación' },
  // Equipment
  { value: 'equipment', label: 'Equipos', group: 'Equipos' },
  // Transportation
  { value: 'fuel', label: 'Combustible', group: 'Transporte' },
  { value: 'parking', label: 'Parqueadero', group: 'Transporte' },
  { value: 'public_transport', label: 'Transporte Público', group: 'Transporte' },
  // Professional Fees
  { value: 'accounting_fees', label: 'Honorarios Contables', group: 'Honorarios Profesionales' },
  { value: 'legal_fees', label: 'Honorarios Legales', group: 'Honorarios Profesionales' },
  { value: 'consulting_fees', label: 'Honorarios de Consultoría', group: 'Honorarios Profesionales' },
  // Other
  { value: 'depreciation', label: 'Depreciación', group: 'Otros' },
  { value: 'bank_fees', label: 'Comisiones Bancarias', group: 'Otros' },
  { value: 'interest', label: 'Intereses', group: 'Otros' },
  { value: 'donations', label: 'Donaciones', group: 'Otros' },
  { value: 'uniforms', label: 'Uniformes', group: 'Otros' },
  { value: 'security', label: 'Seguridad', group: 'Otros' },
  { value: 'waste_disposal', label: 'Recolección de Basuras', group: 'Otros' },
  { value: 'other_expense', label: 'Otros Egresos', group: 'Otros' },
];

const RECURRENCE_FREQUENCIES: Array<{ value: RecurrenceFrequency; label: string }> = [
  { value: 'daily', label: 'Diario' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quincenal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'yearly', label: 'Anual' },
];

export const ExpenseRegistrationForm: React.FC<ExpenseRegistrationFormProps> = ({
  businessId,
  locations,
  onSuccess,
  onCancel,
  editingExpense,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState(editingExpense?.name || '');
  const [description, setDescription] = useState(editingExpense?.description || '');
  const [category, setCategory] = useState<TransactionCategory>(editingExpense?.category || 'other_expense');
  const [amount, setAmount] = useState(editingExpense?.amount?.toString() || '');
  const [locationId, setLocationId] = useState(editingExpense?.location_id || '');
  const [isRecurring, setIsRecurring] = useState(!!editingExpense?.id);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>(
    editingExpense?.recurrence_frequency || 'monthly'
  );
  const [recurrenceDay, setRecurrenceDay] = useState(editingExpense?.recurrence_day?.toString() || '1');
  const [isAutomated, setIsAutomated] = useState(editingExpense?.is_automated || false);
  const [paymentMethod, setPaymentMethod] = useState(editingExpense?.payment_method || '');
  const [notes, setNotes] = useState(editingExpense?.notes || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category || !amount || parseFloat(amount) <= 0) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setLoading(true);

    try {
      if (isRecurring) {
        // Crear o actualizar egreso recurrente
        const recurringData = {
          business_id: businessId,
          location_id: locationId || null,
          created_by: user?.id,
          name: name || null,
          description: description || `Egreso recurrente - ${EXPENSE_CATEGORIES.find(c => c.value === category)?.label}`,
          category,
          amount: parseFloat(amount),
          currency: 'COP',
          recurrence_frequency: recurrenceFrequency,
          recurrence_day: parseInt(recurrenceDay),
          next_payment_date: new Date().toISOString().split('T')[0],
          is_active: true,
          is_automated: isAutomated,
          payment_method: paymentMethod || null,
          notes: notes || null,
        };

        if (editingExpense?.id) {
          const { error } = await supabase
            .from('recurring_expenses')
            .update(recurringData)
            .eq('id', editingExpense.id);

          if (error) throw error;
          toast.success('Egreso recurrente actualizado exitosamente');
        } else {
          const { error } = await supabase
            .from('recurring_expenses')
            .insert([recurringData]);

          if (error) throw error;
          toast.success('Egreso recurrente creado exitosamente');
        }
      } else {
        // Crear transacción única
        const { error } = await supabase
          .from('transactions')
          .insert([{
            business_id: businessId,
            location_id: locationId || null,
            type: 'expense',
            category,
            amount: parseFloat(amount),
            currency: 'COP',
            description: description || `${EXPENSE_CATEGORIES.find(c => c.value === category)?.label}`,
            transaction_date: new Date().toISOString().split('T')[0],
            payment_method: paymentMethod || null,
            created_by: user?.id,
            is_verified: true,
            metadata: { notes: notes || undefined },
          }]);

        if (error) throw error;
        toast.success('Egreso registrado exitosamente');
      }

      // Reset form
      setName('');
      setDescription('');
      setCategory('other_expense');
      setAmount('');
      setLocationId('');
      setIsRecurring(false);
      setRecurrenceFrequency('monthly');
      setRecurrenceDay('1');
      setIsAutomated(false);
      setPaymentMethod('');
      setNotes('');

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error registering expense:', error);
      toast.error('Error al registrar el egreso');
    } finally {
      setLoading(false);
    }
  };

  // Group categories
  const groupedCategories = EXPENSE_CATEGORIES.reduce((acc, cat) => {
    if (!acc[cat.group]) acc[cat.group] = [];
    acc[cat.group].push(cat);
    return acc;
  }, {} as Record<string, typeof EXPENSE_CATEGORIES>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          {editingExpense ? 'Editar Egreso Recurrente' : 'Registrar Nuevo Egreso'}
        </CardTitle>
        <CardDescription>
          Registra egresos únicos o recurrentes para tu negocio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name (opcional para transacciones únicas) */}
          {isRecurring && (
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Egreso</Label>
              <Input
                id="name"
                placeholder="Ej: Arriendo Local Principal"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoría *</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as TransactionCategory)}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {Object.entries(groupedCategories).map(([group, cats]) => (
                  <div key={group}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {group}
                    </div>
                    {cats.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Monto (COP) *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="pl-10"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Sede (Opcional)</Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger id="location">
                <SelectValue placeholder="Todas las sedes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas las sedes</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Detalles adicionales del egreso..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Recurring Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="recurring"
              checked={isRecurring}
              onCheckedChange={(checked) => setIsRecurring(!!checked)}
              disabled={!!editingExpense}
            />
            <Label htmlFor="recurring" className="flex items-center gap-2 cursor-pointer">
              <Repeat className="h-4 w-4" />
              Egreso recurrente
            </Label>
          </div>

          {/* Recurrence Settings (solo si es recurrente) */}
          {isRecurring && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Frequency */}
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frecuencia</Label>
                  <Select
                    value={recurrenceFrequency}
                    onValueChange={(v) => setRecurrenceFrequency(v as RecurrenceFrequency)}
                  >
                    <SelectTrigger id="frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RECURRENCE_FREQUENCIES.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Recurrence Day */}
                <div className="space-y-2">
                  <Label htmlFor="recurrence_day">Día del Pago (1-31)</Label>
                  <Input
                    id="recurrence_day"
                    type="number"
                    min="1"
                    max="31"
                    value={recurrenceDay}
                    onChange={(e) => setRecurrenceDay(e.target.value)}
                  />
                </div>
              </div>

              {/* Automated Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="automated"
                  checked={isAutomated}
                  onCheckedChange={(checked) => setIsAutomated(!!checked)}
                />
                <Label htmlFor="automated" className="cursor-pointer text-sm">
                  Generar transacciones automáticamente (recomendado para egresos regulares)
                </Label>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment_method">Método de Pago</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger id="payment_method">
                <SelectValue placeholder="Selecciona un método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
                <SelectItem value="check">Cheque</SelectItem>
                <SelectItem value="credit_card">Tarjeta de Crédito</SelectItem>
                <SelectItem value="debit_card">Tarjeta Débito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas Adicionales</Label>
            <Textarea
              id="notes"
              placeholder="Información adicional..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Guardando...' : editingExpense ? 'Actualizar Egreso' : 'Registrar Egreso'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
