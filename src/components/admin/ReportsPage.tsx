// ============================================================================
// COMPONENT: ReportsPage
// Página de reportes financieros con dashboard y exportación
// ============================================================================

import React, { Suspense, lazy, useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { SuspenseFallback } from '@/components/ui/loading-spinner'
import { useSupabaseData } from '@/hooks/useSupabaseData'
import { usePreferredLocation } from '@/hooks/usePreferredLocation'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { User } from '@/types/types'

// Lazy load dashboard pesado
const EnhancedFinancialDashboard = lazy(() =>
  import('@/components/transactions/EnhancedFinancialDashboard').then(module => ({
    default: module.EnhancedFinancialDashboard,
  }))
)

interface ReportsPageProps {
  businessId: string
  locationId?: string
  user: User
}

export function ReportsPage({
  businessId,
  locationId: initialLocationId,
  user,
}: Readonly<ReportsPageProps>) {
  const { t } = useLanguage()
  const { locations, services, fetchLocations, fetchServices } = useSupabaseData({
    user,
    autoFetch: false,
  })
  const { preferredLocationId } = usePreferredLocation(businessId)

  // Estado local para sede seleccionada (inicia con preferida o prop)
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(
    initialLocationId || preferredLocationId || undefined
  )

  useEffect(() => {
    fetchLocations(businessId)
    fetchServices(businessId)
  }, [businessId, fetchLocations, fetchServices])

  // Actualizar si cambia la sede preferida y no hay selección manual
  useEffect(() => {
    if (!initialLocationId && preferredLocationId && !selectedLocationId) {
      setSelectedLocationId(preferredLocationId)
    }
  }, [preferredLocationId, initialLocationId, selectedLocationId])

  const handleLocationChange = (value: string) => {
    setSelectedLocationId(value === 'all' ? undefined : value)
  }
  
  return (
    <main 
      role="main" 
      aria-labelledby="reports-page-title"
      className="space-y-4 sm:space-y-6 max-w-[100vw] overflow-x-hidden"
    >
      {/* Screen reader only title */}
      <h1 id="reports-page-title" className="sr-only">
        {t('admin.reports.title')}
      </h1>

      {/* Header */}
      <header className="space-y-2">
        <h2 
          className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2"
          aria-describedby="reports-page-subtitle"
        >
          <FileText className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
          {t('admin.reports.title')}
        </h2>
        <p 
          id="reports-page-subtitle"
          className="text-sm text-muted-foreground"
        >
          {t('admin.reports.subtitle')}
        </p>
      </header>

      {/* Filtro de Sede */}
      <section 
        role="region" 
        aria-labelledby="location-filter-heading"
        className="space-y-3"
      >
        <h3 id="location-filter-heading" className="sr-only">
          Filtros de ubicación
        </h3>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-card border rounded-lg">
          <div className="flex-1 max-w-full sm:max-w-xs">
            <Label 
              htmlFor="location-filter" 
              className="text-sm font-medium"
            >
              {t('admin.reports.locationFilter')}
            </Label>
            <Select 
              value={selectedLocationId || 'all'} 
              onValueChange={handleLocationChange}
            >
              <SelectTrigger 
                id="location-filter" 
                className="mt-1 min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-describedby="location-filter-description"
              >
                <SelectValue 
                  placeholder={t('admin.reports.allLocations')}
                  aria-label="Ubicación seleccionada"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.reports.allLocations')}</SelectItem>
                {locations.map(location => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p 
              id="location-filter-description" 
              className="sr-only"
            >
              Selecciona una ubicación específica o todas las ubicaciones para generar reportes
            </p>
          </div>
          
          {selectedLocationId && (
            <div 
              className="text-sm text-muted-foreground"
              role="status"
              aria-live="polite"
              aria-label="Ubicación actualmente seleccionada"
            >
              {t('admin.reports.showing')}{' '}
              <span className="font-medium text-foreground">
                {locations.find(l => l.id === selectedLocationId)?.name}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Dashboard */}
      <section 
        role="region" 
        aria-labelledby="financial-dashboard-heading"
        className="space-y-4"
      >
        <h3 id="financial-dashboard-heading" className="sr-only">
          Dashboard financiero
        </h3>
        
        <div className="min-h-[200px]">
          <Suspense 
            fallback={
              <div 
                role="status" 
                aria-label="Cargando dashboard financiero"
                className="flex items-center justify-center min-h-[200px]"
              >
                <SuspenseFallback text={t('admin.reports.loading')} />
              </div>
            }
          >
            <EnhancedFinancialDashboard
              businessId={businessId}
              locationId={selectedLocationId}
              locations={locations}
              services={services}
            />
          </Suspense>
        </div>
      </section>
    </main>
  )
}