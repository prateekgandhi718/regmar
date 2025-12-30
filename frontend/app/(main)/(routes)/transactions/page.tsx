'use client'

import { useGetLinkedAccountsQuery } from '@/redux/api/linkedAccountsApi'
import { useGetTransactionsQuery, Transaction } from '@/redux/api/transactionsApi'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { format, parseISO, isSameDay, subDays, subMonths, isAfter } from 'date-fns'
import { useMemo, useState } from 'react'
import { TransactionItem } from './_components/tagged-transaction-item'
import { formatAmount } from '@/lib/utils'
import { QuickTagDrawer } from './_components/quick-tag-drawer'
import { TransactionDetailDrawer } from './_components/transaction-detail-drawer'
import { TransactionSummary } from './_components/transaction-summary'
import { SetupPrompts } from '@/components/setup-prompts'

const TransactionsPage = () => {
  const { data: linkedAccounts, isLoading: isLoadingLinked } = useGetLinkedAccountsQuery()
  const { data: transactions, isLoading: isLoadingTransactions } = useGetTransactionsQuery()

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [selectedMonthYear, setSelectedMonthYear] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<'30d' | '6m' | '12m' | 'all'>('all')
  const [isQuickTagOpen, setIsQuickTagOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const handleTagClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsQuickTagOpen(true)
  }

  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    if (transaction.categoryId) {
      setIsDetailOpen(true)
    } else {
      setIsQuickTagOpen(true)
    }
  }

  const isEmailLinked = linkedAccounts && linkedAccounts.some((acc) => acc.isActive)

  // Group transactions by Month/Year and then by Day
  const groupedTransactions = useMemo(() => {
    if (!transactions) return []

    let filteredTxs = [...transactions]

    // Date range filter
    const now = new Date()
    if (dateRange === '30d') {
      const cutoff = subDays(now, 30)
      filteredTxs = filteredTxs.filter((tx) => isAfter(parseISO(tx.newDate || tx.originalDate), cutoff))
    } else if (dateRange === '6m') {
      const cutoff = subMonths(now, 6)
      filteredTxs = filteredTxs.filter((tx) => isAfter(parseISO(tx.newDate || tx.originalDate), cutoff))
    } else if (dateRange === '12m') {
      const cutoff = subMonths(now, 12)
      filteredTxs = filteredTxs.filter((tx) => isAfter(parseISO(tx.newDate || tx.originalDate), cutoff))
    }

    // Month specific filter
    if (selectedMonthYear) {
      filteredTxs = filteredTxs.filter((tx) => format(parseISO(tx.newDate || tx.originalDate), 'MMM yyyy').toUpperCase() === selectedMonthYear)
    }

    // Sort transactions by effective date descending
    const sortedTxs = filteredTxs.sort((a, b) => {
      const dateA = new Date(a.newDate || a.originalDate).getTime()
      const dateB = new Date(b.newDate || b.originalDate).getTime()
      return dateB - dateA
    })

    interface DayGroup {
      date: Date
      total: number
      transactions: Transaction[]
    }

    interface MonthGroup {
      monthYear: string
      total: number
      days: DayGroup[]
    }

    const monthGroups: MonthGroup[] = []

    sortedTxs.forEach((tx) => {
      const date = parseISO(tx.newDate || tx.originalDate)
      const monthYear = format(date, 'MMM yyyy').toUpperCase()

      let monthGroup = monthGroups.find((g) => g.monthYear === monthYear)
      if (!monthGroup) {
        monthGroup = { monthYear, total: 0, days: [] }
        monthGroups.push(monthGroup)
      }

      const isExcludedFromDebitTotal = tx.categoryId && (tx.categoryId.name === 'Self Transfer' || tx.categoryId.name === 'Investment')

      if (tx.type === 'debit' && !isExcludedFromDebitTotal) {
        monthGroup.total += tx.newAmount || tx.originalAmount
      }

      let dayGroup = monthGroup.days.find((d) => isSameDay(d.date, date))
      if (!dayGroup) {
        dayGroup = { date, total: 0, transactions: [] }
        monthGroup.days.push(dayGroup)
      }

      if (tx.type === 'debit' && !isExcludedFromDebitTotal) {
        dayGroup.total += tx.newAmount || tx.originalAmount
      }
      dayGroup.transactions.push(tx)
    })

    return monthGroups
  }, [transactions, selectedMonthYear, dateRange])

  if (isLoadingLinked || isLoadingTransactions) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight">Transactions</h1>
        <div className="flex gap-2">
          {selectedMonthYear && (
            <Button variant="secondary" size="sm" className="rounded-xl font-bold bg-orange-100 text-orange-600 border-none h-9 px-4 hover:bg-orange-200" onClick={() => setSelectedMonthYear(null)}>
              {selectedMonthYear} <span className="ml-1 opacity-50">×</span>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm" className="rounded-xl font-bold bg-secondary/50 text-primary border-none h-9 px-4">
                {dateRange === '30d' ? 'Last 30 Days' : dateRange === '6m' ? 'Last 6 Months' : dateRange === '12m' ? 'Last 12 Months' : 'All Time'}
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl p-2 border-border/50 shadow-xl">
              <DropdownMenuItem className="rounded-xl font-bold cursor-pointer" onClick={() => setDateRange('30d')}>
                Last 30 Days
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl font-bold cursor-pointer" onClick={() => setDateRange('6m')}>
                Last 6 Months
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl font-bold cursor-pointer" onClick={() => setDateRange('12m')}>
                Last 12 Months
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl font-bold cursor-pointer" onClick={() => setDateRange('all')}>
                All Time
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isEmailLinked && transactions && <TransactionSummary transactions={transactions} selectedMonthYear={selectedMonthYear} dateRange={dateRange} />}

      <SetupPrompts />

      {isEmailLinked && groupedTransactions.length === 0 && (
        <div className="text-center py-32 space-y-6">
          <div className="bg-secondary/30 h-24 w-24 rounded-4xl flex items-center justify-center mx-auto border border-border/50">
            <span className="text-4xl">📊</span>
          </div>
          <div className="space-y-2">
            <p className="text-xl font-bold">No transactions yet</p>
            <p className="text-muted-foreground font-medium max-w-[200px] mx-auto text-sm">Sync your accounts to see your financial activity here.</p>
          </div>
        </div>
      )}

      {isEmailLinked &&
        groupedTransactions.map((group) => (
          <div key={group.monthYear} className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4 border-border/50">
              <h2 className="text-sm font-black text-muted-foreground uppercase tracking-widest">{group.monthYear}</h2>
              <span className="text-sm font-black tracking-tight text-primary/80">
                {group.total > 0 && '-'}₹{formatAmount(group.total)}
              </span>
            </div>

            {group.days.map((day) => (
              <div key={day.date.toISOString()} className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs font-bold text-muted-foreground">{format(day.date, 'EEEE, MMM d')}</span>
                  <span className="text-xs font-black text-muted-foreground">
                    {day.total > 0 && '-'}₹{day.total.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="space-y-3">
                  {day.transactions.map((tx: Transaction) => (
                    <div key={tx._id} className="group transition-all">
                      <TransactionItem transaction={tx} onClick={handleTransactionClick} onTagClick={handleTagClick} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}

      <QuickTagDrawer transaction={selectedTransaction} isOpen={isQuickTagOpen} onClose={() => setIsQuickTagOpen(false)} />

      <TransactionDetailDrawer transaction={selectedTransaction} isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} />
    </div>
  )
}

export default TransactionsPage
