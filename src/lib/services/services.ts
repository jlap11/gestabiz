import supabase from '@/lib/supabase'
import type { Service } from '@/types'
import { normalizeService } from '@/lib/normalizers'
import type { Row } from '@/lib/supabaseTyped'

export interface ServiceQuery {
  businessId?: string
  businessIds?: string[]
  activeOnly?: boolean
}

export const servicesService = {
  async list(q: ServiceQuery = {}): Promise<Service[]> {
    let query = supabase.from('services').select('*')
  if (q.activeOnly !== false) { query = query.eq('is_active', true) }
  if (q.businessIds?.length) { query = query.in('business_id', q.businessIds) }
  else if (q.businessId) { query = query.eq('business_id', q.businessId) }
    const { data, error } = await query.order('name')
    if (error) throw error
    return ((data as Row<'services'>[] | null) || []).map(normalizeService)
  },

  async get(id: string): Promise<Service | null> {
    const { data, error } = await supabase.from('services').select('*').eq('id', id).single()
    if (error) throw error
    return normalizeService(data as Row<'services'>)
  },

  async create(payload: Omit<Service, 'id' | 'created_at' | 'updated_at'>): Promise<Service> {
    const { data, error } = await supabase.from('services').insert(payload).select().single()
    if (error) throw error
    return normalizeService(data as Row<'services'>)
  },

  async update(id: string, updates: Partial<Service>): Promise<Service> {
    const { data, error } = await supabase.from('services').update(updates).eq('id', id).select().single()
    if (error) throw error
    return normalizeService(data as Row<'services'>)
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('services').delete().eq('id', id)
    if (error) throw error
  }
}
