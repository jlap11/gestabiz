import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { businessService } from '@/lib/services/businessService'
import { useLanguage } from '@/contexts/LanguageContext'

interface BusinessFormData {
  name: string
  category: string
  resource_model: 'location' | 'employee'
  description: string
  phone: string
  email: string
  website: string
  address: string
  city: string
  country: string
  postal_code: string
  latitude: string
  longitude: string
  business_hours: Record<string, { open: string; close: string; closed: boolean }>
}

interface BusinessCategory {
  id: string
  name: string
}

export function useBusinessForm(onSuccess?: () => void, onCancel?: () => void) {
  const { t } = useLanguage()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [businessCategories, setBusinessCategories] = useState<BusinessCategory[]>([])

  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    category: '',
    resource_model: 'location',
    description: '',
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
      sunday: { open: '09:00', close: '14:00', closed: true },
    },
  })

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categories = await businessService.getBusinessCategories()
        setBusinessCategories(categories)
      } catch (error) {
        console.error('Error loading business categories:', error)
        toast.error(t('business.registration.error_loading_categories'))
      }
    }
    loadCategories()
  }, [t])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleBusinessHoursChange = (day: string, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: {
          ...prev.business_hours[day],
          [field]: value,
        },
      },
    }))
  }

  const validateForm = (): boolean => {
    const requiredFields = ['name', 'category', 'phone', 'email']
    const missingFields = requiredFields.filter(field => !formData[field as keyof BusinessFormData])

    if (missingFields.length > 0) {
      toast.error(t('business.registration.missing_required_fields'))
      return false
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error(t('business.registration.invalid_email'))
      return false
    }

    return true
  }

  const handleSubmit = async (businessServices: any[]) => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const businessData = {
        ...formData,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      }

      const business = await businessService.createBusiness(businessData)
      
      if (businessServices.length > 0) {
        const servicesData = businessServices.map(service => ({
          ...service,
          business_id: business.id,
          price: typeof service.price === 'string' ? parseFloat(service.price) || 0 : service.price,
        }))
        
        await businessService.createBusinessServices(servicesData)
      }

      toast.success(t('business.registration.success'))
      onSuccess?.()
    } catch (error) {
      console.error('Error creating business:', error)
      toast.error(t('business.registration.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    formData,
    businessCategories,
    isSubmitting,
    handleInputChange,
    handleBusinessHoursChange,
    handleSubmit,
    onCancel,
  }
}