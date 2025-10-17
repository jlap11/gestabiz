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
      toast.error('Error al actualizar idioma')
      throw error
    }
  }

  // Tabs dinámicas según rol
  const tabs = [
    { value: 'general', label: 'Ajustes Generales', icon: <Palette className="h-4 w-4" /> },
    { value: 'profile', label: t('settings.profile'), icon: <UserIcon className="h-4 w-4" /> },
    { value: 'notifications', label: t('settings.notifications'), icon: <Bell className="h-4 w-4" /> },
  ]

  // Pestaña específica por rol
  const getRoleSpecificTab = () => {
    switch (currentRole) {
      case 'admin':
        return { value: 'role-specific', label: 'Preferencias del Negocio', icon: <Briefcase className="h-4 w-4" /> }
      case 'employee':
        return { value: 'role-specific', label: 'Preferencias de Empleado', icon: <UserCircle className="h-4 w-4" /> }
      case 'client':
        return { value: 'role-specific', label: 'Preferencias de Cliente', icon: <ShoppingCart className="h-4 w-4" /> }
      default:
        return null
    }
  }

  const roleTab = getRoleSpecificTab()
  if (roleTab) {
    tabs.push(roleTab)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h2>
          <p className="text-muted-foreground">
            Configura tu cuenta y preferencias
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
                Apariencia y Sistema
              </CardTitle>
              <CardDescription>
                Personaliza el tema y el idioma de la aplicación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Tema de la interfaz
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Selecciona el tema que prefieres para la aplicación
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { 
                      value: 'light', 
                      label: 'Claro', 
                      icon: <Sun className="h-5 w-5" />,
                      description: 'Interfaz con colores claros'
                    },
                    { 
                      value: 'dark', 
                      label: 'Oscuro', 
                      icon: <Moon className="h-5 w-5" />,
                      description: 'Interfaz con colores oscuros'
                    },
                    { 
                      value: 'system', 
                      label: 'Sistema', 
                      icon: <Monitor className="h-5 w-5" />,
                      description: 'Según preferencias del sistema'
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
                      Tema actual: {themeInfo.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {theme === 'system' 
                        ? 'El tema cambia automáticamente según las preferencias de tu sistema operativo'
                        : 'Puedes cambiar el tema en cualquier momento'}
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
                  Selecciona el idioma de la interfaz
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
            <EmployeeRolePreferences userId={user.id} />
          )}
          {currentRole === 'client' && (
            <ClientRolePreferences />
          )}
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
      toast.error('El nombre del negocio es requerido')
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

      toast.success('Configuración actualizada exitosamente')
    } catch {
      toast.error('Error al actualizar la configuración')
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
          Información del Negocio
        </Button>
        <Button
          variant={activeSubTab === 'notifications' ? 'default' : 'outline'}
          onClick={() => setActiveSubTab('notifications')}
          className="flex items-center gap-2"
        >
          <Bell className="h-4 w-4" />
          Notificaciones del Negocio
        </Button>
        <Button
          variant={activeSubTab === 'tracking' ? 'default' : 'outline'}
          onClick={() => setActiveSubTab('tracking')}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Historial
        </Button>
      </div>

      {activeSubTab === 'info' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información Básica</CardTitle>
              <CardDescription>
                Información general de tu negocio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del Negocio *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Nombre de tu negocio"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe tu negocio"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
              <CardDescription>
                Cómo pueden contactarte tus clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <PhoneInput
                  value={formData.phone}
                  onChange={(value) => handleChange('phone', value)}
                  prefix={phonePrefix}
                  onPrefixChange={setPhonePrefix}
                  placeholder="Número de teléfono"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="contacto@negocio.com"
                />
              </div>

              <div>
                <Label htmlFor="website">Sitio Web</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://www.tunegocio.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>Dirección</CardTitle>
              <CardDescription>
                Ubicación principal de tu negocio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Calle y número"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="Ciudad"
                  />
                </div>

                <div>
                  <Label htmlFor="state">Estado/Provincia</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    placeholder="Estado"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Información Legal</CardTitle>
              <CardDescription>
                Datos fiscales y legales de tu negocio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="legal_name">Razón Social</Label>
                <Input
                  id="legal_name"
                  value={formData.legal_name}
                  onChange={(e) => handleChange('legal_name', e.target.value)}
                  placeholder="Razón social o nombre legal"
                />
              </div>

              <div>
                <Label htmlFor="tax_id">NIT / RFC / Tax ID</Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) => handleChange('tax_id', e.target.value)}
                  placeholder="Número de identificación fiscal"
                />
              </div>
            </CardContent>
          </Card>

          {/* Configuraciones de Operación */}
          <Card>
            <CardHeader>
              <CardTitle>Configuraciones de Operación</CardTitle>
              <CardDescription>
                Ajusta cómo funciona tu negocio en la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Permitir reservas online</Label>
                  <p className="text-sm text-muted-foreground">
                    Los clientes pueden agendar citas directamente desde la plataforma
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Confirmación automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Las citas se confirman automáticamente sin necesidad de aprobación manual
                  </p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Recordatorios automáticos</Label>
                  <p className="text-sm text-muted-foreground">
                    Envía recordatorios automáticos a los clientes antes de sus citas
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Mostrar precios públicamente</Label>
                  <p className="text-sm text-muted-foreground">
                    Los precios de los servicios son visibles para todos
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
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
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
}

function EmployeeRolePreferences({ userId }: EmployeeRolePreferencesProps) {
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

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      setValidationError(null)

      // Validations
      if (professionalSummary.trim().length > 0 && professionalSummary.trim().length < 50) {
        setValidationError('El resumen profesional debe tener al menos 50 caracteres')
        return
      }

      if (yearsOfExperience < 0 || yearsOfExperience > 50) {
        setValidationError('Los años de experiencia deben estar entre 0 y 50')
        return
      }

      if (expectedSalaryMin > 0 && expectedSalaryMax > 0 && expectedSalaryMin > expectedSalaryMax) {
        setValidationError('El salario mínimo no puede ser mayor que el máximo')
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

      toast.success('Perfil actualizado exitosamente')
    } catch (error) {
      const err = error as Error
      toast.error(err.message || 'Error al actualizar perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleAddSpecialization = async () => {
    if (!newSpecialization.trim()) return
    
    try {
      await addSpecialization(newSpecialization.trim())
      setNewSpecialization('')
      toast.success('Especialización agregada')
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
      toast.success('Idioma agregado')
    } catch (error) {
      const err = error as Error
      toast.error(err.message)
    }
  }

  const handleAddCertification = async () => {
    if (!certName.trim() || !certIssuer.trim() || !certIssueDate) {
      toast.error('Nombre, emisor y fecha de emisión son requeridos')
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
      toast.success('Certificación agregada')
    } catch (error) {
      const err = error as Error
      toast.error(err.message)
    }
  }

  const handleRemoveSpecialization = async (spec: string) => {
    try {
      await removeSpecialization(spec)
      toast.success('Especialización eliminada')
    } catch (error) {
      const err = error as Error
      toast.error(err.message)
    }
  }

  const handleRemoveLanguage = async (lang: string) => {
    try {
      await removeLanguage(lang)
      toast.success('Idioma eliminado')
    } catch (error) {
      const err = error as Error
      toast.error(err.message)
    }
  }

  const handleRemoveCertification = async (certId: string) => {
    try {
      await removeCertification(certId)
      toast.success('Certificación eliminada')
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
            Disponibilidad Laboral
          </CardTitle>
          <CardDescription>
            Configura tus horarios y disponibilidad para atender citas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Disponible para nuevas citas</Label>
              <p className="text-sm text-muted-foreground">
                Acepta nuevas asignaciones de citas de clientes
              </p>
            </div>
            <Switch 
              checked={availableForHire} 
              onCheckedChange={setAvailableForHire}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Notificar nuevas asignaciones</Label>
              <p className="text-sm text-muted-foreground">
                Recibe alertas cuando te asignen una nueva cita
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Recordatorios de citas</Label>
              <p className="text-sm text-muted-foreground">
                Recibe recordatorios antes de cada cita agendada
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base font-medium">Mi horario de trabajo</Label>
            <p className="text-sm text-muted-foreground">
              Define los días y horarios en los que estás disponible para atender
            </p>
            <div className="space-y-2 mt-3">
              {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day) => (
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

      {/* Información Profesional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Información Profesional
          </CardTitle>
          <CardDescription>Tu experiencia y tipo de trabajo preferido</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Resumen Profesional */}
          <div className="space-y-2">
            <Label htmlFor="professional-summary">
              Resumen Profesional
            </Label>
            <Textarea
              id="professional-summary"
              value={professionalSummary}
              onChange={(e) => setProfessionalSummary(e.target.value)}
              placeholder="Describe tu experiencia, habilidades y lo que te hace único como profesional..."
              className="min-h-[120px] resize-y"
            />
            {professionalSummary.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {professionalSummary.length} / 50 caracteres mínimos
              </p>
            )}
          </div>

          {/* Años de Experiencia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="years-experience">Años de Experiencia</Label>
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
              <Label htmlFor="work-type">Tipo de Trabajo Preferido</Label>
              <Select value={preferredWorkType} onValueChange={(v) => setPreferredWorkType(v as typeof preferredWorkType)}>
                <SelectTrigger id="work-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Tiempo Completo</SelectItem>
                  <SelectItem value="part_time">Medio Tiempo</SelectItem>
                  <SelectItem value="contract">Contrato</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
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
            Expectativas Salariales
          </CardTitle>
          <CardDescription>Opcional: Ayuda a los empleadores a hacerte ofertas adecuadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="salary-min">Salario Mínimo Esperado</Label>
              <Input
                id="salary-min"
                type="number"
                min={0}
                value={expectedSalaryMin}
                onChange={(e) => setExpectedSalaryMin(Number(e.target.value))}
                placeholder="2000000"
              />
              {expectedSalaryMin > 0 && (
                <p className="text-xs text-muted-foreground">{formatSalary(expectedSalaryMin)}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary-max">Salario Máximo Esperado</Label>
              <Input
                id="salary-max"
                type="number"
                min={0}
                value={expectedSalaryMax}
                onChange={(e) => setExpectedSalaryMax(Number(e.target.value))}
                placeholder="5000000"
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
            Especializaciones
          </CardTitle>
          <CardDescription>Tus áreas de experiencia</CardDescription>
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
              placeholder="Ej: Desarrollo Web, Marketing Digital..."
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
            Idiomas
          </CardTitle>
          <CardDescription>Los idiomas que hablas</CardDescription>
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
              placeholder="Ej: Español, Inglés..."
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
                Certificaciones
              </CardTitle>
              <CardDescription>Tus certificaciones profesionales</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCertificationForm(!showCertificationForm)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar
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
                    placeholder="Nombre de la certificación *"
                    value={certName}
                    onChange={(e) => setCertName(e.target.value)}
                  />
                  <Input
                    placeholder="Emisor *"
                    value={certIssuer}
                    onChange={(e) => setCertIssuer(e.target.value)}
                  />
                  <Input
                    type="date"
                    placeholder="Fecha de emisión *"
                    value={certIssueDate}
                    onChange={(e) => setCertIssueDate(e.target.value)}
                  />
                  <Input
                    type="date"
                    placeholder="Fecha de vencimiento"
                    value={certExpiryDate}
                    onChange={(e) => setCertExpiryDate(e.target.value)}
                  />
                  <Input
                    placeholder="ID de credencial"
                    value={certCredentialId}
                    onChange={(e) => setCertCredentialId(e.target.value)}
                  />
                  <Input
                    placeholder="URL de credencial"
                    value={certCredentialUrl}
                    onChange={(e) => setCertCredentialUrl(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddCertification} size="sm">Guardar</Button>
                  <Button variant="outline" size="sm" onClick={() => setShowCertificationForm(false)}>
                    Cancelar
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
                      <span>Emisión: {new Date(cert.issue_date).toLocaleDateString()}</span>
                      {cert.expiry_date && (
                        <span>• Vencimiento: {new Date(cert.expiry_date).toLocaleDateString()}</span>
                      )}
                    </div>
                    {cert.credential_url && (
                      <a
                        href={cert.credential_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mt-1 inline-block"
                      >
                        Ver credencial →
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
            Enlaces Externos
          </CardTitle>
          <CardDescription>Portfolio, LinkedIn, GitHub, etc.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="portfolio-url">Portfolio / Sitio Web</Label>
            <Input
              id="portfolio-url"
              type="url"
              placeholder="https://tu-portfolio.com"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedin-url">LinkedIn</Label>
            <Input
              id="linkedin-url"
              type="url"
              placeholder="https://linkedin.com/in/tu-perfil"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="github-url">GitHub</Label>
            <Input
              id="github-url"
              type="url"
              placeholder="https://github.com/tu-usuario"
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
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
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
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Preferencias de Reserva
          </CardTitle>
          <CardDescription>
            Configura tus preferencias de reserva y comunicación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Recordatorios de citas</Label>
                <p className="text-sm text-muted-foreground">
                  Recibe recordatorios automáticos antes de tus citas
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Confirmación por email</Label>
                <p className="text-sm text-muted-foreground">
                  Recibe confirmación por correo al agendar una cita
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Notificaciones de promociones</Label>
                <p className="text-sm text-muted-foreground">
                  Recibe ofertas especiales de los negocios que sigues
                </p>
              </div>
              <Switch />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Guardar métodos de pago</Label>
                <p className="text-sm text-muted-foreground">
                  Almacena tarjetas para reservas más rápidas
                </p>
              </div>
              <Switch />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base font-medium">Tiempo de anticipación preferido</Label>
            <p className="text-sm text-muted-foreground">
              ¿Con cuánta anticipación quieres recibir recordatorios?
            </p>
            <Select defaultValue="24">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hora antes</SelectItem>
                <SelectItem value="2">2 horas antes</SelectItem>
                <SelectItem value="4">4 horas antes</SelectItem>
                <SelectItem value="24">1 día antes</SelectItem>
                <SelectItem value="48">2 días antes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base font-medium">Método de pago preferido</Label>
            <Select defaultValue="card">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">Tarjeta de crédito/débito</SelectItem>
                <SelectItem value="cash">Efectivo en el lugar</SelectItem>
                <SelectItem value="transfer">Transferencia bancaria</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base font-medium">Historial de servicios</Label>
            <div className="p-4 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Has completado <strong className="text-foreground">0 servicios</strong> hasta ahora
              </p>
              <Button variant="outline" className="mt-3 w-full">
                Ver Historial Completo
              </Button>
            </div>
          </div>

          <div className="pt-4">
            <Button className="w-full">Guardar Preferencias</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
