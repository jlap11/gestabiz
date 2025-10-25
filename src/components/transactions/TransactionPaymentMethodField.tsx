import React from 'react'
import { CreditCard } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLanguage } from '@/contexts/LanguageContext'

interface TransactionPaymentMethodFieldProps {
  value?: string
  onChange: (method: string) => void
}

const PAYMENT_METHODS = [
  'cash',
  'credit_card',
  'debit_card',
  'bank_transfer',
  'digital_wallet',
  'check',
]

export function TransactionPaymentMethodField({ 
  value, 
  onChange 
}: TransactionPaymentMethodFieldProps) {
  const { t } = useLanguage()

  return (
    <div className="space-y-2">
      <Label htmlFor="payment_method">
        <CreditCard className="h-4 w-4 inline mr-2" />
        {t('transactions.paymentMethod')}
      </Label>
      <Select value={value} onValueChange={onChange}>
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
  )
}