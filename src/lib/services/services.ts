import supabase from '@/lib/supabase'
import type { Service } from '@/types'
import { normalizeService } from '@/lib/normalizers'
import type { Insert, Row, Update } from '@/lib/supabaseTyped'

export interface ServiceQuery {
  businessId?: string
  businessIds?: string[]
  activeOnly?: boolean
}

export const servicesService = {
  async list(q: ServiceQuery = {}): Promise<Service[]> {
    let query = supabase.from('services').select('*')
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
    return ((data as Row<'services'>[] | null) || []).map(normalizeService)
  },

  async get(id: string): Promise<Service | null> {
    const { data, error } = await supabase.from('services').select('*').eq('id', id).single()
    if (error) throw error
    return normalizeService(data as Row<'services'>)
  },

  async create(payload: Omit<Service, 'id' | 'created_at' | 'updated_at'>): Promise<Service> {
    // Mapear Service.duration -> services.duration_minutes
    const insertRow: Insert<'services'> = {
      business_id: payload.business_id,
      name: payload.name,
      description: payload.description ?? null,
      duration_minutes: payload.duration,
      price: payload.price,
      currency: payload.currency ?? 'MXN',
      category: payload.category ?? null,
      is_active: payload.is_active,
    }
    const { data, error } = await supabase.from('services').insert(insertRow).select().single()
    if (error) throw error
    return normalizeService(data as Row<'services'>)
  },

  async update(id: string, updates: Partial<Service>): Promise<Service> {
    // Sanitizar y mapear a columnas válidas de DB
    const dbUpdates: Update<'services'> = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.description !== undefined) dbUpdates.description = updates.description ?? null
    if (updates.duration !== undefined) dbUpdates.duration_minutes = updates.duration
    if (updates.price !== undefined) dbUpdates.price = updates.price
    if (updates.currency !== undefined) dbUpdates.currency = updates.currency ?? 'MXN'
    if (updates.category !== undefined) dbUpdates.category = updates.category ?? null
    if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active
    const { data, error } = await supabase
      .from('services')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return normalizeService(data as Row<'services'>)
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('services').delete().eq('id', id)
    if (error) throw error
  },
}
