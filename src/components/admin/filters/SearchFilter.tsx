import { Search, X } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SearchFilterProps {
  value: string | undefined
  onChange: (value: string) => void
}

export function SearchFilter({ value, onChange }: SearchFilterProps) {
  const { t } = useLanguage()

  return (
    <div className="space-y-2">
      <Label htmlFor="search">{t('common.actions.search')}</Label>
      <div className="relative" role="search" aria-label={t('common.actions.search')}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input
          id="search"
          placeholder="Nombre, email o cargo..."
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          className="pl-9"
          role="searchbox"
          aria-label={t('common.actions.search')}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 min-h-[44px] min-w-[44px]"
            aria-label="Quitar búsqueda"
            title="Quitar búsqueda"
          >
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}