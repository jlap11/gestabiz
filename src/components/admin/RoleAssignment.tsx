// =====================================================
// COMPONENT: RoleAssignment - Gestabiz
// Dialog para asignar/modificar roles de usuarios
// =====================================================

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { usePermissions } from '@/hooks/usePermissions-v2'
import { UserCheck, Shield, Crown, Wrench, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { BusinessRole } from '@/types/types'

// =====================================================
// INTERFACES
// =====================================================

interface RoleAssignmentProps {
  businessId: string
  ownerId: string
  currentUserId: string
  userId: string | null
  userName: string
  userEmail: string
  currentRole?: BusinessRole | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

type RoleType = 'admin' | 'employee'
type EmployeeType = 'service_provider' | 'support_staff'

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function RoleAssignment({
  businessId,
  ownerId,
  currentUserId,
  userId,
  userName,
  userEmail,
  currentRole,
  isOpen,
  onClose,
  onSuccess,
}: RoleAssignmentProps) {
  const { assignRole, revokeRole, isOwner, templates, loadingTemplates } = usePermissions({
    userId: currentUserId,
    businessId,
    ownerId,
  })

  // Estados
  const [selectedRole, setSelectedRole] = useState<RoleType>('employee')
  const [employeeType, setEmployeeType] = useState<EmployeeType>('service_provider')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('') // NUEVO: Template seleccionado
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filtrar templates según el rol seleccionado
  const availableTemplates = React.useMemo(() => {
    if (!templates) return []
    return templates.filter(t => t.role === selectedRole && t.is_system_template)
  }, [templates, selectedRole])

  // Auto-seleccionar "Admin Completo" cuando se selecciona rol admin
  useEffect(() => {
    if (selectedRole === 'admin' && availableTemplates.length > 0 && !selectedTemplateId) {
      const adminTemplate = availableTemplates.find(t => t.name === 'Admin Completo')
      if (adminTemplate) {
        setSelectedTemplateId(adminTemplate.id)
      }
    }
  }, [selectedRole, availableTemplates, selectedTemplateId])

  // Inicializar con valores actuales
  useEffect(() => {
    if (currentRole) {
      setSelectedRole(currentRole.role)
      setEmployeeType(currentRole.employee_type || 'service_provider')
      setNotes('')
    }
  }, [currentRole])

  // Verificar si es el owner
  const isTargetOwner = userId === ownerId
  const isCurrentOwner = currentUserId === ownerId
  const canModify = isCurrentOwner || isOwner

  // Manejar submit
  const handleSubmit = () => {
    if (!userId || !canModify) return

    setIsSubmitting(true)

    // Si ya tiene un rol, primero revocarlo
    if (currentRole) {
      revokeRole(
        { roleId: currentRole.id },
        {
          onSuccess: () => {
            // Después de revocar, asignar nuevo rol
            assignRole(
              {
                targetUserId: userId,
                role: selectedRole,
                employeeType: selectedRole === 'employee' ? employeeType : undefined,
                notes,
                templateId: selectedTemplateId || undefined, // NUEVO: Pasar templateId
              },
              {
                onSuccess: () => {
                  toast.success('Rol modificado exitosamente', {
                    description: `${userName} ahora es ${selectedRole === 'admin' ? 'Administrador' : 'Empleado'}`,
                  })
                  onSuccess?.()
                  onClose()
                  setIsSubmitting(false)
                },
                onError: (error) => {
                  toast.error('Error al asignar nuevo rol', {
                    description: error.message || 'Por favor intenta de nuevo',
                  })
                  setIsSubmitting(false)
                },
              }
            )
          },
          onError: (error) => {
            toast.error('Error al revocar rol anterior', {
              description: error.message || 'Por favor intenta de nuevo',
            })
            setIsSubmitting(false)
          },
        }
      )
    } else {
      // Si no tiene rol previo, asignar directamente
      assignRole(
        {
          targetUserId: userId,
          role: selectedRole,
          employeeType: selectedRole === 'employee' ? employeeType : undefined,
          notes,
          templateId: selectedTemplateId || undefined, // NUEVO: Pasar templateId
        },
        {
          onSuccess: () => {
            toast.success('Rol asignado exitosamente', {
              description: `${userName} ahora es ${selectedRole === 'admin' ? 'Administrador' : 'Empleado'}`,
            })
            onSuccess?.()
            onClose()
            setIsSubmitting(false)
          },
          onError: (error) => {
            toast.error('Error al asignar rol', {
              description: error.message || 'Por favor intenta de nuevo',
            })
            setIsSubmitting(false)
          },
        }
      )
    }
  }

  // Manejar cancelación
  const handleCancel = () => {
    setSelectedRole('employee')
    setEmployeeType('service_provider')
    setNotes('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {currentRole ? 'Modificar Rol' : 'Asignar Rol'}
          </DialogTitle>
          <DialogDescription>
            {isTargetOwner
              ? 'Este usuario es el propietario del negocio'
              : `Configura el rol y permisos para ${userName}`}
          </DialogDescription>
        </DialogHeader>

        {/* Advertencia para owner */}
        {isTargetOwner && (
          <Alert variant="destructive" className="my-4">
            <Crown className="h-4 w-4" />
            <AlertDescription>
              No puedes modificar el rol del propietario del negocio. El propietario
              siempre tiene acceso completo a todas las funcionalidades.
            </AlertDescription>
          </Alert>
        )}

        {/* Sin permisos */}
        {!canModify && !isTargetOwner && (
          <Alert className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No tienes permisos para modificar roles de usuario. Solo el propietario
              o administradores con permisos pueden realizar esta acción.
            </AlertDescription>
          </Alert>
        )}

        {/* Formulario */}
        {canModify && !isTargetOwner && (
          <div className="space-y-6 py-4">
            {/* Información del usuario */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Usuario</Label>
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                <div className="flex-1">
                  <p className="font-medium">{userName}</p>
                  <p className="text-sm text-muted-foreground">{userEmail}</p>
                </div>
                {currentRole && (
                  <div className="text-xs text-muted-foreground">
                    Rol actual: {currentRole.role === 'admin' ? 'Admin' : 'Empleado'}
                  </div>
                )}
              </div>
            </div>

            {/* Selección de rol */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Rol del usuario</Label>
              <RadioGroup value={selectedRole} onValueChange={(v) => setSelectedRole(v as RoleType)}>
                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="admin" id="role-admin" className="mt-1" />
                  <Label htmlFor="role-admin" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-primary" />
                      <span className="font-semibold">Administrador</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Acceso a gestión del negocio, empleados, citas y configuración.
                      Los permisos específicos se configuran después.
                    </p>
                  </Label>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="employee" id="role-employee" className="mt-1" />
                  <Label htmlFor="role-employee" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <UserCheck className="h-4 w-4 text-primary" />
                      <span className="font-semibold">Empleado</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Acceso a sus propias citas, calendario y servicios asignados.
                    </p>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* NUEVO: Selector de Template de Permisos (solo para admin) */}
            {selectedRole === 'admin' && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Template de Permisos
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    ({availableTemplates.length} disponibles)
                  </span>
                </Label>
                {loadingTemplates ? (
                  <div className="flex items-center justify-center p-4 border rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Cargando templates...</span>
                  </div>
                ) : availableTemplates.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No hay templates de permisos disponibles. Los permisos deberán asignarse manualmente.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <RadioGroup 
                    value={selectedTemplateId} 
                    onValueChange={setSelectedTemplateId}
                  >
                    {availableTemplates.map(template => (
                      <div 
                        key={template.id}
                        className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <RadioGroupItem value={template.id} id={`template-${template.id}`} className="mt-1" />
                        <Label htmlFor={`template-${template.id}`} className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold">{template.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {(template.permissions as string[]).length} permisos
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {template.description}
                          </p>
                          {template.name === 'Admin Completo' && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                              <Crown className="h-3 w-3" />
                              <span className="font-medium">Recomendado para administradores</span>
                            </div>
                          )}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </div>
            )}

            {/* Tipo de empleado (solo si rol es employee) */}
            {selectedRole === 'employee' && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Tipo de empleado</Label>
                <RadioGroup 
                  value={employeeType} 
                  onValueChange={(v) => setEmployeeType(v as EmployeeType)}
                >
                  <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="service_provider" id="type-provider" className="mt-1" />
                    <Label htmlFor="type-provider" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <UserCheck className="h-4 w-4 text-green-500" />
                        <span className="font-semibold">Presta Servicios</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Puede ofrecer servicios y recibir citas de clientes.
                      </p>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="support_staff" id="type-support" className="mt-1" />
                    <Label htmlFor="type-support" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <Wrench className="h-4 w-4 text-blue-500" />
                        <span className="font-semibold">Staff de Soporte</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Personal administrativo o de apoyo que no ofrece servicios directamente.
                      </p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Notas (opcional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Razón del cambio de rol o información adicional..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          {canModify && !isTargetOwner && (
            <Button onClick={handleSubmit} disabled={isSubmitting || !userId}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentRole ? 'Guardar Cambios' : 'Asignar Rol'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RoleAssignment
