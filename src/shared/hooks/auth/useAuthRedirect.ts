import { useEffect } from 'react'

export interface RedirectParams {
  redirectUrl: string | null
  serviceId: string | null
  locationId: string | null
  employeeId: string | null
}

export interface AuthRedirectActions {
  showBookingToast: (message: string) => void
  handlePostLoginRedirect: (navigate: (url: string) => void) => void
}

/**
 * Hook to handle authentication redirects and preserve booking context
 */
export function useAuthRedirect(
  params: RedirectParams,
  showToast: (message: string) => void
): AuthRedirectActions {
  
  const { redirectUrl, serviceId, locationId, employeeId } = params

  // Show toast if user was redirected from booking attempt
  useEffect(() => {
    if (redirectUrl && (serviceId || locationId || employeeId)) {
      showToast('Por favor inicia sesión para continuar con tu reserva')
    }
  }, [redirectUrl, serviceId, locationId, employeeId, showToast])

  const showBookingToast = (message: string) => {
    showToast(message)
  }

  const handlePostLoginRedirect = (navigate: (url: string) => void) => {
    if (redirectUrl) {
      // Build URL with preserved params
      const params = new URLSearchParams()
      if (serviceId) params.set('serviceId', serviceId)
      if (locationId) params.set('locationId', locationId)
      if (employeeId) params.set('employeeId', employeeId)
      
      const targetUrl = params.toString() 
        ? `${redirectUrl}?${params.toString()}` 
        : redirectUrl
      
      navigate(targetUrl)
    }
  }

  return {
    showBookingToast,
    handlePostLoginRedirect
  }
}
