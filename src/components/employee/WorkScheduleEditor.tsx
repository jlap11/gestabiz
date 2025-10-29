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
import { useLanguage } from '@/contexts/LanguageContext'

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

interface LunchBreakConfig {
  has_lunch_break: boolean
  lunch_break_start: string // HH:mm format
  lunch_break_end: string // HH:mm format
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
  monday: 'monday',
  tuesday: 'tuesday',
  wednesday: 'wednesday',
  thursday: 'thursday',
  friday: 'friday',
  saturday: 'saturday',
  sunday: 'sunday',
}

// Mapas de días para conversión entre índice (0=Domingo) y claves del WeekSchedule
const DAY_TO_INDEX: Record<keyof WeekSchedule, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

const INDEX_TO_DAY: Record<number, keyof WeekSchedule> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
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
}: Readonly<WorkScheduleEditorProps>) {
  const { t } = useLanguage()
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

  const [lunchBreak, setLunchBreak] = useState<LunchBreakConfig>({
    has_lunch_break: false,
    lunch_break_start: '12:00',
    lunch_break_end: '13:00',
  })

  // Cargar horario existente
  useEffect(() => {
    async function fetchSchedule() {
      try {
        setLoading(true)

        const { data, error } = await supabase
          .from('business_employees')
          .select('has_lunch_break, lunch_break_start, lunch_break_end')
          .eq('business_id', businessId)
          .eq('employee_id', employeeId)
          .single()

        if (error) throw error

        if (data) {
          setLunchBreak({
            has_lunch_break: data.has_lunch_break || false,
            lunch_break_start: data.lunch_break_start || '12:00',
            lunch_break_end: data.lunch_break_end || '13:00',
          })
        }

        // Intentar cargar el horario semanal desde work_schedules
        try {
          const { data: wsData, error: wsError } = await supabase
            .from('work_schedules')
            .select('day_of_week, start_time, end_time, is_working')
            .eq('employee_id', employeeId)

          if (!wsError && wsData && wsData.length > 0) {
            const next: WeekSchedule = {
              monday: { ...DEFAULT_SCHEDULE },
              tuesday: { ...DEFAULT_SCHEDULE },
              wednesday: { ...DEFAULT_SCHEDULE },
              thursday: { ...DEFAULT_SCHEDULE },
              friday: { ...DEFAULT_SCHEDULE },
              saturday: { is_active: false, start_time: '09:00', end_time: '14:00' },
              sunday: { is_active: false, start_time: '09:00', end_time: '14:00' },
            }

            for (const row of wsData as Array<{ day_of_week: number; start_time: string | null; end_time: string | null; is_working: boolean | null }>) {
              const key = INDEX_TO_DAY[row.day_of_week]
              if (key) {
                next[key] = {
                  is_active: Boolean(row.is_working),
                  start_time: row.start_time ?? next[key].start_time,
                  end_time: row.end_time ?? next[key].end_time,
                }
              }
            }

            setSchedule(next)
          }
        } catch {
          // Silenciar errores de lectura de work_schedules; mantener valores por defecto
        }
      } catch {
        // Handle error silently for now
        // El horario semanal se mantiene con los valores por defecto
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

    // Validar lunch break
    if (lunchBreak.has_lunch_break) {
      if (lunchBreak.lunch_break_start >= lunchBreak.lunch_break_end) {
        return 'Almuerzo: La hora de inicio debe ser anterior a la hora de fin'
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

      // 1) Persistir horario semanal en work_schedules
      const rows = (Object.keys(schedule) as (keyof WeekSchedule)[]).map((day) => ({
        employee_id: employeeId,
        day_of_week: DAY_TO_INDEX[day],
        start_time: schedule[day].start_time,
        end_time: schedule[day].end_time,
        is_working: schedule[day].is_active,
      }))

      const { error: wsError } = await supabase
        .from('work_schedules')
        .upsert(rows, { onConflict: 'employee_id,day_of_week' })

      if (wsError) throw wsError

      // 2) Guardar las configuraciones de almuerzo
      const { error } = await supabase
        .from('business_employees')
        .update({
          has_lunch_break: lunchBreak.has_lunch_break,
          lunch_break_start: lunchBreak.lunch_break_start,
          lunch_break_end: lunchBreak.lunch_break_end,
        })
        .eq('business_id', businessId)
        .eq('employee_id', employeeId)

      if (error) throw error

      toast.success(t('common.messages.updateSuccess'))
      onScheduleChanged?.()
    } catch {
      toast.error(t('common.messages.saveError'))
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
                    {t(`common.time.${DAYS_ES[day]}`)}
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

        {/* Lunch Break Section */}
        <div className="pt-4 border-t space-y-4">
          <div className="flex items-center gap-3 justify-between p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex-1">
              <Label className="font-medium text-amber-900 dark:text-amber-100 cursor-pointer">
                Configurar Hora de Almuerzo
              </Label>
              <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
                La misma para todos los días en que trabajes
              </p>
            </div>
            <Switch
              checked={lunchBreak.has_lunch_break}
              onCheckedChange={(checked) =>
                setLunchBreak((prev) => ({
                  ...prev,
                  has_lunch_break: checked,
                }))
              }
            />
          </div>

          {lunchBreak.has_lunch_break && (
            <div className="flex gap-4 p-4 rounded-lg bg-muted/50">
              {/* Inicio Almuerzo */}
              <div className="flex-1">
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Inicio Almuerzo
                </Label>
                <Input
                  type="time"
                  value={lunchBreak.lunch_break_start}
                  onChange={(e) =>
                    setLunchBreak((prev) => ({
                      ...prev,
                      lunch_break_start: e.target.value,
                    }))
                  }
                  className="h-9"
                />
              </div>

              {/* Fin Almuerzo */}
              <div className="flex-1">
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Fin Almuerzo
                </Label>
                <Input
                  type="time"
                  value={lunchBreak.lunch_break_end}
                  onChange={(e) =>
                    setLunchBreak((prev) => ({
                      ...prev,
                      lunch_break_end: e.target.value,
                    }))
                  }
                  className="h-9"
                />
              </div>
            </div>
          )}
        </div>

        {/* Botón Guardar */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                {t('common.actions.saving')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t('common.actions.save')}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
