import React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartDataPoint } from '@/types/accounting.types'
import { formatCOP } from '@/lib/accounting/colombiaTaxes'

interface IncomeVsExpenseChartProps {
  data: ChartDataPoint[]
  height?: number
}

export const IncomeVsExpenseChart: React.FC<IncomeVsExpenseChartProps> = ({
  data,
  height = 400,
}) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-foreground mb-2">{payload[0].payload.period}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCOP(entry.value)}
            </p>
          ))}
          {payload[0]?.payload.profit !== undefined && (
            <p className="text-sm font-semibold text-foreground mt-2 pt-2 border-t border-border">
              Ganancia: {formatCOP(payload[0].payload.profit)}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="period" className="text-muted-foreground" tick={{ fill: 'currentColor' }} />
        <YAxis
          className="text-muted-foreground"
          tick={{ fill: 'currentColor' }}
          tickFormatter={value => `$${(value / 1000000).toFixed(1)}M`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{
            paddingTop: '20px',
          }}
        />
        <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[8, 8, 0, 0]} />
        <Bar dataKey="expense" name="Egresos" fill="#ef4444" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
