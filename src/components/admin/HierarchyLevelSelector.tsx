/**
 * @file HierarchyLevelSelector.tsx
 * @description Componente dropdown para seleccionar nivel jerárquico de empleado
 * Permite a Admins/Owners asignar cargos jerárquicos (0-4) a empleados
 * 
 * NIVELES:
 * - 0: Owner (Propietario)
 * - 1: Admin (Administrador)
 * - 2: Manager (Gerente)
 * - 3: Lead (Líder)
 * - 4: Staff (Personal)
 */

import { useState } from 'react'
import { Check, ChevronDown, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'
import { HIERARCHY_LEVELS, getLevelData } from '@/lib/hierarchyLevelUtils'
import type { HierarchyLevel } from '@/lib/hierarchyLevelUtils'

// =====================================================
// TIPOS
// =====================================================

interface HierarchyLevelSelectorProps {
  currentLevel: number
  employeeId: string
  employeeName: string
  onLevelChange: (newLevel: number) => Promise<void>
  disabled?: boolean
  size?: 'default' | 'sm' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
}

interface HierarchyLevelBadgeProps {
  level: number
  size?: 'default' | 'sm' | 'lg'
}

// =====================================================
// COMPONENTE
// =====================================================

export function HierarchyLevelSelector({
  currentLevel,
  employeeId,
  employeeName,
  onLevelChange,
  disabled = false,
  size = 'default',
  variant = 'outline',
}: HierarchyLevelSelectorProps) {
  const { t } = useLanguage()
  const [isChanging, setIsChanging] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const currentLevelData = getLevelData(currentLevel)

  const handleLevelChange = async (newLevel: number) => {
    if (newLevel === currentLevel || isChanging) return

    setIsChanging(true)
    setIsOpen(false)

    try {
      await onLevelChange(newLevel)
    } finally {
      setIsChanging(false)
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || isChanging}
          className="gap-2 min-w-[140px] justify-between"
        >
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="font-medium">{currentLevelData.label}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {t('employees.hierarchy.changeLevel', { name: employeeName })}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {HIERARCHY_LEVELS.map(level => {
          const isActive = level.value === currentLevel
          
          return (
            <DropdownMenuItem
              key={level.value}
              onClick={() => handleLevelChange(level.value)}
              disabled={isActive || isChanging}
              className="flex items-start gap-3 py-3 cursor-pointer"
            >
              {/* CHECK INDICATOR */}
              <div className="w-4 h-4 mt-0.5 flex items-center justify-center">
                {isActive && <Check className="h-4 w-4" />}
              </div>

              {/* CONTENT */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge className={level.badgeColor}>
                    {level.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {t('employees.hierarchy.level')} {level.value}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {level.description}
                </p>
              </div>
            </DropdownMenuItem>
          )
        })}

        <DropdownMenuSeparator />
        
        <div className="px-2 py-2 text-xs text-muted-foreground">
          <p className="mb-1 font-medium">
            {t('employees.hierarchy.note')}:
          </p>
          <ul className="space-y-1 list-disc list-inside">
            <li>{t('employees.hierarchy.noteLevel')}</li>
            <li>{t('employees.hierarchy.noteReports')}</li>
          </ul>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// =====================================================
// BADGE VERSION (Read-only display)
// =====================================================

export function HierarchyLevelBadge({ level, size = 'default' }: Readonly<HierarchyLevelBadgeProps>) {
  const levelData = getLevelData(level)
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  return (
    <Badge className={`${levelData.badgeColor} ${sizeClasses[size]} font-medium`}>
      {levelData.label}
    </Badge>
  )
}

// =====================================================
// TYPES EXPORT
// =====================================================

export type { HierarchyLevelSelectorProps, HierarchyLevelBadgeProps }
