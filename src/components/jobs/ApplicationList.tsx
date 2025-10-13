import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Star,
  Search,
  Filter,
  Clock,
  Building2
} from 'lucide-react'

interface ApplicationListProps {
  userId: string
  onViewApplication: (applicationId: string) => void
}

interface JobApplicationWithVacancy {
  id: string
  vacancy_id: string
  status: string
  cover_letter: string
  available_from: string | null
  reviewed_at: string | null
  interview_scheduled_at: string | null
  decision_at: string | null
  rating: number | null
  created_at: string
  job_vacancies: {
    id: string
    business_id: string
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

export function ApplicationList({ userId, onViewApplication }: Readonly<ApplicationListProps>) {
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<JobApplicationWithVacancy[]>([])
  const [filteredApplications, setFilteredApplications] = useState<JobApplicationWithVacancy[]>([])
  
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          job_vacancies (
            id,
            business_id,
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
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setApplications(data || [])
    } catch {
      toast.error('Error al cargar tus aplicaciones')
    } finally {
      setLoading(false)
    }
  }, [userId])

  const applyFilters = useCallback(() => {
    let filtered = [...applications]

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter)
    }

    // Filtrar por búsqueda (título del puesto o empresa)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(app => {
        const title = app.job_vacancies?.title.toLowerCase() || ''
        const company = app.job_vacancies?.businesses?.name.toLowerCase() || ''
        return title.includes(query) || company.includes(query)
      })
    }

    setFilteredApplications(filtered)
  }, [applications, statusFilter, searchQuery])

  useEffect(() => {
    loadApplications()
  }, [loadApplications])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

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

  const getStatusMessage = (app: JobApplicationWithVacancy) => {
    if (app.status === 'accepted') {
      return '¡Felicidades! Tu aplicación fue aceptada'
    }
    if (app.status === 'rejected') {
      return 'Tu aplicación no fue seleccionada'
    }
    if (app.status === 'interview' && app.interview_scheduled_at) {
      const interviewDate = new Date(app.interview_scheduled_at)
      return `Entrevista programada: ${interviewDate.toLocaleDateString('es-CO', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })}`
    }
    if (app.status === 'reviewing') {
      return 'El empleador está revisando tu aplicación'
    }
    if (app.status === 'withdrawn') {
      return 'Retiraste tu aplicación'
    }
    return 'Tu aplicación está siendo procesada'
  }

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando aplicaciones...</p>
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
            <h2 className="text-2xl font-bold text-foreground">Mis Aplicaciones</h2>
            <p className="text-muted-foreground text-sm">
              {filteredApplications.length} {filteredApplications.length === 1 ? 'aplicación' : 'aplicaciones'}
              {statusFilter !== 'all' && ` (filtradas)`}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filtros</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">Todos los Estados</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="reviewing">En Revisión</SelectItem>
                  <SelectItem value="interview">Entrevista</SelectItem>
                  <SelectItem value="accepted">Aceptada</SelectItem>
                  <SelectItem value="rejected">Rechazada</SelectItem>
                  <SelectItem value="withdrawn">Retirada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por puesto o empresa..."
                className="pl-10 bg-background border-border text-foreground"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Aplicaciones */}
      {filteredApplications.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12">
            <div className="text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {applications.length === 0 ? 'No tienes aplicaciones' : 'No se encontraron resultados'}
              </h3>
              <p className="text-muted-foreground">
                {applications.length === 0 
                  ? 'Comienza a aplicar a vacantes para verlas aquí'
                  : 'Intenta ajustar los filtros de búsqueda'
                }
              </p>
              {statusFilter !== 'all' || searchQuery.trim() !== '' ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusFilter('all')
                    setSearchQuery('')
                  }}
                  className="mt-4 border-border"
                >
                  Limpiar Filtros
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredApplications.map((application) => (
            <Card
              key={application.id}
              className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => onViewApplication(application.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {application.job_vacancies?.businesses?.logo_url ? (
                        <img
                          src={application.job_vacancies.businesses.logo_url}
                          alt={application.job_vacancies.businesses.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-foreground text-lg">
                          {application.job_vacancies?.title || 'Vacante Eliminada'}
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                          {application.job_vacancies?.businesses?.name || 'Empresa Desconocida'}
                        </CardDescription>
                      </div>
                    </div>
                  </div>

                  <Badge className={APPLICATION_STATUS_COLORS[application.status]}>
                    {APPLICATION_STATUS_LABELS[application.status]}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Mensaje de Estado */}
                <div className="p-3 bg-background rounded-lg border border-border">
                  <p className="text-sm text-foreground/90">{getStatusMessage(application)}</p>
                </div>

                {/* Información de la Vacante */}
                {application.job_vacancies && (
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
                            ? application.job_vacancies.locations.city
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
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Aplicaste {getDaysAgo(application.created_at)}</span>
                    </div>
                    {application.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-foreground font-medium">{application.rating}/5</span>
                      </div>
                    )}
                  </div>

                  {application.job_vacancies?.remote_allowed && (
                    <Badge variant="outline" className="border-green-500/30 text-green-400">
                      Remoto
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
