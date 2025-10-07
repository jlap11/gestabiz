import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BusinessSelection,
  ServiceSelection,
  DateTimeSelection,
  ConfirmationStep,
  SuccessStep,
  ProgressBar,
} from './wizard-steps';
import type { Service, Location } from '@/types/types';

interface AppointmentWizardProps {
  open: boolean;
  onClose: () => void;
  businessId?: string; // Ahora es opcional
}

interface Business {
  id: string;
  name: string;
  description: string | null;
}

interface WizardData {
  businessId: string | null;
  business: Business | null;
  serviceId: string | null;
  service: Service | null;
  date: Date | null;
  startTime: string | null;
  endTime: string | null;
  notes: string;
  locationId: string | null;
  location: Location | null;
}

const STEP_LABELS = {
  0: 'Business Selection',
  1: 'Service Selection',
  2: 'Date & Time',
  3: 'Confirmation',
  4: 'Complete'
};

export function AppointmentWizard({ open, onClose, businessId }: Readonly<AppointmentWizardProps>) {
  // Si se proporciona businessId, empezar en paso 1, sino en paso 0
  const [currentStep, setCurrentStep] = useState(businessId ? 1 : 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wizardData, setWizardData] = useState<WizardData>({
    businessId: businessId || null,
    business: null,
    serviceId: null,
    service: null,
    date: null,
    startTime: null,
    endTime: null,
    notes: '',
    locationId: null,
    location: null,
  });

  const handleNext = () => {
    if (currentStep < 4) {
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
        serviceId: null,
        service: null,
        date: null,
        startTime: null,
        endTime: null,
        notes: '',
        locationId: null,
        location: null,
      });
      onClose();
    }
  };

  const updateWizardData = (data: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...data }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return wizardData.businessId !== null;
      case 1:
        return wizardData.serviceId !== null;
      case 2:
        return wizardData.date !== null && wizardData.startTime !== null;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className={cn(
          "bg-[#0f172a] border-white/10 text-white p-0 overflow-hidden",
          "w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[75vw]",
          currentStep === 4 ? "!max-w-md" : "!max-w-[1200px]"
        )}
      >
        {/* Header */}
        {currentStep < 4 && (
          <div className="px-6 pt-6 pb-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">
                New Appointment
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors"
                disabled={isSubmitting}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Progress Bar */}
            <ProgressBar 
              currentStep={currentStep} 
              totalSteps={businessId ? 4 : 5}
              label={STEP_LABELS[currentStep as keyof typeof STEP_LABELS]}
            />
          </div>
        )}

        {/* Content Area */}
        <div className={cn(
          "overflow-y-auto",
          currentStep === 4 ? "max-h-[80vh]" : "max-h-[calc(80vh-180px)]"
        )}>
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

          {currentStep === 1 && (
            <ServiceSelection
              businessId={wizardData.businessId || businessId || ''}
              selectedServiceId={wizardData.serviceId}
              onSelectService={(service) => {
                updateWizardData({ 
                  serviceId: service.id, 
                  service 
                });
              }}
            />
          )}

          {currentStep === 2 && (
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

          {currentStep === 3 && (
            <ConfirmationStep
              wizardData={wizardData}
              onUpdateNotes={(notes) => updateWizardData({ notes })}
              onSubmit={() => {
                setIsSubmitting(true);
                // La lógica de submit se maneja aquí
                setTimeout(() => {
                  setIsSubmitting(false);
                  handleNext();
                }, 2000);
              }}
            />
          )}

          {currentStep === 4 && (
            <SuccessStep
              appointmentData={wizardData}
              onClose={handleClose}
            />
          )}
        </div>

        {/* Footer with navigation buttons */}
        {currentStep < 4 && (
          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === (businessId ? 1 : 0) || isSubmitting}
              className="bg-transparent border-white/20 text-white hover:bg-white/5"
            >
              ← Back
            </Button>

            {currentStep < 3 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isSubmitting}
                className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
              >
                Next Step →
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setIsSubmitting(true);
                  setTimeout(() => {
                    setIsSubmitting(false);
                    handleNext();
                  }, 2000);
                }}
                disabled={isSubmitting}
                className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    {' '}Processing...
                  </>
                ) : (
                  <>✓ Confirm & Book</>
                )}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
