// =====================================================
// COMPONENT: PermissionsManager - Gestabiz
// Vista principal del módulo de gestión de permisos
// =====================================================

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePermissions } from '@/hooks/usePermissions-v2'
import { OwnerBadge, OwnerListBadge } from '@/components/ui/owner-badge'
import { 
  Shield, 
  Search, 
  UserPlus, 
  Edit, 
  Trash2, 
  Crown,
  Users,
  UserCheck,
  FileText,
  History,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// =====================================================
// INTERFACES
// =====================================================

interface PermissionsManagerProps {
  businessId: string
  ownerId: string
  currentUserId: string
}

interface UserWithRoles {
  id: string
  name: string
  email: string
  avatar_url?: string
  role: 'admin' | 'employee' | null
  employee_type?: 'service_provider' | 'support_staff'
  is_owner: boolean
  permissions_count: number
  is_active: boolean
  assigned_at: string
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function PermissionsManager({ 
  businessId, 
  ownerId, 
  currentUserId 
}: PermissionsManagerProps) {
  const { 
    businessRoles, 
    userPermissions,
    isOwner: currentUserIsOwner,
    checkPermission,
    isLoading,
  } = usePermissions({ 
    userId: currentUserId, 
    businessId, 
    ownerId 
  })

  // Estados
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'employee'>('all')
  const [activeTab, setActiveTab] = useState('users')

  // Verificar permisos
  const canManagePermissions = checkPermission('permissions.view').hasPermission

  // Datos simulados de usuarios (en producción vendrían de una query)
  const users: UserWithRoles[] = useMemo(() => {
    // Aquí iría la lógica para obtener usuarios del negocio
    // Por ahora retornamos datos de businessRoles
    return businessRoles.map(role => ({
      id: role.user_id,
      name: 'Usuario Ejemplo', // Obtener de profiles
      email: 'usuario@ejemplo.com',
      avatar_url: undefined,
      role: role.role,
      employee_type: role.employee_type,
      is_owner: role.user_id === ownerId,
      permissions_count: userPermissions.filter(p => p.user_id === role.user_id).length,
      is_active: role.is_active,
      assigned_at: role.assigned_at,
    }))
  }, [businessRoles, ownerId, userPermissions])

  // Filtrar usuarios
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // Filtro de búsqueda
      const matchesSearch = !searchQuery || 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())

      // Filtro de rol
      const matchesRole = roleFilter === 'all' || user.role === roleFilter

      return matchesSearch && matchesRole
    })
  }, [users, searchQuery, roleFilter])

  // Manejar selección de usuario
  const handleSelectUser = (user: UserWithRoles) => {
    // TODO: Abrir modal RoleAssignment o PermissionEditor
    console.log('Selected user:', user)
  }

  // Verificar si puede gestionar permisos
  if (!canManagePermissions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-destructive" />
            Acceso Denegado
          </CardTitle>
          <CardDescription>
            No tienes permisos para ver esta sección
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">
              Gestión de Permisos
            </h2>
            {currentUserIsOwner && (
              <OwnerBadge isOwner={true} variant="compact" />
            )}
          </div>
          <p className="text-muted-foreground">
            Administra roles, permisos y accesos de usuarios en tu negocio
          </p>
        </div>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Asignar Rol
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Shield className="h-4 w-4" />
            Permisos
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="h-4 w-4" />
            Plantillas
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <History className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        {/* Tab: Usuarios */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usuarios del Negocio</CardTitle>
              <CardDescription>
                {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''} 
                {roleFilter !== 'all' && ` con rol ${roleFilter}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros */}
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select 
                  value={roleFilter} 
                  onValueChange={(v: string) => setRoleFilter(v as 'all' | 'admin' | 'employee')}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    <SelectItem value="admin">Administradores</SelectItem>
                    <SelectItem value="employee">Empleados</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tabla de usuarios */}
              {isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  Cargando usuarios...
                </div>
              )}
              
              {!isLoading && filteredUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron usuarios
                </div>
              )}
              
              {!isLoading && filteredUsers.length > 0 && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Permisos</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar_url} />
                                <AvatarFallback>
                                  {user.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{user.name}</p>
                                  {user.is_owner && (
                                    <OwnerListBadge isOwner={true} />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role === 'admin' ? 'Admin' : 'Empleado'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.employee_type && (
                              <Badge variant="outline">
                                {user.employee_type === 'service_provider' 
                                  ? 'Presta servicios' 
                                  : 'Staff soporte'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {user.is_owner ? 'Todos' : user.permissions_count}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={user.is_active ? 'default' : 'destructive'}
                              className={cn(
                                user.is_active && 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
                              )}
                            >
                              {user.is_active ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSelectUser(user)}
                                disabled={user.is_owner && user.id !== currentUserId}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {!user.is_owner && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Usuarios
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-xs text-muted-foreground">
                  Activos en el negocio
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Administradores
                </CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.role === 'admin').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Con permisos elevados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Empleados
                </CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.role === 'employee').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Trabajando activamente
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Permisos (Placeholder) */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Editor de Permisos</CardTitle>
              <CardDescription>
                Gestiona permisos individuales por usuario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Componente PermissionEditor en desarrollo...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Plantillas (Placeholder) */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Plantillas de Permisos</CardTitle>
              <CardDescription>
                Plantillas predefinidas y personalizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Componente PermissionTemplates en desarrollo...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Historial (Placeholder) */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Cambios</CardTitle>
              <CardDescription>
                Auditoría de modificaciones en permisos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Componente AuditLog en desarrollo...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PermissionsManager
