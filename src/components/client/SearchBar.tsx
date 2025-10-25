import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Briefcase, Building2, ChevronDown, Loader2, Search, Tag, User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'

export type SearchType = 'services' | 'businesses' | 'categories' | 'users'

interface SearchResult {
  id: string
  name: string
  type: SearchType
  subtitle?: string
  category?: string
  location?: string
}

interface SearchBarProps {
  onResultSelect: (result: SearchResult) => void
  onViewMore: (searchTerm: string, searchType: SearchType) => void
  className?: string
}

const searchTypeIconConfig = {
  services: Briefcase,
  businesses: Building2,
  categories: Tag,
  users: User,
}

export function SearchBar({ onResultSelect, onViewMore, className }: SearchBarProps) {
  const { t } = useLanguage()
  const [searchType, setSearchType] = useState<SearchType>('services')
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout>()
  const searchBarRef = useRef<HTMLDivElement>(null)

  const Icon = searchTypeIconConfig[searchType]
  const typeLabel = t(`search.types.${searchType}`)
  const placeholder = t(`search.placeholders.${searchType}`)

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const performSearch = useCallback(
    async (term: string, type: SearchType) => {
      if (!term || term.length < 2) {
        setResults([])
        setIsSearching(false)
        return
      }

      setIsSearching(true)

      try {
        let data: SearchResult[] = []

        switch (type) {
          case 'services': {
            const { data: servicesData, error } = await supabase
              .from('services')
              .select(
                `
              id,
              name,
              description,
              business:businesses!services_business_id_fkey (
                id,
                name
              )
            `
              )
              .ilike('name', `%${term}%`)
              .eq('is_active', true)
              .limit(5)

            if (error) throw error

            data = (servicesData || []).map((service: any) => ({
              id: service.id,
              name: service.name,
              type: 'services' as SearchType,
              subtitle: service.business?.name || t('search.results.independentService'),
              category: service.description,
            }))
            break
          }

          case 'businesses': {
            const { data: businessesData, error } = await supabase
              .from('businesses')
              .select(
                `
              id,
              name,
              description,
              category:business_categories!businesses_category_id_fkey (
                name
              ),
              locations (
                id,
                name,
                city
              )
            `
              )
              .ilike('name', `%${term}%`)
              .eq('is_active', true)
              .limit(5)

            if (error) throw error

            data = (businessesData || []).map((business: any) => ({
              id: business.id,
              name: business.name,
              type: 'businesses' as SearchType,
              subtitle: business.category?.name || t('search.results.noCategory'),
              location: business.locations?.[0]?.city || t('search.results.locationNotSpecified'),
            }))
            break
          }

          case 'categories': {
            const { data: categoriesData, error } = await supabase
              .from('business_categories')
              .select('id, name, description')
              .ilike('name', `%${term}%`)
              .eq('is_active', true)
              .limit(5)

            if (error) throw error

            data = (categoriesData || []).map((category: any) => ({
              id: category.id,
              name: category.name,
              type: 'categories' as SearchType,
              subtitle: category.description || t('search.results.serviceCategory'),
            }))
            break
          }

          case 'users': {
            // Search for users who are employees (have services)
            const { data: usersData, error } = await supabase
              .from('profiles')
              .select(
                `
              id,
              full_name,
              bio,
              business_employees!business_employees_employee_id_fkey (
                business:businesses!business_employees_business_id_fkey (
                  name
                )
              )
            `
              )
              .ilike('full_name', `%${term}%`)
              .not('business_employees', 'is', null)
              .limit(5)

            if (error) throw error

            data = (usersData || []).map((user: any) => ({
              id: user.id,
              name: user.full_name || t('search.results.userNoName'),
              type: 'users' as SearchType,
              subtitle:
                user.business_employees?.[0]?.business?.name ||
                t('search.results.independentProfessional'),
              category: user.bio || t('search.results.professionalServices'),
            }))
            break
          }
        }

        setResults(data)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error searching:', error)
        setResults([])
      } finally {
        setIsSearching(false)
      }
    },
    [t]
  )

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (searchTerm.length >= 2) {
      setIsSearching(true)
      debounceTimerRef.current = setTimeout(() => {
        performSearch(searchTerm, searchType)
      }, 300)
    } else {
      setResults([])
      setIsSearching(false)
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchTerm, searchType, performSearch])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    setShowResults(value.length >= 2)
  }

  const handleResultClick = (result: SearchResult) => {
    onResultSelect(result)
    setShowResults(false)
    setSearchTerm('')
  }

  const handleViewMore = () => {
    onViewMore(searchTerm, searchType)
    setShowResults(false)
    setSearchTerm('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.length >= 2) {
      handleViewMore()
    }
  }

  const handleSearchTypeChange = (type: SearchType) => {
    setSearchType(type)
    if (searchTerm.length >= 2) {
      performSearch(searchTerm, type)
    }
  }

  return (
    <div ref={searchBarRef} className={cn('relative w-full max-w-full sm:max-w-3xl', className)}>
      {/* Unified Search Bar - Mobile Responsive */}
      <div 
        className="relative flex items-center bg-background border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2" 
        aria-busy={isSearching} 
        role="search" 
        aria-label={t('search.results.searchBarLabel')}
      >
        {/* Search Type Selector - Mobile Responsive */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 hover:bg-accent rounded-l-lg transition-colors border-r border-border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px] min-w-[44px] touch-manipulation"
              aria-label={t('search.labels.searchTypeAria', { type: typeLabel })}
              title={typeLabel}
              aria-haspopup="menu"
              aria-expanded="false"
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline text-sm font-medium text-foreground whitespace-nowrap">
                {typeLabel}
              </span>
              <ChevronDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-w-[95vw] sm:w-48">
            {(Object.keys(searchTypeIconConfig) as SearchType[]).map(type => {
              const TypeIcon = searchTypeIconConfig[type]
              const isActive = type === searchType
              return (
                <DropdownMenuItem
                  key={type}
                  onClick={() => handleSearchTypeChange(type)}
                  className={cn(
                    'gap-2 cursor-pointer min-h-[44px] touch-manipulation',
                    isActive && 'bg-accent text-accent-foreground'
                  )}
                  role="menuitem"
                  aria-current={isActive ? 'true' : 'false'}
                >
                  <TypeIcon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm sm:text-base">{t(`search.types.${type}`)}</span>
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search Input - Mobile Responsive */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground pointer-events-none" aria-hidden="true" />
          <input
            type="text"
            placeholder={placeholder}
            aria-label={placeholder}
            title={placeholder}
            role="searchbox"
            aria-autocomplete="list"
            aria-expanded={showResults}
            aria-controls="search-results"
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
            className="w-full py-2 sm:py-3 pl-8 sm:pl-12 pr-10 sm:pr-12 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm sm:text-base min-h-[44px] touch-manipulation"
          />
          {isSearching && (
            <div className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2" role="status" aria-label={t('search.results.searching')}>
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground animate-spin" aria-hidden="true" />
              <span className="sr-only">{t('search.results.searching')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Results Dropdown - Mobile Full Width */}
      {showResults && (
        <div
          id="search-results"
          className="absolute top-full mt-2 sm:mt-3 left-0 right-0 w-full bg-card border border-border rounded-lg shadow-xl z-50 max-h-[70vh] sm:max-h-[32rem] overflow-y-auto"
          role="listbox"
          aria-label={t('search.results.resultsList')}
          aria-live="polite"
        >
          {results.length > 0 ? (
            <>
              {results.map((result, index) => {
                const ResultIcon = searchTypeIconConfig[result.type]
                return (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="w-full flex items-start gap-2 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 hover:bg-accent focus:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset transition-colors text-left border-b border-border last:border-b-0 group min-h-[68px] touch-manipulation"
                    role="option"
                    aria-label={t('search.results.selectResult', { name: result.name })}
                    aria-selected="false"
                    tabIndex={index === 0 ? 0 : -1}
                  >
                    <div className="flex-shrink-0 mt-0.5 p-1.5 sm:p-2 rounded-lg bg-muted group-hover:bg-background group-focus:bg-background transition-colors">
                      <ResultIcon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-primary group-focus:text-primary transition-colors" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate text-sm sm:text-base group-hover:text-primary group-focus:text-primary transition-colors">
                        {result.name}
                      </p>
                      {result.subtitle && (
                        <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
                          {result.subtitle}
                        </p>
                      )}
                      {result.location && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate mt-1 flex items-center gap-1">
                          <span role="img" aria-label={t('common.labels.location')}>📍</span>
                          <span>{result.location}</span>
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}

              {/* View More Button - Mobile Optimized */}
              <button
                onClick={handleViewMore}
                className="w-full px-3 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-primary hover:bg-accent focus:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset transition-colors text-center border-t-2 border-border hover:border-primary focus:border-primary min-h-[48px] touch-manipulation"
                aria-label={t('search.results.viewAll')}
                title={t('search.results.viewAll')}
              >
                {t('search.results.viewAll')}
              </button>
            </>
          ) : searchTerm.length >= 2 && !isSearching ? (
            <div className="px-3 sm:px-5 py-6 sm:py-8 text-center text-muted-foreground" role="status">
              <Search className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 sm:mb-3 opacity-40" aria-hidden="true" />
              <p className="text-xs sm:text-sm font-medium">{t('search.results.noResults')}</p>
              <p className="text-[10px] sm:text-xs mt-1">{t('search.results.tryDifferent')}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}