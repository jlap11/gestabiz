import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  OnboardingHeader,
  InactivityRulesAlert,
  ProgressIndicator,
  BasicInfoForm,
  CategorySelector,
  SubcategoriesInput,
  LogoUpload,
  BannerUpload,
  LegalInfoForm,
  ContactInfoForm,
  ReviewAndCreateForm,
  OnboardingFooter,
} from '.'
import type { OnboardingFormData } from '../hooks/useAdminOnboardingState'
import type { BusinessCategory } from '@/types/types'

interface OnboardingContentProps {
  step: number
  setStep: (step: number) => void
  formData: OnboardingFormData
  handleChange: (field: string, value: string) => void
  categoryFilter: string
  setCategoryFilter: (filter: string) => void
  categories: BusinessCategory[]
  categoriesLoading: boolean
  filteredMainCategories: BusinessCategory[]
  selectedSubcategories: string[]
  setSelectedSubcategories: (subcategories: string[]) => void
  logoFile: File | null
  logoPreview: string | null
  setLogoFile: (file: File | null) => void
  setLogoPreview: (preview: string | null) => void
  bannerFile: File | null
  bannerPreview: string | null
  setBannerFile: (file: File | null) => void
  setBannerPreview: (preview: string | null) => void
  setShowBannerCropper: (show: boolean) => void
  phonePrefix: string
  setPhonePrefix: (prefix: string) => void
  isStep1Valid: boolean
  isStep2Valid: boolean
  isLoading: boolean
  onSubmit: () => void
}

export function OnboardingContent({
  step,
  setStep,
  formData,
  handleChange,
  categoryFilter,
  setCategoryFilter,
  categories,
  categoriesLoading,
  filteredMainCategories,
  selectedSubcategories,
  setSelectedSubcategories,
  logoFile,
  logoPreview,
  setLogoFile,
  setLogoPreview,
  bannerFile,
  bannerPreview,
  setBannerFile,
  setBannerPreview,
  setShowBannerCropper,
  phonePrefix,
  setPhonePrefix,
  isStep1Valid,
  isStep2Valid,
  isLoading,
  onSubmit,
}: OnboardingContentProps) {
  const { t } = useLanguage()

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
        <OnboardingHeader
          title={t('admin.actions.createBusiness')}
          subtitle="Registra tu negocio y empieza a gestionar citas en minutos"
        />

        <InactivityRulesAlert />

        <ProgressIndicator currentStep={step} totalSteps={3} />

        {/* Step 1: Basic Info + Legal Info + Logo */}
        {step === 1 && (
          <div className="space-y-4 sm:space-y-6">
            <BasicInfoForm
              name={formData.name}
              description={formData.description}
              onNameChange={value => handleChange('name', value)}
              onDescriptionChange={value => handleChange('description', value)}
            />

            <CategorySelector
              categoryId={formData.category_id}
              categoryFilter={categoryFilter}
              categories={categories}
              categoriesLoading={categoriesLoading}
              filteredMainCategories={filteredMainCategories}
              onCategoryChange={value => {
                handleChange('category_id', value)
                setSelectedSubcategories([]) // Reset subcategories when main category changes
              }}
              onCategoryFilterChange={setCategoryFilter}
            />

            {formData.category_id && (
              <SubcategoriesInput
                selectedSubcategories={selectedSubcategories}
                onChange={setSelectedSubcategories}
                categoryId={formData.category_id}
              />
            )}

            <LegalInfoForm
              legalEntityType={formData.legal_entity_type}
              documentTypeId={formData.document_type_id}
              taxId={formData.tax_id}
              legalName={formData.legal_name}
              registrationNumber={formData.registration_number}
              country={formData.country}
              onLegalEntityTypeChange={value => handleChange('legal_entity_type', value)}
              onDocumentTypeChange={value => handleChange('document_type_id', value)}
              onTaxIdChange={value => handleChange('tax_id', value)}
              onLegalNameChange={value => handleChange('legal_name', value)}
              onRegistrationNumberChange={value => handleChange('registration_number', value)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <LogoUpload
                logoFile={logoFile}
                logoPreview={logoPreview}
                onLogoChange={(file, preview) => {
                  setLogoFile(file)
                  setLogoPreview(preview)
                }}
              />

              <BannerUpload
                bannerFile={bannerFile}
                bannerPreview={bannerPreview}
                onBannerChange={(file, preview) => {
                  setBannerFile(file)
                  setBannerPreview(preview)
                }}
                onShowCropper={() => setShowBannerCropper(true)}
              />
            </div>

            <Button
              onClick={() => setStep(2)}
              className="w-full"
              size="lg"
              disabled={!isStep1Valid}
            >
              Continuar
            </Button>
          </div>
        )}

        {/* Step 2: Contact & Location */}
        {step === 2 && (
          <ContactInfoForm
            formData={formData}
            phonePrefix={phonePrefix}
            onPhonePrefixChange={setPhonePrefix}
            onChange={handleChange}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
            isValid={isStep2Valid}
          />
        )}

        {/* Step 3: Review & Create */}
        {step === 3 && (
          <ReviewAndCreateForm
            formData={formData}
            categories={categories}
            isLoading={isLoading}
            onBack={() => setStep(2)}
            onSubmit={onSubmit}
          />
        )}

        <OnboardingFooter />
      </div>
    </div>
  )
}