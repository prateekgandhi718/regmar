'use client'

import { useGetMyInvestmentsQuery, useOptimizeUltimatePortfolioMutation } from '@/redux/api/investmentsApi'
import { Loader2, ArrowLeft, Zap } from 'lucide-react'
import { InvestmentCard, InvestmentCardRow } from '../_components/InvestmentCard'
import { StatementPeriod } from '../_components/StatementPeriod'
import { formatCurrency } from '@/lib/utils'
import { getStockLogo } from '@/lib/logos'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export default function StocksPage() {
  const router = useRouter()
  const { data, isLoading } = useGetMyInvestmentsQuery()
  const [optimize, { data: optimizedData, isLoading: isOptimizing }] = useOptimizeUltimatePortfolioMutation()

  const handleOptimize = async () => {
    if (!data?.stocks) return
    const tickers = data.stocks.filter(s => !s.isEtf).map(s => s.ticker)
    if (tickers.length === 0) {
      // Optional: Add a toast notification here saying no stocks found to optimize
      return
    }
    await optimize({ tickers }).unwrap()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!data?.stocks?.length) return null

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 pb-24">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-secondary/40 text-muted-foreground"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="space-y-1">
              <h1 className="text-xl font-black tracking-tight text-primary dark:text-white">
                Stocks
              </h1>
              <StatementPeriod period={data.statementPeriod} />
            </div>
          </div>

        </div>
        <div className="flex items-center justify-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-[10px] font-black uppercase tracking-widest h-8 rounded-xl bg-secondary/50 text-muted-foreground"
            onClick={handleOptimize}
            disabled={isOptimizing}
          >
            {isOptimizing ? (
              <Loader2 className="h-3 w-3 animate-spin mr-2" />
            ) : (
              <Zap className="h-3 w-3 mr-2 fill-current" />
            )}
            {optimizedData ? 'Re optimize' : 'Optimize Portfolio'}
          </Button>

        </div>

        {optimizedData?.metrics && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="rounded-2xl bg-card dark:bg-[#111111] border border-border dark:border-white/5 p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Expected Annual Return
              </span>
              <span className="mt-1 text-base font-black text-primary dark:text-white">
                {(optimizedData.metrics.expectedAnnualReturn * 100).toFixed(2)}%
              </span>
            </Card>
            <Card className="rounded-2xl bg-card dark:bg-[#111111] border border-border dark:border-white/5 p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Annual Volatility
              </span>
              <span className="mt-1 text-base font-black text-primary dark:text-white">
                {(optimizedData.metrics.annualVolatility * 100).toFixed(2)}%
              </span>
            </Card>
            <Card className="rounded-2xl bg-card dark:bg-[#111111] border border-border dark:border-white/5 p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Sharpe Ratio
              </span>
              <span className="mt-1 text-base font-black text-primary dark:text-white">
                {optimizedData.metrics.sharpeRatio.toFixed(2)}
              </span>
            </Card>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {data.stocks.map((stock) => {
          const optimizedPerc = optimizedData?.allocations[stock.ticker]
          
          const rows: InvestmentCardRow[] = [
            { label: 'Quantity', value: stock.freeBalance.toString() },
            { label: 'Market Price', value: formatCurrency(stock.marketPrice) },
            {
              label: 'Current Value',
              value: formatCurrency(stock.currentValue),
              highlight: true,
            },
          ]

          if (!stock.isEtf && stock.currentPercentage > 0) {
            rows.push({
              label: 'Allocation',
              value: `${stock.currentPercentage.toFixed(2)}%`,
              // Pass the optimized percentage here if it exists
              optimizedValue: optimizedPerc !== undefined ? `${optimizedPerc.toFixed(2)}%` : undefined
            })
          }

          rows.push({ label: 'ISIN', value: stock.isin })

          return (
            <InvestmentCard
              key={stock.isin}
              title={stock.name || stock.isin}
              logoUrl={getStockLogo(stock.isin)}
              logoAlt={stock.name}
              rows={rows}
            />
          )
        })}
      </div>
    </div>
  )
}