import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { 
  ArrowLeft, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Clock, 
  Calendar,
  Mail,
  Phone,
  Star,
  CheckCircle2,
  XCircle,
  Save,
  MessageSquare,
  Download,
  FileText
} from 'lucide-react'

interface ApplicationDetailProps {
  applicationId: string
  isAdmin?: boolean
  onBack: () => void
  onUpdate?: () => void
}

interface JobApplicationDetail {
  id: string
  vacancy_id: string
  user_id: string
  business_id: string
  status: string
  cover_letter: string
  cv_url: string | null
  available_from: string | null
  availability_notes: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  interview_scheduled_at: string | null
  decision_at: string | null
  decision_notes: string | null
  rating: number | null
  admin_notes: string | null
  created_at: string
  profiles: {
    full_name: string
    email: string
    phone: string | null
    avatar_url: string | null
  } | null
  job_vacancies: {
    id: string
    title: string
    description: string
    position_type: string
    experience_required: string
    salary_min: number | null
    salary_max: number | null
    currency: string
    status: string
    remote_allowed: boolean
    locations: {
      name: string
      city: string
    } | null
    businesses: {
      name: string
      logo_url: string | null
    } | null
  } | null
}

const APPLICATION_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  reviewing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  interview: 'bg-primary/20 text-primary border-primary/30',
  accepted: 'bg-green-500/20 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  withdrawn: 'bg-muted text-muted-foreground border-border'
}

const APPLICATION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  reviewing: 'En Revisión',
  interview: 'Entrevista',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  withdrawn: 'Retirada'
}

const POSITION_TYPES: Record<string, string> = {
  full_time: 'Tiempo Completo',
  part_time: 'Medio Tiempo',
  freelance: 'Freelance',
  temporary: 'Temporal'
}

const EXPERIENCE_LEVELS: Record<string, string> = {
  entry_level: 'Principiante',
  mid_level: 'Intermedio',
  senior: 'Senior'
}

export function ApplicationDetail({ 
  applicationId, 
  isAdmin = false, 
  onBack, 
  onUpdate 
}: Readonly<ApplicationDetailProps>) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [application, setApplication] = useState<JobApplicationDetail | null>(null)

  // Estados para admin
  const [editMode, setEditMode] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [newRating, setNewRating] = useState<number | null>(null)
  const [newAdminNotes, setNewAdminNotes] = useState('')
  const [newDecisionNotes, setNewDecisionNotes] = useState('')
  const [newInterviewDate, setNewInterviewDate] = useState('')

  // Function to download CV
  const [downloadingCV, setDownloadingCV] = useState(false)

  const handleDownloadCV = async () => {
    if (!application?.cv_url) return

    try {
      setDownloadingCV(true)
      
      const { data, error } = await supabase.storage
        .from('cvs')
        .download(application.cv_url)

      if (error) throw error

      // Create blob URL and trigger download
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      
      // Extract filename from path (format: user_id/vacancy_id_timestamp.ext)
      const fileName = application.cv_url.split('/').pop() || 'cv.pdf'
      a.download = `cv_${application.profiles?.full_name?.replace(/\s+/g, '_')}_${fileName}`
      
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('CV descargado exitosamente')
    } catch (err) {
      const error = err as Error
      toast.error('Error al descargar CV: ' + error.message)
    } finally {
      setDownloadingCV(false)
    }
  }

  const loadApplication = useCallback(async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          profiles (full_name, email, phone, avatar_url),
          job_vacancies (
            id,
            title,
            description,
            position_type,
            experience_required,
            salary_min,
            salary_max,
            currency,
            status,
            remote_allowed,
            locations (name, city),
            businesses (name, logo_url)
          )
        `)
        .eq('id', applicationId)
        .single()

      if (error) throw error

      setApplication(data)
      setNewStatus(data.status)
      setNewRating(data.rating)
      setNewAdminNotes(data.admin_notes || '')
      setNewDecisionNotes(data.decision_notes || '')
      setNewInterviewDate(data.interview_scheduled_at ? new Date(data.interview_scheduled_at).toISOString().slice(0, 16) : '')
    } catch {
      toast.error('Error al cargar la aplicación')
      onBack()
    } finally {
      setLoading(false)
    }
  }, [applicationId, onBack])

  useEffect(() => {
    loadApplication()
  }, [loadApplication])

  const handleSave = async () => {
    if (!application) return

    try {
      setSaving(true)

      const updates: Record<string, unknown> = {
        status: newStatus,
        rating: newRating,
        admin_notes: newAdminNotes.trim() || null,
        decision_notes: newDecisionNotes.trim() || null,
        interview_scheduled_at: newInterviewDate || null
      }

      // Marcar como revisada si cambia de pending
      if (application.status === 'pending' && newStatus !== 'pending') {
        const { data: { user } } = await supabase.auth.getUser()
        updates.reviewed_at = new Date().toISOString()
        updates.reviewed_by = user?.id || null
      }

      // Marcar decisión si acepta o rechaza
      if ((newStatus === 'accepted' || newStatus === 'rejected') && !application.decision_at) {
        updates.decision_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('job_applications')
        .update(updates)
        .eq('id', applicationId)

      if (error) throw error

      toast.success('Aplicación actualizada exitosamente')
      setEditMode(false)
      loadApplication()
      if (onUpdate) onUpdate()
    } catch {
      toast.error('Error al actualizar la aplicación')
    } finally {
      setSaving(false)
    }
  }

  const formatSalary = (min: number | null, max: number | null, currency: string) => {
    const formatter = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    })

    if (min && max) {
      return `${formatter.format(min)} - ${formatter.format(max)}`
    } else if (min) {
      return `Desde ${formatter.format(min)}`
    } else if (max) {
      return `Hasta ${formatter.format(max)}`
    }
    return 'A convenir'
  }

  const getDaysAgo = (date: string) => {
    const days = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Hoy'
    if (days === 1) return 'Ayer'
    return `Hace ${days} días`
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const renderStars = (rating: number | null, interactive: boolean = false) => {
    const currentRating = rating || 0
    const stars = Array.from({ length: 5 }, (_, index) => {
      const i = index + 1
      return (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => {
            if (interactive) {
              setNewRating(i)
            }
          }}
          className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
        >
          <Star
            className={`h-6 w-6 ${
              i <= currentRating
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-muted-foreground'
            }`}
          />
        </button>
      )
    })
    return stars
  }

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando aplicación...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!application) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="border-border">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Detalles de Aplicación</h2>
            <p className="text-muted-foreground text-sm">
              Aplicada {getDaysAgo(application.created_at)}
            </p>
          </div>
        </div>
        <Badge className={APPLICATION_STATUS_COLORS[application.status]}>
          {APPLICATION_STATUS_LABELS[application.status]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información de la Vacante */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center gap-3">
                {application.job_vacancies?.businesses?.logo_url && (
                  <img
                    src={application.job_vacancies.businesses.logo_url}
                    alt={application.job_vacancies.businesses.name}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                )}
                <div>
                  <CardTitle className="text-foreground">
                    {application.job_vacancies?.title || 'Vacante Eliminada'}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {application.job_vacancies?.businesses?.name || 'Empresa Desconocida'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {application.job_vacancies && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-start gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Tipo</p>
                        <p className="text-sm text-foreground font-medium">
                          {POSITION_TYPES[application.job_vacancies.position_type]}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Ubicación</p>
                        <p className="text-sm text-foreground font-medium">
                          {application.job_vacancies.locations
                            ? `${application.job_vacancies.locations.name}, ${application.job_vacancies.locations.city}`
                            : 'Sin ubicación'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Salario</p>
                        <p className="text-sm text-foreground font-medium">
                          {formatSalary(
                            application.job_vacancies.salary_min,
                            application.job_vacancies.salary_max,
                            application.job_vacancies.currency
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Experiencia</p>
                        <p className="text-sm text-foreground font-medium">
                          {EXPERIENCE_LEVELS[application.job_vacancies.experience_required]}
                        </p>
                      </div>
                    </div>
                  </div>

                  {application.job_vacancies.remote_allowed && (
                    <Badge variant="outline" className="border-green-500/30 text-green-400">
                      Trabajo Remoto Disponible
                    </Badge>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Carta de Presentación */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Carta de Presentación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/90 whitespace-pre-wrap">
                {application.cover_letter || 'Sin carta de presentación'}
              </p>
            </CardContent>
          </Card>

          {/* Hoja de Vida */}
          {application.cv_url && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Hoja de Vida
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {application.cv_url.split('/').pop()?.split('_').slice(-1)[0] || 'curriculum.pdf'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {application.cv_url.endsWith('.pdf') ? 'PDF' : 'DOCX'} • 
                        Cargado {getDaysAgo(application.created_at)}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleDownloadCV}
                    disabled={downloadingCV}
                    variant="outline"
                    size="sm"
                  >
                    {downloadingCV ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Descargando...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Disponibilidad */}
          {(application.available_from || application.availability_notes) && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Disponibilidad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {application.available_from && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t('jobsUI.availableFrom')}:</p>
                    <p className="text-foreground font-medium">
                      {new Date(application.available_from).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                {application.availability_notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Notas de disponibilidad:</p>
                    <p className="text-foreground/90">{application.availability_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna Lateral */}
        <div className="space-y-6">
          {/* Información del Candidato */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Candidato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={application.profiles?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-lg">
                    {application.profiles ? getInitials(application.profiles.full_name) : '??'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-foreground font-semibold">
                    {application.profiles?.full_name || 'Usuario Desconocido'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-foreground/90">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{application.profiles?.email || 'Sin email'}</span>
                </div>

                {application.profiles?.phone && (
                  <div className="flex items-center gap-2 text-foreground/90">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{application.profiles.phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Panel de Admin */}
          {isAdmin && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Gestión (Admin)</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Actualiza el estado y califica al candidato
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!editMode ? (
                  <>
                    {/* Vista de Solo Lectura */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-foreground">Calificación</Label>
                        <div className="flex items-center gap-1 mt-2">
                          {renderStars(application.rating, false)}
                          <span className="ml-2 text-muted-foreground">
                            {application.rating ? `${application.rating}/5` : 'Sin calificar'}
                          </span>
                        </div>
                      </div>

                      {application.interview_scheduled_at && (
                        <div>
                          <Label className="text-foreground">{t('jobsUI.scheduledInterview')}</Label>
                          <p className="text-foreground/90 mt-1">
                            {new Date(application.interview_scheduled_at).toLocaleString('es-CO')}
                          </p>
                        </div>
                      )}

                      {application.reviewed_at && (
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Revisada {getDaysAgo(application.reviewed_at)}</span>
                        </div>
                      )}

                      {application.decision_at && (
                        <div className="flex items-center gap-2 text-sm">
                          {application.status === 'accepted' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-400" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-400" />
                          )}
                          <span className="text-muted-foreground">
                            Decisión tomada {getDaysAgo(application.decision_at)}
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={() => setEditMode(true)}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      Editar
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Modo de Edición */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-foreground">Estado</Label>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                          <SelectTrigger className="bg-background border-border text-foreground mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="reviewing">En Revisión</SelectItem>
                            <SelectItem value="interview">Entrevista</SelectItem>
                            <SelectItem value="accepted">Aceptada</SelectItem>
                            <SelectItem value="rejected">Rechazada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-foreground">Calificación</Label>
                        <div className="flex items-center gap-1 mt-2">
                          {renderStars(newRating, true)}
                          <button
                            type="button"
                            onClick={() => setNewRating(null)}
                            className="ml-2 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Limpiar
                          </button>
                        </div>
                      </div>

                      <div>
                        <Label className="text-foreground">Fecha de Entrevista</Label>
                        <input
                          type="datetime-local"
                          value={newInterviewDate}
                          onChange={(e) => setNewInterviewDate(e.target.value)}
                          className="w-full mt-2 px-3 py-2 bg-background border border-border rounded-md text-foreground"
                        />
                      </div>

                      <div>
                        <Label className="text-foreground">Notas de Decisión</Label>
                        <Textarea
                          value={newDecisionNotes}
                          onChange={(e) => setNewDecisionNotes(e.target.value)}
                          placeholder="Razón de la decisión..."
                          rows={3}
                          className="bg-background border-border text-foreground mt-2"
                        />
                      </div>

                      <div>
                        <Label className="text-foreground">{t('jobsUI.administrativeNotes')}</Label>
                        <Textarea
                          value={newAdminNotes}
                          onChange={(e) => setNewAdminNotes(e.target.value)}
                          placeholder="Notas internas..."
                          rows={3}
                          className="bg-background border-border text-foreground mt-2"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditMode(false)
                          setNewStatus(application.status)
                          setNewRating(application.rating)
                          setNewAdminNotes(application.admin_notes || '')
                          setNewDecisionNotes(application.decision_notes || '')
                          setNewInterviewDate(application.interview_scheduled_at ? new Date(application.interview_scheduled_at).toISOString().slice(0, 16) : '')
                        }}
                        className="flex-1 border-border"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 bg-primary hover:bg-primary/90"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Guardando...' : 'Guardar'}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notas Administrativas (Solo para Admin cuando hay notas) */}
          {isAdmin && application.admin_notes && !editMode && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">{t('jobsUI.administrativeNotes')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/90 whitespace-pre-wrap">{application.admin_notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Notas de Decisión */}
          {application.decision_notes && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Notas de Decisión</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/90 whitespace-pre-wrap">{application.decision_notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
