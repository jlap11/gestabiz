import React, { useState } from 'react';
import { DollarSign, Calendar, Tag, FileText, CreditCard } from 'lucide-react';
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
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import type { TransactionType, TransactionCategory } from '@/types/types';

interface TransactionFormProps {
  businessId: string;
  locationId?: string;
  onSubmit: (transaction: TransactionFormData) => Promise<void>;
  onCancel?: () => void;
  defaultType?: TransactionType;
  onSuccess?: () => void;
}

export interface TransactionFormData {
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
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

export function TransactionForm({
  businessId,
  locationId,
  onSubmit,
  onCancel,
  defaultType = 'income',
}: TransactionFormProps) {
  const { t } = useLanguage();
  
  const [formData, setFormData] = useState<TransactionFormData>({
    type: defaultType,
    category: defaultType === 'income' ? 'appointment_payment' : 'salary',
    amount: 0,
    currency: 'COP',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.amount <= 0) {
      toast.error(t('transactions.errors.invalidAmount'));
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
        amount: 0,
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

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <h3 className="text-lg font-semibold">{t('transactions.newTransaction')}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t('transactions.formDescription')}
          </p>
        </div>

        {/* Type Selection (Income/Expense) */}
        <div className="space-y-2">
          <Label>{t('transactions.type')}</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                formData.type === 'income'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="font-medium">{t('transactions.income')}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('transactions.incomeDescription')}
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                formData.type === 'expense'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-5 w-5 text-red-600" />
                <span className="font-medium">{t('transactions.expense')}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('transactions.expenseDescription')}
              </p>
            </button>
          </div>
        </div>

        {/* Grid: Category + Amount */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">
              <Tag className="h-4 w-4 inline mr-2" />
              {t('transactions.category')}
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

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              <DollarSign className="h-4 w-4 inline mr-2" />
              {t('transactions.amount')}
            </Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
                }
                placeholder="0.00"
                required
                className="flex-1"
              />
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COP">COP</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Grid: Date + Payment Method */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Transaction Date */}
          <div className="space-y-2">
            <Label htmlFor="transaction_date">
              <Calendar className="h-4 w-4 inline mr-2" />
              {t('transactions.date')}
            </Label>
            <Input
              id="transaction_date"
              type="date"
              value={formData.transaction_date}
              onChange={(e) =>
                setFormData(prev => ({ ...prev, transaction_date: e.target.value }))
              }
              required
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment_method">
              <CreditCard className="h-4 w-4 inline mr-2" />
              {t('transactions.paymentMethod')}
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
            {t('transactions.description')} {' '}
            <span className="text-muted-foreground font-normal">
              ({t('common.optional')})
            </span>
          </Label>
          <Textarea
            id="description"
            placeholder={t('transactions.descriptionPlaceholder')}
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            maxLength={500}
          />
          <div className="text-xs text-muted-foreground text-right">
            {formData.description?.length || 0}/500
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={formData.amount <= 0 || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? t('common.submitting') : t('transactions.submitTransaction')}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
