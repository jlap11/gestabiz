import React from 'react'
import {
  AlertTriangle,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Mail,
  MapPin,
  MoreVertical,
  Phone,
  Star,
  XCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface EnhancedBusiness {
  id: string
  name: string
  description?: string
  logo_url?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string

  // Nueva info de empleado
  location_id?: string | null
  location_name?: string | null
  employee_avg_rating?: number
  employee_total_reviews?: number
  services_count?: number
  job_title?: string | null
  role?: string | null
  employee_type?: string | null
  isOwner?: boolean
  is_active?: boolean // agregado para filtrar y mostrar acciones de reactivación
}

interface BusinessEmploymentCardProps {
  business: EnhancedBusiness
  onViewDetails?: () => void // Opcional - solo si el modal está implementado
  onRequestTimeOff: (type: 'vacation' | 'sick_leave' | 'personal') => void
  onEndEmployment: () => void
  onReactivateEmployment?: () => void // nuevo handler opcional
}

export function BusinessEmploymentCard({
  business,
  onViewDetails,
  onRequestTimeOff,
  onEndEmployment,
  onReactivateEmployment,
}: BusinessEmploymentCardProps) {
  // Determinar el cargo a mostrar
  const getJobTitle = (): string => {
    if (business.isOwner) return 'Propietario'
    if (business.job_title) return business.job_title

    // Mapeo de employee_type a español
    const typeMapping: Record<string, string> = {
      service_provider: 'Proveedor de Servicios',
      support_staff: 'Personal de Apoyo',
      location_manager: 'Gerente de Sede',
      team_lead: 'Líder de Equipo',
    }

    if (business.employee_type && typeMapping[business.employee_type]) {
      return typeMapping[business.employee_type]
    }

    // Fallback a role
    if (business.role === 'manager') return 'Gerente'
    return 'Empleado'
  }

  // Determinar color del badge de calificación
  const getRatingBadgeVariant = (): { bg: string; text: string; border: string } => {
    if (!business.employee_avg_rating || business.employee_total_reviews === 0) {
      return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' }
    }

    if (business.employee_avg_rating >= 4.5) {
      return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' }
    }

    if (business.employee_avg_rating >= 3.5) {
      return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' }
    }

    return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' }
  }

  const ratingColors = getRatingBadgeVariant()

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Logo + Nombre + Badges */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.name}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover flex-shrink-0 border border-border"
              />
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 border border-border">
                <Building2 className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2 flex-wrap">
                <CardTitle className="text-base sm:text-lg truncate flex-shrink min-w-0">
                  {business.name}
                </CardTitle>

                {/* Badge de Calificación */}
                {business.employee_total_reviews !== undefined && (
                  <Badge
                    variant="outline"
                    className={`flex-shrink-0 ${ratingColors.bg} ${ratingColors.text} ${ratingColors.border}`}
                  >
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    {business.employee_avg_rating && business.employee_total_reviews > 0
                      ? `${business.employee_avg_rating.toFixed(1)}/5`
                      : 'Sin calificaciones'}
                    {business.employee_total_reviews > 0 && (
                      <span className="ml-1 text-xs opacity-70">
                        ({business.employee_total_reviews})
                      </span>
                    )}
                  </Badge>
                )}

                {/* Estado: Activo/Inactivo */}
                {business.is_active === false ? (
                  <Badge
                    variant="outline"
                    className="flex-shrink-0 bg-red-50 text-red-700 border-red-200"
                  >
                    Inactivo
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="flex-shrink-0 bg-green-50 text-green-700 border-green-200"
                  >
                    Activo
                  </Badge>
                )}
              </div>

              {/* Sede o Warning */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {business.location_id && business.location_name ? (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{business.location_name}</span>
                  </div>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400"
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Falta Configuración
                  </Badge>
                )}

                {/* Cargo */}
                <Badge variant="secondary" className="text-xs">
                  <Briefcase className="h-3 w-3 mr-1" />
                  {getJobTitle()}
                </Badge>

                {/* Servicios Count */}
                {business.services_count !== undefined && business.services_count > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {business.services_count} servicio{business.services_count > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {business.description && (
                <p className="text-xs text-muted-foreground truncate mt-1">
                  {business.description}
                </p>
              )}
            </div>
          </div>

          {/* Menú de 3 Puntos */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="min-w-[44px] min-h-[44px] p-2 flex-shrink-0"
                title="Más opciones"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => onRequestTimeOff('vacation')}>
                <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                <span>Solicitar Vacaciones</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRequestTimeOff('sick_leave')}>
                <Calendar className="h-4 w-4 mr-2 text-orange-600" />
                <span>Solicitar Ausencia Médica</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRequestTimeOff('personal')}>
                <Calendar className="h-4 w-4 mr-2 text-purple-600" />
                <span>Solicitar Permiso Personal</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {business.is_active !== false ? (
                <DropdownMenuItem
                  onClick={business.isOwner ? undefined : onEndEmployment}
                  disabled={business.isOwner}
                  className={
                    business.isOwner
                      ? 'cursor-not-allowed opacity-50'
                      : 'text-destructive focus:text-destructive cursor-pointer'
                  }
                  title={
                    business.isOwner ? 'Los propietarios no pueden finalizar su empleo' : undefined
                  }
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  <span>Marcar como Finalizado</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={business.isOwner ? undefined : onReactivateEmployment}
                  disabled={business.isOwner}
                  className={
                    business.isOwner
                      ? 'cursor-not-allowed opacity-50'
                      : 'text-green-700 focus:text-green-700 cursor-pointer'
                  }
                  title={
                    business.isOwner ? 'Los propietarios no necesitan reactivación' : undefined
                  }
                >
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                  <span>Reactivar Empleo</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Contact Info */}
        <div className="space-y-2 text-sm">
          {business.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{business.email}</span>
            </div>
          )}
          {business.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{business.phone}</span>
            </div>
          )}
          {(business.address || business.city || business.state) && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span className="flex-1 line-clamp-2">
                {[business.address, business.city, business.state].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Action Button - Solo mostrar si onViewDetails está implementado */}
        {onViewDetails && (
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewDetails}
              className="w-full min-h-[44px]"
            >
              Ver Detalles Completos
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
