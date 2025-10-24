import { describe, expect, it, vi } from 'vitest'
import { countUpcomingForEmployee, hasUpcomingForEmployee } from '../services/appointments'

function makeClient(count: number) {
  const gte = vi.fn().mockResolvedValue({ count, error: null })
  // Minimal chainable builder to emulate Supabase query builder
  const builder: any = {
    select: vi.fn().mockReturnValue(builder),
    eq: vi.fn().mockReturnValue(builder),
    in: vi.fn().mockReturnValue(builder),
    gte,
  }
  const from = vi.fn().mockReturnValue(builder)
  return { from, _builder: builder } as any
}

describe('appointments upcoming helpers', () => {
  it('countUpcomingForEmployee returns provided count', async () => {
    const client = makeClient(3)
    const count = await countUpcomingForEmployee({ businessId: 'b1', employeeId: 'e1', client })
    expect(count).toBe(3)
    expect(client.from).toHaveBeenCalledWith('appointments')
    expect(client._builder.select).toHaveBeenCalled()
    expect(client._builder.eq).toHaveBeenCalledWith('business_id', 'b1')
    expect(client._builder.eq).toHaveBeenCalledWith('employee_id', 'e1')
    expect(client._builder.in).toHaveBeenCalledWith('status', ['pending', 'confirmed'])
    expect(client._builder.gte).toHaveBeenCalled()
  })

  it('hasUpcomingForEmployee returns true when count > 0', async () => {
    const client = makeClient(1)
    const res = await hasUpcomingForEmployee({ businessId: 'b1', employeeId: 'e1', client })
    expect(res).toBe(true)
  })

  it('hasUpcomingForEmployee returns false when count == 0', async () => {
    const client = makeClient(0)
    const res = await hasUpcomingForEmployee({ businessId: 'b1', employeeId: 'e1', client })
    expect(res).toBe(false)
  })
})
