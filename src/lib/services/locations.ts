import supabase from '@/lib/supabase'
import type { Location } from '@/types'
import { normalizeLocation } from '@/lib/normalizers'
import type { Row } from '@/lib/supabaseTyped'

export interface LocationQuery {
  businessId?: string
  businessIds?: string[]
  activeOnly?: boolean
}

export const locationsService = {
  async list(q: LocationQuery = {}): Promise<Location[]> {
    let query = supabase.from('locations').select('*')
    if (q.activeOnly !== false) {
      query = query.eq('is_active', true)
    }
    if (q.businessIds?.length) {
      query = query.in('business_id', q.businessIds)
    } else if (q.businessId) {
      query = query.eq('business_id', q.businessId)
    }
    const { data, error } = await query.order('name')
    if (error) throw error
    return ((data as Row<'locations'>[] | null) || []).map(normalizeLocation)
  },

  async get(id: string): Promise<Location | null> {
    const { data, error } = await supabase.from('locations').select('*').eq('id', id).single()
    if (error) throw error
    return normalizeLocation(data as Row<'locations'>)
  },

  async create(payload: Omit<Location, 'id' | 'created_at' | 'updated_at'>): Promise<Location> {
    const { data, error } = await supabase.from('locations').insert(payload).select().single()
    if (error) throw error
    return normalizeLocation(data as Row<'locations'>)
  },

  async update(id: string, updates: Partial<Location>): Promise<Location> {
    const { data, error } = await supabase
      .from('locations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return normalizeLocation(data as Row<'locations'>)
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('locations').delete().eq('id', id)
    if (error) throw error
  },
}
