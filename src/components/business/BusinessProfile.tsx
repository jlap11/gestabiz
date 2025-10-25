import { useCallback, useEffect, useState } from 'react'
import {
  Calendar,
  ChevronRight,
  Clock,
  Globe,
  Heart,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Star,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { ReviewForm } from '@/components/reviews/ReviewForm'
import { ReviewList } from '@/components/reviews/ReviewList'
import { useReviews } from '@/hooks/useReviews'
import { useFavorites } from '@/hooks/useFavorites'
import { toast } from 'sonner'
import ChatWithAdminModal from './ChatWithAdminModal'

interface BusinessProfileProps {
  readonly businessId: string
  readonly onClose: () => void
  readonly onBookAppointment?: (
    serviceId?: string,
    locationId?: string,
    employeeId?: string
  ) => void
  readonly onChatStarted?: (conversationId: string) => void
  readonly userLocation?: {
    latitude: number
    longitude: number
  }
}

interface BusinessData {
  id: string
  name: string
  description: string
  phone: string
  email: string
  website?: string
  logo_url?: string
  banner_url?: string
  rating: number
  reviewCount: number
  category?: {
    name: string
    icon?: string
  }
  subcategories?: Array<{
    name: string
  }>
  locations: Array<{
    id: string
    name: string
    address: string
    city: string
    state: string
    postal_code: string
    country: string
    latitude?: number
    longitude?: number
    phone?: string
    email?: string
    hours?: Record<string, string>
  }>
  services: Array<{
    id: string
    name: string
    description: string
    duration: number
    price: number
    category?: string
    location_id?: string
    employee_id?: string
    employee?: {
      id: string
      name: string
      avatar_url?: string
    }
  }>
  reviews: Array<{
    id: string
    rating: number
    comment: string
    created_at: string
    business_response?: string
    business_response_at?: string
  }>
}

export default function BusinessProfile({
  businessId,
  onClose,
  onBookAppointment,
  onChatStarted,
  userLocation,
}: BusinessProfileProps) {
  const { user } = useAuth()
  const [business, setBusiness] = useState<BusinessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('services')
  const [canReview, setCanReview] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [eligibleAppointmentId, setEligibleAppointmentId] = useState<string | null>(null)
  const [showChatModal, setShowChatModal] = useState(false)

  const { createReview, refetch: refetchReviews } = useReviews({ business_id: businessId })
  const { isFavorite, toggleFavorite } = useFavorites(user?.id)

  const handleToggleFavorite = async () => {
    if (!business) return
    await toggleFavorite(businessId, business.name)
  }

  const formatCurrency = (amount: number, currency: string = 'MXN') => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  const fetchBusinessData = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch business basic info
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('id, name, description, phone, email, website, logo_url, banner_url, category_id')
        .eq('id', businessId)
        .single()

      if (businessError) throw businessError

      // Fetch category
      let categoryData: { name: string; icon_name?: string } | null = null
      if (businessData?.category_id) {
        const { data: catData } = await supabase
          .from('business_categories')
          .select('name, icon_name')
          .eq('id', businessData.category_id)
          .single()
        categoryData = catData
      }

      // Fetch subcategories
      const { data: subcategoriesRelData } = await supabase
        .from('business_subcategories')
        .select('subcategory_id')
        .eq('business_id', businessId)
        .limit(3)

      let subcategoriesData: Array<{ name: string }> = []
      if ((subcategoriesRelData?.length ?? 0) > 0) {
        const subcategoryIds = subcategoriesRelData!.map(rel => rel.subcategory_id)
        const { data: subcatsData } = await supabase
          .from('business_categories')
          .select('name')
          .in('id', subcategoryIds)
        subcategoriesData = subcatsData ?? []
      }

      // Fetch locations
      const { data: locationsData } = await supabase
        .from('locations')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('name')

      // Fetch services
      const { data: servicesData } = await supabase
        .from('services')
        .select('id, name, description, duration, price, category')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('name')

      // Fetch employee profiles
      // Note: Employee association will be handled in the booking wizard
      // where users can select specific employees offering the service

      // Fetch reviews
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(10)

      const rating =
        (reviewsData?.length ?? 0) > 0
          ? reviewsData!.reduce((acc, r) => acc + r.rating, 0) / reviewsData!.length
          : 0

      setBusiness({
        ...businessData,
        category: categoryData
          ? { name: categoryData.name, icon: categoryData.icon_name }
          : undefined,
        subcategories: subcategoriesData,
        locations: locationsData || [],
        services: (servicesData ?? []).map(s => {
          return {
            ...s,
            employee: undefined,
          }
        }),
        reviews: reviewsData || [],
        rating,
        reviewCount: reviewsData?.length || 0,
      })
    } catch (error) {
      if (error instanceof Error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching business data:', error.message)
      }
    } finally {
      setLoading(false)
    }
  }, [businessId])

  const checkReviewEligibility = useCallback(async () => {
    if (!user) return

    try {
      // Check if user has completed appointments with this business
      // and hasn't reviewed them yet
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id')
        .eq('client_id', user.id)
        .eq('business_id', businessId)
        .eq('status', 'completed')
        .order('end_time', { ascending: false })
        .limit(10)

      if (appointmentsError) throw appointmentsError

      if (appointmentsData && appointmentsData.length > 0) {
        // Check which appointments don't have reviews yet
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('appointment_id')
          .in(
            'appointment_id',
            appointmentsData.map(a => a.id)
          )

        if (reviewsError) throw reviewsError

        const reviewedIds = new Set(reviewsData?.map(r => r.appointment_id) || [])
        const unreviewed = appointmentsData.find(a => !reviewedIds.has(a.id))

        if (unreviewed) {
          setCanReview(true)
          setEligibleAppointmentId(unreviewed.id)
        } else {
          setCanReview(false)
          setEligibleAppointmentId(null)
        }
      } else {
        setCanReview(false)
        setEligibleAppointmentId(null)
      }
    } catch (error) {
      // Error handling
      if (error instanceof Error) {
        // eslint-disable-next-line no-console
        console.error('Error checking review eligibility:', error.message)
      }
    }
  }, [user, businessId])

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!user || !eligibleAppointmentId) {
      toast.error('No se puede enviar la reseña en este momento')
      return
    }

    try {
      await createReview(
        eligibleAppointmentId,
        user.id,
        businessId,
        undefined, // employeeId is optional for business reviews
        rating as 1 | 2 | 3 | 4 | 5,
        comment || undefined
      )

      setShowReviewForm(false)
      setCanReview(false)
      setEligibleAppointmentId(null)
      refetchReviews()

      // Refresh business data to update review count and rating
      fetchBusinessData()
    } catch (error) {
      // Error is already handled by useReviews hook
      // eslint-disable-next-line no-console
      console.error('Error submitting review:', error)
    }
  }

  useEffect(() => {
    fetchBusinessData()
    if (user) {
      checkReviewEligibility()
    }
  }, [fetchBusinessData, checkReviewEligibility, user])

  const calculateDistance = (lat: number, lon: number): number => {
    if (!userLocation) return 0

    const R = 6371 // Radio de la Tierra en km
    const dLat = (lat - userLocation.latitude) * (Math.PI / 180)
    const dLon = (lon - userLocation.longitude) * (Math.PI / 180)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation.latitude * (Math.PI / 180)) *
        Math.cos(lat * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  const formatHours = (hours: Record<string, string> | null | undefined): string => {
    if (!hours) return 'No disponible'
    // Assuming hours is an object like { monday: "9:00-18:00", ... }
    const daysOfWeek = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ]
    const today = daysOfWeek[new Date().getDay()]
    return hours[today] || 'Cerrado'
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Cargando perfil del negocio">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-card">
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" role="status" aria-live="polite"></div>
          </div>
        </Card>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Error al cargar perfil">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-card">
          <div className="p-8 text-center">
            <p className="text-muted-foreground" role="alert">No se pudo cargar la información del negocio</p>
            <Button onClick={onClose} className="mt-4 min-h-[44px] min-w-[44px]" aria-label="Cerrar modal" title="Cerrar">
              Cerrar
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="business-profile-title">
      <Card className="w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border">
          <h2 id="business-profile-title" className="text-lg sm:text-xl font-semibold truncate pr-2">
            {business?.name || 'Cargando...'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] shrink-0"
            aria-label="Cerrar perfil del negocio"
            title="Cerrar"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64" role="status" aria-label="Cargando información del negocio">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="sr-only">Cargando...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-center p-4" role="alert">
              <div>
                <p className="text-destructive mb-2">Error al cargar el negocio</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : !business ? (
            <div className="flex items-center justify-center h-64" role="status">
              <p className="text-muted-foreground">Negocio no encontrado</p>
            </div>
          ) : (
            <Tabs defaultValue="services" className="w-full" orientation="horizontal">
              <TabsList className="grid w-full grid-cols-4 h-auto p-1 gap-1 bg-muted/50" role="tablist">
                <TabsTrigger 
                  value="services" 
                  className="text-xs sm:text-sm py-2 px-1 sm:px-3 data-[state=active]:bg-background data-[state=active]:text-foreground"
                  role="tab"
                  id="services-tab"
                  aria-controls="tabpanel-services"
                >
                  Servicios
                </TabsTrigger>
                <TabsTrigger 
                  value="locations" 
                  className="text-xs sm:text-sm py-2 px-1 sm:px-3 data-[state=active]:bg-background data-[state=active]:text-foreground"
                  role="tab"
                  id="locations-tab"
                  aria-controls="tabpanel-locations"
                >
                  Ubicaciones
                </TabsTrigger>
                <TabsTrigger 
                  value="reviews" 
                  className="text-xs sm:text-sm py-2 px-1 sm:px-3 data-[state=active]:bg-background data-[state=active]:text-foreground"
                  role="tab"
                  id="reviews-tab"
                  aria-controls="tabpanel-reviews"
                >
                  Reseñas
                </TabsTrigger>
                <TabsTrigger 
                  value="about" 
                  className="text-xs sm:text-sm py-2 px-1 sm:px-3 data-[state=active]:bg-background data-[state=active]:text-foreground"
                  role="tab"
                  id="about-tab"
                  aria-controls="tabpanel-about"
                >
                  Acerca de
                </TabsTrigger>
              </TabsList>

              {/* Tab: Servicios */}
              <TabsContent value="services" className="space-y-4 mt-4 sm:mt-6 px-3 sm:px-4" role="tabpanel" id="tabpanel-services" aria-labelledby="services-tab">
                <div className="grid gap-3 sm:gap-4">
                  {business.services.map((service) => (
                    <Card key={service.id} className="p-3 sm:p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm sm:text-base truncate">{service.name}</h3>
                          {service.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                              {service.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                              {service.duration} min
                            </span>
                            <span className="flex items-center gap-1 font-medium text-foreground">
                              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                              ${service.price}
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => onBookAppointment?.(service.id)}
                          size="sm"
                          className="min-h-[44px] w-full sm:w-auto sm:min-w-[100px] shrink-0"
                          aria-label={`Agendar ${service.name}`}
                          title={`Agendar ${service.name}`}
                        >
                          <Calendar className="h-4 w-4 mr-2" aria-hidden="true" />
                          <span className="hidden sm:inline">Agendar</span>
                          <span className="sm:hidden">Agendar</span>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Tab: Ubicaciones */}
              <TabsContent value="locations" className="space-y-4 mt-4 sm:mt-6 px-3 sm:px-4" role="tabpanel" id="tabpanel-locations" aria-labelledby="locations-tab">
                {business.locations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" aria-hidden="true" />
                    <p>No hay ubicaciones disponibles</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:gap-4">
                    {business.locations.map((location) => {
                      const distance = userLocation && location.latitude && location.longitude
                        ? calculateDistance(
                            userLocation.latitude,
                            userLocation.longitude,
                            location.latitude,
                            location.longitude
                          )
                        : null

                      return (
                        <Card key={location.id} className="p-3 sm:p-4">
                          <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-sm sm:text-base">{location.name}</h3>
                                <div className="flex items-start gap-2 mt-1">
                                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
                                  <p className="text-xs sm:text-sm text-muted-foreground">
                                    {location.address}
                                  </p>
                                </div>
                                {distance && (
                                  <p className="text-xs sm:text-sm text-primary mt-1 font-medium">
                                    A {distance.toFixed(1)} km de tu ubicación
                                  </p>
                                )}
                              </div>
                              <Button
                                onClick={() => onBookAppointment?.(undefined, location.id)}
                                size="sm"
                                className="min-h-[44px] w-full sm:w-auto sm:min-w-[120px] shrink-0"
                                aria-label="Agendar en esta ubicación"
                                title="Agendar en esta ubicación"
                              >
                                <Calendar className="h-4 w-4 mr-2" aria-hidden="true" />
                                Agendar aquí
                              </Button>
                            </div>
                            {location.latitude && location.longitude && (
                              <div className="pt-2 border-t border-border">
                                <a
                                  href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs sm:text-sm text-primary hover:underline flex items-center gap-1 w-fit"
                                  aria-label="Ver ubicación en Google Maps"
                                >
                                  Ver en Google Maps
                                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                                </a>
                              </div>
                            )}
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Tab: Reseñas */}
              <TabsContent value="reviews" className="space-y-4 mt-4 sm:mt-6 px-3 sm:px-4" role="tabpanel" id="tabpanel-reviews" aria-labelledby="reviews-tab">
                {/* Formulario de nueva reseña */}
                {canReview && showReviewForm && eligibleAppointmentId && (
                  <div className="mb-6">
                    <ReviewForm
                      appointmentId={eligibleAppointmentId}
                      businessId={businessId}
                      onSubmit={handleSubmitReview}
                      onCancel={() => setShowReviewForm(false)}
                    />
                  </div>
                )}

                {/* Botón para mostrar formulario */}
                {canReview && !showReviewForm && (
                  <div className="mb-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReviewForm(true)}
                      className="min-h-[44px] w-full sm:w-auto"
                      aria-label="Abrir formulario de reseña"
                      title="Dejar reseña"
                    >
                      Dejar reseña
                    </Button>
                  </div>
                )}

                {/* Lista de reseñas */}
                <ReviewList businessId={businessId} />
              </TabsContent>

              {/* Tab: Acerca de */}
              <TabsContent value="about" className="mt-4 sm:mt-6 px-3 sm:px-4" role="tabpanel" id="tabpanel-about" aria-labelledby="about-tab">
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2">Descripción</h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {business.description || 'Sin descripción disponible'}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-4">Información general</h3>
                    <div className="grid gap-3 text-sm">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                        <span className="text-muted-foreground">Categoría</span>
                        <span className="font-medium">
                          {business.category?.name || 'No especificada'}
                        </span>
                      </div>
                      {business.subcategories && business.subcategories.length > 0 && (
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                          <span className="text-muted-foreground">Especialidades</span>
                          <span className="font-medium text-right">
                            {business.subcategories.map(s => s.name).join(', ')}
                          </span>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                        <span className="text-muted-foreground">Servicios disponibles</span>
                        <span className="font-medium">{business.services.length}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                        <span className="text-muted-foreground">Ubicaciones</span>
                        <span className="font-medium">{business.locations.length}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                        <span className="text-muted-foreground">Calificación promedio</span>
                        <span className="font-medium">{business.rating.toFixed(1)} ⭐</span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Footer sticky con botones principales */}
        <div className="border-t border-border p-3 sm:p-4 bg-background space-y-3">
          <Button 
            onClick={() => onBookAppointment?.()} 
            className="w-full min-h-[44px] text-sm sm:text-base" 
            size="lg" 
            aria-label="Agendar cita" 
            title="Agendar cita"
          >
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2" aria-hidden="true" />
            Agendar Cita
          </Button>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center">
              ¿Tienes dudas sobre este negocio?
            </p>
            <Button
              onClick={() => setShowChatModal(true)}
              className="w-full min-h-[44px] text-sm sm:text-base"
              size="lg"
              variant="outline"
              aria-label="Iniciar chat"
              title="Iniciar chat"
            >
              <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" aria-hidden="true" />
              Iniciar Chat
            </Button>
          </div>
        </div>
      </Card>

      {/* Chat Modal */}
      {showChatModal && business && (
        <ChatWithAdminModal
          businessId={businessId}
          businessName={business.name}
          userLocation={userLocation}
          onClose={() => setShowChatModal(false)}
          onCloseParent={onClose}
          onChatStarted={conversationId => {
            // Pasar conversationId al componente padre
            if (onChatStarted) {
              onChatStarted(conversationId)
            }
          }}
        />
      )}
    </div>
  )
}