import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface HierarchyLevelFilterProps {
  value: number | undefined
  onChange: (value: string) => void
}

export function HierarchyLevelFilter({ value, onChange }: HierarchyLevelFilterProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="level">Nivel Jerárquico</Label>
      <Select
        value={value !== undefined ? String(value) : 'all'}
        onValueChange={onChange}
      >
        <SelectTrigger id="level" aria-label="Seleccionar nivel jerárquico" className="min-h-[44px] min-w-[44px]">
          <SelectValue placeholder="Todos los niveles" />
        </SelectTrigger>
        <SelectContent className="max-w-[95vw]">
          <SelectItem value="all">Todos los niveles</SelectItem>
          <SelectItem value="0">Nivel 0 - Owner</SelectItem>
          <SelectItem value="1">Nivel 1 - Admin</SelectItem>
          <SelectItem value="2">Nivel 2 - Manager</SelectItem>
          <SelectItem value="3">Nivel 3 - Team Lead</SelectItem>
          <SelectItem value="4">Nivel 4 - Staff</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}