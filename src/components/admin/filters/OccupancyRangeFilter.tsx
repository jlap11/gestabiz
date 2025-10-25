import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

interface RangeFilter {
  min: number
  max: number
}

interface OccupancyRangeFilterProps {
  value: RangeFilter
  onChange: (value: RangeFilter) => void
}

export function OccupancyRangeFilter({ value, onChange }: OccupancyRangeFilterProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Ocupación</Label>
        <span className="text-sm text-muted-foreground">
          {value.min}% - {value.max}%
        </span>
      </div>
      <Slider
        min={0}
        max={100}
        step={5}
        value={[value.min, value.max]}
        onValueChange={([min, max]) => onChange({ min, max })}
        className="w-full"
        aria-label="Rango de ocupación"
      />
    </div>
  )
}