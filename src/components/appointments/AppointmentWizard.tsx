import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Check, Hourglass } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
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
import { ResourceSelection } from './ResourceSelection';
import type { Service, Location, Appointment } from '@/types/types';
import supabase from '@/lib/supabase';
import { toast } from 'sonner';
import { useWizardDataCache } from '@/hooks/useWizardDataCache';
import { useEmployeeBusinesses } from '@/hooks/useEmployeeBusinesses';
import { useAnalytics } from '@/hooks/useAnalytics';
import { usePreferredCity } from '@/hooks/usePreferredCity';
import { useAppointments } from '@/hooks/useSupabase';

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
  appointmentToEdit?: Appointment | null; // Cita a editar (si existe, modo edición)
}

interface Business {
  id: string;
  name: string;
  description: string | null;
  resource_model?: 'professional' | 'physical_resource' | 'hybrid' | 'group_class';
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
  resourceId: string | null; // ⭐ NUEVO: Recurso físico seleccionado
  date: Date | null;
  startTime: string | null;
  endTime: string | null;
  notes: string;
}

const STEP_LABELS_MAP: Record<string, string> = {
  business: 'Business Selection',
  location: 'Location Selection',
  service: 'Service Selection',
  employee: 'Employee Selection',
  employeeBusiness: 'Employee Business',
  dateTime: 'Date & Time',
  confirmation: 'Confirmation',
  success: 'Complete',
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
  preselectedTime,
  appointmentToEdit
}: Readonly<AppointmentWizardProps>) {
  const { t } = useLanguage()

  // Normaliza horas preseleccionadas a formato de 12h con AM/PM y hora de 2 dígitos ("hh:mm AM/PM")
  // Ejemplos:
  // - "13:00" -> "01:00 PM"
  // - "9:30"  -> "09:30 AM"
  // - "1:30 PM" -> "01:30 PM" (asegurando el cero a la izquierda)
  const normalizePreselectedTime = (time?: string | null): string | null => {
    if (!time) return null;
    const ampmRegex = /^(\d{1,2}):(\d{2})\s(AM|PM)$/i;
    const twentyFourRegex = /^(\d{1,2}):(\d{2})$/;

    const ampmMatch = time.match(ampmRegex);
    if (ampmMatch) {
      const hourNum = Number.parseInt(ampmMatch[1], 10);
      const minuteStr = ampmMatch[2];
      const suffix = ampmMatch[3].toUpperCase();
      const hourStr = (hourNum === 0 ? 12 : hourNum).toString().padStart(2, '0');
      return `${hourStr}:${minuteStr} ${suffix}`;
    }

    const tfMatch = time.match(twentyFourRegex);
    if (tfMatch) {
      let hourNum = Number.parseInt(tfMatch[1], 10);
      const minuteStr = tfMatch[2];
      const suffix = hourNum >= 12 ? 'PM' : 'AM';
      let hour12 = hourNum % 12;
      if (hour12 === 0) hour12 = 12;
      const hourStr = hour12.toString().padStart(2, '0');
      return `${hourStr}:${minuteStr} ${suffix}`;
    }

    // Si ya viene en otro formato, dejarlo tal cual.
    return time;
  };
  
  // Determinar el paso inicial basado en preselecciones
  const getInitialStep = () => {
    // Sin businessId: empezar en selección de negocio (paso 0)
    if (!businessId) return 0;
    
    // Con businessId preseleccionado:
    // Si hay empleado preseleccionado Y servicio preseleccionado, ir a fecha/hora (paso 5 con businessId)
    if (preselectedEmployeeId && preselectedServiceId) return 5;
    
    // Si hay empleado pero NO servicio, ir a selección de servicio (paso 2 con businessId)
    if (preselectedEmployeeId && !preselectedServiceId) return 2;
    
    // Si hay servicio pero NO empleado, ir a selección de empleado (paso 3 con businessId)
    if (preselectedServiceId && !preselectedEmployeeId) return 3;
    
    // Si hay ubicación, ir a selección de servicio (paso 2 con businessId)
    if (preselectedLocationId) return 2;
    
    // Por defecto con businessId, empezar en selección de ubicación (paso 1 con businessId)
    return 1;
  };

  // currentStep initialization handled by dynamic step order above
  // isSubmitting initialization handled below with dynamic step order
  /* wizardData initial state moved to dynamic block using getStepOrder; see new initialization below */

  // Initialize wizard state before computing dynamic step order
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
    startTime: normalizePreselectedTime(preselectedTime) || null,
    endTime: null,
    notes: '',
  });

  // Hook needed for optional Employee Business step
  const { businesses: employeeBusinesses, isEmployeeOfAnyBusiness } = useEmployeeBusinesses(wizardData.employeeId, true);

  // Determine if flow was initiated from employee profile and needs employee business selection
  const initiatedFromEmployeeProfile = Boolean(preselectedEmployeeId);
  const needsEmployeeBusinessSelection = !!initiatedFromEmployeeProfile && !!wizardData.employeeId && employeeBusinesses.length > 1;

  // Orden dinámico de pasos
  const getStepOrder = (): string[] => {
    const base = businessId 
      ? ['location','service','employee','dateTime','confirmation','success'] 
      : ['business','location','service','employee','dateTime','confirmation','success'];
    if (needsEmployeeBusinessSelection) {
      const idx = base.indexOf('employee');
      return [...base.slice(0, idx + 1), 'employeeBusiness', ...base.slice(idx + 1)];
    }
    return base;
  };

  // Total de pasos
  const getTotalSteps = () => getStepOrder().length;

  // Mapeo lógico → índice dinámico
  const getStepNumber = (logicalStep: string): number => {
    const order = getStepOrder();
    return order.indexOf(logicalStep);
  };

  // Paso inicial lógico y numérico
  const getInitialStepLogical = () => {
    // Si hay fecha u hora preseleccionada, iniciar desde el primer paso
    if (preselectedDate || preselectedTime) {
      return 'business';
    }
    if (!businessId) return 'business';
    if (preselectedEmployeeId && preselectedServiceId) return 'dateTime';
    if (preselectedEmployeeId && !preselectedServiceId) return 'service';
    if (preselectedServiceId && !preselectedEmployeeId) return 'employee';
    if (preselectedLocationId) return 'service';
    return 'location';
  };

  const [currentStep, setCurrentStep] = useState(() => getStepNumber(getInitialStepLogical()));
  const [isSubmitting, setIsSubmitting] = useState(false);
  // wizardData is initialized above before dynamic step order

  // Hook para obtener la ciudad preferida del usuario
  const { preferredCityName, preferredRegionName } = usePreferredCity();

  // Pre-cargar todos los datos del wizard cuando se selecciona un negocio
  const dataCache = useWizardDataCache(wizardData.businessId || businessId || null);

  // Google Analytics tracking
  const analytics = useAnalytics();
  const [hasTrackedStart, setHasTrackedStart] = React.useState(false);

  // Hook para crear citas con notificaciones automáticas
  // Desactivar auto-fetch y suscripción mientras el wizard/modal está abierto
  const { createAppointment: createAppointmentWithNotifications } = useAppointments(userId, { autoFetch: false });

  // Track booking started (solo una vez cuando se abre el wizard)
  React.useEffect(() => {
    if (open && !hasTrackedStart && (businessId || wizardData.businessId)) {
      analytics.trackBookingStarted({
        businessId: wizardData.businessId || businessId || '',
        businessName: wizardData.business?.name,
      });
      setHasTrackedStart(true);
    }
  }, [open, hasTrackedStart, analytics, businessId, wizardData.businessId, wizardData.business?.name]);

  /* replaced: getTotalSteps now derives from getStepOrder().length (dynamic) */

  /* replaced: getStepNumber now uses getStepOrder() to compute index dynamically */

  // ⭐ NUEVA FUNCIÓN: Determinar qué pasos se pueden omitir automáticamente
  const getSkippableSteps = (): string[] => {
    const skippable: string[] = [];
    
    // ⭐ VALIDACIÓN: Verificar que el cache esté cargado
    if (!dataCache.locations || !dataCache.services || !dataCache.employees || !dataCache.serviceEmployees) {
      return skippable; // Retornar array vacío si el cache no está listo
    }
    
    // Si solo hay una ubicación, se puede omitir el paso de ubicación
    if (dataCache.locations.length === 1) {
      skippable.push('location');
      
      // Si también solo hay un servicio en esa ubicación, se puede omitir
      const servicesForLocation = dataCache.services.filter(service => 
        service.location_id === dataCache.locations[0].id
      );
      if (servicesForLocation.length === 1) {
        skippable.push('service');
        
        // Si también solo hay un empleado para ese servicio, se puede omitir
        const employeesForService = dataCache.employees.filter(employee =>
          dataCache.serviceEmployees.some(se => 
            se.service_id === servicesForLocation[0].id && se.employee_id === employee.id
          )
        );
        if (employeesForService.length === 1) {
          skippable.push('employee');
        }
      }
    } else if (wizardData.locationId) {
      // Si ya hay ubicación seleccionada, verificar servicios
      const servicesForLocation = dataCache.services.filter(service => 
        service.location_id === wizardData.locationId
      );
      if (servicesForLocation.length === 1) {
        skippable.push('service');
        
        // Si también solo hay un empleado para ese servicio, se puede omitir
        const employeesForService = dataCache.employees.filter(employee =>
          dataCache.serviceEmployees.some(se => 
            se.service_id === servicesForLocation[0].id && se.employee_id === employee.id
          )
        );
        if (employeesForService.length === 1) {
          skippable.push('employee');
        }
      } else if (wizardData.serviceId) {
        // Si ya hay servicio seleccionado, verificar empleados
        const employeesForService = dataCache.employees.filter(employee =>
          dataCache.serviceEmployees.some(se => 
            se.service_id === wizardData.serviceId && se.employee_id === employee.id
          )
        );
        if (employeesForService.length === 1) {
          skippable.push('employee');
        }
      }
    }
    
    return skippable;
  };

  // ⭐ NUEVA FUNCIÓN: Pasos a mostrar en la barra (agrupa y oculta extras)
  // Regla de visualización:
  // - Oculta siempre 'success' (pantalla final no cuenta en progreso)
  // - Oculta 'employeeBusiness' (solo información contextual)
  const getDisplaySteps = (): string[] => {
    const order = getStepOrder();
    const filtered = order.filter(step => step !== 'success' && step !== 'employeeBusiness');
    // Ya no agrupamos 'employee' dentro de 'dateTime'; se muestra como paso separado
    return filtered;
  };

  // ⭐ NUEVA FUNCIÓN: Calcular pasos efectivos (excluyendo los omitidos)
  const getEffectiveSteps = (): string[] => {
    const allSteps = getDisplaySteps();
    const skippable = getSkippableSteps();
    return allSteps.filter(step => !skippable.includes(step));
  };

  // ⭐ NUEVA FUNCIÓN: Calcular total de pasos efectivos
  const getEffectiveTotalSteps = (): number => {
    return getEffectiveSteps().length;
  };

  // ⭐ NUEVA FUNCIÓN: Calcular paso actual efectivo
  const getEffectiveCurrentStep = (): number => {
    const effectiveSteps = getEffectiveSteps();
    let currentStepName = getStepOrder()[currentStep];
    // Mapear paso condicional 'employeeBusiness' a 'employee' en la visualización
    if (currentStepName === 'employeeBusiness') {
      currentStepName = 'employee';
    }
    return effectiveSteps.indexOf(currentStepName);
  };

  // Calcular los pasos completados dinámicamente
  const getCompletedSteps = (): number[] => {
    const completed: number[] = [];
    const effectiveSteps = getEffectiveSteps();

    // Paso 0: Business (completado si businessId está presente)
    if (wizardData.businessId && effectiveSteps.includes('business')) {
      completed.push(effectiveSteps.indexOf('business'));
    }

    // Paso 1: Location (completado si locationId está presente o se omite)
    if (wizardData.locationId && effectiveSteps.includes('location')) {
      completed.push(effectiveSteps.indexOf('location'));
    }

    // Paso 2: Service (completado si serviceId está presente o se omite)
    if (wizardData.serviceId && effectiveSteps.includes('service')) {
      completed.push(effectiveSteps.indexOf('service'));
    }

    // Paso 3: Employee (completado si employeeId está presente o se omite)
    if (wizardData.employeeId && effectiveSteps.includes('employee')) {
      completed.push(effectiveSteps.indexOf('employee'));
    }

    // Paso 4: Employee Business (completado si aplica y está seleccionado)
    // 'employeeBusiness' no cuenta en la visualización
    // No se considera en el progreso visual

    // Paso 5: DateTime (completado si date y startTime están presentes)
    if (wizardData.date && wizardData.startTime && effectiveSteps.includes('dateTime')) {
      completed.push(effectiveSteps.indexOf('dateTime'));
    }

    // Paso 6: Confirmation (completado si hemos avanzado más allá)
    const effectiveCurrentStepIndex = getEffectiveCurrentStep();
    const confirmationIndex = effectiveSteps.indexOf('confirmation');
    if (effectiveCurrentStepIndex > confirmationIndex && confirmationIndex !== -1) {
      completed.push(confirmationIndex);
    }

    // Convertir a 1-based para ProgressBar
    return completed.map(i => i + 1);
  };

  const handleNext = async () => {
    // ⭐ VALIDACIÓN: Verificar que el cache esté cargado antes de aplicar optimizaciones
    if (!dataCache.locations || !dataCache.services || !dataCache.employees || !dataCache.serviceEmployees) {
      // Si el cache no está listo, proceder con navegación normal
      setCurrentStep(currentStep + 1);
      return;
    }

    // Validación para el paso de Fecha y Hora (paso 4)
    if (currentStep === getStepNumber('dateTime')) {
      // eslint-disable-next-line no-console
      console.log('🔍 Validando paso dateTime:', {
        date: wizardData.date,
        startTime: wizardData.startTime,
        endTime: wizardData.endTime,
        dateBoolean: !!wizardData.date,
        startTimeBoolean: !!wizardData.startTime,
      });

      if (!wizardData.date) {
        toast.error(t('appointments.wizard_errors.selectDate'));
        return;
      }
      if (!wizardData.startTime) {
        toast.error(t('appointments.wizard_errors.selectTime'));
        return;
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
    });

    // ⭐ OPTIMIZACIÓN: Auto-seleccionar ubicación si solo hay una disponible
    if (currentStep === getStepNumber('location') && dataCache.locations.length === 1) {
      const singleLocation = dataCache.locations[0];
      updateWizardData({
        locationId: singleLocation.id,
        location: singleLocation,
      });
      
      // Verificar si también podemos auto-seleccionar el servicio
      const servicesForLocation = dataCache.services.filter(service => 
        service.location_id === singleLocation.id
      );
      
      if (servicesForLocation.length === 1) {
        const singleService = servicesForLocation[0];
        updateWizardData({
          serviceId: singleService.id,
          service: singleService,
        });
        
        // Verificar si también podemos auto-seleccionar el empleado
        const employeesForService = dataCache.employees.filter(employee =>
          dataCache.serviceEmployees.some(se => 
            se.service_id === singleService.id && se.employee_id === employee.id
          )
        );
        
        if (employeesForService.length === 1) {
          const singleEmployee = employeesForService[0];
          updateWizardData({
            employeeId: singleEmployee.id,
            employee: singleEmployee,
          });
          
          // Auto-asignar negocio del empleado si corresponde
          const contextBusinessId = wizardData.businessId || businessId || null;
          if (contextBusinessId && !initiatedFromEmployeeProfile) {
            updateWizardData({
              employeeBusinessId: contextBusinessId,
              employeeBusiness: wizardData.business || null,
            });
          }
          
          // Saltar directamente a fecha/hora
          setCurrentStep(getStepNumber('dateTime'));
          return;
        } else {
          // Saltar a selección de empleado
          setCurrentStep(getStepNumber('employee'));
          return;
        }
      } else {
        // Saltar a selección de servicio
        setCurrentStep(getStepNumber('service'));
        return;
      }
    }

    // ⭐ OPTIMIZACIÓN: Auto-seleccionar servicio si solo hay uno disponible en la ubicación
    if (currentStep === getStepNumber('service') && wizardData.locationId) {
      const servicesForLocation = dataCache.services.filter(service => 
        service.location_id === wizardData.locationId
      );
      
      if (servicesForLocation.length === 1) {
        const singleService = servicesForLocation[0];
        updateWizardData({
          serviceId: singleService.id,
          service: singleService,
        });
        
        // Verificar si también podemos auto-seleccionar el empleado
        const employeesForService = dataCache.employees.filter(employee =>
          dataCache.serviceEmployees.some(se => 
            se.service_id === singleService.id && se.employee_id === employee.id
          )
        );
        
        if (employeesForService.length === 1) {
          const singleEmployee = employeesForService[0];
          updateWizardData({
            employeeId: singleEmployee.id,
            employee: singleEmployee,
          });
          
          // Auto-asignar negocio del empleado si corresponde
          const contextBusinessId = wizardData.businessId || businessId || null;
          if (contextBusinessId && !initiatedFromEmployeeProfile) {
            updateWizardData({
              employeeBusinessId: contextBusinessId,
              employeeBusiness: wizardData.business || null,
            });
          }
          
          // Saltar directamente a fecha/hora
          setCurrentStep(getStepNumber('dateTime'));
          return;
        } else {
          // Saltar a selección de empleado
          setCurrentStep(getStepNumber('employee'));
          return;
        }
      }
    }

    // ⭐ OPTIMIZACIÓN: Auto-seleccionar empleado si solo hay uno disponible para el servicio
    if (currentStep === getStepNumber('employee') && wizardData.serviceId) {
      const employeesForService = dataCache.employees.filter(employee =>
        dataCache.serviceEmployees.some(se => 
          se.service_id === wizardData.serviceId && se.employee_id === employee.id
        )
      );
      
      if (employeesForService.length === 1) {
        const singleEmployee = employeesForService[0];
        updateWizardData({
          employeeId: singleEmployee.id,
          employee: singleEmployee,
        });
        
        // Auto-asignar negocio del empleado si corresponde
        const contextBusinessId = wizardData.businessId || businessId || null;
        if (contextBusinessId && !initiatedFromEmployeeProfile) {
          updateWizardData({
            employeeBusinessId: contextBusinessId,
            employeeBusiness: wizardData.business || null,
          });
        }
        
        // Saltar directamente a fecha/hora
        setCurrentStep(getStepNumber('dateTime'));
        return;
      }
    }

    // Si estamos en el paso de Employee y tiene múltiples negocios, validar primero
    if (currentStep === getStepNumber('employee') && needsEmployeeBusinessSelection) {
      // Validar que el empleado esté vinculado a al menos un negocio
      if (!isEmployeeOfAnyBusiness) {
        toast.error(t('appointments.wizard_errors.professionalNotAvailable'));
        return;
      }
      // Ir al paso de selección de negocio del empleado (solo si el flujo inició desde perfil del profesional)
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

    // Si NO iniciamos desde el perfil del profesional y hay negocio seleccionado en contexto,
    // auto-asignar ese negocio al empleado y saltar el paso 4
    if (currentStep === getStepNumber('employee') && !initiatedFromEmployeeProfile) {
      const contextBusinessId = wizardData.businessId || businessId || null;
      if (contextBusinessId) {
        updateWizardData({
          employeeBusinessId: contextBusinessId,
          employeeBusiness: wizardData.business || null,
        });
        setCurrentStep(getStepNumber('dateTime'));
        return;
      }
    }

    // Si el empleado no tiene negocios, no permitir continuar
    if (currentStep === getStepNumber('employee') && !isEmployeeOfAnyBusiness) {
      toast.error(t('appointments.wizard_errors.professionalCannotAccept'));
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

      // ✅ Resetear el ref de backfill al cerrar
      hasBackfilledRef.current = false;

      setCurrentStep(getStepNumber(getInitialStepLogical()));
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
      });
      onClose();
    }
  };

  const updateWizardData = React.useCallback((data: Partial<WizardData>) => {
    setWizardData(prev => ({ ...prev, ...data }));
  }, []);

  // Ref para evitar ejecuciones múltiples del backfill
  const hasBackfilledRef = React.useRef(false);

  // Backfill de sede y negocio cuando solo se recibe un servicio
  React.useEffect(() => {
    const backfillFromService = async () => {
      if (!preselectedServiceId) return;
      // Si ya ejecutamos el backfill, no hacer nada
      if (hasBackfilledRef.current) return;
      // Si ya tenemos business y location, no hacer nada
      if (wizardData.businessId && wizardData.locationId) return;

      try {
        // Buscar en tabla de relación dónde se ofrece el servicio
        const { data, error } = await supabase
          .from('employee_services')
          .select('business_id, location_id')
          .eq('service_id', preselectedServiceId)
          .eq('is_active', true);

        if (error) throw error;
        const rows = (data || []) as Array<{ business_id: string | null; location_id: string | null }>;
        const businessIds = Array.from(new Set(rows.map(r => r.business_id).filter(Boolean))) as string[];
        const locationIds = Array.from(new Set(rows.map(r => r.location_id).filter(Boolean))) as string[];

        const updates: Partial<WizardData> = {};
        if (!wizardData.businessId && businessIds.length === 1) {
          updates.businessId = businessIds[0];
        }
        if (!wizardData.locationId && locationIds.length === 1) {
          updates.locationId = locationIds[0];
        }

        if (Object.keys(updates).length > 0) {
          updateWizardData(updates);
          hasBackfilledRef.current = true; // ✅ Marcar como ejecutado
        }
      } catch (e) {
        // No bloquear el flujo si falla; sólo log
        console.warn('Backfill service→business/location failed', e);
      }
    };

    backfillFromService();
    // Solo ejecutar al abrir modal o cambiar preselección
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preselectedServiceId]);

  // Función para crear la cita usando el hook useSupabase
  const createAppointment = async () => {
    if (!wizardData.businessId || !wizardData.serviceId || !wizardData.date || !wizardData.startTime) {
      toast.error(t('appointments.wizard_errors.missingRequiredData'));
      return false;
    }

    if (!userId) {
      toast.error(t('appointments.wizard_errors.mustLogin'));
      return false;
    }

    setIsSubmitting(true);

    try {
      // Combinar fecha y hora
      // Nota: wizardData.startTime viene en formato "HH:MM AM/PM" (ej: "3:00 PM" o "10:30 AM")
      const timeRegex = /^(\d{1,2}):(\d{2})\s(AM|PM)$/i;
      const timeMatch = wizardData.startTime.match(timeRegex);
      
      if (!timeMatch) {
        throw new Error(`Formato de hora inválido: ${wizardData.startTime}`);
      }
      
      const [, hourStr, minuteStr, meridiem] = timeMatch;
      let hourNum = Number.parseInt(hourStr, 10);
      const minuteNum = Number.parseInt(minuteStr, 10);
      
      // Convertir formato 12h a 24h
      if (meridiem.toUpperCase() === 'PM' && hourNum !== 12) {
        hourNum += 12;
      } else if (meridiem.toUpperCase() === 'AM' && hourNum === 12) {
        hourNum = 0;
      }
      
      // DEBUG: Log para verificar valores
      console.log('🔍 DEBUG - Creación de cita:', {
        selectedTime: wizardData.startTime,
        hourStr, minuteStr, meridiem,
        hourNum24h: hourNum,
        minuteNum
      });
      
      // Obtener la fecha seleccionada en componentes locales
      const year = wizardData.date.getFullYear();
      const month = wizardData.date.getMonth();
      const day = wizardData.date.getDate();
      
      // Crear timestamp ajustando por zona horaria Colombia (UTC-5)
      // Si el usuario selecciona 3 PM en Colombia, queremos almacenar 3 PM UTC en la BD
      // Pero JavaScript UTC es UTC+0, así que calculamos: 3 PM + 5 horas = 8 PM UTC
      const colombiaTimezoneOffset = 5; // UTC-5, así que sumamos 5
      const utcTime = new Date(Date.UTC(year, month, day, hourNum + colombiaTimezoneOffset, minuteNum, 0));
      
      console.log('📌 DEBUG - Hora calculada:', {
        hourNum,
        colombiaTimezoneOffset,
        hourParaUTC: hourNum + colombiaTimezoneOffset,
        resultISO: utcTime.toISOString(),
        selectedDate: wizardData.date.toISOString()
      });
      
      // Calcular hora de fin (usar duración del servicio o 60 min por defecto)
      const duration = wizardData.service?.duration || 60;
      const endDateTime = new Date(utcTime);
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
        // Condicional: employee_id O resource_id (CHECK constraint: exactamente uno debe ser NOT NULL)
        employee_id: wizardData.employeeId || null,
        resource_id: wizardData.resourceId || null,
        start_time: utcTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status: 'pending' as const,
        notes: wizardData.notes || null,
      };

      // Determinar si es UPDATE (editando cita existente) o INSERT (nueva cita)
      if (appointmentToEdit) {
        // MODO EDICIÓN: Actualizar cita existente usando Supabase directo
        // (el hook useSupabase.createAppointment solo maneja creación)
        const { error } = await supabase
          .from('appointments')
          .update(appointmentData)
          .eq('id', appointmentToEdit.id)
          .select()
          .single();

        if (error) {
          toast.error(`${t('appointments.wizard_errors.errorModifying')}: ${error.message}`);
          return false;
        }

        toast.success(t('appointments.wizard_success.modified'));
      } else {
        // MODO CREACIÓN: Usar el hook useSupabase.createAppointment que incluye notificaciones
        console.log('🚀 [WIZARD] Usando useSupabase.createAppointment con notificaciones automáticas');
        await createAppointmentWithNotifications(appointmentData);

        // Track booking completed (conversión exitosa) - Solo para nuevas citas
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

        toast.success(t('appointments.wizard_success.created'));
      }
      
      // Llamar callback de éxito
      if (onSuccess) {
        onSuccess();
      }

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error inesperado';
      const errorKey = appointmentToEdit ? 'errorModifying' : 'errorCreating'
      const errorMessage = t('appointments.wizard_errors.' + errorKey)
      toast.error(`${errorMessage}: ${message}`);
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
      // Si negocio usa recursos físicos → Validar resourceId
      if (wizardData.business?.resource_model && wizardData.business.resource_model !== 'professional') {
        return wizardData.resourceId !== null;
      }
      // Si negocio usa modelo profesional → Validar employeeId
      return wizardData.employeeId !== null && isEmployeeOfAnyBusiness;
    }
    if (currentStep === getStepNumber('employeeBusiness')) {
      return wizardData.employeeBusinessId !== null;
    }
    if (currentStep === getStepNumber('dateTime')) {
      const canProc = wizardData.date !== null && wizardData.startTime !== null;
      // eslint-disable-next-line no-console
      console.log('🔘 canProceed dateTime:', {
        canProceed: canProc,
        date: wizardData.date,
        startTime: wizardData.startTime,
        step: currentStep,
      });
      return canProc;
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
          "bg-card text-foreground p-0 overflow-hidden !border-0 !shadow-none !flex !flex-col",
          "w-[98vw] sm:w-[95vw] md:w-[85vw] lg:w-[75vw]",
          "!max-w-[1200px]",
          "h-[95vh] sm:min-h-[600px] sm:max-h-[85vh]", // Full height mobile; stable desktop height
          "[&>button]:hidden" // Ocultar el botón de cerrar por defecto del DialogContent
        )}
      >
        {/* DialogTitle para accesibilidad (screen readers) */}
        <DialogTitle className="sr-only">
          {appointmentToEdit ? 'Editar Cita' : 'Nueva Cita'}
        </DialogTitle>
        {/* Header - Mobile Responsive */}
        {currentStep < getStepNumber('success') && (
          <div className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground truncate">
                {appointmentToEdit ? 'Editar Cita' : 'Nueva Cita'}
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
              currentStep={getEffectiveCurrentStep() + 1}
              totalSteps={getEffectiveTotalSteps()}
              label={STEP_LABELS_MAP[getEffectiveSteps()[getEffectiveCurrentStep()] as keyof typeof STEP_LABELS_MAP]}
              completedSteps={getCompletedSteps()}
            />
          </div>
        )}

        {/* Content Area - fills remaining space; footer stays bottom */}
        <div className={cn(
          "flex-1 overflow-y-auto px-3 sm:px-0"
        )}>
          {/* Paso 0: Selección de Negocio */}
          {!businessId && currentStep === getStepNumber('business') && (
            <BusinessSelection
              selectedBusinessId={wizardData.businessId}
              preferredCityName={preferredCityName}
              preferredRegionName={preferredRegionName}
              onSelectBusiness={(business) => {
                // Al seleccionar un negocio, limpiar campos dependientes.
                // NO avanzamos automáticamente: el usuario debe presionar "Next Step".
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
                  date: wizardData.date || preselectedDate || null,
                  startTime: wizardData.startTime || normalizePreselectedTime(preselectedTime) || null,
                  endTime: null,
                  notes: '',
                });
                // Nota: No llamar a setCurrentStep aquí para evitar avance automático.
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

          {/* Paso 3: Selección de Profesional o Recurso */}
          {currentStep === getStepNumber('employee') && (
            <>
              {/* Si el negocio usa modelo profesional o no tiene modelo definido → Mostrar EmployeeSelection */}
              {(!wizardData.business?.resource_model || wizardData.business.resource_model === 'professional') && (
                <EmployeeSelection
                  businessId={wizardData.businessId || businessId || ''}
                  locationId={wizardData.locationId || ''}
                  serviceId={wizardData.serviceId || ''}
                  selectedEmployeeId={wizardData.employeeId}
                  onSelectEmployee={(employee) => {
                    updateWizardData({ 
                      employeeId: employee.id, 
                      employee,
                      resourceId: null // Limpiar recurso si se selecciona empleado
                    });

                    // Si el flujo NO viene desde el perfil del profesional, auto-asignar el negocio de contexto
                    const contextBusinessId = (!initiatedFromEmployeeProfile) ? (wizardData.businessId || businessId || null) : null;
                    if (contextBusinessId) {
                      updateWizardData({
                        employeeBusinessId: contextBusinessId,
                        employeeBusiness: wizardData.business || null,
                      });
                    }
                  }}
                  isPreselected={!!preselectedEmployeeId}
                />
              )}

              {/* Si el negocio usa recursos físicos → Mostrar ResourceSelection */}
              {wizardData.business?.resource_model && 
               wizardData.business.resource_model !== 'professional' && (
                <ResourceSelection
                  businessId={wizardData.businessId || businessId || ''}
                  serviceId={wizardData.serviceId || ''}
                  locationId={wizardData.locationId || ''}
                  selectedResourceId={wizardData.resourceId || undefined}
                  onSelect={(resourceId) => {
                    updateWizardData({ 
                      resourceId,
                      employeeId: null, // Limpiar empleado si se selecciona recurso
                      employee: null
                    });
                  }}
                />
              )}
            </>
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
              employeeId={wizardData.employeeId}
              resourceId={wizardData.resourceId}
              locationId={wizardData.locationId}
              businessId={wizardData.businessId}
              appointmentToEdit={appointmentToEdit}
              onSelectDate={(date) => {
                updateWizardData({ date });
                // eslint-disable-next-line no-console
                console.log('📅 Fecha seleccionada:', date);
              }}
              onSelectTime={(startTime, endTime) => {
                updateWizardData({ startTime, endTime });
                // eslint-disable-next-line no-console
                console.log('⏰ Hora seleccionada:', startTime, 'Fin:', endTime);
              }}
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
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-start sm:justify-between gap-2 sm:gap-0">
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
                    <Hourglass size={16} weight="fill" className="animate-spin mr-2" />
                    {' '}
                    <span className="hidden sm:inline">Guardando...</span>
                    <span className="sm:hidden">Guardar...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} weight="bold" className="mr-1" />
                    <span className="hidden sm:inline">Confirmar y Reservar</span>
                    <Check size={16} weight="bold" className="mr-1 sm:hidden" />
                    <span className="sm:hidden">Confirmar</span>
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
