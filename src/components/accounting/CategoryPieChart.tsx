import React from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { CategoryDistribution } from '@/types/accounting.types'
import { formatCOP } from '@/lib/accounting/colombiaTaxes'

interface CategoryPieChartProps {
  data: CategoryDistribution[]
  height?: number
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data, height = 400 }) => {
  const RADIAN = Math.PI / 180

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    if (percent < 0.05) return null // No mostrar etiquetas para segmentos muy pequeños

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-foreground mb-1">{data.category}</p>
          <p className="text-sm text-muted-foreground">Total: {formatCOP(data.amount)}</p>
          <p className="text-sm text-muted-foreground">{data.count} transacciones</p>
          <p className="text-sm text-muted-foreground">{data.percentage.toFixed(1)}% del total</p>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={height * 0.35}
          fill="#8884d8"
          dataKey="amount"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value, entry: any) => (
            <span className="text-sm text-foreground">{entry.payload.category}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
