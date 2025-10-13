import React, { useState } from 'react'
import { LayoutDashboard, MapPin, Briefcase, Users, Settings } from 'lucide-react'
import { UnifiedLayout } from '@/components/layouts/UnifiedLayout'
import { OverviewTab } from './OverviewTab'
import { LocationsManager } from './LocationsManager'
import { ServicesManager } from './ServicesManager'
import UnifiedSettings from '@/components/settings/UnifiedSettings'
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
      id: 'settings',
      label: 'Configuración',
      icon: <Settings className="h-5 w-5" />
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
      case 'profile':
        return (
          <div className="p-6">
            <UserProfile 
              user={user} 
              onUserUpdate={() => {
                // Actualización de usuario manejada
                onUpdate?.()
              }}
            />
          </div>
        )
      case 'settings':
        return (
          <UnifiedSettings 
            user={user} 
            onUserUpdate={() => {
              // Callback para actualizar el usuario si es necesario
              onUpdate?.()
            }}
            currentRole={currentRole}
            businessId={business.id}
          />
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
      user={user}
    >
      <div className="p-6">
        {renderContent()}
      </div>
    </UnifiedLayout>
  )
}
