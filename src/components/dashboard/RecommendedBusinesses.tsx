import React, { useEffect, useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/hooks/useAuth'
import type { Business, Service } from '@/types'

interface BusinessWithServices {
  id: string
  name: string
  category: string
  rating: number
  reviews: number
  distance: string
  image: string
  services: string[]
  nextAvailable: string
  price_range: string
  description: string
  address: string
  city: string
}

function CategoryEmoji({ category }: Readonly<{ category: string }>) {
  const map: Record<string, string> = {
    beauty_salon: '💄',
    barbershop: '✂️',
    medical: '🏥',
    dental: '🦷',
    veterinary: '🐾',
    fitness: '💪',
    other: '🏢',
  }
  return <span>{map[category] ?? map.other}</span>
}

export default function RecommendedBusinesses() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [businesses, setBusinesses] = useState<BusinessWithServices[]>([])
  const [showAll, setShowAll] = useState(false)
  const [loading, setLoading] = useState(true)

  // Mapeo de categorías de negocio basado en el nombre
  const getBusinessCategory = (businessName: string, description?: string): string => {
    const name = businessName.toLowerCase()
    const desc = description?.toLowerCase() || ''

    if (name.includes('barbería') || name.includes('barber')) return 'barbershop'
    if (name.includes('spa') || name.includes('relax')) return 'beauty_salon'
    if (
      name.includes('clínica') ||
      name.includes('médico') ||
      name.includes('doctor') ||
      desc.includes('médico')
    )
      return 'medical'
    if (name.includes('dental') || name.includes('dentist') || desc.includes('dental'))
      return 'dental'
    if (name.includes('veterinaria') || name.includes('vet') || desc.includes('veterinar'))
      return 'veterinary'
    if (name.includes('gimnasio') || name.includes('fit') || desc.includes('ejercicio'))
      return 'fitness'
    if (name.includes('estética') || name.includes('beauty') || desc.includes('belleza'))
      return 'beauty_salon'
    if (name.includes('taller') || name.includes('mecánic') || desc.includes('automot'))
      return 'automotive'
    if (name.includes('estudio') || name.includes('fotograf') || desc.includes('foto'))
      return 'photography'

    return 'other'
  }

  // Generar datos simulados realistas para mostrar
  const generateBusinessData = React.useCallback(
    (business: Business, services: Service[]): BusinessWithServices => {
      const category = getBusinessCategory(business.name, business.description)
      const businessServices = services
        .filter(s => s.business_id === business.id)
        .slice(0, 3)
        .map(s => s.name)

      // Generar rating y reseñas basados en el ID del negocio (consistente)
      const seed = business.id.split('-').reduce((acc, part) => acc + part.length, 0)
      const rating = Math.round((4.2 + (seed % 8) / 10) * 10) / 10
      const reviews = 50 + (seed % 300)
      const distance = `${(0.5 + (seed % 25) / 10).toFixed(1)} km`

      // Horarios disponibles simulados
      const availableSlots = [
        'Hoy 2:00 PM',
        'Hoy 4:30 PM',
        'Mañana 9:00 AM',
        'Mañana 11:30 AM',
        'Viernes 10:00 AM',
        'Sábado 3:00 PM',
      ]
      const nextAvailable = availableSlots[seed % availableSlots.length]

      // Rangos de precio por categoría
      const priceRanges = {
        barbershop: '$150-600',
        beauty_salon: '$300-1,200',
        medical: '$500-2,000',
        dental: '$400-1,800',
        veterinary: '$300-1,500',
        fitness: '$200-800',
        automotive: '$400-2,500',
        photography: '$800-3,000',
        other: '$250-1,000',
      }

      // Imágenes por categoría
      const categoryImages = {
        barbershop: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&q=80',
        beauty_salon: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80',
        medical: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&q=80',
        dental: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&q=80',
        veterinary: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&q=80',
        fitness: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80',
        automotive: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80',
        photography: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=600&q=80',
        other: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80',
      }

      return {
        id: business.id,
        name: business.name,
        category,
        rating,
        reviews,
        distance,
        image: categoryImages[category as keyof typeof categoryImages] || categoryImages.other,
        services: businessServices.length > 0 ? businessServices : ['Consulta general'],
        nextAvailable,
        price_range: priceRanges[category as keyof typeof priceRanges] || priceRanges.other,
        description: business.description || '',
        address: business.address || '',
        city: business.city || '',
      }
    },
    []
  )

  useEffect(() => {
    async function loadBusinessData() {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Importar directamente businessesService para obtener TODOS los negocios
        const { businessesService } = await import('@/lib/services/businesses')
        const { servicesService } = await import('@/lib/services/services')

        // Obtener TODOS los negocios activos (no filtrados por usuario)
        const allBusinesses = await businessesService.list({ activeOnly: true })
        const allServices = await servicesService.list({ activeOnly: true })

        // Mostrar solo negocios de otros usuarios (no los propios)
        const recommendedBusinesses = allBusinesses
          .filter(b => b.owner_id !== user.id) // Excluir negocios propios
          .slice(0, 6) // Limitar a 6 negocios
          .map(business => generateBusinessData(business, allServices))

        setBusinesses(recommendedBusinesses)
      } catch {
        // En caso de error, mostrar lista vacía
        setBusinesses([])
      } finally {
        setLoading(false)
      }
    }

    loadBusinessData()
  }, [user, generateBusinessData])

  const displayed = showAll ? businesses : businesses.slice(0, 3)

  if (loading) {
    return (
      <section 
        className="p-4 lg:p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 max-w-full"
        role="status"
        aria-live="polite"
        aria-label="Cargando negocios recomendados"
      >
        <h3 id="loading-title" className="text-lg lg:text-xl font-semibold mb-3">Recomendados para ti</h3>
        <div className="space-y-3" aria-labelledby="loading-title">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse" aria-hidden="true">
              <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <span className="sr-only">Cargando negocios recomendados...</span>
      </section>
    )
  }

  if (!businesses.length) {
    return (
      <section 
        className="p-4 lg:p-6 rounded-xl bg-zinc-900/60 border border-zinc-800 max-w-full"
        role="region"
        aria-labelledby="empty-title"
      >
        <h3 id="empty-title" className="text-lg lg:text-xl font-semibold mb-3">Recomendados para ti</h3>
        <p className="text-zinc-400 mb-4">
          No hay negocios disponibles en este momento. ¡Sé el primero en crear uno!
        </p>
        <button 
          className="mt-4 px-4 py-2 rounded-md bg-zinc-800 text-zinc-200 border border-zinc-700 min-h-[44px] min-w-[44px] hover:bg-zinc-700 transition-colors"
          aria-label="Explorar negocios disponibles"
          title="Explorar negocios disponibles"
        >
          Explorar negocios
        </button>
      </section>
    )
  }

  return (
    <section className="space-y-4 max-w-full" aria-labelledby="recommended-title">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 id="recommended-title" className="text-lg lg:text-xl font-semibold">Recomendados para ti</h3>
        <button
          onClick={() => setShowAll(v => !v)}
          className="px-3 py-1.5 rounded-md border border-primary text-primary hover:bg-primary/10 min-h-[44px] min-w-[44px] transition-colors self-start sm:self-center"
          aria-label={showAll ? 'Ver menos negocios recomendados' : 'Ver todos los negocios recomendados'}
          title={showAll ? 'Ver menos negocios recomendados' : 'Ver todos los negocios recomendados'}
          aria-expanded={showAll}
          aria-controls="business-grid"
        >
          {showAll ? 'Ver menos' : 'Ver todos los recomendados'}
        </button>
      </div>
      <div 
        id="business-grid"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6"
        role="list"
        aria-label="Lista de negocios recomendados"
      >
        {displayed.map(b => (
          <article
            key={b.id}
            className="rounded-xl overflow-hidden bg-zinc-900/60 border border-zinc-800 hover:border-primary/40 transition-colors max-w-full"
            role="listitem"
          >
            <div className="relative h-32 sm:h-40 w-full bg-zinc-800">
              <img 
                src={b.image} 
                alt={`Imagen del negocio ${b.name}`} 
                className="object-cover w-full h-full"
                loading="lazy"
              />
              <div className="absolute top-2 left-2 text-xs px-2 py-1 rounded bg-card/90 text-foreground border border-border flex items-center gap-1">
                <span aria-hidden="true"><CategoryEmoji category={b.category} /></span>
                <span>
                  {t(`business.categories.${b.category}`, { name: b.category }) || b.category}
                </span>
              </div>
              <div className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-emerald-500/80 text-white flex items-center gap-1">
                <span className="w-3 h-3" aria-hidden="true">📍</span>
                <span>{b.distance}</span>
              </div>
            </div>
            <div className="p-3 lg:p-4 space-y-3">
              <div>
                <h4 className="text-base lg:text-lg font-semibold break-words">{b.name}</h4>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-zinc-400">
                  <div className="flex items-center">
                    <span className="w-4 h-4 text-yellow-400" aria-hidden="true">⭐</span>
                    <span className="ml-1" aria-label={`Calificación ${b.rating} de 5 estrellas`}>{b.rating}</span>
                  </div>
                  <span className="hidden sm:inline" aria-hidden="true">•</span>
                  <span>{b.reviews} reseñas</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 text-xs" role="list" aria-label="Servicios disponibles">
                {b.services.slice(0, 2).map(s => (
                  <span 
                    key={s} 
                    className="px-2 py-1 rounded border border-zinc-700 text-zinc-300"
                    role="listitem"
                  >
                    {s}
                  </span>
                ))}
                {b.services.length > 2 && (
                  <span 
                    className="px-2 py-1 rounded border border-zinc-700 text-zinc-300"
                    role="listitem"
                    aria-label={`${b.services.length - 2} servicios adicionales`}
                  >
                    +{b.services.length - 2} más
                  </span>
                )}
              </div>
              <div className="space-y-1 text-sm text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4" aria-hidden="true">⏰</span>
                  <span>Disponible: {b.nextAvailable}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium" aria-hidden="true">💰</span>
                  <span aria-label={`Rango de precios ${b.price_range}`}>{b.price_range}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  // Funcionalidad de navegación se implementará cuando se agregue el router
                  window.alert(`Próximamente podrás reservar en ${b.name}`)
                }}
                className="w-full px-4 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground transition-colors min-h-[44px]"
                aria-label={`Ver detalles del negocio ${b.name}`}
                title={`Ver detalles del negocio ${b.name}`}
              >
                Ver negocio
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
