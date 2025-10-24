import { useCallback, useEffect, useState } from 'react'

export interface GeolocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  error: string | null
  loading: boolean
  permissionStatus: 'granted' | 'denied' | 'prompt' | null
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  requestOnMount?: boolean
  showPermissionPrompt?: boolean
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    requestOnMount = false,
    showPermissionPrompt = true,
  } = options

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
    permissionStatus: null,
  })

  // Check permission status
  const checkPermission = useCallback(async () => {
    if (!navigator.permissions) {
      return null
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' })
      setState(prev => ({
        ...prev,
        permissionStatus: result.state as 'granted' | 'denied' | 'prompt',
      }))
      return result.state
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error checking geolocation permission:', error)
      return null
    }
  }, [])

  // Request location
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'La geolocalización no está soportada por este navegador',
        loading: false,
      }))
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      position => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
          permissionStatus: 'granted',
        })
      },
      error => {
        let errorMessage = 'Error desconocido'

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              'Permiso de ubicación denegado. Por favor, habilita la ubicación en la configuración de tu navegador para una mejor experiencia.'
            setState(prev => ({ ...prev, permissionStatus: 'denied' }))
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'La información de ubicación no está disponible.'
            break
          case error.TIMEOUT:
            errorMessage = 'La solicitud de ubicación ha excedido el tiempo límite.'
            break
        }

        setState(prev => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }))
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    )
  }, [enableHighAccuracy, timeout, maximumAge])

  // Watch position (continuous tracking)
  const watchPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'La geolocalización no está soportada por este navegador',
        loading: false,
      }))
      return null
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    const watchId = navigator.geolocation.watchPosition(
      position => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          error: null,
          loading: false,
          permissionStatus: 'granted',
        })
      },
      error => {
        let errorMessage = 'Error desconocido'

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permiso de ubicación denegado.'
            setState(prev => ({ ...prev, permissionStatus: 'denied' }))
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'La información de ubicación no está disponible.'
            break
          case error.TIMEOUT:
            errorMessage = 'La solicitud de ubicación ha excedido el tiempo límite.'
            break
        }

        setState(prev => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }))
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    )

    return watchId
  }, [enableHighAccuracy, timeout, maximumAge])

  // Stop watching position
  const clearWatch = useCallback((watchId: number) => {
    if (navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371 // Radius of Earth in kilometers
      const dLat = (lat2 - lat1) * (Math.PI / 180)
      const dLon = (lon2 - lon1) * (Math.PI / 180)

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2)

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const distance = R * c // Distance in km

      return distance
    },
    []
  )

  // Request location on mount if specified
  useEffect(() => {
    checkPermission()

    if (requestOnMount) {
      requestLocation()
    }
  }, [requestOnMount, checkPermission, requestLocation])

  // Show permission prompt on mount if needed
  useEffect(() => {
    if (showPermissionPrompt && state.permissionStatus === 'prompt') {
      // Could show a custom modal here explaining why we need location
      // For now, we just request it
      requestLocation()
    }
  }, [showPermissionPrompt, state.permissionStatus, requestLocation])

  return {
    ...state,
    requestLocation,
    watchPosition,
    clearWatch,
    calculateDistance,
    checkPermission,
    hasLocation: state.latitude !== null && state.longitude !== null,
    isPermissionGranted: state.permissionStatus === 'granted',
    isPermissionDenied: state.permissionStatus === 'denied',
  }
}
