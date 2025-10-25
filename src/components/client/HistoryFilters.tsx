import React from 'react'
import {
  ChevronDown,
  Filter,
  Search,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { useLanguage } from '@/contexts/LanguageContext'

interface Business {
  id: string
  name: string
}

interface Location {
  id: string
  name: string
  business_id: string
}

interface Service {
  id: string
  name: string
  business_id: string
}

interface Category {
  id: string
  name: string
  slug: string
}

interface Employee {
  id: string
  full_name: string
}

interface HistoryFiltersProps {
  readonly searchTerm: string
  readonly onSearchTermChange: (value: string) => void
  readonly statusFilters: string[]
  readonly onStatusFiltersChange: (filters: string[]) => void
  readonly businessFilters: string[]
  readonly onBusinessFiltersChange: (filters: string[]) => void
  readonly locationFilters: string[]
  readonly onLocationFiltersChange: (filters: string[]) => void
  readonly serviceFilters: string[]
  readonly onServiceFiltersChange: (filters: string[]) => void
  readonly categoryFilters: string[]
  readonly onCategoryFiltersChange: (filters: string[]) => void
  readonly employeeFilters: string[]
  readonly onEmployeeFiltersChange: (filters: string[]) => void
  readonly priceRangeFilter: string
  readonly onPriceRangeFilterChange: (value: string) => void
  readonly businesses: Business[]
  readonly locations: Location[]
  readonly services: Service[]
  readonly categories: Category[]
  readonly employees: Employee[]
  readonly businessSearch: string
  readonly onBusinessSearchChange: (value: string) => void
  readonly businessPopoverOpen: boolean
  readonly onBusinessPopoverOpenChange: (open: boolean) => void
  readonly locationSearch: string
  readonly onLocationSearchChange: (value: string) => void
  readonly locationPopoverOpen: boolean
  readonly onLocationPopoverOpenChange: (open: boolean) => void
  readonly serviceSearch: string
  readonly onServiceSearchChange: (value: string) => void
  readonly servicePopoverOpen: boolean
  readonly onServicePopoverOpenChange: (open: boolean) => void
  readonly categorySearch: string
  readonly onCategorySearchChange: (value: string) => void
  readonly categoryPopoverOpen: boolean
  readonly onCategoryPopoverOpenChange: (open: boolean) => void
  readonly employeeSearch: string
  readonly onEmployeeSearchChange: (value: string) => void
  readonly employeePopoverOpen: boolean
  readonly onEmployeePopoverOpenChange: (open: boolean) => void
  readonly filteredBusinesses: Business[]
  readonly filteredLocations: Location[]
  readonly filteredServices: Service[]
  readonly filteredCategories: Category[]
  readonly filteredEmployees: Employee[]
  readonly hasActiveFilters: boolean
  readonly onClearFilters: () => void
}

export const HistoryFilters = React.memo(function HistoryFilters({
  searchTerm,
  onSearchTermChange,
  statusFilters,
  onStatusFiltersChange,
  businessFilters,
  onBusinessFiltersChange,
  locationFilters,
  onLocationFiltersChange,
  serviceFilters,
  onServiceFiltersChange,
  categoryFilters,
  onCategoryFiltersChange,
  employeeFilters,
  onEmployeeFiltersChange,
  priceRangeFilter,
  onPriceRangeFilterChange,
  businessSearch,
  onBusinessSearchChange,
  businessPopoverOpen,
  onBusinessPopoverOpenChange,
  locationSearch,
  onLocationSearchChange,
  locationPopoverOpen,
  onLocationPopoverOpenChange,
  serviceSearch,
  onServiceSearchChange,
  servicePopoverOpen,
  onServicePopoverOpenChange,
  categorySearch,
  onCategorySearchChange,
  categoryPopoverOpen,
  onCategoryPopoverOpenChange,
  employeeSearch,
  onEmployeeSearchChange,
  employeePopoverOpen,
  onEmployeePopoverOpenChange,
  filteredBusinesses,
  filteredLocations,
  filteredServices,
  filteredCategories,
  filteredEmployees,
  hasActiveFilters,
  onClearFilters,
}: HistoryFiltersProps) {
  const { t } = useLanguage()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" aria-hidden="true" />
            {t('clientHistory.filters.title')}
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="hover:bg-destructive/10 hover:text-destructive min-h-[44px] min-w-[44px]"
              aria-label={t('common.actions.reset')}
              title={t('common.actions.reset')}
            >
              <X className="h-4 w-4 mr-2" aria-hidden="true" />
              {t('common.actions.reset')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder={t('clientHistory.placeholders.search')}
            value={searchTerm}
            onChange={e => onSearchTermChange(e.target.value)}
            className="pl-10"
            aria-label={t('clientHistory.placeholders.search')}
            title={t('clientHistory.placeholders.search')}
          />
        </div>

        {/* Filter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Status */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {statusFilters.length === 0 ? t('clientHistory.filters.status') : `${statusFilters.length} ${t('clientHistory.filters.status')}`}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0">
              <div className="p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="status-all"
                    checked={statusFilters.length === 0}
                    onCheckedChange={() => onStatusFiltersChange([])}
                  />
                    <label htmlFor="status-all" className="text-sm cursor-pointer">
                      {t('common.placeholders.allStatuses')}
                    </label>
                </div>
                <div className="border-t pt-3 space-y-2">
                  {['attended', 'cancelled', 'no_show'].map(status => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={statusFilters.includes(status)}
                        onCheckedChange={checked => {
                          if (checked) {
                            onStatusFiltersChange([...statusFilters, status])
                          } else {
                            onStatusFiltersChange(statusFilters.filter(s => s !== status))
                          }
                        }}
                      />
                      <label htmlFor={`status-${status}`} className="text-sm cursor-pointer">
                        {status === 'attended' && t('clientHistory.status.completed')}
                        {status === 'cancelled' && t('clientHistory.status.cancelled')}
                        {status === 'no_show' && t('clientHistory.status.no_show')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Business */}
          <Popover open={businessPopoverOpen} onOpenChange={onBusinessPopoverOpenChange}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
          {businessFilters.length === 0
            ? t('clientHistory.filters.business')
            : `${businessFilters.length} ${t('clientHistory.filters.business')}`}
                <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2">
              <div className="p-2 pb-0">
                <Input
                  placeholder={t('clientHistory.placeholders.businessSearch')}
                  value={businessSearch}
                  onChange={e => onBusinessSearchChange(e.target.value)}
                  className="mb-2"
                  autoFocus
                  aria-label={t('clientHistory.placeholders.businessSearch')}
                  title={t('clientHistory.placeholders.businessSearch')}
                />
              </div>
              <div className="max-h-60 overflow-y-auto p-2">
                <div className="flex items-center space-x-2 mb-3">
                  <Checkbox
                    id="business-all"
                    checked={businessFilters.length === 0}
                    onCheckedChange={() => {
                      onBusinessFiltersChange([])
                      onBusinessSearchChange('')
                    }}
                  />
                  <label htmlFor="business-all" className="text-sm cursor-pointer">
                    {t('clientHistory.filters.allBusinesses')}
                  </label>
                </div>
                <div className="border-t pt-2 space-y-2">
                  {filteredBusinesses.map(business => (
                    <div key={business.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`business-${business.id}`}
                        checked={businessFilters.includes(business.id)}
                        onCheckedChange={checked => {
                          if (checked) {
                            onBusinessFiltersChange([...businessFilters, business.id])
                          } else {
                            onBusinessFiltersChange(businessFilters.filter(id => id !== business.id))
                          }
                        }}
                      />
                      <label
                        htmlFor={`business-${business.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {business.name}
                      </label>
                    </div>
                  ))}
                  {filteredBusinesses.length === 0 && businessSearch && (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      {t('clientHistory.messages.noBusinesses')}
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Location */}
          <Popover open={locationPopoverOpen} onOpenChange={onLocationPopoverOpenChange}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                {locationFilters.length === 0 ? t('clientHistory.filters.location') : `${locationFilters.length} ${t('clientHistory.filters.location')}`}
                <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2">
              <div className="p-2 pb-0">
                <Input
                  placeholder={t('clientHistory.placeholders.locationSearch')}
                  value={locationSearch}
                  onChange={e => onLocationSearchChange(e.target.value)}
                  className="mb-2"
                  autoFocus
                  aria-label={t('clientHistory.placeholders.locationSearch')}
                  title={t('clientHistory.placeholders.locationSearch')}
                />
              </div>
              <div className="max-h-60 overflow-y-auto p-2">
                <div className="flex items-center space-x-2 mb-3">
                  <Checkbox
                    id="location-all"
                    checked={locationFilters.length === 0}
                    onCheckedChange={() => {
                      onLocationFiltersChange([])
                      onLocationSearchChange('')
                    }}
                  />
                  <label htmlFor="location-all" className="text-sm cursor-pointer">
                    {t('clientHistory.filters.allLocations')}
                  </label>
                </div>
                <div className="border-t pt-2 space-y-2">
                  {filteredLocations.map(location => (
                    <div key={location.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`location-${location.id}`}
                        checked={locationFilters.includes(location.id)}
                        onCheckedChange={checked => {
                          if (checked) {
                            onLocationFiltersChange([...locationFilters, location.id])
                          } else {
                            onLocationFiltersChange(locationFilters.filter(id => id !== location.id))
                          }
                        }}
                      />
                      <label
                        htmlFor={`location-${location.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {location.name}
                      </label>
                    </div>
                  ))}
                  {filteredLocations.length === 0 && locationSearch && (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      {t('clientHistory.messages.noLocations')}
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Service */}
          <Popover open={servicePopoverOpen} onOpenChange={onServicePopoverOpenChange}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between min-h-[44px]"
                aria-label={t('clientHistory.filters.service')}
                title={t('clientHistory.filters.service')}
              >
                {serviceFilters.length === 0
                  ? t('clientHistory.filters.service')
                  : `${serviceFilters.length} ${t('clientHistory.filters.service')}`}
                <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              <div className="p-2 pb-0">
                <Input
                  placeholder={t('clientHistory.placeholders.serviceSearch')}
                  value={serviceSearch}
                  onChange={e => onServiceSearchChange(e.target.value)}
                  className="mb-2 text-base"
                  autoFocus
                  aria-label={t('clientHistory.placeholders.serviceSearch')}
                  title={t('clientHistory.placeholders.serviceSearch')}
                />
              </div>
              <div className="max-h-60 overflow-y-auto p-2">
                <div className="flex items-center space-x-2 mb-3">
                  <Checkbox
                    id="service-all"
                    checked={serviceFilters.length === 0}
                    onCheckedChange={checked => {
                      if (checked) {
                        onServiceFiltersChange([])
                      }
                    }}
                  />
                  <label htmlFor="service-all" className="text-sm cursor-pointer font-medium">
                    {t('common.all')}
                  </label>
                </div>
                <div className="border-t pt-2 space-y-2">
                  {filteredServices.map(service => (
                    <div key={service.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service.id}`}
                        checked={serviceFilters.includes(service.id)}
                        onCheckedChange={checked => {
                          if (checked) {
                            onServiceFiltersChange([...serviceFilters, service.id])
                          } else {
                            onServiceFiltersChange(serviceFilters.filter(id => id !== service.id))
                          }
                        }}
                      />
                      <label
                        htmlFor={`service-${service.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {service.name}
                      </label>
                    </div>
                  ))}
                  {filteredServices.length === 0 && serviceSearch && (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      {t('clientHistory.messages.noServices')}
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Category */}
          <Popover open={categoryPopoverOpen} onOpenChange={onCategoryPopoverOpenChange}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between min-h-[44px]"
                aria-label={t('clientHistory.filters.category')}
                title={t('clientHistory.filters.category')}
              >
                {categoryFilters.length === 0
                  ? t('clientHistory.filters.category')
                  : `${categoryFilters.length} ${t('clientHistory.filters.category')}`}
                <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              <div className="p-2 pb-0">
                <Input
                  placeholder={t('clientHistory.placeholders.categorySearch')}
                  value={categorySearch}
                  onChange={e => onCategorySearchChange(e.target.value)}
                  className="mb-2 text-base"
                  autoFocus
                  aria-label={t('clientHistory.placeholders.categorySearch')}
                  title={t('clientHistory.placeholders.categorySearch')}
                />
              </div>
              <div className="max-h-60 overflow-y-auto p-2">
                <div className="flex items-center space-x-2 mb-3">
                  <Checkbox
                    id="category-all"
                    checked={categoryFilters.length === 0}
                    onCheckedChange={checked => {
                      if (checked) {
                        onCategoryFiltersChange([])
                      }
                    }}
                  />
                  <label htmlFor="category-all" className="text-sm cursor-pointer font-medium">
                    {t('common.all')}
                  </label>
                </div>
                <div className="border-t pt-2 space-y-2">
                  {filteredCategories.map(category => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={categoryFilters.includes(category.id)}
                        onCheckedChange={checked => {
                          if (checked) {
                            onCategoryFiltersChange([...categoryFilters, category.id])
                          } else {
                            onCategoryFiltersChange(categoryFilters.filter(id => id !== category.id))
                          }
                        }}
                      />
                      <label
                        htmlFor={`category-${category.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {category.name}
                      </label>
                    </div>
                  ))}
                  {filteredCategories.length === 0 && categorySearch && (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      {t('clientHistory.messages.noCategories')}
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Employee */}
          <Popover open={employeePopoverOpen} onOpenChange={onEmployeePopoverOpenChange}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between min-h-[44px]"
                aria-label={t('clientHistory.filters.employee')}
                title={t('clientHistory.filters.employee')}
              >
                {employeeFilters.length === 0
                  ? t('clientHistory.filters.employee')
                  : `${employeeFilters.length} ${t('clientHistory.filters.employee')}`}
                <ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              <div className="p-2 pb-0">
                <Input
                  placeholder={t('clientHistory.placeholders.employeeSearch')}
                  value={employeeSearch}
                  onChange={e => onEmployeeSearchChange(e.target.value)}
                  className="mb-2 text-base"
                  autoFocus
                  aria-label={t('clientHistory.placeholders.employeeSearch')}
                  title={t('clientHistory.placeholders.employeeSearch')}
                />
              </div>
              <div className="max-h-60 overflow-y-auto p-2">
                <div className="flex items-center space-x-2 mb-3">
                  <Checkbox
                    id="employee-all"
                    checked={employeeFilters.length === 0}
                    onCheckedChange={checked => {
                      if (checked) {
                        onEmployeeFiltersChange([])
                      }
                    }}
                  />
                  <label htmlFor="employee-all" className="text-sm cursor-pointer font-medium">
                    {t('common.all')}
                  </label>
                </div>
                <div className="border-t pt-2 space-y-2">
                  {filteredEmployees.map(employee => (
                    <div key={employee.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`employee-${employee.id}`}
                        checked={employeeFilters.includes(employee.id)}
                        onCheckedChange={checked => {
                          if (checked) {
                            onEmployeeFiltersChange([...employeeFilters, employee.id])
                          } else {
                            onEmployeeFiltersChange(employeeFilters.filter(id => id !== employee.id))
                          }
                        }}
                      />
                      <label
                        htmlFor={`employee-${employee.id}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {employee.full_name}
                      </label>
                    </div>
                  ))}
                  {filteredEmployees.length === 0 && employeeSearch && (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      {t('clientHistory.messages.noEmployees')}
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Price Range */}
          <Select value={priceRangeFilter} onValueChange={onPriceRangeFilterChange}>
            <SelectTrigger 
              className="min-h-[44px]" 
              aria-label={t('common.placeholders.priceRange')} 
              title={t('common.placeholders.priceRange')}
            >
              <SelectValue placeholder={t('common.placeholders.priceRange')} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">{t('clientHistory.priceRanges.all')}</SelectItem>
                <SelectItem value="0-500">{t('clientHistory.priceRanges.0-500')}</SelectItem>
                <SelectItem value="501-1000">{t('clientHistory.priceRanges.501-1000')}</SelectItem>
                <SelectItem value="1001-2000">{t('clientHistory.priceRanges.1001-2000')}</SelectItem>
                <SelectItem value="2001+">{t('clientHistory.priceRanges.2001plus')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
})