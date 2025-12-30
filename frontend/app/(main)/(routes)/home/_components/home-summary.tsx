'use client'

import { useMemo, useState } from 'react'
import { Transaction } from '@/redux/api/transactionsApi'
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  subMonths,
  eachDayOfInterval,
  isSameDay,
  isWithinInterval,
  startOfWeek,
  subWeeks,
  endOfWeek,
  startOfDay,
  subDays,
  endOfDay,
  eachHourOfInterval,
  isSameHour,
  isAfter,
} from 'date-fns'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import { formatAmount } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '@/redux/features/authSlice'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { useTheme } from 'next-themes'

interface HomeSummaryProps {
  transactions: Transaction[]
}

type Period = 'today' | 'week' | 'month'

export const HomeSummary = ({ transactions }: HomeSummaryProps) => {
  const user = useSelector(selectCurrentUser)
  const [period, setPeriod] = useState<Period>('month')
  const { theme } = useTheme()
  const stats = useMemo(() => {
    const now = new Date()

    // Day totals
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const yesterdayStart = startOfDay(subDays(now, 1))
    const yesterdayEnd = endOfDay(subDays(now, 1))

    // Week totals
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
    const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })

    // Month totals
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = endOfMonth(subMonths(now, 1))

    const calculateTotal = (start: Date, end: Date) => {
      return transactions.reduce((acc, tx) => {
        const txDate = parseISO(tx.newDate || tx.originalDate)
        if (isWithinInterval(txDate, { start, end }) && tx.type === 'debit') {
          const isInvestment = tx.categoryId?.name === 'Investment'
          const isSelfTransfer = tx.categoryId?.name === 'Self Transfer'
          if (!isInvestment && !isSelfTransfer) {
            return acc + (tx.newAmount || tx.originalAmount)
          }
        }
        return acc
      }, 0)
    }

    const todayTotal = calculateTotal(todayStart, todayEnd)
    const yesterdayTotal = calculateTotal(yesterdayStart, yesterdayEnd)

    const weekTotal = calculateTotal(weekStart, weekEnd)
    const lastWeekTotal = calculateTotal(lastWeekStart, lastWeekEnd)

    const monthTotal = calculateTotal(monthStart, monthEnd)
    const lastMonthTotal = calculateTotal(lastMonthStart, lastMonthEnd)

    return {
      today: { current: todayTotal, previous: yesterdayTotal, label: 'today' },
      week: { current: weekTotal, previous: lastWeekTotal, label: 'this week' },
      month: { current: monthTotal, previous: lastMonthTotal, label: 'this month' },
    }
  }, [transactions])

  const chartData = useMemo(() => {
    const now = new Date()

    if (period === 'today') {
      const hours = eachHourOfInterval({
        start: startOfDay(now),
        end: endOfDay(now),
      })

      const prevHours = eachHourOfInterval({
        start: startOfDay(subDays(now, 1)),
        end: endOfDay(subDays(now, 1)),
      })

      let currentSum = 0
      let prevSum = 0

      return hours.map((hour, index) => {
        const currentHourTxs = transactions.filter((tx) => {
          const txDate = parseISO(tx.newDate || tx.originalDate)
          return isSameHour(txDate, hour) && tx.type === 'debit' && tx.categoryId?.name !== 'Investment' && tx.categoryId?.name !== 'Self Transfer'
        })

        const prevHourTxs = transactions.filter((tx) => {
          const txDate = parseISO(tx.newDate || tx.originalDate)
          return isSameHour(txDate, prevHours[index]) && tx.type === 'debit' && tx.categoryId?.name !== 'Investment' && tx.categoryId?.name !== 'Self Transfer'
        })

        currentSum += currentHourTxs.reduce((acc, tx) => acc + (tx.newAmount || tx.originalAmount), 0)
        prevSum += prevHourTxs.reduce((acc, tx) => acc + (tx.newAmount || tx.originalAmount), 0)

        // Don't show future data for today
        const isFuture = isAfter(hour, now)

        return {
          time: format(hour, 'HH:mm'),
          current: isFuture ? null : currentSum,
          previous: prevSum,
        }
      })
    }

    if (period === 'week') {
      const days = eachDayOfInterval({
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      })

      const prevDays = eachDayOfInterval({
        start: startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
        end: endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
      })

      let currentSum = 0
      let prevSum = 0

      return days.map((day, index) => {
        const currentDayTxs = transactions.filter((tx) => {
          const txDate = parseISO(tx.newDate || tx.originalDate)
          return isSameDay(txDate, day) && tx.type === 'debit' && tx.categoryId?.name !== 'Investment' && tx.categoryId?.name !== 'Self Transfer'
        })

        const prevDayTxs = transactions.filter((tx) => {
          const txDate = parseISO(tx.newDate || tx.originalDate)
          return isSameDay(txDate, prevDays[index]) && tx.type === 'debit' && tx.categoryId?.name !== 'Investment' && tx.categoryId?.name !== 'Self Transfer'
        })

        currentSum += currentDayTxs.reduce((acc, tx) => acc + (tx.newAmount || tx.originalAmount), 0)
        prevSum += prevDayTxs.reduce((acc, tx) => acc + (tx.newAmount || tx.originalAmount), 0)

        const isFuture = isAfter(day, now) && !isSameDay(day, now)

        return {
          time: format(day, 'EEE'),
          current: isFuture ? null : currentSum,
          previous: prevSum,
        }
      })
    }

    // Default: Month
    const days = eachDayOfInterval({
      start: startOfMonth(now),
      end: endOfMonth(now),
    })

    const prevMonthDays = eachDayOfInterval({
      start: startOfMonth(subMonths(now, 1)),
      end: endOfMonth(subMonths(now, 1)),
    })

    let currentSum = 0
    let prevSum = 0

    return days.map((day, index) => {
      const currentDayTxs = transactions.filter((tx) => {
        const txDate = parseISO(tx.newDate || tx.originalDate)
        return isSameDay(txDate, day) && tx.type === 'debit' && tx.categoryId?.name !== 'Investment' && tx.categoryId?.name !== 'Self Transfer'
      })

      // Handle months with different number of days
      const prevDay = prevMonthDays[index]
      let prevSumIncrement = 0
      if (prevDay) {
        const prevDayTxs = transactions.filter((tx) => {
          const txDate = parseISO(tx.newDate || tx.originalDate)
          return isSameDay(txDate, prevDay) && tx.type === 'debit' && tx.categoryId?.name !== 'Investment' && tx.categoryId?.name !== 'Self Transfer'
        })
        prevSumIncrement = prevDayTxs.reduce((acc, tx) => acc + (tx.newAmount || tx.originalAmount), 0)
      }

      currentSum += currentDayTxs.reduce((acc, tx) => acc + (tx.newAmount || tx.originalAmount), 0)
      prevSum += prevSumIncrement

      const isFuture = isAfter(day, now) && !isSameDay(day, now)

      return {
        time: format(day, 'd'),
        current: isFuture ? null : currentSum,
        previous: prevSum,
      }
    })
  }, [transactions, period])

  const togglePeriod = () => {
    setPeriod((prev) => {
      if (prev === 'today') return 'week'
      if (prev === 'week') return 'month'
      return 'today'
    })
  }

  const currentStats = stats[period]
  const diff = currentStats.current - currentStats.previous
  const isDown = diff < 0

  return (
    <div className="space-y-6">
      <div className="space-y-1 px-1">
        <p className="text-muted-foreground font-medium">Hello, {user?.name || 'User'}!</p>
        <h1 className="text-3xl font-black tracking-tight">Your Summary</h1>
      </div>

      <div className="bg-card dark:bg-[#111111] border border-border dark:border-white/5 rounded-[2.5rem] p-8 space-y-8 relative overflow-hidden group shadow-sm">
        <div className="space-y-6">
          <button onClick={togglePeriod} className="flex items-center gap-2 text-muted-foreground font-bold hover:text-primary transition-colors group/btn">
            <span className="text-sm uppercase tracking-widest">Spent</span>
            <span className="text-primary dark:text-white bg-secondary dark:bg-white/10 px-3 py-1 rounded-xl text-sm group-hover/btn:bg-secondary/80 dark:group-hover/btn:bg-white/20 transition-colors">
              {currentStats.label}
            </span>
          </button>

          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <div className="flex items-start gap-1">
                <span className="text-2xl font-black mt-2">₹</span>
                <span className="text-6xl font-black tracking-tighter text-primary dark:text-white">
                  {currentStats.current >= 1000 ? formatAmount(currentStats.current) : Math.round(currentStats.current)}
                </span>
                {period !== 'month' && <span className="text-2xl font-black text-muted-foreground mt-2">{period === 'today' ? 'd' : 'w'}</span>}
              </div>

              <div className="flex gap-4">
                {period !== 'today' && (
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-sm font-bold text-primary dark:text-white">₹</span>
                    <span className="text-2xl font-black tracking-tight text-primary dark:text-white">{formatAmount(stats.today.current)}</span>
                    <span className="text-sm font-bold text-orange-500 ml-0.5">d</span>
                  </div>
                )}
                {period !== 'week' && (
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-sm font-bold text-primary dark:text-white">₹</span>
                    <span className="text-2xl font-black tracking-tight text-primary dark:text-white">{formatAmount(stats.week.current)}</span>
                    <span className="text-sm font-bold text-orange-500 ml-0.5">w</span>
                  </div>
                )}
                {period !== 'month' && (
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-sm font-bold text-primary dark:text-white">₹</span>
                    <span className="text-2xl font-black tracking-tight text-primary dark:text-white">{formatAmount(stats.month.current)}</span>
                    <span className="text-sm font-bold text-orange-500 ml-0.5">m</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <div className={cn('flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg', isDown ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10')}>
                  {isDown ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}₹{formatAmount(Math.abs(diff))}
                </div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">vs {period === 'today' ? 'yesterday' : period === 'week' ? 'last week' : 'last month'}</span>
              </div>
            </div>

            <div className="h-32 w-1/2 -mb-8 relative">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <Line type="monotone" dataKey="previous" stroke={theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} strokeWidth={2} dot={false} strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="current" stroke={theme === 'dark' ? '#ffffff' : '#000000'} strokeWidth={3} dot={false} animationDuration={1500} />
                  <Tooltip content={() => null} cursor={{ stroke: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', strokeWidth: 1 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
