import React, { useState, useEffect } from 'react'
import { LayoutDashboard, MapPin, Briefcase, Users, Calculator, FileText, Shield, CreditCard, BriefcaseBusiness } from 'lucide-react'
import { UnifiedLayout } from '@/components/layouts/UnifiedLayout'
import { OverviewTab } from './OverviewTab'
import { LocationsManager } from './LocationsManager'
import { ServicesManager } from './ServicesManager'
import { EmployeeManagementHierarchy } from './EmployeeManagementHierarchy'
import { AccountingPage } from './AccountingPage'
import { ReportsPage } from './ReportsPage'
import { PermissionsManager } from './PermissionsManager'
import { BillingDashboard } from '@/components/billing'
import { RecruitmentDashboard } from '@/components/jobs/RecruitmentDashboard'
import CompleteUnifiedSettings from '@/components/settings/CompleteUnifiedSettings'
import { usePendingNavigation } from '@/hooks/usePendingNavigation'
import type { Business, UserRole, User, EmployeeHierarchy } from '@/types/types'

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
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeHierarchy | null>(null)
  const [pageContext, setPageContext] = useState<Record<string, unknown>>({})

  // Función para manejar cambios de página con contexto
  const handlePageChange = (page: string, context?: Record<string, unknown>) => {
    setActivePage(page)
    if (context) {
      setPageContext(context)
    } else {
      setPageContext({})
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
      id: 'recruitment',
      label: 'Reclutamiento',
      icon: <BriefcaseBusiness className="h-5 w-5" />
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
      id: 'billing',
      label: 'Facturación',
      icon: <CreditCard className="h-5 w-5" />
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
          <>
            <EmployeeManagementHierarchy 
              businessId={business.id}
              onEmployeeSelect={(employee: EmployeeHierarchy) => {
                setSelectedEmployee(employee)
                // Future: Abrir modal de detalle del empleado
              }}
            />
            {selectedEmployee && (
              // Future: Modal de detalle del empleado
              <></>
            )}
          </>
        )
      case 'recruitment':
        return (
          <RecruitmentDashboard 
            businessId={business.id} 
            highlightedVacancyId={pageContext.vacancyId as string | undefined}
          />
        )
      case 'accounting':
        return <AccountingPage businessId={business.id} onUpdate={onUpdate} />
      case 'reports':
        return <ReportsPage businessId={business.id} user={currentUser} />
      case 'billing':
        return <BillingDashboard businessId={business.id} />
      case 'permissions':
        return (
          <PermissionsManager 
            businessId={business.id}
            ownerId={business.owner_id}
            currentUserId={currentUser.id}
          />
        )
      case 'settings':
      case 'profile':
        return (
          <div className="p-6">
            <CompleteUnifiedSettings 
              user={currentUser} 
              onUserUpdate={(updatedUser) => {
                setCurrentUser(updatedUser)
                onUpdate?.()
              }}
              currentRole="admin"
              businessId={business.id}
              business={business}
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
      onCreateNew={onCreateNew}
      currentRole={currentRole}
      availableRoles={availableRoles}
      onRoleChange={onRoleChange}
      onLogout={onLogout}
      sidebarItems={sidebarItems}
      activePage={activePage}
      onPageChange={handlePageChange}
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
