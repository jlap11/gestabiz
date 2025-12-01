/**
 * Authentication Hooks Module
 * 
 * Centralizes all authentication-related business logic in reusable hooks.
 * These hooks are platform-agnostic and can be used in both web and mobile.
 */

export { useAuthForm } from './useAuthForm'
export type { AuthFormData, AuthFormState, AuthFormActions } from './useAuthForm'

export { usePasswordReset } from './usePasswordReset'
export type { PasswordResetState, PasswordResetActions } from './usePasswordReset'

export { useMagicLink } from './useMagicLink'
export type { MagicLinkState, MagicLinkActions } from './useMagicLink'

export { useInactiveAccount } from './useInactiveAccount'
export type { InactiveAccountState, InactiveAccountActions } from './useInactiveAccount'

export { useAuthRedirect } from './useAuthRedirect'
export type { RedirectParams, AuthRedirectActions } from './useAuthRedirect'

export { validateAuthForm, getAuthErrorMessage } from './authValidation'
export type { AuthValidation } from './authValidation'
