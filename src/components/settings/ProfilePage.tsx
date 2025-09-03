import { User } from '@/types'
import UserProfile from './UserProfile'

interface ProfilePageProps {
  user: User
  onClose?: () => void
  onUserUpdate?: (user: User) => void
}

export default function ProfilePage({ user, onClose, onUserUpdate }: Readonly<ProfilePageProps>) {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Perfil</h2>
        {onClose && (
          <button className="text-sm text-muted-foreground underline" onClick={onClose}>Cerrar</button>
        )}
      </div>
      <UserProfile user={user} onUserUpdate={onUserUpdate || (() => {})} />
    </div>
  )
}
