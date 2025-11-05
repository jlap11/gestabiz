import React, { useState, useEffect, useCallback } from 'react'
import { Calendar, User as UserIcon, Plus, Clock, MapPin, Phone, Mail, FileText, List, CalendarDays, History, MessageCircle, X, Heart } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { LocationAddress } from '@/components/ui/LocationAddress'
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
  client_id: string
  employee_id?: string
  start_time: string
  end_time: string
  status: 'pending' | 'pending_confirmation' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
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
  const [serviceImages, setServiceImages] = useState<Record<string, string>>({})
  const [locationBanners, setLocationBanners] = useState<Record<string, string>>({})
  // Eliminamos rotación de fondos; solo usamos imagen real del servicio
  const [showServiceImage, setShowServiceImage] = useState(true)
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
    preferredCityId,
    preferredCityName,
    preferredRegionId,
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

  // Alternar imagen de fondo (servicio <-> sede) cada 15s con transición suave
  useEffect(() => {
    const interval = setInterval(() => {
      setShowServiceImage((prev) => !prev)
    }, 15000)
    return () => clearInterval(interval)
  }, [])
  
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
          businesses!appointments_business_id_fkey (
            id,
            name,
            description
          ),
          locations!appointments_location_id_fkey (
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
          employee:profiles!appointments_employee_id_fkey (
            id,
            full_name,
            email,
            phone,
            avatar_url
          ),
          client:profiles!appointments_client_id_fkey (
            id,
            full_name,
            email,
            phone,
            avatar_url
          ),
          services!appointments_service_id_fkey (
            id,
            name,
            description,
            duration_minutes,
            price,
            currency,
            image_url
          )
        `)
        .eq('client_id', currentUser.id)
        .order('start_time', { ascending: true })
      
      // eslint-disable-next-line no-console
      console.log('📊 Query result:', { appointmentsCount: data?.length || 0, error })
      
      if (error) throw error
      
      // eslint-disable-next-line no-console
      console.log('🔍 Raw appointments data:', data)
      
      // Mapear datos para compatibilidad (los JOINs pueden venir como objeto o array)
      const mappedData = (data || []).map((apt: any) => {
        const business = Array.isArray(apt.businesses) ? apt.businesses[0] : apt.businesses
        const location = Array.isArray(apt.locations) ? apt.locations[0] : apt.locations
        // Usar alias explícito para evitar confusión entre múltiples relaciones a profiles
        const employeeRel = Array.isArray(apt.employee) ? apt.employee[0] : apt.employee
        const clientRel = Array.isArray(apt.client) ? apt.client[0] : apt.client
        const svcRaw = Array.isArray(apt.services) ? apt.services[0] : apt.services
        const service = svcRaw ? { ...svcRaw, duration: svcRaw.duration_minutes } : undefined

        const mapped = {
          ...apt,
          business,
          location,
          employee: employeeRel,
          // Incluimos client (aunque no se muestra) por si se requiere en otros componentes
          client: clientRel,
          service,
        }

        // eslint-disable-next-line no-console
        console.log('🔍 Mapped appointment:', {
          id: mapped.id,
          service: mapped.service,
          business: mapped.business,
          location: mapped.location,
          employee: mapped.employee,
          price: mapped.price || mapped.service?.price,
        })

        return mapped
      })
      
      // eslint-disable-next-line no-console
      console.log('✅ Final mapped data:', mappedData)
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

  // Sin rotación de fondo: solo imagen real de servicio

  // Al cargar citas, traer imágenes de servicios y banners de sedes
  useEffect(() => {
    const loadImages = async () => {
      try {
        // Pequeña utilidad para evitar caché del navegador/CDN cuando la URL no cambia
        const cacheBust = (url: string) => {
          try {
            const u = new URL(url)
            // usamos segundos para que sea estable durante una sesión corta
            u.searchParams.set('v', String(Math.floor(Date.now() / 1000)))
            return u.toString()
          } catch {
            return `${url}${url.includes('?') ? '&' : '?'}v=${Date.now()}`
          }
        }

        const uniqueServiceIds = Array.from(new Set((appointments || []).map(a => a.service?.id).filter(Boolean))) as string[]
        const uniqueLocationIds = Array.from(new Set((appointments || []).map(a => a.location?.id).filter(Boolean))) as string[]

        if (uniqueServiceIds.length > 0) {
          const map: Record<string, string> = {}

          // 1) Preferir la URL oficial guardada en servicios (image_url)
          for (const apt of appointments || []) {
            const sid = apt.service?.id
            const surl = apt.service?.image_url?.trim().replace(/^[`'\"]+|[`'\"]+$/g, '')
            if (sid && surl && !map[sid]) {
              map[sid] = cacheBust(surl)
            }
          }
          // 2) Sin fallback a Storage: evitamos imágenes genéricas/desactualizadas

          // eslint-disable-next-line no-console
          console.log('🖼️ serviceImages map:', map)
          setServiceImages(map)
        } else {
          setServiceImages({})
        }

        if (uniqueLocationIds.length > 0) {
          const banners: Record<string, string> = {}
          try {
            const { data: locMedia, error: locErr } = await supabase
              .from('location_media')
              .select('location_id, type, url, is_banner, created_at')
              .in('location_id', uniqueLocationIds)
              .order('created_at', { ascending: false })

            if (!locErr && Array.isArray(locMedia)) {
              const byLoc = new Map<string, any[]>()
              locMedia.forEach((m: any) => {
                const cleanUrl = (m.url || '').trim().replace(/^[`'\"]+|[`'\"]+$/g, '')
                if (m.is_banner && m.type === 'image') {
                  const arr = byLoc.get(m.location_id) || []
                  arr.push({ ...m, url: cleanUrl })
                  byLoc.set(m.location_id, arr)
                }
              })
              byLoc.forEach((arr, locId) => {
                const chosen = arr[0]
                if (chosen) banners[locId] = cacheBust(chosen.url)
              })
            }
          } catch {
            // Ignorar errores de RLS en tabla location_media
          }

          // Fallback: si no hay banner en tabla o RLS lo bloquea, intentar recuperar última imagen de Storage
          const missingLocIds = uniqueLocationIds.filter((id) => !banners[id])
          for (const locId of missingLocIds) {
            try {
              const { data: files, error: listErr } = await supabase.storage
                .from('location-images')
                .list(locId)
              if (!listErr && Array.isArray(files) && files.length > 0) {
                // Elegir por timestamp en el nombre (subida usa timestamp.ext)
                const pick = files.reduce((best: any | null, f: any) => {
                  const nBest = best ? parseInt(String(best.name).split('.')[0], 10) : -1
                  const nCur = parseInt(String(f.name).split('.')[0], 10)
                  if (!isNaN(nCur) && nCur > nBest) return f
                  return best || f
                }, null)
                const chosenName = (pick?.name) || files[files.length - 1].name
                const { data: pub } = supabase.storage
                  .from('location-images')
                  .getPublicUrl(`${locId}/${chosenName}`)
                if (pub?.publicUrl) banners[locId] = cacheBust(pub.publicUrl)
              }
            } catch {
              // Si Storage list falla, seguimos sin banner
            }
          }

          // eslint-disable-next-line no-console
          console.log('🏙️ locationBanners map (with storage fallback):', banners)
          setLocationBanners(banners)
        } else {
          setLocationBanners({})
        }
      } catch {
        // Silencio: si hay RLS que bloquea, simplemente no habrá fondos
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
    
    // Debug: Log appointments data
    console.log('🔍 Debug - All appointments:', appointments)
    console.log('🔍 Debug - Filtered upcoming appointments:', filtered)
    console.log('🔍 Debug - Service images:', serviceImages)
    console.log('🔍 Debug - Location banners:', locationBanners)
    
    return filtered
  }, [appointments, serviceImages, locationBanners])

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
      no_show: 'No Asistió',
      rescheduled: 'Reagendada'
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
            <div id="dashboard-sticky-header" className="sticky top-0 z-20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-3 flex items-center justify-between gap-4 w-full min-w-0">
              <h2 className="text-2xl font-bold text-foreground">Mis Citas</h2>
              <Button 
                onClick={() => setShowAppointmentWizard(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nueva Cita
              </Button>
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
                            {/* Fondo: alterna entre imagen del servicio y banner de la sede */}
                            {(() => {
                              const svcImg = appointment.service?.id ? serviceImages[appointment.service.id] : undefined
                              const locImg = appointment.location?.id ? locationBanners[appointment.location.id] : undefined
                              const showSvc = showServiceImage || !locImg
                              const showLoc = !showServiceImage || !svcImg
                              return (
                                <>
                                  {svcImg && (
                                    <div
                                      aria-hidden
                                      className={
                                        `absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${showSvc ? 'opacity-100' : 'opacity-0'}`
                                      }
                                      style={{ backgroundImage: `url(${svcImg})` }}
                                    />
                                  )}
                                  {locImg && (
                                    <div
                                      aria-hidden
                                      className={
                                        `absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${showLoc ? 'opacity-100' : 'opacity-0'}`
                                      }
                                      style={{ backgroundImage: `url(${locImg})` }}
                                    />
                                  )}
                                  {(svcImg || locImg) && (
                                    <div
                                      className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60"
                                      aria-hidden
                                    />
                                  )}
                                </>
                              )
                            })()}

                            <CardContent className="relative z-10 p-4">
                              <div className="space-y-3">
                                {/* Fila superior: solo badge de estado */}
                                <div className="flex items-start justify-between gap-2 pb-2 border-b border-border/60">
                                  <div />
                                  <Badge
                                    variant={getStatusVariant(appointment.status)}
                                    className="flex-shrink-0 whitespace-nowrap"
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
                                      <Avatar className="h-8 w-8 flex-shrink-0">
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
                                      <Clock className="h-4 w-4 flex-shrink-0" />
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
                                        <MapPin className="h-4 w-4 flex-shrink-0" />
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
                  userId={currentUser.id}
                  preferredCityId={preferredCityId}
                  preferredCityName={preferredCityName}
                  preferredRegionId={preferredRegionId}
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
