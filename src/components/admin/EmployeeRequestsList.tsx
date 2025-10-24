import { useState } from 'react'
import { AlertCircle, CheckCircle, Clock, Loader2, Mail, Phone, Users, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLanguage } from '@/contexts/LanguageContext'
import { useEmployeeRequests } from '@/hooks/useEmployeeRequests'
import type { EmployeeRequest } from '@/types/types'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface EmployeeRequestsListProps {
  businessId: string
  adminId: string
  className?: string
}

export function EmployeeRequestsList({
  businessId,
  adminId,
  className,
}: Readonly<EmployeeRequestsListProps>) {
  const { t } = useLanguage()
  const { requests, isLoading, approveRequest, rejectRequest, pendingCount } = useEmployeeRequests({
    businessId,
    autoFetch: true,
  })

  const [processingId, setProcessingId] = useState<string | null>(null)

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const approvedRequests = requests.filter(r => r.status === 'approved')
  const rejectedRequests = requests.filter(r => r.status === 'rejected')

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId)
    await approveRequest(requestId, adminId)
    setProcessingId(null)
  }

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId)
    await rejectRequest(requestId, adminId)
    setProcessingId(null)
  }

  const renderRequestCard = (request: EmployeeRequest) => {
    const isProcessing = processingId === request.id
    const user = request.user

    return (
      <div
        key={request.id}
        className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
      >
        {/* Avatar */}
        <Avatar className="h-12 w-12">
          <AvatarImage src={user?.avatar_url} alt={user?.name} />
          <AvatarFallback>{user?.name?.[0]?.toUpperCase() || '?'}</AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{user?.name || 'Usuario desconocido'}</p>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {user?.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {user.email}
                  </span>
                )}
                {user?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {user.phone}
                  </span>
                )}
              </div>
            </div>

            {/* Status Badge */}
            {request.status === 'pending' && (
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30"
              >
                <Clock className="h-3 w-3 mr-1" />
                Pendiente
              </Badge>
            )}
            {request.status === 'approved' && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 dark:bg-green-900/30"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Aprobada
              </Badge>
            )}
            {request.status === 'rejected' && (
              <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30">
                <XCircle className="h-3 w-3 mr-1" />
                Rechazada
              </Badge>
            )}
          </div>

          {/* Message */}
          {request.message && (
            <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
              <span className="font-medium">Mensaje:</span> {request.message}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Solicitado{' '}
              {formatDistanceToNow(new Date(request.created_at), {
                addSuffix: true,
                locale: es,
              })}
            </span>
            {request.responded_at && (
              <span>
                Respondido{' '}
                {formatDistanceToNow(new Date(request.responded_at), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
            )}
          </div>

          {/* Actions (only for pending) */}
          {request.status === 'pending' && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="default"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleApprove(request.id)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Aprobar
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => handleReject(request.id)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-1" />
                    Rechazar
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isLoading && requests.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Solicitudes de empleados
            </CardTitle>
            <CardDescription>Gestiona las solicitudes para unirse a tu negocio</CardDescription>
          </div>
          {pendingCount > 0 && (
            <Badge variant="default" className="bg-violet-600">
              {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No hay solicitudes aún. Comparte tu código de invitación para que empleados puedan
              unirse.
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="relative">
                Pendientes
                {pendingCount > 0 && (
                  <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-xs text-white">
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Aprobadas ({approvedRequests.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rechazadas ({rejectedRequests.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-3 mt-4">
              {pendingRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay solicitudes pendientes
                </p>
              ) : (
                pendingRequests.map(renderRequestCard)
              )}
            </TabsContent>

            <TabsContent value="approved" className="space-y-3 mt-4">
              {approvedRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay solicitudes aprobadas
                </p>
              ) : (
                approvedRequests.map(renderRequestCard)
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-3 mt-4">
              {rejectedRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No hay solicitudes rechazadas
                </p>
              ) : (
                rejectedRequests.map(renderRequestCard)
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
