import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { resourcesService } from '@/lib/services/resources'
import type { BusinessResource } from '@/types/types'
import { toast } from 'sonner'

/**
 * Hook para gestionar recursos físicos de negocios
 * (habitaciones, mesas, canchas, equipos, etc.)
 * 
 * Fecha: 21 de Octubre de 2025
 * Parte del sistema de Modelo de Negocio Flexible
 */

// ============================================================================
// QUERY KEYS - Centralizadas para invalidación
// ============================================================================

export const resourcesKeys = {
  all: ['business-resources'] as const,
  byBusiness: (businessId: string) => 
    [...resourcesKeys.all, 'business', businessId] as const,
  byLocation: (locationId: string) => 
    [...resourcesKeys.all, 'location', locationId] as const,
  byType: (businessId: string, type: string) => 
    [...resourcesKeys.all, 'business', businessId, 'type', type] as const,
  detail: (resourceId: string) => 
    [...resourcesKeys.all, 'detail', resourceId] as const,
  availability: (resourceId: string, startDate: string, endDate: string) => 
    [...resourcesKeys.all, 'availability', resourceId, startDate, endDate] as const,
  services: (resourceId: string) => 
    [...resourcesKeys.all, 'services', resourceId] as const,
  stats: (resourceId: string) => 
    [...resourcesKeys.all, 'stats', resourceId] as const,
  forService: (businessId: string, serviceId: string, locationId?: string) =>
    [...resourcesKeys.all, 'for-service', businessId, serviceId, locationId || 'all'] as const,
}

// ============================================================================
// QUERIES - Lectura de datos
// ============================================================================

/**
 * Obtener todos los recursos de un negocio
 */
export function useBusinessResources(businessId: string) {
  return useQuery({
    queryKey: resourcesKeys.byBusiness(businessId),
    queryFn: () => resourcesService.getByBusinessId(businessId),
    enabled: !!businessId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

/**
 * Obtener recursos por ubicación
 */
export function useLocationResources(locationId: string) {
  return useQuery({
    queryKey: resourcesKeys.byLocation(locationId),
    queryFn: () => resourcesService.getByLocationId(locationId),
    enabled: !!locationId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Obtener recursos por tipo
 */
export function useResourcesByType(businessId: string, resourceType: string) {
  return useQuery({
    queryKey: resourcesKeys.byType(businessId, resourceType),
    queryFn: () => resourcesService.getByType(businessId, resourceType),
    enabled: !!businessId && !!resourceType,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Obtener detalle completo de un recurso
 */
export function useResourceDetail(resourceId: string) {
  return useQuery({
    queryKey: resourcesKeys.detail(resourceId),
    queryFn: () => resourcesService.getById(resourceId),
    enabled: !!resourceId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}

/**
 * Obtener disponibilidad de un recurso
 */
export function useResourceAvailability(
  resourceId: string,
  startDate: Date,
  endDate: Date
) {
  const startStr = startDate.toISOString()
  const endStr = endDate.toISOString()
  
  return useQuery({
    queryKey: resourcesKeys.availability(resourceId, startStr, endStr),
    queryFn: () => resourcesService.getAvailability(resourceId, startDate, endDate),
    enabled: !!resourceId && !!startDate && !!endDate,
    staleTime: 30 * 1000, // 30 segundos (datos más volátiles)
  })
}

/**
 * Obtener servicios asignados a un recurso
 */
export function useResourceServices(resourceId: string) {
  return useQuery({
    queryKey: resourcesKeys.services(resourceId),
    queryFn: () => resourcesService.getServices(resourceId),
    enabled: !!resourceId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Obtener estadísticas de un recurso
 */
export function useResourceStats(resourceId: string) {
  return useQuery({
    queryKey: resourcesKeys.stats(resourceId),
    queryFn: () => resourcesService.getStats(resourceId),
    enabled: !!resourceId,
    staleTime: 60 * 1000, // 1 minuto
  })
}

/**
 * Obtener recursos disponibles para un servicio
 */
export function useResourcesForService(
  businessId: string,
  serviceId: string,
  locationId?: string
) {
  return useQuery({
    queryKey: resourcesKeys.forService(businessId, serviceId, locationId),
    queryFn: () => resourcesService.getAvailableForService(businessId, serviceId, locationId),
    enabled: !!businessId && !!serviceId,
    staleTime: 5 * 60 * 1000,
  })
}

// ============================================================================
// MUTATIONS - Escritura de datos
// ============================================================================

/**
 * Crear un nuevo recurso
 */
export function useCreateResource() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (resource: Omit<BusinessResource, 'id' | 'created_at' | 'updated_at'>) =>
      resourcesService.create(resource),
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: resourcesKeys.byBusiness(data.business_id) })
      if (data.location_id) {
        queryClient.invalidateQueries({ queryKey: resourcesKeys.byLocation(data.location_id) })
      }
      queryClient.invalidateQueries({ queryKey: resourcesKeys.byType(data.business_id, data.resource_type) })
      
      toast.success('Recurso creado exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al crear recurso: ${error.message}`)
    },
  })
}

/**
 * Actualizar un recurso
 */
export function useUpdateResource() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ resourceId, updates }: { 
      resourceId: string
      updates: Partial<BusinessResource> 
    }) => resourcesService.update(resourceId, updates),
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: resourcesKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: resourcesKeys.byBusiness(data.business_id) })
      if (data.location_id) {
        queryClient.invalidateQueries({ queryKey: resourcesKeys.byLocation(data.location_id) })
      }
      queryClient.invalidateQueries({ queryKey: resourcesKeys.byType(data.business_id, data.resource_type) })
      
      toast.success('Recurso actualizado exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar recurso: ${error.message}`)
    },
  })
}

/**
 * Eliminar (desactivar) un recurso
 */
export function useDeleteResource() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (resourceId: string) => resourcesService.delete(resourceId),
    onSuccess: (_data, resourceId) => {
      // Invalidar todas las queries de recursos (no sabemos el businessId aquí)
      queryClient.invalidateQueries({ queryKey: resourcesKeys.all })
      
      toast.success('Recurso desactivado exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar recurso: ${error.message}`)
    },
  })
}

/**
 * Asignar servicios a un recurso
 */
export function useAssignServices() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      resourceId, 
      serviceIds, 
      customPrices 
    }: {
      resourceId: string
      serviceIds: string[]
      customPrices?: Record<string, number>
    }) => resourcesService.assignServices(resourceId, serviceIds, customPrices),
    onSuccess: (_data, { resourceId }) => {
      // Invalidar queries de servicios del recurso
      queryClient.invalidateQueries({ queryKey: resourcesKeys.services(resourceId) })
      queryClient.invalidateQueries({ queryKey: resourcesKeys.detail(resourceId) })
      
      toast.success('Servicios asignados exitosamente')
    },
    onError: (error: Error) => {
      toast.error(`Error al asignar servicios: ${error.message}`)
    },
  })
}

/**
 * Refrescar vista materializada de disponibilidad
 */
export function useRefreshResourceAvailability() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => resourcesService.refreshAvailability(),
    onSuccess: () => {
      // Invalidar todas las queries de disponibilidad
      queryClient.invalidateQueries({ queryKey: resourcesKeys.all })
      
      toast.success('Disponibilidad actualizada')
    },
    onError: (error: Error) => {
      toast.error(`Error al refrescar disponibilidad: ${error.message}`)
    },
  })
}
