import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/contexts/LanguageContext'
import { Period } from '../hooks/useFinancialFilters'

interface FinancialFiltersProps {
  period: Period
  selectedLocation: string
  selectedEmployee: string
  selectedCategory: string
  employees: Array<{ id: string; name: string }>
  locations?: Array<{ id: string; name: string }>
  onPeriodChange: (period: Period) => void
  onLocationChange: (location: string) => void
  onEmployeeChange: (employee: string) => void
  onCategoryChange: (category: string) => void
}

export function FinancialFilters({
  period,
  selectedLocation,
  selectedEmployee,
  selectedCategory,
  employees,
  locations = [],
  onPeriodChange,
  onLocationChange,
  onEmployeeChange,
  onCategoryChange,
}: FinancialFiltersProps) {
  const { t } = useLanguage()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Period Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('financial.period')}</label>
        <Select value={period} onValueChange={onPeriodChange}>
          <SelectTrigger className="min-h-[44px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1m">{t('financial.lastMonth')}</SelectItem>
            <SelectItem value="3m">{t('financial.last3Months')}</SelectItem>
            <SelectItem value="6m">{t('financial.last6Months')}</SelectItem>
            <SelectItem value="1y">{t('financial.lastYear')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Location Filter */}
      {locations.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">{t('common.location')}</label>
          <Select value={selectedLocation} onValueChange={onLocationChange}>
            <SelectTrigger className="min-h-[44px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Employee Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('common.employee')}</label>
        <Select value={selectedEmployee} onValueChange={onEmployeeChange}>
          <SelectTrigger className="min-h-[44px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{t('common.category')}</label>
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="min-h-[44px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="income">{t('financial.income')}</SelectItem>
            <SelectItem value="expense">{t('financial.expenses')}</SelectItem>
            <SelectItem value="service">{t('common.services')}</SelectItem>
            <SelectItem value="product">{t('common.products')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}