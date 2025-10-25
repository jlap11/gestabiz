import React from 'react'
import { MapPin } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/contexts/LanguageContext'

interface Location {
  id: string
  name: string
}

interface LocationSelectorProps {
  value: string
  locations: Location[]
  onChange: (value: string) => void
  show: boolean
}

export function LocationSelector({ value, locations, onChange, show }: LocationSelectorProps) {
  const { t } = useLanguage()

  if (!show) return null

  return (
    <div className="flex-1">
      <label className="text-sm font-medium mb-2 flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        {t('financial.selectLocation')}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={t('financial.allLocations')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('financial.allLocations')}</SelectItem>
          {locations.map(location => (
            <SelectItem key={location.id} value={location.id}>
              {location.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}