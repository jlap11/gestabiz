import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TimeSelectorProps } from '@/types/settings';

export function TimeSelector({
  value,
  defaultValue,
  onValueChange,
  placeholder = "Seleccionar hora",
  className,
}: TimeSelectorProps) {
  return (
    <Select value={value} defaultValue={defaultValue} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {Array.from({ length: 24 }, (_, i) => {
          const hour = i.toString().padStart(2, '0')
          return (
            <SelectItem key={i} value={`${hour}:00`}>
              {hour}:00
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}