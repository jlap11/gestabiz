import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { User } from '@/types'
import { useKV } from '@/lib/useKV'
import { useTheme } from '@/contexts'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'
import UserProfile from './UserProfile'
import { NotificationSettings } from './NotificationSettings'
import { 
  User as UserIcon, 
  Bell, 
  Palette, 
  Globe, 
  Moon,
  Sun,
  Monitor,
  Briefcase,
  UserCircle,
  ShoppingCart,
  Plus,
  X,
  FloppyDisk as Save,
  CircleNotch as Loader2,
  Medal as Award,
  Translate as Languages,
  Link as LinkIcon,
  CurrencyDollar as DollarSign,
  Calendar,
  Warning as AlertCircle,
  Buildings as Building2
} from '@phosphor-icons/react'
import { useEmployeeProfile, type Certification } from '@/hooks/useEmployeeProfile'
import { supabase } from '@/lib/supabase'
import type { Business } from '@/types/types'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { BusinessNotificationSettings } from '../admin/settings/BusinessNotificationSettings'
import { NotificationTracking } from '../admin/settings/NotificationTracking'

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
  business 
}: CompleteUnifiedSettingsProps) {
  const { t, language, setLanguage } = useLanguage()
  const { theme, setTheme } = useTheme()
  const [, setUsers] = useKV<User[]>('users', [])

  // Helper para obtener info del tema actual
  const getThemeInfo = () => {
    if (theme === 'light') return { label: 'Claro', classes: 'bg-yellow-100 text-yellow-600', icon: Sun }
    if (theme === 'dark') return { label: 'Oscuro', classes: 'bg-blue-100 text-blue-600', icon: Moon }
    return { label: 'Sistema', classes: 'bg-primary/10 text-primary', icon: Monitor }
  }

  const themeInfo = getThemeInfo()
  const ThemeIcon = themeInfo.icon

  const handleLanguageChange = async (newLanguage: 'es' | 'en') => {
    try {
      const updatedUser = {
        ...user,
        language: newLanguage,
        updated_at: new Date().toISOString()
      }

      await setUsers(prev => 
        prev.map(u => u.id === user.id ? updatedUser : u)
      )

      setLanguage(newLanguage)
      onUserUpdate(updatedUser)
      toast.success(t('settings.preferences_saved'))
    } catch (error) {
      toast.error(t('common.messages.updateError'))
      throw error
    }
  }

  // Tabs dinámicas según rol
  const tabs = [
    { value: 'general', label: t('settings.tabs.general'), icon: <Palette className="h-4 w-4" /> },
    { value: 'profile', label: t('settings.tabs.profile'), icon: <UserIcon className="h-4 w-4" /> },
    { value: 'notifications', label: t('settings.tabs.notifications'), icon: <Bell className="h-4 w-4" /> },
  ]

  // Pestaña específica por rol
  const getRoleSpecificTab = () => {
    switch (currentRole) {
      case 'admin':
        return { value: 'role-specific', label: t('settings.tabs.businessPreferences'), icon: <Briefcase className="h-4 w-4" /> }
      case 'employee':
        return { value: 'role-specific', label: t('settings.tabs.employeePreferences'), icon: <UserCircle className="h-4 w-4" /> }
      case 'client':
        return { value: 'role-specific', label: t('settings.tabs.clientPreferences'), icon: <ShoppingCart className="h-4 w-4" /> }
      default:
        return null
    }
  }

  const roleTab = getRoleSpecificTab()
  if (roleTab) {
    tabs.push(roleTab)
  }

  // Agregar pestaña Zona Peligrosa al final
  tabs.push({ 
    value: 'danger-zone', 
    label: t('settings.tabs.dangerZone'), 
    icon: <AlertCircle className="h-4 w-4" /> 
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h2>
          <p className="text-muted-foreground">
            {t('settings.subtitle')}
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
          {tabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
              {tab.icon}
              <span className="hidden md:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* AJUSTES GENERALES - Para todos los roles */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                {t('settings.themeSection.title')}
              </CardTitle>
              <CardDescription>
                {t('settings.themeSection.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  {t('settings.themeSection.themeLabel')}
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  {t('settings.themeSection.themeDescription')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { 
                      value: 'light', 
                      label: t('settings.themeSection.themes.light.label'), 
                      icon: <Sun className="h-5 w-5" />,
                      description: t('settings.themeSection.themes.light.description')
                    },
                    { 
                      value: 'dark', 
                      label: t('settings.themeSection.themes.dark.label'), 
                      icon: <Moon className="h-5 w-5" />,
                      description: t('settings.themeSection.themes.dark.description')
                    },
                    { 
                      value: 'system', 
                      label: t('settings.themeSection.themes.system.label'), 
                      icon: <Monitor className="h-5 w-5" />,
                      description: t('settings.themeSection.themes.system.description')
                    }
                  ].map((themeOption) => (
                    <button
                      key={themeOption.value}
                      onClick={() => setTheme(themeOption.value as 'light' | 'dark' | 'system')}
                      className={`
                        flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all
                        ${theme === themeOption.value 
                          ? 'border-primary bg-primary/5 shadow-sm' 
                          : 'border-border hover:border-primary/50 hover:bg-muted/30'
                        }
                      `}
                    >
                      <div className={`
                        p-3 rounded-full
                        ${theme === themeOption.value ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                      `}>
                        {themeOption.icon}
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-sm">{themeOption.label}</p>
                        <p className="text-xs text-muted-foreground mt-1">{themeOption.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg mt-3">
                  <div className={`p-2 rounded-full ${themeInfo.classes}`}>
                    <ThemeIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {t('settings.themeSection.currentTheme', { theme: themeInfo.label })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {theme === 'system' 
                        ? t('settings.themeSection.systemThemeNote')
                        : t('settings.themeSection.changeAnytime')}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Language Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {t('settings.language')}
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  {t('settings.languageSection.description')}
                </p>
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="es">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🇪🇸</span>
                        <span>{t('settings.spanish')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="en">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🇺🇸</span>
                        <span>{t('settings.english')}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PERFIL - Para todos los roles */}
        <TabsContent value="profile">
          <UserProfile user={user} onUserUpdate={onUserUpdate} />
        </TabsContent>

        {/* NOTIFICACIONES - Para todos los roles */}
        <TabsContent value="notifications" className="space-y-6">
          <NotificationSettings userId={user.id} />
        </TabsContent>

        {/* PREFERENCIAS ESPECÍFICAS DEL ROL */}
        <TabsContent value="role-specific" className="space-y-6">
          {currentRole === 'admin' && business && (
            <AdminRolePreferences business={business} />
          )}
          {currentRole === 'employee' && (
            <EmployeeRolePreferences userId={user.id} businessId={businessId} />
          )}
          {currentRole === 'client' && (
            <ClientRolePreferences />
          )}
        </TabsContent>

        {/* ZONA PELIGROSA - Para todos los roles */}
        <TabsContent value="danger-zone" className="space-y-6">
          <DangerZone user={user} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================
// COMPONENTE: Preferencias del Administrador
// ============================================
interface AdminRolePreferencesProps {
  business: Business
}

function AdminRolePreferences({ business }: AdminRolePreferencesProps) {
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    name: business.name,
    description: business.description || '',
    phone: business.phone || '',
    email: business.email || '',
    website: business.website || '',
    address: business.address || '',
    city: business.city || '',
    state: business.state || '',
    tax_id: business.tax_id || '',
    legal_name: business.legal_name || '',
  })
  const [phonePrefix, setPhonePrefix] = useState('+57')
  const [isSaving, setIsSaving] = useState(false)
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'notifications' | 'tracking'>('info')

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error(t('settings.businessInfo.errors.nameRequired'))
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('businesses')
        .update({
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          phone: formData.phone?.trim() || null,
          email: formData.email?.trim() || null,
          website: formData.website?.trim() || null,
          address: formData.address?.trim() || null,
          city: formData.city?.trim() || null,
          state: formData.state?.trim() || null,
          tax_id: formData.tax_id?.trim() || null,
          legal_name: formData.legal_name?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', business.id)

      if (error) throw error

      toast.success(t('common.messages.updateSuccess'))
    } catch {
      toast.error(t('common.messages.updateError'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant={activeSubTab === 'info' ? 'default' : 'outline'}
          onClick={() => setActiveSubTab('info')}
          className="flex items-center gap-2"
        >
          <Building2 className="h-4 w-4" />
          {t('settings.businessInfo.tabs.info')}
        </Button>
        <Button
          variant={activeSubTab === 'notifications' ? 'default' : 'outline'}
          onClick={() => setActiveSubTab('notifications')}
          className="flex items-center gap-2"
        >
          <Bell className="h-4 w-4" />
          {t('settings.businessInfo.tabs.notifications')}
        </Button>
        <Button
          variant={activeSubTab === 'tracking' ? 'default' : 'outline'}
          onClick={() => setActiveSubTab('tracking')}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          {t('settings.businessInfo.tabs.tracking')}
        </Button>
      </div>

      {activeSubTab === 'info' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.businessInfo.basicInfo.title')}</CardTitle>
              <CardDescription>
                {t('settings.businessInfo.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">{t('settings.businessInfo.basicInfo.nameLabel')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder={t('settings.businessInfo.basicInfo.namePlaceholder')}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">{t('settings.businessInfo.basicInfo.descriptionLabel')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder={t('settings.businessInfo.basicInfo.descriptionPlaceholder')}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.businessInfo.contactInfo.title')}</CardTitle>
              <CardDescription>
                {t('settings.businessInfo.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phone">{t('settings.businessInfo.contactInfo.phoneLabel')}</Label>
                <PhoneInput
                  value={formData.phone}
                  onChange={(value) => handleChange('phone', value)}
                  prefix={phonePrefix}
                  onPrefixChange={setPhonePrefix}
                  placeholder={t('settings.businessInfo.contactInfo.phonePlaceholder')}
                />
              </div>

              <div>
                <Label htmlFor="email">{t('settings.businessInfo.contactInfo.emailLabel')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder={t('settings.businessInfo.contactInfo.emailPlaceholder')}
                />
              </div>

              <div>
                <Label htmlFor="website">{t('settings.businessInfo.contactInfo.websiteLabel')}</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder={t('settings.businessInfo.contactInfo.websitePlaceholder')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.businessInfo.addressInfo.title')}</CardTitle>
              <CardDescription>
                {t('settings.businessInfo.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">{t('settings.businessInfo.addressInfo.addressLabel')}</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder={t('settings.businessInfo.addressInfo.addressPlaceholder')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">{t('settings.businessInfo.addressInfo.cityLabel')}</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder={t('settings.businessInfo.addressInfo.cityPlaceholder')}
                  />
                </div>

                <div>
                  <Label htmlFor="state">{t('settings.businessInfo.addressInfo.stateLabel')}</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    placeholder={t('settings.businessInfo.addressInfo.statePlaceholder')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legal Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.businessInfo.legalInfo.title')}</CardTitle>
              <CardDescription>
                {t('settings.businessInfo.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="legal_name">{t('settings.businessInfo.legalInfo.legalNameLabel')}</Label>
                <Input
                  id="legal_name"
                  value={formData.legal_name}
                  onChange={(e) => handleChange('legal_name', e.target.value)}
                  placeholder={t('settings.businessInfo.legalInfo.legalNamePlaceholder')}
                />
              </div>

              <div>
                <Label htmlFor="tax_id">{t('settings.businessInfo.legalInfo.taxIdLabel')}</Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) => handleChange('tax_id', e.target.value)}
                  placeholder={t('settings.businessInfo.legalInfo.taxIdPlaceholder')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Configuraciones de Operación */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.businessInfo.operationSettings.title')}</CardTitle>
              <CardDescription>
                {t('settings.businessInfo.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">{t('settings.businessInfo.operationSettings.allowOnlineBooking.label')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.businessInfo.operationSettings.allowOnlineBooking.description')}
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">{t('settings.businessInfo.operationSettings.autoConfirm.label')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.businessInfo.operationSettings.autoConfirm.description')}
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">{t('settings.businessInfo.operationSettings.autoReminders.label')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.businessInfo.operationSettings.autoReminders.description')}
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">{t('settings.businessInfo.operationSettings.showPrices.label')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.businessInfo.operationSettings.showPrices.description')}
                  </p>
                </div>
                <Switch defaultChecked />
              </div>


            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? t('common.actions.saving') : t('common.actions.save')}
            </Button>
          </div>
        </form>
      )}

      {activeSubTab === 'notifications' && (
        <BusinessNotificationSettings businessId={business.id} />
      )}

      {activeSubTab === 'tracking' && (
        <NotificationTracking businessId={business.id} />
      )}
    </>
  )
}

// ============================================
// COMPONENTE: Preferencias del Empleado
// ============================================
interface EmployeeRolePreferencesProps {
  userId: string
  businessId?: string
}

function EmployeeRolePreferences({ userId, businessId }: EmployeeRolePreferencesProps) {
  const { t } = useLanguage()
  const {
    profile,
    loading,
    updateProfile,
    addCertification,
    removeCertification,
    addSpecialization,
    removeSpecialization,
    addLanguage,
    removeLanguage,
  } = useEmployeeProfile(userId)

  // Form state
  const [professionalSummary, setProfessionalSummary] = useState('')
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(0)
  const [preferredWorkType, setPreferredWorkType] = useState<'full_time' | 'part_time' | 'contract' | 'flexible'>('full_time')
  const [availableForHire, setAvailableForHire] = useState(true)
  const [expectedSalaryMin, setExpectedSalaryMin] = useState<number>(0)
  const [expectedSalaryMax, setExpectedSalaryMax] = useState<number>(0)
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [githubUrl, setGithubUrl] = useState('')

  // NEW: Message preferences state
  const [allowClientMessages, setAllowClientMessages] = useState(true)
  const [loadingMessagePref, setLoadingMessagePref] = useState(false)

  // New item inputs
  const [newSpecialization, setNewSpecialization] = useState('')
  const [newLanguage, setNewLanguage] = useState('')
  const [showCertificationForm, setShowCertificationForm] = useState(false)

  // Certification form state
  const [certName, setCertName] = useState('')
  const [certIssuer, setCertIssuer] = useState('')
  const [certIssueDate, setCertIssueDate] = useState('')
  const [certExpiryDate, setCertExpiryDate] = useState('')
  const [certCredentialId, setCertCredentialId] = useState('')
  const [certCredentialUrl, setCertCredentialUrl] = useState('')

  const [saving, setSaving] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Load profile data into form
  useEffect(() => {
    if (profile) {
      setProfessionalSummary(profile.professional_summary || '')
      setYearsOfExperience(profile.years_of_experience || 0)
      setPreferredWorkType(profile.preferred_work_type || 'full_time')
      setAvailableForHire(profile.available_for_hire ?? true)
      setExpectedSalaryMin(profile.expected_salary_min || 0)
      setExpectedSalaryMax(profile.expected_salary_max || 0)
      setPortfolioUrl(profile.portfolio_url || '')
      setLinkedinUrl(profile.linkedin_url || '')
      setGithubUrl(profile.github_url || '')
    }
  }, [profile])

  // NEW: Load message preferences
  useEffect(() => {
    const loadMessagePreference = async () => {
      if (!businessId) return

      try {
        const { data, error } = await supabase
          .from('business_employees')
          .select('allow_client_messages')
          .eq('employee_id', userId)
          .eq('business_id', businessId)
          .single()

        if (error) throw error
        setAllowClientMessages(data?.allow_client_messages ?? true)
      } catch {
        // Error loading, default to true
        setAllowClientMessages(true)
      }
    }

    loadMessagePreference()
  }, [userId, businessId])

  // NEW: Handle message preference toggle
  const handleMessagePreferenceToggle = async (newValue: boolean) => {
    if (!businessId) {
      toast.error(t('settings.employeePrefs.messages.allowClientMessages.errorBusinessId'))
      return
    }

    setLoadingMessagePref(true)
    try {
      const { error } = await supabase
        .from('business_employees')
        .update({ allow_client_messages: newValue })
        .eq('employee_id', userId)
        .eq('business_id', businessId)

      if (error) throw error

      setAllowClientMessages(newValue)
      toast.success(
        newValue 
          ? t('settings.employeePrefs.messages.allowClientMessages.successEnabled')
          : t('settings.employeePrefs.messages.allowClientMessages.successDisabled')
      )
    } catch (error) {
      const err = error as Error
      toast.error(err.message || t('settings.employeePrefs.messages.allowClientMessages.error'))
      // Revert the switch on error
      setAllowClientMessages(!newValue)
    } finally {
      setLoadingMessagePref(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      setValidationError(null)

      // Validations
      if (professionalSummary.trim().length > 0 && professionalSummary.trim().length < 50) {
        setValidationError(t('settings.employeePrefs.professionalInfo.errors.summaryTooShort'))
        return
      }

      if (yearsOfExperience < 0 || yearsOfExperience > 50) {
        setValidationError(t('settings.employeePrefs.professionalInfo.errors.experienceRange'))
        return
      }

      if (expectedSalaryMin > 0 && expectedSalaryMax > 0 && expectedSalaryMin > expectedSalaryMax) {
        setValidationError(t('settings.employeePrefs.salary.errors.minGreaterThanMax'))
        return
      }

      await updateProfile({
        professional_summary: professionalSummary.trim() || undefined,
        years_of_experience: yearsOfExperience,
        preferred_work_type: preferredWorkType,
        available_for_hire: availableForHire,
        expected_salary_min: expectedSalaryMin > 0 ? expectedSalaryMin : undefined,
        expected_salary_max: expectedSalaryMax > 0 ? expectedSalaryMax : undefined,
        portfolio_url: portfolioUrl.trim() || undefined,
        linkedin_url: linkedinUrl.trim() || undefined,
        github_url: githubUrl.trim() || undefined,
      })

      toast.success(t('settings.employeePrefs.profileUpdateSuccess'))
    } catch (error) {
      const err = error as Error
      toast.error(err.message || t('settings.employeePrefs.profileUpdateError'))
    } finally {
      setSaving(false)
    }
  }

  const handleAddSpecialization = async () => {
    if (!newSpecialization.trim()) return
    
    try {
      await addSpecialization(newSpecialization.trim())
      setNewSpecialization('')
      toast.success(t('settings.employeePrefs.specializations.successAdd'))
    } catch (error) {
      const err = error as Error
      toast.error(err.message)
    }
  }

  const handleAddLanguage = async () => {
    if (!newLanguage.trim()) return
    
    try {
      await addLanguage(newLanguage.trim())
      setNewLanguage('')
      toast.success(t('settings.employeePrefs.languages.successAdd'))
    } catch (error) {
      const err = error as Error
      toast.error(err.message)
    }
  }

  const handleAddCertification = async () => {
    if (!certName.trim() || !certIssuer.trim() || !certIssueDate) {
      toast.error(t('settings.employeePrefs.certifications.requiredFields'))
      return
    }

    try {
      await addCertification({
        name: certName.trim(),
        issuer: certIssuer.trim(),
        issue_date: certIssueDate,
        expiry_date: certExpiryDate || undefined,
        credential_id: certCredentialId.trim() || undefined,
        credential_url: certCredentialUrl.trim() || undefined,
      })

      // Reset form
      setCertName('')
      setCertIssuer('')
      setCertIssueDate('')
      setCertExpiryDate('')
      setCertCredentialId('')
      setCertCredentialUrl('')
      setShowCertificationForm(false)
      toast.success(t('settings.employeePrefs.certifications.successAdd'))
    } catch (error) {
      const err = error as Error
      toast.error(err.message)
    }
  }

  const handleRemoveSpecialization = async (spec: string) => {
    try {
      await removeSpecialization(spec)
      toast.success(t('settings.employeePrefs.specializations.successRemove'))
    } catch (error) {
      const err = error as Error
      toast.error(err.message)
    }
  }

  const handleRemoveLanguage = async (lang: string) => {
    try {
      await removeLanguage(lang)
      toast.success(t('settings.employeePrefs.languages.successRemove'))
    } catch (error) {
      const err = error as Error
      toast.error(err.message)
    }
  }

  const handleRemoveCertification = async (certId: string) => {
    try {
      await removeCertification(certId)
      toast.success(t('settings.employeePrefs.certifications.successRemove'))
    } catch (error) {
      const err = error as Error
      toast.error(err.message)
    }
  }

  const formatSalary = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {/* Disponibilidad y Horarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            {t('settings.employeePrefs.availability.title')}
          </CardTitle>
          <CardDescription>
            {t('settings.employeePrefs.availability.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">{t('settings.employeePrefs.availability.availableForHire.label')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.employeePrefs.availability.availableForHire.description')}
              </p>
            </div>
            <Switch 
              checked={availableForHire} 
              onCheckedChange={setAvailableForHire}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">{t('settings.employeePrefs.availability.notifyAssignments.label')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.employeePrefs.availability.notifyAssignments.description')}
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">{t('settings.employeePrefs.availability.reminders.label')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.employeePrefs.availability.reminders.description')}
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base font-medium">{t('settings.employeePrefs.schedule.title')}</Label>
            <p className="text-sm text-muted-foreground">
              {t('settings.employeePrefs.schedule.description')}
            </p>
            <div className="space-y-2 mt-3">
              {[
                t('settings.employeePrefs.schedule.days.monday'),
                t('settings.employeePrefs.schedule.days.tuesday'),
                t('settings.employeePrefs.schedule.days.wednesday'),
                t('settings.employeePrefs.schedule.days.thursday'),
                t('settings.employeePrefs.schedule.days.friday'),
                t('settings.employeePrefs.schedule.days.saturday'),
                t('settings.employeePrefs.schedule.days.sunday')
              ].map((day) => (
                <div key={day} className="flex items-center gap-4 p-3 border rounded-lg">
                  <Switch defaultChecked={!day.includes('Domingo')} />
                  <span className="w-24 font-medium">{day}</span>
                  <div className="flex gap-2 flex-1">
                    <Select defaultValue="09:00">
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0')
                          return <SelectItem key={i} value={`${hour}:00`}>{hour}:00</SelectItem>
                        })}
                      </SelectContent>
                    </Select>
                    <span className="text-muted-foreground">-</span>
                    <Select defaultValue="18:00">
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0')
                          return <SelectItem key={i} value={`${hour}:00`}>{hour}:00</SelectItem>
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NEW: Preferencias de Mensajes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('settings.employeePrefs.messages.title')}
          </CardTitle>
          <CardDescription>
            {t('settings.employeePrefs.messages.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">{t('settings.employeePrefs.messages.allowClientMessages.label')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.employeePrefs.messages.allowClientMessages.description')}
              </p>
            </div>
            <Switch 
              checked={allowClientMessages} 
              onCheckedChange={handleMessagePreferenceToggle}
              disabled={loadingMessagePref}
            />
          </div>
        </CardContent>
      </Card>

      {/* Información Profesional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            {t('settings.employeePrefs.professionalInfo.title')}
          </CardTitle>
          <CardDescription>{t('settings.employeePrefs.professionalInfo.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Resumen Profesional */}
          <div className="space-y-2">
            <Label htmlFor="professional-summary">
              {t('settings.employeePrefs.professionalInfo.summaryLabel')}
            </Label>
            <Textarea
              id="professional-summary"
              value={professionalSummary}
              onChange={(e) => setProfessionalSummary(e.target.value)}
              placeholder={t('settings.employeePrefs.professionalInfo.summaryPlaceholder')}
              className="min-h-[120px] resize-y"
            />
            {professionalSummary.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {t('settings.employeePrefs.professionalInfo.minCharacters', { count: professionalSummary.length.toString() })}
              </p>
            )}
          </div>

          {/* Años de Experiencia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="years-experience">{t('settings.employeePrefs.professionalInfo.yearsExperienceLabel')}</Label>
              <Input
                id="years-experience"
                type="number"
                min={0}
                max={50}
                value={yearsOfExperience}
                onChange={(e) => setYearsOfExperience(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="work-type">{t('settings.employeePrefs.professionalInfo.workTypeLabel')}</Label>
              <Select value={preferredWorkType} onValueChange={(v) => setPreferredWorkType(v as typeof preferredWorkType)}>
                <SelectTrigger id="work-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">{t('settings.employeePrefs.professionalInfo.workTypes.fullTime')}</SelectItem>
                  <SelectItem value="part_time">{t('settings.employeePrefs.professionalInfo.workTypes.partTime')}</SelectItem>
                  <SelectItem value="contract">{t('settings.employeePrefs.professionalInfo.workTypes.contract')}</SelectItem>
                  <SelectItem value="flexible">{t('settings.employeePrefs.professionalInfo.workTypes.flexible')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expectativas Salariales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t('settings.employeePrefs.salary.title')}
          </CardTitle>
          <CardDescription>{t('settings.employeePrefs.salary.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary-min">{t('settings.employeePrefs.salary.minLabel')}</Label>
              <Input
                id="salary-min"
                type="number"
                min={0}
                value={expectedSalaryMin}
                onChange={(e) => setExpectedSalaryMin(Number(e.target.value))}
                placeholder={t('settings.employeePrefs.salary.minPlaceholder')}
              />
              {expectedSalaryMin > 0 && (
                <p className="text-xs text-muted-foreground">{formatSalary(expectedSalaryMin)}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary-max">{t('settings.employeePrefs.salary.maxLabel')}</Label>
              <Input
                id="salary-max"
                type="number"
                min={0}
                value={expectedSalaryMax}
                onChange={(e) => setExpectedSalaryMax(Number(e.target.value))}
                placeholder={t('settings.employeePrefs.salary.maxPlaceholder')}
              />
              {expectedSalaryMax > 0 && (
                <p className="text-xs text-muted-foreground">{formatSalary(expectedSalaryMax)}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Especializaciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            {t('settings.employeePrefs.specializations.title')}
          </CardTitle>
          <CardDescription>{t('settings.employeePrefs.specializations.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {profile?.specializations?.map((spec) => (
              <Badge key={spec} variant="secondary" className="text-sm">
                {spec}
                <button
                  onClick={() => handleRemoveSpecialization(spec)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder={t('settings.employeePrefs.specializations.placeholder')}
              value={newSpecialization}
              onChange={(e) => setNewSpecialization(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSpecialization()}
            />
            <Button onClick={handleAddSpecialization} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Idiomas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            {t('settings.employeePrefs.languages.title')}
          </CardTitle>
          <CardDescription>{t('settings.employeePrefs.languages.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {profile?.languages?.map((lang) => (
              <Badge key={lang} variant="outline" className="text-sm">
                {lang}
                <button
                  onClick={() => handleRemoveLanguage(lang)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder={t('settings.employeePrefs.languages.placeholder')}
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddLanguage()}
            />
            <Button onClick={handleAddLanguage} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Certificaciones */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('settings.employeePrefs.certifications.title')}
              </CardTitle>
              <CardDescription>{t('settings.employeePrefs.certifications.description')}</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCertificationForm(!showCertificationForm)}
            >
              <Plus className="h-4 w-4 mr-1" />
              {t('settings.employeePrefs.certifications.addButton')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Certification Form */}
          {showCertificationForm && (
            <Card className="border-dashed">
              <CardContent className="pt-6 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder={t('settings.employeePrefs.certifications.namePlaceholder')}
                    value={certName}
                    onChange={(e) => setCertName(e.target.value)}
                  />
                  <Input
                    placeholder={t('settings.employeePrefs.certifications.issuerPlaceholder')}
                    value={certIssuer}
                    onChange={(e) => setCertIssuer(e.target.value)}
                  />
                  <Input
                    type="date"
                    placeholder={t('settings.employeePrefs.certifications.issueDatePlaceholder')}
                    value={certIssueDate}
                    onChange={(e) => setCertIssueDate(e.target.value)}
                  />
                  <Input
                    type="date"
                    placeholder={t('settings.employeePrefs.certifications.expiryDatePlaceholder')}
                    value={certExpiryDate}
                    onChange={(e) => setCertExpiryDate(e.target.value)}
                  />
                  <Input
                    placeholder={t('settings.employeePrefs.certifications.credentialIdPlaceholder')}
                    value={certCredentialId}
                    onChange={(e) => setCertCredentialId(e.target.value)}
                  />
                  <Input
                    placeholder={t('settings.employeePrefs.certifications.credentialUrlPlaceholder')}
                    value={certCredentialUrl}
                    onChange={(e) => setCertCredentialUrl(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddCertification} size="sm">{t('common.actions.save')}</Button>
                  <Button variant="outline" size="sm" onClick={() => setShowCertificationForm(false)}>
                    {t('common.actions.cancel')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Certifications List */}
          <div className="space-y-3">
            {profile?.certifications?.map((cert: Certification) => (
              <div key={cert.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{cert.name}</h4>
                    <p className="text-sm text-muted-foreground">{cert.issuer}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{t('settings.employeePrefs.certifications.issuedLabel')}: {new Date(cert.issue_date).toLocaleDateString()}</span>
                      {cert.expiry_date && (
                        <span>• {t('settings.employeePrefs.certifications.expiresLabel')}: {new Date(cert.expiry_date).toLocaleDateString()}</span>
                      )}
                    </div>
                    {cert.credential_url && (
                      <a
                        href={cert.credential_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mt-1 inline-block"
                      >
                        {t('settings.employeePrefs.certifications.viewCredential')} →
                      </a>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCertification(cert.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Enlaces Externos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            {t('settings.employeePrefs.links.title')}
          </CardTitle>
          <CardDescription>{t('settings.employeePrefs.links.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="portfolio-url">{t('settings.employeePrefs.links.portfolioLabel')}</Label>
            <Input
              id="portfolio-url"
              type="url"
              placeholder={t('settings.employeePrefs.links.portfolioPlaceholder')}
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedin-url">{t('settings.employeePrefs.links.linkedinLabel')}</Label>
            <Input
              id="linkedin-url"
              type="url"
              placeholder={t('settings.employeePrefs.links.linkedinPlaceholder')}
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="github-url">{t('settings.employeePrefs.links.githubLabel')}</Label>
            <Input
              id="github-url"
              type="url"
              placeholder={t('settings.employeePrefs.links.githubPlaceholder')}
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button onClick={handleSaveProfile} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('common.actions.saving')}...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t('settings.employeePrefs.saveChanges')}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// ============================================
// COMPONENTE: Preferencias del Cliente
// ============================================
function ClientRolePreferences() {
  const { t } = useLanguage()
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {t('settings.clientPrefs.bookingPrefs.title')}
          </CardTitle>
          <CardDescription>
            {t('settings.clientPrefs.bookingPrefs.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">{t('settings.clientPrefs.bookingPrefs.reminders.label')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.clientPrefs.bookingPrefs.reminders.description')}
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">{t('settings.clientPrefs.bookingPrefs.emailConfirmation.label')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.clientPrefs.bookingPrefs.emailConfirmation.description')}
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">{t('settings.clientPrefs.bookingPrefs.promotions.label')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.clientPrefs.bookingPrefs.promotions.description')}
                </p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">{t('settings.clientPrefs.bookingPrefs.savePayment.label')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.clientPrefs.bookingPrefs.savePayment.description')}
                </p>
              </div>
              <Switch />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base font-medium">{t('settings.clientPrefs.advanceTime.title')}</Label>
            <p className="text-sm text-muted-foreground">
              {t('settings.clientPrefs.advanceTime.description')}
            </p>
            <Select defaultValue="24">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{t('settings.clientPrefs.advanceTime.options.oneHour')}</SelectItem>
                <SelectItem value="2">{t('settings.clientPrefs.advanceTime.options.twoHours')}</SelectItem>
                <SelectItem value="4">{t('settings.clientPrefs.advanceTime.options.fourHours')}</SelectItem>
                <SelectItem value="24">{t('settings.clientPrefs.advanceTime.options.oneDay')}</SelectItem>
                <SelectItem value="48">{t('settings.clientPrefs.advanceTime.options.twoDays')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base font-medium">{t('settings.clientPrefs.paymentMethods.title')}</Label>
            <Select defaultValue="card">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">{t('settings.clientPrefs.paymentMethods.options.card')}</SelectItem>
                <SelectItem value="cash">{t('settings.clientPrefs.paymentMethods.options.cash')}</SelectItem>
                <SelectItem value="transfer">{t('settings.clientPrefs.paymentMethods.options.transfer')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base font-medium">{t('settings.clientPrefs.serviceHistory.title')}</Label>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                {t('settings.clientPrefs.serviceHistory.completedServices', { count: '0' })}
              </p>
              <Button variant="outline" className="mt-3 w-full">
                {t('settings.clientPrefs.serviceHistory.viewHistory')}
              </Button>
            </div>
          </div>

          <div className="pt-4">
            <Button className="w-full">{t('settings.clientPrefs.savePreferences')}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================
// COMPONENTE: Zona Peligrosa (Eliminar Cuenta)
// ============================================
interface DangerZoneProps {
  user: User
}

function DangerZone({ user }: DangerZoneProps) {
  const { t } = useLanguage()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1)
  const [confirmEmail, setConfirmEmail] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [understandConsequences, setUnderstandConsequences] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleOpenDeleteDialog = () => {
    setDeleteStep(1)
    setConfirmEmail('')
    setConfirmText('')
    setUnderstandConsequences(false)
    setShowDeleteDialog(true)
  }

  const handleCloseDialog = () => {
    if (!isDeleting) {
      setShowDeleteDialog(false)
      setDeleteStep(1)
    }
  }

  const handleProceedToStep2 = () => {
    if (confirmEmail.toLowerCase() === user.email.toLowerCase() && understandConsequences) {
      setDeleteStep(2)
    }
  }

  const handleDeleteAccount = async () => {
    if (confirmText !== 'DESACTIVAR CUENTA') {
      toast.error(t('settings.dangerZone.delete.mustTypeCorrectly'))
      return
    }

    setIsDeleting(true)

    try {
      // Llamar a la función RPC para desactivar la cuenta
      // Esta función automáticamente:
      // - Marca is_active = FALSE en profiles
      // - Registra deactivated_at con timestamp
      // - Cancela todas las citas futuras pendientes
      const { error } = await supabase.rpc('deactivate_user_account', {
        user_id_param: user.id
      })

      if (error) throw error

      // Cerrar sesión
      await supabase.auth.signOut()

      toast.success(t('settings.dangerZone.delete.successTitle'), {
        description: t('settings.dangerZone.delete.successDescription')
      })
      
      // Limpiar localStorage
      localStorage.clear()
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('settings.dangerZone.delete.unknownError')
      toast.error(t('settings.dangerZone.delete.errorTitle'), {
        description: errorMessage
      })
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            {t('settings.dangerZone.title')}
          </CardTitle>
          <CardDescription>
            {t('settings.dangerZone.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{t('settings.dangerZone.warning.label')}:</strong> {t('settings.dangerZone.warning.message')}
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <h4 className="text-base font-semibold mb-2">{t('settings.dangerZone.deactivate.title')}</h4>
              <p className="text-sm text-muted-foreground mb-4">
                {t('settings.dangerZone.deactivate.subtitle')}
              </p>
              
              <div className="bg-muted/30 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium mb-2">{t('settings.dangerZone.deactivate.whatHappens')}</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>{t('settings.dangerZone.deactivate.consequences.markedInactive')}</li>
                  <li>{t('settings.dangerZone.deactivate.consequences.sessionClosed')}</li>
                  <li>{t('settings.dangerZone.deactivate.consequences.futureAppointments')}</li>
                  <li>{t('settings.dangerZone.deactivate.consequences.noLogin')}</li>
                  <li>{t('settings.dangerZone.deactivate.consequences.dataPreserved')}</li>
                </ul>
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">
                    ✓ {t('settings.dangerZone.deactivate.dataNotDeleted')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.dangerZone.deactivate.contactSupport')}
                  </p>
                </div>
              </div>

              <Button 
                variant="destructive" 
                onClick={handleOpenDeleteDialog}
                className="w-full"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                {t('settings.dangerZone.deactivate.button')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmación multi-paso */}
      <Dialog open={showDeleteDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              {deleteStep === 1 ? t('settings.dangerZone.delete.step1Title') : t('settings.dangerZone.delete.step2Title')}
            </DialogTitle>
            <DialogDescription>
              {deleteStep === 1 
                ? t('settings.dangerZone.delete.step1Description')
                : t('settings.dangerZone.delete.step2Description')}
            </DialogDescription>
          </DialogHeader>

          {deleteStep === 1 && (
            <div className="space-y-4 py-4">
              <Alert className="border-yellow-500 bg-yellow-500/10">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <AlertDescription className="text-sm text-yellow-800 dark:text-white-200">
                  {t('settings.dangerZone.delete.step1Warning')}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="confirm-email">
                  {t('settings.dangerZone.delete.emailPrompt')}: <strong>{user.email}</strong>
                </Label>
                <Input
                  id="confirm-email"
                  type="email"
                  placeholder={t('settings.dangerZone.delete.emailPlaceholder')}
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="understand"
                  checked={understandConsequences}
                  onCheckedChange={(checked) => setUnderstandConsequences(checked as boolean)}
                />
                <label
                  htmlFor="understand"
                  className="text-sm leading-tight cursor-pointer"
                >
                  {t('settings.dangerZone.delete.understandCheckbox')}
                </label>
              </div>
            </div>
          )}

          {deleteStep === 2 && (
            <div className="space-y-4 py-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm font-semibold">
                  ⚠️ {t('settings.dangerZone.delete.finalWarning')}
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="confirm-text">
                  {t('settings.dangerZone.delete.typeExactly')}: <code className="bg-muted px-2 py-1 rounded">DESACTIVAR CUENTA</code>
                </Label>
                <Input
                  id="confirm-text"
                  type="text"
                  placeholder={t('settings.dangerZone.delete.confirmPlaceholder')}
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full font-mono"
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-2">
                  {t('settings.dangerZone.delete.confirmDetails')}:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>⚠️ {t('settings.dangerZone.delete.accountLabel')}: {user.email}</li>
                  <li>⚠️ {t('settings.dangerZone.delete.profileLabel')}: {user.name}</li>
                  <li>⚠️ {t('settings.dangerZone.delete.rolesLabel')}: {user.roles?.length || 0} {t('settings.dangerZone.delete.activeLabel')}</li>
                  <li>⚠️ {t('settings.dangerZone.delete.appointmentsLabel')}: {t('settings.dangerZone.delete.cancelledAuto')}</li>
                </ul>
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs font-medium text-green-600 dark:text-green-400">
                    ✓ {t('settings.dangerZone.delete.dataPreservedNote')}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleCloseDialog}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              {t('common.actions.cancel')}
            </Button>
            {deleteStep === 1 ? (
              <Button
                variant="destructive"
                onClick={handleProceedToStep2}
                disabled={
                  confirmEmail.toLowerCase() !== user.email.toLowerCase() ||
                  !understandConsequences
                }
                className="w-full sm:w-auto"
              >
                {t('settings.dangerZone.delete.continue')}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={confirmText !== 'DESACTIVAR CUENTA' || isDeleting}
                className="w-full sm:w-auto"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('settings.dangerZone.delete.deactivating')}...
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {t('settings.dangerZone.delete.deactivateNow')}
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
