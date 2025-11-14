import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, MapPin, Building2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface SimpleBusiness {
  id: string;
  name: string;
  description?: string;
  logo_url: string | null;
  banner_url?: string | null;
  average_rating: number;
  total_reviews?: number;
  city?: string;
  state?: string;
}

interface BusinessSuggestionsProps {
  // ✅ v2.0: Recibir sugerencias desde useClientDashboard (consolidado)
  suggestions: SimpleBusiness[];
  isLoading: boolean;
  preferredCityName: string | null;
  onBusinessSelect?: (businessId: string) => void;
}

/**
 * BusinessSuggestions v2.0 - Refactorizado
 * 
 * CAMBIOS:
 * - ❌ Eliminado: Queries internas a Supabase (loadPreviouslyBookedBusinesses, loadSuggestedBusinesses)
 * - ✅ Agregado: Recibe `suggestions` desde useClientDashboard (datos consolidados)
 * - ✅ Beneficio: -4 queries HTTP (appointments, businesses x2, locations)
 * 
 * ANTES (v1.0):
 * - 4 queries independientes en useEffect
 * - Lógica compleja de filtrado por ciudad
 * - Paginación manual
 * 
 * DESPUÉS (v2.0):
 * - 0 queries (renderizado puro)
 * - Data filtrada por RPC function en backend
 * - Límite de 6 sugerencias (desde backend)
 */
export function BusinessSuggestions({
  suggestions,
  isLoading,
  preferredCityName,
  onBusinessSelect
}: Readonly<BusinessSuggestionsProps>) {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(true)

  const renderBusinessCard = (business: SimpleBusiness) => (
    <Card
      key={business.id}
      className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50"
      onClick={() => onBusinessSelect?.(business.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Logo */}
          <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0 overflow-hidden border border-border/50">
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {business.name}
            </h4>
            
            {/* Rating */}
            {business.average_rating > 0 && (
              <div className="flex items-center gap-1.5 mt-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium text-foreground">
                  {business.average_rating.toFixed(1)}
                </span>
                {business.total_reviews !== undefined && business.total_reviews > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({business.total_reviews})
                  </span>
                )}
              </div>
            )}

            {/* Location */}
            {business.city && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="line-clamp-1">{business.city}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <Card className={cn("border-border/50", !isOpen && "shadow-sm")}>
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <span>
              {preferredCityName 
                ? t('client.businessSuggestions.titleWithCity', { city: preferredCityName })
                : t('client.businessSuggestions.title', 'Negocios Recomendados')
              }
            </span>
          </div>
          <Badge variant="secondary" className="ml-2">
            {suggestions.length}
          </Badge>
        </CardTitle>
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0 pb-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-12 h-12 rounded-lg bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {preferredCityName 
                  ? `No hay negocios recomendados en ${preferredCityName}`
                  : 'No hay negocios recomendados disponibles'
                }
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Intenta seleccionar otra ciudad en el header
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {suggestions.map((business) => renderBusinessCard(business))}
              
              {suggestions.length >= 6 && (
                <p className="text-xs text-muted-foreground text-center mt-3">
                  Mostrando los {suggestions.length} negocios mejor valorados
                </p>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
