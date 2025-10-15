import React, { useState, useEffect } from 'react';
import { MapPin, Check, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import supabase from '@/lib/supabase';
import { toast } from 'sonner';

interface Location {
  id: string;
  business_id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  is_primary: boolean;
  images?: string[];
  business_hours?: any;
  is_assigned?: boolean;
}

interface LocationSelectorProps {
  businessId: string;
  employeeId: string;
  currentLocationId?: string | null;
  onLocationChanged?: () => void;
}

export function LocationSelector({
  businessId,
  employeeId,
  currentLocationId,
  onLocationChanged
}: LocationSelectorProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchLocations();
  }, [businessId, employeeId]);

  const fetchLocations = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('is_primary', { ascending: false })
        .order('name');

      if (error) throw error;

      // Marcar la sede asignada
      const locationsWithAssignment = data?.map(loc => ({
        ...loc,
        is_assigned: loc.id === currentLocationId
      })) || [];

      setLocations(locationsWithAssignment);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Error al cargar las sedes');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocation = async (locationId: string) => {
    try {
      setUpdating(locationId);

      const { error } = await supabase
        .from('business_employees')
        .update({ 
          location_id: locationId,
          updated_at: new Date().toISOString()
        })
        .eq('employee_id', employeeId)
        .eq('business_id', businessId);

      if (error) throw error;

      toast.success('Sede de trabajo actualizada correctamente');
      
      // Refrescar lista
      await fetchLocations();
      
      // Notificar al componente padre
      if (onLocationChanged) {
        onLocationChanged();
      }
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Error al actualizar sede de trabajo');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Este negocio no tiene sedes configuradas. Contacta al administrador.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {!currentLocationId && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No tienes una sede de trabajo asignada. Selecciona una sede para comenzar a ofrecer servicios.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4">
        {locations.map((location) => (
          <Card 
            key={location.id}
            className={location.is_assigned ? 'border-primary border-2' : ''}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{location.name}</CardTitle>
                  {location.is_primary && (
                    <Badge variant="secondary" className="text-xs">Principal</Badge>
                  )}
                  {location.is_assigned && (
                    <Badge variant="default" className="text-xs bg-primary">
                      <Check className="h-3 w-3 mr-1" />
                      Tu Sede
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Dirección */}
              {(location.address || location.city || location.state) && (
                <div className="text-sm space-y-1">
                  <p className="font-medium text-muted-foreground">Dirección</p>
                  <p className="text-foreground">
                    {[location.address, location.city, location.state, location.country]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  {location.postal_code && (
                    <p className="text-muted-foreground">CP: {location.postal_code}</p>
                  )}
                </div>
              )}

              {/* Contacto */}
              {(location.phone || location.email) && (
                <div className="text-sm space-y-1">
                  <p className="font-medium text-muted-foreground">Contacto</p>
                  {location.phone && (
                    <p className="text-foreground">📞 {location.phone}</p>
                  )}
                  {location.email && (
                    <p className="text-foreground">📧 {location.email}</p>
                  )}
                </div>
              )}

              {/* Horarios */}
              {location.business_hours && (
                <div className="text-sm space-y-1">
                  <p className="font-medium text-muted-foreground">Horarios</p>
                  <p className="text-foreground text-xs">
                    {typeof location.business_hours === 'string' 
                      ? location.business_hours 
                      : JSON.stringify(location.business_hours)
                    }
                  </p>
                </div>
              )}

              {/* Fotos */}
              {location.images && location.images.length > 0 && (
                <div>
                  <p className="font-medium text-muted-foreground text-sm mb-2">Fotos</p>
                  <div className="grid grid-cols-3 gap-2">
                    {location.images.slice(0, 6).map((imageUrl, idx) => (
                      <img
                        key={idx}
                        src={imageUrl}
                        alt={`${location.name} - ${idx + 1}`}
                        className="w-full h-24 object-cover rounded-md"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Botón Seleccionar */}
              {!location.is_assigned && (
                <div className="pt-3 border-t">
                  <Button
                    onClick={() => handleSelectLocation(location.id)}
                    disabled={updating === location.id}
                    className="w-full"
                    variant="outline"
                  >
                    {updating === location.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Seleccionando...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Seleccionar Sede de Trabajo
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
