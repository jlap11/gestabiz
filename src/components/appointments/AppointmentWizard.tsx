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
import { useAnalytics } from '@/hooks/useAnalytics';

interface AppointmentWizardProps {
  open: boolean;
  onClose: () => void;
  businessId?: string; // Ahora es opcional
  preselectedServiceId?: string; // ID del servicio preseleccionado desde perfil público
  preselectedLocationId?: string; // ID de la ubicación preseleccionada desde perfil público
  preselectedEmployeeId?: string; // ID del empleado preseleccionado desde perfil público
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

export function AppointmentWizard({ 
  open, 
  onClose, 
  businessId, 
  preselectedServiceId,
  preselectedLocationId,
  preselectedEmployeeId,
  userId, 
  onSuccess, 
  preselectedDate, 
  preselectedTime 
}: Readonly<AppointmentWizardProps>) {
  // Determinar el paso inicial basado en preselecciones
  const getInitialStep = () => {
    if (!businessId) return 0; // Sin negocio, empezar desde selección de negocio
    
    // Con negocio preseleccionado
    // Si hay empleado preseleccionado Y servicio preseleccionado, ir a fecha/hora
    if (preselectedEmployeeId && preselectedServiceId) return 4;
    
    // Si hay empleado pero NO servicio, ir a selección de servicio
    // (el empleado puede especializarse en ciertos servicios)
    if (preselectedEmployeeId && !preselectedServiceId) return 2;
    
    // Si hay servicio pero NO empleado, ir a selección de empleado
    if (preselectedServiceId && !preselectedEmployeeId) return 3;
    
    // Si hay ubicación, ir a selección de servicio
    if (preselectedLocationId) return 2;
    
    return 1; // Por defecto, empezar en selección de ubicación
  };

  const [currentStep, setCurrentStep] = useState(getInitialStep());
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    date: preselectedDate || null,
    startTime: preselectedTime || null,
    endTime: null,
    notes: '',
  });

  // Hook para obtener los negocios del empleado seleccionado
  const { businesses: employeeBusinesses, isEmployeeOfAnyBusiness } = useEmployeeBusinesses(wizardData.employeeId, true);

  // Pre-cargar todos los datos del wizard cuando se selecciona un negocio
  const dataCache = useWizardDataCache(wizardData.businessId || businessId || null);

  // Google Analytics tracking
  const analytics = useAnalytics();
  const [hasTrackedStart, setHasTrackedStart] = React.useState(false);

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
      });
      setHasTrackedStart(true);
    }

    // Reset flag cuando se cierra
    if (!open && hasTrackedStart) {
      setHasTrackedStart(false);
    }
  }, [open, businessId, wizardData.businessId, hasTrackedStart, analytics, preselectedServiceId, preselectedLocationId, preselectedEmployeeId, wizardData.business?.name, wizardData.service?.name, wizardData.employee?.full_name]);

  // Efecto para cargar datos completos de items preseleccionados
  React.useEffect(() => {
    if (!open) return; // Solo cargar cuando el wizard esté abierto

    const loadPreselectedData = async () => {
      try {
        const updates: Partial<WizardData> = {};

        // Cargar negocio si está preseleccionado pero no tenemos los datos completos
        if (businessId && !wizardData.business) {
          const { data: businessData } = await supabase
            .from('businesses')
            .select('id, name, description')
            .eq('id', businessId)
            .single();
          
          if (businessData) {
            updates.business = businessData as Business;
          }
        }

        // Cargar ubicación si está preseleccionada
        if (preselectedLocationId && !wizardData.location) {
          const { data: locationData } = await supabase
            .from('locations')
            .select('*')
            .eq('id', preselectedLocationId)
            .single();
          
          if (locationData) {
            updates.location = locationData as Location;
          }
        }

        // Cargar servicio si está preseleccionado
        if (preselectedServiceId && !wizardData.service) {
          const { data: serviceData } = await supabase
            .from('services')
            .select('*')
            .eq('id', preselectedServiceId)
            .single();
          
          if (serviceData) {
            updates.service = serviceData as Service;
          }
        }

        // Cargar empleado si está preseleccionado
        if (preselectedEmployeeId && !wizardData.employee) {
          const { data: employeeData } = await supabase
            .from('profiles')
            .select('id, email, full_name, role, avatar_url')
            .eq('id', preselectedEmployeeId)
            .single();
          
          if (employeeData) {
            updates.employee = employeeData as Employee;
          }
        }

        // Aplicar todas las actualizaciones de una vez
        if (Object.keys(updates).length > 0) {
          updateWizardData(updates);
        }
      } catch {
        // Silent fail - el usuario puede seleccionar manualmente si falla la precarga
      }
    };

    loadPreselectedData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, businessId, preselectedLocationId, preselectedServiceId, preselectedEmployeeId]);

  // Validar compatibilidad empleado-servicio
  React.useEffect(() => {
    if (!open || !preselectedEmployeeId || !preselectedServiceId) return;

    const validateEmployeeService = async () => {
      try {
        // Verificar que el empleado ofrezca este servicio
        const { data: compatibility } = await supabase
          .from('employee_services')
          .select('id')
          .eq('employee_id', preselectedEmployeeId)
          .eq('service_id', preselectedServiceId)
          .eq('is_active', true)
          .single();

        if (!compatibility) {
          // El empleado no ofrece este servicio - limpiar preselección
          toast.error('Este profesional no ofrece el servicio seleccionado');
          updateWizardData({
            employeeId: null,
            employee: null,
          });
        }
      } catch {
        // Si hay error, limpiar preselección por seguridad
        toast.error('No se pudo verificar la compatibilidad del profesional');
        updateWizardData({
          employeeId: null,
          employee: null,
        });
      }
    };

    validateEmployeeService();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preselectedEmployeeId, preselectedServiceId]);

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

  // Calcular los pasos completados dinámicamente
  const getCompletedSteps = (): number[] => {
    const completed: number[] = [];
    const startingStep = businessId ? 1 : 0;

    // Paso 0: Business (si aplica)
    if (!businessId && wizardData.businessId) {
      completed.push(0);
    }

    // Paso 1: Location
    if (wizardData.locationId) {
      completed.push(startingStep);
    }

    // Paso 2: Service
    if (wizardData.serviceId) {
      completed.push(startingStep + 1);
    }

    // Paso 3: Employee
    if (wizardData.employeeId) {
      completed.push(startingStep + 2);
    }

    // Paso 4: Employee Business (si aplica)
    if (needsEmployeeBusinessSelection && wizardData.employeeBusinessId) {
      completed.push(startingStep + 3);
    }

    // Paso 5: Date & Time
    if (wizardData.date && wizardData.startTime) {
      const dateTimeStep = needsEmployeeBusinessSelection ? startingStep + 4 : startingStep + 3;
      completed.push(dateTimeStep);
    }

    // Paso 6: Confirmation (se completa al hacer submit)
    if (currentStep > getStepNumber('confirmation')) {
      const confirmStep = needsEmployeeBusinessSelection ? startingStep + 5 : startingStep + 4;
      completed.push(confirmStep);
    }

    return completed;
  };

  const handleNext = () => {
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
    });

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
        });
      }

      setCurrentStep(getInitialStep()); // Usar función para calcular paso inicial
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

      // Track booking completed (conversión exitosa)
      analytics.trackBookingCompleted({
        businessId: finalBusinessId || '',
        businessName: wizardData.business?.name || wizardData.employeeBusiness?.name,
        serviceId: wizardData.serviceId || '',
        serviceName: wizardData.service?.name,
        employeeId: wizardData.employeeId || undefined,
        employeeName: wizardData.employee?.full_name || undefined,
        locationId: wizardData.locationId || undefined,
        amount: wizardData.service?.price,
        currency: 'COP',
        duration: wizardData.service?.duration || 60,
      });

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
          "w-[98vw] sm:w-[95vw] md:w-[85vw] lg:w-[75vw]",
          "!max-w-[1200px]",
          "h-[95vh] sm:h-auto", // Full height mobile
          "[&>button]:hidden" // Ocultar el botón de cerrar por defecto del DialogContent
        )}
      >
        {/* Header - Mobile Responsive */}
        {currentStep < getStepNumber('success') && (
          <div className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-border">
            <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">
                New Appointment
              </h2>
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                disabled={isSubmitting}
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            {/* Progress Bar */}
            <ProgressBar 
              currentStep={currentStep} 
              totalSteps={getTotalSteps()}
              label={STEP_LABELS[currentStep as keyof typeof STEP_LABELS]}
              completedSteps={getCompletedSteps()}
            />
          </div>
        )}

        {/* Content Area - Mobile Full Height */}
        <div className={cn(
          "overflow-y-auto",
          currentStep === getStepNumber('success') 
            ? "max-h-[85vh] sm:max-h-[80vh]" 
            : "max-h-[calc(95vh-200px)] sm:max-h-[calc(80vh-180px)]",
          "px-3 sm:px-0" // Padding horizontal mobile
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
              isPreselected={!!preselectedLocationId}
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
              isPreselected={!!preselectedServiceId}
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
              isPreselected={!!preselectedEmployeeId}
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

        {/* Footer with navigation buttons - Mobile Responsive */}
        {currentStep < getStepNumber('success') && (
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === (businessId ? 1 : 0) || isSubmitting}
              className="bg-transparent border-border text-foreground hover:bg-muted min-h-[44px] order-2 sm:order-1"
            >
              ← Back
            </Button>

            {currentStep < getStepNumber('confirmation') ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isSubmitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground min-h-[44px] order-1 sm:order-2"
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
                className="bg-primary hover:bg-primary/90 text-primary-foreground min-h-[44px] order-1 sm:order-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    {' '}
                    <span className="hidden sm:inline">Guardando...</span>
                    <span className="sm:hidden">Guardar...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">✓ Confirmar y Reservar</span>
                    <span className="sm:hidden">✓ Confirmar</span>
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
