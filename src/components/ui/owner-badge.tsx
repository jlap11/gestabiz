import React from 'react'
import { Crown } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { cn } from '@/lib/utils'

export interface OwnerBadgeProps {
  isOwner: boolean
  variant?: 'default' | 'compact' | 'icon-only'
  className?: string
}

export function OwnerBadge({ isOwner, variant = 'default', className }: OwnerBadgeProps) {
  const { t } = useLanguage()
  if (!isOwner) return null

  if (variant === 'icon-only') {
    return (
      <span title={t('ownerBadge.owner')}>
        <Crown
          className={cn(
            'h-4 w-4 text-yellow-500',
            'animate-pulse',
            className
          )}
        />
      </span>
    )
  }

  if (variant === 'compact') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
          'bg-gradient-to-r from-yellow-500/10 to-amber-500/10',
          'border border-yellow-500/20',
          'text-yellow-700 dark:text-yellow-400',
          className
        )}
      >
        <Crown className="h-3 w-3" />
        <span>{t('ownerBadge.owner')}</span>
      </span>
    )
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg',
        'bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10',
        'border border-yellow-500/30',
        'text-yellow-700 dark:text-yellow-400',
        'font-medium text-sm',
        'shadow-sm',
        className
      )}
    >
      <Crown className="h-4 w-4 animate-pulse" />
      <span>{t('ownerBadge.owner')}</span>
      <span className="ml-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-xs">
        {t('ownerBadge.admin')}
      </span>
    </div>
  )
}

// =====================================================
// VARIANTES ADICIONALES
// =====================================================

/**
 * Badge para mostrar en avatar de usuario
 */
export function OwnerAvatarBadge({ isOwner }: Readonly<{ isOwner: boolean }>) {
  if (!isOwner) return null

  return (
    <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1 shadow-lg">
      <Crown className="h-3 w-3 text-white" />
    </div>
  )
}

/**
 * Badge para mostrar en header/navbar
 */
export function OwnerHeaderBadge({ isOwner }: Readonly<{ isOwner: boolean }>) {
  const { t } = useLanguage()
  if (!isOwner) return null

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
      <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
        {t('ownerBadge.owner')}
      </span>
    </div>
  )
}

/**
 * Badge para mostrar en lista de usuarios
 */
export function OwnerListBadge({ isOwner }: Readonly<{ isOwner: boolean }>) {
  const { t } = useLanguage()
  if (!isOwner) return null

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800">
      <Crown className="h-3 w-3" />
      {t('ownerBadge.owner')}
    </span>
  )
}

export default OwnerBadge
