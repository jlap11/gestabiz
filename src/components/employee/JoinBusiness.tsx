import { useState, useEffect } from 'react'
import { useKV } from '@/lib/useKV'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Building, MagnifyingGlass as Search, MapPin, Clock } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Business, User, EmployeeRequest } from '@/types'
import { useLanguage } from '@/contexts/LanguageContext'
import { v4 as uuidv4 } from 'uuid'

interface JoinBusinessProps {
  user: User
  onRequestSent: () => void
}

export default function JoinBusiness({ user, onRequestSent }: JoinBusinessProps) {
  const { t } = useLanguage()
  const [businesses, setBusinesses] = useKV<Business[]>('businesses', [])
  const [employeeRequests, setEmployeeRequests] = useKV<EmployeeRequest[]>('employee-requests', [])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter out businesses where user is already owner or has requested to join
  const availableBusinesses = businesses.filter(business => {
    if (business.owner_id === user.id) return false
    
    const hasExistingRequest = employeeRequests.some(request => 
      request.business_id === business.id && 
      request.user_id === user.id && 
      (request.status === 'pending' || request.status === 'approved')
    )
    
    return !hasExistingRequest
  })

  const filteredBusinesses = availableBusinesses.filter(business =>
    business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    business.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    business.city?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelectBusiness = (business: Business) => {
    setSelectedBusiness(business)
  }

  const handleSubmitRequest = async () => {
    if (!selectedBusiness) return

    setIsSubmitting(true)

    try {
      const newRequest: EmployeeRequest = {
        id: uuidv4(),
        user_id: user.id,
        business_id: selectedBusiness.id,
        message: message.trim(),
        status: 'pending',
        created_at: new Date().toISOString()
      }

      await setEmployeeRequests(prev => [...prev, newRequest])
      
      toast.success(t('employee.join.request_sent_success'))
      setSelectedBusiness(null)
      setMessage('')
      onRequestSent()
    } catch (error) {
      toast.error(t('employee.join.request_error'))
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const getBusinessHours = (business: Business) => {
    const today = new Date().getDay() // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const currentDay = dayNames[today] as keyof Business['business_hours']
    
    const hours = business.business_hours[currentDay]
    
    if (hours.closed) {
      return t('business.hours.closed')
    }
    
    return `${hours.open} - ${hours.close}`
  }

  const hasExistingRequest = (businessId: string) => {
    return employeeRequests.some(request => 
      request.business_id === businessId && 
      request.user_id === user.id
    )
  }

  const getRequestStatus = (businessId: string) => {
    const request = employeeRequests.find(request => 
      request.business_id === businessId && 
      request.user_id === user.id
    )
    return request?.status
  }

  return (
    <div className="space-y-6">
      {!selectedBusiness ? (
        <>
          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                {t('employee.join.title')}
              </CardTitle>
              <CardDescription>
                {t('employee.join.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('employee.join.search_placeholder')}
                  className="flex-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Business List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBusinesses.map((business) => {
              const requestStatus = getRequestStatus(business.id)
              
              return (
                <Card key={business.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{business.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {t(`business.categories.${business.category}`)}
                          </Badge>
                        </div>
                        {requestStatus && (
                          <Badge 
                            variant={requestStatus === 'pending' ? 'outline' : requestStatus === 'approved' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {t(`employee.requests.status.${requestStatus}`)}
                          </Badge>
                        )}
                      </div>

                      {business.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {business.description}
                        </p>
                      )}

                      <div className="space-y-2 text-sm text-muted-foreground">
                        {business.city && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{business.city}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{getBusinessHours(business)}</span>
                        </div>
                      </div>

                      {!requestStatus && (
                        <Button 
                          onClick={() => handleSelectBusiness(business)}
                          className="w-full mt-4"
                          size="sm"
                        >
                          {t('employee.join.request_to_join')}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredBusinesses.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? t('employee.join.no_results_title') : t('employee.join.no_businesses_title')}
                </h3>
                <p className="text-muted-foreground">
                  {searchTerm ? t('employee.join.no_results_description') : t('employee.join.no_businesses_description')}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        /* Request Form */
        <Card>
          <CardHeader>
            <CardTitle>{t('employee.join.request_form_title')}</CardTitle>
            <CardDescription>
              {t('employee.join.request_form_description', { businessName: selectedBusiness.name })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Selected Business Info */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">{selectedBusiness.name}</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {t(`business.categories.${selectedBusiness.category}`)}
                  </Badge>
                </div>
                {selectedBusiness.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedBusiness.city}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{getBusinessHours(selectedBusiness)}</span>
                </div>
              </div>
              {selectedBusiness.description && (
                <p className="text-sm mt-2">{selectedBusiness.description}</p>
              )}
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">
                {t('employee.join.message_label')}
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('employee.join.message_placeholder')}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {t('employee.join.message_hint')}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setSelectedBusiness(null)}
                disabled={isSubmitting}
              >
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleSubmitRequest}
                disabled={isSubmitting}
              >
                {isSubmitting ? t('employee.join.sending') : t('employee.join.send_request')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}