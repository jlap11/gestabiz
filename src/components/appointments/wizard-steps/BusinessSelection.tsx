import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Check, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import supabase from '@/lib/supabase';

interface Business {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
}

interface BusinessSelectionProps {
  readonly selectedBusinessId: string | null;
  readonly onSelectBusiness: (business: Business) => void;
}

export function BusinessSelection({
  selectedBusinessId,
  onSelectBusiness,
}: BusinessSelectionProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, description, logo_url, address, city, phone')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setBusinesses((data as Business[]) || []);
    } catch {
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

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
    <div className="p-6">
      <h3 className="text-xl font-semibold text-foreground mb-2">
        Select a Business
      </h3>
      <p className="text-muted-foreground mb-6">
        Choose the business where you want to book your appointment
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {businesses.map((business) => {
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
    </div>
  );
}
