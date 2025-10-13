import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { LocationComparison } from '@/types/accounting.types';
import { formatCOP } from '@/lib/accounting/colombiaTaxes';

interface LocationBarChartProps {
  data: LocationComparison[];
  height?: number;
  horizontal?: boolean;
}

export const LocationBarChart: React.FC<LocationBarChartProps> = ({
  data,
  height = 400,
  horizontal = false,
}) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const locationData = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-semibold text-foreground mb-2">
            {locationData.location}
          </p>
          <p className="text-sm text-chart-1">
            Ingresos: {formatCOP(locationData.income)}
          </p>
          <p className="text-sm text-chart-2">
            Egresos: {formatCOP(locationData.expense)}
          </p>
          {locationData.profit !== undefined && (
            <p className="text-sm font-semibold text-foreground mt-2 pt-2 border-t border-border">
              Ganancia: {formatCOP(locationData.profit)}
            </p>
          )}
          {locationData.transactionCount !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">
              {locationData.transactionCount} transacciones
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            type="number"
            className="text-muted-foreground"
            tick={{ fill: 'currentColor' }}
            tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
          />
          <YAxis
            type="category"
            dataKey="location"
            className="text-muted-foreground"
            tick={{ fill: 'currentColor' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar
            dataKey="income"
            name="Ingresos"
            fill="hsl(var(--chart-1))"
            radius={[0, 8, 8, 0]}
          />
          <Bar
            dataKey="expense"
            name="Egresos"
            fill="hsl(var(--chart-2))"
            radius={[0, 8, 8, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="location"
          className="text-muted-foreground"
          tick={{ fill: 'currentColor' }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          className="text-muted-foreground"
          tick={{ fill: 'currentColor' }}
          tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ paddingTop: '10px' }} />
        <Bar
          dataKey="income"
          name="Ingresos"
          fill="hsl(var(--chart-1))"
          radius={[8, 8, 0, 0]}
        />
        <Bar
          dataKey="expense"
          name="Egresos"
          fill="hsl(var(--chart-2))"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};
