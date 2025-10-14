import React, { useState } from 'react'
import { 
  Settings, 
  Menu,
  X,
  ChevronDown,
  Building2,
  LogOut,
  User as UserIcon
} from 'lucide-react'
import logoBookio from '@/assets/images/logo_bookio.png'
import { Badge } from '@/components/ui/badge'
import { SearchBar, type SearchType } from '@/components/client/SearchBar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Business, UserRole } from '@/types/types'
import { NotificationBell } from '@/components/notifications'
// COMMENTED FOR DEBUGGING: Chat system causing issues
// import { FloatingChatButton } from '@/components/chat/FloatingChatButton'

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
  currentRole: UserRole
  availableRoles: UserRole[]
  onRoleChange: (role: UserRole) => void
  onLogout?: () => void
  sidebarItems: SidebarItem[]
  activePage: string
  onPageChange: (page: string) => void
  user?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
  onSearchResultSelect?: (result: SearchResult) => void
  onSearchViewMore?: (searchTerm: string, searchType: SearchType) => void
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
  currentRole,
  availableRoles,
  onRoleChange,
  onLogout,
  sidebarItems,
  activePage,
  onPageChange,
  user,
  onSearchResultSelect,
  onSearchViewMore
}: UnifiedLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

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
              src={logoBookio} 
              alt="Bookio Logo" 
              className="w-28 h-22 rounded-2xl object-contain"
            />
            <span className="text-2xl font-bold text-foreground">
              Bookio
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

        {/* Logout Button - Fixed at Bottom */}
        {onLogout && (
          <div className="p-4 border-t border-border flex-shrink-0">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        )}
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
        {/* Header - Altura similar al logo */}
        <header className="bg-card border-b border-border sticky top-0 z-20 flex-shrink-0 min-h-[89px]">
        <div className="px-6 py-4 flex items-center justify-between gap-4 h-full">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5 text-foreground" />
              ) : (
                <Menu className="h-5 w-5 text-foreground" />
              )}
            </button>

            {/* Logo/Business Info - Clickeable Dropdown */}
            {business ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-2 transition-colors group focus:outline-none">
                  {business.logo_url ? (
                    <img
                      src={business.logo_url}
                      alt={business.name}
                      className="w-10 h-10 rounded-xl object-contain bg-muted p-2 border-2 border-primary/20 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border-2 border-primary/20 flex-shrink-0">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                  )}

                  <div className="text-left flex items-center gap-3">
                    <h1 className="text-xl font-bold text-foreground whitespace-nowrap">
                      {business.name}
                    </h1>
                    {business.category && (
                      <Badge variant="secondary" className="text-xs">
                        {business.category.name}
                      </Badge>
                    )}
                    <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                  </div>
                </DropdownMenuTrigger>
                
                {businesses.length > 1 && onSelectBusiness && (
                  <DropdownMenuContent align="start" className="w-64 bg-card border-border">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase">
                        Mis Negocios
                      </p>
                    </div>
                    {businesses.map((biz) => (
                      <DropdownMenuItem
                        key={biz.id}
                        onClick={() => onSelectBusiness(biz.id)}
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
                  </DropdownMenuContent>
                )}
              </DropdownMenu>
            ) : currentRole === 'client' ? (
              <SearchBar
                onResultSelect={(result) => onSearchResultSelect?.(result)}
                onViewMore={(term, type) => onSearchViewMore?.(term, type)}
                className="flex-1"
              />
            ) : (
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  AppointSync Pro
                </h1>
              </div>
            )}
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-3">
            {/* Notification Bell - Show for authenticated users */}
            {user?.id && <NotificationBell userId={user.id} />}

            {/* Role Selector - Show if multiple unique roles exist */}
            {uniqueRoles.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-colors focus:outline-none">
                  <span className="text-sm font-medium text-foreground hidden sm:inline">
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

            {/* User Menu */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none">
                  {user.avatar ? (
                    <img
                      key={user.avatar}
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/20">
                      <span className="text-sm font-bold text-primary">
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

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* COMMENTED FOR DEBUGGING: Chat system causing issues */}
      {/* {user && (
        <FloatingChatButton 
          userId={user.id} 
          businessId={business?.id}
        />
      )} */}
    </div>
  )
}
