// ============================================================================
// UI CONSTANTS
// Constantes para valores de UI reutilizables y consistentes
// ============================================================================

// Touch targets mínimos para accesibilidad móvil
export const TOUCH_TARGET = {
  MIN_SIZE: '44px',
  MIN_SIZE_SM: '40px',
} as const

// Alturas comunes de componentes
export const HEIGHTS = {
  BUTTON: '44px',
  BUTTON_SM: '40px',
  INPUT: '44px',
  SELECT: '44px',
  TEXTAREA_MIN: '120px',
  MODAL_MAX: '90vh',
  DROPDOWN_MAX: '300px',
  SCROLL_AREA_MAX: '400px',
} as const

// Anchos comunes
export const WIDTHS = {
  SIDEBAR: '280px',
  MODAL_SM: '400px',
  MODAL_MD: '500px',
  MODAL_LG: '600px',
  SELECT_MIN: '160px',
  SELECT_MD: '180px',
  SELECT_LG: '280px',
} as const

// Colores de estado para gráficos y visualizaciones
export const STATUS_COLORS = {
  CONFIRMED: '#3b82f6',
  COMPLETED: '#10b981', 
  CANCELLED: '#ef4444',
  NO_SHOW: '#6b7280',
  INCOME: '#10b981',
  EXPENSE: '#ef4444',
  PRIMARY: '#8b5cf6',
} as const

// Radios de borde comunes
export const BORDER_RADIUS = {
  SM: '4px',
  MD: '6px',
  LG: '8px',
  FULL: '9999px',
} as const

// Espaciado común
export const SPACING = {
  CONTAINER_PADDING: '1rem',
  CONTAINER_PADDING_SM: '1.5rem',
  SECTION_GAP: '2rem',
  ELEMENT_GAP: '1rem',
  ELEMENT_GAP_SM: '0.5rem',
} as const

// Z-index layers
export const Z_INDEX = {
  DROPDOWN: 50,
  MODAL: 100,
  TOAST: 200,
  TOOLTIP: 300,
} as const

// Breakpoints (para uso en JavaScript)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
} as const

// Duraciones de animación
export const ANIMATION_DURATION = {
  FAST: '150ms',
  NORMAL: '300ms',
  SLOW: '500ms',
} as const

// Tamaños de fuente comunes
export const FONT_SIZES = {
  XS: '10px',
  SM: '12px',
  BASE: '14px',
  LG: '16px',
  XL: '18px',
} as const