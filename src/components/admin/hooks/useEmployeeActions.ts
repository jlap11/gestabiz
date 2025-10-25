import { useState } from 'react'
import { useKV } from '@/hooks/useKV'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'

interface EmployeeRequest {
  id: string
  user_id: string
  user_name: string
  user_email: string
  user_avatar?: string
  business_id: string
  requested_at: string
  message?: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by?: string
  reviewed_at?: string
  rejection_reason?: string
}

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  phone?: string
  created_at: string
  status: 'active' | 'inactive'
}

export function useEmployeeActions() {
  const { getValue, setValue } = useKV()
  const { t } = useLanguage()
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectionDialog, setShowRejectionDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<EmployeeRequest | null>(null)

  const loadUsers = async () => {
    try {
      const usersData = await getValue('users')
      if (usersData) {
        setUsers(JSON.parse(usersData))
      }
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const updateUsers = async (newUsers: User[]) => {
    try {
      await setValue('users', JSON.stringify(newUsers))
      setUsers(newUsers)
    } catch (error) {
      console.error('Error updating users:', error)
    }
  }

  const handleApproveEmployee = async (request: EmployeeRequest, updateRequestCallback: (id: string, updates: Partial<EmployeeRequest>) => Promise<void>) => {
    try {
      // Actualizar la solicitud como aprobada
      await updateRequestCallback(request.id, {
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'admin' // En una implementación real, sería el ID del admin actual
      })

      // Agregar el usuario a la lista de empleados
      const newUser: User = {
        id: request.user_id,
        name: request.user_name,
        email: request.user_email,
        avatar: request.user_avatar,
        created_at: new Date().toISOString(),
        status: 'active'
      }

      const updatedUsers = [...users, newUser]
      await updateUsers(updatedUsers)

      toast.success(t('employee.approvedSuccessfully', { name: request.user_name }))
    } catch (error) {
      console.error('Error approving employee:', error)
      toast.error(t('employee.errorApproving'))
    }
  }

  const handleRejectEmployee = (request: EmployeeRequest) => {
    setSelectedRequest(request)
    setShowRejectionDialog(true)
  }

  const handleConfirmReject = async (updateRequestCallback: (id: string, updates: Partial<EmployeeRequest>) => Promise<void>) => {
    if (!selectedRequest) return

    try {
      await updateRequestCallback(selectedRequest.id, {
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: 'admin', // En una implementación real, sería el ID del admin actual
        rejection_reason: rejectionReason
      })

      toast.success(t('employee.rejectedSuccessfully', { name: selectedRequest.user_name }))
      
      // Limpiar estado
      setShowRejectionDialog(false)
      setSelectedRequest(null)
      setRejectionReason('')
    } catch (error) {
      console.error('Error rejecting employee:', error)
      toast.error(t('employee.errorRejecting'))
    }
  }

  const handleRemoveEmployee = async (user: User) => {
    try {
      const updatedUsers = users.filter(u => u.id !== user.id)
      await updateUsers(updatedUsers)
      toast.success(t('employee.removedSuccessfully', { name: user.name }))
    } catch (error) {
      console.error('Error removing employee:', error)
      toast.error(t('employee.errorRemoving'))
    }
  }

  const closeRejectionDialog = () => {
    setShowRejectionDialog(false)
    setSelectedRequest(null)
    setRejectionReason('')
  }

  return {
    users,
    searchTerm,
    rejectionReason,
    showRejectionDialog,
    selectedRequest,
    setSearchTerm,
    setRejectionReason,
    loadUsers,
    handleApproveEmployee,
    handleRejectEmployee,
    handleConfirmReject,
    handleRemoveEmployee,
    closeRejectionDialog
  }
}