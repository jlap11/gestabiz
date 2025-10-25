import { useCallback } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'
import { slugify } from '@/lib/utils'
import type { User } from '@/types/types'
import type { OnboardingFormData } from './useAdminOnboardingState'

interface UseBusinessCreationProps {
  user: User
  onBusinessCreated?: () => void
}

export function useBusinessCreation({ user, onBusinessCreated }: UseBusinessCreationProps) {
  const { t } = useLanguage()

  const validateTaxId = useCallback(async (formData: OnboardingFormData) => {
    if (!formData.tax_id) return true

    const taxId = formData.tax_id.trim()
    
    if (formData.legal_entity_type === 'company') {
      // NIT should be 9-10 digits
      if (!/^\d{9,10}$/.test(taxId)) {
        toast.error(t('admin.adminOnboarding.nitInvalid'))
        return false
      }
    } else {
      // Cédula should be 6-10 digits
      if (!/^\d{6,10}$/.test(taxId)) {
        toast.error(t('admin.adminOnboarding.cedInvalid'))
        return false
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
      return false
    }

    if (existingBusiness) {
      toast.error(
        `Este NIT/Cédula ya está registrado para el negocio "${existingBusiness.name}"`
      )
      return false
    }

    return true
  }, [t])

  const uploadFile = useCallback(async (
    file: File,
    businessId: string,
    fileType: 'logo' | 'banner'
  ) => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${fileType}.${fileExt}`
      const filePath = `${businessId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('business-logos')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage.from('business-logos').getPublicUrl(filePath)

      // Update business with file URL
      const updateField = fileType === 'logo' ? 'logo_url' : 'banner_url'
      const { error: updateError } = await supabase
        .from('businesses')
        .update({ [updateField]: urlData.publicUrl })
        .eq('id', businessId)

      if (updateError) throw updateError

      toast.success(t('common.messages.saveSuccess'))
      return true
    } catch (error) {
      console.error(`Error uploading ${fileType}:`, error)
      toast.warning(t('common.messages.tryAgain'))
      return false
    }
  }, [t])

  const createBusiness = useCallback(async (
    formData: OnboardingFormData,
    logoFile: File | null,
    bannerFile: File | null
  ) => {
    try {
      // Critical: Verify user authentication and get fresh session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        toast.error(t('admin.adminOnboarding.authError'))
        return false
      }

      if (!sessionData?.session?.user) {
        toast.error(t('admin.adminOnboarding.notAuthenticated'))
        return false
      }

      const authenticatedUserId = sessionData.session.user.id

      if (!authenticatedUserId || !user?.id) {
        toast.error(t('admin.adminOnboarding.userIdError'))
        return false
      }

      if (authenticatedUserId !== user.id) {
        toast.error(t('admin.adminOnboarding.authCheckError'))
        return false
      }

      // Validate required fields
      if (!formData.name || !formData.category_id) {
        toast.error(t('admin.adminOnboarding.nameRequired'))
        return false
      }

      // Validate tax_id format
      const isValidTaxId = await validateTaxId(formData)
      if (!isValidTaxId) return false

      // Create business
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: formData.name.trim(),
          slug: slugify(formData.name.trim()),
          category_id: formData.category_id,
          description: formData.description.trim() || null,
          legal_entity_type: formData.legal_entity_type,
          tax_id: formData.tax_id.trim() || null,
          legal_name: formData.legal_name.trim() || null,
          registration_number: formData.registration_number.trim() || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
          city_id: formData.city_id || null,
          region_id: formData.region_id || null,
          country_id: formData.country_id,
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

      if (businessError) throw businessError

      toast.success(t('common.messages.createSuccess'))

      // Upload files if they exist
      if (logoFile && business) {
        await uploadFile(logoFile, business.id, 'logo')
      }

      if (bannerFile && business) {
        await uploadFile(bannerFile, business.id, 'banner')
      }

      // Show success message
      if (business) {
        toast.success(t('common.messages.createSuccess'))
      }

      // Call callback
      onBusinessCreated?.()
      return true
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido'
      toast.error(`Error al crear negocio: ${errorMsg}`)
      return false
    }
  }, [user, t, validateTaxId, uploadFile, onBusinessCreated])

  return {
    createBusiness,
  }
}