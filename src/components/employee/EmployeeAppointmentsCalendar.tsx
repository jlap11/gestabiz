import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, X, AlertCircle, Check } from 'lucide-react';
import { format, addDays, subDays, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'completed' | 'cancelled' | 'no_show' | string;
  service_name: string;
  location_id: string | null;
  locations?: { name: string } | null;
  profiles?: { id: string; full_name: string; avatar_url: string | null };
  business_id?: string;
  employee_id?: string;
  service_id?: string;
}

function startOfDayISO(d: Date) {
  const dd = new Date(d);
  dd.setHours(0, 0, 0, 0);
  return dd.toISOString();
}

function endOfDayISO(d: Date) {
  const dd = new Date(d);
  dd.setHours(23, 59, 59, 999);
  return dd.toISOString();
}

export const EmployeeAppointmentsCalendar: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [filterStatus, setFilterStatus] = useState<string[]>(['confirmed']);
  const [filterService, setFilterService] = useState<string[]>([]);
  const [filterLocation, setFilterLocation] = useState<string[]>([]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { confirmed: 0, completed: 0, cancelled: 0, no_show: 0 };
    for (const apt of appointments) {
      if (counts[apt.status] !== undefined) counts[apt.status] += 1;
    }
    return counts;
  }, [appointments]);

  const fetchAppointments = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const rangeStart = viewMode === 'week' ? startOfWeek(selectedDate, { weekStartsOn: 1 }) : startOfDay(selectedDate);
      const rangeEnd = viewMode === 'week' ? endOfWeek(selectedDate, { weekStartsOn: 1 }) : endOfDay(selectedDate);

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id, business_id, employee_id, service_id, start_time, end_time, status, service_name,
          location_id, locations(name), profiles!inner(id, full_name, avatar_url)
        `)
        .eq('employee_id', user.id)
        .gte('start_time', rangeStart.toISOString())
        .lte('start_time', rangeEnd.toISOString())
        .order('start_time');

      if (error) throw error;
      setAppointments((data || []) as Appointment[]);
    } catch (e) {
      console.error(e);
      toast.error('No se pudieron cargar las citas.');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, selectedDate, viewMode]);

  useEffect(() => {
    trackEvent({
      category: 'appointments',
      action: 'calendar_opened',
      label: 'employee_daily',
      properties: {
        date: format(selectedDate, 'yyyy-MM-dd'),
        user_role: 'employee',
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const hours = useMemo(() => Array.from({ length: 14 }, (_, i) => i + 7), []); // 7:00–20:00

  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      if (filterStatus.length && !filterStatus.includes(apt.status)) return false;
      if (filterService.length && !filterService.includes(apt.service_name)) return false;
      if (filterLocation.length && !filterLocation.includes(apt.locations?.name || '')) return false;
      return true;
    });
  }, [appointments, filterStatus, filterService, filterLocation]);

  const appointmentsByHour = useMemo(() => {
    const map = new Map<number, Appointment[]>();
    for (const apt of filteredAppointments) {
      const dt = parseISO(apt.start_time);
      if (format(dt, 'yyyy-MM-dd') !== format(selectedDate, 'yyyy-MM-dd')) continue;
      const hour = dt.getHours();
      if (!map.has(hour)) map.set(hour, []);
      map.get(hour)!.push(apt);
    }
    return map;
  }, [filteredAppointments, selectedDate]);

  const weekDays = useMemo(() => {
    if (viewMode !== 'week') return [] as Date[];
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [selectedDate, viewMode]);

  const appointmentsByDayHour = useMemo(() => {
    if (viewMode !== 'week') return null as Map<string, Map<number, Appointment[]>> | null;
    const map = new Map<string, Map<number, Appointment[]>>();
    for (const apt of filteredAppointments) {
      const dt = parseISO(apt.start_time);
      const dateKey = format(dt, 'yyyy-MM-dd');
      const hour = dt.getHours();
      if (!map.has(dateKey)) map.set(dateKey, new Map<number, Appointment[]>());
      const byHour = map.get(dateKey)!;
      if (!byHour.has(hour)) byHour.set(hour, []);
      byHour.get(hour)!.push(apt);
    }
    return map;
  }, [filteredAppointments, viewMode]);

  const handleCancel = async (appointmentId: string) => {
    setIsActionLoading(true);
    try {
      const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', appointmentId);
      if (error) throw error;
      await fetchAppointments();
      setSelectedAppointment(null);
      toast.success('La cita fue marcada como cancelada.');
      const apt = appointments.find(a => a.id === appointmentId);
      trackEvent({
        category: 'appointments',
        action: 'status_change',
        label: 'cancelled',
        properties: {
          appointment_id: appointmentId,
          ...getEventContext(apt),
        },
      });
    } catch (err) {
      toast.error('No se pudo cancelar la cita.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleComplete = async (appointmentId: string) => {
    setIsActionLoading(true);
    try {
      const { error } = await supabase.from('appointments').update({ status: 'completed' }).eq('id', appointmentId);
      if (error) throw error;
      await fetchAppointments();
      setSelectedAppointment(null);
      toast.success('La cita fue marcada como completada.');
      const apt = appointments.find(a => a.id === appointmentId);
      trackEvent({
        category: 'appointments',
        action: 'status_change',
        label: 'completed',
        properties: {
          appointment_id: appointmentId,
          ...getEventContext(apt),
        },
      });
    } catch (err) {
      toast.error('No se pudo completar la cita.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleNoShow = async (appointmentId: string) => {
    setIsActionLoading(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'no_show' })
        .eq('id', appointmentId);
      if (error) throw error;
      await fetchAppointments();
      setSelectedAppointment(null);
      toast.success('La cita fue marcada como no asistida.');
      const apt = appointments.find(a => a.id === appointmentId);
      trackEvent({
        category: 'appointments',
        action: 'status_change',
        label: 'no_show',
        properties: {
          appointment_id: appointmentId,
          ...getEventContext(apt),
        },
      });
    } catch (err) {
      toast.error('No se pudo marcar como no show.');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Mi Agenda</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedDate(subDays(selectedDate, 1));
              trackEvent({ category: 'appointments', action: 'navigate_prev', label: viewMode });
            }}
            className="p-2 hover:bg-muted rounded-md"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <div className="text-lg font-semibold text-foreground">
              {format(selectedDate, 'EEEE', { locale: es })}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(selectedDate, 'dd MMM yyyy', { locale: es })}
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedDate(addDays(selectedDate, 1));
              trackEvent({ category: 'appointments', action: 'navigate_next', label: viewMode });
            }}
            className="p-2 hover:bg-muted rounded-md"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="ml-2 flex items-center gap-1">
            <button
              className={`text-xs px-2 py-1 rounded-md border ${viewMode === 'day' ? 'bg-muted' : ''}`}
              onClick={() => { setViewMode('day'); trackEvent({ category: 'appointments', action: 'view_toggle', label: 'day' }); }}
            >
              Día
            </button>
            <button
              className={`text-xs px-2 py-1 rounded-md border ${viewMode === 'week' ? 'bg-muted' : ''}`}
              onClick={() => { setViewMode('week'); trackEvent({ category: 'appointments', action: 'view_toggle', label: 'week' }); }}
            >
              Semana
            </button>
            <button
              className="text-xs px-2 py-1 rounded-md border hover:bg-muted"
              onClick={() => {
                const today = new Date();
                setSelectedDate(today);
                trackEvent({ category: 'appointments', action: 'navigate_today', label: viewMode });
              }}
            >
              Hoy
            </button>
          </div>
        </div>
      </div>

      {/* Status counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-2 border border-border rounded-md text-sm">
          Confirmadas: <span className="font-semibold">{statusCounts.confirmed}</span>
        </div>
        <div className="p-2 border border-border rounded-md text-sm">
          Completadas: <span className="font-semibold">{statusCounts.completed}</span>
        </div>
        <div className="p-2 border border-border rounded-md text-sm">
          Canceladas: <span className="font-semibold">{statusCounts.cancelled}</span>
        </div>
        <div className="p-2 border border-border rounded-md text-sm">
          No show: <span className="font-semibold">{statusCounts.no_show}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm text-muted-foreground mr-2">Filtros:</div>
        {/* Status chips */}
        {['confirmed','completed','cancelled','no_show'].map(st => {
          const active = filterStatus.includes(st);
          return (
            <button
              key={st}
              onClick={() => {
                setFilterStatus(prev => active ? prev.filter(s => s !== st) : [...prev, st]);
                trackEvent({
                  category: 'appointments',
                  action: 'filter_toggle',
                  label: 'status',
                  properties: { value: st, active: !active, user_role: 'employee' },
                });
              }}
              className={`text-xs px-2 py-1 rounded-full border ${active ? statusStyles[st] : 'hover:bg-muted'}`}
            >
              {st}
            </button>
          );
        })}
        {/* Service chips */}
        {Array.from(new Set(appointments.map(a => a.service_name))).slice(0,6).map(sv => {
          const active = filterService.includes(sv);
          return (
            <button
              key={sv}
              onClick={() => {
                setFilterService(prev => active ? prev.filter(s => s !== sv) : [...prev, sv]);
                trackEvent({
                  category: 'appointments',
                  action: 'filter_toggle',
                  label: 'service',
                  properties: { value: sv, active: !active, user_role: 'employee' },
                });
              }}
              className={`text-xs px-2 py-1 rounded-full border ${active ? 'bg-purple-100 text-purple-700 border-purple-300' : 'hover:bg-muted'}`}
            >
              {sv}
            </button>
          );
        })}
        {/* Location chips */}
        {Array.from(new Set(appointments.map(a => a.locations?.name).filter(Boolean))).slice(0,6).map((locName) => {
          const name = locName as string;
          const active = filterLocation.includes(name);
          return (
            <button
              key={name}
              onClick={() => {
                setFilterLocation(prev => active ? prev.filter(s => s !== name) : [...prev, name]);
                trackEvent({
                  category: 'appointments',
                  action: 'filter_toggle',
                  label: 'location',
                  properties: { value: name, active: !active, user_role: 'employee' },
                });
              }}
              className={`text-xs px-2 py-1 rounded-full border ${active ? 'bg-teal-100 text-teal-700 border-teal-300' : 'hover:bg-muted'}`}
            >
              📍 {name}
            </button>
          );
        })}
        {/* Clear filters */}
        {(filterStatus.length || filterService.length || filterLocation.length) && (
          <button
            onClick={() => {
              setFilterStatus([]); setFilterService([]); setFilterLocation([]);
              trackEvent({ category: 'appointments', action: 'filters_cleared', label: 'employee_calendar', properties: { user_role: 'employee' } });
            }}
            className="ml-auto text-xs px-2 py-1 rounded-md border hover:bg-muted"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Views */}
      {viewMode === 'day' ? (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="grid grid-cols-12">
            {/* Hours column */}
            <div className="col-span-2 bg-muted/30 border-r border-border p-3">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="font-semibold">Horas</span>
              </div>
              <div className="space-y-1">
                {hours.map(h => (
                  <div key={h} className="text-xs text-muted-foreground">
                    {String(h).padStart(2, '0')}:00
                  </div>
                ))}
              </div>
            </div>

            {/* Appointments column */}
            <div className="col-span-10 p-3">
              {isLoading ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Cargando citas...
                </div>
              ) : (
                <div className="space-y-3">
                  {hours.map(h => {
                    const list = appointmentsByHour.get(h) || [];
                    return (
                      <div key={h} className="border-b border-border pb-3">
                        <div className="text-xs font-medium text-muted-foreground mb-2">
                          {String(h).padStart(2, '0')}:00
                        </div>
                        {list.length === 0 ? (
                          <div className="text-sm text-muted-foreground">Sin citas</div>
                        ) : (
                          <div className="space-y-2">
                            {list.map(apt => (
                              <button
                                key={apt.id}
                                onClick={() => setSelectedAppointment(apt)}
                                className="w-full text-left p-3 rounded-md border border-border hover:bg-muted/50"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    {apt.profiles?.avatar_url ? (
                                      <img
                                        src={apt.profiles.avatar_url || ''}
                                        alt={apt.profiles.full_name}
                                        className="h-8 w-8 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                                        <User className="h-4 w-4 text-primary" />
                                      </div>
                                    )}
                                    <div>
                                      <div className="font-medium text-foreground">
                                        {apt.profiles?.full_name || 'Cliente'}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {apt.service_name}
                                      </div>
                                      {apt.locations?.name && (
                                        <div className="text-xs text-muted-foreground">
                                          📍 {apt.locations.name}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-xs">
                                    <span className={`px-2 py-1 rounded-full border ${statusStyles[apt.status] || ''}`}>
                                      {apt.status}
                                    </span>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden p-3">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Cargando citas...
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {weekDays.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const byHour = appointmentsByDayHour?.get(dateKey) || new Map<number, Appointment[]>();
                const presentHours = Array.from(byHour.keys()).sort((a,b) => a-b);
                return (
                  <div key={dateKey} className="rounded-md border p-3">
                    <div className="font-medium mb-2">
                      {format(day, 'EEEE d', { locale: es })}
                    </div>
                    {presentHours.length === 0 ? (
                      <div className="text-sm text-muted-foreground">Sin citas</div>
                    ) : (
                      <div className="space-y-2">
                        {presentHours.map(h => (
                          <div key={h}>
                            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {String(h).padStart(2,'0')}:00
                            </div>
                            <div className="space-y-1">
                              {(byHour.get(h) || []).map(apt => (
                                <div key={apt.id} className="rounded border p-2">
                                  <div className="flex items-center justify-between">
                                    <div className="font-medium text-sm">{apt.service_name || 'Servicio'}</div>
                                    <span className={`text-xs px-2 py-1 rounded-full border ${statusStyles[apt.status] || ''}`}>{apt.status}</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                                    {apt.locations?.name && (<span>📍 {apt.locations.name}</span>)}
                                  </div>
                                  <div className="mt-2 flex items-center gap-2">
                                    <button className="text-xs px-2 py-1 rounded border" onClick={() => setSelectedAppointment(apt)}>Ver</button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal-like actions */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-4 w-full max-w-md">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-foreground">Detalle de cita</div>
              <button className="p-2 hover:bg-muted rounded-md" onClick={() => setSelectedAppointment(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              {format(parseISO(selectedAppointment.start_time), 'dd MMM yyyy HH:mm', { locale: es })} – {selectedAppointment.service_name}
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => handleCancel(selectedAppointment.id)}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
                disabled={isActionLoading}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleNoShow(selectedAppointment.id)}
                className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-md flex items-center gap-1"
                disabled={isActionLoading}
              >
                <AlertCircle className="h-4 w-4" /> No show
              </button>
              <button
                onClick={() => handleComplete(selectedAppointment.id)}
                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
                disabled={isActionLoading}
              >
                Completar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeAppointmentsCalendar;

const statusStyles: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-700 border-blue-300',
  completed: 'bg-green-100 text-green-700 border-green-300',
  cancelled: 'bg-red-100 text-red-700 border-red-300',
  no_show: 'bg-amber-100 text-amber-700 border-amber-300',
};

// Helper to extract context from an appointment
function getEventContext(apt?: Appointment) {
  return {
    business_id: apt?.business_id || '',
    employee_id: apt?.employee_id || '',
    service_id: apt?.service_id || '',
    location_id: apt?.location_id || '',
    user_role: 'employee' as const,
  };
}