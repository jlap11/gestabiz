import { UnifiedLayout } from '@/components/layouts/UnifiedLayout'
import BusinessRegistration from '@/components/business/BusinessRegistration'
import type { User, UserRole, Business } from '@/types/types'

interface AdminOnboardingProps {
  user: User
  onBusinessCreated?: () => void
  currentRole: UserRole
  availableRoles: UserRole[]
  onRoleChange: (role: UserRole) => void
  onLogout?: () => void
  businesses?: Business[]
  onSelectBusiness?: (businessId: string) => void
  onNavigateToAdmin?: () => void
}

export function AdminOnboarding({ 
  user, 
  onBusinessCreated,
  currentRole,
  availableRoles,
  onRoleChange,
  onLogout,
  businesses = [],
  onSelectBusiness,
  onNavigateToAdmin
}: Readonly<AdminOnboardingProps>) {
  
  // Placeholder business for UnifiedLayout sidebar
  const currentBusiness = businesses && businesses.length > 0 
    ? businesses[0] 
    : {
        id: 'new-business',
        name: 'Crear tu Negocio',
        description: 'Nuevo negocio en creación',
        owner_id: user?.id || '',
        category: {
          id: 'placeholder',
          name: 'Sin categoría',
          slug: '',
          is_active: true,
          sort_order: 0
        },
        phone: null,
        email: null,
        address: null,
        city: null,
        state: null,
        country: null,
        postal_code: null,
        latitude: undefined,
        longitude: undefined,
        logo_url: null,
        website: null,
        business_hours: {},
        timezone: undefined,
        settings: {},
        category_id: undefined,
        legal_entity_type: undefined,
        tax_id: null,
        legal_name: null,
        registration_number: null,
        slug: '',
        rating: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        invitation_code: '',
        region_id: null,
        city_id: null,
        country_id: null,
        banner_url: null,
      } as Business

  const sidebarItems = [
    {
      icon: 'LayoutDashboard',
      label: 'Resumen',
      value: 'overview',
      onClick: () => onNavigateToAdmin?.()
    }
  ]

  return (
    <UnifiedLayout
      business={currentBusiness}
      businesses={businesses}
      onSelectBusiness={onSelectBusiness}
      sidebarItems={sidebarItems}
      activePage="overview"
      onLogout={onLogout}
      currentRole={currentRole}
      availableRoles={availableRoles}
      onRoleChange={onRoleChange}
      user={user}
      hideBusinessSelector={businesses.length === 0}
    >
      {/* Renderizar BusinessRegistration como componente hijo */}
      <BusinessRegistration
        user={user}
        onBusinessCreated={(business) => {
          // Llamar callback del padre
          onBusinessCreated?.()
        }}
        onCancel={() => {
          // Si usuario tiene negocios, puede volver
          if (businesses.length > 0 && onSelectBusiness) {
            onSelectBusiness(businesses[0].id)
          }
        }}
      />
    </UnifiedLayout>
  )
}
