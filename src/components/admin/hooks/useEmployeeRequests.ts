import { useState, useEffect } from 'react'
import { useKV } from '@/hooks/useKV'

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

export function useEmployeeRequests() {
  const { getValue, setValue } = useKV()
  const [employeeRequests, setEmployeeRequests] = useState<EmployeeRequest[]>([])

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const requests = await getValue('employee_requests')
        if (requests) {
          setEmployeeRequests(JSON.parse(requests))
        }
      } catch (error) {
        console.error('Error loading employee requests:', error)
      }
    }

    loadRequests()
  }, [getValue])

  const updateRequests = async (newRequests: EmployeeRequest[]) => {
    try {
      await setValue('employee_requests', JSON.stringify(newRequests))
      setEmployeeRequests(newRequests)
    } catch (error) {
      console.error('Error updating employee requests:', error)
    }
  }

  const addRequest = async (request: EmployeeRequest) => {
    const newRequests = [...employeeRequests, request]
    await updateRequests(newRequests)
  }

  const updateRequest = async (requestId: string, updates: Partial<EmployeeRequest>) => {
    const newRequests = employeeRequests.map(request =>
      request.id === requestId ? { ...request, ...updates } : request
    )
    await updateRequests(newRequests)
  }

  const removeRequest = async (requestId: string) => {
    const newRequests = employeeRequests.filter(request => request.id !== requestId)
    await updateRequests(newRequests)
  }

  const getPendingRequests = () => {
    return employeeRequests.filter(request => request.status === 'pending')
  }

  return {
    employeeRequests,
    addRequest,
    updateRequest,
    removeRequest,
    getPendingRequests,
    setEmployeeRequests: updateRequests
  }
}