import { useEffect, useState } from 'react'
import { useKV } from '@/lib/useKV'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
// Badge removed along with role/permission chips
import { Separator } from '@/components/ui/separator'
import { User as UserIcon, Upload, Save, AtSign } from 'lucide-react'
import { toast } from 'sonner'
import { User as UserType } from '@/types'
import { useLanguage } from '@/contexts/LanguageContext'
import { slugify } from '@/lib/utils'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { COUNTRY_CODES, COUNTRY_PHONE_EXAMPLES } from '@/constants'

interface UserProfileProps {
  user: UserType
  onUserUpdate: (user: UserType) => void
}

export default function UserProfile({ user, onUserUpdate }: Readonly<UserProfileProps>) {
  const { t, language } = useLanguage()
  const [, setUsers] = useKV<UserType[]>('users', [])
  const [isUpdating, setIsUpdating] = useState(false)
  
  const [formData, setFormData] = useState({
    name: user.name,
  username: user.username || '',
    email: user.email,
    phone: user.phone || '',
    avatar_url: user.avatar_url || ''
  })

  // Extract prefix for selector from existing phone, default to MX +52
  const initialPrefix = (() => {
    const regex = /^\+(\d{1,3})/
    const match = regex.exec(user.phone || '')
    if (match) return `+${match[1]}`
    return '+52'
  })()
  const [phonePrefix, setPhonePrefix] = useState<string>(initialPrefix)

  // Sync with incoming user and auto-fill missing fields
  useEffect(() => {
    setFormData(prev => {
      const next = { ...prev }
      if (!prev.name && user.name) { next.name = user.name }
      if (!prev.email && user.email) { next.email = user.email }
      if (!prev.phone && user.phone) { next.phone = user.phone }
      if (!prev.avatar_url && user.avatar_url) { next.avatar_url = user.avatar_url }
      if (!prev.username) {
        const suggested = user.username?.trim() || slugify(user.name).replace(/-+/g, '.')
        next.username = suggested
      }
      return next
    })
  }, [user])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePhoneChange = (value: string) => {
    const local = value.replace(/[^\d\s-()]/g, '')
    setFormData(prev => ({ ...prev, phone: `${phonePrefix} ${local}`.trim() }))
  }

  const handlePrefixChange = (prefix: string) => {
    setPhonePrefix(prefix)
    const localPart = (formData.phone || '').replace(/^\+\d{1,4}\s?/, '')
    setFormData(prev => ({ ...prev, phone: `${prefix} ${localPart}`.trim() }))
  }

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // In a real app, you would upload to a service like Cloudinary, S3, etc.
      // For demo purposes, we'll use a placeholder URL
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setFormData(prev => ({
          ...prev,
          avatar_url: result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveProfile = async () => {
    setIsUpdating(true)
    
    try {
      const updatedUser = {
        ...user,
  name: formData.name,
  username: formData.username?.toLowerCase(),
        email: formData.email,
        phone: formData.phone,
        avatar_url: formData.avatar_url,
        updated_at: new Date().toISOString()
      }

      // Update in users array
      await setUsers(prev => 
        prev.map(u => u.id === user.id ? updatedUser : u)
      )

      // Update current user
      onUserUpdate(updatedUser)
      try {
        window.localStorage.setItem('current-user', JSON.stringify(updatedUser))
      } catch {
        // noop
      }
      
      toast.success(t('profile.success'))
    } catch (error) {
      toast.error(t('profile.error'))
      throw error
    } finally {
      setIsUpdating(false)
    }
  }

  // Role/permission chips removed for simplified profile view

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, 'PPP', { locale: language === 'es' ? es : enUS })
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            {t('profile.title')}
          </CardTitle>
          <CardDescription>
            {t('profile.personal_info')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={formData.avatar_url} alt={formData.name} />
                <AvatarFallback className="text-lg">
                  {getInitials(formData.name)}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                <Upload className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{user.name}</h3>
              {/* Role badge removed */}
              <p className="text-sm text-muted-foreground">
                {t('profile.joined_on')}: {formatDate(user.created_at)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Personal Information */}
          <div className="space-y-4">
            <h4 className="font-semibold">{t('profile.personal_info')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">@{t('profile.username') || 'usuario'}</Label>
                <div className="flex items-center gap-2">
                  <AtSign className="h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value.replace(/[^a-z0-9_.]/gi, '').toLowerCase())}
                    placeholder="tu.usuario"
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t('profile.username_hint') || 'Letras, números, puntos y guiones bajos.'}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('profile.phone')}</Label>
                <div className="flex gap-2">
                  <Select value={phonePrefix} onValueChange={handlePrefixChange}>
                    <SelectTrigger className="w-24">
                      {(() => {
                        const sel = COUNTRY_CODES.find(c => c.code === phonePrefix)
                        const flag = sel ? sel.label.split(' ')[0] : ''
                        return <span className="truncate">{`${flag} ${phonePrefix}`}</span>
                      })()}
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_CODES.map(cc => (
                        <SelectItem key={cc.code} value={cc.code}>{cc.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    id="phone"
                    type="tel"
                    value={(formData.phone || '').replace(/^\+\d{1,4}\s?/, '')}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder={COUNTRY_PHONE_EXAMPLES[phonePrefix] || '55 1234 5678'}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{`${phonePrefix} ${COUNTRY_PHONE_EXAMPLES[phonePrefix] || '55 1234 5678'}`}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Business information removed for this simplified view */}

          {/* Save Changes */}
          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSaveProfile} 
              disabled={isUpdating}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isUpdating ? t('profile.saving') : t('profile.save_changes')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}