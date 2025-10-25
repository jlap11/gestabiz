import React from 'react'
import { cn } from '@/lib/utils'
import {
  BusinessSelection,
  ConfirmationStep,
  DateTimeSelection,
  EmployeeBusinessSelection,
  EmployeeSelection,
  LocationSelection,
  ServiceSelection,
  SuccessStep,
} from '../wizard-steps'
import { ResourceSelection } from '../ResourceSelection'
import type { Appointment } from '@/types/types'
import type { WizardData } from '../hooks'

interface WizardContentProps {
  currentStep: number
  wizardData: WizardData
  businessId?: string
  appointmentToEdit?: Appointment | null
  getStepNumber: (step: string) => number
  updateWizardData: (data: Partial<WizardData>) => void
  onCreateAppointment: () => Promise<boolean>
  onNext: () => void
  // Data cache props
  preloadedLocations?: any[]
  preloadedServices?: any[]
  // Preselection props
  preselectedLocationId?: string
  preselectedServiceId?: string
  preselectedEmployeeId?: string
  // City preferences
  preferredCityName?: string
  preferredRegionName?: string
}

export function WizardContent({
  currentStep,
  wizardData,
  businessId,
  appointmentToEdit,
  getStepNumber,
  updateWizardData,
  onCreateAppointment,
  onNext,
  preloadedLocations,
  preloadedServices,
  preselectedLocationId,
  preselectedServiceId,
  preselectedEmployeeId,
  preferredCityName,
  preferredRegionName,
}: WizardContentProps) {
  const isSuccessStep = currentStep === getStepNumber('success')

  return (
    <main
      className={cn(
        'overflow-y-auto',
        isSuccessStep
          ? 'max-h-[85vh] sm:max-h-[80vh]'
          : 'max-h-[calc(95vh-200px)] sm:max-h-[calc(80vh-180px)]',
        'px-3 sm:px-0'
      )}
      role="main"
      aria-labelledby="appointment-wizard-title"
    >
      {/* Paso 0: Selección de Negocio */}
      {!businessId && currentStep === getStepNumber('business') && (
        <section role="region" aria-labelledby="business-selection-title">
          <h3 id="business-selection-title" className="sr-only">Selección de negocio</h3>
          <BusinessSelection
            selectedBusinessId={wizardData.businessId}
            preferredCityName={preferredCityName}
            preferredRegionName={preferredRegionName}
            onSelectBusiness={business => {
              updateWizardData({
                businessId: business.id,
                business,
                locationId: null,
                location: null,
                serviceId: null,
                service: null,
                employeeId: null,
                employee: null,
                employeeBusinessId: null,
                employeeBusiness: null,
                date: null,
                startTime: null,
                endTime: null,
                notes: '',
              })
            }}
          />
        </section>
      )}

      {/* Paso 1: Selección de Sede */}
      {currentStep === getStepNumber('location') && (
        <section role="region" aria-labelledby="location-selection-title">
          <h3 id="location-selection-title" className="sr-only">Selección de sede</h3>
          <LocationSelection
            businessId={wizardData.businessId || businessId || ''}
            selectedLocationId={wizardData.locationId}
            onSelectLocation={location => {
              updateWizardData({
                locationId: location.id,
                location,
              })
            }}
            preloadedLocations={preloadedLocations}
            isPreselected={!!preselectedLocationId}
          />
        </section>
      )}

      {/* Paso 2: Selección de Servicio */}
      {currentStep === getStepNumber('service') && (
        <section role="region" aria-labelledby="service-selection-title">
          <h3 id="service-selection-title" className="sr-only">Selección de servicio</h3>
          <ServiceSelection
            businessId={wizardData.businessId || businessId || ''}
            selectedServiceId={wizardData.serviceId}
            onSelectService={service => {
              updateWizardData({
                serviceId: service.id,
                service,
              })
            }}
            preloadedServices={preloadedServices}
            isPreselected={!!preselectedServiceId}
          />
        </section>
      )}

      {/* Paso 3: Selección de Profesional o Recurso */}
      {currentStep === getStepNumber('employee') && (
        <section role="region" aria-labelledby="employee-selection-title">
          <h3 id="employee-selection-title" className="sr-only">
            {wizardData.business?.resource_model && wizardData.business.resource_model !== 'professional' 
              ? 'Selección de recurso' 
              : 'Selección de profesional'
            }
          </h3>
          
          {/* Modelo profesional */}
          {(!wizardData.business?.resource_model ||
            wizardData.business.resource_model === 'professional') && (
            <EmployeeSelection
              businessId={wizardData.businessId || businessId || ''}
              locationId={wizardData.locationId || ''}
              serviceId={wizardData.serviceId || ''}
              selectedEmployeeId={wizardData.employeeId}
              onSelectEmployee={employee => {
                updateWizardData({
                  employeeId: employee.id,
                  employee,
                  resourceId: null,
                })
              }}
              isPreselected={!!preselectedEmployeeId}
            />
          )}

          {/* Modelo de recursos físicos */}
          {wizardData.business?.resource_model &&
            wizardData.business.resource_model !== 'professional' && (
              <ResourceSelection
                businessId={wizardData.businessId || businessId || ''}
                serviceId={wizardData.serviceId || ''}
                locationId={wizardData.locationId || ''}
                selectedResourceId={wizardData.resourceId || undefined}
                onSelect={resourceId => {
                  updateWizardData({
                    resourceId,
                    employeeId: null,
                    employee: null,
                  })
                }}
              />
            )}
        </section>
      )}

      {/* Paso 3.5: Selección de Negocio del Empleado (CONDICIONAL) */}
      {currentStep === getStepNumber('employeeBusiness') && (
        <section role="region" aria-labelledby="employee-business-selection-title">
          <h3 id="employee-business-selection-title" className="sr-only">Selección de negocio del empleado</h3>
          <EmployeeBusinessSelection
            employeeId={wizardData.employeeId || ''}
            employeeName={wizardData.employee?.full_name || 'Profesional'}
            selectedBusinessId={wizardData.employeeBusinessId}
            onSelectBusiness={business => {
              updateWizardData({
                employeeBusinessId: business.id,
                employeeBusiness: business as any,
              })
            }}
          />
        </section>
      )}

      {/* Paso 4: Selección de Fecha y Hora */}
      {currentStep === getStepNumber('dateTime') && (
        <section role="region" aria-labelledby="datetime-selection-title">
          <h3 id="datetime-selection-title" className="sr-only">Selección de fecha y hora</h3>
          <DateTimeSelection
            service={wizardData.service}
            selectedDate={wizardData.date}
            selectedTime={wizardData.startTime}
            employeeId={wizardData.employeeId}
            resourceId={wizardData.resourceId}
            locationId={wizardData.locationId}
            businessId={wizardData.businessId}
            appointmentToEdit={appointmentToEdit}
            onSelectDate={date => {
              updateWizardData({ date })
            }}
            onSelectTime={(startTime, endTime) => {
              updateWizardData({ startTime, endTime })
            }}
          />
        </section>
      )}

      {/* Paso 5: Confirmación */}
      {currentStep === getStepNumber('confirmation') && (
        <section role="region" aria-labelledby="confirmation-title">
          <h3 id="confirmation-title" className="sr-only">Confirmación de cita</h3>
          <ConfirmationStep
            wizardData={wizardData}
            onUpdateNotes={notes => updateWizardData({ notes })}
            onSubmit={async () => {
              const success = await onCreateAppointment()
              if (success) {
                onNext()
              }
            }}
          />
        </section>
      )}

      {/* Paso 6: Éxito */}
      {currentStep === getStepNumber('success') && (
        <section role="region" aria-labelledby="success-title">
          <h3 id="success-title" className="sr-only">Cita creada exitosamente</h3>
          <SuccessStep appointmentData={wizardData} onClose={() => {}} />
        </section>
      )}
    </main>
  )
}