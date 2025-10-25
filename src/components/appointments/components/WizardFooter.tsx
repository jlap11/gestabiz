import React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface WizardFooterProps {
  currentStep: number
  totalSteps: number
  canProceed: boolean
  isSubmitting: boolean
  businessId?: string
  onBack: () => void
  onNext: () => void
  onSubmit: () => Promise<void>
  getStepNumber: (step: string) => number
}

export function WizardFooter({
  currentStep,
  totalSteps,
  canProceed,
  isSubmitting,
  businessId,
  onBack,
  onNext,
  onSubmit,
  getStepNumber,
}: WizardFooterProps) {
  const isConfirmationStep = currentStep === getStepNumber('confirmation')
  const isSuccessStep = currentStep === getStepNumber('success')
  const minStep = businessId ? 1 : 0

  if (isSuccessStep) {
    return null
  }

  return (
    <footer className="px-3 sm:px-6 py-3 sm:py-4 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0">
      <Button
        variant="outline"
        onClick={onBack}
        disabled={currentStep === minStep || isSubmitting}
        className={cn(
          "bg-transparent border-border text-foreground hover:bg-muted",
          "min-h-[44px] min-w-[44px] order-2 sm:order-1",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        )}
        aria-label="Volver al paso anterior"
        title="Volver al paso anterior"
      >
        <span aria-hidden="true">←</span> <span className="ml-1">Back</span>
      </Button>

      {!isConfirmationStep ? (
        <Button
          onClick={onNext}
          disabled={!canProceed || isSubmitting}
          className={cn(
            "bg-primary hover:bg-primary/90 text-primary-foreground",
            "min-h-[44px] min-w-[44px] order-1 sm:order-2",
            "focus:outline-none focus:ring-2 focus:ring-primary-foreground focus:ring-offset-2"
          )}
          aria-label="Continuar al siguiente paso"
          title="Continuar al siguiente paso"
        >
          <span>Next Step</span> <span aria-hidden="true" className="ml-1">→</span>
        </Button>
      ) : (
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className={cn(
            "bg-primary hover:bg-primary/90 text-primary-foreground",
            "min-h-[44px] min-w-[44px] order-1 sm:order-2",
            "focus:outline-none focus:ring-2 focus:ring-primary-foreground focus:ring-offset-2"
          )}
          aria-label={isSubmitting ? "Guardando cita..." : "Confirmar y reservar cita"}
          title={isSubmitting ? "Guardando cita..." : "Confirmar y reservar cita"}
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2" aria-hidden="true">⏳</span>
              <span className="hidden sm:inline">Guardando...</span>
              <span className="sm:hidden">Guardar...</span>
            </>
          ) : (
            <>
              <span aria-hidden="true">✓</span>
              <span className="hidden sm:inline ml-1">Confirmar y Reservar</span>
              <span className="sm:hidden ml-1">Confirmar</span>
            </>
          )}
        </Button>
      )}
    </footer>
  )
}