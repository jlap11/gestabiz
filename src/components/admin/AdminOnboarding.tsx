import { useState, useEffect } from 'react'
import { Building2, MapPin, Phone, Mail, Info, Loader2, CheckCircle, Upload, X } from 'lucide-react'
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
import type { User, LegalEntityType, UserRole } from '@/types/types'
import { 
  CountrySelect, 
  RegionSelect, 
  CitySelect, 
  DocumentTypeSelect,
  PhonePrefixSelect 
} from '@/components/catalog'
import { getColombiaId } from '@/hooks/useCatalogs'
import { testAuthDebug } from '@/test-auth-debug'
import { testLocationInsert } from '@/test-location-debug'

interface AdminOnboardingProps {
  user: User
  onBusinessCreated?: () => void
  currentRole: UserRole
  availableRoles: UserRole[]
  onRoleChange: (role: UserRole) => void
  onLogout?: () => void
}

export function AdminOnboarding({ 
  user, 
  onBusinessCreated,
  currentRole,
  availableRoles,
  onRoleChange,
  onLogout
}: Readonly<AdminOnboardingProps>) {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('') // For filtering categories
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]) // Max 3
  const [subcategoryDescriptions, setSubcategoryDescriptions] = useState<Record<string, string>>({}) // Descriptions per subcategory
  const [phonePrefix, setPhonePrefix] = useState('+57') // Colombia default
  
  // Catalog IDs from database
  const [countryId, setCountryId] = useState<string>('') // Colombia by default
  const [regionId, setRegionId] = useState<string>('')
  const [cityId, setCityId] = useState<string>('')
  const [documentTypeId, setDocumentTypeId] = useState<string>('')
  
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
    // Contact & location
    phone: '',
    email: '',
    address: '',
    city_id: '', // UUID from cities table
    region_id: '', // UUID from regions table
    country_id: '', // UUID from countries table
    postal_code: '',
  })

  // Fetch business categories from database
  const { mainCategories, categories, isLoading: categoriesLoading } = useBusinessCategories()
  
  // Load Colombia ID on mount
  useEffect(() => {
    const loadColombiaId = async () => {
      const colombiaId = await getColombiaId();
      if (colombiaId) {
        handleChange('country_id', colombiaId);
      }
    };
    loadColombiaId();
  }, []);
  
  // Filter MAIN categories by search term (frontend filter)
  const filteredMainCategories = mainCategories.filter(cat => 
    cat.name.toLowerCase().includes(categoryFilter.toLowerCase())
  )
  
  // Get subcategories of selected main category
  const availableSubcategories = formData.category_id
    ? categories.find(c => c.id === formData.category_id)?.subcategories || []
    : []

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    
    // Reset subcategories when changing main category
    if (field === 'category_id') {
      setSelectedSubcategories([])
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    try {
      // Critical: Verify user authentication and get fresh session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[AdminOnboarding] Session error:', sessionError);
        toast.error('Error al verificar autenticación. Por favor recarga la página.');
        setIsLoading(false);
        return;
      }

      if (!sessionData?.session?.user) {
        console.error('[AdminOnboarding] No active session found');
        toast.error('No estás autenticado. Por favor inicia sesión nuevamente.');
        setIsLoading(false);
        return;
      }

      const authenticatedUserId = sessionData.session.user.id;
      
      if (!authenticatedUserId || !user?.id) {
        console.error('[AdminOnboarding] User ID missing', { authenticatedUserId, userPropId: user?.id });
        toast.error('ID de usuario no disponible. Por favor recarga la página.');
        setIsLoading(false);
        return;
      }

      if (authenticatedUserId !== user.id) {
        console.error('[AdminOnboarding] User ID mismatch', { authenticatedUserId, userPropId: user.id });
        toast.error('Error de autenticación. Por favor cierra sesión y vuelve a iniciar.');
        setIsLoading(false);
        return;
      }

      console.log('[AdminOnboarding] Authentication verified:', { userId: authenticatedUserId, email: sessionData.session.user.email });

      // Validate required fields
      if (!formData.name || !formData.category_id) {
        toast.error('Nombre y categoría son obligatorios')
        setIsLoading(false)
        return
      }

      // Validate tax_id format for Colombia
      if (formData.tax_id) {
        const taxId = formData.tax_id.trim()
        if (formData.legal_entity_type === 'company') {
          // NIT should be 9-10 digits
          if (!/^\d{9,10}$/.test(taxId)) {
            toast.error('NIT inválido. Debe tener 9-10 dígitos')
            return
          }
        } else {
          // Cédula should be 6-10 digits
          if (!/^\d{6,10}$/.test(taxId)) {
            toast.error('Cédula inválida. Debe tener 6-10 dígitos')
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
          toast.error('Error al verificar el NIT/Cédula')
          return
        }
        
        if (existingBusiness) {
          toast.error(`Este NIT/Cédula ya está registrado para el negocio "${existingBusiness.name}"`)
          return
        }
      }

      // Step 1: Create business WITHOUT logo first
      console.log('[AdminOnboarding] Creating business in Supabase...')
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: formData.name.trim(),
          category_id: formData.category_id, // FK to business_categories
          description: formData.description.trim() || null,
          legal_entity_type: formData.legal_entity_type,
          tax_id: formData.tax_id.trim() || null,
          legal_name: formData.legal_name.trim() || null,
          registration_number: formData.registration_number.trim() || null,
          logo_url: null, // Will be updated after upload
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
          city: formData.city.trim() || null,
          state: formData.state.trim() || null,
          country: formData.country,
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

      console.log('[AdminOnboarding] Business creation result:', { business, businessError })
      if (businessError) throw businessError

      toast.success(`¡Negocio "${formData.name}" creado exitosamente!`)

      // Step 2: Insert selected subcategories (máximo 3) with descriptions
      if (selectedSubcategories.length > 0 && business) {
        try {
          const subcategoryInserts = selectedSubcategories.map(subcatId => ({
            business_id: business.id,
            subcategory_id: subcatId,
            description: subcategoryDescriptions[subcatId] || null,
          }))

          const { error: subcatError } = await supabase
            .from('business_subcategories')
            .insert(subcategoryInserts)

          if (subcatError) throw subcatError

          toast.success(`${selectedSubcategories.length} subcategoría(s) asignada(s)`)
        } catch {
          // Don't fail if subcategories fail
          toast.warning('Negocio creado, pero hubo un problema al asignar subcategorías')
        }
      }

      // Step 3: Upload logo if exists (NOW user is owner, RLS will allow it)
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

          toast.success('Logo subido correctamente')
        } catch {
          // Don't fail the whole operation if logo upload fails
          toast.warning('Negocio creado, pero hubo un problema al subir el logo')
        }
      }

      // Show invitation code
      if (business) {
        toast.success(
          `Código de invitación: ${business.invitation_code}`,
          {
            duration: 10000,
            description: 'Comparte este código con tus empleados',
          }
        )
      }

      console.log('[AdminOnboarding] Business created successfully, calling onBusinessCreated callback')
      onBusinessCreated?.()
    } catch (error) {
      console.error('[AdminOnboarding] Error creating business:', error)
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(`Error al crear negocio: ${errorMsg}`)
    } finally {
      console.log('[AdminOnboarding] Setting loading to false')
      setIsLoading(false)
    }
  }

  const isStep1Valid = formData.name.trim().length > 0 && formData.category_id.length > 0
  const isStep2Valid = true // Contact info is optional

  const sidebarItems = [
    {
      id: 'create-business',
      label: 'Crear Negocio',
      icon: <Building2 className="h-5 w-5" />
    }
  ]

  return (
    <UnifiedLayout
      currentRole={currentRole}
      availableRoles={availableRoles}
      onRoleChange={onRoleChange}
      onLogout={onLogout}
      sidebarItems={sidebarItems}
      activePage="create-business"
      onPageChange={() => {}}
      user={user}
    >
      <div className="p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Crear tu Negocio</h1>
            <p className="text-muted-foreground">
              Registra tu negocio y empieza a gestionar citas en minutos
            </p>
            
            {/* DEBUG BUTTONS - TEMPORAL */}
            <div className="flex gap-2 justify-center">
              <Button
                onClick={async () => {
                  const result = await testAuthDebug();
                  if (result.success) {
                    toast.success('✅ Test exitoso - Businesses RLS OK');
                  } else {
                    toast.error(`❌ Test falló: ${JSON.stringify(result.error).substring(0, 100)}`);
                  }
                }}
                variant="outline"
                size="sm"
              >
                🔍 Test Business
              </Button>
              
              <Button
                onClick={async () => {
                  const result = await testLocationInsert();
                  if (result.success) {
                    toast.success('✅ Test exitoso - Locations RLS OK');
                  } else {
                    toast.error(`❌ Test falló: ${JSON.stringify(result.error).substring(0, 100)}`);
                  }
                }}
                variant="outline"
                size="sm"
              >
                � Test Location
              </Button>
            </div>
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
                              placeholder="Buscar categoría..."
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

                {/* Subcategories - Only show if main category selected and has subcategories */}
                {formData.category_id && availableSubcategories.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Subcategorías (máximo 3)
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Selecciona hasta 3 subcategorías que describan mejor tu negocio
                    </p>
                    <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-2 bg-background rounded-md border border-border">
                      {availableSubcategories.map((subcat) => {
                        const isSelected = selectedSubcategories.includes(subcat.id)
                        const canSelect = selectedSubcategories.length < 3 || isSelected
                        
                        return (
                          <button
                            key={subcat.id}
                            type="button"
                            disabled={!canSelect}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedSubcategories(prev => prev.filter(id => id !== subcat.id))
                              } else if (selectedSubcategories.length < 3) {
                                setSelectedSubcategories(prev => [...prev, subcat.id])
                              }
                            }}
                            className={`p-2 rounded-md text-sm text-left transition-colors ${
                              isSelected
                                ? 'bg-primary/20 border-2 border-primary text-foreground'
                                : canSelect
                                ? 'bg-card border border-border text-foreground/90 hover:border-primary/50'
                                : 'bg-card border border-border/50 text-muted-foreground cursor-not-allowed'
                            }`}
                          >
                            {subcat.name}
                          </button>
                        )
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selectedSubcategories.length}/3 subcategorías seleccionadas
                    </p>
                    
                    {/* Subcategory Descriptions */}
                    {selectedSubcategories.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <p className="text-sm font-medium text-foreground">
                          Descripción por Subcategoría
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Describe brevemente los servicios específicos de cada subcategoría
                        </p>
                        {selectedSubcategories.map((subcatId) => {
                          const subcat = availableSubcategories.find(s => s.id === subcatId)
                          if (!subcat) return null
                          
                          return (
                            <div key={subcatId} className="space-y-1">
                              <label className="text-xs font-medium text-foreground/90">
                                {subcat.name}
                              </label>
                              <Textarea
                                value={subcategoryDescriptions[subcatId] || ''}
                                onChange={(e) => setSubcategoryDescriptions(prev => ({
                                  ...prev,
                                  [subcatId]: e.target.value
                                }))}
                                placeholder={`Ej: Servicios específicos de ${subcat.name}...`}
                                className="bg-background border-border text-foreground/90 min-h-[80px]"
                              />
                            </div>
                          )
                        })}
                      </div>
                    )}
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
              </CardContent>
            </Card>

            {/* Legal Information Card */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Mail className="h-5 w-5 text-primary" />
                  Información legal
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Datos legales para Colombia (opcional pero recomendado)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Legal Entity Type */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Tipo de entidad</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleChange('legal_entity_type', 'company')}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        formData.legal_entity_type === 'company'
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-foreground">Empresa</div>
                      <div className="text-xs text-muted-foreground mt-1">Negocio registrado con NIT</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('legal_entity_type', 'individual')}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        formData.legal_entity_type === 'individual'
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-foreground">Independiente</div>
                      <div className="text-xs text-muted-foreground mt-1">Persona natural con cédula</div>
                    </button>
                  </div>
                </div>

                {/* Document Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Tipo de documento
                  </label>
                  <DocumentTypeSelect
                    countryId={formData.country_id}
                    value={documentTypeId}
                    onChange={(value) => {
                      setDocumentTypeId(value);
                      handleChange('document_type_id', value);
                    }}
                    forCompany={formData.legal_entity_type === 'company'}
                    required
                    className="bg-background border-border"
                  />
                </div>

                {/* Tax ID / Document Number */}
                <div className="space-y-2">
                  <label htmlFor="tax_id" className="text-sm font-medium text-foreground">
                    Número de documento
                  </label>
                  <Input
                    id="tax_id"
                    value={formData.tax_id}
                    onChange={(e) => handleChange('tax_id', e.target.value.replace(/\D/g, ''))}
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
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => document.getElementById('logo-input')?.click()}
                    >
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-foreground/90 mb-2">
                        Click para seleccionar o arrastra una imagen
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, WEBP (máx. 2MB)
                      </p>
                      <Input
                        id="logo-input"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            // Validate file size (2MB max)
                            if (file.size > 2 * 1024 * 1024) {
                              toast.error('El archivo es muy grande. Máximo 2MB')
                              return
                            }
                            setLogoFile(file)
                            // Create preview URL
                            const reader = new FileReader()
                            reader.onload = (event) => {
                              setLogoPreview(event.target?.result as string)
                            }
                            reader.readAsDataURL(file)
                          }
                        }}
                      />
                    </div>
                  )}
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
                    onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, ''))}
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

              {/* Country (Disabled) */}
              <div className="space-y-2">
                <label className="text-sm font-medium">País</label>
                <CountrySelect
                  value={formData.country_id}
                  onChange={(value) => {
                    handleChange('country_id', value);
                    // Reset region and city when country changes
                    setRegionId('');
                    setCityId('');
                    handleChange('region_id', '');
                    handleChange('city_id', '');
                  }}
                  disabled
                  defaultToColombia
                  className="bg-background border-border"
                />
              </div>

              {/* Region/Department */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Departamento</label>
                <RegionSelect
                  countryId={formData.country_id}
                  value={regionId}
                  onChange={(value) => {
                    setRegionId(value);
                    handleChange('region_id', value);
                    // Reset city when region changes
                    setCityId('');
                    handleChange('city_id', '');
                  }}
                  className="bg-background border-border"
                />
              </div>

              {/* City */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Ciudad</label>
                <CitySelect
                  regionId={regionId}
                  value={cityId}
                  onChange={(value) => {
                    setCityId(value);
                    handleChange('city_id', value);
                  }}
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
    </UnifiedLayout>
  )
}
