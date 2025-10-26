/**
 * Componente Select para Prefijos Telefónicos
 * Obtenidos de countries.phone_prefix con búsqueda
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
import { useLanguage } from '@/contexts/LanguageContext';

interface PhonePrefixSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
  defaultToColombia?: boolean;
}

export function PhonePrefixSelect({
  value,
  onChange,
  disabled = false,
  placeholder = 'Prefijo',
  error,
  required = false,
  className = '',
  defaultToColombia = true,
}: PhonePrefixSelectProps) {
  const { t } = useLanguage()
  const { countries, loading } = useCountries();
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-seleccionar +57 (Colombia) al cargar
  const colombiaPrefix = useMemo(() => {
    return countries.find(c => c.code === 'CO')?.phone_prefix;
  }, [countries]);

  // Si defaultToColombia está activo y no hay valor, usar +57
  if (defaultToColombia && !value && colombiaPrefix && onChange) {
    onChange(colombiaPrefix);
  }

  // Filtrar países con prefijo según búsqueda
  const countriesWithPrefix = useMemo(() => {
    return countries.filter(c => c.phone_prefix);
  }, [countries]);

  const filteredCountries = useMemo(() => {
    if (!searchTerm.trim()) return countriesWithPrefix;

    const search = searchTerm.toLowerCase();
    return countriesWithPrefix.filter(
      country =>
        country.name.toLowerCase().includes(search) ||
        country.phone_prefix?.includes(search) ||
        country.code.toLowerCase().includes(search)
    );
  }, [countriesWithPrefix, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 h-10 w-24 px-3 border border-border rounded-md bg-muted">
        <span className="text-xs text-muted-foreground">...</span>
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
              placeholder={t('common.placeholders.searchPrefix')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-8 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* Lista de prefijos */}
          <div className="p-1 max-h-[240px] overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No se encontraron prefijos
              </div>
            ) : (
              filteredCountries.map(country => (
                <SelectItem key={country.id} value={country.phone_prefix!}>
                  {country.phone_prefix} ({country.name})
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
