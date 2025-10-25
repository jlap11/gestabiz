import React from 'react'
import { Building2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/contexts/LanguageContext'

interface Business {
  id: string
  name: string
}

interface BusinessSelectorProps {
  value: string
  businesses: Business[]
  onChange: (value: string) => void
}

export function BusinessSelector({ value, businesses, onChange }: BusinessSelectorProps) {
  const { t } = useLanguage()

  return (
    <div className="flex-1">
      <label className="text-sm font-medium mb-2 flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        {t('financial.selectBusiness')}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={t('financial.allBusinesses')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('financial.allBusinesses')}</SelectItem>
          {businesses.map(business => (
            <SelectItem key={business.id} value={business.id}>
              {business.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}