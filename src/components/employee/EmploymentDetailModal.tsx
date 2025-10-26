import React, { useState, useEffect } from 'react';
import { Building2, MapPin, DollarSign, BarChart3, Briefcase } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LocationSelector } from './LocationSelector';
import { ServiceSelector } from './ServiceSelector';
import { WorkScheduleEditor } from './WorkScheduleEditor';
import supabase from '@/lib/supabase';

interface EmploymentDetailModalProps {
  open: boolean;
  onClose: () => void;
  businessId: string;
  employeeId: string;
  businessName: string;
}

interface BusinessDetails {
  // Business info (matches RPC function columns)
  business_id: string;
  business_name: string;
  business_description?: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  average_rating?: number;
  total_reviews?: number;
  category_name?: string;
  
  // Employment info
  location_id?: string;
  location_name?: string;
  location_address?: string;
  role?: string;
  employee_type?: string;
  job_title?: string;
  salary_base?: number;
  salary_type?: string;
  contract_type?: string;
  hire_date?: string;
  is_active?: boolean;
  
  // Stats
  employee_avg_rating?: number;
  employee_total_reviews?: number;
  services_count?: number;
  completed_appointments?: number;
}

export function EmploymentDetailModal({
  open,
  onClose,
  businessId,
  employeeId,
  businessName
}: EmploymentDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<BusinessDetails | null>(null);
  const [activeTab, setActiveTab] = useState('info');

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const fetchDetails = React.useCallback(async () => {
    try {
      setLoading(true);

      // Usar RPC function get_employee_business_details
      const { data, error } = await supabase
        .rpc('get_employee_business_details', {
          p_employee_id: employeeId,
          p_business_id: businessId
        }) as { data: BusinessDetails[] | null; error: Error | null };

      if (error) throw error;

      if (data && Array.isArray(data) && data.length > 0) {
        setDetails(data[0]);
      }
    } finally {
      setLoading(false);
    }
  }, [employeeId, businessId]);

  useEffect(() => {
    if (open && businessId && employeeId) {
      fetchDetails();
    }
  }, [open, businessId, employeeId, fetchDetails]);

  if (!details && !loading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {details?.logo_url ? (
                <img
                  src={details.logo_url}
                  alt={businessName}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
              )}
              <div>
                <DialogTitle className="text-xl">{businessName}</DialogTitle>
                {details?.job_title && (
                  <p className="text-sm text-muted-foreground">{details.job_title}</p>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="info" className="text-xs sm:text-sm">
                <Building2 className="h-4 w-4 mr-1" />
                Info
              </TabsTrigger>
              <TabsTrigger value="locations" className="text-xs sm:text-sm">
                <MapPin className="h-4 w-4 mr-1" />
                Sedes
              </TabsTrigger>
              <TabsTrigger value="services" className="text-xs sm:text-sm">
                <Briefcase className="h-4 w-4 mr-1" />
                Servicios
              </TabsTrigger>
              <TabsTrigger value="schedule" className="text-xs sm:text-sm">
                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Horario
              </TabsTrigger>
              <TabsTrigger value="salary" className="text-xs sm:text-sm">
                <DollarSign className="h-4 w-4 mr-1" />
                Salario
              </TabsTrigger>
              <TabsTrigger value="stats" className="text-xs sm:text-sm">
                <BarChart3 className="h-4 w-4 mr-1" />
                Stats
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Información General */}
            <TabsContent value="info" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Información del Negocio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {details?.business_description && (
                    <div>
                      <p className="font-medium text-muted-foreground mb-1">Descripción</p>
                      <p className="text-foreground">{details.business_description}</p>
                    </div>
                  )}

                  {details?.category_name && (
                    <div>
                      <p className="font-medium text-muted-foreground mb-1">Categoría</p>
                      <Badge variant="secondary">{details.category_name}</Badge>
                    </div>
                  )}



                  {(details?.average_rating !== undefined && details?.average_rating > 0) && (
                    <div>
                      <p className="font-medium text-muted-foreground mb-1">Calificación del Negocio</p>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-foreground">
                          ⭐ {details.average_rating.toFixed(1)}/5
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({details.total_reviews} reviews)
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t">
                    <p className="font-medium text-muted-foreground mb-2">Contacto</p>
                    <div className="space-y-2">
                      {details?.email && (
                        <p className="text-foreground">📧 {details.email}</p>
                      )}
                      {details?.phone && (
                        <p className="text-foreground">📞 {details.phone}</p>
                      )}
                      {details?.website && (
                        <p className="text-foreground">
                          🌐 <a href={details.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {details.website}
                          </a>
                        </p>
                      )}
                      {(details?.address || details?.city || details?.state) && (
                        <p className="text-foreground">
                          📍 {[details.address, details.city, details.state, details.country]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tu Empleo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {details?.hire_date && (
                    <div>
                      <p className="font-medium text-muted-foreground mb-1">Fecha de Inicio</p>
                      <p className="text-foreground">{formatDate(details.hire_date)}</p>
                    </div>
                  )}

                  {details?.role && (
                    <div>
                      <p className="font-medium text-muted-foreground mb-1">Rol</p>
                      <Badge>{details.role}</Badge>
                    </div>
                  )}

                  {details?.contract_type && (
                    <div>
                      <p className="font-medium text-muted-foreground mb-1">Tipo de Contrato</p>
                      <p className="text-foreground capitalize">{details.contract_type.replace('_', ' ')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: Sedes */}
            <TabsContent value="locations" className="mt-4">
              <LocationSelector
                businessId={businessId}
                employeeId={employeeId}
                currentLocationId={details?.location_id}
                onLocationChanged={fetchDetails}
              />
            </TabsContent>

            {/* Tab 3: Servicios */}
            <TabsContent value="services" className="mt-4">
              <ServiceSelector
                businessId={businessId}
                employeeId={employeeId}
                currentLocationId={details?.location_id}
                onServicesChanged={fetchDetails}
              />
            </TabsContent>

            {/* Tab 4: Horario */}
            <TabsContent value="schedule" className="mt-4">
              <WorkScheduleEditor
                businessId={businessId}
                employeeId={employeeId}
                onScheduleChanged={fetchDetails}
              />
            </TabsContent>

            {/* Tab 5: Salario */}
            <TabsContent value="salary" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Información de Salario</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {details?.salary_base !== undefined && details.salary_base > 0 ? (
                    <>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Salario Base</p>
                        <p className="text-2xl font-bold text-foreground">
                          {formatCurrency(details.salary_base)}
                        </p>
                        {details.salary_type && (
                          <p className="text-sm text-muted-foreground mt-1 capitalize">
                            Tipo: {details.salary_type.replace('_', ' ')}
                          </p>
                        )}
                      </div>

                      <div className="pt-4 border-t space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Beneficios Estimados</p>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Seguridad Social (10%)</p>
                            <p className="font-medium text-foreground">
                              {formatCurrency(details.salary_base * 0.10)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Salud (5%)</p>
                            <p className="font-medium text-foreground">
                              {formatCurrency(details.salary_base * 0.05)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Pensión (5%)</p>
                            <p className="font-medium text-foreground">
                              {formatCurrency(details.salary_base * 0.05)}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t mt-3">
                          <div className="flex justify-between items-center">
                            <p className="font-medium text-foreground">Total Estimado Mensual</p>
                            <p className="text-xl font-bold text-primary">
                              {formatCurrency(details.salary_base * 1.20)}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            * Incluye beneficios estimados. Los valores exactos pueden variar.
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No se ha configurado información salarial</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Contacta al administrador del negocio
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 5: Estadísticas */}
            <TabsContent value="stats" className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Citas Completadas</p>
                      <p className="text-3xl font-bold text-foreground">
                        {details?.completed_appointments || 0}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Servicios Activos</p>
                      <p className="text-3xl font-bold text-foreground">
                        {details?.services_count || 0}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Calificación Promedio</p>
                      <p className="text-3xl font-bold text-foreground">
                        {details?.employee_avg_rating 
                          ? `⭐ ${details.employee_avg_rating.toFixed(1)}`
                          : 'N/A'
                        }
                      </p>
                      {details?.employee_total_reviews !== undefined && details.employee_total_reviews > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {details.employee_total_reviews} review{details.employee_total_reviews > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Días Trabajados</p>
                      <p className="text-3xl font-bold text-foreground">
                        {details?.hire_date 
                          ? Math.floor((new Date().getTime() - new Date(details.hire_date).getTime()) / (1000 * 60 * 60 * 24))
                          : 0
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {details?.employee_avg_rating !== undefined && details.employee_avg_rating > 0 && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-base">Distribución de Calificaciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map(star => {
                        const percentage = details.employee_total_reviews 
                          ? Math.random() * 100 // TODO: Real distribution from reviews table
                          : 0;
                        return (
                          <div key={star} className="flex items-center gap-3">
                            <span className="text-sm w-12">{star} ⭐</span>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-12 text-right">
                              {percentage.toFixed(0)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
