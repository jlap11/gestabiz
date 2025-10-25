import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'
import type { TransactionCategory, TransactionType } from '@/types/types'
import { TransactionTypeSelector } from './TransactionTypeSelector'
import { TransactionCategoryField } from './TransactionCategoryField'
import { TransactionAmountField } from './TransactionAmountField'
import { TransactionDateField } from './TransactionDateField'
import { TransactionPaymentMethodField } from './TransactionPaymentMethodField'
import { TransactionDescriptionField } from './TransactionDescriptionField'

interface TransactionFormProps {
  businessId: string
  locationId?: string
  onSubmit: (transaction: TransactionFormData) => Promise<void>
  onCancel?: () => void
  defaultType?: TransactionType
  onSuccess?: () => void
}

export interface TransactionFormData {
  type: TransactionType
  category: TransactionCategory
  amount: number
  currency: string
  description?: string
  transaction_date: string
  payment_method?: string
  employee_id?: string
  appointment_id?: string
}



export function TransactionForm({
  businessId,
  locationId,
  onSubmit,
  onCancel,
  defaultType = 'income',
}: TransactionFormProps) {
  const { t } = useLanguage()

  const [formData, setFormData] = useState<TransactionFormData>({
    type: defaultType,
    category: defaultType === 'income' ? 'appointment_payment' : 'salary',
    amount: 0,
    currency: 'MXN',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.amount <= 0) {
      toast.error(t('transactions.errors.invalidAmount'))
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      toast.success(t('transactions.submitSuccess'))
      // Reset form
      setFormData({
        type: defaultType,
        category: defaultType === 'income' ? 'appointment_payment' : 'salary',
        amount: 0,
        currency: 'MXN',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
      })
    } catch {
      toast.error(t('transactions.errors.submitFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTypeChange = (type: TransactionType) => {
    setFormData(prev => ({
      ...prev,
      type,
      category: type === 'income' ? 'appointment_payment' : 'salary',
    }))
  }

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <h3 className="text-lg font-semibold">{t('transactions.newTransaction')}</h3>
          <p className="text-sm text-muted-foreground mt-1">{t('transactions.formDescription')}</p>
        </div>

        {/* Type Selection (Income/Expense) */}
        <TransactionTypeSelector value={formData.type} onChange={handleTypeChange} />

        {/* Grid: Category + Amount */}
        <div className="grid md:grid-cols-2 gap-4">
          <TransactionCategoryField
            value={formData.category}
            transactionType={formData.type}
            onChange={category => setFormData(prev => ({ ...prev, category }))}
          />
          <TransactionAmountField
            amount={formData.amount}
            currency={formData.currency}
            onAmountChange={amount => setFormData(prev => ({ ...prev, amount }))}
            onCurrencyChange={currency => setFormData(prev => ({ ...prev, currency }))}
          />
        </div>

        {/* Grid: Date + Payment Method */}
        <div className="grid md:grid-cols-2 gap-4">
          <TransactionDateField
            value={formData.transaction_date}
            onChange={transaction_date => setFormData(prev => ({ ...prev, transaction_date }))}
          />
          <TransactionPaymentMethodField
            value={formData.payment_method}
            onChange={payment_method => setFormData(prev => ({ ...prev, payment_method }))}
          />
        </div>

        {/* Description */}
        <TransactionDescriptionField
          value={formData.description}
          onChange={description => setFormData(prev => ({ ...prev, description }))}
          maxLength={500}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={formData.amount <= 0 || isSubmitting} className="flex-1">
            {isSubmitting ? t('common.submitting') : t('transactions.submitTransaction')}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              {t('common.cancel')}
            </Button>
          )}
        </div>
      </form>
    </Card>
  )
}
