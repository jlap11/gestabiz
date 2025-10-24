// ============================================================================
// COMPONENT: LoadingSpinner
// Spinner de carga reutilizable para Suspense y estados de loading
// ============================================================================

import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/LanguageContext'

interface LoadingSpinnerProps {
  readonly size?: 'sm' | 'md' | 'lg' | 'xl'
  readonly text?: string
  readonly className?: string
  readonly fullScreen?: boolean
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
}

export function LoadingSpinner({
  size = 'md',
  text,
  className,
  fullScreen = false,
}: readonly LoadingSpinnerProps) {
  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && <p className="text-sm text-muted-foreground animate-pulse">{text}</p>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    )
  }

  return content
}

// Variante para Suspense fallback
export function SuspenseFallback({ text }: { readonly text?: string }) {
  const { t } = useLanguage()
  const defaultText = text || t('common.loading.component')
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" text={defaultText} />
    </div>
  )
}

// Variante inline para botones
export function ButtonSpinner({ className }: { readonly className?: string }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin', className)} />
}

// Variante para skeleton de formulario
export function FormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-muted rounded-md" />
      <div className="h-10 bg-muted rounded-md" />
      <div className="h-10 bg-muted rounded-md" />
      <div className="h-20 bg-muted rounded-md" />
      <div className="flex gap-2">
        <div className="h-10 w-24 bg-muted rounded-md" />
        <div className="h-10 w-24 bg-muted rounded-md" />
      </div>
    </div>
  )
}
