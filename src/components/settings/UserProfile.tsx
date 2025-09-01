import { useState } from 'react'
import { useKV } from '@/lib/useKV'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { User, UserCircle, Upload, FloppyDisk as Save } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { User as UserType } from '@/types'
import { useLanguage } from '@/contexts/LanguageContext'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'

interface UserProfileProps {
  user: UserType
  onUserUpdate: (user: UserType) => void
}

export default function UserProfile({ user, onUserUpdate }: UserProfileProps) {
  const { t, language } = useLanguage()
  const [users, setUsers] = useKV<UserType[]>('users', [])
  const [isUpdating, setIsUpdating] = useState(false)
  
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    avatar_url: user.avatar_url || ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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
      
      toast.success(t('profile.success'))
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error(t('profile.error'))
    } finally {
      setIsUpdating(false)
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default">{t('role.admin')}</Badge>
      case 'employee':
        return <Badge variant="secondary">{t('role.employee')}</Badge>
      case 'client':
        return <Badge variant="outline">{t('role.client')}</Badge>
      default:
        return null
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
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
              <div className="flex items-center gap-2">
                {getRoleBadge(user.role)}
              </div>
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
                <Label htmlFor="name">
                  {t('profile.name')}
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={t('profile.name')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">
                  {t('profile.email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder={t('profile.email')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">
                  {t('profile.phone')}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Business Information */}
          {user.business_id && (
            <div className="space-y-4">
              <h4 className="font-semibold">{t('profile.business_info')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('profile.role')}</Label>
                  <div className="flex items-center gap-2">
                    {getRoleBadge(user.role)}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('profile.permissions')}</Label>
                  <div className="flex flex-wrap gap-1">
                    {user.permissions?.slice(0, 3).map(permission => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {permission.replace('_', ' ')}
                      </Badge>
                    ))}
                    {user.permissions?.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{user.permissions.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

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