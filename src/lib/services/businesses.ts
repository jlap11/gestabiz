import supabase from '@/lib/supabase'
import type { Business } from '@/types'
import { normalizeBusiness } from '@/lib/normalizers'
import type { Insert, Row, Update } from '@/lib/supabaseTyped'
import type { Json } from '@/types/database'

export interface BusinessQuery {
  ownerId?: string
  ids?: string[]
  activeOnly?: boolean
}

export const businessesService = {
  _buildDbUpdates(updates: Partial<Business>): Update<'businesses'> {
    const db: Update<'businesses'> = {}
    const nullableScalars: Array<keyof Update<'businesses'> & keyof Business> = [
      'name','legal_name','description','phone','email','address','city','state','country','postal_code','latitude','longitude','logo_url','website','tax_id','registration_number'
    ]
    const dbAssign = db as unknown as Record<string, unknown>
    for (const k of nullableScalars) {
      const v = updates[k]
      if (v !== undefined) dbAssign[k as string] = v ?? null
    }
    if (updates.legal_entity_type !== undefined) db.legal_entity_type = updates.legal_entity_type
    if (updates.business_hours !== undefined) db.business_hours = updates.business_hours as unknown as Json
    if (updates.settings !== undefined) db.settings = updates.settings as unknown as Json
    if (updates.is_active !== undefined) db.is_active = updates.is_active
    return db
  },
  async list(q: BusinessQuery = {}): Promise<Business[]> {
    let query = supabase.from('businesses').select('*')
    if (q.ids?.length) query = query.in('id', q.ids)
    else if (q.ownerId) query = query.eq('owner_id', q.ownerId)
    if (q.activeOnly !== false) query = query.eq('is_active', true)
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return ((data as Row<'businesses'>[] | null) || []).map(normalizeBusiness)
  },

  async listByEmployee(employeeId: string): Promise<Business[]> {
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
    const insertRow: Insert<'businesses'> = {
      name: payload.name,
      legal_name: payload.legal_name ?? null,
      description: payload.description ?? null,
      resource_model: payload.resource_model ?? 'professional', // ⭐ Soporte para modelo de negocio
      legal_entity_type: payload.legal_entity_type ?? 'individual',
      tax_id: payload.tax_id ?? null,
      registration_number: payload.registration_number ?? null,
      category_id: payload.category_id ?? null, // ⭐ Categoría principal del negocio
      owner_id: payload.owner_id,
      phone: payload.phone ?? null,
      email: payload.email ?? null,
      address: payload.address ?? null,
      city: payload.city ?? null,
      state: payload.state ?? null,
      country: payload.country ?? null,
      postal_code: payload.postal_code ?? null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      logo_url: payload.logo_url ?? null,
      website: payload.website ?? null,
      business_hours: payload.business_hours as unknown as Json,
      settings: payload.settings as unknown as Json,
      is_active: payload.is_active ?? true,
    }
    const { data, error } = await supabase.from('businesses').insert(insertRow).select().single()
    if (error) throw error
    return normalizeBusiness(data as Row<'businesses'>)
  },

  async update(id: string, updates: Partial<Business>): Promise<Business> {
    const dbUpdates = this._buildDbUpdates(updates)
    const { data, error } = await supabase.from('businesses').update(dbUpdates).eq('id', id).select().single()
    if (error) throw error
    return normalizeBusiness(data as Row<'businesses'>)
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('businesses').delete().eq('id', id)
    if (error) throw error
  }
}
