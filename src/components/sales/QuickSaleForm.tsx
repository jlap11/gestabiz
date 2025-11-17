/**
 * QuickSaleForm - Registro rápido de ventas en mostrador
 * Para clientes walk-in que pagan servicios sin cita previa
 * Solo accesible por Administradores
 */

import React, { useState, useEffect } from 'react'
import { DollarSign, User, Package, MapPin, CreditCard, Banknote, Landmark } from 'lucide-react'
import { Check, X } from '@phosphor-icons/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import supabase from '@/lib/supabase'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { usePreferredLocation } from '@/hooks/usePreferredLocation'
import { useLanguage } from '@/contexts/LanguageContext'
import { PermissionGate } from '@/components/ui/PermissionGate'

interface Service {
  id: string
  name: string
  price: number
  currency: string
  duration_minutes: number
}

interface Location {
  id: string
  name: string
  address?: string
}

interface Employee {
  id: string
  full_name: string
}

interface QuickSaleFormProps {
  businessId: string
  onSuccess?: () => void
}

export function QuickSaleForm({ businessId, onSuccess }: QuickSaleFormProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const { preferredLocationId } = usePreferredLocation(businessId)

  // Form state
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientDocument, setClientDocument] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')

  // Fetch services, locations, employees
  useEffect(() => {
    fetchData()
    // Load cached location from localStorage OR use preferred location from settings
    const cachedLocation = localStorage.getItem(`quick-sale-location-${businessId}`)
    if (cachedLocation) {
      setLocationId(cachedLocation)
    } else if (preferredLocationId) {
      // Si no hay cache pero sí hay sede preferida en configuración, usarla
      setLocationId(preferredLocationId)
      localStorage.setItem(`quick-sale-location-${businessId}`, preferredLocationId)
    }
  }, [businessId, preferredLocationId])

  const fetchData = async () => {
    try {
      // Services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('id, name, price, currency, duration_minutes')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('name')

      if (servicesError) throw servicesError
      setServices(servicesData || [])

      // Locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('id, name, address')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('name')

      if (locationsError) throw locationsError
      setLocations(locationsData || [])

      // Employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('business_employees')
        .select(`
          employee_id,
          profiles!business_employees_employee_id_fkey (
            id,
            full_name
          )
        `)
        .eq('business_id', businessId)
        .eq('status', 'approved')

      if (employeesError) throw employeesError
      
      const employeesList = employeesData?.map((emp: any) => ({
        id: emp.profiles.id,
        full_name: emp.profiles.full_name || 'Sin nombre',
      })) || []
      
      setEmployees(employeesList)

    } catch (error: any) {
      console.error('Error fetching data:', error)
      toast.error(`Error al cargar datos: ${error.message}`)
    }
  }

  const handleServiceChange = (value: string) => {
    setServiceId(value)
    const selectedService = services.find(s => s.id === value)
    if (selectedService) {
      setAmount(selectedService.price.toString())
    }
  }

  const handleLocationChange = (value: string) => {
    setLocationId(value)
    // Save to localStorage for future quick sales
    localStorage.setItem(`quick-sale-location-${businessId}`, value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validations
    if (!clientName.trim()) {
      toast.error('El nombre del cliente es requerido')
      return
    }

    if (!serviceId) {
      toast.error('Selecciona un servicio')
      return
    }

    if (!locationId) {
      toast.error('Selecciona una sede')
      return
    }

    if (!amount || Number.parseFloat(amount) <= 0) {
      toast.error('Ingresa un monto válido')
      return
    }

    if (!paymentMethod) {
      toast.error('Selecciona un método de pago')
      return
    }

    setLoading(true)

    try {
      // 1. Create transaction (income)
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          business_id: businessId,
          location_id: locationId,
          type: 'income',
          category: 'service_sale',
          amount: Number.parseFloat(amount),
          currency: 'COP',
          description: `Venta rápida: ${clientName} - ${services.find(s => s.id === serviceId)?.name}`,
          employee_id: employeeId || null,
          created_by: user?.id,
          transaction_date: new Date().toISOString().split('T')[0],
          payment_method: paymentMethod,
          metadata: {
            client_name: clientName,
            client_phone: clientPhone || null,
            client_document: clientDocument || null,
            client_email: clientEmail || null,
            service_id: serviceId,
            notes: notes || null,
            source: 'quick_sale',
          },
          is_verified: true, // Auto-verify sales made by admin
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (transactionError) throw transactionError

      toast.success('Venta registrada exitosamente', {
        description: `${clientName} - $${Number.parseFloat(amount).toLocaleString('es-CO')}`,
        icon: <Check size={20} weight="bold" />,
      })

      // Reset form (keep location cached)
      setClientName('')
      setClientPhone('')
      setClientDocument('')
      setClientEmail('')
      setServiceId('')
      setEmployeeId('')
      setAmount('')
      setNotes('')

      if (onSuccess) onSuccess()

    } catch (error: any) {
      console.error('Error creating quick sale:', error)
      toast.error(`Error al registrar venta: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <CardTitle>Registrar Venta Rápida</CardTitle>
            <CardDescription>
              Para clientes que pagan servicios sin cita previa (walk-in)
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Info - Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientName" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nombre del Cliente *
              </Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder={t('common.placeholders.clientName')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientPhone">Teléfono (Opcional)</Label>
              <Input
                id="clientPhone"
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder={t('common.placeholders.clientPhone')}
              />
            </div>
          </div>

          {/* Client Info - Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientDocument">Documento (Opcional)</Label>
              <Input
                id="clientDocument"
                value={clientDocument}
                onChange={(e) => setClientDocument(e.target.value)}
                placeholder={t('common.placeholders.clientDocument')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientEmail">Correo Electrónico (Opcional)</Label>
              <Input
                id="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder={t('common.placeholders.clientEmail')}
              />
            </div>
          </div>

          {/* Service */}
          <div className="space-y-2">
            <Label htmlFor="service" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Servicio *
            </Label>
            <Select value={serviceId} onValueChange={handleServiceChange} required>
              <SelectTrigger id="service">
                <SelectValue placeholder={t('common.placeholders.selectService')} />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} - ${service.price.toLocaleString('es-CO')} COP
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location & Employee */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Sede *
              </Label>
              <Select value={locationId} onValueChange={handleLocationChange} required>
                <SelectTrigger id="location">
                  <SelectValue placeholder={t('common.placeholders.selectLocation')} />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee">Empleado que atendió (Opcional)</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger id="employee">
                  <SelectValue placeholder={t('common.placeholders.selectEmployee')} />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto Pagado (COP) *</Label>
              <Input
                id="amount"
                type="number"
                step="100"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t('common.placeholders.amount')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Método de Pago *
              </Label>
              <Select
                value={paymentMethod}
                onValueChange={(value: any) => setPaymentMethod(value)}
                required
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder={t('common.placeholders.selectPaymentMethod')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      <span>Efectivo</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Tarjeta</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="transfer">
                    <div className="flex items-center gap-2">
                      <Landmark className="h-4 w-4" />
                      <span>Transferencia</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (Opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('common.placeholders.notes')}
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <PermissionGate permission="sales.create" businessId={businessId} mode="hide">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Registrar Venta
                  </>
                )}
              </Button>
            </PermissionGate>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setClientName('')
                setClientPhone('')
                setClientDocument('')
                setClientEmail('')
                setServiceId('')
                setEmployeeId('')
                setAmount('')
                setNotes('')
                // Keep location cached
              }}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
