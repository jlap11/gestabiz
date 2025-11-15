import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, MapPin, Briefcase, Users, Calculator, FileText, Shield, CreditCard, BriefcaseBusiness, ShoppingCart, Calendar, CalendarOff, Box, Wallet } from 'lucide-react'
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
import { ExpensesManagementPage } from './expenses/ExpensesManagementPage'
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
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  
  // ✅ Extraer página activa de la URL (ej: /app/admin/appointments → 'appointments')
  const getPageFromUrl = () => {
    const path = location.pathname
    const match = path.match(/\/app\/admin\/([^/]+)/)
    return match ? match[1] : 'overview'
  }
  
  const [activePage, setActivePage] = useState(getPageFromUrl())
  const [currentUser, setCurrentUser] = useState(user)
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeHierarchy | null>(null)
  const [pageContext, setPageContext] = useState<Record<string, unknown>>({})
  const [chatConversationId, setChatConversationId] = useState<string | null>(null)
  
  // Hooks para sede preferida y ubicaciones
  const { preferredLocationId, setPreferredLocation } = usePreferredLocation(business.id)
  const { locations, fetchLocations } = useSupabaseData({ user, autoFetch: false })
  
  // Estado para nombre de la sede
  const [preferredLocationName, setPreferredLocationName] = useState<string | null>(null)
  
  // ✅ Sincronizar activePage con la URL
  useEffect(() => {
    const pageFromUrl = getPageFromUrl()
    if (pageFromUrl !== activePage) {
      setActivePage(pageFromUrl)
    }
  }, [location.pathname])
  
  // ✅ Redirigir a /app/admin/overview si estamos en /app
  useEffect(() => {
    if (location.pathname === '/app' || location.pathname === '/app/') {
      navigate('/app/admin/overview', { replace: true })
    }
  }, [location.pathname, navigate])
  
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

  // ✅ Función para manejar cambios de página con navegación de URL
  const handlePageChange = (page: string, context?: Record<string, unknown>) => {
    setActivePage(page)
    navigate(`/app/admin/${page}`, { replace: true })
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
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      id: 'appointments',
      label: t('adminDashboard.sidebar.appointments'),
      icon: <Calendar className="h-5 w-5" />
    },
    {
      id: 'absences',
      label: t('adminDashboard.sidebar.absences'),
      icon: <CalendarOff className="h-5 w-5" />
    },
    {
      id: 'locations',
      label: t('adminDashboard.sidebar.locations'),
      icon: <MapPin className="h-5 w-5" />
    },
    {
      id: 'services',
      label: t('adminDashboard.sidebar.services'),
      icon: <Briefcase className="h-5 w-5" />
    },
    // Tab de recursos (solo para negocios con recursos físicos)
    ...(showResourcesTab ? [{
      id: 'resources',
      label: t('adminDashboard.sidebar.resources'),
      icon: <Box className="h-5 w-5" />
    }] : []),
    {
      id: 'employees',
      label: t('adminDashboard.sidebar.employees'),
      icon: <Users className="h-5 w-5" />
    },
    {
      id: 'recruitment',
      label: t('adminDashboard.sidebar.recruitment'),
      icon: <BriefcaseBusiness className="h-5 w-5" />
    },
    {
      id: 'quick-sales',
      label: t('adminDashboard.sidebar.quickSales'),
      icon: <ShoppingCart className="h-5 w-5" />
    },
    {
      id: 'expenses',
      label: 'Egresos',
      icon: <Wallet className="h-5 w-5" />
    },
    // {
    //   id: 'accounting',
    //   label: t('adminDashboard.sidebar.accounting'),
    //   icon: <Calculator className="h-5 w-5" />
    // },
    {
      id: 'reports',
      label: t('adminDashboard.sidebar.reports'),
      icon: <FileText className="h-5 w-5" />
    },
    {
      id: 'billing',
      label: t('adminDashboard.sidebar.billing'),
      icon: <CreditCard className="h-5 w-5" />
    },
    {
      id: 'permissions',
      label: t('adminDashboard.sidebar.permissions'),
      icon: <Shield className="h-5 w-5" />
    }
  ]

  const renderContent = () => {
    switch (activePage) {
      case 'overview':
        return <OverviewTab business={business} />
      case 'appointments':
        return <AppointmentsCalendar businessId={business.id} />
      case 'absences':
        return <AbsencesTab businessId={business.id} />
      case 'locations':
        return <LocationsManager businessId={business.id} />
      case 'services':
        return <ServicesManager businessId={business.id} />
      case 'resources':
        return <ResourcesManager business={business} />
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
            onChatStarted={setChatConversationId}
          />
        )
      case 'quick-sales':
        return <QuickSalesPage businessId={business.id} />
      case 'expenses':
        return <ExpensesManagementPage businessId={business.id} />
      // case 'accounting':
      //   return <AccountingPage businessId={business.id} onUpdate={onUpdate} />
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
      preferredLocationName={preferredLocationName}
      onLocationSelect={setPreferredLocation}
      availableLocations={locations.map(l => ({ id: l.id, name: l.name }))}
      chatConversationId={chatConversationId}
      onChatClose={() => setChatConversationId(null)}
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
