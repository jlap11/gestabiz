import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, Tag, FileText, CreditCard, Calculator, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { ButtonSpinner } from '@/components/ui/loading-spinner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTaxCalculation } from '@/hooks/useTaxCalculation';
import { formatCOP } from '@/lib/accounting/colombiaTaxes';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { TransactionType, TransactionCategory } from '@/types/types';
import type { TaxType } from '@/types/accounting.types';

interface EnhancedTransactionFormProps {
  businessId: string;
  locationId?: string;
  onSubmit: (transaction: EnhancedTransactionFormData) => Promise<void>;
  onCancel?: () => void;
  defaultType?: TransactionType;
}

export interface EnhancedTransactionFormData {
  type: TransactionType;
  category: TransactionCategory;
  subtotal: number;
  tax_type: TaxType;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  description?: string;
  transaction_date: string;
  payment_method?: string;
  employee_id?: string;
  appointment_id?: string;
}

const INCOME_CATEGORIES: TransactionCategory[] = [
  'appointment_payment',
  'product_sale',
  'membership',
  'package',
  'tip',
  'other_income',
];

const EXPENSE_CATEGORIES: TransactionCategory[] = [
  'salary',
  'commission',
  'rent',
  'utilities',
  'supplies',
  'equipment',
  'marketing',
  'maintenance',
  'tax',
  'insurance',
  'training',
  'other_expense',
];

const PAYMENT_METHODS = [
  'cash',
  'credit_card',
  'debit_card',
  'bank_transfer',
  'digital_wallet',
  'check',
];

export function EnhancedTransactionForm({
  businessId,
  locationId,
  onSubmit,
  onCancel,
  defaultType = 'income',
}: EnhancedTransactionFormProps) {
  const { t } = useLanguage();
  const { config, calculateTaxes } = useTaxCalculation(businessId);
  
  const [formData, setFormData] = useState<EnhancedTransactionFormData>({
    type: defaultType,
    category: defaultType === 'income' ? 'appointment_payment' : 'salary',
    subtotal: 0,
    tax_type: 'iva_19',
    tax_rate: 0,
    tax_amount: 0,
    total_amount: 0,
    currency: 'COP',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
  });

  const [autoCalculateTaxes, setAutoCalculateTaxes] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Calcular impuestos automáticamente con debounce
  useEffect(() => {
    if (!autoCalculateTaxes) {
      // Cálculo manual: total = subtotal + tax_amount
      setFormData(prev => ({
        ...prev,
        total_amount: prev.subtotal + prev.tax_amount,
      }));
      return;
    }

    if (formData.subtotal <= 0) {
      return;
    }

    // Debounce de 300ms para evitar cálculos excesivos
    setIsCalculating(true);
    const timeoutId = setTimeout(() => {
      try {
        const taxes = calculateTaxes(formData.subtotal, formData.tax_type);
        const totalRate = (taxes.total_tax / formData.subtotal);
        setFormData(prev => ({
          ...prev,
          tax_rate: totalRate,
          tax_amount: taxes.total_tax,
          total_amount: taxes.total_amount,
        }));
      } finally {
        setIsCalculating(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      setIsCalculating(false);
    };
  }, [formData.subtotal, formData.tax_type, autoCalculateTaxes, calculateTaxes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.subtotal <= 0) {
      toast.error('El subtotal debe ser mayor a 0');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      toast.success(t('transactions.submitSuccess'));
      // Reset form
      setFormData({
        type: defaultType,
        category: defaultType === 'income' ? 'appointment_payment' : 'salary',
        subtotal: 0,
        tax_type: 'iva_19',
        tax_rate: 0,
        tax_amount: 0,
        total_amount: 0,
        currency: 'COP',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
      });
    } catch {
      toast.error(t('transactions.errors.submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTypeChange = (type: TransactionType) => {
    setFormData(prev => ({
      ...prev,
      type,
      category: type === 'income' ? 'appointment_payment' : 'salary',
    }));
  };

  const categories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // Info sobre configuración fiscal
  const hasTaxConfig = !!config;
  const getTaxRegimeLabel = () => {
    if (!config) return 'No configurado';
    if (config.tax_regime === 'simple') return 'Simplificado';
    if (config.tax_regime === 'common') return 'Común';
    return 'Especial';
  };
  const taxRegimeLabel = getTaxRegimeLabel();

  return (
    <Card className="p-6 bg-card">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{t('transactions.newTransaction')}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Transacción con cálculo automático de impuestos
            </p>
          </div>
          {hasTaxConfig && (
            <div className="text-xs text-muted-foreground text-right">
              <p>Régimen: {taxRegimeLabel}</p>
            </div>
          )}
        </div>

        {/* Aviso si no hay configuración fiscal */}
        {!hasTaxConfig && (
          <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  Configuración Fiscal No Encontrada
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                  Configure los impuestos de su negocio para calcular IVA, ICA y retención automáticamente.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Type Selection (Income/Expense) */}
        <div className="space-y-2">
          <Label>Tipo de Transacción</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={cn(
                "p-4 border-2 rounded-lg text-left transition-all",
                formData.type === 'income'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                  : 'border-border hover:border-green-300'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="font-medium text-foreground">Ingreso</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Ventas, servicios, cobros
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={cn(
                "p-4 border-2 rounded-lg text-left transition-all",
                formData.type === 'expense'
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-border hover:border-red-300'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-5 w-5 text-red-600 dark:text-red-400" />
                <span className="font-medium text-foreground">Egreso</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Gastos, compras, pagos
              </p>
            </button>
          </div>
        </div>

        {/* Grid: Category + Currency */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">
              <Tag className="h-4 w-4 inline mr-2" />
              Categoría
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData(prev => ({ ...prev, category: value as TransactionCategory }))
              }
            >
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {t(`transactions.categories.${cat}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label htmlFor="currency">Moneda</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
            >
              <SelectTrigger id="currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COP">COP (Pesos Colombianos)</SelectItem>
                <SelectItem value="USD">USD (Dólar)</SelectItem>
                <SelectItem value="EUR">EUR (Euro)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cálculo de Impuestos Section */}
        <Card className="p-4 bg-muted/50 border-border">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold text-foreground flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Cálculo de Impuestos
              </Label>
              <div className="flex items-center gap-2">
                <Label htmlFor="auto-taxes" className="text-sm text-muted-foreground">
                  Automático
                </Label>
                <Switch
                  id="auto-taxes"
                  checked={autoCalculateTaxes}
                  onCheckedChange={setAutoCalculateTaxes}
                />
              </div>
            </div>

            {/* Subtotal */}
            <div className="space-y-2">
              <Label htmlFor="subtotal">Subtotal (Base gravable)</Label>
              <Input
                id="subtotal"
                type="number"
                step="0.01"
                min="0"
                value={formData.subtotal}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, subtotal: parseFloat(e.target.value) || 0 }))
                }
                placeholder="0.00"
                required
                disabled={isCalculating}
                className="bg-background text-lg font-semibold"
              />
            </div>

            {/* Tax Type (solo si auto) */}
            {autoCalculateTaxes && (
              <div className="space-y-2">
                <Label htmlFor="tax_type">Tipo de Impuesto</Label>
                <Select
                  value={formData.tax_type}
                  onValueChange={(value) =>
                    setFormData(prev => ({ ...prev, tax_type: value as TaxType }))
                  }
                  disabled={isCalculating}
                >
                  <SelectTrigger id="tax_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iva_0">IVA 0% (Exento)</SelectItem>
                    <SelectItem value="iva_5">IVA 5% (Productos básicos)</SelectItem>
                    <SelectItem value="iva_19">IVA 19% (General)</SelectItem>
                    <SelectItem value="ica">Solo ICA</SelectItem>
                    <SelectItem value="retention">Con retención</SelectItem>
                    <SelectItem value="exempt">Exento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Tax Rate (manual) */}
            {!autoCalculateTaxes && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="tax_rate">Tasa de Impuesto (%)</Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.tax_rate}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))
                    }
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax_amount">Monto del Impuesto</Label>
                  <Input
                    id="tax_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.tax_amount}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, tax_amount: parseFloat(e.target.value) || 0 }))
                    }
                    className="bg-background"
                  />
                </div>
              </div>
            )}

            {/* Resumen de impuestos calculados */}
            {autoCalculateTaxes && formData.subtotal > 0 && (
              <div className="pt-2 space-y-2 border-t border-border">
                {isCalculating ? (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <ButtonSpinner />
                    <span className="text-sm text-muted-foreground">Calculando impuestos...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tasa aplicada:</span>
                      <span className="font-medium text-foreground">
                        {(formData.tax_rate * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Impuesto calculado:</span>
                      <span className="font-medium text-foreground">
                        {formatCOP(formData.tax_amount)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Total Amount */}
            <div className="pt-2 border-t border-border">
              <div className="flex justify-between items-center">
                <Label className="text-base font-semibold text-foreground">Total a Pagar</Label>
                <span className="text-2xl font-bold text-primary">
                  {formatCOP(formData.total_amount)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Grid: Date + Payment Method */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Transaction Date */}
          <div className="space-y-2">
            <Label htmlFor="transaction_date">
              <Calendar className="h-4 w-4 inline mr-2" />
              Fecha
            </Label>
            <Input
              id="transaction_date"
              type="date"
              value={formData.transaction_date}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, transaction_date: e.target.value }))
              }
              required
              className="bg-background"
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment_method">
              <CreditCard className="h-4 w-4 inline mr-2" />
              Método de Pago
            </Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) =>
                setFormData(prev => ({ ...prev, payment_method: value }))
              }
            >
              <SelectTrigger id="payment_method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(method => (
                  <SelectItem key={method} value={method}>
                    {t(`transactions.paymentMethods.${method}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">
            <FileText className="h-4 w-4 inline mr-2" />
            Descripción{' '}
            <span className="text-muted-foreground font-normal">
              (opcional)
            </span>
          </Label>
          <Textarea
            id="description"
            placeholder={t('common.placeholders.transactionDetails')}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            maxLength={500}
            className="bg-background"
          />
          <div className="text-xs text-muted-foreground text-right">
            {formData.description?.length || 0}/500
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={formData.subtotal <= 0 || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? t('common.actions.saving') : t('common.actions.save')}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {t('common.actions.cancel')}
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
