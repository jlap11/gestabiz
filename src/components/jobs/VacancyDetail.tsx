import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { 
  ArrowLeft, 
  Edit, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Clock, 
  Users, 
  Eye, 
  CheckCircle2,
  XCircle,
  Calendar,
  Star
} from 'lucide-react'

interface VacancyDetailProps {
  vacancyId: string
  businessId: string
  onBack: () => void
  onEdit: (vacancyId: string) => void
  onViewApplication: (applicationId: string) => void
}

interface JobVacancy {
  id: string
  business_id: string
  title: string
  description: string
  requirements: string | null
  responsibilities: string | null
  benefits: string | null
  position_type: string
  experience_required: string
  salary_min: number | null
  salary_max: number | null
  currency: string
  location_id: string | null
  remote_allowed: boolean
  status: string
  published_at: string | null
  expires_at: string | null
  views_count: number
  applications_count: number
  created_at: string
  locations: {
    name: string
    city: string
  } | null
}

interface JobApplication {
  id: string
  vacancy_id: string
  user_id: string
  status: string
  cover_letter: string
  available_from: string | null
  reviewed_at: string | null
  interview_scheduled_at: string | null
  decision_at: string | null
  rating: number | null
  created_at: string
  profiles: {
    full_name: string
    avatar_url: string | null
    email: string
  } | null
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-500/20 text-green-400 border-green-500/30',
  paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  closed: 'bg-muted text-muted-foreground border-border',
  filled: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
}

const STATUS_LABELS: Record<string, string> = {
  open: 'Abierta',
  paused: 'Pausada',
  closed: 'Cerrada',
  filled: 'Cubierta'
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

const APPLICATION_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  reviewing: 'bg-blue-500/20 text-blue-400',
  interview: 'bg-primary/20 text-primary',
  accepted: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
  withdrawn: 'bg-muted text-muted-foreground'
}

const APPLICATION_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  reviewing: 'En Revisión',
  interview: 'Entrevista',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  withdrawn: 'Retirada'
}

export function VacancyDetail({ 
  vacancyId, 
  businessId, 
  onBack, 
  onEdit, 
  onViewApplication 
}: Readonly<VacancyDetailProps>) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [vacancy, setVacancy] = useState<JobVacancy | null>(null)
  const [applications, setApplications] = useState<JobApplication[]>([])

  const loadVacancy = useCallback(async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('job_vacancies')
        .select('*, locations(name, city)')
        .eq('id', vacancyId)
        .single()

      if (error) throw error
      setVacancy(data)
    } catch {
      toast.error('Error al cargar la vacante')
      onBack()
    } finally {
      setLoading(false)
    }
  }, [vacancyId, onBack])

  const loadApplications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*, profiles(full_name, avatar_url, email)')
        .eq('vacancy_id', vacancyId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setApplications(data || [])
    } catch {
      toast.error('Error al cargar las aplicaciones')
    }
  }, [vacancyId])

  useEffect(() => {
    loadVacancy()
    loadApplications()
  }, [loadVacancy, loadApplications])

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

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando vacante...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!vacancy) {
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
            <h2 className="text-2xl font-bold text-foreground">{vacancy.title}</h2>
            <p className="text-muted-foreground text-sm">
              Publicada {getDaysAgo(vacancy.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={STATUS_COLORS[vacancy.status]}>
            {STATUS_LABELS[vacancy.status]}
          </Badge>
          <Button onClick={() => onEdit(vacancyId)} className="bg-primary hover:bg-primary/90">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      {/* Detalles de la Vacante */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Detalles de la Vacante
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Información Básica */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="text-foreground font-medium">{POSITION_TYPES[vacancy.position_type]}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Ubicación</p>
                <p className="text-foreground font-medium">
                  {vacancy.locations ? `${vacancy.locations.name}, ${vacancy.locations.city}` : 'Sin ubicación'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Salario</p>
                <p className="text-foreground font-medium">
                  {formatSalary(vacancy.salary_min, vacancy.salary_max, vacancy.currency)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Experiencia</p>
                <p className="text-foreground font-medium">{EXPERIENCE_LEVELS[vacancy.experience_required]}</p>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="flex items-center gap-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-foreground font-medium">{vacancy.applications_count}</span>
              <span className="text-muted-foreground">Aplicaciones</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              <span className="text-foreground font-medium">{vacancy.views_count}</span>
              <span className="text-muted-foreground">Vistas</span>
            </div>
            {vacancy.remote_allowed && (
              <Badge variant="outline" className="border-green-500/30 text-green-400">
                Remoto Disponible
              </Badge>
            )}
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <h3 className="text-foreground font-semibold">Descripción</h3>
            <p className="text-foreground/90 whitespace-pre-wrap">{vacancy.description}</p>
          </div>

          {/* Requisitos */}
          {vacancy.requirements && (
            <div className="space-y-2">
              <h3 className="text-foreground font-semibold">Requisitos</h3>
              <p className="text-foreground/90 whitespace-pre-wrap">{vacancy.requirements}</p>
            </div>
          )}

          {/* Responsabilidades */}
          {vacancy.responsibilities && (
            <div className="space-y-2">
              <h3 className="text-foreground font-semibold">Responsabilidades</h3>
              <p className="text-foreground/90 whitespace-pre-wrap">{vacancy.responsibilities}</p>
            </div>
          )}

          {/* Beneficios */}
          {vacancy.benefits && (
            <div className="space-y-2">
              <h3 className="text-foreground font-semibold">Beneficios</h3>
              <p className="text-foreground/90 whitespace-pre-wrap">{vacancy.benefits}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aplicaciones */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Aplicaciones Recibidas
            </span>
            <Badge variant="outline" className="border-primary/30 text-primary">
              {applications.length} Total
            </Badge>
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Lista de candidatos que han aplicado a esta vacante
          </CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay aplicaciones aún</p>
              <p className="text-sm text-muted-foreground/80 mt-2">
                Las aplicaciones aparecerán aquí cuando los candidatos apliquen
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((application) => (
                <button
                  key={application.id}
                  onClick={() => onViewApplication(application.id)}
                  className="w-full text-left p-4 bg-background rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={application.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {application.profiles ? getInitials(application.profiles.full_name) : '??'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-foreground font-medium">
                          {application.profiles?.full_name || 'Usuario Desconocido'}
                        </p>
                        <p className="text-sm text-muted-foreground">{application.profiles?.email}</p>
                        <p className="text-sm text-muted-foreground/80 mt-1">
                          Aplicó {getDaysAgo(application.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Badge className={APPLICATION_STATUS_COLORS[application.status]}>
                        {APPLICATION_STATUS_LABELS[application.status]}
                      </Badge>
                      {application.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-foreground text-sm font-medium">{application.rating}/5</span>
                        </div>
                      )}
                      {application.interview_scheduled_at && (
                        <div className="flex items-center gap-1 text-xs text-blue-400">
                          <Calendar className="h-3 w-3" />
                          {t('jobsUI.scheduledInterview')}
                        </div>
                      )}
                    </div>
                  </div>

                  {application.cover_letter && (
                    <p className="text-muted-foreground text-sm mt-3 line-clamp-2">
                      {application.cover_letter}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                    {application.reviewed_at && (
                      <div className="flex items-center gap-1 text-xs text-green-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Revisada
                      </div>
                    )}
                    {application.decision_at && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {application.status === 'accepted' ? (
                          <CheckCircle2 className="h-3 w-3 text-green-400" />
                        ) : (
                          <XCircle className="h-3 w-3 text-red-400" />
                        )}
                        Decisión tomada
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
