import { useLanguage } from '@/contexts/LanguageContext'

interface OnboardingHeaderProps {
  title?: string
  subtitle?: string
}

export function OnboardingHeader({ 
  title, 
  subtitle = "Registra tu negocio y empieza a gestionar citas en minutos" 
}: OnboardingHeaderProps) {
  const { t } = useLanguage()

  return (
    <div className="text-center space-y-2">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        {title || t('admin.actions.createBusiness')}
      </h1>
      <p className="text-muted-foreground">
        {subtitle}
      </p>
    </div>
  )
}