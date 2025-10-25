import { CheckCircle, Info, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import type { BusinessCategory } from '@/types/types'

interface FormData {
  name: string
  category_id: string
  description: string
  phone: string
  address: string
  city: string
  state: string
}

interface ReviewAndCreateFormProps {
  formData: FormData
  categories: BusinessCategory[]
  isLoading: boolean
  onBack: () => void
  onSubmit: () => void
}

export function ReviewAndCreateForm({
  formData,
  categories,
  isLoading,
  onBack,
  onSubmit,
}: ReviewAndCreateFormProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <CheckCircle className="h-5 w-5 text-primary" />
          Revisar y crear
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Verifica que todo esté correcto
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Review */}
        <div className="space-y-3 p-4 rounded-lg bg-background border border-border">
          <div>
            <p className="text-sm text-muted-foreground">Nombre</p>
            <p className="font-medium">{formData.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Categoría</p>
            <p className="font-medium">
              {categories.find(c => c.id === formData.category_id)?.name ||
                'No seleccionada'}
            </p>
          </div>
          {formData.description && (
            <div>
              <p className="text-sm text-muted-foreground">Descripción</p>
              <p className="text-sm">{formData.description}</p>
            </div>
          )}
          {formData.phone && (
            <div>
              <p className="text-sm text-muted-foreground">Teléfono</p>
              <p className="font-medium">{formData.phone}</p>
            </div>
          )}
          {formData.address && (
            <div>
              <p className="text-sm text-muted-foreground">Dirección</p>
              <p className="text-sm">
                {formData.address}
                {formData.city && `, ${formData.city}`}
                {formData.state && `, ${formData.state}`}
              </p>
            </div>
          )}
        </div>

        {/* Default Settings Info */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Configuración predeterminada</AlertTitle>
          <AlertDescription className="text-xs space-y-1">
            <p>• Horario: Lunes a Viernes 9:00-18:00, Sábado 9:00-14:00</p>
            <p>• Buffer entre citas: 15 minutos</p>
            <p>• Reservas con 30 días de anticipación</p>
            <p className="text-muted-foreground mt-2">
              Podrás personalizar estos valores después
            </p>
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex-1"
            size="lg"
            disabled={isLoading}
          >
            Atrás
          </Button>
          <Button onClick={onSubmit} className="flex-1" size="lg" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              'Crear negocio'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}