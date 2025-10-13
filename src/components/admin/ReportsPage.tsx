// ============================================================================
// COMPONENT: ReportsPage
// Página de reportes financieros con dashboard y exportación
// ============================================================================

import React, { Suspense, lazy, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { SuspenseFallback } from '@/components/ui/loading-spinner';
import { useSupabaseData } from '@/hooks/useSupabaseData';
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

export function ReportsPage({ businessId, locationId, user }: ReportsPageProps) {
  const { locations, services, fetchLocations, fetchServices } = useSupabaseData({ user, autoFetch: false });

  useEffect(() => {
    fetchLocations(businessId);
    fetchServices(businessId);
  }, [businessId, fetchLocations, fetchServices]);
  return (
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

      {/* Dashboard */}
      <Suspense fallback={<SuspenseFallback text="Cargando dashboard financiero..." />}>
        <EnhancedFinancialDashboard 
          businessId={businessId}
          locationId={locationId}
          locations={locations}
          services={services}
        />
      </Suspense>
    </div>
  );
}
