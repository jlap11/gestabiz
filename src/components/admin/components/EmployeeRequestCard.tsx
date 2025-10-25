import React from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Check, X } from '@phosphor-icons/react'
import { useLanguage } from '@/contexts/LanguageContext'

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

interface EmployeeRequestCardProps {
  request: EmployeeRequest
  onApprove: (request: EmployeeRequest) => void
  onReject: (request: EmployeeRequest) => void
}

export function EmployeeRequestCard({ request, onApprove, onReject }: EmployeeRequestCardProps) {
  const { t } = useLanguage()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4 sm:gap-0"
      role="listitem"
    >
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <Avatar>
          <AvatarImage src={request.user_avatar} alt={request.user_name} />
          <AvatarFallback>{getInitials(request.user_name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 sm:flex-none">
          <h4 className="font-medium text-sm sm:text-base">{request.user_name}</h4>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="w-3 h-3 inline-block" aria-hidden="true">@</span>
            {request.user_email}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('employee.requestedOn')} {formatDate(request.requested_at)}
          </p>
          {request.message && (
            <p className="text-sm mt-2 p-2 bg-muted rounded text-muted-foreground">
              "{request.message}"
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <Button
          size="sm"
          onClick={() => onApprove(request)}
          className="bg-green-600 hover:bg-green-700 min-h-[44px] min-w-[44px] flex-1 sm:flex-none text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label={`${t('employee.approve')} ${request.user_name}`}
          title={`${t('employee.approve')} ${request.user_name}`}
        >
          <Check className="w-4 h-4 mr-2" aria-hidden="true" />
          {t('employee.approve')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onReject(request)}
          className="border-red-200 text-red-600 hover:bg-red-50 min-h-[44px] min-w-[44px] flex-1 sm:flex-none text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label={`${t('employee.reject')} ${request.user_name}`}
          title={`${t('employee.reject')} ${request.user_name}`}
          aria-haspopup="dialog"
          aria-controls="rejection-dialog"
        >
          <X className="w-4 h-4 mr-2" aria-hidden="true" />
          {t('employee.reject')}
        </Button>
      </div>
    </div>
  )
}