/**
 * TransferStatusBadge
 * 
 * Badge que muestra el estado actual del traslado de un empleado
 */

import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TransferStatusBadgeProps {
  readonly transferStatus: 'pending' | 'completed' | 'cancelled' | null;
  readonly effectiveDate: string | null;
  readonly toLocationName: string | null;
  readonly className?: string;
}

export function TransferStatusBadge({
  transferStatus,
  effectiveDate,
  toLocationName,
  className,
}: TransferStatusBadgeProps) {
  if (!transferStatus || transferStatus === 'cancelled' || transferStatus === 'completed') {
    return null;
  }

  if (transferStatus === 'pending' && effectiveDate && toLocationName) {
    const formattedDate = format(new Date(effectiveDate), 'dd MMM yyyy', { locale: es });

    return (
      <Badge variant="outline" className={className}>
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3" />
          <span>Traslado programado</span>
          <Clock className="h-3 w-3 ml-1" />
          <span className="font-semibold">{toLocationName}</span>
          <span>-</span>
          <span>{formattedDate}</span>
        </div>
      </Badge>
    );
  }

  return null;
}
