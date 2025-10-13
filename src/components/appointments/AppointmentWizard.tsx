import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BusinessSelection,
  LocationSelection,
  ServiceSelection,
  EmployeeSelection,
  EmployeeBusinessSelection,
  DateTimeSelection,
  ConfirmationStep,
  SuccessStep,
  ProgressBar,
} from './wizard-steps';
import type { Service, Location } from '@/types/types';
import supabase from '@/lib/supabase';
import { toast } from 'sonner';
import { useWizardDataCache } from '@/hooks/useWizardDataCache';
import { useEmployeeBusinesses } from '@/hooks/useEmployeeBusinesses';

interface AppointmentWizardProps {
  open: boolean;
  onClose: () => void;
  businessId?: string; // Ahora es opcional
  userId?: string; // ID del usuario autenticado
  onSuccess?: () => void; // Callback después de crear la cita
  preselectedDate?: Date; // Fecha preseleccionada desde el calendario
  preselectedTime?: string; // Hora preseleccionada desde el calendario
}

interface Business {
  id: string;
  name: string;
  description: string | null;
}

interface Employee {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  avatar_url: string | null;
}

interface WizardData {
  businessId: string | null;
  business: Business | null;
  locationId: string | null;
  location: Location | null;
  serviceId: string | null;
  service: Service | null;
  employeeId: string | null;
  employee: Employee | null;
  employeeBusinessId: string | null; // Negocio bajo el cual se hace la reserva (si el empleado tiene múltiples)
  employeeBusiness: Business | null;
  date: Date | null;
  startTime: string | null;
  endTime: string | null;
  notes: string;
}

const STEP_LABELS = {
  0: 'Business Selection',
  1: 'Location Selection',
  2: 'Service Selection',
  3: 'Employee Selection',
  4: 'Date & Time',
  5: 'Confirmation',
  6: 'Complete'
};

export function AppointmentWizard({ open, onClose, businessId, userId, onSuccess, preselectedDate, preselectedTime }: Readonly<AppointmentWizardProps>) {
  // Si se proporciona businessId, empezar en paso 1 (Location), sino en paso 0 (Business)
  const [currentStep, setCurrentStep] = useState(businessId ? 1 : 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wizardData, setWizardData] = useState<WizardData>({
    businessId: businessId || null,
    business: null,
    locationId: null,
    location: null,
    serviceId: null,
    service: null,
    employeeId: null,
    employee: null,
    employeeBusinessId: null,
    employeeBusiness: null,
    date: preselectedDate || null,
    startTime: preselectedTime || null,
    endTime: null,
    notes: '',
  });

  // Hook para obtener los negocios del empleado seleccionado
  const { businesses: employeeBusinesses, isEmployeeOfAnyBusiness } = useEmployeeBusinesses(wizardData.employeeId, true);

  // Pre-cargar todos los datos del wizard cuando se selecciona un negocio
  const dataCache = useWizardDataCache(wizardData.businessId || businessId || null);

  // Determinar si necesitamos mostrar el paso de selección de negocio del empleado
  const needsEmployeeBusinessSelection = wizardData.employeeId && employeeBusinesses.length > 1;

  // Calcular el número total de pasos dinámicamente
  const getTotalSteps = () => {
    let total = businessId ? 6 : 7; // Base: con/sin selección de negocio inicial
    if (needsEmployeeBusinessSelection) total += 1; // Paso adicional si el empleado tiene múltiples negocios
    return total;
  };

  // Mapeo de pasos lógicos a números de paso reales
  const getStepNumber = (logicalStep: string): number => {
    const startingStep = businessId ? 1 : 0;
    const steps: Record<string, number> = {
      'business': 0,
      'location': startingStep,
      'service': startingStep + 1,
      'employee': startingStep + 2,
      'employeeBusiness': startingStep + 3,
      'dateTime': needsEmployeeBusinessSelection ? startingStep + 4 : startingStep + 3,
      'confirmation': needsEmployeeBusinessSelection ? startingStep + 5 : startingStep + 4,
      'success': needsEmployeeBusinessSelection ? startingStep + 6 : startingStep + 5,
    };
    return steps[logicalStep] ?? currentStep;
  };

  const handleNext = () => {
    // Si estamos en el paso de Employee y tiene múltiples negocios, validar primero
    if (currentStep === getStepNumber('employee') && needsEmployeeBusinessSelection) {
      // Validar que el empleado esté vinculado a al menos un negocio
      if (!isEmployeeOfAnyBusiness) {
        toast.error('Este profesional no está disponible para reservas en este momento.');
        return;
      }
      // Ir al paso de selección de negocio del empleado
      setCurrentStep(getStepNumber('employeeBusiness'));
      return;
    }

    // Si el empleado tiene solo un negocio, auto-seleccionarlo y saltar el paso
    if (currentStep === getStepNumber('employee') && employeeBusinesses.length === 1) {
      updateWizardData({
        employeeBusinessId: employeeBusinesses[0].id,
        employeeBusiness: employeeBusinesses[0] as Business,
      });
      setCurrentStep(getStepNumber('dateTime'));
      return;
    }

    // Si el empleado no tiene negocios, no permitir continuar
    if (currentStep === getStepNumber('employee') && !isEmployeeOfAnyBusiness) {
      toast.error('Este profesional no puede aceptar citas. Selecciona otro profesional.');
      return;
    }

    // Navegación normal
    const maxStep = getTotalSteps() - 1;
    if (currentStep < maxStep) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    const minStep = businessId ? 1 : 0;
    if (currentStep > minStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setCurrentStep(businessId ? 1 : 0);
      setWizardData({
        businessId: businessId || null,
        business: null,
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
      });
      onClose();
    }
  };

  const updateWizardData = (data: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...data }));
  };

  // Función para crear la cita en Supabase
  const createAppointment = async () => {
    if (!wizardData.businessId || !wizardData.serviceId || !wizardData.date || !wizardData.startTime) {
      toast.error('Faltan datos requeridos para crear la cita');
      return false;
    }

    if (!userId) {
      toast.error('Debes iniciar sesión para crear una cita');
      return false;
    }

    setIsSubmitting(true);

    try {
      // Combinar fecha y hora
      const [hours, minutes] = wizardData.startTime.split(':');
      const startDateTime = new Date(wizardData.date);
      startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Calcular hora de fin (usar duración del servicio o 60 min por defecto)
      const duration = wizardData.service?.duration || 60;
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + duration);

      // Crear objeto de cita
      // IMPORTANTE: Si el empleado trabaja en múltiples negocios, usar employeeBusinessId
      // en lugar del businessId original (que podría ser diferente)
      const finalBusinessId = wizardData.employeeBusinessId || wizardData.businessId;

      const appointmentData = {
        client_id: userId,
        business_id: finalBusinessId,
        service_id: wizardData.serviceId,
        location_id: wizardData.locationId,
        employee_id: wizardData.employeeId,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: 'pending' as const,
        notes: wizardData.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Insertar en Supabase
      const { error } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select()
        .single();

      if (error) {
        toast.error(`Error al crear la cita: ${error.message}`);
        return false;
      }

      toast.success('¡Cita creada exitosamente!');
      
      // Llamar callback de éxito
      if (onSuccess) {
        onSuccess();
      }

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error inesperado';
      toast.error(`Error al crear la cita: ${message}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    // Verificar según el paso actual usando los números de paso dinámicos
    if (currentStep === getStepNumber('business')) {
      return wizardData.businessId !== null;
    }
    if (currentStep === getStepNumber('location')) {
      return wizardData.locationId !== null;
    }
    if (currentStep === getStepNumber('service')) {
      return wizardData.serviceId !== null;
    }
    if (currentStep === getStepNumber('employee')) {
      return wizardData.employeeId !== null && isEmployeeOfAnyBusiness;
    }
    if (currentStep === getStepNumber('employeeBusiness')) {
      return wizardData.employeeBusinessId !== null;
    }
    if (currentStep === getStepNumber('dateTime')) {
      return wizardData.date !== null && wizardData.startTime !== null;
    }
    if (currentStep === getStepNumber('confirmation')) {
      return true;
    }
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className={cn(
          "bg-card border-border text-foreground p-0 overflow-hidden",
          "w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[75vw]",
          "!max-w-[1200px]",
          "[&>button]:hidden" // Ocultar el botón de cerrar por defecto del DialogContent
        )}
      >
        {/* Header */}
        {currentStep < getStepNumber('success') && (
          <div className="px-6 pt-6 pb-4 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-foreground">
                New Appointment
              </h2>
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                disabled={isSubmitting}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Progress Bar */}
            <ProgressBar 
              currentStep={currentStep} 
              totalSteps={getTotalSteps()}
              label={STEP_LABELS[currentStep as keyof typeof STEP_LABELS]}
            />
          </div>
        )}

        {/* Content Area */}
        <div className={cn(
          "overflow-y-auto",
          currentStep === getStepNumber('success') ? "max-h-[80vh]" : "max-h-[calc(80vh-180px)]"
        )}>
          {/* Paso 0: Selección de Negocio */}
          {!businessId && currentStep === getStepNumber('business') && (
            <BusinessSelection
              selectedBusinessId={wizardData.businessId}
              onSelectBusiness={(business) => {
                updateWizardData({ 
                  businessId: business.id, 
                  business 
                });
              }}
            />
          )}

          {/* Paso 1: Selección de Sede */}
          {currentStep === getStepNumber('location') && (
            <LocationSelection
              businessId={wizardData.businessId || businessId || ''}
              selectedLocationId={wizardData.locationId}
              onSelectLocation={(location) => {
                updateWizardData({ 
                  locationId: location.id, 
                  location 
                });
              }}
              preloadedLocations={dataCache.locations}
            />
          )}

          {/* Paso 2: Selección de Servicio */}
          {currentStep === getStepNumber('service') && (
            <ServiceSelection
              businessId={wizardData.businessId || businessId || ''}
              selectedServiceId={wizardData.serviceId}
              onSelectService={(service) => {
                updateWizardData({ 
                  serviceId: service.id, 
                  service 
                });
              }}
              preloadedServices={dataCache.services}
            />
          )}

          {/* Paso 3: Selección de Profesional */}
          {currentStep === getStepNumber('employee') && (
            <EmployeeSelection
              businessId={wizardData.businessId || businessId || ''}
              locationId={wizardData.locationId || ''}
              serviceId={wizardData.serviceId || ''}
              selectedEmployeeId={wizardData.employeeId}
              onSelectEmployee={(employee) => {
                updateWizardData({ 
                  employeeId: employee.id, 
                  employee 
                });
              }}
            />
          )}

          {/* Paso 3.5: Selección de Negocio del Empleado (CONDICIONAL) */}
          {needsEmployeeBusinessSelection && currentStep === getStepNumber('employeeBusiness') && (
            <EmployeeBusinessSelection
              employeeId={wizardData.employeeId || ''}
              employeeName={wizardData.employee?.full_name || 'Profesional'}
              selectedBusinessId={wizardData.employeeBusinessId}
              onSelectBusiness={(business) => {
                updateWizardData({
                  employeeBusinessId: business.id,
                  employeeBusiness: business as Business,
                });
              }}
            />
          )}

          {/* Paso 4: Selección de Fecha y Hora */}
          {currentStep === getStepNumber('dateTime') && (
            <DateTimeSelection
              service={wizardData.service}
              selectedDate={wizardData.date}
              selectedTime={wizardData.startTime}
              onSelectDate={(date) => updateWizardData({ date })}
              onSelectTime={(startTime, endTime) => 
                updateWizardData({ startTime, endTime })
              }
            />
          )}

          {/* Paso 5: Confirmación */}
          {currentStep === getStepNumber('confirmation') && (
            <ConfirmationStep
              wizardData={wizardData}
              onUpdateNotes={(notes) => updateWizardData({ notes })}
              onSubmit={async () => {
                const success = await createAppointment();
                if (success) {
                  handleNext();
                }
              }}
            />
          )}

          {/* Paso 6: Éxito */}
          {currentStep === getStepNumber('success') && (
            <SuccessStep
              appointmentData={wizardData}
              onClose={handleClose}
            />
          )}
        </div>

        {/* Footer with navigation buttons */}
        {currentStep < getStepNumber('success') && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === (businessId ? 1 : 0) || isSubmitting}
              className="bg-transparent border-border text-foreground hover:bg-muted"
            >
              ← Back
            </Button>

            {currentStep < getStepNumber('confirmation') ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isSubmitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Next Step →
              </Button>
            ) : (
              <Button
                onClick={async () => {
                  const success = await createAppointment();
                  if (success) {
                    handleNext();
                  }
                }}
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    {' '}Guardando...
                  </>
                ) : (
                  <>✓ Confirmar y Reservar</>
                )}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
