import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Building2, Briefcase, Tag, User, ChevronDown, Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

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

const searchTypeConfig = {
  services: { label: 'Servicios', icon: Briefcase, placeholder: 'Buscar servicios...' },
  businesses: { label: 'Negocios', icon: Building2, placeholder: 'Buscar negocios...' },
  categories: { label: 'Categorías', icon: Tag, placeholder: 'Buscar categorías...' },
  users: { label: 'Profesionales', icon: User, placeholder: 'Buscar profesionales...' }
}

export function SearchBar({ onResultSelect, onViewMore, className }: SearchBarProps) {
  const [searchType, setSearchType] = useState<SearchType>('services')
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout>()
  const searchBarRef = useRef<HTMLDivElement>(null)

  const config = searchTypeConfig[searchType]
  const Icon = config.icon

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

  const performSearch = useCallback(async (term: string, type: SearchType) => {
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
            .select(`
              id,
              name,
              description,
              business:businesses!services_business_id_fkey (
                id,
                name
              )
            `)
            .ilike('name', `%${term}%`)
            .eq('is_active', true)
            .limit(5)

          if (error) throw error

          data = (servicesData || []).map((service: any) => ({
            id: service.id,
            name: service.name,
            type: 'services' as SearchType,
            subtitle: service.business?.name || 'Servicio independiente',
            category: service.description
          }))
          break
        }

        case 'businesses': {
          const { data: businessesData, error } = await supabase
            .from('businesses')
            .select(`
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
            `)
            .ilike('name', `%${term}%`)
            .eq('is_active', true)
            .limit(5)

          if (error) throw error

          data = (businessesData || []).map((business: any) => ({
            id: business.id,
            name: business.name,
            type: 'businesses' as SearchType,
            subtitle: business.category?.name || 'Sin categoría',
            location: business.locations?.[0]?.city || 'Ubicación no especificada'
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
            subtitle: category.description || 'Categoría de servicios'
          }))
          break
        }

        case 'users': {
          // Search for users who are employees (have services)
          const { data: usersData, error } = await supabase
            .from('profiles')
            .select(`
              id,
              full_name,
              bio,
              business_employees!business_employees_employee_id_fkey (
                business:businesses!business_employees_business_id_fkey (
                  name
                )
              )
            `)
            .ilike('full_name', `%${term}%`)
            .not('business_employees', 'is', null)
            .limit(5)

          if (error) throw error

          data = (usersData || []).map((user: any) => ({
            id: user.id,
            name: user.full_name || 'Usuario sin nombre',
            type: 'users' as SearchType,
            subtitle: user.business_employees?.[0]?.business?.name || 'Profesional independiente',
            category: user.bio || 'Profesional de servicios'
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
  }, [])

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
    <div ref={searchBarRef} className={cn('relative w-full max-w-3xl', className)}>
      {/* Unified Search Bar */}
      <div className="relative flex items-center bg-background border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow">
        {/* Search Type Selector - Integrated */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-3 hover:bg-accent rounded-l-lg transition-colors border-r border-border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <span className="hidden sm:inline text-sm font-medium text-foreground whitespace-nowrap">
                {config.label}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {Object.entries(searchTypeConfig).map(([type, conf]) => {
              const TypeIcon = conf.icon
              const isActive = type === searchType
              return (
                <DropdownMenuItem
                  key={type}
                  onClick={() => handleSearchTypeChange(type as SearchType)}
                  className={cn(
                    "gap-2 cursor-pointer",
                    isActive && "bg-accent text-accent-foreground"
                  )}
                >
                  <TypeIcon className="h-4 w-4" />
                  {conf.label}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search Input - Integrated */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder={config.placeholder}
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => searchTerm.length >= 2 && setShowResults(true)}
            className="w-full py-3 pl-12 pr-12 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-base"
          />
          {isSearching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
          )}
        </div>
      </div>

      {/* Results Dropdown */}
      {showResults && (
        <div className="absolute top-full mt-3 w-full bg-card border border-border rounded-lg shadow-xl z-50 max-h-[32rem] overflow-y-auto">
          {results.length > 0 ? (
            <>
              {results.map((result) => {
                const ResultIcon = searchTypeConfig[result.type].icon
                return (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="w-full flex items-start gap-4 px-5 py-4 hover:bg-accent transition-colors text-left border-b border-border last:border-b-0 group"
                  >
                    <div className="flex-shrink-0 mt-0.5 p-2 rounded-lg bg-muted group-hover:bg-background transition-colors">
                      <ResultIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate text-base group-hover:text-primary transition-colors">
                        {result.name}
                      </p>
                      {result.subtitle && (
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                          {result.subtitle}
                        </p>
                      )}
                      {result.location && (
                        <p className="text-xs text-muted-foreground truncate mt-1 flex items-center gap-1">
                          <span>📍</span>
                          <span>{result.location}</span>
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
              
              {/* View More Button */}
              <button
                onClick={handleViewMore}
                className="w-full px-5 py-4 text-sm font-semibold text-primary hover:bg-accent transition-colors text-center border-t-2 border-border hover:border-primary"
              >
                Ver todos los resultados →
              </button>
            </>
          ) : searchTerm.length >= 2 && !isSearching ? (
            <div className="px-5 py-8 text-center text-muted-foreground">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">No se encontraron resultados</p>
              <p className="text-xs mt-1">Intenta con otros términos de búsqueda</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
