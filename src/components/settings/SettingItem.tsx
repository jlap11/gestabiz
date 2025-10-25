import React from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { SettingItemProps } from '@/types/settings'

export function SettingItem({
  title,
  description,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled = false,
}: SettingItemProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
      <div className="space-y-0.5">
        <Label className="text-base font-medium">{title}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={checked}
        defaultChecked={defaultChecked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  )
}