import React from 'react'
import { DollarSign } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/contexts/LanguageContext'
import type { TransactionType } from '@/types/types'

interface TransactionTypeSelectorProps {
  value: TransactionType
  onChange: (type: TransactionType) => void
}

export function TransactionTypeSelector({ value, onChange }: TransactionTypeSelectorProps) {
  const { t } = useLanguage()

  return (
    <div className="space-y-2">
      <Label>{t('transactions.type')}</Label>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange('income')}
          className={`p-4 border-2 rounded-lg text-left transition-all ${
            value === 'income'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="font-medium">{t('transactions.income')}</span>
          </div>
          <p className="text-xs text-muted-foreground">{t('transactions.incomeDescription')}</p>
        </button>

        <button
          type="button"
          onClick={() => onChange('expense')}
          className={`p-4 border-2 rounded-lg text-left transition-all ${
            value === 'expense'
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
  )
}