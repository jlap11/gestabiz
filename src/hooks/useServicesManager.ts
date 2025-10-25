import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Service, Location, Employee } from '@/types/supabase'

interface ServiceFormData {
  name: string
  description: string
  duration_minutes: number
  price: number
  currency: string
  category: string
  image_url: string
  is_active: boolean
}

const initialFormData: ServiceFormData = {
  name: '',
  description: '',
  duration_minutes: 60,
  price: 0,
  currency: 'COP',
  category: '',
  image_url: '',
  is_active: true,
}

export const useServicesManager = (businessId: string) => {
  const { t } = useLanguage()
  
  // State
  const [services, setServices] = useState<Service[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formData, setFormData] = useState<ServiceFormData>(initialFormData)
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [pendingImageFiles, setPendingImageFiles] = useState<File[]>([])

  // Fetch data functions
  const fetchServices = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setServices(data || [])
    } catch (error) {
      console.error('Error fetching services:', error)
      toast.error(t('common.messages.fetchError'))
    }
  }, [businessId, t])

  const fetchLocations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setLocations(data || [])
    } catch (error) {
      console.error('Error fetching locations:', error)
      toast.error(t('common.messages.fetchError'))
    }
  }, [businessId, t])

  const fetchEmployees = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .eq('business_id', businessId)
        .eq('is_active', true)

      if (error) throw error
      setEmployees(data || [])
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast.error(t('common.messages.fetchError'))
    }
  }, [businessId, t])

  const fetchServiceAssignments = useCallback(async (serviceId: string) => {
    try {
      // Fetch location assignments
      const { data: locationData, error: locationError } = await supabase
        .from('location_services')
        .select('location_id')
        .eq('service_id', serviceId)

      if (locationError) throw locationError
      setSelectedLocations(locationData?.map(item => item.location_id) || [])

      // Fetch employee assignments
      const { data: employeeData, error: employeeError } = await supabase
        .from('employee_services')
        .select('employee_id')
        .eq('service_id', serviceId)

      if (employeeError) throw employeeError
      setSelectedEmployees(employeeData?.map(item => item.employee_id) || [])
    } catch (error) {
      console.error('Error fetching service assignments:', error)
      toast.error(t('common.messages.fetchError'))
    }
  }, [t])

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        fetchServices(),
        fetchLocations(),
        fetchEmployees()
      ])
    } finally {
      setIsLoading(false)
    }
  }, [fetchServices, fetchLocations, fetchEmployees])

  // Dialog management
  const handleOpenDialog = useCallback(async (service?: Service) => {
    if (service) {
      setEditingService(service)
      setFormData({
        name: service.name,
        description: service.description || '',
        duration_minutes: service.duration_minutes,
        price: service.price,
        currency: service.currency || 'COP',
        category: service.category || '',
        image_url: service.image_url || '',
        is_active: service.is_active,
      })
      await fetchServiceAssignments(service.id)
    } else {
      setEditingService(null)
      setFormData(initialFormData)
      setSelectedLocations([])
      setSelectedEmployees([])
    }
    setPendingImageFiles([])
    setIsDialogOpen(true)
  }, [fetchServiceAssignments])

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false)
    setEditingService(null)
    setFormData(initialFormData)
    setSelectedLocations([])
    setSelectedEmployees([])
    setPendingImageFiles([])
  }, [])

  // Form handlers
  const handleChange = useCallback((field: keyof ServiceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleToggleLocation = useCallback((locationId: string) => {
    setSelectedLocations(prev =>
      prev.includes(locationId)
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    )
  }, [])

  const handleToggleEmployee = useCallback((employeeId: string) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    )
  }, [])

  // Service operations
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error(t('admin.serviceValidation.nameRequired'))
      return
    }

    if (formData.duration_minutes <= 0) {
      toast.error(t('admin.serviceValidation.durationRequired'))
      return
    }

    setIsSaving(true)
    try {
      let serviceId: string

      if (editingService) {
        // Update existing service
        const serviceData = {
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          duration_minutes: formData.duration_minutes,
          price: formData.price,
          currency: formData.currency || 'COP',
          category: formData.category || null,
          image_url: formData.image_url || null,
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        }

        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id)

        if (error) throw error
        serviceId = editingService.id
        toast.success(t('admin.serviceValidation.updateSuccess'))
      } else {
        // Create new service
        const newServiceData = {
          business_id: businessId,
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          duration_minutes: formData.duration_minutes,
          price: formData.price,
          currency: formData.currency || 'COP',
          category: formData.category || null,
          is_active: formData.is_active,
        }

        const { data, error } = await supabase
          .from('services')
          .insert(newServiceData)
          .select()
          .single()

        if (error) {
          console.error('Error creating service:', error)
          throw error
        }
        serviceId = data.id

        // Upload pending images
        if (pendingImageFiles.length > 0) {
          toast.info(t('common.messages.uploadingImages'))
          const uploadedUrls: string[] = []

          for (const file of pendingImageFiles) {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
            const filePath = `services/${serviceId}/${fileName}`

            const { error: uploadError } = await supabase.storage
              .from('service-images')
              .upload(filePath, file)

            if (!uploadError) {
              const {
                data: { publicUrl },
              } = supabase.storage.from('service-images').getPublicUrl(filePath)
              uploadedUrls.push(publicUrl)
            }
          }

          // Update service with image URL
          if (uploadedUrls.length > 0) {
            await supabase
              .from('services')
              .update({ image_url: uploadedUrls[0] })
              .eq('id', serviceId)
          }
        }

        toast.success(t('admin.serviceValidation.createSuccess'))
      }

      // Update location assignments
      await supabase.from('location_services').delete().eq('service_id', serviceId)
      if (selectedLocations.length > 0) {
        const locationAssignments = selectedLocations.map(locId => ({
          location_id: locId,
          service_id: serviceId,
        }))
        await supabase.from('location_services').insert(locationAssignments)
      }

      // Update employee assignments
      await supabase.from('employee_services').delete().eq('service_id', serviceId)
      if (selectedEmployees.length > 0) {
        const employeeAssignments = selectedEmployees.map(empId => ({
          employee_id: empId,
          service_id: serviceId,
        }))
        await supabase.from('employee_services').insert(employeeAssignments)
      }

      await fetchData()
      handleCloseDialog()
    } catch (error: unknown) {
      console.error('Error in handleSubmit:', error)
      const err = error as { message?: string }
      const errorMessage = err?.message || undefined
      toast.error(
        editingService
          ? `${t('common.messages.updateError')}${errorMessage ? `: ${errorMessage}` : ''}`
          : `${t('common.messages.createError')}${errorMessage ? `: ${errorMessage}` : ''}`
      )
    } finally {
      setIsSaving(false)
    }
  }, [
    formData,
    editingService,
    businessId,
    selectedLocations,
    selectedEmployees,
    pendingImageFiles,
    t,
    fetchData,
    handleCloseDialog
  ])

  const handleDelete = useCallback(async (serviceId: string) => {
    if (!confirm(t('admin.actions.confirmDeleteService'))) {
      return
    }

    try {
      // Delete assignments first
      await supabase.from('location_services').delete().eq('service_id', serviceId)
      await supabase.from('employee_services').delete().eq('service_id', serviceId)

      // Delete service
      const { error } = await supabase.from('services').delete().eq('id', serviceId)

      if (error) throw error
      toast.success(t('admin.serviceValidation.deleteSuccess'))
      await fetchData()
    } catch {
      toast.error(t('admin.serviceValidation.deleteError'))
    }
  }, [t, fetchData])

  const handleImageUploaded = useCallback((urls: string[]) => {
    if (urls.length > 0) {
      setFormData(prev => ({ ...prev, image_url: urls[0] }))
    }
  }, [])

  // Initialize data
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    // State
    services,
    locations,
    employees,
    isLoading,
    isSaving,
    isDialogOpen,
    editingService,
    formData,
    selectedLocations,
    selectedEmployees,
    pendingImageFiles,
    
    // Actions
    handleOpenDialog,
    handleCloseDialog,
    handleChange,
    handleToggleLocation,
    handleToggleEmployee,
    handleSubmit,
    handleDelete,
    handleImageUploaded,
    setPendingImageFiles,
    fetchData,
  }
}