import { toast } from 'sonner'
import { useLanguage } from '@/contexts/LanguageContext'

export function useLocationDetection() {
  const { t } = useLanguage()

  const detectLocation = (onLocationDetected: (latitude: string, longitude: string) => void) => {
    if (!navigator.geolocation) {
      toast.error(t('business.registration.geolocation_not_supported'))
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }

    const onSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords
      onLocationDetected(latitude.toString(), longitude.toString())
      toast.success(t('business.registration.location_detected'))
    }

    const onError = (error: GeolocationPositionError) => {
      let errorMessage = t('business.registration.location_error')
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = t('business.registration.location_permission_denied')
          break
        case error.POSITION_UNAVAILABLE:
          errorMessage = t('business.registration.location_unavailable')
          break
        case error.TIMEOUT:
          errorMessage = t('business.registration.location_timeout')
          break
      }
      
      toast.error(errorMessage)
    }

    navigator.geolocation.getCurrentPosition(onSuccess, onError, options)
  }

  return { detectLocation }
}