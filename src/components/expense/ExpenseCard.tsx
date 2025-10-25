import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Calendar, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { formatCOP } from '@/lib/accounting/colombiaTaxes';
import { 
  getFrequencyLabel, 
  getDaysUntilPaymentLabel, 
  getPaymentStatusClass, 
  getPaymentTextClass,
  getCategoryLabel 
} from '@/utils/expense';
import type { ExpenseCardProps } from '@/types/expense';

export const ExpenseCard: React.FC<ExpenseCardProps> = ({ 
  expense, 
  onEdit, 
  onDelete 
}) => {
  const today = new Date();
  const paymentDate = new Date(expense.next_payment_date);
  const daysUntilPayment = Math.ceil((paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysUntilPayment < 0;
  const isUrgent = daysUntilPayment <= 3 && !isOverdue;

  return (
    <Card className={`${getPaymentStatusClass(isOverdue, isUrgent)} ${!expense.is_active ? 'opacity-50' : ''} transition-all duration-200 hover:shadow-md`}>
      <CardContent className="p-3 sm:p-4">
        {/* Header con título y estado */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-foreground text-sm sm:text-base line-clamp-2 leading-tight">
              {expense.description}
            </h4>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
              <Badge 
                variant="secondary" 
                className="text-xs px-1.5 py-0.5 font-normal"
              >
                {getCategoryLabel(expense.category)}
              </Badge>
              {(isOverdue || isUrgent) && (
                <Badge 
                  variant={isOverdue ? "destructive" : "default"}
                  className="text-xs px-1.5 py-0.5 font-normal"
                >
                  {isOverdue ? "Vencido" : "Urgente"}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Indicador visual de estado */}
          {(isOverdue || isUrgent) && (
            <AlertTriangle 
              className={`h-4 w-4 flex-shrink-0 ${isOverdue ? 'text-red-500' : 'text-yellow-500'}`} 
            />
          )}
        </div>

        {/* Información principal */}
        <div className="space-y-2 sm:space-y-3 mb-4">
          {/* Monto y frecuencia */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-semibold text-foreground text-sm sm:text-base truncate">
                {formatCOP(expense.amount)}
              </span>
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
              {getFrequencyLabel(expense.frequency)}
            </span>
          </div>

          {/* Fecha de próximo pago */}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Próximo pago:
                </span>
                <div className="text-right">
                  <p className={`text-xs sm:text-sm font-medium ${getPaymentTextClass(isOverdue, isUrgent)}`}>
                    {paymentDate.toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit'
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getDaysUntilPaymentLabel(daysUntilPayment)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Último pago (si existe) */}
          {expense.last_payment_date && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-xs text-muted-foreground">
                Último pago: {new Date(expense.last_payment_date).toLocaleDateString('es-CO', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit'
                })}
              </span>
            </div>
          )}

          {/* Método de pago (si existe) */}
          {expense.payment_method && (
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">Método:</span> {expense.payment_method}
            </div>
          )}

          {/* Notas (si existen) */}
          {expense.notes && (
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-md">
              <span className="font-medium">Notas:</span> {expense.notes}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(expense)}
            className="flex-1 sm:flex-none gap-1.5 text-xs sm:text-sm h-8 sm:h-9"
          >
            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Editar</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(expense.id)}
            className="flex-1 sm:flex-none gap-1.5 text-xs sm:text-sm h-8 sm:h-9 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Eliminar</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};