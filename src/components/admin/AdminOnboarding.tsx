import { useState } from 'react'
import { Building2, MapPin, Phone, Mail, Info, Loader2, CheckCircle, Upload, X, LayoutDashboard, Briefcase, Users, BriefcaseBusiness, Calculator, FileText, CreditCard, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useBusinessCategories } from '@/hooks/useBusinessCategories'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { UnifiedLayout } from '@/components/layouts/UnifiedLayout'
import { useLanguage } from '@/contexts/LanguageContext'
import type { User, LegalEntityType, UserRole, Business } from '@/types/types'
import { PhonePrefixSelect, RegionSelect, CitySelect } from '@/components/catalog'
import { DocumentTypeSelect } from '@/components/catalog/DocumentTypeSelect'
import { BannerCropper } from '@/components/settings/BannerCropper'
import { slugify } from '@/lib/utils'
import { compressImageForLogo, compressImageForBanner } from '@/lib/imageCompression'

interface AdminOnboardingProps {
  user: User
  onBusinessCreated?: () => void
  currentRole: UserRole
  availableRoles: UserRole[]
  onRoleChange: (role: UserRole) => void
  onLogout?: () => void
  businesses?: Business[]
  onSelectBusiness?: (businessId: string) => void
  onNavigateToAdmin?: () => void // Navigate back to admin dashboard when clicking non-onboarding pages
}

export function AdminOnboarding({ 
  user, 
  onBusinessCreated,
  currentRole,
  availableRoles,
  onRoleChange,
  onLogout,
  businesses = [],
  onSelectBusiness,
  onNavigateToAdmin
}: Readonly<AdminOnboardingProps>) {
  const { t } = useLanguage();
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [activePage, setActivePage] = useState('overview') // Track active page for sidebar
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [showBannerCropper, setShowBannerCropper] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('') // For filtering categories
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]) // Max 3 free-text subcategories
  const [phonePrefix, setPhonePrefix] = useState('+57') // Colombia default
  
  // Form data
  const [formData, setFormData] = useState({
    // Basic info
    name: '',
    category_id: '', // Changed from category to category_id
    description: '',
    // Legal info
    legal_entity_type: 'individual' as LegalEntityType,
    tax_id: '',
    legal_name: '',
    registration_number: '',
    document_type_id: '', // UUID from document_types table
  document_type: 'cedula', // simple local field for UI ('cedula'|'nit')
    // Contact & location
    phone: '',
    email: '',
    address: '',
    city: '', // Text field for city name (for display)
    state: '', // Text field for state/department (for display)
    country: 'Colombia', // Default to Colombia
    country_id: '01b4e9d1-a84e-41c9-8768-253209225a21', // Colombia UUID
    region_id: '', // UUID from regions table (departamento)
    city_id: '', // UUID from cities table
    postal_code: '',
  })

  // Fetch business categories from database
  const { mainCategories, categories, isLoading: categoriesLoading } = useBusinessCategories()
  
  // Filter MAIN categories by search term (frontend filter)
  // Also sort alphabetically (case-insensitive, locale 'es') for consistent dropdown order
  const normalizeName = (s: string) =>
    s
      .normalize('NFD')
      // Remove combining diacritical marks (safe range)
      .replaceAll(/[\u0300-\u036f]/g, '')
      .toLowerCase()

  const filteredMainCategories = mainCategories
    .slice() // create a copy to avoid mutating original
    .filter(cat => normalizeName(cat.name).includes(categoryFilter.toLowerCase()))
    .sort((a, b) => {
      const na = normalizeName(a.name)
      const nb = normalizeName(b.name)

      // Force 'otros servicios' to the end
      if (na === 'otros servicios' && nb !== 'otros servicios') return 1
      if (nb === 'otros servicios' && na !== 'otros servicios') return -1

      return na.localeCompare(nb, 'es', { sensitivity: 'base' })
    }) 

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => {
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

  // Handle banner crop completion
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

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      // Critical: Verify user authentication and get fresh session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        // Session error: sessionData retrieval failed
        // console.error('[AdminOnboarding] Session error:', sessionError);
        toast.error(t('admin.adminOnboarding.authError'));
        setIsLoading(false);
        return;
      }

      if (!sessionData?.session?.user) {
        // No active session found
        // console.error('[AdminOnboarding] No active session found');
        toast.error(t('admin.adminOnboarding.notAuthenticated'));
        setIsLoading(false);
        return;
      }

      const authenticatedUserId = sessionData.session.user.id;
      
      if (!authenticatedUserId || !user?.id) {
        // Missing user ID
        // console.error('[AdminOnboarding] User ID missing', { authenticatedUserId, userPropId: user?.id });
        toast.error(t('admin.adminOnboarding.userIdError'));
        setIsLoading(false);
        return;
      }

      if (authenticatedUserId !== user.id) {
        // User ID mismatch
        // console.error('[AdminOnboarding] User ID mismatch', { authenticatedUserId, userPropId: user.id });
        toast.error(t('admin.adminOnboarding.authCheckError'));
        setIsLoading(false);
        return;
      }

      // Validate required fields
      if (!formData.name || !formData.category_id) {
        toast.error(t('admin.adminOnboarding.nameRequired'))
        setIsLoading(false)
        return
      }

      // Validate tax_id format for Colombia
      if (formData.tax_id) {
        const taxId = formData.tax_id.trim()
        if (formData.legal_entity_type === 'company') {
          // NIT should be 9-10 digits
          if (!/^\d{9,10}$/.test(taxId)) {
            toast.error(t('admin.adminOnboarding.nitInvalid'))
            return
          }
        } else {
          // Cédula should be 6-10 digits
          if (!/^\d{6,10}$/.test(taxId)) {
            toast.error(t('admin.adminOnboarding.cedInvalid'))
            return
          }
        }
        
        // Check if tax_id already exists
        const { data: existingBusiness, error: checkError } = await supabase
          .from('businesses')
          .select('id, name')
          .eq('tax_id', taxId)
          .maybeSingle()
        
        if (checkError) {
          toast.error(t('admin.adminOnboarding.nitVerifyError'))
          return
        }
        
        if (existingBusiness) {
          toast.error(`Este NIT/Cédula ya está registrado para el negocio "${existingBusiness.name}"`)
          return
        }
      }

      // Step 1: Create business with optional logo and banner
  // Creating business in Supabase...
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: formData.name.trim(),
          slug: slugify(formData.name.trim()), // Generate slug from business name
          category_id: formData.category_id, // FK to business_categories
          description: formData.description.trim() || null,
          legal_entity_type: formData.legal_entity_type,
          tax_id: formData.tax_id.trim() || null,
          legal_name: formData.legal_name.trim() || null,
          registration_number: formData.registration_number.trim() || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
          city_id: formData.city_id || null, // UUID from cities table
          region_id: formData.region_id || null, // UUID from regions table
          country_id: formData.country_id, // UUID for Colombia
          postal_code: formData.postal_code.trim() || null,
          owner_id: user.id,
          business_hours: {
            monday: { open: '09:00', close: '18:00', closed: false },
            tuesday: { open: '09:00', close: '18:00', closed: false },
            wednesday: { open: '09:00', close: '18:00', closed: false },
            thursday: { open: '09:00', close: '18:00', closed: false },
            friday: { open: '09:00', close: '18:00', closed: false },
            saturday: { open: '09:00', close: '14:00', closed: false },
            sunday: { open: '00:00', close: '00:00', closed: true },
          },
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
        })
        .select()
        .single()

  // Business creation result: logged for debugging
      if (businessError) throw businessError

  toast.success(t('common.messages.createSuccess'))

      // Step 2: Upload logo if exists (owner is automatically registered by trigger, RLS will allow it)
      if (logoFile && business) {
        try {
          // Upload to business-logos/{business.id}/logo.ext
          const fileExt = logoFile.name.split('.').pop()
          const fileName = `logo.${fileExt}`
          const filePath = `${business.id}/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('business-logos')
            .upload(filePath, logoFile, {
              upsert: true,
              contentType: logoFile.type,
            })

          if (uploadError) throw uploadError

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('business-logos')
            .getPublicUrl(filePath)

          // Update business with logo URL
          const { error: updateError } = await supabase
            .from('businesses')
            .update({ logo_url: urlData.publicUrl })
            .eq('id', business.id)

          if (updateError) throw updateError

          toast.success(t('common.messages.saveSuccess'))
        } catch {
          // Don't fail the whole operation if logo upload fails
          toast.warning(t('common.messages.tryAgain'))
        }
      }

      // Step 5: Upload banner if exists
      if (bannerFile && business) {
        try {
          // Upload to business-logos/{business.id}/banner.ext
          const fileExt = bannerFile.name.split('.').pop()
          const fileName = `banner.${fileExt}`
          const filePath = `${business.id}/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('business-logos')
            .upload(filePath, bannerFile, {
              upsert: true,
              contentType: bannerFile.type,
            })

          if (uploadError) throw uploadError

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('business-logos')
            .getPublicUrl(filePath)

          // Update business with banner URL
          const { error: updateError } = await supabase
            .from('businesses')
            .update({ banner_url: urlData.publicUrl })
            .eq('id', business.id)

          if (updateError) throw updateError

          toast.success(t('common.messages.saveSuccess'))
        } catch {
          // Don't fail the whole operation if banner upload fails
          toast.warning(t('common.messages.tryAgain'))
        }
      }

      // Show invitation code
      if (business) {
        toast.success(t('common.messages.createSuccess'))
      }

      // Business created successfully, calling onBusinessCreated callback
      onBusinessCreated?.()
    } catch (error) {
      // Error creating business: logged for debugging
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(`Error al crear negocio: ${errorMsg}`)
    } finally {
      // Setting loading to false
      setIsLoading(false)
    }
  }

  const isStep1Valid = formData.name.trim().length > 0 && formData.category_id.length > 0
  const isStep2Valid = true // Contact info is optional

  // Use existing business if available, otherwise create placeholder
  const currentBusiness = businesses && businesses.length > 0 
    ? businesses[0] 
    : {
        id: 'new-business',
        name: 'Crear tu Negocio',
        description: 'Nuevo negocio en creación',
        owner_id: user?.id || '',
        category: {
          id: 'placeholder',
          name: 'Sin categoría',
          slug: '',
          is_active: true,
          sort_order: 0
        },
        phone: null,
        email: null,
        address: null,
        city: null,
        state: null,
        country: null,
        postal_code: null,
        latitude: undefined,
        longitude: undefined,
        logo_url: null,
        website: null,
        business_hours: {},
        timezone: undefined,
        settings: {},
        category_id: undefined,
        legal_entity_type: undefined,
        tax_id: null,
        legal_name: null,
        registration_number: null,
        slug: null,
        meta_title: null,
        meta_description: null,
        meta_keywords: undefined,
        og_image_url: null,
        is_public: undefined,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
  } as unknown as Business

  const sidebarItems = [
    {
      id: 'overview',
      label: 'Resumen',
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      id: 'locations',
      label: 'Sedes',
      icon: <MapPin className="h-5 w-5" />
    },
    {
      id: 'services',
      label: 'Servicios',
      icon: <Briefcase className="h-5 w-5" />
    },
    {
      id: 'employees',
      label: 'Empleados',
      icon: <Users className="h-5 w-5" />
    },
    {
      id: 'recruitment',
      label: 'Reclutamiento',
      icon: <BriefcaseBusiness className="h-5 w-5" />
    },
    {
      id: 'accounting',
      label: 'Contabilidad',
      icon: <Calculator className="h-5 w-5" />
    },
    {
      id: 'reports',
      label: 'Reportes',
      icon: <FileText className="h-5 w-5" />
    },
    {
      id: 'billing',
      label: 'Facturación',
      icon: <CreditCard className="h-5 w-5" />
    },
    {
      id: 'permissions',
      label: 'Permisos',
      icon: <Shield className="h-5 w-5" />
    }
  ]

  // Handler for page changes - navigate to admin if clicking non-onboarding pages
  const handlePageChange = (pageId: string) => {
    // Only allow 'overview' and 'create-business' pages in onboarding
    // For any other page, navigate back to full admin dashboard
    if (pageId !== 'overview' && pageId !== 'create-business') {
      // Navigate to admin dashboard instead
      if (onNavigateToAdmin) {
        onNavigateToAdmin()
      }
      return
    }
    setActivePage(pageId)
  }

  return (
    <UnifiedLayout
      business={currentBusiness}
      businesses={businesses}
      currentRole={currentRole}
      availableRoles={availableRoles}
      onRoleChange={onRoleChange}
      onLogout={onLogout}
      sidebarItems={sidebarItems}
      activePage={activePage}
      onPageChange={handlePageChange}
      user={user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar_url,
      } : undefined}
    >
      <div className="p-6">
        {/* Show create business form on 'create-business' page, overview on 'overview' */}
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('admin.actions.createBusiness')}</h1>
            <p className="text-muted-foreground">
              Registra tu negocio y empieza a gestionar citas en minutos
            </p>
            
            
          </div>

        {/* Important Rules Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Reglas de inactividad</AlertTitle>
          <AlertDescription className="text-xs space-y-1">
            <p>• Si tu negocio permanece <strong>30 días sin actividad</strong>, se desactivará automáticamente.</p>
            <p>
              • Si nunca tuviste clientes y pasó <strong>1 año sin actividad</strong>, el negocio se eliminará
              permanentemente.
            </p>
            <p className="text-muted-foreground mt-2">
              La actividad incluye: citas programadas, servicios registrados, empleados activos, etc.
            </p>
          </AlertDescription>
        </Alert>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2">
          <div className={`h-2 w-24 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-border'}`} />
          <div className={`h-2 w-24 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-border'}`} />
          <div className={`h-2 w-24 rounded-full ${step >= 3 ? 'bg-primary' : 'bg-border'}`} />
        </div>

        {/* Step 1: Basic Info + Legal Info + Logo */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Basic Information Card */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Building2 className="h-5 w-5 text-primary" />
                  Información básica
                </CardTitle>
                <CardDescription className="text-muted-foreground">Datos principales de tu negocio</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Business Name */}
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-foreground">
                    Nombre del negocio <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Ej: Salón de Belleza María"
                    className="bg-background border-border"
                  />
                </div>

                  <input
                    id="logo-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        try {
                          // Mostrar que estamos comprimiendo
                          toast.loading('Comprimiendo imagen...')
                          
                          // Comprimir imagen
                          const compressedBlob = await compressImageForLogo(file)
                          
                          // Convertir blob a File
                          const compressedFile = new File(
                            [compressedBlob],
                            file.name,
                            { type: 'image/jpeg' }
                          )
                          
                          // Descartar el toast de carga
                          toast.dismiss()
                          
                          setLogoFile(compressedFile)
                          setLogoPreview(URL.createObjectURL(compressedBlob))
                          toast.success(`Logo comprimido exitosamente`)
                        } catch (error) {
                          toast.dismiss()
                          const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
                          toast.error(`Error al comprimir imagen: ${errorMsg}`)
                        }
                      }
                    }}
                  />

                {/* Category - Main Category with Filter */}
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium text-foreground">
                    Categoría Principal <span className="text-red-500">*</span>
                  </label>
                  {categoriesLoading ? (
                    <div className="flex items-center justify-center py-3 bg-background rounded-md border border-border">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-muted-foreground">Cargando categorías...</span>
                    </div>
                  ) : (
                    <>
                      {/* Category Selector */}
                      <Select 
                        value={formData.category_id} 
                        onValueChange={(value) => {
                          handleChange('category_id', value)
                          setSelectedSubcategories([]) // Reset subcategories when main category changes
                        }}
                      >
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Selecciona una categoría principal" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {/* Search/Filter Input inside dropdown */}
                          <div className="px-2 pt-2 pb-1 sticky top-0 bg-background border-b border-border z-10">
                            <Input
                              type="text"
                              placeholder={t('admin.actions.searchCategory')}
                              value={categoryFilter}
                              onChange={(e) => setCategoryFilter(e.target.value)}
                              className="bg-card border-border h-8 text-sm"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => e.stopPropagation()}
                            />
                          </div>
                          
                          {filteredMainCategories.length > 0 ? (
                            filteredMainCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                              No se encontraron categorías
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </>
                  )}
                  {mainCategories.length === 0 && !categoriesLoading && (
                    <p className="text-sm text-red-400">No hay categorías disponibles</p>
                  )}
                </div>

                {/* Subcategories - Free text input (max 3) */}
                {formData.category_id && (
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-foreground">
                      Subcategorías (máximo 3)
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Escribe hasta 3 subcategorías que describan mejor tu negocio
                    </p>
                    
                    {/* 3 Input fields for free-form subcategories */}
                    <div className="space-y-2">
                      {[0, 1, 2].map((index) => (
                        <div key={index} className="space-y-1">
                          <label htmlFor={`subcategory-${index}`} className="text-xs font-medium text-foreground/80">
                            Subcategoría {index + 1}
                          </label>
                          <Input
                            id={`subcategory-${index}`}
                            value={selectedSubcategories[index] || ''}
                            onChange={(e) => {
                              const newSubcategories = [...selectedSubcategories]
                              if (e.target.value.trim()) {
                                newSubcategories[index] = e.target.value
                              } else {
                                newSubcategories[index] = ''
                              }
                              setSelectedSubcategories(newSubcategories.filter(s => s !== ''))
                            }}
                            placeholder={`Ej: ${['Boliche', 'Billar', 'Arcade'][index]}`}
                            className="bg-background border-border text-foreground"
                            maxLength={50}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selectedSubcategories.length}/3 subcategorías ingresadas
                    </p>
                  </div>
                )}

                {/* General Description */}
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium text-foreground">
                    Descripción General del Negocio *
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Describe brevemente los servicios generales que ofrece tu negocio
                  </p>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Describe tu negocio..."
                    rows={3}
                    className="bg-background border-border"
                  />
                </div>

                {/* Banner Upload (moved) - placeholder, will be rendered after Logo Upload */}
              </CardContent>
            </Card>

            {/* Legal Information Card */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <FileText className="h-5 w-5 text-primary" />
                  Información de constitución legal de la empresa
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Datos legales para Colombia (opcional pero recomendado). Diferente a la información de las sedes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Legal Entity Type */}
                <fieldset className="space-y-3">
                  <legend className="text-sm font-medium text-foreground">Tipo de entidad</legend>
                  <div className="grid grid-cols-2 gap-4">
                    <label
                      className={`p-4 rounded-lg border-2 text-left transition-colors cursor-pointer flex flex-col ${formData.legal_entity_type === 'company' ? 'border-primary bg-primary/5' : 'border-border'}`}
                      htmlFor="entity-company"
                    >
                      <input
                        id="entity-company"
                        type="radio"
                        name="legal_entity_type"
                        value="company"
                        checked={formData.legal_entity_type === 'company'}
                        onChange={() => handleChange('legal_entity_type', 'company')}
                        className="sr-only"
                      />
                      <div className="font-medium text-foreground">Empresa</div>
                      <div className="text-xs text-muted-foreground mt-1">Negocio registrado con NIT</div>
                    </label>

                    <label
                      className={`p-4 rounded-lg border-2 text-left transition-colors cursor-pointer flex flex-col ${formData.legal_entity_type === 'individual' ? 'border-primary bg-primary/5' : 'border-border'}`}
                      htmlFor="entity-individual"
                    >
                      <input
                        id="entity-individual"
                        type="radio"
                        name="legal_entity_type"
                        value="individual"
                        checked={formData.legal_entity_type === 'individual'}
                        onChange={() => handleChange('legal_entity_type', 'individual')}
                        className="sr-only"
                      />
                      <div className="font-medium text-foreground">Independiente</div>
                      <div className="text-xs text-muted-foreground mt-1">Persona natural con cédula</div>
                    </label>
                  </div>
                </fieldset>

                {/* Document Type - Simple Text (removed complex selector) */}
                <div className="space-y-2">
                  <label htmlFor="doc-type" className="text-sm font-medium text-foreground">
                    Tipo de documento
                  </label>
                  {formData.legal_entity_type === 'company' ? (
                    <Input
                      id="doc-type"
                      value={/* Visual only */ 'NIT'}
                      disabled
                      className="bg-background border-border"
                    />
                  ) : (
                    <DocumentTypeSelect
                      countryId={formData.country === 'Colombia' ? '01b4e9d1-a84e-41c9-8768-253209225a21' : formData.country}
                      value={formData.document_type_id}
                      onChange={(val) => handleChange('document_type_id', val)}
                      forCompany={false}
                      className="bg-background border-border"
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formData.legal_entity_type === 'company'
                      ? 'Tipo de documento fijado para empresas'
                      : 'Selecciona el tipo de documento apropiado para tu negocio'}
                  </p>
                </div>

                {/* Tax ID / Document Number */}
                <div className="space-y-2">
                  <label htmlFor="tax_id" className="text-sm font-medium text-foreground">
                    Número de documento
                  </label>
                  <Input
                    id="tax_id"
                    value={formData.tax_id}
                    onChange={(e) => handleChange('tax_id', e.target.value.replaceAll(/\D/g, ''))}
                    placeholder={
                      formData.legal_entity_type === 'company'
                        ? 'Ej: 900123456'
                        : 'Ej: 1234567890'
                    }
                    className="bg-background border-border"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.legal_entity_type === 'company'
                      ? 'Número de Identificación Tributaria (9-10 dígitos)'
                      : 'Número de documento de identidad (6-10 dígitos)'}
                  </p>
                </div>

                {/* Legal Name */}
                <div className="space-y-2">
                  <label htmlFor="legal_name" className="text-sm font-medium text-foreground">
                    {formData.legal_entity_type === 'company' ? 'Razón Social' : 'Nombre Completo'}
                  </label>
                  <Input
                    id="legal_name"
                    value={formData.legal_name}
                    onChange={(e) => handleChange('legal_name', e.target.value)}
                    placeholder={
                      formData.legal_entity_type === 'company'
                        ? 'Ej: Salón de Belleza María S.A.S.'
                        : 'Ej: María Pérez González'
                    }
                    className="bg-background border-border"
                  />
                </div>

                {/* Registration Number (only for companies) */}
                {formData.legal_entity_type === 'company' && (
                  <div className="space-y-2">
                    <label htmlFor="registration_number" className="text-sm font-medium text-foreground">
                      Registro Mercantil (opcional)
                    </label>
                    <Input
                      id="registration_number"
                      value={formData.registration_number}
                      onChange={(e) => handleChange('registration_number', e.target.value)}
                      placeholder="Número de registro en Cámara de Comercio"
                      className="bg-background border-border"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Logo Upload Card */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Building2 className="h-5 w-5 text-primary" />
                  Logo del negocio
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Sube el logo de tu negocio (opcional, se subirá al crear el negocio)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {logoPreview ? (
                    <div className="space-y-4">
                      <div className="relative w-48 h-48 mx-auto">
                        <img
                          src={logoPreview}
                          alt="Preview logo"
                          className="w-full h-full object-cover rounded-lg border-2 border-violet-500/20"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-8 w-8"
                          onClick={() => {
                            setLogoFile(null)
                            setLogoPreview(null)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setLogoFile(null)
                          setLogoPreview(null)
                        }}
                        className="w-full"
                      >
                        Cambiar imagen
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => document.getElementById('logo-input')?.click()}
                    >
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-foreground/90 mb-2">Click para seleccionar o arrastra una imagen</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (máx. 2MB)</p>
                      </div>
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Banner Upload */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Building2 className="h-5 w-5 text-primary" />
                  Banner del negocio
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Sube un banner panorámico para tu negocio (opcional, se subirá al crear el negocio)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bannerPreview ? (
                    <div className="space-y-4">
                      <div className="relative w-full bg-muted rounded-lg border-2 border-violet-500/20 overflow-hidden">
                        <div className="aspect-video flex items-center justify-center bg-muted">
                          <img
                            src={bannerPreview}
                            alt="Preview banner"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={() => {
                            setBannerFile(null)
                            setBannerPreview(null)
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setBannerFile(null)
                          setBannerPreview(null)
                        }}
                        className="w-full"
                      >
                        Cambiar imagen
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => document.getElementById('banner-input')?.click()}
                    >
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm text-foreground/90 mb-2">Click para seleccionar o arrastra una imagen</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (máx. 2MB) - Aspecto 16:9</p>
                      </div>
                    </button>
                  )}

                  <input
                    id="banner-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        try {
                          // Mostrar que estamos comprimiendo
                          toast.loading('Comprimiendo banner...')
                          
                          // Comprimir imagen para banner
                          const compressedBlob = await compressImageForBanner(file)
                          
                          // Convertir blob a File
                          const compressedFile = new File(
                            [compressedBlob],
                            file.name,
                            { type: 'image/jpeg' }
                          )
                          
                          // Descartar el toast de carga
                          toast.dismiss()
                          
                          setBannerFile(compressedFile)
                          setShowBannerCropper(true)
                          toast.success('Banner comprimido exitosamente')
                        } catch (error) {
                          toast.dismiss()
                          const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
                          toast.error(`Error al comprimir banner: ${errorMsg}`)
                        }
                      }
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Button onClick={() => setStep(2)} className="w-full" size="lg" disabled={!isStep1Valid}>
              Continuar
            </Button>
          </div>
        )}

        {/* Step 2: Contact & Location */}
        {step === 2 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <MapPin className="h-5 w-5 text-primary" />
                Contacto y ubicación
              </CardTitle>
              <CardDescription className="text-muted-foreground">Información de contacto (opcional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Phone with Prefix */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Teléfono
                </label>
                <div className="flex gap-2">
                  <PhonePrefixSelect
                    value={phonePrefix}
                    onChange={setPhonePrefix}
                    className="w-32 bg-background border-border"
                    defaultToColombia
                  />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value.replaceAll(/\D/g, ''))}
                    placeholder="Número de teléfono"
                    className="flex-1 bg-background border-border"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="contacto@tuempresa.com"
                  className="bg-background border-border"
                />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium">
                  Dirección
                </label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Calle, número, colonia"
                  className="bg-background border-border"
                />
              </div>

              {/* Country */}
              <div className="space-y-2">
                <label htmlFor="country" className="text-sm font-medium">País</label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  placeholder="Colombia"
                  disabled
                  className="bg-background border-border"
                />
              </div>

              {/* State/Department */}
              <div className="space-y-2">
                <label htmlFor="state" className="text-sm font-medium">Departamento</label>
                <RegionSelect
                  countryId={formData.country_id}
                  value={formData.region_id}
                  onChange={(value) => {
                    handleChange('region_id', value)
                    // Reset city when department changes
                    handleChange('city_id', '')
                  }}
                  placeholder="Seleccione un departamento"
                  className="bg-background border-border"
                />
              </div>

              {/* City */}
              <div className="space-y-2">
                <label htmlFor="city" className="text-sm font-medium">Ciudad</label>
                <CitySelect
                  regionId={formData.region_id}
                  value={formData.city_id}
                  onChange={(value) => handleChange('city_id', value)}
                  placeholder="Seleccione una ciudad"
                  className="bg-background border-border"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1" size="lg">
                  Atrás
                </Button>
                <Button onClick={() => setStep(3)} className="flex-1" size="lg" disabled={!isStep2Valid}>
                  Continuar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review & Create */}
        {step === 3 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <CheckCircle className="h-5 w-5 text-primary" />
                Revisar y crear
              </CardTitle>
              <CardDescription className="text-muted-foreground">Verifica que todo esté correcto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Review */}
              <div className="space-y-3 p-4 rounded-lg bg-background border border-border">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">{formData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Categoría</p>
                  <p className="font-medium">
                    {categories.find(c => c.id === formData.category_id)?.name || 'No seleccionada'}
                  </p>
                </div>
                {formData.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Descripción</p>
                    <p className="text-sm">{formData.description}</p>
                  </div>
                )}
                {formData.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium">{formData.phone}</p>
                  </div>
                )}
                {formData.address && (
                  <div>
                    <p className="text-sm text-muted-foreground">Dirección</p>
                    <p className="text-sm">
                      {formData.address}
                      {formData.city && `, ${formData.city}`}
                      {formData.state && `, ${formData.state}`}
                    </p>
                  </div>
                )}
              </div>

              {/* Default Settings Info */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Configuración predeterminada</AlertTitle>
                <AlertDescription className="text-xs space-y-1">
                  <p>• Horario: Lunes a Viernes 9:00-18:00, Sábado 9:00-14:00</p>
                  <p>• Buffer entre citas: 15 minutos</p>
                  <p>• Reservas con 30 días de anticipación</p>
                  <p className="text-muted-foreground mt-2">Podrás personalizar estos valores después</p>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button onClick={() => setStep(2)} variant="outline" className="flex-1" size="lg" disabled={isLoading}>
                  Atrás
                </Button>
                <Button onClick={handleSubmit} className="flex-1" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    'Crear negocio'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

          {/* Info Footer */}
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">¿Qué sigue?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Recibirás un código de invitación único para compartir con empleados</li>
                  <li>Podrás configurar sedes, servicios y horarios</li>
                  <li>Invita a empleados escaneando tu código QR</li>
                  <li>Empieza a recibir y gestionar citas</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Banner Cropper Modal */}
      <BannerCropper
        isOpen={showBannerCropper}
        onClose={() => setShowBannerCropper(false)}
        imageFile={bannerFile}
        onCropComplete={handleBannerCropComplete}
      />
    </UnifiedLayout>
  )
}
