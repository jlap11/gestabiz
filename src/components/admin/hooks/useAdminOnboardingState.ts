import { useState } from 'react'

export type LegalEntityType = 'individual' | 'company'

export interface OnboardingFormData {
  // Basic info
  name: string
  category_id: string
  description: string
  // Legal info
  legal_entity_type: LegalEntityType
  tax_id: string
  legal_name: string
  registration_number: string
  document_type_id: string
  document_type: 'cedula' | 'nit'
  // Contact & location
  phone: string
  email: string
  address: string
  city: string
  state: string
  country: string
  country_id: string
  region_id: string
  city_id: string
  postal_code: string
}

export function useAdminOnboardingState() {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [activePage, setActivePage] = useState('overview')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [showBannerCropper, setShowBannerCropper] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([])
  const [phonePrefix, setPhonePrefix] = useState('+57')

  const [formData, setFormData] = useState<OnboardingFormData>({
    // Basic info
    name: '',
    category_id: '',
    description: '',
    // Legal info
    legal_entity_type: 'individual',
    tax_id: '',
    legal_name: '',
    registration_number: '',
    document_type_id: '',
    document_type: 'cedula',
    // Contact & location
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    country: 'Colombia',
    country_id: '01b4e9d1-a84e-41c9-8768-253209225a21',
    region_id: '',
    city_id: '',
    postal_code: '',
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value }

      // If legal entity type changes, update the document_type default
      if (field === 'legal_entity_type') {
        next.document_type = value === 'company' ? 'nit' : 'cedula'
      }

      return next
    })

    // Reset subcategories when changing main category
    if (field === 'category_id') {
      setSelectedSubcategories([])
    }
  }

  const handleBannerCropComplete = (croppedBlob: Blob) => {
    // Create preview URL
    const previewUrl = URL.createObjectURL(croppedBlob)
    setBannerPreview(previewUrl)

    // Convert Blob to File
    const croppedFile = new File([croppedBlob], bannerFile?.name || 'banner.jpg', {
      type: 'image/jpeg',
    })
    setBannerFile(croppedFile)
  }

  const isStep1Valid = formData.name.trim().length > 0 && formData.category_id.length > 0
  const isStep2Valid = true // Contact info is optional

  return {
    // State
    step,
    setStep,
    isLoading,
    setIsLoading,
    activePage,
    setActivePage,
    logoFile,
    setLogoFile,
    logoPreview,
    setLogoPreview,
    bannerFile,
    setBannerFile,
    bannerPreview,
    setBannerPreview,
    showBannerCropper,
    setShowBannerCropper,
    categoryFilter,
    setCategoryFilter,
    selectedSubcategories,
    setSelectedSubcategories,
    phonePrefix,
    setPhonePrefix,
    formData,
    setFormData,
    
    // Handlers
    handleChange,
    handleBannerCropComplete,
    
    // Validation
    isStep1Valid,
    isStep2Valid,
  }
}