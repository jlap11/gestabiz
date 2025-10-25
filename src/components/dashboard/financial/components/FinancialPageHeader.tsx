import React from 'react'
import { DollarSign, Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'

interface FinancialPageHeaderProps {
  onPrintReport: () => void
  onExportData: () => void
}

export function FinancialPageHeader({ onPrintReport, onExportData }: FinancialPageHeaderProps) {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-primary" />
          {t('financial.management')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('financial.managementDescription')}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onPrintReport}>
          <FileText className="h-4 w-4 mr-2" />
          {t('financial.printReport')}
        </Button>
        <Button onClick={onExportData}>
          <Download className="h-4 w-4 mr-2" />
          {t('financial.exportData')}
        </Button>
      </div>
    </div>
  )
}