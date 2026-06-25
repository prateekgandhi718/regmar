'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { useTheme } from 'next-themes'

interface AllocationPieChartProps {
  mutualFundsValue: number
  etfValue: number
  stocksValue: number
  hideValues?: boolean
}

const CHART_COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6']

export const AllocationPieChart = ({ mutualFundsValue, etfValue, stocksValue, hideValues }: AllocationPieChartProps) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const chartData = [
    { name: 'Mutual Funds', value: mutualFundsValue, color: CHART_COLORS[0] },
    { name: 'ETFs', value: etfValue, color: CHART_COLORS[1] },
    { name: 'Stocks', value: stocksValue, color: CHART_COLORS[2] },
  ].filter((item) => item.value > 0)

  const total = mutualFundsValue + etfValue + stocksValue

  if (hideValues) {
    return (
      <Card className="bg-card dark:bg-[#111111] border border-border dark:border-white/5 rounded-4xl p-8 min-h-[260px] flex items-center justify-center">
        <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Allocation hidden for privacy</p>
      </Card>
    )
  }

  return (
    <Card className="bg-card dark:bg-[#111111] border border-border dark:border-white/5 rounded-4xl p-6 pt-8 shadow-sm">
      <div className="mb-6 px-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Portfolio Allocation</h3>
      </div>

      <div className="h-[220px] sm:h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={2} stroke="none">
              {chartData.map((entry, index) => (
                <Cell key={entry.name} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#111111' : '#ffffff',
                borderColor: isDark ? '#ffffff10' : '#00000010',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: '900',
                color: isDark ? '#f3f4f6' : '#111827',
              }}
              labelStyle={{ color: isDark ? '#9ca3af' : '#6b7280' }}
              itemStyle={{ color: isDark ? '#f3f4f6' : '#111827' }}
              formatter={(value: number | string | undefined) => {
                if (value === undefined) return ['₹0', 'Value']
                return [formatCurrency(Number(value)), 'Value']
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
        {chartData.map((item) => {
          const share = total > 0 ? (item.value / total) * 100 : 0
          return (
            <div key={item.name} className="rounded-2xl border border-border/70 dark:border-white/10 p-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{item.name}</p>
              </div>
              <p className="mt-1 text-sm font-black text-primary">{formatCurrency(item.value)}</p>
              <p className="text-[10px] font-bold text-muted-foreground">{share.toFixed(2)}%</p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
