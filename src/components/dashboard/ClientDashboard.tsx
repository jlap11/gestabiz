import { useState, useMemo } from 'react'
import { User, Appointment, UserRole } from '@/types'
import { useLanguage } from '@/contexts'
import { useKV } from '@/lib/useKV'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Clock, 
  MapPin,
  Plus,
  CalendarCheck,
  CalendarX,
  Trash2,
  UserCircle2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AppointmentWizard } from '@/components/appointments/AppointmentWizard'
import { toast } from 'sonner'

interface ClientDashboardProps {
  user: User
  appointments: Appointment[]
  createAppointment: (appointment: Partial<Appointment>) => Promise<Appointment | void | null>
  refetch: () => void
}

export default function ClientDashboard({ 
  user, 
  appointments,
  createAppointment,
  refetch
}: Readonly<ClientDashboardProps>) {
  const { t } = useLanguage()
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [localAppointments, setLocalAppointments] = useKV<Appointment[]>(
    `appointments-${user.business_id || user.id}`, 
    []
  )

  // Combinar appointments del servidor con los locales
  const allAppointments = useMemo(() => {
    const combined = [...appointments, ...localAppointments]
    const uniqueMap = new Map()
    combined.forEach(apt => uniqueMap.set(apt.id, apt))
    return Array.from(uniqueMap.values())
  }, [appointments, localAppointments])

  // Filtrar citas próximas (upcoming)
  const upcomingAppointments = useMemo(() => {
    const now = new Date()
    return allAppointments
      .filter(apt => {
        const aptDate = new Date(apt.start_time)
        return aptDate >= now && ['pending', 'confirmed', 'scheduled'].includes(apt.status)
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 3) // Solo las próximas 3
  }, [allAppointments])

  // Filtrar citas pasadas (past)
  const pastAppointments = useMemo(() => {
    const now = new Date()
    return allAppointments
      .filter(apt => {
        const aptDate = new Date(apt.start_time)
        return aptDate < now || ['completed', 'cancelled', 'no-show'].includes(apt.status)
      })
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
      .slice(0, 10) // Últimas 10
  }, [allAppointments])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      })
    } catch {
      return dateString
    }
  }

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })
    } catch {
      return ''
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      confirmed: { 
        label: 'Confirmed', 
        className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-medium' 
      },
      pending: { 
        label: 'Pending', 
        className: 'bg-amber-500/20 text-amber-400 border-amber-500/30 font-medium' 
      },
      completed: { 
        label: 'Completed', 
        className: 'bg-blue-500/20 text-blue-400 border-blue-500/30 font-medium' 
      },
      cancelled: { 
        label: 'Cancelled', 
        className: 'bg-red-500/20 text-red-400 border-red-500/30 font-medium' 
      },
      scheduled: { 
        label: 'Scheduled', 
        className: 'bg-purple-500/20 text-purple-400 border-purple-500/30 font-medium' 
      },
      'no-show': { 
        label: 'No Show', 
        className: 'bg-gray-500/20 text-gray-400 border-gray-500/30 font-medium' 
      },
    }

    const config = statusConfig[status] || statusConfig.pending
    return (
      <Badge variant="outline" className={`${config.className} px-3 py-1`}>
        {config.label}
      </Badge>
    )
  }

  const handleRoleChange = (newRole: 'admin' | 'employee' | 'client') => {
    toast.info(`Switching to ${newRole} role...`)
    // Aquí puedes implementar la lógica para cambiar de rol
    // Por ejemplo, actualizar el estado global o navegar a otra vista
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Header Section - Compact like reference */}
      <div className="border-b border-white/5">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">
                Welcome back, {user.name?.split(' ')[0] || 'User'}!
              </h1>
              <p className="text-gray-400 text-sm">
                Here's a look at your upcoming appointments.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Role Selector Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="bg-[#252032] border-white/10 text-white hover:bg-[#2d2640] hover:text-white"
                  >
                    <UserCircle2 className="h-5 w-5 mr-2" />
                    <span className="capitalize">{user.role}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#252032] border-white/10 text-white">
                  <DropdownMenuLabel className="text-gray-400">Switch Role</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem 
                    onClick={() => handleRoleChange('admin')}
                    className="hover:bg-white/5 focus:bg-white/5 cursor-pointer"
                  >
                    <span className="flex items-center w-full justify-between">
                      <span className={user.role === 'admin' ? 'text-[#6820F7]' : ''}>Admin</span>
                      {user.role === 'admin' && <span className="text-[#6820F7]">✓</span>}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleRoleChange('employee')}
                    className="hover:bg-white/5 focus:bg-white/5 cursor-pointer"
                  >
                    <span className="flex items-center w-full justify-between">
                      <span className={user.role === 'employee' ? 'text-[#6820F7]' : ''}>Employee</span>
                      {user.role === 'employee' && <span className="text-[#6820F7]">✓</span>}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleRoleChange('client')}
                    className="hover:bg-white/5 focus:bg-white/5 cursor-pointer"
                  >
                    <span className="flex items-center w-full justify-between">
                      <span className={user.role === 'client' ? 'text-[#6820F7]' : ''}>Client</span>
                      {user.role === 'client' && <span className="text-[#6820F7]">✓</span>}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button 
                onClick={() => setShowAppointmentForm(true)}
                className="bg-[#FF8C00] hover:bg-[#FF7A00] text-white font-semibold px-6"
              >
                <Plus className="h-5 w-5 mr-2" />
                Book New Appointment
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 space-y-8">
        {/* Upcoming Appointments Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              Upcoming Appointments
            </h2>
            {upcomingAppointments.length > 0 && (
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                View All
              </Button>
            )}
          </div>

          {upcomingAppointments.length === 0 ? (
            <Card className="border-dashed border-2 border-white/10 bg-transparent">
              <CardContent className="py-16 text-center">
                <CalendarX className="h-16 w-16 mx-auto text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">No upcoming appointments</h3>
                <p className="text-gray-400 mb-6">
                  Book your first appointment to get started
                </p>
                <Button 
                  onClick={() => setShowAppointmentForm(true)}
                  className="bg-[#6820F7] hover:bg-[#7b3dff] text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Book Appointment
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingAppointments.map((appointment) => (
                <Card 
                  key={appointment.id}
                  className="bg-[#252032] border-white/5 hover:border-white/10 transition-all"
                >
                  <CardContent className="p-6">
                    {/* Title and Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-semibold text-white">
                        {appointment.title || 'Appointment'}
                      </h3>
                      {getStatusBadge(appointment.status)}
                    </div>

                    {/* Provider */}
                    <div className="text-gray-400 mb-4">
                      with {appointment.employee_name || 'Provider'}
                    </div>

                    {/* Date, Time, Location */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(appointment.start_time)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-300 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(appointment.start_time)}</span>
                      </div>
                      {appointment.location && (
                        <div className="flex items-center gap-2 text-gray-300 text-sm">
                          <MapPin className="h-4 w-4" />
                          <span>{appointment.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Icons */}
                    <div className="flex gap-3 pt-4 border-t border-white/5">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-gray-400 hover:text-white hover:bg-white/5"
                      >
                        <CalendarCheck className="h-5 w-5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-gray-400 hover:text-red-400 hover:bg-white/5"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Past Appointments Section */}
        {pastAppointments.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Past Appointments
              </h2>
            </div>

            <Card className="bg-[#252032] border-white/5">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-white/5">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                          Service
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                          Date & Time
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                          Provider
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                          Location
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {pastAppointments.map((appointment) => (
                        <tr 
                          key={appointment.id}
                          className="hover:bg-white/5 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="font-medium text-white">
                              {appointment.title || 'Appointment'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-300">
                              {formatDate(appointment.start_time)}, {formatTime(appointment.start_time)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-300">
                            {appointment.employee_name || 'Provider'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-300">
                            {appointment.location || 'Location'}
                          </td>
                          <td className="px-6 py-4">
                            <Button 
                              variant="link" 
                              size="sm"
                              className="text-[#8B5CF6] hover:text-[#a78bfa] font-semibold p-0 h-auto"
                            >
                              Rebook
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </div>

      {/* Appointment Wizard Modal */}
      <AppointmentWizard
        open={showAppointmentForm}
        onClose={() => setShowAppointmentForm(false)}
        businessId={user.business_id || ''}
      />
    </div>
  )
}
