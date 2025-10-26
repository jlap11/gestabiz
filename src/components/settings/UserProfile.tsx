import { useEffect, useState } from 'react'
import { useKV } from '@/lib/useKV'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { User as UserType } from '@/types'
import { useLanguage } from '@/contexts/LanguageContext'
import { slugify } from '@/lib/utils'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { COUNTRY_CODES, COUNTRY_PHONE_EXAMPLES } from '@/constants'
import { useFileUpload } from '@/hooks/useFileUpload'
import { supabase } from '@/lib/supabase'
import { ImageCropper } from './ImageCropper'

interface UserProfileProps {
  user: UserType
  onUserUpdate: (user: UserType) => void
}

export default function UserProfile({ user, onUserUpdate }: Readonly<UserProfileProps>) {
  const { t, language } = useLanguage()
  const [, setUsers] = useKV<UserType[]>('users', [])
  const [isUpdating, setIsUpdating] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const { uploadFile, deleteFile } = useFileUpload('user-avatars')
  
  // Image cropper states
  const [showCropper, setShowCropper] = useState(false)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  
  const [formData, setFormData] = useState({
    name: user.name,
    username: user.username || '',
    email: user.email,
    phone: user.phone || '',
    avatar_url: user.avatar_url || ''
  })

  // Detectar si es autenticación OAuth (Google, etc)
  const isOAuthUser = Boolean(user.avatar_url && (user.avatar_url.includes('googleusercontent.com') || user.avatar_url.includes('lh3.googleusercontent.com')))

  // Extract prefix for selector from existing phone, default to CO +57
  const initialPrefix = (() => {
    const regex = /^\+(\d{1,3})/
    const match = regex.exec(user.phone || '')
    if (match) return `+${match[1]}`
    return '+57' // Default to Colombia
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

  // Handle file selection - open cropper
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida')
      return
    }

    setSelectedImageFile(file)
    setShowCropper(true)
  }

  // Handle cropped image upload
  const handleCroppedImageUpload = async (croppedBlob: Blob) => {
    setIsUploadingAvatar(true)

    try {
      // Delete old avatar if exists
      if (formData.avatar_url?.includes('supabase')) {
        const oldPath = formData.avatar_url.split('/').pop()
        if (oldPath && user.id) {
          await deleteFile(`${user.id}/${oldPath}`)
        }
      }

      // Convert blob to file
      const croppedFile = new File([croppedBlob], `avatar-${Date.now()}.jpg`, {
        type: 'image/jpeg'
      })

      // Upload new avatar with userId as folder
      const fileName = `avatar-${Date.now()}.jpg`
      const filePath = `${user.id}/${fileName}`
      
      const result = await uploadFile(croppedFile, filePath)
      
      if (result.success && result.url) {
        // Add cache-busting timestamp to URL
        const timestamp = Date.now()
        const newAvatarUrl = `${result.url}?t=${timestamp}`
        
        // Update form data with new URL (with cache buster)
        setFormData(prev => ({
          ...prev,
          avatar_url: newAvatarUrl
        }))

        // Update profile in Supabase (store clean URL without timestamp)
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: result.url })
          .eq('id', user.id)

        if (updateError) {
          toast.error('Error al actualizar el avatar en la base de datos')
          return
        }

        // Update user object immediately to reflect in UI
        const updatedUser = { ...user, avatar_url: newAvatarUrl }
        onUserUpdate(updatedUser)
        
        // Also update in localStorage
        try {
          window.localStorage.setItem('current-user', JSON.stringify(updatedUser))
        } catch {
          // Ignore localStorage errors
        }

        // Force re-render of all Avatar components by triggering a state update
        window.dispatchEvent(new CustomEvent('avatar-updated', { 
          detail: { userId: user.id, avatarUrl: newAvatarUrl } 
        }))

        toast.success('Avatar actualizado exitosamente')
      } else {
        toast.error(result.error || 'Error al subir el avatar')
      }
    } catch {
      toast.error('Error inesperado al subir el avatar')
    } finally {
      setIsUploadingAvatar(false)
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
      {/* Header Card con Avatar */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Avatar con botón de upload */}
        <div className="relative flex flex-col items-center">
          <div className="rounded-full bg-gradient-to-br from-primary/20 to-primary/5 p-1">
            <Avatar key={formData.avatar_url} className="h-24 w-24 border-2 border-primary/20">
              <AvatarImage src={formData.avatar_url} alt={formData.name} />
              <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                {getInitials(formData.name)}
              </AvatarFallback>
            </Avatar>
          </div>
          <label className={`absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-2 shadow-md transition-all border-2 border-background ${
            isUploadingAvatar 
              ? 'opacity-50 cursor-not-allowed' 
              : 'cursor-pointer hover:bg-primary/90 hover:scale-105'
          }`}>
            {isUploadingAvatar ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleAvatarUpload}
              disabled={isUploadingAvatar}
              className="hidden"
            />
          </label>
        </div>

        {/* Info del Usuario */}
        <div className="flex-1 w-full space-y-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h3 className="text-2xl font-bold text-foreground">
                {user.name}
              </h3>
              <p className="text-sm text-muted-foreground font-medium mt-1">
                @{formData.username}
              </p>
            </div>
            <div className="text-left md:text-right">
              <span className="inline-flex items-center gap-1.5 text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-full border border-border">
                <span>�</span> 
                <span className="font-medium">{t('profile.joined_on')}:</span>
                <span>{formatDate(user.created_at)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario de Edición */}
      <div className="bg-card border border-border rounded-lg shadow-sm p-6">
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-foreground pb-2 border-b border-border">
            Información Personal
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nombre Completo
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                className="w-full"
                placeholder={t('common.placeholders.clientName')}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Nombre de Usuario
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={e => handleInputChange('username', e.target.value)}
                  className="w-full pl-8"
                  placeholder="usuario123"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Teléfono
              </Label>
              <div className="flex gap-2">
                <Select value={phonePrefix} onValueChange={handlePrefixChange} disabled={isOAuthUser}>
                  <SelectTrigger className={`w-32 ${isOAuthUser ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {(() => {
                      const sel = COUNTRY_CODES.find(c => c.code === phonePrefix)
                      const flag = sel ? sel.label.split(' ')[0] : ''
                      return <span className="truncate text-sm">{`${flag} ${phonePrefix}`}</span>
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
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Ejemplo: {`${phonePrefix} ${COUNTRY_PHONE_EXAMPLES[phonePrefix] || '55 1234 5678'}`}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => handleInputChange('email', e.target.value)}
                className="w-full"
                placeholder="usuario@ejemplo.com"
              />
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t border-border">
            <Button 
              onClick={handleSaveProfile} 
              disabled={isUpdating}
              className="min-w-32"
            >
              {isUpdating ? 'Guardando...' : t('profile.save_changes')}
            </Button>
          </div>
        </div>
      </div>

      {/* Image Cropper Modal */}
      <ImageCropper
        isOpen={showCropper}
        onClose={() => {
          setShowCropper(false)
          setSelectedImageFile(null)
        }}
        imageFile={selectedImageFile}
        onCropComplete={handleCroppedImageUpload}
      />
    </div>
  )
}