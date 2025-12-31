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
import { 
  Loader2, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  TrendingUp, 
  Eye,
  EyeOff
} from 'lucide-react'
import { cn } from '@/lib/utils'

const formatCurrency = (value: number) => {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)}Cr`
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(2)}L`
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value)
}

const InvestmentsPage = () => {
  const { data: user, isLoading: isUserLoading } = useGetMeQuery()
  const { data: investments, isLoading: isInvestmentsLoading } = useGetMyInvestmentsQuery()
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation()
  const [syncInvestments, { isLoading: isSyncing }] = useSyncInvestmentsMutation()
  
  const [panInput, setPanInput] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' })
  const [hideValues, setHideValues] = useState(false)

  const currentPan = panInput ?? user?.pan ?? ''

  const handleSavePan = async () => {
    if (!currentPan || currentPan.length !== 10) return
    try {
      await updateProfile({ pan: currentPan.toUpperCase() }).unwrap()
      setPanInput(null)
    } catch (error) {
      console.error('Failed to save PAN:', error)
    }
  }

  const handleSync = async () => {
    setSyncStatus({ type: null, message: '' })
    try {
      const result = await syncInvestments().unwrap()
      setSyncStatus({ type: 'success', message: result.message })
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } }
      setSyncStatus({ type: 'error', message: err.data?.message || 'Failed to sync investments' })
    }
  }

  if (isUserLoading || isInvestmentsLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const hasPan = !!user?.pan
  const summary = investments?.summary
  const hasData = !!summary && summary.totalValue > 0

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-10 pb-24">
      {/* Header & Greeting */}
      <div className="flex items-center justify-between px-1 pt-4">
        <div className="space-y-1">
          <p className="text-sm font-black text-primary dark:text-white">
            Hi, {user?.name?.split(' ')[0] || 'User'}
          </p>
          
          {hasPan && hasData && (
            <div className="pt-6 space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total value</p>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black tracking-tighter text-primary dark:text-white">
                  {hideValues ? '••••••••' : formatCurrency(summary?.totalValue || 0)}
                </h1>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full text-muted-foreground"
                  onClick={() => setHideValues(!hideValues)}
                >
                  {hideValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {!hasPan ? (
        <div className="bg-card dark:bg-[#111111] border border-border dark:border-white/5 rounded-4xl p-8 space-y-8 shadow-sm relative overflow-hidden group">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-blue-50 dark:bg-blue-500/10 p-6 rounded-4xl">
                <ShieldCheck className="h-12 w-12 text-blue-500" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black tracking-tight text-primary dark:text-white">Unlock your Portfolio</h2>
              <p className="text-sm font-medium text-muted-foreground max-w-[300px] mx-auto leading-relaxed">
                We need your PAN number to securely unlock and parse your CAS statements from CDSL.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-secondary/30 dark:bg-white/5 rounded-3xl border border-border dark:border-white/5 overflow-hidden">
              <div className="flex items-center px-6 h-16">
                <Label className="w-24 text-sm font-bold text-muted-foreground uppercase tracking-wider">PAN Number</Label>
                <Input
                  placeholder="ABCDE1234F"
                  value={currentPan}
                  onChange={(e) => setPanInput(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="border-none focus-visible:ring-0 text-right bg-transparent flex-1 h-full font-black text-lg"
                />
              </div>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground text-center uppercase tracking-widest px-4 leading-relaxed">
              Your PAN is only used locally to decrypt your PDF statements.
            </p>
          </div>

          <Button
            className="w-full h-16 rounded-3xl font-black uppercase tracking-widest bg-linear-to-r from-blue-500 to-indigo-500 text-white shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
            onClick={handleSavePan}
            disabled={isUpdating || currentPan.length !== 10}
          >
            {isUpdating ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Save & Continue'}
          </Button>
        </div>
      ) : (
        <div className="space-y-10">
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-black tracking-tight text-primary dark:text-white">Your summary</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[10px] font-black uppercase tracking-widest h-8 rounded-xl bg-secondary/50 text-muted-foreground"
                onClick={handleSync}
                disabled={isSyncing}
              >
                {isSyncing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2" />}
                {hasData ? 'Sync' : 'Sync Now'}
              </Button>
            </div>

            {hasData ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="grid gap-4">
                  <SummaryCard 
                    title="Mutual Funds"
                    subtitle={`${investments.mutualFunds.length} Funds`}
                    value={hideValues ? '••••••' : formatCurrency(summary.mfFolioValue + summary.mfDematValue)}
                    icon={<Layers className="h-7 w-7 text-orange-500" />}
                    iconBgColor="bg-orange-50 dark:bg-orange-500/10"
                  />
                  <SummaryCard 
                    title="Stocks"
                    subtitle={`${investments.stocks.length} Stocks`}
                    value={hideValues ? '••••••' : formatCurrency(summary.equityValue)}
                    icon={<TrendingUp className="h-7 w-7 text-blue-500" />}
                    iconBgColor="bg-blue-50 dark:bg-blue-500/10"
                  />
                </div>

                {investments.historicalValuation && investments.historicalValuation.length > 0 && (
                  <HistoricalChart 
                    data={investments.historicalValuation} 
                    hideValues={hideValues} 
                  />
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center space-y-4 border-2 border-dashed border-border dark:border-white/5 rounded-4xl bg-secondary/5">
                <div className="bg-secondary/30 h-16 w-16 rounded-3xl flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black tracking-tight text-primary/50 dark:text-white/50 uppercase">No investment data</h3>
                  <p className="text-[10px] font-bold text-muted-foreground/50 max-w-[200px] mx-auto uppercase tracking-widest leading-relaxed">
                    Click &quot;Sync Now&quot; to fetch your latest statement from your connected email.
                  </p>
                </div>
              </div>
            )}
          </div>

          {syncStatus.type && (
            <div className={cn(
              "p-4 rounded-2xl flex items-center gap-3 border animate-in fade-in slide-in-from-top-2",
              syncStatus.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-500/5 dark:border-emerald-500/10 dark:text-emerald-400" : "bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-500/5 dark:border-rose-500/10 dark:text-rose-400"
            )}>
              {syncStatus.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <p className="text-[10px] font-black uppercase tracking-widest">{syncStatus.message}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default InvestmentsPage
