import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'

interface RangeFilter {
  min: number
  max: number
}

interface RatingRangeFilterProps {
  value: RangeFilter
  onChange: (value: RangeFilter) => void
}

export function RatingRangeFilter({ value, onChange }: RatingRangeFilterProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Rating</Label>
        <span className="text-sm text-muted-foreground">
          {value.min.toFixed(1)} - {value.max.toFixed(1)} ⭐
        </span>
      </div>
      <Slider
        min={0}
        max={5}
        step={0.5}
        value={[value.min, value.max]}
        onValueChange={([min, max]) => onChange({ min, max })}
        className="w-full"
        aria-label="Rango de rating"
      />
    </div>
  )
}