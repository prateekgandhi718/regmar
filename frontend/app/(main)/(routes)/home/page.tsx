'use client'

import { useSyncTransactionsMutation } from '@/redux/api/syncApi'
import { useGetAccountsQuery } from '@/redux/api/accountsApi'
import { useGetLinkedAccountsQuery } from '@/redux/api/linkedAccountsApi'
import { useGetTransactionsQuery } from '@/redux/api/transactionsApi'
import { RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { HomeSummary } from './_components/home-summary'
import { SetupPrompts } from '@/components/setup-prompts'

const HomePage = () => {
  const [sync, { isLoading: isSyncing }] = useSyncTransactionsMutation()
  const { data: accounts, isLoading: isLoadingAccounts } = useGetAccountsQuery()
  const { data: linkedAccounts, isLoading: isLoadingLinked } = useGetLinkedAccountsQuery()
  const { data: transactions, isLoading: isLoadingTransactions } = useGetTransactionsQuery()

  const [result, setResult] = useState<{ count: number; success: boolean } | null>(null)

  const isEmailLinked = useMemo(() => linkedAccounts && linkedAccounts.some((acc) => acc.isActive && acc.provider === 'gmail'), [linkedAccounts])

  const hasAccountWithDomain = useMemo(() => accounts && accounts.some((acc) => acc.domainIds && acc.domainIds.length > 0), [accounts])

  const handleSync = async () => {
    if (!isEmailLinked || !hasAccountWithDomain) return

    try {
      const data = await sync().unwrap()
      setResult({ count: data.transactionsSynced, success: true })
      setTimeout(() => setResult(null), 5000)
    } catch (error) {
      console.error('Sync failed:', error)
      setResult({ count: 0, success: false })
      setTimeout(() => setResult(null), 5000)
    }
  }

  const isLoading = isLoadingAccounts || isLoadingLinked || isLoadingTransactions

  if (isLoading) {
    return (
      <div className="p-6 space-y-8 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-12 pb-24 max-w-2xl mx-auto">
      {transactions && <HomeSummary transactions={transactions} />}

      <SetupPrompts />

      <div className="space-y-6">
        <h2 className="text-xl font-black tracking-tight px-1">Cash Flow</h2>

        <div className="bg-card dark:bg-[#111111] border border-border dark:border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">December 2025</h3>
            <Button variant="ghost" size="sm" className="text-xs font-bold rounded-xl" asChild>
              <Link href="/transactions">View All</Link>
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Automatic Sync Status</p>
              <p className={cn('text-xs font-black uppercase tracking-widest', isEmailLinked ? 'text-emerald-500' : 'text-rose-500')}>{isEmailLinked ? 'Active' : 'Not Linked'}</p>
            </div>

            <Button
              onClick={handleSync}
              disabled={isSyncing || !isEmailLinked || !hasAccountWithDomain}
              className="w-full h-12 rounded-2xl bg-secondary/50 dark:bg-white/5 hover:bg-secondary/80 dark:hover:bg-white/10 text-primary dark:text-white font-bold border border-border dark:border-white/5 transition-all disabled:opacity-50"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" /> Sync Transactions
                </>
              )}
            </Button>

            {result && (
              <p className={cn('text-center text-xs font-bold animate-in fade-in slide-in-from-top-1', result.success ? 'text-emerald-500' : 'text-rose-500')}>
                {result.success ? `${result.count} transactions synced` : 'Sync failed'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
