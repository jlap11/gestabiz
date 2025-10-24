/**
 * Animation Utilities - CSS-based animations for Chat & Notifications
 *
 * Todas las animaciones usan CSS puro + Tailwind para:
 * - Zero bundle size impact
 * - GPU-accelerated performance
 * - Mobile-first approach
 * - React Native compatible patterns
 *
 * @author Gestabiz Team
 * @version 1.0.0
 * @date 2025-10-13
 */

// ============================================================================
// ANIMATION CLASSES (Tailwind)
// ============================================================================

/**
 * Clases de animación predefinidas para usar con cn()
 * Todas usan transform + opacity para GPU acceleration
 */
export const animations = {
  // Message animations
  messageSlideIn: 'animate-in slide-in-from-bottom-2 fade-in-0 duration-300',
  messageSlideOut: 'animate-out slide-out-to-bottom-2 fade-out-0 duration-200',

  // Typing indicator
  typingFadeIn: 'animate-in fade-in-0 duration-200',
  typingFadeOut: 'animate-out fade-out-0 duration-150',
  typingPulse: 'animate-pulse',

  // Badge animations
  badgeBounce: 'animate-in zoom-in-50 duration-200',
  badgeScale: 'animate-in scale-in-0 duration-150',

  // Modal/Dropdown
  modalFadeIn: 'animate-in fade-in-0 zoom-in-95 duration-200',
  modalFadeOut: 'animate-out fade-out-0 zoom-out-95 duration-150',
  dropdownSlideIn: 'animate-in slide-in-from-top-2 fade-in-0 duration-200',
  dropdownSlideOut: 'animate-out slide-out-to-top-2 fade-out-0 duration-150',

  // Hover effects (subtle)
  hoverLift: 'transition-transform hover:-translate-y-0.5 duration-200',
  hoverScale: 'transition-transform hover:scale-105 duration-200',
  hoverOpacity: 'transition-opacity hover:opacity-80 duration-150',

  // Loading states
  shimmer:
    'animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
  spin: 'animate-spin',

  // Notification bell
  bellShake: 'animate-[shake_0.5s_ease-in-out]',
  bellPulse: 'animate-pulse',
} as const

// ============================================================================
// SCROLL UTILITIES
// ============================================================================

/**
 * Scroll suave a un elemento con easing
 */
export function smoothScrollTo(element: HTMLElement, options?: ScrollIntoViewOptions) {
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'nearest',
    ...options,
  })
}

/**
 * Scroll al final de un contenedor (usado en chat)
 */
export function scrollToBottom(container: HTMLElement, smooth = true) {
  if (smooth) {
    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    })
  } else {
    container.scrollTop = container.scrollHeight
  }
}

/**
 * Detecta si el usuario está cerca del final del scroll
 */
export function isNearBottom(container: HTMLElement, threshold = 100): boolean {
  const { scrollTop, scrollHeight, clientHeight } = container
  return scrollHeight - scrollTop - clientHeight < threshold
}

// ============================================================================
// TRANSITION UTILITIES
// ============================================================================

/**
 * Delays para diferentes tipos de animaciones
 */
export const transitionDurations = {
  fast: 150,
  normal: 200,
  slow: 300,
  slowest: 500,
} as const

/**
 * Easing functions para animaciones personalizadas
 */
export const easings = {
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const

// ============================================================================
// STAGGER ANIMATIONS (para listas)
// ============================================================================

/**
 * Genera delay para animación stagger
 * Útil para animar listas de items secuencialmente
 */
export function getStaggerDelay(index: number, baseDelay = 50): string {
  return `${index * baseDelay}ms`
}

/**
 * Clase de stagger para usar en map
 */
export function getStaggerClass(index: number, maxItems = 10): string {
  const delay = Math.min(index * 50, maxItems * 50)
  return `animate-in fade-in-0 slide-in-from-bottom-1 duration-200 [animation-delay:${delay}ms]`
}

// ============================================================================
// VISIBILITY UTILITIES
// ============================================================================

/**
 * Detecta si un elemento está visible en viewport
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

/**
 * Observa cuando un elemento entra al viewport
 */
export function observeIntersection(
  element: HTMLElement,
  callback: (isIntersecting: boolean) => void,
  options?: IntersectionObserverInit
) {
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        callback(entry.isIntersecting)
      })
    },
    {
      threshold: 0.1,
      ...options,
    }
  )

  observer.observe(element)
  return () => observer.disconnect()
}

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Request animation frame wrapper
 */
export function raf(callback: () => void): number {
  return requestAnimationFrame(callback)
}

/**
 * Debounce para scroll/resize handlers
 */
export function rafDebounce<T extends (...args: any[]) => void>(fn: T): T {
  let rafId: number | null = null

  return ((...args: any[]) => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
    }

    rafId = requestAnimationFrame(() => {
      fn(...args)
      rafId = null
    })
  }) as T
}

// ============================================================================
// MOBILE-SPECIFIC UTILITIES
// ============================================================================

/**
 * Detecta si es dispositivo táctil
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

/**
 * Previene bounce en iOS durante scroll
 */
export function preventBounce(element: HTMLElement) {
  let startY = 0

  element.addEventListener('touchstart', e => {
    startY = e.touches[0].pageY
  })

  element.addEventListener('touchmove', e => {
    const y = e.touches[0].pageY
    const scrollTop = element.scrollTop
    const scrollHeight = element.scrollHeight
    const height = element.clientHeight
    const isAtTop = startY <= y && scrollTop === 0
    const isAtBottom = startY >= y && scrollTop + height >= scrollHeight

    if (isAtTop || isAtBottom) {
      e.preventDefault()
    }
  })
}

// ============================================================================
// CUSTOM KEYFRAMES (agregar a tailwind.config.js)
// ============================================================================

/**
 * Keyframes personalizados para agregar a tailwind.config.js:
 *
 * ```js
 * module.exports = {
 *   theme: {
 *     extend: {
 *       keyframes: {
 *         shake: {
 *           '0%, 100%': { transform: 'translateX(0)' },
 *           '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
 *           '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' },
 *         },
 *       },
 *     },
 *   },
 * }
 * ```
 */

export const customKeyframes = {
  shake: {
    '0%, 100%': { transform: 'translateX(0)' },
    '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-2px)' },
    '20%, 40%, 60%, 80%': { transform: 'translateX(2px)' },
  },
  slideInRight: {
    '0%': { transform: 'translateX(100%)', opacity: '0' },
    '100%': { transform: 'translateX(0)', opacity: '1' },
  },
  slideOutRight: {
    '0%': { transform: 'translateX(0)', opacity: '1' },
    '100%': { transform: 'translateX(100%)', opacity: '0' },
  },
} as const
