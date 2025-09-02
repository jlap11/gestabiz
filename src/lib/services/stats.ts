import supabase from '@/lib/supabase'
import type { DashboardStats } from '@/types'

export interface DashboardStatsQuery {
  businessId?: string
  ownerId?: string
  employeeId?: string
  dateRange?: { start: string; end: string }
}

export const statsService = {
  async getDashboardStats(q: DashboardStatsQuery = {}): Promise<DashboardStats> {
    const now = new Date()
    const startDate = q.dateRange?.start || new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endDate = q.dateRange?.end || now.toISOString()

    // Resolve business filter set
    let businessIds: string[] | undefined
    if (q.ownerId && !q.businessId) {
      const { data: owned, error } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', q.ownerId)
      if (error) throw error
      businessIds = (owned || []).map(b => b.id)
    } else if (q.employeeId && !q.businessId) {
      const { data: rel, error } = await supabase
        .from('business_employees')
        .select('business_id')
        .eq('employee_id', q.employeeId)
        .eq('status', 'approved')
      if (error) throw error
      businessIds = (rel || []).map(r => r.business_id)
    }

    // Build appointments query
    let appointmentsQuery = supabase
      .from('appointments')
      .select('*')
      .gte('start_time', startDate)
      .lte('start_time', endDate)

    if (q.businessId) {
      appointmentsQuery = appointmentsQuery.eq('business_id', q.businessId)
    } else if (businessIds?.length) {
      appointmentsQuery = appointmentsQuery.in('business_id', businessIds)
    }

    const { data: appointments, error: appointmentsError } = await appointmentsQuery
    if (appointmentsError) throw appointmentsError
    const list = appointments || []

    const stats: DashboardStats = {
      total_appointments: list.length,
      scheduled_appointments: list.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length,
      completed_appointments: list.filter(a => a.status === 'completed').length,
      cancelled_appointments: list.filter(a => a.status === 'cancelled').length,
      no_show_appointments: list.filter(a => a.status === 'no_show').length,
      upcoming_today: 0,
      upcoming_week: 0,
      revenue_total: list.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.price || 0), 0),
      revenue_this_month: list.filter(a => a.status === 'completed').reduce((sum, a) => sum + (a.price || 0), 0),
      average_appointment_value: 0,
      client_retention_rate: 0,
      popular_services: [],
      popular_times: [],
      employee_performance: [],
      location_performance: []
    }

    const completedWithPrice = list.filter(a => a.status === 'completed' && a.price > 0)
    stats.average_appointment_value = completedWithPrice.length > 0
      ? stats.revenue_total / completedWithPrice.length
      : 0

    return stats
  }
}
