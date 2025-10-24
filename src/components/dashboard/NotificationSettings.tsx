import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Bell,
  Calendar,
  Clock,
  EnvelopeSimple as Mail,
  Gear as Settings,
} from '@phosphor-icons/react'
import { useNotifications } from '@/hooks/useNotifications'
import { toast } from 'sonner'

export default function NotificationSettings() {
  const { settings, updateSettings } = useNotifications()
  const [selectedTimes, setSelectedTimes] = useState<number[]>(settings.reminderTiming)

  const reminderOptions = [
    { value: 10, label: '10 minutos antes' },
    { value: 30, label: '30 minutos antes' },
    { value: 60, label: '1 hora antes' },
    { value: 120, label: '2 horas antes' },
    { value: 1440, label: '1 día antes' },
    { value: 2880, label: '2 días antes' },
    { value: 10080, label: '1 semana antes' },
  ]

  const handleReminderTimeToggle = (minutes: number) => {
    const newTimes = selectedTimes.includes(minutes)
      ? selectedTimes.filter(t => t !== minutes)
      : [...selectedTimes, minutes]

    setSelectedTimes(newTimes)
    updateSettings({ reminderTiming: newTimes })
  }

  const handleTestNotification = () => {
    toast.success('Notificación de prueba', {
      description: 'Esta es una notificación de prueba para verificar que funcionen correctamente.',
      icon: <Bell className="h-4 w-4" />,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-semibold">Configuración de Notificaciones</h2>
          <p className="text-muted-foreground">Personaliza cómo y cuándo recibir recordatorios</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Email Reminders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Recordatorios por Email</CardTitle>
                <CardDescription>Recibe notificaciones por correo electrónico</CardDescription>
              </div>
            </div>
            <Switch
              checked={settings.emailReminders}
              onCheckedChange={checked => updateSettings({ emailReminders: checked })}
            />
          </CardHeader>
        </Card>

        {/* Reminder Timing */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Tiempo de Recordatorios</CardTitle>
            </div>
            <CardDescription>
              Selecciona cuándo quieres recibir recordatorios antes de tus citas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {reminderOptions.map(option => (
                <Badge
                  key={option.value}
                  variant={selectedTimes.includes(option.value) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => handleReminderTimeToggle(option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
            {selectedTimes.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Selecciona al menos un tiempo de recordatorio
              </p>
            )}
          </CardContent>
        </Card>

        {/* Daily Digest */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Resumen Diario</CardTitle>
                <CardDescription>
                  Recibe un resumen de tus citas del día cada mañana
                </CardDescription>
              </div>
            </div>
            <Switch
              checked={settings.dailyDigest}
              onCheckedChange={checked => updateSettings({ dailyDigest: checked })}
            />
          </CardHeader>
        </Card>

        {/* Weekly Report */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Reporte Semanal</CardTitle>
                <CardDescription>Recibe un reporte de actividad semanal los lunes</CardDescription>
              </div>
            </div>
            <Switch
              checked={settings.weeklyReport}
              onCheckedChange={checked => updateSettings({ weeklyReport: checked })}
            />
          </CardHeader>
        </Card>

        <Separator />

        {/* Test Notification */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Probar Notificaciones</CardTitle>
            <CardDescription>
              Envía una notificación de prueba para verificar que la configuración funciona
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleTestNotification} variant="outline" className="gap-2">
              <Bell className="h-4 w-4" />
              Enviar Notificación de Prueba
            </Button>
          </CardContent>
        </Card>

        {/* Current Settings Summary */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">Resumen de Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Recordatorios por email:</span>
              <Badge variant={settings.emailReminders ? 'default' : 'secondary'}>
                {settings.emailReminders ? 'Activado' : 'Desactivado'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Tiempos de recordatorio:</span>
              <span className="text-sm text-muted-foreground">
                {selectedTimes.length} configurado{selectedTimes.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Resumen diario:</span>
              <Badge variant={settings.dailyDigest ? 'default' : 'secondary'}>
                {settings.dailyDigest ? 'Activado' : 'Desactivado'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Reporte semanal:</span>
              <Badge variant={settings.weeklyReport ? 'default' : 'secondary'}>
                {settings.weeklyReport ? 'Activado' : 'Desactivado'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
