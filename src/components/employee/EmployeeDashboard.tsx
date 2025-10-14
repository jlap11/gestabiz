import React, { useState, useEffect } from 'react'
import { Calendar, Clock } from 'lucide-react'
import { UnifiedLayout } from '@/components/layouts/UnifiedLayout'
import UserProfile from '@/components/settings/UserProfile'
import UnifiedSettings from '@/components/settings/UnifiedSettings'
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
      id: 'appointments',
      label: 'Mis Citas',
      icon: <Calendar className="h-5 w-5" />
    },
    {
      id: 'schedule',
      label: 'Horario',
      icon: <Clock className="h-5 w-5" />
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
              user={currentUser} 
              onUserUpdate={(updatedUser) => {
                setCurrentUser(updatedUser)
              }}
            />
          </div>
        )
      case 'settings':
        return (
          <div className="p-6">
            {currentUser && (
              <UnifiedSettings
                user={currentUser}
                onUserUpdate={setCurrentUser}
                currentRole={currentRole}
                businessId={businessId}
              />
            )}
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
      user={currentUser ? {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        avatar: currentUser.avatar_url
      } : undefined}
    >
      {renderContent()}
    </UnifiedLayout>
  )
}
