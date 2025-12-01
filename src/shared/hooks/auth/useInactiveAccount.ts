import { useState } from 'react'

export interface InactiveAccountState {
  showInactiveModal: boolean
  inactiveEmail: string
}

export interface InactiveAccountActions {
  showInactiveAccountModal: (email: string) => void
  closeInactiveModal: () => void
  handleReactivate: (reactivateFunction: (email: string) => Promise<void>) => Promise<void>
}

export function useInactiveAccount(): InactiveAccountState & InactiveAccountActions {
  const [showInactiveModal, setShowInactiveModal] = useState(false)
  const [inactiveEmail, setInactiveEmail] = useState('')

  const showInactiveAccountModal = (email: string) => {
    setInactiveEmail(email)
    setShowInactiveModal(true)
  }

  const closeInactiveModal = () => {
    setShowInactiveModal(false)
    setInactiveEmail('')
  }

  const handleReactivate = async (reactivateFunction: (email: string) => Promise<void>) => {
    await reactivateFunction(inactiveEmail)
    closeInactiveModal()
  }

  return {
    // State
    showInactiveModal,
    inactiveEmail,
    // Actions
    showInactiveAccountModal,
    closeInactiveModal,
    handleReactivate
  }
}
