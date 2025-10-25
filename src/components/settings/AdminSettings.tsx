import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Briefcase } from '@phosphor-icons/react'
import { SettingItem } from './SettingItem'
import { TimeSelector } from './TimeSelector'
import { useLanguage } from '@/contexts/LanguageContext'
import { AdminSettingsProps } from '@/types/settings'

export function AdminSettings({ businessId }: AdminSettingsProps) {
  const daysOfWeek = [
    'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Configuraciones del Negocio
        </CardTitle>
        <CardDescription>Administra las configuraciones de tu negocio</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <SettingItem
            title="Permitir reservas online"
            description="Los clientes pueden agendar citas directamente desde la plataforma"
            defaultChecked
          />

          <SettingItem
            title="Confirmación automática"
            description="Las citas se confirman automáticamente sin necesidad de aprobación manual"
          />

          <SettingItem
            title="Recordatorios automáticos"
            description="Envía recordatorios automáticos a los clientes antes de sus citas"
            defaultChecked
          />

          <SettingItem
            title="Mostrar precios públicamente"
            description="Los precios de los servicios son visibles para todos"
            defaultChecked
          />
        </div>

        <Separator />

        <div className="space-y-3">
          <Label className="text-base font-medium">
            Horario de atención predeterminado
          </Label>
          <div className="space-y-3">
            {daysOfWeek.map((day) => (
              <div key={day} className="flex items-center gap-4">
                <div className="w-20 text-sm font-medium">{day}</div>
                <div className="flex items-center gap-2">
                  <TimeSelector defaultValue="09:00" className="w-28" />
                  <span className="text-muted-foreground">-</span>
                  <TimeSelector defaultValue="18:00" className="w-28" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <Button className="w-full">Guardar Horarios</Button>
        </div>
      </CardContent>
    </Card>
  )
}