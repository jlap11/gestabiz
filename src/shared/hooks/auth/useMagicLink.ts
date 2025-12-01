import { useState } from 'react'

export interface MagicLinkState {
  magicLinkEmail: string
}

export interface MagicLinkActions {
  setMagicLinkEmail: (email: string) => void
  handleMagicLinkSend: (sendFunction: (email: string) => Promise<void>) => Promise<void>
}

/**
 * Hook for Magic Link authentication (DEV ONLY)
 * TODO: REMOVE BEFORE PRODUCTION
 */
export function useMagicLink(): MagicLinkState & MagicLinkActions {
  const [magicLinkEmail, setMagicLinkEmail] = useState('')

  const handleMagicLinkSend = async (sendFunction: (email: string) => Promise<void>) => {
    if (!magicLinkEmail || !magicLinkEmail.includes('@')) {
      throw new Error('Por favor ingresa un email válido')
    }

    await sendFunction(magicLinkEmail)
    setMagicLinkEmail('') // Clear after send
  }

  return {
    // State
    magicLinkEmail,
    // Actions
    setMagicLinkEmail,
    handleMagicLinkSend
  }
}
