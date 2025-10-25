import React from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { WizardHeader, WizardFooter, WizardContent } from './components'
import {
  useAppointmentWizardState,
  useWizardNavigation,
  useAppointmentCreation,
  useWizardDataLoader,
} from './hooks'
import type { Appointment } from '@/types/types'

interface AppointmentWizardProps {
  isOpen: boolean
  onClose: () => void
  businessId?: string
  appointmentToEdit?: Appointment | null
  // Preselección de datos
  preselectedLocationId?: string
  preselectedServiceId?: string
  preselectedEmployeeId?: string
  // Callbacks
  onAppointmentCreated?: (appointment: any) => void
  onAppointmentUpdated?: (appointment: any) => void
}

interface Business {
  id: string
  name: string
  description: string | null
  resource_model?: 'professional' | 'physical_resource' | 'hybrid' | 'group_class'
}

interface Employee {
  id: string
  email: string
  full_name: string | null
  role: string
  avatar_url: string | null
}

interface WizardData {
  businessId: string | null
  business: Business | null
  locationId: string | null
  location: Location | null
  serviceId: string | null
  service: Service | null
  employeeId: string | null
  employee: Employee | null
  employeeBusinessId: string | null // Negocio bajo el cual se hace la reserva (si el empleado tiene múltiples)
  employeeBusiness: Business | null
  resourceId: string | null // ⭐ NUEVO: Recurso físico seleccionado
  date: Date | null
  startTime: string | null
  endTime: string | null
  notes: string
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

export function AppointmentWizard({
  isOpen,
  onClose,
  businessId,
  appointmentToEdit,
  preselectedLocationId,
  preselectedServiceId,
  preselectedEmployeeId,
  onAppointmentCreated,
  onAppointmentUpdated,
}: AppointmentWizardProps) {
  // Estado del wizard
  const {
    currentStep,
    isSubmitting,
    wizardData,
    updateWizardData,
    resetWizardData,
    getInitialStep,
  } = useAppointmentWizardState({
    businessId,
    preselectedLocationId,
    preselectedServiceId,
    preselectedEmployeeId,
  })

  // Navegación del wizard
  const {
    handleNext,
    handleBack,
    handleClose,
    canProceed,
    getTotalSteps,
    getStepNumber,
    getCompletedSteps,
  } = useWizardNavigation({
    currentStep,
    wizardData,
    businessId,
    onClose,
    updateWizardData,
    setCurrentStep: (step: number) => {
      // Esta función se manejará internamente en el hook
    },
  })

  // Creación de citas
  const { createAppointment } = useAppointmentCreation({
    wizardData,
    appointmentToEdit,
    onAppointmentCreated,
    onAppointmentUpdated,
    setIsSubmitting: (submitting: boolean) => {
      // Esta función se manejará internamente en el hook
    },
  })

  // Carga de datos
  const {
    preloadedLocations,
    preloadedServices,
    preferredCityName,
    preferredRegionName,
  } = useWizardDataLoader({
    isOpen,
    businessId,
    preselectedLocationId,
    preselectedServiceId,
    preselectedEmployeeId,
    wizardData,
    updateWizardData,
  })





  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <WizardHeader
          currentStep={currentStep}
          totalSteps={getTotalSteps()}
          completedSteps={getCompletedSteps()}
          onClose={handleClose}
          isSubmitting={isSubmitting}
          appointmentToEdit={appointmentToEdit}
        />
        
        <WizardContent
          currentStep={currentStep}
          wizardData={wizardData}
          updateWizardData={updateWizardData}
          businessId={businessId}
          preselectedLocationId={preselectedLocationId}
          preselectedServiceId={preselectedServiceId}
          preselectedEmployeeId={preselectedEmployeeId}
          appointmentToEdit={appointmentToEdit}
          preloadedLocations={preloadedLocations}
          preloadedServices={preloadedServices}
          preferredCityName={preferredCityName}
          preferredRegionName={preferredRegionName}
          getStepNumber={getStepNumber}
          onCreateAppointment={createAppointment}
          onNext={handleNext}
        />
        
        <WizardFooter
          currentStep={currentStep}
          totalSteps={getTotalSteps()}
          canProceed={canProceed()}
          isSubmitting={isSubmitting}
          businessId={businessId}
          onBack={handleBack}
          onNext={handleNext}
          onSubmit={createAppointment}
          getStepNumber={getStepNumber}
        />
      </DialogContent>
    </Dialog>
  )
}