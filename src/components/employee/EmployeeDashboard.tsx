import React, { useState, useEffect } from 'react'
import { Calendar, Clock, Briefcase, Search } from 'lucide-react'
import { UnifiedLayout } from '@/components/layouts/UnifiedLayout'
import CompleteUnifiedSettings from '@/components/settings/CompleteUnifiedSettings'
import { MyEmployments } from '@/components/employee/MyEmploymentsEnhanced'
import { EmployeeOnboarding } from '@/components/employee/EmployeeOnboarding'
import { AvailableVacanciesMarketplace } from '@/components/jobs/AvailableVacanciesMarketplace'
import { usePendingNavigation } from '@/hooks/usePendingNavigation'
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
  const [activePage, setActivePage] = useState('employments')
  const [currentUser, setCurrentUser] = useState(user)

  // Función para manejar cambios de página con contexto
  const handlePageChange = (page: string, context?: Record<string, unknown>) => {
    setActivePage(page)
    // Aquí puedes usar el context si necesitas pasarlo a componentes hijos
    if (context) {
      // eslint-disable-next-line no-console
      console.log('Employee navigation context:', context)
    }
  }

  // Hook para procesar navegaciones pendientes después de cambio de rol
  usePendingNavigation(handlePageChange)

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
      id: 'employments',
      label: 'Mis Empleos',
      icon: <Briefcase className="h-5 w-5" />
    },
    {
      id: 'vacancies',
      label: 'Buscar Vacantes',
      icon: <Search className="h-5 w-5" />
    },
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

  const handleJoinBusiness = () => {
    setActivePage('join-business')
  }

  const renderContent = () => {
    switch (activePage) {
      case 'employments':
        return <MyEmployments employeeId={currentUser.id} onJoinBusiness={handleJoinBusiness} />
      case 'join-business':
        return (
          <EmployeeOnboarding
            user={currentUser}
            onRequestCreated={() => setActivePage('employments')}
          />
        )
      case 'vacancies':
        return (
          <div className="p-6">
            <AvailableVacanciesMarketplace userId={currentUser.id} />
          </div>
        )
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
      case 'settings':
        return (
          <div className="p-6">
            {currentUser && (
              <CompleteUnifiedSettings
                user={currentUser}
                onUserUpdate={setCurrentUser}
                currentRole="employee"
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
