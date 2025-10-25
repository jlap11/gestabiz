import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/contexts/LanguageContext'

interface BasicInfoSectionProps {
  formData: {
    name: string
    category: string
    resource_model: 'location' | 'employee'
    description: string
  }
  businessCategories: Array<{ id: string; name: string }>
  onInputChange: (field: string, value: string) => void
}

export function BasicInfoSection({ formData, businessCategories, onInputChange }: BasicInfoSectionProps) {
  const { t } = useLanguage()

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <span className="h-5 w-5" aria-hidden="true">🏢</span>
        {t('business.registration.basic_info')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="business-name">{t('business.registration.business_name')}</Label>
          <Input
            id="business-name"
            value={formData.name}
            onChange={e => onInputChange('name', e.target.value)}
            placeholder={t('business.registration.placeholders.business_name')}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="business-category">{t('business.registration.category')}</Label>
          <Select
            value={formData.category}
            onValueChange={value => onInputChange('category', value)}
          >
            <SelectTrigger id="business-category">
              <SelectValue placeholder={t('business.registration.placeholders.category')} />
            </SelectTrigger>
            <SelectContent>
              {businessCategories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-3">
        <Label>{t('business.registration.business_model')}</Label>
        <RadioGroup
          value={formData.resource_model}
          onValueChange={value => onInputChange('resource_model', value)}
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="location" id="location-model" />
            <Label htmlFor="location-model" className="cursor-pointer">
              <div>
                <div className="font-medium">{t('business.registration.location_based')}</div>
                <div className="text-sm text-gray-600">
                  {t('business.registration.location_based_description')}
                </div>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="employee" id="employee-model" />
            <Label htmlFor="employee-model" className="cursor-pointer">
              <div>
                <div className="font-medium">{t('business.registration.employee_based')}</div>
                <div className="text-sm text-gray-600">
                  {t('business.registration.employee_based_description')}
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="business-description">{t('business.registration.description')}</Label>
        <Textarea
          id="business-description"
          value={formData.description}
          onChange={e => onInputChange('description', e.target.value)}
          placeholder={t('business.registration.placeholders.description')}
          rows={3}
        />
      </div>
    </div>
  )
}