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
  DateTimeSelection,
  ConfirmationStep,
  SuccessStep,
  ProgressBar,
} from './wizard-steps';
import type { Service, Location } from '@/types/types';
import supabase from '@/lib/supabase';
import { toast } from 'sonner';
import { useWizardDataCache } from '@/hooks/useWizardDataCache';

interface AppointmentWizardProps {
  open: boolean;
  onClose: () => void;
  businessId?: string; // Ahora es opcional
  userId?: string; // ID del usuario autenticado
  onSuccess?: () => void; // Callback después de crear la cita
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

export function AppointmentWizard({ open, onClose, businessId, userId, onSuccess }: Readonly<AppointmentWizardProps>) {
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
    date: null,
    startTime: null,
    endTime: null,
    notes: '',
  });

  // Pre-cargar todos los datos del wizard cuando se selecciona un negocio
  const dataCache = useWizardDataCache(wizardData.businessId || businessId || null);

  const handleNext = () => {
    if (currentStep < 6) {
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
      const appointmentData = {
        client_id: userId,
        business_id: wizardData.businessId,
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
    switch (currentStep) {
      case 0: // Business Selection
        return wizardData.businessId !== null;
      case 1: // Location Selection
        return wizardData.locationId !== null;
      case 2: // Service Selection
        return wizardData.serviceId !== null;
      case 3: // Employee Selection
        return wizardData.employeeId !== null;
      case 4: // Date & Time Selection
        return wizardData.date !== null && wizardData.startTime !== null;
      case 5: // Confirmation
        return true;
      default:
        return false;
    }
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
        {currentStep < 6 && (
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
              totalSteps={businessId ? 6 : 7}
              label={STEP_LABELS[currentStep as keyof typeof STEP_LABELS]}
            />
          </div>
        )}

        {/* Content Area */}
        <div className={cn(
          "overflow-y-auto",
          currentStep === 6 ? "max-h-[80vh]" : "max-h-[calc(80vh-180px)]"
        )}>
          {/* Paso 0: Selección de Negocio */}
          {currentStep === 0 && (
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
          {currentStep === 1 && (
            <LocationSelection
              businessId={wizardData.businessId || businessId || ''}
              selectedLocationId={wizardData.locationId}
              onSelectLocation={(location) => {
                updateWizardData({ 
                  locationId: location.id, 
                  location: location as Location
                });
              }}
              preloadedLocations={dataCache.locations}
            />
          )}

          {/* Paso 2: Selección de Servicio */}
          {currentStep === 2 && (
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
          {currentStep === 3 && (
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

          {/* Paso 4: Selección de Fecha y Hora */}
          {currentStep === 4 && (
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
          {currentStep === 5 && (
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
          {currentStep === 6 && (
            <SuccessStep
              appointmentData={wizardData}
              onClose={handleClose}
            />
          )}
        </div>

        {/* Footer with navigation buttons */}
        {currentStep < 6 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === (businessId ? 1 : 0) || isSubmitting}
              className="bg-transparent border-border text-foreground hover:bg-muted"
            >
              ← Back
            </Button>

            {currentStep < 5 ? (
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
