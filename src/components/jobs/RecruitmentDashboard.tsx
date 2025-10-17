import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus, Briefcase, History } from 'lucide-react'
import { VacancyList } from './VacancyList'
import { ApplicationsManagement } from './ApplicationsManagement'
import { CreateVacancy } from './CreateVacancy'

interface RecruitmentDashboardProps {
  businessId: string
  highlightedVacancyId?: string // ID de vacante para resaltar (desde notificación)
}

export function RecruitmentDashboard({ businessId, highlightedVacancyId }: Readonly<RecruitmentDashboardProps>) {
  const [activeTab, setActiveTab] = useState('vacancies')
  const [showCreateVacancy, setShowCreateVacancy] = useState(false)
  const [selectedVacancyId, setSelectedVacancyId] = useState<string | null>(null)
  const [showApplications, setShowApplications] = useState(false)

  const handleCreateSuccess = () => {
    setShowCreateVacancy(false)
    setSelectedVacancyId(null)
    // Trigger refresh of vacancy list
  }

  const handleEditVacancy = (vacancyId: string) => {
    setSelectedVacancyId(vacancyId)
    setShowCreateVacancy(true)
  }

  const handleViewApplications = (vacancyId: string) => {
    setSelectedVacancyId(vacancyId)
    setShowApplications(true)
  }

  const handleCloseApplications = () => {
    setShowApplications(false)
    setSelectedVacancyId(null)
  }

  if (showCreateVacancy) {
    return (
      <CreateVacancy
        businessId={businessId}
        vacancyId={selectedVacancyId}
        onClose={() => {
          setShowCreateVacancy(false)
          setSelectedVacancyId(null)
        }}
        onSuccess={handleCreateSuccess}
      />
    )
  }

  if (showApplications && selectedVacancyId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Aplicaciones</h2>
            <p className="text-muted-foreground mt-1">
              Gestiona las aplicaciones para esta vacante
            </p>
          </div>
          <Button onClick={handleCloseApplications} variant="outline">
            Volver a Vacantes
          </Button>
        </div>
        <ApplicationsManagement 
          businessId={businessId} 
          vacancyId={selectedVacancyId}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reclutamiento</h2>
          <p className="text-muted-foreground mt-1">
            Gestiona vacantes y aplicaciones de candidatos
          </p>
        </div>
        <Button onClick={() => setShowCreateVacancy(true)} size="lg">
          <Plus className="h-5 w-5 mr-2" />
          Nueva Vacante
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="vacancies" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Vacantes Activas
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        {/* Vacancies Tab */}
        <TabsContent value="vacancies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vacantes Laborales</CardTitle>
              <CardDescription>
                Gestiona las posiciones abiertas en tu negocio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VacancyList
                businessId={businessId}
                onEdit={handleEditVacancy}
                onViewApplications={handleViewApplications}
                highlightedVacancyId={highlightedVacancyId}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Contrataciones</CardTitle>
              <CardDescription>
                Revisa vacantes cerradas y candidatos contratados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VacancyList
                businessId={businessId}
                statusFilter="closed"
                onEdit={handleEditVacancy}
                onViewApplications={handleViewApplications}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
