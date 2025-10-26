import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Phone, Mail, Globe, Star, Clock, ChevronRight } from 'lucide-react';
import { useBusinessProfileData } from '@/hooks/useBusinessProfileData';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAuth } from '@/hooks/useAuth';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ReviewList } from '@/components/reviews/ReviewList';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useEffect, useMemo } from 'react';

interface PublicBusinessProfileProps {
  readonly slug?: string;
  readonly embedded?: boolean;
}

export default function PublicBusinessProfile({ slug: slugProp, embedded = false }: Readonly<PublicBusinessProfileProps>) {
  const routeParams = useParams<{ slug: string }>();
  const slug = slugProp ?? routeParams.slug;
  const navigate = useNavigate();
  const { user } = useAuth();
  const analytics = useAnalytics();
  
  // Geolocation for distance calculation
  const geoState = useGeolocation({ requestOnMount: true });

  // Memoize user location to avoid re-renders triggering refetch
  const userLocation = useMemo(() => (
    geoState.latitude && geoState.longitude
      ? { latitude: geoState.latitude, longitude: geoState.longitude }
      : undefined
  ), [geoState.latitude, geoState.longitude]);
  
  // Fetch business data by slug
  const { business, isLoading, error } = useBusinessProfileData({
    slug,
    userLocation
  });

  // Build SEO meta tags early to keep hook order stable
  const pageTitle = business?.meta_title || `${business?.name ?? 'Perfil del Negocio'} - AppointSync Pro`;
  const pageDescription = business?.meta_description || business?.description || (business ? `Reserva citas en ${business.name}` : 'Explora y reserva servicios.');
  const ogImage = business?.og_image_url || business?.banner_url || business?.logo_url;
  const canonicalUrl = `${globalThis.location.origin}/negocio/${business?.slug ?? slug}`;

  usePageMeta({
    title: pageTitle,
    description: pageDescription,
    keywords: business?.meta_keywords?.join(', '),
    ogImage: ogImage || undefined,
    ogTitle: pageTitle,
    ogDescription: pageDescription,
    canonical: canonicalUrl,
  });

  // Track profile view when business data loads
  useEffect(() => {
    if (business?.slug) {
      analytics.trackProfileView({
        businessId: business.id,
        businessName: business.name,
        slug: business.slug,
        category: business.category?.name,
      });
    }
  }, [business, analytics]);

  // Handle JSON-LD structured data (always call the hook, guard inside)
  useEffect(() => {
    if (!business) return;

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": business.name,
      "description": business.description,
      "image": ogImage,
      "url": canonicalUrl,
      "telephone": business.phone,
      "email": business.email,
      "address": business.locations[0] ? {
        "@type": "PostalAddress",
        "streetAddress": business.locations[0].address,
        "addressLocality": business.locations[0].city,
        "addressRegion": business.locations[0].state,
        "postalCode": business.locations[0].postal_code,
        "addressCountry": business.locations[0].country
      } : undefined,
      "aggregateRating": business.reviewCount > 0 ? {
        "@type": "AggregateRating",
        "ratingValue": business.rating.toFixed(1),
        "reviewCount": business.reviewCount
      } : undefined
    });
    document.head.appendChild(script);
    
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [business, ogImage, canonicalUrl]);

  // Handle booking action
  const handleBookAppointment = (serviceId?: string, locationId?: string, employeeId?: string) => {
    // Track reserve button click
    analytics.trackReserveButtonClick({
      businessId: business?.id || '',
      serviceId,
      source: 'profile',
    });

    if (!user) {
      // Save intended action and redirect to login
      const redirect = `/negocio/${slug}`;
      const params = new URLSearchParams();
      params.set('redirect', redirect);
      if (serviceId) params.set('serviceId', serviceId);
      if (locationId) params.set('locationId', locationId);
      if (employeeId) params.set('employeeId', employeeId);
      
      navigate(`/login?${params.toString()}`);
      return;
    }

    // User is authenticated, navigate to app with preselection
    navigate(`/app?businessId=${business?.id}&serviceId=${serviceId || ''}&locationId=${locationId || ''}&employeeId=${employeeId || ''}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Cargando información del negocio...</p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold text-foreground">Negocio no encontrado</h2>
          <p className="text-muted-foreground">
            {error || 'No pudimos encontrar el negocio que buscas.'}
          </p>
          <Button onClick={() => navigate('/')} variant="default">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  // Build SEO meta tags
  // const pageTitle = business.meta_title || `${business.name} - AppointSync Pro`;
  // const pageDescription = business.meta_description || business.description || `Reserva citas en ${business.name}`;
  // const ogImage = business.og_image_url || business.banner_url || business.logo_url;
  // const canonicalUrl = `${globalThis.location.origin}/negocio/${business.slug}`;

  // // Use the custom meta tag hook
  // usePageMeta({
  //   title: pageTitle,
  //   description: pageDescription,
  //   keywords: business.meta_keywords?.join(', '),
  //   ogImage: ogImage || undefined,
  //   ogTitle: pageTitle,
  //   ogDescription: pageDescription,
  //   canonical: canonicalUrl,
  // });
  // Meta tags managed earlier to keep hook calls stable

  // Handle JSON-LD structured data
  // useEffect(() => {
  //   const script = document.createElement('script');
  //   script.type = 'application/ld+json';
  //   script.textContent = JSON.stringify({
  //     "@context": "https://schema.org",
  //     "@type": "LocalBusiness",
  //     "name": business.name,
  //     "description": business.description,
  //     "image": ogImage,
  //     "url": canonicalUrl,
  //     "telephone": business.phone,
  //     "email": business.email,
  //     "address": business.locations[0] ? {
  //       "@type": "PostalAddress",
  //       "streetAddress": business.locations[0].address,
  //       "addressLocality": business.locations[0].city,
  //       "addressRegion": business.locations[0].state,
  //       "postalCode": business.locations[0].postal_code,
  //       "addressCountry": business.locations[0].country
  //     } : undefined,
  //     "aggregateRating": business.reviewCount > 0 ? {
  //       "@type": "AggregateRating",
  //       "ratingValue": business.rating.toFixed(1),
  //       "reviewCount": business.reviewCount
  //     } : undefined
  //   });
  //   document.head.appendChild(script);
  //   
  //   return () => {
  //     if (script.parentNode) script.parentNode.removeChild(script);
  //   };
  // }, [business, ogImage, canonicalUrl]);

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Header con navegación */}
        {!embedded && (
          <header className="sticky top-0 z-10 bg-card border-b border-border">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}> 
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <Button onClick={() => handleBookAppointment()} size="lg">
                <Calendar className="w-4 h-4 mr-2" />
                Reservar Ahora
              </Button>
            </div>
          </header>
        )}

        {/* Banner */}
        {business.banner_url && (
          <div className="relative h-64 w-full overflow-hidden">
            <img
              src={business.banner_url}
              alt={`Banner de ${business.name}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Business Header */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            {/* Logo */}
            {business.logo_url && (
              <div className="flex-shrink-0">
                <img
                  src={business.logo_url}
                  alt={`Logo de ${business.name}`}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-lg object-cover border-4 border-background shadow-lg"
                />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  {business.name}
                </h1>
                {business.category && (
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    {business.category.icon && <span>{business.category.icon}</span>}
                    <span>{business.category.name}</span>
                  </div>
                )}
                {business.subcategories && business.subcategories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {business.subcategories.map((subcat) => (
                      <Badge key={subcat.name} variant="secondary">
                        {subcat.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Rating */}
              {business.reviewCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full">
                    <Star className="w-4 h-4 fill-primary text-primary" />
                    <span className="font-semibold text-primary">{business.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({business.reviewCount} {business.reviewCount === 1 ? 'reseña' : 'reseñas'})
                  </span>
                </div>
              )}

              {/* Contact */}
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                {business.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <a 
                      href={`tel:${business.phone}`} 
                      className="hover:text-primary"
                      onClick={() => analytics.trackContactClick({
                        businessId: business.id,
                        contactType: 'phone',
                      })}
                    >
                      {business.phone}
                    </a>
                  </div>
                )}
                {business.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <a 
                      href={`mailto:${business.email}`} 
                      className="hover:text-primary"
                      onClick={() => analytics.trackContactClick({
                        businessId: business.id,
                        contactType: 'email',
                      })}
                    >
                      {business.email}
                    </a>
                  </div>
                )}
                {business.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <a 
                      href={business.website} 
                      target="_blank"
                      onClick={() => analytics.trackContactClick({
                        businessId: business.id,
                        contactType: 'email', // Use 'email' as closest match for website
                      })}
 
                      rel="noopener noreferrer"
                      className="hover:text-primary"
                    >
                      Sitio web
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {business.description && (
            <div className="mb-8">
              <p className="text-muted-foreground leading-relaxed">
                {business.description}
              </p>
            </div>
          )}

          <Separator className="my-8" />

          {/* Tabs */}
          <Tabs defaultValue="servicios" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="servicios">Servicios</TabsTrigger>
              <TabsTrigger value="ubicaciones">Ubicaciones</TabsTrigger>
              <TabsTrigger value="equipo">Equipo</TabsTrigger>
              <TabsTrigger value="resenas">Reseñas</TabsTrigger>
            </TabsList>

            {/* Services Tab */}
            <TabsContent value="servicios" className="space-y-4 mt-6">
              {business.services.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay servicios disponibles
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {business.services.map(service => (
                    <Card key={service.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{service.name}</h3>
                        <span className="text-primary font-bold text-lg">
                          ${service.price.toLocaleString('es-CO')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {service.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{service.duration} min</span>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleBookAppointment(service.id)}
                        >
                          Reservar
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Locations Tab */}
            <TabsContent value="ubicaciones" className="space-y-4 mt-6">
              {business.locations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay ubicaciones disponibles
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {business.locations.map(location => (
                    <Card key={location.id} className="p-4">
                      <h3 className="font-semibold text-lg mb-2">{location.name}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span>
                            {location.address}, {location.city}, {location.state} {location.postal_code}
                          </span>
                        </div>
                        {location.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-4 h-4" />
                            <a href={`tel:${location.phone}`} className="hover:text-primary">
                              {location.phone}
                            </a>
                          </div>
                        )}
                        {location.business_hours && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <p className="font-medium text-xs mb-2">Horario de atención:</p>
                            <div className="space-y-1 text-xs">
                              {Object.entries(location.business_hours).map(([day, hours]) => {
                                const hoursData = hours as { open?: string; close?: string; closed?: boolean };
                                return (
                                  <div key={day} className="flex justify-between">
                                    <span className="capitalize">{day}:</span>
                                    <span className={hoursData.closed ? 'text-muted-foreground' : ''}>
                                      {hoursData.closed ? 'Cerrado' : `${hoursData.open} - ${hoursData.close}`}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full mt-4"
                        onClick={() => handleBookAppointment(undefined, location.id)}
                      >
                        Reservar aquí
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="equipo" className="space-y-4 mt-6">
              {business.employees.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay información del equipo disponible
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {business.employees.map(employee => (
                    <Card key={employee.id} className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        {employee.avatar_url ? (
                          <img
                            src={employee.avatar_url}
                            alt={`${employee.first_name} ${employee.last_name}`}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            {employee.first_name[0]}{employee.last_name[0]}
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold">
                            {employee.first_name} {employee.last_name}
                          </h3>
                          {employee.title && (
                            <p className="text-sm text-muted-foreground">{employee.title}</p>
                          )}
                          {employee.review_count && employee.review_count > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-3 h-3 fill-primary text-primary" />
                              <span className="text-xs font-medium">{employee.rating?.toFixed(1)}</span>
                              <span className="text-xs text-muted-foreground">
                                ({employee.review_count})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      {employee.bio && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {employee.bio}
                        </p>
                      )}
                      {employee.specializations && employee.specializations.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {employee.specializations.slice(0, 3).map((spec) => (
                            <Badge key={spec} variant="outline" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleBookAppointment(undefined, undefined, employee.id)}
                      >
                        Reservar con {employee.first_name}
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="resenas" className="mt-6">
              <div className="max-h-[600px] overflow-y-auto">
                <ReviewList
                  businessId={business.id}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer CTA */}
        <div className="sticky bottom-0 border-t border-border bg-card/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            
          </div>
        </div>
      </div>
    </>
  );
}