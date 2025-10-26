/**
 * Componente Select para Ciudades con búsqueda integrada
 * 1,120 ciudades requieren búsqueda en tiempo real
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
import { useCities } from '@/hooks/useCatalogs';
import { Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CitySelectProps {
  regionId?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export function CitySelect({
  regionId,
  value,
  onChange,
  disabled = false,
  placeholder = 'Seleccione una ciudad',
  error,
  required = false,
  className = '',
}: CitySelectProps) {
  const { t } = useLanguage()
  const { cities, loading } = useCities(regionId);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar ciudades según búsqueda en tiempo real
  const filteredCities = useMemo(() => {
    if (!searchTerm.trim()) return cities;

    const search = searchTerm.toLowerCase();
    return cities.filter(city => city.name.toLowerCase().includes(search));
  }, [cities, searchTerm]);

  if (!regionId) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder={t('common.placeholders.selectDepartmentFirst')} />
        </SelectTrigger>
      </Select>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 h-10 px-3 border border-border rounded-md bg-muted">
        <span className="text-sm text-muted-foreground">Cargando ciudades...</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled || cities.length === 0}
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
              placeholder={t('common.placeholders.searchCity')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-8 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* Lista de ciudades */}
          <div className="p-1 max-h-[240px] overflow-y-auto">
            {filteredCities.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {searchTerm ? 'No se encontraron ciudades' : 'No hay ciudades disponibles'}
              </div>
            ) : (
              filteredCities.map(city => (
                <SelectItem key={city.id} value={city.id}>
                  {city.name}
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
