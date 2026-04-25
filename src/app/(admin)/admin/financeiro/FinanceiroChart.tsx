"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

interface FinanceiroChartProps {
  data: { date: string; receita: number }[];
}

export function FinanceiroChart({ data }: FinanceiroChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center border-2 border-dashed border-outline-variant/30 rounded-2xl bg-surface-container-low/50 mt-6">
        <p className="text-on-surface-variant text-sm text-center">
          Nenhum dado financeiro para o período selecionado.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full mt-6 -ml-4">
      <ResponsiveContainer width="100%" height="100%" minHeight={300}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-outline-variant/20" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'currentColor', fontSize: 12 }}
            className="text-on-surface-variant"
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'currentColor', fontSize: 12 }}
            className="text-on-surface-variant"
            tickFormatter={(value) => `R$ ${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--color-surface-container-highest)', 
              borderColor: 'var(--color-outline-variant)',
              borderRadius: '0.75rem',
              color: 'var(--color-on-surface)',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
            }}
            itemStyle={{ color: 'var(--color-primary)', fontWeight: 'bold' }}
            formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
          />
          <Area 
            type="monotone" 
            dataKey="receita" 
            stroke="var(--color-primary)" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorReceita)" 
            activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--color-primary)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
