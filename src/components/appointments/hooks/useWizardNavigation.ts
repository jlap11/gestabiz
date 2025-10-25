import { useLanguage } from '@/contexts/LanguageContext'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useEmployeeBusinesses } from '@/hooks/useEmployeeBusinesses'
import { toast } from 'sonner'
import type { WizardData } from './useAppointmentWizardState'

interface UseWizardNavigationProps {
  currentStep: number
  setCurrentStep: (step: number) => void
  wizardData: WizardData
  updateWizardData: (data: Partial<WizardData>) => void
  businessId?: string
  isSubmitting: boolean
  onClose: () => void
  resetWizardData: () => void
}

export function useWizardNavigation({
  currentStep,
  setCurrentStep,
  wizardData,
  updateWizardData,
  businessId,
  isSubmitting,
  onClose,
  resetWizardData,
}: UseWizardNavigationProps) {
  const { t } = useLanguage()
  const analytics = useAnalytics()
  
  // Hook para obtener los negocios del empleado seleccionado
  const { businesses: employeeBusinesses, isEmployeeOfAnyBusiness } = useEmployeeBusinesses(
    wizardData.employeeId,
    true
  )

  // Determinar si necesitamos mostrar el paso de selección de negocio del empleado
  const needsEmployeeBusinessSelection = wizardData.employeeId && employeeBusinesses.length > 1

  // Calcular el número total de pasos dinámicamente
  const getTotalSteps = () => {
    let total = businessId ? 7 : 8
    if (needsEmployeeBusinessSelection) total += 1
    return total
  }

  // Mapeo de pasos lógicos a números
  const getStepNumber = (logicalStep: string): number => {
    const stepMap: Record<string, number> = {
      business: 0,
      location: 1,
      service: 2,
      employee: 3,
      employeeBusiness: 4,
      dateTime: 5,
      confirmation: 6,
      success: 7,
    }
    return stepMap[logicalStep] ?? currentStep
  }

  // Calcular los pasos completados dinámicamente
  const getCompletedSteps = (): number[] => {
    const completed: number[] = []

    if (wizardData.businessId) {
      completed.push(getStepNumber('business'))
    }
    if (wizardData.locationId) {
      completed.push(getStepNumber('location'))
    }
    if (wizardData.serviceId) {
      completed.push(getStepNumber('service'))
    }
    if (wizardData.employeeId) {
      completed.push(getStepNumber('employee'))
    }
    if (needsEmployeeBusinessSelection && wizardData.employeeBusinessId) {
      completed.push(getStepNumber('employeeBusiness'))
    }
    if (wizardData.date && wizardData.startTime) {
      completed.push(getStepNumber('dateTime'))
    }
    if (currentStep > getStepNumber('confirmation')) {
      completed.push(getStepNumber('confirmation'))
    }

    return completed
  }

  const canProceed = () => {
    if (currentStep === getStepNumber('business')) {
      return wizardData.businessId !== null
    }
    if (currentStep === getStepNumber('location')) {
      return wizardData.locationId !== null
    }
    if (currentStep === getStepNumber('service')) {
      return wizardData.serviceId !== null
    }
    if (currentStep === getStepNumber('employee')) {
      if (
        wizardData.business?.resource_model &&
        wizardData.business.resource_model !== 'professional'
      ) {
        return wizardData.resourceId !== null
      }
      return wizardData.employeeId !== null && isEmployeeOfAnyBusiness
    }
    if (currentStep === getStepNumber('employeeBusiness')) {
      return wizardData.employeeBusinessId !== null
    }
    if (currentStep === getStepNumber('dateTime')) {
      return wizardData.date !== null && wizardData.startTime !== null
    }
    if (currentStep === getStepNumber('confirmation')) {
      return true
    }
    return false
  }

  const handleNext = () => {
    // Validación para el paso de Fecha y Hora
    if (currentStep === getStepNumber('dateTime')) {
      if (!wizardData.date) {
        toast.error(t('appointments.wizard_errors.selectDate'))
        return
      }
      if (!wizardData.startTime) {
        toast.error(t('appointments.wizard_errors.selectTime'))
        return
      }
    }

    // Track step completed
    analytics.trackBookingStepCompleted({
      businessId: wizardData.businessId || businessId || '',
      businessName: wizardData.business?.name,
      stepNumber: currentStep,
      totalSteps: getTotalSteps(),
      serviceId: wizardData.serviceId || undefined,
      serviceName: wizardData.service?.name,
      employeeId: wizardData.employeeId || undefined,
      employeeName: wizardData.employee?.full_name || undefined,
      locationId: wizardData.locationId || undefined,
      currency: 'COP',
    })

    // Si estamos en el paso de Employee y tiene múltiples negocios
    if (currentStep === getStepNumber('employee') && needsEmployeeBusinessSelection) {
      if (!isEmployeeOfAnyBusiness) {
        toast.error(t('appointments.wizard_errors.professionalNotAvailable'))
        return
      }
      setCurrentStep(getStepNumber('employeeBusiness'))
      return
    }

    // Si el empleado tiene solo un negocio, auto-seleccionarlo
    if (currentStep === getStepNumber('employee') && employeeBusinesses.length === 1) {
      updateWizardData({
        employeeBusinessId: employeeBusinesses[0].id,
        employeeBusiness: employeeBusinesses[0] as any,
      })
      setCurrentStep(getStepNumber('dateTime'))
      return
    }

    // Si el empleado no tiene negocios, no permitir continuar
    if (currentStep === getStepNumber('employee') && !isEmployeeOfAnyBusiness) {
      toast.error(t('appointments.wizard_errors.professionalCannotAccept'))
      return
    }

    // Navegación normal
    const maxStep = getTotalSteps() - 1
    if (currentStep < maxStep) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    const minStep = businessId ? 1 : 0
    if (currentStep > minStep) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      // Track abandono si no está en el paso final
      if (currentStep > 0 && currentStep < getTotalSteps() - 1) {
        analytics.trackBookingAbandoned({
          businessId: wizardData.businessId || businessId || '',
          businessName: wizardData.business?.name,
          stepNumber: currentStep,
          totalSteps: getTotalSteps(),
          serviceId: wizardData.serviceId || undefined,
          serviceName: wizardData.service?.name,
          employeeId: wizardData.employeeId || undefined,
          employeeName: wizardData.employee?.full_name || undefined,
          locationId: wizardData.locationId || undefined,
          currency: 'COP',
        })
      }

      resetWizardData()
      onClose()
    }
  }

  return {
    handleNext,
    handleBack,
    handleClose,
    canProceed,
    getTotalSteps,
    getStepNumber,
    getCompletedSteps,
    needsEmployeeBusinessSelection,
    employeeBusinesses,
    isEmployeeOfAnyBusiness,
  }
}