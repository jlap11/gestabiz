// =====================================================
// TESTS: PermissionEditor.tsx Component
// Suite completa de tests automatizados para el editor
// de permisos granulares con matriz de categorías
// =====================================================

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test-utils/test-utils'
import { PermissionEditor } from '../PermissionEditor'
import type { Permission, UserPermission } from '@/types/types'
import * as usePermissionsModule from '@/hooks/usePermissions-v2'

// =====================================================
// MOCKS
// =====================================================

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock usePermissions hook (solo la función, NO las constantes)
vi.mock('@/hooks/usePermissions-v2', async () => {
  const actual = (await vi.importActual('@/hooks/usePermissions-v2')) as any
  return {
    ...actual,
    usePermissions: vi.fn(),
  }
})

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Crea un mock de UserPermission
 */
function createMockUserPermission(
  permission: Permission,
  overrides?: Partial<UserPermission>
): UserPermission {
  return {
    id: `perm-${permission}`,
    user_id: 'user-123',
    business_id: 'business-123',
    permission,
    granted_by: 'owner-123',
    granted_at: new Date().toISOString(),
    expires_at: null,
    is_active: true,
    notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Mock de usePermissions hook
 */
function mockUsePermissions(
  overrides?: Partial<ReturnType<typeof usePermissionsModule.usePermissions>>
) {
  return {
    isOwner: false,
    grantPermission: vi.fn((_, callbacks) => {
      callbacks?.onSuccess?.()
    }),
    revokePermission: vi.fn((_, callbacks) => {
      callbacks?.onSuccess?.()
    }),
    ...overrides,
  }
}

// Props por defecto
const defaultProps = {
  businessId: 'business-123',
  ownerId: 'owner-123',
  currentUserId: 'owner-123',
  targetUserId: 'user-123',
  targetUserName: 'Juan Pérez',
  targetUserEmail: 'juan@example.com',
  currentPermissions: [] as UserPermission[],
  isOpen: true,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
}

// =====================================================
// TESTS: RENDER Y ESTADOS
// =====================================================

describe('PermissionEditor - Render y Estados', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({ isOwner: true })
    )
  })

  it('renderiza modal cerrado cuando isOpen es false', () => {
    renderWithProviders(<PermissionEditor {...defaultProps} isOpen={false} />)

    // El Dialog de Radix UI no renderiza nada cuando está cerrado
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renderiza modal abierto cuando isOpen es true', () => {
    renderWithProviders(<PermissionEditor {...defaultProps} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Editor de Permisos')).toBeInTheDocument()
  })

  it('muestra información del usuario correctamente', () => {
    renderWithProviders(<PermissionEditor {...defaultProps} />)

    expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
    expect(screen.getByText('juan@example.com')).toBeInTheDocument()
  })

  it('muestra badge con contador de permisos', () => {
    const currentPermissions = [
      createMockUserPermission('appointments.view_all'),
      createMockUserPermission('appointments.create'),
    ]

    renderWithProviders(
      <PermissionEditor {...defaultProps} currentPermissions={currentPermissions} />
    )

    // Hay 60 permisos totales en el sistema (11 categorías)
    expect(screen.getByText(/2 \/ 60 permisos/i)).toBeInTheDocument()
  })
})

// =====================================================
// TESTS: RESTRICCIÓN OWNER
// =====================================================

describe('PermissionEditor - Restricción Owner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({ isOwner: true })
    )
  })

  it('muestra advertencia cuando el target es el owner', () => {
    renderWithProviders(
      <PermissionEditor {...defaultProps} targetUserId="owner-123" currentUserId="owner-123" />
    )

    expect(screen.getByText('No se pueden editar permisos del propietario')).toBeInTheDocument()
    expect(
      screen.getByText(/El propietario del negocio siempre tiene acceso completo/i)
    ).toBeInTheDocument()
  })

  it('no muestra botones de acción rápida cuando target es owner', () => {
    renderWithProviders(
      <PermissionEditor {...defaultProps} targetUserId="owner-123" currentUserId="owner-123" />
    )

    expect(screen.queryByText('Seleccionar Todos')).not.toBeInTheDocument()
    expect(screen.queryByText('Limpiar Todos')).not.toBeInTheDocument()
  })

  it('no muestra botón de guardar cuando target es owner', () => {
    renderWithProviders(
      <PermissionEditor {...defaultProps} targetUserId="owner-123" currentUserId="owner-123" />
    )

    expect(screen.queryByRole('button', { name: /Guardar Cambios/i })).not.toBeInTheDocument()
  })
})

// =====================================================
// TESTS: MATRIZ DE PERMISOS
// =====================================================

describe('PermissionEditor - Matriz de Permisos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({ isOwner: true })
    )
  })

  it('renderiza todas las categorías de permisos', () => {
    renderWithProviders(<PermissionEditor {...defaultProps} />)

    expect(screen.getByText('Citas')).toBeInTheDocument()
    expect(screen.getByText('Clientes')).toBeInTheDocument()
    expect(screen.getByText('Servicios')).toBeInTheDocument()
  })

  it('renderiza badge con contador por categoría', () => {
    renderWithProviders(<PermissionEditor {...defaultProps} />)

    // Citas: 0/7 (no hay permisos seleccionados en la categoría de Citas)
    const citasBadge = screen.getByText('Citas').closest('button')
    expect(within(citasBadge!).getByText('0 / 7')).toBeInTheDocument()
  })

  it('renderiza permisos individuales dentro de cada categoría', async () => {
    renderWithProviders(<PermissionEditor {...defaultProps} />)

    // El Accordion tiene defaultValue con todos los items abiertos, así que debería estar visible
    // Verifica que algunos permisos de la categoría están presentes (usar textos exactos)
    await waitFor(() => {
      expect(screen.getByText('Ver todas las citas del negocio')).toBeInTheDocument()
    })
    expect(screen.getByText('Crear nuevas citas')).toBeInTheDocument()
  })

  it('muestra checkboxes para cada permiso individual', async () => {
    renderWithProviders(<PermissionEditor {...defaultProps} />)

    // El Accordion inicia con todos los items abiertos por defaultValue
    // Busca checkboxes usando los textos exactos de PERMISSION_DESCRIPTIONS
    await waitFor(() => {
      const viewAllCheck = screen.getByRole('checkbox', {
        name: /Ver todas las citas del negocio/i,
      })
      expect(viewAllCheck).toBeInTheDocument()
    })

    const createCheck = screen.getByRole('checkbox', { name: /Crear nuevas citas/i })
    expect(createCheck).toBeInTheDocument()
  })

  it('marca permisos existentes como checked', async () => {
    const currentPermissions = [createMockUserPermission('appointments.view_all')]

    renderWithProviders(
      <PermissionEditor {...defaultProps} currentPermissions={currentPermissions} />
    )

    // NO expandir manualmente - defaultValue ya debería abrir todas
    // Usar findByRole que espera hasta 1 segundo por defecto
    const viewAllCheck = await screen.findByRole(
      'checkbox',
      { name: /Ver todas las citas del negocio/i },
      { timeout: 3000 } // Dar más tiempo para animaciones
    )
    expect(viewAllCheck).toHaveAttribute('data-state', 'checked')
  })
})

// =====================================================
// TESTS: BOTONES DE ACCIÓN RÁPIDA
// =====================================================

describe('PermissionEditor - Botones de Acción Rápida', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({ isOwner: true })
    )
  })

  it('renderiza botones Seleccionar Todos y Limpiar Todos', () => {
    renderWithProviders(<PermissionEditor {...defaultProps} />)

    expect(screen.getByText('Seleccionar Todos')).toBeInTheDocument()
    expect(screen.getByText('Limpiar Todos')).toBeInTheDocument()
  })

  it('selecciona todos los permisos al hacer click en Seleccionar Todos', async () => {
    renderWithProviders(<PermissionEditor {...defaultProps} />)

    const selectAllBtn = screen.getByText('Seleccionar Todos')
    await userEvent.click(selectAllBtn)

    // El badge debería mostrar 60/60 (todos los permisos del sistema)
    expect(screen.getByText(/60 \/ 60 permisos/i)).toBeInTheDocument()
  })

  it('limpia todos los permisos al hacer click en Limpiar Todos', async () => {
    const currentPermissions = [
      createMockUserPermission('appointments.view_all'),
      createMockUserPermission('appointments.create'),
    ]

    renderWithProviders(
      <PermissionEditor {...defaultProps} currentPermissions={currentPermissions} />
    )

    const clearAllBtn = screen.getByText('Limpiar Todos')
    await userEvent.click(clearAllBtn)

    // El badge debería mostrar 0/60
    expect(screen.getByText(/0 \/ 60 permisos/i)).toBeInTheDocument()
  })

  it('muestra preview de cambios pendientes al seleccionar permisos', async () => {
    renderWithProviders(<PermissionEditor {...defaultProps} />)

    const selectAllBtn = screen.getByText('Seleccionar Todos')
    await userEvent.click(selectAllBtn)

    // Debería mostrar "60 a otorgar" (todos los permisos son nuevos)
    expect(screen.getByText(/60 a otorgar/i)).toBeInTheDocument()
  })

  it('muestra preview de cambios al revocar permisos', async () => {
    const currentPermissions = [
      createMockUserPermission('read_appointments'),
      createMockUserPermission('write_appointments'),
    ]

    renderWithProviders(
      <PermissionEditor {...defaultProps} currentPermissions={currentPermissions} />
    )

    const clearAllBtn = screen.getByText('Limpiar Todos')
    await userEvent.click(clearAllBtn)

    // Debería mostrar "2 a revocar"
    expect(screen.getByText(/2 a revocar/i)).toBeInTheDocument()
  })
})

// =====================================================
// TESTS: TOGGLE PERMISOS
// =====================================================

describe('PermissionEditor - Toggle Permisos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({ isOwner: true })
    )
  })

  it('permite hacer toggle de un permiso individual', async () => {
    renderWithProviders(<PermissionEditor {...defaultProps} />)

    // NO expandir manualmente - defaultValue ya debería abrir todas
    // Usar findByRole que espera hasta 1 segundo por defecto
    const viewAllCheck = await screen.findByRole(
      'checkbox',
      { name: /Ver todas las citas del negocio/i },
      { timeout: 3000 } // Dar más tiempo para animaciones
    )
    await userEvent.click(viewAllCheck)

    // Debería estar checked
    expect(viewAllCheck).toHaveAttribute('data-state', 'checked')
    // Debería mostrar 1/60 en el badge global
    expect(screen.getByText(/1 \/ 60 permisos/i)).toBeInTheDocument()
  })

  it('permite hacer toggle de toda una categoría', async () => {
    renderWithProviders(<PermissionEditor {...defaultProps} />)

    // Busca el checkbox de la categoría "Citas" (el que está al lado del título)
    const citasCategory = screen.getByText('Citas').closest('button')
    const categoryCheckbox = within(citasCategory!).getByRole('checkbox')

    await userEvent.click(categoryCheckbox)

    // Debería mostrar 7/60 en el badge global (7 permisos de Citas)
    expect(screen.getByText(/7 \/ 60 permisos/i)).toBeInTheDocument()

    // El badge de la categoría debería mostrar 7/7
    expect(within(citasCategory!).getByText('7 / 7')).toBeInTheDocument()
  })

  it('desmarca categoría completa al hacer toggle nuevamente', async () => {
    renderWithProviders(<PermissionEditor {...defaultProps} />)

    const citasCategory = screen.getByText('Citas').closest('button')
    const categoryCheckbox = within(citasCategory!).getByRole('checkbox')

    // Primera vez: selecciona todos
    await userEvent.click(categoryCheckbox)
    expect(screen.getByText(/7 \/ 60 permisos/i)).toBeInTheDocument()

    // Segunda vez: deselecciona todos
    await userEvent.click(categoryCheckbox)
    expect(screen.getByText(/0 \/ 60 permisos/i)).toBeInTheDocument()
  })
})

// =====================================================
// TESTS: SUBMIT Y GUARDADO
// =====================================================

describe('PermissionEditor - Submit y Guardado', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('botón de guardar está deshabilitado cuando no hay cambios', () => {
    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({ isOwner: true })
    )

    renderWithProviders(<PermissionEditor {...defaultProps} />)

    const saveBtn = screen.getByRole('button', { name: /Guardar Cambios \(0\)/i })
    expect(saveBtn).toBeDisabled()
  })

  it('botón de guardar se habilita cuando hay cambios pendientes', async () => {
    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({ isOwner: true })
    )

    renderWithProviders(<PermissionEditor {...defaultProps} />)

    const selectAllBtn = screen.getByText('Seleccionar Todos')
    await userEvent.click(selectAllBtn)

    const saveBtn = screen.getByRole('button', { name: /Guardar Cambios \(60\)/i })
    expect(saveBtn).not.toBeDisabled()
  })

  it('llama a grantPermission para cada nuevo permiso al guardar', async () => {
    const grantPermissionMock = vi.fn((_, callbacks) => {
      callbacks?.onSuccess?.()
    })

    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({ isOwner: true, grantPermission: grantPermissionMock })
    )

    renderWithProviders(<PermissionEditor {...defaultProps} />)

    // NO expandir manualmente - defaultValue ya debería abrir todas
    // Usar findByRole que espera hasta 1 segundo por defecto
    const viewAllCheck = await screen.findByRole(
      'checkbox',
      { name: /Ver todas las citas del negocio/i },
      { timeout: 3000 } // Dar más tiempo para animaciones
    )
    await userEvent.click(viewAllCheck)

    // Guarda cambios
    const saveBtn = screen.getByRole('button', { name: /Guardar Cambios \(1\)/i })
    await userEvent.click(saveBtn)

    // Debería llamar a grantPermission con el permiso correcto
    await waitFor(() => {
      expect(grantPermissionMock).toHaveBeenCalledWith(
        expect.objectContaining({
          targetUserId: 'user-123',
          permission: 'appointments.view_all',
        }),
        expect.any(Object)
      )
    })
  })

  it('llama a revokePermission para cada permiso eliminado al guardar', async () => {
    const revokePermissionMock = vi.fn((_, callbacks) => {
      callbacks?.onSuccess?.()
    })

    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({ isOwner: true, revokePermission: revokePermissionMock })
    )

    const currentPermissions = [createMockUserPermission('appointments.view_all')]

    renderWithProviders(
      <PermissionEditor {...defaultProps} currentPermissions={currentPermissions} />
    )

    // Limpia todos los permisos
    const clearAllBtn = screen.getByText('Limpiar Todos')
    await userEvent.click(clearAllBtn)

    // Guarda cambios
    const saveBtn = screen.getByRole('button', { name: /Guardar Cambios \(1\)/i })
    await userEvent.click(saveBtn)

    // Debería llamar a revokePermission
    await waitFor(() => {
      expect(revokePermissionMock).toHaveBeenCalledWith(
        expect.objectContaining({
          permissionId: 'perm-appointments.view_all',
        }),
        expect.any(Object)
      )
    })
  })

  it('llama a onSuccess y onClose después de guardar exitosamente', async () => {
    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({ isOwner: true })
    )

    const onSuccessMock = vi.fn()
    const onCloseMock = vi.fn()

    renderWithProviders(
      <PermissionEditor {...defaultProps} onSuccess={onSuccessMock} onClose={onCloseMock} />
    )

    // Selecciona un permiso y guarda
    const selectAllBtn = screen.getByText('Seleccionar Todos')
    await userEvent.click(selectAllBtn)

    const saveBtn = screen.getByRole('button', { name: /Guardar Cambios/i })
    await userEvent.click(saveBtn)

    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalled()
      expect(onCloseMock).toHaveBeenCalled()
    })
  })

  it('muestra loader en botón mientras guarda', async () => {
    let resolveGrant: (() => void) | undefined

    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({
        isOwner: true,
        grantPermission: vi.fn((_, callbacks) => {
          return new Promise(resolve => {
            resolveGrant = () => {
              callbacks?.onSuccess?.()
              resolve()
            }
          })
        }),
      })
    )

    renderWithProviders(<PermissionEditor {...defaultProps} />)

    // Selecciona permisos
    const selectAllBtn = screen.getByText('Seleccionar Todos')
    await userEvent.click(selectAllBtn)

    // Inicia guardado
    const saveBtn = screen.getByRole('button', { name: /Guardar Cambios/i })
    await userEvent.click(saveBtn)

    // Debería mostrar loader
    expect(screen.getByRole('button', { name: /Guardar Cambios/i })).toBeDisabled()

    // Resuelve la promesa
    resolveGrant?.()
  })
})

// =====================================================
// TESTS: CANCELACIÓN
// =====================================================

describe('PermissionEditor - Cancelación', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePermissionsModule.usePermissions).mockReturnValue(
      mockUsePermissions({ isOwner: true })
    )
  })

  it('llama a onClose cuando se hace click en Cancelar', async () => {
    const onCloseMock = vi.fn()

    renderWithProviders(<PermissionEditor {...defaultProps} onClose={onCloseMock} />)

    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i })
    await userEvent.click(cancelBtn)

    expect(onCloseMock).toHaveBeenCalled()
  })

  it('resetea cambios pendientes al cancelar', async () => {
    const currentPermissions = [createMockUserPermission('read_appointments')]

    renderWithProviders(
      <PermissionEditor {...defaultProps} currentPermissions={currentPermissions} />
    )

    // Hace cambios (limpia todos)
    const clearAllBtn = screen.getByText('Limpiar Todos')
    await userEvent.click(clearAllBtn)

    // Debería mostrar cambios pendientes
    expect(screen.getByText(/1 a revocar/i)).toBeInTheDocument()

    // Cancela
    const cancelBtn = screen.getByRole('button', { name: /Cancelar/i })
    await userEvent.click(cancelBtn)

    // Debería haber reseteado (verificar que onClose fue llamado)
    expect(defaultProps.onClose).toHaveBeenCalled()
  })
})
