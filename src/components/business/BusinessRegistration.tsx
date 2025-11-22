import { useState } from 'react'
import { businessesService } from '@/lib/services'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { CountrySelect } from '@/components/catalog/CountrySelect'
import { RegionSelect } from '@/components/catalog/RegionSelect'
import { CitySelect } from '@/components/catalog/CitySelect'
import { Building2, Briefcase } from 'lucide-react'
import { toast } from 'sonner'
import { Business, User } from '@/types'
import { useLanguage } from '@/contexts/LanguageContext'
import { useBusinessCategories } from '@/hooks/useBusinessCategories'

interface BusinessRegistrationProps {
  user: User
  onBusinessCreated: (business: Business) => void
  onCancel: () => void
}

interface BusinessCategory {
  id: string
  name: string
  slug: string
}

export default function BusinessRegistration({ user, onBusinessCreated, onCancel }: Readonly<BusinessRegistrationProps>) {
  const { t } = useLanguage()
  const { mainCategories, isLoading: loadingCategories } = useBusinessCategories()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [phonePrefix, setPhonePrefix] = useState('+57')
  const [subcategories, setSubcategories] = useState<string[]>(['', '', ''])
  
  const [formData, setFormData] = useState({
    name: '',
    legal_name: '',
    description: '',
    category_id: '',
    resource_model: 'professional' as 'professional' | 'physical_resource' | 'hybrid' | 'group_class',
    legal_entity_type: 'individual' as 'company' | 'individual',
    tax_id: '',
    registration_number: '',
    phone: '',
    email: '',
    country_id: '',
    region_id: '',
    city_id: '',
    website: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleLocationChange = (field: 'country_id' | 'region_id' | 'city_id', value: string) => {
    if (field === 'country_id') {
      // Al cambiar país, resetear región y ciudad
      setFormData(prev => ({ ...prev, country_id: value, region_id: '', city_id: '' }))
    } else if (field === 'region_id') {
      // Al cambiar región, resetear ciudad
      setFormData(prev => ({ ...prev, region_id: value, city_id: '' }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!formData.name || !formData.category_id || !formData.phone) {
        toast.error(t('business.registration.validation.required_fields'))
        return
      }

      // ⚠️ TEMPORAL DEBUG - Ver qué datos se están enviando
      console.log('🔍 DEBUG - formData antes de crear negocio:', {
        category_id: formData.category_id,
        country_id: formData.country_id,
        region_id: formData.region_id,
        city_id: formData.city_id,
        formDataCompleto: formData
      })

      // Create business in Supabase
      // ⚠️ FIX: Convertir strings vacíos a undefined para evitar error 400 de UUID inválido
      const createdBusiness = await businessesService.create({
        name: formData.name,
        legal_name: formData.legal_name || undefined,
        description: formData.description || undefined,
        resource_model: formData.resource_model, // Modelo de negocio seleccionado
        legal_entity_type: formData.legal_entity_type,
        tax_id: formData.tax_id || undefined,
        registration_number: formData.registration_number || undefined,
        category_id: formData.category_id || undefined, // Categoría principal del negocio
        owner_id: user.id,
        phone: formData.phone || undefined,
        email: formData.email || user.email,
        website: formData.website || undefined,
        // ⭐ CRÍTICO: Strings vacíos se convierten a undefined, luego el servicio los convierte a null
        country_id: formData.country_id || undefined,
        region_id: formData.region_id || undefined,
        city_id: formData.city_id || undefined,
        settings: {
          appointment_buffer: 15,
          advance_booking_days: 30,
          cancellation_policy: 24,
          auto_confirm: false,
          require_deposit: false,
          deposit_percentage: 0,
          currency: 'COP',
        },
        is_active: true,
      } as Omit<Business, 'id' | 'created_at' | 'updated_at'>)

      toast.success(t('business.registration.success'))
      onBusinessCreated(createdBusiness)
    } catch (error) {
      toast.error(t('business.registration.error'))
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {t('business.registration.title')}
        </CardTitle>
        <CardDescription>
          {t('business.registration.business_description')}
        </CardDescription>
      </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t('business.registration.basic_info')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="required">
                      {t('business.registration.business_name')}
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder={t('business.registration.placeholders.business_name')}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category" className="required">
                      {t('business.registration.category')}
                    </Label>
                    <Select 
                      value={formData.category_id} 
                      onValueChange={(value) => handleInputChange('category_id', value)}
                      disabled={loadingCategories}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={loadingCategories ? 'Cargando categorías...' : t('business.registration.placeholders.category')} />
                      </SelectTrigger>
                      <SelectContent>
                        {mainCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Subcategorías - Campos de texto libre (máximo 3) */}
                <div className="space-y-3">
                  <Label>
                    Subcategorías (Opcional - Máximo 3)
                    <span className="text-sm text-muted-foreground ml-2">
                      Especifica hasta 3 subcategorías para tu negocio
                    </span>
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Input
                        placeholder="Ej: Corte de cabello"
                        value={subcategories[0]}
                        onChange={(e) => {
                          const newSubcats = [...subcategories]
                          newSubcats[0] = e.target.value
                          setSubcategories(newSubcats)
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="Ej: Tinte"
                        value={subcategories[1]}
                        onChange={(e) => {
                          const newSubcats = [...subcategories]
                          newSubcats[1] = e.target.value
                          setSubcategories(newSubcats)
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="Ej: Peinado"
                        value={subcategories[2]}
                        onChange={(e) => {
                          const newSubcats = [...subcategories]
                          newSubcats[2] = e.target.value
                          setSubcategories(newSubcats)
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Legal Information */}
                <div className="space-y-2">
                  <Label htmlFor="legal_entity_type" className="required">
                    Tipo de Entidad
                  </Label>
                  <RadioGroup
                    value={formData.legal_entity_type}
                    onValueChange={(value) => handleInputChange('legal_entity_type', value as 'company' | 'individual')}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="individual" id="individual" />
                      <Label htmlFor="individual" className="cursor-pointer">Persona Natural / Independiente</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="company" id="company" />
                      <Label htmlFor="company" className="cursor-pointer">Empresa / Persona Jurídica</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.legal_entity_type === 'company' && (
                    <div className="space-y-2">
                      <Label htmlFor="legal_name">
                        Razón Social
                      </Label>
                      <Input
                        id="legal_name"
                        value={formData.legal_name}
                        onChange={(e) => handleInputChange('legal_name', e.target.value)}
                        placeholder="Nombre legal de la empresa"
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="tax_id">
                      {formData.legal_entity_type === 'company' ? 'NIT' : 'Cédula / NIT'}
                    </Label>
                    <Input
                      id="tax_id"
                      value={formData.tax_id}
                      onChange={(e) => handleInputChange('tax_id', e.target.value)}
                      placeholder={formData.legal_entity_type === 'company' ? 'Ej: 900123456-7' : 'Ej: 1234567890'}
                    />
                  </div>
                </div>
                {formData.legal_entity_type === 'company' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="registration_number">
                        Número de Registro Mercantil
                      </Label>
                      <Input
                        id="registration_number"
                        value={formData.registration_number}
                        onChange={(e) => handleInputChange('registration_number', e.target.value)}
                        placeholder="Número de registro en cámara de comercio"
                      />
                    </div>
                    <div className="space-y-2">
                      {/* Espacio vacío para mantener simetría */}
                    </div>
                  </div>
                )}

                {/* Business Model Selector */}
                <div className="space-y-3">
                  <Label htmlFor="resource_model" className="required">
                    Modelo de Negocio
                  </Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Selecciona cómo opera tu negocio para reservas
                  </p>
                  <RadioGroup
                    value={formData.resource_model}
                    onValueChange={(value) => handleInputChange('resource_model', value as typeof formData.resource_model)}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                  >
                    <Label
                      htmlFor="professional"
                      className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors has-[:checked]:border-primary has-[:checked]:bg-accent/50"
                    >
                      <RadioGroupItem value="professional" id="professional" className="mt-1" />
                      <div className="flex-1">
                        <div className="font-semibold mb-1">Profesionales</div>
                        <div className="text-sm text-muted-foreground">
                          Salón de belleza, clínica médica, consultoría (reservas con empleados)
                        </div>
                      </div>
                    </Label>

                    <Label
                      htmlFor="physical_resource"
                      className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors has-[:checked]:border-primary has-[:checked]:bg-accent/50"
                    >
                      <RadioGroupItem value="physical_resource" id="physical_resource" className="mt-1" />
                      <div className="flex-1">
                        <div className="font-semibold mb-1">Recursos Físicos</div>
                        <div className="text-sm text-muted-foreground">
                          Hotel, restaurante, centro deportivo (reservas de habitaciones, mesas, canchas)
                        </div>
                      </div>
                    </Label>

                    <Label
                      htmlFor="hybrid"
                      className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors has-[:checked]:border-primary has-[:checked]:bg-accent/50"
                    >
                      <RadioGroupItem value="hybrid" id="hybrid" className="mt-1" />
                      <div className="flex-1">
                        <div className="font-semibold mb-1">Híbrido</div>
                        <div className="text-sm text-muted-foreground">
                          Spa con salas privadas, gimnasio con entrenadores (ambos tipos de reservas)
                        </div>
                      </div>
                    </Label>

                    <Label
                      htmlFor="group_class"
                      className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors has-[:checked]:border-primary has-[:checked]:bg-accent/50"
                    >
                      <RadioGroupItem value="group_class" id="group_class" className="mt-1" />
                      <div className="flex-1">
                        <div className="font-semibold mb-1">Clases Grupales</div>
                        <div className="text-sm text-muted-foreground">
                          Yoga, spinning, talleres (múltiples clientes por sesión)
                        </div>
                      </div>
                    </Label>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    {t('business.registration.business_description')}
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder={t('business.registration.placeholders.description')}
                    rows={3}
                  />
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  {t('business.registration.contact_info')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="required">
                      {t('business.registration.phone')}
                    </Label>
                    <PhoneInput
                      value={formData.phone}
                      onChange={(value) => handleInputChange('phone', value)}
                      prefix={phonePrefix}
                      onPrefixChange={setPhonePrefix}
                      placeholder="Número de teléfono"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      {t('business.registration.email')}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">
                      {t('business.registration.website')}
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder={t('business.registration.placeholders.website')}
                    />
                  </div>
                  <div className="space-y-2">
                    {/* Espacio vacío para mantener simetría */}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Legal Location */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Ubicación Legal del Negocio
                </h3>
                <p className="text-sm text-muted-foreground">
                  Indica dónde está registrado legalmente tu negocio (no la dirección física de las sedes)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country_id">
                      País
                    </Label>
                    <CountrySelect
                      value={formData.country_id}
                      onChange={(value) => handleLocationChange('country_id', value)}
                      defaultToColombia={true}
                      disabled={false}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region_id">
                      Departamento/Región
                    </Label>
                    <RegionSelect
                      countryId={formData.country_id}
                      value={formData.region_id}
                      onChange={(value) => handleLocationChange('region_id', value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city_id">
                      Ciudad
                    </Label>
                    <CitySelect
                      regionId={formData.region_id}
                      value={formData.city_id}
                      onChange={(value) => handleLocationChange('city_id', value)}
                    />
                  </div>
                </div>
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Nota:</strong> Después de crear tu negocio podrás:
                  </p>
                  <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 list-disc list-inside space-y-1">
                    <li>Agregar sedes físicas con dirección y horarios de atención</li>
                    <li>Crear servicios y asignarlos a las sedes</li>
                    <li>Invitar empleados y asignarlos a las sedes</li>
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6">
                <Button type="button" variant="outline" onClick={onCancel}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? t('business.registration.creating') : t('business.registration.create_business')}
                </Button>
              </div>
            </form>
        </CardContent>
      </Card>
  )
}