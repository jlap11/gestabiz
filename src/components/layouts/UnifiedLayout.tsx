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
import type { Business, UserRole } from '@/types/types'
import { NotificationBell } from '@/components/notifications'
import { FloatingChatButton } from '@/components/chat/FloatingChatButton'
import { BugReportModal } from '@/components/bug-report/BugReportModal'


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
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [bugReportOpen, setBugReportOpen] = useState(false)
  const [locationMenuOpen, setLocationMenuOpen] = useState(false)
  const locationMenuRef = useRef<HTMLDivElement>(null)
  
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Full Height & Sticky */}
      <aside
        className={cn(
          "fixed lg:sticky left-0 top-0 h-screen bg-card border-r border-border z-40 transition-transform duration-300 w-64 flex flex-col",
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
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Right Side: Header + Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header - Responsive height */}
        <header className="bg-card border-b border-border sticky top-0 z-20 flex-shrink-0">
        <div className="px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4 h-full min-h-[64px] sm:min-h-[89px]">
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
                        <h1 className="text-base sm:text-xl font-bold text-foreground truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">
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
                    className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 px-2 py-1 hover:bg-muted rounded-md whitespace-nowrap"
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
                {/* Mobile: show compact search inside left area */}
                <SearchBar
                  onResultSelect={(result) => onSearchResultSelect?.(result)}
                  onViewMore={(term, type) => onSearchViewMore?.(term, type)}
                  className="flex-1 max-w-full sm:hidden"
                />
              </div>
            ) : (
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl font-bold text-foreground truncate">
                  Gestabiz
                </h1>
              </div>
            )}
          {/* Center area: search for desktop (hidden on small screens) */}
          <div className="hidden sm:flex flex-1 justify-center px-2">
            {currentRole === 'client' && (
              <div className="w-full max-w-2xl">
                <SearchBar
                  onResultSelect={(result) => onSearchResultSelect?.(result)}
                  onViewMore={(term, type) => onSearchViewMore?.(term, type)}
                  className="w-full"
                />
              </div>
            )}
          </div>
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
                  {user.avatar ? (
                    <img
                      key={user.avatar}
                      src={user.avatar}
                      alt={user.name}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-primary/20"
                    />
                  ) : (
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/20">
                      <span className="text-xs sm:text-sm font-bold text-primary">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
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

        {/* Main Content - Scrollable with mobile padding */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-0">
          {children}
        </main>
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
