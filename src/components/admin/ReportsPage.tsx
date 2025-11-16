// ============================================================================
// COMPONENT: ReportsPage
// Página de reportes financieros con dashboard y exportación
// ============================================================================

import React, { Suspense, lazy, useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { SuspenseFallback } from '@/components/ui/loading-spinner';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { usePreferredLocation } from '@/hooks/usePreferredLocation';
import { Label } from '@/components/ui/label';
import { PermissionGate } from '@/components/ui/PermissionGate';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { User } from '@/types/types';

// Lazy load dashboard pesado
const EnhancedFinancialDashboard = lazy(() =>
  import('@/components/transactions/EnhancedFinancialDashboard').then(module => ({
    default: module.EnhancedFinancialDashboard
  }))
);

interface ReportsPageProps {
  businessId: string;
  locationId?: string;
  user: User;
}

export function ReportsPage({ businessId, locationId: initialLocationId, user }: ReportsPageProps) {
  const { locations, services, fetchLocations, fetchServices } = useSupabaseData({ user, autoFetch: false });
  const { preferredLocationId } = usePreferredLocation(businessId);
  
  // Estado local para sede seleccionada (inicia con preferida o prop)
  const [selectedLocationId, setSelectedLocationId] = useState<string | undefined>(
    initialLocationId || preferredLocationId || undefined
  );

  useEffect(() => {
    fetchLocations(businessId);
    fetchServices(businessId);
  }, [businessId, fetchLocations, fetchServices]);
  
  // Actualizar si cambia la sede preferida y no hay selección manual
  useEffect(() => {
    if (!initialLocationId && preferredLocationId && !selectedLocationId) {
      setSelectedLocationId(preferredLocationId);
    }
  }, [preferredLocationId, initialLocationId, selectedLocationId]);
  
  const handleLocationChange = (value: string) => {
    setSelectedLocationId(value === 'all' ? undefined : value);
  };
  return (
    <PermissionGate permission="reports.view_financial" businessId={businessId} mode="block">
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Reportes Financieros
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Dashboard interactivo con gráficos, filtros y exportación a PDF/CSV/Excel
        </p>
      </div>

      {/* Filtro de Sede */}
      <div className="flex items-center gap-4 p-4 bg-card border rounded-lg">
        <div className="flex-1 max-w-xs">
          <Label htmlFor="location-filter">Filtrar por sede</Label>
          <Select
            value={selectedLocationId || 'all'}
            onValueChange={handleLocationChange}
          >
            <SelectTrigger id="location-filter" className="mt-1">
              <SelectValue placeholder="Todas las sedes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las sedes</SelectItem>
              {locations.map(location => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedLocationId && (
          <p className="text-sm text-muted-foreground">
            Mostrando reportes de: <span className="font-medium text-foreground">
              {locations.find(l => l.id === selectedLocationId)?.name}
            </span>
          </p>
        )}
      </div>

      {/* Dashboard */}
      <Suspense fallback={<SuspenseFallback text="Cargando dashboard financiero..." />}>
        <EnhancedFinancialDashboard 
          businessId={businessId}
          locationId={selectedLocationId}
          locations={locations}
          services={services}
        />
      </Suspense>
    </div>
    </PermissionGate>
  );
}
