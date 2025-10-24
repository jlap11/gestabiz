import { useCallback, useEffect, useState } from 'react'
import { Award, Briefcase, Building2, Calendar, Clock, MapPin, Star, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/hooks/useAuth'
import { useEmployeeBusinesses } from '@/hooks/useEmployeeBusinesses'
import { ReviewForm } from '@/components/reviews/ReviewForm'
import { ReviewList } from '@/components/reviews/ReviewList'
import { useReviews } from '@/hooks/useReviews'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/LanguageContext'

interface UserProfileProps {
  userId: string
  onClose: () => void
  onBookAppointment?: (serviceId?: string, businessId?: string) => void
  userLocation?: {
    latitude: number
    longitude: number
  }
}

interface UserData {
  id: string
  full_name: string
  email: string
  phone?: string
  avatar_url?: string
  bio?: string
  rating: number
  reviewCount: number
  totalAppointments: number
  services: Array<{
    id: string
    name: string
    description: string
    duration: number
    price: number
    category?: string
    business_id: string
    business?: {
      id: string
      name: string
      logo_url?: string
    }
  }>
  businesses: Array<{
    id: string
    name: string
    logo_url?: string
    address?: string
    city?: string
    state?: string
  }>
  reviews: Array<{
    id: string
    rating: number
    comment: string
    created_at: string
    business?: {
      name: string
    }
  }>
  expertise: Array<{
    category: string
    years: number
    level: number
  }>
}

export default function UserProfile({
  userId,
  onClose,
  onBookAppointment,
  userLocation,
}: UserProfileProps) {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('services')
  const [canReview, setCanReview] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [eligibleAppointmentId, setEligibleAppointmentId] = useState<string | null>(null)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)

  // Obtener negocios del profesional
  const { businesses: employeeBusinesses, isEmployeeOfAnyBusiness } = useEmployeeBusinesses(
    userId,
    true
  )

  // Hook de reviews (con businessId dinámico)
  const { createReview, refetch: refetchReviews } = useReviews({
    employee_id: userId,
    business_id: selectedBusinessId || undefined,
  })

  const formatCurrency = (amount: number, currency: string = 'MXN') => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  const fetchUserData = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch user basic info
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, avatar_url, bio')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError

      // Fetch services offered by this employee
      const { data: servicesData } = await supabase
        .from('employee_services')
        .select(
          `
          service_id,
          expertise_level,
          services:service_id (
            id,
            name,
            description,
            duration_minutes,
            price,
            category,
            business_id,
            businesses:business_id (
              id,
              name,
              logo_url
            )
          )
        `
        )
        .eq('employee_id', userId)
        .eq('is_active', true)

      // Fetch reviews about this professional
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(
          `
          id,
          rating,
          comment,
          created_at,
          business_id,
          businesses:business_id (
            name
          )
        `
        )
        .eq('employee_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)

      // Calculate stats
      const rating =
        reviewsData && reviewsData.length > 0
          ? reviewsData.reduce((acc, r) => acc + r.rating, 0) / reviewsData.length
          : 0

      // Fetch total completed appointments
      const { count: appointmentsCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('employee_id', userId)
        .eq('status', 'completed')

      // Map services data
      const services = (servicesData || [])
        .map(item => {
          const service = Array.isArray(item.services) ? item.services[0] : item.services
          const business = service?.businesses
            ? Array.isArray(service.businesses)
              ? service.businesses[0]
              : service.businesses
            : null

          return {
            id: service?.id || '',
            name: service?.name || '',
            description: service?.description || '',
            duration: service?.duration_minutes || 60,
            price: service?.price || 0,
            category: service?.category || '',
            business_id: service?.business_id || '',
            business: business
              ? {
                  id: business.id,
                  name: business.name,
                  logo_url: business.logo_url,
                }
              : undefined,
          }
        })
        .filter(s => s.id)

      // Map reviews
      const reviews = (reviewsData || []).map(review => {
        const business = review.businesses
          ? Array.isArray(review.businesses)
            ? review.businesses[0]
            : review.businesses
          : null

        return {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          created_at: review.created_at,
          business: business ? { name: business.name } : undefined,
        }
      })

      setUserData({
        ...profileData,
        rating,
        reviewCount: reviewsData?.length || 0,
        totalAppointments: appointmentsCount || 0,
        services,
        businesses: employeeBusinesses,
        reviews,
        expertise: [],
      })
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error fetching user data:', error.message)
      }
    } finally {
      setLoading(false)
    }
  }, [userId, employeeBusinesses])

  const checkReviewEligibility = useCallback(async () => {
    if (!user) return

    try {
      // Buscar citas completadas con este empleado que no tengan review
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id, business_id')
        .eq('client_id', user.id)
        .eq('employee_id', userId)
        .eq('status', 'completed')
        .order('end_time', { ascending: false })
        .limit(10)

      if (appointmentsError) throw appointmentsError

      if (appointmentsData && appointmentsData.length > 0) {
        // Verificar cuáles no tienen review
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
          setSelectedBusinessId(unreviewed.business_id)
        } else {
          setCanReview(false)
          setEligibleAppointmentId(null)
          setSelectedBusinessId(null)
        }
      } else {
        setCanReview(false)
        setEligibleAppointmentId(null)
        setSelectedBusinessId(null)
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error checking review eligibility:', error.message)
      }
    }
  }, [user, userId])

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!user || !eligibleAppointmentId || !selectedBusinessId) {
      toast.error(t('userProfile.errors.submitReviewError'))
      return
    }

    try {
      await createReview(
        eligibleAppointmentId,
        user.id,
        selectedBusinessId,
        userId, // employeeId for professional reviews
        rating as 1 | 2 | 3 | 4 | 5,
        comment || undefined
      )

      setShowReviewForm(false)
      setCanReview(false)
      setEligibleAppointmentId(null)
      refetchReviews()

      // Refresh user data to update review count and rating
      fetchUserData()
    } catch (error) {
      console.error('Error submitting review:', error)
    }
  }

  useEffect(() => {
    fetchUserData()
    if (user) {
      checkReviewEligibility()
    }
  }, [fetchUserData, checkReviewEligibility, user])

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-card">
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </Card>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-card">
          <div className="p-8 text-center">
            <p className="text-muted-foreground">{t('userProfile.errors.loadError')}</p>
            <Button onClick={onClose} className="mt-4">
              {t('userProfile.actions.close')}
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden bg-card flex flex-col">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-primary/20 to-secondary/20 p-8">
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Profile Info */}
          <div className="flex items-center gap-6">
            {/* Avatar */}
            {userData.avatar_url ? (
              <img
                src={userData.avatar_url}
                alt={userData.full_name}
                className="w-24 h-24 rounded-full border-4 border-background object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 border-4 border-background flex items-center justify-center">
                <span className="text-4xl font-bold text-primary">
                  {userData.full_name[0]?.toUpperCase()}
                </span>
              </div>
            )}

            {/* Name and Stats */}
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-foreground mb-2">{userData.full_name}</h2>

              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-foreground">
                    {userData.rating.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground text-sm">({userData.reviewCount})</span>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  {userData.totalAppointments} {t('userProfile.header.completedAppointments')}
                </Badge>
                {isEmployeeOfAnyBusiness && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    {t('userProfile.header.verifiedProfessional')}
                  </Badge>
                )}
              </div>

              {userData.bio && (
                <p className="text-sm text-muted-foreground line-clamp-2">{userData.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-auto">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="px-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="services">{t('userProfile.tabs.services')}</TabsTrigger>
              <TabsTrigger value="experience">{t('userProfile.tabs.experience')}</TabsTrigger>
              <TabsTrigger value="reviews">{t('userProfile.tabs.reviews')}</TabsTrigger>
            </TabsList>

            {/* Tab: Servicios */}
            <TabsContent value="services" className="space-y-4 mt-6">
              {userData.services.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t('userProfile.services.noServices')}
                </p>
              ) : (
                <div className="grid gap-4">
                  {userData.services.map(service => (
                    <Card key={service.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{service.name}</h3>
                            {service.business && (
                              <Badge variant="outline" className="text-xs">
                                <Building2 className="h-3 w-3 mr-1" />
                                {service.business.name}
                              </Badge>
                            )}
                          </div>
                          {service.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {service.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatDuration(service.duration)}</span>
                            </div>
                            {service.category && (
                              <Badge variant="secondary" className="text-xs">
                                {service.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary mb-2">
                            {formatCurrency(service.price, 'MXN')}
                          </p>
                          <Button
                            onClick={() => onBookAppointment?.(service.id, service.business_id)}
                            size="sm"
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            {t('userProfile.services.schedule')}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab: Experiencia */}
            <TabsContent value="experience" className="space-y-6 mt-6">
              {/* Businesses */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  {t('userProfile.experience.businessesTitle')}
                </h3>
                {userData.businesses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {t('userProfile.experience.independentProfessional')}
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {userData.businesses.map(business => (
                      <Card key={business.id} className="p-4">
                        <div className="flex items-center gap-4">
                          {business.logo_url ? (
                            <img
                              src={business.logo_url}
                              alt={business.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-primary" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold">{business.name}</h4>
                            {(business.address || business.city) && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {business.city}
                                {business.state && `, ${business.state}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Bio */}
              {userData.bio && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    {t('userProfile.experience.aboutMe')}
                  </h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{userData.bio}</p>
                </div>
              )}

              {/* Stats */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  {t('userProfile.experience.statistics')}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Card className="p-4 text-center">
                    <Award className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{userData.totalAppointments}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('userProfile.experience.stats.completedAppointments')}
                    </p>
                  </Card>
                  <Card className="p-4 text-center">
                    <Star className="h-8 w-8 mx-auto mb-2 text-yellow-400 fill-yellow-400" />
                    <p className="text-2xl font-bold">{userData.rating.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('userProfile.experience.stats.rating')}
                    </p>
                  </Card>
                  <Card className="p-4 text-center">
                    <Briefcase className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="text-2xl font-bold">{userData.services.length}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('userProfile.experience.stats.services')}
                    </p>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Reseñas */}
            <TabsContent value="reviews" className="space-y-4 mt-6">
              {/* Formulario de nueva reseña */}
              {canReview && showReviewForm && eligibleAppointmentId && selectedBusinessId && (
                <div className="mb-6">
                  <ReviewForm
                    appointmentId={eligibleAppointmentId}
                    businessId={selectedBusinessId}
                    employeeId={userId}
                    onSubmit={handleSubmitReview}
                    onCancel={() => setShowReviewForm(false)}
                  />
                </div>
              )}

              {/* Botón para mostrar formulario */}
              {canReview && !showReviewForm && (
                <div className="mb-6">
                  <Button variant="outline" size="sm" onClick={() => setShowReviewForm(true)}>
                    {t('userProfile.reviews.leaveReview')}
                  </Button>
                </div>
              )}

              {/* Lista de reseñas del profesional */}
              <ReviewList
                businessId={selectedBusinessId || employeeBusinesses[0]?.id || ''}
                employeeId={userId}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer sticky con botón principal */}
        <div className="border-t border-border p-4 bg-background">
          <Button
            onClick={() => onBookAppointment?.()}
            className="w-full"
            size="lg"
            disabled={!isEmployeeOfAnyBusiness}
          >
            <Calendar className="h-5 w-5 mr-2" />
            {isEmployeeOfAnyBusiness
              ? t('userProfile.footer.scheduleWith', { name: userData.full_name })
              : t('userProfile.footer.notAvailable')}
          </Button>
          {!isEmployeeOfAnyBusiness && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              {t('userProfile.footer.notLinkedMessage')}
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
