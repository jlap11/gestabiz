import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FavoriteBusiness, useFavorites } from '@/hooks/useFavorites';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Star, MapPin, Heart, Loader2 } from 'lucide-react';
import { Lightbulb } from '@phosphor-icons/react';
import BusinessProfile from '@/components/business/BusinessProfile';
import { toast } from 'sonner';

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
  const { user } = useAuth();
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const { toggleFavorite } = useFavorites(user?.id);
  const queryClient = useQueryClient();

  // Función para remover de favoritos
  const handleRemoveFavorite = async (businessId: string) => {
    try {
      // toggleFavorite retorna true si se agregó, false si se quitó
      // Como estamos en favoritos, siempre debería quitar (retornar false)
      await toggleFavorite(businessId);
      
      // Invalidar query del dashboard para refrescar la lista
      // El hook useFavorites ya maneja su propio toast
      queryClient.invalidateQueries({ queryKey: ['client-dashboard-data'] });
    } catch (error) {
      // El error ya se maneja en useFavorites con su propio toast
      console.error('Error removing favorite:', error);
    }
  };

  // ✅ OPTIMIZACIÓN: Definir useCallback ANTES de early returns (hooks rules)
  const renderBusinessCard = useCallback((business: FavoriteBusiness) => (
    <Card 
      key={business.id}
      className="group relative overflow-hidden border-border hover:border-primary/50 transition-all duration-200 cursor-pointer hover:shadow-lg"
      onClick={() => setSelectedBusinessId(business.id)}
    >
      {/* Banner de fondo panorámico - Relación 5:2 más rectangular */}
      <div
        className="relative w-full h-56"
        style={{
          backgroundImage: business.banner_url ? `url(${business.banner_url})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Fallback si no hay banner */}
        {!business.banner_url && <div className="absolute inset-0 bg-linear-to-br from-primary/20 to-primary/5" />}
        
        {/* Gradiente oscuro desvanecido */}
        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/40 to-transparent" />

        {/* Logo en la esquina superior izquierda - Solo si existe */}
        {business.logo_url && (
          <div className="absolute top-3 left-3 z-10">
            <img
              src={business.logo_url}
              alt={business.name}
              className="w-16 h-16 rounded-lg object-cover border-2 border-white/80 shadow-lg"
            />
          </div>
        )}

        {/* Ícono de favorito en la esquina superior derecha */}
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveFavorite(business.id);
            }}
            className="bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all hover:scale-110"
            title={t('favoritesList.removeFavorite')}
          >
            <Heart className="h-5 w-5 text-primary fill-primary" />
          </button>
        </div>

        {/* Nombre, descripción y ubicación sobre el banner */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 space-y-2">
          <h4 className="font-bold text-white text-xl truncate drop-shadow-md">
            {business.name}
          </h4>
          
          {business.description && (
            <p className="text-sm text-white/90 line-clamp-2 drop-shadow-md">
              {business.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-black/30 rounded-full px-2 py-0.5">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold text-white">
                  {business.average_rating.toFixed(1)}
                </span>
              </div>
              {business.review_count > 0 && (
                <span className="text-xs text-white/90 bg-black/30 rounded-full px-2 py-0.5">
                  ({business.review_count})
                </span>
              )}
            </div>

            {business.city && (
              <div className="flex items-center gap-1 bg-black/30 rounded-full px-2 py-0.5">
                <MapPin className="h-3.5 w-3.5 text-white/90" />
                <span className="text-xs text-white/90 truncate max-w-[120px]">{business.city}</span>
              </div>
            )}
          </div>

          {/* Botón de acción sobre el banner */}
          <Button
            variant="default"
            className="w-full bg-primary hover:bg-primary/90 shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBusinessId(business.id);
            }}
          >
            {t('favoritesList.bookButton')}
          </Button>
        </div>
      </div>
    </Card>
  ), [t, handleRemoveFavorite]);

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

        {/* Grid de tarjetas - 2 columnas máximo para cards más anchas y mostrar banner completo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          userId={user?.id} // CRITICAL FIX: Pass userId explicitly
          onClose={() => setSelectedBusinessId(null)}
        />
      )}
    </>
  );
}
