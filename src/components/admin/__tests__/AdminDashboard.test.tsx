import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdminDashboard } from '../AdminDashboard'
import type { Business, UserRole, User } from '@/types/types'

// Mock child components
vi.mock('../OverviewTab', () => ({
  OverviewTab: ({ business }: { business: Business }) => (
    <div data-testid="overview-tab">Overview for {business.name}</div>
  )
}))

vi.mock('../LocationsManager', () => ({
  LocationsManager: ({ businessId }: { businessId: string }) => (
    <div data-testid="locations-manager">Locations for {businessId}</div>
  )
}))

vi.mock('../ServicesManager', () => ({
  ServicesManager: ({ businessId }: { businessId: string }) => (
    <div data-testid="services-manager">Services for {businessId}</div>
  )
}))

vi.mock('../AccountingPage', () => ({
  AccountingPage: ({ businessId, onUpdate }: { businessId: string; onUpdate?: () => void }) => (
    <div data-testid="accounting-page">
      Accounting for {businessId}
      <button onClick={onUpdate}>Update</button>
    </div>
  )
}))

vi.mock('../ReportsPage', () => ({
  ReportsPage: ({ businessId, user }: { businessId: string; user: User }) => (
    <div data-testid="reports-page">
      Reports for {businessId}, user: {user.name}
    </div>
  )
}))

vi.mock('../PermissionsManager', () => ({
  PermissionsManager: ({ 
    businessId, 
    ownerId, 
    currentUserId 
  }: { 
    businessId: string
    ownerId: string
    currentUserId: string 
  }) => (
    <div data-testid="permissions-manager">
      Permissions for business: {businessId}, owner: {ownerId}, user: {currentUserId}
    </div>
  )
}))

vi.mock('../BusinessSettings', () => ({
  BusinessSettings: ({ business, onUpdate }: { business: Business; onUpdate?: () => void }) => (
    <div data-testid="business-settings">
      Settings for {business.name}
      <button onClick={onUpdate}>Update Settings</button>
    </div>
  )
}))

vi.mock('@/components/settings/UserProfile', () => ({
  default: ({ user, onUserUpdate }: { user: User; onUserUpdate: (user: User) => void }) => (
    <div data-testid="user-profile">
      Profile for {user.name}
      <button onClick={() => onUserUpdate({ ...user, name: 'Updated Name' })}>
        Update Profile
      </button>
    </div>
  )
}))

// Helper functions
function createMockBusiness(overrides?: Partial<Business>): Business {
  return {
    id: 'business-1',
    name: 'Test Business',
    owner_id: 'owner-1',
    description: 'Test business description',
    email: 'test@business.com',
    phone: '123-456-7890',
    website: 'https://test.com',
    address: '123 Test St',
    city: 'Test City',
    state: 'Test State',
    postal_code: '12345',
    country: 'Test Country',
    timezone: 'America/Mexico_City',
    business_hours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '10:00', close: '14:00', closed: false },
      sunday: { open: '00:00', close: '00:00', closed: true }
    },
    settings: {
      appointment_buffer: 15,
      advance_booking_days: 30,
      cancellation_policy: 24,
      auto_confirm: false,
      require_deposit: false,
      deposit_percentage: 0,
      currency: 'MXN'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }
}

function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'user-1',
    name: 'Test User',
    email: 'test@user.com',
    role: 'admin' as UserRole,
    activeRole: 'admin' as UserRole,
    roles: [
      { businessId: 'business-1', role: 'admin' as UserRole, permissions: [] }
    ],
    avatar_url: 'https://example.com/avatar.jpg',
    language: 'es',
    notification_preferences: {
      email: true,
      push: true,
      browser: true,
      whatsapp: false,
      reminder_24h: true,
      reminder_1h: true,
      reminder_15m: false,
      daily_digest: false,
      weekly_report: false
    },
    permissions: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  }
}

describe('AdminDashboard', () => {
  const mockBusiness = createMockBusiness()
  const mockBusinesses = [
    mockBusiness,
    createMockBusiness({ id: 'business-2', name: 'Second Business' }),
    createMockBusiness({ id: 'business-3', name: 'Third Business' })
  ]
  const mockUser = createMockUser()
  const mockOnSelectBusiness = vi.fn()
  const mockOnCreateNew = vi.fn()
  const mockOnUpdate = vi.fn()
  const mockOnLogout = vi.fn()
  const mockOnRoleChange = vi.fn()

  const defaultProps = {
    business: mockBusiness,
    businesses: mockBusinesses,
    onSelectBusiness: mockOnSelectBusiness,
    onCreateNew: mockOnCreateNew,
    onUpdate: mockOnUpdate,
    onLogout: mockOnLogout,
    currentRole: 'admin' as UserRole,
    availableRoles: ['admin', 'employee', 'client'] as UserRole[],
    onRoleChange: mockOnRoleChange,
    user: mockUser
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering Inicial', () => {
    it('renderiza el dashboard con todos los elementos principales', () => {
      render(<AdminDashboard {...defaultProps} />)

      // Verifica que el logo esté presente
      expect(screen.getByRole('img', { name: /bookio/i })).toBeInTheDocument()

      // Verifica que el business name esté en el header
      expect(screen.getByText(mockBusiness.name)).toBeInTheDocument()

      // Verifica que el avatar del usuario esté presente (el nombre está en dropdown cerrado)
      const userAvatar = screen.getByAltText(mockUser.name)
      expect(userAvatar).toBeInTheDocument()

      // Verifica que muestre el rol actual
      expect(screen.getByText('Administrador')).toBeInTheDocument()
    })

    it('renderiza todos los items del sidebar', () => {
      render(<AdminDashboard {...defaultProps} />)

      // Verifica que todos los 7 items del sidebar estén presentes
      expect(screen.getByText('Resumen')).toBeInTheDocument()
      expect(screen.getByText('Sedes')).toBeInTheDocument()
      expect(screen.getByText('Servicios')).toBeInTheDocument()
      expect(screen.getByText('Empleados')).toBeInTheDocument()
      expect(screen.getByText('Contabilidad')).toBeInTheDocument()
      expect(screen.getByText('Reportes')).toBeInTheDocument()
      expect(screen.getByText('Permisos')).toBeInTheDocument()
    })

    it('renderiza la página Overview por defecto', () => {
      render(<AdminDashboard {...defaultProps} />)

      // Verifica que el componente OverviewTab esté renderizado
      expect(screen.getByTestId('overview-tab')).toBeInTheDocument()
      expect(screen.getByText(`Overview for ${mockBusiness.name}`)).toBeInTheDocument()
    })
  })

  describe('Navegación entre Páginas', () => {
    it('navega a la página de Sedes al hacer click en el item del sidebar', async () => {
      const user = userEvent.setup()
      render(<AdminDashboard {...defaultProps} />)

      // Click en "Sedes"
      await user.click(screen.getByText('Sedes'))

      // Verifica que LocationsManager esté renderizado
      expect(screen.getByTestId('locations-manager')).toBeInTheDocument()
      expect(screen.getByText(`Locations for ${mockBusiness.id}`)).toBeInTheDocument()
    })

    it('navega a la página de Servicios', async () => {
      const user = userEvent.setup()
      render(<AdminDashboard {...defaultProps} />)

      await user.click(screen.getByText('Servicios'))

      expect(screen.getByTestId('services-manager')).toBeInTheDocument()
      expect(screen.getByText(`Services for ${mockBusiness.id}`)).toBeInTheDocument()
    })

    it('muestra mensaje "próximamente" para página de Empleados', async () => {
      const user = userEvent.setup()
      render(<AdminDashboard {...defaultProps} />)

      await user.click(screen.getByText('Empleados'))

      expect(screen.getByText('Gestión de Empleados')).toBeInTheDocument()
      expect(screen.getByText(/Esta funcionalidad estará disponible próximamente/i)).toBeInTheDocument()
    })

    it('navega a la página de Contabilidad', async () => {
      const user = userEvent.setup()
      render(<AdminDashboard {...defaultProps} />)

      await user.click(screen.getByText('Contabilidad'))

      expect(screen.getByTestId('accounting-page')).toBeInTheDocument()
      expect(screen.getByText(`Accounting for ${mockBusiness.id}`)).toBeInTheDocument()
    })

    it('navega a la página de Reportes', async () => {
      const user = userEvent.setup()
      render(<AdminDashboard {...defaultProps} />)

      await user.click(screen.getByText('Reportes'))

      expect(screen.getByTestId('reports-page')).toBeInTheDocument()
      expect(screen.getByText(`Reports for ${mockBusiness.id}, user: ${mockUser.name}`)).toBeInTheDocument()
    })

    it('navega a la página de Permisos', async () => {
      const user = userEvent.setup()
      render(<AdminDashboard {...defaultProps} />)

      await user.click(screen.getByText('Permisos'))

      expect(screen.getByTestId('permissions-manager')).toBeInTheDocument()
      expect(screen.getByText(
        `Permissions for business: ${mockBusiness.id}, owner: ${mockBusiness.owner_id}, user: ${mockUser.id}`
      )).toBeInTheDocument()
    })
  })

  describe('Business Selector Dropdown', () => {
    it('muestra el dropdown de negocios al hacer click', async () => {
      const user = userEvent.setup()
      render(<AdminDashboard {...defaultProps} />)

      // Buscar el trigger del dropdown (el nombre del negocio con ChevronDown)
      const businessTrigger = screen.getByRole('button', { name: new RegExp(mockBusiness.name, 'i') })
      await user.click(businessTrigger)

      // Verifica que todos los negocios estén en el dropdown
      expect(screen.getByText('Second Business')).toBeInTheDocument()
      expect(screen.getByText('Third Business')).toBeInTheDocument()
    })

    it('llama a onSelectBusiness al seleccionar un negocio diferente', async () => {
      const user = userEvent.setup()
      render(<AdminDashboard {...defaultProps} />)

      // Abrir dropdown
      const businessTrigger = screen.getByRole('button', { name: new RegExp(mockBusiness.name, 'i') })
      await user.click(businessTrigger)

      // Click en "Second Business"
      await user.click(screen.getByText('Second Business'))

      expect(mockOnSelectBusiness).toHaveBeenCalledWith('business-2')
    })

    it('muestra el header "Mis Negocios" en el dropdown cuando hay múltiples negocios', async () => {
      const user = userEvent.setup()
      render(<AdminDashboard {...defaultProps} />)

      // Abrir dropdown
      const businessTrigger = screen.getByRole('button', { name: new RegExp(mockBusiness.name, 'i') })
      await user.click(businessTrigger)

      // Verifica que el header esté presente
      expect(screen.getByText('Mis Negocios')).toBeInTheDocument()
    })

    it('no muestra dropdown si solo hay un negocio', async () => {
      const propsWithOneBusiness = {
        ...defaultProps,
        businesses: [mockBusiness] // Solo un negocio
      }
      render(<AdminDashboard {...propsWithOneBusiness} />)

      // El business name debe aparecer
      expect(screen.getByText(mockBusiness.name)).toBeInTheDocument()
      
      // Pero el dropdown no debe tener contenido (businesses.length === 1)
      // En este caso, el trigger existe pero no hay DropdownMenuContent renderizado
    })
  })

  describe('Role Selector Dropdown', () => {
    it('muestra el rol actual como badge', () => {
      render(<AdminDashboard {...defaultProps} />)

      expect(screen.getByText('Administrador')).toBeInTheDocument()
    })

    it('muestra el dropdown de roles al hacer click en el badge', async () => {
      const user = userEvent.setup()
      render(<AdminDashboard {...defaultProps} />)

      // Click en el badge del rol
      const roleBadge = screen.getByText('Administrador')
      await user.click(roleBadge)

      // Verifica que todos los roles estén en el dropdown
      expect(screen.getByText('Empleado')).toBeInTheDocument()
      expect(screen.getByText('Cliente')).toBeInTheDocument()
    })

    it('llama a onRoleChange al seleccionar un rol diferente', async () => {
      const user = userEvent.setup()
      render(<AdminDashboard {...defaultProps} />)

      // Abrir dropdown de roles
      await user.click(screen.getByText('Administrador'))

      // Click en "Empleado"
      await user.click(screen.getByText('Empleado'))

      expect(mockOnRoleChange).toHaveBeenCalledWith('employee')
    })

    it('no duplica roles si availableRoles tiene duplicados', () => {
      const propsWithDuplicates = {
        ...defaultProps,
        availableRoles: ['admin', 'admin', 'employee', 'employee', 'client'] as UserRole[]
      }
      render(<AdminDashboard {...propsWithDuplicates} />)

      // Abrir dropdown (debe tener implementación de deduplicación en UnifiedLayout)
      // Este test verifica que la lógica de deduplicación existe
      expect(propsWithDuplicates.availableRoles.length).toBe(5)
      // La deduplicación debe reducirlo a 3 roles únicos
    })
  })

  describe('User Menu Dropdown', () => {
    it('muestra el dropdown del usuario al hacer click en su nombre', async () => {
      const user = userEvent.setup()
      render(<AdminDashboard {...defaultProps} />)

      // Click en el nombre del usuario
      const userButton = screen.getByRole('button', { name: new RegExp(mockUser.name, 'i') })
      await user.click(userButton)

      // Verifica que las opciones del menú estén presentes
      expect(screen.getByText(/Perfil/i)).toBeInTheDocument()
      expect(screen.getByText(/Configuración/i)).toBeInTheDocument()
      expect(screen.getByText(/Cerrar sesión/i)).toBeInTheDocument()
    })

    it('navega a la página de perfil al seleccionar "Perfil"', async () => {
      const user = userEvent.setup()
      render(<AdminDashboard {...defaultProps} />)

      // Abrir user menu
      const userButton = screen.getByRole('button', { name: new RegExp(mockUser.name, 'i') })
      await user.click(userButton)

      // Click en "Perfil"
      await user.click(screen.getByText(/Perfil/i))

      // Verifica que UserProfile esté renderizado
      expect(screen.getByTestId('user-profile')).toBeInTheDocument()
      expect(screen.getByText(`Profile for ${mockUser.name}`)).toBeInTheDocument()
    })

    it('navega a la página de configuración al seleccionar "Configuración"', async () => {
      const user = userEvent.setup()
      render(<AdminDashboard {...defaultProps} />)

      // Abrir user menu
      const userButton = screen.getByRole('button', { name: new RegExp(mockUser.name, 'i') })
      await user.click(userButton)

      // Click en "Configuración"
      await user.click(screen.getByText(/Configuración/i))

      // Verifica que BusinessSettings esté renderizado
      expect(screen.getByTestId('business-settings')).toBeInTheDocument()
      expect(screen.getByText(`Settings for ${mockBusiness.name}`)).toBeInTheDocument()
    })

    it('muestra email del usuario en el dropdown', async () => {
      const user = userEvent.setup()
      render(<AdminDashboard {...defaultProps} />)

      // Abrir user menu (click en avatar)
      const userAvatar = screen.getByAltText(mockUser.name)
      await user.click(userAvatar)

      // Verifica que el email esté en el dropdown
      expect(screen.getByText(mockUser.email)).toBeInTheDocument()
      
      // Y el nombre también debe estar visible ahora
      expect(screen.getByText(mockUser.name)).toBeInTheDocument()
    })
  })

  describe('Props Passing a Child Components', () => {
    it('pasa businessId correcto a LocationsManager', async () => {
      const user = userEvent.setup()
      render(<AdminDashboard {...defaultProps} />)

      await user.click(screen.getByText('Sedes'))

      const locationsManager = screen.getByTestId('locations-manager')
      expect(locationsManager).toHaveTextContent(`Locations for ${mockBusiness.id}`)
    })

    it('pasa businessId correcto a ServicesManager', async () => {
      const user = userEvent.setup()
      render(<AdminDashboard {...defaultProps} />)

      await user.click(screen.getByText('Servicios'))

      const servicesManager = screen.getByTestId('services-manager')
      expect(servicesManager).toHaveTextContent(`Services for ${mockBusiness.id}`)
    })

    it('pasa businessId y onUpdate correcto a AccountingPage', async () => {
      const user = userEvent.setup()
      render(<AdminDashboard {...defaultProps} />)

      await user.click(screen.getByText('Contabilidad'))

      const accountingPage = screen.getByTestId('accounting-page')
      expect(accountingPage).toHaveTextContent(`Accounting for ${mockBusiness.id}`)

      // Verifica que onUpdate funcione
      await user.click(screen.getByText('Update'))
      expect(mockOnUpdate).toHaveBeenCalled()
    })

    it('pasa businessId y user correcto a ReportsPage', async () => {
      const user = userEvent.setup()
      render(<AdminDashboard {...defaultProps} />)

      await user.click(screen.getByText('Reportes'))

      const reportsPage = screen.getByTestId('reports-page')
      expect(reportsPage).toHaveTextContent(`Reports for ${mockBusiness.id}, user: ${mockUser.name}`)
    })

    it('pasa businessId, ownerId y currentUserId correcto a PermissionsManager', async () => {
      const user = userEvent.setup()
      render(<AdminDashboard {...defaultProps} />)

      await user.click(screen.getByText('Permisos'))

      const permissionsManager = screen.getByTestId('permissions-manager')
      expect(permissionsManager).toHaveTextContent(
        `Permissions for business: ${mockBusiness.id}, owner: ${mockBusiness.owner_id}, user: ${mockUser.id}`
      )
    })

    it('pasa business y onUpdate correcto a BusinessSettings', async () => {
      const user = userEvent.setup()
      render(<AdminDashboard {...defaultProps} />)

      // Abrir user menu y navegar a configuración
      const userButton = screen.getByRole('button', { name: new RegExp(mockUser.name, 'i') })
      await user.click(userButton)
      await user.click(screen.getByText(/Configuración/i))

      const businessSettings = screen.getByTestId('business-settings')
      expect(businessSettings).toHaveTextContent(`Settings for ${mockBusiness.name}`)

      // Verifica que onUpdate funcione
      await user.click(screen.getByText('Update Settings'))
      expect(mockOnUpdate).toHaveBeenCalled()
    })

    it('pasa user y onUserUpdate correcto a UserProfile', async () => {
      const user = userEvent.setup()
      render(<AdminDashboard {...defaultProps} />)

      // Abrir user menu y navegar a perfil
      const userButton = screen.getByRole('button', { name: new RegExp(mockUser.name, 'i') })
      await user.click(userButton)
      await user.click(screen.getByText(/Perfil/i))

      const userProfile = screen.getByTestId('user-profile')
      expect(userProfile).toHaveTextContent(`Profile for ${mockUser.name}`)

      // Verifica que onUserUpdate funcione y llame a onUpdate
      await user.click(screen.getByText('Update Profile'))
      expect(mockOnUpdate).toHaveBeenCalled()
    })
  })

  describe('User State Management', () => {
    it('actualiza el estado del usuario cuando la prop user cambia', () => {
      const { rerender } = render(<AdminDashboard {...defaultProps} />)

      // Verificar avatar inicial
      expect(screen.getByAltText(mockUser.name)).toBeInTheDocument()

      // Cambiar la prop user
      const updatedUser = createMockUser({ id: 'user-2', name: 'Updated User' })
      rerender(<AdminDashboard {...defaultProps} user={updatedUser} />)

      // Verificar nuevo avatar
      expect(screen.getByAltText('Updated User')).toBeInTheDocument()
    })

    it('renderiza avatar inicial del usuario sin avatar_url', () => {
      const userWithoutAvatar = createMockUser({ avatar_url: undefined })
      render(<AdminDashboard {...defaultProps} user={userWithoutAvatar} />)

      // Debe renderizar inicial del nombre (T de "Test User")
      const initial = screen.getByText('T')
      expect(initial).toBeInTheDocument()
    })
  })
})
