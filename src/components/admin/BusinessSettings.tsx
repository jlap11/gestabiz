import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Building2, Save, Bell, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import type { Business } from '@/types/types'
import { BusinessNotificationSettings } from './settings/BusinessNotificationSettings'
import { NotificationTracking } from './settings/NotificationTracking'

interface BusinessSettingsProps {
  business: Business
  onUpdate?: () => void
}

export function BusinessSettings({ business, onUpdate }: Readonly<BusinessSettingsProps>) {
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
      if (onUpdate) onUpdate()
    } catch {
      toast.error('Error al actualizar la configuración')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-2xl font-bold text-foreground">Configuración del Negocio</h2>
          <p className="text-muted-foreground text-sm">Actualiza la información de tu negocio</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-card border border-border p-1 inline-flex w-auto mb-6">
          <TabsTrigger
            value="general"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Building2 className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Bell className="h-4 w-4 mr-2" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger
            value="tracking"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <History className="h-4 w-4 mr-2" />
            Historial
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Información Básica</CardTitle>
            <CardDescription className="text-muted-foreground">
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
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Información de Contacto</CardTitle>
            <CardDescription className="text-muted-foreground">
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
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Dirección</CardTitle>
            <CardDescription className="text-muted-foreground">
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
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Información Legal</CardTitle>
            <CardDescription className="text-muted-foreground">
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
        </TabsContent>

        <TabsContent value="notifications">
          <BusinessNotificationSettings businessId={business.id} />
        </TabsContent>

        <TabsContent value="tracking">
          <NotificationTracking businessId={business.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
