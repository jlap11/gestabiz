import React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { EmployeeRevenue } from '@/types/accounting.types'
import { formatCOP } from '@/lib/accounting/colombiaTaxes'

interface EmployeeRevenueChartProps {
  data: EmployeeRevenue[]
  height?: number
}

const COLORS = [
  '#10b981', // Verde - Ingresos
  '#3b82f6', // Azul
  '#06b6d4', // Cyan
  '#8b5cf6', // Púrpura
  '#14b8a6', // Turquesa
  '#6366f1', // Índigo
  '#f59e0b', // Ámbar
  '#f97316', // Naranja
  '#ec4899', // Rosa
  '#ef4444', // Rojo
]

export const EmployeeRevenueChart: React.FC<EmployeeRevenueChartProps> = ({
  data,
  height = 400,
}) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const empData = payload[0].payload
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-foreground mb-2">{empData.employee}</p>
          <p className="text-sm text-chart-1">Ingresos generados: {formatCOP(empData.income)}</p>
          {empData.appointments !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">
              {empData.appointments} citas completadas
            </p>
          )}
          {empData.avgPerAppointment !== undefined && (
            <p className="text-xs text-muted-foreground">
              Promedio por cita: {formatCOP(empData.avgPerAppointment)}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="employee"
          className="text-muted-foreground"
          tick={{ fill: 'currentColor' }}
          angle={-45}
          textAnchor="end"
          height={100}
        />
        <YAxis
          className="text-muted-foreground"
          tick={{ fill: 'currentColor' }}
          tickFormatter={value => `$${(value / 1000000).toFixed(1)}M`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: '20px' }} formatter={() => 'Ingresos Generados'} />
        <Bar dataKey="income" name="Ingresos" radius={[8, 8, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
