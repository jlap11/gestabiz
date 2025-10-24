// ============================================================================
// LIBRERÍA DE CÁLCULOS FISCALES - COLOMBIA
// ============================================================================

import {
  ColombianCityTax,
  RetentionConfig,
  TaxCalculation,
  TaxType,
} from '@/types/accounting.types'

// ============================================================================
// TASAS DE IVA COLOMBIA
// ============================================================================

export const IVA_RATES = {
  iva_0: 0,
  iva_5: 5,
  iva_19: 19,
} as const

// ============================================================================
// TASAS DE ICA POR CIUDAD (TOP 30 CIUDADES COLOMBIA)
// ============================================================================

export const COLOMBIAN_CITIES_ICA: ColombianCityTax[] = [
  // Bogotá
  { dane_code: '11001', department: 'Bogotá D.C.', city: 'Bogotá', ica_rate: 0.966, has_ica: true },

  // Antioquia
  { dane_code: '05001', department: 'Antioquia', city: 'Medellín', ica_rate: 1.0, has_ica: true },
  { dane_code: '05088', department: 'Antioquia', city: 'Bello', ica_rate: 0.7, has_ica: true },
  { dane_code: '05360', department: 'Antioquia', city: 'Itagüí', ica_rate: 0.8, has_ica: true },
  { dane_code: '05266', department: 'Antioquia', city: 'Envigado', ica_rate: 0.69, has_ica: true },
  { dane_code: '05308', department: 'Antioquia', city: 'Rionegro', ica_rate: 0.7, has_ica: true },

  // Valle del Cauca
  { dane_code: '76001', department: 'Valle del Cauca', city: 'Cali', ica_rate: 1.0, has_ica: true },
  {
    dane_code: '76520',
    department: 'Valle del Cauca',
    city: 'Palmira',
    ica_rate: 0.8,
    has_ica: true,
  },
  {
    dane_code: '76834',
    department: 'Valle del Cauca',
    city: 'Tuluá',
    ica_rate: 0.7,
    has_ica: true,
  },
  {
    dane_code: '76111',
    department: 'Valle del Cauca',
    city: 'Buenaventura',
    ica_rate: 0.8,
    has_ica: true,
  },

  // Atlántico
  {
    dane_code: '08001',
    department: 'Atlántico',
    city: 'Barranquilla',
    ica_rate: 1.0,
    has_ica: true,
  },
  { dane_code: '08758', department: 'Atlántico', city: 'Soledad', ica_rate: 0.7, has_ica: true },
  { dane_code: '08520', department: 'Atlántico', city: 'Malambo', ica_rate: 0.6, has_ica: true },

  // Santander
  {
    dane_code: '68001',
    department: 'Santander',
    city: 'Bucaramanga',
    ica_rate: 1.0,
    has_ica: true,
  },
  {
    dane_code: '68276',
    department: 'Santander',
    city: 'Floridablanca',
    ica_rate: 0.8,
    has_ica: true,
  },
  {
    dane_code: '68547',
    department: 'Santander',
    city: 'Piedecuesta',
    ica_rate: 0.7,
    has_ica: true,
  },
  { dane_code: '68406', department: 'Santander', city: 'Girón', ica_rate: 0.7, has_ica: true },

  // Bolívar
  { dane_code: '13001', department: 'Bolívar', city: 'Cartagena', ica_rate: 1.0, has_ica: true },

  // Risaralda
  { dane_code: '66001', department: 'Risaralda', city: 'Pereira', ica_rate: 0.8, has_ica: true },
  {
    dane_code: '66170',
    department: 'Risaralda',
    city: 'Dosquebradas',
    ica_rate: 0.7,
    has_ica: true,
  },

  // Caldas
  { dane_code: '17001', department: 'Caldas', city: 'Manizales', ica_rate: 0.9, has_ica: true },

  // Norte de Santander
  {
    dane_code: '54001',
    department: 'Norte de Santander',
    city: 'Cúcuta',
    ica_rate: 0.9,
    has_ica: true,
  },

  // Nariño
  { dane_code: '52001', department: 'Nariño', city: 'Pasto', ica_rate: 0.8, has_ica: true },

  // Tolima
  { dane_code: '73001', department: 'Tolima', city: 'Ibagué', ica_rate: 0.8, has_ica: true },

  // Huila
  { dane_code: '41001', department: 'Huila', city: 'Neiva', ica_rate: 0.7, has_ica: true },

  // Meta
  { dane_code: '50001', department: 'Meta', city: 'Villavicencio', ica_rate: 0.7, has_ica: true },

  // Quindío
  { dane_code: '63001', department: 'Quindío', city: 'Armenia', ica_rate: 0.8, has_ica: true },

  // Córdoba
  { dane_code: '23001', department: 'Córdoba', city: 'Montería', ica_rate: 0.7, has_ica: true },

  // Magdalena
  {
    dane_code: '47001',
    department: 'Magdalena',
    city: 'Santa Marta',
    ica_rate: 0.8,
    has_ica: true,
  },

  // Boyacá
  { dane_code: '15001', department: 'Boyacá', city: 'Tunja', ica_rate: 0.7, has_ica: true },
]

// ============================================================================
// RETENCIÓN EN LA FUENTE POR ACTIVIDAD ECONÓMICA
// ============================================================================

export const RETENTION_CONFIGS: RetentionConfig[] = [
  // Servicios de belleza y cuidado personal
  {
    activity_code: '9602',
    description: 'Peluquerías y salones de belleza',
    retention_rate: 2.0,
    applies_to_services: true,
    applies_to_sales: false,
  },
  {
    activity_code: '9609',
    description: 'Otros servicios personales (spa, masajes)',
    retention_rate: 4.0,
    applies_to_services: true,
    applies_to_sales: false,
  },

  // Servicios de salud
  {
    activity_code: '8690',
    description: 'Servicios de salud humana',
    retention_rate: 2.0,
    applies_to_services: true,
    applies_to_sales: false,
  },
  {
    activity_code: '8621',
    description: 'Consultorios médicos',
    retention_rate: 2.0,
    applies_to_services: true,
    applies_to_sales: false,
  },
  {
    activity_code: '8622',
    description: 'Consultorios odontológicos',
    retention_rate: 2.0,
    applies_to_services: true,
    applies_to_sales: false,
  },

  // Servicios profesionales
  {
    activity_code: '7020',
    description: 'Consultoría de negocios y gestión',
    retention_rate: 11.0,
    applies_to_services: true,
    applies_to_sales: false,
  },
  {
    activity_code: '6920',
    description: 'Servicios jurídicos',
    retention_rate: 11.0,
    applies_to_services: true,
    applies_to_sales: false,
  },
  {
    activity_code: '6910',
    description: 'Servicios contables',
    retention_rate: 10.0,
    applies_to_services: true,
    applies_to_sales: false,
  },

  // Servicios de mantenimiento
  {
    activity_code: '4520',
    description: 'Mantenimiento de vehículos',
    retention_rate: 4.0,
    applies_to_services: true,
    applies_to_sales: false,
  },
  {
    activity_code: '4330',
    description: 'Terminación y acabado de edificios',
    retention_rate: 4.0,
    applies_to_services: true,
    applies_to_sales: false,
  },

  // Servicios deportivos y fitness
  {
    activity_code: '9311',
    description: 'Gestión de instalaciones deportivas',
    retention_rate: 4.0,
    applies_to_services: true,
    applies_to_sales: false,
  },
  {
    activity_code: '9312',
    description: 'Clubes deportivos',
    retention_rate: 4.0,
    applies_to_services: true,
    applies_to_sales: false,
  },

  // Educación
  {
    activity_code: '8559',
    description: 'Otros tipos de educación',
    retention_rate: 3.5,
    applies_to_services: true,
    applies_to_sales: false,
  },

  // Servicios de alimentación
  {
    activity_code: '5610',
    description: 'Restaurantes y servicios de comida',
    retention_rate: 3.5,
    applies_to_services: true,
    applies_to_sales: false,
  },

  // General por defecto
  {
    activity_code: 'general',
    description: 'Servicios generales',
    retention_rate: 4.0,
    applies_to_services: true,
    applies_to_sales: false,
  },
]

// ============================================================================
// FUNCIONES DE CÁLCULO
// ============================================================================

/**
 * Calcula el IVA sobre un monto
 */
export function calculateIVA(amount: number, taxType: TaxType): number {
  if (taxType === 'none' || taxType === 'ica' || taxType === 'retention') {
    return 0
  }

  const rate = IVA_RATES[taxType] || 0
  return Math.round(((amount * rate) / 100) * 100) / 100
}

/**
 * Calcula el ICA sobre un monto
 * @param amount - Monto base
 * @param icaRate - Tasa de ICA en porcentaje (ej: 0.966 para Bogotá)
 * @returns Valor del ICA calculado
 */
export function calculateICA(amount: number, icaRate: number): number {
  if (icaRate <= 0) return 0
  return Math.round(((amount * icaRate) / 100) * 100) / 100
}

/**
 * Calcula la retención en la fuente
 */
export function calculateRetention(amount: number, retentionRate: number): number {
  if (retentionRate <= 0) return 0
  return Math.round(((amount * retentionRate) / 100) * 100) / 100
}

/**
 * Calcula todos los impuestos para una transacción
 */
export function calculateAllTaxes(
  subtotal: number,
  taxType: TaxType,
  icaRate: number = 0,
  retentionRate: number = 0
): TaxCalculation {
  // Si taxType es 'none', no calcular ningún impuesto (producto exento)
  if (taxType === 'none') {
    return {
      subtotal,
      iva_amount: 0,
      ica_amount: 0,
      retention_amount: 0,
      total_tax: 0,
      total_amount: subtotal,
    }
  }

  // Calcular IVA solo si el taxType es un tipo de IVA
  const iva_amount = calculateIVA(subtotal, taxType)

  // Calcular ICA si está configurado (puede aplicarse junto con IVA)
  const ica_amount = icaRate > 0 ? calculateICA(subtotal, icaRate) : 0

  // Calcular retención si está configurada (se resta del total)
  const retention_amount = retentionRate > 0 ? calculateRetention(subtotal, retentionRate) : 0

  const total_tax = iva_amount + ica_amount
  const total_amount = subtotal + total_tax - retention_amount

  return {
    subtotal,
    iva_amount,
    ica_amount,
    retention_amount,
    total_tax,
    total_amount,
  }
}

/**
 * Busca la tasa de ICA por código DANE
 */
export function getICARate(daneCode: string): number {
  const city = COLOMBIAN_CITIES_ICA.find(c => c.dane_code === daneCode)
  return city?.ica_rate || 0
}

/**
 * Busca una ciudad por código DANE
 */
export function getCityByDANECode(daneCode: string): ColombianCityTax | null {
  return COLOMBIAN_CITIES_ICA.find(c => c.dane_code === daneCode) || null
}

/**
 * Busca ciudades por departamento
 */
export function getCitiesByDepartment(department: string): ColombianCityTax[] {
  return COLOMBIAN_CITIES_ICA.filter(c =>
    c.department.toLowerCase().includes(department.toLowerCase())
  )
}

/**
 * Busca la configuración de retención por código de actividad
 */
export function getRetentionConfig(activityCode: string): RetentionConfig | null {
  const config = RETENTION_CONFIGS.find(r => r.activity_code === activityCode)
  if (config) return config

  // Si no se encuentra, retornar configuración general
  return RETENTION_CONFIGS.find(r => r.activity_code === 'general') || null
}

/**
 * Obtiene la tasa de retención por código de actividad
 */
export function getRetentionRate(activityCode: string): number {
  const config = getRetentionConfig(activityCode)
  return config?.retention_rate || 4.0 // Default 4%
}

/**
 * Valida si un código DANE es válido
 */
export function isValidDANECode(daneCode: string): boolean {
  return /^\d{5}$/.test(daneCode)
}

/**
 * Valida si un NIT es válido (formato básico)
 */
export function isValidNIT(nit: string): boolean {
  // Formato: 123456789-0 o 123456789
  return /^\d{9}(-\d)?$/.test(nit)
}

/**
 * Formatea un monto en pesos colombianos
 */
export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Formatea un porcentaje
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Obtiene el nombre del tipo de impuesto en español
 */
export function getTaxTypeName(taxType: TaxType): string {
  const names: Record<TaxType, string> = {
    iva_0: 'IVA 0% (Exento)',
    iva_5: 'IVA 5%',
    iva_19: 'IVA 19%',
    ica: 'ICA',
    retention: 'Retención en la Fuente',
    none: 'Sin Impuesto',
  }
  return names[taxType]
}

/**
 * Obtiene el color asociado a un tipo de impuesto
 */
export function getTaxTypeColor(taxType: TaxType): string {
  const colors: Record<TaxType, string> = {
    iva_0: '#10b981',
    iva_5: '#3b82f6',
    iva_19: '#ef4444',
    ica: '#f59e0b',
    retention: '#8b5cf6',
    none: '#6b7280',
  }
  return colors[taxType]
}

/**
 * Calcula el período fiscal actual (YYYY-MM)
 */
export function getCurrentFiscalPeriod(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Obtiene un rango de períodos fiscales
 */
export function getFiscalPeriodRange(months: number): string[] {
  const periods: string[] = []
  const now = new Date()

  for (let i = 0; i < months; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    periods.push(`${year}-${month}`)
  }

  return periods
}

/**
 * Convierte un período fiscal a formato legible
 */
export function formatFiscalPeriod(period: string, locale: string = 'es-CO'): string {
  const [year, month] = period.split('-')
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'long' })
}

/**
 * Calcula la fecha de vencimiento de una obligación fiscal
 */
export function getTaxLiabilityDueDate(
  period: string,
  liabilityType: 'iva_monthly' | 'ica_bimonthly' | 'income_annual'
): Date {
  const [year, month] = period.split('-').map(Number)

  switch (liabilityType) {
    case 'iva_monthly': {
      // IVA vence el día 10 del mes siguiente
      return new Date(year, month, 10)
    }

    case 'ica_bimonthly': {
      // ICA vence el día 15 del primer mes del bimestre siguiente
      const nextBimonth = month + 2
      return new Date(year, nextBimonth - 1, 15)
    }

    case 'income_annual': {
      // Renta vence en abril del año siguiente
      return new Date(year + 1, 3, 30) // 30 de abril
    }

    default:
      return new Date(year, month, 15)
  }
}

/**
 * Verifica si una obligación está vencida
 */
export function isLiabilityOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date()
}

/**
 * Calcula los días de mora
 */
export function getDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate)
  const now = new Date()
  if (now <= due) return 0

  const diff = now.getTime() - due.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}
