import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle, Clock, MapPin, User, Calendar, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface AppointmentDetails {
  id: string
  client_name: string
  client_email: string
  service_name: string
  business_name: string
  location_address: string
  appointment_date: string
  appointment_time: string
  status: string
  confirmation_deadline: string
}

export default function AppointmentCancellation() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [cancellationReason, setCancellationReason] = useState('')

  useEffect(() => {
    if (!token) {
      setError('Token de cancelación no válido')
      setLoading(false)
      return
    }

    fetchAppointmentDetails()
  }, [token])

  const fetchAppointmentDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          appointment_time,
          status,
          confirmation_deadline,
          clients!inner(name, email),
          services!inner(name),
          businesses!inner(name),
          locations!inner(address)
        `)
        .eq('confirmation_token', token)
        .in('status', ['pending_confirmation', 'confirmed'])
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Esta cita no existe o ya ha sido cancelada')
        } else {
          setError('Error al cargar los detalles de la cita')
        }
        return
      }

      setAppointment({
        id: data.id,
        client_name: data.clients.name,
        client_email: data.clients.email,
        service_name: data.services.name,
        business_name: data.businesses.name,
        location_address: data.locations.address,
        appointment_date: data.appointment_date,
        appointment_time: data.appointment_time,
        status: data.status,
        confirmation_deadline: data.confirmation_deadline
      })
    } catch (err) {
      console.error('Error fetching appointment:', err)
      setError('Error al cargar los detalles de la cita')
    } finally {
      setLoading(false)
    }
  }

  const cancelAppointment = async () => {
    setCancelling(true)
    try {
      if (!token) {
        setError('Token de cancelación no válido')
        return
      }

      const { data, error } = await supabase.rpc('cancel_appointment_by_token', {
        p_token: token,
        p_reason: cancellationReason || 'Cancelado por el cliente'
      })

      if (error) {
        setError('Error al cancelar la cita. Por favor, inténtalo de nuevo.')
        return
      }

      // RPC returns JSON payload; treat success true
      setSuccess(true)
    } catch (err) {
      console.error('Error cancelling appointment:', err)
      setError('Error al cancelar la cita. Por favor, inténtalo de nuevo.')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando detalles de la cita...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-700">Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              Ir al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-700">Cita Cancelada</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Tu cita ha sido cancelada exitosamente. Se ha notificado al negocio sobre la cancelación.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Ir al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!appointment) {
    return null
  }

  const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <CardTitle className="text-2xl text-red-700">Cancelar Cita</CardTitle>
          <CardDescription>
            ¿Estás seguro de que deseas cancelar esta cita?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Detalles de la cita */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold text-lg mb-4">Detalles de la Cita</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">{appointment.client_name}</p>
                  <p className="text-sm text-gray-600">{appointment.client_email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">
                    {format(appointmentDateTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(appointmentDateTime, 'HH:mm')} hrs
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">{appointment.business_name}</p>
                  <p className="text-sm text-gray-600">{appointment.location_address}</p>
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="font-medium text-blue-900">Servicio:</p>
                <p className="text-blue-700">{appointment.service_name}</p>
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="font-medium text-yellow-800">Estado actual:</p>
                <p className="text-yellow-700 capitalize">
                  {appointment.status === 'pending_confirmation' ? 'Pendiente de confirmación' : 'Confirmada'}
                </p>
              </div>
            </div>
          </div>

          {/* Razón de cancelación */}
          <div className="space-y-2">
            <Label htmlFor="cancellation-reason">
              Razón de cancelación (opcional)
            </Label>
            <Textarea
              id="cancellation-reason"
              placeholder="Puedes proporcionar una razón para la cancelación..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Advertencia */}
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="font-medium text-red-800">Importante</p>
            </div>
            <p className="text-sm text-red-700">
              Una vez cancelada, esta cita no podrá ser recuperada. El negocio será notificado inmediatamente de la cancelación.
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-4">
            <Button
              onClick={() => navigate(`/confirmar-cita/${token}`)}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar en su lugar
            </Button>
            
            <Button
              onClick={cancelAppointment}
              disabled={cancelling}
              variant="destructive"
              size="lg"
              className="flex-1"
            >
              {cancelling ? (
                <>
                  <Clock className="h-4 w-4 animate-spin mr-2" />
                  Cancelando...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar Cita
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
