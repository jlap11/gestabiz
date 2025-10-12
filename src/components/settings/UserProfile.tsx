import { useEffect, useState } from 'react'
import { useKV } from '@/lib/useKV'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Upload } from 'lucide-react'
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, 'PPP', { locale: language === 'es' ? es : enUS })
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-zinc-900/80 border border-fuchsia-700/40 shadow-lg p-8 flex flex-col md:flex-row items-center gap-8">
        {/* Avatar grande y botón de upload */}
        <div className="relative flex flex-col items-center">
          <div className="rounded-full bg-gradient-to-br from-fuchsia-500 via-purple-500 to-indigo-500 p-1 shadow-lg">
            <Avatar className="h-28 w-28 border-4 border-zinc-950">
              <AvatarImage src={formData.avatar_url} alt={formData.name} />
              <AvatarFallback className="text-3xl">{getInitials(formData.name)}</AvatarFallback>
            </Avatar>
          </div>
          <label className="absolute bottom-2 right-2 bg-fuchsia-600 text-white rounded-full p-2 cursor-pointer hover:bg-fuchsia-700 shadow transition-colors border-2 border-zinc-950">
            <Upload className="h-5 w-5" />
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </label>
        </div>
        <div className="flex-1 w-full space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <span>👤</span> {user.name}
              </h3>
              <p className="text-sm text-fuchsia-400 font-medium mt-1">@{formData.username}</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-xs bg-zinc-800 text-zinc-200 px-3 py-1 rounded-full">
                <span>🗓️</span> {t('profile.joined_on')}: {formatDate(user.created_at)}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-fuchsia-400">Nombre</Label>
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username" className="text-fuchsia-400">Username</Label>
              <div className="flex items-center gap-2">
                <span className="text-xl">@</span>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={e => handleInputChange('username', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-fuchsia-400">Teléfono</Label>
              <div className="flex gap-2 items-center">
                <span className="text-xl">📱</span>
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
                  className="w-full"
                />
              </div>
              <p className="text-xs text-muted-foreground">{`${phonePrefix} ${COUNTRY_PHONE_EXAMPLES[phonePrefix] || '55 1234 5678'}`}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-fuchsia-400">Correo</Label>
              <div className="flex items-center gap-2">
                <span className="text-xl">✉️</span>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSaveProfile} 
              disabled={isUpdating}
              className="flex items-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold px-6 py-2 rounded shadow"
            >
              <span>💾</span>
              {isUpdating ? t('profile.saving') : t('profile.save_changes')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}