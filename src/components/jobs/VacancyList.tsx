import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Clock, 
  Users, 
  Eye,
  Plus,
  Filter,
  Search,
  MoreVertical,
  Edit,
  XCircle
} from 'lucide-react'

interface VacancyListProps {
  businessId: string
  onCreateNew?: () => void
  onSelectVacancy?: (vacancyId: string) => void
  onEdit?: (vacancyId: string) => void
  onViewApplications?: (vacancyId: string) => void
  statusFilter?: 'open' | 'closed' | 'all'
  highlightedVacancyId?: string // ID de vacante para resaltar temporalmente
}

interface JobVacancy {
  id: string
  business_id: string
  title: string
  description: string
  requirements: string | null
  position_type: string
  experience_required: string | null
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
  locations?: {
    name: string
    city: string
  }
}

const POSITION_TYPES = {
  full_time: 'Tiempo Completo',
  part_time: 'Medio Tiempo',
  freelance: 'Freelance',
  temporary: 'Temporal'
}

const EXPERIENCE_LEVELS = {
  entry_level: 'Principiante',
  mid_level: 'Intermedio',
  senior: 'Senior'
}

const STATUS_COLORS = {
  open: 'bg-green-500/10 text-green-500 border-green-500/20',
  paused: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  closed: 'bg-muted text-muted-foreground border-border',
  filled: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
}

const STATUS_LABELS = {
  open: 'Abierta',
  paused: 'Pausada',
  closed: 'Cerrada',
  filled: 'Ocupada'
}

export function VacancyList({ 
  businessId, 
  onCreateNew, 
  onSelectVacancy, 
  onEdit,
  onViewApplications,
  statusFilter: propStatusFilter = 'all',
  highlightedVacancyId
}: Readonly<VacancyListProps>) {
  const [vacancies, setVacancies] = useState<JobVacancy[]>([])
  const [filteredVacancies, setFilteredVacancies] = useState<JobVacancy[]>([])
  const [loading, setLoading] = useState(true)
  const [highlightId, setHighlightId] = useState<string | null>(highlightedVacancyId || null)
  const highlightRef = useRef<HTMLDivElement>(null)

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>(propStatusFilter)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Handler para cerrar una vacante
  const handleCloseVacancy = async (vacancyId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      const { error } = await supabase
        .from('job_vacancies')
        .update({ status: 'closed' })
        .eq('id', vacancyId)

      if (error) throw error

      toast.success('Vacante cerrada exitosamente')
      loadVacancies() // Recargar lista
    } catch {
      toast.error('Error al cerrar la vacante')
    }
  }

  // Efecto para scroll automático cuando se resalta una vacante
  useEffect(() => {
    if (highlightId && highlightRef.current) {
      setTimeout(() => {
        highlightRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        })
      }, 100) // Pequeño delay para asegurar que el elemento esté renderizado
    }
  }, [highlightId])

  // Efecto para remover highlight después de 3 segundos
  useEffect(() => {
    if (highlightId) {
      const timer = setTimeout(() => {
        setHighlightId(null)
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }, [highlightId])

  const loadVacancies = useCallback(async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('job_vacancies')
        .select(`
          *,
          locations (
            name,
            city
          )
        `)
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setVacancies(data || [])
    } catch {
      toast.error('No se pudieron cargar las vacantes')
    } finally {
      setLoading(false)
    }
  }, [businessId])

  const applyFilters = useCallback(() => {
    let filtered = [...vacancies]

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter)
    }

    // Filtro por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(v => v.position_type === typeFilter)
    }

    // Búsqueda por título
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(v => 
        v.title.toLowerCase().includes(query) ||
        v.description.toLowerCase().includes(query)
      )
    }

    setFilteredVacancies(filtered)
  }, [vacancies, statusFilter, typeFilter, searchQuery])

  useEffect(() => {
    loadVacancies()
  }, [loadVacancies])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const formatSalary = (min: number | null, max: number | null, currency: string) => {
    if (!min && !max) return 'A convenir'
    
    const formatter = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency || 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })

    if (min && max) {
      return `${formatter.format(min)} - ${formatter.format(max)}`
    }
    if (min) {
      return `Desde ${formatter.format(min)}`
    }
    return `Hasta ${formatter.format(max!)}`
  }

  const getDaysAgo = (date: string) => {
    const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Hoy'
    if (days === 1) return 'Ayer'
    return `Hace ${days} días`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando vacantes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-foreground">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="open">Abiertas</SelectItem>
                  <SelectItem value="paused">Pausadas</SelectItem>
                  <SelectItem value="closed">Cerradas</SelectItem>
                  <SelectItem value="filled">Ocupadas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-foreground">Tipo de Posición</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="full_time">Tiempo Completo</SelectItem>
                  <SelectItem value="part_time">Medio Tiempo</SelectItem>
                  <SelectItem value="freelance">Freelance</SelectItem>
                  <SelectItem value="temporary">Temporal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-foreground">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Título o descripción"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-background border-border text-foreground pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de vacantes */}
      {filteredVacancies.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12">
            <div className="text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {vacancies.length === 0 ? 'No hay vacantes publicadas' : 'No se encontraron vacantes'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {vacancies.length === 0 
                  ? 'Crea tu primera vacante para empezar a recibir aplicaciones'
                  : 'Intenta ajustar los filtros de búsqueda'
                }
              </p>
              {vacancies.length === 0 && (
                <Button onClick={onCreateNew} className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primera Vacante
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredVacancies.map((vacancy) => (
            <Card 
              key={vacancy.id}
              ref={vacancy.id === highlightId ? highlightRef : null}
              className={cn(
                "bg-card border-border hover:border-primary/50 transition-all",
                vacancy.id === highlightId && "ring-2 ring-primary shadow-lg animate-pulse"
              )}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-foreground">{vacancy.title}</CardTitle>
                      <Badge 
                        variant="outline" 
                        className={STATUS_COLORS[vacancy.status as keyof typeof STATUS_COLORS]}
                      >
                        {STATUS_LABELS[vacancy.status as keyof typeof STATUS_LABELS]}
                      </Badge>
                    </div>
                    <CardDescription className="text-muted-foreground line-clamp-2">
                      {vacancy.description}
                    </CardDescription>
                  </div>
                  
                  {/* Menú de acciones */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onViewApplications) onViewApplications(vacancy.id)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Aplicaciones
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onEdit) onEdit(vacancy.id)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      {vacancy.status === 'open' && (
                        <DropdownMenuItem
                          onClick={(e) => handleCloseVacancy(vacancy.id, e)}
                          className="text-destructive focus:text-destructive"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Cerrar Vacante
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    <span>{POSITION_TYPES[vacancy.position_type as keyof typeof POSITION_TYPES]}</span>
                  </div>

                  {vacancy.locations && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{vacancy.locations.city}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>{formatSalary(vacancy.salary_min, vacancy.salary_max, vacancy.currency)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{getDaysAgo(vacancy.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-foreground font-semibold">{vacancy.applications_count}</span>
                    <span>aplicaciones</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4 text-blue-500" />
                    <span className="text-foreground font-semibold">{vacancy.views_count}</span>
                    <span>vistas</span>
                  </div>

                  {vacancy.experience_required && (
                    <Badge variant="outline" className="border-border text-foreground">
                      {EXPERIENCE_LEVELS[vacancy.experience_required as keyof typeof EXPERIENCE_LEVELS]}
                    </Badge>
                  )}

                  {vacancy.remote_allowed && (
                    <Badge variant="outline" className="border-blue-500/20 text-blue-600 dark:text-blue-400">
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
