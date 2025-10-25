import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ShoppingCart } from '@phosphor-icons/react'
import { SettingItem } from './SettingItem'
import { useLanguage } from '@/contexts/LanguageContext'
import { ClientSettingsProps } from '@/types/settings'

export function ClientSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Preferencias de Cliente
        </CardTitle>
        <CardDescription>
          Configura tus preferencias de reserva y comunicación
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <SettingItem
            title="Recordatorios de citas"
            description="Recibe recordatorios automáticos antes de tus citas"
            defaultChecked
          />

          <SettingItem
            title="Confirmación por email"
            description="Recibe confirmación por correo al agendar una cita"
            defaultChecked
          />

          <SettingItem
            title="Notificaciones de promociones"
            description="Recibe ofertas especiales de los negocios que sigues"
          />

          <SettingItem
            title="Guardar métodos de pago"
            description="Almacena tarjetas para reservas más rápidas"
          />
        </div>

        <Separator />

        <div className="space-y-3">
          <Label className="text-base font-medium">Tiempo de anticipación preferido</Label>
          <p className="text-sm text-muted-foreground">
            ¿Con cuánta anticipación quieres recibir recordatorios?
          </p>
          <Select defaultValue="24">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 hora antes</SelectItem>
              <SelectItem value="2">2 horas antes</SelectItem>
              <SelectItem value="4">4 horas antes</SelectItem>
              <SelectItem value="24">1 día antes</SelectItem>
              <SelectItem value="48">2 días antes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="space-y-3">
          <Label className="text-base font-medium">Historial de servicios</Label>
          <div className="p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Has completado <strong className="text-foreground">0 servicios</strong> hasta
              ahora
            </p>
            <Button variant="outline" className="mt-3 w-full">
              Ver Historial Completo
            </Button>
          </div>
        </div>

        <div className="pt-4">
          <Button className="w-full">Guardar Preferencias</Button>
        </div>
      </CardContent>
    </Card>
  )
}