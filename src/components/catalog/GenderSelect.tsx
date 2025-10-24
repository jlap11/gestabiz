/**
 * Componente Select para Género
 * 3 opciones, no requiere búsqueda
 */
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useGenders } from '@/hooks/useCatalogs'

interface GenderSelectProps {
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  placeholder?: string
  error?: string
  required?: boolean
  className?: string
}

export function GenderSelect({
  value,
  onChange,
  disabled = false,
  placeholder = 'Seleccione un género',
  error,
  required = false,
  className = '',
}: GenderSelectProps) {
  const { genders, loading } = useGenders()

  if (loading) {
    return (
      <div className="flex items-center gap-2 h-10 px-3 border border-border rounded-md bg-muted">
        <span className="text-sm text-muted-foreground">Cargando...</span>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <Select value={value} onValueChange={onChange} disabled={disabled} required={required}>
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {genders.map(gender => (
            <SelectItem key={gender.id} value={gender.id}>
              {gender.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
