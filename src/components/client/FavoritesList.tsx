import { useState } from 'react'
import { FavoriteBusiness, useFavorites } from '@/hooks/useFavorites'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Heart, Loader2, MapPin, Star } from 'lucide-react'
import BusinessProfile from '@/components/business/BusinessProfile'

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
  const { user } = useAuth()
  const { t } = useLanguage()
  const { favorites, loading, error } = useFavorites(user?.id)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)

  // Loading state
  if (loading) {
    return (
      <div 
        className="flex flex-col items-center justify-center py-12 px-4 min-h-[50vh]" 
        role="status" 
        aria-live="polite"
        aria-label={t('favoritesList.loading')}
      >
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" aria-hidden="true" />
        <p className="text-muted-foreground text-center text-sm sm:text-base">{t('favoritesList.loading')}</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 min-h-[50vh]">
        <div 
          className="bg-destructive/10 border border-destructive rounded-lg p-4 sm:p-6 max-w-md w-full" 
          role="alert"
          aria-live="assertive"
        >
          <p className="text-destructive font-semibold mb-2 text-sm sm:text-base">{t('favoritesList.errorTitle')}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (favorites.length === 0) {
    return (
      <div 
        className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 min-h-[50vh]" 
        role="status" 
        aria-live="polite"
        aria-label={t('favoritesList.emptyTitle')}
      >
        <div className="bg-muted/30 rounded-full p-4 sm:p-6 mb-4 sm:mb-6">
          <Heart className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" aria-hidden="true" />
        </div>
        <h3 className="text-xl sm:text-2xl font-semibold text-foreground mb-2 text-center">
          {t('favoritesList.emptyTitle')}
        </h3>
        <p className="text-muted-foreground text-center max-w-md mb-6 sm:mb-8 text-sm sm:text-base px-2">
          {t('favoritesList.emptyDescription')}
        </p>
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 sm:p-4 max-w-md w-full">
          <p className="text-xs sm:text-sm text-primary font-medium text-center">{t('favoritesList.tipHeader')}</p>
        </div>
      </div>
    )
  }

  // Render business card
  const renderBusinessCard = (business: FavoriteBusiness) => (
    <Card
      key={business.id}
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-primary/30 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
      onClick={() => setSelectedBusinessId(business.id)}
      role="button"
      tabIndex={0}
      aria-label={t('favoritesList.openProfileWithName', { name: business.name })}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setSelectedBusinessId(business.id)
        }
      }}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-3">
          {/* Logo y nombre */}
          <div className="flex items-start gap-3">
              {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={t('favoritesList.logoAlt', { name: business.name })}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border-2 border-primary/50 flex-shrink-0"
              />
            ) : (
              <div 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/20 flex items-center justify-center border-2 border-primary/30 flex-shrink-0" 
                aria-hidden="true"
              >
                <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" aria-hidden="true" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground truncate text-sm sm:text-base">{business.name}</h4>
              {business.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                  {business.description}
                </p>
              )}
            </div>
          </div>

          {/* Rating */}
          <div 
            className="flex items-center gap-2" 
            aria-label={t('favoritesList.ratingAria', { rating: business.average_rating.toFixed(1) })}
            role="img"
          >
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
              <span className="text-sm font-semibold text-foreground">
                {business.average_rating.toFixed(1)}
              </span>
            </div>
            {business.review_count > 0 && (
              <span className="text-xs text-muted-foreground">({business.review_count})</span>
            )}
          </div>

          {/* Ubicación */}
          {business.city && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <span className="block truncate">{business.city}</span>
                {business.address && (
                  <span className="text-xs truncate block mt-0.5">
                    {business.address}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Botón de acción */}
          <Button
            variant="default"
            className="w-full min-h-[44px] min-w-[44px] text-sm sm:text-base font-medium"
            onClick={e => {
              e.stopPropagation()
              setSelectedBusinessId(business.id)
            }}
            aria-label={t('favoritesList.bookButtonWithName', { name: business.name })}
            title={t('favoritesList.bookButtonWithName', { name: business.name })}
          >
            {t('favoritesList.bookButton')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <>
      <div className="space-y-4 sm:space-y-6 p-3 sm:p-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-primary fill-primary flex-shrink-0" />
              <span className="truncate">{t('favoritesList.myFavorites')}</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
              <span className="font-medium">{favorites.length}</span>{' '}
              {favorites.length === 1
                ? t('favoritesList.businessMarked')
                : t('favoritesList.businessesMarked')}{' '}
              <span className="hidden sm:inline">{t('favoritesList.tipDescription')}</span>
            </p>
          </div>
        </div>

        {/* Grid de tarjetas */}
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4" 
          role="list"
          aria-label={t('favoritesList.myFavorites')}
        >
          {favorites.map(business => (
            <div role="listitem" key={business.id}>
              {renderBusinessCard(business)}
            </div>
          ))}
        </div>

        {/* Info adicional */}
        <div className="bg-muted/50 border border-border rounded-lg p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground">
          <p className="leading-relaxed">
            <strong className="text-foreground">{t('favoritesList.tipLabel')}</strong>{' '}
            {t('favoritesList.tipDescription')}
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
  )
}