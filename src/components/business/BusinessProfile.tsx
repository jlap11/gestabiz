import { useState, useEffect, useCallback } from 'react';
import { X, MapPin, Phone, Mail, Globe, Clock, Star, Calendar, ChevronRight, MessageCircle, Heart } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PermissionGate } from '@/components/ui/PermissionGate';
import { useAuth } from '@/contexts/AuthContext';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { ReviewList } from '@/components/reviews/ReviewList';
import { useReviews } from '@/hooks/useReviews';
import { useFavorites } from '@/hooks/useFavorites';
import { toast } from 'sonner';
import ChatWithAdminModal from './ChatWithAdminModal';

interface BusinessProfileProps {
  readonly businessId: string;
  readonly onClose: () => void;
  readonly onBookAppointment?: (serviceId?: string, locationId?: string, employeeId?: string) => void;
  readonly onChatStarted?: (conversationId: string) => void;
  readonly userId?: string; // NUEVO: Para resolver problema de auth context
  readonly userLocation?: {
    latitude: number;
    longitude: number;
  };
}

interface BusinessData {
  id: string;
  name: string;
  description: string;
  phone: string;
  email: string;
  website?: string;
  logo_url?: string;
  banner_url?: string;
  rating: number;
  reviewCount: number;
  category?: {
    name: string;
    icon?: string;
  };
  subcategories?: Array<{
    name: string;
  }>;
  locations: Array<{
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    latitude?: number;
    longitude?: number;
    phone?: string;
    email?: string;
    hours?: Record<string, string>;
  }>;
  services: Array<{
    id: string;
    name: string;
    description: string;
    duration: number;
    price: number;
    category?: string;
    location_id?: string;
    employee_id?: string;
    employee?: {
      id: string;
      name: string;
      avatar_url?: string;
    };
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    created_at: string;
    business_response?: string;
    business_response_at?: string;
  }>;
}

export default function BusinessProfile({ 
  businessId, 
  onClose, 
  onBookAppointment,
  onChatStarted,
  userId: propUserId, // Rename prop to avoid conflict
  userLocation 
}: BusinessProfileProps) {
  // Get user AND loading state from Auth context
  const authContext = useAuth();
  const user = authContext?.user || null;
  const authLoading = authContext?.loading || false;
  
  // CRITICAL FIX: Use prop userId as fallback if context user is not available
  const effectiveUserId = user?.id || propUserId;
  
  const [business, setBusiness] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('services');
  const [canReview, setCanReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [eligibleAppointmentId, setEligibleAppointmentId] = useState<string | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);

  // DEBUG: Log auth state
  console.log('[BusinessProfile] RENDER - propUserId:', propUserId);
  console.log('[BusinessProfile] RENDER - authContext:', authContext);
  console.log('[BusinessProfile] RENDER - authLoading:', authLoading);
  console.log('[BusinessProfile] RENDER - user:', user);
  console.log('[BusinessProfile] RENDER - user?.id:', user?.id);
  console.log('[BusinessProfile] RENDER - effectiveUserId:', effectiveUserId);
  
  // Use effectiveUserId which can come from context or props
  const { isFavorite, toggleFavorite: toggleFavoriteFn } = useFavorites(effectiveUserId);
  
  const { createReview, refetch: refetchReviews } = useReviews({ business_id: businessId });

  const handleToggleFavorite = async () => {
    console.log('[BusinessProfile] handleToggleFavorite called');
    console.log('[BusinessProfile] authLoading:', authLoading);
    console.log('[BusinessProfile] effectiveUserId:', effectiveUserId);
    console.log('[BusinessProfile] business:', business?.name);
    
    // CRITICAL FIX: Check effectiveUserId instead of just user
    if (!effectiveUserId) {
      console.log('[BusinessProfile] NO effectiveUserId - showing error toast');
      toast.error('Inicia sesión para guardar favoritos');
      return;
    }
    
    if (!business) {
      console.log('[BusinessProfile] No business, returning');
      return;
    }
    
    console.log('[BusinessProfile] User verified (effectiveUserId:', effectiveUserId, '), calling toggleFavorite...');
    await toggleFavoriteFn(businessId, business.name);
    console.log('[BusinessProfile] toggleFavorite completed');
  };

  const formatCurrency = (amount: number, currency: string = 'COP') => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const fetchBusinessData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch ALL data in parallel for better performance
      const [
        { data: businessData, error: businessError },
        { data: locationsData },
        { data: servicesData },
        { data: reviewsData },
        { data: subcategoriesRelData }
      ] = await Promise.all([
        supabase
          .from('businesses')
          .select('id, name, description, phone, email, website, logo_url, banner_url, category_id')
          .eq('id', businessId)
          .single(),
        supabase
          .from('locations')
          .select('*')
          .eq('business_id', businessId)
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('services')
          .select('id, name, description, duration, price, category')
          .eq('business_id', businessId)
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('reviews')
          .select('*')
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('business_subcategories')
          .select('subcategory_id')
          .eq('business_id', businessId)
          .limit(3)
      ]);

      if (businessError) throw businessError;

      // Fetch category if exists
      let categoryData: { name: string; icon_name?: string } | null = null;
      if (businessData?.category_id) {
        const { data: catData } = await supabase
          .from('business_categories')
          .select('name, icon_name')
          .eq('id', businessData.category_id)
          .single();
        categoryData = catData;
      }

      // Fetch subcategories if exist
      let subcategoriesData: Array<{ name: string }> = [];
      if ((subcategoriesRelData?.length ?? 0) > 0) {
        const subcategoryIds = subcategoriesRelData!.map(rel => rel.subcategory_id);
        const { data: subcatsData } = await supabase
          .from('business_categories')
          .select('name')
          .in('id', subcategoryIds);
        subcategoriesData = subcatsData ?? [];
      }

      const rating = ((reviewsData?.length ?? 0) > 0)
        ? reviewsData!.reduce((acc, r) => acc + r.rating, 0) / reviewsData!.length
        : 0;

      // Process locations to resolve city and state UUIDs to names
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const cityIds = (locationsData || [])
        .map(loc => loc.city)
        .filter(city => city && uuidRegex.test(city));
      const stateIds = (locationsData || [])
        .map(loc => loc.state)
        .filter(state => state && uuidRegex.test(state));
      
      let cityMap: Record<string, string> = {};
      let stateMap: Record<string, string> = {};
      
      if (cityIds.length > 0) {
        const { data: citiesData } = await supabase
          .from('cities')
          .select('id, name')
          .in('id', cityIds);
        
        cityMap = (citiesData || []).reduce((acc, city) => {
          acc[city.id] = city.name;
          return acc;
        }, {} as Record<string, string>);
      }
      
      if (stateIds.length > 0) {
        const { data: regionsData } = await supabase
          .from('regions')
          .select('id, name')
          .in('id', stateIds);
        
        stateMap = (regionsData || []).reduce((acc, region) => {
          acc[region.id] = region.name;
          return acc;
        }, {} as Record<string, string>);
      }

      const processedLocations = (locationsData || []).map(loc => ({
        ...loc,
        city_name: loc.city && uuidRegex.test(loc.city) ? cityMap[loc.city] || loc.city : loc.city,
        state: loc.state && uuidRegex.test(loc.state) ? stateMap[loc.state] || loc.state : loc.state
      }));

      setBusiness({
        ...businessData,
        category: categoryData ? { name: categoryData.name, icon: categoryData.icon_name } : undefined,
        subcategories: subcategoriesData,
        locations: processedLocations,
        services: (servicesData ?? []).map(s => {
          return {
            ...s,
            employee: undefined
          };
        }),
        reviews: reviewsData || [],
        rating,
        reviewCount: reviewsData?.length || 0
      });
    } catch (error) {
      if (error instanceof Error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching business data:', error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  const checkReviewEligibility = useCallback(async () => {
    if (!user) return;

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
        .limit(10);

      if (appointmentsError) throw appointmentsError;

      if (appointmentsData && appointmentsData.length > 0) {
        // Check which appointments don't have reviews yet
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('appointment_id')
          .in('appointment_id', appointmentsData.map(a => a.id));

        if (reviewsError) throw reviewsError;

        const reviewedIds = new Set(reviewsData?.map(r => r.appointment_id) || []);
        const unreviewed = appointmentsData.find(a => !reviewedIds.has(a.id));

        if (unreviewed) {
          setCanReview(true);
          setEligibleAppointmentId(unreviewed.id);
        } else {
          setCanReview(false);
          setEligibleAppointmentId(null);
        }
      } else {
        setCanReview(false);
        setEligibleAppointmentId(null);
      }
    } catch (error) {
      // Error handling
      if (error instanceof Error) {
        // eslint-disable-next-line no-console
        console.error('Error checking review eligibility:', error.message);
      }
    }
  }, [user, businessId]);

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!user || !eligibleAppointmentId) {
      toast.error('No se puede enviar la reseña en este momento');
      return;
    }

    try {
      await createReview(
        eligibleAppointmentId,
        user.id,
        businessId,
        undefined, // employeeId is optional for business reviews
        rating as 1 | 2 | 3 | 4 | 5,
        comment || undefined
      );
      
      setShowReviewForm(false);
      setCanReview(false);
      setEligibleAppointmentId(null);
      refetchReviews();
      
      // Refresh business data to update review count and rating
      fetchBusinessData();
    } catch (error) {
      // Error is already handled by useReviews hook
      // eslint-disable-next-line no-console
      console.error('Error submitting review:', error);
    }
  };

  useEffect(() => {
    fetchBusinessData();
    if (user) {
      checkReviewEligibility();
    }
  }, [fetchBusinessData, checkReviewEligibility, user]);

  const calculateDistance = (lat: number, lon: number): number => {
    if (!userLocation) return 0;
    
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat - userLocation.latitude) * (Math.PI / 180);
    const dLon = (lon - userLocation.longitude) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation.latitude * (Math.PI / 180)) * 
      Math.cos(lat * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const formatHours = (hours: Record<string, string> | null | undefined): string => {
    if (!hours) return 'No disponible';
    // Assuming hours is an object like { monday: "9:00-18:00", ... }
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = daysOfWeek[new Date().getDay()];
    return hours[today] || 'Cerrado';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-100">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-card shadow-2xl">
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-100">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-card shadow-2xl">
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No se pudo cargar la información del negocio</p>
            <Button onClick={onClose} className="mt-4">Cerrar</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-100 p-2 sm:p-4">
      <Card className="w-full max-w-[98vw] sm:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden bg-card flex flex-col shadow-2xl">
        {/* Header con banner - Mobile Responsive */}
        <div className="relative">
          {business.banner_url ? (
            <img 
              src={business.banner_url} 
              alt={business.name}
              className="w-full h-32 sm:h-40 lg:h-48 object-cover"
            />
          ) : (
            <div className="w-full h-32 sm:h-40 lg:h-48 bg-linear-to-r from-primary/20 to-secondary/20" />
          )}
          
          {/* Botones en header - Touch Optimized */}
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex gap-2">
            {/* Botón favorito - SIMPLIFICADO: Usar solo effectiveUserId sin PermissionGate */}
            {effectiveUserId ? (
              <button
                onClick={handleToggleFavorite}
                className="p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <Heart 
                  className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${
                    isFavorite(businessId) 
                      ? 'fill-primary text-primary' 
                      : 'text-foreground'
                  }`} 
                />
              </button>
            ) : (
              <button
                onClick={() => toast.info('Inicia sesión para guardar favoritos')}
                className="p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              </button>
            )}
            
            {/* Botón cerrar */}
            <button
              onClick={onClose}
              className="p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          {/* Logo y info básica - Mobile Compact */}
          <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent p-3 sm:p-6">
            <div className="flex items-end gap-2 sm:gap-4">
              {business.logo_url && (
                <img 
                  src={business.logo_url} 
                  alt={business.name}
                  className="w-14 h-14 sm:w-20 sm:h-20 rounded-lg border-2 sm:border-4 border-background object-cover bg-background"
                />
              )}
              <div className="flex-1 text-white min-w-0">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 truncate">{business.name}</h2>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                  {business.category && (
                    <Badge variant="secondary" className="bg-background/80 text-foreground text-[10px] sm:text-xs">
                      {business.category.name}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400 shrink-0" />
                    <span className="font-medium">{business.rating.toFixed(1)}</span>
                    <span className="text-white/70">({business.reviewCount})</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido con scroll - Mobile Optimized */}
        <div className="flex-1 overflow-auto">
          {/* Información de contacto - Responsive Grid */}
          <div className="p-3 sm:p-6 border-b border-border">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
              {business.phone && (
                <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="truncate">{business.phone}</span>
                </div>
              )}
              {business.email && (
                <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="truncate">{business.email}</span>
                </div>
              )}
              {business.website && (
                <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                  <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <a href={business.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary truncate">
                    Sitio web
                  </a>
                </div>
              )}
              {business.subcategories && business.subcategories.length > 0 && (
                <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground col-span-full">
                  <span className="text-[10px] sm:text-xs">Especialidades:</span>
                  <span className="text-[10px] sm:text-xs line-clamp-1">{business.subcategories.map(s => s.name).join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tabs - Mobile Scrollable */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="px-3 sm:px-6">
            <TabsList className="grid w-full grid-cols-4 h-auto">
              <TabsTrigger value="services" className="text-xs sm:text-sm py-2 sm:py-2.5">
                <span className="hidden sm:inline">Servicios</span>
                <span className="sm:hidden">Servs.</span>
              </TabsTrigger>
              <TabsTrigger value="locations" className="text-xs sm:text-sm py-2 sm:py-2.5">
                <span className="hidden sm:inline">Ubicaciones</span>
                <span className="sm:hidden">Ubic.</span>
              </TabsTrigger>
              <TabsTrigger value="reviews" className="text-xs sm:text-sm py-2 sm:py-2.5">
                <span className="hidden sm:inline">Reseñas</span>
                <span className="sm:hidden">Reviews</span>
              </TabsTrigger>
              <TabsTrigger value="about" className="text-xs sm:text-sm py-2 sm:py-2.5">
                <span className="hidden sm:inline">Acerca de</span>
                <span className="sm:hidden">Info</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab: Servicios - Mobile Optimized */}
            <TabsContent value="services" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
              {business.services.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 sm:py-8 text-sm">
                  No hay servicios disponibles
                </p>
              ) : (
                <div className="grid gap-3 sm:gap-4">
                  {business.services.map((service) => (
                    <Card key={service.id} className="p-3 sm:p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base sm:text-lg mb-1 truncate">{service.name}</h3>
                          {service.description && (
                            <p className="text-xs sm:text-sm text-muted-foreground mb-2 line-clamp-2">
                              {service.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{formatDuration(service.duration)}</span>
                            </div>
                            {service.employee && (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={service.employee.avatar_url || undefined} alt={service.employee.name} />
                                  <AvatarFallback className="text-xs">
                                    {service.employee.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{service.employee.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary mb-2">
                            {formatCurrency(service.price, 'COP')}
                          </p>
                          <Button
                            onClick={() => onBookAppointment?.(businessId, service.id)}
                            size="sm"
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Agendar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Tab: Ubicaciones */}
            <TabsContent value="locations" className="space-y-4 mt-6">
              {business.locations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay ubicaciones registradas
                </p>
              ) : (
                <div className="grid gap-4">
                  {business.locations.map((location) => {
                    const distance = location.latitude && location.longitude
                      ? calculateDistance(location.latitude, location.longitude)
                      : null;

                    return (
                      <Card key={location.id} className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-2">{location.name}</h3>
                            <div className="space-y-2 text-sm text-muted-foreground">
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                <span>
                                  {location.address}, {location.city_name || location.city}, {location.state} {location.postal_code}
                                </span>
                              </div>
                              {location.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4" />
                                  <span>{location.phone}</span>
                                </div>
                              )}
                              {location.hours && (
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  <span>{formatHours(location.hours)}</span>
                                </div>
                              )}
                              {distance !== null && (
                                <div className="flex items-center gap-2 text-primary font-medium">
                                  <MapPin className="h-4 w-4" />
                                  <span>{distance.toFixed(1)} km de tu ubicación</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            onClick={() => onBookAppointment?.(businessId, undefined, location.id)}
                            size="sm"
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            Agendar aquí
                          </Button>
                        </div>
                        {location.latitude && location.longitude && (
                          <div className="mt-4">
                            <a
                              href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                              Ver en Google Maps
                              <ChevronRight className="h-4 w-4" />
                            </a>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Tab: Reseñas */}
            <TabsContent value="reviews" className="space-y-4 mt-6">
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
                  >
                    Dejar reseña
                  </Button>
                </div>
              )}

              {/* Lista de reseñas */}
              <ReviewList businessId={businessId} />
            </TabsContent>

            {/* Tab: Acerca de */}
            <TabsContent value="about" className="mt-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Descripción</h3>
                  <p className="text-muted-foreground">
                    {business.description || 'Sin descripción disponible'}
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-4">Información general</h3>
                  <div className="grid gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Categoría</span>
                      <span className="font-medium">{business.category?.name || 'No especificada'}</span>
                    </div>
                    {business.subcategories && business.subcategories.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Especialidades</span>
                        <span className="font-medium">{business.subcategories.map(s => s.name).join(', ')}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Servicios disponibles</span>
                      <span className="font-medium">{business.services.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ubicaciones</span>
                      <span className="font-medium">{business.locations.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Calificación promedio</span>
                      <span className="font-medium">{business.rating.toFixed(1)} ⭐</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer sticky con botones principales */}
        <div className="border-t border-border p-4 bg-background space-y-3">
          <Button 
            onClick={() => onBookAppointment?.(businessId)}
            className="w-full"
            size="lg"
          >
            <Calendar className="h-5 w-5 mr-2" />
            Agendar Cita
          </Button>
          
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center">
              ¿Tienes dudas sobre este negocio?
            </p>
            <Button 
              onClick={() => setShowChatModal(true)}
              className="w-full"
              size="lg"
              variant="outline"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
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
          onChatStarted={(conversationId) => {
            // Pasar conversationId al componente padre
            if (onChatStarted) {
              onChatStarted(conversationId);
            }
          }}
        />
      )}
    </div>
  );
}
