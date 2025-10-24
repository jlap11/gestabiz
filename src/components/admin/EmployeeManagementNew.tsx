import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Check, Phone, Shield, Trash, UserCheck, Users, X } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useKV } from '@/lib/useKV'
import { useLanguage } from '@/contexts/LanguageContext'
import { Permission, User } from '@/types'

interface EmployeeRequest {
  id: string
  user_id: string
  user_name: string
  user_email: string
  user_avatar?: string
  business_id: string
  requested_at: string
  message?: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by?: string
  reviewed_at?: string
  rejection_reason?: string
}

interface EmployeeManagementProps {
  user: User
}

export default function EmployeeManagement({ user }: Readonly<EmployeeManagementProps>) {
  const { t } = useLanguage()
  const [users] = useKV<User[]>('users', [])
  const [employeeRequests, setEmployeeRequests] = useKV<EmployeeRequest[]>(
    `employee-requests-${user.business_id || user.id}`,
    []
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('requests')
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectionDialog, setShowRejectionDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<EmployeeRequest | null>(null)

  // Get business employees (approved users)
  const businessEmployees = users.filter(
    u => u.business_id === (user.business_id || user.id) && u.role === 'employee' && u.is_active
  )

  // Get pending requests
  const pendingRequests = employeeRequests.filter(req => req.status === 'pending')

  const handleApproveEmployee = async (request: EmployeeRequest) => {
    try {
      // Find the user and update their status
      const updatedUsers = users.map(u => {
        if (u.id === request.user_id) {
          return {
            ...u,
            business_id: user.business_id || user.id,
            role: 'employee' as const,
            permissions: [
              'read_appointments',
              'write_appointments',
              'read_clients',
              'write_clients',
            ] as Permission[],
            updated_at: new Date().toISOString(),
          }
        }
        return u
      })

      // Update the request status
      const updatedRequests = employeeRequests.map(req =>
        req.id === request.id
          ? {
              ...req,
              status: 'approved' as const,
              reviewed_by: user.id,
              reviewed_at: new Date().toISOString(),
            }
          : req
      )

      localStorage.setItem('users', JSON.stringify(updatedUsers))
      setEmployeeRequests(updatedRequests)

      toast.success(t('employee.approvalSuccess'))
    } catch (error) {
      toast.error(t('employee.approvalError'))
      throw error
    }
  }

  const handleRejectEmployee = async (request: EmployeeRequest, reason?: string) => {
    try {
      const updatedRequests = employeeRequests.map(req =>
        req.id === request.id
          ? {
              ...req,
              status: 'rejected' as const,
              reviewed_by: user.id,
              reviewed_at: new Date().toISOString(),
              rejection_reason: reason,
            }
          : req
      )

      setEmployeeRequests(updatedRequests)
      toast.success(t('employee.rejectionSuccess'))
      setShowRejectionDialog(false)
      setRejectionReason('')
      setSelectedRequest(null)
    } catch (error) {
      toast.error(t('employee.rejectionError'))
      throw error
    }
  }

  const handleRemoveEmployee = async (employeeId: string) => {
    try {
      const updatedUsers = users.map(u => {
        if (u.id === employeeId) {
          return {
            ...u,
            business_id: undefined,
            role: 'client' as const,
            permissions: ['read_appointments', 'write_appointments'] as Permission[],
            updated_at: new Date().toISOString(),
          }
        }
        return u
      })

      localStorage.setItem('users', JSON.stringify(updatedUsers))
      toast.success(t('employee.removeSuccess'))
    } catch (error) {
      toast.error(t('employee.removeError'))
      throw error
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const filteredEmployees = businessEmployees.filter(
    employee =>
      (employee.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredRequests = pendingRequests.filter(
    request =>
      request.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.user_email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {t('employee.title')}
          </CardTitle>
          <CardDescription>{t('employee.description')}</CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            {t('employee.requests')}
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {t('employee.current')} ({businessEmployees.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('employee.pendingRequests')}</CardTitle>
              <CardDescription>{t('employee.pendingRequestsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t('employee.noPendingRequests')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRequests.map(request => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={request.user_avatar} alt={request.user_name} />
                          <AvatarFallback>{getInitials(request.user_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{request.user_name}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="w-3 h-3 inline-block">@</span>
                            {request.user_email}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {t('employee.requestedOn')} {formatDate(request.requested_at)}
                          </p>
                          {request.message && (
                            <p className="text-sm mt-2 p-2 bg-muted rounded text-muted-foreground">
                              "{request.message}"
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApproveEmployee(request)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          {t('employee.approve')}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request)
                            setShowRejectionDialog(true)
                          }}
                          className="border-red-200 text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-2" />
                          {t('employee.reject')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{t('employee.currentEmployees')}</CardTitle>
                  <CardDescription>{t('employee.currentEmployeesDescription')}</CardDescription>
                </div>
                <div className="w-64">
                  <Input
                    placeholder={t('action.search')}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {businessEmployees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t('employee.noEmployees')}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('employee.employee')}</TableHead>
                      <TableHead>{t('employee.contact')}</TableHead>
                      <TableHead>{t('employee.joinDate')}</TableHead>
                      <TableHead>{t('employee.status')}</TableHead>
                      <TableHead>{t('action.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map(employee => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={employee.avatar_url} alt={employee.name} />
                              <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{employee.name}</p>
                              <p className="text-sm text-muted-foreground">{t('role.employee')}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="w-3 h-3 inline-block">@</span>
                              {employee.email}
                            </div>
                            {employee.phone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                {employee.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(employee.created_at)}</TableCell>
                        <TableCell>
                          <Badge variant={employee.is_active ? 'default' : 'secondary'}>
                            {employee.is_active ? t('employee.active') : t('employee.inactive')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemoveEmployee(employee.id)}
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rejection Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('employee.rejectRequest')}</DialogTitle>
            <DialogDescription>{t('employee.rejectDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">{t('employee.rejectionReason')}</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder={t('employee.rejectionReasonPlaceholder')}
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectionDialog(false)
                  setRejectionReason('')
                  setSelectedRequest(null)
                }}
                className="flex-1"
              >
                {t('action.cancel')}
              </Button>
              <Button
                onClick={() =>
                  selectedRequest && handleRejectEmployee(selectedRequest, rejectionReason)
                }
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {t('employee.reject')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
