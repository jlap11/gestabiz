import React, { useCallback, useEffect, useState } from 'react'
import {
  Calendar,
  CalendarDays,
  Heart,
  History,
  List,
  MessageCircle,
  Plus,
  X,
} from 'lucide-react'
import { UnifiedLayout } from '@/components/layouts/UnifiedLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AppointmentWizard } from '@/components/appointments/AppointmentWizard'
import CompleteUnifiedSettings from '@/components/settings/CompleteUnifiedSettings'
import { ClientCalendarView } from '@/components/client/ClientCalendarView'
import { ClientHistory } from '@/components/client/ClientHistory'
import { SearchResults } from '@/components/client/SearchResults'
import BusinessProfile from '@/components/business/BusinessProfile'
import ProfessionalProfile from '@/components/user/UserProfile'
import { BusinessSuggestions } from '@/components/client/BusinessSuggestions'
import FavoritesList from '@/components/client/FavoritesList'
import { MandatoryReviewModal } from '@/components/jobs'
import { AppointmentList } from '@/components/client/AppointmentList'
import { AppointmentDetailsModal } from '@/components/client/AppointmentDetailsModal'
import { AppointmentHeader } from '@/components/client/AppointmentHeader'
import { EmptyAppointmentsState } from '@/components/client/EmptyAppointmentsState'

// Custom hooks
import { useClientAppointments } from './hooks/useClientAppointments'
import { useClientNavigation } from './hooks/useClientNavigation'
import { useClientModals } from './hooks/useClientModals'

import { useGeolocation } from '@/hooks/useGeolocation'
import { useChat } from '@/hooks/useChat'
import { useLanguage } from '@/contexts/LanguageContext'
import { useMandatoryReviews } from '@/hooks/useMandatoryReviews'
import { usePendingNavigation } from '@/hooks/usePendingNavigation'
import { usePreferredCity } from '@/hooks/usePreferredCity'
import type { Appointment, User, UserRole } from '@/types/types'
import type { SearchType } from '@/components/client/SearchBar'
import supabase from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface SearchResult {
  id: string
  name: string
  type: SearchType
  subtitle?: string
  category?: string
  location?: string
}

interface SearchResultItem {
  id: string
  name: string
  type: SearchType
  description?: string
  rating?: number
  reviewCount?: number
  distance?: number
  createdAt?: string
  imageUrl?: string
  category?: string
  subcategory?: string
  location?: {
    address?: string
    city?: string
    latitude?: number
    longitude?: number
  }
  business?: {
    id: string
    name: string
  }
  price?: number
  currency?: string
}

// Extended appointment type with relations
type AppointmentWithRelations = Appointment & {
  business?: {
    id: string
    name: string
    description?: string
  }
  location?: {
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
  employee?: {
    id: string
    full_name: string
    email?: string
    phone?: string
    avatar_url?: string
  }
  service?: {
    id: string
    name: string
    description?: string
    duration?: number
    price?: number
    currency?: string
  }
}

interface ClientDashboardProps {
  currentRole: UserRole
  availableRoles: UserRole[]
  onRoleChange: (role: UserRole) => void
  onLogout?: () => void
  user: User // Requerido para UnifiedSettings
  initialBookingContext?: {
    businessId?: string
    serviceId?: string
    locationId?: string
    employeeId?: string
  } | null
}

export function ClientDashboard({
  currentRole,
  availableRoles,
  onRoleChange,
  onLogout,
  user,
  initialBookingContext,
}: Readonly<ClientDashboardProps>) {
  const [currentUser, setCurrentUser] = useState(user)
  const { t } = useLanguage()

  // Custom hooks
  const { appointments, upcomingAppointments, fetchClientAppointments } = useClientAppointments(currentUser?.id)
  const { activePage, setActivePage, viewMode, setViewMode } = useClientNavigation()
  const {
    // Appointment Wizard
    showAppointmentWizard,
    setShowAppointmentWizard,
    appointmentWizardBusinessId,
    setAppointmentWizardBusinessId,
    bookingPreselection,
    setBookingPreselection,
    preselectedDate,
    preselectedTime,
    appointmentToEdit,
    setAppointmentToEdit,
    handleCreateAppointmentFromCalendar,
    handleCloseWizard,
    // Search Modal
    searchModalOpen,
    setSearchModalOpen,
    searchParams,
    setSearchParams,
    // Other modals
    selectedAppointment,
    setSelectedAppointment,
    selectedBusinessId,
    setSelectedBusinessId,
    selectedUserId,
    setSelectedUserId,
    chatConversationId,
    setChatConversationId,
    isStartingChat,
    setIsStartingChat,
  } = useClientModals()

  // Chat hook
  const { createOrGetConversation } = useChat(user.id)

  // Función para manejar cambios de página con contexto
  const handlePageChange = (page: string, context?: Record<string, unknown>) => {
    setActivePage(page)
    // Aquí puedes usar el context si necesitas pasarlo a componentes hijos
    if (context) {
      // eslint-disable-next-line no-console
      console.log('Client navigation context:', context)
    }
  }

  // Hook para procesar navegaciones pendientes después de cambio de rol
  usePendingNavigation(handlePageChange)

  // Mandatory reviews hook
  const {
    shouldShowModal: shouldShowReviewModal,
    pendingReviewsCount,
    checkPendingReviews,
    remindLater,
    dismissModal: dismissReviewModal,
  } = useMandatoryReviews(user.id)

  // Geolocation for proximity-based search
  const geolocation = useGeolocation({
    requestOnMount: true,
    showPermissionPrompt: true,
  })

  // Hook para preferencias de ciudad (para sugerencias)
  const { preferredCityName, preferredRegionName } = usePreferredCity()

  // Handle initial booking context from public profile redirect
  useEffect(() => {
    if (initialBookingContext) {
      if (initialBookingContext.businessId) {
        setAppointmentWizardBusinessId(initialBookingContext.businessId)
      }

      if (
        initialBookingContext.serviceId ||
        initialBookingContext.locationId ||
        initialBookingContext.employeeId
      ) {
        setBookingPreselection({
          serviceId: initialBookingContext.serviceId,
          locationId: initialBookingContext.locationId,
          employeeId: initialBookingContext.employeeId,
        })
      }

      // Open appointment wizard
      setShowAppointmentWizard(true)
      setActivePage('appointments')
    }
  }, [initialBookingContext, setAppointmentWizardBusinessId, setBookingPreselection, setShowAppointmentWizard, setActivePage])

  // Leer conversation_id de la URL al cargar
  useEffect(() => {
    const urlParams = new URLSearchParams(globalThis.location.search)
    const conversationParam = urlParams.get('conversation')

    if (conversationParam) {
      // eslint-disable-next-line no-console
      console.log('[ClientDashboard] Opening chat from URL param:', conversationParam)
      setChatConversationId(conversationParam)

      // Limpiar URL sin recargar página
      globalThis.history.replaceState({}, '', globalThis.location.pathname)
    }
  }, [])

  // Handle search result selection (from quick search)
  const handleSearchResultSelect = useCallback((result: SearchResult) => {
    // Open detailed view for this result
    if (result.type === 'businesses') {
      setSelectedBusinessId(result.id)
    } else if (result.type === 'users') {
      setSelectedUserId(result.id)
    }
    // eslint-disable-next-line no-console
    console.log('Selected quick search result:', result)
  }, [setSelectedBusinessId, setSelectedUserId])

  // Handle "View More" from search bar
  const handleSearchViewMore = useCallback((term: string, type: SearchType) => {
    setSearchParams({ term, type })
    setSearchModalOpen(true)
  }, [setSearchParams, setSearchModalOpen])

  // Handle result click from SearchResults modal
  const handleSearchResultItemClick = useCallback((result: SearchResultItem) => {
    setSearchModalOpen(false)

    if (result.type === 'businesses') {
      setSelectedBusinessId(result.id)
    } else if (result.type === 'users') {
      setSelectedUserId(result.id)
    }
    // eslint-disable-next-line no-console
    console.log('Selected detailed search result:', result)
  }, [setSearchModalOpen, setSelectedBusinessId, setSelectedUserId])

  // Handle booking from business profile
  const handleBookAppointment = useCallback(
    (serviceId?: string, locationId?: string, employeeId?: string) => {
      // Guardar el businessId antes de cerrar el modal
      const businessIdToUse = selectedBusinessId

      // Close profile modal
      setSelectedBusinessId(null)
      setSelectedUserId(null)

      // Open appointment wizard with preselected business
      if (businessIdToUse) {
        setAppointmentWizardBusinessId(businessIdToUse)
      }
      setShowAppointmentWizard(true)

      // eslint-disable-next-line no-console
      console.log('Book appointment:', {
        businessId: businessIdToUse,
        serviceId,
        locationId,
        employeeId,
      })
    },
    [selectedBusinessId, setSelectedBusinessId, setSelectedUserId, setAppointmentWizardBusinessId, setShowAppointmentWizard]
  )

  // Handle chat with professional from appointment details
  const handleStartChatWithProfessional = useCallback(
    async (professionalId: string, businessId?: string) => {
      if (!user?.id || !professionalId) {
        toast.error(t('clientDashboard.chatInitError'))
        return
      }

      console.log('[ClientDashboard] Starting chat with professional:', {
        professionalId,
        businessId,
      })
      setIsStartingChat(true)

      try {
        // Crear o obtener conversación con el profesional
        const conversationId = await createOrGetConversation({
          other_user_id: professionalId,
          business_id: businessId,
            initial_message: t('clientDashboard.chatInitialMessage'),
        })

        console.log('[ClientDashboard] Conversation created/retrieved:', conversationId)

        if (conversationId) {
          // Cerrar modal de detalles
          setSelectedAppointment(null)

          // Establecer la conversación activa para abrir el chat
          setChatConversationId(conversationId)
          console.log('[ClientDashboard] chatConversationId set to:', conversationId)

          toast.success(t('clientDashboard.chatStarted'))
        }
      } catch (error) {
        console.error('Error al iniciar chat:', error)
        toast.error(t('clientDashboard.chatError'))
      } finally {
        setIsStartingChat(false)
      }
    },
    [user?.id, createOrGetConversation, t, setIsStartingChat, setSelectedAppointment, setChatConversationId]
  )

    // Wrapper to start chat when invoked from history component (receives the appointment)
    const handleStartChatFromHistory = useCallback(async (appointment: AppointmentWithRelations) => {
      if (!appointment?.employee?.id) {
        toast.error(t('clientDashboard.chatInitError'))
        return
      }
      await handleStartChatWithProfessional(appointment.employee.id, appointment.business?.id)
    }, [handleStartChatWithProfessional, t])

    const handleLeaveReviewFromHistory = useCallback((appointment: AppointmentWithRelations) => {
      // Minimal implementation: notify user and log. Full review flow handled elsewhere.
      console.log('Leave review for appointment:', appointment)
      toast.info(t('clientDashboard.reviewReminder', { count: '1' }))
    }, [t])

  // Handle cancel appointment
  const handleCancelAppointment = useCallback(
    async (appointmentId: string) => {
      if (!confirm(t('clientDashboard.confirmCancelPrompt'))) {
        return
      }

      try {
        const { error } = await supabase
          .from('appointments')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            cancelled_by: user?.id,
            cancel_reason: 'Cancelada por el cliente',
          })
          .eq('id', appointmentId)

        if (error) throw error

  toast.success(t('clientDashboard.cancelSuccess'))
        setSelectedAppointment(null)

        // Refresh appointments list
        const refreshedAppointments = appointments.map(apt =>
          apt.id === appointmentId ? { ...apt, status: 'cancelled' as const } : apt
        )
        setAppointments(refreshedAppointments)
      } catch (error) {
        console.error('Error al cancelar cita:', error)
        toast.error(t('clientDashboard.cancelError'))
      }
    },
    [user?.id, appointments, t, setSelectedAppointment, setAppointments]
  )

  // Handle reschedule appointment
  const handleRescheduleAppointment = useCallback((appointment: AppointmentWithRelations) => {
    // Close modal
    setSelectedAppointment(null)

    // Set appointment to edit
    setAppointmentToEdit(appointment)

    // Open wizard with preselected data
    setAppointmentWizardBusinessId(appointment.business_id)
    setBookingPreselection({
      serviceId: appointment.service_id || undefined,
      locationId: appointment.location_id || undefined,
      employeeId: appointment.employee_id || undefined,
    })

    if (appointment.start_time) {
      const startDate = new Date(appointment.start_time)
      setPreselectedDate(startDate)
      const formattedTime = startDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
      setPreselectedTime(formattedTime)
    } else {
      setPreselectedDate(undefined)
      setPreselectedTime(undefined)
    }
    setShowAppointmentWizard(true)

    toast.info(t('clientDashboard.editAppointmentInfo'))
  }, [t, setSelectedAppointment, setAppointmentToEdit, setAppointmentWizardBusinessId, setBookingPreselection, setPreselectedDate, setPreselectedTime, setShowAppointmentWizard])

  // Listen for avatar updates and refresh user
  useEffect(() => {
    const handleAvatarUpdate = () => {
      const updatedUserStr = window.localStorage.getItem('current-user')
      if (updatedUserStr) {
        try {
          const updatedUser = JSON.parse(updatedUserStr)
          setCurrentUser(updatedUser)
        } catch {
          // Ignore parse errors
        }
      }
    }

    window.addEventListener('avatar-updated', handleAvatarUpdate)
    return () => window.removeEventListener('avatar-updated', handleAvatarUpdate)
  }, [])

  // Update current user when prop changes
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('👤 ClientDashboard: user prop changed', { userId: user?.id, userName: user?.name })
    setCurrentUser(user)
  }, [user])



  const sidebarItems = [
    {
      id: 'appointments',
      label: t('clientDashboard.sidebar.appointments'),
      icon: <Calendar className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />,
    },
    {
      id: 'favorites',
      label: t('clientDashboard.sidebar.favorites'),
      icon: <Heart className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />,
    },
    {
      id: 'history',
      label: t('clientDashboard.sidebar.history'),
      icon: <History className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />,
    },
  ]



  // NOTE: status labels are now resolved where needed; helper removed to avoid unused symbol

  // NOTE: handlers `handleCreateAppointmentFromCalendar` and `handleCloseWizard` are
  // provided by the `useClientModals` hook above and should NOT be redeclared here.

  const renderContent = () => {
    switch (activePage) {
      case 'appointments':
        return (
          <main className="p-3 sm:p-6" role="main" aria-labelledby="appointments-page-title">
            <AppointmentHeader
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onNewAppointment={() => setShowAppointmentWizard(true)}
            />

            {/* Layout de 2 columnas: Citas (izquierda) + Sugerencias (derecha) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Columna izquierda: Citas (2/3 del ancho) */}
              <section className="lg:col-span-2" aria-labelledby="appointments-content-title">
                <h2 id="appointments-content-title" className="sr-only">
                  {viewMode === 'calendar' ? t('clientDashboard.accessible.calendarView') : t('clientDashboard.accessible.listView')}
                </h2>
                {/* Calendar View */}
                {viewMode === 'calendar' ? (
                  <ClientCalendarView
                    appointments={appointments}
                    onAppointmentClick={setSelectedAppointment}
                    onCreateAppointment={handleCreateAppointmentFromCalendar}
                  />
                ) : (
                  /* List View */
                  upcomingAppointments.length === 0 ? (
                    <EmptyAppointmentsState
                      onNewAppointment={() => setShowAppointmentWizard(true)}
                    />
                  ) : (
                    <AppointmentList
                      appointments={upcomingAppointments}
                      onAppointmentClick={setSelectedAppointment}
                    />
                  )
                )}
              </section>

              {/* Columna derecha: Sugerencias (1/3 del ancho) */}
              <aside className="lg:col-span-1" aria-labelledby="suggestions-title">
                <h2 id="suggestions-title" className="sr-only">{t('clientDashboard.suggestions.title')}</h2>
                <BusinessSuggestions
                  userId={user?.id || ''}
                  preferredCityName={preferredCityName}
                  preferredRegionName={preferredRegionName}
                  onBusinessSelect={setSelectedBusinessId}
                />
              </aside>
            </div>
          </main>
        )
      case 'profile':
      case 'settings':
        return (
          <div className="p-3 sm:p-6">
            {currentUser && (
              <CompleteUnifiedSettings
                user={currentUser}
                onUserUpdate={setCurrentUser}
                currentRole="client"
              />
            )}
          </div>
        )
      case 'favorites':
        return (
          <div className="p-3 sm:p-6">
            {currentUser && <FavoritesList />}
          </div>
        )
      case 'history':
        return (
          <div className="p-3 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">{t('clientDashboard.history.title')}</h2>
            {currentUser && (
              <ClientHistory
                userId={currentUser.id}
                onStartChat={handleStartChatFromHistory}
                onLeaveReview={handleLeaveReviewFromHistory}
              />
            )}
          </div>
        )
      default:
        return (
          <div className="p-3 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">{t('clientDashboard.header.myAppointments')}</h2>
            <p className="text-muted-foreground">{t('clientDashboard.empty.upcomingPlaceholder')}</p>
          </div>
        )
    }
  }

  return (
    <>
      <UnifiedLayout
        currentRole={currentRole}
        availableRoles={availableRoles}
        onRoleChange={onRoleChange}
        onLogout={onLogout}
        sidebarItems={sidebarItems}
    activePage={activePage}
    onPageChange={handlePageChange}
        user={
          currentUser
            ? {
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email,
                avatar: currentUser.avatar_url,
              }
            : undefined
        }
        onSearchResultSelect={handleSearchResultSelect}
        onSearchViewMore={handleSearchViewMore}
        chatConversationId={chatConversationId}
        onChatClose={() => setChatConversationId(null)}
      >
        {renderContent()}
      </UnifiedLayout>

      {/* Appointment Wizard Modal */}
      {showAppointmentWizard && currentUser && (
        <AppointmentWizard
          open={showAppointmentWizard}
          onClose={handleCloseWizard}
          businessId={appointmentWizardBusinessId}
          preselectedServiceId={bookingPreselection?.serviceId}
          preselectedLocationId={bookingPreselection?.locationId}
          preselectedEmployeeId={bookingPreselection?.employeeId}
          userId={currentUser.id}
          preselectedDate={preselectedDate}
          preselectedTime={preselectedTime}
          appointmentToEdit={appointmentToEdit}
          onSuccess={() => {
            handleCloseWizard()
            fetchClientAppointments()
          }}
        />
      )}

      {/* Search Results Modal */}
      {searchModalOpen && searchParams && (
        <SearchResults
          searchTerm={searchParams.term}
          searchType={searchParams.type}
          userLocation={
            geolocation.hasLocation
              ? {
                  latitude: geolocation.latitude!,
                  longitude: geolocation.longitude!,
                }
              : undefined
          }
          onResultClick={handleSearchResultItemClick}
          onClose={() => setSearchModalOpen(false)}
        />
      )}

      {/* Appointment Details Modal */}
      <AppointmentDetailsModal
        appointment={selectedAppointment}
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onStartChat={handleStartChatWithProfessional}
        onReschedule={handleRescheduleAppointment}
        onCancel={handleCancelAppointment}
        isStartingChat={isStartingChat}
      />

      {/* Business Profile Modal */}
      {selectedBusinessId && (
        <BusinessProfile
          businessId={selectedBusinessId}
          onClose={() => setSelectedBusinessId(null)}
          onBookAppointment={handleBookAppointment}
          onChatStarted={conversationId => {
            setActivePage('chat')
            setChatConversationId(conversationId)
            setSelectedBusinessId(null)
          }}
          userLocation={
            geolocation.hasLocation
              ? {
                  latitude: geolocation.latitude!,
                  longitude: geolocation.longitude!,
                }
              : undefined
          }
        />
      )}

      {/* Professional Profile Modal */}
      {selectedUserId && (
        <ProfessionalProfile
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onBookAppointment={(_serviceId, _businessId) => {
            setSelectedUserId(null)
            setShowAppointmentWizard(true)
          }}
          userLocation={
            geolocation.hasLocation
              ? {
                  latitude: geolocation.latitude!,
                  longitude: geolocation.longitude!,
                }
              : undefined
          }
        />
      )}

      {/* Mandatory Review Modal */}
      <MandatoryReviewModal
        isOpen={shouldShowReviewModal}
        onClose={() => {
          remindLater()
          toast.info(t('clientDashboard.reviewReminder', { count: String(pendingReviewsCount) }))
        }}
        onReviewSubmitted={() => {
          checkPendingReviews()
          fetchClientAppointments()
          toast.success(t('clientDashboard.thanksForReview'))
        }}
        userId={user.id}
      />
    </>
  )
}