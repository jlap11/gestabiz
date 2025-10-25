import React, { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'

// Componentes extraídos
import { EmployeeRequestCard } from './components/EmployeeRequestCard'
import { EmployeeTable } from './components/EmployeeTable'
import { RejectionDialog } from './components/RejectionDialog'

// Hooks extraídos
import { useEmployeeRequests } from './hooks/useEmployeeRequests'
import { useEmployeeActions } from './hooks/useEmployeeActions'

// Utilidades extraídas
import { filterEmployeeRequests } from './utils/employeeUtils'

interface EmployeeManagementProps {
  businessId?: string
}

export default function EmployeeManagement({ businessId }: EmployeeManagementProps) {
  const { t } = useLanguage()
  
  // Hooks para gestión de solicitudes
  const {
    employeeRequests,
    updateRequest,
    getPendingRequests
  } = useEmployeeRequests()

  // Hooks para acciones de empleados
  const {
    users,
    searchTerm,
    rejectionReason,
    showRejectionDialog,
    selectedRequest,
    setSearchTerm,
    setRejectionReason,
    loadUsers,
    handleApproveEmployee,
    handleRejectEmployee,
    handleConfirmReject,
    handleRemoveEmployee,
    closeRejectionDialog
  } = useEmployeeActions()

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers()
  }, [])

  // Obtener solicitudes pendientes filtradas
  const pendingRequests = getPendingRequests()
  const filteredRequests = filterEmployeeRequests(pendingRequests, searchTerm)

  // Handlers para las acciones
  const handleApprove = (request: any) => {
    handleApproveEmployee(request, updateRequest)
  }

  const handleReject = (request: any) => {
    handleRejectEmployee(request)
  }

  const handleConfirmRejectAction = () => {
    handleConfirmReject(updateRequest)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t('employee.management')}
            <Badge variant="secondary" className="ml-2">
              {users.length} {t('employee.employees')}
            </Badge>
          </CardTitle>
          <CardDescription>
            {t('employee.managementDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="requests" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="requests" className="flex items-center gap-2">
                {t('employee.requests')}
                {pendingRequests.length > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {pendingRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="employees">
                {t('employee.employees')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="space-y-4">
              <div className="space-y-4">
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>{t('employee.noRequests')}</p>
                  </div>
                ) : (
                  <div className="space-y-4" role="list" aria-label={t('employee.requestsList')}>
                    {filteredRequests.map((request) => (
                      <EmployeeRequestCard
                        key={request.id}
                        request={request}
                        onApprove={handleApprove}
                        onReject={handleReject}
                      />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="employees" className="space-y-4">
              <EmployeeTable
                users={users}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onRemoveEmployee={handleRemoveEmployee}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <RejectionDialog
        isOpen={showRejectionDialog}
        onClose={closeRejectionDialog}
        selectedRequest={selectedRequest}
        rejectionReason={rejectionReason}
        onReasonChange={setRejectionReason}
        onConfirmReject={handleConfirmRejectAction}
      />
    </div>
  )
}