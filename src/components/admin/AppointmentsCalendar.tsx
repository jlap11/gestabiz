/* eslint-disable no-console */
import React, { useState, useEffect, useMemo, useRef, useLayoutEffect, useCallback } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, User, DollarSign, X, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { format, addDays, subDays, parseISO, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePreferredLocation } from '@/hooks/usePreferredLocation';

const DEFAULT_TIME_ZONE = 'America/Bogota';
const COLOMBIA_UTC_OFFSET = -5; // GMT-5
const DEBUG_MODE = import.meta.env.DEV; // Solo logs en desarrollo

const extractTimeZoneParts = (date: Date, timeZone: string = DEFAULT_TIME_ZONE) => {
  // Método 1: Intentar con toLocaleString
  try {
    const dateString = date.toLocaleString('en-US', { 
      timeZone, 
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    // Parse the formatted string: "MM/DD/YYYY, HH:MM:SS"
    const [datePart, timePart] = dateString.split(', ');
    const [month, day, year] = datePart.split('/').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);

    const result = {
      year,
      month,
      day,
      hour,
      minute,
    } as const;
    
    return result;
  } catch (error) {
    console.warn('⚠️ toLocaleString falló, usando offset manual', error);
  }
  
  // Método 2: Fallback con offset manual (más confiable)
  const utcTime = date.getTime();
  const colombiaTime = new Date(utcTime + (COLOMBIA_UTC_OFFSET * 60 * 60 * 1000));
  
  const result = {
    year: colombiaTime.getUTCFullYear(),
    month: colombiaTime.getUTCMonth() + 1,
    day: colombiaTime.getUTCDate(),
    hour: colombiaTime.getUTCHours(),
    minute: colombiaTime.getUTCMinutes(),
  } as const;
  
  return result;
};

const isSameDayInTimeZone = (dateA: Date, dateB: Date, timeZone: string = DEFAULT_TIME_ZONE) => {
  const partsA = extractTimeZoneParts(dateA, timeZone);
  const partsB = extractTimeZoneParts(dateB, timeZone);

  return partsA.year === partsB.year && partsA.month === partsB.month && partsA.day === partsB.day;
};

// Helper para formatear hora en zona horaria de Colombia
const formatTimeInColombia = (isoString: string): string => {
  const date = new Date(isoString);
  const { hour, minute } = extractTimeZoneParts(date, DEFAULT_TIME_ZONE);
  
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  
  return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`;
};

// Small portal dropdown that positions itself next to an anchor button
function DropdownPortal({ anchorRef, isOpen, onClose, children }: { anchorRef: React.RefObject<HTMLElement>, isOpen: boolean, onClose: () => void, children: React.ReactNode }) {
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);

  const update = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return setPos(null);
    const rect = anchor.getBoundingClientRect();
    setPos({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX, width: rect.width });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isOpen, update]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !pos) return null;

  // Flip horizontally/vertically if the menu would overflow the viewport
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const estimatedWidth = Math.max(pos.width, 200);
  const estimatedHeight = 240; // approx max-h-64

  let left = pos.left;
  // Horizontal flip
  if (left + estimatedWidth + 12 > viewportWidth) {
    left = Math.max(8, viewportWidth - estimatedWidth - 12);
  }

  // Vertical flip: if bottom overflows, show above anchor
  let top = pos.top;
  if (top + estimatedHeight > window.scrollY + viewportHeight) {
    // place above anchor
    const anchor = anchorRef.current;
    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      top = rect.top + window.scrollY - estimatedHeight - 6;
    }
  }

  const menu = (
    <div ref={portalRef} className="dropdown-portal" style={{ position: 'absolute', top, left, minWidth: estimatedWidth, zIndex: 9999 }}>
      {children}
    </div>
  );

  return createPortal(menu, document.body);
}

interface Employee {
  id: string;
  user_id: string;
  profile_name: string;
  profile_avatar?: string;
  lunch_break_start?: string | null;
  lunch_break_end?: string | null;
  has_lunch_break?: boolean;
  services?: string[]; // Servicios del empleado
}

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  service_name: string;
  service_price: number;
  client_name: string;
  employee_id: string;
  employee_name: string;
  location_id?: string;
  notes?: string;
}

interface LocationWithHours {
  id: string;
  name: string;
  opens_at: string | null;
  closes_at: string | null;
}

interface AppointmentModalProps {
  appointment: Appointment | null;
  onClose: () => void;
  onComplete: (appointmentId: string, tip: number) => void;
  onCancel: (appointmentId: string) => void;
  onNoShow: (appointmentId: string) => void;
}

const AppointmentModal = React.memo<AppointmentModalProps>(({ 
  appointment, 
  onClose, 
  onComplete, 
  onCancel,
  onNoShow 
}) => {
  const [tip, setTip] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!appointment) return null;

  const handleComplete = async () => {
    setIsProcessing(true);
    try {
      await onComplete(appointment.id, tip);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    setIsProcessing(true);
    try {
      await onCancel(appointment.id);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNoShow = async () => {
    setIsProcessing(true);
    try {
      await onNoShow(appointment.id);
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const isCompleted = appointment.status === 'completed';
  const isCancelled = appointment.status === 'cancelled';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-lg w-full my-auto max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Detalles de la Cita</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Cliente:</span>
              <span className="text-sm text-muted-foreground">{appointment.client_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Servicio:</span>
              <span className="text-sm text-muted-foreground">{appointment.service_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Horario:</span>
              <span className="text-sm text-muted-foreground">
                {formatTimeInColombia(appointment.start_time)} - {formatTimeInColombia(appointment.end_time)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Precio:</span>
              <span className="text-sm text-muted-foreground">
                ${appointment.service_price.toLocaleString('es-CO')} COP
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Empleado:</span>
              <span className="text-sm text-muted-foreground">{appointment.employee_name}</span>
            </div>
            {appointment.notes && (
              <div className="mt-2 p-2 bg-muted rounded-md">
                <span className="text-sm font-medium text-foreground">{t('admin.appointmentCalendar.notes')}:</span>
                <p className="text-sm text-muted-foreground mt-1">{appointment.notes || t('admin.appointmentCalendar.noNotes')}</p>
              </div>
            )}
          </div>

          {!isCompleted && !isCancelled && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {t('admin.appointmentCalendar.tipLabel')}
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="number"
                  value={tip}
                  onChange={(e) => setTip(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-md text-foreground"
                  placeholder="0"
                  min="0"
                  step="1000"
                />
              </div>
            </div>
          )}

          {isCompleted && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md">
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                <Check className="h-4 w-4" />
                Cita completada
              </p>
            </div>
          )}

          {isCancelled && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <X className="h-4 w-4" />
                Cita cancelada
              </p>
            </div>
          )}
        </div>

        {!isCompleted && !isCancelled && (
          <div className="p-4 border-t border-border flex gap-3">
            <button
              onClick={handleComplete}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-4 w-4 inline mr-2" />
              Marcar Completada
            </button>
            <button
              onClick={handleNoShow}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <AlertCircle className="h-4 w-4 inline mr-2" />
              Sin Asistencia
            </button>
            <button
              onClick={handleCancel}
              disabled={isProcessing}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-4 w-4 inline mr-2" />
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export const AppointmentsCalendar: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const isSelectedDateToday = useMemo(
    () => isSameDayInTimeZone(selectedDate, new Date()),
    [selectedDate]
  );
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const timelineRef = useRef<HTMLDivElement>(null);
  const statusBtnRef = useRef<HTMLButtonElement>(null);
  const locationBtnRef = useRef<HTMLButtonElement>(null);
  const serviceBtnRef = useRef<HTMLButtonElement>(null);
  const employeeBtnRef = useRef<HTMLButtonElement>(null);
  const [showServices, setShowServices] = useState(true);
  const [showFilters, setShowFilters] = useState(true);

  // Filter states - now as arrays for multi-select
  const [filterStatus, setFilterStatus] = useState<string[]>(['confirmed']);
  const [filterLocation, setFilterLocation] = useState<string[]>([]);
  const [filterService, setFilterService] = useState<string[]>([]);
  const [filterEmployee, setFilterEmployee] = useState<string[]>([]);
  const [locations, setLocations] = useState<LocationWithHours[]>([]);
  const [services, setServices] = useState<Array<{ id: string; name: string }>>([]);
  
  // Dropdown open/close states
  const [openDropdowns, setOpenDropdowns] = useState({
    status: false,
    location: false,
    service: false,
    employee: false
  });
  // Obtener la configuración de sede preferida
  const [currentBusinessId, setCurrentBusinessId] = useState<string | undefined>(undefined);
  const { preferredLocationId } = usePreferredLocation(currentBusinessId);

  // Colores pastel para las columnas de empleados
  const employeeColors = [
    'bg-blue-50/30 dark:bg-blue-950/10',
    'bg-purple-50/30 dark:bg-purple-950/10',
    'bg-pink-50/30 dark:bg-pink-950/10',
    'bg-green-50/30 dark:bg-green-950/10',
    'bg-yellow-50/30 dark:bg-yellow-950/10',
    'bg-indigo-50/30 dark:bg-indigo-950/10',
    'bg-red-50/30 dark:bg-red-950/10',
    'bg-teal-50/30 dark:bg-teal-950/10',
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // If click is inside any anchor button, do nothing
      if (statusBtnRef.current?.contains(target) || locationBtnRef.current?.contains(target) || serviceBtnRef.current?.contains(target) || employeeBtnRef.current?.contains(target)) {
        return;
      }

      // If click is inside any dropdown portal, do nothing (allow interactions)
      if (document.querySelector('.dropdown-portal')?.contains(target)) {
        return;
      }

      setOpenDropdowns({ status: false, location: false, service: false, employee: false });
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Load cached filters when businessId becomes available
  useEffect(() => {
    if (!currentBusinessId) return;
    try {
      const raw = localStorage.getItem(`appointments-filters-${currentBusinessId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.status) setFilterStatus(parsed.status);
        if (parsed.location) setFilterLocation(parsed.location);
        if (parsed.service) setFilterService(parsed.service);
        if (parsed.employee) setFilterEmployee(parsed.employee);
      }
    } catch (e) {
      console.warn('Failed to load cached filters', e);
    }
  }, [currentBusinessId]);

  // Persist filters to localStorage when they change
  useEffect(() => {
    if (!currentBusinessId) return;
    const payload = { status: filterStatus, location: filterLocation, service: filterService, employee: filterEmployee };
    try {
      localStorage.setItem(`appointments-filters-${currentBusinessId}`, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to persist filters', e);
    }
  }, [currentBusinessId, filterStatus, filterLocation, filterService, filterEmployee]);

  // useRef para prevenir llamados duplicados simultáneos
  const isFetchingRef = useRef(false);

  const fetchAppointments = useCallback(async (businessId: string, date: Date) => {
    // Protección contra llamados duplicados
    if (isFetchingRef.current) {
      if (DEBUG_MODE) console.log('⚠️ [fetchAppointments] Ya hay un fetch en progreso, ignorando...');
      return;
    }

    isFetchingRef.current = true;

    try {
      // Usar zona horaria de Colombia para los límites del día
      const { year, month, day } = extractTimeZoneParts(date, DEFAULT_TIME_ZONE);
      
      // Crear fecha inicio del día en Colombia (00:00:00)
      const start = new Date(Date.UTC(year, month - 1, day, 5, 0, 0, 0)); // UTC+5 = Colombia 00:00
      
      // Crear fecha fin del día en Colombia (23:59:59)
      const end = new Date(Date.UTC(year, month - 1, day + 1, 4, 59, 59, 999)); // UTC+5 = Colombia 23:59:59

      if (DEBUG_MODE) {
        console.log('📅 [fetchAppointments] Buscando citas para:', {
          fecha: format(date, 'yyyy-MM-dd'),
          colombiaStart: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 00:00:00`,
          colombiaEnd: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 23:59:59`,
          utcStart: start.toISOString(),
          utcEnd: end.toISOString()
        });
      }

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          status,
          notes,
          employee_id,
          location_id,
          services!inner (
            id,
            name,
            price
          ),
          profiles!inner (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('business_id', businessId)
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time');

      if (error) {
        console.error('❌ Error al buscar citas:', error);
        return;
      }

      if (DEBUG_MODE) {
        console.log(`✅ Citas encontradas: ${data?.length || 0}`);
        if (data && data.length > 0) {
          console.log('📋 [DEBUG] Raw appointment data:', data[0]);
        }
      }

      // Obtener IDs de empleados únicos
      const employeeIds = Array.from(new Set((data || []).map(apt => apt.employee_id as string).filter(Boolean)));

      // Si hay empleados, obtener sus nombres
      let employeeNames: Record<string, string> = {};
      if (employeeIds.length > 0) {
        const { data: employeeData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', employeeIds);

        employeeNames = (employeeData || []).reduce((acc, emp: Record<string, unknown>) => {
          const empId = emp.id as string;
          const fullName = (emp.full_name as string) || 'Sin asignar';
          acc[empId] = fullName;
          return acc;
        }, {} as Record<string, string>);
        
        if (DEBUG_MODE) console.log('👥 [fetchAppointments] Nombres de empleados cargados:', employeeNames);
      }

      const formattedAppointments: Appointment[] = (data || []).map((apt: Record<string, unknown>) => ({
        id: apt.id as string,
        start_time: apt.start_time as string,
        end_time: apt.end_time as string,
        status: apt.status as string,
        service_name: (apt.service as Record<string, unknown>)?.name as string || 'Servicio sin nombre',
        service_price: (apt.service as Record<string, unknown>)?.price as number || 0,
        client_name: (apt.client as Record<string, unknown>)?.full_name as string || 'Cliente sin nombre',
        employee_id: (apt.employee_id as string) || '',
        employee_name: employeeNames[(apt.employee_id as string)] || 'Sin asignar',
        location_id: (apt.location_id as string) || '',
        notes: apt.notes as string | undefined
      }));

      if (DEBUG_MODE) {
        console.log('📦 [fetchAppointments] Citas formateadas:', formattedAppointments);
        console.log('📊 [fetchAppointments] Resumen:', {
          total: formattedAppointments.length,
          employees: employeeIds,
          employeeNames: employeeNames,
          appointments: formattedAppointments.map(a => ({
            id: a.id,
            cliente: a.client_name,
            empleado: a.employee_name,
            employee_id: a.employee_id,
            hora: a.start_time,
            estado: a.status
          }))
        });
        
        // DEBUG: Mostrar employee_ids de las citas vs los cargados
        console.log('🔴 [DEBUG] Comparar employee_ids:', {
          appointmentEmployeeIds: formattedAppointments.map(a => a.employee_id),
          loadedEmployees: employees.map(e => ({ id: e.id, user_id: e.user_id }))
        });
      }

      setAppointments(formattedAppointments);
    } finally {
      isFetchingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ SIN dependencias: fetch solo carga datos de BD, no usa state

  // Fetch business and location data - DEBE ESTAR DESPUÉS DE fetchAppointments
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        // Get business owned by user
        const { data: businesses, error: businessError } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', user.id);

        if (businessError) throw businessError;
        
        if (!businesses || businesses.length === 0) {
          throw new Error('No se encontraron negocios para este usuario');
        }

        // Use the first business (most common case is one business per admin)
        const business = businesses[0];
        setCurrentBusinessId(business.id);

        // Get all locations for filter with their hours
        const { data: locationsData, error: locationError } = await supabase
          .from('locations')
          .select('id, name, opens_at, closes_at')
          .eq('business_id', business.id);

        if (locationError) throw locationError;

        const formattedLocations: LocationWithHours[] = (locationsData || []).map(loc => ({
          id: loc.id,
          name: loc.name,
          opens_at: loc.opens_at as string | null,
          closes_at: loc.closes_at as string | null,
        }));

        setLocations(formattedLocations);

        // Get employees with lunch break info and their services
        const { data: employeesData, error: employeesError } = await supabase
          .from('business_employees')
          .select('id, employee_id, lunch_break_start, lunch_break_end, has_lunch_break')
          .eq('business_id', business.id)
          .eq('status', 'approved')
          .eq('is_active', true);

        if (employeesError) throw employeesError;

        // Get employee profiles separately
        const employeeIds = (employeesData || []).map(e => e.employee_id);
        const { data: profilesData } = employeeIds.length > 0
          ? await supabase
              .from('profiles')
              .select('id, full_name, avatar_url')
              .in('id', employeeIds)
          : { data: [] };

        // Map profiles by ID for easy lookup
        const profilesMap = (profilesData || []).reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {} as Record<string, { full_name: string; avatar_url: string | null }>);

        // Get employee services
        const { data: employeeServicesData } = employeeIds.length > 0
          ? await supabase
              .from('employee_services')
              .select('employee_id, service_id, services(name)')
              .in('employee_id', employeeIds)
          : { data: [] };

        // Map services by employee_id
        const servicesMap = (employeeServicesData || []).reduce((acc, es) => {
          if (!acc[es.employee_id]) {
            acc[es.employee_id] = [];
          }
          if (es.services && typeof es.services === 'object' && 'name' in es.services) {
            acc[es.employee_id].push(es.services.name as string);
          }
          return acc;
        }, {} as Record<string, string[]>);

        const formattedEmployees = (employeesData || []).map(emp => {
          const profile = profilesMap[emp.employee_id];
          return {
            id: emp.id,
            user_id: emp.employee_id,
            profile_name: profile?.full_name || 'Sin nombre',
            profile_avatar: profile?.avatar_url || undefined,
            lunch_break_start: emp.lunch_break_start,
            lunch_break_end: emp.lunch_break_end,
            has_lunch_break: emp.has_lunch_break,
            services: servicesMap[emp.employee_id] || []
          };
        });

        setEmployees(formattedEmployees);
        if (DEBUG_MODE) {
          console.log('👨‍💼 [AppointmentsCalendar] Empleados cargados:', {
            total: formattedEmployees.length,
            empleados: formattedEmployees.map(e => ({ id: e.id, nombre: e.profile_name }))
          });
        }

        // Get services for this business
        const { data: servicesData } = await supabase
          .from('services')
          .select('id, name')
          .eq('business_id', business.id);
        
        if (servicesData) {
          setServices(servicesData.map(s => ({ id: s.id, name: s.name })));
        }

        // Nota: fetchAppointments se llamará desde el siguiente effect
        // cuando business.id esté disponible
      } catch (error) {
        console.error('Error al cargar datos del calendario de citas', error);
        toast.error('Error al cargar los datos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]); // Solo depende de user, no de fetchAppointments para evitar ciclos

  // Fetch appointments cuando currentBusinessId o selectedDate cambian
  useEffect(() => {
    if (!currentBusinessId) return;
    
    if (DEBUG_MODE) {
      console.log('🔄 [Effect] Fetch appointments disparado por:', {
        currentBusinessId,
        selectedDate: format(selectedDate, 'yyyy-MM-dd')
      });
    }
    
    fetchAppointments(currentBusinessId, selectedDate);
  }, [currentBusinessId, selectedDate, fetchAppointments]);

  // Persist filters to localStorage when they change
  useEffect(() => {
    if (!currentBusinessId) return;
    const payload = { status: filterStatus, location: filterLocation, service: filterService, employee: filterEmployee };
    try {
      localStorage.setItem(`appointments-filters-${currentBusinessId}`, JSON.stringify(payload));
    } catch (e) {
      console.warn('Failed to persist filters', e);
    }
  }, [currentBusinessId, filterStatus, filterLocation, filterService, filterEmployee]);

  const handleCompleteAppointment = async (appointmentId: string, tip: number) => {
    try {
      // Update appointment status
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', appointmentId);

      if (updateError) throw updateError;

      // Get appointment details
      const appointment = appointments.find(a => a.id === appointmentId);
      if (!appointment) return;

      // Create transaction (sale)
      const totalAmount = appointment.service_price + tip;
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          business_id: currentBusinessId,
          type: 'income',
          amount: totalAmount,
          description: `Cita completada - ${appointment.service_name}`,
          category: 'service',
          date: new Date().toISOString(),
          payment_method: 'cash',
          notes: tip > 0 ? `Propina: $${tip.toLocaleString('es-CO')}` : undefined
        });

      if (transactionError) throw transactionError;

      toast.success(t('admin.appointmentCalendar.successCompleted'));
      
      // Refresh appointments
      if (currentBusinessId) {
        await fetchAppointments(currentBusinessId, selectedDate);
      }
    } catch (error) {
      console.error('Error al completar la cita en el calendario admin', error);
      toast.error(t('admin.appointmentCalendar.errorCompleting'));
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId);

      if (error) throw error;

      toast.success(t('admin.appointmentCalendar.successCancelled'));
      
      // Refresh appointments
      if (currentBusinessId) {
        await fetchAppointments(currentBusinessId, selectedDate);
      }
    } catch {
      toast.error(t('admin.appointmentCalendar.errorCancelling'));
    }
  };

  const handleNoShow = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'cancelled',
          notes: 'Cliente no se presentó'
        })
        .eq('id', appointmentId);

      if (error) throw error;

      toast.warning('Cita marcada como sin asistencia');
      
      // Refresh appointments
      if (currentBusinessId) {
        await fetchAppointments(currentBusinessId, selectedDate);
      }
    } catch {
      toast.error('Error al marcar sin asistencia');
    }
  };

  // Generate hours array (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Calcular horario operativo basado en configuración y filtros
  const operatingHours = useMemo((): { openHour: number; closeHour: number } | null => {
    if (DEBUG_MODE) {
      console.log('🕐 [operatingHours] Calculando horario operativo...');
      console.log('  - Total locations:', locations.length);
      console.log('  - preferredLocationId:', preferredLocationId);
      console.log('  - filterLocation:', filterLocation);
    }
    
    // Determinar qué sedes considerar
    let selectedLocations: LocationWithHours[] = [];
    
    if (preferredLocationId && filterLocation.length === 0) {
      // Si hay sede configurada y no hay filtros, usar solo esa
      const preferred = locations.find(l => l.id === preferredLocationId);
      if (preferred) {
        selectedLocations = [preferred];
        if (DEBUG_MODE) console.log('  ✅ Usando sede preferida:', preferred.name, preferred);
      } else {
        if (DEBUG_MODE) console.log('  ⚠️ Sede preferida no encontrada en locations');
      }
    } else if (filterLocation.length > 0) {
      // Si hay filtros aplicados, usar solo las sedes filtradas
      selectedLocations = locations.filter(l => filterLocation.includes(l.id));
      if (DEBUG_MODE) console.log('  ✅ Usando sedes filtradas:', selectedLocations.map(l => l.name));
    } else {
      // Si no hay filtros ni sede preferida, usar todas
      selectedLocations = locations;
      if (DEBUG_MODE) console.log('  ✅ Usando todas las sedes:', selectedLocations.map(l => l.name));
    }

    // Si no hay sedes o más de una sede con horarios diferentes, no hacer scroll automático
    if (selectedLocations.length === 0) {
      if (DEBUG_MODE) console.log('  ❌ No hay sedes seleccionadas');
      return null;
    }
    
    // Verificar si todas las sedes tienen el mismo horario
    const firstOpens = selectedLocations[0]?.opens_at;
    const firstCloses = selectedLocations[0]?.closes_at;
    
    if (!firstOpens || !firstCloses) {
      if (DEBUG_MODE) console.log('  ❌ Primera sede no tiene horarios definidos');
      return null;
    }
    
    if (DEBUG_MODE) console.log('  - Primer horario encontrado:', { opens_at: firstOpens, closes_at: firstCloses });
    
    const allSameSchedule = selectedLocations.every(
      loc => loc.opens_at === firstOpens && loc.closes_at === firstCloses
    );
    
    if (!allSameSchedule) {
      if (DEBUG_MODE) {
        console.log('  ❌ Las sedes tienen horarios diferentes, no aplicar scroll automático');
        selectedLocations.forEach(loc => {
          console.log(`    - ${loc.name}: ${loc.opens_at} - ${loc.closes_at}`);
        });
      }
      return null;
    }
    
    // Todas tienen el mismo horario
    const openHour = Number.parseInt(firstOpens.split(':')[0], 10);
    const closeHour = Number.parseInt(firstCloses.split(':')[0], 10);
    
    if (DEBUG_MODE) {
      console.log('  ✅ Todas las sedes tienen el mismo horario');
      console.log('  - Hora apertura:', openHour, ':00');
      console.log('  - Hora cierre:', closeHour, ':00');
    }
    
    return { openHour, closeHour };
  }, [locations, preferredLocationId, filterLocation]);

  // Check if hour is within business hours (for styling)
  const isBusinessHour = (hour: number): boolean => {
    if (!operatingHours) return true; // Si no hay horarios definidos, mostrar todas las horas
    return hour >= operatingHours.openHour && hour < operatingHours.closeHour;
  };

  // Filtrar citas según los filtros seleccionados
  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      // Filtro de estado - si está vacío, mostrar todas
      if (filterStatus.length > 0 && !filterStatus.includes(apt.status)) {
        return false;
      }

      // Filtro de ubicación - si está vacío, mostrar todas
      if (filterLocation.length > 0 && !filterLocation.includes(apt.location_id || '')) {
        return false;
      }

      // Filtro de servicio - si está vacío, mostrar todas
      if (filterService.length > 0 && !filterService.includes(apt.service_name)) {
        return false;
      }

      // Filtro de empleado - si está vacío, mostrar todas
      if (filterEmployee.length > 0 && !filterEmployee.includes(apt.employee_id)) {
        return false;
      }

      return true;
    });
  }, [appointments, filterStatus, filterLocation, filterService, filterEmployee]);

  // Pre-calcular mapa de citas por empleado y hora (OPTIMIZACIÓN: evita 24+ filtros por render)
  const appointmentsBySlot = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    
    filteredAppointments.forEach(apt => {
      const aptDate = new Date(apt.start_time);
      const { hour: aptHourColombia } = extractTimeZoneParts(aptDate, DEFAULT_TIME_ZONE);
      const key = `${apt.employee_id}-${aptHourColombia}`;
      
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(apt);
    });
    
    return map;
  }, [filteredAppointments]);

  // Get appointments for specific employee and hour (ahora usa el mapa precalculado)
  const getAppointmentsForSlot = useCallback((employeeId: string, hour: number): Appointment[] => {
    const key = `${employeeId}-${hour}`;
    return appointmentsBySlot.get(key) || [];
  }, [appointmentsBySlot]);

  // Get active and overdue appointments
  const activeAppointments = useMemo(() => {
    const now = new Date();
    const result = appointments.filter(apt => {
      const start = parseISO(apt.start_time);
      const end = parseISO(apt.end_time);
      return apt.status === 'confirmed' && isWithinInterval(now, { start, end });
    });
    if (DEBUG_MODE) {
      console.log('🎯 [activeAppointments] Citas en proceso:', {
        total: result.length,
        citas: result.map(a => ({ id: a.id, cliente: a.client_name, hora: a.start_time }))
      });
    }
    return result;
  }, [appointments]);

  const overdueAppointments = useMemo(() => {
    const now = new Date();
    const result = appointments.filter(apt => {
      const end = parseISO(apt.end_time);
      return apt.status === 'confirmed' && end < now;
    });
    if (DEBUG_MODE) {
      console.log('⏰ [overdueAppointments] Citas pendientes de confirmar:', {
        total: result.length,
        citas: result.map(a => ({ id: a.id, cliente: a.client_name, horaFin: a.end_time }))
      });
    }
    return result;
  }, [appointments]);

  // Calculate current time position using Colombia timezone
  const currentTimePosition = useMemo(() => {
    if (!isSelectedDateToday) return null;

    const now = new Date();
    const { hour, minute } = extractTimeZoneParts(now, DEFAULT_TIME_ZONE);
    
    // Log detallado para debugging (solo en dev)
    if (DEBUG_MODE) {
      console.log('🕐 [Calendario] Debugging hora actual:');
      console.log('  - Hora sistema (UTC):', now.toISOString());
      console.log('  - Hora Colombia extraída:', `${hour}:${minute}`);
      console.log('  - Total minutos desde medianoche:', hour * 60 + minute);
    }
    
    // Calcular posición relativa a las 24 horas completas
    const totalMinutesInDay = 24 * 60;
    const currentMinutes = hour * 60 + minute;
    const percentage = (currentMinutes / totalMinutesInDay) * 100;
    
    if (DEBUG_MODE) {
      console.log('  - Porcentaje calculado:', `${percentage.toFixed(2)}%`);
      console.log('  - Debe aparecer en la hora:', hour);
    }

    return percentage;
  }, [isSelectedDateToday]);

  // Scroll automático al horario de operación o a la hora actual
  useEffect(() => {
    if (DEBUG_MODE) {
      console.log('📜 [ScrollEffect] Ejecutando scroll automático...');
      console.log('  - showFilters:', showFilters);
      console.log('  - timelineRef.current:', !!timelineRef.current);
    }
    
    if (!timelineRef.current && DEBUG_MODE) {
      console.log('  ⚠️ Ref no está disponible en el primer intento');
    }

    // Usar múltiples intentos para asegurar que el DOM esté listo
    const attemptScroll = (attempt = 0, maxAttempts = 5) => {
      if (!timelineRef.current && attempt < maxAttempts) {
        if (DEBUG_MODE) console.log(`  🔄 Reintentando (${attempt + 1}/${maxAttempts})...`);
        setTimeout(() => attemptScroll(attempt + 1, maxAttempts), 200);
        return;
      }

      if (!timelineRef.current) {
        if (DEBUG_MODE) console.log('  ❌ No se pudo acceder al ref después de intentos');
        return;
      }

      const scrollHeight = timelineRef.current.scrollHeight;
      const containerHeight = timelineRef.current.clientHeight;
      let scrollPosition = 0;

      if (DEBUG_MODE) {
        console.log('  ✅ Ref encontrado en intento', attempt + 1);
        console.log('  - scrollHeight:', scrollHeight);
        console.log('  - containerHeight:', containerHeight);
        console.log('  - isSelectedDateToday:', isSelectedDateToday);
        console.log('  - currentTimePosition:', currentTimePosition);
        console.log('  - operatingHours:', operatingHours);
      }

      // Prioridad 1: Si es hoy y tenemos posición actual, scroll a hora actual
      if (isSelectedDateToday && currentTimePosition !== null) {
        const linePxPosition = (currentTimePosition / 100) * scrollHeight;
        scrollPosition = linePxPosition - (containerHeight / 2);
        if (DEBUG_MODE) {
          console.log('  ✅ PRIORIDAD 1: Scroll a hora actual');
          console.log('    - linePxPosition:', linePxPosition);
          console.log('    - scrollPosition final:', scrollPosition);
        }
      } 
      // Prioridad 2: Si tenemos horario operativo, scroll al inicio del horario
      else if (operatingHours) {
        // Calcular el porcentaje donde empieza el día laboral
        const openPercentage = (operatingHours.openHour / 24) * 100;
        const openPxPosition = (openPercentage / 100) * scrollHeight;
        // Dejar un poco de margen arriba (restar 50px)
        scrollPosition = Math.max(0, openPxPosition - 50);
        if (DEBUG_MODE) {
          console.log('  ✅ PRIORIDAD 2: Scroll a hora de apertura');
          console.log('    - openHour:', operatingHours.openHour);
          console.log('    - openPercentage:', openPercentage, '%');
          console.log('    - openPxPosition:', openPxPosition);
          console.log('    - scrollPosition final (con margen -50px):', scrollPosition);
        }
      } else {
        if (DEBUG_MODE) console.log('  ⏭️ Sin condiciones de scroll, permanece en top');
      }

      if (DEBUG_MODE) console.log('  🎯 Aplicando scrollTo:', Math.max(0, scrollPosition));
      if (timelineRef.current) {
        timelineRef.current.scrollTo({
          top: Math.max(0, scrollPosition),
          behavior: 'auto'
        });
      }
    };

    // Iniciar los intentos con delay inicial más largo
    setTimeout(() => attemptScroll(0, 5), 500);
  }, [isSelectedDateToday, currentTimePosition, operatingHours, selectedDate, showFilters]);

  // Check if hour is within employee's lunch break
  const isLunchBreak = (hour: number, employee: Employee): boolean => {
    if (!employee.has_lunch_break || !employee.lunch_break_start || !employee.lunch_break_end) {
      return false;
    }
    
    const lunchStart = Number.parseInt(employee.lunch_break_start.split(':')[0]);
    const lunchEnd = Number.parseInt(employee.lunch_break_end.split(':')[0]);
    
    return hour >= lunchStart && hour < lunchEnd;
  };

  // Get appointment status class
  const getAppointmentClass = (status: string): string => {
    if (status === 'pending') {
      return 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-700 dark:text-yellow-300';
    }
    if (status === 'confirmed') {
      return 'bg-blue-500/20 border border-blue-500/50 text-blue-700 dark:text-blue-300';
    }
    if (status === 'completed') {
      return 'bg-green-500/20 border border-green-500/50 text-green-700 dark:text-green-300';
    }
    return 'bg-red-500/20 border border-red-500/50 text-red-700 dark:text-red-300';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Cargando calendario...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Console log for debugging - outside JSX (solo en dev) */}
      {DEBUG_MODE && (() => {
        console.log('📋 [RENDER] Estado actual del calendario:', {
          totalAppointments: appointments.length,
          filteredAppointments: filteredAppointments.length,
          totalEmployees: employees.length,
          selectedDate: format(selectedDate, 'yyyy-MM-dd', { locale: es })
        });
        return null;
      })()}
      
      {/* Header with date navigation */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Calendario de Citas</h2>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            className="p-2 hover:bg-muted rounded-md"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-foreground">
              {format(selectedDate, 'EEEE', { locale: es })}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(selectedDate, 'dd MMMM yyyy', { locale: es })}
            </div>
          </div>
          
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="p-2 hover:bg-muted rounded-md"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90"
          >
            Hoy
          </button>
        </div>
      </div>

      {/* Filters Panel - Custom Dropdowns with Checkboxes */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFilterStatus(['confirmed']);
                setFilterService([]);
                setFilterLocation([]);
                setFilterEmployee([]);
              }}
              className="px-3 py-1.5 text-xs bg-background hover:bg-muted text-muted-foreground hover:text-foreground rounded-md transition-colors font-medium border border-border"
            >
              Limpiar
            </button>
            <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${showFilters ? 'rotate-90' : ''}`} />
          </div>
        </button>

        {showFilters && (
          <div className="px-4 py-4 bg-background space-y-3">
            <div className="flex flex-wrap gap-3">
              {/* Estado Dropdown */}
              <div className="relative">
                <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1">Estado</label>
                <button
                  ref={statusBtnRef}
                  onClick={() => setOpenDropdowns(prev => ({ ...prev, status: !prev.status }))}
                  className="px-3 py-2 pr-8 text-sm border border-border rounded-md bg-background dark:bg-slate-900 text-foreground hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all min-w-[160px] flex items-center justify-between"
                >
                  <span className="truncate">{filterStatus.length} seleccionados</span>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground ml-2 transition-transform ${openDropdowns.status ? 'rotate-90' : ''}`} />
                </button>
                <DropdownPortal anchorRef={statusBtnRef} isOpen={openDropdowns.status} onClose={() => setOpenDropdowns(prev => ({ ...prev, status: false }))}>
                  <div className="bg-background dark:bg-slate-900 border border-border rounded-md shadow-lg max-h-64 overflow-y-auto">
                    <div className="px-2 py-2 border-b border-border">
                      <button
                        className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-muted/40 rounded"
                        onClick={() => setFilterStatus(['pending', 'confirmed', 'cancelled', 'completed'])}
                      >
                        Seleccionar Todos
                      </button>
                    </div>
                    {['pending', 'confirmed', 'cancelled', 'completed'].map(status => (
                      <label key={status} className="flex items-center px-3 py-2 hover:bg-muted/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filterStatus.includes(status)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilterStatus([...filterStatus, status]);
                            } else {
                              setFilterStatus(filterStatus.filter(s => s !== status));
                            }
                          }}
                          className="w-4 h-4 rounded border-2 border-muted-foreground/40 bg-slate-100 dark:bg-slate-800 checked:bg-primary checked:border-primary dark:checked:bg-primary focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
                        />
                        <span className="ml-2 text-sm text-foreground">
                          {status === 'pending' && 'Pendiente'}
                          {status === 'confirmed' && 'Confirmada'}
                          {status === 'cancelled' && 'Cancelada'}
                          {status === 'completed' && 'Completada'}
                        </span>
                      </label>
                    ))}
                  </div>
                </DropdownPortal>
              </div>

              {/* Sede Dropdown */}
              <div className="relative">
                <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1">Sede</label>
                <button
                  ref={locationBtnRef}
                  onClick={() => setOpenDropdowns(prev => ({ ...prev, location: !prev.location }))}
                  className="px-3 py-2 pr-8 text-sm border border-border rounded-md bg-background dark:bg-slate-900 text-foreground hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all min-w-[160px] flex items-center justify-between"
                >
                  <span className="truncate">{filterLocation.length} seleccionadas</span>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground ml-2 transition-transform ${openDropdowns.location ? 'rotate-90' : ''}`} />
                </button>
                <DropdownPortal anchorRef={locationBtnRef} isOpen={openDropdowns.location} onClose={() => setOpenDropdowns(prev => ({ ...prev, location: false }))}>
                  <div className="bg-background dark:bg-slate-900 border border-border rounded-md shadow-lg max-h-64 overflow-y-auto">
                    <div className="px-2 py-2 border-b border-border">
                      <button
                        className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-muted/40 rounded"
                        onClick={() => setFilterLocation(locations.map(l => l.id))}
                      >
                        Seleccionar Todos
                      </button>
                    </div>
                    {locations.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground italic">Sin sedes</div>
                    ) : (
                      locations.map(location => (
                        <label key={location.id} className="flex items-center px-3 py-2 hover:bg-muted/50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filterLocation.includes(location.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilterLocation([...filterLocation, location.id]);
                              } else {
                                setFilterLocation(filterLocation.filter(l => l !== location.id));
                              }
                            }}
                            className="w-4 h-4 rounded border-2 border-muted-foreground/40 bg-slate-100 dark:bg-slate-800 checked:bg-primary checked:border-primary dark:checked:bg-primary focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
                          />
                          <span className="ml-2 text-sm text-foreground truncate">{location.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                </DropdownPortal>
              </div>

              {/* Servicio Dropdown */}
              <div className="relative">
                <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1">Servicio</label>
                <button
                  ref={serviceBtnRef}
                  onClick={() => setOpenDropdowns(prev => ({ ...prev, service: !prev.service }))}
                  className="px-3 py-2 pr-8 text-sm border border-border rounded-md bg-background dark:bg-slate-900 text-foreground hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all min-w-[160px] flex items-center justify-between"
                >
                  <span className="truncate">{filterService.length} seleccionados</span>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground ml-2 transition-transform ${openDropdowns.service ? 'rotate-90' : ''}`} />
                </button>
                <DropdownPortal anchorRef={serviceBtnRef} isOpen={openDropdowns.service} onClose={() => setOpenDropdowns(prev => ({ ...prev, service: false }))}>
                  <div className="bg-background dark:bg-slate-900 border border-border rounded-md shadow-lg max-h-64 overflow-y-auto">
                    <div className="px-2 py-2 border-b border-border">
                      <button
                        className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-muted/40 rounded"
                        onClick={() => setFilterService(services.map(s => s.name))}
                      >
                        Seleccionar Todos
                      </button>
                    </div>
                    {services.map(service => (
                      <label key={service.id} className="flex items-center px-3 py-2 hover:bg-muted/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filterService.includes(service.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilterService([...filterService, service.name]);
                            } else {
                              setFilterService(filterService.filter(s => s !== service.name));
                            }
                          }}
                          className="w-4 h-4 rounded border-2 border-muted-foreground/40 bg-slate-100 dark:bg-slate-800 checked:bg-primary checked:border-primary dark:checked:bg-primary focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
                        />
                        <span className="ml-2 text-sm text-foreground truncate">{service.name}</span>
                      </label>
                    ))}
                  </div>
                </DropdownPortal>
              </div>

              {/* Profesional Dropdown */}
              <div className="relative">
                <label className="block text-xs font-bold text-foreground uppercase tracking-wide mb-1">Profesional</label>
                <button
                  ref={employeeBtnRef}
                  onClick={() => setOpenDropdowns(prev => ({ ...prev, employee: !prev.employee }))}
                  className="px-3 py-2 pr-8 text-sm border border-border rounded-md bg-background dark:bg-slate-900 text-foreground hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all min-w-[160px] flex items-center justify-between"
                >
                  <span className="truncate">{filterEmployee.length} seleccionados</span>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground ml-2 transition-transform ${openDropdowns.employee ? 'rotate-90' : ''}`} />
                </button>
                <DropdownPortal anchorRef={employeeBtnRef} isOpen={openDropdowns.employee} onClose={() => setOpenDropdowns(prev => ({ ...prev, employee: false }))}>
                  <div className="bg-background dark:bg-slate-900 border border-border rounded-md shadow-lg max-h-64 overflow-y-auto">
                    <div className="px-2 py-2 border-b border-border">
                      <button
                        className="w-full text-left px-3 py-2 text-sm font-medium hover:bg-muted/40 rounded"
                        onClick={() => setFilterEmployee(employees.map(e => e.user_id))}
                      >
                        Seleccionar Todos
                      </button>
                    </div>
                    {employees.map(employee => (
                      <label key={employee.user_id} className="flex items-center px-3 py-2 hover:bg-muted/50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filterEmployee.includes(employee.user_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilterEmployee([...filterEmployee, employee.user_id]);
                            } else {
                              setFilterEmployee(filterEmployee.filter(e => e !== employee.user_id));
                            }
                          }}
                          className="w-4 h-4 rounded border-2 border-muted-foreground/40 bg-slate-100 dark:bg-slate-800 checked:bg-primary checked:border-primary dark:checked:bg-primary focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
                        />
                        <span className="ml-2 text-sm text-foreground truncate">{employee.profile_name}</span>
                      </label>
                    ))}
                  </div>
                </DropdownPortal>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Services Toggle Button */}
        <div className="bg-muted/30 border-b border-border px-4 py-2 flex items-center justify-end gap-2">
          <button
            onClick={() => setShowServices(!showServices)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors duration-200 font-medium"
          >
            {showServices ? (
              <>
                <EyeOff className="h-4 w-4" />
                Ocultar servicios
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Ver servicios
              </>
            )}
          </button>
        </div>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Header with employee names */}
            <div className="flex border-b-2 border-border bg-muted/50 sticky top-0 z-20">
              <div className="w-20 flex-shrink-0 p-3 font-semibold text-sm text-muted-foreground border-r-2 border-border bg-background">
                Hora
              </div>
              {employees.map((employee, index) => (
                <div
                  key={employee.id}
                  className={`flex-1 min-w-[280px] p-3 border-r-2 border-border last:border-r-0 ${employeeColors[index % employeeColors.length]}`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2">
                      {employee.profile_avatar ? (
                        <img
                          src={employee.profile_avatar}
                          alt={employee.profile_name}
                          className="h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <span className="font-semibold text-sm text-foreground">
                        {employee.profile_name}
                      </span>
                    </div>
                    
                    {/* Services - only show if toggle is ON */}
                    {showServices && employee.services && employee.services.length > 0 && (
                      <div className="flex flex-wrap gap-1 justify-center mt-1">
                        {employee.services.map((serviceName, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20"
                          >
                            {serviceName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Time slots */}
            <div ref={timelineRef} className="relative max-h-[600px] overflow-y-auto">
              {hours.map(hour => {
                const isWorkHour = isBusinessHour(hour);
                const workHourClass = isWorkHour ? '' : 'bg-muted/40';
                
                // Verificar si la línea debe aparecer en esta hora
                const shouldShowLineInHour = currentTimePosition !== null && isSelectedDateToday && (
                  Math.floor(currentTimePosition / (100 / 24)) === hour
                );
                
                return (
                  <div
                    key={hour}
                    className={`flex border-b border-border min-h-[80px] ${workHourClass} hover:bg-muted/20 transition-colors relative`}
                  >
                    {/* Línea de hora actual - SOLO si es la hora correcta */}
                    {shouldShowLineInHour && currentTimePosition !== null && (
                      <div
                        className="absolute left-0 right-0 h-0.5 bg-blue-500 z-10 pointer-events-none"
                        style={{ 
                          top: `${((currentTimePosition % (100 / 24)) / (100 / 24)) * 80}px`
                        }}
                      >
                        <div className="absolute -left-2 -top-2 w-4 h-4 bg-blue-500 rounded-full shadow-lg"></div>
                      </div>
                    )}

                    <div className="w-20 flex-shrink-0 p-2 text-sm text-muted-foreground font-medium border-r-2 border-border bg-background">
                      {hour.toString().padStart(2, '0')}:00
                    </div>
                    {employees.map((employee, index) => {
                      const slotAppointments = getAppointmentsForSlot(employee.user_id, hour);
                      const isLunch = isLunchBreak(hour, employee);
                      
                      // DEBUG: Log appointments for this employee/hour combo
                      if (slotAppointments.length > 0) {
                        console.log(`📍 Slot [${hour}:00] - Empleado: ${employee.user_id} (${employee.profile_name}) - Citas: ${slotAppointments.length}`, slotAppointments);
                      }
                      
                      return (
                        <div
                          key={employee.id}
                          className={`flex-1 min-w-[280px] p-2 border-r-2 border-border last:border-r-0 transition-colors ${
                            isLunch
                              ? 'bg-gray-100 dark:bg-gray-900 opacity-60 cursor-not-allowed'
                              : `hover:bg-accent/50 ${employeeColors[index % employeeColors.length]}`
                          }`}
                        >
                          {isLunch ? (
                            <div className="flex items-center justify-center h-full text-xs text-muted-foreground italic">
                              Almuerzo
                            </div>
                          ) : (
                            <>
                              {slotAppointments.map(apt => {
                                const appointmentClass = getAppointmentClass(apt.status);
                                
                                return (
                                  <button
                                    key={apt.id}
                                    onClick={() => setSelectedAppointment(apt)}
                                    className={`w-full p-2 rounded-md text-left text-xs hover:opacity-80 transition-opacity shadow-sm ${appointmentClass}`}
                                  >
                                    <div className="font-medium truncate">{apt.client_name}</div>
                                    <div className="truncate">{apt.service_name}</div>
                                    <div className="text-xs opacity-75">
                                      {formatTimeInColombia(apt.start_time)} - {formatTimeInColombia(apt.end_time)}
                                    </div>
                                  </button>
                                );
                              })}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Active and Overdue Appointments */}
      {(activeAppointments.length > 0 || overdueAppointments.length > 0) && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Active Appointments */}
          {activeAppointments.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                En Proceso ({activeAppointments.length})
              </h3>
              <div className="space-y-2">
                {activeAppointments.map(apt => (
                  <div
                    key={apt.id}
                    className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{apt.client_name}</div>
                        <div className="text-sm text-muted-foreground">{apt.service_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {apt.employee_name} • {formatTimeInColombia(apt.start_time)} - {formatTimeInColombia(apt.end_time)}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedAppointment(apt)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md"
                      >
                        Gestionar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overdue Appointments */}
          {overdueAppointments.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Pendientes de Confirmar ({overdueAppointments.length})
              </h3>
              <div className="space-y-2">
                {overdueAppointments.map(apt => (
                  <div
                    key={apt.id}
                    className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{apt.client_name}</div>
                        <div className="text-sm text-muted-foreground">{apt.service_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {apt.employee_name} • {formatTimeInColombia(apt.start_time)} - {formatTimeInColombia(apt.end_time)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCompleteAppointment(apt.id, 0)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md"
                        >
                          Completada
                        </button>
                        <button
                          onClick={() => handleNoShow(apt.id)}
                          className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-md"
                        >
                          Sin Asistencia
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Appointment Modal */}
      {selectedAppointment && (
        <AppointmentModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onComplete={handleCompleteAppointment}
          onCancel={handleCancelAppointment}
          onNoShow={handleNoShow}
        />
      )}
    </div>
  );
};
