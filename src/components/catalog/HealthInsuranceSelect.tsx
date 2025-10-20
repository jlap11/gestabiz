/**
 * Componente Select para EPS/Health Insurance con búsqueda
 * 28 registros requieren búsqueda
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
import { useHealthInsurance } from '@/hooks/useCatalogs';
import { Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface HealthInsuranceSelectProps {
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export function HealthInsuranceSelect({
  value,
  onChange,
  disabled = false,
  placeholder = 'Seleccione una EPS',
  error,
  required = false,
  className = '',
}: HealthInsuranceSelectProps) {
  const { t } = useLanguage()
  const { healthInsurance, loading } = useHealthInsurance();
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar EPS según búsqueda en tiempo real
  const filteredInsurance = useMemo(() => {
    if (!searchTerm.trim()) return healthInsurance;

    const search = searchTerm.toLowerCase();
    return healthInsurance.filter(
      insurance =>
        insurance.name.toLowerCase().includes(search) ||
        insurance.abbreviation.toLowerCase().includes(search)
    );
  }, [healthInsurance, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 h-10 px-3 border border-border rounded-md bg-muted">
        <span className="text-sm text-muted-foreground">Cargando EPS...</span>
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
              placeholder={t('common.placeholders.searchEPS')}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="h-8 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* Lista de EPS */}
          <div className="p-1">
            {filteredInsurance.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No se encontraron EPS
              </div>
            ) : (
              filteredInsurance.map(insurance => (
                <SelectItem key={insurance.id} value={insurance.id}>
                  {insurance.name} ({insurance.abbreviation})
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
