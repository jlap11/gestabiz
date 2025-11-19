import React, { useState, useCallback, useMemo } from 'react';
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
  isFrequent?: boolean;
  visitsCount?: number;
  lastAppointmentDate?: string;
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
              <div className="flex items-start gap-3">
 * 
                  <div className="w-12 h-12 rounded-lg bg-muted shrink-0 overflow-hidden border border-border/50">
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

  // ✅ OPTIMIZACIÓN: Memoizar handler para prevenir recreaciones
  const handleRebookClick = useCallback((event: React.MouseEvent<HTMLButtonElement>, businessId: string) => {
    event.stopPropagation()
    onBusinessSelect?.(businessId)
  }, [onBusinessSelect])

  // ✅ OPTIMIZACIÓN: Memoizar renderBusinessCard para evitar recrear función en cada render
  const renderBusinessCard = useCallback((business: SimpleBusiness, options?: { highlight?: boolean }) => (
    <Card
      key={business.id}
      className={cn(
        "group cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50",
        options?.highlight && "border-primary/60"
      )}
      onClick={() => onBusinessSelect?.(business.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Logo */}
          <div className="w-12 h-12 rounded-lg bg-muted shrink-0 overflow-hidden border border-border/50">
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

            {options?.highlight && business.visitsCount ? (
              <Badge variant="secondary" className="mt-1">
                {business.visitsCount === 1
                  ? t('client.businessSuggestions.singleVisit', '1 cita completada')
                  : t('client.businessSuggestions.multiVisit', '{count} citas completadas', { count: business.visitsCount })}
              </Badge>
            ) : null}
            
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

        <div className="flex items-center justify-between gap-3 mt-4">
          {options?.highlight && business.lastAppointmentDate ? (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {t('client.businessSuggestions.lastVisit', 'Última cita: {date}', {
                date: new Date(business.lastAppointmentDate).toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'short'
                })
              })}
            </p>
          ) : (
            <span className="text-xs text-muted-foreground line-clamp-1">
              {business.description || t('client.businessSuggestions.genericDescription', 'Negocio recomendado')}
            </span>
          )}
          <Button
            size="sm"
            variant={options?.highlight ? 'default' : 'outline'}
            onClick={(event) => handleRebookClick(event, business.id)}
          >
            {options?.highlight
              ? t('client.businessSuggestions.bookAgain', 'Reservar de nuevo')
              : t('client.businessSuggestions.bookNow', 'Agendar')}
          </Button>
        </div>
      </CardContent>
    </Card>
  ), [handleRebookClick, t, onBusinessSelect])

  // ✅ OPTIMIZACIÓN: Memoizar filtros para evitar recalcular en cada render
  const { frequentBusinesses, recommendedBusinesses } = useMemo(() => {
    const frequent = suggestions.filter((business) => business.isFrequent)
    const recommended = suggestions.filter((business) => !business.isFrequent)
    return { frequentBusinesses: frequent, recommendedBusinesses: recommended }
  }, [suggestions])

  const hasFrequent = frequentBusinesses.length > 0
  const hasSuggestions = recommendedBusinesses.length > 0
  const shouldShowEmptyState = !hasFrequent && !hasSuggestions

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
        </CardTitle>
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0 pb-4">
          {(() => {
            if (isLoading) {
              return (
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
              )
            }

            if (shouldShowEmptyState) {
              return (
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
              )
            }

            return (
              <div className="space-y-2">
                {hasFrequent && (
                  <div className="space-y-2 mb-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {t('client.businessSuggestions.frequentTitle', 'Tus negocios frecuentes')}
                    </h4>
                    {frequentBusinesses.map((business) => renderBusinessCard(business, { highlight: true }))}
                  </div>
                )}

                {hasSuggestions && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {t('client.businessSuggestions.recommendedTitle', 'Recomendados en tu ciudad')}
                    </h4>
                    {recommendedBusinesses.map((business) => renderBusinessCard(business))}
                  </div>
                )}
                
                {recommendedBusinesses.length >= 6 && (
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Mostrando los {recommendedBusinesses.length} negocios mejor valorados
                  </p>
                )}
              </div>
            )
          })()}
        </CardContent>
      )}
    </Card>
  )
}
