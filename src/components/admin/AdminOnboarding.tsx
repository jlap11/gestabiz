import { UnifiedLayout } from '@/components/layouts/UnifiedLayout'
import type { Business, User, UserRole } from '@/types/types'
import { BannerCropper } from '@/components/settings/BannerCropper'
import { OnboardingContent } from './onboarding'
import { useAdminOnboardingState } from './hooks/useAdminOnboardingState'
import { useBusinessCreation } from './hooks/useBusinessCreation'
import { useCategoryFiltering } from './hooks/useCategoryFiltering'
import { useOnboardingSidebar } from './hooks/useOnboardingSidebar'

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
  onNavigateToAdmin,
}: Readonly<AdminOnboardingProps>) {
  // Custom hooks
  const {
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
    handleChange,
    handleBannerCropComplete,
    isStep1Valid,
    isStep2Valid,
  } = useAdminOnboardingState()

  const { categories, categoriesLoading, filteredMainCategories } = useCategoryFiltering(categoryFilter)
  
  const { createBusiness } = useBusinessCreation({ user, onBusinessCreated })
  
  const { sidebarItems, currentBusiness, handlePageChange } = useOnboardingSidebar({
    user,
    businesses,
    onNavigateToAdmin,
  })

  const handleSubmit = () => {
    createBusiness({
      formData,
      selectedSubcategories,
      logoFile,
      bannerFile,
      setIsLoading,
    })
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
      user={
        user
          ? {
              id: user.id,
              name: user.name,
              email: user.email,
              avatar: user.avatar_url,
            }
          : undefined
      }
    >
      <OnboardingContent
        step={step}
        setStep={setStep}
        isLoading={isLoading}
        formData={formData}
        handleChange={handleChange}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        categories={categories}
        categoriesLoading={categoriesLoading}
        filteredMainCategories={filteredMainCategories}
        selectedSubcategories={selectedSubcategories}
        setSelectedSubcategories={setSelectedSubcategories}
        logoFile={logoFile}
        setLogoFile={setLogoFile}
        logoPreview={logoPreview}
        setLogoPreview={setLogoPreview}
        bannerFile={bannerFile}
        setBannerFile={setBannerFile}
        bannerPreview={bannerPreview}
        setBannerPreview={setBannerPreview}
        setShowBannerCropper={setShowBannerCropper}
        phonePrefix={phonePrefix}
        setPhonePrefix={setPhonePrefix}
        isStep1Valid={isStep1Valid}
        isStep2Valid={isStep2Valid}
        handleSubmit={handleSubmit}
      />

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
