import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { CitySelect } from '@/components/catalog/CitySelect'
import { RegionSelect } from '@/components/catalog/RegionSelect'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Briefcase,
  DollarSign,
  Loader2,
  MapPin,
  Search,
  SlidersHorizontal,
  TrendingUp,
  X,
} from 'lucide-react'
import {
  type MatchingVacancy,
  type VacancyFilters,
  useMatchingVacancies,
} from '@/hooks/useMatchingVacancies'
import { VacancyCard } from './VacancyCard'
import { ApplicationFormModal } from './ApplicationFormModal'
import { MyApplicationsModal } from './MyApplicationsModal'
import { getColombiaId } from '@/hooks/useCatalogs'

interface AvailableVacanciesMarketplaceProps {
  userId: string
}

export const AvailableVacanciesMarketplace: React.FC<AvailableVacanciesMarketplaceProps> = ({
  userId,
}) => {
  const { t } = useLanguage()
  const {
    vacancies,
    loading,
    fetchMatchingVacancies,
    sortVacancies,
    resetFilters: resetHookFilters,
  } = useMatchingVacancies()

  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedVacancy, setSelectedVacancy] = useState<MatchingVacancy | null>(null)
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [showMyApplications, setShowMyApplications] = useState(false)
  const [viewDetailsVacancy, setViewDetailsVacancy] = useState<MatchingVacancy | null>(null)
  const [sortBy, setSortBy] = useState<
    'match_score' | 'salary' | 'published_at' | 'applications_count'
  >('match_score')

  // Local filters state
  const [filters, setFilters] = useState<VacancyFilters>({})

  // Location cascade state
  const [colombiaId, setColombiaId] = useState<string | null>(null)
  const [regionId, setRegionId] = useState<string>('')
  const [cityId, setCityId] = useState<string>('')

  // Load Colombia ID on mount
  useEffect(() => {
    const loadColombiaId = async () => {
      const id = await getColombiaId()
      setColombiaId(id)
    }
    loadColombiaId()
  }, [])

  // Fetch on mount
  useEffect(() => {
    fetchMatchingVacancies(userId, filters)
  }, [])

  // Búsqueda en tiempo real
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMatchingVacancies(userId, { ...filters, city: searchQuery || undefined })
    }, 300) // Debounce 300ms

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Apply filters cuando cambian
  useEffect(() => {
    fetchMatchingVacancies(userId, filters)
  }, [filters])

  // Apply sort cuando cambia
  useEffect(() => {
    sortVacancies(sortBy, 'desc')
  }, [sortBy])

  const updateFilters = (newFilters: Partial<VacancyFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const resetFilters = () => {
    setFilters({})
    setSearchQuery('')
    setRegionId('')
    setCityId('')
    resetHookFilters()
  }

  const handleApply = (vacancyId: string) => {
    const vacancy = vacancies.find(v => v.id === vacancyId)
    if (vacancy) {
      setSelectedVacancy(vacancy)
      setShowApplicationModal(true)
    }
  }

  const handleViewDetails = (vacancyId: string) => {
    const vacancy = vacancies.find(v => v.id === vacancyId)
    if (vacancy) {
      setViewDetailsVacancy(vacancy)
    }
  }

  const handleApplicationSuccess = () => {
    // Refrescar la lista después de aplicar
    window.location.reload()
  }

  const activeFiltersCount = Object.entries(filters).filter(
    ([key, value]) => value && key !== 'search'
  ).length

  const formatSalary = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vacantes Disponibles</h1>
          <p className="text-muted-foreground">
            Encuentra oportunidades laborales que se ajusten a tu perfil
          </p>
        </div>

        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cargo, empresa, ubicación..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          <Button variant="outline" onClick={() => setShowMyApplications(true)} className="gap-2">
            <Briefcase className="h-4 w-4" />
            Mis Aplicaciones
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Filtros de Búsqueda</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Limpiar
                </Button>
              </div>
            </div>
            <CardDescription>Refina tu búsqueda con estos filtros</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* País */}
            <div className="space-y-2">
              <Label htmlFor="country-filter" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                País
              </Label>
              <Input
                id="country-filter"
                value="Colombia"
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>

            {/* Departamento */}
            <div className="space-y-2">
              <Label htmlFor="region-filter" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Departamento
              </Label>
              <RegionSelect
                countryId={colombiaId || ''}
                value={regionId}
                onChange={value => {
                  setRegionId(value)
                  setCityId('') // Reset city when region changes
                }}
                disabled={!colombiaId}
                placeholder={t('common.placeholders.selectDepartment')}
              />
            </div>

            {/* Ciudad */}
            <div className="space-y-2">
              <Label htmlFor="city-filter" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Ciudad
              </Label>
              <CitySelect
                regionId={regionId}
                value={cityId}
                onChange={value => {
                  setCityId(value)
                  updateFilters({ city: value })
                }}
                disabled={!regionId}
                placeholder={
                  regionId ? 'Seleccione una ciudad' : 'Primero seleccione un departamento'
                }
              />
            </div>

            {/* Tipo de posición */}
            <div className="space-y-2">
              <Label htmlFor="position-type-filter" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Tipo de Posición
              </Label>
              <Select
                value={filters.position_type || 'all-types'}
                onValueChange={value =>
                  updateFilters({ position_type: value === 'all-types' ? undefined : value })
                }
              >
                <SelectTrigger id="position-type-filter">
                  <SelectValue placeholder={t('common.placeholders.all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-types">Todos</SelectItem>
                  <SelectItem value="full_time">Tiempo Completo</SelectItem>
                  <SelectItem value="part_time">Medio Tiempo</SelectItem>
                  <SelectItem value="contract">Contrato</SelectItem>
                  <SelectItem value="temporary">Temporal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nivel de experiencia */}
            <div className="space-y-2">
              <Label htmlFor="experience-filter" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Experiencia
              </Label>
              <Select
                value={filters.experience_level || 'all-levels'}
                onValueChange={value =>
                  updateFilters({ experience_level: value === 'all-levels' ? undefined : value })
                }
              >
                <SelectTrigger id="experience-filter">
                  <SelectValue placeholder={t('common.placeholders.all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-levels">Todos</SelectItem>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="mid">Intermedio</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rango salarial */}
            <div className="space-y-2">
              <Label htmlFor="min-salary-filter" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Salario Mínimo
              </Label>
              <Input
                id="min-salary-filter"
                type="number"
                placeholder="Ej: 2000000"
                value={filters.min_salary || ''}
                onChange={e =>
                  updateFilters({ min_salary: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-salary-filter" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Salario Máximo
              </Label>
              <Input
                id="max-salary-filter"
                type="number"
                placeholder="Ej: 5000000"
                value={filters.max_salary || ''}
                onChange={e =>
                  updateFilters({ max_salary: e.target.value ? Number(e.target.value) : undefined })
                }
              />
            </div>

            {/* Solo remoto - Full width with Switch */}
            <div className="space-y-2 md:col-span-2 lg:col-span-3">
              <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
                <div className="space-y-0.5">
                  <Label htmlFor="remote-filter" className="text-base font-medium text-foreground">
                    Solo Trabajos Remotos
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar únicamente vacantes que permiten trabajo 100% remoto
                  </p>
                </div>
                <Switch
                  id="remote-filter"
                  checked={filters.remote_only || false}
                  onCheckedChange={checked => updateFilters({ remote_only: checked === true })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sorting and Results Count */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {loading ? (
            <span>Cargando...</span>
          ) : (
            <span>
              {vacancies.length}{' '}
              {vacancies.length === 1 ? 'vacante encontrada' : 'vacantes encontradas'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="sort-by" className="text-sm">
            Ordenar por:
          </Label>
          <Select value={sortBy} onValueChange={value => setSortBy(value as typeof sortBy)}>
            <SelectTrigger id="sort-by" className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="match_score">Mejor Match</SelectItem>
              <SelectItem value="salary">Salario (Mayor a Menor)</SelectItem>
              <SelectItem value="published_at">Más Recientes</SelectItem>
              <SelectItem value="applications_count">Más Populares</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Results Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : vacancies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron vacantes</h3>
            <p className="text-muted-foreground mb-4">
              Intenta ajustar tus filtros o revisa más tarde
            </p>
            <Button onClick={resetFilters}>Limpiar Filtros</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vacancies.map(vacancy => (
            <VacancyCard
              key={vacancy.id}
              vacancy={vacancy}
              onApply={handleApply}
              onViewDetails={handleViewDetails}
              showMatchScore={true}
            />
          ))}
        </div>
      )}

      {/* Application Modal */}
      <ApplicationFormModal
        vacancy={selectedVacancy}
        userId={userId}
        isOpen={showApplicationModal}
        onClose={() => {
          setShowApplicationModal(false)
          setSelectedVacancy(null)
        }}
        onSuccess={handleApplicationSuccess}
      />

      {/* Details Modal (placeholder - you can implement a detailed view) */}
      {viewDetailsVacancy && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle>{viewDetailsVacancy.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {viewDetailsVacancy.description}
                  </CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setViewDetailsVacancy(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {viewDetailsVacancy.requirements && (
                <div>
                  <h4 className="font-semibold mb-2">Requisitos</h4>
                  <p className="text-sm text-muted-foreground">{viewDetailsVacancy.requirements}</p>
                </div>
              )}
              {viewDetailsVacancy.responsibilities && (
                <div>
                  <h4 className="font-semibold mb-2">Responsabilidades</h4>
                  <p className="text-sm text-muted-foreground">
                    {viewDetailsVacancy.responsibilities}
                  </p>
                </div>
              )}
              {viewDetailsVacancy.benefits && viewDetailsVacancy.benefits.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Beneficios</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewDetailsVacancy.benefits.map((benefit, index) => (
                      <Badge key={index} variant="outline">
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {(viewDetailsVacancy.salary_min || viewDetailsVacancy.salary_max) && (
                <div>
                  <h4 className="font-semibold mb-2">Salario</h4>
                  <p className="text-sm">
                    {viewDetailsVacancy.salary_min && formatSalary(viewDetailsVacancy.salary_min)}
                    {viewDetailsVacancy.salary_min && viewDetailsVacancy.salary_max && ' - '}
                    {viewDetailsVacancy.salary_max && formatSalary(viewDetailsVacancy.salary_max)}
                  </p>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1"
                  onClick={() => {
                    setViewDetailsVacancy(null)
                    handleApply(viewDetailsVacancy.id)
                  }}
                >
                  Aplicar Ahora
                </Button>
                <Button variant="outline" onClick={() => setViewDetailsVacancy(null)}>
                  Cerrar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* My Applications Modal */}
      <MyApplicationsModal
        open={showMyApplications}
        onOpenChange={setShowMyApplications}
        userId={userId}
      />
    </div>
  )
}
