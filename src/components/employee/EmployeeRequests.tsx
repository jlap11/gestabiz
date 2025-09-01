import { useState, useEffect } from 'react'
import { useKV } from '@/lib/useKV'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Check, X, User, Clock, EnvelopeSimple as Mail, Phone } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { User as UserType, Business, EmployeeRequest } from '@/types'
import { useLanguage } from '@/contexts/LanguageContext'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'

interface EmployeeRequestsProps {
  business: Business
  user: UserType
}

export default function EmployeeRequests({ business, user }: EmployeeRequestsProps) {
  const { t, language } = useLanguage()
  const [employeeRequests, setEmployeeRequests] = useKV<EmployeeRequest[]>('employee-requests', [])
  const [users, setUsers] = useKV<UserType[]>('users', [])
  const [isProcessing, setIsProcessing] = useState<string | null>(null)

  // Filter requests for this business
  const businessRequests = employeeRequests.filter(req => req.business_id === business.id)

  const handleRequestAction = async (requestId: string, action: 'approved' | 'rejected', userId: string) => {
    setIsProcessing(requestId)
    
    try {
      // Update request status
      await setEmployeeRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: action, reviewed_at: new Date().toISOString(), reviewed_by: user.id }
            : req
        )
      )

      if (action === 'approved') {
        // Update user's business_id and role
  await setUsers((prev) => {
          const updated = prev.map(u => 
            u.id === userId 
              ? { 
                  ...u, 
                  business_id: business.id, 
      role: 'employee' as const,
      permissions: ['read_appointments', 'write_appointments'] as UserType['permissions']
                }
              : u
          )
          return updated
        })
        toast.success(t('employee.requests.approved_success'))
      } else {
        toast.success(t('employee.requests.rejected_success'))
      }
    } catch (error) {
      console.error('Error processing request:', error)
      toast.error(t('employee.requests.error'))
    } finally {
      setIsProcessing(null)
    }
  }

  const getRequestUser = (userId: string) => {
    return users.find(u => u.id === userId)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">{t('employee.requests.status.pending')}</Badge>
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600">{t('employee.requests.status.approved')}</Badge>
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600">{t('employee.requests.status.rejected')}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, 'PPp', { locale: language === 'es' ? es : enUS })
  }

  const pendingRequests = businessRequests.filter(req => req.status === 'pending')
  const processedRequests = businessRequests.filter(req => req.status !== 'pending')

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('employee.requests.pending_title')}
            </CardTitle>
            <CardDescription>
              {t('employee.requests.pending_description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingRequests.map((request) => {
              const requestUser = getRequestUser(request.user_id)
              if (!requestUser) return null

              return (
                <div key={request.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={requestUser.avatar_url} alt={requestUser.name} />
                        <AvatarFallback>
                          {requestUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold">{requestUser.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {requestUser.email}
                          </span>
                          {requestUser.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {requestUser.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  {request.message && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-sm">{request.message}</p>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    {t('employee.requests.requested_on')}: {formatDate(request.created_at)}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRequestAction(request.id, 'rejected', request.user_id)}
                      disabled={isProcessing === request.id}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      {t('employee.requests.reject')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleRequestAction(request.id, 'approved', request.user_id)}
                      disabled={isProcessing === request.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      {t('employee.requests.approve')}
                    </Button>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('employee.requests.processed_title')}</CardTitle>
            <CardDescription>
              {t('employee.requests.processed_description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {processedRequests.map((request) => {
              const requestUser = getRequestUser(request.user_id)
              if (!requestUser) return null

              return (
                <div key={request.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={requestUser.avatar_url} alt={requestUser.name} />
                        <AvatarFallback className="text-xs">
                          {requestUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{requestUser.name}</h4>
                        <p className="text-sm text-muted-foreground">{requestUser.email}</p>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {t('employee.requests.processed_on')}: {request.reviewed_at ? formatDate(request.reviewed_at) : '-'}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {businessRequests.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('employee.requests.no_requests_title')}</h3>
            <p className="text-muted-foreground">
              {t('employee.requests.no_requests_description')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}