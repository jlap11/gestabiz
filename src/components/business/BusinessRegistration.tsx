import { useState } from 'react'
import { useKV } from '@/lib/useKV'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { MapPin, Phone, Clock, Globe, Building, Star } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Business, User, Service } from '@/types'
import { useLanguage } from '@/contexts/LanguageContext'
import { v4 as uuidv4 } from 'uuid'

interface BusinessRegistrationProps {
  user: User
  onBusinessCreated: (business: Business) => void
  onCancel: () => void
}

export default function BusinessRegistration({ user, onBusinessCreated, onCancel }: BusinessRegistrationProps) {
  const { t } = useLanguage()
  const [businesses, setBusinesses] = useKV<Business[]>('businesses', [])
  const [services, setServices] = useKV<Service[]>('services', [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    country: '',
    postal_code: '',
    latitude: '',
    longitude: '',
    business_hours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '14:00', closed: false },
      sunday: { open: '10:00', close: '14:00', closed: true }
    }
  })

  const [businessServices, setBusinessServices] = useState<Omit<Service, 'id' | 'business_id'>[]>([
    { name: '', description: '', duration: 60, price: 0, category: '', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  ])

  const businessCategories = [
    'beauty_salon',
    'barbershop',
    'medical',
    'dental',
    'veterinary',
    'fitness',
    'consulting',
    'automotive',
    'education',
    'legal',
    'real_estate',
    'other'
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleBusinessHoursChange = (day: string, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: {
          ...prev.business_hours[day as keyof typeof prev.business_hours],
          [field]: value
        }
      }
    }))
  }

  const handleServiceChange = (index: number, field: string, value: string | number) => {
    setBusinessServices(prev => prev.map((service, i) => 
      i === index ? { ...service, [field]: value } : service
    ))
  }

  const addService = () => {
    setBusinessServices(prev => [
      ...prev,
      { name: '', description: '', duration: 60, price: 0, category: '', is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ])
  }

  const removeService = (index: number) => {
    if (businessServices.length > 1) {
      setBusinessServices(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!formData.name || !formData.category || !formData.phone) {
        toast.error(t('business.registration.validation.required_fields'))
        return
      }

      // Validate services
      const validServices = businessServices.filter(service => 
        service.name && service.duration > 0 && service.price >= 0
      )

      if (validServices.length === 0) {
        toast.error(t('business.registration.validation.at_least_one_service'))
        return
      }

      // Create business
      const businessId = uuidv4()
      const newBusiness: Business = {
        id: businessId,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        owner_id: user.id,
        phone: formData.phone,
        email: formData.email || user.email,
        website: formData.website,
        address: formData.address,
        city: formData.city,
        country: formData.country,
        postal_code: formData.postal_code,
  latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
  longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        business_hours: formData.business_hours,
        settings: {
          appointment_buffer: 15,
          advance_booking_days: 30,
          cancellation_policy: 24,
          auto_confirm: false,
          require_deposit: false,
          deposit_percentage: 0,
          currency: 'USD'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Create services
      const newServices: Service[] = validServices.map(service => ({
        id: uuidv4(),
        business_id: businessId,
        name: service.name,
        description: service.description,
        duration: service.duration,
        price: service.price,
        category: service.category,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      // Save to storage
      await setBusinesses(prev => [...prev, newBusiness])
      await setServices(prev => [...prev, ...newServices])

      toast.success(t('business.registration.success'))
      onBusinessCreated(newBusiness)
    } catch (error) {
      console.error('Error creating business:', error)
      toast.error(t('business.registration.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLocationDetection = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }))
          toast.success(t('business.registration.location_detected'))
        },
        (error) => {
          console.error('Geolocation error:', error)
          toast.error(t('business.registration.location_error'))
        }
      )
    } else {
      toast.error(t('business.registration.location_not_supported'))
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-6 w-6" />
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
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('business.registration.placeholders.category')} />
                      </SelectTrigger>
                      <SelectContent>
                        {businessCategories.map(category => (
                          <SelectItem key={category} value={category}>
                            {t(`business.categories.${category}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                  <Phone className="h-5 w-5" />
                  {t('business.registration.contact_info')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="required">
                      {t('business.registration.phone')}
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder={t('business.registration.placeholders.phone')}
                      required
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
                      placeholder={formData.email || user.email}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
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
                </div>
              </div>

              <Separator />

              {/* Location */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    {t('business.registration.location')}
                  </h3>
                  <Button type="button" variant="outline" size="sm" onClick={handleLocationDetection}>
                    {t('business.registration.detect_location')}
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">
                      {t('business.registration.address')}
                    </Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder={t('business.registration.placeholders.address')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      {t('business.registration.city')}
                    </Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder={t('business.registration.placeholders.city')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">
                      {t('business.registration.country')}
                    </Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      placeholder={t('business.registration.placeholders.country')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">
                      {t('business.registration.postal_code')}
                    </Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => handleInputChange('postal_code', e.target.value)}
                      placeholder={t('business.registration.placeholders.postal_code')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      {t('business.registration.coordinates')}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.latitude}
                        onChange={(e) => handleInputChange('latitude', e.target.value)}
                        placeholder={t('business.registration.placeholders.latitude')}
                      />
                      <Input
                        value={formData.longitude}
                        onChange={(e) => handleInputChange('longitude', e.target.value)}
                        placeholder={t('business.registration.placeholders.longitude')}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Business Hours */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {t('business.registration.business_hours')}
                </h3>
                <div className="space-y-3">
                  {Object.entries(formData.business_hours).map(([day, hours]) => (
                    <div key={day} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="w-24">
                        <Label className="font-medium">
                          {t(`business.registration.days.${day}`)}
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!hours.closed}
                          onChange={(e) => handleBusinessHoursChange(day, 'closed', !e.target.checked)}
                          className="rounded"
                        />
                        <Label className="text-sm">{t('business.registration.open')}</Label>
                      </div>
                      {!hours.closed && (
                        <>
                          <Input
                            type="time"
                            value={hours.open}
                            onChange={(e) => handleBusinessHoursChange(day, 'open', e.target.value)}
                            className="w-32"
                          />
                          <span>-</span>
                          <Input
                            type="time"
                            value={hours.close}
                            onChange={(e) => handleBusinessHoursChange(day, 'close', e.target.value)}
                            className="w-32"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Services */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    {t('business.registration.services')}
                  </h3>
                  <Button type="button" variant="outline" size="sm" onClick={addService}>
                    {t('business.registration.add_service')}
                  </Button>
                </div>
                <div className="space-y-4">
                  {businessServices.map((service, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">
                          {t('business.registration.service')} {index + 1}
                        </Badge>
                        {businessServices.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeService(index)}
                          >
                            {t('business.registration.remove')}
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>
                            {t('business.registration.service_name')}
                          </Label>
                          <Input
                            value={service.name}
                            onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                            placeholder={t('business.registration.placeholders.service_name')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>
                            {t('business.registration.service_category')}
                          </Label>
                          <Input
                            value={service.category}
                            onChange={(e) => handleServiceChange(index, 'category', e.target.value)}
                            placeholder={t('business.registration.placeholders.service_category')}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>
                            {t('business.registration.duration')} ({t('business.registration.minutes')})
                          </Label>
                          <Input
                            type="number"
                            min="15"
                            step="15"
                            value={service.duration}
                            onChange={(e) => handleServiceChange(index, 'duration', parseInt(e.target.value) || 60)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>
                            {t('business.registration.price')}
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={service.price}
                            onChange={(e) => handleServiceChange(index, 'price', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>
                            {t('business.registration.service_description')}
                          </Label>
                          <Textarea
                            value={service.description}
                            onChange={(e) => handleServiceChange(index, 'description', e.target.value)}
                            placeholder={t('business.registration.placeholders.service_description')}
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
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
      </div>
    </div>
  )
}