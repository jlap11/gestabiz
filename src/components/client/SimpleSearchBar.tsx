import React, { useState, useEffect, useRef } from 'react'
import { Search, Building2, Briefcase, Tag, User, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

export type SearchType = 'services' | 'businesses' | 'categories' | 'users'

interface SimpleSearchBarProps {
  onSearch: (searchTerm: string, searchType: SearchType) => void
  className?: string
  placeholder?: string
}

const searchTypeIconConfig = {
  services: Briefcase,
  businesses: Building2,
  categories: Tag,
  users: User
}

export function SimpleSearchBar({ onSearch, className, placeholder }: SimpleSearchBarProps) {
  const { t } = useLanguage()
  const [searchType, setSearchType] = useState<SearchType>('businesses')
  const [searchTerm, setSearchTerm] = useState('')
  const debounceTimerRef = useRef<NodeJS.Timeout>()

  const Icon = searchTypeIconConfig[searchType]
  const typeLabel = t(`search.types.${searchType}`)
  const defaultPlaceholder = t(`search.placeholders.${searchType}`)

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      onSearch(searchTerm, searchType)
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchTerm, searchType, onSearch])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
  }

  const handleSearchTypeChange = (type: SearchType) => {
    setSearchType(type)
    onSearch(searchTerm, type)
  }

  return (
    <div className={cn('relative w-full max-w-full sm:max-w-3xl', className)}>
      {/* Unified Search Bar - Mobile Responsive */}
      <div className="relative flex items-center bg-background border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow">
        {/* Search Type Selector - Mobile Optimized */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 hover:bg-accent rounded-l-lg transition-colors border-r border-border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px] min-w-[44px]">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
              <span className="hidden sm:inline text-sm font-medium text-foreground whitespace-nowrap">
                {typeLabel}
              </span>
              <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44 sm:w-48">
            {(Object.keys(searchTypeIconConfig) as SearchType[]).map((type) => {
              const TypeIcon = searchTypeIconConfig[type]
              const isActive = type === searchType
              return (
                <DropdownMenuItem
                  key={type}
                  onClick={() => handleSearchTypeChange(type)}
                  className={cn(
                    "gap-2 cursor-pointer",
                    isActive && "bg-accent text-accent-foreground"
                  )}
                >
                  <TypeIcon className="h-4 w-4" />
                  {t(`search.types.${type}`)}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search Input - Mobile Responsive */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder={placeholder || defaultPlaceholder}
            value={searchTerm}
            onChange={handleInputChange}
            className="w-full py-2 sm:py-3 pl-8 sm:pl-12 pr-4 sm:pr-6 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm sm:text-base min-h-[44px]"
          />
        </div>
      </div>
    </div>
  )
}