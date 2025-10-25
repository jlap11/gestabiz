import React from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useWizardDataCache } from '@/hooks/useWizardDataCache'
import { usePreferredCity } from '@/hooks/usePreferredCity'
import supabase from '@/lib/supabase'
import { toast } from 'sonner'
import type { Location, Service } from '@/types/types'
import type { WizardData } from './useAppointmentWizardState'

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

interface UseWizardDataLoaderProps {
  open: boolean
  businessId?: string
  preselectedServiceId?: string
  preselectedLocationId?: string
  preselectedEmployeeId?: string
  wizardData: WizardData
  updateWizardData: (data: Partial<WizardData>) => void
  hasTrackedStart: boolean
  setHasTrackedStart: (tracked: boolean) => void
}

export function useWizardDataLoader({
  open,
  businessId,
  preselectedServiceId,
  preselectedLocationId,
  preselectedEmployeeId,
  wizardData,
  updateWizardData,
  hasTrackedStart,
  setHasTrackedStart,
}: UseWizardDataLoaderProps) {
  const { t } = useLanguage()
  const analytics = useAnalytics()
  
  // Pre-cargar todos los datos del wizard cuando se selecciona un negocio
  const dataCache = useWizardDataCache(wizardData.businessId || businessId || null)
  
  // Hook para obtener la ciudad preferida del usuario
  const { preferredCityName, preferredRegionName } = usePreferredCity()

  // Track booking started (solo una vez cuando se abre el wizard)
  React.useEffect(() => {
    if (open && !hasTrackedStart && (businessId || wizardData.businessId)) {
      analytics.trackBookingStarted({
        businessId: businessId || wizardData.businessId || '',
        businessName: wizardData.business?.name,
        serviceId: preselectedServiceId,
        serviceName: wizardData.service?.name,
        employeeId: preselectedEmployeeId,
        employeeName: wizardData.employee?.full_name || undefined,
        locationId: preselectedLocationId,
        currency: 'COP',
      })
      setHasTrackedStart(true)
    }

    // Reset flag cuando se cierra
    if (!open && hasTrackedStart) {
      setHasTrackedStart(false)
    }
  }, [
    open,
    businessId,
    wizardData.businessId,
    hasTrackedStart,
    analytics,
    preselectedServiceId,
    preselectedLocationId,
    preselectedEmployeeId,
    wizardData.business?.name,
    wizardData.service?.name,
    wizardData.employee?.full_name,
    setHasTrackedStart,
  ])

  // Efecto para cargar datos completos de items preseleccionados
  React.useEffect(() => {
    if (!open) return

    const loadPreselectedData = async () => {
      try {
        const updates: Partial<WizardData> = {}

        // Cargar negocio si está preseleccionado pero no tenemos los datos completos
        if (businessId && !wizardData.business) {
          const { data: businessData } = await supabase
            .from('businesses')
            .select('id, name, description')
            .eq('id', businessId)
            .single()

          if (businessData) {
            updates.business = businessData as Business
            if (!wizardData.businessId) {
              updates.businessId = businessId
            }
          }
        }

        // Cargar ubicación si está preseleccionada
        if (preselectedLocationId && !wizardData.location) {
          const { data: locationData } = await supabase
            .from('locations')
            .select('*')
            .eq('id', preselectedLocationId)
            .single()

          if (locationData) {
            updates.location = locationData as Location
            if (!wizardData.locationId) {
              updates.locationId = preselectedLocationId
            }
          }
        }

        // Cargar empleado si está preseleccionado
        if (preselectedEmployeeId && !wizardData.employee) {
          const { data: employeeData } = await supabase
            .from('profiles')
            .select('id, email, full_name, role, avatar_url')
            .eq('id', preselectedEmployeeId)
            .single()

          if (employeeData) {
            updates.employee = employeeData as Employee
            if (!wizardData.employeeId) {
              updates.employeeId = preselectedEmployeeId
            }

            // Si hay empleado pero NO hay negocio o ubicación, cargar su negocio y ubicación
            if (!businessId && !wizardData.businessId) {
              const { data: employeeBusinessData } = await supabase
                .from('business_employees')
                .select('business_id, location_id')
                .eq('employee_id', preselectedEmployeeId)
                .eq('is_active', true)
                .limit(1)
                .single()

              if (employeeBusinessData) {
                // Cargar negocio
                const { data: bizData } = await supabase
                  .from('businesses')
                  .select('id, name, description')
                  .eq('id', employeeBusinessData.business_id)
                  .single()

                if (bizData) {
                  updates.businessId = bizData.id
                  updates.business = bizData as Business
                }

                // Cargar ubicación si está disponible
                if (employeeBusinessData.location_id && !preselectedLocationId) {
                  const { data: locData } = await supabase
                    .from('locations')
                    .select('*')
                    .eq('id', employeeBusinessData.location_id)
                    .single()

                  if (locData) {
                    updates.locationId = locData.id
                    updates.location = locData as Location
                  }
                }
              }
            }
          }
        }

        // Cargar servicio si está preseleccionado
        if (preselectedServiceId && !wizardData.service) {
          const { data: serviceData } = await supabase
            .from('services')
            .select('*')
            .eq('id', preselectedServiceId)
            .single()

          if (serviceData) {
            updates.service = serviceData as Service
            if (!wizardData.serviceId) {
              updates.serviceId = preselectedServiceId
            }
          }
        }

        // Aplicar todas las actualizaciones de una vez
        if (Object.keys(updates).length > 0) {
          updateWizardData(updates)
        }
      } catch {
        // Silent fail - el usuario puede seleccionar manualmente si falla la precarga
      }
    }

    loadPreselectedData()
  }, [open, businessId, preselectedLocationId, preselectedServiceId, preselectedEmployeeId, wizardData.business, wizardData.businessId, wizardData.location, wizardData.employee, wizardData.service, updateWizardData])

  // Validar compatibilidad empleado-servicio
  React.useEffect(() => {
    if (!open || !preselectedEmployeeId || !preselectedServiceId) return

    const validateEmployeeService = async () => {
      try {
        const { data: compatibility } = await supabase
          .from('employee_services')
          .select('id')
          .eq('employee_id', preselectedEmployeeId)
          .eq('service_id', preselectedServiceId)
          .eq('is_active', true)
          .single()

        if (!compatibility) {
          toast.error(t('appointments.wizard_errors.professionalNotOffersService'))
          updateWizardData({
            employeeId: null,
            employee: null,
          })
        }
      } catch {
        toast.error(t('appointments.wizard_errors.cannotVerifyCompatibility'))
        updateWizardData({
          employeeId: null,
          employee: null,
        })
      }
    }

    validateEmployeeService()
  }, [open, preselectedEmployeeId, preselectedServiceId, t, updateWizardData])

  return {
    dataCache,
    preferredCityName,
    preferredRegionName,
  }
}