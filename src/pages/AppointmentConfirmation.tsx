import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, Clock, MapPin, User, Calendar } from 'lucide-react'
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

export default function AppointmentConfirmation() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Token de confirmación no válido')
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
        .eq('status', 'pending_confirmation')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          setError('Esta cita ya ha sido confirmada o el token ha expirado')
        } else {
          setError('Error al cargar los detalles de la cita')
        }
        return
      }

      // Verificar si el token ha expirado
      const deadline = new Date(data.confirmation_deadline)
      if (deadline < new Date()) {
        setError('El tiempo para confirmar esta cita ha expirado')
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

  const confirmAppointment = async () => {
    setConfirming(true)
    try {
      if (!token) {
        setError('Token de confirmación no válido')
        return
      }

      const { data, error } = await supabase.rpc('confirm_appointment_by_token', {
        p_token: token
      })

      if (error) {
        setError('Error al confirmar la cita. Por favor, inténtalo de nuevo.')
        return
      }

      // RPC returns JSON payload; treat success true
      setSuccess(true)
    } catch (err) {
      console.error('Error confirming appointment:', err)
      setError('Error al confirmar la cita. Por favor, inténtalo de nuevo.')
    } finally {
      setConfirming(false)
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
            <CardTitle className="text-green-700">¡Cita Confirmada!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              Tu cita ha sido confirmada exitosamente. Recibirás un correo de confirmación en breve.
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
  const deadline = new Date(appointment.confirmation_deadline)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <Calendar className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <CardTitle className="text-2xl">Confirmar Cita</CardTitle>
          <CardDescription>
            Por favor, revisa los detalles de tu cita y confírmala
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
            </div>
          </div>

          {/* Información de tiempo límite */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <p className="font-medium text-yellow-800">Tiempo límite para confirmar</p>
            </div>
            <p className="text-sm text-yellow-700">
              Debes confirmar antes del {format(deadline, "d 'de' MMMM 'a las' HH:mm", { locale: es })}
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-4">
            <Button
              onClick={confirmAppointment}
              disabled={confirming}
              className="flex-1"
              size="lg"
            >
              {confirming ? (
                <>
                  <Clock className="h-4 w-4 animate-spin mr-2" />
                  Confirmando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmar Cita
                </>
              )}
            </Button>
            
            <Button
              onClick={() => navigate(`/cancelar-cita/${token}`)}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar Cita
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
