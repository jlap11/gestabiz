import React from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLanguage } from '@/contexts/LanguageContext'
import { User } from '@/types'
import { toast } from 'sonner'
import { useKV } from '@/hooks/useKV'
import { LanguageSelectorProps } from '@/types/settings'

export function LanguageSelector({ user, onUserUpdate }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useLanguage()
  const [, setUsers] = useKV<User[]>('users', [])

  const handleLanguageChange = async (newLanguage: 'es' | 'en') => {
    try {
      const updatedUser = {
        ...user,
        language: newLanguage,
        updated_at: new Date().toISOString(),
      }

      await setUsers(prev => prev.map(u => (u.id === user.id ? updatedUser : u)))

      setLanguage(newLanguage)
      onUserUpdate(updatedUser)
      toast.success(t('settings.preferences_saved'))
    } catch (error) {
      toast.error(t('common.messages.updateError'))
      throw error
    }
  }

  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">{t('settings.languageSection.title')}</Label>
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="es">
            <div className="flex items-center gap-2">
              <span className="text-lg">🇪🇸</span>
              <span>{t('settings.spanish')}</span>
            </div>
          </SelectItem>
          <SelectItem value="en">
            <div className="flex items-center gap-2">
              <span className="text-lg">🇺🇸</span>
              <span>{t('settings.english')}</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}