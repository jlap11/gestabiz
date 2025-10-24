import React, { useMemo, useState } from 'react'
import {
  Activity,
  Calendar as CalendarIcon,
  Download,
  Filter,
  User as UserIcon,
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { usePermissions } from '@/hooks/usePermissions-v2'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AuditLogProps {
  businessId: string
  ownerId: string
  currentUserId: string
}

// Action types with colors and labels
const ACTION_CONFIG = {
  'role.assign': {
    label: 'Rol Asignado',
    color: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    icon: '👤',
  },
  'role.revoke': {
    label: 'Rol Revocado',
    color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
    icon: '🚫',
  },
  'permission.grant': {
    label: 'Permiso Otorgado',
    color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    icon: '✓',
  },
  'permission.revoke': {
    label: 'Permiso Revocado',
    color: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
    icon: '✗',
  },
  'template.apply': {
    label: 'Plantilla Aplicada',
    color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
    icon: '📋',
  },
  'template.create': {
    label: 'Plantilla Creada',
    color: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20',
    icon: '➕',
  },
  'template.delete': {
    label: 'Plantilla Eliminada',
    color: 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20',
    icon: '🗑️',
  },
} as const

type ActionType = keyof typeof ACTION_CONFIG

export function AuditLog({ businessId, ownerId, currentUserId }: Readonly<AuditLogProps>) {
  const { t } = useLanguage()
  const { auditLog, isLoading } = usePermissions({
    userId: currentUserId,
    businessId,
    ownerId,
  })

  // Filters
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [userFilter, setUserFilter] = useState('')
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  // Filter audit log
  const filteredLog = useMemo(() => {
    if (!auditLog) return []

    return auditLog.filter(entry => {
      // Action filter
      if (actionFilter !== 'all' && entry.action !== actionFilter) {
        return false
      }

      // User filter (search in user name)
      if (userFilter && entry.user_name) {
        const searchTerm = userFilter.toLowerCase()
        if (!entry.user_name.toLowerCase().includes(searchTerm)) {
          return false
        }
      }

      // Date range filter
      const entryDate = new Date(entry.created_at)
      if (dateFrom && entryDate < dateFrom) {
        return false
      }
      if (dateTo) {
        const dateToEnd = new Date(dateTo)
        dateToEnd.setHours(23, 59, 59, 999)
        if (entryDate > dateToEnd) {
          return false
        }
      }

      return true
    })
  }, [auditLog, actionFilter, userFilter, dateFrom, dateTo])

  // Paginate filtered results
  const paginatedLog = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredLog.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredLog, currentPage])

  const totalPages = Math.ceil(filteredLog.length / itemsPerPage)

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredLog || filteredLog.length === 0) {
      toast.error(t('admin.auditActions.noRecords'))
      return
    }

    try {
      // CSV Headers
      const headers = ['Fecha', 'Usuario', 'Acción', 'Detalles', 'Realizado Por', 'Notas']

      // CSV Rows
      const rows = filteredLog.map(entry => {
        const actionConfig = ACTION_CONFIG[entry.action as ActionType] || { label: entry.action }
        return [
          format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm', { locale: es }),
          entry.user_name || 'N/A',
          actionConfig.label,
          entry.permission || entry.role || 'N/A',
          entry.performed_by_name || 'Sistema',
          entry.notes || '',
        ]
      })

      // Build CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n')

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)

      link.setAttribute('href', url)
      link.setAttribute('download', `auditoria_permisos_${format(new Date(), 'yyyy-MM-dd')}.csv`)
      link.style.visibility = 'hidden'

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success(t('admin.auditActions.exported'))
    } catch (error) {
      toast.error(t('admin.auditActions.exportError'), {
        description: error instanceof Error ? error.message : 'Error desconocido',
      })
    }
  }

  // Clear filters
  const handleClearFilters = () => {
    setActionFilter('all')
    setUserFilter('')
    setDateFrom(undefined)
    setDateTo(undefined)
    setCurrentPage(1)
    toast.success(t('admin.auditActions.filtersClear'))
  }

  // Get unique action types from log
  const actionTypes = useMemo(() => {
    if (!auditLog) return []
    const types = new Set(auditLog.map(entry => entry.action))
    return Array.from(types)
  }, [auditLog])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Historial de Auditoría
            </CardTitle>
            <CardDescription>Registro completo de cambios en roles y permisos</CardDescription>
          </div>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={!filteredLog || filteredLog.length === 0}
          >
            <Download className="h-4 w-4" />
            {t('admin.actions.exportCSV')}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg border border-border">
          {/* Action Type Filter */}
          <div className="space-y-2">
            <Label htmlFor="action-filter" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Tipo de Acción
            </Label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger id="action-filter">
                <SelectValue placeholder="Todas las acciones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las acciones</SelectItem>
                {actionTypes.map(action => {
                  const config = ACTION_CONFIG[action as ActionType]
                  return (
                    <SelectItem key={action} value={action}>
                      {config?.icon} {config?.label || action}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* User Filter */}
          <div className="space-y-2">
            <Label htmlFor="user-filter" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Usuario
            </Label>
            <Input
              id="user-filter"
              placeholder={t('admin.actions.searchByName')}
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
            />
          </div>

          {/* Date From */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Desde
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dateFrom && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar selected={dateFrom} onSelect={setDateFrom} />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date To */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Hasta
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dateTo && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, 'dd/MM/yyyy', { locale: es }) : 'Seleccionar'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar selected={dateTo} onSelect={setDateTo} />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando <span className="font-semibold">{filteredLog.length}</span> registros
            {auditLog && filteredLog.length < auditLog.length && (
              <>
                {' '}
                de <span className="font-semibold">{auditLog.length}</span> totales
              </>
            )}
          </p>
          {(actionFilter !== 'all' || userFilter || dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              Limpiar filtros
            </Button>
          )}
        </div>

        {/* Audit Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Fecha</TableHead>
                <TableHead className="w-[200px]">Usuario</TableHead>
                <TableHead className="w-[180px]">Acción</TableHead>
                <TableHead>Detalles</TableHead>
                <TableHead className="w-[180px]">Realizado Por</TableHead>
                <TableHead className="w-[250px]">Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Cargando registros...
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && paginatedLog.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {filteredLog.length === 0 && auditLog && auditLog.length > 0
                        ? 'No hay registros que coincidan con los filtros'
                        : 'No hay registros de auditoría'}
                    </p>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                paginatedLog.length > 0 &&
                paginatedLog.map(entry => {
                  const actionConfig = ACTION_CONFIG[entry.action as ActionType] || {
                    label: entry.action,
                    color: 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
                    icon: '•',
                  }

                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary">
                              {entry.user_name ? entry.user_name.charAt(0).toUpperCase() : '?'}
                            </span>
                          </div>
                          <span className="font-medium">
                            {entry.user_name || 'Usuario desconocido'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('border', actionConfig.color)}>
                          <span className="mr-1">{actionConfig.icon}</span>
                          {actionConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {entry.permission && (
                          <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
                            {entry.permission}
                          </code>
                        )}
                        {entry.role && (
                          <Badge variant="secondary">
                            {entry.role === 'admin' ? 'Administrador' : 'Empleado'}
                          </Badge>
                        )}
                        {!entry.permission && !entry.role && (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{entry.performed_by_name || 'Sistema'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{entry.notes || '-'}</span>
                      </TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
