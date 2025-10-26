import React, { useState, useEffect, Suspense, lazy } from 'react'
import { Calendar, Clock, Briefcase, Search, CalendarOff } from 'lucide-react'
import { UnifiedLayout } from '@/components/layouts/UnifiedLayout'
import CompleteUnifiedSettings from '@/components/settings/CompleteUnifiedSettings'
import { MyEmployments } from '@/components/employee/MyEmploymentsEnhanced'
import { EmployeeOnboarding } from '@/components/employee/EmployeeOnboarding'
import { EmployeeAbsencesTab } from '@/components/employee/EmployeeAbsencesTab'
import { usePendingNavigation } from '@/hooks/usePendingNavigation'
import { useEmployeeAbsences } from '@/hooks/useEmployeeAbsences'
import { useEmployeeBusinesses } from '@/hooks/useEmployeeBusinesses'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { UserRole, User } from '@/types/types'

// Lazy load components that are not critical on initial render
const AvailableVacanciesMarketplace = lazy(() => 
  import('@/components/jobs/AvailableVacanciesMarketplace').then(m => ({ default: m.AvailableVacanciesMarketplace }))
);
const VacationDaysWidget = lazy(() => 
  import('@/components/absences/VacationDaysWidget').then(m => ({ default: m.VacationDaysWidget }))
);
const AbsenceRequestModal = lazy(() => 
  import('@/components/absences/AbsenceRequestModal').then(m => ({ default: m.AbsenceRequestModal }))
);

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
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  
  // Obtener todos los negocios donde el empleado trabaja
  const { businesses: employeeBusinesses, loading: loadingBusinesses } = useEmployeeBusinesses(user?.id)
  const { t } = useLanguage()
  
  // Hook de ausencias para el widget y el modal
  // Usa el negocio seleccionado, o el primero si hay múltiples, o el que viene por props
  const effectiveBusinessId = selectedBusinessId || businessId || employeeBusinesses[0]?.id
  const { vacationBalance, refresh: refreshAbsences } = useEmployeeAbsences(effectiveBusinessId || '')

  // Sincronizar selectedBusinessId cuando cambia businessId (desde MainApp)
  useEffect(() => {
    if (businessId && !selectedBusinessId) {
      setSelectedBusinessId(businessId)
    }
  }, [businessId, selectedBusinessId])

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
      label: t('employeeDashboard.sidebar.myEmployments'),
      icon: <Briefcase className="h-5 w-5" />
    },
    {
      id: 'vacancies',
      label: t('employeeDashboard.sidebar.searchVacancies'),
      icon: <Search className="h-5 w-5" />
    },
    {
      id: 'absences',
      label: t('employeeDashboard.sidebar.myAbsences'),
      icon: <CalendarOff className="h-5 w-5" />
    },
    {
      id: 'appointments',
      label: t('employeeDashboard.sidebar.myAppointments'),
      icon: <Calendar className="h-5 w-5" />
    },
    {
      id: 'schedule',
      label: t('employeeDashboard.sidebar.schedule'),
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
            {/* Lista de empleos */}
            <MyEmployments employeeId={currentUser.id} onJoinBusiness={handleJoinBusiness} />
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
            <Suspense fallback={<div className="flex items-center justify-center h-96"><LoadingSpinner /></div>}>
              <AvailableVacanciesMarketplace userId={currentUser.id} />
            </Suspense>
          </div>
        )
      case 'absences':
        return effectiveBusinessId ? (
          <div className="p-6 space-y-6">
            {/* Selector de negocio si hay múltiples */}
            {employeeBusinesses.length > 1 && (
              <div className="flex items-end gap-4">
                <div className="flex-1 max-w-xs">
                  <label htmlFor="business-select" className="text-sm font-medium text-muted-foreground mb-2 block">
                    Seleccionar Negocio
                  </label>
                  <Select value={selectedBusinessId || ''} onValueChange={setSelectedBusinessId}>
                    <SelectTrigger id="business-select" className="w-full">
                      <SelectValue placeholder="Elige un negocio..." />
                    </SelectTrigger>
                    <SelectContent>
                      {employeeBusinesses.map((business) => (
                        <SelectItem key={business.id} value={business.id}>
                          {business.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            {/* Widget de vacaciones y botón de solicitud */}
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
            
            {/* Lista de ausencias */}
            <EmployeeAbsencesTab businessId={effectiveBusinessId} />
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
      
      {/* Modal de solicitud de ausencia */}
      {effectiveBusinessId && (
        <AbsenceRequestModal
          businessId={effectiveBusinessId}
          isOpen={showAbsenceModal}
          onClose={() => {
            setShowAbsenceModal(false)
            refreshAbsences()
          }}
        />
      )}
    </UnifiedLayout>
  )
}
