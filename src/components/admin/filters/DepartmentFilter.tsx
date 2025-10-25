import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DepartmentFilterProps {
  value: string | undefined
  onChange: (value: string) => void
}

export function DepartmentFilter({ value, onChange }: DepartmentFilterProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="department">Departamento</Label>
      <Select value={value || 'all'} onValueChange={onChange}>
        <SelectTrigger id="department" aria-label="Seleccionar departamento" className="min-h-[44px] min-w-[44px]">
          <SelectValue placeholder="Todos los departamentos" />
        </SelectTrigger>
        <SelectContent className="max-w-[95vw]">
          <SelectItem value="all">Todos los departamentos</SelectItem>
          <SelectItem value="sales">Ventas</SelectItem>
          <SelectItem value="operations">Operaciones</SelectItem>
          <SelectItem value="customer-service">Atención al Cliente</SelectItem>
          <SelectItem value="technical">Técnico</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}