import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { X, Save, Briefcase } from 'lucide-react'

interface CreateVacancyProps {
  businessId: string
  vacancyId?: string | null
  onClose: () => void
  onSuccess: () => void
}

interface Location {
  id: string
  name: string
  city: string
}

export function CreateVacancy({ businessId, vacancyId, onClose, onSuccess }: Readonly<CreateVacancyProps>) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(!!vacancyId)
  const [locations, setLocations] = useState<Location[]>([])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    benefits: '',
    position_type: 'full_time',
    experience_required: 'entry_level',
    salary_min: '',
    salary_max: '',
    currency: 'COP',
    location_id: '',
    remote_allowed: false,
    status: 'open'
  })

  const loadLocations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name, city')
        .eq('business_id', businessId)
        .order('name')

      if (error) throw error
      setLocations(data || [])
    } catch {
      toast.error('Error al cargar ubicaciones')
    }
  }, [businessId])

  const loadVacancy = useCallback(async () => {
    if (!vacancyId) return

    try {
      setLoadingData(true)

      const { data, error } = await supabase
        .from('job_vacancies')
        .select('*')
        .eq('id', vacancyId)
        .single()

      if (error) throw error

      if (data) {
        setFormData({
          title: data.title,
          description: data.description,
          requirements: data.requirements || '',
          responsibilities: data.responsibilities || '',
          benefits: data.benefits || '',
          position_type: data.position_type,
          experience_required: data.experience_required || 'entry_level',
          salary_min: data.salary_min?.toString() || '',
          salary_max: data.salary_max?.toString() || '',
          currency: data.currency,
          location_id: data.location_id || '',
          remote_allowed: data.remote_allowed,
          status: data.status
        })
      }
    } catch {
      toast.error('Error al cargar la vacante')
    } finally {
      setLoadingData(false)
    }
  }, [vacancyId])

  useEffect(() => {
    loadLocations()
    if (vacancyId) {
      loadVacancy()
    }
  }, [vacancyId, loadLocations, loadVacancy])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('El título es requerido')
      return
    }

    if (!formData.description.trim()) {
      toast.error('La descripción es requerida')
      return
    }

    try {
      setLoading(true)

      const vacancyData = {
        business_id: businessId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        requirements: formData.requirements.trim() || null,
        responsibilities: formData.responsibilities.trim() || null,
        benefits: formData.benefits.trim() || null,
        position_type: formData.position_type,
        experience_required: formData.experience_required,
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
        currency: formData.currency,
        location_id: formData.location_id || null,
        remote_allowed: formData.remote_allowed,
        status: formData.status,
        published_at: formData.status === 'open' ? new Date().toISOString() : null
      }

      if (vacancyId) {
        // Actualizar
        const { error } = await supabase
          .from('job_vacancies')
          .update(vacancyData)
          .eq('id', vacancyId)

        if (error) throw error
        toast.success('Vacante actualizada exitosamente')
      } else {
        // Crear
        const { error } = await supabase
          .from('job_vacancies')
          .insert([vacancyData])

        if (error) throw error
        toast.success('Vacante creada exitosamente')
      }

      onSuccess()
      onClose()
    } catch {
      toast.error(vacancyId ? 'Error al actualizar la vacante' : 'Error al crear la vacante')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando datos...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Briefcase className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {vacancyId ? 'Editar Vacante' : 'Nueva Vacante'}
            </h2>
            <p className="text-muted-foreground text-sm">
              {vacancyId ? 'Actualiza la información de la vacante' : 'Completa la información de la nueva vacante'}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={onClose} className="border-border">
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Información Básica</CardTitle>
            <CardDescription className="text-muted-foreground">
              Datos principales de la vacante
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-foreground">Título del Puesto *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Estilista Profesional"
                className="bg-background border-border text-foreground"
                required
              />
            </div>

            <div>
              <Label className="text-foreground">Descripción *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe el puesto y las funciones principales"
                rows={4}
                className="bg-background border-border text-foreground"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground">Tipo de Posición</Label>
                <Select 
                  value={formData.position_type} 
                  onValueChange={(value) => setFormData({ ...formData, position_type: value })}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="full_time">Tiempo Completo</SelectItem>
                    <SelectItem value="part_time">Medio Tiempo</SelectItem>
                    <SelectItem value="freelance">Freelance</SelectItem>
                    <SelectItem value="temporary">Temporal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-foreground">Experiencia Requerida</Label>
                <Select 
                  value={formData.experience_required} 
                  onValueChange={(value) => setFormData({ ...formData, experience_required: value })}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="entry_level">Principiante</SelectItem>
                    <SelectItem value="mid_level">Intermedio</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detalles Adicionales */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Detalles Adicionales</CardTitle>
            <CardDescription className="text-muted-foreground">
              Información complementaria
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-foreground">Requisitos</Label>
              <Textarea
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                placeholder="Lista los requisitos necesarios para el puesto"
                rows={3}
                className="bg-background border-border text-foreground"
              />
            </div>

            <div>
              <Label className="text-foreground">Responsabilidades</Label>
              <Textarea
                value={formData.responsibilities}
                onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                placeholder="Describe las responsabilidades del puesto"
                rows={3}
                className="bg-background border-border text-foreground"
              />
            </div>

            <div>
              <Label className="text-foreground">Beneficios</Label>
              <Textarea
                value={formData.benefits}
                onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                placeholder="Describe los beneficios que ofreces"
                rows={3}
                className="bg-background border-border text-foreground"
              />
            </div>
          </CardContent>
        </Card>

        {/* Compensación y Ubicación */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Compensación y Ubicación</CardTitle>
            <CardDescription className="text-muted-foreground">
              Salario y lugar de trabajo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-foreground">Salario Mínimo</Label>
                <Input
                  type="number"
                  value={formData.salary_min}
                  onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                  placeholder="0"
                  className="bg-background border-border text-foreground"
                />
              </div>

              <div>
                <Label className="text-foreground">Salario Máximo</Label>
                <Input
                  type="number"
                  value={formData.salary_max}
                  onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                  placeholder="0"
                  className="bg-background border-border text-foreground"
                />
              </div>

              <div>
                <Label className="text-foreground">Moneda</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="COP">COP (Peso Colombiano)</SelectItem>
                    <SelectItem value="USD">USD (Dólar)</SelectItem>
                    <SelectItem value="EUR">EUR (Euro)</SelectItem>
                    <SelectItem value="MXN">MXN (Peso Mexicano)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-foreground">Ubicación</Label>
              <Select 
                value={formData.location_id} 
                onValueChange={(value) => setFormData({ ...formData, location_id: value })}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Selecciona una ubicación" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="">Sin ubicación específica</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name} - {location.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
              <div>
                <Label className="text-foreground">Trabajo Remoto Disponible</Label>
                <p className="text-sm text-muted-foreground">Permite que el empleado trabaje desde casa</p>
              </div>
              <Switch
                checked={formData.remote_allowed}
                onCheckedChange={(checked) => setFormData({ ...formData, remote_allowed: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Estado */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Estado de Publicación</CardTitle>
            <CardDescription className="text-muted-foreground">
              Define si la vacante está visible para aplicantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label className="text-foreground">Estado</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="open">Abierta (Visible y aceptando aplicaciones)</SelectItem>
                  <SelectItem value="paused">Pausada (Visible pero no acepta aplicaciones)</SelectItem>
                  <SelectItem value="closed">Cerrada (No visible)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Botones */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-border"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="h-4 w-4 mr-2" />
            {(() => {
              if (loading) return 'Guardando...'
              return vacancyId ? 'Actualizar Vacante' : 'Crear Vacante'
            })()}
          </Button>
        </div>
      </form>
    </div>
  )
}
