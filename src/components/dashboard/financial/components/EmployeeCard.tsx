import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calculator, Settings } from 'lucide-react'
import { formatCOP } from '@/lib/accounting/colombiaTaxes'
import { Employee, PayrollConfig } from '../hooks'

interface EmployeeCardProps {
  employee: Employee
  config?: PayrollConfig
  onOpenConfig: (employee: Employee) => void
  onOpenPayment: (employee: Employee) => void
}

export function EmployeeCard({ employee, config, onOpenConfig, onOpenPayment }: EmployeeCardProps) {
  const hasConfig = !!config

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-foreground">{employee.full_name}</h4>
            <p className="text-sm text-muted-foreground">{employee.email}</p>
            <div className="mt-2 flex gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Salario: </span>
                <span className="font-medium">
                  {formatCOP(employee.salary_base)}
                </span>
              </div>
              {hasConfig && config.commission_rate > 0 && (
                <div>
                  <span className="text-muted-foreground">Comisión: </span>
                  <span className="font-medium">{config.commission_rate}%</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenConfig(employee)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => onOpenPayment(employee)}
            >
              <Calculator className="h-4 w-4 mr-2" />
              Calcular Nómina
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}