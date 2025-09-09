import { User } from '@/types'
import UserProfile from './UserProfile'

interface ProfilePageProps {
  user: User
  onClose?: () => void
  onUserUpdate?: (user: User) => void
}

import { useState } from 'react';
import BusinessRegistration from '../business/BusinessRegistration';

export default function ProfilePage({ user, onClose, onUserUpdate }: Readonly<ProfilePageProps>) {
  const [showBusinessForm, setShowBusinessForm] = useState(false);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Perfil</h2>
        {onClose && (
          <button className="text-sm text-muted-foreground underline" onClick={onClose}>Cerrar</button>
        )}
      </div>
      <UserProfile user={user} onUserUpdate={onUserUpdate || (() => {})} />

      {/* Botón para crear negocio */}
      {!showBusinessForm && (
        <div className="flex justify-end mt-6">
          <button
            className="px-4 py-2 bg-fuchsia-500 hover:bg-fuchsia-600 text-white rounded font-semibold shadow"
            onClick={() => setShowBusinessForm(true)}
          >
            Crear mi negocio
          </button>
        </div>
      )}

      {/* Formulario de registro de negocio */}
      {showBusinessForm && (
        <div className="mt-8">
          <BusinessRegistration
            user={user}
            onBusinessCreated={() => {
              setShowBusinessForm(false);
              if (onUserUpdate) onUserUpdate(user);
            }}
            onCancel={() => setShowBusinessForm(false)}
          />
        </div>
      )}
    </div>
  );
}
