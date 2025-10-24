import { useState } from 'react'
// Removed unused Card components imports
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CustomDateInput } from '@/components/ui/custom-date-input'
// Removed unused Select components imports
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Funnel, MagnifyingGlass, X } from '@phosphor-icons/react'
import { AppointmentFilter, Client } from '@/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface AdvancedFiltersProps {
  filter: AppointmentFilter
  onFilterChange: (filter: AppointmentFilter) => void
  clients: Client[]
  availableTags: string[]
  onClearFilters: () => void
}

export default function AdvancedFilters({
  filter,
  onFilterChange,
  clients,
  availableTags,
  onClearFilters,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: filter.dateRange ? new Date(filter.dateRange.start) : undefined,
    to: filter.dateRange ? new Date(filter.dateRange.end) : undefined,
  })

  const statusOptions = [
    { value: 'scheduled', label: 'Programada', color: 'bg-blue-500' },
    { value: 'completed', label: 'Completada', color: 'bg-green-500' },
    { value: 'cancelled', label: 'Cancelada', color: 'bg-red-500' },
    { value: 'no_show', label: 'No se presentó', color: 'bg-gray-500' },
  ]

  const priorityOptions = [
    { value: 'high', label: 'Alta', color: 'bg-red-500' },
    { value: 'medium', label: 'Media', color: 'bg-yellow-500' },
    { value: 'low', label: 'Baja', color: 'bg-blue-500' },
  ]

  const handleStatusChange = (status: string, checked: boolean) => {
    const currentStatus = filter.status || []
    const newStatus = checked ? [...currentStatus, status] : currentStatus.filter(s => s !== status)

    onFilterChange({ ...filter, status: newStatus.length > 0 ? newStatus : undefined })
  }

  const handleClientChange = (clientId: string, checked: boolean) => {
    const currentClients = filter.clients || []
    const newClients = checked
      ? [...currentClients, clientId]
      : currentClients.filter(c => c !== clientId)

    onFilterChange({ ...filter, clients: newClients.length > 0 ? newClients : undefined })
  }

  const handleTagChange = (tag: string, checked: boolean) => {
    const currentTags = filter.tags || []
    const newTags = checked ? [...currentTags, tag] : currentTags.filter(t => t !== tag)

    onFilterChange({ ...filter, tags: newTags.length > 0 ? newTags : undefined })
  }

  const handlePriorityChange = (priority: string, checked: boolean) => {
    const currentPriorities = filter.priority || []
    const newPriorities = checked
      ? [...currentPriorities, priority]
      : currentPriorities.filter(p => p !== priority)

    onFilterChange({ ...filter, priority: newPriorities.length > 0 ? newPriorities : undefined })
  }

  const handleDateRangeChange = () => {
    if (dateRange.from && dateRange.to) {
      onFilterChange({
        ...filter,
        dateRange: {
          start: format(dateRange.from, 'yyyy-MM-dd'),
          end: format(dateRange.to, 'yyyy-MM-dd'),
        },
      })
    } else {
      onFilterChange({ ...filter, dateRange: undefined })
    }
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filter.status?.length) count++
    if (filter.clients?.length) count++
    if (filter.tags?.length) count++
    if (filter.priority?.length) count++
    if (filter.dateRange) count++
    if (filter.search) count++
    return count
  }

  const hasActiveFilters = getActiveFiltersCount() > 0

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por título, cliente, descripción..."
          value={filter.search || ''}
          onChange={e => onFilterChange({ ...filter, search: e.target.value || undefined })}
          className="pl-10"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Funnel className="h-4 w-4" />
              Filtros Avanzados
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1">
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-6" align="start">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Filtros Avanzados</h3>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Limpiar todo
                  </Button>
                )}
              </div>

              {/* Date Range */}
              <div className="space-y-3">
                <Label>Rango de Fechas</Label>
                <div className="grid grid-cols-1 gap-3">
                  <CustomDateInput
                    id="dateFrom"
                    label="Desde"
                    value={dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                    onChange={value => {
                      const newDate = value ? new Date(value) : undefined
                      setDateRange(prev => ({ ...prev, from: newDate }))
                      if (newDate && dateRange.to) {
                        setTimeout(handleDateRangeChange, 100)
                      }
                    }}
                  />
                  <CustomDateInput
                    id="dateTo"
                    label="Hasta"
                    value={dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                    onChange={value => {
                      const newDate = value ? new Date(value) : undefined
                      setDateRange(prev => ({ ...prev, to: newDate }))
                      if (dateRange.from && newDate) {
                        setTimeout(handleDateRangeChange, 100)
                      }
                    }}
                    min={dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined}
                  />
                </div>
              </div>

              <Separator />

              {/* Status Filter */}
              <div className="space-y-3">
                <Label>Estado de la Cita</Label>
                <div className="grid grid-cols-2 gap-2">
                  {statusOptions.map(status => (
                    <div key={status.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status.value}`}
                        checked={filter.status?.includes(status.value) || false}
                        onCheckedChange={checked =>
                          handleStatusChange(status.value, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={`status-${status.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                      >
                        <div className={`w-2 h-2 rounded-full ${status.color}`} />
                        {status.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Priority Filter */}
              <div className="space-y-3">
                <Label>Prioridad</Label>
                <div className="flex flex-wrap gap-2">
                  {priorityOptions.map(priority => (
                    <div key={priority.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`priority-${priority.value}`}
                        checked={filter.priority?.includes(priority.value) || false}
                        onCheckedChange={checked =>
                          handlePriorityChange(priority.value, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={`priority-${priority.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                      >
                        <div className={`w-2 h-2 rounded-full ${priority.color}`} />
                        {priority.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Client Filter */}
              {clients.length > 0 && (
                <>
                  <div className="space-y-3">
                    <Label>Clientes</Label>
                    <div className="max-h-32 overflow-y-auto space-y-2">
                      {clients.slice(0, 10).map(client => (
                        <div key={client.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`client-${client.id}`}
                            checked={filter.clients?.includes(client.id) || false}
                            onCheckedChange={checked =>
                              handleClientChange(client.id, checked as boolean)
                            }
                          />
                          <label
                            htmlFor={`client-${client.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {client.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Tags Filter */}
              {availableTags.length > 0 && (
                <div className="space-y-3">
                  <Label>Etiquetas</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.map(tag => (
                      <Badge
                        key={tag}
                        variant={filter.tags?.includes(tag) ? 'default' : 'outline'}
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => handleTagChange(tag, !filter.tags?.includes(tag))}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="gap-2">
            <X className="h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filter.search && (
            <Badge variant="secondary" className="gap-1">
              Búsqueda: "{filter.search}"
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFilterChange({ ...filter, search: undefined })}
              />
            </Badge>
          )}
          {filter.status?.map(status => (
            <Badge key={status} variant="secondary" className="gap-1">
              {statusOptions.find(s => s.value === status)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handleStatusChange(status, false)}
              />
            </Badge>
          ))}
          {filter.dateRange && (
            <Badge variant="secondary" className="gap-1">
              {format(new Date(filter.dateRange.start), 'dd/MM', { locale: es })} -{' '}
              {format(new Date(filter.dateRange.end), 'dd/MM', { locale: es })}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFilterChange({ ...filter, dateRange: undefined })}
              />
            </Badge>
          )}
          {filter.priority?.map(priority => (
            <Badge key={priority} variant="secondary" className="gap-1">
              Prioridad {priorityOptions.find(p => p.value === priority)?.label}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => handlePriorityChange(priority, false)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
