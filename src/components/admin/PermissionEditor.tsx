// =====================================================
// COMPONENT: PermissionEditor - Gestabiz
// Editor de permisos granulares por usuario
// =====================================================

import React, { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/contexts/LanguageContext'
import { usePermissions } from '@/hooks/usePermissions-v2'
import { 
  PERMISSION_CATEGORIES, 
  PERMISSION_DESCRIPTIONS 
} from '@/lib/permissions-v2'
import { 
  Shield, 
  CheckSquare, 
  XSquare, 
  Loader2,
  AlertCircle,
  Plus,
  Minus,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Permission, UserPermission } from '@/types/types'

// =====================================================
// INTERFACES
// =====================================================

interface PermissionEditorProps {
  businessId: string
  ownerId: string
  currentUserId: string
  targetUserId: string | null
  targetUserName: string
  targetUserEmail: string
  currentPermissions: UserPermission[]
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface PermissionChange {
  permission: Permission
  action: 'grant' | 'revoke'
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function PermissionEditor({
  businessId,
  ownerId,
  currentUserId,
  targetUserId,
  targetUserName,
  targetUserEmail,
  currentPermissions,
  isOpen,
  onClose,
  onSuccess,
}: Readonly<PermissionEditorProps>) {
  const { t } = useLanguage()
  const { grantPermission, revokePermission, isOwner } = usePermissions({
    userId: currentUserId,
    businessId,
    ownerId,
  })

  // Estados
  const [selectedPermissions, setSelectedPermissions] = useState<Set<Permission>>(new Set())
  const [pendingChanges, setPendingChanges] = useState<PermissionChange[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Verificar si es el owner
  const isTargetOwner = targetUserId === ownerId
  const canModify = isOwner && !isTargetOwner

  // Inicializar permisos seleccionados
  useEffect(() => {
    const active = new Set<Permission>(
      currentPermissions
        .filter(p => p.is_active && (!p.expires_at || new Date(p.expires_at) > new Date()))
        .map(p => p.permission as Permission)
    )
    setSelectedPermissions(active)
    setPendingChanges([])
  }, [currentPermissions, targetUserId])

  // Calcular cambios pendientes
  const calculateChanges = (newSelection: Set<Permission>) => {
    const current = new Set<Permission>(currentPermissions.map(p => p.permission as Permission))
    const changes: PermissionChange[] = []

    // Permisos a otorgar (están en newSelection pero no en current)
    newSelection.forEach(permission => {
      if (!current.has(permission)) {
        changes.push({ permission, action: 'grant' })
      }
    })

    // Permisos a revocar (están en current pero no en newSelection)
    current.forEach(permission => {
      if (!newSelection.has(permission)) {
        changes.push({ permission, action: 'revoke' })
      }
    })

    setPendingChanges(changes)
  }

  // Toggle permiso individual
  const togglePermission = (permission: Permission) => {
    const newSelection = new Set(selectedPermissions)
    if (newSelection.has(permission)) {
      newSelection.delete(permission)
    } else {
      newSelection.add(permission)
    }
    setSelectedPermissions(newSelection)
    calculateChanges(newSelection)
  }

  // Toggle toda una categoría
  const toggleCategory = (categoryKey: string) => {
    const category = PERMISSION_CATEGORIES[categoryKey as keyof typeof PERMISSION_CATEGORIES]
    const allSelected = category.permissions.every(p => selectedPermissions.has(p))
    
    const newSelection = new Set(selectedPermissions)
    category.permissions.forEach(permission => {
      if (allSelected) {
        newSelection.delete(permission)
      } else {
        newSelection.add(permission)
      }
    })
    
    setSelectedPermissions(newSelection)
    calculateChanges(newSelection)
  }

  // Verificar si una categoría está completamente seleccionada
  const isCategoryFullySelected = (categoryKey: string) => {
    const category = PERMISSION_CATEGORIES[categoryKey as keyof typeof PERMISSION_CATEGORIES]
    return category.permissions.every(p => selectedPermissions.has(p))
  }

  // Verificar si una categoría está parcialmente seleccionada
  const isCategoryPartiallySelected = (categoryKey: string) => {
    const category = PERMISSION_CATEGORIES[categoryKey as keyof typeof PERMISSION_CATEGORIES]
    const selectedCount = category.permissions.filter(p => selectedPermissions.has(p)).length
    return selectedCount > 0 && selectedCount < category.permissions.length
  }

  // Seleccionar todos
  const selectAll = () => {
    const allPermissions = Object.values(PERMISSION_CATEGORIES)
      .flatMap(cat => cat.permissions)
    const newSelection = new Set(allPermissions)
    setSelectedPermissions(newSelection)
    calculateChanges(newSelection)
  }

  // Limpiar todos
  const clearAll = () => {
    const newSelection = new Set<Permission>()
    setSelectedPermissions(newSelection)
    calculateChanges(newSelection)
  }

  // Procesar un cambio individual
  const processChange = (change: PermissionChange): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (change.action === 'grant') {
        grantPermission(
          {
            targetUserId: targetUserId!,
            permission: change.permission,
            notes: `Otorgado por ${currentUserId}`,
          },
          {
            onSuccess: () => resolve(),
            onError: (error) => reject(error),
          }
        )
      } else {
        const currentPerm = currentPermissions.find(p => p.permission === change.permission)
        if (currentPerm) {
          revokePermission(
            { permissionId: currentPerm.id },
            {
              onSuccess: () => resolve(),
              onError: (error) => reject(error),
            }
          )
        } else {
          resolve()
        }
      }
    })
  }

  // Manejar submit
  const handleSubmit = async () => {
    if (!targetUserId || !canModify || pendingChanges.length === 0) return

    setIsSubmitting(true)
    const errors: string[] = []

    for (const change of pendingChanges) {
      try {
        await processChange(change)
      } catch {
        errors.push(PERMISSION_DESCRIPTIONS[change.permission] || change.permission)
      }
    }

    setIsSubmitting(false)

    if (errors.length === 0) {
      toast.success('Permisos actualizados exitosamente', {
        description: `Se aplicaron ${pendingChanges.length} cambios para ${targetUserName}`,
      })
      onSuccess?.()
      onClose()
    } else {
      toast.error('Algunos permisos no se pudieron actualizar', {
        description: `Errores en: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`,
      })
    }
  }

  // Cancelar
  const handleCancel = () => {
    setSelectedPermissions(new Set<Permission>(currentPermissions.map(p => p.permission as Permission)))
    setPendingChanges([])
    onClose()
  }

  // Contar cambios por tipo
  const changesCount = useMemo(() => {
    return {
      grant: pendingChanges.filter(c => c.action === 'grant').length,
      revoke: pendingChanges.filter(c => c.action === 'revoke').length,
    }
  }, [pendingChanges])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Editor de Permisos
          </DialogTitle>
          <DialogDescription>
            {isTargetOwner
              ? 'El propietario del negocio tiene todos los permisos automáticamente'
              : `Configura los permisos detallados para ${targetUserName}`}
          </DialogDescription>
        </DialogHeader>

        {/* Información del usuario */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
          <div>
            <p className="font-medium">{targetUserName}</p>
            <p className="text-sm text-muted-foreground">{targetUserEmail}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {selectedPermissions.size} / {Object.values(PERMISSION_CATEGORIES).flatMap(c => c.permissions).length} permisos
            </Badge>
          </div>
        </div>

        {/* Advertencia para owner */}
        {isTargetOwner && (
          <div className="flex items-start gap-3 p-4 border rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">No se pueden editar permisos del propietario</p>
              <p className="text-sm">
                El propietario del negocio siempre tiene acceso completo a todas las funcionalidades.
              </p>
            </div>
          </div>
        )}

        {/* Acciones rápidas */}
        {canModify && (
          <div className="flex items-center justify-between gap-4 pb-4 border-b">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={selectAll}
                className="gap-2"
              >
                <CheckSquare className="h-4 w-4" />
                Seleccionar Todos
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                className="gap-2"
              >
                <XSquare className="h-4 w-4" />
                Limpiar Todos
              </Button>
            </div>

            {/* Preview de cambios */}
            {pendingChanges.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                {changesCount.grant > 0 && (
                  <Badge className="gap-1 bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                    <Plus className="h-3 w-3" />
                    {changesCount.grant} a otorgar
                  </Badge>
                )}
                {changesCount.revoke > 0 && (
                  <Badge className="gap-1 bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20">
                    <Minus className="h-3 w-3" />
                    {changesCount.revoke} a revocar
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {/* Lista de permisos por categoría */}
        <ScrollArea className="flex-1 pr-4">
          <Accordion type="multiple" className="space-y-2" defaultValue={Object.keys(PERMISSION_CATEGORIES)}>
            {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => {
              const isFullySelected = isCategoryFullySelected(key)
              const isPartiallySelected = isCategoryPartiallySelected(key)

              return (
                <AccordionItem key={key} value={key} className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50">
                    <div className="flex items-center justify-between flex-1 pr-2">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={isFullySelected}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (canModify) {
                              toggleCategory(key)
                            }
                          }}
                          disabled={!canModify}
                          className={cn(
                            isPartiallySelected && 'data-[state=checked]:bg-primary/50'
                          )}
                        />
                        <span className="font-semibold">{category.label}</span>
                      </div>
                      <Badge variant="secondary" className="ml-auto mr-2">
                        {category.permissions.filter(p => selectedPermissions.has(p)).length} / {category.permissions.length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-3 pt-2">
                      {category.permissions.map((permission) => {
                        const isSelected = selectedPermissions.has(permission)
                        const isPending = pendingChanges.find(c => c.permission === permission)

                        return (
                          <div
                            key={permission}
                            className={cn(
                              "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                              isPending && isPending.action === 'grant' && 'bg-green-500/5 border-green-500/20',
                              isPending && isPending.action === 'revoke' && 'bg-red-500/5 border-red-500/20',
                              !isPending && 'bg-background'
                            )}
                          >
                            <Checkbox
                              id={permission}
                              checked={isSelected}
                              onCheckedChange={() => {
                                if (canModify) {
                                  togglePermission(permission)
                                }
                              }}
                              disabled={!canModify}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <Label
                                htmlFor={permission}
                                className={cn(
                                  "text-sm cursor-pointer",
                                  !canModify && "cursor-not-allowed opacity-60"
                                )}
                              >
                                {PERMISSION_DESCRIPTIONS[permission] || permission}
                              </Label>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {permission}
                              </p>
                            </div>
                            {isPending && (
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs flex-shrink-0",
                                  isPending.action === 'grant' && 'text-green-700 dark:text-green-400',
                                  isPending.action === 'revoke' && 'text-red-700 dark:text-red-400'
                                )}
                              >
                                {isPending.action === 'grant' ? 'Nuevo' : 'Revocar'}
                              </Badge>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          {canModify && (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || pendingChanges.length === 0}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios ({pendingChanges.length})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PermissionEditor
