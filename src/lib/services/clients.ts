import supabase from '@/lib/supabase'
import type { Client } from '@/types'

export interface ClientQuery {
  businessId?: string
  search?: string
}

export const clientsService = {
  async list(q: ClientQuery = {}): Promise<Client[]> {
    let query = supabase.from('clients').select('*')
    if (q.businessId) {
      query = query.eq('business_id', q.businessId)
    }
    if (q.search) {
      // simple ilike on name or email
      query = query.ilike ? query.ilike('name', `%${q.search}%`) : query
    }
    const { data, error } = await query.order('name')
    if (error) throw error
    return (data || []) as Client[]
  },

  async get(id: string): Promise<Client | null> {
    const { data, error } = await supabase.from('clients').select('*').eq('id', id).single()
    if (error) throw error
    return data as Client
  },

  async create(payload: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
    const { data, error } = await supabase.from('clients').insert(payload).select().single()
    if (error) throw error
    return data as Client
  },

  async update(id: string, updates: Partial<Client>): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as Client
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) throw error
  },
}
