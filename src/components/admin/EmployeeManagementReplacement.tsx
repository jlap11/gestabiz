import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  UserPlus, 
  Users, 
  Building,
  EnvelopeSimple as Mail,
  Phone
} from '@phosphor-icons/react'
import { useKV } from '@/lib/useKV'
import { useLanguage } from '@/contexts/LanguageContext'
import { User, Business } from '@/types'
import EmployeeRequests from '@/components/employee/EmployeeRequests'

interface EmployeeManagementProps {
  user: User
}

export default function EmployeeManagement({ user }: EmployeeManagementProps) {
  const { t } = useLanguage()
  const [users] = useKV<User[]>('users', [])
  const [businesses] = useKV<Business[]>('businesses', [])
  const [activeTab, setActiveTab] = useState('requests')

  // Find user's business
  const userBusiness = businesses.find(b => b.owner_id === user.id || b.id === user.business_id)

  // Get business employees (approved users)
  const businessEmployees = users.filter(u => 
    u.business_id === userBusiness?.id && 
    u.role === 'employee' && 
    u.is_active !== false
  )

  if (!userBusiness) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('employee.title')}</h3>
          <p className="text-muted-foreground">
            {t('business.registerPromptDescription')}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('employee.title')}</h2>
          <p className="text-muted-foreground">
            {t('employee.description')}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            {t('employee.requests')}
          </TabsTrigger>
          <TabsTrigger value="current" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('employee.current')} ({businessEmployees.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <EmployeeRequests business={userBusiness} user={user} />
        </TabsContent>

        <TabsContent value="current">
          <EmployeeList employees={businessEmployees} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Employee List Component
function EmployeeList({ employees }: { employees: User[] }) {
  const { t } = useLanguage()

  if (employees.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('employee.noEmployees')}</h3>
          <p className="text-muted-foreground">
            {t('employee.currentEmployeesDescription')}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('employee.currentEmployees')}</CardTitle>
        <CardDescription>
          {t('employee.currentEmployeesDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {employees.map((employee) => (
            <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={employee.avatar_url} alt={employee.name} />
                  <AvatarFallback>
                    {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">{employee.name}</h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {employee.email}
                    </span>
                    {employee.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {employee.phone}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">
                      {t(`role.${employee.role}`)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {t('employee.joinDate')}: {new Date(employee.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={employee.is_active !== false ? 'default' : 'secondary'}>
                  {employee.is_active !== false ? t('employee.active') : t('employee.inactive')}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}