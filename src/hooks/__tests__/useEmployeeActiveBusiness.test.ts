// ============================================================================
// TESTS: useEmployeeActiveBusiness Hook
// Valida selección de negocio activo según horarios y zonas horarias
// ============================================================================

// ============================================================================
// TESTS: useEmployeeActiveBusiness Hook
// Valida selección de negocio activo según horarios y zonas horarias
// ============================================================================

import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useEmployeeActiveBusiness } from '../useEmployeeActiveBusiness'
import { supabase } from '@/lib/supabase'

// Mock de Supabase (named export)
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('useEmployeeActiveBusiness', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna not-employee si employeeId es null', async () => {
    const { result } = renderHook(() => useEmployeeActiveBusiness(null))
    expect(result.current.status).toBe('not-employee')
    expect(result.current.business_id).toBeNull()
    expect(result.current.is_within_schedule).toBe(false)
  })

  it('retorna not-employee si no hay negocios aprobados', async () => {
    const mockEq2 = vi.fn().mockResolvedValue({ data: [], error: null })
    const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 })

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({ eq: mockEq1 }),
    } as any)

    const { result } = renderHook(() => useEmployeeActiveBusiness('emp-1'))

    await waitFor(() => {
      expect(result.current.status).toBe('not-employee')
      expect(result.current.business_id).toBeNull()
    })
  })

  it('marca no-schedule si no hay registros en work_schedules', async () => {
    const employeeBusinesses = [
      {
        business_id: 'biz-1',
        location_id: 'loc-1',
        businesses: { id: 'biz-1', name: 'Biz Uno', logo_url: null, timezone: 'America/Bogota' },
      },
    ]

    // 1a llamada: business_employees
    vi.mocked(supabase.from).mockImplementationOnce(
      () =>
        ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: employeeBusinesses, error: null }),
            }),
          }),
        }) as any
    )

    // 2a llamada: work_schedules (sin registros)
    vi.mocked(supabase.from).mockImplementationOnce(
      () =>
        ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }) as any
    )

    const { result } = renderHook(() => useEmployeeActiveBusiness('emp-1'))

    await waitFor(() => {
      expect(result.current.status).toBe('no-schedule')
      expect(result.current.business_id).toBe('biz-1')
      expect(result.current.is_within_schedule).toBe(false)
    })
  })

  it('retorna active cuando hay horario vigente e is_working = true', async () => {
    const employeeBusinesses = [
      {
        business_id: 'biz-2',
        location_id: null,
        businesses: { id: 'biz-2', name: 'Biz Dos', logo_url: null, timezone: 'America/Bogota' },
      },
    ]

    const activeSchedule = [{ start_time: '00:00', end_time: '23:59', is_working: true }]

    // 1a llamada: business_employees
    vi.mocked(supabase.from).mockImplementationOnce(
      () =>
        ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: employeeBusinesses, error: null }),
            }),
          }),
        }) as any
    )

    // 2a llamada: work_schedules (activo)
    vi.mocked(supabase.from).mockImplementationOnce(
      () =>
        ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: activeSchedule, error: null }),
              }),
            }),
          }),
        }) as any
    )

    const { result } = renderHook(() => useEmployeeActiveBusiness('emp-2'))

    await waitFor(() => {
      expect(result.current.status).toBe('active')
      expect(result.current.business_id).toBe('biz-2')
      expect(result.current.is_within_schedule).toBe(true)
    })
  })

  it('retorna off-schedule cuando el horario no cubre la hora actual', async () => {
    const employeeBusinesses = [
      {
        business_id: 'biz-3',
        location_id: null,
        businesses: { id: 'biz-3', name: 'Biz Tres', logo_url: null, timezone: 'America/Bogota' },
      },
    ]

    const narrowSchedule = [{ start_time: '00:00', end_time: '00:01', is_working: true }]

    // 1a llamada: business_employees
    vi.mocked(supabase.from).mockImplementationOnce(
      () =>
        ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: employeeBusinesses, error: null }),
            }),
          }),
        }) as any
    )

    // 2a llamada: work_schedules (fuera de rango)
    vi.mocked(supabase.from).mockImplementationOnce(
      () =>
        ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({ data: narrowSchedule, error: null }),
              }),
            }),
          }),
        }) as any
    )

    const { result } = renderHook(() => useEmployeeActiveBusiness('emp-3'))

    await waitFor(() => {
      expect(result.current.status).toBe('off-schedule')
      expect(result.current.business_id).toBe('biz-3')
      expect(result.current.is_within_schedule).toBe(false)
    })
  })
})
