import React, { useState } from 'react'
import { Calendar, User as UserIcon, Settings, Plus, Clock, MapPin } from 'lucide-react'
import { UnifiedLayout } from '@/components/layouts/UnifiedLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useSupabase } from '@/hooks/useSupabase'
import { AppointmentWizard } from '@/components/appointments/AppointmentWizard'
import type { UserRole, User } from '@/types/types'

interface ClientDashboardProps {
  currentRole: UserRole
  availableRoles: UserRole[]
  onRoleChange: (role: UserRole) => void
  onLogout?: () => void
  user?: User
}

export function ClientDashboard({ 
  currentRole,
  availableRoles,
  onRoleChange,
  onLogout,
  user
}: Readonly<ClientDashboardProps>) {
  const [activePage, setActivePage] = useState('appointments')
  const [showAppointmentWizard, setShowAppointmentWizard] = useState(false)
  
  // Get user's appointments
  const { appointments, createAppointment, refetch } = useSupabase()

  const sidebarItems = [
    {
      id: 'appointments',
      label: 'Mis Citas',
      icon: <Calendar className="h-5 w-5" />
    },
    {
      id: 'profile',
      label: 'Mi Perfil',
      icon: <UserIcon className="h-5 w-5" />
    },
    {
      id: 'settings',
      label: 'Configuración',
      icon: <Settings className="h-5 w-5" />
    }
  ]

  // Filter upcoming appointments
  const upcomingAppointments = React.useMemo(() => {
    if (!appointments) return []
    const now = new Date()
    return appointments
      .filter(apt => {
        const aptDate = new Date(apt.start_time)
        return aptDate >= now && ['pending', 'confirmed', 'scheduled'].includes(apt.status)
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
  }, [appointments])

  const renderContent = () => {
    switch (activePage) {
      case 'appointments':
        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Mis Citas</h2>
              <Button 
                onClick={() => setShowAppointmentWizard(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nueva Cita
              </Button>
            </div>

            {/* Appointments List */}
            {upcomingAppointments.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">No tienes citas programadas</p>
                  <Button onClick={() => setShowAppointmentWizard(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agendar primera cita
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <Card key={appointment.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">{appointment.service_name}</h3>
                            <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                              {appointment.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(appointment.start_time).toLocaleString('es', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                              })}
                            </div>
                            {appointment.location_name && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {appointment.location_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )
      case 'profile':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">Mi Perfil</h2>
            <p className="text-muted-foreground">Información del usuario - Próximamente</p>
          </div>
        )
      case 'settings':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">Configuración</h2>
            <p className="text-muted-foreground">Preferencias y ajustes - Próximamente</p>
          </div>
        )
      default:
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-foreground">Mis Citas</h2>
            <p className="text-muted-foreground">Tus próximas citas aparecerán aquí</p>
          </div>
        )
    }
  }

  return (
    <>
      <UnifiedLayout
        currentRole={currentRole}
        availableRoles={availableRoles}
        onRoleChange={onRoleChange}
        onLogout={onLogout}
        sidebarItems={sidebarItems}
        activePage={activePage}
        onPageChange={setActivePage}
        user={user ? {
          name: user.name,
          email: user.email,
          avatar: user.avatar_url
        } : undefined}
      >
        {renderContent()}
      </UnifiedLayout>

      {/* Appointment Wizard Modal */}
      {showAppointmentWizard && user && (
        <AppointmentWizard
          isOpen={showAppointmentWizard}
          onClose={() => setShowAppointmentWizard(false)}
          onSuccess={() => {
            setShowAppointmentWizard(false)
            refetch()
          }}
          user={user}
        />
      )}
    </>
  )
}
