import React, { useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { MapPin, Users, X } from '@phosphor-icons/react'
import { usePriceFormatter } from '@/hooks/usePriceFormatter'
import type { Service, Location, Employee } from '@/types/supabase'

interface ServiceFormData {
  name: string
  description: string
  duration_minutes: number
  price: number
  currency: string
  category: string
  image_url: string
  is_active: boolean
}

interface ServiceFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => Promise<void>
  editingService: Service | null
  formData: ServiceFormData
  onFormChange: (field: keyof ServiceFormData, value: any) => void
  locations: Location[]
  employees: Employee[]
  selectedLocations: string[]
  selectedEmployees: string[]
  onToggleLocation: (locationId: string) => void
  onToggleEmployee: (employeeId: string) => void
  pendingImageFiles: File[]
  onPendingImageFilesChange: (files: File[]) => void
  onImageUploaded: (urls: string[]) => void
  isSaving: boolean
}

export const ServiceForm: React.FC<ServiceFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingService,
  formData,
  onFormChange,
  locations,
  employees,
  selectedLocations,
  selectedEmployees,
  onToggleLocation,
  onToggleEmployee,
  pendingImageFiles,
  onPendingImageFilesChange,
  onImageUploaded,
  isSaving,
}) => {
  const { t } = useLanguage()
  const {
    priceDisplay,
    formatPrice,
    handlePriceChange,
    handlePriceBlur,
    updatePriceDisplay,
  } = usePriceFormatter()

  // Update price display when formData.price changes
  useEffect(() => {
    updatePriceDisplay(formData.price)
  }, [formData.price, updatePriceDisplay])

  const handlePriceInputChange = (value: string) => {
    handlePriceChange(value, (price) => onFormChange('price', price))
  }

  const handlePriceInputBlur = () => {
    handlePriceBlur(formData.price)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="bg-card border-border text-foreground max-w-[95vw] sm:max-w-3xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6"
        role="dialog"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <DialogHeader>
          <DialogTitle id="dialog-title">
            {editingService ? t('admin.actions.editService') : t('admin.actions.createService')}
          </DialogTitle>
          <DialogDescription id="dialog-description" className="text-muted-foreground">
            {editingService
              ? t('admin.actions.updateServiceInfo')
              : t('admin.actions.completeServiceInfo')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {/* Name */}
          <div>
            <Label htmlFor="name" className="text-sm sm:text-base font-medium">
              {t('admin.services.nameLabel')} <span className="text-red-500" aria-label={t('common.required')}>*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => onFormChange('name', e.target.value)}
              placeholder={t('admin.services.namePlaceholder')}
              required
              aria-required="true"
              aria-describedby="name-error"
              className="min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
            />
            <div id="name-error" className="sr-only" aria-live="polite"></div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm sm:text-base font-medium">
              {t('admin.services.descriptionLabel')}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => onFormChange('description', e.target.value)}
              placeholder={t('admin.services.descriptionPlaceholder')}
              rows={3}
              className="min-h-[88px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-describedby="description-help"
            />
            <p id="description-help" className="text-xs text-muted-foreground mt-1">
              {t('admin.services.descriptionHelp')}
            </p>
          </div>

          {/* Duration & Price - Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="duration_minutes" className="text-sm sm:text-base font-medium">
                {t('admin.services.durationLabel')} <span className="text-red-500" aria-label={t('common.required')}>*</span>
              </Label>
              <Input
                id="duration_minutes"
                type="number"
                min="1"
                max="1440"
                value={formData.duration_minutes}
                onChange={e => onFormChange('duration_minutes', parseInt(e.target.value) || 0)}
                required
                aria-required="true"
                aria-describedby="duration-help"
                className="min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
              />
              <p id="duration-help" className="text-xs text-muted-foreground mt-1">
                {t('admin.services.durationHelp')}
              </p>
            </div>
            <div>
              <Label htmlFor="price" className="text-sm sm:text-base font-medium">
                {t('admin.services.priceLabel')} <span className="text-red-500" aria-label={t('common.required')}>*</span>
              </Label>
              <div className="relative">
                <span 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm sm:text-base"
                  aria-hidden="true"
                >
                  $
                </span>
                <Input
                  id="price"
                  type="text"
                  value={priceDisplay}
                  onChange={e => handlePriceInputChange(e.target.value)}
                  onBlur={handlePriceInputBlur}
                  placeholder="0"
                  className="pl-8 min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  required
                  aria-required="true"
                  aria-describedby="price-help price-display"
                />
              </div>
              <div id="price-display" className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                {formData.price > 0 && `$ ${formatPrice(formData.price)}`}
              </div>
              <p id="price-help" className="text-xs text-muted-foreground">
                {t('admin.services.priceHelp')}
              </p>
            </div>
          </div>

          {/* Image Upload */}
          <fieldset>
            <legend className="text-sm sm:text-base font-medium mb-2">
              {t('admin.services.imageLabel')}
            </legend>
            <p className="text-xs text-muted-foreground mb-2">{t('admin.services.imageDesc')}</p>
            {formData.image_url ? (
              <div className="relative w-full h-48 rounded-lg overflow-hidden mb-2">
                <img
                  src={formData.image_url}
                  alt={t('admin.services.imageAlt')}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    onFormChange('image_url', '')
                    onPendingImageFilesChange([])
                  }}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-white rounded-full p-1 min-w-[32px] min-h-[32px]"
                  aria-label={t('admin.actions.removeImage')}
                  title={t('admin.actions.removeImage')}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : pendingImageFiles.length > 0 ? (
              <div className="relative w-full h-48 rounded-lg overflow-hidden mb-2 bg-muted">
                <img
                  src={URL.createObjectURL(pendingImageFiles[0])}
                  alt={t('admin.services.previewAlt')}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => onPendingImageFilesChange([])}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-white rounded-full p-1 min-w-[32px] min-h-[32px]"
                  aria-label={t('admin.actions.removeImage')}
                  title={t('admin.actions.removeImage')}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : editingService ? (
              <ImageUploader
                bucket="service-images"
                maxFiles={1}
                maxSizeMB={5}
                onUploadComplete={onImageUploaded}
                onUploadError={error => toast.error(error)}
                folderPath={`services/${editingService.id}`}
              />
            ) : (
              <ImageUploader
                bucket="service-images"
                maxFiles={1}
                maxSizeMB={5}
                delayedUpload={true}
                onFileSelected={files =>
                  onPendingImageFilesChange(Array.isArray(files) ? files : [files])
                }
                onUploadError={error => toast.error(error)}
                folderPath="temp"
              />
            )}
          </fieldset>

          {/* Location Assignment */}
          {locations.length > 0 && (
            <fieldset>
              <legend className="text-sm sm:text-base font-medium mb-2">
                {t('admin.services.availableAtLocations')}
              </legend>
              <div 
                className="space-y-2 max-h-40 overflow-y-auto border border-border rounded-lg p-3"
                role="group"
                aria-labelledby="locations-legend"
              >
                {locations.map(location => (
                  <div key={location.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`location-${location.id}`}
                      checked={selectedLocations.includes(location.id)}
                      onCheckedChange={() => onToggleLocation(location.id)}
                      className="focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    />
                    <label
                      htmlFor={`location-${location.id}`}
                      className="text-sm text-foreground cursor-pointer flex items-center gap-2 min-h-[44px] flex-1"
                    >
                      <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                      <span>{location.name}</span>
                    </label>
                  </div>
                ))}
              </div>
              {selectedLocations.length === 0 && (
                <p className="text-xs text-amber-400 mt-1" role="alert">
                  {t('admin.services.selectAtLeastOneLocation')}
                </p>
              )}
            </fieldset>
          )}

          {/* Employee Assignment */}
          {employees.length > 0 && (
            <fieldset>
              <legend className="text-sm sm:text-base font-medium mb-2">
                {t('admin.services.providedBy')}
              </legend>
              <div 
                className="space-y-2 max-h-40 overflow-y-auto border border-border rounded-lg p-3"
                role="group"
                aria-labelledby="employees-legend"
              >
                {employees.map(employee => (
                  <div key={employee.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`employee-${employee.id}`}
                      checked={selectedEmployees.includes(employee.id)}
                      onCheckedChange={() => onToggleEmployee(employee.id)}
                      className="focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    />
                    <label
                      htmlFor={`employee-${employee.id}`}
                      className="text-sm text-foreground cursor-pointer flex items-center gap-2 min-h-[44px] flex-1"
                    >
                      <Users className="h-3 w-3 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                      <span>
                        {employee.profiles?.full_name ||
                          employee.profiles?.email ||
                          t('admin.services.noName')}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </fieldset>
          )}

          {/* Active Status */}
          <div className="flex items-center gap-2 min-h-[44px]">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={checked => onFormChange('is_active', checked as boolean)}
              className="focus:ring-2 focus:ring-primary focus:ring-offset-2"
            />
            <Label 
              htmlFor="is_active" 
              className="cursor-pointer text-sm sm:text-base font-medium flex-1"
            >
              {t('admin.services.activeLabel')}
            </Label>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSaving}
              className="min-h-[44px] min-w-[44px] w-full sm:w-auto focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label={t('common.actions.cancel')}
            >
              {t('common.actions.cancel')}
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px] min-w-[44px] w-full sm:w-auto"
              disabled={isSaving}
              aria-label={(() => {
                if (isSaving) return t('common.actions.saving')
                return editingService ? t('common.actions.update') : t('common.actions.create')
              })()}
            >
              {(() => {
                if (isSaving) return t('common.actions.saving')
                return editingService ? t('common.actions.update') : t('common.actions.create')
              })()}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}