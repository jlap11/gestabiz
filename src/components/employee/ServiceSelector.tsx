import React, { useState, useEffect, useCallback } from 'react';
import { Briefcase, Check, AlertCircle, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import supabase from '@/lib/supabase';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface Service {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  category?: string;
  
  // Employee service info (if already offering)
  employee_service_id?: string;
  is_offering?: boolean;
  expertise_level?: number;
  commission_percentage?: number;
}

interface ServiceSelectorProps {
  businessId: string;
  employeeId: string;
  currentLocationId?: string | null;
  onServicesChanged?: () => void;
}

export function ServiceSelector({
  businessId,
  employeeId,
  currentLocationId,
  onServicesChanged
}: Readonly<ServiceSelectorProps>) {
  const { t } = useLanguage()
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [serviceDetails, setServiceDetails] = useState<Record<string, {
    expertise_level: number;
    commission_percentage: number;
  }>>({});

  const fetchServices = useCallback(async () => {
    if (!businessId || !employeeId) {
      return;
    }

    try {
      setLoading(true);

      // Obtener servicios del negocio
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true);

      if (servicesError) throw servicesError;

      // Obtener servicios que ya ofrece el empleado
      const { data: employeeServicesData, error: empServicesError } = await supabase
        .from('employee_services')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('business_id', businessId)
        .eq('is_active', true);

      if (empServicesError) throw empServicesError;

      // Combinar información
      const servicesWithEmployeeInfo = servicesData?.map(service => {
        const empService = employeeServicesData?.find(es => es.service_id === service.id);
        return {
          ...service,
          employee_service_id: empService?.id,
          is_offering: !!empService,
          expertise_level: empService?.expertise_level || 3,
          commission_percentage: empService?.commission_percentage || 0
        };
      }) || [];

      setServices(servicesWithEmployeeInfo);

      // Inicializar selección y detalles
      const selected = new Set(
        servicesWithEmployeeInfo
          .filter(s => s.is_offering)
          .map(s => s.id)
      );
      setSelectedServices(selected);

      const details: Record<string, { expertise_level: number; commission_percentage: number }> = {};
      servicesWithEmployeeInfo.forEach(service => {
        if (service.is_offering) {
          details[service.id] = {
            expertise_level: service.expertise_level || 3,
            commission_percentage: service.commission_percentage || 0
          };
        }
      });
      setServiceDetails(details);

    } catch {
      toast.error(t('common.messages.loadError'));
    } finally {
      setLoading(false);
    }
  }, [businessId, employeeId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleServiceToggle = (serviceId: string) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
      const newDetails = { ...serviceDetails };
      delete newDetails[serviceId];
      setServiceDetails(newDetails);
    } else {
      newSelected.add(serviceId);
      setServiceDetails({
        ...serviceDetails,
        [serviceId]: {
          expertise_level: 3,
          commission_percentage: 0
        }
      });
    }
    setSelectedServices(newSelected);
  };

  const handleDetailChange = (
    serviceId: string,
    field: 'expertise_level' | 'commission_percentage',
    value: number | undefined
  ) => {
    setServiceDetails({
      ...serviceDetails,
      [serviceId]: {
        ...serviceDetails[serviceId],
        [field]: value
      }
    });
  };

  const handleSaveChanges = async () => {
    if (!currentLocationId) {
      toast.error('Debes tener una sede asignada para ofrecer servicios');
      return;
    }

    try {
      setSaving(true);

      // Obtener servicios actuales del empleado
      const { data: currentEmployeeServices } = await supabase
        .from('employee_services')
        .select('id, service_id')
        .eq('employee_id', employeeId)
        .eq('business_id', businessId);

      const currentServiceIds = new Set(
        currentEmployeeServices?.map(es => es.service_id) || []
      );

      // Servicios a agregar
      const toAdd = Array.from(selectedServices).filter(
        sid => !currentServiceIds.has(sid)
      );

      // Servicios a desactivar
      const toRemove = currentEmployeeServices?.filter(
        es => !selectedServices.has(es.service_id)
      ) || [];

      // Servicios a actualizar
      const toUpdate = Array.from(selectedServices).filter(
        sid => currentServiceIds.has(sid)
      );

      // Agregar nuevos
      if (toAdd.length > 0) {
        const inserts = toAdd.map(serviceId => ({
          employee_id: employeeId,
          business_id: businessId,
          service_id: serviceId,
          location_id: currentLocationId,
          expertise_level: serviceDetails[serviceId]?.expertise_level || 3,
          commission_percentage: serviceDetails[serviceId]?.commission_percentage || 0,
          is_active: true
        }));

        const { error: insertError } = await supabase
          .from('employee_services')
          .insert(inserts);

        if (insertError) throw insertError;
      }

      // Desactivar removidos
      if (toRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('employee_services')
          .update({ is_active: false })
          .in('id', toRemove.map(es => es.id));

        if (deleteError) throw deleteError;
      }

      // Actualizar existentes
      for (const serviceId of toUpdate) {
        const empService = currentEmployeeServices?.find(
          es => es.service_id === serviceId
        );

        if (empService) {
          const { error: updateError } = await supabase
            .from('employee_services')
            .update({
              expertise_level: serviceDetails[serviceId]?.expertise_level || 3,
              commission_percentage: serviceDetails[serviceId]?.commission_percentage || 0,
              location_id: currentLocationId
            })
            .eq('id', empService.id);

          if (updateError) throw updateError;
        }
      }

      toast.success(t('common.messages.updateSuccess'));

      // Refrescar lista
      await fetchServices();

      // Notificar al componente padre
      if (onServicesChanged) {
        onServicesChanged();
      }

    } catch (error) {
      console.error('Error saving services:', error);
      toast.error(t('common.messages.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Este negocio no tiene servicios configurados. Contacta al administrador.
        </AlertDescription>
      </Alert>
    );
  }

  const hasChanges = Array.from(selectedServices).some(sid => {
    const service = services.find(s => s.id === sid);
    if (!service) return false;
    
    if (!service.is_offering) return true; // Nuevo servicio
    
    // Verificar cambios en detalles
    const details = serviceDetails[sid];
    return (
      details?.expertise_level !== service.expertise_level ||
      details?.commission_percentage !== service.commission_percentage
    );
  }) || services.some(s => s.is_offering && !selectedServices.has(s.id)); // Servicio removido

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Selecciona los servicios que ofreces y configura tu nivel de experiencia
        </p>
        <Button
          onClick={handleSaveChanges}
          disabled={!hasChanges || saving}
          size="sm"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              {t('common.actions.saving')}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {t('common.actions.save')}
            </>
          )}
        </Button>
      </div>

      <div className="space-y-3">
        {services.map((service) => {
          const isSelected = selectedServices.has(service.id);
          const details = serviceDetails[service.id];

          return (
            <Card key={service.id} className={isSelected ? 'border-primary' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={`service-${service.id}`}
                    checked={isSelected}
                    onCheckedChange={() => handleServiceToggle(service.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor={`service-${service.id}`}
                      className="text-base font-semibold cursor-pointer"
                    >
                      {service.name}
                    </Label>
                    {service.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {service.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <span>⏱️ {service.duration_minutes} min</span>
                      <span>💰 ${service.price.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} COP</span>
                      {service.category && <Badge variant="outline">{service.category}</Badge>}
                    </div>
                  </div>
                </div>
              </CardHeader>

              {isSelected && (
                <CardContent className="space-y-3 pt-3 border-t">
                  {/* Expertise Level */}
                  <div>
                    <Label className="text-sm">
                      Nivel de Experiencia ({details?.expertise_level || 3}/5)
                    </Label>
                    <div className="flex items-center gap-2 mt-2">
                      {[1, 2, 3, 4, 5].map(level => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => handleDetailChange(service.id, 'expertise_level', level)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            level <= (details?.expertise_level || 3)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Commission Percentage */}
                  <div>
                    <Label htmlFor={`commission-${service.id}`} className="text-sm">
                      Comisión (%)
                    </Label>
                    <Input
                      id={`commission-${service.id}`}
                      type="number"
                      min="0"
                      max="100"
                      value={details?.commission_percentage || 0}
                      onChange={(e) => handleDetailChange(
                        service.id,
                        'commission_percentage',
                        parseFloat(e.target.value) || 0
                      )}
                      className="mt-1"
                    />
                  </div>

                  {service.is_offering && (
                    <div className="flex items-center gap-2 text-sm text-primary">
                      <Check className="h-4 w-4" />
                      <span>Ya ofreces este servicio</span>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
