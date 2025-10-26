import { Appointment, DashboardStats } from '@/types'

export function calculateDashboardStats(appointments: Appointment[]): DashboardStats {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const thisWeekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000))
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Basic counts
  const totalAppointments = appointments.length
  const upcomingAppointments = appointments.filter(apt => {
    if (apt.status !== 'scheduled') return false
    const start = apt.start_time || (apt.date && apt.startTime ? `${apt.date}T${apt.startTime}` : undefined)
    if (!start) return false
    return new Date(start) > now
  }).length
  const completedAppointments = appointments.filter(apt => apt.status === 'completed').length
  const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled').length
  const noShowAppointments = appointments.filter(apt => apt.status === 'no_show').length

  // Unique clients
  const uniqueClients = new Set(
    appointments.map(apt => apt.client_id || apt.clientId).filter(Boolean)
  )
  const totalClients = uniqueClients.size

  // This week appointments
  const thisWeekAppointments = appointments.filter(apt => {
    const dateStr = apt.start_time || (apt.date && apt.startTime ? `${apt.date}T${apt.startTime}` : undefined)
    if (!dateStr) return false
    const aptDate = new Date(dateStr)
    return aptDate >= thisWeekStart && aptDate <= now
  }).length

  // This month appointments
  const thisMonthAppointments = appointments.filter(apt => {
    const dateStr = apt.start_time || (apt.date && apt.startTime ? `${apt.date}T${apt.startTime}` : undefined)
    if (!dateStr) return false
    const aptDate = new Date(dateStr)
    return aptDate >= thisMonthStart && aptDate <= now
  }).length

  // Average appointments per day (last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const lastThirtyDaysAppointments = appointments.filter(apt => {
    const dateStr = apt.start_time || (apt.date && apt.startTime ? `${apt.date}T${apt.startTime}` : undefined)
    if (!dateStr) return false
    const aptDate = new Date(dateStr)
    return aptDate >= thirtyDaysAgo && aptDate <= now
  }).length
  const averageAppointmentsPerDay = Math.round((lastThirtyDaysAppointments / 30) * 10) / 10

  // Conversion rate (completed vs total)
  const conversionRate = totalAppointments > 0 
    ? Math.round((completedAppointments / totalAppointments) * 100) 
    : 0

  // Popular times analysis
  const timeSlots: { [key: string]: number } = {}
  appointments.forEach(apt => {
    if (apt.status === 'completed') {
      const start = apt.start_time || (apt.date && apt.startTime ? `${apt.date}T${apt.startTime}` : undefined)
      if (!start) return
      const hour = new Date(start).getHours()
      const timeSlot = `${hour}:00`
      timeSlots[timeSlot] = (timeSlots[timeSlot] || 0) + 1
    }
  })

  const popularTimes = Object.entries(timeSlots)
    .map(([time, count]) => ({ time, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const recentActivity = appointments
    .filter(apt => new Date(apt.updated_at || apt.updatedAt || apt.created_at || apt.createdAt || '') >= sevenDaysAgo)
    .map(apt => {
      let type: 'completed' | 'cancelled' | 'created'
      if (apt.status === 'completed') type = 'completed'
      else if (apt.status === 'cancelled') type = 'cancelled'
      else type = 'created'
      return {
        id: apt.id,
        type,
        appointmentTitle: apt.title,
        clientName: apt.client_name || apt.clientName || '',
        timestamp: (apt.updated_at || apt.updatedAt || apt.created_at || apt.createdAt || new Date().toISOString())
      }
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)

  return {
    // New schema keys
    total_appointments: totalAppointments,
    scheduled_appointments: appointments.filter(a => a.status === 'scheduled').length,
    completed_appointments: completedAppointments,
    cancelled_appointments: cancelledAppointments,
    no_show_appointments: noShowAppointments,
    upcoming_today: today.getTime(), // placeholder, compute elsewhere if needed
    upcoming_week: upcomingAppointments,
    revenue_total: 0,
    revenue_this_month: 0,
    average_appointment_value: 0,
    client_retention_rate: 0,
    popular_services: [],
    popular_times: popularTimes,
    employee_performance: [],
    location_performance: [],

    // Legacy keys for compatibility
    totalAppointments,
    upcomingAppointments,
    completedAppointments,
    cancelledAppointments,
    noShowAppointments,
    totalClients,
    thisWeekAppointments,
    thisMonthAppointments,
    averageAppointmentsPerDay,
    conversionRate,
    recentActivity
  }
}