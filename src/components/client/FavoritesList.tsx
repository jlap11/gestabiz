import { useState, useCallback } from 'react';
import { FavoriteBusiness } from '@/hooks/useFavorites';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Star, MapPin, Heart, Loader2 } from 'lucide-react';
import { Lightbulb } from '@phosphor-icons/react';
import BusinessProfile from '@/components/business/BusinessProfile';

interface FavoritesListProps {
  favorites: FavoriteBusiness[];
  loading: boolean;
}

/**
 * FavoritesList - Componente para mostrar y gestionar negocios favoritos
 * OPTIMIZADO: Recibe favorites como prop desde ClientDashboard para evitar query duplicada
 * 
 * Características:
 * - Grid responsive de tarjetas de negocios
 * - Click en tarjeta abre BusinessProfile modal
 * - Botón "Reservar" para agendar cita rápidamente
 * - Empty state cuando no hay favoritos
 * - Loading states
 */
export default function FavoritesList({ favorites, loading }: FavoritesListProps) {
  const { t } = useLanguage();
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

  // ✅ OPTIMIZACIÓN: Definir useCallback ANTES de early returns (hooks rules)
  const renderBusinessCard = useCallback((business: FavoriteBusiness) => (
    <Card 
      key={business.id}
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-primary/30"
      onClick={() => setSelectedBusinessId(business.id)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Logo y nombre */}
          <div className="flex items-start gap-3">
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.name}
                className="w-12 h-12 rounded-lg object-cover border-2 border-primary/50"
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
              {business.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                  {business.description}
                </p>
              )}
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
            {business.review_count > 0 && (
              <span className="text-xs text-muted-foreground">
                ({business.review_count})
              </span>
            )}
          </div>

          {/* Ubicación */}
          {business.city && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{business.city}</span>
              {business.address && (
                <span className="text-xs truncate">• {business.address}</span>
              )}
            </div>
          )}

          

          {/* Botón de acción */}
          <Button
            variant="default"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBusinessId(business.id);
            }}
          >
            {t('favoritesList.bookButton')}
          </Button>
        </div>
      </CardContent>
    </Card>
  ), [t]);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground text-center">{t('favoritesList.loading')}</p>
      </div>
    );
  }

  // Empty state
  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="bg-muted/30 rounded-full p-6 mb-6">
          <Heart className="h-16 w-16 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-semibold text-foreground mb-2">
          {t('favoritesList.emptyTitle')}
        </h3>
        <p className="text-muted-foreground text-center max-w-md mb-8">
          {t('favoritesList.emptyDescription')}
        </p>
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 max-w-md">
          <p className="text-sm text-primary font-medium">
            {t('favoritesList.tipHeader')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 p-4 pt-8 sm:pt-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary fill-primary" />
              {t('favoritesList.myFavorites')}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {favorites.length} {favorites.length === 1 ? t('favoritesList.businessMarked') : t('favoritesList.businessesMarked')} {t('favoritesList.tipDescription')}
            </p>
          </div>
        </div>

        {/* Grid de tarjetas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {favorites.map(business => renderBusinessCard(business))}
        </div>

        {/* Info adicional */}
        <div className="bg-muted/50 border border-border rounded-lg p-4 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <Lightbulb size={18} weight="fill" /> <strong className="text-foreground">Tip:</strong> {t('favoritesList.tipDescription')}
          </p>
        </div>
      </div>

      {/* Business Profile Modal */}
      {selectedBusinessId && (
        <BusinessProfile
          businessId={selectedBusinessId}
          onClose={() => setSelectedBusinessId(null)}
        />
      )}
    </>
  );
}
