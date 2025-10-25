import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface EmployeeTypeFilterProps {
  value: string | undefined
  onChange: (value: string) => void
}

export function EmployeeTypeFilter({ value, onChange }: EmployeeTypeFilterProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="employee-type">Tipo de Empleado</Label>
      <Select value={value || 'all'} onValueChange={onChange}>
        <SelectTrigger id="employee-type" aria-label="Seleccionar tipo de empleado" className="min-h-[44px] min-w-[44px]">
          <SelectValue placeholder="Todos los tipos" />
        </SelectTrigger>
        <SelectContent className="max-w-[95vw]">
          <SelectItem value="all">Todos los tipos</SelectItem>
          <SelectItem value="service_provider">Proveedor de Servicio</SelectItem>
          <SelectItem value="support_staff">Personal de Apoyo</SelectItem>
          <SelectItem value="location_manager">Gerente de Sede</SelectItem>
          <SelectItem value="team_lead">Líder de Equipo</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}