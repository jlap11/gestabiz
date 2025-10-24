/**
 * Componente Select para Tipos de Documento
 * Filtrado condicional: NIT solo para empresas
 */
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDocumentTypes } from '@/hooks/useCatalogs'

interface DocumentTypeSelectProps {
  countryId?: string
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  placeholder?: string
  error?: string
  required?: boolean
  className?: string
  /**
   * Si forCompany=true, solo muestra NIT
   * Si forCompany=false, muestra todos EXCEPTO NIT
   * Si undefined, muestra todos
   */
  forCompany?: boolean
}

export function DocumentTypeSelect({
  countryId,
  value,
  onChange,
  disabled = false,
  placeholder = 'Seleccione tipo de documento',
  error,
  required = false,
  className = '',
  forCompany,
}: DocumentTypeSelectProps) {
  const { documentTypes, loading } = useDocumentTypes(countryId, forCompany)
  // Ensure stable alphabetical order by name (locale 'es')
  const sortedDocumentTypes = documentTypes
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))

  if (!countryId) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Primero seleccione un país" />
        </SelectTrigger>
      </Select>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 h-10 px-3 border border-border rounded-md bg-muted">
        <span className="text-sm text-muted-foreground">Cargando tipos...</span>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled || documentTypes.length === 0}
        required={required}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {sortedDocumentTypes.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No hay tipos de documento disponibles
            </div>
          ) : (
            sortedDocumentTypes.map(docType => (
              <SelectItem key={docType.id} value={docType.id}>
                {docType.name} ({docType.abbreviation})
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
