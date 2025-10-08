import { User } from '@/types'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Calendar,
  MapPin,
  UserCircle,
  Settings,
  LogOut,
  Home
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppLayoutProps {
  user: User
  children: React.ReactNode
  currentView: string
  onNavigate: (view: string) => void
  onLogout: () => void
}

interface MenuItem {
  id: string
  label: string
  icon: React.ElementType
  roles?: ('admin' | 'employee' | 'client')[]
}

export default function AppLayout({ 
  user, 
  children, 
  currentView, 
  onNavigate,
  onLogout 
}: Readonly<AppLayoutProps>) {
  const isCollapsed = false

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'My Appointments',
      icon: Home,
    },
    {
      id: 'locations',
      label: 'Locations',
      icon: MapPin,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: UserCircle,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
    },
  ]

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true
    return item.roles.includes(user.activeRole)
  })

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex">
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-[#0f0f0f] border-r border-white/5 flex flex-col transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Logo/Brand */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#6820F7] flex items-center justify-center">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-bold text-white">
                Bookio
              </span>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id
            
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 h-11 rounded-lg transition-colors",
                  isActive 
                    ? "bg-[#6820F7] text-white hover:bg-[#7830FF] hover:text-white" 
                    : "text-gray-400 hover:bg-white/5 hover:text-white",
                  isCollapsed && "justify-center"
                )}
                onClick={() => onNavigate(item.id)}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </Button>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-white/5">
          {/* User Info */}
          <button
            type="button"
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer mb-2 border-0 bg-transparent",
              isCollapsed && "justify-center"
            )}
            onClick={() => onNavigate('profile')}
          >
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarImage src={user.avatar_url || ''} alt={user.name} />
              <AvatarFallback className="bg-[#6820F7] text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            )}
          </button>

          {/* Logout Button */}
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 h-11 text-gray-400 hover:bg-white/5 hover:text-white",
              isCollapsed && "justify-center"
            )}
            onClick={onLogout}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Log Out</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
