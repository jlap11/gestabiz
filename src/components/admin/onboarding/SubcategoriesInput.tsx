import { Input } from '@/components/ui/input'

interface SubcategoriesInputProps {
  selectedSubcategories: string[]
  onChange: (subcategories: string[]) => void
  categoryId: string
}

export function SubcategoriesInput({ selectedSubcategories, onChange, categoryId }: SubcategoriesInputProps) {
  if (!categoryId) return null

  const handleSubcategoryChange = (index: number, value: string) => {
    const newSubcategories = [...selectedSubcategories]
    if (value.trim()) {
      newSubcategories[index] = value
    } else {
      newSubcategories[index] = ''
    }
    onChange(newSubcategories.filter(s => s !== ''))
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-foreground">
        Subcategorías (máximo 3)
      </div>
      <p className="text-xs text-muted-foreground">
        Escribe hasta 3 subcategorías que describan mejor tu negocio
      </p>

      {/* 3 Input fields for free-form subcategories */}
      <div className="space-y-2">
        {[0, 1, 2].map(index => (
          <div key={index} className="space-y-1">
            <label
              htmlFor={`subcategory-${index}`}
              className="text-xs font-medium text-foreground/80"
            >
              Subcategoría {index + 1}
            </label>
            <Input
              id={`subcategory-${index}`}
              value={selectedSubcategories[index] || ''}
              onChange={e => handleSubcategoryChange(index, e.target.value)}
              placeholder={`Ej: ${['Boliche', 'Billar', 'Arcade'][index]}`}
              className="bg-background border-border text-foreground"
              maxLength={50}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {selectedSubcategories.length}/3 subcategorías ingresadas
      </p>
    </div>
  )
}