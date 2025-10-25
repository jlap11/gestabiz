import React from 'react'
import { User as UserIcon, Mail, Phone } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface Employee {
  id: string
  full_name: string
  email?: string
  phone?: string
  avatar_url?: string
}

interface AppointmentProfessionalProps {
  employee: Employee
}

export function AppointmentProfessional({ employee }: AppointmentProfessionalProps) {
  const { t } = useLanguage()

  return (
    <section role="region" aria-labelledby="professional-info">
      <h3 id="professional-info" className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
        <UserIcon className="h-4 w-4" aria-hidden="true" />
        {t('clientDashboard.professionalTitle')}
      </h3>
      <div className="flex items-center gap-3 mt-2 p-3 bg-muted/30 rounded-lg">
        {employee.avatar_url ? (
          <img
            src={employee.avatar_url}
            alt={employee.full_name}
            className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center" aria-hidden="true">
            <UserIcon className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm sm:text-base font-semibold text-foreground mb-1">
            {employee.full_name}
          </p>
          <div className="space-y-0.5">
            {employee.email && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" aria-hidden="true" />
                {employee.email}
              </p>
            )}
            {employee.phone && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" aria-hidden="true" />
                {employee.phone}
              </p>
            )}
          </div>
          {!employee.avatar_url && (
            <p className="text-xs text-muted-foreground italic mt-1">
              {t('clientDashboard.noProfilePhoto')}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}