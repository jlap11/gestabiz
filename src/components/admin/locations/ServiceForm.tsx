import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Location, Service } from '@/types'

interface ServiceFormProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  editingService: Service | null
  locations: Location[]
  serviceForm: {
    name: string
    description: string
    duration: number
    price: number
    currency: string
    category: string
    location_id: string
  }
  setServiceForm: (form: any) => void
  onSubmit: (e: React.FormEvent) => void
}

export function ServiceForm({
  isOpen,
  onOpenChange,
  editingService,
  locations,
  serviceForm,
  setServiceForm,
  onSubmit,
}: ServiceFormProps) {
  const { t } = useLanguage()

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingService ? t('services.edit_service') : t('services.new_service')}
          </DialogTitle>
          <DialogDescription>
            {editingService
              ? t('admin.locationManagement.editServiceDescription')
              : t('admin.locationManagement.createServiceDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('admin.locationManagement.basicInfo')}</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="service-name">{t('services.name')}</Label>
                <Input
                  id="service-name"
                  value={serviceForm.name}
                  onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                  placeholder={t('admin.locationManagement.serviceNamePlaceholder')}
                  required
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="service-description">{t('services.description')}</Label>
                <Textarea
                  id="service-description"
                  value={serviceForm.description}
                  onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder={t('admin.locationManagement.serviceDescriptionPlaceholder')}
                  rows={3}
                  className="w-full resize-none"
                />
              </div>

              <div>
                <Label htmlFor="service-category">{t('services.category')}</Label>
                <Input
                  id="service-category"
                  value={serviceForm.category}
                  onChange={e => setServiceForm({ ...serviceForm, category: e.target.value })}
                  placeholder={t('admin.locationManagement.serviceCategoryPlaceholder')}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Configuración del servicio */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('admin.locationManagement.serviceConfig')}</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="service-duration">
                  {t('services.duration')} ({t('services.minutes')})
                </Label>
                <Input
                  id="service-duration"
                  type="number"
                  value={serviceForm.duration}
                  onChange={e =>
                    setServiceForm({ ...serviceForm, duration: parseInt(e.target.value) || 0 })
                  }
                  min="5"
                  step="5"
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="service-price">{t('services.price')}</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                    €
                  </span>
                  <Input
                    id="service-price"
                    type="number"
                    value={serviceForm.price}
                    onChange={e =>
                      setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) || 0 })
                    }
                    min="0"
                    step="0.01"
                    className="rounded-l-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('admin.locationManagement.location')}</h3>
            
            <div>
              <Label htmlFor="service-location">{t('admin.locationManagement.assignLocation')}</Label>
              <Select
                value={serviceForm.location_id}
                onValueChange={value => setServiceForm({ ...serviceForm, location_id: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('admin.locationManagement.selectLocation')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    {t('admin.locationManagement.allLocations')}
                  </SelectItem>
                  {locations.map(location => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {t('admin.locationManagement.locationHint')}
              </p>
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
              {editingService ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}