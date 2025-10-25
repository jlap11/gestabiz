import React from 'react'
import { MapPin } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface Location {
  id: string
  name: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  latitude?: number
  longitude?: number
  google_maps_url?: string
}

interface AppointmentLocationProps {
  location: Location
}

export function AppointmentLocation({ location }: AppointmentLocationProps) {
  const { t } = useLanguage()

  // Generate Google Maps URL: use saved URL or fallback to coordinates
  const googleMapsUrl =
    location.google_maps_url ||
    (location.latitude && location.longitude
      ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
      : null)

  return (
    <section role="region" aria-labelledby="location-info">
      <h3 id="location-info" className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
        <MapPin className="h-4 w-4" aria-hidden="true" />
        {t('clientDashboard.locationAndAddress')}
      </h3>
      <div className="mt-2 space-y-2 p-3 bg-muted/30 rounded-lg">
        <p className="text-sm sm:text-base font-semibold text-foreground">
          {location.name}
        </p>
        {location.address && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {location.address}
            {location.city && `, ${location.city}`}
            {location.state && `, ${location.state}`}
            {location.postal_code && ` ${location.postal_code}`}
            {location.country && `, ${location.country}`}
          </p>
        )}
        {googleMapsUrl && (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
            aria-label={t('clientDashboard.viewInGoogleMapsAria')}
          >
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {t('clientDashboard.viewInGoogleMaps')}
          </a>
        )}
      </div>
    </section>
  )
}