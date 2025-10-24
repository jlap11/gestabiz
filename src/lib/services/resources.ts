import supabase from '@/lib/supabase'
import type { BusinessResource, ResourceService } from '@/types/types'

/**
 * Servicio para gestionar recursos físicos de negocios
 * (habitaciones, mesas, canchas, equipos, etc.)
 *
 * Fecha: 21 de Octubre de 2025
 * Parte del sistema de Modelo de Negocio Flexible
 */

// ============================================================================
// CRUD para business_resources
// ============================================================================

export const resourcesService = {
  /**
   * Obtener todos los recursos de un negocio
   */
  async getByBusinessId(businessId: string): Promise<BusinessResource[]> {
    const { data, error } = await supabase
      .from('business_resources')
      .select(
        `
        *,
        location:locations(id, name, address, city)
      `
      )
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return (data || []) as BusinessResource[]
  },

  /**
   * Obtener recursos por ubicación
   */
  async getByLocationId(locationId: string): Promise<BusinessResource[]> {
    const { data, error } = await supabase
      .from('business_resources')
      .select('*')
      .eq('location_id', locationId)
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return (data || []) as BusinessResource[]
  },

  /**
   * Obtener recursos por tipo
   */
  async getByType(businessId: string, resourceType: string): Promise<BusinessResource[]> {
    const { data, error } = await supabase
      .from('business_resources')
      .select('*')
      .eq('business_id', businessId)
      .eq('resource_type', resourceType)
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return (data || []) as BusinessResource[]
  },

  /**
   * Obtener un recurso por ID con información completa
   */
  async getById(resourceId: string): Promise<BusinessResource> {
    const { data, error } = await supabase
      .from('business_resources')
      .select(
        `
        *,
        location:locations(id, name, address, city),
        services:resource_services(
          service:services(*)
        )
      `
      )
      .eq('id', resourceId)
      .single()

    if (error) throw error
    return data as BusinessResource
  },

  /**
   * Crear un nuevo recurso
   */
  async create(
    resource: Omit<BusinessResource, 'id' | 'created_at' | 'updated_at'>
  ): Promise<BusinessResource> {
    const { data, error } = await supabase
      .from('business_resources')
      .insert(resource)
      .select()
      .single()

    if (error) throw error
    return data as BusinessResource
  },

  /**
   * Actualizar un recurso
   */
  async update(resourceId: string, updates: Partial<BusinessResource>): Promise<BusinessResource> {
    const { data, error } = await supabase
      .from('business_resources')
      .update(updates)
      .eq('id', resourceId)
      .select()
      .single()

    if (error) throw error
    return data as BusinessResource
  },

  /**
   * Eliminar (desactivar) un recurso
   */
  async delete(resourceId: string): Promise<void> {
    const { error } = await supabase
      .from('business_resources')
      .update({ is_active: false })
      .eq('id', resourceId)

    if (error) throw error
  },

  /**
   * Eliminar permanentemente un recurso
   * ⚠️ PELIGRO: Esto eliminará TODOS los datos relacionados
   */
  async deletePermanently(resourceId: string): Promise<void> {
    const { error } = await supabase.from('business_resources').delete().eq('id', resourceId)

    if (error) throw error
  },

  /**
   * Obtener disponibilidad de un recurso en un rango de fechas
   */
  async getAvailability(
    resourceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ start_time: string; end_time: string; status: string }>> {
    const { data, error } = await supabase
      .from('appointments')
      .select('start_time, end_time, status')
      .eq('resource_id', resourceId)
      .in('status', ['pending', 'confirmed'])
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString())
      .order('start_time')

    if (error) throw error
    return data || []
  },

  /**
   * Validar si un recurso está disponible en un rango de tiempo
   */
  async isAvailable(
    resourceId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_resource_available', {
      p_resource_id: resourceId,
      p_start_time: startTime.toISOString(),
      p_end_time: endTime.toISOString(),
      p_exclude_appointment_id: excludeAppointmentId || null,
    })

    if (error) throw error
    return data as boolean
  },

  /**
   * Asignar servicios a un recurso
   */
  async assignServices(
    resourceId: string,
    serviceIds: string[],
    customPrices?: Record<string, number>
  ): Promise<void> {
    // Eliminar asignaciones existentes
    await supabase.from('resource_services').delete().eq('resource_id', resourceId)

    // Crear nuevas asignaciones
    const records = serviceIds.map(serviceId => ({
      resource_id: resourceId,
      service_id: serviceId,
      custom_price: customPrices?.[serviceId] || null,
      is_active: true,
    }))

    const { error } = await supabase.from('resource_services').insert(records)

    if (error) throw error
  },

  /**
   * Obtener servicios asignados a un recurso
   */
  async getServices(resourceId: string): Promise<ResourceService[]> {
    const { data, error } = await supabase
      .from('resource_services')
      .select(
        `
        *,
        service:services(*)
      `
      )
      .eq('resource_id', resourceId)
      .eq('is_active', true)

    if (error) throw error
    return (data || []) as ResourceService[]
  },

  /**
   * Obtener estadísticas de un recurso
   */
  async getStats(resourceId: string): Promise<{
    total_bookings: number
    upcoming_bookings: number
    completed_bookings: number
    revenue_total: number
    revenue_this_month: number
  }> {
    const { data, error } = await supabase.rpc('get_resource_stats', {
      p_resource_id: resourceId,
    })

    if (error) throw error
    return (
      data || {
        total_bookings: 0,
        upcoming_bookings: 0,
        completed_bookings: 0,
        revenue_total: 0,
        revenue_this_month: 0,
      }
    )
  },

  /**
   * Obtener recursos disponibles para un servicio
   */
  async getAvailableForService(
    businessId: string,
    serviceId: string,
    locationId?: string
  ): Promise<BusinessResource[]> {
    const query = supabase
      .from('resource_services')
      .select(
        `
        resource:business_resources(*)
      `
      )
      .eq('service_id', serviceId)
      .eq('is_active', true)

    const { data, error } = await query

    if (error) throw error

    // Type assertion con unknown para evitar error de conversión
    type ResourceServiceRow = { resource: BusinessResource }
    const resources = ((data || []) as unknown as ResourceServiceRow[])
      .map(rs => rs.resource)
      .filter((r): r is BusinessResource => !!r?.is_active && r.business_id === businessId)

    if (locationId) {
      return resources.filter(r => r.location_id === locationId)
    }

    return resources
  },

  /**
   * Refrescar vista materializada de disponibilidad
   */
  async refreshAvailability(): Promise<void> {
    const { error } = await supabase.rpc('refresh_resource_availability')
    if (error) throw error
  },
}

export default resourcesService
