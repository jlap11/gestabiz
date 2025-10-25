import React from 'react'
import { DollarSign } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLanguage } from '@/contexts/LanguageContext'

interface TransactionAmountFieldProps {
  amount: number
  currency: string
  onAmountChange: (amount: number) => void
  onCurrencyChange: (currency: string) => void
}

export function TransactionAmountField({
  amount,
  currency,
  onAmountChange,
  onCurrencyChange,
}: TransactionAmountFieldProps) {
  const { t } = useLanguage()

  return (
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
          value={amount}
          onChange={e => onAmountChange(parseFloat(e.target.value) || 0)}
          placeholder="0.00"
          required
          className="flex-1"
        />
        <Select value={currency} onValueChange={onCurrencyChange}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MXN">MXN</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}