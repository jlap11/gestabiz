import { Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function InactivityRulesAlert() {
  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>Reglas de inactividad</AlertTitle>
      <AlertDescription className="text-xs space-y-1">
        <p>
          • Si tu negocio permanece <strong>30 días sin actividad</strong>, se desactivará
          automáticamente.
        </p>
        <p>
          • Si nunca tuviste clientes y pasó <strong>1 año sin actividad</strong>, el negocio
          se eliminará permanentemente.
        </p>
        <p className="text-muted-foreground mt-2">
          La actividad incluye: citas programadas, servicios registrados, empleados activos,
          etc.
        </p>
      </AlertDescription>
    </Alert>
  )
}