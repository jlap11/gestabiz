import React, { useState, useEffect, useCallback } from 'react'
import { Calendar, User as UserIcon, Plus, Clock, MapPin, Phone, Mail, FileText, List, CalendarDays, History, MessageCircle, X, Heart } from 'lucide-react'
import { UnifiedLayout } from '@/components/layouts/UnifiedLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import { useGeolocation } from '@/hooks/useGeolocation'
import { useChat } from '@/hooks/useChat'
import { useMandatoryReviews } from '@/hooks/useMandatoryReviews'
import { usePendingNavigation } from '@/hooks/usePendingNavigation'
import { usePreferredCity } from '@/hooks/usePreferredCity'
import type { UserRole, User } from '@/types/types'
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
interface AppointmentWithRelations {
  id: string
  business_id: string
  location_id?: string
  service_id?: string
  user_id: string
  client_id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
  notes?: string
  price?: number
  currency?: string
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
  initialBookingContext
}: Readonly<ClientDashboardProps>) {
  const [activePage, setActivePage] = useState('appointments')
  const [showAppointmentWizard, setShowAppointmentWizard] = useState(false)
  const [appointmentWizardBusinessId, setAppointmentWizardBusinessId] = useState<string | undefined>(undefined)
  const [appointmentToEdit, setAppointmentToEdit] = useState<AppointmentWithRelations | null>(null)
  const [bookingPreselection, setBookingPreselection] = useState<{
    serviceId?: string
    locationId?: string
    employeeId?: string
  } | undefined>(undefined)
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRelations | null>(null)
  const [currentUser, setCurrentUser] = useState(user)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [preselectedDate, setPreselectedDate] = useState<Date | undefined>(undefined)
  const [preselectedTime, setPreselectedTime] = useState<string | undefined>(undefined)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [searchParams, setSearchParams] = useState<{ term: string; type: SearchType } | null>(null)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  
  // Chat state
  const [chatConversationId, setChatConversationId] = useState<string | null>(null)
  const [isStartingChat, setIsStartingChat] = useState(false)
  
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
    dismissModal: dismissReviewModal
  } = useMandatoryReviews(user.id)

  // Geolocation for proximity-based search
  const geolocation = useGeolocation({
    requestOnMount: true,
    showPermissionPrompt: true
  })

  // Hook para preferencias de ciudad (para sugerencias)
  const {
    preferredCityName,
    preferredRegionName
  } = usePreferredCity()

  // Handle initial booking context from public profile redirect
  useEffect(() => {
    if (initialBookingContext) {
      if (initialBookingContext.businessId) {
        setAppointmentWizardBusinessId(initialBookingContext.businessId)
      }
      
      if (initialBookingContext.serviceId || initialBookingContext.locationId || initialBookingContext.employeeId) {
        setBookingPreselection({
          serviceId: initialBookingContext.serviceId,
          locationId: initialBookingContext.locationId,
          employeeId: initialBookingContext.employeeId
        })
      }
      
      // Open appointment wizard
      setShowAppointmentWizard(true)
      setActivePage('appointments')
    }
  }, [initialBookingContext])

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
  }, [])

  // Handle "View More" from search bar
  const handleSearchViewMore = useCallback((term: string, type: SearchType) => {
    setSearchParams({ term, type })
    setSearchModalOpen(true)
  }, [])

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
  }, [])

  // Handle booking from business profile
  const handleBookAppointment = useCallback((serviceId?: string, locationId?: string, employeeId?: string) => {
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
    console.log('Book appointment:', { businessId: businessIdToUse, serviceId, locationId, employeeId })
  }, [selectedBusinessId])
  
  // Handle chat with professional from appointment details
  const handleStartChatWithProfessional = useCallback(async (professionalId: string, businessId?: string) => {
    if (!user?.id || !professionalId) {
      toast.error('No se puede iniciar el chat en este momento')
      return
    }
    
    console.log('[ClientDashboard] Starting chat with professional:', { professionalId, businessId })
    setIsStartingChat(true)
    
    try {
      // Crear o obtener conversación con el profesional
      const conversationId = await createOrGetConversation({
        other_user_id: professionalId,
        business_id: businessId,
        initial_message: '¡Hola! Tengo algunas preguntas sobre mi cita.'
      })
      
      console.log('[ClientDashboard] Conversation created/retrieved:', conversationId)
      
      if (conversationId) {
        // Cerrar modal de detalles
        setSelectedAppointment(null)
        
        // Establecer la conversación activa para abrir el chat
        setChatConversationId(conversationId)
        console.log('[ClientDashboard] chatConversationId set to:', conversationId)
        
        toast.success('Chat iniciado con el profesional')
      }
    } catch (error) {
      console.error('Error al iniciar chat:', error)
      toast.error('No se pudo iniciar el chat. Por favor, intenta de nuevo.')
    } finally {
      setIsStartingChat(false)
    }
  }, [user?.id, createOrGetConversation])

  // Handle cancel appointment
  const handleCancelAppointment = useCallback(async (appointmentId: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancelled_by: user?.id,
          cancel_reason: 'Cancelada por el cliente'
        })
        .eq('id', appointmentId)

      if (error) throw error

      toast.success('Cita cancelada exitosamente')
      setSelectedAppointment(null)
      
      // Refresh appointments list
      const refreshedAppointments = appointments.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, status: 'cancelled' as const }
          : apt
      )
      setAppointments(refreshedAppointments)
    } catch (error) {
      console.error('Error al cancelar cita:', error)
      toast.error('No se pudo cancelar la cita. Intenta de nuevo.')
    }
  }, [user?.id, appointments])

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
      employeeId: appointment.employee_id || undefined
    })

    if (appointment.start_time) {
      const startDate = new Date(appointment.start_time)
      setPreselectedDate(startDate)
      const formattedTime = startDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
      setPreselectedTime(formattedTime)
    } else {
      setPreselectedDate(undefined)
      setPreselectedTime(undefined)
    }
    setShowAppointmentWizard(true)
    
    toast.info('Modifica los datos de tu cita y confirma los cambios')
  }, [])

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
  
  // Fetch client appointments with related data (business, location, employee)
  const fetchClientAppointments = React.useCallback(async () => {
    if (!currentUser?.id) {
      // eslint-disable-next-line no-console
      console.log('⚠️ No currentUser.id, skipping fetch')
      return
    }
    
    // eslint-disable-next-line no-console
    console.log('🔍 Fetching appointments for client:', currentUser.id)
    
    try {
      // Query appointments con JOINs para traer toda la información necesaria
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          created_at,
          updated_at,
          business_id,
          location_id,
          service_id,
          client_id,
          employee_id,
          start_time,
          end_time,
          status,
          notes,
          price,
          currency,
          businesses!inner (
            id,
            name,
            description
          ),
          locations!inner (
            id,
            name,
            address,
            city,
            state,
            postal_code,
            country,
            latitude,
            longitude
          ),
          profiles!inner (
            id,
            full_name,
            email,
            phone,
            avatar_url
          ),
          services!inner (
            id,
            name,
            description,
            duration,
            price,
            currency
          )
        `)
        .eq('client_id', currentUser.id)
        .order('start_time', { ascending: true })
      
      // eslint-disable-next-line no-console
      console.log('📊 Query result:', { appointmentsCount: data?.length || 0, error })
      
      if (error) throw error
      
      // Mapear datos para compatibilidad (los JOINs retornan arrays, tomar el primero)
      const mappedData = (data || []).map((apt: any) => ({
        ...apt,
        business: apt.businesses?.[0],
        location: apt.locations?.[0],
        employee: apt.profiles?.[0],
        service: apt.services?.[0] ? { ...apt.services[0], duration: apt.services[0].duration } : undefined
      }));
      
      // eslint-disable-next-line no-console
      console.log('✅ Data enriquecida:', mappedData)
      setAppointments(mappedData)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ Error final:', err)
    }
  }, [currentUser?.id])

  // Fetch on mount and when user changes
  React.useEffect(() => {
    fetchClientAppointments()
  }, [fetchClientAppointments])

  const sidebarItems = [
    {
      id: 'appointments',
      label: 'Mis Citas',
      icon: <Calendar className="h-5 w-5" />
    },
    {
      id: 'favorites',
      label: 'Favoritos',
      icon: <Heart className="h-5 w-5" />
    },
    {
      id: 'history',
      label: 'Historial',
      icon: <History className="h-5 w-5" />
    }
  ]

  // Filter upcoming appointments
  const upcomingAppointments = React.useMemo(() => {
    if (!appointments) return []
    const now = new Date()
    return appointments
      .filter(apt => {
        const aptDate = new Date(apt.start_time)
        return aptDate >= now && ['pending', 'confirmed', 'scheduled'].includes(apt.status)
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
  }, [appointments])

  // Get status label
  const getStatusLabel = (status: string): string => {
    if (status === 'confirmed') return 'Confirmada'
    if (status === 'scheduled') return 'Agendada'
    return 'Pendiente'
  }

  // Handler para crear cita desde el calendario
  const handleCreateAppointmentFromCalendar = (date: Date, time?: string) => {
    setPreselectedDate(date)
    setPreselectedTime(time)
    setShowAppointmentWizard(true)
  }

  // Handler para cerrar el wizard y limpiar las preselecciones
  const handleCloseWizard = () => {
    setShowAppointmentWizard(false)
    setPreselectedDate(undefined)
    setPreselectedTime(undefined)
    setAppointmentWizardBusinessId(undefined) // Limpiar businessId preseleccionado
    setBookingPreselection(undefined) // Limpiar preselecciones de servicio/ubicación/empleado
    setAppointmentToEdit(null) // Limpiar cita en edición
  }

  const renderContent = () => {
    switch (activePage) {
      case 'appointments':
        return (
          <div className="p-6">
            {/* Header - Mantener en toda la parte superior */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-foreground">Mis Citas</h2>
              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "h-8",
                      viewMode !== 'list' && "hover:bg-primary hover:text-primary-foreground"
                    )}
                  >
                    <List className="h-4 w-4 mr-2" />
                    Lista
                  </Button>
                  <Button
                    variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('calendar')}
                    className={cn(
                      "h-8",
                      viewMode !== 'calendar' && "hover:bg-primary hover:text-primary-foreground"
                    )}
                  >
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Calendario
                  </Button>
                </div>
                <Button 
                  onClick={() => setShowAppointmentWizard(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Nueva Cita
                </Button>
              </div>
            </div>

            {/* Layout de 2 columnas: Citas (izquierda) + Sugerencias (derecha) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Columna izquierda: Citas (2/3 del ancho) */}
              <div className="lg:col-span-2">
                {/* Calendar View */}
                {viewMode === 'calendar' ? (
                  <ClientCalendarView
                    appointments={appointments}
                    onAppointmentClick={setSelectedAppointment}
                    onCreateAppointment={handleCreateAppointmentFromCalendar}
                  />
                ) : (
                  /* List View */
                  <>
                    {upcomingAppointments.length === 0 ? (
                      <Card className="border-dashed">
                        <CardContent className="pt-6 text-center">
                          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground">No tienes citas programadas</p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Usa el botón "Nueva Cita" para agendar tu primera cita
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {upcomingAppointments.map((appointment) => (
                          <Card 
                            key={appointment.id} 
                            className="cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => setSelectedAppointment(appointment)}
                          >
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                {/* Top Row: Business/Sede + Status Badge */}
                                <div className="flex items-start justify-between gap-2 pb-2 border-b border-border">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground">
                                      {appointment.business?.name}
                                      {appointment.business?.name && appointment.location?.name && ' • '}
                                      <span className="font-normal text-muted-foreground">
                                        {appointment.location?.name}
                                      </span>
                                    </p>
                                  </div>
                                  <Badge 
                                    variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}
                                    className="flex-shrink-0 whitespace-nowrap"
                                  >
                                    {getStatusLabel(appointment.status)}
                                  </Badge>
                                </div>

                                {/* Service Name */}
                                <h3 className="font-semibold text-foreground text-base line-clamp-2">
                                  {appointment.service?.name || appointment.title}
                                </h3>

                                {/* Professional Info: Avatar + Name */}
                                {appointment.employee?.full_name && (
                                  <div className="flex items-center gap-3 bg-card/50 p-2 rounded-lg border border-border/50">
                                    {appointment.employee?.avatar_url ? (
                                      <img 
                                        src={appointment.employee.avatar_url} 
                                        alt={appointment.employee.full_name}
                                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                        <UserIcon className="h-4 w-4 text-primary" />
                                      </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-foreground line-clamp-1">
                                        {appointment.employee.full_name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">Profesional</p>
                                    </div>
                                  </div>
                                )}

                                {/* Date and Time */}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                                  <Clock className="h-4 w-4 flex-shrink-0" />
                                  <span className="line-clamp-1">
                                    {new Date(appointment.start_time).toLocaleDateString('es', {
                                      day: 'numeric',
                                      month: 'short'
                                    })}
                                    {' • '}
                                    {new Date(appointment.start_time).toLocaleTimeString('es', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>

                                {/* Price */}
                                {(appointment.service?.price || appointment.price) && (
                                  <div className="pt-2 border-t border-border">
                                    <span className="text-lg font-bold text-primary">
                                      ${(appointment.service?.price ?? appointment.price ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} COP
                                    </span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Columna derecha: Sugerencias de negocios (1/3 del ancho) */}
              <div className="lg:col-span-1">
                <BusinessSuggestions
                  userId={currentUser.id}
                  preferredCityName={preferredCityName}
                  preferredRegionName={preferredRegionName}
                  onBusinessSelect={(businessId) => {
                    setSelectedBusinessId(businessId)
                  }}
                />
              </div>
            </div>
          </div>
        )
      case 'profile':
      case 'settings':
        return (
          <div className="p-6">
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
        return <FavoritesList />
      case 'history':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-foreground mb-6">Historial de Citas</h2>
            {currentUser && <ClientHistory userId={currentUser.id} />}
          </div>
        )
      default:
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-foreground">Mis Citas</h2>
            <p className="text-muted-foreground">Tus próximas citas aparecerán aquí</p>
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
        onPageChange={setActivePage}
        user={currentUser ? {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          avatar: currentUser.avatar_url
        } : undefined}
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
          businessId={appointmentWizardBusinessId} // Pasar businessId preseleccionado
          preselectedServiceId={bookingPreselection?.serviceId}
          preselectedLocationId={bookingPreselection?.locationId}
          preselectedEmployeeId={bookingPreselection?.employeeId}
          userId={currentUser.id}
          preselectedDate={preselectedDate}
          preselectedTime={preselectedTime}
          appointmentToEdit={appointmentToEdit} // Pasar cita a editar
          onSuccess={() => {
            handleCloseWizard()
            fetchClientAppointments() // Recargar citas después de crear una nueva
          }}
        />
      )}

      {/* Search Results Modal */}
      {searchModalOpen && searchParams && (
        <SearchResults
          searchTerm={searchParams.term}
          searchType={searchParams.type}
          userLocation={geolocation.hasLocation ? {
            latitude: geolocation.latitude!,
            longitude: geolocation.longitude!
          } : undefined}
          onResultClick={handleSearchResultItemClick}
          onClose={() => setSearchModalOpen(false)}
        />
      )}

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Detalles de la Cita</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 pt-4">
              {/* Status Badge and Business Name */}
              <div className="flex items-center justify-between">
                <Badge 
                  variant={selectedAppointment.status === 'confirmed' ? 'default' : 'secondary'}
                  className="text-base px-4 py-1"
                >
                  {getStatusLabel(selectedAppointment.status)}
                </Badge>
                {selectedAppointment.business?.name && (
                  <span className="text-sm font-medium text-primary">
                    {selectedAppointment.business.name}
                  </span>
                )}
              </div>

              {/* Service Name */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Servicio</h3>
                <p className="text-lg font-semibold text-foreground">
                  {selectedAppointment.service?.name || selectedAppointment.title}
                </p>
                {selectedAppointment.service?.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedAppointment.service.description}
                  </p>
                )}
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fecha
                  </h3>
                  <p className="text-base text-foreground">
                    {new Date(selectedAppointment.start_time).toLocaleDateString('es', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Hora
                  </h3>
                  <p className="text-base text-foreground">
                    {new Date(selectedAppointment.start_time).toLocaleTimeString('es', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                    {' - '}
                    {new Date(selectedAppointment.end_time).toLocaleTimeString('es', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                  {selectedAppointment.service?.duration && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Duración: {selectedAppointment.service.duration} min
                    </p>
                  )}
                </div>
              </div>

              {/* Professional/Employee */}
              {selectedAppointment.employee?.full_name && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
                    Profesional que te atenderá
                  </h3>
                  <div className="flex items-center gap-3 mt-2 p-3 bg-muted/30 rounded-lg">
                    {selectedAppointment.employee.avatar_url ? (
                      <img 
                        src={selectedAppointment.employee.avatar_url} 
                        alt={selectedAppointment.employee.full_name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-base font-semibold text-foreground mb-1">
                        {selectedAppointment.employee.full_name}
                      </p>
                      <div className="space-y-0.5">
                        {selectedAppointment.employee.email && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {selectedAppointment.employee.email}
                          </p>
                        )}
                        {selectedAppointment.employee.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {selectedAppointment.employee.phone}
                          </p>
                        )}
                      </div>
                      {!selectedAppointment.employee.avatar_url && (
                        <p className="text-xs text-muted-foreground italic mt-1">
                          Sin foto de perfil
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Location/Sede with full details */}
              {selectedAppointment.location && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Sede y Ubicación
                  </h3>
                  <div className="mt-2 space-y-2 p-3 bg-muted/30 rounded-lg">
                    <p className="text-base font-semibold text-foreground">
                      {selectedAppointment.location.name}
                    </p>
                    {selectedAppointment.location.address && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedAppointment.location.address}
                        {selectedAppointment.location.city && `, ${selectedAppointment.location.city}`}
                        {selectedAppointment.location.state && `, ${selectedAppointment.location.state}`}
                        {selectedAppointment.location.postal_code && ` ${selectedAppointment.location.postal_code}`}
                        {selectedAppointment.location.country && `, ${selectedAppointment.location.country}`}
                      </p>
                    )}
                    {(() => {
                      // Generate Google Maps URL: use saved URL or fallback to coordinates
                      const googleMapsUrl = selectedAppointment.location.google_maps_url || 
                        (selectedAppointment.location.latitude && selectedAppointment.location.longitude ? 
                          `https://www.google.com/maps?q=${selectedAppointment.location.latitude},${selectedAppointment.location.longitude}` : 
                          null);
                      
                      return googleMapsUrl ? (
                        <a 
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
                        >
                          <MapPin className="h-4 w-4" />
                          Ver en Google Maps
                        </a>
                      ) : null;
                    })()}
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedAppointment.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Descripción
                  </h3>
                  <p className="text-base text-foreground whitespace-pre-wrap">
                    {selectedAppointment.description}
                  </p>
                </div>
              )}

              {/* Notes */}
              {selectedAppointment.notes && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notas
                  </h3>
                  <p className="text-base text-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                    {selectedAppointment.notes}
                  </p>
                </div>
              )}

              {/* Price/Value of Service */}
              {(selectedAppointment.service?.price || selectedAppointment.price) && (
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-muted-foreground">Valor del Servicio</h3>
                      {selectedAppointment.service?.duration && (
                        <p className="text-xs text-muted-foreground">
                          Duración estimada: {selectedAppointment.service.duration} minutos
                        </p>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      ${(selectedAppointment.service?.price ?? selectedAppointment.price ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} COP
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4">
                {/* Chat button - only show if there's a professional */}
                {selectedAppointment.employee?.id && (
                  <Button
                    variant="default"
                    onClick={() => handleStartChatWithProfessional(
                      selectedAppointment.employee!.id,
                      selectedAppointment.business_id
                    )}
                    disabled={isStartingChat}
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {isStartingChat ? 'Iniciando chat...' : 'Chatear con el profesional'}
                  </Button>
                )}
                
                {/* Reschedule button - only if not completed, cancelled or no_show */}
                {!['completed', 'cancelled', 'no_show'].includes(selectedAppointment.status) && (
                  <Button
                    variant="outline"
                    onClick={() => handleRescheduleAppointment(selectedAppointment)}
                    className="flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Reprogramar
                  </Button>
                )}
                
                {/* Cancel button - only if not completed, cancelled or no_show */}
                {!['completed', 'cancelled', 'no_show'].includes(selectedAppointment.status) && (
                  <Button
                    variant="destructive"
                    onClick={() => handleCancelAppointment(selectedAppointment.id)}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancelar Cita
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedAppointment(null)}
                  className="ml-auto"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Business Profile Modal */}
      {selectedBusinessId && (
        <BusinessProfile
          businessId={selectedBusinessId}
          onClose={() => setSelectedBusinessId(null)}
          onBookAppointment={handleBookAppointment}
          onChatStarted={(conversationId) => {
            // Cambiar a la página de chat y establecer la conversación activa
            setActivePage('chat');
            setChatConversationId(conversationId);
            setSelectedBusinessId(null); // Cerrar el modal de perfil
          }}
          userLocation={
            geolocation.hasLocation
              ? {
                  latitude: geolocation.latitude!,
                  longitude: geolocation.longitude!
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
          onBookAppointment={(serviceId, businessId) => {
            setSelectedUserId(null);
            // TODO: Open AppointmentWizard with preselected service and business
            setShowAppointmentWizard(true);
            // eslint-disable-next-line no-console
            console.log('Book with professional:', { serviceId, businessId });
          }}
          userLocation={
            geolocation.hasLocation
              ? {
                  latitude: geolocation.latitude!,
                  longitude: geolocation.longitude!
                }
              : undefined
          }
        />
      )}

      {/* Mandatory Review Modal */}
      <MandatoryReviewModal
        isOpen={shouldShowReviewModal}
        onClose={() => {
          remindLater();
          toast.info(`Te recordaremos en 5 minutos. Tienes ${pendingReviewsCount} reseña${pendingReviewsCount > 1 ? 's' : ''} pendiente${pendingReviewsCount > 1 ? 's' : ''}.`);
        }}
        onReviewSubmitted={() => {
          checkPendingReviews();
          fetchClientAppointments();
          toast.success('¡Gracias por tu reseña!');
        }}
        userId={user.id}
      />
    </>
  )
}
