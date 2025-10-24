// =====================================================
// COMPONENT: PermissionTemplates - Gestabiz
// Gestión de plantillas de permisos (sistema y custom)
// =====================================================

import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { usePermissions } from '@/hooks/usePermissions-v2'
import { 
  PERMISSION_CATEGORIES, 
  PERMISSION_DESCRIPTIONS 
} from '@/lib/permissions-v2'
import { 
  FileText, 
  Plus, 
  Trash2, 
  Edit, 
  Check,
  Shield,
  Crown,
  UserCheck,
  Loader2,
  Copy,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Permission, PermissionTemplate } from '@/types/types'

// =====================================================
// INTERFACES
// =====================================================

interface PermissionTemplatesProps {
  businessId: string
  ownerId: string
  currentUserId: string
}

interface CreateTemplateDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (template: Partial<PermissionTemplate>) => void
  editingTemplate?: PermissionTemplate | null
}

// =====================================================
// SUBCOMPONENTE: Template Card
// =====================================================

function TemplateCard({
  template,
  isSystem,
  onApply,
  onEdit,
  onDelete,
  canModify,
}: {
  template: PermissionTemplate
  isSystem: boolean
  onApply: () => void
  onEdit?: () => void
  onDelete?: () => void
  canModify: boolean
}) {
  const permissionsArray = Array.isArray(template.permissions) 
    ? template.permissions 
    : JSON.parse(template.permissions as string)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{template.name}</CardTitle>
              {isSystem && (
                <Badge variant="secondary" className="gap-1">
                  <Shield className="h-3 w-3" />
                  {t('common.permissionTemplates.system')}
                </Badge>
              )}
            </div>
            <CardDescription>{template.description}</CardDescription>
          </div>
            <Badge variant={template.role === 'admin' ? 'default' : 'outline'}>
            {template.role === 'admin' ? (
              <Crown className="h-3 w-3 mr-1" />
            ) : (
              <UserCheck className="h-3 w-3 mr-1" />
            )}
            {template.role === 'admin' ? t('roleSelector.admin') : t('roleSelector.employee')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {permissionsArray.length} permisos incluidos
          </span>
        </div>

        {/* Lista compacta de permisos */}
        <div className="space-y-1">
          {permissionsArray.slice(0, 5).map((permission: Permission) => (
            <div key={permission} className="flex items-center gap-2 text-sm">
              <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
              <span className="text-muted-foreground truncate">
                {PERMISSION_DESCRIPTIONS[permission] || permission}
              </span>
            </div>
          ))}
          {permissionsArray.length > 5 && (
            <p className="text-xs text-muted-foreground pl-5">
              +{permissionsArray.length - 5} permisos más...
            </p>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            onClick={onApply}
            disabled={!canModify}
            className="flex-1 gap-2"
            size="sm"
          >
            <Copy className="h-4 w-4" />
            {t('common.permissionTemplates.applyTemplate')}
          </Button>
          {!isSystem && onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              disabled={!canModify}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {!isSystem && onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              disabled={!canModify}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// =====================================================
// SUBCOMPONENTE: Create/Edit Template Dialog
// =====================================================

function CreateTemplateDialog({
  isOpen,
  onClose,
  onSave,
  editingTemplate,
}: CreateTemplateDialogProps) {
  const [name, setName] = useState(editingTemplate?.name || '')
  const [description, setDescription] = useState(editingTemplate?.description || '')
  const [role, setRole] = useState<'admin' | 'employee'>(editingTemplate?.role || 'employee')
  
  // Parse permissions from editing template
  const getInitialPermissions = (): Permission[] => {
    if (!editingTemplate) return []
    if (Array.isArray(editingTemplate.permissions)) {
      return editingTemplate.permissions as Permission[]
    }
    return JSON.parse(editingTemplate.permissions as string) as Permission[]
  }
  
  const [selectedPermissions, setSelectedPermissions] = useState<Set<Permission>>(
    new Set(getInitialPermissions())
  )

  const togglePermission = (permission: Permission) => {
    const newSelection = new Set(selectedPermissions)
    if (newSelection.has(permission)) {
      newSelection.delete(permission)
    } else {
      newSelection.add(permission)
    }
    setSelectedPermissions(newSelection)
  }

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
  }

  const handleSave = () => {
    if (!name.trim()) {
      toast.error(t('admin.templateActions.nameRequired'))
      return
    }

    if (selectedPermissions.size === 0) {
      toast.error(t('admin.templateActions.permissionRequired'))
      return
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      role,
      permissions: Array.from(selectedPermissions) as Permission[],
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {editingTemplate ? t('common.permissionTemplates.editTemplate') : t('common.permissionTemplates.newTemplate')}
          </DialogTitle>
          <DialogDescription>
            Define un conjunto reutilizable de permisos para asignar a múltiples usuarios
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la plantilla *</Label>
            <Input
              id="name"
              placeholder="Ej: Gerente de Citas"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe el propósito de esta plantilla..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Rol */}
          <div className="space-y-2">
            <Label>Rol *</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={role === 'admin'}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'employee')}
                  className="w-4 h-4"
                />
                <span className="text-sm">Administrador</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="employee"
                  checked={role === 'employee'}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'employee')}
                  className="w-4 h-4"
                />
                <span className="text-sm">Empleado</span>
              </label>
            </div>
          </div>

          {/* Permisos seleccionados */}
          <div className="flex items-center justify-between">
            <Label>Permisos seleccionados</Label>
            <Badge variant="outline">
              {selectedPermissions.size} / {Object.values(PERMISSION_CATEGORIES).flatMap(c => c.permissions).length}
            </Badge>
          </div>

          {/* Lista de permisos */}
          <ScrollArea className="h-[400px] border rounded-lg p-4">
            <Accordion type="multiple" className="space-y-2">
              {Object.entries(PERMISSION_CATEGORIES).map(([key, category]) => {
                const selectedCount = category.permissions.filter(p => selectedPermissions.has(p)).length
                const allSelected = selectedCount === category.permissions.length

                return (
                  <AccordionItem key={key} value={key} className="border rounded-lg">
                    <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50">
                      <div className="flex items-center justify-between flex-1 pr-2">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={allSelected}
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleCategory(key)
                            }}
                          />
                          <span className="font-semibold">{category.label}</span>
                        </div>
                        <Badge variant="secondary">
                          {selectedCount} / {category.permissions.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-2 pt-2">
                        {category.permissions.map((permission) => (
                          <div
                            key={permission}
                            className="flex items-start gap-3 p-2 rounded hover:bg-muted/50"
                          >
                            <Checkbox
                              id={`new-${permission}`}
                              checked={selectedPermissions.has(permission)}
                              onCheckedChange={() => togglePermission(permission)}
                              className="mt-0.5"
                            />
                            <Label
                              htmlFor={`new-${permission}`}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {PERMISSION_DESCRIPTIONS[permission] || permission}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {editingTemplate ? 'Guardar Cambios' : 'Crear Plantilla'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function PermissionTemplates({
  businessId,
  ownerId,
  currentUserId,
}: Readonly<PermissionTemplatesProps>) {
  const { t } = useLanguage()
  const { 
    templates, 
    createTemplate, 
    deleteTemplate,
    isOwner,
    isLoading,
  } = usePermissions({
    userId: currentUserId,
    businessId,
    ownerId,
  })

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<PermissionTemplate | null>(null)

  const canModify = isOwner

  // Separar templates del sistema y custom
  const systemTemplates = templates.filter(t => t.is_system_template)
  const customTemplates = templates.filter(t => !t.is_system_template)

  // Aplicar plantilla (abre selector de usuario - simplificado por ahora)
  const handleApplyTemplate = (template: PermissionTemplate) => {
    toast.info('Funcionalidad de aplicar plantilla', {
      description: 'Implementar selector de usuario para aplicar plantilla',
    })
  }

  // Crear plantilla
  const handleCreateTemplate = (templateData: Partial<PermissionTemplate>) => {
    createTemplate(
      {
        name: templateData.name!,
        description: templateData.description || '',
        role: templateData.role!,
        permissions: templateData.permissions as Permission[],
      },
      {
        onSuccess: () => {
            toast.success(t('admin.templateActions.created'))
          setCreateDialogOpen(false)
        },
        onError: (error) => {
            toast.error(t('admin.templateActions.createError'), {
            description: error.message,
          })
        },
      }
    )
  }

  // Editar plantilla
  const handleEditTemplate = (template: PermissionTemplate) => {
    setEditingTemplate(template)
    setCreateDialogOpen(true)
  }

  // Eliminar plantilla
  const handleDeleteTemplate = (template: PermissionTemplate) => {
    if (window.confirm(`${t('admin.permissionTemplates.confirmDelete')} ${template.name}?`)) {
      deleteTemplate(
        { templateId: template.id },
        {
          onSuccess: () => {
            toast.success(t('admin.templateActions.deleted'))
          },
          onError: (error) => {
            toast.error(t('admin.templateActions.deleteError'), {
              description: error.message,
            })
          },
        }
      )
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="system" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="system" className="gap-2">
            <Shield className="h-4 w-4" />
            Plantillas del Sistema
          </TabsTrigger>
          <TabsTrigger value="custom" className="gap-2">
            <FileText className="h-4 w-4" />
            Plantillas Personalizadas
          </TabsTrigger>
        </TabsList>

        {/* Tab: Sistema */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plantillas del Sistema</CardTitle>
              <CardDescription>
                Plantillas predefinidas optimizadas para roles comunes. No se pueden editar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
              
              {!isLoading && systemTemplates.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  No hay plantillas del sistema disponibles
                </div>
              )}
              
              {!isLoading && systemTemplates.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {systemTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isSystem={true}
                      onApply={() => handleApplyTemplate(template)}
                      canModify={canModify}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Custom */}
        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Plantillas Personalizadas</CardTitle>
                  <CardDescription>
                    Crea plantillas adaptadas a las necesidades específicas de tu negocio
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingTemplate(null)
                    setCreateDialogOpen(true)
                  }}
                  disabled={!canModify}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Nueva Plantilla
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
              
              {!isLoading && customTemplates.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground mb-2">
                    No hay plantillas personalizadas
                  </p>
                  <p className="text-muted-foreground mb-4">
                    Crea tu primera plantilla personalizada para agilizar la asignación de permisos
                  </p>
                  <Button
                    onClick={() => {
                      setEditingTemplate(null)
                      setCreateDialogOpen(true)
                    }}
                    disabled={!canModify}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Crear Primera Plantilla
                  </Button>
                </div>
              )}
              
              {!isLoading && customTemplates.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {customTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isSystem={false}
                      onApply={() => handleApplyTemplate(template)}
                      onEdit={() => handleEditTemplate(template)}
                      onDelete={() => handleDeleteTemplate(template)}
                      canModify={canModify}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Crear/Editar Plantilla */}
      <CreateTemplateDialog
        isOpen={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false)
          setEditingTemplate(null)
        }}
        onSave={handleCreateTemplate}
        editingTemplate={editingTemplate}
      />
    </div>
  )
}

export default PermissionTemplates
