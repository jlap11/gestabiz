/**
 * Accessibility Utilities - ARIA labels, roles, keyboard shortcuts
 * 
 * Utilidades para mejorar la accesibilidad de la aplicación:
 * - ARIA attributes helpers
 * - Keyboard event handlers
 * - Focus management
 * - Screen reader announcements
 * 
 * @author AppointSync Pro Team
 * @version 1.0.0
 * @date 2025-10-13
 */

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

export const KEYBOARD_SHORTCUTS = {
  // Navigation
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  TAB: 'Tab',
  SPACE: ' ',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  
  // Editing
  BACKSPACE: 'Backspace',
  DELETE: 'Delete',
  
  // Modifiers
  CTRL_ENTER: 'ctrl+enter',
  SHIFT_TAB: 'shift+tab',
  CMD_K: 'cmd+k',
  CTRL_K: 'ctrl+k',
} as const;

/**
 * Check if keyboard event matches a shortcut
 */
export function isShortcut(
  event: KeyboardEvent | React.KeyboardEvent,
  shortcut: string
): boolean {
  const key = event.key;
  const ctrl = event.ctrlKey || event.metaKey;
  const shift = event.shiftKey;
  const alt = event.altKey;

  switch (shortcut) {
    case KEYBOARD_SHORTCUTS.ESCAPE:
      return key === 'Escape';
    case KEYBOARD_SHORTCUTS.ENTER:
      return key === 'Enter' && !ctrl && !shift;
    case KEYBOARD_SHORTCUTS.TAB:
      return key === 'Tab' && !shift;
    case KEYBOARD_SHORTCUTS.SHIFT_TAB:
      return key === 'Tab' && shift;
    case KEYBOARD_SHORTCUTS.SPACE:
      return key === ' ';
    case KEYBOARD_SHORTCUTS.CTRL_ENTER:
      return key === 'Enter' && ctrl;
    case KEYBOARD_SHORTCUTS.CMD_K:
    case KEYBOARD_SHORTCUTS.CTRL_K:
      return key === 'k' && ctrl;
    default:
      return false;
  }
}

// ============================================================================
// ARIA ATTRIBUTES
// ============================================================================

/**
 * Generate ARIA attributes for common patterns
 */
export const aria = {
  /**
   * Button role with label
   */
  button: (label: string, pressed?: boolean) => ({
    role: 'button',
    'aria-label': label,
    ...(pressed !== undefined && { 'aria-pressed': pressed }),
  }),

  /**
   * Link role with label
   */
  link: (label: string) => ({
    role: 'link',
    'aria-label': label,
  }),

  /**
   * Dialog/Modal
   */
  dialog: (labelledBy?: string, describedBy?: string) => ({
    role: 'dialog',
    'aria-modal': 'true',
    ...(labelledBy && { 'aria-labelledby': labelledBy }),
    ...(describedBy && { 'aria-describedby': describedBy }),
  }),

  /**
   * Listbox/Select
   */
  listbox: (label: string, expanded: boolean) => ({
    role: 'listbox',
    'aria-label': label,
    'aria-expanded': expanded,
  }),

  /**
   * Option in listbox
   */
  option: (label: string, selected: boolean) => ({
    role: 'option',
    'aria-label': label,
    'aria-selected': selected,
  }),

  /**
   * Tab panel
   */
  tab: (label: string, selected: boolean, controls: string) => ({
    role: 'tab',
    'aria-label': label,
    'aria-selected': selected,
    'aria-controls': controls,
  }),

  /**
   * Tab panel content
   */
  tabpanel: (labelledBy: string) => ({
    role: 'tabpanel',
    'aria-labelledby': labelledBy,
  }),

  /**
   * Alert/Notification
   */
  alert: (label?: string, live: 'polite' | 'assertive' = 'polite') => ({
    role: 'alert',
    'aria-live': live,
    ...(label && { 'aria-label': label }),
  }),

  /**
   * Status message
   */
  status: (label?: string) => ({
    role: 'status',
    'aria-live': 'polite',
    'aria-atomic': 'true',
    ...(label && { 'aria-label': label }),
  }),

  /**
   * Loading/Busy state
   */
  loading: (label = 'Cargando...') => ({
    role: 'status',
    'aria-live': 'polite',
    'aria-busy': 'true',
    'aria-label': label,
  }),

  /**
   * Hidden from screen readers
   */
  hidden: () => ({
    'aria-hidden': 'true',
  }),

  /**
   * Expanded/Collapsed state
   */
  expandable: (expanded: boolean, controls?: string) => ({
    'aria-expanded': expanded,
    ...(controls && { 'aria-controls': controls }),
  }),
};

// ============================================================================
// FOCUS MANAGEMENT
// ============================================================================

/**
 * Trap focus within an element (for modals/dialogs)
 */
export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  element.addEventListener('keydown', handleTab);

  // Focus first element
  firstElement?.focus();

  // Cleanup
  return () => {
    element.removeEventListener('keydown', handleTab);
  };
}

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  return Array.from(elements);
}

/**
 * Move focus to next/previous focusable element
 */
export function moveFocus(
  container: HTMLElement,
  direction: 'next' | 'previous'
): void {
  const elements = getFocusableElements(container);
  const currentIndex = elements.indexOf(document.activeElement as HTMLElement);

  if (currentIndex === -1) {
    elements[0]?.focus();
    return;
  }

  const nextIndex =
    direction === 'next'
      ? (currentIndex + 1) % elements.length
      : (currentIndex - 1 + elements.length) % elements.length;

  elements[nextIndex]?.focus();
}

// ============================================================================
// SCREEN READER ANNOUNCEMENTS
// ============================================================================

/**
 * Create a live region for screen reader announcements
 */
let liveRegion: HTMLDivElement | null = null;

function getLiveRegion(): HTMLDivElement {
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    document.body.appendChild(liveRegion);
  }
  return liveRegion;
}

/**
 * Announce a message to screen readers
 */
export function announce(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const region = getLiveRegion();
  region.setAttribute('aria-live', priority);
  
  // Clear previous message
  region.textContent = '';
  
  // Announce new message after short delay (allows screen reader to register change)
  setTimeout(() => {
    region.textContent = message;
  }, 100);
}

/**
 * Announce multiple messages in sequence
 */
export function announceSequence(
  messages: string[],
  delay = 1000
): void {
  messages.forEach((message, index) => {
    setTimeout(() => {
      announce(message);
    }, index * delay);
  });
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if element has accessible name
 */
export function hasAccessibleName(element: HTMLElement): boolean {
  return !!(
    element.getAttribute('aria-label') ||
    element.getAttribute('aria-labelledby') ||
    element.getAttribute('title') ||
    (element as HTMLInputElement).placeholder ||
    element.textContent?.trim()
  );
}

/**
 * Check if button has accessible label
 */
export function validateButton(button: HTMLElement): string[] {
  const errors: string[] = [];

  if (!hasAccessibleName(button)) {
    errors.push('Button missing accessible name (aria-label, aria-labelledby, or text content)');
  }

  if (button.getAttribute('role') === 'button' && !button.hasAttribute('tabindex')) {
    errors.push('Custom button missing tabindex');
  }

  return errors;
}

/**
 * Check if form input has label
 */
export function validateInput(input: HTMLInputElement): string[] {
  const errors: string[] = [];

  const label = document.querySelector(`label[for="${input.id}"]`);
  const ariaLabel = input.getAttribute('aria-label');
  const ariaLabelledby = input.getAttribute('aria-labelledby');

  if (!label && !ariaLabel && !ariaLabelledby) {
    errors.push('Input missing label (label[for], aria-label, or aria-labelledby)');
  }

  if (input.hasAttribute('required') && !input.hasAttribute('aria-required')) {
    errors.push('Required input missing aria-required');
  }

  if (input.hasAttribute('disabled') && !input.hasAttribute('aria-disabled')) {
    errors.push('Disabled input missing aria-disabled');
  }

  return errors;
}

// ============================================================================
// KEYBOARD NAVIGATION PATTERNS
// ============================================================================

/**
 * Handle arrow key navigation in a list
 */
export function handleListKeyboard(
  event: KeyboardEvent | React.KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number,
  onSelect: (index: number) => void
): void {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      onSelect((currentIndex + 1) % items.length);
      break;
    case 'ArrowUp':
      event.preventDefault();
      onSelect((currentIndex - 1 + items.length) % items.length);
      break;
    case 'Home':
      event.preventDefault();
      onSelect(0);
      break;
    case 'End':
      event.preventDefault();
      onSelect(items.length - 1);
      break;
    case 'Enter':
    case ' ':
      event.preventDefault();
      items[currentIndex]?.click();
      break;
  }
}

/**
 * Handle escape key to close modals/dropdowns
 */
export function handleEscapeKey(
  event: KeyboardEvent | React.KeyboardEvent,
  onClose: () => void
): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    onClose();
  }
}

// ============================================================================
// REDUCED MOTION
// ============================================================================

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get appropriate animation duration based on user preference
 */
export function getAnimationDuration(normalDuration: number): number {
  return prefersReducedMotion() ? 0 : normalDuration;
}

// ============================================================================
// EXPORTS
// ============================================================================

export type AriaRole = 
  | 'button' 
  | 'link' 
  | 'dialog' 
  | 'listbox' 
  | 'option' 
  | 'tab' 
  | 'tabpanel' 
  | 'alert' 
  | 'status';

export type LivePriority = 'polite' | 'assertive';
