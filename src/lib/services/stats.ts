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

    // Helpers
    const resolveBusinessIds = async (): Promise<string[] | undefined> => {
      if (q.ownerId && !q.businessId) {
        const { data, error } = await supabase
          .from('businesses')
          .select('id')
          .eq('owner_id', q.ownerId)
        if (error) throw error
        return (data || []).map(b => b.id)
      }
      if (q.employeeId && !q.businessId) {
        const { data, error } = await supabase
          .from('business_employees')
          .select('business_id')
          .eq('employee_id', q.employeeId)
          .eq('status', 'approved')
        if (error) throw error
        return (data || []).map(r => r.business_id)
      }
      return undefined
    }

    const buildAppointmentsQuery = async () => {
      const bizIds = await resolveBusinessIds()
      const query = supabase
        .from('appointments')
        .select('*')
        .gte('start_time', startDate)
        .lte('start_time', endDate)
      if (q.businessId) return query.eq('business_id', q.businessId)
      if (bizIds?.length) return query.in('business_id', bizIds)
      return query
    }

    const { data: appointments, error: appointmentsError } = await buildAppointmentsQuery()
    if (appointmentsError) throw appointmentsError
    const list = appointments || []

    const initStats = (): DashboardStats => ({
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
    })
    const stats = initStats()

    const completedWithPrice = list.filter(a => a.status === 'completed' && a.price > 0)
    stats.average_appointment_value = completedWithPrice.length > 0
      ? stats.revenue_total / completedWithPrice.length
      : 0

    const computeTimeWindows = () => {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString()
      const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      stats.upcoming_today = list.filter(a => a.start_time >= startOfToday && a.start_time <= endOfToday).length
      stats.upcoming_week = list.filter(a => a.start_time > now.toISOString() && a.start_time <= weekAhead).length
    }

    type ServiceAgg = { count: number; revenue: number }
    type EmpAgg = { count: number; completed: number; revenue: number }
    type LocAgg = { count: number; revenue: number }

    type AptRow = {
      service_id?: string | null
      start_time: string
      status: string
      price?: number | null
      user_id?: string
      location_id?: string | null
      employee_id?: string
    }

    const aggregateService = (map: Map<string, ServiceAgg>, a: AptRow) => {
      if (!a.service_id) return
      const cur = map.get(a.service_id) || { count: 0, revenue: 0 }
      cur.count += 1
      if (a.status === 'completed') cur.revenue += a.price || 0
      map.set(a.service_id, cur)
    }
    const aggregateTimeSlot = (map: Map<string, number>, a: AptRow) => {
      const d = new Date(a.start_time)
      const label = `${String(d.getHours()).padStart(2, '0')}:00`
      map.set(label, (map.get(label) || 0) + 1)
    }
    const aggregateEmployee = (map: Map<string, EmpAgg>, a: AptRow) => {
      const empId = a.employee_id || a.user_id
      if (!empId) return
      const cur = map.get(empId) || { count: 0, completed: 0, revenue: 0 }
      cur.count += 1
      if (a.status === 'completed') {
        cur.completed += 1
        cur.revenue += a.price || 0
      }
      map.set(empId, cur)
    }
    const aggregateLocation = (map: Map<string, LocAgg>, a: AptRow) => {
      if (!a.location_id) return
      const cur = map.get(a.location_id) || { count: 0, revenue: 0 }
      cur.count += 1
      if (a.status === 'completed') cur.revenue += a.price || 0
      map.set(a.location_id, cur)
    }
    const aggregate = () => {
      const byService = new Map<string, ServiceAgg>()
      const byTimeSlot = new Map<string, number>()
      const byEmployee = new Map<string, EmpAgg>()
      const byLocation = new Map<string, LocAgg>()
      for (const a of list) {
        aggregateService(byService, a)
        aggregateTimeSlot(byTimeSlot, a)
        aggregateEmployee(byEmployee, a)
        aggregateLocation(byLocation, a)
      }
      return { byService, byTimeSlot, byEmployee, byLocation }
    }

    computeTimeWindows()
    const { byService, byTimeSlot, byEmployee, byLocation } = aggregate()

    const serviceIds = Array.from(byService.keys())
    const employeeIds = Array.from(byEmployee.keys())
    const locationIds = Array.from(byLocation.keys())

    const fetchNames = async () => {
      let serviceNames = new Map<string, string>()
      if (serviceIds.length) {
        const { data } = await supabase.from('services').select('id,name').in('id', serviceIds)
        serviceNames = new Map((data || []).map((s: { id: string; name: string }) => [s.id, s.name]))
      }
      let employeeNames = new Map<string, string>()
      if (employeeIds.length) {
        const { data } = await supabase.from('profiles').select('id,full_name').in('id', employeeIds)
        employeeNames = new Map((data || []).map((p: { id: string; full_name?: string }) => [p.id, p.full_name || p.id]))
      }
      let locationNames = new Map<string, string>()
      if (locationIds.length) {
        const { data } = await supabase.from('locations').select('id,name').in('id', locationIds)
        locationNames = new Map((data || []).map((l: { id: string; name: string }) => [l.id, l.name]))
      }
      return { serviceNames, employeeNames, locationNames }
    }

    const { serviceNames, employeeNames, locationNames } = await fetchNames()

    stats.popular_services = Array.from(byService.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([serviceId, v]) => ({ service: serviceNames.get(serviceId) || serviceId, count: v.count, revenue: v.revenue }))

    stats.popular_times = Array.from(byTimeSlot.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([time, count]) => ({ time, count }))

  stats.employee_performance = Array.from(byEmployee.entries())
      .map(([employee_id, v]) => ({
        employee_id,
        employee_name: employeeNames.get(employee_id) || employee_id,
        total_appointments: v.count,
        completed_appointments: v.completed,
        revenue: v.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20)

  stats.location_performance = Array.from(byLocation.entries())
      .map(([location_id, v]) => ({
        location_id,
        location_name: locationNames.get(location_id) || location_id,
        total_appointments: v.count,
        revenue: v.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 20)

    return stats
  }
}
