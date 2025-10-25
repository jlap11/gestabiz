import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building, MapPin, Wrench, Gear } from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { BusinessInfoForm } from './business/BusinessInfoForm'
import { BusinessHoursForm } from './business/BusinessHoursForm'
import { BusinessSettingsForm } from './business/BusinessSettingsForm'
import { LocationManagement } from './LocationManagement'
import { ServicesManager } from './services/ServicesManager'
import { useBusinessManager } from '@/hooks/useBusinessManager'
import type { User } from '@/types'

interface BusinessManagementProps {
  user: User
}

export function BusinessManagement({ user }: BusinessManagementProps) {
  const { t } = useLanguage()
  const { user: authUser } = useAuth()
  const [activeTab, setActiveTab] = useState('business')
  
  const {
    business,
    locations,
    services,
    isLoading,
    handleBusinessUpdate,
    handleAddLocation,
    handleUpdateLocation,
    handleDeleteLocation,
    handleAddService,
    handleUpdateService,
    handleDeleteService,
    initializeBusiness
  } = useBusinessManager(user)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">{t('business.management.no_business')}</h3>
          <p className="text-muted-foreground text-sm">
            {t('business.management.create_business_first')}
          </p>
        </div>
        <button
          onClick={initializeBusiness}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Building className="h-4 w-4" />
          {t('business.management.create_business')}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header responsivo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold">{t('business.management.title')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t('business.management.subtitle')}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {/* Tabs responsivos */}
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger 
            value="business" 
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2"
          >
            <Building className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">{t('nav.business')}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="locations" 
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2"
          >
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">{t('locations.title')}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="services" 
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2"
          >
            <Wrench className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">{t('services.title')}</span>
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 py-2"
          >
            <Gear className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span className="truncate">{t('settings.title')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Información del negocio */}
        <TabsContent value="business" className="space-y-4 sm:space-y-6">
          <BusinessInfoForm 
            business={business} 
            onUpdate={handleBusinessUpdate} 
          />
          <BusinessHoursForm 
            business={business} 
            onUpdate={handleBusinessUpdate} 
          />
        </TabsContent>

        {/* Gestión de ubicaciones */}
        <TabsContent value="locations" className="space-y-4 sm:space-y-6">
          <LocationManagement
            locations={locations}
            onAdd={handleAddLocation}
            onUpdate={handleUpdateLocation}
            onDelete={handleDeleteLocation}
          />
        </TabsContent>

        {/* Gestión de servicios */}
        <TabsContent value="services" className="space-y-4 sm:space-y-6">
          <ServicesManager
            services={services}
            locations={locations}
            onAdd={handleAddService}
            onUpdate={handleUpdateService}
            onDelete={handleDeleteService}
          />
        </TabsContent>

        {/* Configuración de citas */}
        <TabsContent value="settings" className="space-y-4 sm:space-y-6">
          <BusinessSettingsForm 
            business={business} 
            onUpdate={handleBusinessUpdate} 
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}