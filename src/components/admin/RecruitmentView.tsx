import { useState } from 'react'
import { VacancyList } from '@/components/jobs/VacancyList'
import { VacancyDetail } from '@/components/jobs/VacancyDetail'
import { CreateVacancy } from '@/components/jobs/CreateVacancy'
import { ApplicationDetail } from '@/components/jobs/ApplicationDetail'

interface RecruitmentViewProps {
  businessId: string
}

type JobView = 'list' | 'detail' | 'create' | 'edit' | 'application-detail'

export function RecruitmentView({ businessId }: Readonly<RecruitmentViewProps>) {
  const [jobView, setJobView] = useState<JobView>('list')
  const [selectedVacancyId, setSelectedVacancyId] = useState<string | null>(null)
  const [editingVacancyId, setEditingVacancyId] = useState<string | null>(null)
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null)

  return (
    <div className="p-6">
      {jobView === 'list' && (
        <VacancyList
          businessId={businessId}
          onCreateNew={() => setJobView('create')}
          onSelectVacancy={(id) => {
            setSelectedVacancyId(id)
            setJobView('detail')
          }}
        />
      )}

      {jobView === 'create' && (
        <CreateVacancy
          businessId={businessId}
          onClose={() => setJobView('list')}
          onSuccess={() => setJobView('list')}
        />
      )}

      {jobView === 'edit' && editingVacancyId && (
        <CreateVacancy
          businessId={businessId}
          vacancyId={editingVacancyId}
          onClose={() => setJobView('detail')}
          onSuccess={() => setJobView('detail')}
        />
      )}

      {jobView === 'detail' && selectedVacancyId && (
        <VacancyDetail
          vacancyId={selectedVacancyId}
          businessId={businessId}
          onBack={() => setJobView('list')}
          onEdit={(id) => {
            setEditingVacancyId(id)
            setJobView('edit')
          }}
          onViewApplication={(id) => {
            setSelectedApplicationId(id)
            setJobView('application-detail')
          }}
        />
      )}

      {jobView === 'application-detail' && selectedApplicationId && (
        <ApplicationDetail
          applicationId={selectedApplicationId}
          isAdmin={true}
          onBack={() => setJobView('detail')}
          onUpdate={() => {
            // Trigger refresh if needed
          }}
        />
      )}
    </div>
  )
}
