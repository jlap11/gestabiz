import { Building2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface BasicInfoFormProps {
  name: string
  description: string
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
}

export function BasicInfoForm({
  name,
  description,
  onNameChange,
  onDescriptionChange,
}: BasicInfoFormProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Building2 className="h-5 w-5 text-primary" />
          Información básica
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Datos principales de tu negocio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Business Name */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            Nombre del negocio <span className="text-red-500">*</span>
          </label>
          <Input
            id="name"
            value={name}
            onChange={e => onNameChange(e.target.value)}
            placeholder="Ej: Salón de Belleza María"
            className="bg-background border-border"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium text-foreground">
            Descripción (opcional)
          </label>
          <Textarea
            id="description"
            value={description}
            onChange={e => onDescriptionChange(e.target.value)}
            placeholder="Describe tu negocio..."
            rows={3}
            className="bg-background border-border"
          />
        </div>
      </CardContent>
    </Card>
  )
}