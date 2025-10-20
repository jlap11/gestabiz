/**
 * Component: VacationDaysWidget
 * 
 * Widget para mostrar balance de vacaciones disponibles.
 * Se muestra en EmployeeDashboard.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { VacationBalance } from '@/hooks/useEmployeeAbsences';

interface VacationDaysWidgetProps {
  balance: VacationBalance | null;
  loading?: boolean;
}

export function VacationDaysWidget({ balance, loading }: Readonly<VacationDaysWidgetProps>) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Vacaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-12 bg-muted rounded" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!balance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Vacaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">No hay información de vacaciones disponible</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const percentageUsed = (Math.max(0, balance.daysUsed) / Math.max(1, balance.totalDaysAvailable)) * 100;
  const percentageRemaining = (Math.max(0, balance.daysRemaining) / Math.max(1, balance.totalDaysAvailable)) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Vacaciones {balance.year}
          </CardTitle>
          <Badge variant="outline">{balance.totalDaysAvailable} días totales</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Días disponibles (principal) */}
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border-2 border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Días Disponibles</p>
          <p className="text-4xl font-bold text-blue-900 dark:text-blue-100">{Math.max(0, balance.daysRemaining)}</p>
        </div>

        {/* Barra de progreso */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Utilizados</span>
            <span>Pendientes</span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden flex">
            <div
              className="bg-green-500 transition-all"
              style={{ width: `${Math.max(0, percentageUsed)}%` }}
              title={`${Math.max(0, balance.daysUsed)} días utilizados`}
            />
            <div
              className="bg-yellow-500 transition-all"
              style={{ width: `${(Math.max(0, balance.daysPending) / Math.max(1, balance.totalDaysAvailable)) * 100}%` }}
              title={`${Math.max(0, balance.daysPending)} días pendientes`}
            />
            <div
              className="bg-blue-500 transition-all"
              style={{ width: `${Math.max(0, percentageRemaining)}%` }}
              title={`${Math.max(0, balance.daysRemaining)} días disponibles`}
            />
          </div>
        </div>

        {/* Estadísticas detalladas */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-green-50 dark:bg-green-950 rounded">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
              <p className="text-xs text-green-700 dark:text-green-300">Usados</p>
            </div>
            <p className="text-lg font-bold text-green-900 dark:text-green-100">{Math.max(0, balance.daysUsed)}</p>
          </div>

          <div className="p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
              <p className="text-xs text-yellow-700 dark:text-yellow-300">Pendientes</p>
            </div>
            <p className="text-lg font-bold text-yellow-900 dark:text-yellow-100">{Math.max(0, balance.daysPending)}</p>
          </div>

          <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Calendar className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              <p className="text-xs text-blue-700 dark:text-blue-300">Libres</p>
            </div>
            <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{Math.max(0, balance.daysRemaining)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
