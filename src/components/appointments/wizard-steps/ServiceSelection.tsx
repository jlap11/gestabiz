import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Service } from '@/types/types';
import supabase from '@/lib/supabase';

interface ServiceSelectionProps {
  readonly businessId: string;
  readonly selectedServiceId: string | null;
  readonly onSelectService: (service: Service) => void;
  readonly preloadedServices?: Service[]; // Datos pre-cargados
}

export function ServiceSelection({
  businessId,
  selectedServiceId,
  onSelectService,
  preloadedServices,
}: ServiceSelectionProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(!preloadedServices);

  const loadServices = useCallback(async () => {
    // Si ya tenemos datos pre-cargados, usarlos (MÁS RÁPIDO)
    if (preloadedServices) {
      setServices(preloadedServices);
      setLoading(false);
      return;
    }

    // Si no, hacer la consulta tradicional
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true);

      if (error) throw error;
      setServices((data as Service[]) || []);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [businessId, preloadedServices]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Imágenes placeholder por tipo de servicio
  const getServiceImage = (serviceName: string): string => {
    const name = serviceName.toLowerCase();
    if (name.includes('hair') || name.includes('corte') || name.includes('cabello')) {
      return 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=400&fit=crop';
    }
    if (name.includes('manicure') || name.includes('nail') || name.includes('uña')) {
      return 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=400&fit=crop';
    }
    if (name.includes('massage') || name.includes('masaje')) {
      return 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=400&fit=crop';
    }
    if (name.includes('facial') || name.includes('cara')) {
      return 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=400&fit=crop';
    }
    if (name.includes('color') || name.includes('tinte')) {
      return 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=400&h=400&fit=crop';
    }
    if (name.includes('style') || name.includes('peinado')) {
      return 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&h=400&fit=crop';
    }
    // Default
    return 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop';
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#8b5cf6] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#94a3b8]">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-xl font-semibold text-white mb-6">
        Select a Service
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {services.map((service) => {
          const isSelected = selectedServiceId === service.id;

          return (
            <Card
              key={service.id}
              onClick={() => onSelectService(service)}
              className={cn(
                "relative bg-[#2d2640] border-2 rounded-xl overflow-hidden",
                "cursor-pointer transition-all duration-200",
                "hover:border-[#8b5cf6] hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20",
                isSelected
                  ? "border-[#8b5cf6] bg-[#8b5cf6]/10"
                  : "border-white/10"
              )}
            >
              {/* Imagen fotográfica real del servicio */}
              <div className="aspect-square w-full relative">
                <img
                  src={getServiceImage(service.name)}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />

                {/* Checkmark cuando está seleccionado */}
                {isSelected && (
                  <div
                    className={cn(
                      "absolute top-3 right-3 w-8 h-8 bg-[#8b5cf6] rounded-full",
                      "flex items-center justify-center",
                      "animate-in zoom-in duration-200"
                    )}
                  >
                    <Check className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>

              {/* Label debajo de la imagen */}
              <div className="p-3 text-center bg-[#1e293b]/50">
                <h3 className="text-base font-semibold text-white truncate">
                  {service.name}
                </h3>
                <p className="text-xs text-[#94a3b8] mt-1">
                  {service.duration} min
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#94a3b8]">No services available</p>
        </div>
      )}
    </div>
  );
}
