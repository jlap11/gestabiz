/**
 * WorkScheduleEditor - Editor de horario laboral para empleados
 * 
 * Permite a los empleados configurar su horario de trabajo para cada negocio.
 * Cada día de la semana puede tener:
 * - Estado activo/inactivo
 * - Hora de inicio
 * - Hora de fin
 */

import React, { useState, useEffect } from 'react'
import { Clock, Save, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface WorkScheduleEditorProps {
  businessId: string
  employeeId: string
  onScheduleChanged?: () => void
}

interface DaySchedule {
  is_active: boolean
  start_time: string // HH:mm format
  end_time: string // HH:mm format
}

type WeekSchedule = {
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
  sunday: DaySchedule
}

const DAYS_ES = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

const DEFAULT_SCHEDULE: DaySchedule = {
  is_active: true,
  start_time: '09:00',
  end_time: '18:00',
}

export function WorkScheduleEditor({
  businessId,
  employeeId,
  onScheduleChanged,
}: WorkScheduleEditorProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [schedule, setSchedule] = useState<WeekSchedule>({
    monday: { ...DEFAULT_SCHEDULE },
    tuesday: { ...DEFAULT_SCHEDULE },
    wednesday: { ...DEFAULT_SCHEDULE },
    thursday: { ...DEFAULT_SCHEDULE },
    friday: { ...DEFAULT_SCHEDULE },
    saturday: { is_active: false, start_time: '09:00', end_time: '14:00' },
    sunday: { is_active: false, start_time: '09:00', end_time: '14:00' },
  })

  // Cargar horario existente
  useEffect(() => {
    async function fetchSchedule() {
      try {
        setLoading(true)

        const { data, error } = await supabase
          .from('business_employees')
          .select('work_schedule')
          .eq('business_id', businessId)
          .eq('employee_id', employeeId)
          .single()

        if (error) throw error

        if (data?.work_schedule) {
          setSchedule(data.work_schedule as WeekSchedule)
        }
      } catch (err) {
        console.error('[WorkScheduleEditor] Error fetching schedule:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSchedule()
  }, [businessId, employeeId])

  // Actualizar estado de un día
  const toggleDay = (day: keyof WeekSchedule) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        is_active: !prev[day].is_active,
      },
    }))
  }

  // Actualizar hora de inicio
  const updateStartTime = (day: keyof WeekSchedule, time: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        start_time: time,
      },
    }))
  }

  // Actualizar hora de fin
  const updateEndTime = (day: keyof WeekSchedule, time: string) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        end_time: time,
      },
    }))
  }

  // Validar horario
  const validateSchedule = (): string | null => {
    const days = Object.keys(schedule) as (keyof WeekSchedule)[]

    for (const day of days) {
      const daySchedule = schedule[day]

      if (daySchedule.is_active) {
        // Validar que start_time < end_time
        if (daySchedule.start_time >= daySchedule.end_time) {
          return `${DAYS_ES[day]}: La hora de inicio debe ser anterior a la hora de fin`
        }
      }
    }

    return null
  }

  // Guardar horario
  const handleSave = async () => {
    // Validar
    const validationError = validateSchedule()
    if (validationError) {
      toast.error(validationError)
      return
    }

    try {
      setSaving(true)

      const { error } = await supabase
        .from('business_employees')
        .update({ work_schedule: schedule })
        .eq('business_id', businessId)
        .eq('employee_id', employeeId)

      if (error) throw error

      toast.success('Horario actualizado correctamente')
      onScheduleChanged?.()
    } catch (err) {
      console.error('[WorkScheduleEditor] Error saving schedule:', err)
      toast.error('Error al guardar el horario')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Horario de Trabajo
        </CardTitle>
        <CardDescription>
          Configura los días y horarios en los que trabajarás en este negocio.
          Esto se usará para determinar tu disponibilidad.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Los clientes podrán agendar citas contigo solo durante estos horarios.
            Asegúrate de mantener tu horario actualizado.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          {(Object.keys(schedule) as (keyof WeekSchedule)[]).map((day) => {
            const daySchedule = schedule[day]

            return (
              <div
                key={day}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                  daySchedule.is_active
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-muted/30 border-border'
                }`}
              >
                {/* Día + Switch */}
                <div className="flex items-center gap-3 w-32">
                  <Switch
                    checked={daySchedule.is_active}
                    onCheckedChange={() => toggleDay(day)}
                  />
                  <Label className="font-medium cursor-pointer" onClick={() => toggleDay(day)}>
                    {DAYS_ES[day]}
                  </Label>
                </div>

                {/* Hora de Inicio */}
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Inicio
                  </Label>
                  <Input
                    type="time"
                    value={daySchedule.start_time}
                    onChange={(e) => updateStartTime(day, e.target.value)}
                    disabled={!daySchedule.is_active}
                    className="h-9"
                  />
                </div>

                {/* Hora de Fin */}
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    Fin
                  </Label>
                  <Input
                    type="time"
                    value={daySchedule.end_time}
                    onChange={(e) => updateEndTime(day, e.target.value)}
                    disabled={!daySchedule.is_active}
                    className="h-9"
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Botón Guardar */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Horario
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
