import React, { useEffect, useState } from 'react';
import { MapPin, Building2, Phone, Mail, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import supabase from '@/lib/supabase';
import { toast } from 'sonner';
import type { Location } from '@/types/types';

interface LocationSelectionProps {
  businessId: string;
  selectedLocationId: string | null;
  onSelectLocation: (location: Location) => void;
  preloadedLocations?: Location[]; // Datos pre-cargados para evitar consultas lentas
}

export function LocationSelection({ 
  businessId, 
  selectedLocationId, 
  onSelectLocation,
  preloadedLocations 
}: Readonly<LocationSelectionProps>) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(!preloadedLocations);

  useEffect(() => {
    // Si ya tenemos datos pre-cargados, usarlos directamente (MÁS RÁPIDO)
    if (preloadedLocations) {
      setLocations(preloadedLocations);
      setLoading(false);
      return;
    }

    // Si no hay datos pre-cargados, hacer la consulta tradicional
    const fetchLocations = async () => {
      if (!businessId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .eq('business_id', businessId)
          .eq('is_active', true)
          .order('name');

        if (error) {
          toast.error(`Error al cargar sedes: ${error.message}`);
          setLocations([]);
          return;
        }

        setLocations(data || []);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error inesperado';
        toast.error(`Error: ${message}`);
        setLocations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [businessId, preloadedLocations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <span className="ml-3 text-gray-400">Cargando sedes...</span>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <Building2 className="h-16 w-16 text-gray-600 mb-4" />
        <p className="text-gray-400 text-center">
          No hay sedes disponibles para este negocio.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">
          Selecciona una Sede
        </h3>
        <p className="text-gray-400 text-sm">
          Elige la ubicación donde deseas tu cita
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((location) => (
          <button
            key={location.id}
            onClick={() => onSelectLocation(location)}
            className={cn(
              "relative group rounded-xl p-5 text-left transition-all duration-200 border-2",
              "hover:scale-[1.02] hover:shadow-xl",
              selectedLocationId === location.id
                ? "bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/20"
                : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
            )}
          >
            {/* Selected indicator */}
            {selectedLocationId === location.id && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            )}

            {/* Location Icon */}
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center mb-4",
              selectedLocationId === location.id 
                ? "bg-purple-500/30" 
                : "bg-white/10 group-hover:bg-white/20"
            )}>
              <MapPin className={cn(
                "h-6 w-6",
                selectedLocationId === location.id ? "text-purple-400" : "text-gray-400"
              )} />
            </div>

            {/* Location Name */}
            <h4 className="text-lg font-semibold text-white mb-3">
              {location.name}
            </h4>

            {/* Location Details */}
            <div className="space-y-2 text-sm">
              {location.address && (
                <div className="flex items-start gap-2 text-gray-400">
                  <Building2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">
                    {location.address}
                    {location.city && `, ${location.city}`}
                    {location.state && `, ${location.state}`}
                  </span>
                </div>
              )}

              {location.phone && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Phone className="h-4 w-4 flex-shrink-0" />
                  <span>{location.phone}</span>
                </div>
              )}

              {location.country && (
                <div className="flex items-center gap-2 text-gray-400">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{location.country}</span>
                </div>
              )}
            </div>

            {/* Hover Effect Border */}
            <div className={cn(
              "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
              "bg-gradient-to-br from-purple-500/10 to-transparent"
            )} />
          </button>
        ))}
      </div>
    </div>
  );
}
