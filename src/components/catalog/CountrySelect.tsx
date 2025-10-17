/**
 * Componente Select para Países con búsqueda integrada
 * Por defecto deshabilitado y apuntando a Colombia
 */
import { useState, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useCountries } from '@/hooks/useCatalogs';
import { Search } from 'lucide-react';

interface CountrySelectProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
  defaultToColombia?: boolean;
}

export function CountrySelect({
  value,
  onChange,
  disabled = true, // Por defecto deshabilitado según requerimientos
  placeholder = 'Seleccione un país',
  error,
  required = false,
  className = '',
  defaultToColombia = true,
}: CountrySelectProps) {
  const { countries, loading } = useCountries();
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-seleccionar Colombia al cargar
  const colombiaCountry = useMemo(() => {
    return countries.find(c => c.code === 'CO');
  }, [countries]);

  // Si defaultToColombia está activo y no hay valor, usar Colombia
  if (defaultToColombia && !value && colombiaCountry && onChange) {
    onChange(colombiaCountry.id);
  }

  // Filtrar países según búsqueda
  const filteredCountries = useMemo(() => {
    if (!searchTerm.trim()) return countries;

    const search = searchTerm.toLowerCase();
    return countries.filter(
      country =>
        country.name.toLowerCase().includes(search) ||
        country.code.toLowerCase().includes(search)
    );
  }, [countries, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 h-10 px-3 border border-border rounded-md bg-muted">
        <span className="text-sm text-muted-foreground">Cargando países...</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {/* Input de búsqueda */}
          <div className="flex items-center border-b px-3 pb-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Buscar país..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-8 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* Lista de países */}
          <div className="p-1">
            {filteredCountries.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No se encontraron países
              </div>
            ) : (
              filteredCountries.map(country => (
                <SelectItem key={country.id} value={country.id}>
                  {country.name} ({country.code})
                </SelectItem>
              ))
            )}
          </div>
        </SelectContent>
      </Select>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
