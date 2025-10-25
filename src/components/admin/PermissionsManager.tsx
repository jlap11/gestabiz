// =====================================================
// COMPONENT: PermissionsManager - Gestabiz
// Vista principal del módulo de gestión de permisos
// =====================================================

import React, { useMemo, useState } from 'react'
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
import { useLanguage } from '@/contexts/LanguageContext'
import { usePermissions } from '@/hooks/usePermissions-v2'
import { OwnerBadge, OwnerListBadge } from '@/components/ui/owner-badge'
import {
  Crown,
  Edit,
  FileText,
  History,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
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
  currentUserId,
}: Readonly<PermissionsManagerProps>) {
  const { t } = useLanguage()
  const {
    businessRoles,
    userPermissions,
    isOwner: currentUserIsOwner,
    checkPermission,
    isLoading,
  } = usePermissions({
    userId: currentUserId,
    businessId,
    ownerId,
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
      const matchesSearch =
        !searchQuery ||
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())

      // Filtro de rol
      const matchesRole = roleFilter === 'all' || user.role === roleFilter

      return matchesSearch && matchesRole
    })
  }, [users, searchQuery, roleFilter])

  // Manejar selección de usuario
  const handleSelectUser = (user: UserWithRoles) => {
    console.log('Selected user:', user)
  }

  // Verificar si puede gestionar permisos
  if (!canManagePermissions) {
    return (
      <Card role="alert" className="focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-destructive" aria-hidden="true" />
            Acceso Denegado
          </CardTitle>
          <CardDescription>No tienes permisos para ver esta sección</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <main 
      role="main" 
      aria-labelledby="permissions-manager-title"
      className="space-y-6 max-w-[100vw] overflow-x-hidden"
    >
      <h1 id="permissions-manager-title" className="sr-only">
        Gestión de Permisos del Negocio
      </h1>
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 
              className="text-2xl sm:text-3xl font-bold tracking-tight"
              aria-describedby="permissions-manager-subtitle"
            >
              Gestión de Permisos
            </h2>
            {currentUserIsOwner && <OwnerBadge isOwner={true} variant="compact" />}
          </div>
          <p id="permissions-manager-subtitle" className="text-sm sm:text-base text-muted-foreground">
            Administra roles, permisos y accesos de usuarios en tu negocio
          </p>
        </div>
        <Button 
          className="gap-2 min-h-[44px] min-w-[44px] focus:ring-2 focus:ring-ring focus:ring-offset-2 w-full sm:w-auto"
          aria-label="Asignar nuevo rol a usuario"
          title="Asignar Rol"
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Asignar Rol</span>
        </Button>
      </header>

      {/* Tabs */}
      <section role="region" aria-labelledby="permissions-tabs-title">
        <h2 id="permissions-tabs-title" className="sr-only">
          Secciones de Gestión de Permisos
        </h2>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList 
            className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1"
            role="tablist"
            aria-label="Secciones de gestión de permisos"
          >
            <TabsTrigger 
              value="users" 
              className="gap-2 min-h-[44px] focus:ring-2 focus:ring-ring focus:ring-offset-2 text-xs sm:text-sm"
              role="tab"
              aria-selected={activeTab === 'users'}
              aria-controls="users-panel"
              id="users-tab"
            >
              <Users className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Usuarios</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
            <TabsTrigger 
              value="permissions" 
              className="gap-2 min-h-[44px] focus:ring-2 focus:ring-ring focus:ring-offset-2 text-xs sm:text-sm"
              role="tab"
              aria-selected={activeTab === 'permissions'}
              aria-controls="permissions-panel"
              id="permissions-tab"
            >
              <Shield className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Permisos</span>
              <span className="sm:hidden">Perms</span>
            </TabsTrigger>
            <TabsTrigger 
              value="templates" 
              className="gap-2 min-h-[44px] focus:ring-2 focus:ring-ring focus:ring-offset-2 text-xs sm:text-sm"
              role="tab"
              aria-selected={activeTab === 'templates'}
              aria-controls="templates-panel"
              id="templates-tab"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Plantillas</span>
              <span className="sm:hidden">Temps</span>
            </TabsTrigger>
            <TabsTrigger 
              value="audit" 
              className="gap-2 min-h-[44px] focus:ring-2 focus:ring-ring focus:ring-offset-2 text-xs sm:text-sm"
              role="tab"
              aria-selected={activeTab === 'audit'}
              aria-controls="audit-panel"
              id="audit-tab"
            >
              <History className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Historial</span>
              <span className="sm:hidden">Hist</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Usuarios */}
          <TabsContent 
            value="users" 
            className="space-y-4"
            role="tabpanel"
            aria-labelledby="users-tab"
            id="users-panel"
            tabIndex={0}
          >
            <Card className="focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Usuarios del Negocio</CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  <span aria-label={`${filteredUsers.length} usuarios encontrados`}>
                    {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''}
                  </span>
                  {roleFilter !== 'all' && ` con rol ${roleFilter}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-4 sm:p-6">
                {/* Filtros */}
                <section role="region" aria-labelledby="users-filters-title">
                  <h3 id="users-filters-title" className="sr-only">
                    Filtros de Usuarios
                  </h3>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <div className="flex-1 relative">
                      <Search 
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" 
                        aria-hidden="true"
                      />
                      <Input
                        placeholder="Buscar por nombre o email..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10 min-h-[44px] focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        aria-label="Buscar usuarios por nombre o email"
                        aria-describedby="search-description"
                      />
                      <p id="search-description" className="sr-only">
                        Escriba para filtrar usuarios por nombre o dirección de email
                      </p>
                    </div>
                    <Select
                      value={roleFilter}
                      onValueChange={(v: string) => setRoleFilter(v as 'all' | 'admin' | 'employee')}
                    >
                      <SelectTrigger 
                        className="w-full sm:w-[180px] min-h-[44px] focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        aria-label="Filtrar usuarios por rol"
                        aria-describedby="role-filter-description"
                      >
                        <SelectValue placeholder="Filtrar por rol" aria-label={`Rol seleccionado: ${roleFilter === 'all' ? 'Todos' : roleFilter}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los roles</SelectItem>
                        <SelectItem value="admin">Administradores</SelectItem>
                        <SelectItem value="employee">Empleados</SelectItem>
                      </SelectContent>
                    </Select>
                    <p id="role-filter-description" className="sr-only">
                      Seleccione un rol para filtrar la lista de usuarios
                    </p>
                  </div>
                </section>

                {/* Tabla de usuarios */}
                {isLoading && (
                  <div 
                    className="text-center py-8 text-muted-foreground"
                    role="status"
                    aria-label="Cargando lista de usuarios"
                  >
                    Cargando usuarios...
                  </div>
                )}

                {!isLoading && filteredUsers.length === 0 && (
                  <div 
                    className="text-center py-8 text-muted-foreground"
                    role="status"
                    aria-label="No se encontraron usuarios"
                  >
                    No se encontraron usuarios
                  </div>
                )}

                {!isLoading && filteredUsers.length > 0 && (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px]">Usuario</TableHead>
                          <TableHead className="min-w-[100px]">Rol</TableHead>
                          <TableHead className="min-w-[120px]">Tipo</TableHead>
                          <TableHead className="min-w-[100px]">Permisos</TableHead>
                          <TableHead className="min-w-[100px]">Estado</TableHead>
                          <TableHead className="text-right min-w-[120px]">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map(user => (
                          <TableRow key={user.id}>
                            <TableCell className="p-2 sm:p-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                  <AvatarImage src={user.avatar_url} />
                                  <AvatarFallback>
                                    {user.name.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-medium text-sm sm:text-base truncate">{user.name}</p>
                                    {user.is_owner && <OwnerListBadge isOwner={true} />}
                                  </div>
                                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{user.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="p-2 sm:p-4">
                              <Badge 
                                variant={user.role === 'admin' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {user.role === 'admin' ? 'Admin' : 'Empleado'}
                              </Badge>
                            </TableCell>
                            <TableCell className="p-2 sm:p-4">
                              {user.employee_type && (
                                <Badge variant="outline" className="text-xs">
                                  {user.employee_type === 'service_provider'
                                    ? 'Presta servicios'
                                    : 'Staff soporte'}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="p-2 sm:p-4">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                                <span 
                                  className="text-sm"
                                  aria-label={`${user.is_owner ? 'Todos los permisos' : `${user.permissions_count} permisos asignados`}`}
                                >
                                  {user.is_owner ? 'Todos' : user.permissions_count}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="p-2 sm:p-4">
                              <Badge
                                variant={user.is_active ? 'default' : 'destructive'}
                                className={cn(
                                  'text-xs',
                                  user.is_active &&
                                    'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
                                )}
                              >
                                {user.is_active ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right p-2 sm:p-4">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSelectUser(user)}
                                  disabled={user.is_owner && user.id !== currentUserId}
                                  className="min-h-[44px] min-w-[44px] focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                  aria-label={`Editar permisos de ${user.name}`}
                                  title={`Editar permisos de ${user.name}`}
                                >
                                  <Edit className="h-4 w-4" aria-hidden="true" />
                                </Button>
                                {!user.is_owner && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive min-h-[44px] min-w-[44px] focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    aria-label={`Eliminar usuario ${user.name}`}
                                    title={`Eliminar usuario ${user.name}`}
                                  >
                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
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
            <section role="region" aria-labelledby="users-stats-title">
              <h3 id="users-stats-title" className="sr-only">
                Estadísticas de Usuarios
              </h3>
              
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Estadísticas de usuarios">
                <Card 
                  className="focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                  role="listitem"
                  tabIndex={0}
                  aria-labelledby="total-users-title"
                  aria-describedby="total-users-desc"
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                    <CardTitle className="text-sm font-medium" id="total-users-title">Total Usuarios</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div 
                      className="text-xl sm:text-2xl font-bold"
                      aria-label={`${users.length} usuarios en total`}
                    >
                      {users.length}
                    </div>
                    <p id="total-users-desc" className="text-xs text-muted-foreground">Activos en el negocio</p>
                  </CardContent>
                </Card>

                <Card 
                  className="focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
                  role="listitem"
                  tabIndex={0}
                  aria-labelledby="admin-users-title"
                  aria-describedby="admin-users-desc"
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                    <CardTitle className="text-sm font-medium" id="admin-users-title">Administradores</CardTitle>
                    <Crown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div 
                      className="text-xl sm:text-2xl font-bold"
                      aria-label={`${users.filter(u => u.role === 'admin').length} administradores`}
                    >
                      {users.filter(u => u.role === 'admin').length}
                    </div>
                    <p id="admin-users-desc" className="text-xs text-muted-foreground">Con permisos elevados</p>
                  </CardContent>
                </Card>

                <Card 
                  className="focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 sm:col-span-2 lg:col-span-1"
                  role="listitem"
                  tabIndex={0}
                  aria-labelledby="employee-users-title"
                  aria-describedby="employee-users-desc"
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
                    <CardTitle className="text-sm font-medium" id="employee-users-title">Empleados</CardTitle>
                    <UserCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div 
                      className="text-xl sm:text-2xl font-bold"
                      aria-label={`${users.filter(u => u.role === 'employee').length} empleados`}
                    >
                      {users.filter(u => u.role === 'employee').length}
                    </div>
                    <p id="employee-users-desc" className="text-xs text-muted-foreground">Trabajando activamente</p>
                  </CardContent>
                </Card>
              </div>
            </section>
          </TabsContent>

          {/* Tab: Permisos (Placeholder) */}
          <TabsContent 
            value="permissions"
            role="tabpanel"
            aria-labelledby="permissions-tab"
            id="permissions-panel"
            tabIndex={0}
          >
            <Card className="focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Editor de Permisos</CardTitle>
                <CardDescription className="text-sm sm:text-base">Gestiona permisos individuales por usuario</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <p className="text-muted-foreground text-sm sm:text-base">Componente PermissionEditor en desarrollo...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Plantillas (Placeholder) */}
          <TabsContent 
            value="templates"
            role="tabpanel"
            aria-labelledby="templates-tab"
            id="templates-panel"
            tabIndex={0}
          >
            <Card className="focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Plantillas de Permisos</CardTitle>
                <CardDescription className="text-sm sm:text-base">Plantillas predefinidas y personalizadas</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <p className="text-muted-foreground text-sm sm:text-base">
                  Componente PermissionTemplates en desarrollo...
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Historial (Placeholder) */}
          <TabsContent 
            value="audit"
            role="tabpanel"
            aria-labelledby="audit-tab"
            id="audit-panel"
            tabIndex={0}
          >
            <Card className="focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">Historial de Cambios</CardTitle>
                <CardDescription className="text-sm sm:text-base">Auditoría de modificaciones en permisos</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <p className="text-muted-foreground text-sm sm:text-base">Componente AuditLog en desarrollo...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  )
}

export default PermissionsManager
