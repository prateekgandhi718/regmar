'use client'

import { 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Area, 
  AreaChart,
  CartesianGrid
} from 'recharts'
import { HistoricalValuation } from '@/redux/api/investmentsApi'
import { useTheme } from 'next-themes'

interface HistoricalChartProps {
  data: HistoricalValuation[]
  hideValues?: boolean
}

export const HistoricalChart = ({ data, hideValues }: HistoricalChartProps) => {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const formattedData = data.map(item => ({
    name: item.monthYear.split(' ')[0], // Just the month
    value: item.value,
    fullDate: item.monthYear
  }))

  if (hideValues) {
    return (
      <div className="bg-card dark:bg-[#111111] border border-border dark:border-white/5 rounded-4xl p-8 h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Chart hidden for privacy</p>
      </div>
    )
  }

  return (
    <div className="bg-card dark:bg-[#111111] border border-border dark:border-white/5 rounded-4xl p-6 pt-10 h-[320px] shadow-sm">
      <div className="flex items-center justify-between mb-6 px-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Portfolio Growth</h3>
      </div>
      <ResponsiveContainer width="100%" height="80%">
        <AreaChart data={formattedData}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={isDark ? '#ffffff05' : '#00000005'} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: isDark ? '#ffffff40' : '#00000040', fontSize: 10, fontWeight: 900 }}
            dy={10}
          />
          <YAxis hide domain={[(dataMin: number) => dataMin - 100000, (dataMax: number) => dataMax + 100000]} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isDark ? '#111111' : '#ffffff', 
              borderColor: isDark ? '#ffffff10' : '#00000010',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: '900',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
            itemStyle={{ color: '#6366f1' }}
            formatter={(value: number | string | undefined) => {
              if (value === undefined) return ['0', 'Value']
              return [`₹${(Number(value) / 100000).toFixed(2)}L`, 'Value']
            }}
            labelStyle={{ color: isDark ? '#ffffff60' : '#00000060', marginBottom: '4px' }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#6366f1" 
            strokeWidth={4}
            fillOpacity={1} 
            fill="url(#colorValue)" 
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

