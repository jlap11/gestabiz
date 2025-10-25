import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface LocationFilterProps {
  value: string | undefined
  locations: Array<{ id: string; name: string }>
  onChange: (value: string) => void
}

export function LocationFilter({ value, locations, onChange }: LocationFilterProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="location">Sede</Label>
      <Select value={value || 'all'} onValueChange={onChange}>
        <SelectTrigger id="location" aria-label="Seleccionar sede" className="min-h-[44px] min-w-[44px]">
          <SelectValue placeholder="Todas las sedes" />
        </SelectTrigger>
        <SelectContent className="max-w-[95vw]">
          <SelectItem value="all">Todas las sedes</SelectItem>
          {locations.map(location => (
            <SelectItem key={location.id} value={location.id}>
              {location.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}