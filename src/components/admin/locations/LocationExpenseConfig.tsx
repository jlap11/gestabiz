import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Wallet, Save, Loader2, Home, Zap, Droplet, Flame, Wifi, Phone, Shield, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { format, addMonths } from 'date-fns'

interface LocationExpenseConfigProps {
  locationId: string
  businessId: string
  locationName: string
}

interface LocationExpenseConfigData {
  location_id: string
  business_id: string
  // Rent
  rent_amount?: number
  rent_due_day?: number
  landlord_name?: string
  landlord_contact?: string
  lease_start_date?: string
  lease_end_date?: string
  // Utilities
  electricity_avg?: number
  water_avg?: number
  gas_avg?: number
  internet_avg?: number
  phone_avg?: number
  // Other services
  security_amount?: number
  cleaning_amount?: number
  waste_disposal_amount?: number
  // Meta
  notes?: string
  is_active: boolean
}

export function LocationExpenseConfig({ locationId, businessId, locationName }: LocationExpenseConfigProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Rent fields
  const [rentAmount, setRentAmount] = useState<number>(0)
  const [rentDueDay, setRentDueDay] = useState<number>(1)
  const [landlordName, setLandlordName] = useState('')
  const [landlordContact, setLandlordContact] = useState('')
  const [leaseStartDate, setLeaseStartDate] = useState('')
  const [leaseEndDate, setLeaseEndDate] = useState('')

  // Utilities
  const [electricityAvg, setElectricityAvg] = useState<number>(0)
  const [waterAvg, setWaterAvg] = useState<number>(0)
  const [gasAvg, setGasAvg] = useState<number>(0)
  const [internetAvg, setInternetAvg] = useState<number>(0)
  const [phoneAvg, setPhoneAvg] = useState<number>(0)

  // Other services
  const [securityAmount, setSecurityAmount] = useState<number>(0)
  const [cleaningAmount, setCleaningAmount] = useState<number>(0)
  const [wasteDisposalAmount, setWasteDisposalAmount] = useState<number>(0)

  // Automation toggles
  const [automateRent, setAutomateRent] = useState(true)
  const [automateUtilities, setAutomateUtilities] = useState(true)
  const [automateOthers, setAutomateOthers] = useState(true)

  // Notes
  const [notes, setNotes] = useState('')

  // Load existing config
  useEffect(() => {
    loadExpenseConfig()
  }, [locationId])

  const loadExpenseConfig = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('location_expense_config')
        .select('*')
        .eq('location_id', locationId)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows, which is ok (new config)
        throw error
      }

      if (data) {
        // Populate form with existing data
        setRentAmount(data.rent_amount || 0)
        setRentDueDay(data.rent_due_day || 1)
        setLandlordName(data.landlord_name || '')
        setLandlordContact(data.landlord_contact || '')
        setLeaseStartDate(data.lease_start_date || '')
        setLeaseEndDate(data.lease_end_date || '')
        setElectricityAvg(data.electricity_avg || 0)
        setWaterAvg(data.water_avg || 0)
        setGasAvg(data.gas_avg || 0)
        setInternetAvg(data.internet_avg || 0)
        setPhoneAvg(data.phone_avg || 0)
        setSecurityAmount(data.security_amount || 0)
        setCleaningAmount(data.cleaning_amount || 0)
        setWasteDisposalAmount(data.waste_disposal_amount || 0)
        setNotes(data.notes || '')
      }
    } catch (error) {
      console.error('Error loading expense config:', error)
      toast.error('Error al cargar configuración de egresos')
    } finally {
      setLoading(false)
    }
  }

  const calculateNextDueDate = (dueDay: number, frequency: 'monthly' | 'weekly' = 'monthly'): string => {
    const today = new Date()
    const currentDay = today.getDate()
    
    if (frequency === 'monthly') {
      // If due day hasn't passed this month, use this month; otherwise next month
      if (currentDay <= dueDay) {
        return format(new Date(today.getFullYear(), today.getMonth(), dueDay), 'yyyy-MM-dd')
      } else {
        return format(addMonths(new Date(today.getFullYear(), today.getMonth(), dueDay), 1), 'yyyy-MM-dd')
      }
    }
    
    // Default to next month for simplicity
    return format(addMonths(today, 1), 'yyyy-MM-dd')
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // 1. UPSERT location_expense_config
      const { error: configError } = await supabase
        .from('location_expense_config')
        .upsert({
          location_id: locationId,
          business_id: businessId,
          rent_amount: rentAmount > 0 ? rentAmount : null,
          rent_due_day: rentAmount > 0 ? rentDueDay : null,
          landlord_name: landlordName.trim() || null,
          landlord_contact: landlordContact.trim() || null,
          lease_start_date: leaseStartDate || null,
          lease_end_date: leaseEndDate || null,
          electricity_avg: electricityAvg > 0 ? electricityAvg : null,
          water_avg: waterAvg > 0 ? waterAvg : null,
          gas_avg: gasAvg > 0 ? gasAvg : null,
          internet_avg: internetAvg > 0 ? internetAvg : null,
          phone_avg: phoneAvg > 0 ? phoneAvg : null,
          security_amount: securityAmount > 0 ? securityAmount : null,
          cleaning_amount: cleaningAmount > 0 ? cleaningAmount : null,
          waste_disposal_amount: wasteDisposalAmount > 0 ? wasteDisposalAmount : null,
          notes: notes.trim() || null,
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'location_id'
        })

      if (configError) throw configError

      // 2. Create/Update recurring_expenses if automation enabled

      // 2A. Rent
      if (rentAmount > 0) {
        await supabase.from('recurring_expenses').upsert({
          business_id: businessId,
          location_id: locationId,
          name: `Arriendo - ${locationName}`,
          description: landlordName ? `Arriendo mensual de ${locationName}. Propietario: ${landlordName}` : `Arriendo mensual de ${locationName}`,
          category: 'rent',
          amount: rentAmount,
          currency: 'COP',
          recurrence_frequency: 'monthly',
          recurrence_day: rentDueDay,
          next_payment_date: calculateNextDueDate(rentDueDay),
          is_automated: automateRent,
          is_active: true,
          start_date: leaseStartDate || new Date().toISOString().split('T')[0],
          end_date: leaseEndDate || null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'business_id,location_id,category',
          ignoreDuplicates: false
        })
      } else {
        // If rent amount is 0, deactivate existing rent expense
        await supabase
          .from('recurring_expenses')
          .update({ is_active: false })
          .eq('business_id', businessId)
          .eq('location_id', locationId)
          .eq('category', 'rent')
      }

      // 2B. Utilities
      const utilities = [
        { category: 'electricity', amount: electricityAvg, name: 'Electricidad', icon: <Zap size={14} /> },
        { category: 'water', amount: waterAvg, name: 'Agua', icon: <Droplet size={14} /> },
        { category: 'gas', amount: gasAvg, name: 'Gas', icon: <Flame size={14} /> },
        { category: 'internet', amount: internetAvg, name: 'Internet', icon: <Wifi size={14} /> },
        { category: 'phone', amount: phoneAvg, name: 'Teléfono', icon: <Phone size={14} /> }
      ]

      for (const utility of utilities) {
        if (utility.amount > 0) {
          await supabase.from('recurring_expenses').upsert({
            business_id: businessId,
            location_id: locationId,
            name: `${utility.name} - ${locationName}`,
            description: `${utility.name} promedio mensual de ${locationName}`,
            category: utility.category,
            amount: utility.amount,
            currency: 'COP',
            recurrence_frequency: 'monthly',
            recurrence_day: 5, // Default día 5 para servicios públicos
            next_payment_date: calculateNextDueDate(5),
            is_automated: automateUtilities,
            is_active: true,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'business_id,location_id,category',
            ignoreDuplicates: false
          })
        } else {
          // Deactivate if amount is 0
          await supabase
            .from('recurring_expenses')
            .update({ is_active: false })
            .eq('business_id', businessId)
            .eq('location_id', locationId)
            .eq('category', utility.category)
        }
      }

      // 2C. Other services
      const otherServices = [
        { category: 'security', amount: securityAmount, name: 'Seguridad', frequency: 'monthly' as const },
        { category: 'cleaning', amount: cleaningAmount, name: 'Aseo', frequency: 'monthly' as const },
        { category: 'waste_disposal', amount: wasteDisposalAmount, name: 'Recolección de Basuras', frequency: 'monthly' as const }
      ]

      for (const service of otherServices) {
        if (service.amount > 0) {
          await supabase.from('recurring_expenses').upsert({
            business_id: businessId,
            location_id: locationId,
            name: `${service.name} - ${locationName}`,
            description: `${service.name} de ${locationName}`,
            category: service.category,
            amount: service.amount,
            currency: 'COP',
            recurrence_frequency: service.frequency,
            recurrence_day: 1,
            next_payment_date: calculateNextDueDate(1),
            is_automated: automateOthers,
            is_active: true,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'business_id,location_id,category',
            ignoreDuplicates: false
          })
        } else {
          // Deactivate if amount is 0
          await supabase
            .from('recurring_expenses')
            .update({ is_active: false })
            .eq('business_id', businessId)
            .eq('location_id', locationId)
            .eq('category', service.category)
        }
      }

      toast.success('Configuración de egresos guardada exitosamente')
    } catch (error) {
      console.error('Error saving expense config:', error)
      toast.error('Error al guardar configuración de egresos')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sección: Arriendo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Configuración de Arriendo
          </CardTitle>
          <CardDescription>
            Configure el arriendo mensual de esta sede. Los egresos se generarán automáticamente cada mes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rent-amount">Monto del Arriendo (COP)</Label>
              <Input
                id="rent-amount"
                type="number"
                min={0}
                value={rentAmount}
                onChange={(e) => setRentAmount(Number(e.target.value))}
                placeholder="1.500.000"
              />
              {rentAmount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(rentAmount)} mensuales
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rent-due-day">Día de Pago del Mes</Label>
              <Input
                id="rent-due-day"
                type="number"
                min={1}
                max={28}
                value={rentDueDay}
                onChange={(e) => setRentDueDay(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="landlord-name">Nombre del Propietario</Label>
              <Input
                id="landlord-name"
                value={landlordName}
                onChange={(e) => setLandlordName(e.target.value)}
                placeholder="Juan Pérez"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="landlord-contact">Contacto del Propietario</Label>
              <Input
                id="landlord-contact"
                value={landlordContact}
                onChange={(e) => setLandlordContact(e.target.value)}
                placeholder="300 123 4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lease-start">Inicio del Contrato</Label>
              <Input
                id="lease-start"
                type="date"
                value={leaseStartDate}
                onChange={(e) => setLeaseStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lease-end">Fin del Contrato (Opcional)</Label>
              <Input
                id="lease-end"
                type="date"
                value={leaseEndDate}
                onChange={(e) => setLeaseEndDate(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Generar egreso recurrente automáticamente</Label>
              <p className="text-sm text-muted-foreground">
                Crea automáticamente un registro de egreso cada mes en la fecha indicada
              </p>
            </div>
            <Switch checked={automateRent} onCheckedChange={setAutomateRent} />
          </div>
        </CardContent>
      </Card>

      {/* Sección: Servicios Públicos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Servicios Públicos (Promedio Mensual)
          </CardTitle>
          <CardDescription>
            Ingrese el costo promedio mensual de cada servicio público. Los egresos se procesarán el día 5 de cada mes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="electricity" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Electricidad (COP)
              </Label>
              <Input
                id="electricity"
                type="number"
                min={0}
                value={electricityAvg}
                onChange={(e) => setElectricityAvg(Number(e.target.value))}
                placeholder="150.000"
              />
              {electricityAvg > 0 && (
                <p className="text-xs text-muted-foreground">{formatCurrency(electricityAvg)}/mes</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="water" className="flex items-center gap-2">
                <Droplet className="h-4 w-4" />
                Agua (COP)
              </Label>
              <Input
                id="water"
                type="number"
                min={0}
                value={waterAvg}
                onChange={(e) => setWaterAvg(Number(e.target.value))}
                placeholder="80.000"
              />
              {waterAvg > 0 && (
                <p className="text-xs text-muted-foreground">{formatCurrency(waterAvg)}/mes</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gas" className="flex items-center gap-2">
                <Flame className="h-4 w-4" />
                Gas (COP)
              </Label>
              <Input
                id="gas"
                type="number"
                min={0}
                value={gasAvg}
                onChange={(e) => setGasAvg(Number(e.target.value))}
                placeholder="50.000"
              />
              {gasAvg > 0 && (
                <p className="text-xs text-muted-foreground">{formatCurrency(gasAvg)}/mes</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="internet" className="flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                Internet (COP)
              </Label>
              <Input
                id="internet"
                type="number"
                min={0}
                value={internetAvg}
                onChange={(e) => setInternetAvg(Number(e.target.value))}
                placeholder="100.000"
              />
              {internetAvg > 0 && (
                <p className="text-xs text-muted-foreground">{formatCurrency(internetAvg)}/mes</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Teléfono (COP)
              </Label>
              <Input
                id="phone"
                type="number"
                min={0}
                value={phoneAvg}
                onChange={(e) => setPhoneAvg(Number(e.target.value))}
                placeholder="60.000"
              />
              {phoneAvg > 0 && (
                <p className="text-xs text-muted-foreground">{formatCurrency(phoneAvg)}/mes</p>
              )}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Generar egresos recurrentes automáticamente</Label>
              <p className="text-sm text-muted-foreground">
                Crea automáticamente registros de egresos para cada servicio el día 5 de cada mes
              </p>
            </div>
            <Switch checked={automateUtilities} onCheckedChange={setAutomateUtilities} />
          </div>
        </CardContent>
      </Card>

      {/* Sección: Otros Servicios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Otros Servicios
          </CardTitle>
          <CardDescription>
            Configure otros servicios mensuales de la sede (seguridad, aseo, recolección de basuras).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Seguridad (COP)
              </Label>
              <Input
                id="security"
                type="number"
                min={0}
                value={securityAmount}
                onChange={(e) => setSecurityAmount(Number(e.target.value))}
                placeholder="200.000"
              />
              {securityAmount > 0 && (
                <p className="text-xs text-muted-foreground">{formatCurrency(securityAmount)}/mes</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cleaning" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Aseo (COP)
              </Label>
              <Input
                id="cleaning"
                type="number"
                min={0}
                value={cleaningAmount}
                onChange={(e) => setCleaningAmount(Number(e.target.value))}
                placeholder="150.000"
              />
              {cleaningAmount > 0 && (
                <p className="text-xs text-muted-foreground">{formatCurrency(cleaningAmount)}/mes</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="waste" className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Recolección de Basuras (COP)
              </Label>
              <Input
                id="waste"
                type="number"
                min={0}
                value={wasteDisposalAmount}
                onChange={(e) => setWasteDisposalAmount(Number(e.target.value))}
                placeholder="30.000"
              />
              {wasteDisposalAmount > 0 && (
                <p className="text-xs text-muted-foreground">{formatCurrency(wasteDisposalAmount)}/mes</p>
              )}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Generar egresos recurrentes automáticamente</Label>
              <p className="text-sm text-muted-foreground">
                Crea automáticamente registros de egresos para estos servicios el día 1 de cada mes
              </p>
            </div>
            <Switch checked={automateOthers} onCheckedChange={setAutomateOthers} />
          </div>
        </CardContent>
      </Card>

      {/* Botón Guardar */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg" className="min-w-[200px]">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Configuración
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
