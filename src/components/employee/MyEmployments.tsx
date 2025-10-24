import React, { useEffect, useState } from 'react'
import {
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  Crown,
  Mail,
  MapPin,
  Phone,
  Plus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useEmployeeBusinesses } from '@/hooks/useEmployeeBusinesses'
import supabase from '@/lib/supabase'

interface MyEmploymentsProps {
  employeeId: string
  onJoinBusiness?: () => void
}

interface BusinessWithRole {
  id: string
  name: string
  description?: string
  logo_url?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  isOwner: boolean
  role?: string
}

export function MyEmployments({ employeeId, onJoinBusiness }: MyEmploymentsProps) {
  const [showPrevious, setShowPrevious] = useState(false)
  const [businessesWithRoles, setBusinessesWithRoles] = useState<BusinessWithRole[]>([])
  const { businesses, loading, error } = useEmployeeBusinesses(employeeId, true)

  // Enriquecer negocios con información de roles
  useEffect(() => {
    const enrichBusinesses = async () => {
      if (businesses.length === 0) {
        setBusinessesWithRoles([])
        return
      }

      const enriched = await Promise.all(
        businesses.map(async business => {
          // Verificar si es owner
          const { data: ownerData } = await supabase
            .from('businesses')
            .select('owner_id')
            .eq('id', business.id)
            .single()

          const isOwner = ownerData?.owner_id === employeeId

          // Si no es owner, obtener rol de business_employees
          let role = 'Empleado'
          if (!isOwner) {
            const { data: employeeData } = await supabase
              .from('business_employees')
              .select('role')
              .eq('business_id', business.id)
              .eq('employee_id', employeeId)
              .single()

            role = employeeData?.role || 'Empleado'
          } else {
            role = 'Propietario'
          }

          return {
            ...business,
            isOwner,
            role,
          }
        })
      )

      setBusinessesWithRoles(enriched)
    }

    enrichBusinesses()
  }, [businesses, employeeId])

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Separar empleos activos y anteriores (simulado por ahora)

  const activeEmployments = businessesWithRoles
  const previousEmployments: typeof businessesWithRoles = []

  // Contar propietarios y empleados
  const ownedCount = activeEmployments.filter(b => b.isOwner).length
  const employeeCount = activeEmployments.filter(b => !b.isOwner).length

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Mis Empleos</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Negocios donde estás activo como empleado, administrador o propietario
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={onJoinBusiness}
            className="min-h-[44px] bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Unirse a Negocio
          </Button>
          {previousEmployments.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPrevious(!showPrevious)}
              className="min-h-[44px]"
            >
              <Clock className="h-4 w-4 mr-2" />
              {showPrevious ? 'Ocultar Anteriores' : 'Ver Anteriores'}
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{activeEmployments.length}</p>
                <p className="text-sm text-muted-foreground">Total Vínculos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{ownedCount}</p>
                <p className="text-sm text-muted-foreground">Como Propietario</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{employeeCount}</p>
                <p className="text-sm text-muted-foreground">Como Empleado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Employments */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Vínculos Activos</h3>
        {activeEmployments.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No tienes empleos activos</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Solicita unirte a un negocio para comenzar
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {activeEmployments.map(business => (
              <Card key={business.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {business.logo_url ? (
                        <img
                          src={business.logo_url}
                          alt={business.name}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base sm:text-lg truncate">
                          {business.name}
                        </CardTitle>
                        {business.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {business.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      {business.isOwner ? (
                        <Badge
                          variant="default"
                          className="flex-shrink-0 bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
                        >
                          <Crown className="h-3 w-3 mr-1" />
                          Propietario
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex-shrink-0">
                          <Briefcase className="h-3 w-3 mr-1" />
                          {business.role}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {/* Contact Info */}
                  <div className="space-y-2 text-sm">
                    {business.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{business.email}</span>
                      </div>
                    )}
                    {business.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{business.phone}</span>
                      </div>
                    )}
                    {(business.address || business.city || business.state) && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                        <span className="flex-1">
                          {[business.address, business.city, business.state]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t">
                    <Button variant="outline" size="sm" className="flex-1 min-h-[44px]">
                      Ver Detalles
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-w-[44px] min-h-[44px]"
                      title="Más opciones"
                    >
                      ⋮
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Previous Employments */}
      {showPrevious && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Empleos Anteriores</h3>
          {previousEmployments.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No tienes empleos anteriores</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {previousEmployments.map(business => (
                <Card key={business.id} className="opacity-75">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {business.logo_url ? (
                          <img
                            src={business.logo_url}
                            alt={business.name}
                            className="w-12 h-12 rounded-lg object-cover flex-shrink-0 grayscale"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base sm:text-lg truncate">
                            {business.name}
                          </CardTitle>
                        </div>
                      </div>
                      <Badge variant="outline" className="flex-shrink-0">
                        Inactivo
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="w-full min-h-[44px]">
                      Ver Historial
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
