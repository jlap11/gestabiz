import React, { useState, useEffect, useRef } from 'react'
import { 
  Settings, 
  Menu,
  X,
  ChevronDown,
  Building2,
  LogOut,
  User as UserIcon,
  Plus,
  Bug
} from 'lucide-react'
import logoGestabiz from '@/assets/images/logo_gestabiz.png'
import { Badge } from '@/components/ui/badge'
import { SearchBar, type SearchType } from '@/components/client/SearchBar'
import { CitySelector } from '@/components/client/CitySelector'
import { usePreferredCity } from '@/hooks/usePreferredCity'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { isTouchDevice } from '@/lib/animations'
import type { Business, UserRole } from '@/types/types'
import { NotificationBell } from '@/components/notifications'
import { FloatingChatButton } from '@/components/chat/FloatingChatButton'
import { BugReportModal } from '@/components/bug-report/BugReportModal'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'


interface SearchResult {
  id: string
  name: string
  type: SearchType
  subtitle?: string
  category?: string
  location?: string
}

interface UnifiedLayoutProps {
  children: React.ReactNode
  business?: Business
  businesses?: Business[]
  onSelectBusiness?: (businessId: string) => void
  onCreateNew?: () => void
  currentRole: UserRole
  availableRoles: UserRole[]
  onRoleChange: (role: UserRole) => void
  onLogout?: () => void
  sidebarItems: SidebarItem[]
  activePage: string
  onPageChange: (page: string, context?: Record<string, unknown>) => void
  user?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  preferredLocationName?: string | null
  onLocationSelect?: (locationId: string | null) => void
  availableLocations?: Array<{ id: string; name: string }>
  onSearchResultSelect?: (result: SearchResult) => void
  onSearchViewMore?: (searchTerm: string, searchType: SearchType) => void
  chatConversationId?: string | null
  onChatClose?: () => void
}

interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  badge?: number
}

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  employee: 'Empleado',
  client: 'Cliente'
}

export function UnifiedLayout({
  children,
  business,
  businesses = [],
  onSelectBusiness,
  onCreateNew,
  currentRole,
  availableRoles,
  onRoleChange,
  onLogout,
  sidebarItems,
  activePage,
  onPageChange,
  user,
  preferredLocationName,
  onLocationSelect,
  availableLocations = [],
  onSearchResultSelect,
  onSearchViewMore,
  chatConversationId,
  onChatClose
}: Readonly<UnifiedLayoutProps>) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth >= 1024
  })
  const [bugReportOpen, setBugReportOpen] = useState(false)
  const [locationMenuOpen, setLocationMenuOpen] = useState(false)
  const [mobileHeaderOpen, setMobileHeaderOpen] = useState(false)
  const locationMenuRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const touchRef = useRef({
    startX: 0,
    startY: 0,
    isSwiping: false,
    edge: null as null | 'left' | 'right',
  })
  
  // Hook para preferencias de ciudad (solo para cliente)
  const {
    preferredRegionId,
    preferredRegionName,
    preferredCityId,
    preferredCityName,
    setPreferredCity
  } = usePreferredCity()

  // Close location menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationMenuRef.current && !locationMenuRef.current.contains(event.target as Node)) {
        setLocationMenuOpen(false)
      }
    }

    if (locationMenuOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [locationMenuOpen])

  // Deduplicate available roles
  const uniqueRoles = Array.from(new Set(availableRoles))

  // Swipe gestures to open/close side menus (mobile)
  useEffect(() => {
    // Attach on window to ensure gestures are detected across overlays/portals
    if (!isTouchDevice()) return

    const handleStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      touchRef.current.startX = touch.clientX
      touchRef.current.startY = touch.clientY
      touchRef.current.isSwiping = false
      // Permitimos gestos desde toda la pantalla; mantenemos detección de borde solo como referencia
      const edgeThreshold = 24
      const w = window.innerWidth
      touchRef.current.edge =
        touch.clientX <= edgeThreshold ? 'left' :
        touch.clientX >= w - edgeThreshold ? 'right' :
        null
    }

    const handleMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      const dx = touch.clientX - touchRef.current.startX
      const dy = touch.clientY - touchRef.current.startY
      if (!touchRef.current.isSwiping) {
        if (Math.abs(dx) > 15 && Math.abs(dy) < 40) {
          touchRef.current.isSwiping = true
        }
      }
    }

    const handleEnd = (e: TouchEvent) => {
      const { edge, startX } = touchRef.current
      const touch = e.changedTouches[0]
      const dx = touch.clientX - startX
      const dy = touch.clientY - touchRef.current.startY
      const threshold = 60
      const directionalEnough = Math.abs(dy) < 40

      // Close menus with inverse swipe when already open
      if (directionalEnough) {
        // Close left sidebar with swipe left from anywhere (avoid extreme left edge to reduce false positives)
        if (sidebarOpen && dx < -threshold && startX > 80) {
          setSidebarOpen(false)
          touchRef.current.edge = null
          touchRef.current.isSwiping = false
          return
        }
        // Close right mobile header with swipe right from anywhere (avoid extreme right edge)
        if (mobileHeaderOpen && dx > threshold && startX < window.innerWidth - 80) {
          setMobileHeaderOpen(false)
          touchRef.current.edge = null
          touchRef.current.isSwiping = false
          return
        }
      }

      // Open menus with directional swipe from anywhere on the screen
      if (directionalEnough) {
        if (!sidebarOpen && dx > threshold) {
          setSidebarOpen(true)
        } else if (!mobileHeaderOpen && dx < -threshold) {
          setMobileHeaderOpen(true)
        }
      }

      touchRef.current.edge = null
      touchRef.current.isSwiping = false
    }

    window.addEventListener('touchstart', handleStart, { passive: true })
    window.addEventListener('touchmove', handleMove, { passive: true })
    window.addEventListener('touchend', handleEnd)
    return () => {
      window.removeEventListener('touchstart', handleStart)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [sidebarOpen, mobileHeaderOpen])

  return (
    <div ref={rootRef} className="min-h-screen bg-background flex overflow-x-hidden">
      {/* Sidebar - Full Height & Sticky */}
      <aside
        className={cn(
          "fixed lg:sticky left-0 top-0 h-screen bg-card border-r border-border z-[100] transition-transform duration-300 w-64 flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo/Brand */}
        <div className="px-4  border-b border-border flex-shrink-0">
          <div className="flex items-center gap-4">
            <img 
              src={logoGestabiz} 
              alt="Gestabiz Logo" 
              className="w-28 h-22 rounded-2xl object-contain"
            />
            <span className="text-2xl font-bold text-foreground">
              Gestabiz
            </span>
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onPageChange(item.id)
                // Close sidebar on mobile after selection
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false)
                }
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left",
                activePage === item.id
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-foreground hover:bg-muted"
              )}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <Badge 
                  variant={activePage === item.id ? "secondary" : "default"}
                  className="ml-auto"
                >
                  {item.badge}
                </Badge>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom Menu - Bug Report & Logout */}
        <div className="p-4 border-t border-border flex-shrink-0 space-y-2">
          <button
            onClick={() => setBugReportOpen(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Bug className="h-5 w-5" />
            <span className="font-medium">Reportar problema</span>
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          )}
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[95] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Right Side: Header + Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        {/* Header - Responsive height (fixed on mobile, sticky on desktop) */}
        <header className="bg-card border-b border-border fixed inset-x-0 top-0 z-[90] sm:sticky sm:inset-auto flex-shrink-0">
        {/* Mobile top bar: logo abre el menú izquierdo + botón menú derecho */}
        <div className="px-3 py-3 flex items-center justify-between sm:hidden min-h-[56px]">
          <div className="flex items-center gap-2">
            {/* Logo como botón para abrir el menú izquierdo */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1 hover:bg-muted rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Abrir menú izquierdo"
            >
              <img src={logoGestabiz} alt="Gestabiz" className="w-8 h-8 rounded-lg object-contain" />
            </button>
            <span className="text-sm font-semibold text-foreground">Gestabiz</span>
          </div>
          {/* Right area: Notification bell + overlay toggle */}
          <div className="flex items-center gap-2">
            {user?.id && (
              <NotificationBell 
                userId={user.id}
                onNavigateToPage={(page, ctx) => onPageChange(page, ctx)}
                currentRole={currentRole}
                onRoleSwitch={onRoleChange}
                availableRoles={availableRoles}
              />
            )}
            <button
              onClick={() => setMobileHeaderOpen(true)}
              className="p-2 hover:bg-muted rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Abrir menú derecho"
            >
              <Menu className="h-6 w-6 text-foreground" />
            </button>
          </div>
        </div>
        <div className="hidden sm:grid px-3 sm:px-6 py-3 sm:py-4 grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-2 h-full min-h-[64px] sm:min-h-[89px]">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile menu toggle - Touch optimized */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? (
                <X className="h-6 w-6 text-foreground" />
              ) : (
                <Menu className="h-6 w-6 text-foreground" />
              )}
            </button>

            {/* Logo/Business Info - Responsive */}
            {business ? (
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center gap-2 sm:gap-3 hover:bg-muted/50 rounded-lg p-1.5 sm:p-2 transition-colors group focus:outline-none min-w-0 overflow-hidden">
                    {business.logo_url ? (
                      <img
                        src={business.logo_url}
                        alt={business.name}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl object-contain bg-muted p-1.5 sm:p-2 border-2 border-primary/20 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/20 flex items-center justify-center border-2 border-primary/20 flex-shrink-0">
                        <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                    )}

                    <div className="text-left flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="min-w-0">
                        <h1 className="text-base sm:text-xl font-bold text-foreground truncate max-w-[120px] sm:max-w-[200px] md:max-w-[160px]">
                          {business.name}
                        </h1>
                      </div>
                      {business.category && (
                        <Badge variant="secondary" className="text-xs hidden md:inline-flex">
                          {business.category.name}
                        </Badge>
                      )}
                      <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                    </div>
                  </DropdownMenuTrigger>
                
                <DropdownMenuContent align="start" className="w-64 bg-card border-border">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      Mis Negocios
                    </p>
                  </div>
                  {businesses.map((biz) => (
                    <DropdownMenuItem
                      key={biz.id}
                      onClick={() => onSelectBusiness?.(biz.id)}
                      className={cn(
                        "cursor-pointer flex items-center gap-3 py-3",
                        biz.id === business.id && "bg-primary/20 text-foreground font-semibold"
                      )}
                    >
                      {biz.logo_url ? (
                        <img
                          src={biz.logo_url}
                          alt={biz.name}
                          className="w-8 h-8 rounded-lg object-contain bg-muted p-1"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{biz.name}</p>
                        {biz.category && (
                          <p className="text-xs text-muted-foreground truncate">
                            {biz.category.name}
                          </p>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                  
                  {onCreateNew && (
                    <>
                      <div className="my-1 h-px bg-border" />
                      <DropdownMenuItem
                        onClick={onCreateNew}
                        className="cursor-pointer flex items-center gap-3 py-3 text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Plus className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">Crear Nuevo Negocio</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Location Selector - Outside DropdownMenu */}
              {availableLocations.length > 0 && (
                <div className="relative" ref={locationMenuRef}>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setLocationMenuOpen(!locationMenuOpen)
                    }}
                    className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 px-2 py-1 hover:bg-muted rounded-md min-w-0 max-w-[160px]"
                  >
                    <span>📍</span>
                    <span className="truncate">{preferredLocationName || 'Seleccionar sede'}</span>
                    <ChevronDown className="h-3 w-3 flex-shrink-0" />
                  </button>
                  {locationMenuOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 min-w-[180px]">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          onLocationSelect?.(null)
                          setLocationMenuOpen(false)
                        }}
                        className="w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-muted/50 transition-colors first:rounded-t-md"
                      >
                        Todas las sedes
                      </button>
                      {availableLocations.map((location) => (
                        <button
                          key={location.id}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            onLocationSelect?.(location.id)
                            setLocationMenuOpen(false)
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-muted/50 transition-colors",
                            preferredLocationName === location.name && "bg-primary/20 text-foreground font-semibold"
                          )}
                        >
                          {location.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            ) : currentRole === 'client' ? (
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <CitySelector
                  preferredRegionId={preferredRegionId}
                  preferredRegionName={preferredRegionName}
                  preferredCityId={preferredCityId}
                  preferredCityName={preferredCityName}
                  onCitySelect={setPreferredCity}
                />
                {/* Mobile: search moved into right overlay panel */}
                <SearchBar
                  onResultSelect={(result) => onSearchResultSelect?.(result)}
                  onViewMore={(term, type) => onSearchViewMore?.(term, type)}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl font-bold text-foreground truncate">
                  Gestabiz
                </h1>
              </div>
            )}
          </div>
          {/* Center area: search for desktop (hidden on small screens) */}
          <div className="hidden sm:block min-w-0 w-full col-start-2 col-end-3">
            {currentRole === 'client' && (
              <div className="w-full min-w-0">
                <SearchBar
                  onResultSelect={(result) => onSearchResultSelect?.(result)}
                  onViewMore={(term, type) => onSearchViewMore?.(term, type)}
                  className="w-full max-w-none"
                />
              </div>
            )}
          </div>

          {/* Right Side Controls - Responsive */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Notification Bell - Show for authenticated users */}
            {user?.id && (
              <NotificationBell 
                userId={user.id} 
                onNavigateToPage={onPageChange}
                currentRole={currentRole}
                onRoleSwitch={onRoleChange}
                availableRoles={availableRoles}
              />
            )}

            {/* Role Selector - Responsive */}
            {uniqueRoles.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger className="group flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-muted transition-colors focus:outline-none min-h-[44px]">
                  <UserIcon className="h-4 w-4 sm:hidden text-foreground" />
                  <span className="text-xs sm:text-sm font-medium text-foreground hidden sm:inline whitespace-nowrap">
                    {roleLabels[currentRole]}
                  </span>
                  {uniqueRoles.length > 1 && (
                    <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  )}
                </DropdownMenuTrigger>
                {uniqueRoles.length > 1 && (
                  <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                    {uniqueRoles.map((role) => (
                      <DropdownMenuItem
                        key={role}
                        onClick={() => onRoleChange(role)}
                        className={cn(
                          "cursor-pointer",
                          role === currentRole && "bg-primary/20 text-foreground font-semibold"
                        )}
                      >
                        {roleLabels[role]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                )}
              </DropdownMenu>
            )}

            {/* User Menu - Touch optimized */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none min-w-[44px] min-h-[44px] flex items-center justify-center">
                  <Avatar className="w-9 h-9 sm:w-10 sm:h-10 border-2 border-primary/20">
                    {user.avatar && (
                      <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
                    )}
                    <AvatarFallback className="bg-primary/20 text-primary text-xs sm:text-sm font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <DropdownMenuItem
                    onClick={() => onPageChange('profile')}
                    className="cursor-pointer"
                  >
                    <UserIcon className="h-4 w-4 mr-2" />
                    Mi Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onPageChange('settings')}
                    className="cursor-pointer"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configuración
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
        </div>
        </div>
      </header>

      {/* Main Content - Scrollable area (mobile padding to account for fixed header) */}
      <main className="flex-1 px-3 sm:px-0 max-w-[100vw] overflow-x-hidden pt-[56px] sm:pt-0">
          {children}
      </main>

      {/* Mobile Header Overlay - Right side drawer (animated open/close) */}
      <div
        className={cn(
          "fixed inset-0 z-[100] sm:hidden transition-opacity duration-300",
          mobileHeaderOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        aria-hidden={!mobileHeaderOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/50 transition-opacity duration-300",
            mobileHeaderOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setMobileHeaderOpen(false)}
        />
        <div
          className={cn(
            "absolute right-0 top-0 h-full w-[88vw] max-w-[380px] bg-card border-l border-border shadow-xl transform transition-transform duration-300 ease-out",
            mobileHeaderOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="h-full overflow-y-auto">
              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <span className="text-sm font-semibold text-foreground">Menú</span>
                <button
                  onClick={() => setMobileHeaderOpen(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  aria-label="Cerrar menú"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 space-y-6">
                {/* Ubicación */}
                {currentRole === 'client' && (
                  <div className="space-y-3 rounded-xl border border-border bg-muted/30 px-3 py-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ubicación</p>
                    <CitySelector
                      preferredRegionId={preferredRegionId}
                      preferredRegionName={preferredRegionName}
                      preferredCityId={preferredCityId}
                      preferredCityName={preferredCityName}
                      onCitySelect={setPreferredCity}
                    />
                  </div>
                )}

                {/* Buscar */}
                {currentRole === 'client' && (
                  <div className="space-y-3 rounded-xl border border-border bg-muted/30 px-3 py-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Buscar</p>
                    <SearchBar
                      onResultSelect={(result) => {
                        onSearchResultSelect?.(result)
                        setMobileHeaderOpen(false)
                      }}
                      onViewMore={(term, type) => {
                        onSearchViewMore?.(term, type)
                        setMobileHeaderOpen(false)
                      }}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Rol y notificaciones */}
                <div className="space-y-3 rounded-xl border border-border bg-muted/30 px-3 py-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cuenta</p>
                  <div className="flex items-center gap-3">
                    {uniqueRoles.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors focus:outline-none">
                          <UserIcon className="h-4 w-4 text-foreground" />
                          <span className="text-sm font-medium text-foreground">
                            {roleLabels[currentRole]}
                          </span>
                          {uniqueRoles.length > 1 && (
                            <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                          )}
                        </DropdownMenuTrigger>
                        {uniqueRoles.length > 1 && (
                          <DropdownMenuContent align="end" className="w-48 bg-card border-border z-[120]">
                            {uniqueRoles.map((role) => (
                              <DropdownMenuItem
                                key={role}
                                onClick={() => {
                                  onRoleChange(role)
                                  setMobileHeaderOpen(false)
                                }}
                                className={cn(
                                  "cursor-pointer",
                                  role === currentRole && "bg-primary/20 text-foreground font-semibold"
                                )}
                              >
                                {roleLabels[role]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        )}
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {/* Usuario */}
                {user && (
                  <div className="space-y-3 rounded-xl border border-border bg-muted/30 px-3 py-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Perfil</p>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="focus:outline-none min-w-[44px] min-h-[44px] flex items-center gap-3">
                        <Avatar className="w-10 h-10 border-2 border-primary/20">
                          {user.avatar && (
                            <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
                          )}
                          <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 bg-card border-border z-[120]">
                        <DropdownMenuItem
                          onClick={() => {
                            onPageChange('profile')
                            setMobileHeaderOpen(false)
                          }}
                          className="cursor-pointer"
                        >
                          <UserIcon className="h-4 w-4 mr-2" />
                          Mi Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            onPageChange('settings')
                            setMobileHeaderOpen(false)
                          }}
                          className="cursor-pointer"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Configuración
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Floating Chat Button - Visible for all roles */}
      {user && (
        <FloatingChatButton 
          userId={user.id} 
          businessId={business?.id}
          initialConversationId={chatConversationId}
          onOpenChange={(isOpen) => {
            if (!isOpen && onChatClose) {
              onChatClose()
            }
          }}
        />
      )}

      {/* Bug Report Modal */}
      <BugReportModal 
        open={bugReportOpen}
        onOpenChange={setBugReportOpen}
      />
    </div>
  )
}
