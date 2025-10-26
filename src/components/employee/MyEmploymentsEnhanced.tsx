import React, { useState, useEffect } from 'react';
import { Briefcase, Crown, CheckCircle2, Plus, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEmployeeBusinesses } from '@/hooks/useEmployeeBusinesses';
import { useEmployeeTimeOff, TimeOffType } from '@/hooks/useEmployeeTimeOff';
import { BusinessEmploymentCard, EnhancedBusiness } from './BusinessEmploymentCard';
import { TimeOffRequestModal } from './TimeOffRequestModal';
import { ConfirmEndEmploymentDialog } from './ConfirmEndEmploymentDialog';
import { EmploymentDetailModal } from './EmploymentDetailModal';
import supabase from '@/lib/supabase';
import { toast } from 'sonner';

interface MyEmploymentsProps {
  employeeId: string;
  onJoinBusiness?: () => void;
}

export function MyEmployments({ employeeId, onJoinBusiness }: MyEmploymentsProps) {
  const [showPrevious, setShowPrevious] = useState(false);
  const [enrichedBusinesses, setEnrichedBusinesses] = useState<EnhancedBusiness[]>([]);
  const { businesses, loading, error } = useEmployeeBusinesses(employeeId, true);
  const { createRequest } = useEmployeeTimeOff(employeeId);

  // Modales
  const [selectedBusinessForTimeOff, setSelectedBusinessForTimeOff] = useState<{
    id: string;
    name: string;
    type: TimeOffType;
  } | null>(null);
  
  const [selectedBusinessForEnd, setSelectedBusinessForEnd] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [selectedBusinessForDetails, setSelectedBusinessForDetails] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Enriquecer negocios con información extendida
  useEffect(() => {
    const enrichBusinesses = async () => {
      if (businesses.length === 0) {
        setEnrichedBusinesses([]);
        return;
      }

      const enriched = await Promise.all(
        businesses.map(async (business) => {
          try {
            // Verificar si es owner
            const { data: ownerData } = await supabase
              .from('businesses')
              .select('owner_id')
              .eq('id', business.id)
              .single();

            const isOwner = ownerData?.owner_id === employeeId;

            // Obtener datos extendidos del empleado
            const { data: employeeData } = await supabase
              .from('business_employees')
              .select(`
                location_id,
                role,
                employee_type,
                job_title,
                is_active,
                locations:location_id (
                  name,
                  address
                )
              `)
              .eq('business_id', business.id)
              .eq('employee_id', employeeId)
              .single();

            // Calificación promedio del empleado
            const { data: reviewsData } = await supabase
              .from('reviews')
              .select('rating')
              .eq('employee_id', employeeId)
              .eq('business_id', business.id)
              .eq('is_visible', true);

            const avgRating = reviewsData && reviewsData.length > 0
              ? reviewsData.reduce((acc, r) => acc + r.rating, 0) / reviewsData.length
              : 0;

            // Contar servicios
            const { count: servicesCount } = await supabase
              .from('employee_services')
              .select('*', { count: 'exact', head: true })
              .eq('employee_id', employeeId)
              .eq('business_id', business.id)
              .eq('is_active', true);

            const location = Array.isArray(employeeData?.locations)
              ? employeeData.locations[0]
              : employeeData?.locations;

            return {
              ...business,
              isOwner,
              location_id: employeeData?.location_id || null,
              location_name: location?.name || null,
              employee_avg_rating: avgRating,
              employee_total_reviews: reviewsData?.length || 0,
              services_count: servicesCount || 0,
              job_title: employeeData?.job_title || null,
              role: employeeData?.role || null,
              employee_type: employeeData?.employee_type || null,
            };
          } catch {
            // Error enriching business - usar valores por defecto
            return {
              ...business,
              isOwner: false,
              location_id: null,
              location_name: null,
              employee_avg_rating: 0,
              employee_total_reviews: 0,
              services_count: 0,
              job_title: null,
              role: null,
              employee_type: null,
            };
          }
        })
      );

      setEnrichedBusinesses(enriched);
    };

    enrichBusinesses();
  }, [businesses, employeeId]);

  const handleRequestTimeOff = (businessId: string, type: TimeOffType) => {
    const business = enrichedBusinesses.find(b => b.id === businessId);
    if (business) {
      setSelectedBusinessForTimeOff({
        id: businessId,
        name: business.name,
        type
      });
    }
  };

  const handleSubmitTimeOff = async (
    type: TimeOffType,
    startDate: string,
    endDate: string,
    notes: string
  ) => {
    if (!selectedBusinessForTimeOff) return;
    
    await createRequest(
      selectedBusinessForTimeOff.id,
      type,
      startDate,
      endDate,
      notes
    );
  };

  const handleEndEmployment = (businessId: string) => {
    const business = enrichedBusinesses.find(b => b.id === businessId);
    if (business) {
      setSelectedBusinessForEnd({
        id: businessId,
        name: business.name
      });
    }
  };

  const handleConfirmEndEmployment = async () => {
    if (!selectedBusinessForEnd) return;

    try {
      // Marcar como inactivo
      const { error: updateError } = await supabase
        .from('business_employees')
        .update({
          is_active: false,
          termination_date: new Date().toISOString()
        })
        .eq('business_id', selectedBusinessForEnd.id)
        .eq('employee_id', employeeId);

      if (updateError) throw updateError;

      // Desactivar servicios
      const { error: servicesError } = await supabase
        .from('employee_services')
        .update({ is_active: false })
        .eq('business_id', selectedBusinessForEnd.id)
        .eq('employee_id', employeeId);

      if (servicesError) throw servicesError;

      toast.success('Empleo finalizado correctamente');
      
      // Refrescar lista
      window.location.reload();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al finalizar empleo';
      toast.error(errorMessage);
      throw err;
    }
  };

  const handleViewDetails = (businessId: string) => {
    const business = enrichedBusinesses.find(b => b.id === businessId);
    if (business) {
      setSelectedBusinessForDetails({
        id: businessId,
        name: business.name
      });
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Separar empleos activos y anteriores
  const activeEmployments = enrichedBusinesses.filter(b => b.id); // TODO: Filtrar por is_active
  const previousEmployments: EnhancedBusiness[] = [];

  // Contar propietarios y empleados
  const ownedCount = activeEmployments.filter(b => b.isOwner).length;
  const employeeCount = activeEmployments.filter(b => !b.isOwner).length;

  return (
    <>
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Mis Empleos</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Negocios donde estás activo como empleado, administrador o propietario
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={onJoinBusiness}
              className="min-h-[44px] bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Unirse a Negocio
            </Button>
            {previousEmployments.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPrevious(!showPrevious)}
                className="min-h-[44px]"
              >
                <Clock className="h-4 w-4 mr-2" />
                {showPrevious ? 'Ocultar Anteriores' : 'Ver Anteriores'}
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{activeEmployments.length}</p>
                  <p className="text-sm text-muted-foreground">Total Vínculos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{ownedCount}</p>
                  <p className="text-sm text-muted-foreground">Como Propietario</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2 lg:col-span-1">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{employeeCount}</p>
                  <p className="text-sm text-muted-foreground">Como Empleado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Employments */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Vínculos Activos</h3>
          {activeEmployments.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No tienes empleos activos</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Solicita unirte a un negocio para comenzar
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {activeEmployments.map((business) => (
                <BusinessEmploymentCard
                  key={business.id}
                  business={business}
                  onViewDetails={() => handleViewDetails(business.id)}
                  onRequestTimeOff={(type) => handleRequestTimeOff(business.id, type)}
                  onEndEmployment={() => handleEndEmployment(business.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Previous Employments (si hay) */}
        {showPrevious && previousEmployments.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Empleos Anteriores</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {previousEmployments.map((business) => (
                <BusinessEmploymentCard
                  key={business.id}
                  business={business}
                  onViewDetails={() => handleViewDetails(business.id)}
                  onRequestTimeOff={(type) => handleRequestTimeOff(business.id, type)}
                  onEndEmployment={() => handleEndEmployment(business.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      <TimeOffRequestModal
        open={!!selectedBusinessForTimeOff}
        onClose={() => setSelectedBusinessForTimeOff(null)}
        businessId={selectedBusinessForTimeOff?.id || ''}
        businessName={selectedBusinessForTimeOff?.name || ''}
        defaultType={selectedBusinessForTimeOff?.type || 'vacation'}
        onSubmit={handleSubmitTimeOff}
      />

      <ConfirmEndEmploymentDialog
        open={!!selectedBusinessForEnd}
        onClose={() => setSelectedBusinessForEnd(null)}
        businessName={selectedBusinessForEnd?.name || ''}
        onConfirm={handleConfirmEndEmployment}
      />

      <EmploymentDetailModal
        open={!!selectedBusinessForDetails}
        onClose={() => setSelectedBusinessForDetails(null)}
        businessId={selectedBusinessForDetails?.id || ''}
        employeeId={employeeId}
        businessName={selectedBusinessForDetails?.name || ''}
      />
    </>
  );
}
