import { useState } from 'react'
import { Briefcase, ChevronDown, ShoppingCart, Users } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { UserRole, UserRoleAssignment } from '@/types/types'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'

interface RoleSelectorProps {
  roles: UserRoleAssignment[]
  activeRole: UserRole
  activeBusiness?: { id: string; name: string }
  onRoleChange: (role: UserRole, businessId?: string) => void
  className?: string
}

const ROLE_CONFIG: Record<UserRole, { label: string; icon: typeof Briefcase; color: string }> = {
  admin: {
    label: 'Admin',
    icon: Briefcase,
    color: 'text-violet-500',
  },
  employee: {
    label: 'Employee',
    icon: Users,
    color: 'text-blue-500',
  },
  client: {
    label: 'Client',
    icon: ShoppingCart,
    color: 'text-emerald-500',
  },
}

export function RoleSelector({
  roles,
  activeRole,
  activeBusiness,
  onRoleChange,
  className,
}: Readonly<RoleSelectorProps>) {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useLanguage()

  const activeRoleConfig = ROLE_CONFIG[activeRole]
  const ActiveIcon = activeRoleConfig.icon

  // Group roles by type
  const adminRoles = roles.filter(r => r.role === 'admin')
  const employeeRoles = roles.filter(r => r.role === 'employee')
  const clientRoles = roles.filter(r => r.role === 'client')

  void logger.info('[RoleSelector] Render - roles', { component: 'RoleSelector', roles })
  void logger.info('[RoleSelector] Render - activeRole', { component: 'RoleSelector', activeRole })
  void logger.info('[RoleSelector] Render - counts', {
    component: 'RoleSelector',
    adminCount: adminRoles.length,
    employeeCount: employeeRoles.length,
    clientCount: clientRoles.length,
  })

  const handleRoleSelect = (roleAssignment: UserRoleAssignment) => {
    void logger.info('[RoleSelector] handleRoleSelect', {
      component: 'RoleSelector',
      roleAssignment,
    })
    void logger.info('[RoleSelector] onRoleChange', {
      component: 'RoleSelector',
      role: roleAssignment.role,
      businessId: roleAssignment.business_id || undefined,
    })
    onRoleChange(roleAssignment.role, roleAssignment.business_id || undefined)
    setIsOpen(false)
  }

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={open => {
        void logger.info('[RoleSelector] Dropdown state changed', {
          component: 'RoleSelector',
          open,
        })
        setIsOpen(open)
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'flex items-center justify-between gap-2 px-3 py-2 h-auto min-h-[44px]',
            'hover:bg-secondary/80 transition-colors',
            className
          )}
        >
          <div className="flex items-center gap-2">
            <ActiveIcon className={cn('h-4 w-4', activeRoleConfig.color)} />
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">{activeRoleConfig.label}</span>
              {activeBusiness && (
                <span className="text-xs text-muted-foreground">{activeBusiness.name}</span>
              )}
            </div>
          </div>
          <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>{t('roleSelector.label')}</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Admin Roles */}
        <>
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2">
            {t('roleSelector.admin')}
          </DropdownMenuLabel>
          {adminRoles.length > 0 ? (
            adminRoles.map(roleAssignment => {
              const Icon = ROLE_CONFIG.admin.icon
              const isActive =
                activeRole === 'admin' && activeBusiness?.id === roleAssignment.business_id

              return (
                <DropdownMenuItem
                  key={roleAssignment.id}
                  onClick={() => handleRoleSelect(roleAssignment)}
                  className={cn(
                    'flex items-center gap-3 cursor-pointer',
                    isActive && 'bg-secondary'
                  )}
                >
                  <Icon className={cn('h-4 w-4', ROLE_CONFIG.admin.color)} />
                  <div className="flex flex-col flex-1">
                    <span className="text-sm font-medium">{t('roleSelector.admin')}</span>
                    <span className="text-xs text-muted-foreground">
                      {roleAssignment.business_name}
                    </span>
                  </div>
                  {isActive && <div className="h-2 w-2 rounded-full bg-primary" />}
                </DropdownMenuItem>
              )
            })
          ) : (
            <DropdownMenuItem
              onClick={() => {
                void logger.info('[RoleSelector] Direct onClick - admin')
                onRoleChange('admin', undefined)
                setIsOpen(false)
              }}
              className="flex items-center gap-3 cursor-pointer"
            >
              <Briefcase className={cn('h-4 w-4', ROLE_CONFIG.admin.color)} />
              <div className="flex flex-col flex-1">
                <span className="text-sm font-medium">{t('roleSelector.admin')}</span>
                <span className="text-xs text-muted-foreground">
                  {t('roleSelector.createBusiness')}
                </span>
              </div>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
        </>

        {/* Employee Roles */}
        <>
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2">
            {t('roleSelector.employee')}
          </DropdownMenuLabel>
          {employeeRoles.length > 0 ? (
            employeeRoles.map(roleAssignment => {
              const Icon = ROLE_CONFIG.employee.icon
              const isActive =
                activeRole === 'employee' && activeBusiness?.id === roleAssignment.business_id

              return (
                <DropdownMenuItem
                  key={roleAssignment.id}
                  onClick={() => handleRoleSelect(roleAssignment)}
                  className={cn(
                    'flex items-center gap-3 cursor-pointer',
                    isActive && 'bg-secondary'
                  )}
                >
                  <Icon className={cn('h-4 w-4', ROLE_CONFIG.employee.color)} />
                  <div className="flex flex-col flex-1">
                    <span className="text-sm font-medium">{t('roleSelector.employee')}</span>
                    <span className="text-xs text-muted-foreground">
                      {roleAssignment.business_name}
                    </span>
                  </div>
                  {isActive && <div className="h-2 w-2 rounded-full bg-primary" />}
                </DropdownMenuItem>
              )
            })
          ) : (
            <DropdownMenuItem
              onClick={() => {
                void logger.info('[RoleSelector] Direct onClick - employee')
                onRoleChange('employee', undefined)
                setIsOpen(false)
              }}
              className="flex items-center gap-3 cursor-pointer"
            >
              <Users className={cn('h-4 w-4', ROLE_CONFIG.employee.color)} />
              <div className="flex flex-col flex-1">
                <span className="text-sm font-medium">{t('roleSelector.employee')}</span>
                <span className="text-xs text-muted-foreground">
                  {t('roleSelector.joinBusiness')}
                </span>
              </div>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
        </>

        {/* Client Role */}
        {clientRoles.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2">
              {t('roleSelector.client')}
            </DropdownMenuLabel>
            {clientRoles.map(roleAssignment => {
              const Icon = ROLE_CONFIG.client.icon
              const isActive = activeRole === 'client'

              return (
                <DropdownMenuItem
                  key={roleAssignment.id}
                  onClick={() => handleRoleSelect(roleAssignment)}
                  className={cn(
                    'flex items-center gap-3 cursor-pointer',
                    isActive && 'bg-secondary'
                  )}
                >
                  <Icon className={cn('h-4 w-4', ROLE_CONFIG.client.color)} />
                  <div className="flex flex-col flex-1">
                    <span className="text-sm font-medium">{t('roleSelector.client')}</span>
                    <span className="text-xs text-muted-foreground">
                      {t('roleSelector.bookServices')}
                    </span>
                  </div>
                  {isActive && <div className="h-2 w-2 rounded-full bg-primary" />}
                </DropdownMenuItem>
              )
            })}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
