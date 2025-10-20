import { JobApplication } from '@/hooks/useJobApplications'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CheckCircle, XCircle, Eye, Mail, Phone, Calendar, DollarSign, MessageSquare, UserCheck, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface ApplicationCardProps {
  application: JobApplication
  onAccept: (id: string) => void
  onReject: (id: string) => void
  onViewProfile: (application: JobApplication) => void
  onChat?: (userId: string, applicantName: string) => void
  onStartSelectionProcess?: (id: string) => void // ⭐ NUEVO
  onSelectAsEmployee?: (id: string) => void // ⭐ NUEVO
}

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  reviewing: { label: 'En Revisión', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  in_selection_process: { label: 'En Proceso de Selección', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' }, // ⭐ NUEVO
  accepted: { label: 'Aceptada', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  withdrawn: { label: 'Retirada', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' }
}

export function ApplicationCard({ 
  application, 
  onAccept, 
  onReject, 
  onViewProfile, 
  onChat,
  onStartSelectionProcess,
  onSelectAsEmployee
}: Readonly<ApplicationCardProps>) {
  const statusStyle = statusConfig[application.status]
  
  // Validar que created_at sea una fecha válida
  const createdDate = application.created_at ? new Date(application.created_at) : null
  const isValidDate = createdDate && !Number.isNaN(createdDate.getTime())
  const timeAgo = isValidDate 
    ? formatDistanceToNow(createdDate, { addSuffix: true, locale: es })
    : 'Fecha no disponible'

  const initials = application.applicant?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || '??'

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          {/* Applicant Info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={application.applicant?.avatar_url} alt={application.applicant?.full_name} />
              <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{application.applicant?.full_name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Mail className="h-3 w-3" />
                <span>{application.applicant?.email}</span>
                {application.applicant?.phone && (
                  <>
                    <span>•</span>
                    <Phone className="h-3 w-3" />
                    <span>{application.applicant.phone}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <Badge className={statusStyle.color}>
            {statusStyle.label}
          </Badge>
        </div>

        {/* Vacancy Info */}
        <div className="mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">Vacante:</span>
            <span>{application.vacancy?.title}</span>
            {application.vacancy?.position_type && (
              <>
                <span>•</span>
                <span className="text-muted-foreground capitalize">
                  {application.vacancy.position_type.replace('_', ' ')}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Application Details */}
        <div className="space-y-2 mb-4">
          {application.expected_salary && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Salario esperado:</span>
              <span className="font-medium">
                {new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: application.vacancy?.currency || 'COP',
                  minimumFractionDigits: 0
                }).format(application.expected_salary)}
              </span>
            </div>
          )}

          {application.available_from && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Disponible desde:</span>
              <span className="font-medium">
                {new Date(application.available_from).toLocaleDateString('es-CO')}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Aplicó {timeAgo}</span>
          </div>
        </div>

        {/* Cover Letter Preview */}
        {application.cover_letter && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {application.cover_letter}
            </p>
          </div>
        )}

        {/* Rejection Reason */}
        {application.status === 'rejected' && application.rejection_reason && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              <span className="font-medium">Motivo de rechazo:</span> {application.rejection_reason}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewProfile(application)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Perfil
          </Button>

          {onChat && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChat(application.user_id, application.applicant?.full_name || 'Aplicante')}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Chatear
            </Button>
          )}

          {/* ⭐ NUEVO: Botones para estados pending y reviewing */}
          {(application.status === 'pending' || application.status === 'reviewing') && (
            <>
              {onStartSelectionProcess && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onStartSelectionProcess(application.id)}
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Iniciar Proceso
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onReject(application.id)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rechazar
              </Button>
            </>
          )}

          {/* ⭐ NUEVO: Botones para estado in_selection_process */}
          {application.status === 'in_selection_process' && (
            <>
              {onSelectAsEmployee && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onSelectAsEmployee(application.id)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Seleccionar Empleado
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onReject(application.id)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Rechazar
              </Button>
              
              {/* Badge informativo */}
              {application.selection_started_at && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                  <Clock className="h-3 w-3" />
                  <span>
                    Proceso desde {formatDistanceToNow(new Date(application.selection_started_at), { addSuffix: true, locale: es })}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
