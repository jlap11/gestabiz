import supabase from '@/lib/supabase'
import type { Appointment } from '@/types'
import { normalizeAppointment, toDbAppointmentStatus } from '@/lib/normalizers'
import type { Insert, Row, Update } from '@/lib/supabaseTyped'

export interface AppointmentQuery {
  businessId?: string
  employeeId?: string
  clientId?: string
  dateRange?: { start: string; end: string }
  status?: Appointment['status'][]
  limit?: number
  offset?: number
  order?: 'asc' | 'desc'
}

export interface OverlapOptions {
  bufferMinutes?: number
  scope?: 'employee' | 'employee+location'
}

type DbAppointmentRow = {
  id: string
  start_time: string
  end_time: string
  location_id?: string | null
  employee_id: string
}

async function hasOverlap(params: {
  employeeId: string
  start_time: string
  end_time: string
  location_id?: string
  excludeId?: string
  options?: OverlapOptions
}): Promise<boolean> {
  const { employeeId, start_time, end_time, location_id, excludeId, options } = params
  const bufferMs = (options?.bufferMinutes ?? 0) * 60 * 1000
  const startWithBuffer = new Date(new Date(start_time).getTime() - bufferMs).toISOString()
  const endWithBuffer = new Date(new Date(end_time).getTime() + bufferMs).toISOString()

  let q = supabase
    .from('appointments')
    .select('id, start_time, end_time, location_id, employee_id')
    .eq('employee_id', employeeId)
    // Overlap condition: existing.start < new.end && existing.end > new.start
    .lt('start_time', endWithBuffer)
    .gt('end_time', startWithBuffer)

  if (options?.scope === 'employee+location' && location_id) {
    q = q.eq('location_id', location_id)
  }
  if (excludeId) {
    q = q.neq('id', excludeId)
  }

  const { data, error } = await q as unknown as { data: DbAppointmentRow[] | null; error: { message: string } | null }
  if (error) throw error
  return (data || []).length > 0
}

export const appointmentsService = {
  // Helper para preparar updates a DB con mapeos
  _buildDbUpdates(updates: Partial<Appointment>): Update<'appointments'> {
    const db: Update<'appointments'> = {}
    if (updates.location_id !== undefined) db.location_id = updates.location_id ?? null
    if (updates.service_id !== undefined) db.service_id = updates.service_id
    if (updates.client_id !== undefined) db.client_id = updates.client_id
    if (updates.user_id !== undefined) db.employee_id = updates.user_id
    if (updates.start_time !== undefined) db.start_time = updates.start_time
    if (updates.end_time !== undefined) db.end_time = updates.end_time
    if (updates.status !== undefined) db.status = toDbAppointmentStatus(updates.status)
    if (updates.description !== undefined) db.notes = updates.description ?? null
    if (updates.notes !== undefined) db.client_notes = updates.notes ?? null
    if (updates.price !== undefined) db.price = updates.price ?? null
    if (updates.currency !== undefined) db.currency = updates.currency ?? null
    if (updates.reminder_sent !== undefined) db.reminder_sent = updates.reminder_sent
    return db
  },

  async _checkOverlapIfNeeded(id: string, current: Appointment, updates: Partial<Appointment>, options?: OverlapOptions) {
    const needsCheck = Boolean(
      updates.start_time || updates.end_time || updates.user_id || updates.location_id
    )
    if (!needsCheck) return
    const nextStart = updates.start_time ?? current.start_time
    const nextEnd = updates.end_time ?? current.end_time
    const nextEmployeeId = updates.user_id ?? current.user_id
    const nextLocationId = updates.location_id ?? current.location_id
    const overlap = await hasOverlap({
      employeeId: nextEmployeeId,
      start_time: nextStart,
      end_time: nextEnd,
      location_id: nextLocationId,
      excludeId: id,
      options,
    })
    if (overlap) throw new Error('CONFLICT_APPOINTMENT_OVERLAP')
  },
  async list(q: AppointmentQuery = {}): Promise<Appointment[]> {
    let query = supabase.from('appointments').select('*')

  if (q.businessId) { query = query.eq('business_id', q.businessId) }
  if (q.employeeId) { query = query.eq('employee_id', q.employeeId) }
  if (q.clientId) { query = query.eq('client_id', q.clientId) }
  if (q.dateRange) {
      query = query.gte('start_time', q.dateRange.start).lte('start_time', q.dateRange.end)
    }
  if (q.status?.length) { query = query.in('status', q.status) }

    // Orden
    query = query.order('start_time', { ascending: q.order !== 'desc' })
    // Paginación
    if (typeof q.offset === 'number') {
      const lim = typeof q.limit === 'number' ? q.limit : 50
  // range es [from, to] — cast a unknown para evitar problemas de tipos en el mock
  const qAny = query as unknown as { range: (from: number, to: number) => typeof query }
  query = qAny.range(q.offset, q.offset + lim - 1)
    } else if (typeof q.limit === 'number') {
      query = query.limit(q.limit)
    }
  const { data, error } = await query
    if (error) throw error
  return ((data as Row<'appointments'>[] | null) || []).map(normalizeAppointment)
  },

  async get(id: string): Promise<Appointment | null> {
  const { data, error } = await supabase.from('appointments').select('*').eq('id', id).single()
    if (error) throw error
  return normalizeAppointment(data as Row<'appointments'>)
  },

  async create(payload: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>, options?: OverlapOptions): Promise<Appointment> {
    // Validación de solapamientos (overbooking) solo si hay empleado asignado
    if (payload.user_id) {
      const overlap = await hasOverlap({
        employeeId: payload.user_id,
        start_time: payload.start_time,
        end_time: payload.end_time,
        location_id: payload.location_id,
        options
      })
      if (overlap) throw new Error('CONFLICT_APPOINTMENT_OVERLAP')
    }

    // Construir payload válido para DB
    const insertRow: Insert<'appointments'> = {
      business_id: payload.business_id,
      location_id: payload.location_id ?? null,
      service_id: payload.service_id!,
      client_id: payload.client_id,
      employee_id: payload.user_id ?? null,
      start_time: payload.start_time,
      end_time: payload.end_time,
      status: toDbAppointmentStatus(payload.status),
      notes: payload.description ?? null,
      client_notes: payload.notes ?? null,
      price: payload.price ?? null,
      currency: payload.currency ?? null,
      reminder_sent: payload.reminder_sent ?? false,
    }

    const { data, error } = await supabase.from('appointments').insert(insertRow).select().single()
    if (error) throw error
    return normalizeAppointment(data as Row<'appointments'>)
  },

  async update(id: string, updates: Partial<Appointment>, options?: OverlapOptions): Promise<Appointment> {
    const current = await this.get(id)
    if (!current) throw new Error('NOT_FOUND')
    await this._checkOverlapIfNeeded(id, current, updates, options)
    const dbUpdates = this._buildDbUpdates(updates)
    const { data, error } = await supabase.from('appointments').update(dbUpdates).eq('id', id).select().single()
    if (error) throw error
    return normalizeAppointment(data as Row<'appointments'>)
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('appointments').delete().eq('id', id)
    if (error) throw error
  }
}

// Helpers de detalles desde la vista appointment_details
export type AppointmentDetail = Appointment & {
  service_name?: string
  service_price?: number
  employee_name?: string
  location_name?: string
  business_name?: string
}

export const appointmentDetailsService = {
  async list(q: AppointmentQuery = {}): Promise<AppointmentDetail[]> {
    let query = supabase.from('appointment_details').select('*')
    if (q.businessId) query = query.eq('business_id', q.businessId)
    if (q.employeeId) query = query.eq('employee_id', q.employeeId)
    if (q.clientId) query = query.eq('client_id', q.clientId)
    if (q.dateRange) query = query.gte('start_time', q.dateRange.start).lte('start_time', q.dateRange.end)
    if (q.status?.length) query = query.in('status', q.status.map(toDbAppointmentStatus))
    query = query.order('start_time', { ascending: q.order !== 'desc' })
    if (typeof q.offset === 'number') {
      const lim = typeof q.limit === 'number' ? q.limit : 50
      const qAny = query as unknown as { range: (from: number, to: number) => typeof query }
      query = qAny.range(q.offset, q.offset + lim - 1)
    } else if (typeof q.limit === 'number') {
      query = query.limit(q.limit)
    }
    const { data, error } = await query
    if (error) throw error
    const rows = (data as Array<Record<string, unknown>> | null) || []
    return rows.map((r) => {
      const base = normalizeAppointment(r as unknown as Row<'appointments'>)
      return {
        ...base,
        service_name: r.service_name as string | undefined,
        service_price: r.service_price as number | undefined,
        employee_name: r.employee_name as string | undefined,
        location_name: r.location_name as string | undefined,
        business_name: r.business_name as string | undefined,
      }
    })
  },

  async get(id: string): Promise<AppointmentDetail | null> {
    const { data, error } = await supabase.from('appointment_details').select('*').eq('id', id).single()
    if (error) throw error
    const r = data as Record<string, unknown>
    const base = normalizeAppointment(r as unknown as Row<'appointments'>)
    return {
      ...base,
      service_name: r.service_name as string | undefined,
      service_price: r.service_price as number | undefined,
      employee_name: r.employee_name as string | undefined,
      location_name: r.location_name as string | undefined,
      business_name: r.business_name as string | undefined,
    }
  },
}
