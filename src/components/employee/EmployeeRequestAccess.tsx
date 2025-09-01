import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building, UserPlus, MagnifyingGlass as Search, MapPin } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { useKV } from '@/lib/useKV'
import { useLanguage } from '@/contexts/LanguageContext'
import { User, Business } from '@/types'

interface EmployeeRequest {
  id: string
  user_id: string
  user_name: string
  user_email: string
  user_avatar?: string
  business_id: string
  business_name: string
  requested_at: string
  message?: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by?: string
  reviewed_at?: string
  rejection_reason?: string
}

interface EmployeeRequestAccessProps {
  user: User
  open: boolean
  onClose: () => void
}

export default function EmployeeRequestAccess({ user, open, onClose }: EmployeeRequestAccessProps) {
  const { t } = useLanguage()
  const [businesses] = useKV<Business[]>('businesses', [])
  const [employeeRequests, setEmployeeRequests] = useKV<EmployeeRequest[]>(`employee-requests-all`, [])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [message, setMessage] = useState('')
  const [step, setStep] = useState<'search' | 'request'>('search')

  // Filter businesses based on search term
  const filteredBusinesses = businesses.filter(business =>
    business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (business.city?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (business.address?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  // Check if user already has a pending request for a business
  const hasPendingRequest = (businessId: string) => {
    return employeeRequests.some(req => 
      req.user_id === user.id && 
      req.business_id === businessId && 
      req.status === 'pending'
    )
  }

  const handleSelectBusiness = (business: Business) => {
    setSelectedBusiness(business)
    setStep('request')
  }

  const handleSubmitRequest = async () => {
    if (!selectedBusiness) return

    setIsLoading(true)
    try {
      // Check if user already has a pending request
      if (hasPendingRequest(selectedBusiness.id)) {
        toast.error(t('employee.alreadyRequested'))
        return
      }

      const newRequest: EmployeeRequest = {
        id: `request-${Date.now()}`,
        user_id: user.id,
  user_name: user.name,
        user_email: user.email,
        user_avatar: user.avatar_url,
        business_id: selectedBusiness.id,
        business_name: selectedBusiness.name,
        requested_at: new Date().toISOString(),
        message: message.trim(),
        status: 'pending'
      }

      // Add to global requests and business-specific requests
  const updatedRequests = [...employeeRequests, newRequest]
  const key = `employee-requests-${selectedBusiness.id}`
  const businessRequestsRaw = localStorage.getItem(key)
  const businessRequests = businessRequestsRaw ? JSON.parse(businessRequestsRaw) as EmployeeRequest[] : []
  const updatedBusinessRequests = [...businessRequests, newRequest]

  setEmployeeRequests(updatedRequests)
  localStorage.setItem(key, JSON.stringify(updatedBusinessRequests))

      toast.success(t('employee.requestSubmitted'))
      onClose()
      setStep('search')
      setSelectedBusiness(null)
      setMessage('')
      setSearchTerm('')
    } catch (error) {
      toast.error(t('employee.requestError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    setStep('search')
    setSelectedBusiness(null)
    setMessage('')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            {step === 'search' ? t('employee.findBusiness') : t('employee.requestToJoin')}
          </DialogTitle>
          <DialogDescription>
            {step === 'search' 
              ? t('employee.findBusinessDescription')
              : t('employee.requestToJoinDescription', { businessName: selectedBusiness?.name || '' })
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'search' && (
          <div className="space-y-4">
            {/* Search Input */}
            <div className="space-y-2">
              <Label htmlFor="business-search">{t('employee.searchBusinesses')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="business-search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('employee.searchPlaceholder')}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Business List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {searchTerm.length >= 2 ? (
                filteredBusinesses.length > 0 ? (
                  filteredBusinesses.map((business) => (
                    <Card 
                      key={business.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleSelectBusiness(business)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Building className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium">{business.name}</h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <MapPin className="w-3 h-3" />
                                {business.city}, {business.state || business.country}
                              </div>
                              {business.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {business.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {hasPendingRequest(business.id) ? (
                              <div className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                                {t('employee.pending')}
                              </div>
                            ) : (
                              <Button size="sm" variant="outline">
                                {t('employee.select')}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t('employee.noBusinessesFound')}</p>
                  </div>
                )
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t('employee.typeToSearch')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'request' && selectedBusiness && (
          <div className="space-y-4">
            {/* Selected Business Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{selectedBusiness.name}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {selectedBusiness.address}, {selectedBusiness.city}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="request-message">{t('employee.requestMessage')}</Label>
              <Textarea
                id="request-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('employee.requestMessagePlaceholder')}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {t('employee.requestMessageNote')}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                {t('action.back')}
              </Button>
              <Button 
                onClick={handleSubmitRequest} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? t('employee.submitting') : t('employee.submitRequest')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}