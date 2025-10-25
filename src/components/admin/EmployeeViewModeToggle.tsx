import React from 'react'
import { List, Network } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'

type ViewMode = 'list' | 'map'

interface EmployeeViewModeToggleProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export function EmployeeViewModeToggle({ viewMode, onViewModeChange }: EmployeeViewModeToggleProps) {
  const { t } = useLanguage()

  return (
    <div 
      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2" 
      role="toolbar" 
      aria-label={t('employees.management.viewModeToolbar')}
    >
      <Button
        variant={viewMode === 'list' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewModeChange('list')}
        className="gap-2 min-h-[44px] min-w-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label={t('employees.management.listView')}
        title={t('employees.management.listView')}
        aria-pressed={viewMode === 'list'}
      >
        <List className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">{t('employees.management.listView')}</span>
        <span className="sm:hidden">Lista</span>
      </Button>
      <Button
        variant={viewMode === 'map' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onViewModeChange('map')}
        className="gap-2 min-h-[44px] min-w-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label={t('employees.management.mapView')}
        title={t('employees.management.mapView')}
        aria-pressed={viewMode === 'map'}
      >
        <Network className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">{t('employees.management.mapView')}</span>
        <span className="sm:hidden">Mapa</span>
      </Button>
    </div>
  )
}