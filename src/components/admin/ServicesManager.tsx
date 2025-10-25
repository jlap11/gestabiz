import React from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import { Plus } from '@phosphor-icons/react'
import { useServicesManager } from '@/hooks/useServicesManager'
import { ServiceForm } from './services/ServiceForm'
import { ServicesList } from './services/ServicesList'

interface ServicesManagerProps {
  businessId: string
}

export const ServicesManager: React.FC<ServicesManagerProps> = ({ businessId }) => {
  const { t } = useLanguage()
  
  const {
    // State
    services,
    locations,
    employees,
    isLoading,
    isSaving,
    isDialogOpen,
    editingService,
    formData,
    selectedLocations,
    selectedEmployees,
    pendingImageFiles,
    
    // Actions
    handleOpenDialog,
    handleCloseDialog,
    handleChange,
    handleToggleLocation,
    handleToggleEmployee,
    handleSubmit,
    handleDelete,
    handleImageUploaded,
    setPendingImageFiles,
  } = useServicesManager(businessId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12" role="status" aria-label={t('common.loading')}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
        <span className="sr-only">{t('common.loading')}</span>
      </div>
    )
  }

  return (
    <main 
      role="main" 
      aria-labelledby="services-manager-title"
      className="p-3 sm:p-6 space-y-3 sm:space-y-4 max-w-[100vw] overflow-x-hidden"
    >
      <h1 id="services-manager-title" className="sr-only">{t('admin.services.title')}</h1>
      
      {/* Header - Enhanced Accessibility */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h2 
            id="services-header" 
            className="text-xl sm:text-2xl font-bold text-foreground truncate"
            aria-describedby="services-subtitle"
          >
            {t('admin.services.title')}
          </h2>
          <p id="services-subtitle" className="text-muted-foreground text-xs sm:text-sm">
            {t('admin.services.subtitle')}
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-primary hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 w-full sm:w-auto min-h-[44px] min-w-[44px]"
          aria-label={t('admin.actions.addService')}
          title={t('admin.actions.addService')}
        >
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          <span className="hidden sm:inline">{t('admin.actions.addService')}</span>
          <span className="sm:hidden">{t('admin.actions.newService')}</span>
        </Button>
      </header>

      {/* Services List */}
      <ServicesList
        services={services}
        onCreateService={() => handleOpenDialog()}
        onEditService={handleOpenDialog}
        onDeleteService={handleDelete}
      />

      {/* Service Form Dialog */}
      <ServiceForm
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        editingService={editingService}
        formData={formData}
        onFormChange={handleChange}
        locations={locations}
        employees={employees}
        selectedLocations={selectedLocations}
        selectedEmployees={selectedEmployees}
        onToggleLocation={handleToggleLocation}
        onToggleEmployee={handleToggleEmployee}
        pendingImageFiles={pendingImageFiles}
        onPendingImageFilesChange={setPendingImageFiles}
        onImageUploaded={handleImageUploaded}
        isSaving={isSaving}
      />
    </main>
  )
}