import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { useLanguage } from '@/contexts/LanguageContext'
import { IncomeVsExpenseChart } from '@/components/accounting/IncomeVsExpenseChart'
import { MonthlyTrendChart } from '@/components/accounting/MonthlyTrendChart'
import { CategoryPieChart } from '@/components/accounting/CategoryPieChart'
import { LocationBarChart } from '@/components/accounting/LocationBarChart'
import { EmployeeRevenueChart } from '@/components/accounting/EmployeeRevenueChart'

interface FinancialChartTabsProps {
  chartData: any
  reportData: any
  isLoading: boolean
}

export function FinancialChartTabs({ 
  chartData, 
  reportData, 
  isLoading 
}: FinancialChartTabsProps) {
  const { t } = useLanguage()

  return (
    <Card className="p-4 sm:p-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 gap-1 h-auto lg:h-10 mb-6">
          <TabsTrigger 
            value="overview" 
            className="min-h-[44px] text-xs sm:text-sm px-2 sm:px-4"
          >
            <span className="hidden sm:inline">{t('financial.overview')}</span>
            <span className="sm:hidden">Vista</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="categories" 
            className="min-h-[44px] text-xs sm:text-sm px-2 sm:px-4"
          >
            <span className="hidden sm:inline">{t('financial.categories')}</span>
            <span className="sm:hidden">Cat.</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="locations" 
            className="min-h-[44px] text-xs sm:text-sm px-2 sm:px-4"
          >
            <span className="hidden sm:inline">{t('financial.locations')}</span>
            <span className="sm:hidden">Loc.</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="employees" 
            className="min-h-[44px] text-xs sm:text-sm px-2 sm:px-4"
          >
            <span className="hidden sm:inline">{t('financial.employees')}</span>
            <span className="sm:hidden">Emp.</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="trends" 
            className="min-h-[44px] text-xs sm:text-sm px-2 sm:px-4 col-span-2 lg:col-span-1"
          >
            <span className="hidden sm:inline">{t('financial.trends')}</span>
            <span className="sm:hidden">Tend.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <IncomeVsExpenseChart data={chartData} isLoading={isLoading} />
            <MonthlyTrendChart data={chartData} isLoading={isLoading} />
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <CategoryPieChart data={reportData?.categoryBreakdown} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <LocationBarChart data={reportData?.locationBreakdown} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <EmployeeRevenueChart data={reportData?.employeeBreakdown} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MonthlyTrendChart data={chartData} isLoading={isLoading} />
            <CategoryPieChart data={reportData?.categoryBreakdown} isLoading={isLoading} />
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  )
}