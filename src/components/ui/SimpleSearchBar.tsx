import React, { useState, useCallback } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { useDebounce } from '@/hooks';

export type SearchType = 'services' | 'businesses' | 'categories' | 'users' | 'all';

interface SimpleSearchBarProps {
  searchTerm: string;
  searchType: SearchType;
  onSearch: (term: string, type: SearchType) => void;
  className?: string;
}

const searchTypeOptions = [
  { value: 'all' as SearchType, label: 'Todos' },
  { value: 'services' as SearchType, label: 'Servicios' },
  { value: 'businesses' as SearchType, label: 'Negocios' },
  { value: 'categories' as SearchType, label: 'Categorías' },
  { value: 'users' as SearchType, label: 'Profesionales' },
];

export const SimpleSearchBar: React.FC<SimpleSearchBarProps> = ({
  searchTerm,
  searchType,
  onSearch,
  className = '',
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [localSearchType, setLocalSearchType] = useState(searchType);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Debounce the search to avoid too many API calls
  const debouncedSearch = useDebounce(onSearch, 300);

  const handleSearchTermChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTerm = e.target.value;
    setLocalSearchTerm(newTerm);
    debouncedSearch(newTerm, localSearchType);
  }, [localSearchType, debouncedSearch]);

  const handleSearchTypeChange = useCallback((newType: SearchType) => {
    setLocalSearchType(newType);
    setIsDropdownOpen(false);
    debouncedSearch(localSearchTerm, newType);
  }, [localSearchTerm, debouncedSearch]);

  const selectedOption = searchTypeOptions.find(option => option.value === localSearchType);

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center border border-input rounded-lg overflow-hidden bg-input text-foreground">
        {/* Search Type Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center px-3 py-2 bg-muted border-r border-border text-sm font-medium text-foreground hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset"
          >
            <span className="mr-1">{selectedOption?.label}</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 z-50 mt-1 w-40 bg-popover text-popover-foreground border border-border rounded-md shadow-lg">
              {searchTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSearchTypeChange(option.value)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-accent focus:outline-none focus:bg-accent ${
                    option.value === localSearchType 
                      ? 'bg-accent text-accent-foreground' 
                      : 'text-foreground'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            type="text"
            value={localSearchTerm}
            onChange={handleSearchTermChange}
            placeholder={`Buscar ${selectedOption?.label.toLowerCase()}...`}
            className="w-full pl-10 pr-3 py-2 border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset text-sm"
      />
        </div>
      </div>

      {/* Backdrop for dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default SimpleSearchBar;
