import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Location } from '@/types'

interface LocationFormProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editingLocation: Location | null
  locationForm: {
    name: string
    address: string
    city: string
    state: string
    country: string
    postal_code: string
    phone: string
    email: string
    is_primary: boolean
    business_hours: {
      monday: { open: string; close: string; is_open: boolean }
      tuesday: { open: string; close: string; is_open: boolean }
      wednesday: { open: string; close: string; is_open: boolean }
      thursday: { open: string; close: string; is_open: boolean }
      friday: { open: string; close: string; is_open: boolean }
      saturday: { open: string; close: string; is_open: boolean }
      sunday: { open: string; close: string; is_open: boolean }
    }
  }
  setLocationForm: (form: any) => void
  onSubmit: (e: React.FormEvent) => void
}

export function LocationForm({
  isOpen,
  onOpenChange,
  editingLocation,
  locationForm,
  setLocationForm,
  onSubmit,
}: LocationFormProps) {
  const { t } = useLanguage()

  const daysOfWeek = [
    'monday',
    'tuesday', 
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday'
  ] as const

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingLocation ? t('locations.edit') : t('locations.new')}
          </DialogTitle>
          <DialogDescription>
            {editingLocation
              ? t('admin.locationManagement.editDescription')
              : t('admin.actions.addNewLocation')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('admin.locationManagement.basicInfo')}</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2">
                <Label htmlFor="location-name">{t('admin.locationManagement.nameLabel')}</Label>
                <Input
                  id="location-name"
                  value={locationForm.name}
                  onChange={e => setLocationForm({ ...locationForm, name: e.target.value })}
                  placeholder={t('admin.locationManagement.namePlaceholder')}
                  required
                  className="w-full"
                />
              </div>

              <div className="col-span-1 sm:col-span-2">
                <Label htmlFor="location-address">
                  {t('admin.locationManagement.addressLabel')}
                </Label>
                <Input
                  id="location-address"
                  value={locationForm.address}
                  onChange={e => setLocationForm({ ...locationForm, address: e.target.value })}
                  placeholder={t('admin.locationManagement.addressPlaceholder')}
                  required
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="location-city">{t('admin.locationManagement.cityLabel')}</Label>
                <Input
                  id="location-city"
                  value={locationForm.city}
                  onChange={e => setLocationForm({ ...locationForm, city: e.target.value })}
                  placeholder={t('common.placeholders.city')}
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="location-state">
                  {t('admin.locationManagement.stateLabel')}
                </Label>
                <Input
                  id="location-state"
                  value={locationForm.state}
                  onChange={e => setLocationForm({ ...locationForm, state: e.target.value })}
                  placeholder={t('common.placeholders.state')}
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="location-country">
                  {t('admin.locationManagement.countryLabel')}
                </Label>
                <Input
                  id="location-country"
                  value={locationForm.country}
                  onChange={e => setLocationForm({ ...locationForm, country: e.target.value })}
                  placeholder={t('admin.locationManagement.countryPlaceholder')}
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="location-postal">
                  {t('admin.locationManagement.postalLabel')}
                </Label>
                <Input
                  id="location-postal"
                  value={locationForm.postal_code}
                  onChange={e =>
                    setLocationForm({ ...locationForm, postal_code: e.target.value })
                  }
                  placeholder={t('admin.locationManagement.postalPlaceholder')}
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="location-phone">
                  {t('admin.locationManagement.phoneLabel')}
                </Label>
                <Input
                  id="location-phone"
                  value={locationForm.phone}
                  onChange={e => setLocationForm({ ...locationForm, phone: e.target.value })}
                  placeholder={t('admin.locationManagement.phonePlaceholder')}
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="location-email">
                  {t('admin.locationManagement.emailLabel')}
                </Label>
                <Input
                  id="location-email"
                  type="email"
                  value={locationForm.email}
                  onChange={e => setLocationForm({ ...locationForm, email: e.target.value })}
                  placeholder={t('admin.locationManagement.emailPlaceholder')}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="location-primary"
                checked={locationForm.is_primary}
                onCheckedChange={checked =>
                  setLocationForm({ ...locationForm, is_primary: checked })
                }
              />
              <Label htmlFor="location-primary" className="text-sm">
                {t('admin.locationManagement.primaryLocation')}
              </Label>
            </div>
          </div>

          {/* Horarios de atención */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('business.registration.business_hours')}</h3>
            
            <div className="space-y-3">
              {daysOfWeek.map(day => (
                <div
                  key={day}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={locationForm.business_hours[day].is_open}
                      onCheckedChange={checked => {
                        setLocationForm({
                          ...locationForm,
                          business_hours: {
                            ...locationForm.business_hours,
                            [day]: { 
                              ...locationForm.business_hours[day], 
                              is_open: checked 
                            },
                          },
                        })
                      }}
                    />
                    <div className="font-medium capitalize min-w-[80px]">
                      {t(`business.registration.days.${day}`)}
                    </div>
                  </div>

                  {locationForm.business_hours[day].is_open ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={locationForm.business_hours[day].open}
                        onChange={e => {
                          setLocationForm({
                            ...locationForm,
                            business_hours: {
                              ...locationForm.business_hours,
                              [day]: { 
                                ...locationForm.business_hours[day], 
                                open: e.target.value 
                              },
                            },
                          })
                        }}
                        className="w-32"
                      />
                      <span className="text-muted-foreground text-sm">a</span>
                      <Input
                        type="time"
                        value={locationForm.business_hours[day].close}
                        onChange={e => {
                          setLocationForm({
                            ...locationForm,
                            business_hours: {
                              ...locationForm.business_hours,
                              [day]: { 
                                ...locationForm.business_hours[day], 
                                close: e.target.value 
                              },
                            },
                          })
                        }}
                        className="w-32"
                      />
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      {t('business.hours.closed')}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              {editingLocation ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}