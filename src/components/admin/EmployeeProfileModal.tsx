/**
 * @file EmployeeProfileModal.tsx
 * @description Modal que muestra el perfil detallado de un empleado
 * Información: contacto, horarios, servicios, ubicaciones, estadísticas
 * Tabs: Información (lectura) y Nómina (configuración de salario)
 */

import { useState } from 'react'
import { Mail, Phone, Calendar, MapPin, Star, TrendingUp, Clock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmployeeSalaryConfig } from '@/components/admin/employees/EmployeeSalaryConfig'
import type { EmployeeHierarchy } from '@/types'

// =====================================================
// TIPOS
// =====================================================

interface EmployeeProfileModalProps {
  employee: EmployeeHierarchy | null
  isOpen: boolean
  onClose: () => void
}

// =====================================================
// CONSTANTES
// =====================================================

const HIERARCHY_LABELS = {
  0: 'Propietario',
  1: 'Administrador',
  2: 'Gerente',
  3: 'Líder de Equipo',
  4: 'Personal',
}

const HIERARCHY_COLORS = {
  0: 'bg-purple-100 text-purple-800',
  1: 'bg-blue-100 text-blue-800',
  2: 'bg-green-100 text-green-800',
  3: 'bg-yellow-100 text-yellow-800',
  4: 'bg-gray-100 text-gray-800',
}

// =====================================================
// COMPONENTE
// =====================================================

export function EmployeeProfileModal({
  employee,
  isOpen,
  onClose,
}: Readonly<EmployeeProfileModalProps>) {
  const [activeTab, setActiveTab] = useState<'info' | 'payroll'>('info')

  if (!employee) return null

  const hierarchyLevel = employee.hierarchy_level || 4
  const hierarchyLabel = HIERARCHY_LABELS[hierarchyLevel as keyof typeof HIERARCHY_LABELS] || 'Desconocido'
  const hierarchyColor = HIERARCHY_COLORS[hierarchyLevel as keyof typeof HIERARCHY_COLORS]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
              {employee.full_name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{employee.full_name}</h2>
              <p className="text-sm text-muted-foreground">{employee.email}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* TABS: Información y Nómina */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'info' | 'payroll')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="payroll">Nómina</TabsTrigger>
          </TabsList>

          {/* TAB 1: INFORMACIÓN (contenido original) */}
          <TabsContent value="info">
            <div className="space-y-6">
          {/* NIVEL JERÁRQUICO */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm mb-2">Nivel Jerárquico</h3>
                <Badge className={`${hierarchyColor} text-base px-3 py-1`}>
                  {hierarchyLabel}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{hierarchyLevel}</p>
                <p className="text-xs text-muted-foreground">Nivel</p>
              </div>
            </div>
          </Card>

          {/* INFORMACIÓN DE CONTACTO */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Información de Contacto
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{employee.email || 'No especificado'}</p>
                </div>
              </div>
              {employee.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Teléfono</p>
                    <p className="text-sm font-medium">{employee.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* INFORMACIÓN LABORAL */}
          {(employee.hired_at || employee.role) && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Información Laboral
              </h3>
              <div className="space-y-3">
                {employee.hired_at && (
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Fecha de Contratación</p>
                      <p className="text-sm font-medium">
                        {new Date(employee.hired_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                )}
                {employee.role && (
                  <div>
                    <p className="text-xs text-muted-foreground">Rol</p>
                    <p className="text-sm font-medium capitalize">{employee.role}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* UBICACIONES */}
          {employee.location_name && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Ubicación Asignada
              </h3>
              <div className="flex items-start gap-3 p-2 bg-secondary rounded">
                <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">{employee.location_name}</p>
                </div>
              </div>
            </Card>
          )}

          {/* ESTADÍSTICAS */}
          <div className="grid grid-cols-2 gap-4">
            {/* Rating */}
            {employee.average_rating !== undefined && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <p className="text-xs text-muted-foreground">Calificación</p>
                </div>
                <p className="text-2xl font-bold">{(employee.average_rating || 0).toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">{employee.total_reviews || 0} reseñas</p>
              </Card>
            )}

            {/* Ocupación */}
            {employee.occupancy_rate !== undefined && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <p className="text-xs text-muted-foreground">Ocupación</p>
                </div>
                <p className="text-2xl font-bold">{(employee.occupancy_rate || 0).toFixed(0)}%</p>
                <div className="w-full bg-secondary rounded-full h-1.5 mt-2">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min((employee.occupancy_rate || 0), 100)}%` }}
                  />
                </div>
              </Card>
            )}

            {/* Citas Completadas */}
            {employee.completed_appointments !== undefined && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-green-500" />
                  <p className="text-xs text-muted-foreground">Citas Completadas</p>
                </div>
                <p className="text-2xl font-bold">{employee.completed_appointments || 0}</p>
              </Card>
            )}

            {/* Ingresos */}
            {employee.gross_revenue !== undefined && (
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <p className="text-xs text-muted-foreground">Ingresos Totales</p>
                </div>
                <p className="text-lg font-bold truncate">
                  ${(employee.gross_revenue || 0).toLocaleString('es-CO')}
                </p>
              </Card>
            )}
          </div>

          {/* SERVICIOS */}
          {employee.services_offered && employee.services_offered.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Servicios Ofrecidos</h3>
              <div className="space-y-2">
                {employee.services_offered.slice(0, 5).map((service) => (
                  <div key={service.service_id} className="flex items-center justify-between p-2 bg-secondary rounded">
                    <Badge variant="secondary" className="text-xs">
                      {service.service_name}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {service.expertise_level}
                    </Badge>
                  </div>
                ))}
                {employee.services_offered.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{employee.services_offered.length - 5} servicios más
                  </p>
                )}
              </div>
            </Card>
          )}

          {/* BOTÓN CERRAR */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </TabsContent>

      {/* TAB 2: NÓMINA */}
      <TabsContent value="payroll">
        <div className="space-y-4">
          <EmployeeSalaryConfig
            employeeId={employee.employee_id}
            businessId={employee.business_id}
            employeeName={employee.full_name}
            currentSalaryBase={employee.salary_base}
            currentSalaryType={employee.salary_type}
            onSaveSuccess={onClose}  // Cerrar modal después de guardar exitosamente
          />
        </div>
      </TabsContent>
    </Tabs>
  </DialogContent>
</Dialog>
  )
}
