import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Calendar, User as UserIcon, Plus, Clock, MapPin, Phone, Mail, FileText, List, CalendarDays, History, MessageCircle, X, Heart } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UnifiedLayout } from '@/components/layouts/UnifiedLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PermissionGate } from '@/components/ui/PermissionGate'
import { AppointmentWizard } from '@/components/appointments/AppointmentWizard'
import CompleteUnifiedSettings from '@/components/settings/CompleteUnifiedSettings'
import { ClientCalendarView } from '@/components/client/ClientCalendarView'
import logoTiTuring from '@/assets/images/tt/1.png'
import { ClientHistory } from '@/components/client/ClientHistory'
import { SearchResults } from '@/components/client/SearchResults'
import BusinessProfile from '@/components/business/BusinessProfile'
import ProfessionalProfile from '@/components/user/UserProfile'
import { BusinessSuggestions } from '@/components/client/BusinessSuggestions'
import FavoritesList from '@/components/client/FavoritesList'
import { MandatoryReviewModal } from '@/components/jobs'
import { LocationAddress } from '@/components/ui/LocationAddress'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useChat } from '@/hooks/useChat'
import { useMandatoryReviews } from '@/hooks/useMandatoryReviews'
import { usePendingNavigation } from '@/hooks/usePendingNavigation'
import { usePreferredCity } from '@/hooks/usePreferredCity'
import { useClientDashboard } from '@/hooks/useClientDashboard'
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
  client_id: string
  employee_id?: string
  start_time: string
  end_time: string
  status: 'pending' | 'pending_confirmation' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
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
    image_url?: string
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
  const navigate = useNavigate()
  const location = useLocation()
  
  // Función para extraer página de la URL
  const getPageFromUrl = () => {
    const path = location.pathname
    const match = path.match(/\/app\/client\/([^/]+)/)
    return match ? match[1] : 'appointments'
  }
  
  const [activePage, setActivePage] = useState(getPageFromUrl())
  const [showAppointmentWizard, setShowAppointmentWizard] = useState(false)
  const [appointmentWizardBusinessId, setAppointmentWizardBusinessId] = useState<string | undefined>(undefined)
  const [appointmentToEdit, setAppointmentToEdit] = useState<AppointmentWithRelations | null>(null)
  const [bookingPreselection, setBookingPreselection] = useState<{
    serviceId?: string
    locationId?: string
    employeeId?: string
  } | undefined>(undefined)
  // ✅ NEW: Hook consolidado que reemplaza fetchClientAppointments + useMandatoryReviews
  const { 
    data: dashboardData, 
    isLoading: isDashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard
  } = useClientDashboard(user.id)

  // ✅ Memoizar appointments para evitar infinite loops con useEffect
  // (dashboardData?.appointments puede retornar un nuevo array en cada render)
  const appointments = React.useMemo(
    () => dashboardData?.appointments || [],
    [dashboardData?.appointments]
  )
  const reviewedAppointmentIds = dashboardData?.reviewedAppointmentIds || []
  const pendingReviewsCountFromData = dashboardData?.pendingReviewsCount || 0
  const completedAppointments = appointments.filter(apt => apt.status === 'completed')
  const suggestions = dashboardData?.suggestions || [] // ✅ Sugerencias consolidadas

  const [serviceImages, setServiceImages] = useState<Record<string, string>>({})
  const [locationBanners, setLocationBanners] = useState<Record<string, string>>({})
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
  
  // ✅ FIX: Chat hook debe recibir SIEMPRE user.id (no condicional)
  // El lazy loading de queries se maneja internamente en useChat
  const { createOrGetConversation } = useChat(user.id)
  
  // Sincronizar activePage con URL
  useEffect(() => {
    const pageFromUrl = getPageFromUrl()
    if (pageFromUrl !== activePage) {
      setActivePage(pageFromUrl)
    }
  }, [location.pathname])
  
  // Redirigir de /app a /app/client/appointments
  useEffect(() => {
    if (location.pathname === '/app' || location.pathname === '/app/') {
      navigate('/app/client/appointments', { replace: true })
    }
  }, [location.pathname, navigate])

  // Función para manejar cambios de página con contexto
  const handlePageChange = (page: string, context?: Record<string, unknown>) => {
    setActivePage(page)
    navigate(`/app/client/${page}`, { replace: true })
    // Context available for future use if needed
  }

  // Hook para procesar navegaciones pendientes después de cambio de rol
  usePendingNavigation(handlePageChange)

  // ✅ REFACTORED: Mandatory reviews hook ahora recibe datos del hook consolidado
  const { 
    shouldShowModal: shouldShowReviewModal,
    pendingReviewsCount,
    checkPendingReviews,
    remindLater,
    dismissModal: dismissReviewModal
  } = useMandatoryReviews(
    user.id,
    completedAppointments,
    reviewedAppointmentIds
  )

  // Geolocation for proximity-based search
  const geolocation = useGeolocation({
    requestOnMount: true,
    showPermissionPrompt: true
  })

  // Hook para preferencias de ciudad (para sugerencias)
  const {
    preferredCityName
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
  }, [selectedBusinessId])
  
  // Handle chat with professional from appointment details
  const handleStartChatWithProfessional = useCallback(async (professionalId: string, businessId?: string) => {
    if (!user?.id || !professionalId) {
      toast.error('No se puede iniciar el chat en este momento')
      return
    }
    
    setIsStartingChat(true)
    
    try {
      // Crear o obtener conversación con el profesional
      const conversationId = await createOrGetConversation({
        other_user_id: professionalId,
        business_id: businessId,
        initial_message: '¡Hola! Tengo algunas preguntas sobre mi cita.'
      })
      
      if (conversationId) {
        // Cerrar modal de detalles
        setSelectedAppointment(null)
        
        // Establecer la conversación activa para abrir el chat
        setChatConversationId(conversationId)
        
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
      
      // ✅ Refetch dashboard data (useClientDashboard automáticamente invalidará cache)
      refetchDashboard()
    } catch (error) {
      console.error('Error al cancelar cita:', error)
      toast.error('No se pudo cancelar la cita. Intenta de nuevo.')
    }
  }, [user?.id, refetchDashboard])

  // Handle reschedule appointment
  // 🔄 TEMP: Force cache invalidation (eliminar después de testing)
  const handleForceRefresh = () => {
    void refetchDashboard()
    toast.success('🔄 Caché invalidado - refrescando datos...')
  }

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
      const updatedUserStr = globalThis.localStorage.getItem('current-user')
      if (updatedUserStr) {
        try {
          const updatedUser = JSON.parse(updatedUserStr)
          setCurrentUser(updatedUser)
        } catch {
          // Ignore parse errors
        }
      }
    }

    globalThis.addEventListener('avatar-updated', handleAvatarUpdate)
    return () => globalThis.removeEventListener('avatar-updated', handleAvatarUpdate)
  }, [])

  // Update current user when prop changes
  useEffect(() => {
    setCurrentUser(user)
  }, [user])

  // Cargar imágenes de servicios y banners de sedes (OPTIMIZADO - sin cacheBust, queries consolidadas)
  useEffect(() => {
    const loadImages = async () => {
      if (!appointments || appointments.length === 0) return

      try {
        const uniqueServiceIds = Array.from(new Set(appointments.map(a => a.service?.id).filter(Boolean))) as string[]
        const uniqueLocationIds = Array.from(new Set(appointments.map(a => a.location?.id).filter(Boolean))) as string[]

        // Cargar imágenes de servicios desde service.image_url
        if (uniqueServiceIds.length > 0) {
          const map: Record<string, string> = {}
          for (const apt of appointments) {
            const sid = apt.service?.id
            const surl = apt.service?.image_url?.trim()
            if (sid && surl && !map[sid]) {
              map[sid] = surl // SIN cacheBust - permite caché del navegador/CDN
            }
          }
          setServiceImages(map)
        } else {
          setServiceImages({})
        }

        // Cargar banners de ubicaciones (query CONSOLIDADA)
        if (uniqueLocationIds.length > 0) {
          const banners: Record<string, string> = {}
          try {
            const { data: locMedia, error: locErr } = await supabase
              .from('location_media')
              .select('location_id, url')
              .in('location_id', uniqueLocationIds)
              .eq('is_banner', true)
              .eq('type', 'image')
              .order('created_at', { ascending: false })

            if (!locErr && locMedia) {
              // Tomar primer banner de cada ubicación
              const seen = new Set<string>()
              for (const m of locMedia) {
                if (!seen.has(m.location_id) && m.url) {
                  banners[m.location_id] = m.url.trim()
                  seen.add(m.location_id)
                }
              }
            }
          } catch {
            // Silenciar errores de RLS
          }
          setLocationBanners(banners)
        } else {
          setLocationBanners({})
        }
      } catch {
        // Silenciar errores
      }
    }
    loadImages()
  }, [appointments])

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
    const filtered = appointments
      .filter(apt => {
        const aptDate = new Date(apt.start_time)
        return aptDate >= now && ['pending', 'confirmed', 'scheduled'].includes(apt.status)
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    
    return filtered
  }, [appointments])

  // Get status label
  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      pending_confirmation: 'Por Confirmar',
      scheduled: 'Agendada',
      confirmed: 'Confirmada',
      in_progress: 'En Proceso',
      completed: 'Completada',
      cancelled: 'Cancelada',
      no_show: 'No Asistió'
    }
    return labels[status] || status
  }

  // Get status badge variant
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'confirmed':
        return 'default' // Verde
      case 'pending_confirmation':
        return 'outline' // Amarillo/naranja
      case 'completed':
        return 'secondary' // Gris
      case 'cancelled':
      case 'no_show':
        return 'destructive' // Rojo
      case 'in_progress':
        return 'default' // Verde
      default:
        return 'secondary' // Gris por defecto
    }
  }

  // Formato de hora 12h con AM/PM
  const formatTime12h = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    } catch {
      return ''
    }
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
            {/* Header principal: título y botón en la misma fila (sticky en móvil) */}
            <div id="dashboard-sticky-header" className="sticky top-0 z-20 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60 py-3 flex items-center justify-between gap-4 w-full min-w-0">
              <h2 className="text-2xl font-bold text-foreground">Mis Citas</h2>
              <Button 
                onClick={() => setShowAppointmentWizard(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nueva Cita
              </Button>
            </div>

            {/* 🔄 TEMP: Botón para invalidar caché (ELIMINAR después de testing) */}
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">🧪 Modo Testing</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">Si el modal no muestra datos completos (empleado, negocio, precio), presiona aquí</p>
                </div>
                <Button
                  onClick={handleForceRefresh}
                  size="sm"
                  className="bg-yellow-600 hover:bg-yellow-700 text-white shrink-0"
                >
                  🔄 Refrescar Datos
                </Button>
              </div>
            </div>

            {/* Controles de vista: debajo del header, mejor para móviles */}
            <div className="flex items-center gap-2 mb-6 w-full">
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
            </div>

            {/* Layout de 2 columnas: Citas (izquierda) + Sugerencias (derecha) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full min-w-0">
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
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {upcomingAppointments.map((appointment) => (
                          <Card
                            key={appointment.id}
                            className="relative overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => setSelectedAppointment(appointment)}
                          >
                            {/* Background image: service image priority, fallback to location banner */}
                            {(() => {
                              const svcImg = appointment.service?.id ? serviceImages[appointment.service.id] : undefined
                              const locImg = appointment.location?.id ? locationBanners[appointment.location.id] : undefined
                              const bgImage = svcImg || locImg
                              
                              return bgImage ? (
                                <>
                                  <div
                                    aria-hidden
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{ backgroundImage: `url(${bgImage})` }}
                                  />
                                  <div
                                    className="absolute inset-0 bg-linear-to-b from-black/50 via-black/40 to-black/60"
                                    aria-hidden
                                  />
                                </>
                              ) : null
                            })()}

                            <CardContent className="relative z-10 p-4">
                              <div className="space-y-3">
                                {/* Fila superior: solo badge de estado */}
                                <div className="flex items-start justify-between gap-2 pb-2 border-b border-border/60">
                                  <div />
                                  <Badge
                                    variant={getStatusVariant(appointment.status)}
                                    className="shrink-0 whitespace-nowrap"
                                  >
                                    {getStatusLabel(appointment.status)}
                                  </Badge>
                                </div>

                                {/* Títulos: Servicio (principal), Negocio (secundario), Sede (terciario) */}
                                {(() => {
                                  const svcImg = appointment.service?.id ? serviceImages[appointment.service.id] : undefined
                                  const locImg = appointment.location?.id ? locationBanners[appointment.location.id] : undefined
                                  const hasBg = !!(svcImg || locImg)
                                  return (
                                    <div className="space-y-1">
                                      <h3 className={`font-semibold text-lg line-clamp-2 ${hasBg ? 'text-white' : 'text-foreground'}`}>
                                        {appointment.service?.name || 'Cita'}
                                      </h3>
                                      {appointment.business?.name && (
                                        <p className={`text-sm font-medium ${hasBg ? 'text-white/90' : 'text-muted-foreground'}`}>{appointment.business.name}</p>
                                      )}
                                      {appointment.location?.name && (
                                        <p className={`text-xs ${hasBg ? 'text-white/80' : 'text-muted-foreground'}`}>{appointment.location.name}</p>
                                      )}
                                    </div>
                                  )
                                })()}

                                {/* Profesional: avatar + nombre */}
                                {appointment.employee?.full_name && (
                                  (() => {
                                    const svcImg = appointment.service?.id ? serviceImages[appointment.service.id] : undefined
                                    const locImg = appointment.location?.id ? locationBanners[appointment.location.id] : undefined
                                    const hasBg = !!(svcImg || locImg)
                                    return (
                                      <div className={`flex items-center gap-3 p-2 rounded-lg border ${hasBg ? 'bg-black/30 backdrop-blur-sm border-white/10' : 'bg-card/50 border-border/50'}`}>
                                      <Avatar className="h-8 w-8 shrink-0">
                                        <AvatarImage
                                          src={appointment.employee?.avatar_url || undefined}
                                          alt={appointment.employee?.full_name || 'Profesional'}
                                        />
                                        <AvatarFallback className="text-xs">
                                          {(appointment.employee?.full_name || 'U')
                                            .split(' ')
                                            .map(n => n[0])
                                            .join('')
                                            .toUpperCase()
                                            .slice(0, 2)}
                                        </AvatarFallback>
                                      </Avatar>
                                        <div className="min-w-0 flex-1">
                                          <p className={`text-sm font-medium line-clamp-1 ${hasBg ? 'text-white' : 'text-foreground'}`}>
                                            {appointment.employee.full_name}
                                          </p>
                                          <p className={`text-xs ${hasBg ? 'text-white/80' : 'text-muted-foreground'}`}>Profesional</p>
                                        </div>
                                      </div>
                                    )
                                  })()
                                )}

                                {/* Fecha y Hora (12h) */}
                                {(() => {
                                  const svcImg = appointment.service?.id ? serviceImages[appointment.service.id] : undefined
                                  const locImg = appointment.location?.id ? locationBanners[appointment.location.id] : undefined
                                  const hasBg = !!(svcImg || locImg)
                                  return (
                                    <div className={`flex items-center gap-2 text-sm pt-1 ${hasBg ? 'text-white/90' : 'text-foreground/90'}`}>
                                      <Clock className="h-4 w-4 shrink-0" />
                                      <span className="line-clamp-1">
                                        {new Date(appointment.start_time).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                                        {' • '}
                                        {formatTime12h(appointment.start_time)}
                                      </span>
                                    </div>
                                  )
                                })()}

                                {/* Dirección y precio */}
                                {(() => {
                                  const svcImg = appointment.service?.id ? serviceImages[appointment.service.id] : undefined
                                  const locImg = appointment.location?.id ? locationBanners[appointment.location.id] : undefined
                                  const hasBg = !!(svcImg || locImg)
                                  return (
                                    <div className="flex items-center justify-between gap-3 pt-1">
                                      <div className={`flex items-center gap-2 text-sm min-w-0 ${hasBg ? 'text-white/90' : 'text-muted-foreground'}`}>
                                        <MapPin className="h-4 w-4 shrink-0" />
                                        <span className="truncate">
                                          {appointment.location?.address || appointment.location?.name || '—'}
                                        </span>
                                      </div>
                                      {(appointment.service?.price || appointment.price) && (
                                        <span className={`text-base font-bold ${hasBg ? 'text-white' : 'text-primary'}`}>
                                          ${(appointment.service?.price ?? appointment.price ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} COP
                                        </span>
                                      )}
                                    </div>
                                  )
                                })()}
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
                  suggestions={suggestions}
                  isLoading={isDashboardLoading}
                  preferredCityName={preferredCityName}
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
        return (
          <FavoritesList 
            favorites={dashboardData?.favorites || []}
            loading={isDashboardLoading}
          />
        )
      case 'history':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-foreground mb-6">Historial de Citas</h2>
            {currentUser && (
              <ClientHistory 
                userId={currentUser.id} 
                appointments={dashboardData?.appointments || []}
                loading={isDashboardLoading}
              />
            )}
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
        <div className="flex flex-col min-h-full">
          <div className="flex-1">
            {renderContent()}
          </div>
          
          {/* Ti Turing Footer */}
          <footer className="border-t border-border/50 py-3 px-6 mt-auto">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>Desarrollado por</span>
              <a 
                href="https://tituring.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              >
                <img 
                  src={logoTiTuring} 
                  alt="Ti Turing" 
                  className="h-4 w-4 object-contain"
                />
                <span className="font-semibold text-primary">Ti Turing</span>
              </a>
              <span className="mx-2">·</span>
              <span className="text-muted-foreground/70">v1.0.0</span>
            </div>
          </footer>
        </div>
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
            refetchDashboard() // ✅ Recargar dashboard después de crear cita
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
                  variant={getStatusVariant(selectedAppointment.status)}
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
                  {selectedAppointment.service?.name || 'Cita'}
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
                    <Avatar className="h-12 w-12 border-2 border-primary/20">
                      <AvatarImage
                        src={selectedAppointment.employee.avatar_url || undefined}
                        alt={selectedAppointment.employee.full_name || 'Profesional'}
                      />
                      <AvatarFallback>
                        {(selectedAppointment.employee.full_name || 'U')
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
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
        <p className="text-sm text-muted-foreground leading-relaxed">
          <LocationAddress
            address={selectedAppointment.location.address || undefined}
            cityId={selectedAppointment.location.city || undefined}
            stateId={selectedAppointment.location.state || undefined}
            postalCode={selectedAppointment.location.postal_code || undefined}
          />
        </p>
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
                  <PermissionGate permission="appointments.reschedule_own" businessId={selectedAppointment.business_id} mode="hide">
                    <Button
                      variant="outline"
                      onClick={() => handleRescheduleAppointment(selectedAppointment)}
                      className="flex items-center gap-2"
                    >
                      <Calendar className="h-4 w-4" />
                      Reprogramar
                    </Button>
                  </PermissionGate>
                )}
                
                {/* Cancel button - only if not completed, cancelled or no_show */}
                {/* IMPORTANT: Clients should ALWAYS be able to cancel their own appointments */}
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
          refetchDashboard(); // ✅ Recargar dashboard después de acción
          toast.success('¡Gracias por tu reseña!');
        }}
        userId={user.id}
      />
    </>
  )
}
