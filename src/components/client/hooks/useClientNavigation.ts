import React from 'react'
import { useSearchParams } from 'react-router-dom'

export type ClientPage = 'appointments' | 'favorites' | 'history' | 'profile' | 'settings' | 'chat'
export type ViewMode = 'list' | 'calendar'

export const useClientNavigation = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activePage, setActivePage] = React.useState<ClientPage>('appointments')
  const [viewMode, setViewMode] = React.useState<ViewMode>('list')

  // Handle initial booking context from URL parameters
  React.useEffect(() => {
    const businessId = searchParams.get('businessId')
    const serviceId = searchParams.get('serviceId')
    const locationId = searchParams.get('locationId')
    const employeeId = searchParams.get('employeeId')
    const action = searchParams.get('action')

    if (businessId && action === 'book') {
      // Set booking preselection and show wizard
      return {
        shouldShowWizard: true,
        bookingPreselection: {
          businessId,
          serviceId: serviceId || undefined,
          locationId: locationId || undefined,
          employeeId: employeeId || undefined,
        }
      }
    }

    return {
      shouldShowWizard: false,
      bookingPreselection: undefined
    }
  }, [searchParams])

  const clearUrlParams = () => {
    setSearchParams({})
  }

  return {
    activePage,
    setActivePage,
    viewMode,
    setViewMode,
    searchParams,
    clearUrlParams
  }
}