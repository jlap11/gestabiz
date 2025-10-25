import React from 'react'
import { Tag } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLanguage } from '@/contexts/LanguageContext'
import type { TransactionCategory, TransactionType } from '@/types/types'

interface TransactionCategoryFieldProps {
  value: TransactionCategory
  transactionType: TransactionType
  onChange: (category: TransactionCategory) => void
}

const INCOME_CATEGORIES: TransactionCategory[] = [
  'appointment_payment',
  'product_sale',
  'membership',
  'package',
  'tip',
  'other_income',
]

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
]

export function TransactionCategoryField({ 
  value, 
  transactionType, 
  onChange 
}: TransactionCategoryFieldProps) {
  const { t } = useLanguage()
  
  const categories = transactionType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  return (
    <div className="space-y-2">
      <Label htmlFor="category">
        <Tag className="h-4 w-4 inline mr-2" />
        {t('transactions.category')}
      </Label>
      <Select
        value={value}
        onValueChange={value => onChange(value as TransactionCategory)}
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
  )
}