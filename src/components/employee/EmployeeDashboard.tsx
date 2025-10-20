import React, { useState, useEffect } from 'react'
import { Calendar, Clock, Briefcase, Search, CalendarOff } from 'lucide-react'
import { UnifiedLayout } from '@/components/layouts/UnifiedLayout'
import CompleteUnifiedSettings from '@/components/settings/CompleteUnifiedSettings'
import { MyEmployments } from '@/components/employee/MyEmploymentsEnhanced'
import { EmployeeOnboarding } from '@/components/employee/EmployeeOnboarding'
import { EmployeeAbsencesTab } from '@/components/employee/EmployeeAbsencesTab'
import { AvailableVacanciesMarketplace } from '@/components/jobs/AvailableVacanciesMarketplace'
import { VacationDaysWidget } from '@/components/absences/VacationDaysWidget'
import { AbsenceRequestModal } from '@/components/absences/AbsenceRequestModal'
import { usePendingNavigation } from '@/hooks/usePendingNavigation'
import { useEmployeeAbsences } from '@/hooks/useEmployeeAbsences'
import { Button } from '@/components/ui/button'
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
  const [showAbsenceModal, setShowAbsenceModal] = useState(false)
  
  // Hook de ausencias para el widget y el modal
  const { vacationBalance, refresh: refreshAbsences } = useEmployeeAbsences(businessId || '')

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
      id: 'absences',
      label: 'Mis Ausencias',
      icon: <CalendarOff className="h-5 w-5" />
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
        return (
          <div className="space-y-6">
            {/* Widget de vacaciones y botón de ausencia */}
            {businessId && (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <VacationDaysWidget balance={vacationBalance} />
                </div>
                <div className="flex-shrink-0">
                  <Button
                    onClick={() => setShowAbsenceModal(true)}
                    className="w-full sm:w-auto"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Solicitar Ausencia
                  </Button>
                </div>
              </div>
            )}
            
            {/* Lista de empleos */}
            <MyEmployments employeeId={currentUser.id} onJoinBusiness={handleJoinBusiness} />
            
            {/* Modal de solicitud de ausencia */}
            {businessId && (
              <AbsenceRequestModal
                businessId={businessId}
                isOpen={showAbsenceModal}
                onClose={() => {
                  setShowAbsenceModal(false)
                  refreshAbsences()
                }}
              />
            )}
          </div>
        )
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
      case 'absences':
        return businessId ? (
          <div className="p-6">
            <EmployeeAbsencesTab businessId={businessId} />
          </div>
        ) : (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">Mis Ausencias</h2>
            <p className="text-muted-foreground">No estás vinculado a ningún negocio</p>
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
