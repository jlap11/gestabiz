import React from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { EmployeeViewModeToggle } from './EmployeeViewModeToggle'

type ViewMode = 'list' | 'map'

interface EmployeeHeaderProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export function EmployeeHeader({ viewMode, onViewModeChange }: EmployeeHeaderProps) {
  const { t } = useLanguage()

  return (
    <header className="flex flex-col gap-3 sm:gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" id="page-title">
            {t('employees.management.title')}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base" aria-describedby="page-title">
            {t('employees.management.subtitle')}
          </p>
        </div>

        <EmployeeViewModeToggle 
          viewMode={viewMode} 
          onViewModeChange={onViewModeChange} 
        />
      </div>
    </header>
  )
}