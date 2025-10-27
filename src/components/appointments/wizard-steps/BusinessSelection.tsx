import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Check, Building2 } from 'lucide-react';
import { SimpleSearchBar, type SearchType } from '@/components/ui/SimpleSearchBar';
import { cn } from '@/lib/utils';
import supabase from '@/lib/supabase';
import { usePreferredCity } from '@/hooks/usePreferredCity';

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
  
  // Usar props si vienen del parent (AppointmentWizard), si no usar hook
  const preferredCityName = propCityName ?? hookCityData.preferredCityName;
  const preferredRegion = propRegionName ?? hookCityData.preferredRegionName;

  const loadBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('locations').select('city, state, business_id');
      
      // Función para normalizar texto (remover acentos y convertir a minúsculas)
      const normalize = (str: string) => {
        return str.normalize('NFD').replaceAll(/[\u0300-\u036f]/g, '').toLowerCase();
      };
      
      // Helper para mapear nombres conocidos (Bogotá D.C. -> Bogotá/Cundinamarca)
      const isBogotaCity = preferredCityName && normalize(preferredCityName).includes('bogota');
      const isBogotaRegion = preferredRegion && normalize(preferredRegion).includes('bogota');
      
      // Filtrar por ciudad preferida si está disponible
      if (preferredCityName) {
        if (isBogotaCity) {
          // Coincidencias flexibles para Bogotá
          query = query.ilike('city', '%Bogot%');
        } else {
          query = query.ilike('city', `%${preferredCityName}%`);
        }
      }
      
      // Si hay región y no se especificó ciudad, filtrar por región
      if (preferredRegion && !preferredCityName) {
        if (isBogotaRegion) {
          // Bogotá D.C. mapea al departamento Cundinamarca y ciudad Bogotá
          query = query.ilike('state', '%Cundinamarca%').ilike('city', '%Bogot%');
        } else {
          query = query.ilike('state', `%${preferredRegion}%`);
        }
      }

      const { data: locations, error: locError } = await query;

      if (locError) throw locError;

      // Obtener IDs únicos de negocios
      interface LocationData {
        business_id: string;
      }
      const uniqueBusinessIds = Array.from(
        new Set((locations || []).map((l: LocationData) => l.business_id).filter(Boolean))
      );

      if (uniqueBusinessIds.length === 0) {
        setBusinesses([]);
        return;
      }

      // Obtener detalles de los negocios (incluye category_id)
      const { data: businessesData, error: bizError } = await supabase
        .from('businesses')
        .select('id, name, description, logo_url, address, city, phone, category_id')
        .in('id', uniqueBusinessIds)
        .eq('is_active', true)
        .eq('is_public', true)
        .order('name');

      if (bizError) throw bizError;
      const businessList = (businessesData as Business[]) || [];
      setBusinesses(businessList);
      setFilteredBusinesses(businessList);
    } catch {
      setBusinesses([]);
      setFilteredBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, [preferredCityName, preferredRegion]);

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  // Reset search when businesses change
  useEffect(() => {
    setSearchTerm('');
    setSearchType('businesses');
    setFilteredBusinesses(businesses);
  }, [businesses]);

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
      return;
    }

    const termLower = term.toLowerCase();

    switch (type) {
      case 'businesses': {
        try {
          const { data, error } = await supabase
            .from('businesses')
            .select('id, name, description, logo_url, address, city, phone, category_id')
            .eq('is_active', true)
            .eq('is_public', true)
            .ilike('name', `%${term}%`)
            .limit(20);

          if (error) {
            setFilteredBusinesses([]);
          } else {
            setFilteredBusinesses((data || []) as Business[]);
          }
        } catch {
          setFilteredBusinesses([]);
        }
        break;
      }
      case 'services': {
        try {
          const { data } = await supabase
            .from('services')
            .select('business_id')
            .ilike('name', `%${term}%`)
            .eq('is_active', true)
            .in('business_id', businesses.map(b => b.id));

          const matchedBusinessIds = new Set((data || []).map((s: any) => s.business_id));
          const filtered = businesses.filter(b => matchedBusinessIds.has(b.id));
          setFilteredBusinesses(filtered);
        } catch {
          setFilteredBusinesses([]);
        }
        break;
      }
      case 'categories': {
        try {
          const { data } = await supabase
            .from('business_categories')
            .select('id')
            .ilike('name', `%${term}%`)
            .eq('is_active', true);

          const matchedCatIds = new Set((data || []).map((c: any) => c.id));
          const filtered = businesses.filter(b => b.category_id && matchedCatIds.has(b.category_id));
          setFilteredBusinesses(filtered);
        } catch {
          setFilteredBusinesses([]);
        }
        break;
      }
      case 'users': {
        try {
          const { data } = await supabase
            .from('business_employees')
            .select(`
              business_id,
              profiles!business_employees_user_id_fkey (
                full_name
              )
            `)
            .eq('status', 'approved');

          const matchedBusinessIds = new Set(
            (data || [])
              .filter((e: any) => (e.profiles?.full_name || '').toLowerCase().includes(termLower))
              .map((e: any) => e.business_id)
          );
          const filtered = businesses.filter(b => matchedBusinessIds.has(b.id));
          setFilteredBusinesses(filtered);
        } catch {
          setFilteredBusinesses([]);
        }
        break;
      }
    }
  }, [businesses]);

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

  if (businesses.length === 0) {
    return (
      <div className="p-8 text-center">
        <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Businesses Available</h3>
        <p className="text-muted-foreground">
          There are no active businesses at the moment.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Título */}
      <div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Select a Business
        </h3>
        <p className="text-muted-foreground mb-4">
          Choose the business where you want to book your appointment
        </p>

        {/* SearchBar shared component (same dropdown/options as header) - full-bleed */}
        <div className="-mx-3 sm:mx-0 w-full">
            <SimpleSearchBar
              searchTerm={searchTerm}
              searchType={searchType}
              onSearch={handleSearch}
            />
        </div>
      </div>

      {/* Resultados */}
      {filteredBusinesses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBusinesses.map((business) => {
          const isSelected = selectedBusinessId === business.id;

          return (
            <Card
              key={business.id}
              onClick={() => onSelectBusiness(business)}
              className={cn(
                "relative bg-card border-2 rounded-xl overflow-hidden",
                "cursor-pointer transition-all duration-200",
                "hover:border-primary hover:scale-105 hover:shadow-lg hover:shadow-primary/20",
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border"
              )}
            >
              {/* Imagen del negocio */}
              <div className="aspect-video w-full relative">
                <img
                  src={getBusinessImage(business)}
                  alt={business.name}
                  className="w-full h-full object-cover"
                />

                {/* Checkmark cuando está seleccionado */}
                {isSelected && (
                  <div
                    className={cn(
                      "absolute top-3 right-3 w-8 h-8 bg-primary rounded-full",
                      "flex items-center justify-center",
                      "animate-in zoom-in duration-200"
                    )}
                  >
                    <Check className="w-5 h-5 text-primary-foreground" />
                  </div>
                )}
              </div>

              {/* Información del negocio */}
              <div className="p-4 bg-muted/50">
                <h3 className="text-base font-semibold text-foreground mb-1">
                  {business.name}
                </h3>
                
                {business.description && (
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {business.description}
                  </p>
                )}

                <div className="space-y-1">
                  {business.address && (
                    <p className="text-xs text-[#64748b] flex items-center gap-1">
                      📍 {business.city ? `${business.city}, ` : ''}{business.address}
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
      ) : (
        <div className="p-8 text-center border border-border rounded-lg bg-muted/30">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
          <p className="text-muted-foreground">
            No businesses match your search. Try different keywords.
          </p>
        </div>
      )}
    </div>
  );
}