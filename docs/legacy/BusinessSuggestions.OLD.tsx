import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Building2, TrendingUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

interface SimpleBusiness {
  id: string;
  name: string;
  description?: string;
  logo_url: string | null;
  banner_url?: string | null;
  average_rating: number;
  total_reviews?: number;
  category_name?: string;
  review_count?: number;
  city?: string;
  state?: string;
}

interface BusinessSuggestionsProps {
  // ✅ NEW v2.0: Recibir sugerencias desde useClientDashboard (consolidado)
  suggestions: SimpleBusiness[];
  isLoading: boolean;
  preferredCityName: string | null;
  onBusinessSelect?: (businessId: string) => void;
}


export function BusinessSuggestions({
  suggestions,
  isLoading,
  preferredCityName,
  onBusinessSelect
}: Readonly<BusinessSuggestionsProps>) {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(true)

  // ✅ Renderizado directo desde props (sin useEffect ni fetch)
  return (

  // Cargar múltiples negocios previamente reservados por el cliente (completados)
  const loadPreviouslyBookedBusinesses = async (userId: string): Promise<SimpleBusiness[]> => {
    // Traer citas completadas del cliente
    const { data: completed } = await supabase
      .from('appointments')
      .select('id, business_id')
      .eq('client_id', userId)
      .eq('status', 'completed');

    if (!completed || completed.length === 0) return [];

    // Contar por negocio
    const countByBusiness = new Map<string, number>();
    for (const a of completed) {
      if (!a.business_id) continue;
      countByBusiness.set(a.business_id, (countByBusiness.get(a.business_id) || 0) + 1);
    }

    const businessIds = Array.from(countByBusiness.keys());
    if (businessIds.length === 0) return [];

    // Traer datos de negocios activos y públicos
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id, name, logo_url, average_rating')
      .in('id', businessIds)
      .eq('is_active', true)
      .eq('is_public', true);

    if (!businesses || businesses.length === 0) return [];

    // Ordenar por frecuencia de reservas descendente
    const sorted = [...businesses].sort((a, b) => {
      const ca = countByBusiness.get(a.id) || 0;
      const cb = countByBusiness.get(b.id) || 0;
      return cb - ca;
    });

    return sorted.map((b) => ({
      id: b.id,
      name: b.name,
      logo_url: b.logo_url,
      average_rating: b.average_rating,
      // Usamos review_count para mostrar la cantidad de reservas como pista visual
      review_count: countByBusiness.get(b.id),
    }));
  };

  const loadSuggestedBusinesses = async (
    cityId: string | null,
    cityName: string | null,
    regionId: string | null,
    regionName: string | null,
    excludeIds: string[]
  ) => {
    if (!cityId && !cityName && !regionId && !regionName) return [];

    const query = supabase
      .from('locations')
      .select('city, state, business_id')
      .eq('is_active', true);

    let filtered = query as any;

    // Cuando hay IDs, combinar igualdad por ID con coincidencia por nombre para compatibilidad
    if (cityId || regionId) {
      const clauses: string[] = [];
      if (cityId) {
        clauses.push(`city.eq.${cityId}`);
        if (cityName) {
          clauses.push(`city.ilike.%${cityName}%`);
        }
      }
      if (regionId) {
        clauses.push(`state.eq.${regionId}`);
        if (regionName) {
          clauses.push(`state.ilike.%${regionName}%`);
          // Considerar coincidencia en city para regiones tipo Bogotá
          const norm = (regionName || '').toLowerCase();
          if (norm.includes('bogota')) {
            clauses.push('city.ilike.%Bogotá%');
          }
        }
      }
      filtered = (filtered as any).or(clauses.join(','));
    } else {
      // Fallback: Normalizar y filtrar solo por nombre cuando no hay IDs
      const normalize = (str: string) => {
        return str
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[,.]/g, '')
          .trim()
          .toLowerCase();
      };
      if (!cityName && regionName) {
        const normalizedRegion = normalize(regionName);
        if (normalizedRegion.includes('bogota')) {
          filtered = filtered.ilike('city', '%Bogot%');
        } else {
          filtered = filtered.ilike('state', `%${regionName.split(',')[0].trim()}%`);
        }
      } else if (cityName) {
        const normalizedCity = normalize(cityName);
        if (normalizedCity.includes('bogota')) {
          filtered = filtered.ilike('city', '%Bogot%');
        } else {
          filtered = filtered.ilike('city', `%${cityName}%`);
        }
      }
    }

    const { data: locations } = await filtered;

    if (!locations || locations.length === 0) return [];

    // Get unique business IDs
    const excludeSet = new Set<string>(excludeIds || []);
    const uniqueIds = Array.from(new Set(
      locations
        .map((l) => l.business_id)
        .filter((id) => id && !excludeSet.has(id))
    ));

    if (uniqueIds.length === 0) return [];

    // Fetch ALL businesses, not just first 10
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id, name, logo_url, average_rating')
      .in('id', uniqueIds);

    if (!businesses) return [];

    // Deduplicate by business ID (in case a business has multiple locations)
    const uniqueBusinesses = Array.from(
      new Map(businesses.map(b => [b.id, b])).values()
    );

    return uniqueBusinesses.map((b) => ({
      id: b.id,
      name: b.name,
      logo_url: b.logo_url,
      average_rating: b.average_rating,
      city: cityName || regionName || undefined
    }));
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const prevsAll = await loadPreviouslyBookedBusinesses(userId);
        setAllPreviousBusinesses(prevsAll);
        setPrevCurrentPage(0);
        setPreviousBusinesses(prevsAll.slice(0, PREV_ITEMS_PER_PAGE));

        const recents = await loadRecentlyBookedBusinesses(userId);
        setRecentBusinesses(recents);

        const suggested = await loadSuggestedBusinesses(
          preferredCityId ?? null,
          preferredCityName,
          preferredRegionId ?? null,
          preferredRegionName,
          [...new Set([...(prevsAll.map(p => p.id)), ...(recents.map(r => r.id))])]
        );
        
        setAllSuggestedBusinesses(suggested);
        setCurrentPage(0);
        // Show first 10
        setDisplayedBusinesses(suggested.slice(0, ITEMS_PER_PAGE));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId, preferredCityId, preferredCityName, preferredRegionId, preferredRegionName]);

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    const startIndex = nextPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    
    setCurrentPage(nextPage);
    setDisplayedBusinesses([
      ...displayedBusinesses,
      ...allSuggestedBusinesses.slice(startIndex, endIndex)
    ]);
  };

  const handleLoadMorePrev = () => {
    const nextPage = prevCurrentPage + 1;
    const startIndex = nextPage * PREV_ITEMS_PER_PAGE;
    const endIndex = startIndex + PREV_ITEMS_PER_PAGE;
    setPrevCurrentPage(nextPage);
    setPreviousBusinesses([
      ...previousBusinesses,
      ...allPreviousBusinesses.slice(startIndex, endIndex)
    ]);
  };

  const hasMoreBusinesses = (currentPage + 1) * ITEMS_PER_PAGE < allSuggestedBusinesses.length;
  const hasMorePrev = (prevCurrentPage + 1) * PREV_ITEMS_PER_PAGE < allPreviousBusinesses.length;

  const renderBusinessCard = (business: SimpleBusiness, isFavorite: boolean = false) => (
    <Card 
      key={business.id}
      className={cn(
        "cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]",
        isFavorite && "border-primary border-2"
      )}
      onClick={() => onBusinessSelect?.(business.id)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Logo y nombre */}
          <div className="flex items-start gap-3">
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.name}
                className="w-12 h-12 rounded-lg object-cover border-2 border-border"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center border-2 border-primary/30">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground truncate">
                {business.name}
              </h4>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold text-foreground">
                {business.average_rating.toFixed(1)}
              </span>
            </div>
            {business.review_count && business.review_count > 0 && (
              <span className="text-xs text-muted-foreground">
                ({business.review_count})
              </span>
            )}
          </div>

          {/* Ubicación */}
          {business.city && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{business.city}</span>
            </div>
          )}

          {/* Badge de favorito */}
          {isFavorite && (
            <Badge variant="default" className="w-full justify-center">
              Tu favorito
            </Badge>
          )}

          {/* Botón de acción */}
          <Button
            variant={isFavorite ? "default" : "outline"}
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onBusinessSelect?.(business.id);
            }}
          >
            {isFavorite ? 'Reservar de nuevo' : 'Agendar cita'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('businessSuggestions.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (previousBusinesses.length === 0 && displayedBusinesses.length === 0) {
    return null; // No mostrar nada si no hay sugerencias
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('businessSuggestions.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Negocios frecuentes (visitas completadas) */}
          {previousBusinesses.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Tus negocios frecuentes
              </h3>
              <div className="space-y-3">
                {previousBusinesses.map((business) => renderBusinessCard(business, true))}
              </div>
              {hasMorePrev && (
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={handleLoadMorePrev}
                >
                  {t('businessSuggestions.viewMore')}
                </Button>
              )}
            </div>
          )}

          {/* Negocios reservados recientemente (colapsable por defecto) */}
          {recentBusinesses.length > 0 && (
            <div className="space-y-2">
              <Collapsible open={recentOpen} onOpenChange={setRecentOpen}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Negocios reservados recientemente
                  </h3>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1">
                      {recentOpen ? 'Ocultar' : 'Mostrar'}
                      <ChevronDown className={cn('h-4 w-4 transition-transform', recentOpen && 'rotate-180')} />
                    </Button>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent>
                  <div className="space-y-3 mt-2">
                    {recentBusinesses.map((business) => renderBusinessCard(business, false))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {/* Negocios en la ciudad */}
          {displayedBusinesses.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {t('businessSuggestions.inCity')} {preferredCityName || preferredRegionName}
              </h3>
              <div className="space-y-3">
                {displayedBusinesses.map((business) => renderBusinessCard(business, false))}
              </div>
              
              {/* "Ver más..." button */}
              {hasMoreBusinesses && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={handleLoadMore}
                >
                  {t('businessSuggestions.viewMore')}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
  // Cargar negocios reservados recientemente (pendiente/confirmada/en progreso/reprogramada)
  const loadRecentlyBookedBusinesses = async (userId: string): Promise<SimpleBusiness[]> => {
    const { data: upcoming } = await supabase
      .from('appointments')
      .select('id, business_id, start_time, status')
      .eq('client_id', userId)
      .in('status', ['pending', 'confirmed', 'in_progress'])
      .order('start_time', { ascending: false });

    if (!upcoming || upcoming.length === 0) return [];

    const uniqueIds: string[] = [];
    const seen = new Set<string>();
    for (const a of upcoming) {
      if (!a.business_id) continue;
      if (!seen.has(a.business_id)) {
        seen.add(a.business_id);
        uniqueIds.push(a.business_id);
      }
    }

    if (uniqueIds.length === 0) return [];

    const { data: businesses } = await supabase
      .from('businesses')
      .select('id, name, logo_url, average_rating')
      .in('id', uniqueIds)
      .eq('is_active', true)
      .eq('is_public', true);

    return (businesses || []).map(b => ({
      id: b.id,
      name: b.name,
      logo_url: b.logo_url,
      average_rating: b.average_rating,
    }));
  };
