// =====================================================
// TESTS: PermissionTemplates Component
// Gestión de plantillas de permisos (sistema y custom)
// =====================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PermissionTemplates } from '../PermissionTemplates'
import * as usePermissionsModule from '@/hooks/usePermissions-v2'
import type { PermissionTemplate, Permission } from '@/types/types'

// =====================================================
// MOCKS
// =====================================================

// Mock usePermissions hook
vi.mock('@/hooks/usePermissions-v2', () => ({
  usePermissions: vi.fn(),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

// Mock window.confirm
const originalConfirm = window.confirm
beforeEach(() => {
  window.confirm = vi.fn(() => true)
})

afterEach(() => {
  window.confirm = originalConfirm
})

// =====================================================
// HELPERS
// =====================================================

function createMockTemplate(
  overrides: Partial<PermissionTemplate> = {}
): PermissionTemplate {
  return {
    id: `template-${Date.now()}`,
    business_id: 'business-123',
    name: 'Manager Template',
    description: 'Full access manager',
    role: 'admin',
    permissions: ['appointments.view_all', 'appointments.create'] as Permission[],
    is_system_template: false,
    created_by: 'owner-456',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

function mockUsePermissions(
  overrides?: Partial<ReturnType<typeof usePermissionsModule.usePermissions>>
): ReturnType<typeof usePermissionsModule.usePermissions> {
  return {
    isLoading: false,
    isOwner: true,
    isAdmin: false,
    isEmployee: false,
    role: null,
    canOfferServices: false,
    businessRoles: [],
    permissions: [],
    templates: [],
    auditLog: [],
    grantPermission: vi.fn(),
    revokePermission: vi.fn(),
    createTemplate: vi.fn(),
    updateTemplate: vi.fn(),
    deleteTemplate: vi.fn(),
    applyTemplate: vi.fn(),
    assignRole: vi.fn(),
    revokeRole: vi.fn(),
    isGrantingPermission: false,
    isRevokingPermission: false,
    isCreatingTemplate: false,
    isUpdatingTemplate: false,
    isDeletingTemplate: false,
    isApplyingTemplate: false,
    isAssigningRole: false,
    isRevokingRole: false,
    ...overrides,
  } as ReturnType<typeof usePermissionsModule.usePermissions>
}

function renderWithProviders(ui: React.ReactElement) {
  return render(ui)
}

// =====================================================
// TESTS: RENDER Y ESTADOS
// =====================================================

describe('PermissionTemplates - Render y Estados', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions()
    )
  })

  it('renderiza tabs de Sistema y Personalizadas', () => {
    renderWithProviders(
      <PermissionTemplates
        businessId="business-123"
        ownerId="owner-456"
        currentUserId="user-789"
      />
    )

    expect(screen.getByRole('tab', { name: /Plantillas del Sistema/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Plantillas Personalizadas/i })).toBeInTheDocument()
  })

  it('muestra estado de carga cuando isLoading es true', () => {
    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({ isLoading: true })
    )

    const { container } = renderWithProviders(
      <PermissionTemplates
        businessId="business-123"
        ownerId="owner-456"
        currentUserId="user-789"
      />
    )

    // Debe haber un spinner de carga (Loader2 con clase animate-spin)
    const spinner = container.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('muestra mensaje cuando no hay plantillas del sistema', () => {
    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({ templates: [] })
    )

    renderWithProviders(
      <PermissionTemplates
        businessId="business-123"
        ownerId="owner-456"
        currentUserId="user-789"
      />
    )

    expect(screen.getByText(/No hay plantillas del sistema disponibles/i)).toBeInTheDocument()
  })

  it('muestra mensaje y botón cuando no hay plantillas personalizadas', async () => {
    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({ templates: [] })
    )

    renderWithProviders(
      <PermissionTemplates
        businessId="business-123"
        ownerId="owner-456"
        currentUserId="user-789"
      />
    )

    // Cambiar a tab Custom
    const customTab = screen.getByRole('tab', { name: /Plantillas Personalizadas/i })
    await userEvent.click(customTab)

    expect(screen.getByText(/No hay plantillas personalizadas/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Crear Primera Plantilla/i })).toBeInTheDocument()
  })
})

// =====================================================
// TESTS: PLANTILLAS DEL SISTEMA
// =====================================================

describe('PermissionTemplates - Plantillas del Sistema', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza plantillas del sistema correctamente', () => {
    const systemTemplates = [
      createMockTemplate({
        id: 'sys-1',
        name: 'Gerente',
        description: 'Acceso completo de gerencia',
        is_system_template: true,
        role: 'admin',
      }),
      createMockTemplate({
        id: 'sys-2',
        name: 'Recepcionista',
        description: 'Gestión de citas básica',
        is_system_template: true,
        role: 'employee',
      }),
    ]

    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({ templates: systemTemplates })
    )

    renderWithProviders(
      <PermissionTemplates
        businessId="business-123"
        ownerId="owner-456"
        currentUserId="user-789"
      />
    )

    expect(screen.getByText('Gerente')).toBeInTheDocument()
    expect(screen.getByText('Recepcionista')).toBeInTheDocument()
  })

  it('muestra badge "Sistema" en plantillas del sistema', () => {
    const systemTemplate = createMockTemplate({
      id: 'sys-1',
      name: 'Gerente',
      is_system_template: true,
    })

    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({ templates: [systemTemplate] })
    )

    renderWithProviders(
      <PermissionTemplates
        businessId="business-123"
        ownerId="owner-456"
        currentUserId="user-789"
      />
    )

    // Badge "Sistema" está dentro de la card de la plantilla "Gerente"
    const gerenteCard = screen.getByText('Gerente').closest('div[class*="rounded"]') as HTMLElement
    expect(gerenteCard).toBeInTheDocument()
    expect(within(gerenteCard).getByText(/Sistema/i)).toBeInTheDocument()
  })

  it('plantillas del sistema NO tienen botones de editar/eliminar', () => {
    const systemTemplate = createMockTemplate({
      id: 'sys-1',
      name: 'Gerente',
      is_system_template: true,
    })

    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({ templates: [systemTemplate] })
    )

    renderWithProviders(
      <PermissionTemplates
        businessId="business-123"
        ownerId="owner-456"
        currentUserId="user-789"
      />
    )

    // Debe tener botón "Aplicar Plantilla"
    expect(screen.getByRole('button', { name: /Aplicar Plantilla/i })).toBeInTheDocument()

    // NO debe tener botones de editar/eliminar
    expect(screen.queryByRole('button', { name: /Editar/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Eliminar/i })).not.toBeInTheDocument()
  })

  it('muestra contador de permisos en plantillas del sistema', () => {
    const systemTemplate = createMockTemplate({
      id: 'sys-1',
      name: 'Gerente',
      permissions: [
        'appointments.view_all',
        'appointments.create',
        'appointments.edit',
      ] as Permission[],
      is_system_template: true,
    })

    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({ templates: [systemTemplate] })
    )

    renderWithProviders(
      <PermissionTemplates
        businessId="business-123"
        ownerId="owner-456"
        currentUserId="user-789"
      />
    )

    expect(screen.getByText(/3 permisos incluidos/i)).toBeInTheDocument()
  })
})

// =====================================================
// TESTS: PLANTILLAS PERSONALIZADAS
// =====================================================

describe('PermissionTemplates - Plantillas Personalizadas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza plantillas personalizadas en tab Custom', async () => {
    const customTemplates = [
      createMockTemplate({
        id: 'custom-1',
        name: 'Mi Plantilla',
        description: 'Plantilla personalizada',
        is_system_template: false,
      }),
    ]

    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({ templates: customTemplates })
    )

    renderWithProviders(
      <PermissionTemplates
        businessId="business-123"
        ownerId="owner-456"
        currentUserId="user-789"
      />
    )

    // Cambiar a tab Custom
    const customTab = screen.getByRole('tab', { name: /Plantillas Personalizadas/i })
    await userEvent.click(customTab)

    expect(screen.getByText('Mi Plantilla')).toBeInTheDocument()
  })

  it('plantillas personalizadas tienen botones de editar y eliminar', async () => {
    const customTemplate = createMockTemplate({
      id: 'custom-1',
      name: 'Mi Plantilla',
      is_system_template: false,
    })

    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({ templates: [customTemplate] })
    )

    renderWithProviders(
      <PermissionTemplates
        businessId="business-123"
        ownerId="owner-456"
        currentUserId="user-789"
      />
    )

    // Cambiar a tab Custom
    const customTab = screen.getByRole('tab', { name: /Plantillas Personalizadas/i })
    await userEvent.click(customTab)

    // Debe tener los 3 botones: Aplicar, Editar (Edit icon), Eliminar (Trash2 icon)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(2) // Al menos Aplicar + Editar + Eliminar
  })

  it('muestra botón "Nueva Plantilla" en tab Custom', async () => {
    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({ templates: [] })
    )

    renderWithProviders(
      <PermissionTemplates
        businessId="business-123"
        ownerId="owner-456"
        currentUserId="user-789"
      />
    )

    // Cambiar a tab Custom
    const customTab = screen.getByRole('tab', { name: /Plantillas Personalizadas/i })
    await userEvent.click(customTab)

    const newButton = screen.getByRole('button', { name: /Nueva Plantilla/i })
    expect(newButton).toBeInTheDocument()
  })

  it('NO muestra badge "Sistema" en plantillas personalizadas', async () => {
    const customTemplate = createMockTemplate({
      id: 'custom-1',
      name: 'Mi Plantilla',
      is_system_template: false,
    })

    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({ templates: [customTemplate] })
    )

    renderWithProviders(
      <PermissionTemplates
        businessId="business-123"
        ownerId="owner-456"
        currentUserId="user-789"
      />
    )

    // Cambiar a tab Custom
    const customTab = screen.getByRole('tab', { name: /Plantillas Personalizadas/i })
    await userEvent.click(customTab)

    // Badge "Sistema" solo debe aparecer en tab Sistema, no en Custom
    const customTabPanel = screen.getByRole('tabpanel')
    expect(within(customTabPanel).queryByText(/Sistema/i)).not.toBeInTheDocument()
  })
})

// =====================================================
// TESTS: MODAL CREAR PLANTILLA
// =====================================================

describe('PermissionTemplates - Modal Crear Plantilla', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({ templates: [] })
    )
  })

  it('abre modal al hacer click en "Nueva Plantilla"', async () => {
    renderWithProviders(
      <PermissionTemplates
        businessId="business-123"
        ownerId="owner-456"
        currentUserId="user-789"
      />
    )

    // Cambiar a tab Custom
    const customTab = screen.getByRole('tab', { name: /Plantillas Personalizadas/i })
    await userEvent.click(customTab)

    // Click en "Nueva Plantilla" (hay 2, uno en header y uno en empty state, cliqueamos el primero)
    const newButtons = screen.getAllByRole('button', { name: /Nueva Plantilla/i })
    await userEvent.click(newButtons[0])

    // Modal debe abrirse con título "Nueva Plantilla" dentro del dialog
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Nueva Plantilla')).toBeInTheDocument()
  })

  it('modal contiene campos de nombre, descripción y rol', async () => {
    renderWithProviders(
      <PermissionTemplates
        businessId="business-123"
        ownerId="owner-456"
        currentUserId="user-789"
      />
    )

    // Cambiar a tab Custom y abrir modal
    const customTab = screen.getByRole('tab', { name: /Plantillas Personalizadas/i })
    await userEvent.click(customTab)
    const newButtons = screen.getAllByRole('button', { name: /Nueva Plantilla/i })
    await userEvent.click(newButtons[0])

    // Esperar a que el modal esté abierto y buscar campos dentro del dialog
    const dialog = await screen.findByRole('dialog')
    
    await waitFor(() => {
      expect(within(dialog).getByLabelText(/Nombre de la plantilla/i)).toBeInTheDocument()
    })
    expect(within(dialog).getByLabelText(/Descripción/i)).toBeInTheDocument()
    expect(within(dialog).getByLabelText(/Administrador/i)).toBeInTheDocument()
    // Para "Empleado" hay 2: uno en el tab y otro en el radio button del modal
    const empleadoLabels = within(dialog).getAllByText(/Empleado/i)
    expect(empleadoLabels.length).toBeGreaterThan(0)
  })

  it('llama a createTemplate al guardar con datos válidos', async () => {
    const createTemplateMock = vi.fn((_, callbacks) => {
      callbacks?.onSuccess?.()
    })

    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({ templates: [], createTemplate: createTemplateMock })
    )

    renderWithProviders(
      <PermissionTemplates
        businessId="business-123"
        ownerId="owner-456"
        currentUserId="user-789"
      />
    )

    // Abrir modal
    const customTab = screen.getByRole('tab', { name: /Plantillas Personalizadas/i })
    await userEvent.click(customTab)
    const newButton = screen.getByRole('button', { name: /Nueva Plantilla/i })
    await userEvent.click(newButton)

    // Llenar formulario
    await waitFor(() => {
      expect(screen.getByLabelText(/Nombre de la plantilla/i)).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(/Nombre de la plantilla/i)
    await userEvent.type(nameInput, 'Mi Nueva Plantilla')

    const descInput = screen.getByLabelText(/Descripción/i)
    await userEvent.type(descInput, 'Descripción de prueba')

    // Seleccionar al menos 1 permiso (expandir accordion y clickear checkbox)
    // Por defecto NO hay accordions expandidos, necesitamos expandir uno
    const accordionTriggers = screen.getAllByRole('button', { name: /\// }) // Buscar triggers con formato "X / Y"
    if (accordionTriggers.length > 0) {
      await userEvent.click(accordionTriggers[0])
    }

    // Esperar a que aparezca un checkbox de permiso
    const permissionCheckboxes = await screen.findAllByRole('checkbox')
    const firstPermissionCheckbox = permissionCheckboxes.find(
      (cb) => cb.id?.startsWith('new-')
    )
    if (firstPermissionCheckbox) {
      await userEvent.click(firstPermissionCheckbox)
    }

    // Click en "Crear Plantilla"
    const createButton = screen.getByRole('button', { name: /Crear Plantilla/i })
    await userEvent.click(createButton)

    // Debe llamar a createTemplate
    await waitFor(() => {
      expect(createTemplateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Mi Nueva Plantilla',
          description: 'Descripción de prueba',
        }),
        expect.any(Object)
      )
    })
  })

  it('muestra error si intenta guardar sin nombre', async () => {
    const { toast } = await import('sonner')

    renderWithProviders(
      <PermissionTemplates
        businessId="business-123"
        ownerId="owner-456"
        currentUserId="user-789"
      />
    )

    // Abrir modal
    const customTab = screen.getByRole('tab', { name: /Plantillas Personalizadas/i })
    await userEvent.click(customTab)
    const newButton = screen.getByRole('button', { name: /Nueva Plantilla/i })
    await userEvent.click(newButton)

    // NO llenar nombre, click en Crear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Crear Plantilla/i })).toBeInTheDocument()
    })

    const createButton = screen.getByRole('button', { name: /Crear Plantilla/i })
    await userEvent.click(createButton)

    // Debe mostrar toast de error
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('El nombre es requerido')
    })
  })

  it('muestra error si intenta guardar sin permisos', async () => {
    const { toast } = await import('sonner')

    renderWithProviders(
      <PermissionTemplates
        businessId="business-123"
        ownerId="owner-456"
        currentUserId="user-789"
      />
    )

    // Abrir modal
    const customTab = screen.getByRole('tab', { name: /Plantillas Personalizadas/i })
    await userEvent.click(customTab)
    const newButton = screen.getByRole('button', { name: /Nueva Plantilla/i })
    await userEvent.click(newButton)

    // Llenar solo nombre (sin seleccionar permisos)
    await waitFor(() => {
      expect(screen.getByLabelText(/Nombre de la plantilla/i)).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(/Nombre de la plantilla/i)
    await userEvent.type(nameInput, 'Plantilla Sin Permisos')

    // Click en Crear
    const createButton = screen.getByRole('button', { name: /Crear Plantilla/i })
    await userEvent.click(createButton)

    // Debe mostrar toast de error
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Debes seleccionar al menos un permiso')
    })
  })
})

// =====================================================
// TESTS: ELIMINAR PLANTILLA
// =====================================================

describe('PermissionTemplates - Eliminar Plantilla', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.confirm = vi.fn(() => true) // Confirmar eliminación por defecto
  })

  it('solicita confirmación antes de eliminar', async () => {
    const customTemplate = createMockTemplate({
      id: 'custom-1',
      name: 'Plantilla a Eliminar',
      is_system_template: false,
    })

    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({ templates: [customTemplate] })
    )

    renderWithProviders(
      <PermissionTemplates
        businessId="business-123"
        ownerId="owner-456"
        currentUserId="user-789"
      />
    )

    // Cambiar a tab Custom
    const customTab = screen.getByRole('tab', { name: /Plantillas Personalizadas/i })
    await userEvent.click(customTab)

    // Click en botón eliminar (Trash2 icon - último botón)
    const buttons = screen.getAllByRole('button')
    const deleteButton = buttons[buttons.length - 1] // Último botón es delete
    await userEvent.click(deleteButton)

    // Debe solicitar confirmación
    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining('Eliminar la plantilla "Plantilla a Eliminar"')
    )
  })

  it('llama a deleteTemplate si usuario confirma', async () => {
    const deleteTemplateMock = vi.fn((_, callbacks) => {
      callbacks?.onSuccess?.()
    })

    const customTemplate = createMockTemplate({
      id: 'custom-1',
      name: 'Plantilla a Eliminar',
      is_system_template: false,
    })

    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({
        templates: [customTemplate],
        deleteTemplate: deleteTemplateMock,
      })
    )

    renderWithProviders(
      <PermissionTemplates
        businessId="business-123"
        ownerId="owner-456"
        currentUserId="user-789"
      />
    )

    // Cambiar a tab Custom
    const customTab = screen.getByRole('tab', { name: /Plantillas Personalizadas/i })
    await userEvent.click(customTab)

    // Click en botón eliminar
    const buttons = screen.getAllByRole('button')
    const deleteButton = buttons[buttons.length - 1]
    await userEvent.click(deleteButton)

    // Debe llamar a deleteTemplate con el ID correcto
    await waitFor(() => {
      expect(deleteTemplateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          templateId: 'custom-1',
        }),
        expect.any(Object)
      )
    })
  })

  it('NO llama a deleteTemplate si usuario cancela', async () => {
    window.confirm = vi.fn(() => false) // Usuario cancela

    const deleteTemplateMock = vi.fn()

    const customTemplate = createMockTemplate({
      id: 'custom-1',
      name: 'Plantilla a Eliminar',
      is_system_template: false,
    })

    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({
        templates: [customTemplate],
        deleteTemplate: deleteTemplateMock,
      })
    )

    renderWithProviders(
      <PermissionTemplates
        businessId="business-123"
        ownerId="owner-456"
        currentUserId="user-789"
      />
    )

    // Cambiar a tab Custom
    const customTab = screen.getByRole('tab', { name: /Plantillas Personalizadas/i })
    await userEvent.click(customTab)

    // Click en botón eliminar
    const buttons = screen.getAllByRole('button')
    const deleteButton = buttons[buttons.length - 1]
    await userEvent.click(deleteButton)

    // NO debe llamar a deleteTemplate
    expect(deleteTemplateMock).not.toHaveBeenCalled()
  })
})

// =====================================================
// TESTS: RESTRICCIONES DE PERMISOS
// =====================================================

describe('PermissionTemplates - Restricciones de Permisos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deshabilita botones de crear/editar/eliminar si usuario NO es owner', async () => {
    const customTemplate = createMockTemplate({
      id: 'custom-1',
      name: 'Mi Plantilla',
      is_system_template: false,
    })

    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({
        templates: [customTemplate],
        isOwner: false, // NO es owner
      })
    )

    renderWithProviders(
      <PermissionTemplates
        businessId="business-123"
        ownerId="owner-456"
        currentUserId="user-789"
      />
    )

    // Cambiar a tab Custom
    const customTab = screen.getByRole('tab', { name: /Plantillas Personalizadas/i })
    await userEvent.click(customTab)

    // Botón "Nueva Plantilla" debe estar disabled
    const newButton = screen.getByRole('button', { name: /Nueva Plantilla/i })
    expect(newButton).toBeDisabled()

    // Botones de la card también deben estar disabled
    const applyButton = screen.getByRole('button', { name: /Aplicar Plantilla/i })
    expect(applyButton).toBeDisabled()
  })

  it('habilita todos los botones si usuario es owner', async () => {
    const customTemplate = createMockTemplate({
      id: 'custom-1',
      name: 'Mi Plantilla',
      is_system_template: false,
    })

    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({
        templates: [customTemplate],
        isOwner: true, // ES owner
      })
    )

    renderWithProviders(
      <PermissionTemplates
        businessId="business-123"
        ownerId="owner-456"
        currentUserId="user-789"
      />
    )

    // Cambiar a tab Custom
    const customTab = screen.getByRole('tab', { name: /Plantillas Personalizadas/i })
    await userEvent.click(customTab)

    // Botón "Nueva Plantilla" debe estar enabled
    const newButton = screen.getByRole('button', { name: /Nueva Plantilla/i })
    expect(newButton).not.toBeDisabled()

    // Botones de la card también deben estar enabled
    const applyButton = screen.getByRole('button', { name: /Aplicar Plantilla/i })
    expect(applyButton).not.toBeDisabled()
  })
})
