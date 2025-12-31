'use client'

import { useMemo } from 'react'
import { Transaction } from '@/redux/api/transactionsApi'
import { format, parseISO, subMonths, startOfMonth, endOfMonth, isWithinInterval, isAfter, subDays } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts'
import { formatAmount } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { isInvestment, isExpense, getTransactionAmount } from '@/lib/transactions'

const ACCOUNT_COLORS = ['bg-red-500', 'bg-indigo-500', 'bg-purple-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-teal-500', 'bg-rose-500', 'bg-lime-500']

interface TransactionSummaryProps {
  transactions: Transaction[]
  selectedMonthYear: string | null
  dateRange: '30d' | '6m' | '12m' | 'all'
}

export const TransactionSummary = ({ transactions, selectedMonthYear, dateRange }: TransactionSummaryProps) => {
  const chartData = useMemo(() => {
    if (!transactions.length) return []

    // Find the range of months to display
    let filteredTxs = [...transactions]
    const now = new Date()

    if (dateRange === '30d') {
      filteredTxs = filteredTxs.filter((tx) => isAfter(parseISO(tx.newDate || tx.originalDate), subDays(now, 30)))
    } else if (dateRange === '6m') {
      filteredTxs = filteredTxs.filter((tx) => isAfter(parseISO(tx.newDate || tx.originalDate), subMonths(now, 6)))
    } else if (dateRange === '12m') {
      filteredTxs = filteredTxs.filter((tx) => isAfter(parseISO(tx.newDate || tx.originalDate), subMonths(now, 12)))
    }

    if (!filteredTxs.length) return []

    // Sort to find first and last transaction dates in range
    const sortedTxsInRange = [...filteredTxs].sort((a, b) => new Date(a.newDate || a.originalDate).getTime() - new Date(b.newDate || b.originalDate).getTime())

    const firstDate = startOfMonth(parseISO(sortedTxsInRange[0].newDate || sortedTxsInRange[0].originalDate))
    const lastDate = startOfMonth(parseISO(sortedTxsInRange[sortedTxsInRange.length - 1].newDate || sortedTxsInRange[sortedTxsInRange.length - 1].originalDate))

    const months = []
    let current = firstDate
    while (current <= lastDate) {
      months.push(current)
      current = startOfMonth(subMonths(current, -1)) // Add 1 month
    }

    return months.map((monthDate) => {
      const monthYear = format(monthDate, 'MMM yy').toUpperCase()
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)

      let expenses = 0
      let investments = 0

      transactions.forEach((tx) => {
        if (tx.refunded) return

        const txDate = parseISO(tx.newDate || tx.originalDate)
        if (isWithinInterval(txDate, { start: monthStart, end: monthEnd })) {
          const amount = getTransactionAmount(tx)
          if (isInvestment(tx)) {
            investments += amount
          } else if (isExpense(tx)) {
            expenses += amount
          }
        }
      })

      return {
        monthYear,
        expenses: Math.round(expenses),
        investments: Math.round(investments),
        fullMonthYear: format(monthDate, 'MMM yyyy').toUpperCase(),
      }
    })
  }, [transactions, dateRange])

  const selectedData = useMemo(() => {
    if (!selectedMonthYear) {
      // Calculate totals for all displayed months
      let totalExpenses = 0
      let totalInvestments = 0
      const accountMap: Record<string, number> = {}
      const categoryMap: Record<string, { amount: number; emoji: string; color: string }> = {}

      const monthsInRange = chartData.map((d) => d.fullMonthYear)

      transactions.forEach((tx) => {
        if (tx.refunded) return

        const txDate = parseISO(tx.newDate || tx.originalDate)
        const txMonthYear = format(txDate, 'MMM yyyy').toUpperCase()

        if (monthsInRange.includes(txMonthYear)) {
          const amount = getTransactionAmount(tx)
          if (isInvestment(tx)) {
            totalInvestments += amount
          } else if (isExpense(tx)) {
            totalExpenses += amount

            // Accounts split (only for expenses)
            const accName = tx.accountId.title
            accountMap[accName] = (accountMap[accName] || 0) + amount

            // Category split (only for expenses)
            if (tx.categoryId) {
              const catName = tx.categoryId.name
              if (!categoryMap[catName]) {
                categoryMap[catName] = {
                  amount: 0,
                  emoji: tx.categoryId.emoji,
                  color: tx.categoryId.color || '#94a3b8',
                }
              }
              categoryMap[catName].amount += amount
            }
          }
        }
      })

      return {
        avgExpenses: totalExpenses / (chartData.length || 1),
        avgInvestments: totalInvestments / (chartData.length || 1),
        accounts: Object.entries(accountMap).map(([name, amount]) => ({ name, amount, percent: (amount / totalExpenses) * 100 })),
        categories: Object.entries(categoryMap)
          .map(([name, data]) => ({ name, ...data, percent: (data.amount / totalExpenses) * 100 }))
          .sort((a, b) => b.amount - a.amount),
        displayRange: chartData.length > 0 ? (chartData.length > 1 ? `${chartData[0].monthYear} - ${chartData[chartData.length - 1].monthYear}` : chartData[0].monthYear) : '',
      }
    }

    // Single month selected
    let totalExpenses = 0
    let totalInvestments = 0
    const accountMap: Record<string, number> = {}
    const categoryMap: Record<string, { amount: number; emoji: string; color: string }> = {}

    transactions.forEach((tx) => {
      if (tx.refunded) return

      const txDate = parseISO(tx.newDate || tx.originalDate)
      const txMonthYear = format(txDate, 'MMM yyyy').toUpperCase()

      if (txMonthYear === selectedMonthYear) {
        const amount = getTransactionAmount(tx)
        if (isInvestment(tx)) {
          totalInvestments += amount
        } else if (isExpense(tx)) {
          totalExpenses += amount

          const accName = tx.accountId.title
          accountMap[accName] = (accountMap[accName] || 0) + amount

          if (tx.categoryId) {
            const catName = tx.categoryId.name
            if (!categoryMap[catName]) {
              categoryMap[catName] = {
                amount: 0,
                emoji: tx.categoryId.emoji,
                color: tx.categoryId.color || '#94a3b8',
              }
            }
            categoryMap[catName].amount += amount
          }
        }
      }
    })

    return {
      avgExpenses: totalExpenses,
      avgInvestments: totalInvestments,
      accounts: Object.entries(accountMap).map(([name, amount]) => ({ name, amount, percent: (amount / totalExpenses) * 100 })),
      categories: Object.entries(categoryMap)
        .map(([name, data]) => ({ name, ...data, percent: (data.amount / totalExpenses) * 100 }))
        .sort((a, b) => b.amount - a.amount),
      displayRange: selectedMonthYear,
    }
  }, [transactions, selectedMonthYear, chartData])

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Month Average</p>
        <h2 className="text-xl font-black">{selectedData.displayRange}</h2>
        <div className="flex gap-4">
          <span className="text-sm font-bold text-orange-500">
            -₹{formatAmount(selectedData.avgExpenses)}
            {!selectedMonthYear && '/mth'}
          </span>
          <span className="text-sm font-bold text-blue-400">
            ₹{formatAmount(selectedData.avgInvestments)}
            {!selectedMonthYear && '/mth'}
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="monthYear" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} tickFormatter={(value) => `${value / 1000}K`} />
            <Bar name="expenses" dataKey="expenses" radius={[4, 4, 0, 0]} barSize={16} pointerEvents="none">
              {chartData.map((entry, index) => (
                <Cell key={`cell-exp-${index}`} fill="#f97316" />
              ))}
            </Bar>
            <Bar name="investments" dataKey="investments" radius={[4, 4, 0, 0]} barSize={16} pointerEvents="none">
              {chartData.map((entry, index) => (
                <Cell key={`cell-inv-${index}`} fill="#60a5fa" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-orange-500" />
          Expense
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-400" />
          Investment
        </div>
      </div>

      {/* Account Split */}
      {selectedData.accounts.length > 0 && (
        <div className="space-y-3">
          <div className="h-4 w-full flex rounded-full overflow-hidden bg-secondary/30">
            {selectedData.accounts.map((acc, i) => (
              <div key={acc.name} className={cn('h-full', ACCOUNT_COLORS[i % ACCOUNT_COLORS.length])} style={{ width: `${acc.percent}%` }} />
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            {selectedData.accounts.map((acc, i) => (
              <div key={acc.name} className="flex items-center gap-2">
                <div className={cn('h-2 w-2 rounded-full', ACCOUNT_COLORS[i % ACCOUNT_COLORS.length])} />
                <span className="text-xs font-bold">{acc.name}</span>
                <span className="text-xs font-bold text-muted-foreground">{Math.round(acc.percent)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Split */}
      {selectedData.categories.length > 0 && (
        <div className="space-y-4 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex gap-3 min-w-max">
            {selectedData.categories.map((cat) => (
              <div key={cat.name} className="bg-secondary/20 p-4 rounded-3xl flex flex-col gap-2 min-w-[120px]">
                <div className="h-10 w-16 rounded-2xl flex items-center justify-center text-xl" style={{ backgroundColor: cat.color + '20' }}>
                  {cat.emoji}
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase truncate w-24">{cat.name}</p>
                  <p className="text-sm font-black">{Math.round(cat.percent)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
