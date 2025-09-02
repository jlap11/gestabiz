import supabase from '@/lib/supabase'
import type { Appointment } from '@/types'

export interface AppointmentQuery {
  businessId?: string
  employeeId?: string
  clientId?: string
  dateRange?: { start: string; end: string }
  status?: Appointment['status'][]
}

export const appointmentsService = {
  async list(q: AppointmentQuery = {}): Promise<Appointment[]> {
    let query = supabase.from('appointments').select('*')

  if (q.businessId) { query = query.eq('business_id', q.businessId) }
  if (q.employeeId) { query = query.eq('employee_id', q.employeeId) }
  if (q.clientId) { query = query.eq('client_id', q.clientId) }
  if (q.dateRange) {
      query = query.gte('start_time', q.dateRange.start).lte('start_time', q.dateRange.end)
    }
  if (q.status?.length) { query = query.in('status', q.status) }

    const { data, error } = await query.order('start_time', { ascending: true })
    if (error) throw error
    return (data || []) as Appointment[]
  },

  async get(id: string): Promise<Appointment | null> {
    const { data, error } = await supabase.from('appointments').select('*').eq('id', id).single()
    if (error) throw error
    return data as Appointment
  },

  async create(payload: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>): Promise<Appointment> {
    const { data, error } = await supabase.from('appointments').insert(payload).select().single()
    if (error) throw error
    return data as Appointment
  },

  async update(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    const { data, error } = await supabase.from('appointments').update(updates).eq('id', id).select().single()
    if (error) throw error
    return data as Appointment
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('appointments').delete().eq('id', id)
    if (error) throw error
  }
}
