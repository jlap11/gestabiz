/**
 * @file hierarchyLevelUtils.ts
 * @description Utilidades y constantes para niveles jerárquicos
 * Archivo separado para evitar problemas con Fast Refresh
 */

// =====================================================
// TIPOS
// =====================================================

export interface HierarchyLevel {
  value: number
  label: string
  description: string
  color: string
  badgeColor: string
}

// =====================================================
// CONSTANTES
// =====================================================

export const HIERARCHY_LEVELS: HierarchyLevel[] = [
  {
    value: 0,
    label: 'Owner',
    description: 'Propietario del negocio',
    color: 'text-purple-700 dark:text-purple-400',
    badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  },
  {
    value: 1,
    label: 'Admin',
    description: 'Administrador',
    color: 'text-blue-700 dark:text-blue-400',
    badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  },
  {
    value: 2,
    label: 'Manager',
    description: 'Gerente',
    color: 'text-green-700 dark:text-green-400',
    badgeColor: 'bg-green-500/10 text-green-700 dark:text-green-400',
  },
  {
    value: 3,
    label: 'Lead',
    description: 'Líder',
    color: 'text-yellow-700 dark:text-yellow-400',
    badgeColor: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  },
  {
    value: 4,
    label: 'Staff',
    description: 'Personal',
    color: 'text-gray-700 dark:text-gray-400',
    badgeColor: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
  },
]

// =====================================================
// HELPERS
// =====================================================

/**
 * Obtiene los datos de un nivel jerárquico específico
 * @param level - Nivel jerárquico (0-4)
 * @returns Datos del nivel o Staff si no existe
 */
export const getLevelData = (level: number): HierarchyLevel => {
  return HIERARCHY_LEVELS.find(l => l.value === level) || HIERARCHY_LEVELS[4]
}

/**
 * Obtiene el label de un nivel jerárquico
 * @param level - Nivel jerárquico (0-4)
 * @returns Label en inglés (Owner, Admin, Manager, Lead, Staff)
 */
export const getLevelLabel = (level: number): string => {
  return getLevelData(level).label
}

/**
 * Obtiene el color del badge de un nivel jerárquico
 * @param level - Nivel jerárquico (0-4)
 * @returns Clases CSS del badge
 */
export const getLevelBadgeColor = (level: number): string => {
  return getLevelData(level).badgeColor
}

/**
 * Obtiene la descripción de un nivel jerárquico
 * @param level - Nivel jerárquico (0-4)
 * @returns Descripción en español
 */
export const getLevelDescription = (level: number): string => {
  return getLevelData(level).description
}

/**
 * Valida si un nivel jerárquico es válido
 * @param level - Nivel a validar
 * @returns true si está entre 0-4
 */
export const isValidHierarchyLevel = (level: number): boolean => {
  return level >= 0 && level <= 4 && Number.isInteger(level)
}
