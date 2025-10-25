import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, DollarSign, Clock, Tag } from 'lucide-react';
import { formatCOP } from '@/lib/accounting/colombiaTaxes';
import { getCategoryLabel, getFrequencyLabel } from '@/utils/expense';
import type { ExpenseTemplateCardProps } from '@/types/expense';

export const ExpenseTemplateCard: React.FC<ExpenseTemplateCardProps> = ({
  template,
  onUse,
}) => {
  return (
    <Card className="transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-pointer group">
      <CardContent className="p-3 sm:p-4">
        {/* Header con título y categoría */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-foreground text-sm sm:text-base line-clamp-2 leading-tight">
              {template.name}
            </h4>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
              <Badge 
                variant="outline" 
                className="text-xs px-1.5 py-0.5 font-normal"
              >
                <Tag className="h-3 w-3 mr-1 flex-shrink-0" />
                {getCategoryLabel(template.category)}
              </Badge>
            </div>
          </div>
          
          {/* Icono de plantilla */}
          <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-lg sm:text-xl">{template.icon}</span>
          </div>
        </div>

        {/* Información principal */}
        <div className="space-y-2 sm:space-y-3 mb-4">
          {/* Monto y frecuencia */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-semibold text-foreground text-sm sm:text-base truncate">
                {formatCOP(template.amount)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
              <Clock className="h-3 w-3 flex-shrink-0" />
              <span>{getFrequencyLabel(template.frequency)}</span>
            </div>
          </div>

          {/* Descripción */}
          {template.description && (
            <div className="text-xs sm:text-sm text-muted-foreground bg-muted/30 p-2 rounded-md">
              <p className="line-clamp-2">{template.description}</p>
            </div>
          )}

          {/* Método de pago sugerido */}
          {template.suggested_payment_method && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Método sugerido:</span> {template.suggested_payment_method}
            </div>
          )}

          {/* Etiquetas adicionales */}
          {template.tags && template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {template.tags.slice(0, 3).map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs px-1.5 py-0.5 font-normal"
                >
                  {tag}
                </Badge>
              ))}
              {template.tags.length > 3 && (
                <Badge 
                  variant="secondary" 
                  className="text-xs px-1.5 py-0.5 font-normal"
                >
                  +{template.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Botón de acción */}
        <Button
          onClick={() => onUse(template)}
          className="w-full gap-1.5 text-xs sm:text-sm h-8 sm:h-9 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          variant="outline"
        >
          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
          <span>Usar plantilla</span>
        </Button>
      </CardContent>
    </Card>
  );
};