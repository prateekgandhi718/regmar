'use client'

import { useState } from 'react'
import { useGetMeQuery, useUpdateProfileMutation } from '@/redux/api/authApi'
import { useSyncInvestmentsMutation } from '@/redux/api/syncApi'
import { useGetMyInvestmentsQuery } from '@/redux/api/investmentsApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SummaryCard } from '@/components/investments/SummaryCard'
import { HistoricalChart } from '@/components/investments/HistoricalChart'
import { Loader2, ShieldCheck, RefreshCw, Layers, TrendingUp, Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { StatementPeriod } from './_components/StatementPeriod'
import { toast } from 'sonner'

const formatCurrency = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

const InvestmentsPage = () => {
  const router = useRouter()

  const { data: user, isLoading: isUserLoading } = useGetMeQuery()
  const { data: investments, isLoading: isInvestmentsLoading } = useGetMyInvestmentsQuery()

  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation()
  const [syncInvestments, { isLoading: isSyncing }] = useSyncInvestmentsMutation()

  const [panInput, setPanInput] = useState<string | null>(null)
  const [hideValues, setHideValues] = useState(false)

  if (isUserLoading || isInvestmentsLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const currentPan = panInput ?? user?.pan ?? ''
  const hasPan = !!user?.pan
  const summary = investments?.summary
  const hasData = !!summary && summary.totalValue > 0

  const handleSavePan = async () => {
    if (!currentPan || currentPan.length !== 10) return

    try {
      await updateProfile({ pan: currentPan.toUpperCase() }).unwrap()
      setPanInput(null)
    } catch (err) {
      console.error('PAN save failed', err)
    }
  }

  const handleSync = async () => {
    try {
      const result = await syncInvestments().unwrap()
      toast.success(result.message)
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to sync investments')
    }
  }

  return (
    <div className="p-6 space-y-8 pb-20">
      {/* Header — matches Transactions page */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tight">Investments</h1>
      </div>

      {hasPan && hasData && (
        <div className="space-y-4">
          <StatementPeriod period={investments?.statementPeriod} />

          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total value</p>

          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-black tracking-tighter text-primary dark:text-white">{hideValues ? '••••••••' : formatCurrency(summary.totalValue)}</h1>

            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground" onClick={() => setHideValues(!hideValues)}>
              {hideValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}

      {!hasPan ? (
        <div className="bg-card border border-border rounded-4xl p-8 space-y-8 shadow-sm">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-blue-50 p-6 rounded-4xl">
                <ShieldCheck className="h-12 w-12 text-blue-500" />
              </div>
            </div>

            <div>
              <h2 className="text-xl font-black tracking-tight">Unlock your Portfolio</h2>

              <p className="text-sm text-muted-foreground max-w-[300px] mx-auto">Enter PAN to decrypt and read your investment statements.</p>
            </div>
          </div>

          <div className="bg-secondary/30 rounded-3xl border border-border overflow-hidden">
            <div className="flex items-center px-6 h-16">
              <Label className="w-24 text-sm font-bold text-muted-foreground uppercase">PAN</Label>

              <Input
                placeholder="ABCDE1234F"
                value={currentPan}
                onChange={(e) => setPanInput(e.target.value.toUpperCase())}
                maxLength={10}
                className="border-none focus-visible:ring-0 text-right bg-transparent flex-1 h-full font-black text-lg"
              />
            </div>
          </div>

          <Button className="w-full h-16 rounded-3xl font-black uppercase bg-blue-600 text-white" onClick={handleSavePan} disabled={isUpdating || currentPan.length !== 10}>
            {isUpdating ? <Loader2 className="animate-spin" /> : 'Save & Continue'}
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black">Your summary</h2>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleSync}
              disabled={isSyncing}
              className="rounded-xl font-bold bg-secondary/50 text-primary border-none h-9 px-4"
            >
              {isSyncing ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw className="mr-2" />}
              Sync
            </Button>
          </div>

          {hasData ? (
            <>
              <SummaryCard
                title="Mutual Funds"
                subtitle={`${investments.mutualFunds.length} Funds`}
                value={hideValues ? '••••••' : formatCurrency(summary.mfFolioValue + summary.mfDematValue)}
                icon={<Layers className="h-7 w-7 text-orange-500" />}
                iconBgColor="bg-orange-50"
                onClick={() => router.push('/investments/mutual-funds')}
              />

              <SummaryCard
                title="Stocks"
                subtitle={`${investments.stocks.length} Stocks`}
                value={hideValues ? '••••••' : formatCurrency(summary.equityValue)}
                icon={<TrendingUp className="h-7 w-7 text-blue-500" />}
                iconBgColor="bg-blue-50"
                onClick={() => router.push('/investments/stocks')}
              />

              {investments.historicalValuation?.length > 0 && <HistoricalChart data={investments.historicalValuation} />}
            </>
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-border rounded-4xl">
              <TrendingUp className="mx-auto mb-4 opacity-40" />
              <p>No investment data yet — sync to begin.</p>
            </div>
          )}

        </div>
      )}
    </div>
  )
}

export default InvestmentsPage
