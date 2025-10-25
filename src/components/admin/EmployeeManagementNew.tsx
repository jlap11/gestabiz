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
    <main role="main" aria-labelledby="employee-management-title" className="space-y-6 max-w-[95vw]">
      <h1 id="employee-management-title" className="sr-only">{t('employee.title')}</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
            <Shield className="w-5 h-5" aria-hidden="true" />
            {t('employee.title')}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">{t('employee.description')}</CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-0" role="tablist" aria-label={t('employee.tabsLabel')}>
          <TabsTrigger 
            value="requests" 
            className="flex items-center gap-2 min-h-[44px] min-w-[44px] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            role="tab"
            aria-selected={activeTab === 'requests'}
            aria-controls="requests-panel"
            id="requests-tab"
          >
            <UserCheck className="w-4 h-4" aria-hidden="true" />
            {t('employee.requests')}
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs sm:text-sm" aria-label={`${pendingRequests.length} ${t('employee.pendingRequests')}`}>
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="employees" 
            className="flex items-center gap-2 min-h-[44px] min-w-[44px] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            role="tab"
            aria-selected={activeTab === 'employees'}
            aria-controls="employees-panel"
            id="employees-tab"
          >
            <Users className="w-4 h-4" aria-hidden="true" />
            {t('employee.current')} ({businessEmployees.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent 
          value="requests" 
          className="space-y-4"
          role="tabpanel"
          aria-labelledby="requests-tab"
          id="requests-panel"
        >
          <section role="region" aria-labelledby="pending-requests-title">
            <h2 id="pending-requests-title" className="sr-only">{t('employee.pendingRequests')}</h2>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">{t('employee.pendingRequests')}</CardTitle>
                <CardDescription className="text-sm sm:text-base">{t('employee.pendingRequestsDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground" role="status" aria-live="polite">
                    <UserCheck className="w-12 h-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
                    <p className="text-sm sm:text-base">{t('employee.noPendingRequests')}</p>
                  </div>
                ) : (
                  <div className="space-y-4" role="list" aria-label={t('employee.pendingRequestsList')}>
                    {filteredRequests.map(request => (
                      <div
                        key={request.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4 sm:gap-0"
                        role="listitem"
                      >
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <Avatar>
                            <AvatarImage src={request.user_avatar} alt={request.user_name} />
                            <AvatarFallback>{getInitials(request.user_name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 sm:flex-none">
                            <h4 className="font-medium text-sm sm:text-base">{request.user_name}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="w-3 h-3 inline-block" aria-hidden="true">@</span>
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
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button
                            size="sm"
                            onClick={() => handleApproveEmployee(request)}
                            className="bg-green-600 hover:bg-green-700 min-h-[44px] min-w-[44px] flex-1 sm:flex-none text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            aria-label={`${t('employee.approve')} ${request.user_name}`}
                            title={`${t('employee.approve')} ${request.user_name}`}
                          >
                            <Check className="w-4 h-4 mr-2" aria-hidden="true" />
                            {t('employee.approve')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRequest(request)
                              setShowRejectionDialog(true)
                            }}
                            className="border-red-200 text-red-600 hover:bg-red-50 min-h-[44px] min-w-[44px] flex-1 sm:flex-none text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            aria-label={`${t('employee.reject')} ${request.user_name}`}
                            title={`${t('employee.reject')} ${request.user_name}`}
                            aria-haspopup="dialog"
                            aria-controls="rejection-dialog"
                          >
                            <X className="w-4 h-4 mr-2" aria-hidden="true" />
                            {t('employee.reject')}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        <TabsContent 
          value="employees" 
          className="space-y-4"
          role="tabpanel"
          aria-labelledby="employees-tab"
          id="employees-panel"
        >
          <section role="region" aria-labelledby="current-employees-title">
            <h2 id="current-employees-title" className="sr-only">{t('employee.currentEmployees')}</h2>
            
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="text-lg sm:text-xl">{t('employee.currentEmployees')}</CardTitle>
                    <CardDescription className="text-sm sm:text-base">{t('employee.currentEmployeesDescription')}</CardDescription>
                  </div>
                  <div className="w-full sm:w-64" role="search" aria-label={t('action.search')}>
                    <Input
                      placeholder={t('action.search')}
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      role="searchbox"
                      aria-label={t('action.search')}
                      title={t('action.search')}
                      className="min-h-[44px]"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {businessEmployees.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground" role="status" aria-live="polite">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
                    <p className="text-sm sm:text-base">{t('employee.noEmployees')}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-sm sm:text-base">{t('employee.employee')}</TableHead>
                          <TableHead className="text-sm sm:text-base">{t('employee.contact')}</TableHead>
                          <TableHead className="text-sm sm:text-base hidden sm:table-cell">{t('employee.joinDate')}</TableHead>
                          <TableHead className="text-sm sm:text-base">{t('employee.status')}</TableHead>
                          <TableHead className="text-sm sm:text-base">{t('action.actions')}</TableHead>
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
                                  <p className="font-medium text-sm sm:text-base">{employee.name}</p>
                                  <p className="text-xs sm:text-sm text-muted-foreground">{t('role.employee')}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-xs sm:text-sm">
                                  <span className="w-3 h-3 inline-block" aria-hidden="true">@</span>
                                  <span className="truncate max-w-[150px] sm:max-w-none">{employee.email}</span>
                                </div>
                                {employee.phone && (
                                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                    <Phone className="w-3 h-3" aria-hidden="true" />
                                    {employee.phone}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-sm">{formatDate(employee.created_at)}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={employee.is_active ? 'default' : 'secondary'}
                                className="text-xs sm:text-sm"
                                aria-label={`${t('employee.status')}: ${employee.is_active ? t('employee.active') : t('employee.inactive')}`}
                              >
                                {employee.is_active ? t('employee.active') : t('employee.inactive')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRemoveEmployee(employee.id)}
                                  className="min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                  aria-label={`${t('employee.remove')} ${employee.name}`}
                                  title={`${t('employee.remove')} ${employee.name}`}
                                >
                                  <Trash className="w-4 h-4" aria-hidden="true" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </TabsContent>
      </Tabs>

      {/* Rejection Dialog */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="rejection-dialog-title" 
          aria-describedby="rejection-dialog-description"
          className="w-[95vw] max-w-md sm:max-w-lg"
        >
          <DialogHeader>
            <DialogTitle id="rejection-dialog-title" className="text-lg sm:text-xl">{t('employee.rejectRequest')}</DialogTitle>
            <DialogDescription id="rejection-dialog-description" className="text-sm sm:text-base">{t('employee.rejectDescription')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason" className="text-sm sm:text-base">{t('employee.rejectionReason')}</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                placeholder={t('employee.rejectionReasonPlaceholder')}
                rows={3}
                className="min-h-[88px] text-sm sm:text-base"
                aria-describedby="rejection-reason-description"
              />
              <p id="rejection-reason-description" className="sr-only">{t('employee.rejectionReasonDescription')}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectionDialog(false)
                  setRejectionReason('')
                  setSelectedRequest(null)
                }}
                className="flex-1 min-h-[44px] min-w-[44px] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                aria-label={t('action.cancel')}
                title={t('action.cancel')}
              >
                {t('action.cancel')}
              </Button>
              <Button
                onClick={() =>
                  selectedRequest && handleRejectEmployee(selectedRequest, rejectionReason)
                }
                className="flex-1 bg-red-600 hover:bg-red-700 min-h-[44px] min-w-[44px] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                aria-label={t('employee.reject')}
                title={t('employee.reject')}
              >
                {t('employee.reject')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}