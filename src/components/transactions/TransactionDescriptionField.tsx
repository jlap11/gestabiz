import React from 'react'
import { FileText } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useLanguage } from '@/contexts/LanguageContext'

interface TransactionDescriptionFieldProps {
  value?: string
  onChange: (description: string) => void
  maxLength?: number
}

export function TransactionDescriptionField({ 
  value = '', 
  onChange,
  maxLength = 500 
}: TransactionDescriptionFieldProps) {
  const { t } = useLanguage()

  return (
    <div className="space-y-2">
      <Label htmlFor="description">
        <FileText className="h-4 w-4 inline mr-2" />
        {t('transactions.description')}{' '}
        <span className="text-muted-foreground font-normal">({t('common.optional')})</span>
      </Label>
      <Textarea
        id="description"
        placeholder={t('transactions.descriptionPlaceholder')}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={3}
        maxLength={maxLength}
      />
      <div className="text-xs text-muted-foreground text-right">
        {value.length}/{maxLength}
      </div>
    </div>
  )
}