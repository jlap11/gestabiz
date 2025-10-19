import { useState } from 'react';
import { useFavorites, FavoriteBusiness } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Star, MapPin, Heart, Loader2 } from 'lucide-react';
import BusinessProfile from '@/components/business/BusinessProfile';

/**
 * FavoritesList - Componente para mostrar y gestionar negocios favoritos
 * 
 * Características:
 * - Grid responsive de tarjetas de negocios
 * - Click en tarjeta abre BusinessProfile modal
 * - Botón "Reservar" para agendar cita rápidamente
 * - Empty state cuando no hay favoritos
 * - Loading states y error handling
 */
export default function FavoritesList() {
  const { user } = useAuth();
  const { favorites, loading, error } = useFavorites(user?.id);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground text-center">Cargando tus negocios favoritos...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-6 max-w-md">
          <p className="text-destructive font-semibold mb-2">Error al cargar favoritos</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
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
          No tienes favoritos aún
        </h3>
        <p className="text-muted-foreground text-center max-w-md mb-8">
          Marca tus negocios preferidos como favoritos para acceder rápidamente a ellos y reservar citas más fácilmente.
        </p>
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 max-w-md">
          <p className="text-sm text-primary font-medium">
            Tip: Busca un negocio y haz clic en el ícono de corazón para agregarlo a favoritos
          </p>
        </div>
      </div>
    );
  }

  // Render business card
  const renderBusinessCard = (business: FavoriteBusiness) => (
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
              <MapPin className="h-4 w-4 flex-shrink-0" />
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
            Reservar cita
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
      <div className="space-y-6 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary fill-primary" />
              Mis Favoritos
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {favorites.length} {favorites.length === 1 ? 'negocio marcado' : 'negocios marcados'} como favorito
            </p>
          </div>
        </div>

        {/* Grid de tarjetas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {favorites.map(business => renderBusinessCard(business))}
        </div>

        {/* Info adicional */}
        <div className="bg-muted/50 border border-border rounded-lg p-4 text-sm text-muted-foreground">
          <p>
            💡 <strong className="text-foreground">Tip:</strong> Haz clic en cualquier tarjeta para ver el perfil completo del negocio, 
            sus servicios, ubicaciones y reseñas. Desde ahí podrás reservar citas fácilmente.
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
