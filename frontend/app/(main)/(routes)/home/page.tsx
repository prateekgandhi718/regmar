'use client'

import { useSyncTransactionsMutation } from '@/redux/api/syncApi'
import { useGetAccountsQuery } from '@/redux/api/accountsApi'
import { useGetLinkedAccountsQuery } from '@/redux/api/linkedAccountsApi'
import { useGetTransactionsQuery } from '@/redux/api/transactionsApi'
import { RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMemo } from 'react'
import { HomeSummary } from './_components/home-summary'
import { SetupPrompts } from '@/components/setup-prompts'
import { toast } from 'sonner'

const HomePage = () => {
  const [sync, { isLoading: isSyncing }] = useSyncTransactionsMutation()
  const { data: accounts, isLoading: isLoadingAccounts } = useGetAccountsQuery()
  const { data: linkedAccounts, isLoading: isLoadingLinked } = useGetLinkedAccountsQuery()
  const { data: transactions, isLoading: isLoadingTransactions } = useGetTransactionsQuery()

  const isEmailLinked = useMemo(() => linkedAccounts && linkedAccounts.some((acc) => acc.isActive && acc.provider === 'gmail'), [linkedAccounts])

  const hasAccountWithDomain = useMemo(() => accounts && accounts.some((acc) => acc.domainIds && acc.domainIds.length > 0), [accounts])

  const handleSync = async () => {
    if (!isEmailLinked || !hasAccountWithDomain) return

    try {
      const data = await sync().unwrap()
      toast.success(`${data.transactionsSynced} transactions synced`)
    } catch (error: any) {
      console.error('Sync failed:', error)
      toast.error(error?.data?.message || 'Sync failed.')
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
      {transactions && (
        <HomeSummary
          transactions={transactions}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing || !isEmailLinked || !hasAccountWithDomain}
              className="rounded-xl font-bold bg-secondary/50 text-primary border-none h-9 px-4"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sync
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" /> Sync
                </>
              )}
            </Button>
          }
        />
      )}

      <SetupPrompts />
    </div>
  )
}

export default HomePage
