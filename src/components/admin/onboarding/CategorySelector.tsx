import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/contexts/LanguageContext'
import { useBusinessCategories } from '@/hooks/useBusinessCategories'

interface CategorySelectorProps {
  value: string
  onChange: (value: string) => void
  onSubcategoriesReset: () => void
}

export function CategorySelector({ value, onChange, onSubcategoriesReset }: CategorySelectorProps) {
  const { t } = useLanguage()
  const [categoryFilter, setCategoryFilter] = useState('')
  const { mainCategories, loading: categoriesLoading } = useBusinessCategories()

  const filteredMainCategories = mainCategories.filter(category =>
    category.name.toLowerCase().includes(categoryFilter.toLowerCase())
  )

  const handleCategoryChange = (newValue: string) => {
    onChange(newValue)
    onSubcategoriesReset()
  }

  return (
    <div className="space-y-2">
      <label htmlFor="category" className="text-sm font-medium text-foreground">
        Categoría Principal <span className="text-red-500">*</span>
      </label>
      {categoriesLoading ? (
        <div className="flex items-center justify-center py-3 bg-background rounded-md border border-border">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">
            Cargando categorías...
          </span>
        </div>
      ) : (
        <Select value={value} onValueChange={handleCategoryChange}>
          <SelectTrigger className="bg-background border-border">
            <SelectValue placeholder="Selecciona una categoría principal" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {/* Search/Filter Input inside dropdown */}
            <div className="px-2 pt-2 pb-1 sticky top-0 bg-background border-b border-border z-10">
              <Input
                type="text"
                placeholder={t('admin.actions.searchCategory')}
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="bg-card border-border h-8 text-sm"
                onClick={e => e.stopPropagation()}
                onKeyDown={e => e.stopPropagation()}
              />
            </div>

            {filteredMainCategories.length > 0 ? (
              filteredMainCategories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))
            ) : (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                No se encontraron categorías
              </div>
            )}
          </SelectContent>
        </Select>
      )}
      {mainCategories.length === 0 && !categoriesLoading && (
        <p className="text-sm text-red-400">No hay categorías disponibles</p>
      )}
    </div>
  )
}