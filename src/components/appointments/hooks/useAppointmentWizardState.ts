import { useState } from 'react'
import type { Appointment, Location, Service } from '@/types/types'

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

export interface WizardData {
  businessId: string | null
  business: Business | null
  locationId: string | null
  location: Location | null
  serviceId: string | null
  service: Service | null
  employeeId: string | null
  employee: Employee | null
  employeeBusinessId: string | null
  employeeBusiness: Business | null
  resourceId: string | null
  date: Date | null
  startTime: string | null
  endTime: string | null
  notes: string
}

interface UseAppointmentWizardStateProps {
  businessId?: string
  preselectedServiceId?: string
  preselectedLocationId?: string
  preselectedEmployeeId?: string
  preselectedDate?: Date
  preselectedTime?: string
}

export function useAppointmentWizardState({
  businessId,
  preselectedServiceId,
  preselectedLocationId,
  preselectedEmployeeId,
  preselectedDate,
  preselectedTime,
}: UseAppointmentWizardStateProps) {
  // Determinar el paso inicial basado en preselecciones
  const getInitialStep = () => {
    if (!businessId) return 0
    if (preselectedEmployeeId && preselectedServiceId) return 5
    if (preselectedEmployeeId && !preselectedServiceId) return 2
    if (preselectedServiceId && !preselectedEmployeeId) return 3
    if (preselectedLocationId) return 2
    return 1
  }

  const [currentStep, setCurrentStep] = useState(getInitialStep())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasTrackedStart, setHasTrackedStart] = useState(false)
  
  const [wizardData, setWizardData] = useState<WizardData>({
    businessId: businessId || null,
    business: null,
    locationId: preselectedLocationId || null,
    location: null,
    serviceId: preselectedServiceId || null,
    service: null,
    employeeId: preselectedEmployeeId || null,
    employee: null,
    employeeBusinessId: null,
    employeeBusiness: null,
    resourceId: null,
    date: preselectedDate || null,
    startTime: preselectedTime || null,
    endTime: null,
    notes: '',
  })

  const updateWizardData = (data: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...data }))
  }

  const resetWizardData = () => {
    setCurrentStep(getInitialStep())
    setWizardData({
      businessId: businessId || null,
      business: null,
      locationId: preselectedLocationId || null,
      location: null,
      serviceId: preselectedServiceId || null,
      service: null,
      employeeId: preselectedEmployeeId || null,
      employee: null,
      employeeBusinessId: null,
      employeeBusiness: null,
      resourceId: null,
      date: null,
      startTime: null,
      endTime: null,
      notes: '',
    })
  }

  return {
    currentStep,
    setCurrentStep,
    isSubmitting,
    setIsSubmitting,
    hasTrackedStart,
    setHasTrackedStart,
    wizardData,
    updateWizardData,
    resetWizardData,
    getInitialStep,
  }
}