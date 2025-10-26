import { User } from '@/types'
import UserProfile from './UserProfile'
import { useLanguage } from '@/contexts/LanguageContext'

interface ProfilePageProps {
  user: User
  onClose?: () => void
  onUserUpdate?: (user: User) => void
}

import { useState } from 'react';
import BusinessRegistration from '../business/BusinessRegistration';

export default function ProfilePage({ user, onClose, onUserUpdate }: Readonly<ProfilePageProps>) {
  const [showBusinessForm, setShowBusinessForm] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{t('nav.profile')}</h2>
        {onClose && (
          <button className="text-sm text-muted-foreground underline" onClick={onClose}>
            {t('common.actions.close')}
          </button>
        )}
      </div>
      <UserProfile user={user} onUserUpdate={onUserUpdate || (() => {})} />

      {/* Botón para crear negocio */}
      {!showBusinessForm && (
        <div className="flex justify-end mt-6">
          <button
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded font-semibold shadow"
            onClick={() => setShowBusinessForm(true)}
          >
            {t('business.registration.create_business')}
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
