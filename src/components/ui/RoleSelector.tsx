import { useState } from 'react'
import { ChevronDown, Briefcase, Users, ShoppingCart } from 'lucide-react'
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

interface RoleSelectorProps {
  roles: UserRoleAssignment[]
  activeRole: UserRole
  activeBusiness?: { id: string; name: string }
  onRoleChange: (role: UserRole, businessId?: string) => void
  className?: string
}

const ROLE_CONFIG: Record<UserRole, { label: string; icon: typeof Briefcase; color: string }> = {
  admin: {
    label: 'Administrador',
    icon: Briefcase,
    color: 'text-violet-500',
  },
  employee: {
    label: 'Empleado',
    icon: Users,
    color: 'text-blue-500',
  },
  client: {
    label: 'Cliente',
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

  const activeRoleConfig = ROLE_CONFIG[activeRole]
  const ActiveIcon = activeRoleConfig.icon

  // Group roles by type
  const adminRoles = roles.filter(r => r.role === 'admin')
  const employeeRoles = roles.filter(r => r.role === 'employee')
  const clientRoles = roles.filter(r => r.role === 'client')

  console.log('[RoleSelector] Render - roles:', roles)
  console.log('[RoleSelector] Render - activeRole:', activeRole)
  console.log('[RoleSelector] Render - adminRoles:', adminRoles.length, 'employeeRoles:', employeeRoles.length, 'clientRoles:', clientRoles.length)

  const handleRoleSelect = (roleAssignment: UserRoleAssignment) => {
    console.log('[RoleSelector] handleRoleSelect called with:', roleAssignment)
    console.log('[RoleSelector] Calling onRoleChange with:', roleAssignment.role, roleAssignment.business_id || undefined)
    onRoleChange(roleAssignment.role, roleAssignment.business_id || undefined)
    setIsOpen(false)
  }

  return (
    <DropdownMenu 
      open={isOpen} 
      onOpenChange={(open) => {
        console.log('[RoleSelector] Dropdown state changed:', open)
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
        <DropdownMenuLabel>Cambiar Rol</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Admin Roles */}
        <>
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2">
            Como Administrador
          </DropdownMenuLabel>
          {adminRoles.length > 0 ? (
            adminRoles.map((roleAssignment) => {
              const Icon = ROLE_CONFIG.admin.icon
              const isActive = activeRole === 'admin' && activeBusiness?.id === roleAssignment.business_id
              
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
                    <span className="text-sm font-medium">Admin</span>
                    <span className="text-xs text-muted-foreground">
                      {roleAssignment.business_name}
                    </span>
                  </div>
                  {isActive && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
              )
            })
          ) : (
            <DropdownMenuItem
              onClick={() => {
                console.log('[RoleSelector] Direct onClick - Switching to admin (create business)')
                onRoleChange('admin', undefined)
                setIsOpen(false)
              }}
              className="flex items-center gap-3 cursor-pointer"
            >
              <Briefcase className={cn('h-4 w-4', ROLE_CONFIG.admin.color)} />
              <div className="flex flex-col flex-1">
                <span className="text-sm font-medium">Admin</span>
                <span className="text-xs text-muted-foreground">
                  Crear negocio
                </span>
              </div>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
        </>

        {/* Employee Roles */}
        <>
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2">
            Como Empleado
          </DropdownMenuLabel>
          {employeeRoles.length > 0 ? (
            employeeRoles.map((roleAssignment) => {
              const Icon = ROLE_CONFIG.employee.icon
              const isActive = activeRole === 'employee' && activeBusiness?.id === roleAssignment.business_id
              
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
                    <span className="text-sm font-medium">Empleado</span>
                    <span className="text-xs text-muted-foreground">
                      {roleAssignment.business_name}
                    </span>
                  </div>
                  {isActive && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
              )
            })
          ) : (
            <DropdownMenuItem
              onClick={() => {
                console.log('[RoleSelector] Direct onClick - Switching to employee (join business)')
                onRoleChange('employee', undefined)
                setIsOpen(false)
              }}
              className="flex items-center gap-3 cursor-pointer"
            >
              <Users className={cn('h-4 w-4', ROLE_CONFIG.employee.color)} />
              <div className="flex flex-col flex-1">
                <span className="text-sm font-medium">Empleado</span>
                <span className="text-xs text-muted-foreground">
                  Unirse a negocio
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
              Como Cliente
            </DropdownMenuLabel>
            {clientRoles.map((roleAssignment) => {
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
                    <span className="text-sm font-medium">Cliente</span>
                    <span className="text-xs text-muted-foreground">
                      Reservar servicios
                    </span>
                  </div>
                  {isActive && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
              )
            })}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
