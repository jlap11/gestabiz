import supabase from '@/lib/supabase'
import type { Business } from '@/types'
import { normalizeBusiness } from '@/lib/normalizers'
import type { Row } from '@/lib/supabaseTyped'

export interface BusinessQuery {
  ownerId?: string
  ids?: string[]
}

export const businessesService = {
  async list(q: BusinessQuery = {}): Promise<Business[]> {
    let query = supabase.from('businesses').select('*')
  if (q.ids?.length) { query = query.in('id', q.ids) }
  else if (q.ownerId) { query = query.eq('owner_id', q.ownerId) }
    const { data, error } = await query.order('name')
    if (error) throw error
    return ((data as Row<'businesses'>[] | null) || []).map(normalizeBusiness)
  },

  async listByEmployee(employeeId: string): Promise<Business[]> {
    // Fetch businesses linked to employee via relation table
    const { data, error } = await supabase
      .from('business_employees')
      .select('businesses:business_id(*)')
      .eq('employee_id', employeeId)
      .eq('status', 'approved')
    if (error) throw error
    const rows = (data as unknown as Array<{ businesses: Row<'businesses'> | null }> | null) || []
    const businesses = rows.map(r => r.businesses).filter((b): b is Row<'businesses'> => !!b)
    return businesses.map(normalizeBusiness)
  },

  async get(id: string): Promise<Business | null> {
    const { data, error } = await supabase.from('businesses').select('*').eq('id', id).single()
    if (error) throw error
    return normalizeBusiness(data as Row<'businesses'>)
  },

  async create(payload: Omit<Business, 'id' | 'created_at' | 'updated_at'>): Promise<Business> {
    const { data, error } = await supabase.from('businesses').insert(payload).select().single()
    if (error) throw error
    return normalizeBusiness(data as Row<'businesses'>)
  },

  async update(id: string, updates: Partial<Business>): Promise<Business> {
    const { data, error } = await supabase.from('businesses').update(updates).eq('id', id).select().single()
    if (error) throw error
    return normalizeBusiness(data as Row<'businesses'>)
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('businesses').delete().eq('id', id)
    if (error) throw error
  }
}
