import React, { useState, useCallback } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { useDebounce } from '@/hooks';

export type SearchType = 'services' | 'businesses' | 'categories' | 'users';

interface SimpleSearchBarProps {
  searchTerm: string;
  searchType: SearchType;
  onSearch: (term: string, type: SearchType) => void;
  className?: string;
}

const searchTypeOptions = [
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
      <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
        {/* Search Type Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-700 border-r border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
          >
            <span className="mr-1">{selectedOption?.label}</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {isDropdownOpen && (
            <div className="absolute top-full left-0 z-50 mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
              {searchTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSearchTypeChange(option.value)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 ${
                    option.value === localSearchType 
                      ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' 
                      : 'text-gray-700 dark:text-gray-200'
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
            <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            value={localSearchTerm}
            onChange={handleSearchTermChange}
            placeholder={`Buscar ${selectedOption?.label.toLowerCase()}...`}
            className="w-full pl-10 pr-3 py-2 border-0 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset text-sm"
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