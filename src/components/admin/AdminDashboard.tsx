import React, { useState, useEffect } from 'react'
import { LayoutDashboard, MapPin, Briefcase, Users, Calculator, FileText, Shield } from 'lucide-react'
import { UnifiedLayout } from '@/components/layouts/UnifiedLayout'
import { OverviewTab } from './OverviewTab'
import { LocationsManager } from './LocationsManager'
import { ServicesManager } from './ServicesManager'
import { AccountingPage } from './AccountingPage'
import { ReportsPage } from './ReportsPage'
import { BusinessSettings } from './BusinessSettings'
import { PermissionsManager } from './PermissionsManager'
import UserProfile from '@/components/settings/UserProfile'
import type { Business, UserRole, User } from '@/types/types'

interface AdminDashboardProps {
  business: Business
  businesses: Business[]
  onSelectBusiness: (businessId: string) => void
  onCreateNew?: () => void
  onUpdate?: () => void
  onLogout?: () => void
  currentRole: UserRole
  availableRoles: UserRole[]
  onRoleChange: (role: UserRole) => void
  user: User // Cambiar de opcional a requerido y usar tipo User completo
}

export function AdminDashboard({ 
  business, 
  businesses, 
  onSelectBusiness, 
  onCreateNew, 
  onUpdate,
  onLogout,
  currentRole,
  availableRoles,
  onRoleChange,
  user
}: Readonly<AdminDashboardProps>) {
  const [activePage, setActivePage] = useState('overview')
  const [currentUser, setCurrentUser] = useState(user)

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
    setCurrentUser(user)
  }, [user])

  const sidebarItems = [
    {
      id: 'overview',
      label: 'Resumen',
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      id: 'locations',
      label: 'Sedes',
      icon: <MapPin className="h-5 w-5" />
    },
    {
      id: 'services',
      label: 'Servicios',
      icon: <Briefcase className="h-5 w-5" />
    },
    {
      id: 'employees',
      label: 'Empleados',
      icon: <Users className="h-5 w-5" />
    },
    {
      id: 'accounting',
      label: 'Contabilidad',
      icon: <Calculator className="h-5 w-5" />
    },
    {
      id: 'reports',
      label: 'Reportes',
      icon: <FileText className="h-5 w-5" />
    },
    {
      id: 'permissions',
      label: 'Permisos',
      icon: <Shield className="h-5 w-5" />
    }
  ]

  const renderContent = () => {
    switch (activePage) {
      case 'overview':
        return <OverviewTab business={business} />
      case 'locations':
        return <LocationsManager businessId={business.id} />
      case 'services':
        return <ServicesManager businessId={business.id} />
      case 'employees':
        return (
          <div className="p-12 text-center">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Gestión de Empleados
            </h3>
            <p className="text-muted-foreground">
              Esta funcionalidad estará disponible próximamente
            </p>
          </div>
        )
      case 'accounting':
        return <AccountingPage businessId={business.id} onUpdate={onUpdate} />
      case 'reports':
        return <ReportsPage businessId={business.id} user={currentUser} />
      case 'permissions':
        return (
          <PermissionsManager 
            businessId={business.id}
            ownerId={business.owner_id}
            currentUserId={currentUser.id}
          />
        )
      case 'settings':
        return <BusinessSettings business={business} onUpdate={onUpdate} />
      case 'profile':
        return (
          <div className="p-6">
            <UserProfile 
              user={currentUser} 
              onUserUpdate={(updatedUser) => {
                setCurrentUser(updatedUser)
                onUpdate?.()
              }}
            />
          </div>
        )
      default:
        return <OverviewTab business={business} />
    }
  }

  return (
    <UnifiedLayout
      business={business}
      businesses={businesses}
      onSelectBusiness={onSelectBusiness}
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
    >
      <div className="p-6">
        {renderContent()}
      </div>
    </UnifiedLayout>
  )
}
