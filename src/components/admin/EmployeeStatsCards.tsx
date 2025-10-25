import React from 'react'
import { Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useLanguage } from '@/contexts/LanguageContext'
import type { EmployeeHierarchy } from '@/types'

interface EmployeeStatsCardsProps {
  employees: EmployeeHierarchy[]
}

interface EmployeeStats {
  total: number
  byLevel: {
    0: number // Owner
    1: number // Admin
    2: number // Manager
    3: number // Lead
    4: number // Staff
  }
  avgOccupancy: number
  avgRating: number
}

export function EmployeeStatsCards({ employees }: EmployeeStatsCardsProps) {
  const { t } = useLanguage()

  // Calcular estadísticas
  const stats: EmployeeStats = {
    total: employees.length,
    byLevel: {
      0: employees.filter(e => e.hierarchy_level === 0).length, // Owner
      1: employees.filter(e => e.hierarchy_level === 1).length, // Admin
      2: employees.filter(e => e.hierarchy_level === 2).length, // Manager
      3: employees.filter(e => e.hierarchy_level === 3).length, // Lead
      4: employees.filter(e => e.hierarchy_level === 4).length, // Staff
    },
    avgOccupancy:
      employees.length > 0
        ? employees.reduce((acc, e) => acc + (e.occupancy_rate || 0), 0) / employees.length
        : 0,
    avgRating:
      employees.length > 0
        ? employees.reduce((acc, e) => acc + (e.average_rating || 0), 0) / employees.length
        : 0,
  }

  return (
    <section 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" 
      role="region" 
      aria-labelledby="stats-section-title"
    >
      <h3 id="stats-section-title" className="sr-only">
        Estadísticas de empleados
      </h3>

      {/* Total de empleados */}
      <Card className="p-3 sm:p-4 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              {t('employees.management.totalEmployees')}
            </p>
            <p className="text-xl sm:text-2xl font-bold mt-1" aria-label={`${stats.total} empleados en total`}>
              {stats.total}
            </p>
          </div>
          <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary opacity-20" aria-hidden="true" />
        </div>
      </Card>

      {/* Por nivel jerárquico */}
      <Card className="p-3 sm:p-4 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
        <div>
          <p className="text-xs sm:text-sm text-muted-foreground mb-2 font-medium">
            {t('employees.management.byLevel')}
          </p>
          <div className="grid grid-cols-5 gap-0.5 sm:gap-1 text-xs" role="group" aria-label="Empleados por nivel jerárquico">
            <div className="text-center">
              <div className="font-bold text-base sm:text-lg" aria-label={`${stats.byLevel[0]} propietarios`}>
                {stats.byLevel[0]}
              </div>
              <div className="text-muted-foreground text-[10px] sm:text-xs">Own</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-base sm:text-lg" aria-label={`${stats.byLevel[1]} administradores`}>
                {stats.byLevel[1]}
              </div>
              <div className="text-muted-foreground text-[10px] sm:text-xs">Adm</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-base sm:text-lg" aria-label={`${stats.byLevel[2]} gerentes`}>
                {stats.byLevel[2]}
              </div>
              <div className="text-muted-foreground text-[10px] sm:text-xs">Mgr</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-base sm:text-lg" aria-label={`${stats.byLevel[3]} líderes`}>
                {stats.byLevel[3]}
              </div>
              <div className="text-muted-foreground text-[10px] sm:text-xs">Ldr</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-base sm:text-lg" aria-label={`${stats.byLevel[4]} personal`}>
                {stats.byLevel[4]}
              </div>
              <div className="text-muted-foreground text-[10px] sm:text-xs">Stf</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Ocupación promedio */}
      <Card className="p-3 sm:p-4 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
        <div>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            {t('employees.management.avgOccupancy')}
          </p>
          <p className="text-xl sm:text-2xl font-bold mt-1" aria-label={`${stats.avgOccupancy.toFixed(1)}% ocupación promedio`}>
            {stats.avgOccupancy.toFixed(1)}%
          </p>
        </div>
      </Card>

      {/* Calificación promedio */}
      <Card className="p-3 sm:p-4 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
        <div>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            {t('employees.management.avgRating')}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <p className="text-xl sm:text-2xl font-bold" aria-label={`${stats.avgRating.toFixed(1)} estrellas promedio`}>
              {stats.avgRating.toFixed(1)}
            </p>
            <span className="text-yellow-500 text-lg" aria-hidden="true">★</span>
          </div>
        </div>
      </Card>
    </section>
  )
}