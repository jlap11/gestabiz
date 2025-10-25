import React from 'react'
import { DialogTitle } from '@/components/ui/dialog'
import { X } from 'lucide-react'
import { ProgressBar } from '../wizard-steps'
import { cn } from '@/lib/utils'

interface WizardHeaderProps {
  title: string
  currentStep: number
  totalSteps: number
  completedSteps: number[]
  onClose: () => void
  isSubmitting: boolean
  showProgress?: boolean
}

const STEP_LABELS = {
  0: 'Business Selection',
  1: 'Location Selection',
  2: 'Service Selection',
  3: 'Employee Selection',
  4: 'Employee Business',
  5: 'Date & Time',
  6: 'Confirmation',
  7: 'Complete',
}

export function WizardHeader({
  title,
  currentStep,
  totalSteps,
  completedSteps,
  onClose,
  isSubmitting,
  showProgress = true,
}: WizardHeaderProps) {
  return (
    <>
      {/* DialogTitle para accesibilidad */}
      <DialogTitle id="appointment-wizard-title" className="sr-only">
        {title}
      </DialogTitle>
      
      {/* Header - Mobile Responsive */}
      {showProgress && (
        <header className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-border">
          <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">
              {title}
            </h2>
            <button
              onClick={onClose}
              className={cn(
                "text-muted-foreground hover:text-foreground transition-colors cursor-pointer",
                "min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md"
              )}
              disabled={isSubmitting}
              aria-label="Cerrar asistente de citas"
              title="Cerrar asistente de citas"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Progress Bar */}
          <ProgressBar
            currentStep={currentStep}
            totalSteps={totalSteps}
            label={STEP_LABELS[currentStep as keyof typeof STEP_LABELS]}
            completedSteps={completedSteps}
          />
        </header>
      )}
    </>
  )
}