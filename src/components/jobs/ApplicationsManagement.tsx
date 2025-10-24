import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'
import { useJobApplications, JobApplication } from '@/hooks/useJobApplications'
import { useJobVacancies } from '@/hooks/useJobVacancies'
import { useChat } from '@/hooks/useChat'
import { useAuth } from '@/contexts/AuthContext'
import { ApplicationCard } from './ApplicationCard'
import { ApplicantProfileModal } from './ApplicantProfileModal'
import { SelectEmployeeModal } from './SelectEmployeeModal' // ⭐ NUEVO
import { Search, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface ApplicationsManagementProps {
  businessId: string
  vacancyId?: string // Opcional: si se proporciona, filtra solo esta vacante
  onChatStarted?: (conversationId: string) => void // Callback para notificar que se inició un chat
}

export function ApplicationsManagement({ businessId, vacancyId, onChatStarted }: Readonly<ApplicationsManagementProps>) {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [vacancyFilter, setVacancyFilter] = useState<string>(vacancyId || 'all')
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [applicationToReject, setApplicationToReject] = useState<string | null>(null)
  
  // ⭐ NUEVO: Estado para modal de selección de empleado
  const [showSelectEmployeeModal, setShowSelectEmployeeModal] = useState(false)
  const [applicationToSelect, setApplicationToSelect] = useState<JobApplication | null>(null)
  const [isSelectingEmployee, setIsSelectingEmployee] = useState(false)

  // Get current user for chat
  const { user } = useAuth()
  const { createOrGetConversation } = useChat(user?.id || '')

  // Si se proporciona vacancyId, mantener el filtro fijo
  useEffect(() => {
    if (vacancyId) {
      setVacancyFilter(vacancyId)
    }
  }, [vacancyId])

  const { vacancies } = useJobVacancies(businessId)
  const {
    applications,
    loading,
    fetchApplications,
    acceptApplication,
    rejectApplication,
    startSelectionProcess, // ⭐ NUEVO
    selectAsEmployee // ⭐ NUEVO
  } = useJobApplications({ businessId })

  useEffect(() => {
    fetchApplications()
  }, [businessId])

  // Filter applications
  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.applicant?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.applicant?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter
    const matchesVacancy = vacancyFilter === 'all' || app.vacancy_id === vacancyFilter
    return matchesSearch && matchesStatus && matchesVacancy
  })

  // Group by status
  const pendingApplications = filteredApplications.filter(app => app.status === 'pending')
  const reviewingApplications = filteredApplications.filter(app => app.status === 'reviewing')
  const inSelectionApplications = filteredApplications.filter(app => app.status === 'in_selection_process') // ⭐ NUEVO
  const acceptedApplications = filteredApplications.filter(app => app.status === 'accepted')
  const rejectedApplications = filteredApplications.filter(app => app.status === 'rejected')

  const handleAccept = async (id: string) => {
    const success = await acceptApplication(id)
    if (success) {
      await fetchApplications()
      toast.success('Aplicación aceptada')
    }
  }

  const handleRejectClick = (id: string) => {
    setApplicationToReject(id)
    setShowRejectDialog(true)
  }

  const handleRejectConfirm = async () => {
    if (!applicationToReject) return

    const success = await rejectApplication(applicationToReject, rejectionReason || undefined)
    if (success) {
      await fetchApplications()
      setShowRejectDialog(false)
      setApplicationToReject(null)
      setRejectionReason('')
      toast.success('Aplicación rechazada')
    }
  }

  // ⭐ NUEVO: Iniciar proceso de selección
  const handleStartSelectionProcess = async (id: string) => {
    const success = await startSelectionProcess(id)
    if (success) {
      await fetchApplications()
    }
  }

  // ⭐ NUEVO: Abrir modal de confirmación para seleccionar empleado
  const handleSelectAsEmployeeClick = (application: JobApplication) => {
    setApplicationToSelect(application)
    setShowSelectEmployeeModal(true)
  }

  // ⭐ NUEVO: Confirmar selección de empleado
  const handleSelectAsEmployeeConfirm = async () => {
    if (!applicationToSelect) return

    setIsSelectingEmployee(true)
    const success = await selectAsEmployee(applicationToSelect.id)
    setIsSelectingEmployee(false)

    if (success) {
      await fetchApplications()
      setShowSelectEmployeeModal(false)
      setApplicationToSelect(null)
    }
  }

  const handleViewProfile = (application: JobApplication) => {
    setSelectedApplication(application)
    setShowProfileModal(true)
  }

  // Handle starting chat with applicant
  const handleChat = useCallback(async (applicantUserId: string, applicantName: string) => {
    if (!user?.id || !applicantUserId) {
      toast.error(t('admin.jobApplications.chatInitError'))
      return
    }

    try {
      const conversationId = await createOrGetConversation({
        other_user_id: applicantUserId,
        business_id: businessId,
        initial_message: `¡Hola ${applicantName}! Me gustaría hablar contigo sobre tu aplicación.`
      })

      if (conversationId) {
        // Notificar al componente padre que se inició un chat
        // Esto abrirá el chat automáticamente en el FloatingChatButton
        onChatStarted?.(conversationId)
        toast.success(`Chat abierto con ${applicantName}`)
      }
    } catch {
      toast.error(t('admin.jobApplications.chatError'))
    }
  }, [user?.id, businessId, createOrGetConversation, onChatStarted])

  // Stats
  const stats = [
    { label: 'Total', value: applications.length, color: 'text-blue-600' },
    { label: 'Pendientes', value: pendingApplications.length, color: 'text-yellow-600' },
    { label: 'En Proceso', value: inSelectionApplications.length, color: 'text-purple-600' }, // ⭐ NUEVO
    { label: 'Aceptadas', value: acceptedApplications.length, color: 'text-green-600' },
    { label: 'Rechazadas', value: rejectedApplications.length, color: 'text-red-600' }
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrar Aplicaciones</CardTitle>
          <CardDescription>Busca y filtra aplicaciones por diferentes criterios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search */}
            <div className="space-y-2">
              <Label>Buscar candidato</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('common.placeholders.allStatuses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="reviewing">En Revisión</SelectItem>
                  <SelectItem value="accepted">Aceptada</SelectItem>
                  <SelectItem value="rejected">Rechazada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Vacancy Filter - Oculto si se proporciona vacancyId específico */}
            {!vacancyId && (
              <div className="space-y-2">
                <Label>Vacante</Label>
                <Select value={vacancyFilter} onValueChange={setVacancyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('common.placeholders.allVacancies')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {vacancies.map((vacancy) => (
                      <SelectItem key={vacancy.id} value={vacancy.id}>
                        {vacancy.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Applications by Status */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pendientes
            {pendingApplications.length > 0 && (
              <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {pendingApplications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reviewing">En Revisión ({reviewingApplications.length})</TabsTrigger>
          <TabsTrigger value="in_selection">
            En Proceso de Selección ({inSelectionApplications.length})
            {inSelectionApplications.length > 0 && (
              <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-purple-500">
                {inSelectionApplications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="accepted">Aceptadas ({acceptedApplications.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rechazadas ({rejectedApplications.length})</TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="pending" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Cargando aplicaciones...</p>
            </div>
          ) : pendingApplications.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No hay aplicaciones pendientes</p>
              </CardContent>
            </Card>
          ) : (
            pendingApplications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                onAccept={handleAccept}
                onReject={handleRejectClick}
                onViewProfile={handleViewProfile}
                onChat={handleChat}
                onStartSelectionProcess={handleStartSelectionProcess}
              />
            ))
          )}
        </TabsContent>

        {/* Reviewing Tab */}
        <TabsContent value="reviewing" className="space-y-4">
          {reviewingApplications.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No hay aplicaciones en revisión</p>
              </CardContent>
            </Card>
          ) : (
            reviewingApplications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                onAccept={handleAccept}
                onReject={handleRejectClick}
                onViewProfile={handleViewProfile}
                onChat={handleChat}
                onStartSelectionProcess={handleStartSelectionProcess}
              />
            ))
          )}
        </TabsContent>

        {/* ⭐ NUEVO: In Selection Process Tab */}
        <TabsContent value="in_selection" className="space-y-4">
          {inSelectionApplications.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No hay candidatos en proceso de selección</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Inicia el proceso de selección desde la pestaña de pendientes o en revisión
                </p>
              </CardContent>
            </Card>
          ) : (
            inSelectionApplications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                onAccept={handleAccept}
                onReject={handleRejectClick}
                onViewProfile={handleViewProfile}
                onChat={handleChat}
                onSelectAsEmployee={() => handleSelectAsEmployeeClick(application)}
              />
            ))
          )}
        </TabsContent>

        {/* Accepted Tab */}
        <TabsContent value="accepted" className="space-y-4">
          {acceptedApplications.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No hay aplicaciones aceptadas</p>
              </CardContent>
            </Card>
          ) : (
            acceptedApplications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                onAccept={handleAccept}
                onReject={handleRejectClick}
                onViewProfile={handleViewProfile}
                onChat={handleChat}
              />
            ))
          )}
        </TabsContent>

        {/* Rejected Tab */}
        <TabsContent value="rejected" className="space-y-4">
          {rejectedApplications.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No hay aplicaciones rechazadas</p>
              </CardContent>
            </Card>
          ) : (
            rejectedApplications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                onAccept={handleAccept}
                onReject={handleRejectClick}
                onViewProfile={handleViewProfile}
                onChat={handleChat}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* ⭐ NUEVO: Modal de confirmación de selección de empleado */}
      {applicationToSelect && (
        <SelectEmployeeModal
          isOpen={showSelectEmployeeModal}
          onClose={() => {
            setShowSelectEmployeeModal(false)
            setApplicationToSelect(null)
          }}
          onConfirm={handleSelectAsEmployeeConfirm}
          candidateName={applicationToSelect.applicant?.full_name || 'Candidato'}
          vacancyTitle={applicationToSelect.vacancy?.title || 'Vacante'}
          otherCandidatesCount={
            inSelectionApplications.filter(app => 
              app.vacancy_id === applicationToSelect.vacancy_id && 
              app.id !== applicationToSelect.id
            ).length
          }
          isLoading={isSelectingEmployee}
        />
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Aplicación</DialogTitle>
            <DialogDescription>
              Proporciona un motivo para rechazar esta aplicación (opcional)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Motivo del rechazo</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Ej: El perfil no se ajusta a los requisitos de la posición..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRejectConfirm}>
              Rechazar Aplicación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Modal */}
      {selectedApplication && (
        <ApplicantProfileModal
          application={selectedApplication}
          open={showProfileModal}
          onClose={() => {
            setShowProfileModal(false)
            setSelectedApplication(null)
          }}
          onAccept={handleAccept}
          onReject={handleRejectClick}
        />
      )}
    </div>
  )
}
