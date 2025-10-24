import { User } from '@/types'
import { useLanguage } from '@/contexts/LanguageContext'

interface LayoutHeaderProps {
  user: User
  title?: string
  subtitle?: string
  roleSelector: React.ReactNode
  actionButton?: React.ReactNode
}

export default function LayoutHeader({
  user,
  title,
  subtitle,
  roleSelector,
  actionButton,
}: Readonly<LayoutHeaderProps>) {
  const { t } = useLanguage()
  return (
    <div className="bg-card border-b border-border">
      <div className="px-6 py-4">
        <div className="flex items-start justify-between">
          {/* Title Section */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {title || `Welcome back, ${user.name?.split(' ')[0] || 'User'}!`}
            </h1>
            {subtitle && <p className="text-muted-foreground text-xs mt-1">{subtitle}</p>}
          </div>

          {/* Actions Section */}
          <div className="flex items-center gap-3">
            {/* Action Button (varies by role) */}
            {actionButton}

            {/* Role Selector (always visible) */}
            {roleSelector}
          </div>
        </div>
      </div>
    </div>
  )
}
