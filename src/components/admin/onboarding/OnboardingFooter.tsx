import { Card, CardContent } from '@/components/ui/card'

export function OnboardingFooter() {
  return (
    <Card className="border-dashed">
      <CardContent className="pt-6">
        <div className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">¿Qué sigue?</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Recibirás un código de invitación único para compartir con empleados</li>
            <li>Podrás configurar sedes, servicios y horarios</li>
            <li>Invita a empleados escaneando tu código QR</li>
            <li>Empieza a recibir y gestionar citas</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}