import { useState } from 'react'
import { Building2, MapPin, Phone, Mail, Calendar, Info, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { User } from '@/types/types'

interface AdminOnboardingProps {
  user: User
  onBusinessCreated?: () => void
}

const BUSINESS_CATEGORIES = [
  'Salón de belleza',
  'Barbería',
  'Spa',
  'Clínica médica',
  'Clínica dental',
  'Gimnasio',
  'Estudio de yoga',
  'Centro de masajes',
  'Peluquería',
  'Centro de estética',
  'Consultorio psicológico',
  'Veterinaria',
  'Taller mecánico',
  'Centro de reparación',
  'Otro',
]

export function AdminOnboarding({ user, onBusinessCreated }: AdminOnboardingProps) {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    country: 'México',
    postal_code: '',
  })

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      // Validate required fields
      if (!formData.name || !formData.category) {
        toast.error('Nombre y categoría son obligatorios')
        return
      }

      // Create business with default settings
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: formData.name.trim(),
          category: formData.category,
          description: formData.description.trim() || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
          city: formData.city.trim() || null,
          state: formData.state.trim() || null,
          country: formData.country,
          postal_code: formData.postal_code.trim() || null,
          owner_id: user.id,
          business_hours: {
            monday: { open: '09:00', close: '18:00', closed: false },
            tuesday: { open: '09:00', close: '18:00', closed: false },
            wednesday: { open: '09:00', close: '18:00', closed: false },
            thursday: { open: '09:00', close: '18:00', closed: false },
            friday: { open: '09:00', close: '18:00', closed: false },
            saturday: { open: '09:00', close: '14:00', closed: false },
            sunday: { open: '00:00', close: '00:00', closed: true },
          },
          settings: {
            appointment_buffer: 15,
            advance_booking_days: 30,
            cancellation_policy: 24,
            auto_confirm: false,
            require_deposit: false,
            deposit_percentage: 0,
            currency: 'MXN',
          },
          is_active: true,
        })
        .select()
        .single()

      if (businessError) throw businessError

      toast.success(`¡Negocio "${formData.name}" creado exitosamente!`)

      // Show invitation code
      if (business) {
        toast.success(
          `Código de invitación: ${business.invitation_code}`,
          {
            duration: 10000,
            description: 'Comparte este código con tus empleados',
          }
        )
      }

      onBusinessCreated?.()
    } catch (error) {
      console.error('Error creating business:', error)
      toast.error('Error al crear negocio')
    } finally {
      setIsLoading(false)
    }
  }

  const isStep1Valid = formData.name.trim().length > 0 && formData.category.length > 0
  const isStep2Valid = true // Contact info is optional

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">Crear tu Negocio</h1>
          <p className="text-gray-400">
            Registra tu negocio y empieza a gestionar citas en minutos
          </p>
        </div>

        {/* Important Rules Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Reglas de inactividad</AlertTitle>
          <AlertDescription className="text-xs space-y-1">
            <p>• Si tu negocio permanece <strong>30 días sin actividad</strong>, se desactivará automáticamente.</p>
            <p>
              • Si nunca tuviste clientes y pasó <strong>1 año sin actividad</strong>, el negocio se eliminará
              permanentemente.
            </p>
            <p className="text-muted-foreground mt-2">
              La actividad incluye: citas programadas, servicios registrados, empleados activos, etc.
            </p>
          </AlertDescription>
        </Alert>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2">
          <div className={`h-2 w-24 rounded-full ${step >= 1 ? 'bg-[#6820F7]' : 'bg-white/10'}`} />
          <div className={`h-2 w-24 rounded-full ${step >= 2 ? 'bg-[#6820F7]' : 'bg-white/10'}`} />
          <div className={`h-2 w-24 rounded-full ${step >= 3 ? 'bg-[#6820F7]' : 'bg-white/10'}`} />
        </div>

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <Card className="bg-[#252032] border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Building2 className="h-5 w-5 text-violet-500" />
                Información básica
              </CardTitle>
              <CardDescription className="text-gray-400">Datos principales de tu negocio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Business Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-white">
                  Nombre del negocio <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ej: Salón de Belleza María"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Descripción
                </label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe tu negocio..."
                  rows={3}
                />
              </div>

              <Button onClick={() => setStep(2)} className="w-full" size="lg" disabled={!isStep1Valid}>
                Continuar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Contact & Location */}
        {step === 2 && (
          <Card className="bg-[#252032] border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <MapPin className="h-5 w-5 text-violet-500" />
                Contacto y ubicación
              </CardTitle>
              <CardDescription className="text-gray-400">Información de contacto (opcional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Phone */}
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Teléfono
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="+52 555 123 4567"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="contacto@tuempresa.com"
                />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium">
                  Dirección
                </label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Calle, número, colonia"
                />
              </div>

              {/* City, State */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="city" className="text-sm font-medium">
                    Ciudad
                  </label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="Ciudad"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="state" className="text-sm font-medium">
                    Estado
                  </label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    placeholder="Estado"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1" size="lg">
                  Atrás
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1" size="lg" disabled={!isStep2Valid}>
                  Continuar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review & Create */}
        {step === 3 && (
          <Card className="bg-[#252032] border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <CheckCircle className="h-5 w-5 text-violet-500" />
                Revisar y crear
              </CardTitle>
              <CardDescription className="text-gray-400">Verifica que todo esté correcto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Review */}
              <div className="space-y-3 p-4 rounded-lg bg-[#1a1a1a] border border-white/5">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">{formData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Categoría</p>
                  <p className="font-medium">{formData.category}</p>
                </div>
                {formData.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Descripción</p>
                    <p className="text-sm">{formData.description}</p>
                  </div>
                )}
                {formData.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{formData.phone}</p>
                  </div>
                )}
                {formData.address && (
                  <div>
                    <p className="text-sm text-muted-foreground">Dirección</p>
                    <p className="text-sm">
                      {formData.address}
                      {formData.city && `, ${formData.city}`}
                      {formData.state && `, ${formData.state}`}
                    </p>
                  </div>
                )}
              </div>

              {/* Default Settings Info */}
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertTitle>Configuración predeterminada</AlertTitle>
                <AlertDescription className="text-xs space-y-1">
                  <p>• Horario: Lunes a Viernes 9:00-18:00, Sábado 9:00-14:00</p>
                  <p>• Buffer entre citas: 15 minutos</p>
                  <p>• Reservas con 30 días de anticipación</p>
                  <p className="text-muted-foreground mt-2">Podrás personalizar estos valores después</p>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1" size="lg" disabled={isLoading}>
                  Atrás
                </Button>
                <Button onClick={handleSubmit} className="flex-1" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    'Crear negocio'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Footer */}
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">¿Qué sigue?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Recibirás un código de invitación único para compartir con empleados</li>
                <li>Podrás configurar sedes, servicios y horarios</li>
                <li>Invita a empleados escaneando tu código QR</li>
                <li>Empieza a recibir y gestionar citas</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
