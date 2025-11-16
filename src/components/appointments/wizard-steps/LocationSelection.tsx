import React, { useEffect, useState } from 'react';
import { MapPin, Building2, Phone, Mail, Loader2, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import supabase from '@/lib/supabase';
import { toast } from 'sonner';
import type { Location } from '@/types/types';
import { LocationAddress } from '@/components/ui/LocationAddress';

interface LocationSelectionProps {
  businessId: string;
  selectedLocationId: string | null;
  onSelectLocation: (location: Location) => void;
  preloadedLocations?: Location[]; // Datos pre-cargados para evitar consultas lentas
  isPreselected?: boolean; // Nueva prop para indicar si fue preseleccionado
}

export function LocationSelection({ 
  businessId, 
  selectedLocationId, 
  onSelectLocation,
  preloadedLocations,
  isPreselected = false
}: Readonly<LocationSelectionProps>) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(!preloadedLocations);
  const [locationBanners, setLocationBanners] = useState<Record<string, string>>({});

  // Carga banners de sedes desde location_media
  const refreshLocationBanners = async (ids: string[]) => {
    try {
      if (!ids || ids.length === 0) {
        setLocationBanners({});
        return;
      }
      const { data, error } = await supabase
        .from('location_media')
        .select('location_id, type, url, is_banner, description, created_at')
        .in('location_id', ids)
        .order('created_at', { ascending: false });
      if (error) return; // silencioso
      const rows = Array.isArray(data) ? data : [];

      const bannerByLocation = new Map<string, any[]>();
      rows.forEach((m) => {
        const cleanUrl = (m.url || '').trim().replace(/^[`'\"]+|[`'\"]+$/g, '');
        if (m.is_banner && m.type === 'image') {
          const arr = bannerByLocation.get(m.location_id) || [];
          arr.push({ ...m, url: cleanUrl });
          bannerByLocation.set(m.location_id, arr);
        }
      });

      const banners: Record<string, string> = {};
      bannerByLocation.forEach((arr, locId) => {
        const chosen = arr.find((x) => (x.description || '').trim() !== 'Banner de prueba') || arr[0];
        if (chosen) banners[locId] = chosen.url;
      });

      setLocationBanners(banners);
    } catch {
      // noop
    }
  };

  useEffect(() => {
    // Si ya tenemos datos pre-cargados, usarlos directamente (MÁS RÁPIDO)
    if (preloadedLocations) {
      setLocations(preloadedLocations);
      setLoading(false);
      const ids = preloadedLocations.map(l => l.id);
      refreshLocationBanners(ids).catch(() => {/* noop */});
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

        const activeLocations = (data || []) as Location[];
        if (activeLocations.length === 0) {
          setLocations([]);
          return;
        }

        // Filtrar sedes que no tengan servicios prestados por al menos un profesional activo
        const locationIds = activeLocations.map(l => l.id);

        const [employeesRes, empServicesRes] = await Promise.all([
          supabase
            .from('business_employees')
            .select('employee_id')
            .eq('business_id', businessId)
            .eq('status', 'approved')
            .eq('is_active', true),
          supabase
            .from('employee_services')
            .select('service_id, location_id, employee_id, is_active')
            .eq('business_id', businessId)
            .in('location_id', locationIds)
            .eq('is_active', true),
        ]);

        const activeEmployeeIds = new Set((employeesRes.data || []).map((e: any) => e.employee_id as string));
        const empServices = (empServicesRes.data || []) as { service_id: string; location_id: string | null; employee_id: string; is_active: boolean }[];

        const serviceIds = Array.from(new Set(empServices.map(es => es.service_id)));
        const { data: servicesData } = serviceIds.length > 0
          ? await supabase
              .from('services')
              .select('id')
              .in('id', serviceIds)
              .eq('is_active', true)
          : { data: [] } as any;
        const activeServiceIds = new Set((servicesData || []).map((s: any) => s.id as string));

        const allowedLocationIds = new Set<string>();
        for (const es of empServices) {
          if (!es.location_id) continue; // Debe estar ligada a sede
          if (activeEmployeeIds.has(es.employee_id) && activeServiceIds.has(es.service_id)) {
            allowedLocationIds.add(es.location_id);
          }
        }

        const filtered = activeLocations.filter(loc => allowedLocationIds.has(loc.id));
        setLocations(filtered);
        const ids = filtered.map(l => l.id);
        await refreshLocationBanners(ids);
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Cargando sedes...</span>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6">
        <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground text-center">
          No hay sedes disponibles para este negocio.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Selecciona una Sede
        </h3>
        <p className="text-muted-foreground text-sm">
          Elige la ubicación donde deseas tu cita
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((location) => {
          const isSelected = selectedLocationId === location.id;
          const wasPreselected = isPreselected && isSelected;

          return (
            <button
              key={location.id}
              onClick={() => onSelectLocation(location)}
              className={cn(
                "relative group rounded-xl p-5 text-left transition-all duration-200 border-2 overflow-hidden",
                "hover:scale-[1.02] hover:shadow-xl",
                isSelected
                  ? "bg-primary/20 border-primary shadow-lg shadow-primary/20"
                  : "bg-muted/50 border-border hover:bg-muted hover:border-border/50",
                wasPreselected && "ring-2 ring-green-500/50"
              )}
            >
              {locationBanners[location.id] && (
                <img
                  src={locationBanners[location.id]}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  aria-hidden="true"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              {locationBanners[location.id] && (
                <div className="absolute inset-0 bg-black/40" />
              )}
              {/* Badge de preselección */}
              {wasPreselected && (
                <div className="absolute top-3 left-3 z-10">
                  <Badge className="bg-green-500 text-white text-xs shadow-lg">
                    <Check className="w-3 h-3 mr-1" />
                    Preseleccionado
                  </Badge>
                </div>
              )}

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center z-10">
                  <Check size={14} weight="bold" className="text-primary-foreground" />
                </div>
              )}

            {/* Location Icon */}
            <div className={cn(
              "relative z-10 w-12 h-12 rounded-lg flex items-center justify-center mb-4",
              selectedLocationId === location.id 
                ? "bg-primary/30" 
                : locationBanners[location.id] ? "bg-black/30" : "bg-muted group-hover:bg-muted/80"
            )}>
              <MapPin className={cn(
                "h-6 w-6",
                selectedLocationId === location.id ? "text-primary" : locationBanners[location.id] ? "text-white/80" : "text-muted-foreground"
              )} />
            </div>

            {/* Location Name */}
            <h4 className={cn("relative z-10 text-lg font-semibold mb-3",
              locationBanners[location.id] ? "text-white drop-shadow" : "text-foreground"
            )}>
              {location.name}
            </h4>

            {/* Location Details */}
            <div className="relative z-10 space-y-2 text-sm">
              {location.address && (
                <div className={cn("flex items-start gap-2",
                  locationBanners[location.id] ? "text-white/80" : "text-muted-foreground"
                )}>
                  <Building2 className={cn("h-4 w-4 mt-0.5 flex-shrink-0",
                    locationBanners[location.id] ? "text-white/70" : "text-muted-foreground"
                  )} />
                  <LocationAddress
                    address={location.address}
                    cityId={location.city}
                    stateId={location.state}
                    postalCode={location.postal_code}
                    className={cn("line-clamp-2",
                      locationBanners[location.id] ? "text-white/80" : "text-muted-foreground"
                    )}
                  />
                </div>
              )}

              {location.phone && (
                <div className={cn("flex items-center gap-2",
                  locationBanners[location.id] ? "text-white/80" : "text-muted-foreground"
                )}>
                  <Phone className={cn("h-4 w-4 flex-shrink-0",
                    locationBanners[location.id] ? "text-white/70" : "text-muted-foreground"
                  )} />
                  <span>{location.phone}</span>
                </div>
              )}

              {location.country && (
                <div className={cn("flex items-center gap-2",
                  locationBanners[location.id] ? "text-white/80" : "text-muted-foreground"
                )}>
                  <Mail className={cn("h-4 w-4 flex-shrink-0",
                    locationBanners[location.id] ? "text-white/70" : "text-muted-foreground"
                  )} />
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
          );
        })}
      </div>
    </div>
  );
}
