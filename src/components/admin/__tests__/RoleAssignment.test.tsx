// =====================================================
// TESTS: RoleAssignment.tsx
// Modal de asignación/modificación de roles
// Fecha: 13 de Octubre de 2025
// =====================================================

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RoleAssignment } from '@/components/admin/RoleAssignment'
import { usePermissions } from '@/hooks/usePermissions-v2'
import type { BusinessRole } from '@/types/types'

// =====================================================
// MOCKS
// =====================================================

vi.mock('@/hooks/usePermissions-v2', () => ({
  usePermissions: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// =====================================================
// HELPERS
// =====================================================

/**
 * Mock de BusinessRole
 */
function createMockBusinessRole(overrides?: Partial<BusinessRole>): BusinessRole {
  return {
    id: 'role-123',
    business_id: 'business-123',
    user_id: 'user-123',
    role: 'employee',
    employee_type: 'service_provider',
    assigned_by: 'owner-123',
    assigned_at: new Date().toISOString(),
    is_active: true,
    notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Mock exitoso de usePermissions
 */
function mockUsePermissions(overrides?: Partial<ReturnType<typeof usePermissions>>) {
  const defaultMock: Partial<ReturnType<typeof usePermissions>> = {
    isOwner: false,
    assignRole: vi.fn(),
    revokeRole: vi.fn(),
    isAssigningRole: false,
    isRevokingRole: false,
  }

  vi.mocked(usePermissions).mockReturnValue({
    ...defaultMock,
    ...overrides,
  } as ReturnType<typeof usePermissions>)
}

// =====================================================
// TESTS: RENDER Y ESTADOS
// =====================================================

describe('RoleAssignment - Render y Estados', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza modal cerrado cuando isOpen es false', () => {
    mockUsePermissions()

    render(
      <RoleAssignment
        businessId="business-123"
        ownerId="owner-123"
        currentUserId="admin-123"
        userId="user-123"
        userName="Juan Pérez"
        userEmail="juan@example.com"
        isOpen={false}
        onClose={vi.fn()}
      />
    )

    // El modal no debe estar visible
    expect(screen.queryByText('Asignar Rol')).not.toBeInTheDocument()
  })

  it('renderiza modal abierto cuando isOpen es true', () => {
    mockUsePermissions({ isOwner: true })

    render(
      <RoleAssignment
        businessId="business-123"
        ownerId="owner-123"
        currentUserId="owner-123"
        userId="user-123"
        userName="Juan Pérez"
        userEmail="juan@example.com"
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Configura el rol y permisos para Juan Pérez')).toBeInTheDocument()
  })

  it('muestra título "Modificar Rol" cuando hay currentRole', () => {
    mockUsePermissions({ isOwner: true })
    const currentRole = createMockBusinessRole()

    render(
      <RoleAssignment
        businessId="business-123"
        ownerId="owner-123"
        currentUserId="owner-123"
        userId="user-123"
        userName="Juan Pérez"
        userEmail="juan@example.com"
        currentRole={currentRole}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText('Modificar Rol')).toBeInTheDocument()
  })

  it('muestra información del usuario correctamente', () => {
    mockUsePermissions({ isOwner: true })

    render(
      <RoleAssignment
        businessId="business-123"
        ownerId="owner-123"
        currentUserId="owner-123"
        userId="user-123"
        userName="Juan Pérez"
        userEmail="juan@example.com"
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    expect(screen.getByText('juan@example.com')).toBeInTheDocument()
  })
})

// =====================================================
// TESTS: RESTRICCIÓN OWNER
// =====================================================

describe('RoleAssignment - Restricción Owner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra advertencia cuando el usuario es el owner', () => {
    mockUsePermissions({ isOwner: true })

    render(
      <RoleAssignment
        businessId="business-123"
        ownerId="owner-123"
        currentUserId="owner-123"
        userId="owner-123" // Usuario target es el owner
        userName="Owner Usuario"
        userEmail="owner@example.com"
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText('Este usuario es el propietario del negocio')).toBeInTheDocument()
    expect(
      screen.getByText(/No puedes modificar el rol del propietario del negocio/)
    ).toBeInTheDocument()
  })

  it('no muestra formulario cuando el usuario es el owner', () => {
    mockUsePermissions({ isOwner: true })

    render(
      <RoleAssignment
        businessId="business-123"
        ownerId="owner-123"
        currentUserId="owner-123"
        userId="owner-123"
        userName="Owner Usuario"
        userEmail="owner@example.com"
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    // No debe mostrar los radio buttons de rol
    expect(screen.queryByText('Rol del usuario')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Administrador')).not.toBeInTheDocument()
  })

  it('no muestra botón de guardar cuando el usuario es el owner', () => {
    mockUsePermissions({ isOwner: true })

    render(
      <RoleAssignment
        businessId="business-123"
        ownerId="owner-123"
        currentUserId="owner-123"
        userId="owner-123"
        userName="Owner Usuario"
        userEmail="owner@example.com"
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.queryByText('Asignar Rol')).toBeInTheDocument() // Título
    expect(screen.queryByRole('button', { name: /Asignar Rol/i })).not.toBeInTheDocument() // Botón
  })
})

// =====================================================
// TESTS: RESTRICCIÓN DE PERMISOS
// =====================================================

describe('RoleAssignment - Restricción de Permisos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra advertencia cuando el usuario no tiene permisos', () => {
    mockUsePermissions({ isOwner: false }) // No es owner

    render(
      <RoleAssignment
        businessId="business-123"
        ownerId="owner-123"
        currentUserId="user-456" // Usuario que no es owner
        userId="user-123"
        userName="Juan Pérez"
        userEmail="juan@example.com"
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    expect(
      screen.getByText(/No tienes permisos para modificar roles de usuario/)
    ).toBeInTheDocument()
  })

  it('no muestra formulario cuando el usuario no tiene permisos', () => {
    mockUsePermissions({ isOwner: false })

    render(
      <RoleAssignment
        businessId="business-123"
        ownerId="owner-123"
        currentUserId="user-456"
        userId="user-123"
        userName="Juan Pérez"
        userEmail="juan@example.com"
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.queryByText('Rol del usuario')).not.toBeInTheDocument()
  })
})

// =====================================================
// TESTS: SELECCIÓN DE ROL
// =====================================================

describe('RoleAssignment - Selección de Rol', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza opciones de rol correctamente', () => {
    mockUsePermissions({ isOwner: true })

    render(
      <RoleAssignment
        businessId="business-123"
        ownerId="owner-123"
        currentUserId="owner-123"
        userId="user-123"
        userName="Juan Pérez"
        userEmail="juan@example.com"
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText('Rol del usuario')).toBeInTheDocument()
    expect(screen.getByText('Administrador')).toBeInTheDocument()
    expect(screen.getByText('Empleado')).toBeInTheDocument()
  })

  it('rol employee está seleccionado por defecto', () => {
    mockUsePermissions({ isOwner: true })

    render(
      <RoleAssignment
        businessId="business-123"
        ownerId="owner-123"
        currentUserId="owner-123"
        userId="user-123"
        userName="Juan Pérez"
        userEmail="juan@example.com"
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    const employeeRadio = screen.getByRole('radio', { name: /^Empleado/ })
    expect(employeeRadio).toHaveAttribute('aria-checked', 'true')
  })

  it('muestra tipo de empleado cuando se selecciona rol employee', () => {
    mockUsePermissions({ isOwner: true })

    render(
      <RoleAssignment
        businessId="business-123"
        ownerId="owner-123"
        currentUserId="owner-123"
        userId="user-123"
        userName="Juan Pérez"
        userEmail="juan@example.com"
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByText('Tipo de empleado')).toBeInTheDocument()
    expect(screen.getByText('Presta Servicios')).toBeInTheDocument()
    expect(screen.getByText('Staff de Soporte')).toBeInTheDocument()
  })

  it('oculta tipo de empleado cuando se selecciona rol admin', async () => {
    const user = userEvent.setup()
    mockUsePermissions({ isOwner: true })

    render(
      <RoleAssignment
        businessId="business-123"
        ownerId="owner-123"
        currentUserId="owner-123"
        userId="user-123"
        userName="Juan Pérez"
        userEmail="juan@example.com"
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    // Inicialmente debe mostrar tipo de empleado
    expect(screen.getByText('Tipo de empleado')).toBeInTheDocument()

    // Click en radio admin
    await user.click(screen.getByRole('radio', { name: /Administrador/i }))

    // Ahora no debe mostrar tipo de empleado
    expect(screen.queryByText('Tipo de empleado')).not.toBeInTheDocument()
  })

  it('service_provider está seleccionado por defecto en tipo de empleado', () => {
    mockUsePermissions({ isOwner: true })

    render(
      <RoleAssignment
        businessId="business-123"
        ownerId="owner-123"
        currentUserId="owner-123"
        userId="user-123"
        userName="Juan Pérez"
        userEmail="juan@example.com"
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    const serviceProviderRadio = screen.getByRole('radio', { name: /Presta Servicios/i })
    expect(serviceProviderRadio).toBeChecked()
  })
})

// =====================================================
// TESTS: FORMULARIO
// =====================================================

describe('RoleAssignment - Formulario', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza campo de notas', () => {
    mockUsePermissions({ isOwner: true })

    render(
      <RoleAssignment
        businessId="business-123"
        ownerId="owner-123"
        currentUserId="owner-123"
        userId="user-123"
        userName="Juan Pérez"
        userEmail="juan@example.com"
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByLabelText(/Notas \(opcional\)/i)).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Razón del cambio de rol o información adicional...')
    ).toBeInTheDocument()
  })

  it('permite escribir en el campo de notas', async () => {
    const user = userEvent.setup()
    mockUsePermissions({ isOwner: true })

    render(
      <RoleAssignment
        businessId="business-123"
        ownerId="owner-123"
        currentUserId="owner-123"
        userId="user-123"
        userName="Juan Pérez"
        userEmail="juan@example.com"
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    const notesTextarea = screen.getByPlaceholderText(
      'Razón del cambio de rol o información adicional...'
    )
    await user.type(notesTextarea, 'Nueva contratación')

    expect(notesTextarea).toHaveValue('Nueva contratación')
  })

  it('renderiza botones de footer', () => {
    mockUsePermissions({ isOwner: true })

    render(
      <RoleAssignment
        businessId="business-123"
        ownerId="owner-123"
        currentUserId="owner-123"
        userId="user-123"
        userName="Juan Pérez"
        userEmail="juan@example.com"
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Asignar Rol/i })).toBeInTheDocument()
  })

  it('botón de asignar está deshabilitado si userId es null', () => {
    mockUsePermissions({ isOwner: true })

    render(
      <RoleAssignment
        businessId="business-123"
        ownerId="owner-123"
        currentUserId="owner-123"
        userId={null} // Sin usuario seleccionado
        userName="Juan Pérez"
        userEmail="juan@example.com"
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    const assignButton = screen.getByRole('button', { name: /Asignar Rol/i })
    expect(assignButton).toBeDisabled()
  })
})

// =====================================================
// TESTS: SUBMIT (ASIGNACIÓN NUEVA)
// =====================================================

describe('RoleAssignment - Submit Nuevo Rol', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('llama a assignRole cuando se asigna un nuevo rol', async () => {
    const user = userEvent.setup()
    const mockAssignRole = vi.fn()
    mockUsePermissions({ isOwner: true, assignRole: mockAssignRole })

    render(
      <RoleAssignment
        businessId="business-123"
        ownerId="owner-123"
        currentUserId="owner-123"
        userId="user-123"
        userName="Juan Pérez"
        userEmail="juan@example.com"
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    // Click en botón asignar
    await user.click(screen.getByRole('button', { name: /Asignar Rol/i }))

    // Verificar que se llamó assignRole con los parámetros correctos
    expect(mockAssignRole).toHaveBeenCalledWith(
      {
        targetUserId: 'user-123',
        role: 'employee',
        employeeType: 'service_provider',
        notes: '',
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    )
  })

  it('llama a assignRole con rol admin y sin employeeType', async () => {
    const user = userEvent.setup()
    const mockAssignRole = vi.fn()
    mockUsePermissions({ isOwner: true, assignRole: mockAssignRole })

    render(
      <RoleAssignment
        businessId="business-123"
        ownerId="owner-123"
        currentUserId="owner-123"
        userId="user-123"
        userName="Juan Pérez"
        userEmail="juan@example.com"
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    // Seleccionar rol admin
    await user.click(screen.getByRole('radio', { name: /Administrador/i }))

    // Click en botón asignar
    await user.click(screen.getByRole('button', { name: /Asignar Rol/i }))

    expect(mockAssignRole).toHaveBeenCalledWith(
      {
        targetUserId: 'user-123',
        role: 'admin',
        employeeType: undefined,
        notes: '',
      },
      expect.any(Object)
    )
  })

  it('incluye notas en la llamada a assignRole', async () => {
    const user = userEvent.setup()
    const mockAssignRole = vi.fn()
    mockUsePermissions({ isOwner: true, assignRole: mockAssignRole })

    render(
      <RoleAssignment
        businessId="business-123"
        ownerId="owner-123"
        currentUserId="owner-123"
        userId="user-123"
        userName="Juan Pérez"
        userEmail="juan@example.com"
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    // Escribir notas
    await user.type(
      screen.getByPlaceholderText('Razón del cambio de rol o información adicional...'),
      'Promoción aprobada'
    )

    // Click en botón asignar
    await user.click(screen.getByRole('button', { name: /Asignar Rol/i }))

    expect(mockAssignRole).toHaveBeenCalledWith(
      expect.objectContaining({
        notes: 'Promoción aprobada',
      }),
      expect.any(Object)
    )
  })
})

// =====================================================
// TESTS: SUBMIT (MODIFICACIÓN)
// =====================================================

describe('RoleAssignment - Submit Modificar Rol', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('llama a revokeRole y luego assignRole cuando hay currentRole', async () => {
    const user = userEvent.setup()
    const mockRevokeRole = vi.fn((_, callbacks) => {
      // Simular éxito inmediato
      callbacks?.onSuccess?.()
    })
    const mockAssignRole = vi.fn()
    mockUsePermissions({
      isOwner: true,
      revokeRole: mockRevokeRole,
      assignRole: mockAssignRole,
    })

    const currentRole = createMockBusinessRole({ id: 'role-old', role: 'employee' })

    render(
      <RoleAssignment
        businessId="business-123"
        ownerId="owner-123"
        currentUserId="owner-123"
        userId="user-123"
        userName="Juan Pérez"
        userEmail="juan@example.com"
        currentRole={currentRole}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    // Cambiar a admin
    await user.click(screen.getByRole('radio', { name: /Administrador/i }))

    // Click en botón guardar
    await user.click(screen.getByRole('button', { name: /Guardar Cambios/i }))

    // Verificar que se llamó primero revokeRole
    expect(mockRevokeRole).toHaveBeenCalledWith(
      { roleId: 'role-old' },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    )

    // Verificar que después se llamó assignRole
    await waitFor(() => {
      expect(mockAssignRole).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'admin',
        }),
        expect.any(Object)
      )
    })
  })

  it('muestra texto "Guardar Cambios" cuando hay currentRole', () => {
    mockUsePermissions({ isOwner: true })
    const currentRole = createMockBusinessRole()

    render(
      <RoleAssignment
        businessId="business-123"
        ownerId="owner-123"
        currentUserId="owner-123"
        userId="user-123"
        userName="Juan Pérez"
        userEmail="juan@example.com"
        currentRole={currentRole}
        isOpen={true}
        onClose={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: /Guardar Cambios/i })).toBeInTheDocument()
  })
})

// =====================================================
// TESTS: CANCELACIÓN
// =====================================================

describe('RoleAssignment - Cancelación', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('llama a onClose cuando se hace click en Cancelar', async () => {
    const user = userEvent.setup()
    const mockOnClose = vi.fn()
    mockUsePermissions({ isOwner: true })

    render(
      <RoleAssignment
        businessId="business-123"
        ownerId="owner-123"
        currentUserId="owner-123"
        userId="user-123"
        userName="Juan Pérez"
        userEmail="juan@example.com"
        isOpen={true}
        onClose={mockOnClose}
      />
    )

    await user.click(screen.getByRole('button', { name: /Cancelar/i }))

    expect(mockOnClose).toHaveBeenCalled()
  })
})
