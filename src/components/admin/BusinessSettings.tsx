import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Bell, Building2, History, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'
import type { Business } from '@/types/types'
import { BusinessNotificationSettings } from './settings/BusinessNotificationSettings'
import { NotificationTracking } from './settings/NotificationTracking'

interface BusinessSettingsProps {
  business: Business
  onUpdate?: () => void
}

export function BusinessSettings({ business, onUpdate }: Readonly<BusinessSettingsProps>) {
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

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error(t('admin.businessSettings.businessNameRequired'))
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
      if (onUpdate) onUpdate()
    } catch {
      toast.error(t('admin.businessSettings.updateError'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main 
      role="main" 
      aria-labelledby="business-settings-title" 
      className="p-4 sm:p-6 max-w-[95vw] sm:max-w-4xl mx-auto space-y-4 sm:space-y-6"
    >
      <h1 id="business-settings-title" className="sr-only">
        Configuración del Negocio
      </h1>
      
      <header className="flex items-center gap-3 p-2 sm:p-0">
        <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary" aria-hidden="true" />
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            {t('admin.businessSettings.title')}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">{t('admin.businessSettings.subtitle')}</p>
        </div>
      </header>

      <Tabs defaultValue="general" className="w-full">
        <TabsList 
          className="bg-card border border-border p-1 inline-flex w-auto mb-4 sm:mb-6 grid grid-cols-3 sm:grid-cols-3 gap-1 sm:gap-0" 
          role="tablist" 
          aria-label="Configuración del negocio"
        >
          <TabsTrigger
            value="general"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground min-h-[44px] min-w-[44px] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            role="tab"
            aria-selected={true}
            aria-controls="tabpanel-general"
            id="general-tab"
            aria-label="Configuración general"
            title="Configuración general"
          >
            <Building2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" aria-hidden="true" />
            <span className="hidden sm:inline">General</span>
            <span className="sm:hidden">Gen.</span>
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground min-h-[44px] min-w-[44px] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            role="tab"
            aria-selected={false}
            aria-controls="tabpanel-notifications"
            id="notifications-tab"
            aria-label="Configuración de notificaciones"
            title="Configuración de notificaciones"
          >
            <Bell className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" aria-hidden="true" />
            <span className="hidden sm:inline">Notificaciones</span>
            <span className="sm:hidden">Notif.</span>
          </TabsTrigger>
          <TabsTrigger
            value="tracking"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground min-h-[44px] min-w-[44px] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            role="tab"
            aria-selected={false}
            aria-controls="tabpanel-tracking"
            id="tracking-tab"
            aria-label="Historial y seguimiento"
            title="Historial y seguimiento"
          >
            <History className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" aria-hidden="true" />
            <span className="hidden sm:inline">Historial</span>
            <span className="sm:hidden">Hist.</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent 
          value="general" 
          role="tabpanel" 
          id="tabpanel-general" 
          aria-labelledby="general-tab"
        >
          <section role="region" aria-labelledby="general-settings-heading">
            <h3 id="general-settings-heading" className="sr-only">
              Configuración General del Negocio
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Basic Information */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground text-lg sm:text-xl">
                    {t('admin.businessSettings.basicInfo.title')}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-sm sm:text-base">
                    {t('admin.businessSettings.basicInfo.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm sm:text-base">{t('admin.businessSettings.nameLabel')}</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={e => handleChange('name', e.target.value)}
                      placeholder={t('admin.businessSettings.namePlaceholder')}
                      required
                      className="min-h-[44px] text-sm sm:text-base"
                      aria-describedby="name-description"
                      title="Nombre del negocio"
                    />
                    <p id="name-description" className="sr-only">
                      Ingrese el nombre de su negocio. Este campo es obligatorio.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-sm sm:text-base">
                      {t('admin.businessSettings.descriptionLabel')}
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={e => handleChange('description', e.target.value)}
                      placeholder={t('admin.businessSettings.descriptionPlaceholder')}
                      rows={4}
                      className="min-h-[88px] text-sm sm:text-base resize-y"
                      aria-describedby="description-description"
                      title="Descripción del negocio"
                    />
                    <p id="description-description" className="sr-only">
                      Proporcione una descripción detallada de su negocio y servicios.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground text-lg sm:text-xl">
                    {t('admin.businessSettings.contact.title')}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-sm sm:text-base">
                    {t('admin.businessSettings.contact.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="phone" className="text-sm sm:text-base">{t('admin.businessSettings.contact.phoneLabel')}</Label>
                    <PhoneInput
                      value={formData.phone}
                      onChange={value => handleChange('phone', value)}
                      prefix={phonePrefix}
                      onPrefixChange={setPhonePrefix}
                      placeholder={t('common.placeholders.phoneNumber')}
                      className="min-h-[44px]"
                      aria-describedby="phone-description"
                      title="Número de teléfono del negocio"
                    />
                    <p id="phone-description" className="sr-only">
                      Ingrese el número de teléfono principal de contacto del negocio.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm sm:text-base">{t('admin.businessSettings.contact.emailLabel')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={e => handleChange('email', e.target.value)}
                      placeholder={t('common.placeholders.email')}
                      className="min-h-[44px] text-sm sm:text-base"
                      aria-describedby="email-description"
                      title="Correo electrónico del negocio"
                    />
                    <p id="email-description" className="sr-only">
                      Ingrese el correo electrónico principal de contacto del negocio.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="website" className="text-sm sm:text-base">Sitio Web</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={e => handleChange('website', e.target.value)}
                      placeholder="https://www.tunegocio.com"
                      className="min-h-[44px] text-sm sm:text-base"
                      aria-describedby="website-description"
                      title="Sitio web del negocio"
                    />
                    <p id="website-description" className="sr-only">
                      Ingrese la URL del sitio web del negocio (opcional).
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground text-lg sm:text-xl">
                    {t('admin.businessSettings.address.title')}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-sm sm:text-base">
                    {t('admin.businessSettings.address.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="address" className="text-sm sm:text-base">
                      {t('admin.businessSettings.address.addressLabel')}
                    </Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={e => handleChange('address', e.target.value)}
                      placeholder={t('admin.businessSettings.address.addressPlaceholder')}
                      className="min-h-[44px] text-sm sm:text-base"
                      aria-describedby="address-description"
                      title="Dirección del negocio"
                    />
                    <p id="address-description" className="sr-only">
                      Ingrese la dirección física completa del negocio.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city" className="text-sm sm:text-base">{t('admin.businessSettings.address.cityLabel')}</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={e => handleChange('city', e.target.value)}
                        placeholder={t('common.placeholders.city')}
                        className="min-h-[44px] text-sm sm:text-base"
                        aria-describedby="city-description"
                        title="Ciudad del negocio"
                      />
                      <p id="city-description" className="sr-only">
                        Ingrese la ciudad donde se encuentra el negocio.
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="state" className="text-sm sm:text-base">{t('admin.businessSettings.address.stateLabel')}</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={e => handleChange('state', e.target.value)}
                        placeholder={t('common.placeholders.state')}
                        className="min-h-[44px] text-sm sm:text-base"
                        aria-describedby="state-description"
                        title="Estado o departamento del negocio"
                      />
                      <p id="state-description" className="sr-only">
                        Ingrese el estado o departamento donde se encuentra el negocio.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Legal Information */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground text-lg sm:text-xl">
                    {t('admin.businessSettings.legal.title')}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-sm sm:text-base">
                    {t('admin.businessSettings.legal.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="legal_name" className="text-sm sm:text-base">
                      {t('admin.businessSettings.legal.legalNameLabel')}
                    </Label>
                    <Input
                      id="legal_name"
                      value={formData.legal_name}
                      onChange={e => handleChange('legal_name', e.target.value)}
                      placeholder={t('admin.businessSettings.legal.legalNamePlaceholder')}
                      className="min-h-[44px] text-sm sm:text-base"
                      aria-describedby="legal-name-description"
                      title="Razón social del negocio"
                    />
                    <p id="legal-name-description" className="sr-only">
                      Ingrese la razón social o nombre legal registrado del negocio.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="tax_id" className="text-sm sm:text-base">{t('admin.businessSettings.legal.taxIdLabel')}</Label>
                    <Input
                      id="tax_id"
                      value={formData.tax_id}
                      onChange={e => handleChange('tax_id', e.target.value)}
                      placeholder={t('admin.businessSettings.legal.taxIdPlaceholder')}
                      className="min-h-[44px] text-sm sm:text-base"
                      aria-describedby="tax-id-description"
                      title="Número de identificación tributaria"
                    />
                    <p id="tax-id-description" className="sr-only">
                      Ingrese el número de identificación tributaria (NIT, RUT, etc.) del negocio.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <footer className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  disabled={isSaving} 
                  className="bg-primary hover:bg-primary/90 min-h-[44px] min-w-[44px] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  aria-label={isSaving ? "Guardando configuración" : "Guardar configuración"}
                  title={isSaving ? "Guardando configuración" : "Guardar configuración"}
                >
                  <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                  <span className="hidden sm:inline">
                    {isSaving ? t('common.actions.saving') : t('common.actions.save')}
                  </span>
                  <span className="sm:hidden">
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </span>
                </Button>
              </footer>
            </form>
          </section>
        </TabsContent>

        <TabsContent 
          value="notifications" 
          role="tabpanel" 
          id="tabpanel-notifications" 
          aria-labelledby="notifications-tab"
        >
          <section role="region" aria-labelledby="notifications-settings-heading">
            <h3 id="notifications-settings-heading" className="sr-only">
              Configuración de Notificaciones
            </h3>
            <BusinessNotificationSettings businessId={business.id} />
          </section>
        </TabsContent>

        <TabsContent 
          value="tracking" 
          role="tabpanel" 
          id="tabpanel-tracking" 
          aria-labelledby="tracking-tab"
        >
          <section role="region" aria-labelledby="tracking-settings-heading">
            <h3 id="tracking-settings-heading" className="sr-only">
              Historial y Seguimiento
            </h3>
            <NotificationTracking businessId={business.id} />
          </section>
        </TabsContent>
      </Tabs>
    </main>
  )
}