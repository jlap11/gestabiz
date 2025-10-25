import { FileText, Download, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'

interface FinancialHeaderProps {
  onExportCSV: () => void
  onExportExcel: () => void
  onExportPDF: () => void
}

export function FinancialHeader({ 
  onExportCSV, 
  onExportExcel, 
  onExportPDF 
}: FinancialHeaderProps) {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">{t('financial.dashboard')}</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          {t('financial.dashboardDescription')}
        </p>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onExportCSV}
          className="min-h-[40px] text-xs sm:text-sm"
        >
          <Download className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">CSV</span>
          <span className="sm:hidden">CSV</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onExportExcel}
          className="min-h-[40px] text-xs sm:text-sm"
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Excel</span>
          <span className="sm:hidden">XLS</span>
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onExportPDF}
          className="min-h-[40px] text-xs sm:text-sm"
        >
          <FileText className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">PDF</span>
          <span className="sm:hidden">PDF</span>
        </Button>
      </div>
    </div>
  )
}