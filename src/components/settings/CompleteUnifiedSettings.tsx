import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Globe,
  Monitor,
  Moon,
  Palette,
  Sun,
  UserIcon,
  Bell,
  Building2,
  UserCircle,
  AlertCircle,
} from '@phosphor-icons/react'
import { User } from '@/types'
import { useTheme } from '@/contexts'
import { useLanguage } from '@/contexts/LanguageContext'
import UserProfile from './UserProfile'
import { NotificationSettings } from './NotificationSettings'
import type { Business } from '@/types/types'

// Importar componentes extraídos
import GeneralSettings from './tabs/GeneralSettings'
import AdminRolePreferences from './tabs/AdminRolePreferences'
import EmployeeRolePreferences from './tabs/EmployeeRolePreferences'
import ClientRolePreferences from './tabs/ClientRolePreferences'
import DangerZone from './tabs/DangerZone'

interface CompleteUnifiedSettingsProps {
  user: User
  onUserUpdate: (user: User) => void
  currentRole: 'admin' | 'employee' | 'client'
  businessId?: string // Para admin/employee
  business?: Business // Para admin
}

export default function CompleteUnifiedSettings({
  user,
  onUserUpdate,
  currentRole,
  businessId,
  business,
}: CompleteUnifiedSettingsProps) {
  const { theme } = useTheme()
  const { t, language } = useLanguage()

  // Generar tabs dinámicamente según el rol
  const tabs = [
    {
      id: 'general',
      label: t('settings.tabs.general'),
      icon: <Palette className="h-4 w-4" />,
    },
    {
      id: 'profile',
      label: t('settings.tabs.profile'),
      icon: <UserIcon className="h-4 w-4" />,
    },
    {
      id: 'notifications',
      label: t('settings.tabs.notifications'),
      icon: <Bell className="h-4 w-4" />,
    },
  ]

  // Agregar tab específico del rol
  if (currentRole === 'admin' && business) {
    tabs.push({
      id: 'admin-prefs',
      label: t('settings.tabs.adminPrefs'),
      icon: <Building2 className="h-4 w-4" />,
    })
  } else if (currentRole === 'employee') {
    tabs.push({
      id: 'employee-prefs',
      label: t('settings.tabs.employeePrefs'),
      icon: <UserCircle className="h-4 w-4" />,
    })
  } else if (currentRole === 'client') {
    tabs.push({
      id: 'client-prefs',
      label: t('settings.tabs.clientPrefs'),
      icon: <UserCircle className="h-4 w-4" />,
    })
  }

  // Agregar Danger Zone al final
  tabs.push({
    id: 'danger-zone',
    label: t('settings.tabs.dangerZone'),
    icon: <AlertCircle className="h-4 w-4" />,
  })

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('settings.description')}</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto p-1">
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-2 px-3 py-2 text-sm"
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab: General (Tema y Idioma) */}
        <TabsContent value="general" className="space-y-6">
          <GeneralSettings />
        </TabsContent>

        {/* Tab: Perfil */}
        <TabsContent value="profile" className="space-y-6">
          <UserProfile user={user} onUserUpdate={onUserUpdate} />
        </TabsContent>

        {/* Tab: Notificaciones */}
        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings />
        </TabsContent>

        {/* Tab: Preferencias de Admin */}
        {currentRole === 'admin' && business && (
          <TabsContent value="admin-prefs" className="space-y-6">
            <AdminRolePreferences business={business} />
          </TabsContent>
        )}

        {/* Tab: Preferencias de Empleado */}
        {currentRole === 'employee' && (
          <TabsContent value="employee-prefs" className="space-y-6">
            <EmployeeRolePreferences userId={user.id} businessId={businessId} />
          </TabsContent>
        )}

        {/* Tab: Preferencias de Cliente */}
        {currentRole === 'client' && (
          <TabsContent value="client-prefs" className="space-y-6">
            <ClientRolePreferences />
          </TabsContent>
        )}

        {/* Tab: Danger Zone */}
        <TabsContent value="danger-zone" className="space-y-6">
          <DangerZone user={user} />
        </TabsContent>
      </Tabs>
    </div>
  )
}