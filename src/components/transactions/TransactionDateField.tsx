import React from 'react'
import { Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/contexts/LanguageContext'

interface TransactionDateFieldProps {
  value: string
  onChange: (date: string) => void
}

export function TransactionDateField({ value, onChange }: TransactionDateFieldProps) {
  const { t } = useLanguage()

  return (
    <div className="space-y-2">
      <Label htmlFor="transaction_date">
        <Calendar className="h-4 w-4 inline mr-2" />
        {t('transactions.date')}
      </Label>
      <Input
        id="transaction_date"
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        required
      />
    </div>
  )
}