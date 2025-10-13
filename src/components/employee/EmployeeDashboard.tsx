import React, { useState } from 'react'
import { Calendar, Clock, Settings } from 'lucide-react'
import { UnifiedLayout } from '@/components/layouts/UnifiedLayout'
import UnifiedSettings from '@/components/settings/UnifiedSettings'
import UserProfile from '@/components/settings/UserProfile'
import type { UserRole, User } from '@/types/types'

interface EmployeeDashboardProps {
  currentRole: UserRole
  availableRoles: UserRole[]
  onRoleChange: (role: UserRole) => void
  onLogout?: () => void
  user: User // Requerido para UnifiedSettings
  businessId?: string // ID del negocio actual para configuraciones de empleado
}

export function EmployeeDashboard({ 
  currentRole,
  availableRoles,
  onRoleChange,
  onLogout,
  user,
  businessId
}: Readonly<EmployeeDashboardProps>) {
  const [activePage, setActivePage] = useState('appointments')

  const sidebarItems = [
    {
      id: 'appointments',
      label: 'Mis Citas',
      icon: <Calendar className="h-5 w-5" />
    },
    {
      id: 'schedule',
      label: 'Horario',
      icon: <Clock className="h-5 w-5" />
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: <Settings className="h-5 w-5" />
    }
  ]

  const renderContent = () => {
    switch (activePage) {
      case 'appointments':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">Mis Citas</h2>
            <p className="text-muted-foreground">Vista de empleado - Próximamente</p>
          </div>
        )
      case 'schedule':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">Mi Horario</h2>
            <p className="text-muted-foreground">Gestiona tu disponibilidad - Próximamente</p>
          </div>
        )
      case 'profile':
        return (
          <div className="p-6">
            <UserProfile 
              user={user} 
              onUserUpdate={() => {
                // Actualización de usuario manejada
              }}
            />
          </div>
        )
      case 'settings':
        return (
          <div className="p-6">
            <UnifiedSettings 
              user={user} 
              onUserUpdate={() => {
                // Callback para actualizar el usuario si es necesario
              }}
              currentRole={currentRole}
              businessId={businessId}
            />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <UnifiedLayout
      currentRole={currentRole}
      availableRoles={availableRoles}
      onRoleChange={onRoleChange}
      onLogout={onLogout}
      sidebarItems={sidebarItems}
      activePage={activePage}
      onPageChange={setActivePage}
      user={user ? {
        name: user.name,
        email: user.email,
        avatar: user.avatar_url
      } : undefined}
    >
      {renderContent()}
    </UnifiedLayout>
  )
}
