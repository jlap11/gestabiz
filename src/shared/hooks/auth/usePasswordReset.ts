import { useState } from 'react'

export interface PasswordResetState {
  showResetForm: boolean
  resetEmail: string
  isResettingPassword: boolean
}

export interface PasswordResetActions {
  openResetForm: () => void
  closeResetForm: () => void
  setResetEmail: (email: string) => void
  handlePasswordReset: (resetFunction: (email: string) => Promise<void>) => Promise<void>
}

export function usePasswordReset(): PasswordResetState & PasswordResetActions {
  const [showResetForm, setShowResetForm] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [isResettingPassword, setIsResettingPassword] = useState(false)

  const openResetForm = () => {
    setShowResetForm(true)
  }

  const closeResetForm = () => {
    setShowResetForm(false)
    setResetEmail('')
  }

  const handlePasswordReset = async (resetFunction: (email: string) => Promise<void>) => {
    if (!resetEmail || !resetEmail.includes('@')) {
      throw new Error('Por favor ingresa un email válido')
    }

    setIsResettingPassword(true)
    try {
      await resetFunction(resetEmail)
      closeResetForm()
    } finally {
      setIsResettingPassword(false)
    }
  }

  return {
    // State
    showResetForm,
    resetEmail,
    isResettingPassword,
    // Actions
    openResetForm,
    closeResetForm,
    setResetEmail,
    handlePasswordReset
  }
}
