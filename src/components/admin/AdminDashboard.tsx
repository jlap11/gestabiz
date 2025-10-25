import React, { useEffect, useState } from 'react'
import {
  Box,
  Briefcase,
  BriefcaseBusiness,
  Calculator,
  Calendar,
  CalendarOff,
  CreditCard,
  FileText,
  LayoutDashboard,
  MapPin,
  Shield,
  ShoppingCart,
  Users,
} from 'lucide-react'
import { UnifiedLayout } from '@/components/layouts/UnifiedLayout'
import { usePreferredLocation } from '@/hooks/usePreferredLocation'
import { useSupabaseData } from '@/hooks/useSupabaseData'
import { useLanguage } from '@/contexts/LanguageContext'
import { OverviewTab } from './OverviewTab'
import { LocationsManager } from './LocationsManager'
import { ServicesManager } from './ServicesManager'
import { EmployeeManagementHierarchy } from './EmployeeManagementHierarchy'
import { AccountingPage } from './AccountingPage'
import { ReportsPage } from './ReportsPage'
import { PermissionsManager } from './PermissionsManager'
import { BillingDashboard } from '@/components/billing'
import { RecruitmentDashboard } from '@/components/jobs/RecruitmentDashboard'
import { QuickSalesPage } from '@/pages/QuickSalesPage'
import { AppointmentsCalendar } from './AppointmentsCalendar'
import { AbsencesTab } from './AbsencesTab'
import { ResourcesManager } from './ResourcesManager'
import CompleteUnifiedSettings from '@/components/settings/CompleteUnifiedSettings'
import { usePendingNavigation } from '@/hooks/usePendingNavigation'
import type { Business, EmployeeHierarchy, User, UserRole } from '@/types/types'

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
  user,
}: Readonly<AdminDashboardProps>) {
  const { t } = useLanguage()
  const [activePage, setActivePage] = useState('overview')
  const [currentUser, setCurrentUser] = useState(user)
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeHierarchy | null>(null)
  const [pageContext, setPageContext] = useState<Record<string, unknown>>({})
  const [chatConversationId, setChatConversationId] = useState<string | null>(null)

  // Hooks para sede preferida y ubicaciones
  const { preferredLocationId, setPreferredLocation } = usePreferredLocation(business.id)
  const { locations, fetchLocations } = useSupabaseData({ user, autoFetch: false })

  // Estado para nombre de la sede
  const [preferredLocationName, setPreferredLocationName] = useState<string | null>(null)

  // Cargar ubicaciones y obtener nombre de la sede preferida
  useEffect(() => {
    if (business.id) {
      fetchLocations(business.id)
    }
  }, [business.id, fetchLocations])

  useEffect(() => {
    if (preferredLocationId && locations.length > 0) {
      const location = locations.find(l => l.id === preferredLocationId)
      setPreferredLocationName(location?.name || null)
    } else {
      setPreferredLocationName(null)
    }
  }, [preferredLocationId, locations])

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

  // Determinar si mostrar tab de recursos
  const showResourcesTab = business.resource_model && business.resource_model !== 'professional'

  const sidebarItems = [
    {
      id: 'overview',
      label: t('adminDashboard.sidebar.overview'),
      icon: <LayoutDashboard className="h-5 w-5" aria-hidden="true" />,
    },
    {
      id: 'appointments',
      label: t('adminDashboard.sidebar.appointments'),
      icon: <Calendar className="h-5 w-5" aria-hidden="true" />,
    },
    {
      id: 'absences',
      label: t('adminDashboard.sidebar.absences'),
      icon: <CalendarOff className="h-5 w-5" aria-hidden="true" />,
    },
    {
      id: 'locations',
      label: t('adminDashboard.sidebar.locations'),
      icon: <MapPin className="h-5 w-5" aria-hidden="true" />,
    },
    {
      id: 'services',
      label: t('adminDashboard.sidebar.services'),
      icon: <Briefcase className="h-5 w-5" aria-hidden="true" />,
    },
    // Tab de recursos (solo para negocios con recursos físicos)
    ...(showResourcesTab
      ? [
          {
            id: 'resources',
            label: t('adminDashboard.sidebar.resources'),
            icon: <Box className="h-5 w-5" aria-hidden="true" />,
          },
        ]
      : []),
    {
      id: 'employees',
      label: t('adminDashboard.sidebar.employees'),
      icon: <Users className="h-5 w-5" aria-hidden="true" />,
    },
    {
      id: 'recruitment',
      label: t('adminDashboard.sidebar.recruitment'),
      icon: <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />,
    },
    {
      id: 'quick-sales',
      label: t('adminDashboard.sidebar.quickSales'),
      icon: <ShoppingCart className="h-5 w-5" aria-hidden="true" />,
    },
    {
      id: 'accounting',
      label: t('adminDashboard.sidebar.accounting'),
      icon: <Calculator className="h-5 w-5" aria-hidden="true" />,
    },
    {
      id: 'reports',
      label: t('adminDashboard.sidebar.reports'),
      icon: <FileText className="h-5 w-5" aria-hidden="true" />,
    },
    {
      id: 'billing',
      label: t('adminDashboard.sidebar.billing'),
      icon: <CreditCard className="h-5 w-5" aria-hidden="true" />,
    },
    {
      id: 'permissions',
      label: t('adminDashboard.sidebar.permissions'),
      icon: <Shield className="h-5 w-5" aria-hidden="true" />,
    },
  ]

  const renderContent = () => {
    switch (activePage) {
      case 'overview':
        return (
          <section 
            role="region" 
            aria-labelledby="overview-title"
            className="focus:outline-none"
            tabIndex={-1}
          >
            <h2 id="overview-title" className="sr-only">
              Resumen general del negocio
            </h2>
            <OverviewTab business={business} />
          </section>
        )
      case 'appointments':
        return (
          <section 
            role="region" 
            aria-labelledby="appointments-title"
            className="focus:outline-none"
            tabIndex={-1}
          >
            <h2 id="appointments-title" className="sr-only">
              Gestión de citas
            </h2>
            <AppointmentsCalendar />
          </section>
        )
      case 'absences':
        return (
          <section 
            role="region" 
            aria-labelledby="absences-title"
            className="focus:outline-none"
            tabIndex={-1}
          >
            <h2 id="absences-title" className="sr-only">
              Gestión de ausencias
            </h2>
            <AbsencesTab businessId={business.id} />
          </section>
        )
      case 'locations':
        return (
          <section 
            role="region" 
            aria-labelledby="locations-title"
            className="focus:outline-none"
            tabIndex={-1}
          >
            <h2 id="locations-title" className="sr-only">
              Gestión de sedes
            </h2>
            <LocationsManager businessId={business.id} />
          </section>
        )
      case 'services':
        return (
          <section 
            role="region" 
            aria-labelledby="services-title"
            className="focus:outline-none"
            tabIndex={-1}
          >
            <h2 id="services-title" className="sr-only">
              Gestión de servicios
            </h2>
            <ServicesManager businessId={business.id} />
          </section>
        )
      case 'resources':
        return (
          <section 
            role="region" 
            aria-labelledby="resources-title"
            className="focus:outline-none"
            tabIndex={-1}
          >
            <h2 id="resources-title" className="sr-only">
              Gestión de recursos
            </h2>
            <ResourcesManager business={business} />
          </section>
        )
      case 'employees':
        return (
          <section 
            role="region" 
            aria-labelledby="employees-title"
            className="focus:outline-none"
            tabIndex={-1}
          >
            <h2 id="employees-title" className="sr-only">
              Gestión de empleados
            </h2>
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
          </section>
        )
      case 'recruitment':
        return (
          <section 
            role="region" 
            aria-labelledby="recruitment-title"
            className="focus:outline-none"
            tabIndex={-1}
          >
            <h2 id="recruitment-title" className="sr-only">
              Gestión de reclutamiento
            </h2>
            <RecruitmentDashboard
              businessId={business.id}
              highlightedVacancyId={pageContext.vacancyId as string | undefined}
              onChatStarted={setChatConversationId}
            />
          </section>
        )
      case 'quick-sales':
        return (
          <section 
            role="region" 
            aria-labelledby="quick-sales-title"
            className="focus:outline-none"
            tabIndex={-1}
          >
            <h2 id="quick-sales-title" className="sr-only">
              Ventas rápidas
            </h2>
            <QuickSalesPage businessId={business.id} />
          </section>
        )
      case 'accounting':
        return (
          <section 
            role="region" 
            aria-labelledby="accounting-title"
            className="focus:outline-none"
            tabIndex={-1}
          >
            <h2 id="accounting-title" className="sr-only">
              Contabilidad
            </h2>
            <AccountingPage businessId={business.id} onUpdate={onUpdate} />
          </section>
        )
      case 'reports':
        return (
          <section 
            role="region" 
            aria-labelledby="reports-title"
            className="focus:outline-none"
            tabIndex={-1}
          >
            <h2 id="reports-title" className="sr-only">
              Reportes financieros
            </h2>
            <ReportsPage businessId={business.id} user={currentUser} />
          </section>
        )
      case 'billing':
        return (
          <section 
            role="region" 
            aria-labelledby="billing-title"
            className="focus:outline-none"
            tabIndex={-1}
          >
            <h2 id="billing-title" className="sr-only">
              Facturación
            </h2>
            <BillingDashboard businessId={business.id} />
          </section>
        )
      case 'permissions':
        return (
          <section 
            role="region" 
            aria-labelledby="permissions-title"
            className="focus:outline-none"
            tabIndex={-1}
          >
            <h2 id="permissions-title" className="sr-only">
              Gestión de permisos
            </h2>
            <PermissionsManager
              businessId={business.id}
              ownerId={business.owner_id}
              currentUserId={currentUser.id}
            />
          </section>
        )
      case 'settings':
      case 'profile':
        return (
          <section 
            role="region" 
            aria-labelledby="settings-title"
            className="p-4 sm:p-6 focus:outline-none"
            tabIndex={-1}
          >
            <h2 id="settings-title" className="sr-only">
              Configuración del perfil
            </h2>
            <CompleteUnifiedSettings
              user={currentUser}
              onUserUpdate={updatedUser => {
                setCurrentUser(updatedUser)
                onUpdate?.()
              }}
              currentRole="admin"
              businessId={business.id}
              business={business}
            />
          </section>
        )
      default:
        return (
          <section 
            role="region" 
            aria-labelledby="default-overview-title"
            className="focus:outline-none"
            tabIndex={-1}
          >
            <h2 id="default-overview-title" className="sr-only">
              Resumen general del negocio
            </h2>
            <OverviewTab business={business} />
          </section>
        )
    }
  }

  return (
    <main 
      className="min-h-screen max-w-[100vw] overflow-x-hidden"
      role="main"
      aria-labelledby="admin-dashboard-title"
    >
      <h1 id="admin-dashboard-title" className="sr-only">
        Panel de administración - {business.name}
      </h1>
      
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
        preferredLocationName={preferredLocationName}
        onLocationSelect={setPreferredLocation}
        availableLocations={locations.map(l => ({ id: l.id, name: l.name }))}
        chatConversationId={chatConversationId}
        onChatClose={() => setChatConversationId(null)}
        user={
          currentUser
            ? {
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email,
                avatar: currentUser.avatar_url,
              }
            : undefined
        }
      >
        <div 
          className="p-4 sm:p-6 max-w-full"
          role="region"
          aria-label="Contenido principal del panel de administración"
        >
          {renderContent()}
        </div>
      </UnifiedLayout>
    </main>
  )
}