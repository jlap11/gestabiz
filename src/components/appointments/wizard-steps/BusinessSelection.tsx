import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Building2 } from 'lucide-react';
import { SimpleSearchBar, type SearchType } from '@/components/ui/SimpleSearchBar';
import { cn } from '@/lib/utils';
import supabase from '@/lib/supabase';
import { usePreferredCity } from '@/hooks/usePreferredCity';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/hooks/useAuth';
import { BOGOTA_REGION_ID, BOGOTA_CITY_ID, BOGOTA_CITY_NAME } from '@/constants';
import { useKV } from '@/lib/useKV';

interface Business {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  // added for category-based filtering
  category_id?: string | null;
}

interface BusinessSelectionProps {
  readonly selectedBusinessId: string | null;
  readonly preferredCityName?: string | null;
  readonly preferredRegionName?: string | null;
  readonly onSelectBusiness: (business: Business) => void;
}

export function BusinessSelection({
  selectedBusinessId,
  preferredCityName: propCityName,
  preferredRegionName: propRegionName,
  onSelectBusiness,
}: BusinessSelectionProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('businesses');
  const hookCityData = usePreferredCity();
  const [cityNameMap, setCityNameMap] = useState<Record<string, string>>({});
  const [locationsCountMap, setLocationsCountMap] = useState<Record<string, number>>({});
  const [cityBusinessIds, setCityBusinessIds] = useState<string[]>([]);
  const [cityLocationIds, setCityLocationIds] = useState<string[]>([]);
  const [displayedBusinesses, setDisplayedBusinesses] = useState<Business[]>([]);
  const [remainingBusinessIds, setRemainingBusinessIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalResults, setTotalResults] = useState<number>(0);
  const { user } = useAuth();
  const PAGE_SIZE = 24;
  const hasLoadedRef = useRef(false);
  // Cargar última búsqueda guardada (si existe)
  const [lastSearch] = useKV<{ term: string; type: SearchType } | null>('last-search', null);
  
  // Helper para detectar UUID (IDs de ciudad/región)
  const isUUID = (value: string | null): boolean => {
    if (!value) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  };
  
  // Usar props si vienen del parent (AppointmentWizard), si no usar hook
  const preferredCityName = propCityName ?? hookCityData.preferredCityName;
  const preferredRegionName = propRegionName ?? hookCityData.preferredRegionName;

  // Helper: obtiene negocios por IDs, activos y públicos
  const fetchBusinessesByIds = useCallback(async (ids: string[]): Promise<Business[]> => {
    if (!ids || ids.length === 0) return [];
    const { data, error } = await supabase
      .from('businesses')
      .select('id, name, description, logo_url, address, city, phone, category_id')
      .in('id', ids)
      .eq('is_active', true)
      .eq('is_public', true);
    if (error) return [];
    return (data as Business[]) || [];
  }, []);

  // Helper: aplica la regla de disponibilidad (servicio+empleado+ubicación activos)
  const applyAvailabilityFilter = useCallback(async (candidateBusinesses: Business[]): Promise<Business[]> => {
    const businessIds = candidateBusinesses.map(b => b.id);
    if (businessIds.length === 0) return [];

    const [servicesRes, locationsRes, employeesRes, empServicesRes] = await Promise.all([
      supabase
        .from('services')
        .select('id, business_id')
        .in('business_id', businessIds)
        .eq('is_active', true),
      supabase
        .from('locations')
        .select('id, business_id')
        .in('business_id', businessIds)
        .eq('is_active', true),
      supabase
        .from('business_employees')
        .select('business_id, employee_id')
        .in('business_id', businessIds)
        .eq('status', 'approved')
        .eq('is_active', true),
      supabase
        .from('employee_services')
        .select('business_id, service_id, location_id, employee_id, is_active')
        .in('business_id', businessIds)
        .eq('is_active', true),
    ]);

    const activeServices = (servicesRes.data || []) as { id: string; business_id: string }[];
    const activeLocations = (locationsRes.data || []) as { id: string; business_id: string }[];
    const activeEmployees = (employeesRes.data || []) as { business_id: string; employee_id: string }[];
    const activeEmpServices = (empServicesRes.data || []) as { business_id: string; service_id: string; location_id: string | null; employee_id: string; is_active: boolean }[];

    const svcByBiz = new Map<string, Set<string>>();
    for (const s of activeServices) {
      if (!svcByBiz.has(s.business_id)) svcByBiz.set(s.business_id, new Set());
      svcByBiz.get(s.business_id)!.add(s.id);
    }

    const locByBiz = new Map<string, Set<string>>();
    for (const l of activeLocations) {
      if (!locByBiz.has(l.business_id)) locByBiz.set(l.business_id, new Set());
      locByBiz.get(l.business_id)!.add(l.id);
    }

    const empByBiz = new Map<string, Set<string>>();
    for (const e of activeEmployees) {
      if (!empByBiz.has(e.business_id)) empByBiz.set(e.business_id, new Set());
      empByBiz.get(e.business_id)!.add(e.employee_id);
    }

    const allowedBusinessIds = new Set<string>();
    for (const es of activeEmpServices) {
      if (!es.location_id) continue;
      const svc = svcByBiz.get(es.business_id);
      const loc = locByBiz.get(es.business_id);
      const emp = empByBiz.get(es.business_id);
      if (!svc || !loc || !emp) continue;
      if (svc.has(es.service_id) && loc.has(es.location_id) && emp.has(es.employee_id)) {
        allowedBusinessIds.add(es.business_id);
      }
    }

    return candidateBusinesses.filter(b => allowedBusinessIds.has(b.id));
  }, []);

  const loadBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const { preferredRegionId, preferredCityId, preferredRegionName: hookRegionName, preferredCityName: hookCityName } = hookCityData;
      const effectiveRegionId = preferredRegionId || null;
      const effectiveCityId = preferredCityId || null;
      const effectiveRegionName = propRegionName ?? hookRegionName ?? null;
      const effectiveCityName = propCityName ?? hookCityName ?? null;

      const { data, error } = await supabase.functions.invoke('search_businesses', {
        body: {
          type: 'initial',
          term: '',
          preferredRegionId: effectiveRegionId,
          preferredRegionName: effectiveRegionName,
          preferredCityId: effectiveCityId,
          preferredCityName: effectiveCityName,
          clientId: user?.id ?? null,
          page: 1,
          pageSize: PAGE_SIZE,
          excludeBusinessIds: [],
        },
      });
      if (error) throw error as Error;
      const result = (data as any) || {};
      const cityOnly = (result.businesses || []) as Business[];

      // Guardar metadata de ciudad y conteos provenientes de la función Edge
      setLocationsCountMap(result.locationsCountMap || {});
      setCityBusinessIds(result.cityBusinessIds || []);
      setCityLocationIds(result.cityLocationIds || []);

      setBusinesses(cityOnly);
      setFilteredBusinesses(cityOnly);
      setDisplayedBusinesses(cityOnly);
      setRemainingBusinessIds([]);
      setCurrentPage(1);
      setTotalResults(result.total || cityOnly.length || 0);
    } catch {
      setBusinesses([]);
      setFilteredBusinesses([]);
      setDisplayedBusinesses([]);
      setRemainingBusinessIds([]);
      setCurrentPage(1);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, [
    propCityName,
    propRegionName,
    user?.id,
    hookCityData.preferredRegionId,
    hookCityData.preferredCityId,
    hookCityData.preferredRegionName,
    hookCityData.preferredCityName,
  ]);

  useEffect(() => {
    // Evitar doble llamada en modo Strict de React
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadBusinesses();
  }, [loadBusinesses]);

  // Si hay una búsqueda previa persistida, aplicarla al montar
  useEffect(() => {
    if (lastSearch && lastSearch.term && lastSearch.type) {
      setSearchTerm(lastSearch.term);
      setSearchType(lastSearch.type);
      // Ejecutar búsqueda inmediata con los valores persistidos
      void handleSearch(lastSearch.term, lastSearch.type);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSearch]);

  // Sincronizar estados cuando cambia el conjunto de negocios (paginación servidor)
  useEffect(() => {
    setSearchTerm('');
    setSearchType('businesses');
    setFilteredBusinesses(businesses);
    setDisplayedBusinesses(businesses);
    setRemainingBusinessIds([]);
  }, [businesses]);

  // Pre-cargar nombres de ciudades para IDs presentes en resultados
  useEffect(() => {
    const cityIds = Array.from(
      new Set(
        filteredBusinesses
          .map((b) => b.city)
          .filter((c): c is string => !!c && isUUID(c))
      )
    );

    const fetchCityNames = async () => {
      if (cityIds.length === 0) return;
      try {
        const { data, error } = await supabase
          .from('cities')
          .select('id, name')
          .in('id', cityIds);
        if (error) return;
        const map: Record<string, string> = { ...cityNameMap };
        for (const row of (data || [])) {
          map[row.id] = row.name;
        }
        setCityNameMap(map);
      } catch {
        // Silent fail - no bloquear UI por nombres
      }
    };

    fetchCityNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredBusinesses]);

  // Imagen placeholder para negocios
  const getBusinessImage = (business: Business): string => {
    if (business.logo_url) return business.logo_url;
    
    // Placeholder basado en el tipo de negocio
    const name = business.name.toLowerCase();
    if (name.includes('salon') || name.includes('beauty') || name.includes('belleza')) {
      return 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=400&fit=crop';
    }
    if (name.includes('spa') || name.includes('relax')) {
      return 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=400&fit=crop';
    }
    if (name.includes('gym') || name.includes('fitness')) {
      return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop';
    }
    if (name.includes('clinic') || name.includes('dental') || name.includes('medic')) {
      return 'https://images.unsplash.com/photo-1629909615184-74f495363b67?w=400&h=400&fit=crop';
    }
    if (name.includes('barberia') || name.includes('barber')) {
      return 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=400&fit=crop';
    }
    // Default business image
    return 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=400&fit=crop';
  };

  // Handle search and filter businesses in real-time
  const handleSearch = useCallback(async (term: string, type: SearchType) => {
    setSearchTerm(term);
    setSearchType(type);

    if (!term || term.trim().length < 2) {
      setFilteredBusinesses(businesses);
      setDisplayedBusinesses(businesses);
      setRemainingBusinessIds([]);
      return;
    }

    const termLower = term.toLowerCase();

    try {
      // Consolidar búsqueda mediante Edge Function para reducir llamadas
      const { preferredRegionId, preferredCityId, preferredRegionName: hookRegionName, preferredCityName: hookCityName } = hookCityData;
      const effectiveRegionId = preferredRegionId || null;
      const effectiveCityId = preferredCityId || null;
      const effectiveRegionName = propRegionName ?? hookRegionName ?? null;
      const effectiveCityName = propCityName ?? hookCityName ?? null;

      const { data, error } = await supabase.functions.invoke('search_businesses', {
        body: {
          type,
          term,
          preferredRegionId: effectiveRegionId,
          preferredRegionName: effectiveRegionName,
          preferredCityId: effectiveCityId,
          preferredCityName: effectiveCityName,
          clientId: user?.id ?? null,
          page: 1,
          pageSize: PAGE_SIZE,
          excludeBusinessIds: [],
        },
      });
      if (error) throw error as Error;
      const result = (data as any) || {};
      const cityOnly = (result.businesses || []) as Business[];
      setLocationsCountMap(result.locationsCountMap || {});
      setFilteredBusinesses(cityOnly);
      setDisplayedBusinesses(cityOnly);
      setRemainingBusinessIds([]);
      setCurrentPage(1);
      setTotalResults(result.total || cityOnly.length || 0);
    } catch {
      setFilteredBusinesses([]);
      setDisplayedBusinesses([]);
      setRemainingBusinessIds([]);
      setCurrentPage(1);
      setTotalResults(0);
    }
  }, [businesses, hookCityData, propCityName, propRegionName]);

  // Debounce para evitar múltiples llamadas al escribir
  const debouncedHandleSearch = useDebounce(handleSearch, 350);

  // Botón Cargar más: pedir siguiente página al servidor evitando duplicados
  const handleLoadMore = async () => {
    if (displayedBusinesses.length >= totalResults) return;
    const { preferredRegionId, preferredCityId, preferredRegionName: hookRegionName, preferredCityName: hookCityName } = hookCityData;
    const effectiveRegionId = preferredRegionId || null;
    const effectiveCityId = preferredCityId || null;
    const effectiveRegionName = propRegionName ?? hookRegionName ?? null;
    const effectiveCityName = propCityName ?? hookCityName ?? null;

    const nextPage = currentPage + 1;
    const excludeIds = displayedBusinesses.map(b => b.id);

    try {
      const { data, error } = await supabase.functions.invoke('search_businesses', {
        body: {
          type: (searchTerm && searchTerm.trim().length >= 2) ? searchType : 'initial',
          term: (searchTerm && searchTerm.trim().length >= 2) ? searchTerm : '',
          preferredRegionId: effectiveRegionId,
          preferredRegionName: effectiveRegionName,
          preferredCityId: effectiveCityId,
          preferredCityName: effectiveCityName,
          clientId: user?.id ?? null,
          page: nextPage,
          pageSize: PAGE_SIZE,
          excludeBusinessIds: excludeIds,
        },
      });
      if (error) throw error as Error;
      const result = (data as any) || {};
      const nextRows = (result.businesses || []) as Business[];
      setLocationsCountMap(result.locationsCountMap || {});
      setDisplayedBusinesses(prev => [...prev, ...nextRows]);
      setCurrentPage(nextPage);
      setTotalResults(result.total || totalResults);
    } catch {
      // No-op: no avanzamos de página si falla
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#8b5cf6] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#94a3b8]">Loading businesses...</p>
        </div>
      </div>
    );
  }
  const isSearching = (searchTerm && searchTerm.trim().length >= 2);

  return (
    <div className="p-4 space-y-4">
      {/* Título */}
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Select a Business
        </h3>
        <p className="text-muted-foreground mb-4">
          Choose the business where you want to book your appointment
        </p>
        {(preferredCityName || preferredRegionName) && (
          <p className="text-xs text-muted-foreground mb-3">
            Preferred location: {preferredCityName || preferredRegionName}
          </p>
        )}

        {/* SearchBar shared component (same dropdown/options as header) - full-bleed */}
        <div className="-mx-3 sm:mx-0 w-full">
            <SimpleSearchBar
              searchTerm={searchTerm}
              searchType={searchType}
              onSearch={debouncedHandleSearch}
            />
        </div>
      </div>

      {/* Resultados */}
      {displayedBusinesses.length > 0 ? (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {displayedBusinesses.map((business) => {
          const isSelected = selectedBusinessId === business.id;

          return (
            <Card
              key={business.id}
              onClick={() => onSelectBusiness(business)}
              className={cn(
                "relative bg-card border rounded-lg overflow-hidden",
                "cursor-pointer transition-all duration-200",
                "hover:border-primary hover:scale-[1.02] hover:shadow-md hover:shadow-primary/15",
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border"
              )}
            >
              {/* Imagen del negocio */}
              <div className="relative w-full aspect-square">
                <img
                  src={getBusinessImage(business)}
                  alt={business.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Checkmark cuando está seleccionado */}
                {isSelected && (
                  <div
                    className={cn(
                      "absolute top-2 right-2 w-7 h-7 bg-primary rounded-full",
                      "flex items-center justify-center",
                      "animate-in zoom-in duration-200"
                    )}
                  >
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* Información del negocio */}
              <div className="p-3 bg-muted/50">
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  {business.name}
                </h3>
                <div className="mb-2">
                  <Badge variant="outline" className="text-[10px] sm:text-xs">
                    {`Sedes en ${preferredCityName ?? hookCityData.preferredCityName ?? 'esta ciudad'}: ${locationsCountMap[business.id] ?? 0}`}
                  </Badge>
                </div>
                
                {business.description && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {business.description}
                  </p>
                )}

                <div className="space-y-1">
                  {business.address && (
                    <p className="text-xs text-[#64748b] flex items-center gap-1">
                      {(() => {
                        const cityDisplay = business.city
                          ? (cityNameMap[business.city] || business.city)
                          : '';
                        return `📍 ${cityDisplay ? `${cityDisplay}, ` : ''}${business.address}`;
                      })()}
                    </p>
                  )}
                  {business.phone && (
                    <p className="text-xs text-[#64748b]">
                      📞 {business.phone}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        </div>
        {(displayedBusinesses.length < totalResults) && (
          <div className="mt-4 flex justify-center">
            <Button variant="secondary" onClick={handleLoadMore}>
              Cargar más
            </Button>
          </div>
        )}
        </>
      ) : (
        <div className="p-8 text-center border border-border rounded-lg bg-muted/30">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">{isSearching ? 'No results found' : 'No Businesses Available'}</h3>
          <p className="text-muted-foreground">
            {isSearching
              ? 'No businesses match your search. Try different keywords.'
              : 'There are no active businesses at the moment.'}
          </p>
        </div>
      )}
    </div>
  );
}
