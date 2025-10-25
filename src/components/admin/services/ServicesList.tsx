import React from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Briefcase, 
  Plus, 
  Pencil, 
  Trash, 
  CurrencyDollar, 
  Clock 
} from '@phosphor-icons/react'
import type { Service } from '@/types/supabase'

interface ServicesListProps {
  services: Service[]
  onCreateService: () => void
  onEditService: (service: Service) => void
  onDeleteService: (serviceId: string) => void
}

export const ServicesList: React.FC<ServicesListProps> = ({
  services,
  onCreateService,
  onEditService,
  onDeleteService,
}) => {
  const { t } = useLanguage()

  if (services.length === 0) {
    return (
      <section role="region" aria-labelledby="no-services-title">
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
            <Briefcase className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mb-3 sm:mb-4" aria-hidden="true" />
            <h3 id="no-services-title" className="text-lg sm:text-xl font-semibold text-foreground mb-2">
              {t('admin.services.noServicesTitle')}
            </h3>
            <p className="text-muted-foreground text-center mb-4 text-sm sm:text-base">
              {t('admin.services.noServicesDesc')}
            </p>
            <Button
              onClick={onCreateService}
              className="bg-primary hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px] min-w-[44px] w-full sm:w-auto"
              aria-label={t('admin.actions.createFirstService')}
              title={t('admin.actions.createFirstService')}
            >
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              {t('admin.actions.createFirstService')}
            </Button>
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section role="region" aria-labelledby="services-list-title">
      <h3 id="services-list-title" className="sr-only">{t('admin.services.servicesList')}</h3>
      <div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4"
        role="list"
        aria-label={`${services.length} ${t('admin.services.servicesAvailable')}`}
      >
        {services.map(service => (
          <ServiceCard
            key={service.id}
            service={service}
            onEdit={() => onEditService(service)}
            onDelete={() => onDeleteService(service.id)}
          />
        ))}
      </div>
    </section>
  )
}

interface ServiceCardProps {
  service: Service
  onEdit: () => void
  onDelete: () => void
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onEdit, onDelete }) => {
  const { t } = useLanguage()

  return (
    <Card
      role="listitem"
      className="bg-card border-border hover:border-border/80 transition-colors focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
      tabIndex={0}
      aria-labelledby={`service-title-${service.id}`}
      aria-describedby={`service-details-${service.id}`}
    >
      <CardHeader className="p-3 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {service.image_url && (
              <img
                src={service.image_url}
                alt={`${t('admin.services.imageFor')} ${service.name}`}
                className="w-full h-28 sm:h-32 object-cover rounded-lg mb-2 sm:mb-3"
                loading="lazy"
              />
            )}
            <CardTitle 
              id={`service-title-${service.id}`}
              className="text-foreground text-base sm:text-lg truncate"
            >
              {service.name}
            </CardTitle>
            {!service.is_active && (
              <Badge variant="secondary" className="mt-2 text-[10px] sm:text-xs">
                {t('common.states.inactive')}
              </Badge>
            )}
          </div>
          <div className="flex gap-1 sm:gap-2 ml-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="text-muted-foreground hover:text-foreground focus:ring-2 focus:ring-primary focus:ring-offset-2 min-w-[44px] min-h-[44px]"
              aria-label={`${t('admin.actions.edit')} ${service.name}`}
              title={`${t('admin.actions.edit')} ${service.name}`}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-muted-foreground hover:text-red-400 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 min-w-[44px] min-h-[44px]"
              aria-label={`${t('admin.actions.delete')} ${service.name}`}
              title={`${t('admin.actions.delete')} ${service.name}`}
            >
              <Trash className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3 p-3 sm:p-6">
        <div id={`service-details-${service.id}`}>
          {service.description && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2">
              {service.description}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <CurrencyDollar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-400 flex-shrink-0" aria-hidden="true" />
            <span 
              className="text-foreground font-semibold"
              aria-label={`${t('admin.services.price')}: ${service.price.toLocaleString('es-CO')} ${service.currency}`}
            >
              $ {service.price.toLocaleString('es-CO')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" aria-hidden="true" />
            <span 
              className="text-muted-foreground"
              aria-label={`${t('admin.services.duration')}: ${service.duration_minutes} ${t('common.time.minutes')}`}
            >
              {service.duration_minutes} {t('common.time.minutes')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}