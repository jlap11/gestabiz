/**
 * Componente Select para Regiones/Departamentos
 * Filtrado automático por país
 */
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRegions } from '@/hooks/useCatalogs';

interface RegionSelectProps {
  countryId?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export function RegionSelect({
  countryId,
  value,
  onChange,
  disabled = false,
  placeholder = 'Seleccione un departamento',
  error,
  required = false,
  className = '',
}: RegionSelectProps) {
  const { regions, loading } = useRegions(countryId);

  if (!countryId) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Primero seleccione un país" />
        </SelectTrigger>
      </Select>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 h-10 px-3 border border-border rounded-md bg-muted">
        <span className="text-sm text-muted-foreground">Cargando regiones...</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled || regions.length === 0}
        required={required}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {regions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No hay regiones disponibles
            </div>
          ) : (
            <>
              {regions.map(region => (
                <SelectItem key={region.id} value={region.id}>
                  {region.name}
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}